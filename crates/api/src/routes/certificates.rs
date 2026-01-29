use super::{error_response, ApiResponse};
use crate::AppState;
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use gold_core::{
    Address, CertificateSummary, RegisterCertificatePayload, Transaction, TransactionPayload,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ListCertificatesQuery {
    pub status: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Serialize)]
pub struct ListCertificatesResponse {
    pub certificates: Vec<CertificateSummary>,
    pub total: usize,
    pub stats: CertificateStatsResponse,
}

#[derive(Serialize)]
pub struct CertificateStatsResponse {
    pub total_certificates: u64,
    pub active_certificates: u64,
    pub total_gold_oz: f64,
    pub total_minted: String,
    pub total_mintable: String,
}

#[derive(Deserialize)]
pub struct RegisterCertificateRequest {
    pub admin_address: String,
    pub admin_public_key: String,
    pub nonce: u64,
    pub hsbc_reference: String,
    pub gold_amount_oz: f64,
    pub issue_date: String,
    pub hsbc_branch: String,
    pub document_hash: String,
    pub notes: Option<String>,
    pub signature: String,
}

#[derive(Serialize)]
pub struct RegisterCertificateResponse {
    pub tx_hash: String,
    pub certificate_id: Option<String>,
    pub status: String,
}

pub async fn list_certificates(
    Extension(state): Extension<AppState>,
    Query(query): Query<ListCertificatesQuery>,
) -> Json<ApiResponse<ListCertificatesResponse>> {
    let mut certificates = state.consensus.state().list_certificates();

    // Filter by status if specified
    if let Some(status) = &query.status {
        certificates.retain(|c| c.status.to_lowercase() == status.to_lowercase());
    }

    let total = certificates.len();
    let stats = state.consensus.state().certificate_stats();

    // Apply pagination
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    let certificates: Vec<CertificateSummary> = certificates
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();

    Json(ApiResponse::success(ListCertificatesResponse {
        certificates,
        total,
        stats: CertificateStatsResponse {
            total_certificates: stats.total_certificates,
            active_certificates: stats.active_certificates,
            total_gold_oz: stats.total_gold_oz,
            total_minted: stats.total_minted.to_string(),
            total_mintable: stats.total_mintable.to_string(),
        },
    }))
}

pub async fn get_certificate(
    Extension(state): Extension<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    // Try to parse as certificate ID (hex)
    if let Ok(bytes) = hex::decode(&id) {
        if bytes.len() == 32 {
            let mut cert_id = [0u8; 32];
            cert_id.copy_from_slice(&bytes);

            if let Some(cert) = state.consensus.state().get_certificate(&cert_id) {
                return Json(ApiResponse::success(CertificateSummary::from(&cert))).into_response();
            }
        }
    }

    // Try to find by HSBC reference
    if let Some(cert) = state.consensus.state().get_certificate_by_hsbc_ref(&id) {
        return Json(ApiResponse::success(CertificateSummary::from(&cert))).into_response();
    }

    error_response(StatusCode::NOT_FOUND, "Certificate not found").into_response()
}

pub async fn register_certificate(
    Extension(state): Extension<AppState>,
    Json(req): Json<RegisterCertificateRequest>,
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

    // Validate gold amount
    if req.gold_amount_oz <= 0.0 {
        return error_response(StatusCode::BAD_REQUEST, "Gold amount must be positive").into_response();
    }

    // Create transaction
    let payload = TransactionPayload::RegisterCertificate(RegisterCertificatePayload {
        hsbc_reference: req.hsbc_reference,
        gold_amount_oz: req.gold_amount_oz,
        issue_date: req.issue_date,
        hsbc_branch: req.hsbc_branch,
        document_hash: req.document_hash,
        notes: req.notes,
    });

    let mut tx = Transaction::new(from, public_key, req.nonce, payload);
    tx.set_signature(signature);

    // Submit to mempool
    match state.consensus.submit_transaction(tx) {
        Ok(hash) => Json(ApiResponse::success(RegisterCertificateResponse {
            tx_hash: hex::encode(hash),
            certificate_id: None, // Will be assigned after execution
            status: "pending".to_string(),
        }))
        .into_response(),
        Err(e) => error_response(StatusCode::BAD_REQUEST, &e.to_string()).into_response(),
    }
}
