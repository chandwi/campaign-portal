import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Trash2, BarChart2, Send, CheckCircle,
  XCircle, UserMinus, MousePointer, Clock, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Layout } from '../components/Layout'
import { Badge, ChannelBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return (n || 0).toString()
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CampaignDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { campaigns, templates, contactLists, deleteCampaign, toast } = useApp()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const campaign = campaigns.find(c => c.id === id)
  if (!campaign) {
    return (
      <Layout title="Campaign Not Found" breadcrumb="Campaigns">
        <div className="empty-state">
          <div className="empty-icon"><BarChart2 /></div>
          <div className="empty-title">Campaign not found</div>
          <div className="empty-desc">This campaign may have been deleted or doesn't exist.</div>
          <button className="btn btn-primary" onClick={() => navigate('/campaigns')}>Back to Campaigns</button>
        </div>
      </Layout>
    )
  }

  const template = templates.find(t => t.id === campaign.templateId)
  const contactList = contactLists.find(cl => cl.id === campaign.contactListId)

  const deliveryRate = campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : 0
  const failRate = campaign.sent > 0 ? ((campaign.failed / campaign.sent) * 100).toFixed(1) : 0
  const ctaRate = campaign.delivered > 0 ? ((campaign.ctaClicks / campaign.delivered) * 100).toFixed(1) : 0

  const handleDelete = async () => {
    setDeleting(true)
    await new Promise(r => setTimeout(r, 600))
    deleteCampaign(campaign.id)
    toast('Campaign deleted', 'success')
    navigate('/campaigns')
  }

  const handleDownloadReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Campaign Name', campaign.name],
      ['Status', campaign.status],
      ['Channel', campaign.channel],
      ['Total Recipients', campaign.totalRecipients],
      ['Sent', campaign.sent],
      ['Delivered', campaign.delivered],
      ['Failed', campaign.failed],
      ['Opt-Outs', campaign.optOuts],
      ['CTA Clicks', campaign.ctaClicks],
      ['Delivery Rate', `${deliveryRate}%`],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.name.replace(/\s+/g, '_')}_report.csv`
    a.click()
    toast('Report downloaded', 'success')
  }

  const chartData = campaign.dailyStats?.length > 0
    ? campaign.dailyStats
    : [{ date: 'Day 1', delivered: campaign.delivered, failed: campaign.failed }]

  const dotColor = { default: 'var(--c-accent)', green: 'var(--c-green)', red: 'var(--c-red)', gray: 'var(--c-text-4)' }

  return (
    <Layout title={campaign.name} breadcrumb="Campaigns">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/campaigns')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="page-title">{campaign.name}</h1>
              <Badge status={campaign.status} />
              <ChannelBadge channel={campaign.channel} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-text-4)', marginTop: 4 }}>
              Created {fmtDate(campaign.createdAt)}
              {campaign.sentAt && ` · Sent ${fmtDate(campaign.sentAt)}`}
              {campaign.scheduledAt && ` · Scheduled for ${fmtDate(campaign.scheduledAt)}`}
            </div>
          </div>
        </div>
        <div className="page-actions">
          {campaign.status === 'completed' && (
            <button className="btn btn-secondary" onClick={handleDownloadReport}>
              <Download size={15} /> Download Report
            </button>
          )}
          <button className="btn btn-ghost" style={{ color: 'var(--c-red)' }} onClick={() => setDeleteOpen(true)}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* Processing notice */}
      {campaign.status === 'processing' && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span>
            Campaign is currently sending. {fmt(campaign.sent)} of {fmt(campaign.totalRecipients)} messages dispatched.
            Full metrics will be available within 24 hours.
          </span>
        </div>
      )}
      {campaign.status === 'queued' && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <Clock size={14} />
          <span>Campaign is queued {campaign.scheduledAt ? `for ${fmtDate(campaign.scheduledAt)}` : 'and will start shortly'}.</span>
        </div>
      )}

      {/* Metrics */}
      <div className="metrics-grid">
        {[
          { icon: Send, label: 'Sent', value: fmt(campaign.sent), sub: `of ${fmt(campaign.totalRecipients)} recipients`, color: 'var(--c-accent)' },
          { icon: CheckCircle, label: 'Delivered', value: fmt(campaign.delivered), sub: `${deliveryRate}% delivery rate`, color: 'var(--c-green)' },
          { icon: XCircle, label: 'Failed', value: fmt(campaign.failed), sub: `${failRate}% failure rate`, color: 'var(--c-red)' },
          { icon: UserMinus, label: 'Opt-Outs', value: campaign.optOuts, sub: 'added to suppression list', color: 'var(--c-yellow)' },
          { icon: MousePointer, label: 'CTA Clicks', value: fmt(campaign.ctaClicks), sub: `${ctaRate}% click rate`, color: 'var(--c-purple)' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div className="metric-value" style={{ color }}>{value}</div>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Delivery rate bar */}
      {campaign.sent > 0 && (
        <div className="card card-p" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>Overall Delivery Rate</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--c-green)' }}>{deliveryRate}%</span>
          </div>
          <div className="progress-bar progress-lg">
            <div className="progress-fill" style={{
              width: `${deliveryRate}%`,
              background: `linear-gradient(90deg, var(--c-green), #34D399)`
            }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            {[
              { label: 'Delivered', pct: deliveryRate, color: 'var(--c-green)' },
              { label: 'Failed', pct: failRate, color: 'var(--c-red)' },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>{label} ({pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="two-col">
        {/* Chart */}
        {campaign.status === 'completed' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Delivery Breakdown</span>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="delivered" name="Delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Campaign details */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Campaign Info</span>
          </div>
          <div className="card-body">
            {[
              ['Template', template?.displayName || '—'],
              ['Template Status', template?.status ? <Badge status={template.status} /> : '—'],
              ['Contact List', contactList?.name || '—'],
              ['Scheduled At', campaign.scheduledAt ? fmtDate(campaign.scheduledAt) : '—'],
              ['Copy to Me', campaign.sendCopyToMe ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--c-border-light)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--c-text-3)' }}>{k}</span>
                <span style={{ fontWeight: 500, color: 'var(--c-text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {campaign.timeline?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Activity Timeline</span>
          </div>
          <div className="card-body">
            <div className="timeline">
              {campaign.timeline.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot-col">
                    <div className={`timeline-dot ${item.type || 'default'}`} />
                    {i < campaign.timeline.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{item.event}</div>
                    <div className="timeline-time">{fmtDate(item.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Campaign"
        description={`Delete "${campaign.name}"? All campaign data and reports will be permanently removed.`}
        confirmLabel="Delete Campaign"
      />
    </Layout>
  )
}
