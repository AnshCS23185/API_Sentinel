import React from 'react'
import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-app-bg px-4 py-8">
      <div className="flex justify-end max-w-4xl mx-auto w-full">
        <ThemeToggle />
      </div>

      <div className="my-auto flex flex-col items-center justify-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D44720] text-white font-extrabold text-2xl shadow-lg">
            AS
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              API SENTINEL
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              API Rate Limit & Usage Tracker
            </p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        API Sentinel Platform &copy; {new Date().getFullYear()} Enterprise SaaS Gateway
      </div>
    </div>
  )
}
