import { useState, useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package2, Plus, Pencil, Trash2, X, Check, Search, UploadCloud } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

const fallbackImage = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80'

const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: '6px',
}
const sel: React.CSSProperties = {
  width: '100%', height: '40px', borderRadius: '8px',
  border: '1px solid #d1d5db', background: '#fff',
  padding: '0 12px', fontSize: '13.5px', color: '#111827',
  outline: 'none', boxSizing: 'border-box',
}

function StatusPill({ available }: { available: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600,
      background: available ? '#dcfce7' : '#fee2e2',
      color: available ? '#15803d' : '#b91c1c',
    }}>
      {available ? 'Available' : 'Unavailable'}
    </span>
  )
}

function ActivePill({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
      background: active ? '#dcfce7' : '#f3f4f6',
      color: active ? '#15803d' : '#6b7280',
      transition: 'all 0.15s',
    }}>
      {active ? 'Active' : 'Inactive'}
    </button>
  )
}

function IconBtn({ onClick, title, children, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
        background: hov ? (danger ? '#fee2e2' : '#f3f4f6') : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? (danger ? '#b91c1c' : '#374151') : '#9ca3af',
        transition: 'background 0.15s, color 0.15s', flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

type FormState = {
  name: string; description: string; image_url: string
  category_id: string; quantity: string
}

function UploadZone({ preview, onFile }: {
  preview: string | null; onFile: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }, [onFile])

  const active = dragging || hovered

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          flex: 1, minHeight: '96px', borderRadius: '10px', cursor: 'pointer',
          border: `2px dashed ${active ? '#60a5fa' : '#d1d5db'}`,
          background: active ? 'rgba(239,246,255,0.6)' : '#f9fafb',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '5px',
          transition: 'border-color 0.15s, background 0.15s', padding: '18px 16px',
        }}
      >
        <UploadCloud size={20} color={active ? '#2563eb' : '#9ca3af'} strokeWidth={1.8} />
        <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#374151', textAlign: 'center', lineHeight: 1.4 }}>
          Drag & drop here, or{' '}
          <span style={{ color: '#2563eb', textDecoration: 'underline', textUnderlineOffset: '2px' }}>browse</span>
        </span>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>PNG, JPG, GIF — max 5 MB</span>
      </div>

      {/* Preview / placeholder */}
      {preview ? (
        <div style={{ width: '96px', height: '96px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
          <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ width: '96px', height: '96px', borderRadius: '10px', border: '1px dashed #e5e7eb', background: '#f9fafb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '10px', color: '#d1d5db', textAlign: 'center', lineHeight: 1.5 }}>No{'\n'}preview</span>
        </div>
      )}

      <input
        ref={inputRef} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}

function AssetModal({ onClose, categories, form, setForm, onSubmit, isPending }: {
  onClose: () => void
  categories: { id: number; name: string }[]
  form: FormState
  setForm: (f: FormState) => void
  onSubmit: () => void
  isPending: boolean
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload')
  const canSubmit = Boolean(form.name.trim() && form.category_id && !isPending)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      // Show preview in modal AND write into form so it gets saved
      setImagePreview(dataUrl)
      setForm({ ...form, image_url: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  const tabBase: React.CSSProperties = {
    flex: 1, height: '34px', border: 'none', borderRadius: '6px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '540px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)',
          overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>New Asset</span>
          <button
            onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'background 0.12s, color 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>

          {/* Name */}
          <div>
            <label style={lbl}>Name *</label>
            <Input
              placeholder="e.g. MacBook Pro 14"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10"
            />
          </div>

          {/* Category + Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={lbl}>Category *</label>
              <select
                style={sel}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Quantity</label>
              <input
                type="number" placeholder="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                style={{
                  width: '100%', height: '40px', borderRadius: '8px',
                  border: '1px solid #d1d5db', background: '#fff',
                  padding: '0 12px', fontSize: '13.5px', color: '#111827',
                  outline: 'none', boxSizing: 'border-box',
                  WebkitAppearance: 'none', MozAppearance: 'textfield',
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description</label>
            <Input
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-10"
            />
          </div>

          {/* Photo section */}
          <div>
            <label style={{ ...lbl, marginBottom: '10px' }}>Photo</label>

            {/* Segmented toggle */}
            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '8px', padding: '3px', marginBottom: '12px' }}>
              <button
                onClick={() => setMediaMode('upload')}
                style={{ ...tabBase, background: mediaMode === 'upload' ? '#fff' : 'transparent', color: mediaMode === 'upload' ? '#111827' : '#6b7280', boxShadow: mediaMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Upload File
              </button>
              <button
                onClick={() => setMediaMode('url')}
                style={{ ...tabBase, background: mediaMode === 'url' ? '#fff' : 'transparent', color: mediaMode === 'url' ? '#111827' : '#6b7280', boxShadow: mediaMode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Use URL
              </button>
            </div>

            {mediaMode === 'upload' ? (
              <UploadZone preview={imagePreview} onFile={handleFile} />
            ) : (
              <Input
                placeholder="https://example.com/photo.jpg"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="h-10"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ height: '40px', padding: '0 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13.5px', fontWeight: 500, color: '#6b7280', cursor: 'pointer', transition: 'background 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{ height: '40px', padding: '0 20px', background: canSubmit ? '#1d4ed8' : '#93c5fd', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
            onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = '#1e40af' }}
            onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = '#1d4ed8' }}
          >
            {isPending ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function AdminAssetsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '', description: '', image_url: '', category_id: '', quantity: '1',
  })

  const assetsQuery = useQuery({
    queryKey: ['admin-assets', token],
    queryFn: () => api.listAssets(token!),
    enabled: Boolean(token),
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: () => api.listCategories(token!),
    enabled: Boolean(token),
  })

  const createMutation = useMutation({
    mutationFn: () => api.createAsset(token!, {
      name: form.name, description: form.description,
      image_url: form.image_url || null,
      category_id: Number(form.category_id), quantity: Number(form.quantity),
    }),
    onSuccess: async () => {
      setNotice('Asset created!')
      setError('')
      setShowModal(false)
      setForm({ name: '', description: '', image_url: '', category_id: '', quantity: '1' })
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      api.updateAsset(token!, id, { name }),
    onSuccess: async () => {
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAsset(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.updateAsset(token!, id, { is_active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
    },
  })

  const allAssets = assetsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const getCategoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? '—'

  const assets = search.trim()
    ? allAssets.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.asset_code?.toLowerCase().includes(search.toLowerCase())
      )
    : allAssets

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Asset Manifest</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
            Manage all physical assets in the system.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              style={{ height: '38px', paddingLeft: '32px', paddingRight: '12px', width: '220px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13.5px', color: '#111827', background: '#fff', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ height: '38px', padding: '0 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1e40af' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1d4ed8' }}
          >
            <Plus size={15} /> Add Asset
          </button>
        </div>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert variant="success" message={notice} onDismiss={() => setNotice('')} />
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert variant="error" message={error} onDismiss={() => setError('')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Asset modal */}
      <AnimatePresence>
        {showModal && (
          <AssetModal
            onClose={() => setShowModal(false)}
            categories={categories}
            form={form}
            setForm={setForm}
            onSubmit={() => createMutation.mutate()}
            isPending={createMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete Asset"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) deleteMutation.mutate(confirmDelete.id)
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Assets table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Asset', 'Code', 'Category', 'Status', 'Active', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#374151', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assetsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: '16px 20px' }}>
                      <div style={{ height: '14px', background: '#f3f4f6', borderRadius: '4px' }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!assetsQuery.isLoading && assets.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '56px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    <Package2 size={28} style={{ margin: '0 auto 8px', display: 'block', color: '#d1d5db' }} />
                    {search ? `No assets matching "${search}"` : 'No assets found'}
                  </td>
                </tr>
              )}

              {assets.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={a.image_url?.trim() || fallbackImage}
                        alt={a.name}
                        onError={(e) => { e.currentTarget.src = fallbackImage }}
                        style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      {editingId === a.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ height: '32px', fontSize: '13px', width: '160px' }}
                          />
                          <button
                            onClick={() => updateMutation.mutate({ id: a.id, name: editName })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: '4px' }}
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>{a.name}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {a.asset_code}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#374151' }}>
                    {getCategoryName(a.category_id)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <StatusPill available={a.status === 'available'} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <ActivePill
                      active={a.is_active}
                      onClick={() => toggleActiveMutation.mutate({ id: a.id, is_active: !a.is_active })}
                    />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <IconBtn title="Rename" onClick={() => { setEditingId(a.id); setEditName(a.name) }}>
                        <Pencil size={14} />
                      </IconBtn>
                      <IconBtn danger title="Delete" onClick={() => setConfirmDelete({ id: a.id, name: a.name })}>
                        <Trash2 size={14} />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
