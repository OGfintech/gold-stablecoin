use gold_core::Hash;
use sha2::{Digest, Sha256};

/// Compute SHA256 hash of data
pub fn sha256(data: &[u8]) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

/// Compute SHA256 hash of multiple data slices
pub fn sha256_multi(data: &[&[u8]]) -> Hash {
    let mut hasher = Sha256::new();
    for d in data {
        hasher.update(d);
    }
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

/// Double SHA256 (SHA256(SHA256(data)))
pub fn double_sha256(data: &[u8]) -> Hash {
    sha256(&sha256(data))
}

/// Hash to hex string
pub fn hash_to_hex(hash: &Hash) -> String {
    hex::encode(hash)
}

/// Hex string to hash
pub fn hex_to_hash(hex_str: &str) -> Result<Hash, hex::FromHexError> {
    let bytes = hex::decode(hex_str)?;
    if bytes.len() != 32 {
        return Err(hex::FromHexError::InvalidStringLength);
    }
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&bytes);
    Ok(hash)
}

/// Zero hash constant
pub const ZERO_HASH: Hash = [0u8; 32];

/// Check if a hash is zero
pub fn is_zero_hash(hash: &Hash) -> bool {
    hash == &ZERO_HASH
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256() {
        let hash = sha256(b"hello");
        assert_ne!(hash, [0u8; 32]);

        // Known SHA256 of "hello"
        let expected = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
        assert_eq!(hash_to_hex(&hash), expected);
    }

    #[test]
    fn test_sha256_deterministic() {
        let hash1 = sha256(b"test");
        let hash2 = sha256(b"test");
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_sha256_multi() {
        let hash1 = sha256(b"helloworld");
        let hash2 = sha256_multi(&[b"hello", b"world"]);
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_double_sha256() {
        let single = sha256(b"test");
        let double = double_sha256(b"test");

        assert_ne!(single, double);
        assert_eq!(double, sha256(&single));
    }

    #[test]
    fn test_hex_roundtrip() {
        let hash = sha256(b"test");
        let hex_str = hash_to_hex(&hash);
        let recovered = hex_to_hash(&hex_str).unwrap();
        assert_eq!(hash, recovered);
    }

    #[test]
    fn test_zero_hash() {
        assert!(is_zero_hash(&ZERO_HASH));
        assert!(!is_zero_hash(&sha256(b"test")));
    }
}
