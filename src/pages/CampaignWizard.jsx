import React, { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Check, Upload, AlertCircle,
  MessageSquare, Phone, Mail, ArrowRight, Send, Calendar,
  Info, X, ExternalLink, MessageCircle, Smartphone, Zap, FileText, List
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { useApp } from '../context/AppContext'

// ─── Stepper ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Setup' },
  { id: 2, label: 'Audience' },
  { id: 3, label: 'Template' },
  { id: 4, label: 'Mapping' },
  { id: 5, label: 'Preview' },
  { id: 6, label: 'Send' },
]

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((step, idx) => {
        const isDone = current > step.id
        const isActive = current === step.id
        return (
          <div key={step.id} className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`} style={{ position: 'relative' }}>
            {idx !== 0 && (
              <div className="step-connector" style={{ background: isDone || isActive ? 'var(--c-accent)' : 'var(--c-border)', left: 0, right: '50%' }} />
            )}
            {idx !== STEPS.length - 1 && (
              <div className="step-connector" style={{ background: isDone ? 'var(--c-accent)' : 'var(--c-border)', left: '50%', right: 0 }} />
            )}
            <div className="step-bubble-wrap">
              <div className="step-bubble">
                {isDone ? <Check size={13} /> : step.id}
              </div>
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── WhatsApp Preview ────────────────────────────────────────────────────────
function WAPreview({ template, sampleValues = {} }) {
  if (!template) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--c-text-4)', fontSize: 13 }}>
      Select a template to preview
    </div>
  )

  let body = template.body || ''
  Object.entries(sampleValues).forEach(([key, val]) => {
    body = body.replaceAll(key, `<strong>${val || key}</strong>`)
  })

  return (
    <div className="wa-phone" style={{ width: '100%', maxWidth: 280 }}>
      <div className="wa-header">
        <div className="wa-avatar">B</div>
        <div className="wa-contact">
          <div className="wa-contact-name">Business</div>
          <div className="wa-contact-status">online</div>
        </div>
      </div>
      <div className="wa-body">
        <div className="wa-bubble">
          {template.header && <div className="wa-bubble-header">{template.header}</div>}
          <div className="wa-bubble-body" dangerouslySetInnerHTML={{ __html: body }} />
          {template.footer && <div className="wa-bubble-footer">{template.footer}</div>}
          <div className="wa-bubble-time">10:42 AM ✓✓</div>
        </div>
        {template.ctaButton && (
          <div className="wa-cta" style={{ marginTop: 4 }}>
            <ExternalLink size={13} />
            {template.ctaButton.text}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 1: Setup ───────────────────────────────────────────────────────────
function StepSetup({ data, onChange, errors }) {
  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={22} />, desc: 'Reach users on WhatsApp' },
    { id: 'sms',      label: 'SMS',      icon: <Smartphone size={22} />,    desc: 'Send text messages' },
    { id: 'email',    label: 'Email',    icon: <Mail size={22} />,          desc: 'Email campaigns' },
  ]
  return (
    <div>
      <div className="form-group">
        <label className="form-label">Campaign Name <span className="required">*</span></label>
        <input
          className={`input ${errors.name ? 'error' : ''}`}
          placeholder="e.g. Kampala Summer Sale"
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          autoFocus
        />
        {errors.name && <div className="form-error"><AlertCircle size={12} />{errors.name}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="input"
          placeholder="What is this campaign about? (optional)"
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          rows={2}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Channel <span className="required">*</span></label>
        <div className="channel-grid">
          {channels.map(ch => (
            <div
              key={ch.id}
              className={`channel-card ${data.channel === ch.id ? 'selected' : ''}`}
              onClick={() => onChange('channel', ch.id)}
            >
              <div className="channel-card-icon" style={{ color: data.channel === ch.id ? 'var(--c-accent)' : 'var(--c-text-3)' }}>{ch.icon}</div>
              <div className="channel-card-name">{ch.label}</div>
              <div className="channel-card-desc">{ch.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Audience ─────────────────────────────────────────────────────────
function StepAudience({ data, onChange, errors, contactLists }) {
  const fileRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length === 0) return
      const columns = lines[0].split(',').map(c => c.trim().replace(/"/g, ''))
      const rows = lines.slice(1, 4).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row = {}
        columns.forEach((col, i) => { row[col] = vals[i] || '' })
        return row
      })
      onChange('csvFile', file)
      onChange('csvColumns', columns)
      onChange('csvSampleRows', rows)
      onChange('csvTotal', lines.length - 1)
      onChange('csvValid', Math.floor((lines.length - 1) * 0.94))
      onChange('csvInvalid', Math.ceil((lines.length - 1) * 0.06))
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Audience Source <span className="required">*</span></label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['saved', 'upload'].map(t => (
            <button
              key={t}
              className={`btn ${data.audienceType === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => onChange('audienceType', t)}
            >
              {t === 'saved' ? <><List size={14} /> Use Saved List</> : <><Upload size={14} /> Upload CSV</>}
            </button>
          ))}
        </div>
      </div>

      {data.audienceType === 'saved' ? (
        <div className="form-group">
          <label className="form-label">Select Contact List <span className="required">*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contactLists.map(cl => (
              <div
                key={cl.id}
                onClick={() => { onChange('selectedList', cl.id); onChange('csvColumns', cl.columns) }}
                style={{
                  padding: '12px 16px',
                  border: `2px solid ${data.selectedList === cl.id ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  background: data.selectedList === cl.id ? 'var(--c-accent-bg)' : 'var(--c-surface)',
                  transition: 'all 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--c-text)' }}>{cl.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-4)', marginTop: 2 }}>{cl.description}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--c-text)' }}>{cl.validContacts.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>valid contacts</div>
                </div>
              </div>
            ))}
          </div>
          {errors.audience && <div className="form-error mt-2"><AlertCircle size={12} />{errors.audience}</div>}
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Upload CSV File <span className="required">*</span></label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {!data.csvFile ? (
            <div
              className="upload-zone"
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            >
              <div className="upload-zone-icon"><Upload size={22} /></div>
              <div className="upload-zone-title">Click to upload or drag & drop</div>
              <div className="upload-zone-hint">CSV file with phone numbers and variable columns. Max 100k rows.</div>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} /> {data.csvFile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-4)', marginTop: 2 }}>
                    {data.csvColumns?.length} columns detected
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { onChange('csvFile', null); onChange('csvColumns', []); fileRef.current.value = '' }}>
                  <X size={14} /> Remove
                </button>
              </div>
              <div style={{ display: 'flex', gap: 20, padding: '10px 0', borderTop: '1px solid var(--c-border-light)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)' }}>{data.csvTotal}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-green)' }}>{data.csvValid}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>Valid</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-red)' }}>{data.csvInvalid}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>Invalid</div>
                </div>
              </div>
              {data.csvInvalid > 0 && (
                <div className="alert alert-warning" style={{ marginTop: 10 }}>
                  <AlertCircle size={14} />
                  <span>{data.csvInvalid} invalid entries will be excluded. <button style={{ fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Download errors</button></span>
                </div>
              )}
            </div>
          )}
          {errors.audience && <div className="form-error mt-2"><AlertCircle size={12} />{errors.audience}</div>}
        </div>
      )}

      <div className="alert alert-info">
        <Info size={14} />
        <span>Opt-out contacts are automatically excluded from all campaigns.</span>
      </div>
    </div>
  )
}

// ─── Step 3: Template ─────────────────────────────────────────────────────────
function StepTemplate({ data, onChange, errors, templates }) {
  const approvedTemplates = templates.filter(t => t.status === 'approved')

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <Info size={14} />
        <span>Only <strong>approved</strong> templates can be used for sending. Pending templates are blocked by Meta until reviewed.</span>
      </div>

      <div className="form-group">
        <label className="form-label">Select Template <span className="required">*</span></label>
        {approvedTemplates.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-icon"><MessageSquare size={24} /></div>
            <div className="empty-title">No approved templates</div>
            <div className="empty-desc">Create and get a template approved before starting a campaign.</div>
            <a href="/templates/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>Create Template</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvedTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => onChange('selectedTemplate', t.id)}
                style={{
                  padding: '14px 16px',
                  border: `2px solid ${data.selectedTemplate === t.id ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  background: data.selectedTemplate === t.id ? 'var(--c-accent-bg)' : 'var(--c-surface)',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--c-text)' }}>{t.displayName}</div>
                    <code style={{ fontSize: 11.5, color: 'var(--c-text-4)' }}>{t.name}</code>
                    <div style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginTop: 6, lineHeight: 1.5 }}>
                      {t.body.slice(0, 100)}{t.body.length > 100 ? '…' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span className="badge badge-green badge-sm"><span className="badge-dot" />Approved</span>
                    <span style={{ fontSize: 11, color: 'var(--c-text-4)' }}>{t.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {errors.template && <div className="form-error mt-2"><AlertCircle size={12} />{errors.template}</div>}
      </div>
    </div>
  )
}

// ─── Step 4: Variable Mapping ─────────────────────────────────────────────────
function StepMapping({ data, onChange, template, contactList }) {
  if (!template) return <div style={{ color: 'var(--c-text-4)', fontSize: 13 }}>No template selected.</div>

  const placeholders = [...(template.body || '').matchAll(/\{\{(\d+)\}\}/g)].map(m => m[0])
  const unique = [...new Set(placeholders)]
  const columns = data.csvColumns || contactList?.columns || []

  if (unique.length === 0) return (
    <div className="alert alert-success">
      <Check size={14} />
      This template has no variable placeholders. No mapping needed.
    </div>
  )

  const sampleRow = contactList?.sampleRows?.[0] || {}

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>Map Placeholders to Columns</div>
        <div style={{ fontSize: 13, color: 'var(--c-text-3)' }}>
          Match each template placeholder to a column from your contact list.
        </div>
      </div>

      {unique.map(ph => (
        <div key={ph} className="mapping-row">
          <div className="mapping-placeholder">{ph}</div>
          <div className="mapping-arrow"><ArrowRight size={16} /></div>
          <select
            className="input"
            style={{ flex: 1 }}
            value={data.variableMapping?.[ph] || ''}
            onChange={e => onChange('variableMapping', { ...data.variableMapping, [ph]: e.target.value })}
          >
            <option value="">— Select column —</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          {data.variableMapping?.[ph] && sampleRow[data.variableMapping[ph]] && (
            <div style={{ fontSize: 12, color: 'var(--c-text-3)', minWidth: 80, textAlign: 'right' }}>
              e.g. <strong>{sampleRow[data.variableMapping[ph]]}</strong>
            </div>
          )}
        </div>
      ))}

      {Object.keys(data.variableMapping || {}).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Sample Output</div>
          <div style={{ padding: '12px 14px', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, color: 'var(--c-text)', lineHeight: 1.6 }}>
            {(() => {
              let preview = template.body
              unique.forEach(ph => {
                const col = data.variableMapping?.[ph]
                const val = col && sampleRow[col] ? sampleRow[col] : ph
                preview = preview.replaceAll(ph, `[${val}]`)
              })
              return preview
            })()}
          </div>
        </div>
      )}

      {unique.some(ph => !data.variableMapping?.[ph]) && (
        <div className="alert alert-warning" style={{ marginTop: 12 }}>
          <AlertCircle size={14} />
          Some placeholders are unmapped. All must be mapped before sending.
        </div>
      )}
    </div>
  )
}

// ─── Step 5: Preview ──────────────────────────────────────────────────────────
function StepPreview({ data, onChange, template, contactList }) {
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const sampleValues = {}
  const sampleRow = contactList?.sampleRows?.[0] || {}
  Object.entries(data.variableMapping || {}).forEach(([ph, col]) => {
    sampleValues[ph] = sampleRow[col] || col
  })

  const handleTestSend = async () => {
    if (!data.testPhone?.trim()) return
    setTestSending(true)
    setTestResult(null)
    await new Promise(r => setTimeout(r, 1500))
    setTestSending(false)
    setTestResult({ ok: true, message: 'Test message sent successfully!' })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-text)', marginBottom: 12 }}>Message Preview</div>
          <WAPreview template={template} sampleValues={sampleValues} />
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-text)', marginBottom: 12 }}>Send Test Message</div>
          <div style={{ padding: 16, background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
            <div className="form-group">
              <label className="form-label">Test Phone Number</label>
              <input
                className="input"
                placeholder="+256 701 234 567"
                value={data.testPhone || ''}
                onChange={e => onChange('testPhone', e.target.value)}
              />
              <div className="form-hint">We'll send to this number using the first row of your data.</div>
            </div>
            <button
              className="btn btn-secondary btn-full"
              onClick={handleTestSend}
              disabled={testSending || !data.testPhone?.trim()}
            >
              {testSending ? <span className="spinner spinner-sm" /> : <Send size={14} />}
              {testSending ? 'Sending…' : 'Send Test'}
            </button>
            {testResult && (
              <div className={`alert ${testResult.ok ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 10 }}>
                {testResult.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                {testResult.message}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="toggle-wrap">
              <button
                className={`toggle ${data.sendCopyToMe ? 'on' : ''}`}
                onClick={() => onChange('sendCopyToMe', !data.sendCopyToMe)}
              />
              <span className="toggle-label">Send a copy to me</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-4)', marginTop: 4, marginLeft: 46 }}>
              You'll receive a copy of the campaign message.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Send ─────────────────────────────────────────────────────────────
function StepSend({ data, onChange, template, contactList, campaign }) {
  const recipients = (() => {
    if (data.audienceType === 'saved' && contactList) return contactList.validContacts
    if (data.audienceType === 'upload' && data.csvValid) return data.csvValid
    return 0
  })()

  return (
    <div>
      {/* Summary card */}
      <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)', marginBottom: 14 }}>Campaign Summary</div>
        {[
          ['Campaign Name', data.name],
          ['Channel', data.channel?.toUpperCase()],
          ['Template', template?.displayName || '—'],
          ['Audience', contactList?.name || data.csvFile?.name || '—'],
          ['Recipients', recipients.toLocaleString()],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--c-border-light)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--c-text-3)' }}>{k}</span>
            <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Schedule */}
      <div className="form-group">
        <label className="form-label">Send Time</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {['now', 'later'].map(t => (
            <button
              key={t}
              className={`btn ${data.scheduleType === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => onChange('scheduleType', t)}
            >
              {t === 'now' ? <><Zap size={14} /> Send Now</> : <><Calendar size={14} /> Schedule for Later</>}
            </button>
          ))}
        </div>
        {data.scheduleType === 'later' && (
          <input
            className="input"
            type="datetime-local"
            value={data.scheduledAt || ''}
            onChange={e => onChange('scheduledAt', e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        )}
      </div>

      {/* Warning */}
      <div className="alert alert-warning" style={{ marginBottom: 16 }}>
        <AlertCircle size={14} />
        <span>
          You are about to send to <strong>{recipients.toLocaleString()} recipients</strong>.
          This action cannot be undone once the campaign starts sending.
        </span>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--c-text-4)', lineHeight: 1.6 }}>
        By sending this campaign, you confirm that all recipients have opted in to receive messages
        and you comply with WhatsApp's Business Policy and applicable regulations.
      </div>
    </div>
  )
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────
export default function CampaignWizard() {
  const { templates, contactLists, addCampaign, toast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state || {}

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({
    name: prefill.name || '',
    description: '',
    channel: prefill.channel || 'whatsapp',
    audienceType: 'saved',
    selectedList: null,
    csvFile: null,
    csvColumns: [],
    csvSampleRows: [],
    csvTotal: 0,
    csvValid: 0,
    csvInvalid: 0,
    selectedTemplate: null,
    variableMapping: {},
    testPhone: '',
    sendCopyToMe: false,
    scheduleType: 'now',
    scheduledAt: '',
  })
  const [errors, setErrors] = useState({})

  const onChange = (key, val) => setData(p => ({ ...p, [key]: val }))

  const selectedTemplate = templates.find(t => t.id === data.selectedTemplate) || null
  const selectedContactList = contactLists.find(cl => cl.id === data.selectedList) || null

  const validate = () => {
    const errs = {}
    if (step === 1) {
      if (!data.name.trim()) errs.name = 'Campaign name is required'
    }
    if (step === 2) {
      if (data.audienceType === 'saved' && !data.selectedList) errs.audience = 'Please select a contact list'
      if (data.audienceType === 'upload' && !data.csvFile) errs.audience = 'Please upload a CSV file'
    }
    if (step === 3) {
      if (!data.selectedTemplate) errs.template = 'Please select a template'
    }
    if (step === 4 && selectedTemplate) {
      const phs = [...new Set([...(selectedTemplate.body || '').matchAll(/\{\{(\d+)\}\}/g)].map(m => m[0]))]
      const unmapped = phs.filter(ph => !data.variableMapping?.[ph])
      if (unmapped.length > 0) errs.mapping = `Please map all placeholders: ${unmapped.join(', ')}`
    }
    if (step === 6 && data.scheduleType === 'later' && !data.scheduledAt) {
      errs.schedule = 'Please select a schedule time'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    setStep(s => Math.min(s + 1, 6))
  }

  const handleBack = () => {
    setErrors({})
    setStep(s => Math.max(s - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))

    const recipients = data.audienceType === 'saved'
      ? selectedContactList?.validContacts || 0
      : data.csvValid || 0

    const newCampaign = {
      id: `c_${Date.now()}`,
      name: data.name,
      channel: data.channel,
      status: data.scheduleType === 'later' ? 'queued' : 'processing',
      templateId: data.selectedTemplate,
      contactListId: data.selectedList,
      totalRecipients: recipients,
      sent: 0,
      delivered: 0,
      failed: 0,
      optOuts: 0,
      ctaClicks: 0,
      createdAt: new Date().toISOString(),
      sentAt: data.scheduleType === 'now' ? new Date().toISOString() : null,
      scheduledAt: data.scheduleType === 'later' ? data.scheduledAt : null,
      sendCopyToMe: data.sendCopyToMe,
      variableMapping: data.variableMapping,
      timeline: [
        { event: 'Campaign created', time: new Date().toISOString(), type: 'gray' },
        { event: `Audience: ${recipients.toLocaleString()} valid recipients`, time: new Date().toISOString(), type: 'green' },
        ...(data.scheduleType === 'now' ? [{ event: 'Messages enqueued', time: new Date().toISOString(), type: 'default' }] : []),
      ],
      dailyStats: [],
    }

    addCampaign(newCampaign)
    toast(
      `Campaign "${data.name}" ${data.scheduleType === 'later' ? 'scheduled' : 'launched'} successfully!`,
      'success',
      data.scheduleType === 'later' ? 'Scheduled' : 'Campaign Launched'
    )
    navigate('/campaigns')
  }

  return (
    <Layout title="New Campaign" breadcrumb="Campaigns">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Stepper current={step} />

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ fontSize: 15 }}>
                {STEPS[step - 1]?.label}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--c-text-4)', marginTop: 2 }}>Step {step} of {STEPS.length}</div>
            </div>
          </div>
          <div className="card-body">
            {step === 1 && <StepSetup data={data} onChange={onChange} errors={errors} />}
            {step === 2 && <StepAudience data={data} onChange={onChange} errors={errors} contactLists={contactLists} />}
            {step === 3 && <StepTemplate data={data} onChange={onChange} errors={errors} templates={templates} />}
            {step === 4 && <StepMapping data={data} onChange={onChange} template={selectedTemplate} contactList={selectedContactList} />}
            {step === 5 && <StepPreview data={data} onChange={onChange} template={selectedTemplate} contactList={selectedContactList} />}
            {step === 6 && <StepSend data={data} onChange={onChange} template={selectedTemplate} contactList={selectedContactList} />}

            {errors.mapping && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                <AlertCircle size={14} />{errors.mapping}
              </div>
            )}
            {errors.schedule && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                <AlertCircle size={14} />{errors.schedule}
              </div>
            )}
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={step === 1 ? () => navigate('/campaigns') : handleBack}
            >
              <ChevronLeft size={15} />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 6 ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ minWidth: 140 }}
              >
                {submitting ? <span className="spinner spinner-sm" /> : <Send size={14} />}
                {submitting ? 'Launching…' : (data.scheduleType === 'later' ? 'Schedule Campaign' : 'Launch Campaign')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
