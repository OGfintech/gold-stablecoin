use serde::{Deserialize, Serialize};
use std::fmt;

/// 32-byte hash type used throughout the system
pub type Hash = [u8; 32];

/// 32-byte public key (Ed25519)
pub type PublicKey = [u8; 32];

/// 64-byte signature (Ed25519)
pub type Signature = [u8; 64];

/// Address is derived from public key
#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Address(pub [u8; 32]);

impl Address {
    pub fn from_public_key(public_key: &PublicKey) -> Self {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(public_key);
        let result = hasher.finalize();
        let mut addr = [0u8; 32];
        addr.copy_from_slice(&result);
        Address(addr)
    }

    pub fn zero() -> Self {
        Address([0u8; 32])
    }

    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }

    pub fn from_hex(s: &str) -> Result<Self, hex::FromHexError> {
        let bytes = hex::decode(s)?;
        if bytes.len() != 32 {
            return Err(hex::FromHexError::InvalidStringLength);
        }
        let mut addr = [0u8; 32];
        addr.copy_from_slice(&bytes);
        Ok(Address(addr))
    }
}

impl fmt::Debug for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Address({})", self.to_hex())
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

/// Token amount in smallest unit (like wei for ETH)
/// Using u128 for large values - 1 token = 10^18 base units
pub type TokenAmount = u128;

/// Constants for token decimals
pub const TOKEN_DECIMALS: u32 = 18;
pub const TOKEN_BASE: u128 = 10u128.pow(TOKEN_DECIMALS);

/// Gold amount in troy ounces (stored as fixed point: value * 10^8)
pub type GoldOunces = u64;
pub const GOLD_DECIMALS: u32 = 8;
pub const GOLD_BASE: u64 = 10u64.pow(GOLD_DECIMALS);

/// Convert troy ounces to grams (1 oz = 31.1035 grams)
pub fn oz_to_grams(oz: f64) -> f64 {
    oz * 31.1035
}

/// Convert grams to troy ounces
pub fn grams_to_oz(grams: f64) -> f64 {
    grams / 31.1035
}

/// Result type for core operations
pub type CoreResult<T> = Result<T, CoreError>;

/// Core error types
#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Invalid hash")]
    InvalidHash,

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Insufficient balance: have {have}, need {need}")]
    InsufficientBalance { have: TokenAmount, need: TokenAmount },

    #[error("Certificate not found: {0}")]
    CertificateNotFound(String),

    #[error("Certificate already exists: {0}")]
    CertificateAlreadyExists(String),

    #[error("Certificate exhausted: {0}")]
    CertificateExhausted(String),

    #[error("Invalid certificate status: expected {expected}, got {actual}")]
    InvalidCertificateStatus { expected: String, actual: String },

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),

    #[error("Block validation failed: {0}")]
    BlockValidationFailed(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Internal error: {0}")]
    InternalError(String),

    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_address_from_public_key() {
        let pk = [1u8; 32];
        let addr = Address::from_public_key(&pk);
        assert_ne!(addr.0, pk);
    }

    #[test]
    fn test_address_hex_roundtrip() {
        let addr = Address([42u8; 32]);
        let hex_str = addr.to_hex();
        let recovered = Address::from_hex(&hex_str).unwrap();
        assert_eq!(addr, recovered);
    }

    #[test]
    fn test_gold_conversion() {
        let oz = 1.0;
        let grams = oz_to_grams(oz);
        assert!((grams - 31.1035).abs() < 0.0001);

        let back_to_oz = grams_to_oz(grams);
        assert!((back_to_oz - oz).abs() < 0.0001);
    }
}
