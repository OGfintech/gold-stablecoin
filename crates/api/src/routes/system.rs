use super::ApiResponse;
use crate::AppState;
use axum::{extract::Extension, Json};
use gold_core::TOKEN_BASE;
use serde::Serialize;

#[derive(Serialize)]
pub struct MetricsResponse {
    pub blocks_produced: u64,
    pub total_transactions: u64,
    pub current_tps: f64,
    pub average_block_time_ms: f64,
    pub mempool_size: usize,
    pub total_supply: String,
    pub total_supply_formatted: String,
}

#[derive(Serialize)]
pub struct StatusResponse {
    pub node_id: String,
    pub version: String,
    pub height: u64,
    pub latest_block_hash: String,
    pub total_accounts: usize,
    pub total_certificates: usize,
    pub uptime_seconds: u64,
}

pub async fn get_metrics(Extension(state): Extension<AppState>) -> Json<ApiResponse<MetricsResponse>> {
    let metrics = state.consensus.metrics();
    let mempool_size = state.consensus.mempool().size();
    let total_supply = state.consensus.state().total_supply();

    let formatted = format!(
        "{:.6}",
        total_supply as f64 / TOKEN_BASE as f64
    );

    Json(ApiResponse::success(MetricsResponse {
        blocks_produced: metrics.blocks_produced,
        total_transactions: metrics.total_transactions,
        current_tps: metrics.current_tps,
        average_block_time_ms: metrics.average_block_time_ms,
        mempool_size,
        total_supply: total_supply.to_string(),
        total_supply_formatted: formatted,
    }))
}

pub async fn get_status(Extension(state): Extension<AppState>) -> Json<ApiResponse<StatusResponse>> {
    let height = state.consensus.height();
    let latest_block = state.consensus.latest_block();
    let cert_stats = state.consensus.state().certificate_stats();

    Json(ApiResponse::success(StatusResponse {
        node_id: hex::encode([0u8; 8]), // Placeholder
        version: "0.1.0".to_string(),
        height,
        latest_block_hash: hex::encode(latest_block.hash),
        total_accounts: state.consensus.state().account_count(),
        total_certificates: cert_stats.total_certificates as usize,
        uptime_seconds: 0, // Would track actual uptime
    }))
}
