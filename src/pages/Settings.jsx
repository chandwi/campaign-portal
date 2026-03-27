import React, { useState } from 'react'
import {
  User, Key, Bell, Shield, Trash2, Eye, EyeOff,
  CheckCircle, AlertCircle, Save, LogOut
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { ConfirmModal } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'integration', label: 'WhatsApp Integration', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
]

function ProfileSection({ user, toast }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, company: user.company })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    toast('Profile updated successfully', 'success')
  }

  return (
    <div>
      <div className="settings-section-title">Profile</div>
      <div className="settings-section-desc">Manage your personal details and organization info.</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'var(--c-surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
        <div style={{ width: 56, height: 56, background: 'var(--c-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>
          {user.avatar}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
          <div style={{ color: 'var(--c-text-3)', fontSize: 13 }}>{user.email}</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
          Change Avatar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Company</label>
          <input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <input className="input" value={user.role} disabled />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? <span className="spinner spinner-sm" /> : <Save size={14} />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

function IntegrationSection({ user, toast }) {
  const [showToken, setShowToken] = useState(false)
  const [form, setForm] = useState({ wabaId: user.wabaId, phoneNumberId: user.phoneNumberId, token: '••••••••••••••••••••••••' })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    await new Promise(r => setTimeout(r, 1500))
    setTesting(false)
    setTestResult({ ok: true, message: 'Connection successful! Your WhatsApp Business Account is verified.' })
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    toast('Integration settings saved', 'success')
  }

  return (
    <div>
      <div className="settings-section-title">WhatsApp Integration</div>
      <div className="settings-section-desc">Configure your Meta WhatsApp Business API credentials.</div>

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <AlertCircle size={14} />
        <div>
          Find your credentials in the <strong>Meta Business Suite → WhatsApp → API Setup</strong>.
          Keep your token secure — never share it publicly.
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">WhatsApp Business Account ID (WABA ID)</label>
        <input className="input" value={form.wabaId} onChange={e => setForm(p => ({ ...p, wabaId: e.target.value }))} placeholder="123456789012345" />
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number ID</label>
        <input className="input" value={form.phoneNumberId} onChange={e => setForm(p => ({ ...p, phoneNumberId: e.target.value }))} placeholder="987654321098765" />
      </div>
      <div className="form-group">
        <label className="form-label">Access Token</label>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            type={showToken ? 'text' : 'password'}
            value={form.token}
            onChange={e => setForm(p => ({ ...p, token: e.target.value }))}
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowToken(p => !p)}
          >
            {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="form-hint">Token is stored encrypted. Rotate every 60 days for security.</div>
      </div>

      {testResult && (
        <div className={`alert ${testResult.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
          {testResult.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {testResult.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={handleTest} disabled={testing}>
          {testing ? <span className="spinner spinner-sm" /> : null}
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Credentials'}
        </button>
      </div>
    </div>
  )
}

function NotificationsSection({ toast }) {
  const [prefs, setPrefs] = useState({
    campaignLaunched: true,
    campaignCompleted: true,
    campaignFailed: true,
    templateApproved: true,
    templateRejected: true,
    weeklyReport: false,
    emailNotifs: true,
  })

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const notifs = [
    { key: 'campaignLaunched', label: 'Campaign launched', desc: 'When a campaign starts sending' },
    { key: 'campaignCompleted', label: 'Campaign completed', desc: 'When all messages are dispatched' },
    { key: 'campaignFailed', label: 'Campaign failed', desc: 'When a campaign encounters errors' },
    { key: 'templateApproved', label: 'Template approved', desc: 'When Meta approves a template' },
    { key: 'templateRejected', label: 'Template rejected', desc: 'When Meta rejects a template' },
    { key: 'weeklyReport', label: 'Weekly summary', desc: 'Weekly campaign performance digest' },
  ]

  return (
    <div>
      <div className="settings-section-title">Notifications</div>
      <div className="settings-section-desc">Choose which events trigger notifications.</div>

      <div className="form-group" style={{ marginBottom: 20 }}>
        <div className="toggle-wrap">
          <button className={`toggle ${prefs.emailNotifs ? 'on' : ''}`} onClick={() => toggle('emailNotifs')} />
          <div>
            <div className="toggle-label">Email Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-4)', marginTop: 2 }}>Receive notifications via email</div>
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
        {notifs.map((n, i) => (
          <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < notifs.length - 1 ? '1px solid var(--c-border-light)' : 'none' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--c-text)' }}>{n.label}</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-4)', marginTop: 2 }}>{n.desc}</div>
            </div>
            <button className={`toggle ${prefs[n.key] ? 'on' : ''}`} onClick={() => toggle(n.key)} />
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast('Notification preferences saved', 'success')}>
        <Save size={14} /> Save Preferences
      </button>
    </div>
  )
}

function SecuritySection({ toast }) {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = async () => {
    const errs = {}
    if (!form.current) errs.current = 'Current password required'
    if (form.newPass.length < 8) errs.newPass = 'Minimum 8 characters'
    if (form.newPass !== form.confirm) errs.confirm = "Passwords don't match"
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    setForm({ current: '', newPass: '', confirm: '' })
    toast('Password changed successfully', 'success')
  }

  return (
    <div>
      <div className="settings-section-title">Security</div>
      <div className="settings-section-desc">Update your password and security settings.</div>

      <div style={{ maxWidth: 400 }}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className={`input ${errors.current ? 'error' : ''}`} type="password" value={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.value }))} />
          {errors.current && <div className="form-error"><AlertCircle size={12} />{errors.current}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className={`input ${errors.newPass ? 'error' : ''}`} type="password" value={form.newPass} onChange={e => setForm(p => ({ ...p, newPass: e.target.value }))} />
          {errors.newPass && <div className="form-error"><AlertCircle size={12} />{errors.newPass}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className={`input ${errors.confirm ? 'error' : ''}`} type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
          {errors.confirm && <div className="form-error"><AlertCircle size={12} />{errors.confirm}</div>}
        </div>
        <button className="btn btn-primary" onClick={handleChange} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" /> : <Shield size={14} />}
          {saving ? 'Changing…' : 'Change Password'}
        </button>
      </div>

      <hr className="divider" />

      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Active Sessions</div>
        <div style={{ fontSize: 13, color: 'var(--c-text-3)', marginBottom: 12 }}>You are currently signed in from 1 device.</div>
        <div style={{ padding: '12px 14px', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Chrome on Windows</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-4)' }}>Current session · Kampala, Uganda</div>
          </div>
          <span className="badge badge-green badge-sm"><span className="badge-dot" />Active</span>
        </div>
      </div>
    </div>
  )
}

function DangerSection({ logout, toast }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await new Promise(r => setTimeout(r, 1000))
    toast('Account deletion request submitted', 'info')
    setDeleting(false)
    setDeleteOpen(false)
  }

  return (
    <div>
      <div className="settings-section-title" style={{ color: 'var(--c-red)' }}>Danger Zone</div>
      <div className="settings-section-desc">Irreversible and destructive actions.</div>

      <div style={{ border: '1px solid var(--c-red)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FECACA' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--c-text)' }}>Sign Out</div>
            <div style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginTop: 2 }}>Sign out of this account on this device.</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--c-red)' }}>Delete Account</div>
            <div style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginTop: 2 }}>
              Permanently delete your account and all data. This cannot be undone.
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Account"
        description="This will permanently delete your account, all campaigns, templates, and contact lists. This action is irreversible."
        confirmLabel="Delete My Account"
      />
    </div>
  )
}

export default function Settings() {
  const { user, logout, toast } = useApp()
  const [section, setSection] = useState('profile')

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, integrations, and preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <nav className="settings-nav">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={`settings-nav-item ${section === id ? 'active' : ''} ${id === 'danger' ? 'danger-item' : ''}`}
              style={id === 'danger' ? { color: section === id ? 'var(--c-red)' : 'var(--c-red)', opacity: 0.8 } : {}}
              onClick={() => setSection(id)}
            >
              <Icon size={16} />
              {label}
            </div>
          ))}
        </nav>

        <div className="card card-p">
          {section === 'profile' && <ProfileSection user={user} toast={toast} />}
          {section === 'integration' && <IntegrationSection user={user} toast={toast} />}
          {section === 'notifications' && <NotificationsSection toast={toast} />}
          {section === 'security' && <SecuritySection toast={toast} />}
          {section === 'danger' && <DangerSection logout={logout} toast={toast} />}
        </div>
      </div>
    </Layout>
  )
}
