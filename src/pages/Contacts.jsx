import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Upload, Users, Trash2, Eye, Search, AlertCircle,
  Download, CheckCircle, X, FileText, UserX, Shield,
  RotateCcw, PhoneOff, ArrowRight, Info, Phone,
  MessageCircle, Smartphone, Mail, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '../components/ui/Modal'
import { ChannelBadge } from '../components/ui/Badge'
import { useApp } from '../context/AppContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmt(n) {
  if (n == null) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

const REASON_COLORS = {
  'Replied STOP': { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  'Carrier opt-out': { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  'Manual suppression': { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  'Imported suppression list': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
}

function ReasonPill({ reason }) {
  const style = REASON_COLORS[reason] || { bg: 'var(--c-surface-2)', color: 'var(--c-text-3)', border: 'var(--c-border)' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11.5,
      fontWeight: 500,
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
    }}>
      {reason}
    </span>
  )
}

function StatusPill({ status }) {
  const isActive = status === 'active'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11.5,
      fontWeight: 600,
      background: isActive ? '#FEF2F2' : 'var(--c-surface-2)',
      color: isActive ? '#B91C1C' : 'var(--c-text-4)',
      border: `1px solid ${isActive ? '#FECACA' : 'var(--c-border)'}`,
    }}>
      {isActive
        ? <><PhoneOff size={10} /> Suppressed</>
        : <><CheckCircle size={10} /> Re-subscribed</>
      }
    </span>
  )
}

// ─── Opt-Out Registry Tab ────────────────────────────────────────────────────

function OptOutRegistry({ optOutLog, suppressionList, onResubscribe, onAddSuppression }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | active | resubscribed
  const { toast } = useApp()

  const activeCount = optOutLog.filter(o => o.status === 'active').length
  const resubCount = optOutLog.filter(o => o.status === 'resubscribed').length
  const thisMonth = optOutLog.filter(o => {
    const d = new Date(o.optedOutAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const filtered = optOutLog.filter(o => {
    const matchSearch = !search || o.phone.includes(search) || (o.campaignName || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || o.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Suppressions</span>
            <div className="stat-card-icon" style={{ background: '#FEF2F2' }}>
              <PhoneOff size={18} style={{ color: '#B91C1C' }} />
            </div>
          </div>
          <div className="stat-card-value">{activeCount.toLocaleString()}</div>
          <div className="stat-card-change">Excluded from all future sends</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Added This Month</span>
            <div className="stat-card-icon" style={{ background: 'var(--c-yellow-bg)' }}>
              <UserX size={18} style={{ color: 'var(--c-yellow)' }} />
            </div>
          </div>
          <div className="stat-card-value">{thisMonth}</div>
          <div className="stat-card-change">New opt-outs in current month</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Re-subscribed</span>
            <div className="stat-card-icon" style={{ background: 'var(--c-green-bg)' }}>
              <RotateCcw size={18} style={{ color: 'var(--c-green)' }} />
            </div>
          </div>
          <div className="stat-card-value">{resubCount}</div>
          <div className="stat-card-change">Opted back in and reachable</div>
        </div>
      </div>

      {/* Info banner */}
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Info size={14} />
        <span>
          Contacts are automatically added here when they reply <strong>STOP</strong> or opt out via a campaign. Suppressed contacts are excluded from all future sends unless manually re-subscribed.
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, maxWidth: 280 }}>
          <div className="input-icon"><Search size={15} /></div>
          <input
            className="input"
            placeholder="Search by phone or campaign…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tab-bar">
          {[
            { key: 'all', label: 'All', count: optOutLog.length },
            { key: 'active', label: 'Suppressed', count: activeCount },
            { key: 'resubscribed', label: 'Re-subscribed', count: resubCount },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${filter === t.key ? 'active' : ''}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{ marginLeft: 5, background: filter === t.key ? 'var(--c-accent-bg)' : 'var(--c-surface-2)', color: filter === t.key ? 'var(--c-accent)' : 'var(--c-text-4)', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 600 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => toast('Exporting suppression list…', 'info')}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={onAddSuppression}>
            <Plus size={14} /> Add to Suppression
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Shield size={28} /></div>
            <div className="empty-title">{search || filter !== 'all' ? 'No matching opt-outs' : 'No opt-outs recorded'}</div>
            <div className="empty-desc">
              {search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Opt-outs will appear here automatically when contacts reply STOP to a campaign.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Channel</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{o.phone}</span>
                    </td>
                    <td>
                      {o.campaignName ? (
                        <span className="td-primary" style={{ fontSize: 13 }}>{o.campaignName}</span>
                      ) : (
                        <span style={{ fontSize: 12.5, color: 'var(--c-text-4)', fontStyle: 'italic' }}>
                          {o.reason === 'Manual suppression' ? 'Manual' : 'Import'}
                        </span>
                      )}
                    </td>
                    <td>
                      {o.channel ? (
                        <ChannelBadge channel={o.channel} />
                      ) : (
                        <span style={{ color: 'var(--c-text-4)', fontSize: 12.5 }}>—</span>
                      )}
                    </td>
                    <td><ReasonPill reason={o.reason} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--c-text-4)' }}>
                      <div>{fmtDate(o.optedOutAt)}</div>
                      {o.status === 'resubscribed' && o.resubscribedAt && (
                        <div style={{ color: 'var(--c-green)', marginTop: 2 }}>
                          Re-subscribed {fmtDate(o.resubscribedAt)}
                        </div>
                      )}
                    </td>
                    <td><StatusPill status={o.status} /></td>
                    <td>
                      {o.status === 'active' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--c-green)', fontSize: 12.5 }}
                          onClick={() => onResubscribe(o)}
                          title="Remove from suppression list"
                        >
                          <RotateCcw size={12} /> Re-subscribe
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── View List Modal (enhanced) ──────────────────────────────────────────────

function ViewListModal({ list, optOutLog, campaigns, open, onClose, onUseCampaign, toast }) {
  const [innerTab, setInnerTab] = useState('overview')

  const listOptOuts = optOutLog.filter(o => o.contactListId === list?.id)
  const activeListOptOuts = listOptOuts.filter(o => o.status === 'active')
  const reachable = list ? Math.max(list.validContacts - list.optOuts, 0) : 0
  const campaignsUsed = campaigns.filter(c => c.contactListId === list?.id)

  if (!list) return null

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title={list.name}
        subtitle={list.description || 'Contact List'}
        onClose={onClose}
      />
      <ModalBody>
        {/* Inner tabs */}
        <div className="tab-bar" style={{ marginBottom: 20 }}>
          <button className={`tab-btn ${innerTab === 'overview' ? 'active' : ''}`} onClick={() => setInnerTab('overview')}>
            Overview
          </button>
          <button className={`tab-btn ${innerTab === 'optouts' ? 'active' : ''}`} onClick={() => setInnerTab('optouts')}>
            Opt-Outs
            {activeListOptOuts.length > 0 && (
              <span style={{ marginLeft: 5, background: innerTab === 'optouts' ? 'var(--c-accent-bg)' : '#FEF2F2', color: innerTab === 'optouts' ? 'var(--c-accent)' : '#B91C1C', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 600 }}>
                {listOptOuts.length}
              </span>
            )}
          </button>
        </div>

        {innerTab === 'overview' && (
          <div>
            {/* Funnel stats */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                Audience Funnel
              </div>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--c-border)' }}>
                {[
                  { label: 'Uploaded', val: list.totalContacts, color: 'var(--c-text)', bg: 'var(--c-surface-2)', note: 'Original CSV' },
                  { label: 'Invalid Removed', val: list.invalidContacts, color: 'var(--c-red)', bg: '#FEF2F2', note: 'Bad numbers' },
                  { label: 'Opt-Outs Suppressed', val: list.optOuts, color: '#D97706', bg: '#FFFBEB', note: 'On suppression list' },
                  { label: 'Reachable', val: reachable, color: 'var(--c-green)', bg: 'var(--c-green-bg)', note: 'Will receive sends' },
                ].map((s, i) => (
                  <div key={s.label} style={{ flex: 1, padding: '14px 16px', background: s.bg, borderLeft: i > 0 ? '1px solid var(--c-border)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{fmt(s.val)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-text-4)', marginTop: 1 }}>{s.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention note */}
            {list.optOuts > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)', marginBottom: 20 }}>
                <Info size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#92400E' }}>
                  <strong>{list.optOuts.toLocaleString()} contacts</strong> in this list are on the suppression list and will be excluded from sends.
                  The original list of <strong>{list.totalContacts.toLocaleString()}</strong> contacts is fully retained for reference.
                  To re-include a contact, go to the <strong>Opt-Outs tab</strong> and re-subscribe them.
                </div>
              </div>
            )}

            {/* Campaigns that used this list */}
            {campaignsUsed.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                  Used In Campaigns
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {campaignsUsed.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-text)' }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--c-text-4)', marginTop: 2 }}>
                          {c.totalRecipients.toLocaleString()} recipients
                          {c.optOuts > 0 && <span style={{ color: '#D97706', marginLeft: 8 }}> · {c.optOuts} opt-outs from this send</span>}
                        </div>
                      </div>
                      <ChannelBadge channel={c.channel} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Columns */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                Columns
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {list.columns?.map(col => (
                  <span key={col} style={{ padding: '3px 10px', background: 'var(--c-accent-bg)', color: 'var(--c-accent)', borderRadius: 'var(--r-full)', fontSize: 12.5, fontWeight: 500 }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample rows */}
            {list.sampleRows?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                  Sample Rows
                </div>
                <div className="table-wrap card" style={{ borderRadius: 'var(--r-md)' }}>
                  <table>
                    <thead>
                      <tr>{list.columns?.map(col => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {list.sampleRows.map((row, i) => (
                        <tr key={i}>
                          {list.columns?.map(col => <td key={col}>{row[col] || '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {innerTab === 'optouts' && (
          <div>
            {listOptOuts.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon"><Shield size={24} /></div>
                <div className="empty-title">No opt-outs from this list</div>
                <div className="empty-desc">None of the contacts in this list have opted out yet.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total Opt-Outs', val: listOptOuts.length, color: 'var(--c-red)' },
                    { label: 'Active Suppressions', val: activeListOptOuts.length, color: '#D97706' },
                    { label: 'Re-subscribed', val: listOptOuts.filter(o => o.status === 'resubscribed').length, color: 'var(--c-green)' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, padding: '12px', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--c-text-4)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="table-wrap card" style={{ borderRadius: 'var(--r-md)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Phone</th>
                        <th>Campaign</th>
                        <th>Reason</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listOptOuts.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{o.phone}</td>
                          <td style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{o.campaignName || '—'}</td>
                          <td><ReasonPill reason={o.reason} /></td>
                          <td style={{ fontSize: 12.5, color: 'var(--c-text-4)' }}>{fmtDate(o.optedOutAt)}</td>
                          <td><StatusPill status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--c-text-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={12} />
                  To re-subscribe a contact, use the <strong>Opt-Out Registry</strong> tab on the Contacts page.
                </div>
              </>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-secondary" onClick={() => toast('Downloading full list…', 'info')}>
          <Download size={14} /> Download Full List
        </button>
        <button className="btn btn-secondary" onClick={() => toast('Downloading reachable contacts only…', 'info')}>
          <Download size={14} /> Download Reachable
        </button>
        <button className="btn btn-primary" onClick={() => { onClose(); onUseCampaign() }}>
          Use in Campaign <ArrowRight size={14} />
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Contact List Card ────────────────────────────────────────────────────────

function ContactCard({ cl, onView, onDelete }) {
  const reachable = Math.max(cl.validContacts - cl.optOuts, 0)
  const suppressionPct = cl.validContacts > 0 ? ((cl.optOuts / cl.validContacts) * 100).toFixed(1) : 0
  const reachablePct = cl.validContacts > 0 ? (100 - suppressionPct) : 100

  return (
    <div className="contact-card" onClick={() => onView(cl)}>
      <div className="contact-card-header">
        <div className="contact-card-icon"><Users size={18} /></div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn btn-ghost btn-icon-sm"
            title="View details"
            onClick={e => { e.stopPropagation(); onView(cl) }}
          >
            <Eye size={14} />
          </button>
          <button
            className="btn btn-ghost btn-icon-sm"
            title="Delete"
            style={{ color: 'var(--c-red)' }}
            onClick={e => { e.stopPropagation(); onDelete(cl) }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="contact-card-name">{cl.name}</div>
      <div className="contact-card-meta">{cl.description || 'No description'}</div>
      <div className="contact-card-meta" style={{ marginTop: 4 }}>
        Last updated {fmtDate(cl.lastUpdated)}
      </div>

      {/* Reachable count — prominent */}
      <div style={{ margin: '14px 0 10px', padding: '12px 14px', background: 'var(--c-green-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-green)' }}>{reachable.toLocaleString()}</span>
          <span style={{ fontSize: 12.5, color: 'var(--c-green)', fontWeight: 500 }}>reachable</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--c-text-4)', marginTop: 2 }}>
          Will be included in next send
        </div>
      </div>

      {/* Funnel breakdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--c-text-4)', marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--c-text-3)', fontWeight: 500 }}>{cl.totalContacts.toLocaleString()} uploaded</span>
        <ArrowRight size={11} />
        <span style={{ color: 'var(--c-red)' }}>−{cl.invalidContacts.toLocaleString()} invalid</span>
        {cl.optOuts > 0 && (
          <>
            <ArrowRight size={11} />
            <span style={{ color: '#D97706' }}>−{cl.optOuts.toLocaleString()} suppressed</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {cl.optOuts > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', background: 'var(--c-border)' }}>
            <div style={{ width: `${reachablePct}%`, background: 'var(--c-green)', transition: 'width 300ms' }} />
            <div style={{ width: `${suppressionPct}%`, background: '#FDE68A' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, color: 'var(--c-text-4)' }}>
            <span style={{ color: 'var(--c-green)' }}>{reachablePct}% reachable</span>
            <span style={{ color: '#D97706' }}>{suppressionPct}% suppressed</span>
          </div>
        </div>
      )}

      {/* Suppression callout */}
      {cl.optOuts > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--r-sm)' }}>
          <PhoneOff size={12} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11.5, color: '#92400E' }}>
            <strong>{cl.optOuts.toLocaleString()}</strong> contacts suppressed (opt-outs). Original list of {cl.totalContacts.toLocaleString()} retained.
          </span>
        </div>
      )}

      {/* Invalid warning */}
      {cl.invalidContacts > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: 'var(--c-yellow-bg)', borderRadius: 'var(--r-sm)' }}>
          <AlertCircle size={12} style={{ color: 'var(--c-yellow)', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--c-yellow-text)' }}>
            {cl.invalidContacts.toLocaleString()} invalid entries excluded
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Add to Suppression Modal ────────────────────────────────────────────────

function AddSuppressionModal({ open, onClose, onAdd }) {
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('Manual suppression')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const reset = () => { setPhone(''); setReason('Manual suppression'); setErrors({}) }

  const handleClose = () => { reset(); onClose() }

  const handleAdd = async () => {
    const errs = {}
    if (!phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^\+\d[\d\s]{6,}$/.test(phone.trim())) errs.phone = 'Enter a valid international phone number (e.g. +256 701 234 567)'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    onAdd({ phone: phone.trim(), reason })
    reset()
    setSaving(false)
  }

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <ModalHeader
        title="Add to Suppression List"
        subtitle="This contact will be excluded from all future campaign sends."
        onClose={handleClose}
      />
      <ModalBody>
        <div className="form-group">
          <label className="form-label">Phone Number <span className="required">*</span></label>
          <input
            className={`input ${errors.phone ? 'error' : ''}`}
            placeholder="+256 701 234 567"
            value={phone}
            onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })) }}
            autoFocus
          />
          {errors.phone && <div className="form-error"><AlertCircle size={12} />{errors.phone}</div>}
          <div className="form-hint">Include country code (e.g. +256 for Uganda)</div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Reason</label>
          <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
            <option value="Manual suppression">Manual suppression</option>
            <option value="Replied STOP">Replied STOP</option>
            <option value="Carrier opt-out">Carrier opt-out</option>
            <option value="Imported suppression list">Imported from file</option>
          </select>
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" /> : <Shield size={14} />}
          {saving ? 'Adding…' : 'Add to Suppression'}
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Contacts() {
  const { contactLists, optOutLog, suppressionList, addContactList, deleteContactList, addOptOut, resubscribeContact, campaigns, toast } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [mainTab, setMainTab] = useState('lists') // 'lists' | 'optouts'
  const [viewList, setViewList] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [resubTarget, setResubTarget] = useState(null)
  const [resubbing, setResubbing] = useState(false)
  const [addSuppressionOpen, setAddSuppressionOpen] = useState(false)

  // New list form state
  const [nlForm, setNlForm] = useState({ name: '', description: '' })
  const [nlFile, setNlFile] = useState(null)
  const [nlParsed, setNlParsed] = useState(null)
  const [nlSubmitting, setNlSubmitting] = useState(false)
  const [nlErrors, setNlErrors] = useState({})

  const filtered = contactLists.filter(cl =>
    cl.name.toLowerCase().includes(search.toLowerCase()) ||
    (cl.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalReachable = contactLists.reduce((a, cl) => a + Math.max(cl.validContacts - cl.optOuts, 0), 0)
  const totalSuppressed = suppressionList.length

  const handleFile = (file) => {
    if (!file) return
    setNlFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(l => l.trim())
      const columns = lines[0]?.split(',').map(c => c.trim().replace(/"/g, '')) || []
      const total = Math.max(lines.length - 1, 0)
      const invalid = Math.ceil(total * 0.05)
      setNlParsed({ total, valid: total - invalid, invalid, columns })
    }
    reader.readAsText(file)
  }

  const handleNewList = async () => {
    const errs = {}
    if (!nlForm.name.trim()) errs.name = 'List name is required'
    if (!nlFile && !nlParsed) errs.file = 'Please upload a CSV file'
    if (Object.keys(errs).length) { setNlErrors(errs); return }

    setNlSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))

    const parsed = nlParsed || { total: 0, valid: 0, invalid: 0, columns: ['phone', 'first_name'] }
    // Count how many in the suppression list would be suppressed from this upload
    const estimatedOptOuts = Math.ceil(parsed.valid * 0.005) // realistic ~0.5% suppression rate for new lists
    addContactList({
      id: `cl_${Date.now()}`,
      name: nlForm.name,
      description: nlForm.description,
      totalContacts: parsed.total,
      validContacts: parsed.valid,
      invalidContacts: parsed.invalid,
      optOuts: estimatedOptOuts,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      columns: parsed.columns,
      sampleRows: [],
    })
    toast(`"${nlForm.name}" created — ${(parsed.valid - estimatedOptOuts).toLocaleString()} reachable contacts`, 'success', 'List Created')
    setNewListOpen(false)
    setNlForm({ name: '', description: '' })
    setNlFile(null)
    setNlParsed(null)
    setNlErrors({})
    setNlSubmitting(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await new Promise(r => setTimeout(r, 600))
    deleteContactList(deleteTarget.id)
    toast('Contact list deleted', 'success')
    setDeleteTarget(null)
    setDeleting(false)
  }

  const handleResubscribe = async () => {
    setResubbing(true)
    await new Promise(r => setTimeout(r, 500))
    resubscribeContact(resubTarget.id)
    toast(`${resubTarget.phone} re-subscribed and removed from suppression list`, 'success', 'Re-subscribed')
    setResubTarget(null)
    setResubbing(false)
  }

  const handleAddSuppression = ({ phone, reason }) => {
    addOptOut({
      id: `oo_${Date.now()}`,
      phone,
      contactListId: null,
      campaignId: null,
      campaignName: null,
      channel: null,
      reason,
      optedOutAt: new Date().toISOString(),
      status: 'active',
      resubscribedAt: null,
    })
    toast(`${phone} added to suppression list`, 'success', 'Suppressed')
    setAddSuppressionOpen(false)
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Manage your audience lists and track opt-outs.</p>
        </div>
        <div className="page-actions">
          {mainTab === 'lists' && (
            <button className="btn btn-primary" onClick={() => setNewListOpen(true)}>
              <Plus size={15} /> New List
            </button>
          )}
          {mainTab === 'optouts' && (
            <button className="btn btn-primary" onClick={() => setAddSuppressionOpen(true)}>
              <Plus size={15} /> Add to Suppression
            </button>
          )}
        </div>
      </div>

      {/* Main tab bar */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${mainTab === 'lists' ? 'active' : ''}`} onClick={() => setMainTab('lists')}>
          <Users size={14} /> Contact Lists
          <span style={{ marginLeft: 5, background: mainTab === 'lists' ? 'var(--c-accent-bg)' : 'var(--c-surface-2)', color: mainTab === 'lists' ? 'var(--c-accent)' : 'var(--c-text-4)', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 600 }}>
            {contactLists.length}
          </span>
        </button>
        <button className={`tab-btn ${mainTab === 'optouts' ? 'active' : ''}`} onClick={() => setMainTab('optouts')}>
          <PhoneOff size={14} /> Opt-Out Registry
          {totalSuppressed > 0 && (
            <span style={{ marginLeft: 5, background: mainTab === 'optouts' ? 'var(--c-accent-bg)' : '#FEF2F2', color: mainTab === 'optouts' ? 'var(--c-accent)' : '#B91C1C', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 600 }}>
              {totalSuppressed}
            </span>
          )}
        </button>
      </div>

      {/* ── Lists tab ── */}
      {mainTab === 'lists' && (
        <>
          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Lists</span>
                <div className="stat-card-icon" style={{ background: 'var(--c-accent-bg)' }}>
                  <Users size={18} style={{ color: 'var(--c-accent)' }} />
                </div>
              </div>
              <div className="stat-card-value">{contactLists.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Reachable</span>
                <div className="stat-card-icon" style={{ background: 'var(--c-green-bg)' }}>
                  <CheckCircle size={18} style={{ color: 'var(--c-green)' }} />
                </div>
              </div>
              <div className="stat-card-value">{totalReachable.toLocaleString()}</div>
              <div className="stat-card-change">After invalid &amp; opt-out removal</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Active Suppressions</span>
                <div className="stat-card-icon" style={{ background: '#FEF2F2' }}>
                  <PhoneOff size={18} style={{ color: '#B91C1C' }} />
                </div>
              </div>
              <div className="stat-card-value">{totalSuppressed}</div>
              <div className="stat-card-change" style={{ cursor: 'pointer', color: 'var(--c-accent)', textDecoration: 'underline' }} onClick={() => setMainTab('optouts')}>
                View opt-out registry →
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="input-with-icon" style={{ maxWidth: 320, marginBottom: 20 }}>
            <div className="input-icon"><Search size={15} /></div>
            <input className="input" placeholder="Search lists…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon"><Users size={28} /></div>
                <div className="empty-title">{search ? 'No lists match your search' : 'No contact lists yet'}</div>
                <div className="empty-desc">
                  {search ? 'Try a different search term.' : 'Upload a CSV file to create your first audience list.'}
                </div>
                {!search && (
                  <button className="btn btn-primary" onClick={() => setNewListOpen(true)}>
                    <Plus size={15} /> Create List
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="contact-cards">
              {filtered.map(cl => (
                <ContactCard key={cl.id} cl={cl} onView={setViewList} onDelete={setDeleteTarget} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Opt-Out Registry tab ── */}
      {mainTab === 'optouts' && (
        <OptOutRegistry
          optOutLog={optOutLog}
          suppressionList={suppressionList}
          onResubscribe={setResubTarget}
          onAddSuppression={() => setAddSuppressionOpen(true)}
        />
      )}

      {/* ── Modals ── */}

      <ViewListModal
        list={viewList}
        optOutLog={optOutLog}
        campaigns={campaigns}
        open={!!viewList}
        onClose={() => setViewList(null)}
        onUseCampaign={() => navigate('/campaigns/new')}
        toast={toast}
      />

      {/* New list modal */}
      <Modal open={newListOpen} onClose={() => setNewListOpen(false)} size="md">
        <ModalHeader title="Create Contact List" subtitle="Upload a CSV file to create a new audience list" onClose={() => setNewListOpen(false)} />
        <ModalBody>
          <div className="form-group">
            <label className="form-label">List Name <span className="required">*</span></label>
            <input className={`input ${nlErrors.name ? 'error' : ''}`} placeholder="e.g. Premium Customers" value={nlForm.name} onChange={e => setNlForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            {nlErrors.name && <div className="form-error"><AlertCircle size={12} />{nlErrors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="input" placeholder="What is this list for?" value={nlForm.description} onChange={e => setNlForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Upload CSV <span className="required">*</span></label>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {!nlFile ? (
              <div className="upload-zone" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}>
                <div className="upload-zone-icon"><Upload size={20} /></div>
                <div className="upload-zone-title">Click to upload CSV</div>
                <div className="upload-zone-hint">First row should contain column headers including "phone"</div>
              </div>
            ) : (
              <div style={{ padding: 14, border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', background: 'var(--c-surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} style={{ color: 'var(--c-text-3)' }} />{nlFile.name}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setNlFile(null); setNlParsed(null); fileRef.current.value = '' }}>
                    <X size={14} /> Remove
                  </button>
                </div>
                {nlParsed && (
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div><div style={{ fontWeight: 700 }}>{nlParsed.total}</div><div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>Total</div></div>
                    <div><div style={{ fontWeight: 700, color: 'var(--c-green)' }}>{nlParsed.valid}</div><div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>Valid</div></div>
                    <div><div style={{ fontWeight: 700, color: 'var(--c-red)' }}>{nlParsed.invalid}</div><div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>Invalid</div></div>
                  </div>
                )}
              </div>
            )}
            {nlErrors.file && <div className="form-error mt-2"><AlertCircle size={12} />{nlErrors.file}</div>}
          </div>
          <div className="alert alert-info">
            <Info size={14} />
            <div>
              The system will automatically validate phone numbers, deduplicate contacts, and cross-check against the suppression list.
              The original uploaded list is always retained — you can see the full breakdown in the list details.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-secondary" onClick={() => setNewListOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleNewList} disabled={nlSubmitting}>
            {nlSubmitting ? <span className="spinner spinner-sm" /> : <Plus size={14} />}
            {nlSubmitting ? 'Creating…' : 'Create List'}
          </button>
        </ModalFooter>
      </Modal>

      <AddSuppressionModal
        open={addSuppressionOpen}
        onClose={() => setAddSuppressionOpen(false)}
        onAdd={handleAddSuppression}
      />

      <ConfirmModal
        open={!!resubTarget}
        onClose={() => setResubTarget(null)}
        onConfirm={handleResubscribe}
        loading={resubbing}
        title="Re-subscribe Contact"
        description={`Remove ${resubTarget?.phone} from the suppression list? This contact will be reachable in future campaigns.`}
        confirmLabel="Re-subscribe"
        confirmClass="btn btn-primary"
        icon="warning"
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Contact List"
        description={`Delete "${deleteTarget?.name}"? This won't affect campaigns that already used this list. Opt-out records linked to this list will be preserved in the registry.`}
        confirmLabel="Delete List"
      />
    </Layout>
  )
}
