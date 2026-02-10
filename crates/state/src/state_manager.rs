use crate::{Account, AccountSummary, CertificateRegistry, CertificateStats, StateError, StateResult};
use dashmap::DashMap;
use gold_core::{
    Address, Block, CertificateSummary, GoldCertificate, Hash, TokenAmount, Transaction,
    TransactionReceipt,
};
use gold_crypto::sha256;
use parking_lot::RwLock;
use std::sync::Arc;
use tracing::{debug, info};

/// Global state manager
#[derive(Debug)]
pub struct StateManager {
    /// Account balances
    accounts: DashMap<Address, Account>,

    /// Certificate registry
    certificates: CertificateRegistry,

    /// Admin addresses
    admins: DashMap<Address, bool>,

    /// Chain state
    chain_state: Arc<RwLock<ChainState>>,

    /// Transaction receipts
    receipts: DashMap<Hash, TransactionReceipt>,
}

/// Chain state
#[derive(Debug, Default, Clone)]
pub struct ChainState {
    pub height: u64,
    pub latest_block_hash: Hash,
    pub total_supply: TokenAmount,
    pub total_transactions: u64,
}

impl StateManager {
    /// Create a new state manager
    pub fn new() -> Self {
        Self {
            accounts: DashMap::new(),
            certificates: CertificateRegistry::new(),
            admins: DashMap::new(),
            chain_state: Arc::new(RwLock::new(ChainState::default())),
            receipts: DashMap::new(),
        }
    }

    /// Initialize with genesis state
    pub fn initialize_genesis(&self, admin_addresses: Vec<Address>) {
        for addr in admin_addresses {
            let account = Account::new_admin(addr);
            self.accounts.insert(addr, account);
            self.admins.insert(addr, true);
            info!("Initialized admin account: {}", addr);
        }
    }

    /// Add an admin address
    pub fn add_admin(&self, address: Address) {
        self.admins.insert(address, true);
        if let Some(mut account) = self.accounts.get_mut(&address) {
            account.is_admin = true;
        } else {
            let account = Account::new_admin(address);
            self.accounts.insert(address, account);
        }
    }

    /// Check if an address is an admin
    pub fn is_admin(&self, address: &Address) -> bool {
        self.admins.contains_key(address)
    }

    /// Get or create an account
    pub fn get_or_create_account(&self, address: Address) -> Account {
        self.accounts
            .entry(address)
            .or_insert_with(|| Account::new(address))
            .clone()
    }

    /// Get account balance
    pub fn get_balance(&self, address: &Address) -> TokenAmount {
        self.accounts
            .get(address)
            .map(|a| a.balance)
            .unwrap_or(0)
    }

    /// Get account nonce
    pub fn get_nonce(&self, address: &Address) -> u64 {
        self.accounts
            .get(address)
            .map(|a| a.nonce)
            .unwrap_or(0)
    }

    /// Get account summary
    pub fn get_account_summary(&self, address: &Address) -> Option<AccountSummary> {
        self.accounts.get(address).map(|a| AccountSummary::from(&*a))
    }

    /// Credit tokens to an account
    pub fn credit(&self, address: &Address, amount: TokenAmount) {
        self.accounts
            .entry(*address)
            .or_insert_with(|| Account::new(*address))
            .credit(amount);

        debug!("Credited {} to {}", amount, address);
    }

    /// Debit tokens from an account
    pub fn debit(&self, address: &Address, amount: TokenAmount) -> StateResult<()> {
        let mut account = self
            .accounts
            .get_mut(address)
            .ok_or_else(|| StateError::AccountNotFound(address.to_hex()))?;

        account.debit(amount)?;
        debug!("Debited {} from {}", amount, address);
        Ok(())
    }

    /// Transfer tokens between accounts
    pub fn transfer(&self, from: &Address, to: &Address, amount: TokenAmount) -> StateResult<()> {
        // Debit from sender
        self.debit(from, amount)?;

        // Credit to receiver
        self.credit(to, amount);

        debug!("Transferred {} from {} to {}", amount, from, to);
        Ok(())
    }

    /// Increment account nonce
    pub fn increment_nonce(&self, address: &Address) -> StateResult<()> {
        if let Some(mut account) = self.accounts.get_mut(address) {
            account.increment_nonce()?;
        }
        Ok(())
    }

    /// Check nonce validity
    pub fn check_nonce(&self, address: &Address, nonce: u64) -> StateResult<()> {
        let account = self
            .accounts
            .get(address)
            .ok_or_else(|| StateError::AccountNotFound(address.to_hex()))?;

        account.check_nonce(nonce)
    }

    /// Register a certificate
    pub fn register_certificate(&self, certificate: GoldCertificate) -> StateResult<Hash> {
        self.certificates.register(certificate)
    }

    /// Get a certificate
    pub fn get_certificate(&self, cert_id: &Hash) -> Option<GoldCertificate> {
        self.certificates.get(cert_id)
    }

    /// Get certificate by HSBC reference
    pub fn get_certificate_by_hsbc_ref(&self, hsbc_ref: &str) -> Option<GoldCertificate> {
        self.certificates.get_by_hsbc_ref(hsbc_ref)
    }

    /// Mint tokens from certificate
    pub fn mint_from_certificate(
        &self,
        cert_id: &Hash,
        to: &Address,
        amount: TokenAmount,
    ) -> StateResult<()> {
        // Mint from certificate
        self.certificates.mint(cert_id, amount)?;

        // Credit to account
        self.credit(to, amount);

        // Update total supply
        {
            let mut state = self.chain_state.write();
            state.total_supply += amount;
        }

        info!("Minted {} tokens to {} from certificate", amount, to);
        Ok(())
    }

    /// Burn tokens
    pub fn burn(&self, from: &Address, amount: TokenAmount) -> StateResult<()> {
        self.debit(from, amount)?;

        // Update total supply
        {
            let mut state = self.chain_state.write();
            state.total_supply = state.total_supply.saturating_sub(amount);
        }

        info!("Burned {} tokens from {}", amount, from);
        Ok(())
    }

    /// List all certificates
    pub fn list_certificates(&self) -> Vec<CertificateSummary> {
        self.certificates.list_summaries()
    }

    /// Get certificate statistics
    pub fn certificate_stats(&self) -> CertificateStats {
        self.certificates.stats()
    }

    /// Store transaction receipt
    pub fn store_receipt(&self, receipt: TransactionReceipt) {
        self.receipts.insert(receipt.tx_hash, receipt);
    }

    /// Get transaction receipt
    pub fn get_receipt(&self, tx_hash: &Hash) -> Option<TransactionReceipt> {
        self.receipts.get(tx_hash).map(|r| r.clone())
    }

    /// Update chain state after block
    pub fn apply_block(&self, block: &Block) {
        let mut state = self.chain_state.write();
        state.height = block.header.height;
        state.latest_block_hash = block.hash;
        state.total_transactions += block.transactions.len() as u64;
    }

    /// Get chain state
    pub fn chain_state(&self) -> ChainState {
        self.chain_state.read().clone()
    }

    /// Get total supply
    pub fn total_supply(&self) -> TokenAmount {
        self.chain_state.read().total_supply
    }

    /// Get current height
    pub fn height(&self) -> u64 {
        self.chain_state.read().height
    }

    /// Compute state root (hash of all account states)
    pub fn compute_state_root(&self) -> Hash {
        let mut accounts: Vec<_> = self.accounts.iter().collect();
        accounts.sort_by_key(|a| a.key().0);

        let mut data = Vec::new();
        for account in accounts {
            data.extend_from_slice(&account.address.0);
            data.extend_from_slice(&account.balance.to_le_bytes());
            data.extend_from_slice(&account.nonce.to_le_bytes());
        }

        sha256(&data)
    }

    /// Get all accounts (for API)
    pub fn list_accounts(&self, limit: usize, offset: usize) -> Vec<AccountSummary> {
        self.accounts
            .iter()
            .skip(offset)
            .take(limit)
            .map(|a| AccountSummary::from(&*a))
            .collect()
    }

    /// Get account count
    pub fn account_count(&self) -> usize {
        self.accounts.len()
    }

    /// Get transactions for an address
    pub fn get_address_transactions(&self, _address: &Address) -> Vec<Transaction> {
        // This would typically query from storage
        // For now, return empty - transactions are stored in blocks
        Vec::new()
    }
}

impl Default for StateManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_genesis_initialization() {
        let state = StateManager::new();
        let admin = Address([1u8; 32]);

        state.initialize_genesis(vec![admin]);

        assert!(state.is_admin(&admin));
        let account = state.get_account_summary(&admin);
        assert!(account.is_some());
        assert!(account.unwrap().is_admin);
    }

    #[test]
    fn test_credit_debit() {
        let state = StateManager::new();
        let addr = Address([1u8; 32]);

        state.credit(&addr, 1000);
        assert_eq!(state.get_balance(&addr), 1000);

        state.debit(&addr, 400).unwrap();
        assert_eq!(state.get_balance(&addr), 600);
    }

    #[test]
    fn test_transfer() {
        let state = StateManager::new();
        let from = Address([1u8; 32]);
        let to = Address([2u8; 32]);

        state.credit(&from, 1000);
        state.transfer(&from, &to, 400).unwrap();

        assert_eq!(state.get_balance(&from), 600);
        assert_eq!(state.get_balance(&to), 400);
    }

    #[test]
    fn test_insufficient_balance() {
        let state = StateManager::new();
        let addr = Address([1u8; 32]);

        state.credit(&addr, 100);
        assert!(state.debit(&addr, 500).is_err());
    }

    #[test]
    fn test_nonce() {
        let state = StateManager::new();
        let addr = Address([1u8; 32]);

        state.get_or_create_account(addr);
        assert_eq!(state.get_nonce(&addr), 0);

        assert!(state.check_nonce(&addr, 1).is_ok());
        state.increment_nonce(&addr).unwrap();
        assert_eq!(state.get_nonce(&addr), 1);

        assert!(state.check_nonce(&addr, 2).is_ok());
        assert!(state.check_nonce(&addr, 1).is_err());
    }

    #[test]
    fn test_mint_and_burn() {
        let state = StateManager::new();
        let admin = Address([1u8; 32]);
        let user = Address([2u8; 32]);

        state.initialize_genesis(vec![admin]);

        // Register certificate
        let cert = GoldCertificate::new(
            "HSBC-001".to_string(),
            10.0,
            chrono::Utc::now(),
            "Test".to_string(),
            [0u8; 32],
            admin.0,
        )
        .unwrap();
        let cert_id = cert.certificate_id;
        state.register_certificate(cert).unwrap();

        // Mint
        state.mint_from_certificate(&cert_id, &user, 1000).unwrap();
        assert_eq!(state.get_balance(&user), 1000);
        assert_eq!(state.total_supply(), 1000);

        // Burn
        state.burn(&user, 400).unwrap();
        assert_eq!(state.get_balance(&user), 600);
        assert_eq!(state.total_supply(), 600);
    }
}
