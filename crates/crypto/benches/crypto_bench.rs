use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use gold_crypto::{Keypair, sha256, verify_signature, verify_transactions_batch, verify_transactions_parallel, compute_merkle_root};
use gold_core::{Transaction, TransactionPayload, TransferPayload, Address};

fn bench_sha256(c: &mut Criterion) {
    let data: Vec<u8> = (0..1000).map(|i| i as u8).collect();

    c.bench_function("sha256_1kb", |b| {
        b.iter(|| sha256(black_box(&data)))
    });
}

fn bench_keypair_generation(c: &mut Criterion) {
    c.bench_function("keypair_generate", |b| {
        b.iter(|| Keypair::generate())
    });
}

fn bench_signing(c: &mut Criterion) {
    let keypair = Keypair::generate();
    let message = sha256(b"test message");

    c.bench_function("sign_message", |b| {
        b.iter(|| keypair.sign(black_box(&message)))
    });
}

fn bench_verification(c: &mut Criterion) {
    let keypair = Keypair::generate();
    let message = sha256(b"test message");
    let signature = keypair.sign(&message);
    let public_key = keypair.public_key();

    c.bench_function("verify_signature", |b| {
        b.iter(|| verify_signature(black_box(&public_key), black_box(&message), black_box(&signature)))
    });
}

fn create_signed_transaction(keypair: &Keypair, nonce: u64) -> Transaction {
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

fn bench_batch_verification(c: &mut Criterion) {
    let mut group = c.benchmark_group("batch_verification");

    for size in [10, 100, 1000].iter() {
        let keypairs: Vec<Keypair> = (0..*size).map(|_| Keypair::generate()).collect();
        let transactions: Vec<Transaction> = keypairs
            .iter()
            .enumerate()
            .map(|(i, kp)| create_signed_transaction(kp, i as u64))
            .collect();

        group.bench_with_input(BenchmarkId::new("parallel", size), &transactions, |b, txs| {
            b.iter(|| verify_transactions_parallel(black_box(txs)))
        });

        group.bench_with_input(BenchmarkId::new("batch", size), &transactions, |b, txs| {
            b.iter(|| verify_transactions_batch(black_box(txs)))
        });
    }

    group.finish();
}

fn bench_merkle_tree(c: &mut Criterion) {
    let mut group = c.benchmark_group("merkle_tree");

    for size in [100, 1000, 10000].iter() {
        let hashes: Vec<[u8; 32]> = (0..*size).map(|i| sha256(&i.to_le_bytes())).collect();

        group.bench_with_input(BenchmarkId::new("compute_root", size), &hashes, |b, h| {
            b.iter(|| compute_merkle_root(black_box(h)))
        });
    }

    group.finish();
}

criterion_group!(
    benches,
    bench_sha256,
    bench_keypair_generation,
    bench_signing,
    bench_verification,
    bench_batch_verification,
    bench_merkle_tree,
);

criterion_main!(benches);
