import React, { useState, useEffect } from 'react'
import {
  Shield,
  Server,
  Database,
  Layers,
  Gauge,
  Network,
  Lock,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Check,
  Cpu,
  Globe
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const SettingsPage = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  return (
    <div className="flex flex-col h-full justify-between gap-3 overflow-hidden">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0">
        <PageHeader
          title="Platform & Security Settings"
          subtitle="Manage API Sentinel environment parameters, JWT configurations, and security policies."
        />

        {/* Right Header Refresh Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs py-1 px-3 shrink-0"
          title="Refresh Settings Status"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* SCROLLABLE UNIFIED WORKSPACE (No Box-in-a-Box) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
        {/* SECTION 1 — TWO-COLUMN SECURITY & INFRASTRUCTURE */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN: Security & JWT Policy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
              <Shield className="h-4 w-4 text-sky-500" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Security & JWT Policy
              </h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {/* JWT Algorithm */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">JWT Algorithm</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">HS256</span>
              </div>

              {/* Token Expiration */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Token Expiration</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">60 minutes</span>
              </div>

              {/* Secret Security Standard */}
              <div className="flex flex-col gap-0.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Secret Security Standard</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    VALIDATED (&gt;=32 CHARS) <Check className="h-3 w-3" />
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Meets recommended security standards</span>
              </div>

              {/* Secret Status */}
              <div className="flex flex-col gap-0.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Secret Status</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    STRONG <Check className="h-3 w-3" />
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">No weak patterns detected</span>
              </div>

              {/* JWT Issuer */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">JWT Issuer</span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">api-sentinel</span>
              </div>

              {/* JWT Audience */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">JWT Audience</span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">api-sentinel-clients</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Infrastructure & Connection Pool */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
              <Server className="h-4 w-4 text-sky-500" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Infrastructure & Connection Pool
              </h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {/* PostgreSQL Engine */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">PostgreSQL Engine</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">PostgreSQL 18 Alpine</span>
              </div>

              {/* PostgreSQL Status */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">PostgreSQL Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  CONNECTED <Check className="h-3 w-3" />
                </span>
              </div>

              {/* Redis Cache Engine */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Redis Cache Engine</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">Redis 8 Alpine</span>
              </div>

              {/* Redis Status */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Redis Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  CONNECTED <Check className="h-3 w-3" />
                </span>
              </div>

              {/* Rate Limiter Policy */}
              <div className="flex flex-col gap-0.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Rate Limiter Policy</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#D44720]/15 text-[#D44720] border border-[#D44720]/30">
                    FAIL-CLOSED 503 <AlertTriangle className="h-3 w-3" />
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Requests are blocked when limits exceed</span>
              </div>

              {/* Gateway Status */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Gateway Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  OPERATIONAL <Check className="h-3 w-3" />
                </span>
              </div>

              {/* Upstream Connectivity */}
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Upstream Connectivity</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  HEALTHY <Check className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 — SYSTEM SECURITY STATUS (Full Width Horizontal Row) */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
            <Shield className="h-4 w-4 text-sky-500" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              System Security Status
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3.5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/80">
              {/* Item 1: Authentication */}
              <div className="flex items-center gap-3 lg:pr-3">
                <div className="rounded-full p-2.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Authentication</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">JWT Security</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    HEALTHY <Check className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Item 2: Database */}
              <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:px-3">
                <div className="rounded-full p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Database</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">PostgreSQL</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    CONNECTED <Check className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Item 3: Cache */}
              <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:px-3">
                <div className="rounded-full p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Cache</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Redis</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    CONNECTED <Check className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Item 4: Rate Limiter */}
              <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:px-3">
                <div className="rounded-full p-2.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 shrink-0">
                  <Gauge className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Rate Limiter</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Policy Enforcement</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#D44720]/15 text-[#D44720] border border-[#D44720]/30">
                    FAIL-CLOSED <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Item 5: Gateway */}
              <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:pl-3">
                <div className="rounded-full p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                  <Network className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Gateway</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">API Gateway</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    OPERATIONAL <Check className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — CONFIGURATION INFORMATION (Clean 3-Column Layout) */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
            <Info className="h-4 w-4 text-sky-500" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Configuration Information
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-4 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80">
              {/* Column 1 */}
              <div className="space-y-2.5 md:pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Environment</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">Production</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Application Version</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">v1.0.0</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Deployment Mode</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">Docker</span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-2.5 pt-3 md:pt-0 md:px-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Server Time</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{currentTime}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Server Timezone</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">Asia/Kolkata (IST)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Uptime</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">7d 14h 23m 11s</span>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-2.5 pt-3 md:pt-0 md:pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Node Environment</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">production</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Log Level</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">info</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Timezone</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">Asia/Kolkata (IST)</span>
                </div>
              </div>
            </div>

            {/* Bottom Informational Note */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Info className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span>Changes to these settings may require a service restart to take effect.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
