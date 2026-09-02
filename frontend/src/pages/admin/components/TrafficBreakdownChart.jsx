import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const TrafficBreakdownChart = ({ statusData }) => {
  const navigate = useNavigate()

  const categories = statusData?.category_counts || {
    '2xx': 0,
    '4xx': 0,
    '5xx': 0,
    '3xx': 0,
  }

  const total = (categories['2xx'] || 0) + (categories['3xx'] || 0) + (categories['4xx'] || 0) + (categories['5xx'] || 0)

  const data = [
    { name: '2xx Success', value: categories['2xx'] || 0, color: '#ACCAB2' },
    { name: '4xx Client Errors', value: categories['4xx'] || 0, color: '#EBA762' },
    { name: '5xx Server Errors', value: categories['5xx'] || 0, color: '#D44720' },
    { name: '3xx Redirections', value: categories['3xx'] || 0, color: '#786150' },
  ]

  const successRate = total > 0 ? (((categories['2xx'] || 0) / total) * 100).toFixed(1) : '0.0'
  const errorRate = total > 0 ? ((((categories['4xx'] || 0) + (categories['5xx'] || 0)) / total) * 100).toFixed(1) : '0.0'
  const redirectRate = total > 0 ? (((categories['3xx'] || 0) / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3 shadow-xs flex flex-col justify-between h-[215px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <PieIcon className="h-3.5 w-3.5 text-[#EBA762]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Traffic Breakdown</h3>
        </div>
        <button
          onClick={() => navigate('/admin/analytics')}
          className="rounded-md border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          View Details
        </button>
      </div>

      <div className="grid grid-cols-2 items-center gap-2 py-1">
        {/* Donut Chart with Center Text */}
        <div className="relative h-28 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[8px] uppercase font-bold text-slate-400">Total</span>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="space-y-1">
          {data.map((item, idx) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            return (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 truncate max-w-[95px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name.split(' ')[0]}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[10px]">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Summary Metrics */}
      <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-center">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400">Success</span>
          <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{successRate}%</p>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400">Error</span>
          <p className="text-xs font-extrabold text-red-500">{errorRate}%</p>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400">Redirect</span>
          <p className="text-xs font-extrabold text-[#786150] dark:text-slate-300">{redirectRate}%</p>
        </div>
      </div>
    </div>
  )
}
