import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with API Sentinel servers.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-8 text-center my-4">
      <div className="rounded-full bg-red-100 dark:bg-red-900/40 p-3 text-red-600 dark:text-red-400 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
