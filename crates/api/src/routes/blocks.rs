use super::{error_response, ApiResponse};
use crate::AppState;
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use gold_core::{BlockDetail, BlockSummary};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ListBlocksQuery {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Serialize)]
pub struct ListBlocksResponse {
    pub blocks: Vec<BlockSummary>,
    pub total: u64,
    pub limit: usize,
    pub offset: usize,
}

pub async fn list_blocks(
    Extension(state): Extension<AppState>,
    Query(query): Query<ListBlocksQuery>,
) -> Json<ApiResponse<ListBlocksResponse>> {
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    let height = state.consensus.height();
    let blocks = state.consensus.recent_blocks(limit + offset);

    let block_summaries: Vec<BlockSummary> = blocks
        .into_iter()
        .skip(offset)
        .take(limit)
        .map(|b| BlockSummary::from(&b))
        .collect();

    Json(ApiResponse::success(ListBlocksResponse {
        blocks: block_summaries,
        total: height + 1,
        limit,
        offset,
    }))
}

pub async fn get_latest_block(
    Extension(state): Extension<AppState>,
) -> Json<ApiResponse<BlockDetail>> {
    let block = state.consensus.latest_block();
    Json(ApiResponse::success(BlockDetail::from(&block)))
}

pub async fn get_block_by_height(
    Extension(state): Extension<AppState>,
    Path(height): Path<u64>,
) -> impl IntoResponse {
    match state.consensus.get_block(height) {
        Some(block) => Json(ApiResponse::success(BlockDetail::from(&block))).into_response(),
        None => error_response(StatusCode::NOT_FOUND, "Block not found").into_response(),
    }
}

pub async fn get_block_by_hash(
    Extension(state): Extension<AppState>,
    Path(hash): Path<String>,
) -> impl IntoResponse {
    let hash_bytes = match hex::decode(&hash) {
        Ok(bytes) if bytes.len() == 32 => {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&bytes);
            arr
        }
        _ => return error_response(StatusCode::BAD_REQUEST, "Invalid hash format").into_response(),
    };

    // Search through recent blocks
    let height = state.consensus.height();
    for h in (0..=height).rev() {
        if let Some(block) = state.consensus.get_block(h) {
            if block.hash == hash_bytes {
                return Json(ApiResponse::success(BlockDetail::from(&block))).into_response();
            }
        }
    }

    error_response(StatusCode::NOT_FOUND, "Block not found").into_response()
}
