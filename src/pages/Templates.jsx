import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Edit, Archive, Eye, RefreshCw, AlertCircle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Badge } from '../components/ui/Badge'
import { Modal, ModalHeader, ModalBody, ConfirmModal } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
]

function WABubble({ template }) {
  return (
    <div style={{ background: '#ECE5DD', borderRadius: 12, padding: 14, maxWidth: 280 }}>
      <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
        {template.header && <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{template.header}</div>}
        <div style={{ fontSize: 13, lineHeight: 1.45, color: '#333' }}>
          {template.body}
        </div>
        {template.footer && <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>{template.footer}</div>}
        <div style={{ fontSize: 10.5, color: '#aaa', textAlign: 'right', marginTop: 4 }}>10:42 AM ✓✓</div>
      </div>
      {template.ctaButton && (
        <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', padding: '8px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#128C7E', marginTop: 2, borderRadius: '0 0 12px 12px' }}>
          {template.ctaButton.text}
        </div>
      )}
    </div>
  )
}

export default function Templates() {
  const { templates, archiveTemplate, updateTemplate, toast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [viewTemplate, setViewTemplate] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [resubmitting, setResubmitting] = useState(null)

  const filtered = templates.filter(t => {
    if (t.status === 'archived') return false
    const matchSearch = t.displayName.toLowerCase().includes(search.toLowerCase()) || t.name.includes(search.toLowerCase())
    if (!matchSearch) return false
    if (tab !== 'all') return t.status === tab
    return true
  })

  const counts = {
    all: templates.filter(t => t.status !== 'archived').length,
    approved: templates.filter(t => t.status === 'approved').length,
    pending: templates.filter(t => t.status === 'pending').length,
    rejected: templates.filter(t => t.status === 'rejected').length,
  }

  const handleArchive = async () => {
    setArchiving(true)
    await new Promise(r => setTimeout(r, 500))
    archiveTemplate(archiveTarget.id)
    toast('Template archived', 'success')
    setArchiveTarget(null)
    setArchiving(false)
  }

  const handleResubmit = async (t) => {
    setResubmitting(t.id)
    await new Promise(r => setTimeout(r, 1200))
    updateTemplate({ ...t, status: 'pending', rejectionReason: null })
    toast('Template resubmitted to Meta for review', 'info', 'Resubmitted')
    setResubmitting(null)
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">Manage your WhatsApp message templates.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/templates/new')}>
            <Plus size={15} /> New Template
          </button>
        </div>
      </div>

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
          <input className="input" placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Pending approval notice */}
      {counts.pending > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <RefreshCw size={14} />
          <span>
            <strong>{counts.pending} template{counts.pending > 1 ? 's' : ''}</strong> pending Meta review.
            Approval typically takes a few minutes to 24 hours.
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><FileText size={28} /></div>
            <div className="empty-title">{search ? 'No templates match your search' : 'No templates yet'}</div>
            <div className="empty-desc">
              {search ? 'Try a different search term.' : 'Create your first WhatsApp template to start sending campaigns.'}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={() => navigate('/templates/new')}>
                <Plus size={15} /> Create Template
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="template-grid">
          {filtered.map(t => (
            <div key={t.id} className="template-card">
              <div className="template-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="template-card-name truncate">{t.displayName}</div>
                  <div className="template-card-code">{t.name}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <Badge status={t.status} />
                  <span style={{ fontSize: 11, color: 'var(--c-text-4)' }}>{t.category}</span>
                </div>
              </div>

              {t.status === 'rejected' && t.rejectionReason && (
                <div className="rejection-box" style={{ margin: '0 14px 0' }}>
                  <div className="rejection-title"><AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Rejected by Meta</div>
                  <div className="rejection-reason">{t.rejectionReason}</div>
                </div>
              )}

              <div className="template-card-body">
                {t.header && <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)', marginBottom: 4 }}>{t.header}</div>}
                <div style={{ color: 'var(--c-text-3)', lineHeight: 1.5 }}>
                  {t.body.slice(0, 120)}{t.body.length > 120 ? '…' : ''}
                </div>
                {t.ctaButton && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--c-accent)', fontWeight: 500 }}>
                    CTA: {t.ctaButton.text} →
                  </div>
                )}
              </div>

              <div className="template-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--c-text-4)' }}>
                    Used {t.usageCount} time{t.usageCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="template-card-actions" style={{ opacity: 1 }}>
                  <button className="btn btn-ghost btn-icon-sm" title="Preview" onClick={() => setViewTemplate(t)}>
                    <Eye size={14} />
                  </button>
                  {t.status === 'rejected' && (
                    <button
                      className="btn btn-ghost btn-icon-sm"
                      title="Edit & Resubmit"
                      onClick={() => navigate(`/templates/${t.id}/edit`)}
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {t.status === 'approved' && (
                    <button
                      className="btn btn-ghost btn-icon-sm"
                      title="Edit"
                      onClick={() => navigate(`/templates/${t.id}/edit`)}
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {t.status === 'rejected' && (
                    <button
                      className="btn btn-ghost btn-icon-sm"
                      title="Resubmit to Meta"
                      style={{ color: 'var(--c-blue)' }}
                      onClick={() => handleResubmit(t)}
                      disabled={resubmitting === t.id}
                    >
                      {resubmitting === t.id ? <span className="spinner spinner-sm" /> : <RefreshCw size={14} />}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-icon-sm"
                    title="Archive"
                    style={{ color: 'var(--c-text-4)' }}
                    onClick={() => setArchiveTarget(t)}
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Modal open={!!viewTemplate} onClose={() => setViewTemplate(null)} size="sm">
        <ModalHeader title={viewTemplate?.displayName} subtitle={viewTemplate?.name} onClose={() => setViewTemplate(null)} />
        <ModalBody>
          {viewTemplate && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <WABubble template={viewTemplate} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--c-text-3)', lineHeight: 1.6 }}>
                <div><strong>Category:</strong> {viewTemplate.category} · <strong>Language:</strong> {viewTemplate.language}</div>
                {viewTemplate.ctaButton && <div><strong>CTA:</strong> {viewTemplate.ctaButton.text} → {viewTemplate.ctaButton.url}</div>}
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>

      <ConfirmModal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        loading={archiving}
        title="Archive Template"
        description={`Archive "${archiveTarget?.displayName}"? It will no longer be available for new campaigns.`}
        confirmLabel="Archive"
        confirmClass="btn btn-secondary"
        icon="warning"
      />
    </Layout>
  )
}
