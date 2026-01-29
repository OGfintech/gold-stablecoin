use gold_core::{Block, Hash, Transaction};
use gold_crypto::Keypair;
use gold_executor::{BlockExecutionResult, Executor};
use gold_mempool::Mempool;
use gold_state::StateManager;
use parking_lot::RwLock;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tokio::sync::mpsc;
use tokio::time::interval;
use tracing::{debug, error, info, warn};

#[derive(Debug, Error)]
pub enum ConsensusError {
    #[error("Invalid block: {0}")]
    InvalidBlock(String),

    #[error("Consensus timeout")]
    Timeout,

    #[error("Not leader")]
    NotLeader,

    #[error("Execution error: {0}")]
    ExecutionError(#[from] gold_executor::ExecutorError),
}

pub type ConsensusResult<T> = Result<T, ConsensusError>;

/// PBFT message types
#[derive(Debug, Clone)]
pub enum PbftMessage {
    PrePrepare {
        view: u64,
        sequence: u64,
        block: Block,
    },
    Prepare {
        view: u64,
        sequence: u64,
        block_hash: Hash,
        node_id: [u8; 32],
    },
    Commit {
        view: u64,
        sequence: u64,
        block_hash: Hash,
        node_id: [u8; 32],
    },
}

/// PBFT consensus state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PbftState {
    Idle,
    PrePrepared,
    Prepared,
    Committed,
}

/// Consensus configuration
#[derive(Debug, Clone)]
pub struct ConsensusConfig {
    /// Block production interval
    pub block_interval: Duration,
    /// Minimum transactions per block
    pub min_transactions: usize,
    /// Maximum transactions per block
    pub max_transactions: usize,
    /// Whether this node is the leader (single-node mode)
    pub is_leader: bool,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            block_interval: Duration::from_millis(100), // 100ms for high TPS
            min_transactions: 0,
            max_transactions: 50_000,
            is_leader: true, // Single node mode
        }
    }
}

/// Block production metrics
#[derive(Debug, Default, Clone)]
pub struct ConsensusMetrics {
    pub blocks_produced: u64,
    pub total_transactions: u64,
    pub last_block_time: Option<chrono::DateTime<chrono::Utc>>,
    pub average_block_time_ms: f64,
    pub current_tps: f64,
}

/// Simplified PBFT consensus engine for single-node operation
/// In single-node mode, we use fast path (skip prepare/commit phases)
pub struct PbftConsensus {
    config: ConsensusConfig,
    state: Arc<StateManager>,
    mempool: Arc<Mempool>,
    executor: Arc<Executor>,
    keypair: Keypair,

    /// Current consensus state
    pbft_state: Arc<RwLock<PbftState>>,

    /// Current view number
    view: Arc<RwLock<u64>>,

    /// Block chain (in-memory for now)
    blocks: Arc<RwLock<Vec<Block>>>,

    /// Metrics
    metrics: Arc<RwLock<ConsensusMetrics>>,

    /// Shutdown signal
    shutdown: Arc<RwLock<bool>>,
}

impl PbftConsensus {
    /// Create a new PBFT consensus engine
    pub fn new(
        config: ConsensusConfig,
        state: Arc<StateManager>,
        mempool: Arc<Mempool>,
        keypair: Keypair,
    ) -> Self {
        let producer = keypair.public_key();
        let executor = Arc::new(Executor::new(state.clone(), producer));

        // Create genesis block
        let genesis = Block::genesis(producer);
        let blocks = Arc::new(RwLock::new(vec![genesis]));

        Self {
            config,
            state,
            mempool,
            executor,
            keypair,
            pbft_state: Arc::new(RwLock::new(PbftState::Idle)),
            view: Arc::new(RwLock::new(0)),
            blocks,
            metrics: Arc::new(RwLock::new(ConsensusMetrics::default())),
            shutdown: Arc::new(RwLock::new(false)),
        }
    }

    /// Start the consensus engine
    pub async fn start(&self, block_tx: mpsc::Sender<Block>) {
        info!("Starting PBFT consensus engine");

        let mut interval = interval(self.config.block_interval);

        loop {
            interval.tick().await;

            if *self.shutdown.read() {
                info!("Consensus engine shutting down");
                break;
            }

            // Produce block if we're the leader
            if self.config.is_leader {
                match self.produce_block().await {
                    Ok(Some(block)) => {
                        // Send block to subscribers
                        if let Err(e) = block_tx.send(block.clone()).await {
                            error!("Failed to send block: {}", e);
                        }
                    }
                    Ok(None) => {
                        // No transactions to process
                        debug!("No transactions in mempool");
                    }
                    Err(e) => {
                        error!("Block production failed: {}", e);
                    }
                }
            }
        }
    }

    /// Produce a new block (fast path for single node)
    pub async fn produce_block(&self) -> ConsensusResult<Option<Block>> {
        let start_time = std::time::Instant::now();

        // Get transactions from mempool
        let transactions = self.mempool.get_batch(Some(self.config.max_transactions));

        if transactions.is_empty() && self.config.min_transactions > 0 {
            return Ok(None);
        }

        // Get previous block info
        let (previous_hash, height) = {
            let blocks = self.blocks.read();
            let last = blocks.last().unwrap();
            (last.hash, last.header.height + 1)
        };

        // Execute transactions and produce block
        let result = self.executor.execute_block(transactions.clone(), previous_hash, height)?;

        // Remove processed transactions from mempool
        let tx_hashes: Vec<Hash> = transactions.iter().map(|tx| tx.hash).collect();
        self.mempool.remove_transactions(&tx_hashes);

        // Sign the block
        let mut block = result.block;
        let signature = self.keypair.sign(&block.header.signing_message());
        block.set_signature(signature);

        // Store block
        {
            let mut blocks = self.blocks.write();
            blocks.push(block.clone());
        }

        // Update metrics
        {
            let mut metrics = self.metrics.write();
            metrics.blocks_produced += 1;
            metrics.total_transactions += result.successful_count as u64;
            metrics.last_block_time = Some(chrono::Utc::now());

            let elapsed = start_time.elapsed().as_millis() as f64;
            metrics.average_block_time_ms =
                (metrics.average_block_time_ms * (metrics.blocks_produced - 1) as f64 + elapsed)
                    / metrics.blocks_produced as f64;

            if elapsed > 0.0 {
                metrics.current_tps = (result.successful_count as f64 / elapsed) * 1000.0;
            }
        }

        info!(
            "Produced block {} with {} transactions in {:?}",
            height,
            result.successful_count,
            start_time.elapsed()
        );

        Ok(Some(block))
    }

    /// Manually trigger block production
    pub fn force_produce_block(&self) -> ConsensusResult<Option<Block>> {
        // Get transactions from mempool
        let transactions = self.mempool.get_batch(Some(self.config.max_transactions));

        if transactions.is_empty() {
            return Ok(None);
        }

        // Get previous block info
        let (previous_hash, height) = {
            let blocks = self.blocks.read();
            let last = blocks.last().unwrap();
            (last.hash, last.header.height + 1)
        };

        // Execute transactions and produce block
        let result = self.executor.execute_block(transactions.clone(), previous_hash, height)?;

        // Remove processed transactions from mempool
        let tx_hashes: Vec<Hash> = transactions.iter().map(|tx| tx.hash).collect();
        self.mempool.remove_transactions(&tx_hashes);

        // Sign the block
        let mut block = result.block;
        let signature = self.keypair.sign(&block.header.signing_message());
        block.set_signature(signature);

        // Store block
        {
            let mut blocks = self.blocks.write();
            blocks.push(block.clone());
        }

        // Update metrics
        {
            let mut metrics = self.metrics.write();
            metrics.blocks_produced += 1;
            metrics.total_transactions += result.successful_count as u64;
        }

        Ok(Some(block))
    }

    /// Get a block by height
    pub fn get_block(&self, height: u64) -> Option<Block> {
        let blocks = self.blocks.read();
        blocks.get(height as usize).cloned()
    }

    /// Get the latest block
    pub fn latest_block(&self) -> Block {
        let blocks = self.blocks.read();
        blocks.last().cloned().unwrap()
    }

    /// Get recent blocks
    pub fn recent_blocks(&self, count: usize) -> Vec<Block> {
        let blocks = self.blocks.read();
        blocks.iter().rev().take(count).cloned().collect()
    }

    /// Get current height
    pub fn height(&self) -> u64 {
        self.blocks.read().len() as u64 - 1
    }

    /// Get metrics
    pub fn metrics(&self) -> ConsensusMetrics {
        self.metrics.read().clone()
    }

    /// Get state manager
    pub fn state(&self) -> &Arc<StateManager> {
        &self.state
    }

    /// Get mempool
    pub fn mempool(&self) -> &Arc<Mempool> {
        &self.mempool
    }

    /// Get executor
    pub fn executor(&self) -> &Arc<Executor> {
        &self.executor
    }

    /// Stop the consensus engine
    pub fn shutdown(&self) {
        *self.shutdown.write() = true;
    }

    /// Submit a transaction
    pub fn submit_transaction(&self, tx: Transaction) -> Result<Hash, gold_mempool::MempoolError> {
        self.mempool.add_transaction(tx)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use gold_core::{Address, TransactionPayload, TransferPayload};
    use gold_mempool::MempoolConfig;

    fn create_test_consensus() -> PbftConsensus {
        let state = Arc::new(StateManager::new());
        let keypair = Keypair::generate();
        state.initialize_genesis(vec![keypair.address()]);
        state.credit(&keypair.address(), 1_000_000);

        let mempool = Arc::new(Mempool::new(MempoolConfig::default(), state.clone()));

        PbftConsensus::new(
            ConsensusConfig {
                min_transactions: 0,
                ..Default::default()
            },
            state,
            mempool,
            keypair,
        )
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
    fn test_genesis_block() {
        let consensus = create_test_consensus();
        assert_eq!(consensus.height(), 0);

        let genesis = consensus.get_block(0).unwrap();
        assert_eq!(genesis.header.height, 0);
    }

    #[test]
    fn test_produce_empty_block() {
        let consensus = create_test_consensus();
        let result = consensus.force_produce_block().unwrap();
        assert!(result.is_none()); // No transactions
    }

    #[test]
    fn test_produce_block_with_transactions() {
        let consensus = create_test_consensus();
        let keypair = Keypair::generate();

        // Fund the account
        consensus.state.credit(&keypair.address(), 10000);

        let recipient = Address([2u8; 32]);
        let tx = create_transfer_tx(&keypair, recipient, 1000, 1);

        consensus.submit_transaction(tx).unwrap();

        let result = consensus.force_produce_block().unwrap();
        assert!(result.is_some());

        let block = result.unwrap();
        assert_eq!(block.header.height, 1);
        assert_eq!(block.transactions.len(), 1);
    }

    #[test]
    fn test_metrics() {
        let consensus = create_test_consensus();
        let keypair = Keypair::generate();

        consensus.state.credit(&keypair.address(), 10000);

        let tx = create_transfer_tx(&keypair, Address([2u8; 32]), 1000, 1);
        consensus.submit_transaction(tx).unwrap();
        consensus.force_produce_block().unwrap();

        let metrics = consensus.metrics();
        assert_eq!(metrics.blocks_produced, 1);
        assert_eq!(metrics.total_transactions, 1);
    }
}
