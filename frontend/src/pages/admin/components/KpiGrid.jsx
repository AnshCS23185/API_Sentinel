import React from 'react'
import { Activity, CheckCircle2, XCircle, Zap, Users, Key, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export const KpiGrid = ({ summary, consumerCount, keyCount, violationCount }) => {
  const formatNum = (val) => (val ?? 0).toLocaleString()

  const cards = [
    {
      title: 'Total Requests',
      value: formatNum(summary?.total_requests),
      change: '12.5%',
      isPositive: true,
      subtext: 'vs last 7d',
      icon: Activity,
      cardStyle: 'bg-emerald-50/90 border-emerald-300 text-slate-900 dark:bg-[#0A201A] dark:border-[#143B30] dark:text-slate-100',
      iconStyle: 'bg-emerald-600/15 text-emerald-700 border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    },
    {
      title: 'Successful Requests',
      value: formatNum(summary?.successful_requests),
      change: '10.2%',
      isPositive: true,
      subtext: 'vs last 7d',
      icon: CheckCircle2,
      cardStyle: 'bg-emerald-50/90 border-emerald-300 text-slate-900 dark:bg-[#092219] dark:border-[#123E2E] dark:text-slate-100',
      iconStyle: 'bg-emerald-600/15 text-emerald-700 border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    },
    {
      title: 'Failed / Blocked',
      value: formatNum(summary?.failed_requests),
      change: '22.1%',
      isPositive: false,
      subtext: 'vs last 7d',
      icon: XCircle,
      cardStyle: 'bg-red-50/90 border-red-300 text-slate-900 dark:bg-[#251015] dark:border-[#451A22] dark:text-slate-100',
      iconStyle: 'bg-red-600/15 text-red-700 border-red-400 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
    },
    {
      title: 'Avg Latency',
      value: `${(summary?.avg_response_time_ms ?? 0).toFixed(1)} ms`,
      change: '5.4%',
      isPositive: true,
      subtext: 'vs last 7d',
      icon: Zap,
      cardStyle: 'bg-amber-50/90 border-amber-300 text-slate-900 dark:bg-[#231A10] dark:border-[#42311C] dark:text-slate-100',
      iconStyle: 'bg-amber-600/15 text-amber-700 border-amber-400 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
    },
    {
      title: 'Active Consumers',
      value: formatNum(summary?.active_consumers_count ?? consumerCount),
      change: '8.3%',
      isPositive: true,
      subtext: 'vs last 7d',
      icon: Users,
      cardStyle: 'bg-sky-50/90 border-sky-300 text-slate-900 dark:bg-[#0E1E2B] dark:border-[#1A384F] dark:text-slate-100',
      iconStyle: 'bg-sky-600/15 text-sky-700 border-sky-400 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
    },
    {
      title: 'Active API Keys',
      value: formatNum(summary?.active_api_keys_count ?? keyCount),
      change: '6.1%',
      isPositive: true,
      subtext: 'vs last 7d',
      icon: Key,
      cardStyle: 'bg-purple-50/90 border-purple-300 text-slate-900 dark:bg-[#1B132C] dark:border-[#352357] dark:text-slate-100',
      iconStyle: 'bg-purple-600/15 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
    },
    {
      title: 'Rate Limit Violations',
      value: formatNum(summary?.rate_limit_violations_count ?? violationCount),
      change: '15.2%',
      isPositive: false,
      subtext: 'vs last 7d',
      icon: AlertTriangle,
      cardStyle: 'bg-orange-50/90 border-orange-300 text-slate-900 dark:bg-[#271712] dark:border-[#4B281E] dark:text-slate-100',
      iconStyle: 'bg-orange-600/15 text-orange-700 border-orange-400 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 mb-2">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className={`relative flex flex-col justify-between rounded-xl border p-2.5 shadow-xs transition-all h-[88px] ${c.cardStyle}`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight">
              {c.title}
            </span>
            <div className={`rounded-md p-1 border shrink-0 ${c.iconStyle}`}>
              <c.icon className="h-3 w-3" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
              {c.value}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-[10px]">
              <span
                className={`flex items-center font-extrabold ${
                  c.isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                }`}
              >
                {c.isPositive ? (
                  <TrendingUp className="mr-0.5 h-2.5 w-2.5 inline" />
                ) : (
                  <TrendingDown className="mr-0.5 h-2.5 w-2.5 inline" />
                )}
                {c.change}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-semibold truncate text-[9px]">{c.subtext}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
