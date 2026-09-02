import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, User, Settings, LogOut, Shield, ChevronDown } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuth } from '@/app/providers/AuthProvider'

export const Header = ({ portalType = 'admin', onToggleMobile }) => {
  const { adminUser, logoutAdmin, logoutConsumer } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  const handleLogout = () => {
    setProfileOpen(false)
    if (portalType === 'admin') {
      logoutAdmin()
      navigate('/login/admin')
    } else {
      logoutConsumer()
      navigate('/login/consumer')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userEmail = portalType === 'admin'
    ? adminUser?.email || 'admin@sentinel.local'
    : 'consumer@sentinel.local'

  const userRole = portalType === 'admin' ? 'System Administrator' : 'API Consumer'
  const initials = portalType === 'admin' ? 'AS' : 'CO'

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0D1322]/95 px-4 sm:px-6 backdrop-blur-md transition-colors">
      {/* Left: Brand Logo & Title + Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(portalType === 'admin' ? '/admin' : '/consumer')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D44720] text-white font-extrabold tracking-wider text-base shadow-sm">
            AS
          </div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              API SENTINEL
            </h2>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#2D5A40] dark:text-[#ACCAB2]">
              {portalType === 'admin' ? 'ADMIN PORTAL' : 'CONSUMER PORTAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Theme Switcher & Profile Circle Dropdown */}
      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Profile Circle Avatar Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1 pr-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#D44720] text-white font-bold text-xs shadow-xs">
              {initials}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D1322]" />
            </div>
            <span className="hidden md:inline-block text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
              {userEmail.split('@')[0]}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-500 dark:text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Popup Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              {/* User Info Header */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {userEmail}
                </p>
                <p className="text-[10px] font-bold text-[#C77C2B] dark:text-[#EBA762] uppercase tracking-wider mt-0.5">
                  {userRole}
                </p>
              </div>

              {/* Menu Options */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate(portalType === 'admin' ? '/admin/settings' : '/consumer/settings')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Account Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
