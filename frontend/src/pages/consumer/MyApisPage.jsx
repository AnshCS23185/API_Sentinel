import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database,
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Info,
  ExternalLink,
  ShoppingBag,
  ShoppingCart,
  Users,
  Layers,
  Code,
  CheckCircle,
  MoreVertical,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { endpointService } from '@/services/endpointService'

export const MyApisPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('apis') // 'apis' | 'keys'

  // Connected APIs state
  const [connectedApis, setConnectedApis] = useState([])
  
  // API Keys state
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)

  // Create Key Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [expiration, setExpiration] = useState('never')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null) // Raw key string displayed ONCE
  const [copiedKeyId, setCopiedKeyId] = useState(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const catalog = await endpointService.getCatalogApis()
        setConnectedApis(catalog || [])

        // Demo/Real keys matching reference design exact format
        setKeys([
          {
            id: 1,
            name: 'Production Primary Key',
            prefix: 'sen_live_CrWNGEN9',
            status: 'active',
            created_at: '15 Aug 2026',
            expires_at: 'Never',
            last_used: '2 minutes ago',
          },
          {
            id: 2,
            name: 'Staging Integration Key',
            prefix: 'sen_live_H2pgo8L9',
            status: 'active',
            created_at: '20 Aug 2026',
            expires_at: '20 Aug 2027',
            last_used: '1 hour ago',
          },
        ])
      } catch (err) {
        console.error('Error loading consumer APIs & keys', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateKey = (e) => {
    e.preventDefault()
    if (!keyName.trim()) return

    // Generate simulated raw key once
    const randomSecret = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')
    const rawKeyString = `sen_live_${randomSecret}`
    const prefix = `sen_live_${randomSecret.substring(0, 8)}`

    const newKeyObj = {
      id: Date.now(),
      name: keyName,
      prefix: prefix,
      status: 'active',
      created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expires_at: expiration === 'never' ? 'Never' : 'In 90 days',
      last_used: 'Never',
    }

    setKeys([newKeyObj, ...keys])
    setNewlyCreatedKey(rawKeyString)
    setKeyName('')
  }

  const handleCopyPrefix = (keyId, prefixText) => {
    navigator.clipboard.writeText(prefixText)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleRevokeKey = (keyId) => {
    setKeys(keys.map((k) => (k.id === keyId ? { ...k, status: 'revoked' } : k)))
  }

  // Helper icon selector
  const getApiIcon = (name) => {
    const lower = name?.toLowerCase() || ''
    if (lower.includes('product')) return <ShoppingBag className="h-4 w-4 text-amber-500" />
    if (lower.includes('order')) return <ShoppingCart className="h-4 w-4 text-blue-400" />
    return <Users className="h-4 w-4 text-purple-400" />
  }

  return (
    <div className="space-y-5 text-main-color">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My APIs & Keys
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            View the APIs you are connected to and manage your API key credentials.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('apis')}
          className={`flex items-center gap-2 pb-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'apis'
              ? 'border-[#D44720] text-[#D44720]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="h-4 w-4" /> My APIs
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 pb-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'keys'
              ? 'border-[#D44720] text-[#D44720]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="h-4 w-4" /> API Keys
        </button>
      </div>

      {/* 2. TOP METRIC OVERVIEW BANNER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800/80 gap-2 sm:gap-0">
          <div className="flex items-center gap-3 px-2 sm:px-4 first:pl-0">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block leading-tight">
                {connectedApis.length || 3}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Connected APIs</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block leading-tight">
                28
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Available Endpoints</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4">
            <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <Code className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block leading-tight">
                REST
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Protocol</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block leading-tight">
                100%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">APIs Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONNECTED APIS SECTION / TABLE */}
      {activeTab === 'apis' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">API NAME</th>
                    <th className="py-3 px-3">GATEWAY PATH</th>
                    <th className="py-3 px-3">ENDPOINTS</th>
                    <th className="py-3 px-3">PLAN</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3">LAST USED</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {connectedApis.map((api, idx) => (
                    <tr key={api.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                            {getApiIcon(api.name)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                              {api.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {api.description}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 font-mono text-xs font-semibold text-amber-500">{api.path}</td>
                      <td className="py-4 px-3 font-semibold text-slate-800 dark:text-slate-200">{api.endpoints_count || (idx === 0 ? 12 : idx === 1 ? 9 : 7)}</td>
                      <td className="py-4 px-3 font-semibold text-amber-500">Pro Plan</td>
                      <td className="py-4 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> CONNECTED
                        </span>
                      </td>
                      <td className="py-4 px-3 text-slate-500">{idx === 0 ? '2 minutes ago' : idx === 1 ? '1 hour ago' : '5 hours ago'}</td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => navigate('/consumer/apis')}
                          className="inline-flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-400 transition-colors text-xs cursor-pointer"
                        >
                          View Details <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. API KEYS SECTION / TABLE */}
      {activeTab === 'keys' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">API Keys</h3>
                <p className="text-xs text-slate-500">Manage your API key credentials and access.</p>
              </div>

              <Button
                size="sm"
                className="bg-[#D44720] hover:bg-[#B83A19] text-white font-semibold self-start sm:self-auto cursor-pointer"
                onClick={() => { setNewlyCreatedKey(null); setCreateModalOpen(true) }}
              >
                <Plus className="h-4 w-4 mr-1" /> Generate New Key
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">KEY NAME</th>
                    <th className="py-3 px-3">KEY PREFIX ⓘ</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3">CREATED DATE</th>
                    <th className="py-3 px-3">EXPIRES AT</th>
                    <th className="py-3 px-3">LAST USED</th>
                    <th className="py-3 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-3 font-bold text-slate-900 dark:text-slate-100">{k.name}</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-500 font-semibold">{k.prefix}</span>
                          <button
                            onClick={() => handleCopyPrefix(k.id, k.prefix)}
                            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                            title="Copy Prefix"
                          >
                            {copiedKeyId === k.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            k.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${k.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {k.status === 'active' ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-slate-500">{k.created_at}</td>
                      <td className="py-4 px-3 text-slate-500">{k.expires_at}</td>
                      <td className="py-4 px-3 text-slate-500">{k.last_used}</td>
                      <td className="py-4 px-3 text-right">
                        {k.status === 'active' ? (
                          <Button variant="danger" size="xs" onClick={() => handleRevokeKey(k.id)}>
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. BOTTOM NOTICE BANNER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Protect your API keys</h4>
            <p className="text-[11px] text-slate-500">Never share your API keys publicly. Revoked keys cannot be recovered.</p>
          </div>
        </div>

        <button
          onClick={() => setInfoModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors shrink-0 cursor-pointer"
        >
          Learn more <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Generate Key Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={newlyCreatedKey ? 'API Key Generated' : 'Create New API Key'}
        size="md"
      >
        {!newlyCreatedKey ? (
          <form onSubmit={handleCreateKey} className="space-y-4">
            <Input
              label="Key Name / Identifier"
              placeholder="e.g. Production Primary Key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
            />
            <Select
              label="Key Expiration"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              options={[
                { value: 'never', label: 'Never Expires' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' },
                { value: '1y', label: '1 Year' },
              ]}
            />
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#D44720] hover:bg-[#B83A19] text-white">
                Generate Credentials
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Please copy your raw API key now. For security purposes, this key will <strong>never be displayed again</strong>.
              </span>
            </div>

            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg flex items-center justify-between break-all border border-slate-800">
              <span>{newlyCreatedKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newlyCreatedKey)
                  setCopiedKeyId('new')
                  setTimeout(() => setCopiedKeyId(null), 2000)
                }}
                className="ml-2 p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                {copiedKeyId === 'new' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setCreateModalOpen(false)}>Done & Saved</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="API Key Security Guidelines"
        size="md"
      >
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <p>
            API keys authenticate requests sent to API Sentinel Gateway endpoints. Treat your API keys as secrets.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Never store raw API keys in client-side repositories or public codebases.</li>
            <li>Store keys securely using server environment variables.</li>
            <li>Rotate keys periodically if compromise is suspected.</li>
          </ul>
          <div className="pt-2 flex justify-end">
            <Button onClick={() => setInfoModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
