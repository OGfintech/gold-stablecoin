/**
 * STTAURX Database Seed Script
 * Phase 1: Users, Wallets, Transactions
 * ===================================
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Helper functions
const randomHex = (length = 64) => {
  return crypto.randomBytes(length / 2).toString('hex');
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('');

  // ============================================
  // 1. SYSTEM SETTINGS
  // ============================================
  console.log('📝 Creating system settings...');

  await prisma.systemSetting.upsert({
    where: { key: 'platform_name' },
    update: {},
    create: {
      key: 'platform_name',
      value: { name: 'STTAURX Gold Stablecoin Platform' },
      description: 'Platform display name',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'staking_rate' },
    update: {},
    create: {
      key: 'staking_rate',
      value: { baseRate: 0.05, lockBonuses: { 0: 1.0, 30: 1.5, 60: 2.0, 90: 2.5 } },
      description: 'Staking yield rates and lock period bonuses',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'maintenance_mode' },
    update: {},
    create: {
      key: 'maintenance_mode',
      value: { enabled: false, message: null },
      description: 'Platform maintenance mode toggle',
    },
  });

  // ============================================
  // 2. FEE CONFIGURATION
  // ============================================
  console.log('💰 Creating fee configuration...');

  const feeConfigs = [
    { feeType: 'transaction', percentage: 0.001, flatFee: 0, minAmount: 0.01, isActive: true },
    { feeType: 'marketplace', percentage: 0.025, flatFee: 0, minAmount: 0.1, isActive: true },
    { feeType: 'withdrawal', percentage: 0.002, flatFee: 0.5, minAmount: 1, isActive: true },
    { feeType: 'mint', percentage: 0.005, flatFee: 0, minAmount: 0, isActive: true },
    { feeType: 'burn', percentage: 0.005, flatFee: 0, minAmount: 0, isActive: true },
  ];

  for (const fee of feeConfigs) {
    await prisma.feeConfig.upsert({
      where: { feeType: fee.feeType },
      update: fee,
      create: fee,
    });
  }

  // ============================================
  // 3. ADMIN USER
  // ============================================
  console.log('👤 Creating admin user...');

  const adminPasswordHash = await hashPassword('Admin@STTAURX2026!');
  const adminAddress = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sttaurx.io' },
    update: {},
    create: {
      email: 'admin@sttaurx.io',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      kycStatus: 'APPROVED',
    },
  });

  // Admin wallet
  await prisma.wallet.upsert({
    where: { address: adminAddress },
    update: {},
    create: {
      userId: adminUser.id,
      address: adminAddress,
      balance: 10000000.0, // 10 million STTAURX for minting operations
      lockedBalance: 0,
      status: 'ACTIVE',
    },
  });

  console.log(`   ✅ Admin: admin@sttaurx.io (password: Admin@STTAURX2026!)`);

  // ============================================
  // 4. DEMO USERS
  // ============================================
  console.log('👥 Creating demo users...');

  const demoUsers = [
    {
      email: 'alice@example.com',
      fullName: 'Alice Johnson',
      role: 'USER',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      balance: 5000.0,
    },
    {
      email: 'bob@example.com',
      fullName: 'Bob Smith',
      role: 'USER',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      balance: 2500.0,
    },
    {
      email: 'charlie@example.com',
      fullName: 'Charlie Brown',
      role: 'USER',
      status: 'ACTIVE',
      kycStatus: 'PENDING',
      balance: 1000.0,
    },
    {
      email: 'diana@example.com',
      fullName: 'Diana Prince',
      role: 'ADMIN',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      balance: 7500.0,
    },
    {
      email: 'eve@example.com',
      fullName: 'Eve Wilson',
      role: 'USER',
      status: 'PENDING',
      kycStatus: 'NONE',
      balance: 0,
    },
  ];

  const userPasswordHash = await hashPassword('Demo@2026!');

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: userPasswordHash,
        fullName: userData.fullName,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.status === 'ACTIVE',
        kycStatus: userData.kycStatus,
      },
    });

    // Create wallet for each user
    const walletAddress = randomHex(64);
    await prisma.wallet.upsert({
      where: { address: walletAddress },
      update: {},
      create: {
        userId: user.id,
        address: walletAddress,
        balance: userData.balance,
        lockedBalance: 0,
        status: 'ACTIVE',
      },
    });

    console.log(`   ✅ ${userData.fullName}: ${userData.email} (${userData.balance} GOLD)`);
  }

  // ============================================
  // 5. GENESIS BLOCK & SAMPLE TRANSACTIONS
  // ============================================
  console.log('⛓️  Creating genesis block...');

  const genesisBlock = await prisma.block.upsert({
    where: { blockNumber: BigInt(0) },
    update: {},
    create: {
      blockNumber: BigInt(0),
      blockHash: '0000000000000000000000000000000000000000000000000000000000000000',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: randomHex(64),
      timestamp: new Date('2026-01-01T00:00:00Z'),
      transactionCount: 1,
      sizeBytes: 1024,
      validatorAddress: adminAddress,
    },
  });

  // Genesis transaction (initial mint)
  await prisma.transaction.upsert({
    where: { txHash: randomHex(64) },
    update: {},
    create: {
      txHash: randomHex(64),
      blockId: genesisBlock.id,
      blockNumber: BigInt(0),
      fromAddress: '0000000000000000000000000000000000000000000000000000000000000000',
      toAddress: adminAddress,
      amount: 50000000.0, // 50 million initial supply
      fee: 0,
      txType: 'MINT',
      status: 'CONFIRMED',
      confirmations: 100,
      metadata: { type: 'genesis', note: 'Initial token supply mint' },
      confirmedAt: new Date('2026-01-01T00:00:00Z'),
    },
  });

  console.log('   ✅ Genesis block created');

  // ============================================
  // 6. SAMPLE BLOCKS & TRANSACTIONS
  // ============================================
  console.log('📦 Creating sample blocks and transactions...');

  // Get all wallets for transaction simulation
  const wallets = await prisma.wallet.findMany();

  // Create 10 sample blocks
  for (let i = 1; i <= 10; i++) {
    const blockTimestamp = new Date(Date.now() - (10 - i) * 60000); // 1 minute apart

    const block = await prisma.block.create({
      data: {
        blockNumber: BigInt(i),
        blockHash: randomHex(64),
        previousHash: i === 1
          ? '0000000000000000000000000000000000000000000000000000000000000000'
          : randomHex(64),
        merkleRoot: randomHex(64),
        timestamp: blockTimestamp,
        transactionCount: Math.floor(Math.random() * 5) + 1,
        sizeBytes: Math.floor(Math.random() * 5000) + 500,
        validatorAddress: adminAddress,
      },
    });

    // Create 1-3 transactions per block
    const txCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < txCount; j++) {
      const fromWallet = wallets[Math.floor(Math.random() * wallets.length)];
      const toWallet = wallets[Math.floor(Math.random() * wallets.length)];

      if (fromWallet.address !== toWallet.address) {
        await prisma.transaction.create({
          data: {
            txHash: randomHex(64),
            blockId: block.id,
            blockNumber: BigInt(i),
            fromAddress: fromWallet.address,
            toAddress: toWallet.address,
            amount: parseFloat((Math.random() * 100).toFixed(4)),
            fee: 0.001,
            txType: 'TRANSFER',
            status: 'CONFIRMED',
            confirmations: 10 - i + 1,
            confirmedAt: blockTimestamp,
          },
        });
      }
    }
  }

  console.log('   ✅ 10 sample blocks with transactions created');

  // ============================================
  // 7. AUDIT LOG ENTRIES
  // ============================================
  console.log('📋 Creating sample audit logs...');

  await prisma.auditLog.create({
    data: {
      adminId: adminUser.id,
      action: 'system.seed',
      entityType: 'system',
      entityId: adminUser.id,
      newValues: { action: 'Database seeded', timestamp: new Date().toISOString() },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('   ✅ Audit logs created');

  // ============================================
  // SUMMARY
  // ============================================
  const userCount = await prisma.user.count();
  const walletCount = await prisma.wallet.count();
  const blockCount = await prisma.block.count();
  const txCount = await prisma.transaction.count();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                 SEED COMPLETE!                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📊 Statistics:`);
  console.log(`   Users: ${userCount}`);
  console.log(`   Wallets: ${walletCount}`);
  console.log(`   Blocks: ${blockCount}`);
  console.log(`   Transactions: ${txCount}`);
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Admin: admin@sttaurx.io / Admin@STTAURX2026!');
  console.log('   Demo:  alice@example.com / Demo@2026!');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
