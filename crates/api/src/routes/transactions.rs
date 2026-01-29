use super::{error_response, ApiResponse};
use crate::AppState;
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use gold_core::{
    Address, Transaction, TransactionPayload, TransactionSummary, TransferPayload,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ListTransactionsQuery {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub address: Option<String>,
}

#[derive(Serialize)]
pub struct ListTransactionsResponse {
    pub transactions: Vec<TransactionSummary>,
    pub total: usize,
    pub limit: usize,
    pub offset: usize,
}

#[derive(Deserialize)]
pub struct SubmitTransactionRequest {
    pub from: String,
    pub public_key: String,
    pub nonce: u64,
    pub payload: TransactionPayloadRequest,
    pub signature: String,
}

#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum TransactionPayloadRequest {
    Transfer {
        to: String,
        amount: String,
        memo: Option<String>,
    },
}

#[derive(Serialize)]
pub struct SubmitTransactionResponse {
    pub tx_hash: String,
    pub status: String,
}

pub async fn list_transactions(
    Extension(state): Extension<AppState>,
    Query(query): Query<ListTransactionsQuery>,
) -> Json<ApiResponse<ListTransactionsResponse>> {
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    // Get transactions from recent blocks
    let mut all_txs: Vec<TransactionSummary> = Vec::new();
    let height = state.consensus.height();

    for h in (0..=height).rev() {
        if let Some(block) = state.consensus.get_block(h) {
            for tx in &block.transactions {
                let mut summary = TransactionSummary::from(tx);
                summary.block_height = Some(h);
                summary.success = Some(true);

                // Filter by address if specified
                if let Some(addr_str) = &query.address {
                    if let Ok(addr) = Address::from_hex(addr_str) {
                        if tx.from != addr && tx.to() != Some(addr) {
                            continue;
                        }
                    }
                }

                all_txs.push(summary);
            }
        }

        if all_txs.len() >= limit + offset {
            break;
        }
    }

    let transactions: Vec<TransactionSummary> = all_txs
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();

    Json(ApiResponse::success(ListTransactionsResponse {
        total: transactions.len(),
        transactions,
        limit,
        offset,
    }))
}

pub async fn submit_transaction(
    Extension(state): Extension<AppState>,
    Json(req): Json<SubmitTransactionRequest>,
) -> impl IntoResponse {
    // Parse from address
    let from = match Address::from_hex(&req.from) {
        Ok(addr) => addr,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid from address").into_response(),
    };

    // Parse public key
    let public_key: [u8; 32] = match hex::decode(&req.public_key) {
        Ok(bytes) if bytes.len() == 32 => {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&bytes);
            arr
        }
        _ => return error_response(StatusCode::BAD_REQUEST, "Invalid public key").into_response(),
    };

    // Parse signature
    let signature: [u8; 64] = match hex::decode(&req.signature) {
        Ok(bytes) if bytes.len() == 64 => {
            let mut arr = [0u8; 64];
            arr.copy_from_slice(&bytes);
            arr
        }
        _ => return error_response(StatusCode::BAD_REQUEST, "Invalid signature").into_response(),
    };

    // Build payload
    let payload = match req.payload {
        TransactionPayloadRequest::Transfer { to, amount, memo } => {
            let to_addr = match Address::from_hex(&to) {
                Ok(addr) => addr,
                Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid to address").into_response(),
            };

            let amount_value: u128 = match amount.parse() {
                Ok(v) => v,
                Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid amount").into_response(),
            };

            TransactionPayload::Transfer(TransferPayload {
                to: to_addr,
                amount: amount_value,
                memo,
            })
        }
    };

    // Create transaction
    let mut tx = Transaction::new(from, public_key, req.nonce, payload);
    tx.set_signature(signature);

    // Submit to mempool
    match state.consensus.submit_transaction(tx) {
        Ok(hash) => Json(ApiResponse::success(SubmitTransactionResponse {
            tx_hash: hex::encode(hash),
            status: "pending".to_string(),
        }))
        .into_response(),
        Err(e) => error_response(StatusCode::BAD_REQUEST, &e.to_string()).into_response(),
    }
}

pub async fn get_transaction(
    Extension(state): Extension<AppState>,
    Path(hash): Path<String>,
) -> impl IntoResponse {
    let hash_bytes: [u8; 32] = match hex::decode(&hash) {
        Ok(bytes) if bytes.len() == 32 => {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&bytes);
            arr
        }
        _ => return error_response(StatusCode::BAD_REQUEST, "Invalid hash format").into_response(),
    };

    // Check mempool first
    if let Some(tx) = state.consensus.mempool().get_transaction(&hash_bytes) {
        let mut summary = TransactionSummary::from(&tx);
        summary.success = None; // Pending
        return Json(ApiResponse::success(summary)).into_response();
    }

    // Search in blocks
    let height = state.consensus.height();
    for h in (0..=height).rev() {
        if let Some(block) = state.consensus.get_block(h) {
            for tx in &block.transactions {
                if tx.hash == hash_bytes {
                    let mut summary = TransactionSummary::from(tx);
                    summary.block_height = Some(h);
                    summary.success = Some(true);
                    return Json(ApiResponse::success(summary)).into_response();
                }
            }
        }
    }

    error_response(StatusCode::NOT_FOUND, "Transaction not found").into_response()
}
