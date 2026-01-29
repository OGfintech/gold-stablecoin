'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Settings, Key, FileText, Coins, AlertCircle, CheckCircle, Copy } from 'lucide-react'

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [keypair, setKeypair] = useState<{ address: string; public_key: string; secret_key: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [certForm, setCertForm] = useState({
    hsbc_reference: '',
    gold_amount_oz: '',
    issue_date: '',
    hsbc_branch: '',
    document_hash: '',
    notes: '',
  })
  const [mintForm, setMintForm] = useState({
    certificate_id: '',
    to: '',
    amount: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const generateKeypairMutation = useMutation({
    mutationFn: api.generateKeypair,
    onSuccess: (data) => {
      setKeypair(data)
      setMessage({ type: 'success', text: 'Keypair generated successfully!' })
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message })
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const { data: certData } = useQuery({
    queryKey: ['certificates'],
    queryFn: api.getCertificates,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-500" />
          Admin Panel
        </h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current hover:opacity-80">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generate Keypair */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-blue-500" />
            Generate Keypair
          </h2>
          <p className="text-gray-400 mb-4">
            Generate a new Ed25519 keypair for testing. In production, keys should be generated client-side.
          </p>
          <button
            onClick={() => generateKeypairMutation.mutate()}
            disabled={generateKeypairMutation.isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {generateKeypairMutation.isPending ? 'Generating...' : 'Generate New Keypair'}
          </button>

          {keypair && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-gray-400 text-sm">Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={keypair.address}
                    className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(keypair.address, 'address')}
                    className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Public Key</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={keypair.public_key}
                    className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(keypair.public_key, 'public_key')}
                    className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Secret Key (KEEP SAFE!)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="password"
                    readOnly
                    value={keypair.secret_key}
                    className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(keypair.secret_key, 'secret_key')}
                    className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copied && (
                <p className="text-green-400 text-sm">Copied {copied} to clipboard!</p>
              )}
            </div>
          )}
        </div>

        {/* Register Certificate Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-yellow-500" />
            Register Certificate
          </h2>
          <p className="text-gray-400 mb-4">
            Register a new HSBC gold certificate. Requires admin privileges and transaction signing.
          </p>
          <form className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">HSBC Reference</label>
              <input
                type="text"
                value={certForm.hsbc_reference}
                onChange={(e) => setCertForm(f => ({ ...f, hsbc_reference: e.target.value }))}
                placeholder="HSBC-2024-001"
                className="w-full bg-gray-700 rounded px-3 py-2 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">Gold Amount (oz)</label>
                <input
                  type="number"
                  step="0.01"
                  value={certForm.gold_amount_oz}
                  onChange={(e) => setCertForm(f => ({ ...f, gold_amount_oz: e.target.value }))}
                  placeholder="10.00"
                  className="w-full bg-gray-700 rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Issue Date</label>
                <input
                  type="date"
                  value={certForm.issue_date}
                  onChange={(e) => setCertForm(f => ({ ...f, issue_date: e.target.value }))}
                  className="w-full bg-gray-700 rounded px-3 py-2 mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm">HSBC Branch</label>
              <input
                type="text"
                value={certForm.hsbc_branch}
                onChange={(e) => setCertForm(f => ({ ...f, hsbc_branch: e.target.value }))}
                placeholder="Hong Kong Main"
                className="w-full bg-gray-700 rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Document Hash (optional)</label>
              <input
                type="text"
                value={certForm.document_hash}
                onChange={(e) => setCertForm(f => ({ ...f, document_hash: e.target.value }))}
                placeholder="SHA256 hash of certificate document"
                className="w-full bg-gray-700 rounded px-3 py-2 mt-1 font-mono text-sm"
              />
            </div>
            <button
              type="button"
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors"
            >
              Register Certificate (Requires Signing)
            </button>
          </form>
        </div>

        {/* Mint Tokens Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-green-500" />
            Mint Tokens
          </h2>
          <p className="text-gray-400 mb-4">
            Mint gold-backed tokens from a registered certificate. Requires admin privileges.
          </p>
          <form className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Certificate ID</label>
              <select
                value={mintForm.certificate_id}
                onChange={(e) => setMintForm(f => ({ ...f, certificate_id: e.target.value }))}
                className="w-full bg-gray-700 rounded px-3 py-2 mt-1"
              >
                <option value="">Select a certificate</option>
                {certData?.certificates
                  .filter(c => c.status === 'Active')
                  .map(c => (
                    <option key={c.certificate_id} value={c.certificate_id}>
                      {c.hsbc_reference} ({c.gold_amount_oz} oz)
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Recipient Address</label>
              <input
                type="text"
                value={mintForm.to}
                onChange={(e) => setMintForm(f => ({ ...f, to: e.target.value }))}
                placeholder="0x..."
                className="w-full bg-gray-700 rounded px-3 py-2 mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Amount (base units)</label>
              <input
                type="text"
                value={mintForm.amount}
                onChange={(e) => setMintForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="1000000000000000000"
                className="w-full bg-gray-700 rounded px-3 py-2 mt-1 font-mono"
              />
              <p className="text-gray-500 text-xs mt-1">1 token = 10^18 base units</p>
            </div>
            <button
              type="button"
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              Mint Tokens (Requires Signing)
            </button>
          </form>
        </div>

        {/* System Info */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-500" />
            System Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">API Endpoint</span>
              <span className="text-white font-mono text-sm">http://localhost:3001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">WebSocket</span>
              <span className="text-white font-mono text-sm">ws://localhost:3001/ws</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Token Decimals</span>
              <span className="text-white">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Consensus</span>
              <span className="text-white">PBFT (Single Node)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
