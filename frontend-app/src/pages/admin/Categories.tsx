import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Check, X } from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'

export function AdminCategoriesPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [notice, setNotice] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus()
  }, [editingId])

  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: async () => {
      if (!token) return []
      return api.listCategories(token)
    },
    enabled: Boolean(token),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Missing token')
      return api.createCategory(token, { name })
    },
    onSuccess: async () => {
      setName('')
      setNotice('Category created successfully')
      await queryClient.invalidateQueries({ queryKey: ['categories', token] })
      setTimeout(() => setNotice(''), 3000)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; name: string }) => {
      if (!token) throw new Error('Missing token')
      return api.updateCategory(token, payload.id, { name: payload.name })
    },
    onSuccess: async () => {
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['categories', token] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!token) throw new Error('Missing token')
      return api.deleteCategory(token, id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories', token] })
    },
  })

  const categories = categoriesQuery.data ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Create, rename, and manage asset categories for organisation.</p>
        </div>
        <div className="badge badge-blue">
          <Tag className="w-3 h-3" /> {categories.length} Categories
        </div>
      </div>

      {/* Success */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: 'rgb(16 185 129 / 0.08)', border: '1px solid rgb(16 185 129 / 0.2)' }}
          >
            <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#34d399', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: '#6ee7b7' }}>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Category */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7', marginBottom: '1rem' }}>
          Add New Category
        </h2>
        <div className="flex gap-3 items-end">
          <div className="form-group flex-1" style={{ marginBottom: 0 }}>
            <label className="form-label">Category Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptops, Cameras, Furniture"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && !createMutation.isPending) {
                  createMutation.mutate()
                }
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => createMutation.mutate()}
            type="button"
            disabled={!name.trim() || createMutation.isPending}
            style={{ height: '2.5rem', flexShrink: 0 }}
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
        {(createMutation.error || updateMutation.error || deleteMutation.error) && (
          <p className="error-text text-xs flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3" />
            {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
          </p>
        )}
      </div>

      {/* Categories List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>
            All Categories
          </h2>
          {categoriesQuery.isLoading && (
            <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>Loading...</span>
          )}
        </div>

        {categoriesQuery.isError ? (
          <div className="px-5 py-6">
            <p className="error-text text-sm">Failed to load categories.</p>
          </div>
        ) : categories.length === 0 && !categoriesQuery.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgb(99 102 241 / 0.08)', border: '1px solid rgb(99 102 241 / 0.15)' }}
            >
              <Tag className="w-5 h-5" style={{ color: '#818cf8' }} />
            </div>
            <p style={{ color: '#71717a', fontSize: '0.875rem' }}>No categories yet. Add your first one above.</p>
          </div>
        ) : (
          <div>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
                style={{
                  borderBottom: index < categories.length - 1 ? '1px solid #27272a' : 'none',
                }}
              >
                {/* Left: ID + Name/Edit */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: '#27272a', color: '#71717a' }}
                  >
                    {category.id}
                  </span>
                  {editingId === category.id ? (
                    <input
                      ref={editInputRef}
                      className="form-input flex-1"
                      style={{ height: '2rem', fontSize: '0.875rem' }}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingName.trim()) {
                          updateMutation.mutate({ id: category.id, name: editingName.trim() })
                        }
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  ) : (
                    <span style={{ color: '#e4e4e7', fontSize: '0.9375rem', fontWeight: '500' }}>
                      {category.name}
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingId === category.id ? (
                    <>
                      <button
                        className="btn btn-primary"
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
                        type="button"
                        disabled={!editingName.trim() || updateMutation.isPending}
                        onClick={() => {
                          if (editingName.trim()) updateMutation.mutate({ id: category.id, name: editingName.trim() })
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
                        type="button"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          setEditingId(category.id)
                          setEditingName(category.name)
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                        Rename
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) {
                            deleteMutation.mutate(category.id)
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
