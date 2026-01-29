use crate::{CryptoError, CryptoResult};
use ed25519_dalek::{SecretKey, SigningKey, VerifyingKey};
use gold_core::{Address, PublicKey, Signature};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};

/// A keypair for signing transactions
#[derive(Clone)]
pub struct Keypair {
    signing_key: SigningKey,
}

impl Keypair {
    /// Generate a new random keypair
    pub fn generate() -> Self {
        let signing_key = SigningKey::generate(&mut OsRng);
        Self { signing_key }
    }

    /// Create keypair from secret key bytes
    pub fn from_secret_key(secret: &[u8; 32]) -> CryptoResult<Self> {
        let secret_key = SecretKey::from(*secret);
        let signing_key = SigningKey::from(secret_key);
        Ok(Self { signing_key })
    }

    /// Create keypair from hex-encoded secret key
    pub fn from_secret_hex(hex: &str) -> CryptoResult<Self> {
        let bytes = hex::decode(hex)?;
        if bytes.len() != 32 {
            return Err(CryptoError::InvalidSecretKey);
        }
        let mut secret = [0u8; 32];
        secret.copy_from_slice(&bytes);
        Self::from_secret_key(&secret)
    }

    /// Get the secret key bytes
    pub fn secret_key(&self) -> [u8; 32] {
        self.signing_key.to_bytes()
    }

    /// Get the secret key as hex string
    pub fn secret_hex(&self) -> String {
        hex::encode(self.secret_key())
    }

    /// Get the public key bytes
    pub fn public_key(&self) -> PublicKey {
        self.signing_key.verifying_key().to_bytes()
    }

    /// Get the public key as hex string
    pub fn public_hex(&self) -> String {
        hex::encode(self.public_key())
    }

    /// Get the address derived from the public key
    pub fn address(&self) -> Address {
        Address::from_public_key(&self.public_key())
    }

    /// Sign a message
    pub fn sign(&self, message: &[u8]) -> Signature {
        use ed25519_dalek::Signer;
        let sig = self.signing_key.sign(message);
        sig.to_bytes()
    }

    /// Get the verifying key
    pub fn verifying_key(&self) -> VerifyingKey {
        self.signing_key.verifying_key()
    }
}

impl std::fmt::Debug for Keypair {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Keypair")
            .field("public_key", &self.public_hex())
            .field("address", &self.address().to_hex())
            .finish()
    }
}

/// Wallet representation for serialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletData {
    pub address: String,
    pub public_key: String,
    pub encrypted_secret: Option<String>,
}

impl From<&Keypair> for WalletData {
    fn from(keypair: &Keypair) -> Self {
        Self {
            address: keypair.address().to_hex(),
            public_key: keypair.public_hex(),
            encrypted_secret: None,
        }
    }
}

/// Verify a public key is valid
pub fn verify_public_key(public_key: &PublicKey) -> CryptoResult<VerifyingKey> {
    VerifyingKey::from_bytes(public_key).map_err(|_| CryptoError::InvalidPublicKey)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let kp = Keypair::generate();
        assert_ne!(kp.public_key(), [0u8; 32]);
        assert_ne!(kp.secret_key(), [0u8; 32]);
    }

    #[test]
    fn test_keypair_from_secret() {
        let kp1 = Keypair::generate();
        let secret = kp1.secret_key();

        let kp2 = Keypair::from_secret_key(&secret).unwrap();
        assert_eq!(kp1.public_key(), kp2.public_key());
    }

    #[test]
    fn test_keypair_from_hex() {
        let kp1 = Keypair::generate();
        let hex = kp1.secret_hex();

        let kp2 = Keypair::from_secret_hex(&hex).unwrap();
        assert_eq!(kp1.public_key(), kp2.public_key());
    }

    #[test]
    fn test_signing() {
        let kp = Keypair::generate();
        let message = b"test message";
        let sig = kp.sign(message);

        assert_ne!(sig, [0u8; 64]);
    }

    #[test]
    fn test_address_derivation() {
        let kp = Keypair::generate();
        let addr = kp.address();

        // Address should be different from public key (it's a hash)
        assert_ne!(addr.0, kp.public_key());
    }

    #[test]
    fn test_deterministic_address() {
        let kp = Keypair::generate();
        let addr1 = kp.address();
        let addr2 = kp.address();

        assert_eq!(addr1, addr2);
    }
}
