import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              background: '#fff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Body */}
            <div style={{ padding: '28px 28px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Icon */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: danger ? '#fef2f2' : '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={20} color={danger ? '#dc2626' : '#2563eb'} strokeWidth={2} />
              </div>

              {/* Text */}
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                  {title}
                </p>
                <p style={{ fontSize: '13.5px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  {message}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px 24px',
              display: 'flex', justifyContent: 'flex-end', gap: '10px',
            }}>
              <button
                onClick={onCancel}
                style={{
                  height: '38px', padding: '0 18px',
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '13.5px', fontWeight: 500,
                  color: '#374151', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'border-box', transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  height: '38px', padding: '0 18px',
                  background: danger ? '#dc2626' : '#1d4ed8',
                  border: 'none', borderRadius: '8px',
                  fontSize: '13.5px', fontWeight: 600,
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'border-box', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = danger ? '#b91c1c' : '#1e40af'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = danger ? '#dc2626' : '#1d4ed8'
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
