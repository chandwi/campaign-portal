import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, AlertCircle, Info, Plus, X, ExternalLink,
  Phone, Image, Video, FileText, ChevronUp, Lightbulb,
  Link2, MessageSquare, Trash2, Type, Upload, Check, Copy,
  GitBranch, Hash, Zap, AlertTriangle,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { useApp } from '../context/AppContext'

// ─── Utilities ───────────────────────────────────────────────────────────────

function extractPlaceholders(text) {
  const matches = [...(text || '').matchAll(/\{\{(\d+)\}\}/g)]
  return [...new Set(matches.map(m => m[0]))]
}

function genId() {
  return `btn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function getNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getIncompleteFields(form) {
  const missing = []
  if (!form.name.trim()) missing.push('Template name')
  if (!form.body.trim()) missing.push('Message body')
  const badBtns = form.buttons.filter(b => !b.text.trim() && b.kind !== 'qr_optout')
  if (badBtns.length > 0) missing.push('Button text for all buttons')
  const urlBtns = form.buttons.filter(b => b.kind === 'cta_url' && !b.url.trim())
  if (urlBtns.length > 0) missing.push('Website URL for all CTA buttons')
  return missing
}

function validateTemplate(form) {
  const errs = {}
  if (!form.displayName.trim()) errs.displayName = 'Display name is required'
  if (!form.name.trim()) errs.name = 'Template identifier is required'
  if (form.name && !/^[a-z0-9_]+$/.test(form.name)) errs.name = 'Only lowercase letters, numbers, underscores'
  if (!form.body.trim()) errs.body = 'Message body is required'

  const phs = extractPlaceholders(form.body)
  if (form.body.trim().startsWith('{{')) errs.body = 'Template cannot start with a variable placeholder'
  if (form.body.trim().endsWith('}}')) errs.body = 'Template cannot end with a variable placeholder'

  const nums = phs.map(ph => parseInt(ph.slice(2, -2)))
  const sorted = [...nums].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) { errs.body = 'Placeholders must be sequential starting from {{1}}'; break }
  }
  if (form.headerType === 'text' && form.headerText.length > 60) errs.headerText = 'Header text must be 60 characters or less'
  form.buttons.forEach((btn, i) => {
    if (!btn.text.trim() && btn.kind !== 'qr_optout') errs[`btn_text_${i}`] = 'Button text is required'
    if (btn.kind === 'cta_url' && !btn.url.trim()) errs[`btn_url_${i}`] = 'Website URL is required'
    if (btn.kind === 'cta_phone' && !btn.phone.trim()) errs[`btn_phone_${i}`] = 'Phone number is required'
  })
  return errs
}

function existingToForm(t) {
  if (!t) return null
  const buttons = []
  if (t.buttons && Array.isArray(t.buttons)) {
    return {
      displayName: t.displayName || '',
      name: t.name || '',
      category: t.category || 'Marketing',
      language: t.language || 'en',
      headerType: t.headerType || 'none',
      headerText: t.headerText || t.header || '',
      mediaType: t.mediaType || 'image',
      body: t.body || '',
      footer: t.footer || '',
      buttons: t.buttons,
    }
  }
  if (t.ctaButton) {
    if (t.ctaButton.type === 'url') buttons.push({ id: genId(), kind: 'cta_url', text: t.ctaButton.text || '', url: t.ctaButton.url || '', phone: '', value: '' })
    else if (t.ctaButton.type === 'phone') buttons.push({ id: genId(), kind: 'cta_phone', text: t.ctaButton.text || '', url: '', phone: t.ctaButton.url || '', value: '' })
    else if (t.ctaButton.type === 'quick_reply') buttons.push({ id: genId(), kind: 'qr_custom', text: t.ctaButton.text || '', url: '', phone: '', value: '' })
  }
  return {
    displayName: t.displayName || '',
    name: t.name || '',
    category: t.category || 'Marketing',
    language: t.language || 'en',
    headerType: t.header ? 'text' : 'none',
    headerText: t.header || '',
    mediaType: t.mediaType || 'image',
    body: t.body || '',
    footer: t.footer || '',
    buttons,
  }
}

const DEFAULT_FORM = {
  displayName: '',
  name: '',
  category: 'Marketing',
  language: 'en',
  headerType: 'none',
  headerText: '',
  mediaType: 'image',
  body: '',
  footer: '',
  buttons: [],
}

const STARTER_EXAMPLES = {
  Marketing: 'Hi {{1}}, exclusive offer just for you! Get {{2}} off your next order with code {{3}}. Valid till {{4}}. Shop now →',
  Utility: 'Hi {{1}}, your order {{2}} has been confirmed and will arrive by {{3}}. Track it here: {{4}}',
  Authentication: 'Your verification code is {{1}}. This code expires in {{2}} minutes. Do not share it with anyone.',
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({ id, icon, title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div id={id} className="card">
      <div
        className="card-header"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', color: 'var(--c-accent)', flexShrink: 0 }}>{icon}</span>
          <div>
            <div className="card-title" style={{ fontSize: 14 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--c-text-4)', marginTop: 1, fontWeight: 400 }}>{subtitle}</div>
            )}
          </div>
        </div>
        <ChevronUp
          size={16}
          style={{
            color: 'var(--c-text-4)',
            flexShrink: 0,
            transition: 'transform 200ms ease',
            transform: open ? 'none' : 'rotate(180deg)',
          }}
        />
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}

// ─── Sub Section (numbered item inside a section) ─────────────────────────────

function SubSection({ number, title, optional, description, children, noBorder }) {
  return (
    <div style={{
      padding: '18px 20px',
      borderTop: noBorder ? 'none' : '1px solid var(--c-border)',
    }}>
      <div style={{ marginBottom: description ? 4 : 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-4)', minWidth: 14 }}>{number}.</span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-text)' }}>{title}</span>
        {optional && (
          <span className="badge badge-gray badge-sm" style={{ fontWeight: 500 }}>Optional</span>
        )}
      </div>
      {description && (
        <p style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginBottom: 12, marginLeft: 20, lineHeight: 1.55 }}>
          {description}
        </p>
      )}
      <div style={{ marginLeft: 0 }}>{children}</div>
    </div>
  )
}

// ─── WA Preview ──────────────────────────────────────────────────────────────

function WAPreview({ form }) {
  const timeStr = getNow()

  const previewBody = (form.body || '')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/\{\{(\d+)\}\}/g, (_, n) => {
      const ex = ['John', 'SAVE20', '20%', 'Mar 31', 'ORD-4512']
      return `<strong>${ex[parseInt(n) - 1] || `value_${n}`}</strong>`
    })

  const hasContent = form.headerType !== 'none' || form.body || form.footer
  const hasButtons = form.buttons.length > 0

  const MediaPlaceholder = () => {
    const icons = {
      image: <Image size={28} color="#9ca3af" />,
      video: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: '#9ca3af' }}><Video size={26} /><span style={{ fontSize: 10, fontWeight: 500 }}>Video</span></div>,
      document: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: '#9ca3af' }}><FileText size={26} /><span style={{ fontSize: 10, fontWeight: 500 }}>Document</span></div>,
    }
    return (
      <div style={{ background: 'linear-gradient(135deg,#d1d5db,#e5e7eb)', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icons[form.mediaType] || icons.image}
      </div>
    )
  }

  const getBtnIcon = (kind) => {
    if (kind === 'cta_url' || kind === 'flow') return <ExternalLink size={12} />
    if (kind === 'cta_phone') return <Phone size={12} />
    if (kind === 'copy_code') return <Copy size={12} />
    return <MessageSquare size={12} />
  }

  return (
    <div>
      {/* Live preview header */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0891b2 100%)',
        borderRadius: '12px 12px 0 0',
        padding: '14px 18px',
        marginBottom: 0,
      }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Live preview</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>See how your template will appear on WhatsApp</div>
      </div>

      {/* Preview pane */}
      <div style={{
        border: '1px solid var(--c-border)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: '14px 14px 18px',
        background: 'var(--c-surface)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 10 }}>WhatsApp preview</div>

        {/* WA chat bg */}
        <div style={{
          background: '#e5ddd5',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b2a99a' fill-opacity='0.15'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          borderRadius: 10,
          padding: hasContent ? '16px 12px' : '30px 12px',
          minHeight: 200,
        }}>
          {!hasContent ? (
            <div style={{ color: '#b2a99a', fontSize: 12, textAlign: 'center', paddingTop: 30, fontStyle: 'italic' }}>
              Fill in the form to see your preview
            </div>
          ) : (
            <div style={{ maxWidth: '88%' }}>
              <div style={{ background: '#fff', borderRadius: '0 10px 10px 10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                {form.headerType === 'media' && <MediaPlaceholder />}
                <div style={{ padding: '8px 12px 6px' }}>
                  {form.headerType === 'text' && form.headerText && (
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 5 }}>{form.headerText}</div>
                  )}
                  {form.body ? (
                    <div style={{ fontSize: 13.5, color: '#303030', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: previewBody }} />
                  ) : (
                    <div style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>Message body will appear here</div>
                  )}
                  {form.footer && (
                    <div style={{ fontSize: 12, color: '#667781', marginTop: 5, paddingTop: 4, borderTop: '1px solid #f0f0f0' }}>{form.footer}</div>
                  )}
                  <div style={{ fontSize: 10.5, color: '#667781', textAlign: 'right', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                    {timeStr}
                    <svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 5L4 8L9 1" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 5L8 8L13 1" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
              {hasButtons && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                  {form.buttons.slice(0, 3).map(btn => (
                    <div key={btn.id} style={{ background: '#fff', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#029fdb', boxShadow: '0 1px 3px rgba(0,0,0,0.10)' }}>
                      {getBtnIcon(btn.kind)}
                      <span>{btn.text || (btn.kind === 'qr_optout' ? 'Stop promotions' : 'Button')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Header type toggle ───────────────────────────────────────────────────────

function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {options.map((opt, i) => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onChange(opt.val)}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: value === opt.val ? 600 : 500,
            color: value === opt.val ? 'var(--c-accent)' : 'var(--c-text-3)',
            background: value === opt.val ? 'var(--c-accent-bg)' : 'var(--c-surface)',
            border: `1px solid ${value === opt.val ? 'var(--c-accent)' : 'var(--c-border)'}`,
            borderLeft: i === 0 ? undefined : 'none',
            borderRadius: i === 0 ? '6px 0 0 6px' : i === options.length - 1 ? '0 6px 6px 0' : '0',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            position: 'relative',
            zIndex: value === opt.val ? 1 : 0,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Media type picker ────────────────────────────────────────────────────────

function MediaTypePicker({ value, onChange }) {
  const types = [
    { val: 'image', label: 'Image', icon: <Image size={20} />, accept: '.jpg,.jpeg,.png,.webp' },
    { val: 'video', label: 'Video', icon: <Video size={20} />, accept: '.mp4' },
    { val: 'document', label: 'Document', icon: <FileText size={20} />, accept: '.pdf' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {types.map(t => (
        <button
          key={t.val}
          type="button"
          onClick={() => onChange(t.val)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '14px 8px',
            border: `2px solid ${value === t.val ? 'var(--c-accent)' : 'var(--c-border)'}`,
            borderRadius: 'var(--r-md)',
            background: value === t.val ? 'var(--c-accent-bg)' : 'var(--c-surface)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            color: value === t.val ? 'var(--c-accent)' : 'var(--c-text-3)',
          }}
        >
          {t.icon}
          <span style={{ fontSize: 12.5, fontWeight: value === t.val ? 600 : 500, color: value === t.val ? 'var(--c-accent)' : 'var(--c-text-2)' }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Button Chip (add button row) ─────────────────────────────────────────────

const BUTTON_CHIPS = [
  { kind: 'qr_optout', label: 'Marketing opt-out', icon: <MessageSquare size={12} /> },
  { kind: 'qr_custom', label: 'Quick reply', icon: <MessageSquare size={12} /> },
  { kind: 'cta_url', label: 'Visit website', icon: <Link2 size={12} /> },
  { kind: 'flow', label: 'Flow', icon: <GitBranch size={12} /> },
  { kind: 'cta_phone', label: 'Call phone number', icon: <Phone size={12} /> },
  { kind: 'copy_code', label: 'Copy code', icon: <Hash size={12} /> },
]

// ─── Single Button Row ────────────────────────────────────────────────────────

function ButtonRow({ btn, index, errors, onUpdate, onDelete }) {
  const meta = {
    cta_url:   { label: 'Visit website',      color: 'var(--c-blue-text)',   bg: 'var(--c-blue-bg)' },
    cta_phone: { label: 'Call phone number',  color: 'var(--c-green-text)',  bg: 'var(--c-green-bg)' },
    qr_optout: { label: 'Marketing opt-out',  color: 'var(--c-orange-text)', bg: 'var(--c-orange-bg)' },
    qr_custom: { label: 'Quick reply',        color: 'var(--c-accent)',      bg: 'var(--c-accent-bg)' },
    flow:      { label: 'Flow',               color: 'var(--c-purple-text)', bg: 'var(--c-purple-bg)' },
    copy_code: { label: 'Copy code',          color: 'var(--c-text-3)',      bg: 'var(--c-surface-2)' },
  }[btn.kind] || { label: btn.kind, color: 'var(--c-text-3)', bg: 'var(--c-surface-2)' }

  const isOptout = btn.kind === 'qr_optout'
  const isCopyCode = btn.kind === 'copy_code'

  return (
    <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: meta.color, background: meta.bg, padding: '2px 8px', borderRadius: 'var(--r-full)', letterSpacing: '0.2px' }}>
          {meta.label}
        </span>
        <button className="btn btn-ghost btn-icon-sm" onClick={() => onDelete(btn.id)} title="Remove" style={{ color: 'var(--c-text-4)' }}>
          <Trash2 size={13} />
        </button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: (btn.kind === 'cta_url' || btn.kind === 'cta_phone') ? '1fr 1fr' : '1fr', gap: 10 }}>
          {/* Button text */}
          {!isOptout && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Button text <span className="required">*</span></label>
              <input
                className={`input ${errors[`btn_text_${index}`] ? 'error' : ''}`}
                value={btn.text}
                onChange={e => onUpdate(btn.id, { text: e.target.value })}
                placeholder={
                  btn.kind === 'cta_url' ? 'e.g. Visit website' :
                  btn.kind === 'cta_phone' ? 'e.g. Call us' :
                  btn.kind === 'flow' ? 'e.g. Get started' :
                  btn.kind === 'copy_code' ? 'e.g. Copy code' : 'Reply text'
                }
                maxLength={25}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className="form-hint">{btn.text.length}/25</span>
              </div>
              {errors[`btn_text_${index}`] && <div className="form-error"><AlertCircle size={12} />{errors[`btn_text_${index}`]}</div>}
            </div>
          )}

          {isOptout && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Button text</label>
              <input className="input" value="Stop promotions" disabled />
              <div className="form-hint">Fixed text required by Meta for marketing opt-out buttons.</div>
            </div>
          )}

          {/* URL */}
          {btn.kind === 'cta_url' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Website URL <span className="required">*</span></label>
              <input
                className={`input ${errors[`btn_url_${index}`] ? 'error' : ''}`}
                value={btn.url}
                onChange={e => onUpdate(btn.id, { url: e.target.value })}
                placeholder="https://yoursite.com"
              />
              {errors[`btn_url_${index}`] && <div className="form-error"><AlertCircle size={12} />{errors[`btn_url_${index}`]}</div>}
            </div>
          )}

          {/* Phone */}
          {btn.kind === 'cta_phone' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone number <span className="required">*</span></label>
              <input
                className={`input ${errors[`btn_phone_${index}`] ? 'error' : ''}`}
                value={btn.phone}
                onChange={e => onUpdate(btn.id, { phone: e.target.value })}
                placeholder="+256701234567"
              />
              {errors[`btn_phone_${index}`] && <div className="form-error"><AlertCircle size={12} />{errors[`btn_phone_${index}`]}</div>}
            </div>
          )}

          {/* Copy code value */}
          {isCopyCode && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Code <span className="required">*</span></label>
              <input
                className="input"
                value={btn.value || ''}
                onChange={e => onUpdate(btn.id, { value: e.target.value })}
                placeholder="e.g. SAVE20"
              />
            </div>
          )}

          {/* Flow ID */}
          {btn.kind === 'flow' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Flow ID</label>
              <input
                className="input"
                value={btn.value || ''}
                onChange={e => onUpdate(btn.id, { value: e.target.value })}
                placeholder="e.g. FLOW_123"
              />
              <div className="form-hint">Enter the Flow ID from your Meta Business Manager.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Validation Banner ────────────────────────────────────────────────────────

function ValidationBanner({ missing }) {
  if (missing.length === 0) return null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '12px 16px',
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      borderRadius: 'var(--r-md)',
      marginTop: 4,
    }}>
      <AlertTriangle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 13, color: '#92400E' }}>
        <span style={{ fontWeight: 600 }}>Complete these to save: </span>
        {missing.join(', ')}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TemplateEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { templates, addTemplate, updateTemplate, toast, user } = useApp()

  const existing = id ? templates.find(t => t.id === id) : null
  const isEdit = !!existing

  const [form, setForm] = useState(() => existingToForm(existing) || { ...DEFAULT_FORM })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [sampleFile, setSampleFile] = useState(null)

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    if (errors[key]) setErrors(p => { const e = { ...p }; delete e[key]; return e })
  }

  // Auto-generate identifier
  useEffect(() => {
    if (!isEdit && form.displayName) {
      onChange('name', form.displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
    }
  }, [form.displayName])

  const phs = extractPlaceholders(form.body)

  const addVariable = () => {
    onChange('body', form.body + `{{${phs.length + 1}}}`)
  }

  const addButton = (kind) => {
    if (form.buttons.length >= 3) return
    if (kind === 'qr_optout' && form.buttons.some(b => b.kind === 'qr_optout')) return
    const newBtn = { id: genId(), kind, text: kind === 'qr_optout' ? 'Stop promotions' : '', url: '', phone: '', value: '' }
    setForm(p => ({ ...p, buttons: [...p.buttons, newBtn] }))
  }

  const updateButton = (btnId, changes) => {
    setForm(p => ({ ...p, buttons: p.buttons.map(b => b.id === btnId ? { ...b, ...changes } : b) }))
  }

  const removeButton = (btnId) => {
    setForm(p => ({ ...p, buttons: p.buttons.filter(b => b.id !== btnId) }))
  }

  const handleSubmit = async () => {
    const errs = validateTemplate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTimeout(() => {
        document.querySelector('.input.error, [class*="form-error"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))

    const firstCTA = form.buttons.find(b => b.kind === 'cta_url' || b.kind === 'cta_phone')
    const ctaButton = firstCTA ? {
      type: firstCTA.kind === 'cta_url' ? 'url' : 'phone',
      text: firstCTA.text,
      url: firstCTA.kind === 'cta_url' ? firstCTA.url : firstCTA.phone,
    } : null

    const templateData = {
      id: existing?.id || `t_${Date.now()}`,
      displayName: form.displayName || form.name,
      name: form.name,
      category: form.category,
      language: form.language,
      headerType: form.headerType,
      headerText: form.headerType === 'text' ? form.headerText : '',
      mediaType: form.headerType === 'media' ? form.mediaType : null,
      header: form.headerType === 'text' ? form.headerText : null,
      body: form.body,
      footer: form.footer || null,
      buttons: form.buttons,
      ctaButton,
      status: 'pending',
      usageCount: existing?.usageCount || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      approvedAt: null,
      rejectionReason: null,
    }

    if (isEdit) {
      updateTemplate(templateData)
      toast('Template updated and resubmitted for Meta review', 'info', 'Resubmitted')
    } else {
      addTemplate(templateData)
      toast('Template submitted to Meta for review.', 'info', 'Submitted')
    }
    navigate('/templates')
  }

  const missingFields = getIncompleteFields(form)
  const hasOptout = form.buttons.some(b => b.kind === 'qr_optout')
  const isMarketing = form.category === 'Marketing'

  // Jump-to scroll
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Layout title={isEdit ? 'Edit Template' : 'New Template'} breadcrumb="Templates">
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/templates')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Template' : 'Create Template'}</h1>
            <p className="page-subtitle">Templates must be approved by Meta before they can be used in campaigns.</p>
          </div>
        </div>

        {isEdit && existing?.status === 'approved' && (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            <AlertCircle size={14} />
            Editing an approved template will resubmit it for Meta review. It will be unavailable for campaigns until re-approved.
          </div>
        )}

        {/* Tip banner */}
        <div style={{
          background: 'var(--c-blue-bg)',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          fontSize: 12.5,
          color: 'var(--c-blue-text)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Tip</strong> — Use <strong>Jump to</strong> to focus one section at a time.
            Skip header, footer, or extra buttons if you don't need them.
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 20,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-md)',
          padding: '10px 16px',
          flexWrap: 'wrap',
          gap: 4,
        }}>
          <span style={{ fontSize: 12, color: 'var(--c-text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: 8 }}>Jump to</span>
          {[
            { label: '1. Setup', target: 'section-setup' },
            { label: '2. Message', target: 'section-message' },
            { label: '3. Buttons', target: 'section-buttons' },
          ].map((item, i) => (
            <React.Fragment key={item.target}>
              {i > 0 && <span style={{ color: 'var(--c-border)', fontSize: 14, margin: '0 2px' }}>·</span>}
              <button
                type="button"
                onClick={() => scrollTo(item.target)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--c-accent)',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: 'var(--r-sm)',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Form sections ──────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── SECTION 1: Setup ── */}
            <Section
              id="section-setup"
              icon={<Zap size={16} />}
              title="Setup"
              subtitle="WhatsApp number, template name, language, and category"
            >
              {/* 1. WhatsApp number */}
              <SubSection number="1" title="WhatsApp number" description="Business number (WABA) Meta uses for template review.">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Account</label>
                  <select className="input">
                    <option value="">Choose WABA number</option>
                    <option value="waba1">{user?.wabaId || 'WABA_123456789'} — {user?.company || 'Your Business'}</option>
                  </select>
                  <div className="form-hint">This is your registered WhatsApp Business Account number.</div>
                </div>
              </SubSection>

              {/* 2. Name & language */}
              <SubSection number="2" title="Name & language" description="Internal template name and language of the message.">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Template name <span className="required">*</span></label>
                    <input
                      className={`input ${errors.name ? 'error' : ''}`}
                      placeholder="Untitled"
                      value={form.name}
                      onChange={e => onChange('name', e.target.value)}
                    />
                    {errors.name
                      ? <div className="form-error"><AlertCircle size={12} />{errors.name}</div>
                      : <div className="form-hint">Use underscores instead of spaces</div>
                    }
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Language</label>
                    <select className="input" value={form.language} onChange={e => onChange('language', e.target.value)}>
                      <option value="en">English (US)</option>
                      <option value="en_UG">English (Uganda)</option>
                      <option value="lg">Luganda</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </SubSection>

              {/* 3. Category */}
              <SubSection number="3" title="Category" description="Marketing, utility, or authentication — Meta rules differ per type.">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Template category</label>
                  <div style={{ marginTop: 4 }}>
                    <ToggleGroup
                      options={[
                        { val: 'Marketing', label: 'Marketing' },
                        { val: 'Utility', label: 'Utility' },
                        { val: 'Authentication', label: 'Authentication' },
                      ]}
                      value={form.category}
                      onChange={v => onChange('category', v)}
                    />
                  </div>
                  {form.category === 'Marketing' && (
                    <div className="form-hint" style={{ color: 'var(--c-yellow-text)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <AlertTriangle size={12} /> Marketing templates have higher per-message fees and require an opt-out button.
                    </div>
                  )}
                  {form.category === 'Authentication' && (
                    <div className="form-hint" style={{ marginTop: 8 }}>
                      Authentication templates are for sending one-time passwords and verification codes.
                    </div>
                  )}
                </div>
              </SubSection>
            </Section>

            {/* ── SECTION 2: Your message ── */}
            <Section
              id="section-message"
              icon={<MessageSquare size={16} />}
              title="Your message"
              subtitle="What customers see in the chat — header, main text, and footer"
            >
              {/* 1. Header */}
              <SubSection number="1" title="Header" optional description="Optional — image, video, document, text, or none.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ToggleGroup
                    options={[
                      { val: 'none', label: 'None' },
                      { val: 'text', label: 'Text' },
                      { val: 'media', label: 'Media' },
                    ]}
                    value={form.headerType}
                    onChange={v => onChange('headerType', v)}
                  />

                  {form.headerType === 'text' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        className={`input ${errors.headerText ? 'error' : ''}`}
                        placeholder="Enter header text…"
                        value={form.headerText}
                        onChange={e => onChange('headerText', e.target.value)}
                        maxLength={60}
                      />
                      {errors.headerText
                        ? <div className="form-error"><AlertCircle size={12} />{errors.headerText}</div>
                        : <div className="form-hint" style={{ textAlign: 'right' }}>{form.headerText.length}/60</div>
                      }
                    </div>
                  )}

                  {form.headerType === 'media' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <MediaTypePicker value={form.mediaType} onChange={v => onChange('mediaType', v)} />
                      {/* Sample upload */}
                      <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: '14px 16px', background: 'var(--c-surface-2)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>Sample file</div>
                        <p style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginBottom: 10, lineHeight: 1.5 }}>
                          Provide a sample file so Meta can review your header content. Do not include customer data.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 13, color: 'var(--c-text-2)', background: 'var(--c-surface)', fontWeight: 500 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--c-surface)'}
                          >
                            <Upload size={13} />
                            Choose {form.mediaType === 'image' ? 'image' : form.mediaType === 'video' ? 'MP4' : 'PDF'} file
                            <input type="file" accept={form.mediaType === 'image' ? '.jpg,.jpeg,.png,.webp' : form.mediaType === 'video' ? '.mp4' : '.pdf'} style={{ display: 'none' }} onChange={e => setSampleFile(e.target.files?.[0]?.name || null)} />
                          </label>
                          {sampleFile && (
                            <span style={{ fontSize: 12, color: 'var(--c-green-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={12} /> {sampleFile}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SubSection>

              {/* 2. Main message */}
              <SubSection number="2" title="Main message" description={`Body text. Use {{1}}, {{2}}… and add samples below for each.`}>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    style={{ fontSize: 12.5, color: 'var(--c-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}
                    onClick={() => onChange('body', STARTER_EXAMPLES[form.category] || STARTER_EXAMPLES.Marketing)}
                  >
                    Try a starter example →
                  </button>
                </div>
                <textarea
                  className={`input ${errors.body ? 'error' : ''}`}
                  placeholder={`e.g. Hi {{1}}, your order {{2}} is ready for pickup!`}
                  value={form.body}
                  onChange={e => onChange('body', e.target.value)}
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
                {errors.body ? (
                  <div className="form-error"><AlertCircle size={12} />{errors.body}</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <button
                      type="button"
                      style={{ fontSize: 12.5, color: 'var(--c-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}
                      onClick={addVariable}
                    >
                      <Plus size={12} /> Add variable
                    </button>
                    <span className="form-hint">{form.body.length}/1024</span>
                  </div>
                )}
              </SubSection>

              {/* 3. Footer */}
              <SubSection number="3" title="Footer" optional description="Optional line under the message (disclaimer, opt-out text, etc.).">
                <input
                  className="input"
                  placeholder={`Enter text in ${form.language === 'lg' ? 'Luganda' : form.language === 'sw' ? 'Swahili' : form.language === 'fr' ? 'French' : 'English'}`}
                  value={form.footer}
                  onChange={e => onChange('footer', e.target.value)}
                  maxLength={60}
                />
                <div className="form-hint" style={{ textAlign: 'right' }}>{form.footer.length}/60</div>
              </SubSection>
            </Section>

            {/* ── SECTION 3: Buttons & actions ── */}
            <Section
              id="section-buttons"
              icon={<Zap size={16} />}
              title="Buttons & actions"
              subtitle="Only add what you need — website, phone, quick replies, Flow, or opt-out."
            >
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Marketing opt-out recommendation */}
                {isMarketing && !hasOptout && (
                  <div style={{ border: '1px solid #A7F3D0', borderLeft: '3px solid var(--c-green)', borderRadius: 'var(--r-md)', padding: '12px 14px', background: '#f0fdf4', display: 'flex', gap: 10 }}>
                    <Lightbulb size={15} style={{ color: 'var(--c-green)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 3 }}>
                        We recommend adding the marketing opt-out button
                      </div>
                      <div style={{ fontSize: 12.5, color: '#15803d', lineHeight: 1.5 }}>
                        Allow customers to request to opt out of all marketing messages. This can help reduce
                        blocks from customers and increase your quality rating.{' '}
                        <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/manage-phone-numbers#opt-out" target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 500 }}>Learn more</a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing buttons */}
                {form.buttons.length > 0 && (
                  <div>
                    {form.buttons.map((btn, idx) => (
                      <ButtonRow key={btn.id} btn={btn} index={idx} errors={errors} onUpdate={updateButton} onDelete={removeButton} />
                    ))}
                  </div>
                )}

                {/* Add button chips */}
                {form.buttons.length < 3 && (
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--c-text-3)', marginBottom: 8 }}>Add a button</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {BUTTON_CHIPS.map(chip => {
                        const isDisabled = (chip.kind === 'qr_optout' && form.buttons.some(b => b.kind === 'qr_optout')) || form.buttons.length >= 3
                        return (
                          <button
                            key={chip.kind}
                            type="button"
                            onClick={() => !isDisabled && addButton(chip.kind)}
                            disabled={isDisabled}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 12px',
                              border: `1px solid ${isDisabled ? 'var(--c-border-light)' : 'var(--c-border)'}`,
                              borderRadius: 'var(--r-full)',
                              fontSize: 12.5,
                              fontWeight: 500,
                              color: isDisabled ? 'var(--c-text-4)' : 'var(--c-text-2)',
                              background: isDisabled ? 'var(--c-surface-2)' : 'var(--c-surface)',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 120ms ease',
                              opacity: isDisabled ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = 'var(--c-surface-2)'; e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.color = 'var(--c-accent)' } }}
                            onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.background = 'var(--c-surface)'; e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-2)' } }}
                          >
                            <span style={{ display: 'flex' }}>{chip.icon}</span>
                            + {chip.label}
                          </button>
                        )
                      })}
                    </div>
                    {form.buttons.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        {form.buttons.some(b => b.kind === 'qr_optout' || b.kind === 'qr_custom') && (
                          <span style={{ fontSize: 12, color: 'var(--c-text-4)', fontStyle: 'italic' }}>Quick replies &amp; opt-out</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {form.buttons.length >= 3 && (
                  <div className="form-hint">Maximum 3 buttons reached.</div>
                )}
              </div>
            </Section>

            {/* ── Validation summary + Submit ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ValidationBanner missing={missingFields} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/templates')}>
                  <ArrowLeft size={15} /> Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    background: submitting ? 'var(--c-border)' : '#0891b2',
                    color: '#fff',
                    borderColor: submitting ? 'var(--c-border)' : '#0e7490',
                    minWidth: 190,
                    justifyContent: 'center',
                    fontWeight: 600,
                  }}
                >
                  {submitting && <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />}
                  {submitting ? 'Submitting…' : isEdit ? 'Save & resubmit template' : 'Save & submit template'}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Live Preview ────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: 84 }}>
            <WAPreview form={form} />
          </div>

        </div>
      </div>
    </Layout>
  )
}
