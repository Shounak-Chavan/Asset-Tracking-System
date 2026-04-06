import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import { saveAssetImage } from '../../imageStore'

const schema = z.object({
  name: z.string().min(2, 'Asset name is required'),
  description: z.string().min(2, 'Description is required'),
  category_id: z.number().int().positive('Category is required'),
  quantity: z.number().int().min(1).max(100),
  image_url: z.url('Enter a valid image URL'),
})

type FormValues = z.infer<typeof schema>

export function AdminAssetsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
    },
  })

  const previewImage = useWatch({ control, name: 'image_url' })

  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: async () => {
      if (!token) {
        return []
      }
      return api.listCategories(token)
    },
    enabled: Boolean(token),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      if (!token) {
        throw new Error('No auth token')
      }
      const created = await api.createAsset(token, {
        name: payload.name,
        description: payload.description,
        category_id: payload.category_id,
        quantity: payload.quantity,
      })
      created.forEach((asset) => saveAssetImage(asset.asset_code, payload.image_url))
      return created
    },
    onSuccess: async (created) => {
      setNotice(`Created ${created.length} asset(s) successfully`)
      reset({ quantity: 1 } as Partial<FormValues>)
      await queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])

  if (categoriesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="card">
          <div className="skeleton h-4 w-48 rounded" />
        </div>
      </div>
    )
  }

  if (categoriesQuery.isError) {
    return (
      <div className="flex flex-col gap-6">
        <div className="card">
          <p className="error-text">Failed to load categories. Please retry.</p>
        </div>
      </div>
    )
  }

  const onSubmit = async (values: FormValues) => {
    setNotice('')
    await createMutation.mutateAsync(values)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Manager</h1>
          <p className="page-subtitle">
            Add assets with consistent metadata and a preview image mapped by asset code.
          </p>
        </div>
      </div>

      <div className="card">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Asset Name</label>
              <input className="form-input" type="text" placeholder="e.g. MacBook Pro" {...register('name')} />
              {errors.name && <p className="error-text text-xs">{errors.name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" type="text" placeholder="Short description" {...register('description')} />
              {errors.description && <p className="error-text text-xs">{errors.description.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" {...register('category_id', { valueAsNumber: true })} defaultValue="">
                <option value="" disabled>Select category</option>
                {categoryOptions.length === 0 && <option value="">No categories available</option>}
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="error-text text-xs">{errors.category_id.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min={1} max={100} {...register('quantity', { valueAsNumber: true })} />
              {errors.quantity && <p className="error-text text-xs">{errors.quantity.message}</p>}
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Asset Image URL</label>
              <input className="form-input" type="url" placeholder="https://..." {...register('image_url')} />
              {errors.image_url && <p className="error-text text-xs">{errors.image_url.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Asset'}
            </button>
            {createMutation.error && <p className="error-text text-xs">{createMutation.error.message}</p>}
            {notice && <p className="success-text text-xs">{notice}</p>}
          </div>
        </form>

        {previewImage && (
          <>
            <div className="divider" />
            <div className="flex flex-col gap-2">
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#e4e4e7' }}>Image Preview</h3>
              <img
                className="w-full max-w-sm h-36 object-cover rounded-xl"
                style={{ border: '1px solid #27272a' }}
                src={previewImage}
                alt="Asset preview"
                onError={(event) => {
                  event.currentTarget.src =
                    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'
                }}
              />
              <p className="muted text-xs">Use a direct image URL so users can visually identify assets.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
