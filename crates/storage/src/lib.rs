use gold_core::{Block, GoldCertificate, Hash, Transaction, TransactionReceipt};
use parking_lot::RwLock;
use rocksdb::{ColumnFamilyDescriptor, Options, WriteBatch, DB};
use serde::{de::DeserializeOwned, Serialize};
use std::path::Path;
use std::sync::Arc;
use thiserror::Error;
use tracing::{debug, error, info};

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("RocksDB error: {0}")]
    RocksDb(#[from] rocksdb::Error),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("WAL error: {0}")]
    WalError(String),
}

pub type StorageResult<T> = Result<T, StorageError>;

/// Column family names
const CF_BLOCKS: &str = "blocks";
const CF_TRANSACTIONS: &str = "transactions";
const CF_RECEIPTS: &str = "receipts";
const CF_CERTIFICATES: &str = "certificates";
const CF_STATE: &str = "state";
const CF_METADATA: &str = "metadata";

/// Storage configuration
#[derive(Debug, Clone)]
pub struct StorageConfig {
    pub path: String,
    pub cache_size_mb: usize,
    pub max_open_files: i32,
    pub enable_wal: bool,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            path: "data/blockchain".to_string(),
            cache_size_mb: 256,
            max_open_files: 1000,
            enable_wal: true,
        }
    }
}

/// Persistent storage using RocksDB
pub struct Storage {
    db: Arc<DB>,
    config: StorageConfig,
    wal: Option<Arc<RwLock<WriteAheadLog>>>,
}

impl Storage {
    /// Open or create the storage
    pub fn open(config: StorageConfig) -> StorageResult<Self> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        opts.create_missing_column_families(true);
        opts.set_max_open_files(config.max_open_files);

        // Set block cache
        let cache_size = config.cache_size_mb * 1024 * 1024;
        let mut block_opts = rocksdb::BlockBasedOptions::default();
        block_opts.set_block_cache(&rocksdb::Cache::new_lru_cache(cache_size));
        opts.set_block_based_table_factory(&block_opts);

        // Define column families
        let cf_descriptors = vec![
            ColumnFamilyDescriptor::new(CF_BLOCKS, Options::default()),
            ColumnFamilyDescriptor::new(CF_TRANSACTIONS, Options::default()),
            ColumnFamilyDescriptor::new(CF_RECEIPTS, Options::default()),
            ColumnFamilyDescriptor::new(CF_CERTIFICATES, Options::default()),
            ColumnFamilyDescriptor::new(CF_STATE, Options::default()),
            ColumnFamilyDescriptor::new(CF_METADATA, Options::default()),
        ];

        let db = DB::open_cf_descriptors(&opts, &config.path, cf_descriptors)?;

        let wal = if config.enable_wal {
            let wal_path = format!("{}/wal", config.path);
            Some(Arc::new(RwLock::new(WriteAheadLog::new(&wal_path)?)))
        } else {
            None
        };

        info!("Storage opened at {}", config.path);

        Ok(Self {
            db: Arc::new(db),
            config,
            wal,
        })
    }

    /// Store a block
    pub fn put_block(&self, block: &Block) -> StorageResult<()> {
        let cf = self.db.cf_handle(CF_BLOCKS).unwrap();

        // Key by height for sequential access
        let key = block.header.height.to_be_bytes();
        let value = serde_json::to_vec(block)
            .map_err(|e| StorageError::Serialization(e.to_string()))?;

        // Write to WAL first
        if let Some(wal) = &self.wal {
            wal.write().append(&WalEntry::Block(block.clone()))?;
        }

        self.db.put_cf(&cf, key, value)?;

        // Also index by hash
        let hash_key = block.hash;
        self.db.put_cf(&cf, hash_key, key)?;

        debug!("Stored block {} at height {}", hex::encode(block.hash), block.header.height);
        Ok(())
    }

    /// Get a block by height
    pub fn get_block_by_height(&self, height: u64) -> StorageResult<Option<Block>> {
        let cf = self.db.cf_handle(CF_BLOCKS).unwrap();
        let key = height.to_be_bytes();

        match self.db.get_cf(&cf, key)? {
            Some(value) => {
                let block: Block = serde_json::from_slice(&value)
                    .map_err(|e| StorageError::Serialization(e.to_string()))?;
                Ok(Some(block))
            }
            None => Ok(None),
        }
    }

    /// Get a block by hash
    pub fn get_block_by_hash(&self, hash: &Hash) -> StorageResult<Option<Block>> {
        let cf = self.db.cf_handle(CF_BLOCKS).unwrap();

        // First get height from hash index
        match self.db.get_cf(&cf, hash)? {
            Some(height_bytes) => {
                let height = u64::from_be_bytes(height_bytes.try_into().unwrap_or([0; 8]));
                self.get_block_by_height(height)
            }
            None => Ok(None),
        }
    }

    /// Get blocks in a range
    pub fn get_blocks(&self, start: u64, end: u64) -> StorageResult<Vec<Block>> {
        let mut blocks = Vec::new();
        for height in start..=end {
            if let Some(block) = self.get_block_by_height(height)? {
                blocks.push(block);
            }
        }
        Ok(blocks)
    }

    /// Store a transaction
    pub fn put_transaction(&self, tx: &Transaction) -> StorageResult<()> {
        let cf = self.db.cf_handle(CF_TRANSACTIONS).unwrap();
        let key = tx.hash;
        let value = serde_json::to_vec(tx)
            .map_err(|e| StorageError::Serialization(e.to_string()))?;

        self.db.put_cf(&cf, key, value)?;
        debug!("Stored transaction {}", hex::encode(tx.hash));
        Ok(())
    }

    /// Get a transaction by hash
    pub fn get_transaction(&self, hash: &Hash) -> StorageResult<Option<Transaction>> {
        let cf = self.db.cf_handle(CF_TRANSACTIONS).unwrap();

        match self.db.get_cf(&cf, hash)? {
            Some(value) => {
                let tx: Transaction = serde_json::from_slice(&value)
                    .map_err(|e| StorageError::Serialization(e.to_string()))?;
                Ok(Some(tx))
            }
            None => Ok(None),
        }
    }

    /// Store a transaction receipt
    pub fn put_receipt(&self, receipt: &TransactionReceipt) -> StorageResult<()> {
        let cf = self.db.cf_handle(CF_RECEIPTS).unwrap();
        let key = receipt.tx_hash;
        let value = serde_json::to_vec(receipt)
            .map_err(|e| StorageError::Serialization(e.to_string()))?;

        self.db.put_cf(&cf, key, value)?;
        Ok(())
    }

    /// Get a transaction receipt
    pub fn get_receipt(&self, tx_hash: &Hash) -> StorageResult<Option<TransactionReceipt>> {
        let cf = self.db.cf_handle(CF_RECEIPTS).unwrap();

        match self.db.get_cf(&cf, tx_hash)? {
            Some(value) => {
                let receipt: TransactionReceipt = serde_json::from_slice(&value)
                    .map_err(|e| StorageError::Serialization(e.to_string()))?;
                Ok(Some(receipt))
            }
            None => Ok(None),
        }
    }

    /// Store a certificate
    pub fn put_certificate(&self, cert: &GoldCertificate) -> StorageResult<()> {
        let cf = self.db.cf_handle(CF_CERTIFICATES).unwrap();
        let key = cert.certificate_id;
        let value = serde_json::to_vec(cert)
            .map_err(|e| StorageError::Serialization(e.to_string()))?;

        self.db.put_cf(&cf, key, value)?;
        info!("Stored certificate {}", hex::encode(cert.certificate_id));
        Ok(())
    }

    /// Get a certificate
    pub fn get_certificate(&self, cert_id: &Hash) -> StorageResult<Option<GoldCertificate>> {
        let cf = self.db.cf_handle(CF_CERTIFICATES).unwrap();

        match self.db.get_cf(&cf, cert_id)? {
            Some(value) => {
                let cert: GoldCertificate = serde_json::from_slice(&value)
                    .map_err(|e| StorageError::Serialization(e.to_string()))?;
                Ok(Some(cert))
            }
            None => Ok(None),
        }
    }

    /// Get all certificates
    pub fn get_all_certificates(&self) -> StorageResult<Vec<GoldCertificate>> {
        let cf = self.db.cf_handle(CF_CERTIFICATES).unwrap();
        let iter = self.db.iterator_cf(&cf, rocksdb::IteratorMode::Start);

        let mut certs = Vec::new();
        for item in iter {
            let (_, value) = item?;
            let cert: GoldCertificate = serde_json::from_slice(&value)
                .map_err(|e| StorageError::Serialization(e.to_string()))?;
            certs.push(cert);
        }

        Ok(certs)
    }

    /// Store metadata
    pub fn put_metadata(&self, key: &str, value: &impl Serialize) -> StorageResult<()> {
        let cf = self.db.cf_handle(CF_METADATA).unwrap();
        let value = serde_json::to_vec(value)
            .map_err(|e| StorageError::Serialization(e.to_string()))?;

        self.db.put_cf(&cf, key.as_bytes(), value)?;
        Ok(())
    }

    /// Get metadata
    pub fn get_metadata<T: DeserializeOwned>(&self, key: &str) -> StorageResult<Option<T>> {
        let cf = self.db.cf_handle(CF_METADATA).unwrap();

        match self.db.get_cf(&cf, key.as_bytes())? {
            Some(value) => {
                let data: T = serde_json::from_slice(&value)
                    .map_err(|e| StorageError::Serialization(e.to_string()))?;
                Ok(Some(data))
            }
            None => Ok(None),
        }
    }

    /// Batch write operations
    pub fn write_batch(&self, operations: Vec<BatchOperation>) -> StorageResult<()> {
        let mut batch = WriteBatch::default();

        for op in operations {
            match op {
                BatchOperation::PutBlock(block) => {
                    let cf = self.db.cf_handle(CF_BLOCKS).unwrap();
                    let key = block.header.height.to_be_bytes();
                    let value = serde_json::to_vec(&block)
                        .map_err(|e| StorageError::Serialization(e.to_string()))?;
                    batch.put_cf(&cf, key, &value);
                    batch.put_cf(&cf, block.hash, key);

                    // Also store transactions
                    let tx_cf = self.db.cf_handle(CF_TRANSACTIONS).unwrap();
                    for tx in &block.transactions {
                        let tx_value = serde_json::to_vec(tx)
                            .map_err(|e| StorageError::Serialization(e.to_string()))?;
                        batch.put_cf(&tx_cf, tx.hash, &tx_value);
                    }
                }
                BatchOperation::PutReceipt(receipt) => {
                    let cf = self.db.cf_handle(CF_RECEIPTS).unwrap();
                    let value = serde_json::to_vec(&receipt)
                        .map_err(|e| StorageError::Serialization(e.to_string()))?;
                    batch.put_cf(&cf, receipt.tx_hash, &value);
                }
                BatchOperation::PutCertificate(cert) => {
                    let cf = self.db.cf_handle(CF_CERTIFICATES).unwrap();
                    let value = serde_json::to_vec(&cert)
                        .map_err(|e| StorageError::Serialization(e.to_string()))?;
                    batch.put_cf(&cf, cert.certificate_id, &value);
                }
            }
        }

        // Write to WAL first
        if let Some(wal) = &self.wal {
            wal.write().sync()?;
        }

        self.db.write(batch)?;
        Ok(())
    }

    /// Get latest block height
    pub fn get_latest_height(&self) -> StorageResult<Option<u64>> {
        self.get_metadata::<u64>("latest_height")
    }

    /// Set latest block height
    pub fn set_latest_height(&self, height: u64) -> StorageResult<()> {
        self.put_metadata("latest_height", &height)
    }

    /// Flush to disk
    pub fn flush(&self) -> StorageResult<()> {
        self.db.flush()?;
        if let Some(wal) = &self.wal {
            wal.write().sync()?;
        }
        Ok(())
    }
}

/// Batch operations for atomic writes
pub enum BatchOperation {
    PutBlock(Block),
    PutReceipt(TransactionReceipt),
    PutCertificate(GoldCertificate),
}

/// WAL entry types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum WalEntry {
    Block(Block),
    Receipt(TransactionReceipt),
    Certificate(GoldCertificate),
}

/// Simple write-ahead log
pub struct WriteAheadLog {
    path: String,
    file: Option<std::fs::File>,
}

impl WriteAheadLog {
    pub fn new(path: &str) -> StorageResult<Self> {
        std::fs::create_dir_all(path)
            .map_err(|e| StorageError::WalError(e.to_string()))?;

        let file_path = format!("{}/wal.log", path);
        let file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&file_path)
            .map_err(|e| StorageError::WalError(e.to_string()))?;

        Ok(Self {
            path: path.to_string(),
            file: Some(file),
        })
    }

    pub fn append(&mut self, entry: &WalEntry) -> StorageResult<()> {
        use std::io::Write;

        if let Some(file) = &mut self.file {
            let data = serde_json::to_vec(entry)
                .map_err(|e| StorageError::Serialization(e.to_string()))?;

            // Write length prefix
            let len = data.len() as u32;
            file.write_all(&len.to_le_bytes())
                .map_err(|e| StorageError::WalError(e.to_string()))?;

            // Write data
            file.write_all(&data)
                .map_err(|e| StorageError::WalError(e.to_string()))?;
        }

        Ok(())
    }

    pub fn sync(&mut self) -> StorageResult<()> {
        if let Some(file) = &mut self.file {
            file.sync_all()
                .map_err(|e| StorageError::WalError(e.to_string()))?;
        }
        Ok(())
    }

    pub fn truncate(&mut self) -> StorageResult<()> {
        let file_path = format!("{}/wal.log", self.path);
        self.file = Some(
            std::fs::OpenOptions::new()
                .create(true)
                .write(true)
                .truncate(true)
                .open(&file_path)
                .map_err(|e| StorageError::WalError(e.to_string()))?,
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn create_test_storage() -> Storage {
        let dir = tempdir().unwrap();
        let config = StorageConfig {
            path: dir.path().to_str().unwrap().to_string(),
            enable_wal: false,
            ..Default::default()
        };
        Storage::open(config).unwrap()
    }

    #[test]
    fn test_block_storage() {
        let storage = create_test_storage();
        let block = Block::genesis([0u8; 32]);

        storage.put_block(&block).unwrap();

        let retrieved = storage.get_block_by_height(0).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().hash, block.hash);
    }

    #[test]
    fn test_block_by_hash() {
        let storage = create_test_storage();
        let block = Block::genesis([0u8; 32]);
        let hash = block.hash;

        storage.put_block(&block).unwrap();

        let retrieved = storage.get_block_by_hash(&hash).unwrap();
        assert!(retrieved.is_some());
    }

    #[test]
    fn test_metadata() {
        let storage = create_test_storage();

        storage.put_metadata("test_key", &42u64).unwrap();

        let value: Option<u64> = storage.get_metadata("test_key").unwrap();
        assert_eq!(value, Some(42));
    }

    #[test]
    fn test_certificate_storage() {
        let storage = create_test_storage();
        let cert = GoldCertificate::new(
            "HSBC-001".to_string(),
            10.0,
            chrono::Utc::now(),
            "Test".to_string(),
            [0u8; 32],
            [1u8; 32],
        )
        .unwrap();
        let cert_id = cert.certificate_id;

        storage.put_certificate(&cert).unwrap();

        let retrieved = storage.get_certificate(&cert_id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().hsbc_reference, "HSBC-001");
    }
}
