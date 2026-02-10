use crate::types::{Address, Hash, PublicKey, Signature, TokenAmount};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Transaction type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransactionType {
    /// Transfer tokens between addresses
    Transfer,
    /// Mint new tokens (admin only, requires certificate)
    Mint,
    /// Burn tokens for redemption
    Burn,
    /// Register a new certificate
    RegisterCertificate,
}

impl std::fmt::Display for TransactionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TransactionType::Transfer => write!(f, "Transfer"),
            TransactionType::Mint => write!(f, "Mint"),
            TransactionType::Burn => write!(f, "Burn"),
            TransactionType::RegisterCertificate => write!(f, "RegisterCertificate"),
        }
    }
}

/// Transfer payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferPayload {
    pub to: Address,
    pub amount: TokenAmount,
    pub memo: Option<String>,
}

/// Mint payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MintPayload {
    pub certificate_id: Hash,
    pub to: Address,
    pub amount: TokenAmount,
}

/// Burn payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnPayload {
    pub amount: TokenAmount,
    pub redemption_address: Option<String>, // Physical delivery address
}

/// Register certificate payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterCertificatePayload {
    pub hsbc_reference: String,
    pub gold_amount_oz: f64,
    pub issue_date: String,
    pub hsbc_branch: String,
    pub document_hash: Hash,
    pub notes: Option<String>,
}

/// Transaction payload variants
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionPayload {
    Transfer(TransferPayload),
    Mint(MintPayload),
    Burn(BurnPayload),
    RegisterCertificate(RegisterCertificatePayload),
}

impl TransactionPayload {
    pub fn tx_type(&self) -> TransactionType {
        match self {
            TransactionPayload::Transfer(_) => TransactionType::Transfer,
            TransactionPayload::Mint(_) => TransactionType::Mint,
            TransactionPayload::Burn(_) => TransactionType::Burn,
            TransactionPayload::RegisterCertificate(_) => TransactionType::RegisterCertificate,
        }
    }
}

/// A signed transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    /// Transaction hash (computed from content)
    pub hash: Hash,

    /// Transaction type
    pub tx_type: TransactionType,

    /// Sender's address (derived from public key)
    pub from: Address,

    /// Sender's public key
    pub public_key: PublicKey,

    /// Nonce to prevent replay attacks
    pub nonce: u64,

    /// Transaction payload
    pub payload: TransactionPayload,

    /// Timestamp when transaction was created
    pub timestamp: DateTime<Utc>,

    /// Ed25519 signature
    #[serde(with = "crate::serde_sig_hex")]
    pub signature: Signature,
}

impl Transaction {
    /// Create a new unsigned transaction (signature is zeroed)
    pub fn new(
        from: Address,
        public_key: PublicKey,
        nonce: u64,
        payload: TransactionPayload,
    ) -> Self {
        let tx_type = payload.tx_type();
        let timestamp = Utc::now();

        let mut tx = Self {
            hash: [0u8; 32],
            tx_type,
            from,
            public_key,
            nonce,
            payload,
            timestamp,
            signature: [0u8; 64],
        };

        tx.hash = tx.compute_hash();
        tx
    }

    /// Compute the transaction hash (excludes signature)
    pub fn compute_hash(&self) -> Hash {
        let mut hasher = Sha256::new();

        // Include all fields except hash and signature
        hasher.update(&self.from.0);
        hasher.update(&self.public_key);
        hasher.update(self.nonce.to_le_bytes());
        hasher.update(self.timestamp.timestamp().to_le_bytes());

        // Serialize payload
        if let Ok(payload_bytes) = serde_json::to_vec(&self.payload) {
            hasher.update(&payload_bytes);
        }

        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    /// Get the signing message (hash that should be signed)
    pub fn signing_message(&self) -> Hash {
        self.compute_hash()
    }

    /// Set the signature
    pub fn set_signature(&mut self, signature: Signature) {
        self.signature = signature;
    }

    /// Get transaction hash as hex string
    pub fn hash_hex(&self) -> String {
        hex::encode(self.hash)
    }

    /// Check if this is an admin-only transaction
    pub fn requires_admin(&self) -> bool {
        matches!(
            self.tx_type,
            TransactionType::Mint | TransactionType::RegisterCertificate
        )
    }

    /// Get the amount involved in the transaction (if applicable)
    pub fn amount(&self) -> Option<TokenAmount> {
        match &self.payload {
            TransactionPayload::Transfer(p) => Some(p.amount),
            TransactionPayload::Mint(p) => Some(p.amount),
            TransactionPayload::Burn(p) => Some(p.amount),
            TransactionPayload::RegisterCertificate(_) => None,
        }
    }

    /// Get the recipient address (if applicable)
    pub fn to(&self) -> Option<Address> {
        match &self.payload {
            TransactionPayload::Transfer(p) => Some(p.to),
            TransactionPayload::Mint(p) => Some(p.to),
            _ => None,
        }
    }
}

/// Transaction receipt (result of execution)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionReceipt {
    pub tx_hash: Hash,
    pub block_height: u64,
    pub block_hash: Hash,
    pub index: u32,
    pub success: bool,
    pub error: Option<String>,
    pub executed_at: DateTime<Utc>,
}

/// Transaction summary for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionSummary {
    pub hash: String,
    pub tx_type: String,
    pub from: String,
    pub to: Option<String>,
    pub amount: Option<String>,
    pub nonce: u64,
    pub timestamp: String,
    pub block_height: Option<u64>,
    pub success: Option<bool>,
}

impl From<&Transaction> for TransactionSummary {
    fn from(tx: &Transaction) -> Self {
        Self {
            hash: tx.hash_hex(),
            tx_type: tx.tx_type.to_string(),
            from: tx.from.to_hex(),
            to: tx.to().map(|a| a.to_hex()),
            amount: tx.amount().map(|a| a.to_string()),
            nonce: tx.nonce,
            timestamp: tx.timestamp.to_rfc3339(),
            block_height: None,
            success: None,
        }
    }
}

/// Pending transaction in mempool
#[derive(Debug, Clone)]
pub struct PendingTransaction {
    pub transaction: Transaction,
    pub received_at: DateTime<Utc>,
    pub priority: u64, // Higher = more priority
}

impl PendingTransaction {
    pub fn new(transaction: Transaction) -> Self {
        Self {
            priority: 0,
            transaction,
            received_at: Utc::now(),
        }
    }

    pub fn with_priority(mut self, priority: u64) -> Self {
        self.priority = priority;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_transfer() -> Transaction {
        let from = Address([1u8; 32]);
        let public_key = [1u8; 32];
        let to = Address([2u8; 32]);

        Transaction::new(
            from,
            public_key,
            1,
            TransactionPayload::Transfer(TransferPayload {
                to,
                amount: 1000,
                memo: Some("Test transfer".to_string()),
            }),
        )
    }

    #[test]
    fn test_transaction_creation() {
        let tx = create_test_transfer();

        assert_eq!(tx.tx_type, TransactionType::Transfer);
        assert_eq!(tx.nonce, 1);
        assert_ne!(tx.hash, [0u8; 32]);
    }

    #[test]
    fn test_transaction_hash_consistency() {
        let tx = create_test_transfer();
        let hash1 = tx.compute_hash();
        let hash2 = tx.compute_hash();

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_transaction_amount() {
        let tx = create_test_transfer();
        assert_eq!(tx.amount(), Some(1000));
    }

    #[test]
    fn test_transaction_to() {
        let tx = create_test_transfer();
        assert_eq!(tx.to(), Some(Address([2u8; 32])));
    }

    #[test]
    fn test_mint_requires_admin() {
        let from = Address([1u8; 32]);
        let public_key = [1u8; 32];

        let tx = Transaction::new(
            from,
            public_key,
            1,
            TransactionPayload::Mint(MintPayload {
                certificate_id: [0u8; 32],
                to: Address([2u8; 32]),
                amount: 1000,
            }),
        );

        assert!(tx.requires_admin());
    }

    #[test]
    fn test_transfer_does_not_require_admin() {
        let tx = create_test_transfer();
        assert!(!tx.requires_admin());
    }

    #[test]
    fn test_transaction_summary() {
        let tx = create_test_transfer();
        let summary = TransactionSummary::from(&tx);

        assert_eq!(summary.tx_type, "Transfer");
        assert_eq!(summary.amount, Some("1000".to_string()));
    }
}
