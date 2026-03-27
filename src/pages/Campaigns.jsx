import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Megaphone, ArrowRight, Trash2, Copy, AlertCircle, MessageCircle, Smartphone, Mail } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Badge, ChannelBadge } from '../components/ui/Badge'
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'

// ─── Create Campaign Modal ────────────────────────────────────────────────────
const CHANNELS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle size={18} />,
    desc: 'Rich messages with media, buttons & templates',
    color: '#25D366',
    bg: '#F0FDF4',
    border: '#86EFAC',
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: <Smartphone size={18} />,
    desc: 'Universal reach — no app required',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#93C5FD',
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail size={18} />,
    desc: 'Rich HTML emails with detailed content',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#C4B5FD',
  },
]

function CreateCampaignModal({ open, onClose, onBegin }) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [nameError, setNameError] = useState('')

  const reset = () => {
    setName('')
    setChannel('whatsapp')
    setNameError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleBegin = () => {
    if (!name.trim()) {
      setNameError('Campaign name is required')
      return
    }
    onBegin({ name: name.trim(), channel })
    reset()
  }

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <ModalHeader
        title="Create a campaign"
        subtitle="Keep your subscribers engaged by sharing your latest news, promoting products, or announcing an event."
        onClose={handleClose}
      />
      <ModalBody>
        {/* Campaign name */}
        <div className="form-group">
          <label className="form-label">Campaign name <span className="required">*</span></label>
          <input
            className={`input ${nameError ? 'error' : ''}`}
            placeholder="e.g. Summer Sale Blast"
            value={name}
            onChange={e => { setName(e.target.value); if (nameError) setNameError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleBegin() }}
            autoFocus
          />
          {nameError && (
            <div className="form-error">
              <AlertCircle size={12} />{nameError}
            </div>
          )}
        </div>

        {/* Channel */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Channel</label>
          <p style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginBottom: 10 }}>
            How would you like to send this campaign?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHANNELS.map(ch => (
              <div
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: `2px solid ${channel === ch.id ? ch.border : 'var(--c-border)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  background: channel === ch.id ? ch.bg : 'var(--c-surface)',
                  transition: 'all 150ms ease',
                }}
              >
                {/* Radio indicator */}
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${channel === ch.id ? ch.color : 'var(--c-border)'}`,
                  background: channel === ch.id ? ch.color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 150ms ease',
                }}>
                  {channel === ch.id && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>
                {/* Icon */}
                <span style={{ display: 'flex', color: channel === ch.id ? ch.color : 'var(--c-text-3)', transition: 'color 150ms' }}>{ch.icon}</span>
                {/* Text */}
                <div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: channel === ch.id ? ch.color : 'var(--c-text)',
                    transition: 'color 150ms',
                  }}>
                    {ch.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 1 }}>
                    {ch.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleBegin}>
          Begin →
        </button>
      </ModalFooter>
    </Modal>
  )
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'draft', label: 'Drafts' },
]

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n?.toString() || '0'
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Campaigns() {
  const { campaigns, deleteCampaign, addCampaign, toast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const handleBegin = ({ name, channel }) => {
    setShowCreate(false)
    navigate('/campaigns/new', { state: { name, channel } })
  }

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (tab === 'active') return c.status === 'processing' || c.status === 'queued'
    if (tab === 'completed') return c.status === 'completed'
    if (tab === 'draft') return c.status === 'draft'
    return true
  })

  const handleDelete = async () => {
    setDeleting(true)
    await new Promise(r => setTimeout(r, 600))
    deleteCampaign(deleteTarget.id)
    toast('Campaign deleted', 'success')
    setDeleteTarget(null)
    setDeleting(false)
  }

  const handleDuplicate = (c, e) => {
    e.stopPropagation()
    const newC = {
      ...c,
      id: `c_${Date.now()}`,
      name: `${c.name} (Copy)`,
      status: 'draft',
      sent: 0, delivered: 0, failed: 0, optOuts: 0, ctaClicks: 0, totalRecipients: 0,
      createdAt: new Date().toISOString(),
      sentAt: null,
      timeline: [{ event: 'Campaign duplicated from ' + c.name, time: new Date().toISOString(), type: 'gray' }],
    }
    addCampaign(newC)
    toast('Campaign duplicated', 'success', 'Duplicated')
  }

  const counts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === 'processing' || c.status === 'queued').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Manage and monitor all your messaging campaigns.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span style={{ marginLeft: 5, background: tab === t.key ? 'var(--c-accent-bg)' : 'var(--c-surface-2)', color: tab === t.key ? 'var(--c-accent)' : 'var(--c-text-4)', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 600 }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="input-with-icon" style={{ flex: 1, maxWidth: 280 }}>
          <div className="input-icon"><Search size={15} /></div>
          <input
            className="input"
            placeholder="Search campaigns…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Megaphone size={28} /></div>
            <div className="empty-title">
              {search ? 'No campaigns match your search' : 'No campaigns yet'}
            </div>
            <div className="empty-desc">
              {search
                ? 'Try a different search term or clear the filter.'
                : "Launch your first campaign to start engaging your audience."}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Create Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Sent</th>
                  <th>Delivery Rate</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const dr = c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(0) : null
                  return (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                    >
                      <td>
                        <div className="td-primary">{c.name}</div>
                        {c.status === 'processing' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <span className="spinner spinner-sm" style={{ borderTopColor: 'var(--c-blue)' }} />
                            <span style={{ fontSize: 11.5, color: 'var(--c-blue)' }}>{fmt(c.sent)} / {fmt(c.totalRecipients)} sent</span>
                          </div>
                        )}
                        {c.status === 'queued' && c.scheduledAt && (
                          <div style={{ fontSize: 11.5, color: 'var(--c-text-4)', marginTop: 3 }}>
                            Scheduled: {fmtDate(c.scheduledAt)}
                          </div>
                        )}
                      </td>
                      <td><ChannelBadge channel={c.channel} /></td>
                      <td><Badge status={c.status} /></td>
                      <td style={{ color: 'var(--c-text-2)' }}>{c.totalRecipients > 0 ? fmt(c.totalRecipients) : '—'}</td>
                      <td style={{ color: 'var(--c-text-2)' }}>{c.sent > 0 ? fmt(c.sent) : '—'}</td>
                      <td>
                        {dr !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar progress-sm" style={{ width: 56 }}>
                              <div className="progress-fill" style={{ width: `${dr}%`, background: parseInt(dr) >= 90 ? 'var(--c-green)' : parseInt(dr) >= 70 ? 'var(--c-yellow)' : 'var(--c-red)' }} />
                            </div>
                            <span style={{ fontSize: 12.5, color: 'var(--c-text-3)', minWidth: 28 }}>{dr}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--c-text-4)' }}>
                        {fmtDate(c.sentAt || c.scheduledAt || c.createdAt)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            title="Duplicate"
                            onClick={e => handleDuplicate(c, e)}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            title="Delete"
                            style={{ color: 'var(--c-red)' }}
                            onClick={e => { e.stopPropagation(); setDeleteTarget(c) }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`) }}
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCampaignModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onBegin={handleBegin}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Campaign"
      />
    </Layout>
  )
}
