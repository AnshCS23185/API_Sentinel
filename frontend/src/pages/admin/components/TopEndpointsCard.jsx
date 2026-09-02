import React from 'react'
import { Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const TopEndpointsCard = ({ endpoints = [], totalRequests = 128842 }) => {
  const navigate = useNavigate()

  const defaultEndpoints = [
    { method: 'GET', path: '/api/users', request_count: 24821, pct: 19.3, color: '#ACCAB2' },
    { method: 'POST', path: '/api/orders', request_count: 18642, pct: 14.5, color: '#D44720' },
    { method: 'GET', path: '/api/products', request_count: 16192, pct: 12.6, color: '#ACCAB2' },
  ]

  const colors = ['#ACCAB2', '#D44720', '#ACCAB2']

  const list = endpoints.length > 0
    ? endpoints.slice(0, 3).map((e, idx) => {
        const reqs = e.request_count || 0
        const pct = totalRequests > 0 ? ((reqs / totalRequests) * 100).toFixed(1) : '0.0'
        return {
          method: e.method || 'GET',
          path: e.path || '/api',
          request_count: reqs,
          pct: parseFloat(pct),
          color: colors[idx % colors.length],
        }
      })
    : defaultEndpoints

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-2.5 shadow-xs flex flex-col justify-between h-[140px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-[#EBA762]" />
          <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Top Endpoints</h3>
        </div>
        <button
          onClick={() => navigate('/admin/endpoints')}
          className="rounded-md border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-0.5 flex-1 overflow-hidden">
        <div className="grid grid-cols-12 text-[8px] uppercase font-bold text-slate-400 pb-0.5 border-b border-slate-100 dark:border-slate-800">
          <span className="col-span-6">Endpoint</span>
          <span className="col-span-3 text-right">Requests</span>
          <span className="col-span-3 text-right">% Total</span>
        </div>

        {list.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 items-center text-[10px] py-0.5">
            <div className="col-span-6 flex items-center gap-1 truncate">
              <span className={`text-[8px] font-bold px-1 rounded font-mono leading-none ${
                item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-500'
              }`}>
                {item.method}
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 truncate text-[9px]">
                {item.path}
              </span>
            </div>
            <span className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-[9px]">
              {item.request_count.toLocaleString()}
            </span>
            <div className="col-span-3 flex items-center justify-end gap-1 pl-1">
              <div className="w-6 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(item.pct * 3.5, 100)}%`, backgroundColor: item.color }}
                />
              </div>
              <span className="text-[8px] font-mono text-slate-400">{item.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
