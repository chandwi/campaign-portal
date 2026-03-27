import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, Send, CheckCircle, TrendingUp, Plus, ArrowRight,
  Clock, Users
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, LabelList
} from 'recharts'
import { Layout } from '../components/Layout'
import { Badge, ChannelBadge } from '../components/ui/Badge'
import { useApp } from '../context/AppContext'
import { DASHBOARD_CHART_DATA } from '../data/mockData'

// ─── Channel Performance Helpers ─────────────────────────────────────────────

const CHANNEL_META = {
  email:    { label: 'Email',    dot: '#8B5CF6' },
  whatsapp: { label: 'WhatsApp', dot: '#25D366' },
  sms:      { label: 'SMS',      dot: '#3B82F6' },
}

function getRateColor(rate) {
  if (rate >= 15) return '#10B981'
  if (rate >= 5)  return '#F59E0B'
  return '#EF4444'
}

function getRateLabel(rate) {
  if (rate === 0) return null
  if (rate >= 15) return 'Excellent'
  if (rate >= 5)  return 'Good'
  return 'Needs Work'
}

// Custom tooltip for the horizontal bar chart
function EngagementTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, rate } = payload[0].payload
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>{name}</div>
      <div style={{ color: '#6B7280' }}>Engagement Rate: <strong style={{ color: getRateColor(rate) }}>{rate.toFixed(1)}%</strong></div>
    </div>
  )
}

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const { user, campaigns, templates } = useApp()
  const navigate = useNavigate()

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0)
  const totalDelivered = campaigns.reduce((a, c) => a + c.delivered, 0)
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0
  const activeCampaigns = campaigns.filter(c => c.status === 'processing' || c.status === 'queued').length
  const pendingTemplates = templates.filter(t => t.status === 'pending').length

  const recentCampaigns = [...campaigns]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  // ── Channel performance ──
  const channelStats = ['email', 'whatsapp', 'sms'].map(ch => {
    const chs = campaigns.filter(c => c.channel === ch)
    const volume  = chs.reduce((a, c) => a + (c.sent || 0), 0)
    const engaged = chs.reduce((a, c) => a + (c.ctaClicks || 0), 0)
    const rate    = volume > 0 ? parseFloat(((engaged / volume) * 100).toFixed(1)) : 0
    return { ch, label: CHANNEL_META[ch].label, dot: CHANNEL_META[ch].dot, volume, engaged, rate, hasData: volume > 0 }
  })

  const engagementBarData = channelStats.map(s => ({ name: s.label, rate: s.rate }))

  const statusBreakdown = [
    { name: 'Completed', value: campaigns.filter(c => c.status === 'completed').length, color: '#10B981' },
    { name: 'Processing', value: campaigns.filter(c => c.status === 'processing').length, color: '#3B82F6' },
    { name: 'Queued', value: campaigns.filter(c => c.status === 'queued').length, color: '#8B5CF6' },
    { name: 'Draft', value: campaigns.filter(c => c.status === 'draft').length, color: '#9CA3AF' },
  ]

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening with your campaigns today.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/campaigns/new')}>
            <Plus size={15} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Campaigns</span>
            <div className="stat-card-icon" style={{ background: 'var(--c-accent-bg)' }}>
              <Megaphone size={18} style={{ color: 'var(--c-accent)' }} />
            </div>
          </div>
          <div className="stat-card-value">{campaigns.length}</div>
          <div className="stat-card-change"><span className="pos">↑ 2</span> this week</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Messages Sent</span>
            <div className="stat-card-icon" style={{ background: 'var(--c-blue-bg)' }}>
              <Send size={18} style={{ color: 'var(--c-blue)' }} />
            </div>
          </div>
          <div className="stat-card-value">{fmt(totalSent)}</div>
          <div className="stat-card-change"><span className="pos">↑ 12%</span> vs last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Delivery Rate</span>
            <div className="stat-card-icon" style={{ background: 'var(--c-green-bg)' }}>
              <CheckCircle size={18} style={{ color: 'var(--c-green)' }} />
            </div>
          </div>
          <div className="stat-card-value">{deliveryRate}%</div>
          <div className="stat-card-change"><span className="pos">↑ 1.2%</span> improvement</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Now</span>
            <div className="stat-card-icon" style={{ background: 'var(--c-yellow-bg)' }}>
              <TrendingUp size={18} style={{ color: 'var(--c-yellow)' }} />
            </div>
          </div>
          <div className="stat-card-value">{activeCampaigns}</div>
          <div className="stat-card-change" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeCampaigns > 0 ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: 'var(--c-yellow)' }} /> Sending in progress</>
            ) : 'No active campaigns'}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {pendingTemplates > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <Clock size={16} />
          <span>
            <strong>{pendingTemplates} template{pendingTemplates > 1 ? 's' : ''}</strong> pending Meta approval.
            Campaigns using them cannot send until approved.{' '}
            <button
              onClick={() => navigate('/templates')}
              style={{ color: 'var(--c-yellow-text)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View templates →
            </button>
          </span>
        </div>
      )}

      {/* Charts */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Messages Overview</span>
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>Last 30 days</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DASHBOARD_CHART_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke="#4F46E5" strokeWidth={2} fill="url(#sentGrad)" dot={false} />
                  <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#10B981" strokeWidth={2} fill="url(#delivGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Campaign Status</span>
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>All time</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="value" name="Campaigns" radius={[4, 4, 0, 0]}>
                    {statusBreakdown.map((entry, i) => (
                      <rect key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Channel Performance ────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.2px' }}>Channel Performance</h2>
        </div>

        {/* 3 channel stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
          {channelStats.map(s => (
            <div key={s.ch} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '16px 18px', boxShadow: 'var(--sh-xs)' }}>
              {/* Channel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.hasData ? s.dot : '#D1D5DB', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)' }}>{s.label}</span>
                </div>
                {!s.hasData && (
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--c-text-4)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '2px 8px' }}>
                    No Data
                  </span>
                )}
                {s.hasData && getRateLabel(s.rate) && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: getRateColor(s.rate), background: s.rate >= 15 ? 'var(--c-green-bg)' : s.rate >= 5 ? 'var(--c-yellow-bg)' : 'var(--c-red-bg)', borderRadius: 'var(--r-sm)', padding: '2px 8px' }}>
                    {getRateLabel(s.rate)}
                  </span>
                )}
              </div>

              {/* Stats rows */}
              {[
                { label: 'Volume',          val: s.volume.toLocaleString(),        bold: false },
                { label: 'Engaged',         val: s.engaged.toLocaleString(),       bold: false },
                { label: 'Engagement Rate', val: `${s.rate.toFixed(1)}%`,          bold: true  },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--c-border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--c-text-3)' }}>{row.label}:</span>
                  <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.bold && s.hasData ? getRateColor(s.rate) : 'var(--c-text)' }}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Engagement Rate Comparison chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">Engagement Rate Comparison</span>
              <div style={{ fontSize: 12.5, color: 'var(--c-accent)', marginTop: 2, fontWeight: 400 }}>
                Compare performance across channels — higher is better
              </div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={engagementBarData}
                  margin={{ top: 5, right: 40, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v.toFixed(1)}%`}
                    label={{ value: 'Engagement Rate (%)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#6B7280' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={68}
                  />
                  <Tooltip content={<EngagementTooltip />} />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {engagementBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.rate === 0 ? '#E5E7EB' : getRateColor(entry.rate)} />
                    ))}
                    <LabelList
                      dataKey="rate"
                      position="right"
                      formatter={v => v > 0 ? `${v.toFixed(1)}%` : ''}
                      style={{ fontSize: 11.5, fontWeight: 600, fill: '#6B7280' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 12, borderTop: '1px solid var(--c-border-light)', marginTop: 4, flexWrap: 'wrap' }}>
              {[
                { color: '#10B981', label: 'Excellent (≥15%)' },
                { color: '#F59E0B', label: 'Good (5-15%)' },
                { color: '#EF4444', label: 'Needs Work (<5%)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--c-text-3)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Campaigns</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/campaigns')}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Delivery</th>
                <th>Sent At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map(c => {
                const dr = c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(0) : null
                return (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/campaigns/${c.id}`)}>
                    <td className="td-primary">{c.name}</td>
                    <td><ChannelBadge channel={c.channel} /></td>
                    <td><Badge status={c.status} /></td>
                    <td>{c.totalRecipients > 0 ? fmt(c.totalRecipients) : '—'}</td>
                    <td>
                      {dr !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar progress-sm" style={{ width: 64 }}>
                            <div className="progress-fill" style={{ width: `${dr}%`, background: parseInt(dr) >= 90 ? 'var(--c-green)' : parseInt(dr) >= 70 ? 'var(--c-yellow)' : 'var(--c-red)' }} />
                          </div>
                          <span style={{ fontSize: 12.5, color: 'var(--c-text-3)' }}>{dr}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--c-text-4)' }}>{fmtDate(c.sentAt || c.scheduledAt)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`) }}>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
