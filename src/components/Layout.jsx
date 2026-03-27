import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Megaphone, FileText, Users, BarChart2,
  Settings, LogOut, Bell, Plus, ChevronDown, Zap
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function Sidebar() {
  const { user, logout, campaigns } = useApp()
  const navigate = useNavigate()

  const activeCampaigns = campaigns.filter(c => c.status === 'processing' || c.status === 'queued').length

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={16} />
        </div>
        <span className="sidebar-logo-text">CampaignPortal</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
              {label === 'Campaigns' && activeCampaigns > 0 && (
                <span className="badge-count">{activeCampaigns}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="nav-section" style={{ marginTop: 16 }}>
          <div className="nav-label">Quick Actions</div>
          <div className="nav-item" onClick={() => navigate('/campaigns/new')}>
            <Plus size={16} />
            New Campaign
          </div>
          <div className="nav-item" onClick={() => navigate('/templates/new')}>
            <Plus size={16} />
            New Template
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={() => navigate('/settings')}>
          <div className="user-avatar">{user?.avatar || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.company || 'Merchant'}</div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--c-text-4)', flexShrink: 0 }} />
        </div>
        <div
          className="nav-item"
          style={{ marginTop: 4, color: 'var(--c-red)' }}
          onClick={logout}
        >
          <LogOut size={16} />
          Sign Out
        </div>
      </div>
    </aside>
  )
}

function Topbar({ title, breadcrumb }) {
  const { campaigns, toast } = useApp()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  const processingCampaigns = campaigns.filter(c => c.status === 'processing')

  return (
    <header className="topbar">
      <div className="topbar-left">
        {breadcrumb && (
          <>
            <span className="topbar-breadcrumb">{breadcrumb}</span>
            <span className="topbar-sep">/</span>
          </>
        )}
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        {processingCampaigns.length > 0 && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--c-blue-bg)', borderRadius: 'var(--r-full)', cursor: 'pointer' }}
            onClick={() => navigate('/campaigns')}
          >
            <span className="spinner spinner-sm" style={{ borderTopColor: 'var(--c-blue)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-blue-text)' }}>
              {processingCampaigns.length} sending…
            </span>
          </div>
        )}
        <button className="icon-btn" onClick={() => { toast('No new notifications', 'info') }}>
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}

export function Layout({ children, title, breadcrumb }) {
  const location = useLocation()

  const titleMap = {
    '/dashboard': 'Dashboard',
    '/campaigns': 'Campaigns',
    '/campaigns/new': 'New Campaign',
    '/templates': 'Templates',
    '/templates/new': 'New Template',
    '/contacts': 'Contacts',
    '/contacts/new': 'New Contact List',
    '/settings': 'Settings',
  }

  const resolvedTitle = title || titleMap[location.pathname] || 'Page'

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title={resolvedTitle} breadcrumb={breadcrumb} />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  )
}
