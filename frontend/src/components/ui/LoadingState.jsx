import React from 'react'
import { Loader2 } from 'lucide-react'

export const LoadingState = ({ message = 'Loading metrics & data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 my-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#D44720] mb-3" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  )
}
