use crate::transaction::Transaction;
use crate::types::Hash;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Block header containing metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockHeader {
    /// Block height (0-indexed)
    pub height: u64,

    /// Hash of the previous block
    pub previous_hash: Hash,

    /// Merkle root of transactions
    pub merkle_root: Hash,

    /// Merkle root of state (account balances)
    pub state_root: Hash,

    /// Number of transactions in the block
    pub tx_count: u32,

    /// Block timestamp
    pub timestamp: DateTime<Utc>,

    /// Block producer's address
    pub producer: [u8; 32],

    /// Block producer's signature
    pub signature: [u8; 64],
}

impl BlockHeader {
    /// Compute the block hash
    pub fn compute_hash(&self) -> Hash {
        let mut hasher = Sha256::new();

        hasher.update(self.height.to_le_bytes());
        hasher.update(&self.previous_hash);
        hasher.update(&self.merkle_root);
        hasher.update(&self.state_root);
        hasher.update(self.tx_count.to_le_bytes());
        hasher.update(self.timestamp.timestamp().to_le_bytes());
        hasher.update(&self.producer);

        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    /// Get the message to sign
    pub fn signing_message(&self) -> Hash {
        let mut hasher = Sha256::new();

        hasher.update(self.height.to_le_bytes());
        hasher.update(&self.previous_hash);
        hasher.update(&self.merkle_root);
        hasher.update(&self.state_root);
        hasher.update(self.tx_count.to_le_bytes());
        hasher.update(self.timestamp.timestamp().to_le_bytes());
        hasher.update(&self.producer);

        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }
}

/// A complete block
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    /// Block hash
    pub hash: Hash,

    /// Block header
    pub header: BlockHeader,

    /// Transactions in the block
    pub transactions: Vec<Transaction>,
}

impl Block {
    /// Create a new block
    pub fn new(
        height: u64,
        previous_hash: Hash,
        merkle_root: Hash,
        state_root: Hash,
        transactions: Vec<Transaction>,
        producer: [u8; 32],
    ) -> Self {
        let header = BlockHeader {
            height,
            previous_hash,
            merkle_root,
            state_root,
            tx_count: transactions.len() as u32,
            timestamp: Utc::now(),
            producer,
            signature: [0u8; 64],
        };

        let hash = header.compute_hash();

        Self {
            hash,
            header,
            transactions,
        }
    }

    /// Create genesis block
    pub fn genesis(producer: [u8; 32]) -> Self {
        Self::new(
            0,
            [0u8; 32],
            [0u8; 32],
            [0u8; 32],
            Vec::new(),
            producer,
        )
    }

    /// Set the block signature
    pub fn set_signature(&mut self, signature: [u8; 64]) {
        self.header.signature = signature;
    }

    /// Get block hash as hex string
    pub fn hash_hex(&self) -> String {
        hex::encode(self.hash)
    }

    /// Get previous hash as hex string
    pub fn previous_hash_hex(&self) -> String {
        hex::encode(self.header.previous_hash)
    }

    /// Validate block structure
    pub fn validate_structure(&self) -> Result<(), String> {
        // Check transaction count matches
        if self.transactions.len() != self.header.tx_count as usize {
            return Err(format!(
                "Transaction count mismatch: header says {}, actual {}",
                self.header.tx_count,
                self.transactions.len()
            ));
        }

        // Verify hash
        let computed_hash = self.header.compute_hash();
        if computed_hash != self.hash {
            return Err("Block hash mismatch".to_string());
        }

        Ok(())
    }
}

/// Block summary for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockSummary {
    pub hash: String,
    pub height: u64,
    pub previous_hash: String,
    pub merkle_root: String,
    pub state_root: String,
    pub tx_count: u32,
    pub timestamp: String,
    pub producer: String,
}

impl From<&Block> for BlockSummary {
    fn from(block: &Block) -> Self {
        Self {
            hash: block.hash_hex(),
            height: block.header.height,
            previous_hash: block.previous_hash_hex(),
            merkle_root: hex::encode(block.header.merkle_root),
            state_root: hex::encode(block.header.state_root),
            tx_count: block.header.tx_count,
            timestamp: block.header.timestamp.to_rfc3339(),
            producer: hex::encode(block.header.producer),
        }
    }
}

/// Block with transaction summaries (for detailed API responses)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockDetail {
    pub hash: String,
    pub height: u64,
    pub previous_hash: String,
    pub merkle_root: String,
    pub state_root: String,
    pub tx_count: u32,
    pub timestamp: String,
    pub producer: String,
    pub transactions: Vec<crate::transaction::TransactionSummary>,
}

impl From<&Block> for BlockDetail {
    fn from(block: &Block) -> Self {
        Self {
            hash: block.hash_hex(),
            height: block.header.height,
            previous_hash: block.previous_hash_hex(),
            merkle_root: hex::encode(block.header.merkle_root),
            state_root: hex::encode(block.header.state_root),
            tx_count: block.header.tx_count,
            timestamp: block.header.timestamp.to_rfc3339(),
            producer: hex::encode(block.header.producer),
            transactions: block.transactions.iter().map(|t| t.into()).collect(),
        }
    }
}

/// Compute Merkle root from a list of transaction hashes
pub fn compute_merkle_root(hashes: &[Hash]) -> Hash {
    if hashes.is_empty() {
        return [0u8; 32];
    }

    if hashes.len() == 1 {
        return hashes[0];
    }

    let mut current_level: Vec<Hash> = hashes.to_vec();

    while current_level.len() > 1 {
        let mut next_level = Vec::new();

        for chunk in current_level.chunks(2) {
            let mut hasher = Sha256::new();
            hasher.update(&chunk[0]);

            if chunk.len() > 1 {
                hasher.update(&chunk[1]);
            } else {
                // Duplicate last hash if odd number
                hasher.update(&chunk[0]);
            }

            let result = hasher.finalize();
            let mut hash = [0u8; 32];
            hash.copy_from_slice(&result);
            next_level.push(hash);
        }

        current_level = next_level;
    }

    current_level[0]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_genesis_block() {
        let block = Block::genesis([0u8; 32]);

        assert_eq!(block.header.height, 0);
        assert_eq!(block.header.previous_hash, [0u8; 32]);
        assert_eq!(block.transactions.len(), 0);
    }

    #[test]
    fn test_block_hash_consistency() {
        let block = Block::genesis([1u8; 32]);
        let hash1 = block.header.compute_hash();
        let hash2 = block.header.compute_hash();

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_block_validation() {
        let block = Block::genesis([0u8; 32]);
        assert!(block.validate_structure().is_ok());
    }

    #[test]
    fn test_merkle_root_empty() {
        let root = compute_merkle_root(&[]);
        assert_eq!(root, [0u8; 32]);
    }

    #[test]
    fn test_merkle_root_single() {
        let hash = [1u8; 32];
        let root = compute_merkle_root(&[hash]);
        assert_eq!(root, hash);
    }

    #[test]
    fn test_merkle_root_multiple() {
        let hashes = vec![[1u8; 32], [2u8; 32], [3u8; 32], [4u8; 32]];
        let root = compute_merkle_root(&hashes);

        // Root should be deterministic
        let root2 = compute_merkle_root(&hashes);
        assert_eq!(root, root2);
    }

    #[test]
    fn test_block_summary() {
        let block = Block::genesis([0u8; 32]);
        let summary = BlockSummary::from(&block);

        assert_eq!(summary.height, 0);
        assert_eq!(summary.tx_count, 0);
    }
}
