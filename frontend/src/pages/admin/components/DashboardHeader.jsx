import React, { useState, useEffect } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'

export const DashboardHeader = ({ onRefresh, isRefreshing, autoRefresh, onToggleAutoRefresh, dateRange, onChangeDateRange }) => {
  const [greeting, setGreeting] = useState('Good evening')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <div className="flex flex-row items-center justify-between mb-1.5 h-7">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-none">
          {greeting}, Admin! <span className="text-sm">👋</span>
        </h1>
        <span className="hidden sm:inline-block text-[11px] font-medium text-slate-600 dark:text-slate-400 border-l border-slate-300 dark:border-slate-800 pl-2 leading-none">
          Here's what's happening with your API platform today.
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Date Range Picker Dropdown */}
        <div className="relative flex items-center rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] text-slate-800 dark:text-slate-200 shadow-xs">
          <Calendar className="mr-1 h-3 w-3 text-slate-500 dark:text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => onChangeDateRange(e.target.value)}
            className="bg-transparent font-semibold focus:outline-none cursor-pointer text-[10px]"
          >
            <option value="24h" className="dark:bg-slate-900">Last 24 Hours</option>
            <option value="7d" className="dark:bg-slate-900">May 11 - May 18 (Last 7 Days)</option>
            <option value="30d" className="dark:bg-slate-900">Last 30 Days</option>
          </select>
        </div>

        {/* Auto Refresh Toggle */}
        <button
          onClick={onToggleAutoRefresh}
          className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors ${
            autoRefresh
              ? 'border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? 'bg-emerald-600 dark:bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          Auto Refresh {autoRefresh ? 'On' : 'Off'}
        </button>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-[10px] font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-[#D44720]' : ''}`} />
        </button>
      </div>
    </div>
  )
}
