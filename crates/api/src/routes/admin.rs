use super::ApiResponse;
use axum::Json;
use gold_crypto::Keypair;
use serde::Serialize;

#[derive(Serialize)]
pub struct GenerateKeypairResponse {
    pub address: String,
    pub public_key: String,
    pub secret_key: String,
    pub warning: String,
}

/// Generate a new keypair (for testing/demo purposes)
/// WARNING: In production, keys should be generated client-side
pub async fn generate_keypair() -> Json<ApiResponse<GenerateKeypairResponse>> {
    let keypair = Keypair::generate();

    Json(ApiResponse::success(GenerateKeypairResponse {
        address: keypair.address().to_hex(),
        public_key: keypair.public_hex(),
        secret_key: keypair.secret_hex(),
        warning: "NEVER share your secret key! Store it securely.".to_string(),
    }))
}
