pub mod account;
pub mod certificate_registry;
pub mod state_manager;

pub use account::*;
pub use certificate_registry::*;
pub use state_manager::*;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum StateError {
    #[error("Account not found: {0}")]
    AccountNotFound(String),

    #[error("Insufficient balance: have {have}, need {need}")]
    InsufficientBalance { have: u128, need: u128 },

    #[error("Certificate not found: {0}")]
    CertificateNotFound(String),

    #[error("Certificate already exists: {0}")]
    CertificateAlreadyExists(String),

    #[error("Certificate error: {0}")]
    CertificateError(String),

    #[error("Nonce mismatch: expected {expected}, got {got}")]
    NonceMismatch { expected: u64, got: u64 },

    #[error("State error: {0}")]
    InternalError(String),
}

pub type StateResult<T> = Result<T, StateError>;
