use crate::routes;
use crate::websocket::WebSocketState;
use axum::{
    extract::Extension,
    routing::{get, post},
    Router,
};
use gold_consensus::PbftConsensus;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

/// API server configuration
#[derive(Debug, Clone)]
pub struct ApiConfig {
    pub host: String,
    pub port: u16,
    pub enable_cors: bool,
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            host: "0.0.0.0".to_string(),
            port: 3001,
            enable_cors: true,
        }
    }
}

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    pub consensus: Arc<PbftConsensus>,
    pub ws_state: Arc<WebSocketState>,
}

/// API server
pub struct ApiServer {
    config: ApiConfig,
    state: AppState,
}

impl ApiServer {
    /// Create a new API server
    pub fn new(config: ApiConfig, consensus: Arc<PbftConsensus>) -> Self {
        let ws_state = Arc::new(WebSocketState::new());

        Self {
            config,
            state: AppState { consensus, ws_state },
        }
    }

    /// Build the router
    pub fn router(&self) -> Router {
        let mut router = Router::new()
            // Health check
            .route("/health", get(routes::health::health_check))
            // System metrics
            .route("/api/v1/system/metrics", get(routes::system::get_metrics))
            .route("/api/v1/system/status", get(routes::system::get_status))
            // Blocks
            .route("/api/v1/blocks", get(routes::blocks::list_blocks))
            .route("/api/v1/blocks/latest", get(routes::blocks::get_latest_block))
            .route("/api/v1/blocks/:height", get(routes::blocks::get_block_by_height))
            .route("/api/v1/blocks/hash/:hash", get(routes::blocks::get_block_by_hash))
            // Transactions
            .route("/api/v1/transactions", get(routes::transactions::list_transactions))
            .route("/api/v1/transactions", post(routes::transactions::submit_transaction))
            .route("/api/v1/transactions/:hash", get(routes::transactions::get_transaction))
            // Certificates
            .route("/api/v1/certificates", get(routes::certificates::list_certificates))
            .route("/api/v1/certificates", post(routes::certificates::register_certificate))
            .route("/api/v1/certificates/:id", get(routes::certificates::get_certificate))
            // Tokens
            .route("/api/v1/tokens/mint", post(routes::tokens::mint_tokens))
            .route("/api/v1/tokens/transfer", post(routes::tokens::transfer_tokens))
            .route("/api/v1/tokens/burn", post(routes::tokens::burn_tokens))
            .route("/api/v1/tokens/supply", get(routes::tokens::get_supply))
            // Wallet
            .route("/api/v1/wallet/:address/balance", get(routes::wallet::get_balance))
            .route("/api/v1/wallet/:address/transactions", get(routes::wallet::get_transactions))
            .route("/api/v1/wallet/:address/certificates", get(routes::wallet::get_certificates))
            .route("/api/v1/wallet/transfer", post(routes::wallet::transfer))
            // Admin
            .route("/api/v1/admin/keypair", post(routes::admin::generate_keypair))
            // WebSocket
            .route("/ws", get(crate::websocket::ws_handler))
            .layer(Extension(self.state.clone()))
            .layer(TraceLayer::new_for_http());

        if self.config.enable_cors {
            router = router.layer(
                CorsLayer::new()
                    .allow_origin(Any)
                    .allow_methods(Any)
                    .allow_headers(Any),
            );
        }

        router
    }

    /// Start the server
    pub async fn start(self) -> Result<(), std::io::Error> {
        let addr: SocketAddr = format!("{}:{}", self.config.host, self.config.port)
            .parse()
            .expect("Invalid address");

        let router = self.router();

        info!("API server starting on {}", addr);

        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, router).await?;

        Ok(())
    }

    /// Get WebSocket state for broadcasting
    pub fn ws_state(&self) -> Arc<WebSocketState> {
        self.state.ws_state.clone()
    }
}
