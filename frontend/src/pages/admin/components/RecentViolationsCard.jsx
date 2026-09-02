import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'

export const RecentViolationsCard = ({ violations = [] }) => {
  const navigate = useNavigate()

  const list = violations.slice(0, 4)

  const getTimeAgo = (ts) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    return `${hours}h ago`
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3 shadow-xs flex flex-col justify-between h-[215px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-[#D44720]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent Violations</h3>
        </div>
        <button
          onClick={() => navigate('/admin/violations')}
          className="rounded-md border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-1.5 flex-1 overflow-hidden">
        {list.map((v, idx) => (
          <div
            key={v.id || idx}
            className="flex items-center justify-between px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40"
          >
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {v.consumer_name || 'Consumer'}
                </p>
                <p className="text-[9px] font-mono font-semibold text-slate-700 dark:text-slate-400 truncate">
                  {v.method || 'GET'} {v.endpoint_path || v.path || '/api'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="danger" size="sm" className="font-mono text-[9px] px-1.5 py-0 font-bold">
                429
              </Badge>
              <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {getTimeAgo(v.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
