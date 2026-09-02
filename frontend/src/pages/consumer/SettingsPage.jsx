import React, { useState } from 'react'
import {
  User,
  Shield,
  Palette,
  Lock,
  CheckCircle,
  Bell,
  Globe,
  Sliders,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const ConsumerSettingsPage = () => {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [quotaWarnings, setQuotaWarnings] = useState(true)
  const [savedNotice, setSavedNotice] = useState(false)

  const handleSavePreferences = (e) => {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Consumer Settings"
        subtitle="Manage your consumer account details, assigned rate-limit plan parameters, UI themes, and notification preferences."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 1: Consumer Account Information */}
        <Card title="Consumer Account Profile" subtitle="Your identity and organization details on API Sentinel Gateway">
          <div className="space-y-4 text-xs mt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Consumer Name</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">Consumer Alpha 770c</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Consumer Code ID</span>
              <span className="font-mono font-semibold text-[#EBA762]">cns_770c11d2e3f4</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Account Status</span>
              <Badge variant="success">Active & Verified</Badge>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Environment</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Production</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Primary Contact Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">consumer@apisentinel.dev</span>
            </div>
          </div>
        </Card>

        {/* Section 2: Assigned Plan Summary */}
        <Card title="Assigned Rate Limit Plan Summary" subtitle="Quota and rate throttling parameters configured by system admin">
          <div className="space-y-4 text-xs mt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Assigned Tier</span>
              <span className="font-bold text-[#D44720] text-sm">Pro Developer Plan</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Rate Throttling Limit</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">1,000 requests / 60 seconds</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-slate-500 font-medium">Burst Traffic Allowance</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">1,200 requests</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Enforcement Mode</span>
              <Badge variant="mint">Active Gateway Hard Cap</Badge>
            </div>
          </div>
        </Card>

        {/* Section 3: Appearance & Theme Preferences */}
        <Card title="Theme & Interface Preferences" subtitle="Customize display aesthetics and theme styling">
          <div className="space-y-5 text-xs mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Color Theme Preference</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Switch between Light, Dark, or System mode</p>
              </div>
              <ThemeToggle />
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Quota Warning Notifications</p>
                  <p className="text-slate-500 text-[11px]">Email alert when quota usage exceeds 80%</p>
                </div>
                <input
                  type="checkbox"
                  checked={quotaWarnings}
                  onChange={(e) => setQuotaWarnings(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#D44720] focus:ring-[#D44720]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Rate Limit Violation Alerts</p>
                  <p className="text-slate-500 text-[11px]">Receive immediate notification when requests are throttled (HTTP 429)</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#D44720] focus:ring-[#D44720]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {savedNotice ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Preferences Saved!
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" size="sm">
                  Save Preferences
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Section 4: Security & Access Policy (Safe Info) */}
        <Card title="Security & Access Policy" subtitle="Safe credential protocols and signature guidelines">
          <div className="space-y-3 text-xs mt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#D44720]" /> HMAC Signature Verification
              </p>
              <p className="text-slate-500 text-[11px]">
                All incoming API requests to gateway routes require valid API key headers or bearer tokens.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[#ACCAB2]" /> IP Binding & Whitelisting
              </p>
              <p className="text-slate-500 text-[11px]">
                Currently allowing requests from all origin IPs registered under your consumer account token.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
              <strong>Need a plan upgrade or key secret reset?</strong> Please contact your API Sentinel platform administrator. Administrative settings and secret key rotations are restricted to platform managers.
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
