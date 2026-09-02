import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Shield,
  Layers,
  Activity,
  AlertTriangle,
  Settings,
  Key,
  Database,
  Compass,
} from 'lucide-react'

export const Sidebar = ({ portalType = 'admin', onCloseMobile }) => {
  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Consumers', path: '/admin/consumers', icon: Users },
    { name: 'Rate Limit Plans', path: '/admin/plans', icon: Shield },
    { name: 'API Catalog', path: '/admin/apis', icon: Compass },
    { name: 'API Endpoints', path: '/admin/endpoints', icon: Layers },
    { name: 'Traffic Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Violations Log', path: '/admin/violations', icon: AlertTriangle },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  const consumerNav = [
    { name: 'Dashboard', path: '/consumer', icon: LayoutDashboard, end: true },
    { name: 'API Catalog', path: '/consumer/apis', icon: Compass },
    { name: 'My APIs & Keys', path: '/consumer/my-apis', icon: Database },
    { name: 'Usage & Violations', path: '/consumer/usage', icon: Activity },
    { name: 'Settings', path: '/consumer/settings', icon: Settings },
  ]

  const navItems = portalType === 'admin' ? adminNav : consumerNav

  return (
    <aside className="flex h-full w-16 flex-col items-center justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] py-4 text-slate-800 dark:text-slate-100 transition-all">
      <div className="flex flex-col items-center w-full">
        {/* Navigation Items (Icon-only with hover tooltips) */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map((item) => (
            <div key={item.path} className="relative group flex items-center justify-center">
              <NavLink
                to={item.path}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#D44720] text-white shadow-md shadow-[#D44720]/30 scale-105'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
              </NavLink>

              {/* Hover Tooltip Popup Label */}
              <div className="absolute left-14 z-50 pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out origin-left">
                <div className="flex items-center">
                  {/* Tooltip Arrow */}
                  <div className="w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800" />
                  {/* Tooltip Body */}
                  <div className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-xl">
                    {item.name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Compact Version Badge */}
      <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider text-center rotate-[-90deg] mb-2 select-none">
        v1.0
      </div>
    </aside>
  )
}
