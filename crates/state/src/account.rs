use gold_core::{Address, TokenAmount};
use serde::{Deserialize, Serialize};

/// Account state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    /// Account address
    pub address: Address,

    /// Token balance
    pub balance: TokenAmount,

    /// Nonce for replay protection
    pub nonce: u64,

    /// Whether this is an admin account
    pub is_admin: bool,
}

impl Account {
    /// Create a new account with zero balance
    pub fn new(address: Address) -> Self {
        Self {
            address,
            balance: 0,
            nonce: 0,
            is_admin: false,
        }
    }

    /// Create a new admin account
    pub fn new_admin(address: Address) -> Self {
        Self {
            address,
            balance: 0,
            nonce: 0,
            is_admin: true,
        }
    }

    /// Check if account has sufficient balance
    pub fn has_balance(&self, amount: TokenAmount) -> bool {
        self.balance >= amount
    }

    /// Credit tokens to account
    pub fn credit(&mut self, amount: TokenAmount) {
        self.balance = self.balance.saturating_add(amount);
    }

    /// Debit tokens from account (returns error if insufficient balance)
    pub fn debit(&mut self, amount: TokenAmount) -> Result<(), crate::StateError> {
        if self.balance < amount {
            return Err(crate::StateError::InsufficientBalance {
                have: self.balance,
                need: amount,
            });
        }
        self.balance -= amount;
        Ok(())
    }

    /// Increment nonce
    pub fn increment_nonce(&mut self) {
        self.nonce += 1;
    }

    /// Check nonce validity
    pub fn check_nonce(&self, tx_nonce: u64) -> Result<(), crate::StateError> {
        if tx_nonce != self.nonce + 1 {
            return Err(crate::StateError::NonceMismatch {
                expected: self.nonce + 1,
                got: tx_nonce,
            });
        }
        Ok(())
    }
}

/// Account summary for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountSummary {
    pub address: String,
    pub balance: String,
    pub nonce: u64,
    pub is_admin: bool,
}

impl From<&Account> for AccountSummary {
    fn from(account: &Account) -> Self {
        Self {
            address: account.address.to_hex(),
            balance: account.balance.to_string(),
            nonce: account.nonce,
            is_admin: account.is_admin,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_account_creation() {
        let addr = Address([1u8; 32]);
        let account = Account::new(addr);

        assert_eq!(account.balance, 0);
        assert_eq!(account.nonce, 0);
        assert!(!account.is_admin);
    }

    #[test]
    fn test_admin_account() {
        let addr = Address([1u8; 32]);
        let account = Account::new_admin(addr);

        assert!(account.is_admin);
    }

    #[test]
    fn test_credit() {
        let addr = Address([1u8; 32]);
        let mut account = Account::new(addr);

        account.credit(1000);
        assert_eq!(account.balance, 1000);

        account.credit(500);
        assert_eq!(account.balance, 1500);
    }

    #[test]
    fn test_debit_success() {
        let addr = Address([1u8; 32]);
        let mut account = Account::new(addr);
        account.credit(1000);

        assert!(account.debit(500).is_ok());
        assert_eq!(account.balance, 500);
    }

    #[test]
    fn test_debit_insufficient() {
        let addr = Address([1u8; 32]);
        let mut account = Account::new(addr);
        account.credit(100);

        assert!(account.debit(500).is_err());
        assert_eq!(account.balance, 100); // Balance unchanged
    }

    #[test]
    fn test_nonce_check() {
        let addr = Address([1u8; 32]);
        let mut account = Account::new(addr);

        assert!(account.check_nonce(1).is_ok());
        account.increment_nonce();

        assert!(account.check_nonce(2).is_ok());
        assert!(account.check_nonce(1).is_err());
        assert!(account.check_nonce(3).is_err());
    }
}
