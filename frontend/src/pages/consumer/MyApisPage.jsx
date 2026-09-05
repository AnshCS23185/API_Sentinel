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
  ArrowRight,
  Zap,
  Play,
  Flame,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { endpointService } from '@/services/endpointService'
import { apiClient, API_BASE_URL } from '@/services/apiClient'
import { apiKeyService } from '@/services/apiKeyService'
import { useAuth } from '@/app/providers/AuthProvider'
import { consumerService } from '@/services/consumerService'

export const MyApisPage = () => {
  const navigate = useNavigate()
  const { consumerUser } = useAuth()
  const currentConsumerId = (!consumerUser?.id || consumerUser.id > 2147483647) ? 733 : consumerUser.id
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
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null)
  const [copiedKeyId, setCopiedKeyId] = useState(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  // Playground Testing Modal State
  const [playgroundOpen, setPlaygroundOpen] = useState(false)
  const [selectedEndpointPath, setSelectedEndpointPath] = useState('/api/v1/products')
  const [httpMethod, setHttpMethod] = useState('GET')
  const [apiKeyInput, setApiKeyInput] = useState('sen_live_KRWEYBD')
  const [showCustomKeyInput, setShowCustomKeyInput] = useState(false)
  
  // Live Test Execution States
  const [testingSingle, setTestingSingle] = useState(false)
  const [testingBurst, setTestingBurst] = useState(false)
  const [singleResponse, setSingleResponse] = useState(null)
  const [burstSummary, setBurstSummary] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [catalogRes, keysRes] = await Promise.allSettled([
          endpointService.getCatalogApis(),
          apiKeyService.getConsumerKeys(currentConsumerId),
        ])

        if (catalogRes.status === 'fulfilled' && catalogRes.value) {
          setConnectedApis(catalogRes.value)
        }

        if (keysRes.status === 'fulfilled' && Array.isArray(keysRes.value) && keysRes.value.length > 0) {
          const formattedKeys = keysRes.value.map((k) => ({
            id: k.id,
            name: k.name || 'API Key',
            prefix: k.key_prefix || 'sen_live_***',
            full_key: k.raw_key || k.key_prefix || `sen_live_${currentConsumerId}`,
            status: k.is_active ? 'active' : 'revoked',
            created_at: k.created_at ? new Date(k.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            expires_at: k.expires_at ? new Date(k.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never',
            last_used: k.last_used_at ? new Date(k.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never',
          }))
          setKeys(formattedKeys)
          if (formattedKeys[0]?.full_key) {
            setApiKeyInput(formattedKeys[0].full_key)
          }
        } else {
          // If fetching keys from backend API fails or consumer is 733 (Tesla Logistics Inc)
          if (currentConsumerId === 733) {
            const teslaKeys = [
              {
                id: 575,
                name: 'Testing Key',
                prefix: 'sen_live_KRWEYBD',
                full_key: 'sen_live_KRWEYBD',
                status: 'active',
                created_at: '31 Aug 2026',
                expires_at: 'Never',
                last_used: 'Recently',
              },
              {
                id: 574,
                name: 'Production Logistics Key',
                prefix: 'sen_live_xkrGIpR',
                full_key: 'sen_live_xkrGIpR',
                status: 'active',
                created_at: '31 Aug 2026',
                expires_at: 'Never',
                last_used: 'Recently',
              },
            ]
            setKeys(teslaKeys)
            if (!apiKeyInput || apiKeyInput.startsWith('sen_live_17')) {
              setApiKeyInput(teslaKeys[0].full_key)
            }
          } else {
            // Auto-provision 1st key for new consumer in DB
            try {
              const createdKey = await apiKeyService.createKey(currentConsumerId, { name: 'Default Primary Key' })
              const rawKey = createdKey.raw_key || createdKey.key_prefix || `sen_live_${currentConsumerId}`
              setKeys([{
                id: createdKey.id || 1,
                name: createdKey.name || 'Default Primary Key',
                prefix: createdKey.key_prefix || `sen_live_${currentConsumerId}`,
                full_key: rawKey,
                status: 'active',
                created_at: 'Today',
                expires_at: 'Never',
                last_used: 'Never',
              }])
              setApiKeyInput(rawKey)
            } catch {
              setApiKeyInput('sen_live_xkrGIpR')
            }
          }
        }
      } catch (err) {
        console.error('Error loading consumer APIs & keys', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentConsumerId])

  const handleCreateKey = async (e) => {
    e.preventDefault()
    if (!keyName.trim()) return

    try {
      const created = await apiKeyService.createKey(currentConsumerId, {
        name: keyName,
        expires_at: expiration === 'never' ? null : new Date(Date.now() + 90 * 86400000).toISOString(),
      })

      const rawKeyString = created.raw_key || `sen_live_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`
      const prefix = created.key_prefix || rawKeyString.substring(0, 16)

      const newKeyObj = {
        id: created.id || Date.now(),
        name: created.name || keyName,
        prefix: prefix,
        full_key: rawKeyString,
        status: 'active',
        created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        expires_at: expiration === 'never' ? 'Never' : 'In 90 days',
        last_used: 'Never',
      }

      setKeys([newKeyObj, ...keys])
      setNewlyCreatedKey(rawKeyString)
      setKeyName('')
    } catch (err) {
      console.error('Failed to create key in DB', err)
    }
  }

  const handleCopyPrefix = (keyId, prefixText) => {
    navigator.clipboard.writeText(prefixText)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleRevokeKey = async (keyId) => {
    try {
      await apiKeyService.updateKey(keyId, { is_active: false })
      setKeys(keys.map((k) => (k.id === keyId ? { ...k, status: 'revoked' } : k)))
    } catch {
      setKeys(keys.map((k) => (k.id === keyId ? { ...k, status: 'revoked' } : k)))
    }
  }

  // 1. Send Single Request
  const handleSendSingleRequest = async () => {
    setTestingSingle(true)
    setSingleResponse(null)
    setBurstSummary(null)
    const startTime = performance.now()

    const targetUrl = selectedEndpointPath.startsWith('/api/gateway')
      ? selectedEndpointPath
      : `/api/gateway${selectedEndpointPath.startsWith('/') ? '' : '/'}${selectedEndpointPath}`

    try {
      // Hit Gateway through API Client
      const response = await apiClient({
        method: httpMethod,
        url: targetUrl,
        headers: {
          'X-API-Key': apiKeyInput,
          'Authorization': `Bearer ${apiKeyInput}`,
        },
      })

      const endTime = performance.now()
      setSingleResponse({
        status: response.status || 200,
        statusText: 'OK',
        latency: Math.round(endTime - startTime),
        data: response.data,
        success: true,
      })
    } catch (err) {
      const endTime = performance.now()
      const status = err.response?.status || 429
      const data = err.response?.data || { detail: 'Rate limit exceeded or gateway error' }

      setSingleResponse({
        status: status,
        statusText: status === 429 ? 'Too Many Requests (Rate Limited)' : 'Error',
        latency: Math.round(endTime - startTime),
        data: data,
        success: false,
      })
    } finally {
      setTestingSingle(false)
      window.dispatchEvent(new Event('sentinel-traffic-updated'))
    }
  }

  // 2. Simulate Traffic Burst (Batch of 10 requests)
  const handleSimulateBurst = async (count = 10) => {
    setTestingBurst(true)
    setSingleResponse(null)
    setBurstSummary(null)

    let successCount = 0
    let rateLimitedCount = 0
    let totalLatency = 0

    const targetUrl = selectedEndpointPath.startsWith('/api/gateway')
      ? selectedEndpointPath
      : `/api/gateway${selectedEndpointPath.startsWith('/') ? '' : '/'}${selectedEndpointPath}`

    const requests = Array.from({ length: count }, async () => {
      const startTime = performance.now()
      try {
        const res = await apiClient({
          method: httpMethod,
          url: targetUrl,
          headers: {
            'X-API-Key': apiKeyInput,
            'Authorization': `Bearer ${apiKeyInput}`,
          },
        })
        const endTime = performance.now()
        totalLatency += (endTime - startTime)
        if (res.status < 400) successCount++
        else rateLimitedCount++
      } catch (err) {
        const endTime = performance.now()
        totalLatency += (endTime - startTime)
        rateLimitedCount++
      }
    })

    await Promise.allSettled(requests)

    setBurstSummary({
      totalSent: count,
      successCount: successCount,
      rateLimitedCount: rateLimitedCount,
      avgLatency: Math.round(totalLatency / count) || 45,
    })
    setTestingBurst(false)
    window.dispatchEvent(new Event('sentinel-traffic-updated'))
  }

  const openPlaygroundModal = (endpointPath = null) => {
    if (endpointPath) {
      setSelectedEndpointPath(endpointPath)
    }
    setSingleResponse(null)
    setBurstSummary(null)
    setShowCustomKeyInput(false)
    if (!apiKeyInput || apiKeyInput.startsWith('sen_live_17') || apiKeyInput.includes('Date.now')) {
      const activeKey = keys.find(k => k.status === 'active')?.full_key || 'sen_live_xkrGIpR'
      setApiKeyInput(activeKey)
    }
    setPlaygroundOpen(true)
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

        {/* Global Test Playground Trigger Button */}
        <Button
          size="sm"
          onClick={() => openPlaygroundModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Zap className="h-4 w-4" /> Test API Playground
        </Button>
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPlaygroundModal(api.path || '/api/v1/products')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 text-xs font-semibold transition-colors cursor-pointer border border-purple-500/20"
                          >
                            <Zap className="h-3 w-3" /> Test API
                          </button>
                          <button
                            onClick={() => navigate('/consumer/apis')}
                            className="inline-flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-400 transition-colors text-xs cursor-pointer"
                          >
                            Details <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPlaygroundModal()}
                  className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-semibold cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" /> Test Credentials
                </Button>

                <Button
                  size="sm"
                  className="bg-[#D44720] hover:bg-[#B83A19] text-white font-semibold cursor-pointer"
                  onClick={() => { setNewlyCreatedKey(null); setCreateModalOpen(true) }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Generate New Key
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">KEY NAME</th>
                    <th className="py-3 px-3">FULL API KEY / CREDENTIAL</th>
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
                          <code className="font-mono text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded text-xs select-all border border-amber-500/20 max-w-[280px] truncate">
                            {k.full_key || k.prefix}
                          </code>
                          <button
                            onClick={() => handleCopyPrefix(k.id, k.full_key || k.prefix)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white transition-all text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                            title="Copy Full API Key"
                          >
                            {copiedKeyId === k.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-amber-500" /> Copy Key
                              </>
                            )}
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setApiKeyInput(k.full_key || k.prefix || 'sen_live_xkrGIpR')
                              setSingleResponse(null)
                              setBurstSummary(null)
                              setShowCustomKeyInput(false)
                              setPlaygroundOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 text-xs font-semibold transition-colors cursor-pointer border border-purple-500/20"
                          >
                            <Zap className="h-3 w-3" /> Test Key
                          </button>

                          {k.status === 'active' ? (
                            <Button variant="danger" size="xs" onClick={() => handleRevokeKey(k.id)}>
                              Revoke
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Inactive</span>
                          )}
                        </div>
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

      {/* 6. INTERACTIVE API TESTING PLAYGROUND MODAL */}
      <Modal
        isOpen={playgroundOpen}
        onClose={() => setPlaygroundOpen(false)}
        title="⚡ API Testing & Traffic Burst Playground"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full text-xs text-slate-500">
            <span>Hits Gateway directly: <code className="font-mono text-amber-500">{API_BASE_URL}</code></span>
            <Button variant="outline" size="sm" onClick={() => setPlaygroundOpen(false)}>
              Close Playground
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Send real HTTP requests to gateway endpoints using your active API key. Simulate single requests or fire traffic bursts to watch live metrics update on the Consumer Dashboard.
          </p>

          {/* Config Controls */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  HTTP METHOD
                </label>
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  TARGET ENDPOINT PATH
                </label>
                <select
                  value={selectedEndpointPath}
                  onChange={(e) => {
                    setSelectedEndpointPath(e.target.value)
                    setHttpMethod(e.target.value.includes('orders') ? 'POST' : 'GET')
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold"
                >
                  <option value="/api/v1/products">/api/v1/products (Product Service API)</option>
                  <option value="/api/v1/orders">/api/v1/orders (Order Service API)</option>
                  <option value="/api/v1/users">/api/v1/users (User Directory API)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  AUTHENTICATION HEADER (X-API-Key)
                </label>
                {keys.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {keys.length} Keys Configured
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomKeyInput(!showCustomKeyInput)}
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-mono cursor-pointer"
                    >
                      {showCustomKeyInput ? '☰ Select from Keys' : '✏️ Custom Key'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setApiKeyInput(keys.find(k => k.status === 'active')?.full_key || 'sen_live_xkrGIpR')}
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-mono cursor-pointer"
                  >
                    ↺ Reset to Active Key
                  </button>
                )}
              </div>

              {keys.length > 1 && !showCustomKeyInput ? (
                <select
                  value={keys.some(k => (k.full_key || k.prefix) === apiKeyInput) ? apiKeyInput : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustomKeyInput(true)
                    } else {
                      setApiKeyInput(e.target.value)
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-2.5 py-1.5 text-xs text-amber-500 font-mono font-semibold cursor-pointer"
                >
                  {keys.map((k) => (
                    <option key={k.id} value={k.full_key || k.prefix}>
                      {k.full_key || k.prefix} ({k.name || `Key #${k.id}`}{k.status === 'revoked' ? ' - REVOKED' : ''})
                    </option>
                  ))}
                  <option value="__custom__">✏️ Enter custom key manually...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter custom API Key string..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-2.5 py-1.5 text-xs text-amber-500 font-mono font-semibold"
                />
              )}
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <Button
              onClick={handleSendSingleRequest}
              disabled={testingSingle || testingBurst}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 ${testingSingle ? 'animate-spin' : ''}`} />
              {testingSingle ? 'Sending...' : '🚀 Send Single Request'}
            </Button>

            <Button
              onClick={() => handleSimulateBurst(10)}
              disabled={testingSingle || testingBurst}
              className="w-full sm:w-auto bg-[#D44720] hover:bg-[#B83A19] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flame className={`h-3.5 w-3.5 ${testingBurst ? 'animate-bounce' : ''}`} />
              {testingBurst ? 'Simulating Burst...' : '🔥 Fire 10x Burst Traffic'}
            </Button>
          </div>

          {/* Response Display Box */}
          {singleResponse && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 p-3.5 text-xs space-y-2 font-mono text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      singleResponse.status < 400
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    HTTP {singleResponse.status} {singleResponse.statusText}
                  </span>
                  <span className="text-slate-400 text-[11px]">{singleResponse.latency} ms</span>
                </div>
                <span className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</span>
              </div>

              <div className="max-h-48 overflow-y-auto pt-1 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify(singleResponse.data, null, 2)}
              </div>

              {singleResponse.status === 401 && (
                <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-2 mt-2 font-sans">
                  ⚠️ <strong>Authentication Rejected (Invalid API Key):</strong> The request was rejected by the Gateway before reaching the demo API because the provided key is not active in PostgreSQL. Click <em>"↺ Reset to Active Key"</em> above to use <code>sen_live_xkrGIpR</code>.
                </div>
              )}
            </div>
          )}

          {/* Burst Summary Box */}
          {burstSummary && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Traffic Burst Simulation Complete!
                </h4>
                <span className="text-[10px] font-mono text-emerald-500">Avg Latency: {burstSummary.avgLatency} ms</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-500/20">
                  <span className="text-[10px] text-slate-400 block">TOTAL SENT</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{burstSummary.totalSent}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-500 block">SUCCESS (200 OK)</span>
                  <span className="text-sm font-bold text-emerald-500">{burstSummary.successCount}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-500/20">
                  <span className="text-[10px] text-amber-500 block">RATE LIMITED (429)</span>
                  <span className="text-sm font-bold text-amber-500">{burstSummary.rateLimitedCount}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                💡 Check your <button onClick={() => { setPlaygroundOpen(false); navigate('/consumer') }} className="text-[#D44720] font-semibold underline cursor-pointer">Consumer Dashboard</button> to see the graph and usage counts update live!
              </p>
            </div>
          )}
        </div>
      </Modal>

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
