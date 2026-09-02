import React from 'react'
import { Server, Database, Cpu, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'

export const SystemHealthCard = ({ healthStatus }) => {
  const navigate = useNavigate()

  const services = [
    { name: 'API Gateway', icon: Server, status: 'Healthy' },
    { name: 'Redis Cache', icon: Cpu, status: 'Healthy' },
    { name: 'PostgreSQL', icon: Database, status: 'Healthy' },
    { name: 'Demo API', icon: Globe, status: 'Healthy' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-2.5 shadow-xs flex flex-col justify-between h-[140px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Server className="h-3 w-3 text-emerald-500" />
          <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100">System Health</h3>
        </div>
        <button
          onClick={() => navigate('/admin/settings')}
          className="rounded-md border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-1 flex-1 overflow-hidden">
        {services.map((s, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40"
          >
            <div className="flex items-center gap-1.5">
              <div className="rounded-full bg-emerald-500/10 p-0.5 text-emerald-500">
                <s.icon className="h-2.5 w-2.5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                {s.name}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <Badge variant="success" size="sm" className="text-[8px] px-1 py-0 leading-none">
                {s.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
