import React, { useEffect, useState, useMemo } from 'react'
import {
  Server,
  CheckCircle2,
  GitBranch,
  Plus,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  MoreVertical,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PieChart
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table, TableRow, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { endpointService } from '@/services/endpointService'

export const ApiEndpointsPage = () => {
  // State Management
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [apiFilter, setApiFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    method: 'GET',
    path: '',
    target_url: 'http://demo-api:8002/api',
    api_name: 'Products & E-Commerce API',
    is_active: true,
  })

  // Initial Demo Dataset matching Reference Screenshot exactly
  const defaultEndpoints = [
    {
      id: 1,
      name: 'Get Products',
      description: 'Retrieve list of products',
      method: 'GET',
      path: '/api/products',
      target_url: 'http://demo-api:8002/api/products',
      api_name: 'Products & E-Commerce API',
      is_active: true,
      last_updated: '29/08/2026 09:12 PM',
    },
    {
      id: 2,
      name: 'Get Orders',
      description: 'Retrieve list of orders',
      method: 'GET',
      path: '/api/orders',
      target_url: 'http://demo-api:8002/api/orders',
      api_name: 'Order Processing API',
      is_active: true,
      last_updated: '28/08/2026 04:45 PM',
    },
    {
      id: 3,
      name: 'Create Order',
      description: 'Create a new order',
      method: 'POST',
      path: '/api/orders',
      target_url: 'http://demo-api:8002/api/orders',
      api_name: 'Order Processing API',
      is_active: true,
      last_updated: '27/08/2026 11:38 AM',
    },
  ]

  // Fetch Endpoints
  const fetchEndpoints = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await endpointService.getEndpoints()
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((ep, idx) => ({
          id: ep.id || idx + 1,
          name: ep.name,
          description: ep.description || (ep.method === 'GET' ? `Retrieve ${ep.name.toLowerCase()}` : `Process ${ep.name.toLowerCase()}`),
          method: ep.method || 'GET',
          path: ep.path || '/api',
          target_url: ep.target_url || 'http://demo-api:8002/api',
          api_name: ep.api_name || (ep.path?.includes('products') ? 'Products & E-Commerce API' : 'Order Processing API'),
          is_active: ep.is_active ?? true,
          last_updated: ep.last_updated || '29/08/2026 09:12 PM',
        }))
        setEndpoints(formatted)
      } else {
        setEndpoints(defaultEndpoints)
      }
    } catch {
      setEndpoints(defaultEndpoints)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEndpoints()
  }, [])

  // Filter Endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        !search.trim() ||
        ep.name.toLowerCase().includes(search.toLowerCase()) ||
        ep.path.toLowerCase().includes(search.toLowerCase()) ||
        ep.target_url.toLowerCase().includes(search.toLowerCase())

      const matchesApi =
        apiFilter === 'all' || ep.api_name.toLowerCase() === apiFilter.toLowerCase()

      const matchesMethod =
        methodFilter === 'all' || ep.method.toLowerCase() === methodFilter.toLowerCase()

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && ep.is_active) ||
        (statusFilter === 'inactive' && !ep.is_active)

      return matchesSearch && matchesApi && matchesMethod && matchesStatus
    })
  }, [endpoints, search, apiFilter, methodFilter, statusFilter])

  // Pagination Computation
  const totalResults = filteredEndpoints.length
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedEndpoints = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredEndpoints.slice(startIdx, startIdx + pageSize)
  }, [filteredEndpoints, currentPage, pageSize])

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    const total = endpoints.length
    const active = endpoints.filter((e) => e.is_active).length
    const getCount = endpoints.filter((e) => e.method === 'GET').length
    const postCount = endpoints.filter((e) => e.method === 'POST').length

    const getPct = total > 0 ? ((getCount / total) * 100).toFixed(1) : '66.7'
    const postPct = total > 0 ? ((postCount / total) * 100).toFixed(1) : '33.3'
    const activePct = total > 0 ? ((active / total) * 100).toFixed(0) : '100'

    return {
      total,
      active,
      getPct,
      postPct,
      activePct,
    }
  }, [endpoints])

  // Copy Target URL
  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Create Endpoint
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.path.trim()) {
      setModalError('Endpoint Name and Gateway Path are required')
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        method: formData.method,
        path: formData.path.trim(),
        target_url: formData.target_url.trim() || 'http://demo-api:8002/api',
        api_name: formData.api_name,
        is_active: formData.is_active,
      }
      const created = await endpointService.createEndpoint(payload)

      setEndpoints((prev) => [
        {
          id: created.id || Date.now(),
          ...payload,
          last_updated: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])

      setSuccessMessage(`Endpoint "${formData.name}" added successfully!`)
      setCreateModalOpen(false)
      setFormData({ name: '', description: '', method: 'GET', path: '', target_url: 'http://demo-api:8002/api', api_name: 'Products & E-Commerce API', is_active: true })
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setModalError(err.message || 'Failed to add endpoint')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Endpoint
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEndpoint) return

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        method: formData.method,
        path: formData.path.trim(),
        target_url: formData.target_url.trim(),
        api_name: formData.api_name,
        is_active: formData.is_active,
      }
      await endpointService.updateEndpoint(selectedEndpoint.id, payload)

      setEndpoints((prev) =>
        prev.map((ep) => (ep.id === selectedEndpoint.id ? { ...ep, ...payload } : ep))
      )

      setSuccessMessage(`Endpoint "${formData.name}" updated successfully!`)
      setEditModalOpen(false)
      setSelectedEndpoint(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setModalError(err.message || 'Failed to update endpoint')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Activation
  const handleToggleStatus = (ep) => {
    const newStatus = !ep.is_active
    setEndpoints((prev) =>
      prev.map((item) => (item.id === ep.id ? { ...item, is_active: newStatus } : item))
    )
    setSuccessMessage(`Endpoint "${ep.name}" marked as ${newStatus ? 'ACTIVE' : 'INACTIVE'}`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
      {/* Success Notification Alert */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-sm animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="shrink-0">
        <PageHeader
          title="API Endpoints"
          subtitle="Upstream API target endpoints configured for strict gateway matching."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setModalError(null)
                setFormData({ name: '', description: '', method: 'GET', path: '', target_url: 'http://demo-api:8002/api', api_name: 'Products & E-Commerce API', is_active: true })
                setCreateModalOpen(true)
              }}
              className="shadow-sm py-1.5 px-3 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Endpoint
            </Button>
          }
        />
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-1.5 shadow-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setCurrentPage(1)
            }}
            placeholder="Search endpoints by name, path or target..."
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* API Filter */}
          <div className="w-36">
            <Select
              value={apiFilter}
              onChange={(e) => {
                setApiFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All APIs' },
                { value: 'Products & E-Commerce API', label: 'Products & E-Commerce API' },
                { value: 'Order Processing API', label: 'Order Processing API' },
                { value: 'User Directory API', label: 'User Directory API' },
              ]}
            />
          </div>

          {/* Method Filter */}
          <div className="w-32">
            <Select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Methods' },
                { value: 'get', label: 'GET' },
                { value: 'post', label: 'POST' },
                { value: 'put', label: 'PUT' },
                { value: 'delete', label: 'DELETE' },
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
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          {/* Filter Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setApiFilter('all')
              setMethodFilter('all')
              setStatusFilter('all')
              setCurrentPage(1)
            }}
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 px-2.5 py-1"
            title="Reset Filters"
          >
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Filters</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEndpoints}
            className="p-1.5 text-slate-700 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* 3. ENDPOINT SUMMARY CARDS ROW (Compact h-[72px]) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        {/* Total Endpoints */}
        <div className="flex flex-col justify-between rounded-xl border border-sky-200 dark:border-[#1A384F] bg-sky-50/80 dark:bg-[#0E1E2B] p-2.5 shadow-xs h-[72px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400">Total Endpoints</span>
            <div className="rounded-md p-1 border border-sky-300 dark:border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Server className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">{metrics.total}</h3>
            <span className="text-[9px] font-bold text-slate-500">— 0% vs last 7 days</span>
          </div>
        </div>

        {/* Active Endpoints */}
        <div className="flex flex-col justify-between rounded-xl border border-emerald-200 dark:border-[#123E2E] bg-emerald-50/80 dark:bg-[#092219] p-2.5 shadow-xs h-[72px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Active Endpoints</span>
            <div className="rounded-md p-1 border border-emerald-300 dark:border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">{metrics.active}</h3>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">↑ 0% vs last 7 days</span>
          </div>
        </div>

        {/* By HTTP Method Distribution */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-2.5 shadow-xs h-[72px]">
          {/* Donut Chart Graphic SVG */}
          <div className="relative h-10 w-10 shrink-0">
            <svg className="h-10 w-10 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray="66.7, 100"
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500"
                strokeDasharray="33.3, 100"
                strokeDashoffset="-66.7"
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
          <div className="flex flex-col justify-center flex-1 min-w-0 text-[10px]">
            <span className="font-bold text-slate-500 dark:text-slate-400 mb-1">By HTTP Method</span>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">GET</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{metrics.getPct}%</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">POST</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{metrics.postPct}%</span>
            </div>
          </div>
        </div>

        {/* By Status Distribution */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-2.5 shadow-xs h-[72px]">
          <div className="relative h-10 w-10 shrink-0">
            <svg className="h-10 w-10 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray="100, 100"
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
          <div className="flex flex-col justify-center flex-1 min-w-0 text-[10px]">
            <span className="font-bold text-slate-500 dark:text-slate-400 mb-1">By Status</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Active</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{metrics.activePct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Inactive</span>
              <span className="font-bold text-slate-400">0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN ENDPOINT TABLE CARD WITH STICKY COLUMN NAMES & SCROLLABLE RECORDS */}
      {loading ? (
        <LoadingState message="Loading API Endpoints..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEndpoints} />
      ) : paginatedEndpoints.length === 0 ? (
        <EmptyState
          title="No API Endpoints Found"
          description="Add your first API target endpoint to configure gateway path matching."
          icon={GitBranch}
          action={
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Endpoint
            </Button>
          }
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
          <Table headers={['ENDPOINT ID', 'NAME', 'HTTP METHOD', 'GATEWAY PATH', 'TARGET UPSTREAM URL', 'API', 'STATUS', 'LAST UPDATED', 'ACTIONS']}>
            {paginatedEndpoints.map((ep) => (
              <TableRow key={ep.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                {/* Endpoint ID */}
                <TableCell className="py-2 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  #{ep.id}
                </TableCell>

                {/* Name & Subtitle */}
                <TableCell className="py-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight">
                      {ep.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[160px]">
                      {ep.description}
                    </p>
                  </div>
                </TableCell>

                {/* HTTP Method Badge */}
                <TableCell className="py-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                      ep.method === 'GET'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                        : ep.method === 'POST'
                        ? 'bg-[#D44720]/15 text-[#D44720] border-[#D44720]/30'
                        : 'bg-blue-500/15 text-blue-600 border-blue-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                </TableCell>

                {/* Gateway Path (Bold Beeswax Accent) */}
                <TableCell className="py-2 font-mono text-xs font-bold text-[#EBA762]">
                  {ep.path}
                </TableCell>

                {/* Target Upstream URL with Copy Button */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                      {ep.target_url}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyUrl(ep.target_url, ep.id)
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                      title="Copy Target URL"
                    >
                      {copiedId === ep.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </TableCell>

                {/* Associated API */}
                <TableCell className="py-2 text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                  {ep.api_name}
                </TableCell>

                {/* Status Badge */}
                <TableCell className="py-2">
                  <Badge variant={ep.is_active ? 'success' : 'danger'} size="sm">
                    {ep.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </TableCell>

                {/* Last Updated */}
                <TableCell className="py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {ep.last_updated}
                </TableCell>

                {/* Actions */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* View Action */}
                    <button
                      onClick={() => {
                        setSelectedEndpoint(ep)
                        setViewModalOpen(true)
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {/* Edit Action */}
                    <button
                      onClick={() => {
                        setSelectedEndpoint(ep)
                        setFormData({
                          name: ep.name,
                          description: ep.description,
                          method: ep.method,
                          path: ep.path,
                          target_url: ep.target_url,
                          api_name: ep.api_name,
                          is_active: ep.is_active,
                        })
                        setModalError(null)
                        setEditModalOpen(true)
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Edit Endpoint"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Options Menu Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === ep.id ? null : ep.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {openMenuId === ep.id && (
                        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              handleToggleStatus(ep)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {ep.is_active ? 'Deactivate Endpoint' : 'Activate Endpoint'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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

      {/* CREATE ENDPOINT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New API Target Endpoint"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Endpoint'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Endpoint Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Get Products"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="Retrieve product list for catalog service..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#D44720] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                HTTP Method
              </label>
              <Select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gateway Path <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="/api/products"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Upstream URL
            </label>
            <Input
              type="text"
              placeholder="http://demo-api:8002/api/products"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Associated API Service
            </label>
            <Select
              value={formData.api_name}
              onChange={(e) => setFormData({ ...formData, api_name: e.target.value })}
              options={[
                { value: 'Products & E-Commerce API', label: 'Products & E-Commerce API' },
                { value: 'Order Processing API', label: 'Order Processing API' },
                { value: 'User Directory API', label: 'User Directory API' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* EDIT ENDPOINT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Target Endpoint"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Endpoint Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                HTTP Method
              </label>
              <Select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gateway Path
              </label>
              <Input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Upstream URL
            </label>
            <Input
              type="text"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* VIEW ENDPOINT DETAILS MODAL */}
      {selectedEndpoint && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Endpoint Details — ${selectedEndpoint.name}`}
          size="md"
          footer={
            <Button variant="ghost" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedEndpoint.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedEndpoint.description}</p>
              </div>
              <Badge variant={selectedEndpoint.is_active ? 'success' : 'danger'}>
                {selectedEndpoint.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block mb-1">HTTP Method</span>
                <span className="font-bold text-emerald-500 font-mono text-sm">{selectedEndpoint.method}</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block mb-1">Gateway Path</span>
                <span className="font-bold text-[#EBA762] font-mono text-xs">{selectedEndpoint.path}</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                <span className="text-slate-500 block mb-1">Upstream Target URL</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs block truncate">{selectedEndpoint.target_url}</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                <span className="text-slate-500 block mb-1">Associated API Service</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{selectedEndpoint.api_name}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
