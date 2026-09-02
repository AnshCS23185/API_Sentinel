import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Header } from '@/components/navigation/Header'

export const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app-bg text-main-color">
      {/* Universal Top Navbar (Full Width Top Priority) */}
      <Header portalType="admin" onToggleMobile={() => setMobileMenuOpen(true)} />

      {/* Main Container below Header: Compact Sidebar on Left + Page Content on Right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Compact Icon Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar portalType="admin" />
        </div>

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-xs">
            <div className="relative w-64">
              <Sidebar portalType="admin" onCloseMobile={() => setMobileMenuOpen(false)} />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-[-40px] rounded-lg bg-slate-900 p-2 text-white shadow-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Fixed Desktop Page Container */}
        <main className="flex-1 overflow-hidden p-3 sm:p-4">
          <div className="mx-auto max-w-(--breakpoint-2xl) h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
