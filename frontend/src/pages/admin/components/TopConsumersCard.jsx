import React from 'react'
import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const TopConsumersCard = ({ consumers = [], totalRequests = 128842 }) => {
  const navigate = useNavigate()

  const defaultConsumers = [
    { consumer_name: 'Acme Corporation', total_requests: 32842, pct: 25.5, color: '#ACCAB2' },
    { consumer_name: 'Beta Solutions', total_requests: 21403, pct: 16.6, color: '#EBA762' },
    { consumer_name: 'Gamma Labs', total_requests: 13672, pct: 10.6, color: '#ACCAB2' },
  ]

  const colors = ['#ACCAB2', '#EBA762', '#ACCAB2']

  const list = consumers.length > 0
    ? consumers.slice(0, 3).map((c, idx) => {
        const reqs = c.total_requests || 0
        const pct = totalRequests > 0 ? ((reqs / totalRequests) * 100).toFixed(1) : '0.0'
        return {
          consumer_name: c.consumer_name || 'Consumer',
          total_requests: reqs,
          pct: parseFloat(pct),
          color: colors[idx % colors.length],
        }
      })
    : defaultConsumers

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-2.5 shadow-xs flex flex-col justify-between h-[140px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-[#ACCAB2]" />
          <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Top Consumers</h3>
        </div>
        <button
          onClick={() => navigate('/admin/consumers')}
          className="rounded-md border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-0.5 flex-1 overflow-hidden">
        <div className="grid grid-cols-12 text-[8px] uppercase font-bold text-slate-400 pb-0.5 border-b border-slate-100 dark:border-slate-800">
          <span className="col-span-5">Consumer</span>
          <span className="col-span-4 text-right">Requests</span>
          <span className="col-span-3 text-right">% Total</span>
        </div>

        {list.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 items-center text-[10px] py-0.5">
            <span className="col-span-5 font-semibold text-slate-800 dark:text-slate-200 truncate">
              {item.consumer_name}
            </span>
            <span className="col-span-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-[9px]">
              {item.total_requests.toLocaleString()}
            </span>
            <div className="col-span-3 flex items-center justify-end gap-1 pl-1">
              <div className="w-6 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(item.pct * 3, 100)}%`, backgroundColor: item.color }}
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
