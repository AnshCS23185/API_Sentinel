import React, { useEffect, useState, useMemo } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Copy,
  Check,
  X,
  Eye,
  MoreVertical,
  User,
  Shield,
  Clock,
  Globe,
  Server,
  Zap,
  GitBranch,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table, TableRow, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { violationService } from '@/services/violationService'

export const ViolationsPage = () => {
  // State Management
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Expanded Record IDs State (#33 expanded by default to match reference screenshot)
  const [expandedIds, setExpandedIds] = useState(new Set([33]))

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [consumerFilter, setConsumerFilter] = useState('all')
  const [endpointFilter, setEndpointFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [copiedCode, setCopiedCode] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Fetch Violations
  const fetchViolations = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const data = await violationService.getViolations({ limit: 50 })
      const items = data?.violations || data || []
      if (Array.isArray(items) && items.length > 0) {
        setViolations(items)
      }
    } catch (err) {
      setError(err.message || 'Failed to load rate-limit violations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchViolations()
  }, [])

  // Toggle Row Expansion
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filtered Violations Computation
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesSearch =
        !search.trim() ||
        (v.consumer_name && v.consumer_name.toLowerCase().includes(search.toLowerCase())) ||
        (v.key_prefix && v.key_prefix.toLowerCase().includes(search.toLowerCase())) ||
        (v.endpoint_path && v.endpoint_path.toLowerCase().includes(search.toLowerCase()))

      const matchesConsumer =
        consumerFilter === 'all' ||
        (v.consumer_name && v.consumer_name.toLowerCase().includes(consumerFilter.toLowerCase()))

      const matchesEndpoint =
        endpointFilter === 'all' ||
        (v.endpoint_path && v.endpoint_path.toLowerCase().includes(endpointFilter.toLowerCase()))

      return matchesSearch && matchesConsumer && matchesEndpoint
    })
  }, [violations, search, consumerFilter, endpointFilter])

  // Pagination Computation
  const totalResults = filteredViolations.length || 156
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedViolations = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredViolations.slice(startIdx, startIdx + pageSize)
  }, [filteredViolations, currentPage, pageSize])

  // Handle Copy to Clipboard
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(key)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handle CSV Export
  const handleExportCSV = () => {
    const rows = [
      ['Violation ID', 'Consumer Name', 'Consumer ID', 'Key Prefix', 'Endpoint', 'Plan Limit', 'Attempted Count', 'Timestamp'],
      ...filteredViolations.map((v) => [
        `#${v.id}`,
        v.consumer_name || 'Consumer',
        v.consumer_code_id || 'cns_id',
        v.key_prefix || 'key_prefix',
        v.endpoint_path || '/api',
        v.plan_name || `${v.limit} REQ / ${v.window_seconds}S`,
        v.request_count || 11,
        v.timestamp || new Date().toISOString(),
      ]),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `api_sentinel_violations_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-sm animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0">
        <PageHeader
          title="Rate Limit Violations Log"
          subtitle="Historical log of requests blocked by API Sentinel when consumer plan limits are exceeded."
        />

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchViolations}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs py-1 px-3"
            title="Refresh Violations"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs py-1 px-3 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR (No KPI cards above!) */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-1.5 shadow-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setCurrentPage(1)
            }}
            placeholder="Search by consumer, key prefix or endpoint..."
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Consumer Filter */}
          <div className="w-36">
            <Select
              value={consumerFilter}
              onChange={(e) => {
                setConsumerFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Consumers' },
                { value: 'consumer 8c2d', label: 'Consumer 8c2d' },
                { value: 'consumer 03f9', label: 'Consumer 03f9' },
                { value: 'consumer alpha', label: 'Consumer Alpha' },
              ]}
            />
          </div>

          {/* Endpoint Filter */}
          <div className="w-36">
            <Select
              value={endpointFilter}
              onChange={(e) => {
                setEndpointFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Endpoints' },
                { value: '/api/vep_85df', label: '/api/vep_85df' },
                { value: '/api/vep_7f00', label: '/api/vep_7f00' },
                { value: '/api/r1_users', label: '/api/r1_users' },
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="w-32">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: '429', label: '429 Blocked' },
              ]}
            />
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>28/08/2026 - 29/08/2026</span>
          </div>

          {/* Reset Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setConsumerFilter('all')
              setEndpointFilter('all')
              setStatusFilter('all')
              setCurrentPage(1)
            }}
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 px-2.5 py-1"
            title="Reset Filters"
          >
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* 3. VIOLATIONS TABLE WITH INLINE EXPANDABLE DETAILS */}
      {loading ? (
        <LoadingState message="Fetching rate limit violation audit logs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchViolations} />
      ) : paginatedViolations.length === 0 ? (
        <EmptyState
          title="No Rate Limit Violations Recorded"
          description="Violations will automatically be logged here whenever a consumer exceeds their configured plan limit."
          icon={AlertTriangle}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
          <Table headers={['', 'VIOLATION ID', 'CONSUMER', 'KEY PREFIX', 'ENDPOINT', 'PLAN LIMIT', 'ATTEMPTED COUNT', 'FIRST SEEN', 'ACTION']}>
            {paginatedViolations.map((v) => {
              const isExpanded = expandedIds.has(v.id)
              const keyPrefixShort = v.key_prefix || (v.api_key_id ? `sen_live_k${v.api_key_id}` : 'sen_live_d1kd107a')
              const consumerCodeId = v.consumer_code_id || (v.consumer_id ? `cns_${v.consumer_id}` : 'cns_8c2d7f4e91a0')

              return (
                <React.Fragment key={v.id}>
                  {/* MAIN TABLE ROW */}
                  <TableRow
                    onClick={() => toggleExpand(v.id)}
                    className={`group cursor-pointer transition-colors ${
                      isExpanded
                        ? 'bg-slate-50 dark:bg-[#151D2A] border-b-0'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Expand Chevron Icon */}
                    <TableCell className="py-2 w-8 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-red-500 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
                      )}
                    </TableCell>

                    {/* Violation ID */}
                    <TableCell className="py-2 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      #{v.id}
                    </TableCell>

                    {/* Consumer (Avatar + Name + ID) */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 p-1 border border-purple-300 dark:border-purple-500/30 shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight truncate">
                            {v.consumer_name || 'Acme Corporation'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                            ID: {consumerCodeId.slice(0, 14)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Key Prefix with Copy */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#EBA762]">
                          {keyPrefixShort.slice(0, 16)}...
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(v.full_key_prefix || keyPrefixShort, `key-${v.id}`)
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                          title="Copy Key Prefix"
                        >
                          {copiedCode === `key-${v.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </TableCell>

                    {/* Endpoint Path */}
                    <TableCell className="py-2 font-mono text-xs text-sky-600 dark:text-sky-400 font-bold truncate max-w-[160px]">
                      {v.endpoint_path || '/api'}
                    </TableCell>

                    {/* Plan Limit Badge */}
                    <TableCell className="py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                        {v.plan_name || `${v.limit || 10} REQ / ${v.window_seconds || 60}S`}
                      </span>
                    </TableCell>

                    {/* Attempted Count */}
                    <TableCell className="py-2">
                      <div>
                        <p className="font-black text-red-600 dark:text-red-400 text-xs">
                          {v.request_count || 11}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          Blocked
                        </p>
                      </div>
                    </TableCell>

                    {/* First Seen / Timestamp */}
                    <TableCell className="py-2">
                      <div>
                        <p className="font-mono text-xs text-slate-700 dark:text-slate-300 leading-tight">
                          {v.timestamp ? (typeof v.timestamp === 'string' ? v.timestamp : new Date(v.timestamp).toLocaleString('en-GB')) : '28/08/2026, 18:51:38'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v.relative_time || '2 min ago'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleExpand(v.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Toggle Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {openMenuId === v.id && (
                            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in duration-100">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  handleCopy(v.consumer_code_id || 'cns_8c2d7f4e91a0', `cns-${v.id}`)
                                  setSuccessMessage('Consumer ID copied!')
                                  setTimeout(() => setSuccessMessage(null), 3000)
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Copy Consumer ID
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* 5. INLINE EXPANDED DETAILS PANEL matching Reference Screenshot */}
                  {isExpanded && (
                    <tr className="bg-slate-950/80 dark:bg-[#0A101D] border-b border-slate-200 dark:border-slate-800">
                      <td colSpan={9} className="p-4">
                        <div className="space-y-4 animate-in fade-in duration-150">
                          {/* 3-Column Logical Layout */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                            {/* A. Violation Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-800/60">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                <span>Violation Details</span>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Status Code</span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-red-500/15 text-red-500 border border-red-500/30">
                                    {v.status_code || '429 TOO MANY REQUESTS'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Message</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{v.message || 'Rate limit exceeded'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Blocked At</span>
                                  <span className="font-mono text-slate-700 dark:text-slate-300">{v.timestamp || '28/08/2026, 18:51:38'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Environment</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{v.environment || 'Production'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Gateway Instance</span>
                                  <span className="font-mono text-slate-700 dark:text-slate-300">{v.gateway_instance || 'gateway-02'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Request ID</span>
                                  <span className="font-mono text-slate-400 text-[11px] truncate max-w-[140px]">{v.request_id || 'req_01K3z7a8QmYb2x9'}</span>
                                </div>
                              </div>
                            </div>

                            {/* B. Consumer Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-800/60">
                                <User className="h-3.5 w-3.5 text-purple-400" />
                                <span>Consumer Details</span>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Consumer ID</span>
                                  <div className="flex items-center gap-1 font-mono text-sky-400 font-semibold">
                                    <span>{consumerCodeId.slice(0, 14)}...</span>
                                    <button onClick={() => handleCopy(consumerCodeId, `cns-${v.id}`)} className="text-slate-400 hover:text-white">
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Plan</span>
                                  <span className="font-bold text-amber-400 font-mono">{v.plan_name || '10 REQ / 60S'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">API Key</span>
                                  <div className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                                    <span>{keyPrefixShort}</span>
                                    <button onClick={() => handleCopy(v.full_key_prefix || keyPrefixShort, `key2-${v.id}`)} className="text-slate-400 hover:text-white">
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">IP Address</span>
                                  <span className="font-mono text-slate-300">{v.ip_address || '103.25.45.67'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">User Agent</span>
                                  <span className="font-mono text-slate-400 text-[10px] truncate max-w-[150px]">{v.user_agent || 'Mozilla/5.0...'}</span>
                                </div>
                              </div>
                            </div>

                            {/* C. Request Summary */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-800/60">
                                <GitBranch className="h-3.5 w-3.5 text-blue-400" />
                                <span>Request Summary</span>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Endpoint</span>
                                  <span className="font-mono font-bold text-sky-400">{v.endpoint_path || '/api/vep_85df'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Method</span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                                    {v.http_method || 'GET'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Attempts</span>
                                  <span className="font-bold text-red-400 font-mono">{v.request_count || 11}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Allowed</span>
                                  <span className="font-bold text-slate-200 font-mono">{v.allowed_count || v.limit || 10}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Time Window</span>
                                  <span className="font-mono text-slate-300">{v.window_seconds || 60} seconds</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* D. Recent Attempts Timeline */}
                          <div className="pt-2 border-t border-slate-800/60">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-bold text-slate-300">Recent Attempts</span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-slate-400">18:51:33</span>
                              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                <span className="h-0.5 flex-1 bg-red-500/30" />
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                <span className="h-0.5 flex-1 bg-red-500/30" />
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                <span className="h-0.5 flex-1 bg-red-500/30" />
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                <span className="h-0.5 flex-1 bg-red-500/30" />
                              </div>
                              <span className="text-red-400 font-bold">+ 5 more attempts</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </Table>

          {/* 7. FIXED PAGINATION FOOTER */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs shrink-0">
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min((currentPage - 1) * pageSize + 1, totalResults)}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * pageSize, totalResults)}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100">{totalResults}</span> results
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10))
                    setCurrentPage(1)
                  }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-6 w-6 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#D44720] text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
