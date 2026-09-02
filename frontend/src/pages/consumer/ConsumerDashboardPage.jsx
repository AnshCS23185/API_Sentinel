import React, { useEffect, useState } from 'react'
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

export const ConsumerDashboardPage = () => {
  const navigate = useNavigate()
  const [timeSeries, setTimeSeries] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('24h')

  const loadDashboardData = async () => {
    setRefreshing(true)
    try {
      const [tsData, logsData] = await Promise.all([
        analyticsService.getTimeSeries({ interval: 'hour' }),
        analyticsService.getLogs({ limit: 3 }),
      ])

      if (tsData && Array.isArray(tsData.data)) {
        setTimeSeries(tsData.data)
      } else {
        setTimeSeries([
          { timestamp: '00:00', requests: 150 },
          { timestamp: '02:00', requests: 140 },
          { timestamp: '04:00', requests: 90 },
          { timestamp: '06:00', requests: 180 },
          { timestamp: '08:00', requests: 310 },
          { timestamp: '10:00', requests: 420 },
          { timestamp: '12:00', requests: 560 },
          { timestamp: '14:00', requests: 540 },
          { timestamp: '16:00', requests: 440 },
          { timestamp: '18:00', requests: 390 },
          { timestamp: '20:00', requests: 340 },
          { timestamp: '22:00', requests: 310 },
          { timestamp: '24:00', requests: 280 },
        ])
      }

      if (logsData && Array.isArray(logsData) && logsData.length > 0) {
        setRecentLogs(logsData.slice(0, 3))
      } else {
        setRecentLogs([
          {
            id: 1,
            time: '30 Aug 2026, 17:21:34',
            api: 'User Service API',
            path: '/api/v1/users',
            method: 'GET',
            status: 200,
            latency: '112 ms',
            result: 'Success',
          },
          {
            id: 2,
            time: '30 Aug 2026, 17:21:10',
            api: 'Order Service API',
            path: '/api/v1/orders',
            method: 'POST',
            status: 201,
            latency: '145 ms',
            result: 'Success',
          },
          {
            id: 3,
            time: '30 Aug 2026, 17:20:45',
            api: 'Product Service API',
            path: '/api/v1/products',
            method: 'GET',
            status: 200,
            latency: '98 ms',
            result: 'Success',
          },
        ])
      }
    } catch (err) {
      console.error('Failed to load consumer dashboard analytics', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

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
            Last updated: 30 Aug 2026, 05:22 PM
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
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Pro Plan</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">1,000 req / 60s window</p>
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
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">2 Keys</span>
              <button
                onClick={() => navigate('/consumer/my-apis')}
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#D44720] hover:underline"
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
                <span className="text-[9px] text-slate-400 font-medium">860 remaining</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">14%</span>
                <div className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: '14%' }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">140 of 1,000 req used</p>
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
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">0</span>
              <button
                onClick={() => navigate('/consumer/usage')}
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#D44720] hover:underline"
              >
                0 blocked • View Logs →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID (Fits 100% inside single window) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-0">
        {/* LEFT COLUMN: Chart + Recent Activity */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-2.5">
          {/* USAGE SECTION: Request Traffic Visualization */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs flex-1 flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Request Traffic (Last 24 Hours)
              </h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Compact Recharts AreaChart (Height h-28 = 112px) */}
            <div className="h-28 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">140</span>
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
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">132</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      94.3%
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
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">8</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                      5.7%
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
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">120 ms</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                      <TrendingDown className="h-2 w-2 mr-0.5" /> 8.2%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT API ACTIVITY TABLE (Compact 3 rows) */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xs shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent API Activity</h3>
              <button
                onClick={() => navigate('/consumer/usage')}
                className="text-[11px] font-semibold text-[#D44720] hover:underline inline-flex items-center gap-0.5"
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
                <span className="font-bold text-slate-900 dark:text-slate-100">Pro Developer</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Rate Limit</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">1,000 req / 60s</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 text-[11px]">
                <span className="text-slate-500">Burst Cap</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">1,200 req</span>
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
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
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
