use gold_api::{websocket::MetricsUpdate, ApiConfig, ApiServer};
use gold_consensus::{ConsensusConfig, PbftConsensus};
use gold_crypto::Keypair;
use gold_mempool::{Mempool, MempoolConfig};
use gold_state::StateManager;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(false)
        .with_thread_ids(false)
        .with_file(false)
        .with_line_number(false)
        .finish();

    tracing::subscriber::set_global_default(subscriber)?;

    info!("╔══════════════════════════════════════════════════════════╗");
    info!("║           Gold-Backed Stablecoin Blockchain              ║");
    info!("║                    Version 0.1.0                         ║");
    info!("╚══════════════════════════════════════════════════════════╝");

    // Generate or load admin keypair
    let admin_keypair = Keypair::generate();
    info!("Admin address: {}", admin_keypair.address());
    info!("Admin public key: {}", admin_keypair.public_hex());

    // Initialize state manager
    let state = Arc::new(StateManager::new());
    state.initialize_genesis(vec![admin_keypair.address()]);

    // Give admin some initial balance for testing
    state.credit(&admin_keypair.address(), 1_000_000_000_000_000_000_000u128); // 1000 tokens

    info!("State manager initialized");

    // Initialize mempool
    let mempool_config = MempoolConfig {
        max_size: 100_000,
        batch_size: 50_000,
        expiration_secs: 3600,
    };
    let mempool = Arc::new(Mempool::new(mempool_config, state.clone()));
    info!("Mempool initialized (max size: 100,000)");

    // Initialize consensus
    let consensus_config = ConsensusConfig {
        block_interval: Duration::from_millis(100), // 100ms for high TPS
        min_transactions: 0, // Produce empty blocks for testing
        max_transactions: 50_000,
        is_leader: true,
    };
    let consensus = Arc::new(PbftConsensus::new(
        consensus_config,
        state.clone(),
        mempool.clone(),
        admin_keypair,
    ));
    info!("Consensus engine initialized (PBFT single-node mode)");

    // Create channel for block notifications
    let (block_tx, mut block_rx) = mpsc::channel(100);

    // Initialize API server
    let api_config = ApiConfig {
        host: "0.0.0.0".to_string(),
        port: 3001,
        enable_cors: true,
    };
    let api_server = ApiServer::new(api_config, consensus.clone());
    let ws_state = api_server.ws_state();
    info!("API server configured on http://0.0.0.0:3001");

    // Spawn block producer
    let consensus_clone = consensus.clone();
    tokio::spawn(async move {
        consensus_clone.start(block_tx).await;
    });

    // Spawn block broadcaster
    let ws_state_clone = ws_state.clone();
    tokio::spawn(async move {
        while let Some(block) = block_rx.recv().await {
            ws_state_clone.broadcast_block(&block);
        }
    });

    // Spawn metrics broadcaster
    let consensus_for_metrics = consensus.clone();
    let ws_state_for_metrics = ws_state;
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        loop {
            interval.tick().await;
            let metrics = consensus_for_metrics.metrics();
            let chain_state = consensus_for_metrics.state().chain_state();

            ws_state_for_metrics.broadcast_metrics(MetricsUpdate {
                height: chain_state.height,
                tps: metrics.current_tps,
                mempool_size: consensus_for_metrics.mempool().size(),
                total_supply: chain_state.total_supply.to_string(),
            });
        }
    });

    info!("═══════════════════════════════════════════════════════════");
    info!("Node started successfully!");
    info!("═══════════════════════════════════════════════════════════");
    info!("");
    info!("API Endpoints:");
    info!("  REST API:    http://localhost:3001/api/v1");
    info!("  WebSocket:   ws://localhost:3001/ws");
    info!("  Health:      http://localhost:3001/health");
    info!("");
    info!("Quick Start:");
    info!("  1. Start the block explorer:  cd explorer && npm run dev");
    info!("  2. Start the wallet:          cd wallet && npm run dev");
    info!("  3. Open http://localhost:3000 in your browser");
    info!("");
    info!("Admin credentials for testing:");
    info!("  Address:    {}", consensus.state().chain_state().height);
    info!("");
    info!("Press Ctrl+C to stop the node");
    info!("═══════════════════════════════════════════════════════════");

    // Start API server (blocking)
    api_server.start().await?;

    Ok(())
}
