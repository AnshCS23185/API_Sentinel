import React, { useEffect, useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Server,
  Globe,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableRow, TableCell } from '@/components/ui/Table'
import { analyticsService } from '@/services/analyticsService'
import { violationService } from '@/services/violationService'
import { useAuth } from '@/app/providers/AuthProvider'

export const ConsumerUsageAnalyticsPage = () => {
  const { consumerUser } = useAuth()
  const currentConsumerId = consumerUser?.id || 733

  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' | 'violations'
  const [timeSeries, setTimeSeries] = useState([])
  const [violations, setViolations] = useState([])
  const [expandedViolationIds, setExpandedViolationIds] = useState(new Set([33]))

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const [tsData, violData] = await Promise.all([
          analyticsService.getTimeSeries({ interval: 'hour', consumer_id: currentConsumerId }),
          violationService.getViolations({ limit: 20, consumer_id: currentConsumerId }),
        ])

        if (tsData && Array.isArray(tsData.data)) {
          setTimeSeries(tsData.data)
        } else {
          setTimeSeries([
            { timestamp: '00:00', requests: 420, success: 415, failed: 5 },
            { timestamp: '04:00', requests: 280, success: 278, failed: 2 },
            { timestamp: '08:00', requests: 890, success: 870, failed: 20 },
            { timestamp: '12:00', requests: 1450, success: 1410, failed: 40 },
            { timestamp: '16:00', requests: 1120, success: 1100, failed: 20 },
            { timestamp: '20:00', requests: 780, success: 775, failed: 5 },
          ])
        }

        const items = violData?.violations || violData || []
        if (Array.isArray(items)) {
          setViolations(items)
        }
      } catch (err) {
        console.error('Error loading usage & violations analytics', err)
      }
    }

    fetchUsageData()
  }, [])

  const toggleViolationExpand = (id) => {
    setExpandedViolationIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Method distribution data
  const methodData = [
    { method: 'GET', count: 32400, color: '#3B82F6' },
    { method: 'POST', count: 8200, color: '#EBA762' },
    { method: 'PUT', count: 1800, color: '#ACCAB2' },
    { method: 'DELETE', count: 450, color: '#EF4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Usage & Violations"
        subtitle="Detailed API request volume telemetry, status distribution, latency performance, and rate limit violation logs."
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-[#D44720] text-[#D44720]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" /> Usage Analytics
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'violations'
              ? 'border-[#D44720] text-[#D44720]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Rate Limit Violations ({violations.length})
        </button>
      </div>

      {/* TAB 1: Usage Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs font-semibold uppercase text-slate-500">Total Requests</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">42,850</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">↑ 12% vs last week</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold uppercase text-slate-500">Successful (2xx)</span>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">42,120</p>
              <span className="text-[11px] text-slate-500 mt-1">98.3% Success Rate</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold uppercase text-slate-500">Failed / Exceeded</span>
              <p className="mt-2 text-2xl font-extrabold text-[#EBA762]">730</p>
              <span className="text-[11px] text-slate-500 mt-1">1.7% Error Rate</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold uppercase text-slate-500">Average Latency</span>
              <p className="mt-2 text-2xl font-extrabold text-[#ACCAB2]">24 ms</p>
              <span className="text-[11px] text-slate-500 mt-1">Optimal Gateway Transit</span>
            </Card>
          </div>

          {/* Request Volume Chart */}
          <Card p-5 title="Request Volume & Error Trends over Time">
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ACCAB2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ACCAB2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EBA762" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EBA762" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#ACCAB2" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" name="Requests" />
                  <Area type="monotone" dataKey="failed" stroke="#EBA762" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" name="Violations/Errors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Endpoints Table */}
            <Card title="Top Consumed Endpoints">
              <Table headers={['Endpoint Path', 'Method', 'Requests', 'Avg Latency']}>
                <TableRow>
                  <TableCell className="font-mono text-xs font-semibold">/api/products</TableCell>
                  <TableCell><Badge variant="info">GET</Badge></TableCell>
                  <TableCell className="font-bold">24,500</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">18 ms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs font-semibold">/api/orders</TableCell>
                  <TableCell><Badge variant="warning">POST</Badge></TableCell>
                  <TableCell className="font-bold">11,200</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">34 ms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs font-semibold">/api/users/me</TableCell>
                  <TableCell><Badge variant="info">GET</Badge></TableCell>
                  <TableCell className="font-bold">7,150</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">14 ms</TableCell>
                </TableRow>
              </Table>
            </Card>

            {/* HTTP Method Distribution */}
            <Card title="HTTP Method Distribution">
              <div className="mt-4 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} hide />
                    <YAxis dataKey="method" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Rate Limit Violations */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <Card title="Rate Limit Violation Logs" subtitle="Requests rejected by the gateway when exceeding assigned plan limits (HTTP 429)">
            <Table headers={['', 'ID', 'Endpoint', 'Key Prefix', 'Plan Limit', 'Count', 'Timestamp', 'Status']}>
              {violations.map((v) => {
                const isExpanded = expandedViolationIds.has(v.id)
                return (
                  <React.Fragment key={v.id}>
                    <TableRow className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => toggleViolationExpand(v.id)}>
                      <TableCell className="w-8">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs">#{v.id}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{v.endpoint_path}</TableCell>
                      <TableCell className="font-mono text-xs text-[#EBA762]">{v.key_prefix}</TableCell>
                      <TableCell className="text-xs text-slate-500 font-semibold">{v.plan_name || `${v.limit} REQ / ${v.window_seconds}S`}</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-red-600 dark:text-red-400">{v.request_count}</TableCell>
                      <TableCell className="text-xs text-slate-500">{v.timestamp}</TableCell>
                      <TableCell><Badge variant="danger">429 TOO MANY REQUESTS</Badge></TableCell>
                    </TableRow>

                    {/* Expandable Detail View */}
                    {isExpanded && (
                      <TableRow key={`exp-${v.id}`} className="bg-slate-50/80 dark:bg-slate-950/60 border-t-0">
                        <TableCell colSpan={8} className="p-4">
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <Server className="h-4 w-4 text-[#D44720]" /> Gateway Instance Trace
                              </span>
                              <span className="font-mono text-slate-400">Request ID: {v.request_id || 'req_01K3z7a8QmYb2x9'}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 dark:text-slate-400">
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-200">Client IP Address:</span>
                                <p className="font-mono mt-0.5">{v.ip_address || '103.25.45.67'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-200">Gateway Worker:</span>
                                <p className="font-mono mt-0.5">{v.gateway_instance || 'gateway-01'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-200">User Agent:</span>
                                <p className="font-mono mt-0.5 truncate">{v.user_agent || 'Mozilla/5.0...'}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
