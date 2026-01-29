use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Extension,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use gold_core::{Block, BlockSummary, TransactionSummary};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{debug, error, info};

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WsMessage {
    /// New block produced
    NewBlock(BlockSummary),
    /// New transaction in mempool
    NewTransaction(TransactionSummary),
    /// Metrics update
    Metrics(MetricsUpdate),
    /// Subscription confirmation
    Subscribed { channel: String },
    /// Error message
    Error { message: String },
    /// Ping/Pong for keepalive
    Ping,
    Pong,
}

/// Subscribe request from client
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "action")]
pub enum WsRequest {
    Subscribe { channels: Vec<String> },
    Unsubscribe { channels: Vec<String> },
    Ping,
}

/// Metrics update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsUpdate {
    pub height: u64,
    pub tps: f64,
    pub mempool_size: usize,
    pub total_supply: String,
}

/// WebSocket state for broadcasting
pub struct WebSocketState {
    /// Broadcast channel for new blocks
    block_tx: broadcast::Sender<WsMessage>,
    /// Broadcast channel for transactions
    tx_tx: broadcast::Sender<WsMessage>,
    /// Broadcast channel for metrics
    metrics_tx: broadcast::Sender<WsMessage>,
    /// Connected clients count
    clients: Arc<RwLock<usize>>,
}

impl WebSocketState {
    pub fn new() -> Self {
        let (block_tx, _) = broadcast::channel(1000);
        let (tx_tx, _) = broadcast::channel(1000);
        let (metrics_tx, _) = broadcast::channel(100);

        Self {
            block_tx,
            tx_tx,
            metrics_tx,
            clients: Arc::new(RwLock::new(0)),
        }
    }

    /// Broadcast a new block
    pub fn broadcast_block(&self, block: &Block) {
        let summary = BlockSummary::from(block);
        let msg = WsMessage::NewBlock(summary);
        let _ = self.block_tx.send(msg);
    }

    /// Broadcast metrics update
    pub fn broadcast_metrics(&self, update: MetricsUpdate) {
        let msg = WsMessage::Metrics(update);
        let _ = self.metrics_tx.send(msg);
    }

    /// Get number of connected clients
    pub fn client_count(&self) -> usize {
        *self.clients.read()
    }

    fn subscribe_blocks(&self) -> broadcast::Receiver<WsMessage> {
        self.block_tx.subscribe()
    }

    fn subscribe_transactions(&self) -> broadcast::Receiver<WsMessage> {
        self.tx_tx.subscribe()
    }

    fn subscribe_metrics(&self) -> broadcast::Receiver<WsMessage> {
        self.metrics_tx.subscribe()
    }
}

impl Default for WebSocketState {
    fn default() -> Self {
        Self::new()
    }
}

use crate::AppState;

/// WebSocket upgrade handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(state): Extension<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state.ws_state))
}

/// Handle WebSocket connection
async fn handle_socket(socket: WebSocket, ws_state: Arc<WebSocketState>) {
    let (mut sender, mut receiver) = socket.split();

    // Increment client count
    {
        let mut count = ws_state.clients.write();
        *count += 1;
        info!("WebSocket client connected. Total: {}", *count);
    }

    // Track subscriptions
    let mut subscriptions: HashMap<String, bool> = HashMap::new();

    // Subscribe to channels
    let mut block_rx = ws_state.subscribe_blocks();
    let mut metrics_rx = ws_state.subscribe_metrics();

    // Default subscriptions
    subscriptions.insert("blocks".to_string(), true);
    subscriptions.insert("metrics".to_string(), true);

    // Send subscription confirmations
    let _ = sender
        .send(Message::Text(
            serde_json::to_string(&WsMessage::Subscribed {
                channel: "blocks".to_string(),
            })
            .unwrap(),
        ))
        .await;

    let _ = sender
        .send(Message::Text(
            serde_json::to_string(&WsMessage::Subscribed {
                channel: "metrics".to_string(),
            })
            .unwrap(),
        ))
        .await;

    loop {
        tokio::select! {
            // Handle incoming messages
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(request) = serde_json::from_str::<WsRequest>(&text) {
                            match request {
                                WsRequest::Subscribe { channels } => {
                                    for channel in channels {
                                        subscriptions.insert(channel.clone(), true);
                                        let _ = sender
                                            .send(Message::Text(
                                                serde_json::to_string(&WsMessage::Subscribed {
                                                    channel,
                                                })
                                                .unwrap(),
                                            ))
                                            .await;
                                    }
                                }
                                WsRequest::Unsubscribe { channels } => {
                                    for channel in channels {
                                        subscriptions.remove(&channel);
                                    }
                                }
                                WsRequest::Ping => {
                                    let _ = sender
                                        .send(Message::Text(
                                            serde_json::to_string(&WsMessage::Pong).unwrap(),
                                        ))
                                        .await;
                                }
                            }
                        }
                    }
                    Some(Ok(Message::Ping(data))) => {
                        let _ = sender.send(Message::Pong(data)).await;
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        break;
                    }
                    Some(Err(e)) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }

            // Forward block messages
            msg = block_rx.recv() => {
                if let Ok(msg) = msg {
                    if subscriptions.get("blocks").copied().unwrap_or(false) {
                        if let Ok(json) = serde_json::to_string(&msg) {
                            if sender.send(Message::Text(json)).await.is_err() {
                                break;
                            }
                        }
                    }
                }
            }

            // Forward metrics messages
            msg = metrics_rx.recv() => {
                if let Ok(msg) = msg {
                    if subscriptions.get("metrics").copied().unwrap_or(false) {
                        if let Ok(json) = serde_json::to_string(&msg) {
                            if sender.send(Message::Text(json)).await.is_err() {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // Decrement client count
    {
        let mut count = ws_state.clients.write();
        *count = count.saturating_sub(1);
        info!("WebSocket client disconnected. Total: {}", *count);
    }
}
