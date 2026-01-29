'use client'

import { useQuery } from '@tanstack/react-query'
import { useWallet } from './providers'
import { walletApi } from '@/lib/api'
import {
  BalanceCard,
  GoldPriceWidget,
  TransactionList,
  QuickActions,
  WalletStatus,
  AccountInfo,
  WalletSetup,
} from '@/components/wallet'

export default function WalletHome() {
  const { wallet, createWallet, unlockWallet, lockWallet } = useWallet()

  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['balance', wallet.address],
    queryFn: () => walletApi.getBalance(wallet.address!),
    enabled: !!wallet.address,
    refetchInterval: 5000,
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', wallet.address],
    queryFn: () => walletApi.getTransactions(wallet.address!),
    enabled: !!wallet.address,
    refetchInterval: 10000,
  })

  // No wallet - show setup
  if (!wallet.address) {
    return (
      <WalletSetup
        onCreateWallet={createWallet}
        onImportWallet={unlockWallet}
      />
    )
  }

  // Main wallet dashboard
  const balance = balanceData?.balance || '0'
  const transactions = txData?.transactions || []

  return (
    <div className="space-y-6 pb-24">
      <BalanceCard
        balance={balance}
        address={wallet.address}
        isLoading={balanceLoading}
        onRefresh={() => refetchBalance()}
      />

      <GoldPriceWidget />

      <WalletStatus
        isUnlocked={wallet.isUnlocked}
        onLock={lockWallet}
        onUnlock={unlockWallet}
      />

      <QuickActions />

      <TransactionList
        transactions={transactions}
        currentAddress={wallet.address}
        isLoading={txLoading}
        maxItems={5}
        showViewAll
      />

      {balanceData && (
        <AccountInfo
          nonce={balanceData.nonce}
          isAdmin={balanceData.is_admin}
          totalTransactions={txData?.total}
        />
      )}
    </div>
  )
}
