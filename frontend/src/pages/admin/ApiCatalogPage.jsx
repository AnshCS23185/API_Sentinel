import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Filter,
  Eye,
  Edit2,
  MoreVertical,
  ShoppingCart,
  FileText,
  Users,
  Globe,
  Compass,
  GitBranch,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X,
  Server
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
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

export const ApiCatalogPage = () => {
  const navigate = useNavigate()

  // State Management
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  
  const [selectedApi, setSelectedApi] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    path: '',
    target: '',
    status: 'active',
  })

  // Initial Dataset matching reference screenshot exactly
  const defaultApis = [
    {
      id: 1,
      name: 'Products & E-Commerce API',
      description: 'Product catalog and e-commerce operations.',
      status: 'active',
      path: '/api/products',
      target: 'demo-api:8002',
      endpoints_count: 12,
      requests_7d: '42.8K',
      consumers_count: 18,
      last_request: '2 mins ago',
      last_updated: '29/08/2026',
      icon: ShoppingCart,
      icon_style: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
    },
    {
      id: 2,
      name: 'Order Processing API',
      description: 'Handles order creation, processing and fulfillment operations.',
      status: 'active',
      path: '/api/orders',
      target: 'demo-api:8002',
      endpoints_count: 9,
      requests_7d: '35.6K',
      consumers_count: 24,
      last_request: '5 mins ago',
      last_updated: '28/08/2026',
      icon: FileText,
      icon_style: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    },
    {
      id: 3,
      name: 'User Directory API',
      description: 'User profile, authentication and directory management operations.',
      status: 'active',
      path: '/api/users',
      target: 'demo-api:8002',
      endpoints_count: 7,
      requests_7d: '50.0K',
      consumers_count: 29,
      last_request: '1 min ago',
      last_updated: '27/08/2026',
      icon: Users,
      icon_style: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
    },
  ]

  // Fetch Catalog APIs
  const fetchApis = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await endpointService.getCatalogApis()
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item, idx) => {
          const nameLower = item.name.toLowerCase()
          let icon = Compass
          let icon_style = 'bg-[#D44720]/15 text-[#D44720] border-[#D44720]/30'

          if (nameLower.includes('product') || nameLower.includes('commerce')) {
            icon = ShoppingCart
            icon_style = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30'
          } else if (nameLower.includes('order')) {
            icon = FileText
            icon_style = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
          } else if (nameLower.includes('user') || nameLower.includes('directory')) {
            icon = Users
            icon_style = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30'
          }

          return {
            id: item.id || idx + 1,
            name: item.name,
            description: item.description || 'Protected downstream microservice.',
            status: item.status || 'active',
            path: item.path || '/api',
            target: item.target || 'demo-api:8002',
            endpoints_count: item.endpoints_count ?? 8,
            requests_7d: item.requests_7d || '25.0K',
            consumers_count: item.consumers_count ?? 12,
            last_request: item.last_request || '5 mins ago',
            last_updated: item.last_updated || '29/08/2026',
            icon,
            icon_style,
          }
        })
        setApis(formatted)
      } else {
        setApis(defaultApis)
      }
    } catch {
      setApis(defaultApis)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApis()
  }, [])

  // Filter & Sort Logic
  const filteredApis = useMemo(() => {
    let result = apis.filter((a) => {
      const matchesSearch =
        !search.trim() ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.path.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || a.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })

    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name))
    } else if (sortBy === 'endpoints-desc') {
      result.sort((a, b) => b.endpoints_count - a.endpoints_count)
    }

    return result
  }, [apis, search, statusFilter, sortBy])

  // Pagination Computation
  const totalResults = filteredApis.length
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedApis = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredApis.slice(startIdx, startIdx + pageSize)
  }, [filteredApis, currentPage, pageSize])

  // Handle Create API
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.path.trim()) {
      setModalError('API Name and Base Path are required')
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        path: formData.path.trim(),
        target: formData.target.trim() || 'demo-api:8002',
        status: formData.status,
      }
      const created = await endpointService.createApi(payload)

      setApis((prev) => [
        {
          id: created.id || Date.now(),
          name: created.name,
          description: created.description || 'Protected microservice endpoint.',
          status: created.status || 'active',
          path: created.path,
          target: created.target || 'demo-api:8002',
          endpoints_count: 1,
          requests_7d: '0',
          consumers_count: 0,
          last_request: 'Just now',
          last_updated: new Date().toLocaleDateString('en-GB'),
          icon: Compass,
          icon_style: 'bg-[#D44720]/15 text-[#D44720] border-[#D44720]/30',
        },
        ...prev,
      ])

      setSuccessMessage(`API "${formData.name}" registered successfully!`)
      setCreateModalOpen(false)
      setFormData({ name: '', description: '', path: '', target: '', status: 'active' })
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setModalError(err.message || 'Failed to create API')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit API
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedApi) return

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        path: formData.path.trim(),
        target: formData.target.trim(),
        status: formData.status,
      }
      await endpointService.updateApi(selectedApi.id, payload)

      setApis((prev) =>
        prev.map((a) => (a.id === selectedApi.id ? { ...a, ...payload } : a))
      )

      setSuccessMessage(`API "${formData.name}" updated successfully!`)
      setEditModalOpen(false)
      setSelectedApi(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setModalError(err.message || 'Failed to update API')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
      {/* Success Notification Banner */}
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

      {/* 1. PAGE HEADER (Compact Top Padding) */}
      <div className="shrink-0">
        <PageHeader
          title="API Catalog"
          subtitle="Catalog of downstream backend services protected and routed through API Sentinel Gateway."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setModalError(null)
                setFormData({ name: '', description: '', path: '', target: 'demo-api:8002', status: 'active' })
                setCreateModalOpen(true)
              }}
              className="shadow-sm py-1.5 px-3 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create API
            </Button>
          }
        />
      </div>

      {/* 2. SEARCH + FILTER TOOLBAR (Positioned further UP with compact p-1.5 padding) */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-1.5 shadow-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setCurrentPage(1)
            }}
            placeholder="Search APIs by name, path or description..."
          />
        </div>

        {/* Filter & Sort Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
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

          {/* HTTP Method Dropdown */}
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

          {/* Filters Reset */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setMethodFilter('all')
              setSortBy('name-asc')
              setCurrentPage(1)
            }}
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 px-2.5 py-1"
            title="Reset Filters"
          >
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Filters</span>
          </Button>

          {/* Sort Dropdown */}
          <div className="w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'name-asc', label: 'Sort by: Name (A-Z)' },
                { value: 'name-desc', label: 'Sort by: Name (Z-A)' },
                { value: 'endpoints-desc', label: 'Sort by: Endpoints' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* 3. API LIST PRESENTATION (Wide Horizontal Cards with compact p-3 padding for more vertical space) */}
      {loading ? (
        <LoadingState message="Fetching API Catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchApis} />
      ) : paginatedApis.length === 0 ? (
        <EmptyState
          title="No APIs Found in Catalog"
          description="Register your first downstream backend service to route and protect endpoints."
          icon={Server}
          action={
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create API
            </Button>
          }
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pr-0.5">
          {paginatedApis.map((api) => {
            const IconComp = api.icon || Compass

            return (
              <div
                key={api.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
              >
                {/* LEFT SECTION: Icon, Name, Badge, Description, Base Path, Upstream Target */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* API Icon in rounded colored box */}
                  <div className={`rounded-xl p-2.5 border shrink-0 ${api.icon_style}`}>
                    <IconComp className="h-5 w-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Name + Status Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {api.name}
                      </h3>
                      <Badge variant={api.status === 'active' ? 'success' : 'warning'} size="sm">
                        {api.status}
                      </Badge>
                    </div>

                    {/* Short Description */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-normal leading-tight truncate">
                      {api.description}
                    </p>

                    {/* Base Path & Upstream Target */}
                    <div className="flex items-center gap-3 text-xs pt-0.5 flex-wrap">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                          BASE PATH
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                          {api.path}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                          UPSTREAM TARGET
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          <Globe className="h-3 w-3 text-slate-400 shrink-0" />
                          {api.target}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MIDDLE SECTION: Endpoints, Requests (7d), Consumers, Last request, Last updated */}
                <div className="flex items-center justify-between lg:justify-center gap-5 lg:px-5 lg:border-x lg:border-slate-200 dark:lg:border-slate-800/80 shrink-0">
                  {/* Endpoints Count */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      <GitBranch className="h-3 w-3" />
                      <span>Endpoints</span>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {api.endpoints_count}
                    </span>
                  </div>

                  {/* Requests (7d) */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span>Requests (7d)</span>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {api.requests_7d}
                    </span>
                  </div>

                  {/* Consumers Count */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      <Users className="h-3 w-3" />
                      <span>Consumers</span>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {api.consumers_count}
                    </span>
                  </div>

                  {/* Subtext Timestamps */}
                  <div className="hidden xl:flex flex-col gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 pl-3 border-l border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Last request: {api.last_request}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>Last updated: {api.last_updated}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SECTION: View API Button, Edit Button, Options Menu */}
                <div className="flex items-center gap-1.5 justify-end shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/admin/endpoints')}
                    className="text-xs font-semibold px-2.5 py-1 flex items-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>View API</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedApi(api)
                      setFormData({
                        name: api.name,
                        description: api.description,
                        path: api.path,
                        target: api.target,
                        status: api.status,
                      })
                      setModalError(null)
                      setEditModalOpen(true)
                    }}
                    className="text-xs font-semibold px-2.5 py-1 flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Edit</span>
                  </Button>

                  {/* Options Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === api.id ? null : api.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === api.id && (
                      <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in duration-100">
                        <button
                          onClick={() => {
                            setOpenMenuId(null)
                            navigate('/admin/endpoints')
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          View Endpoints
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null)
                            navigator.clipboard.writeText(api.path)
                            setSuccessMessage(`Base path "${api.path}" copied!`)
                            setTimeout(() => setSuccessMessage(null), 3000)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Copy Base Path
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. PAGINATION FOOTER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] shadow-xs text-xs shrink-0">
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

      {/* CREATE API MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New API Service"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create API'}
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
              API Service Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Payments & Checkout API"
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
              placeholder="Handles payment processing, webhooks, and checkout flows..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#D44720] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Base Path <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="/api/payments"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Upstream Target
              </label>
              <Input
                type="text"
                placeholder="demo-api:8002"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active — Route traffic through Gateway' },
                { value: 'inactive', label: 'Inactive — Route disabled' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* EDIT API MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit API Service"
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
              API Service Name
            </label>
            <Input
              type="text"
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#D44720] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Base Path
              </label>
              <Input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Upstream Target
              </label>
              <Input
                type="text"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
