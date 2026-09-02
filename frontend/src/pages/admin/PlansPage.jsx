import React, { useEffect, useState, useMemo } from 'react'
import {
  Layers,
  CheckCircle2,
  PauseCircle,
  Users,
  Activity,
  Plus,
  Filter,
  Eye,
  Edit2,
  MoreVertical,
  Gift,
  Rocket,
  Zap,
  Building2,
  Crown,
  Pause,
  MinusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X
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
import { planService } from '@/services/planService'

export const PlansPage = () => {
  // State Management
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requests_per_window: 1000,
    window_seconds: 60,
    is_active: true,
  })

  // Initial Demo Dataset matching reference screenshot exactly
  const defaultPlans = [
    {
      id: 1,
      name: 'Free Tier',
      description: 'For testing and small personal projects',
      requests_per_window: 100,
      window_seconds: 60,
      is_active: true,
      consumer_count: 5,
      icon: Gift,
      icon_style: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
    },
    {
      id: 2,
      name: 'Basic Plan',
      description: 'For hobby and development use',
      requests_per_window: 500,
      window_seconds: 60,
      is_active: true,
      consumer_count: 7,
      icon: Rocket,
      icon_style: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    },
    {
      id: 3,
      name: 'Pro Plan',
      description: 'For professional applications',
      requests_per_window: 1000,
      window_seconds: 60,
      is_active: true,
      consumer_count: 12,
      icon: Zap,
      icon_style: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
    },
    {
      id: 4,
      name: 'Business Plan',
      description: 'For growing businesses',
      requests_per_window: 5000,
      window_seconds: 60,
      is_active: true,
      consumer_count: 6,
      icon: Building2,
      icon_style: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30',
    },
    {
      id: 5,
      name: 'Enterprise Plan',
      description: 'For enterprise-grade applications',
      requests_per_window: 10000,
      window_seconds: 60,
      is_active: true,
      consumer_count: 3,
      icon: Crown,
      icon_style: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
    },
    {
      id: 6,
      name: 'Custom Plan',
      description: 'Custom limits & window',
      requests_per_window: 0,
      window_seconds: 0,
      is_active: false,
      consumer_count: 0,
      icon: Pause,
      icon_style: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/30',
    },
    {
      id: 7,
      name: 'Deprecated Plan',
      description: 'Old plan no longer recommended',
      requests_per_window: 500,
      window_seconds: 30,
      is_active: false,
      consumer_count: 0,
      icon: MinusCircle,
      icon_style: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30',
    },
  ]

  // Fetch Plans Data
  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await planService.getPlans()
      if (Array.isArray(data)) {
        const formatted = data.map((p, idx) => {
          const nameLower = (p.name || '').toLowerCase()
          let icon = Zap
          let icon_style = 'bg-[#D44720]/15 text-[#D44720] border-[#D44720]/30'

          if (nameLower.includes('free')) {
            icon = Gift
            icon_style = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30'
          } else if (nameLower.includes('basic')) {
            icon = Rocket
            icon_style = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
          } else if (nameLower.includes('pro')) {
            icon = Zap
            icon_style = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30'
          } else if (nameLower.includes('business')) {
            icon = Building2
            icon_style = 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30'
          } else if (nameLower.includes('enterprise')) {
            icon = Crown
            icon_style = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
          } else if (nameLower.includes('custom')) {
            icon = Pause
            icon_style = 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/30'
          } else if (nameLower.includes('deprecated')) {
            icon = MinusCircle
            icon_style = 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30'
          }

          return {
            id: p.id || idx + 1,
            name: p.name,
            description: p.description || 'Sliding window request capacity rule',
            requests_per_window: p.requests_per_window ?? 1000,
            window_seconds: p.window_seconds ?? 60,
            is_active: p.is_active ?? true,
            consumer_count: p.consumer_count ?? 0,
            icon,
            icon_style,
          }
        })
        setPlans(formatted)
      } else {
        setPlans([])
      }
    } catch (err) {
      setError('Failed to load rate limit plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  // Filter Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active)

      return matchesSearch && matchesStatus
    })
  }, [plans, search, statusFilter])

  // Pagination Computation
  const totalResults = filteredPlans.length
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedPlans = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredPlans.slice(startIdx, startIdx + pageSize)
  }, [filteredPlans, currentPage, pageSize])

  // 5 KPI Summary Cards dynamically calculated from database plans
  const metrics = useMemo(() => {
    const total = plans.length
    const active = plans.filter((p) => p.is_active).length
    const inactive = plans.filter((p) => !p.is_active).length
    const totalAssigned = plans.reduce((acc, p) => acc + (p.consumer_count || 0), 0)
    const avgReq = plans.length > 0
      ? Math.round(plans.reduce((acc, p) => acc + (p.requests_per_window || 0), 0) / plans.length)
      : 0

    return [
      {
        title: 'Total Plans',
        value: total,
        trend: '↑ Live Total',
        isPositive: true,
        icon: Layers,
        cardStyle: 'bg-sky-50/80 border-sky-200 dark:bg-[#0E1E2B] dark:border-[#1A384F]',
        iconStyle: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-500/30',
        textColor: 'text-sky-700 dark:text-sky-400',
      },
      {
        title: 'Active Plans',
        value: active,
        trend: '↑ Live Active',
        isPositive: true,
        icon: CheckCircle2,
        cardStyle: 'bg-emerald-50/80 border-emerald-200 dark:bg-[#092219] dark:border-[#123E2E]',
        iconStyle: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
        textColor: 'text-emerald-700 dark:text-emerald-400',
      },
      {
        title: 'Inactive Plans',
        value: inactive,
        trend: '↓ Inactive Count',
        isPositive: false,
        icon: PauseCircle,
        cardStyle: 'bg-amber-50/80 border-amber-200 dark:bg-[#231A10] dark:border-[#42311C]',
        iconStyle: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
        textColor: 'text-amber-700 dark:text-amber-400',
      },
      {
        title: 'Total Assigned',
        value: totalAssigned,
        trend: '↑ Assigned Consumers',
        isPositive: true,
        icon: Users,
        cardStyle: 'bg-purple-50/80 border-purple-200 dark:bg-[#1B132C] dark:border-[#352357]',
        iconStyle: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
        textColor: 'text-purple-700 dark:text-purple-400',
      },
      {
        title: 'Avg. Requests / Plan',
        value: avgReq.toLocaleString(),
        trend: '↑ Avg Capacity',
        isPositive: true,
        icon: Activity,
        cardStyle: 'bg-cyan-50/80 border-cyan-200 dark:bg-[#0C2229] dark:border-[#13404C]',
        iconStyle: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30',
        textColor: 'text-cyan-700 dark:text-cyan-400',
      },
    ]
  }, [plans])

  // Handle Create Plan
  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setModalError('Plan name is required')
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        requests_per_window: parseInt(formData.requests_per_window, 10) || 1000,
        window_seconds: parseInt(formData.window_seconds, 10) || 60,
        is_active: formData.is_active,
      }
      const newPlan = await planService.createPlan(payload)
      
      setPlans((prev) => [
        {
          id: newPlan.id || Date.now(),
          name: newPlan.name,
          description: newPlan.description || 'Sliding window request rule',
          requests_per_window: newPlan.requests_per_window,
          window_seconds: newPlan.window_seconds,
          is_active: newPlan.is_active,
          consumer_count: 0,
          icon: Zap,
          icon_style: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
        },
        ...prev,
      ])

      setSuccessMessage(`Rate Limit Plan "${formData.name}" created successfully!`)
      setCreateModalOpen(false)
      setFormData({ name: '', description: '', requests_per_window: 1000, window_seconds: 60, is_active: true })
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setModalError(err.message || 'Failed to create plan')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Plan
  const handleEditPlanSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPlan) return

    setSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        requests_per_window: parseInt(formData.requests_per_window, 10) || 1000,
        window_seconds: parseInt(formData.window_seconds, 10) || 60,
        is_active: formData.is_active,
      }
      await planService.updatePlan(selectedPlan.id, payload)

      setPlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, ...payload }
            : p
        )
      )

      setSuccessMessage(`Plan "${formData.name}" updated successfully!`)
      setEditModalOpen(false)
      setSelectedPlan(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setModalError(err.message || 'Failed to update plan')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Plan Activation
  const handleToggleStatus = (plan) => {
    const updatedStatus = !plan.is_active
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, is_active: updatedStatus } : p))
    )
    setSuccessMessage(`Plan "${plan.name}" marked as ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div className="flex flex-col h-full justify-between gap-2.5 overflow-hidden">
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
          title="Rate Limit Plans"
          subtitle="Define sliding-window request limits, time windows, and consumer capacity rules."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setModalError(null)
                setFormData({ name: '', description: '', requests_per_window: 1000, window_seconds: 60, is_active: true })
                setCreateModalOpen(true)
              }}
              className="shadow-sm py-1.5 px-3 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create Rate Limit Plan
            </Button>
          }
        />
      </div>

      {/* 2. SUMMARY KPI ROW (5 Compact Cards h-[72px]) */}
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

      {/* 3. SEARCH + FILTER TOOLBAR (Seamless Element resting directly on page background) */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-2 shadow-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setCurrentPage(1)
            }}
            placeholder="Search plans by name or description..."
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="w-36">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
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

      {/* 4. PLANS TABLE CARD WITH STICKY COLUMN NAMES & SCROLLABLE ROWS */}
      {loading ? (
        <LoadingState message="Loading Rate Limit Plans..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPlans} />
      ) : paginatedPlans.length === 0 ? (
        <EmptyState
          title="No Rate Limit Plans Found"
          description="Create your first rate limit plan to assign sliding window capacity rules."
          icon={Layers}
          action={
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Rate Limit Plan
            </Button>
          }
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
          <Table headers={['PLAN NAME', 'DESCRIPTION', 'REQUEST CAPACITY', 'WINDOW DURATION', 'ASSIGNED CONSUMERS', 'STATUS', 'ACTIONS']}>
            {paginatedPlans.map((plan) => {
              const IconComp = plan.icon || Zap
              return (
                <TableRow key={plan.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                  {/* Plan Name & Contextual Icon */}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg p-1.5 border shrink-0 ${plan.icon_style}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {plan.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="py-2 text-xs text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                    {plan.description}
                  </TableCell>

                  {/* Request Capacity */}
                  <TableCell className="py-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {plan.requests_per_window === 0 ? 'Custom limits' : `${plan.requests_per_window.toLocaleString()} requests`}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        per window
                      </p>
                    </div>
                  </TableCell>

                  {/* Window Duration */}
                  <TableCell className="py-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {plan.window_seconds === 0 ? 'Custom' : `${plan.window_seconds} seconds`}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        (Sliding Window)
                      </p>
                    </div>
                  </TableCell>

                  {/* Assigned Consumers */}
                  <TableCell className="py-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {plan.consumer_count}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        consumers
                      </p>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-2">
                    <Badge variant={plan.is_active ? 'success' : 'warning'} size="sm">
                      {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>

                  {/* Action Buttons (View, Edit, Options Menu) */}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* View Action */}
                      <button
                        onClick={() => {
                          setSelectedPlan(plan)
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
                          setSelectedPlan(plan)
                          setFormData({
                            name: plan.name,
                            description: plan.description,
                            requests_per_window: plan.requests_per_window,
                            window_seconds: plan.window_seconds,
                            is_active: plan.is_active,
                          })
                          setModalError(null)
                          setEditModalOpen(true)
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Edit Plan"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Options Dropdown Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {openMenuId === plan.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in duration-100">
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                handleToggleStatus(plan)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {plan.is_active ? 'Deactivate Plan' : 'Activate Plan'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </Table>

          {/* 5. FIXED PAGINATION BAR AT BOTTOM */}
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

      {/* CREATE PLAN MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Rate Limit Plan"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePlanSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Plan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Pro Plan"
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
              placeholder="For professional applications with high throughput..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#D44720] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Request Capacity
              </label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.requests_per_window}
                onChange={(e) => setFormData({ ...formData, requests_per_window: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Window Duration (sec)
              </label>
              <Input
                type="number"
                placeholder="60"
                value={formData.window_seconds}
                onChange={(e) => setFormData({ ...formData, window_seconds: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Status
            </label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              options={[
                { value: 'active', label: 'Active — Ready for consumer assignment' },
                { value: 'inactive', label: 'Inactive — Draft mode' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* EDIT PLAN MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Rate Limit Plan"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditPlanSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditPlanSubmit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plan Name
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
                Request Capacity
              </label>
              <Input
                type="number"
                value={formData.requests_per_window}
                onChange={(e) => setFormData({ ...formData, requests_per_window: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Window Duration (sec)
              </label>
              <Input
                type="number"
                value={formData.window_seconds}
                onChange={(e) => setFormData({ ...formData, window_seconds: e.target.value })}
                required
              />
            </div>
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

      {/* VIEW PLAN DETAILS MODAL */}
      {selectedPlan && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Plan Details — ${selectedPlan.name}`}
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
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedPlan.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedPlan.description}</p>
              </div>
              <Badge variant={selectedPlan.is_active ? 'success' : 'warning'}>
                {selectedPlan.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block mb-1">Requests / Window</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedPlan.requests_per_window.toLocaleString()} req</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block mb-1">Window Duration</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedPlan.window_seconds} seconds</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                <span className="text-slate-500 block mb-1">Assigned Consumers</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedPlan.consumer_count} Consumers</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
