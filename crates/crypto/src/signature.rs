use crate::{verify_public_key, CryptoError, CryptoResult};
use ed25519_dalek::{Signature as DalekSignature, Verifier, VerifyingKey};
use gold_core::{PublicKey, Signature, Transaction};
use rayon::prelude::*;

/// Verify a signature against a message and public key
pub fn verify_signature(
    public_key: &PublicKey,
    message: &[u8],
    signature: &Signature,
) -> CryptoResult<()> {
    let verifying_key = verify_public_key(public_key)?;

    let sig =
        DalekSignature::from_bytes(signature);

    verifying_key
        .verify(message, &sig)
        .map_err(|_| CryptoError::VerificationFailed)
}

/// Verify a transaction signature
pub fn verify_transaction(tx: &Transaction) -> CryptoResult<()> {
    // Verify the address matches the public key
    let derived_address = gold_core::Address::from_public_key(&tx.public_key);
    if derived_address != tx.from {
        return Err(CryptoError::VerificationFailed);
    }

    // Verify the signature
    let message = tx.signing_message();
    verify_signature(&tx.public_key, &message, &tx.signature)
}

/// Batch verify multiple transactions in parallel
pub fn verify_transactions_parallel(transactions: &[Transaction]) -> CryptoResult<()> {
    let results: Vec<CryptoResult<()>> = transactions
        .par_iter()
        .map(verify_transaction)
        .collect();

    for result in results {
        result?;
    }

    Ok(())
}

/// Batch signature verification using ed25519-dalek's batch verification
/// This is more efficient than verifying signatures one by one
pub fn batch_verify(
    messages: &[&[u8]],
    signatures: &[Signature],
    public_keys: &[PublicKey],
) -> CryptoResult<()> {
    if messages.len() != signatures.len() || messages.len() != public_keys.len() {
        return Err(CryptoError::BatchVerificationFailed);
    }

    let verifying_keys: Vec<VerifyingKey> = public_keys
        .iter()
        .map(verify_public_key)
        .collect::<CryptoResult<Vec<_>>>()?;

    let dalek_sigs: Vec<DalekSignature> = signatures
        .iter()
        .map(|s| DalekSignature::from_bytes(s))
        .collect();

    // Use ed25519-dalek batch verification
    ed25519_dalek::verify_batch(messages, &dalek_sigs, &verifying_keys)
        .map_err(|_| CryptoError::BatchVerificationFailed)
}

/// Verify transaction signatures using batch verification when possible
pub fn verify_transactions_batch(transactions: &[Transaction]) -> CryptoResult<()> {
    if transactions.is_empty() {
        return Ok(());
    }

    // First verify addresses match public keys
    for tx in transactions {
        let derived_address = gold_core::Address::from_public_key(&tx.public_key);
        if derived_address != tx.from {
            return Err(CryptoError::VerificationFailed);
        }
    }

    // Prepare data for batch verification
    let messages: Vec<[u8; 32]> = transactions
        .iter()
        .map(|tx| tx.signing_message())
        .collect();

    let message_refs: Vec<&[u8]> = messages.iter().map(|m| m.as_slice()).collect();

    let signatures: Vec<Signature> = transactions.iter().map(|tx| tx.signature).collect();

    let public_keys: Vec<PublicKey> = transactions.iter().map(|tx| tx.public_key).collect();

    batch_verify(&message_refs, &signatures, &public_keys)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Keypair;
    use gold_core::{TransactionPayload, TransferPayload};

    fn create_signed_transaction(keypair: &Keypair) -> Transaction {
        let mut tx = Transaction::new(
            keypair.address(),
            keypair.public_key(),
            1,
            TransactionPayload::Transfer(TransferPayload {
                to: gold_core::Address([2u8; 32]),
                amount: 1000,
                memo: None,
            }),
        );

        let signature = keypair.sign(&tx.signing_message());
        tx.set_signature(signature);
        tx
    }

    #[test]
    fn test_verify_signature() {
        let keypair = Keypair::generate();
        let message = b"test message";
        let signature = keypair.sign(message);

        assert!(verify_signature(&keypair.public_key(), message, &signature).is_ok());
    }

    #[test]
    fn test_verify_wrong_signature() {
        let keypair = Keypair::generate();
        let message = b"test message";
        let wrong_sig = [0u8; 64];

        assert!(verify_signature(&keypair.public_key(), message, &wrong_sig).is_err());
    }

    #[test]
    fn test_verify_transaction() {
        let keypair = Keypair::generate();
        let tx = create_signed_transaction(&keypair);

        assert!(verify_transaction(&tx).is_ok());
    }

    #[test]
    fn test_verify_transaction_wrong_address() {
        let keypair = Keypair::generate();
        let mut tx = create_signed_transaction(&keypair);
        tx.from = gold_core::Address([99u8; 32]); // Wrong address

        assert!(verify_transaction(&tx).is_err());
    }

    #[test]
    fn test_verify_transactions_parallel() {
        let keypairs: Vec<Keypair> = (0..10).map(|_| Keypair::generate()).collect();
        let transactions: Vec<Transaction> = keypairs
            .iter()
            .map(create_signed_transaction)
            .collect();

        assert!(verify_transactions_parallel(&transactions).is_ok());
    }

    #[test]
    fn test_batch_verify() {
        let keypairs: Vec<Keypair> = (0..5).map(|_| Keypair::generate()).collect();
        let messages: Vec<Vec<u8>> = (0..5).map(|i| format!("message {}", i).into_bytes()).collect();

        let signatures: Vec<Signature> = keypairs
            .iter()
            .zip(messages.iter())
            .map(|(kp, msg)| kp.sign(msg))
            .collect();

        let public_keys: Vec<PublicKey> = keypairs.iter().map(|kp| kp.public_key()).collect();
        let message_refs: Vec<&[u8]> = messages.iter().map(|m| m.as_slice()).collect();

        assert!(batch_verify(&message_refs, &signatures, &public_keys).is_ok());
    }

    #[test]
    fn test_verify_transactions_batch() {
        let keypairs: Vec<Keypair> = (0..10).map(|_| Keypair::generate()).collect();
        let transactions: Vec<Transaction> = keypairs
            .iter()
            .map(create_signed_transaction)
            .collect();

        assert!(verify_transactions_batch(&transactions).is_ok());
    }
}
