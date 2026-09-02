import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableRow, TableCell } from '@/components/ui/Table'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { consumerService } from '@/services/consumerService'
import { apiKeyService } from '@/services/apiKeyService'
import { Key, Shield, ArrowLeft, Plus, Copy, Check, AlertTriangle, Power } from 'lucide-react'

export const ConsumerDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consumer, setConsumer] = useState(null)
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [rawKeyModalOpen, setRawKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [rawKey, setRawKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchConsumerDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const cData = await consumerService.getConsumer(id)
      setConsumer(cData)
      const kData = await apiKeyService.getConsumerKeys(id)
      setKeys(kData.api_keys || kData || [])
    } catch (err) {
      setError(err.message || 'Failed to load consumer detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsumerDetail()
  }, [id])

  const handleCreateKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      setModalError('API Key name is required')
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      const res = await apiKeyService.createKey(id, { name: newKeyName.trim() })
      setRawKey(res.raw_key)
      setCreateModalOpen(false)
      setRawKeyModalOpen(true)
      fetchConsumerDetail()
    } catch (err) {
      setModalError(err.response?.data?.detail || err.message || 'Failed to provision API Key')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleKeyStatus = async (keyItem) => {
    try {
      await apiKeyService.updateKey(keyItem.id, { is_active: !keyItem.is_active })
      fetchConsumerDetail()
    } catch (err) {
      alert(err.message || 'Failed to update key status')
    }
  }

  const handleCopyRawKey = () => {
    navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <LoadingState message="Fetching Consumer Profile & Provisioned Keys..." />
  if (error) return <ErrorState message={error} onRetry={fetchConsumerDetail} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={consumer?.name || `Consumer #${id}`}
        subtitle={`Consumer ID: #${id} • Assigned Plan: ${consumer?.plan_name || consumer?.plan?.name || 'Standard Rate Limit Plan'}`}
        breadcrumbs={['Admin', 'Consumers', `Consumer #${id}`]}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/consumers')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Consumers
          </Button>
        }
      />

      {/* Consumer Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <span className="text-xs font-semibold uppercase text-slate-500">Status</span>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={consumer?.status === 'active' ? 'success' : 'danger'}>
              {consumer?.status || 'Active'}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase text-slate-500">Assigned Plan</span>
          <div className="mt-2 font-bold text-slate-900 dark:text-slate-100">
            {consumer?.plan_name || consumer?.plan?.name || 'Basic (100 req / min)'}
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase text-slate-500">Total API Keys</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{keys.length}</div>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card
        title="Provisioned API Keys"
        subtitle="Manage credentials issued to this Consumer. Raw keys are never stored or redisplayed."
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setNewKeyName('')
              setModalError(null)
              setCreateModalOpen(true)
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Provision New Key
          </Button>
        }
      >
        <Table headers={['Key ID', 'Key Name', 'Key Prefix', 'Status', 'Last Used', 'Actions']}>
          {keys.map((k) => (
            <TableRow key={k.id}>
              <TableCell className="font-mono text-xs">#{k.id}</TableCell>
              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{k.name}</TableCell>
              <TableCell className="font-mono text-xs text-[#EBA762]">{k.key_prefix}...</TableCell>
              <TableCell>
                <Badge variant={k.is_active ? 'success' : 'danger'}>
                  {k.is_active ? 'Active' : 'Revoked'}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500 text-xs">
                {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
              </TableCell>
              <TableCell>
                <Button
                  size="xs"
                  variant={k.is_active ? 'outline' : 'primary'}
                  onClick={() => handleToggleKeyStatus(k)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5"
                >
                  <Power className="h-3 w-3" />
                  {k.is_active ? 'Revoke' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      {/* PROVISION NEW KEY MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`Provision New API Key for ${consumer?.name || 'Consumer'}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateKey} disabled={submitting}>
              {submitting ? 'Generating...' : 'Generate API Key'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateKey} className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Key Name / Label <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Production Logistics Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />
          </div>

          <div className="rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 p-3 text-xs text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Key className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Security Credential Notice</span>
            </div>
            <p className="text-[11px] text-sky-700 dark:text-sky-300">
              Generating an API key produces a unique cryptographic token prefixed with <span className="font-mono font-bold text-slate-900 dark:text-slate-100">sen_live_</span>. The plaintext secret will be displayed once.
            </p>
          </div>
        </form>
      </Modal>

      {/* RAW SECRET KEY DISPLAY MODAL */}
      <Modal
        isOpen={rawKeyModalOpen}
        onClose={() => setRawKeyModalOpen(false)}
        title="API Key Provisioned Successfully"
        size="md"
        footer={
          <Button variant="primary" onClick={() => setRawKeyModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/60 p-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Save Your API Key Now</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Copy this API Key immediately. For security reasons, it cannot be shown again.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Secret API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg break-all text-[#EBA762]">
                {rawKey}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRawKey}
                className="flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
