use crate::{StateError, StateResult};
use dashmap::DashMap;
use gold_core::{CertificateSummary, GoldCertificate, Hash, TokenAmount};
use parking_lot::RwLock;
use std::sync::Arc;

/// Registry for gold certificates
#[derive(Debug)]
pub struct CertificateRegistry {
    /// Certificates by ID
    certificates: DashMap<[u8; 32], GoldCertificate>,

    /// HSBC reference to certificate ID mapping
    hsbc_ref_index: DashMap<String, [u8; 32]>,

    /// Total statistics
    stats: Arc<RwLock<CertificateStats>>,
}

/// Certificate registry statistics
#[derive(Debug, Default, Clone)]
pub struct CertificateStats {
    pub total_certificates: u64,
    pub active_certificates: u64,
    pub total_gold_oz: f64,
    pub total_minted: TokenAmount,
    pub total_mintable: TokenAmount,
}

impl CertificateRegistry {
    /// Create a new certificate registry
    pub fn new() -> Self {
        Self {
            certificates: DashMap::new(),
            hsbc_ref_index: DashMap::new(),
            stats: Arc::new(RwLock::new(CertificateStats::default())),
        }
    }

    /// Register a new certificate
    pub fn register(&self, certificate: GoldCertificate) -> StateResult<Hash> {
        let cert_id = certificate.certificate_id;

        // Check for duplicate
        if self.certificates.contains_key(&cert_id) {
            return Err(StateError::CertificateAlreadyExists(hex::encode(cert_id)));
        }

        // Check HSBC reference uniqueness
        if self.hsbc_ref_index.contains_key(&certificate.hsbc_reference) {
            return Err(StateError::CertificateAlreadyExists(format!(
                "HSBC reference {} already registered",
                certificate.hsbc_reference
            )));
        }

        // Update stats
        {
            let mut stats = self.stats.write();
            stats.total_certificates += 1;
            stats.active_certificates += 1;
            stats.total_gold_oz += certificate.gold_amount_oz;
            stats.total_mintable += certificate.max_mintable;
        }

        // Store certificate
        self.hsbc_ref_index
            .insert(certificate.hsbc_reference.clone(), cert_id);
        self.certificates.insert(cert_id, certificate);

        Ok(cert_id)
    }

    /// Get a certificate by ID
    pub fn get(&self, cert_id: &Hash) -> Option<GoldCertificate> {
        self.certificates.get(cert_id).map(|c| c.clone())
    }

    /// Get a certificate by HSBC reference
    pub fn get_by_hsbc_ref(&self, hsbc_ref: &str) -> Option<GoldCertificate> {
        self.hsbc_ref_index
            .get(hsbc_ref)
            .and_then(|id| self.certificates.get(&*id).map(|c| c.clone()))
    }

    /// Mint tokens from a certificate
    pub fn mint(&self, cert_id: &Hash, amount: TokenAmount) -> StateResult<()> {
        let mut cert = self
            .certificates
            .get_mut(cert_id)
            .ok_or_else(|| StateError::CertificateNotFound(hex::encode(cert_id)))?;

        cert.mint(amount)
            .map_err(|e| StateError::CertificateError(e.to_string()))?;

        // Update stats
        {
            let mut stats = self.stats.write();
            stats.total_minted += amount;
        }

        Ok(())
    }

    /// Redeem a certificate
    pub fn redeem(&self, cert_id: &Hash) -> StateResult<()> {
        let mut cert = self
            .certificates
            .get_mut(cert_id)
            .ok_or_else(|| StateError::CertificateNotFound(hex::encode(cert_id)))?;

        cert.redeem()
            .map_err(|e| StateError::CertificateError(e.to_string()))?;

        // Update stats
        {
            let mut stats = self.stats.write();
            stats.active_certificates -= 1;
        }

        Ok(())
    }

    /// Get all certificates
    pub fn list_all(&self) -> Vec<GoldCertificate> {
        self.certificates.iter().map(|e| e.value().clone()).collect()
    }

    /// Get certificate summaries
    pub fn list_summaries(&self) -> Vec<CertificateSummary> {
        self.certificates
            .iter()
            .map(|e| CertificateSummary::from(e.value()))
            .collect()
    }

    /// Get statistics
    pub fn stats(&self) -> CertificateStats {
        self.stats.read().clone()
    }

    /// Get total minted supply
    pub fn total_minted(&self) -> TokenAmount {
        self.stats.read().total_minted
    }

    /// Get number of certificates
    pub fn count(&self) -> usize {
        self.certificates.len()
    }

    /// Check if certificate exists
    pub fn exists(&self, cert_id: &Hash) -> bool {
        self.certificates.contains_key(cert_id)
    }
}

impl Default for CertificateRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_certificate(hsbc_ref: &str, oz: f64) -> GoldCertificate {
        GoldCertificate::new(
            hsbc_ref.to_string(),
            oz,
            Utc::now(),
            "Test Branch".to_string(),
            [0u8; 32],
            [1u8; 32],
        )
    }

    #[test]
    fn test_register_certificate() {
        let registry = CertificateRegistry::new();
        let cert = create_test_certificate("HSBC-001", 10.0);
        let cert_id = cert.certificate_id;

        let result = registry.register(cert);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), cert_id);
        assert_eq!(registry.count(), 1);
    }

    #[test]
    fn test_duplicate_certificate() {
        let registry = CertificateRegistry::new();
        let cert1 = create_test_certificate("HSBC-001", 10.0);
        let cert2 = create_test_certificate("HSBC-001", 20.0);

        assert!(registry.register(cert1).is_ok());
        assert!(registry.register(cert2).is_err()); // Duplicate HSBC ref
    }

    #[test]
    fn test_get_certificate() {
        let registry = CertificateRegistry::new();
        let cert = create_test_certificate("HSBC-001", 10.0);
        let cert_id = cert.certificate_id;

        registry.register(cert).unwrap();

        let retrieved = registry.get(&cert_id);
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().hsbc_reference, "HSBC-001");
    }

    #[test]
    fn test_get_by_hsbc_ref() {
        let registry = CertificateRegistry::new();
        let cert = create_test_certificate("HSBC-001", 10.0);

        registry.register(cert).unwrap();

        let retrieved = registry.get_by_hsbc_ref("HSBC-001");
        assert!(retrieved.is_some());
    }

    #[test]
    fn test_mint_from_certificate() {
        let registry = CertificateRegistry::new();
        let cert = create_test_certificate("HSBC-001", 10.0);
        let cert_id = cert.certificate_id;

        registry.register(cert).unwrap();

        let result = registry.mint(&cert_id, 1000);
        assert!(result.is_ok());

        let updated = registry.get(&cert_id).unwrap();
        assert_eq!(updated.minted_amount, 1000);
    }

    #[test]
    fn test_stats() {
        let registry = CertificateRegistry::new();
        let cert1 = create_test_certificate("HSBC-001", 10.0);
        let cert2 = create_test_certificate("HSBC-002", 20.0);

        registry.register(cert1).unwrap();
        registry.register(cert2).unwrap();

        let stats = registry.stats();
        assert_eq!(stats.total_certificates, 2);
        assert_eq!(stats.active_certificates, 2);
        assert!((stats.total_gold_oz - 30.0).abs() < 0.001);
    }
}
