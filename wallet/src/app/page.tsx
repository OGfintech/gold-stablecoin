'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from './providers'
import { walletApi } from '@/lib/api'
import {
  BalanceCard,
  GoldPriceWidget,
  TransactionList,
  QuickActions,
  dashboardActions,
  WalletStatus,
  AccountInfo,
  WalletSetup,
} from '@/components/wallet'
import { DepositFlow, ReceiveCoins } from '@/components/deposit'
import { WithdrawFlow } from '@/components/withdraw'
import { StakingDashboard } from '@/components/staking'

export default function WalletHome() {
  const { wallet, createWallet, unlockWallet, lockWallet } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['balance', wallet.address],
    queryFn: () => walletApi.getBalance(wallet.address!),
    enabled: !!wallet.address,
    refetchInterval: 30000,
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', wallet.address],
    queryFn: () => walletApi.getTransactions(wallet.address!),
    enabled: !!wallet.address,
    refetchInterval: 60000,
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

      <StakingDashboard
        walletAddress={wallet.address}
        walletBalance={balance}
      />

      <WalletStatus
        isUnlocked={wallet.isUnlocked}
        onLock={lockWallet}
        onUnlock={unlockWallet}
      />

      <QuickActions
        actions={dashboardActions}
        onDeposit={() => setShowDeposit(true)}
        onReceive={() => setShowReceive(true)}
        onWithdraw={() => setShowWithdraw(true)}
      />

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

      {/* Deposit Modal */}
      {showDeposit && (
        <DepositFlow onClose={() => setShowDeposit(false)} />
      )}

      {/* Receive Modal */}
      {showReceive && (
        <ReceiveCoins
          walletAddress={wallet.address}
          onClose={() => setShowReceive(false)}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <WithdrawFlow
          goldBalance={balance}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </div>
  )
}
