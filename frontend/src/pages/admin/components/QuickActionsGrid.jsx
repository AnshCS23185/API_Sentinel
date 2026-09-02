import React from 'react'
import { UserPlus, Key, Link, Shield, TrendingUp, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const QuickActionsGrid = () => {
  const navigate = useNavigate()

  const actions = [
    { name: 'Add Consumer', icon: UserPlus, path: '/admin/consumers', color: 'text-sky-500 bg-sky-500/10' },
    { name: 'Create API Key', icon: Key, path: '/admin/consumers', color: 'text-purple-500 bg-purple-500/10' },
    { name: 'Add Endpoint', icon: Link, path: '/admin/endpoints', color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Create Plan', icon: Shield, path: '/admin/plans', color: 'text-[#EBA762] bg-[#EBA762]/10' },
    { name: 'View Analytics', icon: TrendingUp, path: '/admin/analytics', color: 'text-blue-500 bg-blue-500/10' },
    { name: 'View Violations', icon: AlertTriangle, path: '/admin/violations', color: 'text-[#D44720] bg-[#D44720]/10' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3.5 shadow-xs flex flex-col justify-between h-[215px]">
      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">Quick Actions</h3>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={() => navigate(act.path)}
            className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-center group"
          >
            <div className={`rounded-lg p-1.5 mb-1 transition-transform group-hover:scale-110 ${act.color}`}>
              <act.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#D44720] transition-colors leading-tight">
              {act.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
