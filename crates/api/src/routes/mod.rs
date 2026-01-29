pub mod admin;
pub mod blocks;
pub mod certificates;
pub mod health;
pub mod system;
pub mod tokens;
pub mod transactions;
pub mod wallet;

use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::Serialize;

/// Standard API response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}

/// Error response helper
pub fn error_response(status: StatusCode, message: &str) -> impl IntoResponse {
    (
        status,
        Json(ApiResponse::<()>::error(message)),
    )
}
