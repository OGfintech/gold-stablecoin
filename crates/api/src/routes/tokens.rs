use super::{error_response, ApiResponse};
use crate::AppState;
use axum::{
    extract::Extension,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use gold_core::{
    Address, BurnPayload, MintPayload, Transaction, TransactionPayload, TransferPayload,
    TOKEN_BASE,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct MintRequest {
    pub admin_address: String,
    pub admin_public_key: String,
    pub nonce: u64,
    pub certificate_id: String,
    pub to: String,
    pub amount: String,
    pub signature: String,
}

#[derive(Deserialize)]
pub struct TransferRequest {
    pub from: String,
    pub public_key: String,
    pub nonce: u64,
    pub to: String,
    pub amount: String,
    pub memo: Option<String>,
    pub signature: String,
}

#[derive(Deserialize)]
pub struct BurnRequest {
    pub from: String,
    pub public_key: String,
    pub nonce: u64,
    pub amount: String,
    pub redemption_address: Option<String>,
    pub signature: String,
}

#[derive(Serialize)]
pub struct TokenResponse {
    pub tx_hash: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct SupplyResponse {
    pub total_supply: String,
    pub total_supply_formatted: String,
    pub total_minted: String,
    pub total_burned: String,
    pub circulating: String,
}

pub async fn mint_tokens(
    Extension(state): Extension<AppState>,
    Json(req): Json<MintRequest>,
) -> impl IntoResponse {
    // Parse admin address
    let from = match Address::from_hex(&req.admin_address) {
        Ok(addr) => addr,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid admin address").into_response(),
    };

    // Check admin privileges
    if !state.consensus.state().is_admin(&from) {
        return error_response(StatusCode::FORBIDDEN, "Admin privileges required").into_response();
    }

    // Parse public key
    let public_key: [u8; 32] = match hex::decode(&req.admin_public_key) {
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

    // Parse certificate ID
    let cert_id: [u8; 32] = match hex::decode(&req.certificate_id) {
        Ok(bytes) if bytes.len() == 32 => {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&bytes);
            arr
        }
        _ => return error_response(StatusCode::BAD_REQUEST, "Invalid certificate ID").into_response(),
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

    // Create transaction
    let payload = TransactionPayload::Mint(MintPayload {
        certificate_id: cert_id,
        to,
        amount,
    });

    let mut tx = Transaction::new(from, public_key, req.nonce, payload);
    tx.set_signature(signature);

    match state.consensus.submit_transaction(tx) {
        Ok(hash) => Json(ApiResponse::success(TokenResponse {
            tx_hash: hex::encode(hash),
            status: "pending".to_string(),
        }))
        .into_response(),
        Err(e) => error_response(StatusCode::BAD_REQUEST, &e.to_string()).into_response(),
    }
}

pub async fn transfer_tokens(
    Extension(state): Extension<AppState>,
    Json(req): Json<TransferRequest>,
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

    // Create transaction
    let payload = TransactionPayload::Transfer(TransferPayload {
        to,
        amount,
        memo: req.memo,
    });

    let mut tx = Transaction::new(from, public_key, req.nonce, payload);
    tx.set_signature(signature);

    match state.consensus.submit_transaction(tx) {
        Ok(hash) => Json(ApiResponse::success(TokenResponse {
            tx_hash: hex::encode(hash),
            status: "pending".to_string(),
        }))
        .into_response(),
        Err(e) => error_response(StatusCode::BAD_REQUEST, &e.to_string()).into_response(),
    }
}

pub async fn burn_tokens(
    Extension(state): Extension<AppState>,
    Json(req): Json<BurnRequest>,
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

    // Parse amount
    let amount: u128 = match req.amount.parse() {
        Ok(v) => v,
        Err(_) => return error_response(StatusCode::BAD_REQUEST, "Invalid amount").into_response(),
    };

    // Create transaction
    let payload = TransactionPayload::Burn(BurnPayload {
        amount,
        redemption_address: req.redemption_address,
    });

    let mut tx = Transaction::new(from, public_key, req.nonce, payload);
    tx.set_signature(signature);

    match state.consensus.submit_transaction(tx) {
        Ok(hash) => Json(ApiResponse::success(TokenResponse {
            tx_hash: hex::encode(hash),
            status: "pending".to_string(),
        }))
        .into_response(),
        Err(e) => error_response(StatusCode::BAD_REQUEST, &e.to_string()).into_response(),
    }
}

pub async fn get_supply(
    Extension(state): Extension<AppState>,
) -> Json<ApiResponse<SupplyResponse>> {
    let total_supply = state.consensus.state().total_supply();
    let cert_stats = state.consensus.state().certificate_stats();

    let formatted = format!(
        "{:.6}",
        total_supply as f64 / TOKEN_BASE as f64
    );

    Json(ApiResponse::success(SupplyResponse {
        total_supply: total_supply.to_string(),
        total_supply_formatted: formatted,
        total_minted: cert_stats.total_minted.to_string(),
        total_burned: "0".to_string(), // Would track separately
        circulating: total_supply.to_string(),
    }))
}
