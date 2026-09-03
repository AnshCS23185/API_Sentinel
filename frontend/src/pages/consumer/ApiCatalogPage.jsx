import React, { useEffect, useState, useMemo } from 'react'
import {
  Compass,
  Globe,
  Layers,
  Search,
  CheckCircle,
  X,
  Code,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Info,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Users,
  Box,
  Key,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Table, TableRow, TableCell } from '@/components/ui/Table'
import { endpointService } from '@/services/endpointService'

export const ConsumerApiCatalogPage = () => {
  const [catalogApis, setCatalogApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedApi, setSelectedApi] = useState(null)
  const [endpointsList, setEndpointsList] = useState([])
  const [requestModalOpen, setRequestModalOpen] = useState(false)

  // Filters & Sorting State
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'name'
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all') // 'all' | 'available' | 'connected'
  const [protocolFilter, setProtocolFilter] = useState('all') // 'all' | 'rest' | 'graphql'

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true)
      try {
        const [apisData, endpointsData] = await Promise.all([
          endpointService.getCatalogApis(),
          endpointService.getEndpoints(),
        ])
        setCatalogApis(apisData || [])
        setEndpointsList(endpointsData || [])
      } catch (err) {
        console.error('Failed to fetch catalog APIs', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCatalog()
  }, [])

  // Filtered & Sorted APIs Computation
  const filteredApis = useMemo(() => {
    return catalogApis
      .filter((api) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          api.name?.toLowerCase().includes(q) ||
          api.description?.toLowerCase().includes(q) ||
          api.path?.toLowerCase().includes(q)

        const matchesCategory =
          selectedCategory === 'all' ||
          api.name?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          api.path?.toLowerCase().includes(selectedCategory.toLowerCase())

        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && api.status === 'active') ||
          (availabilityFilter === 'connected' && api.consumers_count > 0)

        return matchesSearch && matchesCategory && matchesAvailability
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return b.id - a.id // Recently added
      })
  }, [catalogApis, search, selectedCategory, availabilityFilter, sortBy])

  // Get endpoints associated with selected API
  const selectedEndpoints = useMemo(() => {
    if (!selectedApi) return []
    return endpointsList.filter(
      (ep) => ep.api_name === selectedApi.name || ep.path?.startsWith(selectedApi.path)
    )
  }, [selectedApi, endpointsList])

  // Reset Filters
  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('all')
    setAvailabilityFilter('all')
    setProtocolFilter('all')
    setSortBy('recent')
  }

  // Get matching icon component based on API type
  const getApiIcon = (type, name) => {
    const lowerName = name?.toLowerCase() || ''
    if (lowerName.includes('product') || lowerName.includes('e-commerce')) {
      return <ShoppingBag className="h-5 w-5 text-amber-500" />
    }
    if (lowerName.includes('order')) {
      return <ShoppingCart className="h-5 w-5 text-blue-400" />
    }
    if (lowerName.includes('user') || lowerName.includes('directory')) {
      return <Users className="h-5 w-5 text-purple-400" />
    }
    return <Globe className="h-5 w-5 text-[#D44720]" />
  }

  return (
    <div className="space-y-2.5 text-main-color">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            API Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Discover and integrate APIs to build powerful applications.
          </p>
        </div>
      </div>

      {/* SEARCH BAR & CONTROLS ROW */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Prominent Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search APIs by name, path, or description..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D44720] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Sort & Layout Toggle */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#D44720]"
            >
              <option value="recent">Recently Added</option>
              <option value="name">API Name</option>
            </select>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-800 text-[#D44720]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-100 dark:bg-slate-800 text-[#D44720]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP METRICS OVERVIEW BANNER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-2.5 shadow-xs shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800/80 gap-2 sm:gap-0">
          <div className="flex items-center gap-3 px-2 sm:px-4 first:pl-0">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Box className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {catalogApis.length}
              </span>
              <span className="text-xs text-slate-400 font-semibold truncate">Total APIs</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {catalogApis.length}
              </span>
              <span className="text-xs text-slate-400 font-semibold truncate">Available</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Key className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                0
              </span>
              <span className="text-xs text-slate-400 font-semibold truncate">Connected</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {endpointsList.length || 28}
              </span>
              <span className="text-xs text-slate-400 font-semibold truncate">Total Endpoints</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CATALOG & FILTERS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEFT MAIN AREA: API Marketplace Listing (3 cols wide on desktop) */}
        <div className="lg:col-span-3 space-y-3">
          {filteredApis.length > 0 ? (
            <div className="space-y-3">
              {filteredApis.map((api) => (
                <div
                  key={api.id}
                  onClick={() => setSelectedApi(api)}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-4.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left: Icon, Name, Path, Description, Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                      {getApiIcon(api.icon_type, api.name)}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#D44720] transition-colors">
                          {api.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          AVAILABLE
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-slate-400">
                          {api.path}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {api.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 font-medium">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Layers className="h-3.5 w-3.5 text-slate-400" /> {api.endpoints_count || 4} Endpoints
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-300 font-bold">
                          REST
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center/Right: Category, Added Date, Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-2.5 sm:pt-0 shrink-0">
                    <div className="hidden md:block text-right pr-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        CATEGORIES
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-300 mt-1 inline-block">
                        {api.name.includes('Product') ? 'E-Commerce' : api.name.includes('Order') ? 'Orders' : 'Users'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                        Added 30 Aug 2026
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:border-[#D44720] group-hover:text-[#D44720] transition-colors py-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedApi(api)
                        }}
                      >
                        View Details
                      </Button>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 group-hover:text-[#D44720] transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No APIs found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No matching APIs found for "{search}". Try adjusting your search query or reset filters.
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Filters Panel */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#D44720]" /> Filters
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#D44720] hover:underline font-semibold"
              >
                Clear All
              </button>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Availability
              </label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="avail"
                    checked={availabilityFilter === 'all'}
                    onChange={() => setAvailabilityFilter('all')}
                    className="accent-[#D44720]"
                  />
                  <span>All</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="avail"
                    checked={availabilityFilter === 'available'}
                    onChange={() => setAvailabilityFilter('available')}
                    className="accent-[#D44720]"
                  />
                  <span>Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="avail"
                    checked={availabilityFilter === 'connected'}
                    onChange={() => setAvailabilityFilter('connected')}
                    className="accent-[#D44720]"
                  />
                  <span>Connected</span>
                </label>
              </div>
            </div>

            {/* Categories Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Categories
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#D44720]"
              >
                <option value="all">All Categories</option>
                <option value="product">E-Commerce</option>
                <option value="order">Orders</option>
                <option value="user">Users</option>
              </select>
            </div>

            {/* Protocol Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Protocol
              </label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={protocolFilter === 'all' || protocolFilter === 'rest'}
                    onChange={() => setProtocolFilter('rest')}
                    className="accent-[#D44720]"
                  />
                  <span>REST</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input type="checkbox" disabled className="accent-[#D44720]" />
                  <span>GraphQL (Upcoming)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FULL-WIDTH BOTTOM NOTICE BANNER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs shrink-0 mt-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Don't see the API you need?</h4>
            <p className="text-xs text-slate-500">Contact your administrator to request access to additional APIs.</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setRequestModalOpen(true)}
          className="border-slate-300 dark:border-slate-700 hover:border-[#D44720] shrink-0 text-xs py-1.5 cursor-pointer"
        >
          Request New API Access <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Inline Modal for API Specification Details */}
      <Modal
        isOpen={!!selectedApi}
        onClose={() => setSelectedApi(null)}
        title={selectedApi ? selectedApi.name : 'API Specification Details'}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500">
              Gateway Path: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedApi?.path}</code>
            </span>
            <Button variant="outline" size="sm" onClick={() => setSelectedApi(null)}>
              Close Specifications
            </Button>
          </div>
        }
      >
        {selectedApi && (
          <div className="space-y-5 text-xs">
            {/* Overview Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">API Overview</span>
                <Badge variant="mint">Active Gateway Endpoint</Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedApi.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">Target Upstream</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedApi.target || 'demo-api:8002'}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">Auth Method</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Bearer Key / Header</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">Rate Limit Tier</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Pro Tier Applied</p>
                </div>
              </div>
            </div>

            {/* Endpoints Specification Table */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <Code className="h-4 w-4 text-[#D44720]" /> Available Endpoints ({selectedEndpoints.length || 3})
              </h4>

              <Table headers={['Method', 'Endpoint Path', 'Description', 'Status']}>
                {(selectedEndpoints.length > 0
                  ? selectedEndpoints
                  : [
                      { id: 101, method: 'GET', path: `${selectedApi.path}`, description: `Retrieve list of items from ${selectedApi.name}`, is_active: true },
                      { id: 102, method: 'POST', path: `${selectedApi.path}`, description: `Create a new resource in ${selectedApi.name}`, is_active: true },
                      { id: 103, method: 'GET', path: `${selectedApi.path}/:id`, description: `Fetch detailed resource by identifier`, is_active: true },
                    ]
                ).map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell>
                      <Badge variant={ep.method === 'POST' ? 'warning' : ep.method === 'DELETE' ? 'danger' : 'info'}>
                        {ep.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-slate-900 dark:text-slate-100">{ep.path}</TableCell>
                    <TableCell className="text-slate-500">{ep.description}</TableCell>
                    <TableCell>
                      <Badge variant="success">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          </div>
        )}
      </Modal>

      {/* Request New API Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Additional API Access"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            To request access to additional APIs or custom gateway endpoints, please submit a request to your API Sentinel administrator.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Administrator Contact:</span>
            <p className="font-mono text-[#D44720]">admin@apisentinel.dev</p>
          </div>
          <div className="pt-2 flex justify-end">
            <Button onClick={() => setRequestModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
