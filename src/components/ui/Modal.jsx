import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, size = 'md', children }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={`modal modal-${size}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="modal-header">
      <div>
        <div className="modal-title">{title}</div>
        {subtitle && <div className="modal-subtitle">{subtitle}</div>}
      </div>
      {onClose && (
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children }) {
  return <div className="modal-body">{children}</div>
}

export function ModalFooter({ children }) {
  return <div className="modal-footer">{children}</div>
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', confirmClass = 'btn btn-danger', loading = false, icon = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalBody>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div className={`confirm-icon ${icon}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="confirm-title">{title}</div>
          <div className="confirm-desc">{description}</div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button className={confirmClass} onClick={onConfirm} disabled={loading}>
          {loading ? <span className="spinner spinner-sm" /> : null}
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  )
}
