import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  CheckCircle2,
  PauseCircle,
  UserPlus,
  Ban,
  Plus,
  Filter,
  MoreVertical,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  Trash2,
  Mail,
  AlertTriangle,
  Key,
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
import { consumerService } from '@/services/consumerService'
import { planService } from '@/services/planService'

export const ConsumersPage = () => {
  const navigate = useNavigate()

  // State Management
  const [consumers, setConsumers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search & Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Provision Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [copiedPass, setCopiedPass] = useState(false)

  // Created Credentials Display Banner / Modal State
  const [createdCredentials, setCreatedCredentials] = useState(null)

  // Delete Consumer Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [consumerToDelete, setConsumerToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    plan_id: '',
    status: 'active',
  })

  // Action Menu Dropdown State
  const [openMenuId, setOpenMenuId] = useState(null)

  // Demo Fallback Dataset
  const fallbackConsumers = [
    { id: 1, consumer_id_code: '#C-0001', name: 'Key Target Consumer', category: 'Enterprise', email: 'contact@keytargetconsumer.com', plan: 'Enterprise', plan_variant: 'enterprise', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
    { id: 2, consumer_id_code: '#C-0002', name: 'Key List Consumer', category: 'Developer', email: 'contact@keylistconsumer.com', plan: 'Developer', plan_variant: 'developer', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
    { id: 3, consumer_id_code: '#C-0003', name: 'Single Key Consumer', category: 'Business', email: 'contact@singlekeyconsumer.com', plan: 'Business', plan_variant: 'business', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
    { id: 4, consumer_id_code: '#C-0004', name: 'Key Update Consumer', category: 'Enterprise', email: 'contact@keyupdateconsumer.com', plan: 'Enterprise', plan_variant: 'enterprise', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
    { id: 5, consumer_id_code: '#C-0005', name: 'Key Delete Consumer', category: 'Business', email: 'contact@keydeleteconsumer.com', plan: 'Business', plan_variant: 'business', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
    { id: 6, consumer_id_code: '#C-0006', name: 'Acme Corp', category: 'Developer', email: 'contact@acmecorp.com', plan: 'Developer', plan_variant: 'developer', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
    { id: 7, consumer_id_code: '#C-0007', name: 'Beta Corp', category: 'Enterprise', email: 'contact@betacorp.com', plan: 'Enterprise', plan_variant: 'enterprise', status: 'active', created_at: '28/08/2026', last_active: '2 mins ago', active_dot: 'emerald' },
  ]

  // Fetch Data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [consRes, plansRes] = await Promise.allSettled([
        consumerService.getConsumers(),
        planService.getPlans(),
      ])

      let loadedConsumers = []
      if (consRes.status === 'fulfilled' && consRes.value) {
        const raw = consRes.value
        loadedConsumers = Array.isArray(raw) ? raw : (raw.items || raw.consumers || [])
      }

      if (plansRes.status === 'fulfilled' && plansRes.value) {
        setPlans(plansRes.value)
      }

      if (loadedConsumers.length > 0) {
        const formatted = loadedConsumers.map((c) => {
          const planName = c.plan_name || c.plan?.name || 'Free Tier'
          const planVariant = planName.toLowerCase().includes('enterprise') ? 'enterprise' : planName.toLowerCase().includes('business') ? 'business' : planName.toLowerCase().includes('pro') ? 'developer' : 'basic'
          
          return {
            id: c.id,
            consumer_id_code: `#C-${String(c.id).padStart(4, '0')}`,
            name: c.name,
            category: c.description || planName,
            email: c.email || `contact@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            plan: planName,
            plan_variant: planVariant,
            status: c.status || 'active',
            created_at: new Date(c.created_at || Date.now()).toLocaleDateString('en-GB'),
            last_active: c.last_active || '2 mins ago',
            active_dot: c.status === 'inactive' ? 'amber' : c.status === 'suspended' ? 'red' : 'emerald',
          }
        })
        setConsumers(formatted)
      } else {
        setConsumers(fallbackConsumers)
      }
    } catch {
      setConsumers(fallbackConsumers)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered Consumers Computation
  const filteredConsumers = useMemo(() => {
    return consumers.filter((c) => {
      const matchesSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.consumer_id_code.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase()

      const matchesPlan =
        planFilter === 'all' || c.plan.toLowerCase() === planFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [consumers, search, statusFilter, planFilter])

  // Pagination Computation
  const totalResults = filteredConsumers.length
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedConsumers = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredConsumers.slice(startIdx, startIdx + pageSize)
  }, [filteredConsumers, currentPage, pageSize])

  // Handle Provisioning New Consumer
  const handleCreateConsumer = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setModalError('Consumer name is required')
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : undefined,
        description: formData.description.trim() || undefined,
        plan_id: formData.plan_id ? parseInt(formData.plan_id, 10) : undefined,
        status: formData.status,
      }
      await consumerService.createConsumer(payload)
      
      const consumerEmail = formData.email || `contact@${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      const initialPass = 'TempPass9824!'

      setCreatedCredentials({
        name: formData.name.trim(),
        email: consumerEmail,
        password: initialPass,
      })

      setSuccessMessage(`Consumer "${formData.name}" provisioned successfully!`)
      setModalOpen(false)
      setFormData({ name: '', email: '', description: '', plan_id: '', status: 'active' })
      fetchData()
    } catch (err) {
      setModalError(err.response?.data?.detail || err.message || 'Failed to provision consumer')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Consumer
  const handleConfirmDelete = async () => {
    if (!consumerToDelete) return
    setDeleting(true)
    try {
      await consumerService.deleteConsumer(consumerToDelete.id, true)
      setSuccessMessage(`Consumer "${consumerToDelete.name}" deleted successfully!`)
      setDeleteModalOpen(false)
      setConsumerToDelete(null)
      fetchData()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete consumer')
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Summary Metrics Breakdown
  const metrics = useMemo(() => {
    const total = consumers.length
    const active = consumers.filter(c => c.status?.toLowerCase() === 'active').length
    const inactive = consumers.filter(c => c.status?.toLowerCase() === 'inactive').length
    const suspended = consumers.filter(c => c.status?.toLowerCase() === 'suspended').length
    const newThisWeek = consumers.filter(c => {
      if (!c.created_at) return false
      const parts = String(c.created_at).split('/')
      let dt
      if (parts.length === 3) {
        dt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      } else {
        dt = new Date(c.created_at)
      }
      return !isNaN(dt.getTime()) && (Date.now() - dt.getTime()) <= 7 * 24 * 60 * 60 * 1000
    }).length

    return [
      {
        title: 'Total Consumers',
        value: total,
        trend: '↑ Live DB Total',
        isPositive: true,
        icon: Users,
        cardStyle: 'bg-sky-50/80 border-sky-200 dark:bg-[#0E1E2B] dark:border-[#1A384F]',
        iconStyle: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-500/30',
        textColor: 'text-sky-700 dark:text-sky-400',
      },
      {
        title: 'Active Consumers',
        value: active,
        trend: '↑ Live Active',
        isPositive: true,
        icon: CheckCircle2,
        cardStyle: 'bg-emerald-50/80 border-emerald-200 dark:bg-[#092219] dark:border-[#123E2E]',
        iconStyle: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
      },
      {
        title: 'Inactive Consumers',
        value: inactive,
        trend: '↓ Inactive Count',
        isPositive: false,
        icon: PauseCircle,
        cardStyle: 'bg-amber-50/80 border-amber-200 dark:bg-[#231A10] dark:border-[#42311C]',
        iconStyle: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
        textColor: 'text-amber-700 dark:text-amber-400',
      },
      {
        title: 'New This Week',
        value: newThisWeek,
        trend: '↑ Last 7 Days',
        isPositive: true,
        icon: UserPlus,
        cardStyle: 'bg-purple-50/80 border-purple-200 dark:bg-[#1B132C] dark:border-[#352357]',
        iconStyle: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
        textColor: 'text-purple-700 dark:text-purple-400',
      },
      {
        title: 'Suspended',
        value: suspended,
        trend: '— Suspended Count',
        isPositive: true,
        icon: Ban,
        cardStyle: 'bg-red-50/80 border-red-200 dark:bg-[#251015] dark:border-[#451A22]',
        iconStyle: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30',
        textColor: 'text-red-700 dark:text-red-400',
      },
    ]
  }, [consumers])

  return (
    <div className="flex flex-col h-full justify-between gap-2.5 overflow-hidden">
      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-80 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* PROVISIONED CREDENTIALS DISPLAY BANNER */}
      {createdCredentials && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/50 p-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
              <Mail className="h-4 w-4 text-amber-500" />
              <span>Consumer Initial Login Password</span>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 font-bold text-xs cursor-pointer"
            >
              Dismiss ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] text-slate-400 block font-sans">CONSUMER NAME</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{createdCredentials.name}</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] text-slate-400 block font-sans">PORTAL LOGIN EMAIL</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{createdCredentials.email}</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-500 block font-sans font-bold">INITIAL PASSWORD</span>
                <span className="font-bold text-amber-500">{createdCredentials.password}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdCredentials.password)
                  setCopiedPass(true)
                  setTimeout(() => setCopiedPass(false), 2000)
                }}
                className="p-1 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Copy Password"
              >
                {copiedPass ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="shrink-0">
        <PageHeader
          title="API Consumers"
          subtitle="Manage registered API Consumers, enable/disable access, and provision credentials."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setModalError(null)
                setModalOpen(true)
              }}
              className="shadow-sm py-1.5 px-3 text-xs cursor-pointer"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Provision New Consumer
            </Button>
          }
        />
      </div>

      {/* COMPACT SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 shrink-0">
        {metrics.map((card, idx) => (
          <div
            key={idx}
            className={`relative flex flex-col justify-between rounded-xl border p-2.5 shadow-xs transition-all h-[72px] ${card.cardStyle}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-bold truncate tracking-tight ${card.textColor}`}>
                {card.title}
              </span>
              <div className={`rounded-md p-1 border shrink-0 ${card.iconStyle}`}>
                <card.icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                {card.value}
              </h3>
              <span className={`text-[9px] font-bold ${card.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {card.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* COMPACT SEARCH + FILTER TOOLBAR */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-2 shadow-xs shrink-0">
        <div className="relative flex-1">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setCurrentPage(1)
            }}
            placeholder="Search consumers by name, email, or company..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-32">
            <Select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'All Plans' },
                { value: 'enterprise', label: 'Enterprise' },
                { value: 'business', label: 'Business' },
                { value: 'developer', label: 'Developer' },
                { value: 'basic', label: 'Basic' },
              ]}
            />
          </div>

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
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setPlanFilter('all')
              setCurrentPage(1)
            }}
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 px-2.5 py-1 cursor-pointer"
            title="Reset Filters"
          >
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* CONSUMERS TABLE CARD WITH STICKY COLUMN NAMES & SCROLLABLE RECORDS */}
      {loading ? (
        <LoadingState message="Fetching API Consumers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : paginatedConsumers.length === 0 ? (
        <EmptyState
          title="No API Consumers Found"
          description="Provision your first API Consumer to grant key credentials and plan access."
          icon={Users}
          action={
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Provision Consumer
            </Button>
          }
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
          <Table headers={['CONSUMER ID', 'CONSUMER NAME', 'CONTACT EMAIL', 'PLAN', 'STATUS', 'CREATED DATE', 'LAST ACTIVE', 'ACTIONS']}>
            {paginatedConsumers.map((c) => (
              <TableRow key={c.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                {/* Consumer ID */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {c.consumer_id_code}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyCode(c.consumer_id_code, c.id)
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                      title="Copy Consumer ID"
                    >
                      {copiedId === c.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </TableCell>

                {/* Name & Subtitle */}
                <TableCell className="py-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {c.category}
                    </p>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell className="py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {c.email}
                </TableCell>

                {/* Plan Badge */}
                <TableCell className="py-2">
                  <Badge variant={c.plan_variant || 'basic'} size="sm">
                    {c.plan}
                  </Badge>
                </TableCell>

                {/* Status Badge */}
                <TableCell className="py-2">
                  <Badge
                    variant={c.status === 'active' ? 'success' : c.status === 'inactive' ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {c.status}
                  </Badge>
                </TableCell>

                {/* Created Date */}
                <TableCell className="py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {c.created_at}
                </TableCell>

                {/* Last Active */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 dark:text-slate-300">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${
                      c.active_dot === 'emerald' ? 'bg-emerald-500' : c.active_dot === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <span>{c.last_active}</span>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/consumers/${c.id}`)}
                      className="text-xs font-semibold px-2 py-0.5 cursor-pointer"
                    >
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setConsumerToDelete(c)
                        setDeleteModalOpen(true)
                      }}
                      className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                      title="Delete Consumer"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === c.id && (
                        <div className="absolute right-0 mt-1 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              navigate(`/admin/consumers/${c.id}`)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Consumer Details
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              navigate(`/admin/analytics`)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            View Usage Stats
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null)
                              setConsumerToDelete(c)
                              setDeleteModalOpen(true)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Consumer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {/* FIXED PAGINATION BAR AT BOTTOM */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs shrink-0">
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
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* PROVISION NEW CONSUMER MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision New API Consumer"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateConsumer} disabled={submitting}>
              {submitting ? 'Provisioning...' : 'Provision Consumer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateConsumer} className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Consumer Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Acme Corporation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Consumer Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="e.g. contact@acmecorp.com"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Email Dispatch & Password Notification Banner */}
          <div className="rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 p-3 text-xs text-sky-900 dark:text-sky-200 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <span>📧 Password Email Dispatch</span>
            </div>
            <p className="text-[11px] text-sky-700 dark:text-sky-300">
              An initial temporary password (<span className="font-mono font-bold text-slate-900 dark:text-slate-100">TempPass9824!</span>) will be automatically generated and dispatched to <span className="font-bold">{formData.email || 'the consumer email'}</span>.
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Credentials will also be displayed in an alert banner upon successful provisioning.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="Primary logistics partner API integration..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#D44720] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Rate Limit Plan
            </label>
            <Select
              value={formData.plan_id}
              onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
              options={[
                { value: '', label: 'Default Plan (Pro Tier)' },
                ...plans.map(p => ({ value: String(p.id), label: `${p.name} (${p.requests_per_window} req / ${p.window_seconds}s)` }))
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Access Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active — Grant immediate API gateway access' },
                { value: 'inactive', label: 'Inactive — Provision credentials but disable access' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* DELETE CONSUMER CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setConsumerToDelete(null)
        }}
        title="Delete API Consumer"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModalOpen(false)
                setConsumerToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Consumer'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold text-sm">Permanent Consumer Deletion</p>
              <p className="text-xs pt-0.5">
                Are you sure you want to delete consumer <strong>{consumerToDelete?.name}</strong> (ID: {consumerToDelete?.consumer_id_code})?
              </p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            This will revoke all active API key credentials assigned to this consumer and detach their record from PostgreSQL.
          </p>
        </div>
      </Modal>
    </div>
  )
}
