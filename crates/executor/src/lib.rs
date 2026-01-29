use chrono::Utc;
use gold_core::{
    Address, Block, BurnPayload, GoldCertificate, Hash, MintPayload, RegisterCertificatePayload,
    Transaction, TransactionPayload, TransactionReceipt, TransferPayload,
};
use gold_crypto::{compute_merkle_root, verify_transactions_parallel};
use gold_state::StateManager;
use rayon::prelude::*;
use std::sync::Arc;
use thiserror::Error;
use tracing::{debug, error, info, warn};

#[derive(Debug, Error)]
pub enum ExecutorError {
    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Insufficient balance: have {have}, need {need}")]
    InsufficientBalance { have: u128, need: u128 },

    #[error("Invalid nonce: expected {expected}, got {got}")]
    InvalidNonce { expected: u64, got: u64 },

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Certificate not found: {0}")]
    CertificateNotFound(String),

    #[error("Certificate error: {0}")]
    CertificateError(String),

    #[error("Execution failed: {0}")]
    ExecutionFailed(String),

    #[error("State error: {0}")]
    StateError(#[from] gold_state::StateError),
}

pub type ExecutorResult<T> = Result<T, ExecutorError>;

/// Transaction execution result
#[derive(Debug, Clone)]
pub struct ExecutionResult {
    pub tx_hash: Hash,
    pub success: bool,
    pub error: Option<String>,
}

/// Block execution result
#[derive(Debug)]
pub struct BlockExecutionResult {
    pub block: Block,
    pub receipts: Vec<TransactionReceipt>,
    pub successful_count: usize,
    pub failed_count: usize,
}

/// Transaction executor
pub struct Executor {
    state: Arc<StateManager>,
    producer: [u8; 32],
}

impl Executor {
    /// Create a new executor
    pub fn new(state: Arc<StateManager>, producer: [u8; 32]) -> Self {
        Self { state, producer }
    }

    /// Validate a transaction (signature and basic checks)
    pub fn validate_transaction(&self, tx: &Transaction) -> ExecutorResult<()> {
        // Verify signature
        gold_crypto::verify_transaction(tx).map_err(|_| ExecutorError::InvalidSignature)?;

        // Check admin permission for admin-only transactions
        if tx.requires_admin() && !self.state.is_admin(&tx.from) {
            return Err(ExecutorError::Unauthorized(
                "Admin privileges required".to_string(),
            ));
        }

        Ok(())
    }

    /// Validate transactions in parallel
    pub fn validate_transactions_parallel(&self, transactions: &[Transaction]) -> ExecutorResult<()> {
        // Batch signature verification
        verify_transactions_parallel(transactions).map_err(|_| ExecutorError::InvalidSignature)?;

        // Check admin permissions
        for tx in transactions {
            if tx.requires_admin() && !self.state.is_admin(&tx.from) {
                return Err(ExecutorError::Unauthorized(format!(
                    "Transaction {} requires admin privileges",
                    tx.hash_hex()
                )));
            }
        }

        Ok(())
    }

    /// Execute a single transaction
    pub fn execute_transaction(&self, tx: &Transaction) -> ExecutorResult<()> {
        // Validate
        self.validate_transaction(tx)?;

        // Check nonce
        let current_nonce = self.state.get_nonce(&tx.from);
        if tx.nonce != current_nonce + 1 {
            return Err(ExecutorError::InvalidNonce {
                expected: current_nonce + 1,
                got: tx.nonce,
            });
        }

        // Execute based on type
        match &tx.payload {
            TransactionPayload::Transfer(payload) => {
                self.execute_transfer(&tx.from, payload)?;
            }
            TransactionPayload::Mint(payload) => {
                self.execute_mint(payload)?;
            }
            TransactionPayload::Burn(payload) => {
                self.execute_burn(&tx.from, payload)?;
            }
            TransactionPayload::RegisterCertificate(payload) => {
                self.execute_register_certificate(&tx.from, payload)?;
            }
        }

        // Increment nonce
        self.state.increment_nonce(&tx.from);

        debug!("Executed transaction {}", tx.hash_hex());
        Ok(())
    }

    /// Execute a transfer
    fn execute_transfer(&self, from: &Address, payload: &TransferPayload) -> ExecutorResult<()> {
        let balance = self.state.get_balance(from);
        if balance < payload.amount {
            return Err(ExecutorError::InsufficientBalance {
                have: balance,
                need: payload.amount,
            });
        }

        self.state.transfer(from, &payload.to, payload.amount)?;

        debug!(
            "Transfer {} from {} to {}",
            payload.amount, from, payload.to
        );
        Ok(())
    }

    /// Execute a mint
    fn execute_mint(&self, payload: &MintPayload) -> ExecutorResult<()> {
        self.state
            .mint_from_certificate(&payload.certificate_id, &payload.to, payload.amount)
            .map_err(|e| ExecutorError::CertificateError(e.to_string()))?;

        info!("Minted {} tokens to {}", payload.amount, payload.to);
        Ok(())
    }

    /// Execute a burn
    fn execute_burn(&self, from: &Address, payload: &BurnPayload) -> ExecutorResult<()> {
        let balance = self.state.get_balance(from);
        if balance < payload.amount {
            return Err(ExecutorError::InsufficientBalance {
                have: balance,
                need: payload.amount,
            });
        }

        self.state.burn(from, payload.amount)?;

        info!("Burned {} tokens from {}", payload.amount, from);
        Ok(())
    }

    /// Execute certificate registration
    fn execute_register_certificate(
        &self,
        from: &Address,
        payload: &RegisterCertificatePayload,
    ) -> ExecutorResult<()> {
        // Parse issue date
        let issue_date = chrono::DateTime::parse_from_rfc3339(&payload.issue_date)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());

        let mut doc_hash = [0u8; 32];
        if let Ok(bytes) = hex::decode(&payload.document_hash) {
            if bytes.len() == 32 {
                doc_hash.copy_from_slice(&bytes);
            }
        }

        let mut certificate = GoldCertificate::new(
            payload.hsbc_reference.clone(),
            payload.gold_amount_oz,
            issue_date,
            payload.hsbc_branch.clone(),
            doc_hash,
            from.0,
        );

        certificate.notes = payload.notes.clone();

        self.state
            .register_certificate(certificate)
            .map_err(|e| ExecutorError::CertificateError(e.to_string()))?;

        info!(
            "Registered certificate {} with {} oz gold",
            payload.hsbc_reference, payload.gold_amount_oz
        );
        Ok(())
    }

    /// Execute a batch of transactions and produce a block
    pub fn execute_block(
        &self,
        transactions: Vec<Transaction>,
        previous_hash: Hash,
        height: u64,
    ) -> ExecutorResult<BlockExecutionResult> {
        // Validate all transactions in parallel
        if let Err(e) = self.validate_transactions_parallel(&transactions) {
            warn!("Batch validation failed: {}", e);
        }

        let mut receipts = Vec::with_capacity(transactions.len());
        let mut successful_txs = Vec::new();
        let mut successful_count = 0;
        let mut failed_count = 0;

        // Execute transactions sequentially (state modifications must be ordered)
        for tx in &transactions {
            let result = self.execute_transaction(tx);

            let (success, error) = match result {
                Ok(()) => {
                    successful_count += 1;
                    successful_txs.push(tx.clone());
                    (true, None)
                }
                Err(e) => {
                    failed_count += 1;
                    error!("Transaction {} failed: {}", tx.hash_hex(), e);
                    (false, Some(e.to_string()))
                }
            };

            receipts.push(TransactionReceipt {
                tx_hash: tx.hash,
                block_height: height,
                block_hash: [0u8; 32], // Will be set after block is created
                index: receipts.len() as u32,
                success,
                error,
                executed_at: Utc::now(),
            });
        }

        // Compute Merkle root from successful transactions
        let tx_hashes: Vec<Hash> = successful_txs.iter().map(|tx| tx.hash).collect();
        let merkle_root = compute_merkle_root(&tx_hashes);

        // Compute state root
        let state_root = self.state.compute_state_root();

        // Create block
        let block = Block::new(
            height,
            previous_hash,
            merkle_root,
            state_root,
            successful_txs,
            self.producer,
        );

        // Update receipts with block hash
        for receipt in &mut receipts {
            receipt.block_hash = block.hash;
        }

        // Store receipts
        for receipt in &receipts {
            self.state.store_receipt(receipt.clone());
        }

        // Update chain state
        self.state.apply_block(&block);

        info!(
            "Produced block {} with {} transactions ({} successful, {} failed)",
            height,
            transactions.len(),
            successful_count,
            failed_count
        );

        Ok(BlockExecutionResult {
            block,
            receipts,
            successful_count,
            failed_count,
        })
    }

    /// Get state reference
    pub fn state(&self) -> &Arc<StateManager> {
        &self.state
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use gold_crypto::Keypair;

    fn create_test_executor() -> (Executor, Keypair) {
        let state = Arc::new(StateManager::new());
        let admin_keypair = Keypair::generate();
        state.initialize_genesis(vec![admin_keypair.address()]);
        state.credit(&admin_keypair.address(), 1_000_000);

        let executor = Executor::new(state, admin_keypair.public_key());
        (executor, admin_keypair)
    }

    fn create_transfer_tx(keypair: &Keypair, to: Address, amount: u128, nonce: u64) -> Transaction {
        let mut tx = Transaction::new(
            keypair.address(),
            keypair.public_key(),
            nonce,
            TransactionPayload::Transfer(TransferPayload {
                to,
                amount,
                memo: None,
            }),
        );
        let signature = keypair.sign(&tx.signing_message());
        tx.set_signature(signature);
        tx
    }

    #[test]
    fn test_execute_transfer() {
        let (executor, admin) = create_test_executor();
        let recipient = Address([2u8; 32]);

        let tx = create_transfer_tx(&admin, recipient, 1000, 1);
        let result = executor.execute_transaction(&tx);

        assert!(result.is_ok());
        assert_eq!(executor.state.get_balance(&recipient), 1000);
    }

    #[test]
    fn test_insufficient_balance() {
        let (executor, admin) = create_test_executor();
        let recipient = Address([2u8; 32]);

        let tx = create_transfer_tx(&admin, recipient, 10_000_000, 1);
        let result = executor.execute_transaction(&tx);

        assert!(matches!(result, Err(ExecutorError::InsufficientBalance { .. })));
    }

    #[test]
    fn test_invalid_nonce() {
        let (executor, admin) = create_test_executor();
        let recipient = Address([2u8; 32]);

        let tx = create_transfer_tx(&admin, recipient, 1000, 5); // Wrong nonce
        let result = executor.execute_transaction(&tx);

        assert!(matches!(result, Err(ExecutorError::InvalidNonce { .. })));
    }

    #[test]
    fn test_execute_block() {
        let (executor, admin) = create_test_executor();
        let recipient = Address([2u8; 32]);

        let transactions = vec![
            create_transfer_tx(&admin, recipient, 100, 1),
            create_transfer_tx(&admin, recipient, 200, 2),
            create_transfer_tx(&admin, recipient, 300, 3),
        ];

        let result = executor.execute_block(transactions, [0u8; 32], 1);

        assert!(result.is_ok());
        let block_result = result.unwrap();
        assert_eq!(block_result.successful_count, 3);
        assert_eq!(block_result.failed_count, 0);
        assert_eq!(executor.state.get_balance(&recipient), 600);
    }

    #[test]
    fn test_mint_requires_admin() {
        let (executor, _admin) = create_test_executor();

        // Create non-admin user
        let user = Keypair::generate();
        executor.state.credit(&user.address(), 1000);

        let mut tx = Transaction::new(
            user.address(),
            user.public_key(),
            1,
            TransactionPayload::Mint(MintPayload {
                certificate_id: [0u8; 32],
                to: user.address(),
                amount: 1000,
            }),
        );
        tx.set_signature(user.sign(&tx.signing_message()));

        let result = executor.execute_transaction(&tx);
        assert!(matches!(result, Err(ExecutorError::Unauthorized(_))));
    }

    #[test]
    fn test_register_and_mint() {
        let (executor, admin) = create_test_executor();

        // Register certificate
        let mut register_tx = Transaction::new(
            admin.address(),
            admin.public_key(),
            1,
            TransactionPayload::RegisterCertificate(RegisterCertificatePayload {
                hsbc_reference: "HSBC-TEST-001".to_string(),
                gold_amount_oz: 10.0,
                issue_date: Utc::now().to_rfc3339(),
                hsbc_branch: "Test Branch".to_string(),
                document_hash: hex::encode([0u8; 32]),
                notes: None,
            }),
        );
        register_tx.set_signature(admin.sign(&register_tx.signing_message()));

        executor.execute_transaction(&register_tx).unwrap();

        // Get certificate ID
        let cert = executor
            .state
            .get_certificate_by_hsbc_ref("HSBC-TEST-001")
            .unwrap();

        // Mint tokens
        let user = Address([3u8; 32]);
        let mut mint_tx = Transaction::new(
            admin.address(),
            admin.public_key(),
            2,
            TransactionPayload::Mint(MintPayload {
                certificate_id: cert.certificate_id,
                to: user,
                amount: 1000,
            }),
        );
        mint_tx.set_signature(admin.sign(&mint_tx.signing_message()));

        executor.execute_transaction(&mint_tx).unwrap();

        assert_eq!(executor.state.get_balance(&user), 1000);
    }
}
