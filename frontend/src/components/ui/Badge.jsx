import React from 'react'

export const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const base = 'inline-flex items-center font-semibold rounded-full uppercase tracking-wider'

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  }

  const variants = {
    success: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    danger: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
    enterprise: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800',
    business: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
    developer: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800',
    basic: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    mint: 'bg-[#ACCAB2]/20 text-[#2C4E33] dark:text-[#ACCAB2] border border-[#ACCAB2]/50',
    beeswax: 'bg-[#EBA762]/20 text-[#6B4112] dark:text-[#EBA762] border border-[#EBA762]/50',
    grenadine: 'bg-[#D44720]/20 text-[#D44720] border border-[#D44720]/40',
    cafelatte: 'bg-[#786150]/20 text-[#786150] dark:text-[#D1C5BD] border border-[#786150]/40',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  }

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  )
}
