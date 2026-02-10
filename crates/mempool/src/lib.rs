use chrono::{DateTime, Utc};
use dashmap::DashMap;
use gold_core::{Address, Hash, Transaction};
use gold_crypto::verify_transaction;
use gold_state::StateManager;
use parking_lot::RwLock;
use std::collections::BinaryHeap;
use std::sync::Arc;
use thiserror::Error;
use tracing::{debug, info, warn};

#[derive(Debug, Error)]
pub enum MempoolError {
    #[error("Transaction already exists: {0}")]
    DuplicateTransaction(String),

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Invalid nonce: expected {expected}, got {got}")]
    InvalidNonce { expected: u64, got: u64 },

    #[error("Mempool full: {0} transactions")]
    MempoolFull(usize),

    #[error("Transaction validation failed: {0}")]
    ValidationFailed(String),

    #[error("Per-account mempool limit exceeded: {sender} has {count}/{max} transactions")]
    SenderLimitExceeded {
        sender: String,
        count: usize,
        max: usize,
    },
}

pub type MempoolResult<T> = Result<T, MempoolError>;

/// Pending transaction with priority
#[derive(Debug, Clone)]
pub struct PendingTx {
    pub transaction: Transaction,
    pub received_at: DateTime<Utc>,
    pub priority: u64,
}

impl PendingTx {
    pub fn new(transaction: Transaction) -> Self {
        Self {
            transaction,
            received_at: Utc::now(),
            priority: 0,
        }
    }

    pub fn with_priority(mut self, priority: u64) -> Self {
        self.priority = priority;
        self
    }
}

impl PartialEq for PendingTx {
    fn eq(&self, other: &Self) -> bool {
        self.transaction.hash == other.transaction.hash
    }
}

impl Eq for PendingTx {}

impl PartialOrd for PendingTx {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for PendingTx {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Higher priority first, then earlier timestamp
        self.priority
            .cmp(&other.priority)
            .then_with(|| other.received_at.cmp(&self.received_at))
    }
}

/// Configuration for the mempool
#[derive(Debug, Clone)]
pub struct MempoolConfig {
    /// Maximum number of transactions in the pool
    pub max_size: usize,
    /// Maximum batch size for block production
    pub batch_size: usize,
    /// Transaction expiration time in seconds
    pub expiration_secs: u64,
    /// Maximum transactions per sender in the mempool
    pub max_per_sender: usize,
}

impl Default for MempoolConfig {
    fn default() -> Self {
        Self {
            max_size: 100_000,
            batch_size: 50_000,
            expiration_secs: 3600, // 1 hour
            max_per_sender: 20,
        }
    }
}

/// Transaction mempool
pub struct Mempool {
    /// Configuration
    config: MempoolConfig,

    /// Transactions by hash
    transactions: DashMap<Hash, PendingTx>,

    /// Transactions by sender (for nonce tracking)
    by_sender: DashMap<Address, Vec<Hash>>,

    /// Priority queue for batch selection
    priority_queue: Arc<RwLock<BinaryHeap<PendingTx>>>,

    /// Reference to state manager for validation
    state: Arc<StateManager>,

    /// Statistics
    stats: Arc<RwLock<MempoolStats>>,
}

/// Mempool statistics
#[derive(Debug, Default, Clone)]
pub struct MempoolStats {
    pub total_received: u64,
    pub total_included: u64,
    pub total_rejected: u64,
    pub total_expired: u64,
}

impl Mempool {
    /// Create a new mempool
    pub fn new(config: MempoolConfig, state: Arc<StateManager>) -> Self {
        Self {
            config,
            transactions: DashMap::new(),
            by_sender: DashMap::new(),
            priority_queue: Arc::new(RwLock::new(BinaryHeap::new())),
            state,
            stats: Arc::new(RwLock::new(MempoolStats::default())),
        }
    }

    /// Add a transaction to the mempool
    pub fn add_transaction(&self, tx: Transaction) -> MempoolResult<Hash> {
        let tx_hash = tx.hash;

        // Check for duplicate
        if self.transactions.contains_key(&tx_hash) {
            return Err(MempoolError::DuplicateTransaction(hex::encode(tx_hash)));
        }

        // Check mempool capacity
        if self.transactions.len() >= self.config.max_size {
            self.stats.write().total_rejected += 1;
            return Err(MempoolError::MempoolFull(self.config.max_size));
        }

        // Check per-sender limit
        let sender_count = self
            .by_sender
            .get(&tx.from)
            .map(|v| v.len())
            .unwrap_or(0);

        if sender_count >= self.config.max_per_sender {
            self.stats.write().total_rejected += 1;
            return Err(MempoolError::SenderLimitExceeded {
                sender: hex::encode(tx.from.0),
                count: sender_count,
                max: self.config.max_per_sender,
            });
        }

        // SECURITY: Verify signature FIRST (before any state lookups).
        // This prevents mempool flooding with invalid transactions that
        // would otherwise trigger expensive state reads for nonce validation.
        verify_transaction(&tx).map_err(|_| MempoolError::InvalidSignature)?;

        // Verify nonce (use checked arithmetic to prevent overflow)
        let current_nonce = self.state.get_nonce(&tx.from);
        let next_nonce = current_nonce.checked_add(1).ok_or_else(|| {
            self.stats.write().total_rejected += 1;
            MempoolError::InvalidNonce {
                expected: current_nonce,
                got: tx.nonce,
            }
        })?;
        if tx.nonce != next_nonce {
            // Allow some gap for pending transactions
            let pending_count = self
                .by_sender
                .get(&tx.from)
                .map(|v| v.len())
                .unwrap_or(0);
            let expected_nonce = next_nonce.saturating_add(pending_count as u64);

            if tx.nonce > expected_nonce.saturating_add(10) {
                // Too far ahead
                self.stats.write().total_rejected += 1;
                return Err(MempoolError::InvalidNonce {
                    expected: expected_nonce,
                    got: tx.nonce,
                });
            }
        }

        // Create pending transaction
        let pending = PendingTx::new(tx.clone());

        // Add to data structures
        self.transactions.insert(tx_hash, pending.clone());

        self.by_sender
            .entry(tx.from)
            .or_insert_with(Vec::new)
            .push(tx_hash);

        self.priority_queue.write().push(pending);

        self.stats.write().total_received += 1;

        debug!("Added transaction {} to mempool", hex::encode(tx_hash));
        Ok(tx_hash)
    }

    /// Get a batch of transactions for block production
    pub fn get_batch(&self, max_size: Option<usize>) -> Vec<Transaction> {
        let batch_size = max_size.unwrap_or(self.config.batch_size);
        let mut batch = Vec::with_capacity(batch_size);

        let mut queue = self.priority_queue.write();

        while batch.len() < batch_size {
            if let Some(pending) = queue.pop() {
                // Verify transaction is still valid
                if self.transactions.contains_key(&pending.transaction.hash) {
                    batch.push(pending.transaction);
                }
            } else {
                break;
            }
        }

        info!("Created batch of {} transactions", batch.len());
        batch
    }

    /// Remove transactions that have been included in a block
    pub fn remove_transactions(&self, tx_hashes: &[Hash]) {
        for hash in tx_hashes {
            if let Some((_, pending)) = self.transactions.remove(hash) {
                // Remove from sender index
                if let Some(mut sender_txs) = self.by_sender.get_mut(&pending.transaction.from) {
                    sender_txs.retain(|h| h != hash);
                }

                self.stats.write().total_included += 1;
            }
        }

        debug!("Removed {} transactions from mempool", tx_hashes.len());
    }

    /// Remove expired transactions
    pub fn remove_expired(&self) {
        let expiration = chrono::Duration::seconds(self.config.expiration_secs as i64);
        let now = Utc::now();
        let mut expired = Vec::new();

        for entry in self.transactions.iter() {
            if now - entry.value().received_at > expiration {
                expired.push(*entry.key());
            }
        }

        for hash in &expired {
            self.transactions.remove(hash);
        }

        if !expired.is_empty() {
            self.stats.write().total_expired += expired.len() as u64;
            info!("Removed {} expired transactions", expired.len());
        }
    }

    /// Get a transaction by hash
    pub fn get_transaction(&self, hash: &Hash) -> Option<Transaction> {
        self.transactions
            .get(hash)
            .map(|p| p.transaction.clone())
    }

    /// Check if transaction exists
    pub fn contains(&self, hash: &Hash) -> bool {
        self.transactions.contains_key(hash)
    }

    /// Get pending transactions for an address
    pub fn get_pending_for_address(&self, address: &Address) -> Vec<Transaction> {
        self.by_sender
            .get(address)
            .map(|hashes| {
                hashes
                    .iter()
                    .filter_map(|h| self.transactions.get(h).map(|p| p.transaction.clone()))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get mempool size
    pub fn size(&self) -> usize {
        self.transactions.len()
    }

    /// Get statistics
    pub fn stats(&self) -> MempoolStats {
        self.stats.read().clone()
    }

    /// Clear the mempool
    pub fn clear(&self) {
        self.transactions.clear();
        self.by_sender.clear();
        self.priority_queue.write().clear();
        warn!("Mempool cleared");
    }

    /// Rebuild priority queue (call after removing transactions)
    pub fn rebuild_priority_queue(&self) {
        let mut queue = self.priority_queue.write();
        queue.clear();

        for entry in self.transactions.iter() {
            queue.push(entry.value().clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use gold_core::{TransactionPayload, TransferPayload};
    use gold_crypto::Keypair;

    fn create_test_mempool() -> Mempool {
        let state = Arc::new(StateManager::new());
        Mempool::new(MempoolConfig::default(), state)
    }

    fn create_signed_tx(keypair: &Keypair, nonce: u64) -> Transaction {
        let mut tx = Transaction::new(
            keypair.address(),
            keypair.public_key(),
            nonce,
            TransactionPayload::Transfer(TransferPayload {
                to: Address([2u8; 32]),
                amount: 1000,
                memo: None,
            }),
        );
        let signature = keypair.sign(&tx.signing_message());
        tx.set_signature(signature);
        tx
    }

    #[test]
    fn test_add_transaction() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        // Create account in state
        mempool.state.get_or_create_account(keypair.address());

        let tx = create_signed_tx(&keypair, 1);
        let result = mempool.add_transaction(tx);

        assert!(result.is_ok());
        assert_eq!(mempool.size(), 1);
    }

    #[test]
    fn test_duplicate_transaction() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        mempool.state.get_or_create_account(keypair.address());

        let tx = create_signed_tx(&keypair, 1);
        mempool.add_transaction(tx.clone()).unwrap();

        let result = mempool.add_transaction(tx);
        assert!(matches!(result, Err(MempoolError::DuplicateTransaction(_))));
    }

    #[test]
    fn test_get_batch() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        mempool.state.get_or_create_account(keypair.address());

        // Add multiple transactions
        for i in 1..=10 {
            let tx = create_signed_tx(&keypair, i);
            mempool.add_transaction(tx).unwrap();
        }

        let batch = mempool.get_batch(Some(5));
        assert_eq!(batch.len(), 5);
    }

    #[test]
    fn test_remove_transactions() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        mempool.state.get_or_create_account(keypair.address());

        let tx = create_signed_tx(&keypair, 1);
        let hash = tx.hash;
        mempool.add_transaction(tx).unwrap();

        assert_eq!(mempool.size(), 1);

        mempool.remove_transactions(&[hash]);
        assert_eq!(mempool.size(), 0);
    }

    #[test]
    fn test_per_account_limit() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        // Create account in state
        mempool.state.get_or_create_account(keypair.address());

        // Fill up to the per-account limit (20)
        for i in 1..=20 {
            let tx = create_signed_tx(&keypair, i);
            assert!(mempool.add_transaction(tx).is_ok(), "Tx {} should succeed", i);
        }

        // 21st transaction from same sender should be rejected
        let tx_21 = create_signed_tx(&keypair, 21);
        let result = mempool.add_transaction(tx_21);
        assert!(result.is_err());

        // Different sender should still be allowed
        let keypair2 = Keypair::generate();
        mempool.state.get_or_create_account(keypair2.address());
        let tx_other = create_signed_tx(&keypair2, 1);
        assert!(mempool.add_transaction(tx_other).is_ok());
    }

    #[test]
    fn test_pending_for_address() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        mempool.state.get_or_create_account(keypair.address());

        for i in 1..=3 {
            let tx = create_signed_tx(&keypair, i);
            mempool.add_transaction(tx).unwrap();
        }

        let pending = mempool.get_pending_for_address(&keypair.address());
        assert_eq!(pending.len(), 3);
    }

    #[test]
    fn test_invalid_signature_rejected() {
        let mempool = create_test_mempool();
        let keypair = Keypair::generate();

        mempool.state.get_or_create_account(keypair.address());

        // Create a transaction with valid signature, then corrupt it
        let mut tx = create_signed_tx(&keypair, 1);
        // Corrupt the signature
        tx.signature[0] ^= 0xFF;

        let result = mempool.add_transaction(tx);
        assert!(matches!(result, Err(MempoolError::InvalidSignature)));
    }
}
