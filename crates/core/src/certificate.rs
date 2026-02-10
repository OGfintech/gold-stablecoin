use crate::types::{CoreError, CoreResult, Hash, TokenAmount, TOKEN_BASE};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Status of a gold certificate
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CertificateStatus {
    /// Certificate is active and can be used to mint tokens
    Active,
    /// All allowed tokens have been minted from this certificate
    FullyMinted,
    /// Certificate has been redeemed (tokens burned, gold claimed)
    Redeemed,
    /// Certificate is suspended (e.g., pending verification)
    Suspended,
}

impl std::fmt::Display for CertificateStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CertificateStatus::Active => write!(f, "Active"),
            CertificateStatus::FullyMinted => write!(f, "FullyMinted"),
            CertificateStatus::Redeemed => write!(f, "Redeemed"),
            CertificateStatus::Suspended => write!(f, "Suspended"),
        }
    }
}

/// HSBC Gold Certificate representing physical gold backing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldCertificate {
    /// Unique certificate ID (hash of certificate data)
    pub certificate_id: Hash,

    /// HSBC reference number for the certificate
    pub hsbc_reference: String,

    /// Amount of gold in troy ounces
    pub gold_amount_oz: f64,

    /// Amount of gold in grams (derived from oz)
    pub gold_amount_grams: f64,

    /// Date the certificate was issued
    pub issue_date: DateTime<Utc>,

    /// HSBC branch that issued the certificate
    pub hsbc_branch: String,

    /// Hash of the original document (PDF, image, etc.)
    pub document_hash: Hash,

    /// Current status of the certificate
    pub status: CertificateStatus,

    /// Amount of tokens already minted from this certificate
    pub minted_amount: TokenAmount,

    /// Maximum amount of tokens that can be minted (based on gold amount)
    pub max_mintable: TokenAmount,

    /// Timestamp when the certificate was registered in the system
    pub registered_at: DateTime<Utc>,

    /// Address of the admin who registered the certificate
    pub registered_by: [u8; 32],

    /// Optional notes or metadata
    pub notes: Option<String>,
}

impl GoldCertificate {
    /// Create a new gold certificate
    pub fn new(
        hsbc_reference: String,
        gold_amount_oz: f64,
        issue_date: DateTime<Utc>,
        hsbc_branch: String,
        document_hash: Hash,
        registered_by: [u8; 32],
    ) -> CoreResult<Self> {
        // Validate gold amount before any conversion
        if gold_amount_oz.is_nan() {
            return Err(CoreError::InvalidAmount("NaN is not a valid gold amount".into()));
        }
        if gold_amount_oz.is_infinite() {
            return Err(CoreError::InvalidAmount("Infinite is not a valid gold amount".into()));
        }
        if gold_amount_oz < 0.0 {
            return Err(CoreError::InvalidAmount("Gold amount cannot be negative".into()));
        }
        if gold_amount_oz > (u128::MAX as f64 / TOKEN_BASE as f64 / 31.1035) {
            return Err(CoreError::InvalidAmount("Gold amount would overflow token supply".into()));
        }

        let gold_amount_grams = gold_amount_oz * 31.1035;
        let max_mintable = (gold_amount_grams * TOKEN_BASE as f64) as TokenAmount;

        // Generate certificate ID from data
        let mut hasher = Sha256::new();
        hasher.update(hsbc_reference.as_bytes());
        hasher.update(gold_amount_oz.to_le_bytes());
        hasher.update(issue_date.timestamp().to_le_bytes());
        hasher.update(hsbc_branch.as_bytes());
        hasher.update(&document_hash);

        let result = hasher.finalize();
        let mut certificate_id = [0u8; 32];
        certificate_id.copy_from_slice(&result);

        Ok(Self {
            certificate_id,
            hsbc_reference,
            gold_amount_oz,
            gold_amount_grams,
            issue_date,
            hsbc_branch,
            document_hash,
            status: CertificateStatus::Active,
            minted_amount: 0,
            max_mintable,
            registered_at: Utc::now(),
            registered_by,
            notes: None,
        })
    }

    /// Get the remaining mintable amount
    pub fn remaining_mintable(&self) -> TokenAmount {
        self.max_mintable.saturating_sub(self.minted_amount)
    }

    /// Check if tokens can be minted from this certificate
    pub fn can_mint(&self, amount: TokenAmount) -> CoreResult<()> {
        if self.status != CertificateStatus::Active {
            return Err(CoreError::InvalidCertificateStatus {
                expected: "Active".to_string(),
                actual: self.status.to_string(),
            });
        }

        let remaining = self.remaining_mintable();
        if amount > remaining {
            return Err(CoreError::CertificateExhausted(format!(
                "Requested {} but only {} remaining",
                amount, remaining
            )));
        }

        Ok(())
    }

    /// Mint tokens from this certificate
    pub fn mint(&mut self, amount: TokenAmount) -> CoreResult<()> {
        self.can_mint(amount)?;

        self.minted_amount += amount;

        // Update status if fully minted
        if self.minted_amount >= self.max_mintable {
            self.status = CertificateStatus::FullyMinted;
        }

        Ok(())
    }

    /// Mark certificate as redeemed
    pub fn redeem(&mut self) -> CoreResult<()> {
        if self.status == CertificateStatus::Redeemed {
            return Err(CoreError::InvalidCertificateStatus {
                expected: "Active or FullyMinted".to_string(),
                actual: "Redeemed".to_string(),
            });
        }

        self.status = CertificateStatus::Redeemed;
        Ok(())
    }

    /// Suspend the certificate
    pub fn suspend(&mut self) -> CoreResult<()> {
        if self.status == CertificateStatus::Redeemed {
            return Err(CoreError::InvalidCertificateStatus {
                expected: "Active or FullyMinted".to_string(),
                actual: "Redeemed".to_string(),
            });
        }

        self.status = CertificateStatus::Suspended;
        Ok(())
    }

    /// Reactivate a suspended certificate
    pub fn reactivate(&mut self) -> CoreResult<()> {
        if self.status != CertificateStatus::Suspended {
            return Err(CoreError::InvalidCertificateStatus {
                expected: "Suspended".to_string(),
                actual: self.status.to_string(),
            });
        }

        self.status = if self.minted_amount >= self.max_mintable {
            CertificateStatus::FullyMinted
        } else {
            CertificateStatus::Active
        };

        Ok(())
    }

    /// Get certificate ID as hex string
    pub fn id_hex(&self) -> String {
        hex::encode(self.certificate_id)
    }

    /// Serialize to bytes for hashing
    pub fn to_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).unwrap_or_default()
    }
}

/// Request to register a new certificate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterCertificateRequest {
    pub hsbc_reference: String,
    pub gold_amount_oz: f64,
    pub issue_date: String,
    pub hsbc_branch: String,
    pub document_hash: String,
    pub notes: Option<String>,
}

/// Summary of a certificate for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateSummary {
    pub certificate_id: String,
    pub hsbc_reference: String,
    pub gold_amount_oz: f64,
    pub gold_amount_grams: f64,
    pub issue_date: String,
    pub hsbc_branch: String,
    pub status: String,
    pub minted_amount: String,
    pub max_mintable: String,
    pub remaining_mintable: String,
    pub registered_at: String,
}

impl From<&GoldCertificate> for CertificateSummary {
    fn from(cert: &GoldCertificate) -> Self {
        Self {
            certificate_id: cert.id_hex(),
            hsbc_reference: cert.hsbc_reference.clone(),
            gold_amount_oz: cert.gold_amount_oz,
            gold_amount_grams: cert.gold_amount_grams,
            issue_date: cert.issue_date.to_rfc3339(),
            hsbc_branch: cert.hsbc_branch.clone(),
            status: cert.status.to_string(),
            minted_amount: cert.minted_amount.to_string(),
            max_mintable: cert.max_mintable.to_string(),
            remaining_mintable: cert.remaining_mintable().to_string(),
            registered_at: cert.registered_at.to_rfc3339(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_certificate() -> GoldCertificate {
        GoldCertificate::new(
            "HSBC-2024-001".to_string(),
            10.0,
            Utc::now(),
            "Hong Kong Main".to_string(),
            [0u8; 32],
            [1u8; 32],
        )
        .unwrap()
    }

    #[test]
    fn test_certificate_creation() {
        let cert = create_test_certificate();

        assert_eq!(cert.hsbc_reference, "HSBC-2024-001");
        assert_eq!(cert.gold_amount_oz, 10.0);
        assert!((cert.gold_amount_grams - 311.035).abs() < 0.001);
        assert_eq!(cert.status, CertificateStatus::Active);
        assert_eq!(cert.minted_amount, 0);
        assert!(cert.max_mintable > 0);
    }

    #[test]
    fn test_mint_tokens() {
        let mut cert = create_test_certificate();
        let mint_amount = TOKEN_BASE; // 1 token

        assert!(cert.can_mint(mint_amount).is_ok());
        assert!(cert.mint(mint_amount).is_ok());
        assert_eq!(cert.minted_amount, mint_amount);
    }

    #[test]
    fn test_mint_exceeds_max() {
        let mut cert = create_test_certificate();
        let excess = cert.max_mintable + 1;

        assert!(cert.mint(excess).is_err());
    }

    #[test]
    fn test_fully_minted_status() {
        let mut cert = create_test_certificate();
        let max = cert.max_mintable;

        cert.mint(max).unwrap();
        assert_eq!(cert.status, CertificateStatus::FullyMinted);
        assert!(cert.mint(1).is_err());
    }

    #[test]
    fn test_certificate_redemption() {
        let mut cert = create_test_certificate();

        assert!(cert.redeem().is_ok());
        assert_eq!(cert.status, CertificateStatus::Redeemed);
        assert!(cert.redeem().is_err());
    }

    #[test]
    fn test_certificate_suspension() {
        let mut cert = create_test_certificate();

        assert!(cert.suspend().is_ok());
        assert_eq!(cert.status, CertificateStatus::Suspended);
        assert!(cert.mint(1).is_err());

        assert!(cert.reactivate().is_ok());
        assert_eq!(cert.status, CertificateStatus::Active);
    }

    #[test]
    fn test_mint_rejects_nan() {
        let result = GoldCertificate::new(
            "HSBC-TEST-NAN".to_string(),
            f64::NAN,
            Utc::now(),
            "London".to_string(),
            [0u8; 32],
            [1u8; 32],
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_mint_rejects_infinity() {
        let result = GoldCertificate::new(
            "HSBC-TEST-INF".to_string(),
            f64::INFINITY,
            Utc::now(),
            "London".to_string(),
            [0u8; 32],
            [1u8; 32],
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_mint_rejects_negative() {
        let result = GoldCertificate::new(
            "HSBC-TEST-NEG".to_string(),
            -100.0,
            Utc::now(),
            "London".to_string(),
            [0u8; 32],
            [1u8; 32],
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_mint_rejects_overflow() {
        let result = GoldCertificate::new(
            "HSBC-TEST-OVF".to_string(),
            f64::MAX,
            Utc::now(),
            "London".to_string(),
            [0u8; 32],
            [1u8; 32],
        );
        assert!(result.is_err());
    }
}
