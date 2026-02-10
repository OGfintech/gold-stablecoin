pub mod block;
pub mod certificate;
pub mod transaction;
pub mod types;

pub use block::*;
pub use certificate::*;
pub use transaction::*;
pub use types::*;

/// Serde helper for [u8; 64] (Ed25519 signatures) serialized as hex strings
pub mod serde_sig_hex {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(bytes: &[u8; 64], s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&hex::encode(bytes))
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<[u8; 64], D::Error> {
        let hex_str = String::deserialize(d)?;
        let vec = hex::decode(&hex_str).map_err(serde::de::Error::custom)?;
        let mut arr = [0u8; 64];
        if vec.len() != 64 {
            return Err(serde::de::Error::custom("expected 64 bytes for signature"));
        }
        arr.copy_from_slice(&vec);
        Ok(arr)
    }
}
