use super::{error_response, ApiResponse};
use crate::AppState;
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use gold_core::{
    Address, CertificateSummary, Transaction, TransactionPayload, TransactionSummary,
    TransferPayload, TOKEN_BASE,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct WalletBalanceResponse {
    pub address: String,
    pub balance: String,
    pub balance_formatted: String,
    pub nonce: u64,
    pub is_admin: bool,
}

#[derive(Deserialize)]
pub struct WalletTransactionsQuery {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Serialize)]
pub struct WalletTransactionsResponse {
    pub transactions: Vec<TransactionSummary>,
    pub total: usize,
}

#[derive(Serialize)]
pub struct WalletCertificatesResponse {
    pub certificates: Vec<CertificateSummary>,
    pub total_gold_oz: f64,
    pub total_gold_grams: f64,
}

#[derive(Deserialize)]
pub struct WalletTransferRequest {
    pub from: String,
    pub public_key: String,
    pub nonce: u64,
    pub to: String,
    pub amount: String,
    pub memo: Option<String>,
    pub signature: String,
}

#[derive(Serialize)]
pub struct WalletTransferResponse {
    pub tx_hash: String,
    pub status: String,
    pub from: String,
    pub to: String,
    pub amount: String,
}

pub async fn get_balance(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> impl IntoResponse {
    let addr = match Address::from_hex(&address) {
        Ok(a) => a,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid address").into_response(),
    };

    let balance = state.consensus.state().get_balance(&addr);
    let nonce = state.consensus.state().get_nonce(&addr);
    let is_admin = state.consensus.state().is_admin(&addr);

    let formatted = format!("{:.6}", balance as f64 / TOKEN_BASE as f64);

    Json(ApiResponse::success(WalletBalanceResponse {
        address,
        balance: balance.to_string(),
        balance_formatted: formatted,
        nonce,
        is_admin,
    }))
    .into_response()
}

pub async fn get_transactions(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
    Query(query): Query<WalletTransactionsQuery>,
) -> impl IntoResponse {
    let addr = match Address::from_hex(&address) {
        Ok(a) => a,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid address").into_response(),
    };

    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    // Get transactions from recent blocks
    let mut user_txs: Vec<TransactionSummary> = Vec::new();
    let height = state.consensus.height();

    for h in (0..=height).rev() {
        if let Some(block) = state.consensus.get_block(h) {
            for tx in &block.transactions {
                // Check if user is sender or receiver
                if tx.from == addr || tx.to() == Some(addr) {
                    let mut summary = TransactionSummary::from(tx);
                    summary.block_height = Some(h);
                    summary.success = Some(true);
                    user_txs.push(summary);
                }
            }
        }

        if user_txs.len() >= limit + offset {
            break;
        }
    }

    // Also check mempool for pending transactions
    let pending = state.consensus.mempool().get_pending_for_address(&addr);
    for tx in pending {
        let mut summary = TransactionSummary::from(&tx);
        summary.success = None; // Pending
        user_txs.insert(0, summary); // Pending at front
    }

    let total = user_txs.len();
    let transactions: Vec<TransactionSummary> = user_txs
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();

    Json(ApiResponse::success(WalletTransactionsResponse {
        transactions,
        total,
    }))
    .into_response()
}

pub async fn get_certificates(
    Extension(state): Extension<AppState>,
    Path(address): Path<String>,
) -> impl IntoResponse {
    let addr = match Address::from_hex(&address) {
        Ok(a) => a,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid address").into_response(),
    };

    // Get certificates registered by this user
    let all_certs = state.consensus.state().list_certificates();
    let user_certs: Vec<CertificateSummary> = all_certs
        .into_iter()
        .filter(|_c| {
            // For now, return all active certificates
            // In production, would track certificate ownership
            true
        })
        .collect();

    let total_gold_oz: f64 = user_certs.iter().map(|c| c.gold_amount_oz).sum();
    let total_gold_grams: f64 = user_certs.iter().map(|c| c.gold_amount_grams).sum();

    Json(ApiResponse::success(WalletCertificatesResponse {
        certificates: user_certs,
        total_gold_oz,
        total_gold_grams,
    }))
    .into_response()
}

pub async fn transfer(
    Extension(state): Extension<AppState>,
    Json(req): Json<WalletTransferRequest>,
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

    // Parse to address
    let to = match Address::from_hex(&req.to) {
        Ok(addr) => addr,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid to address").into_response(),
    };

    // Parse amount
    let amount: u128 = match req.amount.parse() {
        Ok(v) => v,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid amount").into_response(),
    };

    // Check balance
    let balance = state.consensus.state().get_balance(&from);
    if balance < amount {
        return error_response(
            StatusCode::BAD_REQUEST,
            &format!("Insufficient balance: have {}, need {}", balance, amount),
        )
        .into_response();
    }

    // Create transaction
    let payload = TransactionPayload::Transfer(TransferPayload {
        to,
        amount,
        memo: req.memo,
    });

    let mut tx = Transaction::new(from, public_key, req.nonce, payload);
    tx.set_signature(signature);

    match state.consensus.submit_transaction(tx) {
        Ok(hash) => Json(ApiResponse::success(WalletTransferResponse {
            tx_hash: hex::encode(hash),
            status: "pending".to_string(),
            from: req.from,
            to: req.to,
            amount: req.amount,
        }))
        .into_response(),
        Err(e) => error_response(StatusCode::BAD_REQUEST, &e.to_string()).into_response(),
    }
}
