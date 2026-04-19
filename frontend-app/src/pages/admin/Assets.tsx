import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package2, Upload, CheckCircle2, AlertCircle, ImageIcon, X, FolderOpen,
} from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'

const schema = z.object({
  name: z.string().min(2, 'Asset name must be at least 2 characters'),
  description: z.string().min(2, 'Description is required'),
  category_id: z.number().int().positive('Please select a category'),
  quantity: z.number().int().min(1).max(100),
})

type FormValues = z.infer<typeof schema>

export function AdminAssetsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  })

  const categoryId = useWatch({ control, name: 'category_id' })

  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: async () => {
      if (!token) return []
      return api.listCategories(token)
    },
    enabled: Boolean(token),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      if (!token) throw new Error('No auth token')
      return api.createAsset(token, {
        name: payload.name,
        description: payload.description,
        image_url: imagePreview,
        category_id: payload.category_id,
        quantity: payload.quantity,
      })
    },
    onSuccess: async (created) => {
      setNotice(`✓ Created ${created.length} asset(s) successfully`)
      reset({ quantity: 1 } as Partial<FormValues>)
      setImageFile(null)
      setImagePreview(null)
      await queryClient.invalidateQueries({ queryKey: ['assets'] })
      setTimeout(() => setNotice(''), 4000)
    },
  })

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])

  if (categoriesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Asset Manager</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
        <div className="card">
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Manager</h1>
          <p className="page-subtitle">
            Create new assets with metadata and an image from your device.
          </p>
        </div>
        <div className="badge badge-purple">
          <Package2 className="w-3 h-3" /> Admin
        </div>
      </div>

      {/* Success notice */}
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

      {/* Form card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}
          >
            <Package2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>Create New Asset</h2>
            <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>Fill in details to add assets to inventory</p>
          </div>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => {
            setNotice('')
            createMutation.mutate(values)
          })}
        >
          {/* Row 1: Name + Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Asset Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. MacBook Pro 14&quot;"
                {...register('name')}
              />
              {errors.name && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {errors.name.message}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                type="text"
                placeholder="Brief description of the asset"
                {...register('description')}
              />
              {errors.description && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Category + Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                {...register('category_id', { valueAsNumber: true })}
                defaultValue=""
              >
                <option value="" disabled>Select a category</option>
                {categoryOptions.length === 0 && (
                  <option value="" disabled>No categories — create one first</option>
                )}
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {errors.category_id.message}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                Quantity <span style={{ color: '#52525b', fontWeight: 400 }}>(max 100)</span>
              </label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={100}
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">Asset Image</label>
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ minHeight: '140px' }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              {imagePreview ? (
                <div className="relative w-full h-full" style={{ minHeight: '140px' }}>
                  <img
                    src={imagePreview}
                    alt="Asset preview"
                    className="w-full object-cover rounded-xl"
                    style={{ maxHeight: '220px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'rgb(0 0 0 / 0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageFile(null)
                      setImagePreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div
                    className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                    style={{ background: 'rgb(0 0 0 / 0.65)', color: '#a1a1aa', backdropFilter: 'blur(4px)' }}
                  >
                    <ImageIcon className="w-3 h-3" />
                    {imageFile?.name}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                    style={{ background: 'rgb(99 102 241 / 0.08)', border: '1px solid rgb(99 102 241 / 0.15)' }}
                  >
                    <Upload className="w-5 h-5" style={{ color: '#818cf8' }} />
                  </div>
                  <p style={{ color: '#e4e4e7', fontSize: '0.875rem', fontWeight: '500' }}>
                    Drag & drop an image, or <span style={{ color: '#818cf8' }}>click to browse</span>
                  </p>
                  <p style={{ color: '#52525b', fontSize: '0.75rem' }}>
                    PNG, JPG, WEBP up to 10MB
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary mt-1"
                    style={{ fontSize: '0.8125rem' }}
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Browse Files
                  </button>
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#52525b', marginTop: '0.375rem' }}>
              Image is stored locally and linked to each generated asset code.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={createMutation.isPending || !categoryId}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Asset'}
            </button>
            {createMutation.error && (
              <p className="error-text text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {createMutation.error.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
