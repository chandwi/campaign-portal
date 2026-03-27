import React from 'react'
import { MessageCircle, Smartphone, Mail } from 'lucide-react'
import { STATUS_MAP } from '../../data/mockData'

export function Badge({ status, label, color, dot = true, className = '' }) {
  const resolved = STATUS_MAP[status] || {}
  const c = color || resolved.color || 'gray'
  const l = label || resolved.label || status

  return (
    <span className={`badge badge-${c} ${className}`}>
      {dot && <span className="badge-dot" />}
      {l}
    </span>
  )
}

const CHANNEL_ICONS = {
  whatsapp: <MessageCircle size={11} />,
  sms:      <Smartphone size={11} />,
  email:    <Mail size={11} />,
}

export function ChannelBadge({ channel }) {
  const map = {
    whatsapp: { label: 'WhatsApp' },
    sms:      { label: 'SMS' },
    email:    { label: 'Email' },
  }
  const info = map[channel] || { label: channel }
  const icon = CHANNEL_ICONS[channel] || <MessageCircle size={11} />

  return (
    <span className={`channel-badge channel-${channel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon}
      {info.label}
    </span>
  )
}
