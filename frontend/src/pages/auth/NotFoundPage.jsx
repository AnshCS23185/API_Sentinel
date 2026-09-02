import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="rounded-full bg-[#D44720]/10 p-4 text-[#D44720] mb-4">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">404</h1>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-1 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The route you are looking for does not exist on API Sentinel platform.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={() => navigate('/admin')}>
          Admin Portal
        </Button>
        <Button variant="outline" onClick={() => navigate('/consumer')}>
          Consumer Portal
        </Button>
      </div>
    </div>
  )
}
