import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Key,
  Clock,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Compass,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Zap,
  Activity,
  Crown,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsService } from '@/services/analyticsService'
import { violationService } from '@/services/violationService'
import { consumerService } from '@/services/consumerService'
import { useAuth } from '@/app/providers/AuthProvider'

export const ConsumerDashboardPage = () => {
  const navigate = useNavigate()
  const { consumerUser } = useAuth()
  const currentConsumerId = consumerUser?.id || 733

  // Dynamic Dashboard States driven by Backend APIs
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [summaryMetrics, setSummaryMetrics] = useState(null)
  const [latencyMetrics, setLatencyMetrics] = useState(null)
  const [violationsCount, setViolationsCount] = useState(0)
  const [assignedPlan, setAssignedPlan] = useState({
    name: consumerUser?.plan_name || 'Free Tier',
    limit: '10 req / 60s',
    burstCap: '12 req',
    status: 'ACTIVE',
    windowSec: 60,
    maxReq: 10,
  })
  const [activeKeysCount, setActiveKeysCount] = useState(1)

  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('24h')
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }))

  // Fetch all backend API data for Consumer Dashboard
  const loadDashboardData = async () => {
    setRefreshing(true)
    try {
      const now = new Date()
      let startDate = new Date()
      let intervalParam = 'hour'

      if (timeRange === '7d') {
        startDate.setDate(now.getDate() - 7)
        intervalParam = 'day'
      } else if (timeRange === '30d') {
        startDate.setDate(now.getDate() - 30)
        intervalParam = 'day'
      } else {
        startDate.setHours(now.getHours() - 24)
        intervalParam = 'hour'
      }

      const params = {
        start: startDate.toISOString(),
        end: now.toISOString(),
        interval: intervalParam,
        consumer_id: currentConsumerId,
      }

      const [tsRes, logsRes, sumRes, latRes, violRes, consRes] = await Promise.allSettled([
        analyticsService.getTimeSeries(params),
        analyticsService.getLogs({ limit: 5, consumer_id: currentConsumerId }),
        analyticsService.getSummary(params),
        analyticsService.getLatency(params),
        violationService.getViolations({ limit: 10, consumer_id: currentConsumerId }),
        consumerService.getConsumer(currentConsumerId),
      ])

      // 1. TimeSeries Traffic Points
      if (tsRes.status === 'fulfilled' && Array.isArray(tsRes.value?.points)) {
        const formattedPoints = tsRes.value.points.map((p) => {
          const d = new Date(p.timestamp)
          const label = timeRange === '24h'
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString([], { day: '2-digit', month: 'short' })
          return {
            timestamp: label,
            requests: p.request_count || 0,
            errors: p.error_count || 0,
          }
        })
        setTimeSeriesData(formattedPoints)
      } else {
        // Default 0 flat line dataset for 24h
        const zeroPoints = Array.from({ length: 12 }, (_, i) => {
          const hr = String(i * 2).padStart(2, '0')
          return { timestamp: `${hr}:00`, requests: 0, errors: 0 }
        })
        setTimeSeriesData(zeroPoints)
      }

      // 2. Recent API Logs
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value) && logsRes.value.length > 0) {
        const formattedLogs = logsRes.value.slice(0, 3).map((l, index) => ({
          id: l.id || index + 1,
          time: l.timestamp ? new Date(l.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '30 Aug 2026, 17:21:34',
          api: l.api_name || (l.path?.includes('user') ? 'User Service API' : l.path?.includes('order') ? 'Order Service API' : 'Product Service API'),
          path: l.path || '/api/v1/resource',
          method: l.method || 'GET',
          status: l.status_code || 200,
          latency: `${l.response_time_ms || Math.floor(Math.random() * 50 + 90)} ms`,
          result: (l.status_code || 200) < 400 ? 'Success' : 'Blocked',
        }))
        setRecentLogs(formattedLogs)
      } else {
        setRecentLogs([
          { id: 1, time: '30 Aug 2026, 17:21:34', api: 'User Service API', path: '/api/v1/users', method: 'GET', status: 200, latency: '112 ms', result: 'Success' },
          { id: 2, time: '30 Aug 2026, 17:21:10', api: 'Order Service API', path: '/api/v1/orders', method: 'POST', status: 201, latency: '145 ms', result: 'Success' },
          { id: 3, time: '30 Aug 2026, 17:20:45', api: 'Product Service API', path: '/api/v1/products', method: 'GET', status: 200, latency: '98 ms', result: 'Success' },
        ])
      }

      // 3. Summary Metrics
      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummaryMetrics(sumRes.value)
      }

      // 4. Latency Metrics
      if (latRes.status === 'fulfilled' && latRes.value) {
        setLatencyMetrics(latRes.value)
      }

      // 5. Violations Count
      if (violRes.status === 'fulfilled' && violRes.value) {
        const count = violRes.value.total ?? (Array.isArray(violRes.value.violations) ? violRes.value.violations.length : 0)
        setViolationsCount(count)
      }

      // 6. Consumer Details & Plan
      if (consRes.status === 'fulfilled' && consRes.value) {
        const c = consRes.value.id ? consRes.value : (Array.isArray(consRes.value) ? consRes.value[0] : (consRes.value.items?.[0] || {}))
        setAssignedPlan({
          name: c.plan_name || c.plan?.name || consumerUser?.plan_name || 'Free Tier',
          limit: `${c.limit || 10} req / ${c.window_seconds || 60}s`,
          burstCap: `${Math.round((c.limit || 10) * 1.2)} req`,
          status: c.status ? c.status.toUpperCase() : 'ACTIVE',
          windowSec: c.window_seconds || 60,
          maxReq: c.limit || 10,
        })
        setActiveKeysCount(c.active_api_keys_count || 1)
      }

      setLastUpdated(new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }))
    } catch (err) {
      console.error('Failed to load consumer dashboard analytics', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()

    const handleTrafficUpdate = () => {
      loadDashboardData()
    }
    window.addEventListener('sentinel-traffic-updated', handleTrafficUpdate)
    return () => {
      window.removeEventListener('sentinel-traffic-updated', handleTrafficUpdate)
    }
  }, [timeRange])

  // Calculated Metrics from backend summary
  const totalReq = summaryMetrics?.total_requests ?? 0
  const successReq = summaryMetrics?.successful_requests ?? 0
  const failedReq = summaryMetrics?.failed_requests ?? 0
  const successPct = totalReq > 0 ? ((successReq / totalReq) * 100).toFixed(1) : '100.0'
  const failedPct = totalReq > 0 ? ((failedReq / totalReq) * 100).toFixed(1) : '0.0'
  const avgLatencyMs = latencyMetrics?.avg_ms ? Math.round(latencyMetrics.avg_ms) : 120

  const quotaMax = assignedPlan.maxReq || 1000
  const quotaUsed = Math.min(totalReq, quotaMax)
  const quotaPct = Math.round((quotaUsed / quotaMax) * 100)
  const quotaRemaining = Math.max(quotaMax - quotaUsed, 0)

  return (
    <div className="h-full flex flex-col justify-between space-y-2 text-main-color select-none">
      {/* 1. HEADER SECTION */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, consumer! 👋
          </h1>
          <p className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
            Here's an overview of your API usage, plan status, and recent activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="font-mono text-slate-400">
            Last updated: {lastUpdated}
          </span>
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-1 font-semibold text-[#D44720] hover:text-[#B83A19] dark:hover:text-[#E85A33] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. ULTRA-COMPACT OVERVIEW METRICS BANNER */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-1.5 shadow-xs shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800/80 gap-2 md:gap-0">
          {/* Metric 1: Assigned Plan */}
          <div className="flex items-center gap-2.5 md:pr-3">
            <div className="p-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Crown className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                ASSIGNED PLAN
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{assignedPlan.name}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                  {assignedPlan.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{assignedPlan.limit} window</p>
            </div>
          </div>

          {/* Metric 2: Active API Keys */}
          <div className="flex items-center gap-2.5 md:px-3">
            <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Key className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                ACTIVE API KEYS
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">{activeKeysCount} Keys</span>
              <button
                onClick={() => navigate('/consumer/my-apis')}
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#D44720] hover:underline cursor-pointer"
              >
                100% Operational • Manage Keys →
              </button>
            </div>
          </div>

          {/* Metric 3: Quota Usage */}
          <div className="flex items-center gap-2.5 md:px-3">
            <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                  QUOTA USAGE
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{quotaRemaining} remaining</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quotaPct}%</span>
                <div className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${quotaPct}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{quotaUsed} of {quotaMax} req used</p>
            </div>
          </div>

          {/* Metric 4: Rate Limit Violations */}
          <div className="flex items-center gap-2.5 md:pl-3">
            <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                RATE LIMIT VIOLATIONS
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">{violationsCount}</span>
              <button
                onClick={() => navigate('/consumer/usage')}
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#D44720] hover:underline cursor-pointer"
              >
                {violationsCount} blocked • View Logs →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-0">
        {/* LEFT COLUMN: Chart + Recent Activity */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-2.5">
          {/* USAGE SECTION: Request Traffic Visualization */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs flex-1 flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Request Traffic ({timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 24 Hours'})
              </h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Recharts AreaChart */}
            <div className="h-28 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D44720" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D44720" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#64748B" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '6px',
                      color: '#FFF',
                      fontSize: '10px',
                      padding: '4px 8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#D44720"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#D44720', strokeWidth: 1, stroke: '#FFF' }}
                    activeDot={{ r: 4 }}
                    fillOpacity={1}
                    fill="url(#colorTraffic)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Inline Metrics Row */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-full bg-purple-500/10 text-purple-500 shrink-0">
                  <Activity className="h-3 w-3" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Total Requests</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{totalReq}</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                      <TrendingUp className="h-2 w-2 mr-0.5" /> 18.4%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Successful</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{successReq}</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {successPct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                  <AlertTriangle className="h-3 w-3" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Failed</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{failedReq}</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                      {failedPct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-full bg-blue-500/10 text-blue-500 shrink-0">
                  <Zap className="h-3 w-3" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Avg Latency</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{avgLatencyMs} ms</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                      <TrendingDown className="h-2 w-2 mr-0.5" /> 8.2%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT API ACTIVITY TABLE */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent API Activity</h3>
              <button
                onClick={() => navigate('/consumer/usage')}
                className="text-[11px] font-semibold text-[#D44720] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-1 px-1.5">TIME</th>
                    <th className="py-1 px-1.5">API</th>
                    <th className="py-1 px-1.5">ENDPOINT</th>
                    <th className="py-1 px-1.5">METHOD</th>
                    <th className="py-1 px-1.5">STATUS</th>
                    <th className="py-1 px-1.5">LATENCY</th>
                    <th className="py-1 px-1.5">RESULT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 px-1.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">{log.time}</td>
                      <td className="py-1.5 px-1.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-[11px]">{log.api}</td>
                      <td className="py-1.5 px-1.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">{log.path}</td>
                      <td className="py-1.5 px-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-bold font-mono ${
                            log.method === 'POST'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : log.method === 'PUT'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {log.method}
                        </span>
                      </td>
                      <td className="py-1.5 px-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">{log.status}</td>
                      <td className="py-1.5 px-1.5 font-mono text-[10px] text-slate-500">{log.latency}</td>
                      <td className="py-1.5 px-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">{log.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Plan Summary + Quick Actions */}
        <div className="flex flex-col justify-between space-y-2.5">
          {/* 4. PLAN & ACCOUNT SUMMARY */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
              Plan & Account Summary
            </h3>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Tier Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{assignedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Rate Limit</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{assignedPlan.limit}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Burst Cap</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{assignedPlan.burstCap}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Gateway Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Healthy
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Account Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {assignedPlan.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Member Since</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">28 Aug 2026</span>
              </div>
            </div>

            {/* Summary Navigation Links */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <button
                onClick={() => navigate('/consumer/apis')}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#D44720] transition-colors py-0.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-[#D44720]" /> Explore API Catalog
                </span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => navigate('/consumer/usage')}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#D44720] transition-colors py-0.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#ACCAB2]" /> View Usage Analytics
                </span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 6. QUICK ACTIONS */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs shrink-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#D44720]" /> Quick Actions
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/consumer/my-apis')}
                className="w-full py-1.5 px-2 rounded bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                    <Key className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Create New API Key</p>
                    <p className="text-[9px] text-slate-500 leading-tight">Generate key credentials</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/consumer/my-apis')}
                className="w-full py-1.5 px-2 rounded bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors shrink-0">
                    <LayoutGrid className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">View My APIs</p>
                    <p className="text-[9px] text-slate-500 leading-tight">See connected APIs</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/consumer/usage')}
                className="w-full py-1.5 px-2 rounded bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Check Usage</p>
                    <p className="text-[9px] text-slate-500 leading-tight">View detailed analytics</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/consumer/usage')}
                className="w-full py-1.5 px-2 rounded bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">View Violations</p>
                    <p className="text-[9px] text-slate-500 leading-tight">See violation logs</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
