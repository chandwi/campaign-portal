import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'arjun@acmestore.com', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email.trim()) { setError('Email is required'); return }
    if (!form.password.trim()) { setError('Password is required'); return }

    setLoading(true)
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800))
    login(form.email, form.password)
    navigate('/dashboard')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><Zap size={20} /></div>
          <span className="login-logo-name">CampaignPortal</span>
        </div>

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-sub">Sign in to manage your campaigns</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" style={{ fontSize: 12.5, color: 'var(--c-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 8, padding: '10px 16px', fontSize: 14 }}
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--c-surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-3)', marginBottom: 6 }}>Demo credentials</div>
          <div style={{ fontSize: 12.5, color: 'var(--c-text-2)' }}>
            Email: <code style={{ background: 'var(--c-border)', padding: '1px 5px', borderRadius: 4 }}>arjun@acmestore.com</code>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--c-text-2)', marginTop: 4 }}>
            Password: <code style={{ background: 'var(--c-border)', padding: '1px 5px', borderRadius: 4 }}>any value</code>
          </div>
        </div>
      </div>
    </div>
  )
}
