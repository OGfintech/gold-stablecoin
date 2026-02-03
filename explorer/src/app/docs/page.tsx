'use client'

import { useState } from 'react'
import { FileText, Book, Rocket, Users, Shield, ChevronRight, ExternalLink, CheckCircle, Clock, AlertCircle, ScrollText, ShoppingCart, Lock, Mic, Building2, ClipboardList, Coins, Globe, TrendingUp } from 'lucide-react'

interface DocItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'complete' | 'in_progress' | 'planning'
  fileName: string
  sections: string[]
}

const docs: DocItem[] = [
  {
    id: 'whitepaper',
    title: 'Whitepaper',
    description: 'Project whitepaper - 14 industry-standard sections',
    icon: <ScrollText className="w-6 h-6" />,
    status: 'in_progress',
    fileName: 'whitepaper/WHITEPAPER.md',
    sections: [
      '1. Abstract / Executive Summary',
      '2. Problem Statement',
      '3. Solution Overview',
      '4. Market Opportunity',
      '5. Technical Architecture',
      '6. Tokenomics',
      '7. Gold Custody & Verification ✓',
      '8. Regulatory Compliance',
      '9. Security Framework ✓',
      '10. Governance Model',
      '11. Roadmap',
      '12. Team & Advisors',
      '13. Risk Factors',
      '14. Legal Disclaimers'
    ]
  },
  {
    id: 'hsbc-custody',
    title: 'HSBC Custody & Minting Flow',
    description: 'Certificate-triggered minting process via HSBC Trust Account',
    icon: <Building2 className="w-6 h-6" />,
    status: 'complete',
    fileName: 'whitepaper/CUSTODY_MINTING_FLOW.md',
    sections: [
      'Executive Summary ✓',
      'The STTAURX Minting Flow (7 Steps) ✓',
      'Key Differentiators vs PAXG/XAUT ✓',
      'Certificate Data Structure (JSON) ✓',
      'Regulatory & Compliance Advantages ✓',
      'Comparison: Token Purchase Flows ✓',
      'Gold Broker Relationship ✓',
      'Trust Account Structure ✓'
    ]
  },
  {
    id: 'whitepaper-tasks',
    title: 'Whitepaper & Deck Tasks',
    description: 'Task tracker for whitepaper and business deck development',
    icon: <ClipboardList className="w-6 h-6" />,
    status: 'in_progress',
    fileName: 'whitepaper/WHITEPAPER_TASKS.md',
    sections: [
      'HSBC Certificate-Triggered Minting ✓',
      'Apple Approach Positioning ✓',
      'NASDAQ/NYSE/LSEG Research ✓',
      'Gold Token Problems Research ✓',
      'Market Statistics 2026 ✓',
      'White Paper Section Status',
      'Business Deck Slide Status',
      'Next Actions Checklist'
    ]
  },
  {
    id: 'tokenomics',
    title: 'Tokenomics Review',
    description: 'Founders decision document on token economics and allocations',
    icon: <Coins className="w-6 h-6" />,
    status: 'complete',
    fileName: 'whitepaper/TOKENOMICS_REVIEW.md',
    sections: [
      'Token Basics (1 gram = 1 token) ✓',
      'Gold-Backed vs Typical Crypto ✓',
      'Pre-Mine Analysis ✓',
      'Team Allocation Decision ✓',
      'Investor Tokens Decision ✓',
      'Airdrops Analysis ✓',
      'Fee Structure Proposal ✓',
      'Whitepaper Statement ✓'
    ]
  },
  {
    id: 'staking-yield',
    title: 'Staking Yield Model',
    description: 'Smart Letter of Credit facilitation for 5% APY',
    icon: <TrendingUp className="w-6 h-6" />,
    status: 'complete',
    fileName: 'whitepaper/STAKING_YIELD_MODEL.md',
    sections: [
      'What is a Letter of Credit ✓',
      'STTAURX Smart LC Model ✓',
      'Multiple LCs Per Transaction ✓',
      'Yield Calculation (5% APY) ✓',
      'Smart Contract Structure ✓',
      'Risk Management ✓',
      'Competitive Advantage ✓',
      'Disclosure Requirements ✓'
    ]
  },
  {
    id: 'trade-finance',
    title: 'Trade Finance Market Research',
    description: 'Market data supporting Smart LC model ($55B+ market)',
    icon: <Globe className="w-6 h-6" />,
    status: 'complete',
    fileName: 'whitepaper/TRADE_FINANCE_MARKET_RESEARCH.md',
    sections: [
      'Trade Finance Market Size ($55B) ✓',
      'LC Market Size ($4.7B) ✓',
      'Trade Credit Insurance Market ✓',
      'Top Trade Finance Institutions ✓',
      'Key Growth Drivers ✓',
      'STTAURX Market Opportunity ✓',
      'Commodity Trade Finance ✓',
      'Recent Industry Developments ✓'
    ]
  },
  {
    id: 'global-trade-flows',
    title: 'Global Trade Flows',
    description: 'China-Latin America trade corridor analysis (Mexico focus)',
    icon: <Globe className="w-6 h-6" />,
    status: 'complete',
    fileName: 'whitepaper/GLOBAL_TRADE_FLOWS.md',
    sections: [
      'Global Trade Overview ($32T) ✓',
      'China Trade Statistics ($6.54T) ✓',
      'China-Latin America Corridor ($550B) ✓',
      'Mexico-China Deep Dive ($139.7B) ✓',
      'Nearshoring Opportunity ✓',
      'Commodity Trade Flows ✓',
      'STTAURX Market Opportunity ✓',
      'Mexico Office Strategic Value ✓'
    ]
  },
  {
    id: 'startup',
    title: 'Startup List',
    description: 'How to start all services - Mock Server, Explorer, Wallet',
    icon: <Rocket className="w-6 h-6" />,
    status: 'complete',
    fileName: 'STARTUP_LIST.md',
    sections: [
      'Quick Start (All Services)',
      'Individual Service Startup',
      'Terminal Setup',
      'DigitalOcean Droplet',
      'Troubleshooting'
    ]
  },
  {
    id: 'buckets',
    title: 'Onboarding Buckets',
    description: 'Complete user journey - Wallet → Deposits → Minting → Active',
    icon: <Users className="w-6 h-6" />,
    status: 'planning',
    fileName: 'ONBOARDING_BUCKETS.md',
    sections: [
      'Bucket 1: Wallet Onboarding',
      'Bucket 2: Deposit Flow (USDT, Bank, Upload, Cash)',
      'Bucket 3: Minting Process',
      'Bucket 4: Completed Users',
      'Admin Drag-Drop System',
      'Email Notifications'
    ]
  },
  {
    id: 'user-onboarding',
    title: 'User Onboarding Plan',
    description: 'Wallet UI onboarding implementation phases',
    icon: <Book className="w-6 h-6" />,
    status: 'in_progress',
    fileName: 'USER_ONBOARDING_PLAN.md',
    sections: [
      'Phase 1: Welcome Flow ✓',
      'Phase 2: Wallet Creation',
      'Phase 3: KYC (Optional)',
      'Phase 4: Feature Tour',
      'Phase 5: Personalization',
      'Phase 6: Re-engagement'
    ]
  },
  {
    id: 'admin',
    title: 'Admin Workflow Plan',
    description: 'Admin dashboard implementation phases',
    icon: <Shield className="w-6 h-6" />,
    status: 'in_progress',
    fileName: 'ADMIN_WORKFLOW_PLAN.md',
    sections: [
      'Phase 1: Core Admin Functions',
      'Phase 2: Authentication',
      'Phase 3: Certificate Management',
      'Phase 4: Token Minting',
      'Phase 5: User Management',
      'Phase 6: System Monitoring',
      'Phase 7: Audit & Compliance'
    ]
  },
  {
    id: 'marketplace',
    title: 'Marketplace App Plan',
    description: 'B2B commodities trading platform with Smart Letters of Credit',
    icon: <ShoppingCart className="w-6 h-6" />,
    status: 'in_progress',
    fileName: 'MARKETPLACE_PLAN.md',
    sections: [
      'Phase 2.1: Core Setup ✓',
      'Phase 2.2: Public Pages ✓',
      'Phase 2.3: Supplier Portal ✓',
      'Phase 2.4: Buyer Portal ✓',
      'Phase 2.5: Smart LC Components',
      'Phase 2.6: Shared Components',
      'Phase 2.7: Mock Server API ✓'
    ]
  },
  {
    id: 'security-portal',
    title: 'Security Portal',
    description: 'Iron Man-style animated landing page with voice/keyboard activation',
    icon: <Lock className="w-6 h-6" />,
    status: 'complete',
    fileName: 'SECURITY_PORTAL.md',
    sections: [
      'Voice Activation ("Initialize Protocol OG") ✓',
      'Keyboard Shortcut (Ctrl+Shift+A) ✓',
      'Security Icons Animation (10 icons) ✓',
      'Password Protection (AUTrade88) ✓',
      'Glowing Input Fields ✓',
      'Audio Feedback (beeps) ✓',
      'Session Authentication ✓',
      'Admin Controls (Planned)'
    ]
  },
  {
    id: 'security-admin-plan',
    title: 'Security Admin Plan',
    description: 'Admin controls for updating portal password and voice phrase',
    icon: <Shield className="w-6 h-6" />,
    status: 'planning',
    fileName: 'SECURITY_ADMIN_PLAN.md',
    sections: [
      'Phase 1: Backend API (securitySettings.json)',
      'Phase 2: Admin UI (/admin/security)',
      'Phase 3: Start Page API Integration',
      'Phase 4: Testing & Polish'
    ]
  }
]

const statusConfig = {
  complete: { label: 'Complete', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  planning: { label: 'Planning', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: AlertCircle }
}

export default function DocsPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          Documentation
        </h1>
        <p className="text-gray-400">Project planning & reference docs</p>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-600/30">
        <h2 className="text-xl font-semibold mb-4">Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Services</p>
            <ul className="space-y-1">
              <li><code className="text-cyan-400">:3000/start</code> Security Portal ⭐</li>
              <li><code className="text-green-400">:3000</code> Explorer + Admin</li>
              <li><code className="text-yellow-400">:3001</code> Mock API Server</li>
              <li><code className="text-blue-400">:3002</code> Wallet</li>
              <li><code className="text-purple-400">:3003</code> Marketplace</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 mb-2">User Buckets</p>
            <ul className="space-y-1">
              <li><span className="text-purple-400">B1:</span> Wallet Onboarding</li>
              <li><span className="text-blue-400">B2:</span> Deposits</li>
              <li><span className="text-yellow-400">B3:</span> Minting</li>
              <li><span className="text-green-400">B4:</span> Completed</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Deposit Types</p>
            <ul className="space-y-1">
              <li><span className="text-cyan-400">USDT</span> - Auto-detect</li>
              <li><span className="text-green-400">BANK</span> - Wire transfer</li>
              <li><span className="text-yellow-400">UPLOAD</span> - Screenshot proof</li>
              <li><span className="text-orange-400">CASH</span> - Admin initiated</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Security Portal</p>
            <ul className="space-y-1">
              <li><span className="text-cyan-400">Ctrl+Shift+A</span> - Activate</li>
              <li><span className="text-purple-400">Voice:</span> "Initialize Protocol OG"</li>
              <li><span className="text-yellow-400">Password:</span> AUTrade88</li>
              <li><span className="text-red-400">Max:</span> 5 attempts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Doc Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {docs.map((doc) => {
          const status = statusConfig[doc.status]
          const StatusIcon = status.icon
          const isExpanded = selectedDoc === doc.id

          return (
            <div
              key={doc.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setSelectedDoc(isExpanded ? null : doc.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-700 rounded-lg text-blue-400">
                      {doc.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{doc.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{doc.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        <span className="text-gray-500 text-xs">{doc.fileName}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-700 pt-4">
                  <p className="text-gray-400 text-sm mb-3">Sections:</p>
                  <ul className="space-y-2">
                    {doc.sections.map((section, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 flex items-center justify-center bg-gray-700 rounded text-xs text-gray-400">
                          {idx + 1}
                        </span>
                        <span className={section.includes('✓') ? 'text-green-400' : 'text-gray-300'}>
                          {section}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-500 text-xs">
                      📁 Location: <code className="text-gray-400">docs/{doc.fileName}</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* File Locations */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-gray-400" />
          Open in Editor
        </h2>
        <p className="text-gray-400 text-sm mb-4">Run in terminal to open docs folder:</p>
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
          <p className="text-green-400"># VS Code</p>
          <p className="text-white mb-3">code ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/docs/</p>
          <p className="text-green-400"># Finder</p>
          <p className="text-white">open ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/docs/</p>
        </div>
      </div>

      {/* Implementation Status */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Implementation Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Wallet Onboarding (Phase 1)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Admin Dashboard (Basic)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Certificate Preview</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Send Tokens Page</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Bucket System</span>
            <span className="text-yellow-400">◐ Planning</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Admin Drag-Drop</span>
            <span className="text-yellow-400">◐ Planning</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Email System</span>
            <span className="text-gray-500">○ Not Started</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">KYC Integration</span>
            <span className="text-gray-500">○ Not Started</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Whitepaper</span>
            <span className="text-yellow-400">◐ In Progress</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">Whitepaper Research & Documentation</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Tokenomics Review (No Pre-Mine)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Staking Yield Model (Smart LC)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Trade Finance Market Research</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Global Trade Flows (China-LatAm)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Mexico Office Strategy</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Gold Token Problems Research</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">NASDAQ/NYSE Blockchain Examples</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">HSBC Custody & Minting (Key Differentiator)</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Certificate-Triggered Minting Model</span>
            <span className="text-green-400">✓ Documented</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">HSBC Trust Account Structure</span>
            <span className="text-green-400">✓ Documented</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Top-6 Gold Broker Supply Chain</span>
            <span className="text-green-400">✓ Documented</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Certificate Data Structure (JSON)</span>
            <span className="text-green-400">✓ Documented</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Competitor Comparison (PAXG/XAUT)</span>
            <span className="text-green-400">✓ Documented</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Regulatory Advantages</span>
            <span className="text-green-400">✓ Documented</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">Marketplace App</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Core Setup (Phase 2.1)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Public Pages (Phase 2.2)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Supplier Portal (Phase 2.3)</span>
            <span className="text-green-400">✓ Mostly Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Buyer Portal (Phase 2.4)</span>
            <span className="text-green-400">✓ Mostly Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Smart LC Components (Phase 2.5)</span>
            <span className="text-yellow-400">◐ In Progress</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Shared Components (Phase 2.6)</span>
            <span className="text-gray-500">○ Not Started</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Mock Server API (Phase 2.7)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">Security Portal (/start)</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Full-Screen Landing Page</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Voice Activation ("Initialize Protocol OG")</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Keyboard Shortcut (Ctrl+Shift+A)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">10 Security Icons Animation</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Audio Feedback (Beeps)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Glowing Password Input</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Password Protection (AUTrade88)</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">5-Attempt Lockout</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Voice Disabled After Start</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Session Authentication</span>
            <span className="text-green-400">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Admin Password Controls</span>
            <span className="text-blue-400">◐ Planned</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Admin Voice Phrase Controls</span>
            <span className="text-blue-400">◐ Planned</span>
          </div>
        </div>
      </div>
    </div>
  )
}
