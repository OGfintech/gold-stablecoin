pub mod hash;
pub mod keypair;
pub mod merkle;
pub mod signature;

pub use hash::*;
pub use keypair::*;
pub use merkle::*;
pub use signature::*;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Invalid public key")]
    InvalidPublicKey,

    #[error("Invalid secret key")]
    InvalidSecretKey,

    #[error("Signature verification failed")]
    VerificationFailed,

    #[error("Batch verification failed")]
    BatchVerificationFailed,

    #[error("Invalid hash length")]
    InvalidHashLength,

    #[error("Hex decode error: {0}")]
    HexDecodeError(#[from] hex::FromHexError),
}

pub type CryptoResult<T> = Result<T, CryptoError>;
