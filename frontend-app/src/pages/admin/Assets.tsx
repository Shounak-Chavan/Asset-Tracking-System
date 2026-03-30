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
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900">
          Loading categories for asset form...
        </div>
      </section>
    )
  }

  if (categoriesQuery.isError) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900">
          Failed to load categories. Please retry.
        </div>
      </section>
    )
  }

  const onSubmit = async (values: FormValues) => {
    setNotice('')
    await createMutation.mutateAsync(values)
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Admin Asset Manager</h1>
        <p className="text-sm text-zinc-400">
          Add assets with consistent metadata and a preview image mapped by asset code.
        </p>
      </header>

      <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900 space-y-8">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Asset Name</label>
              <input className="form-input h-10" type="text" {...register('name')} />
              {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input h-10" type="text" {...register('description')} />
              {errors.description && <p className="text-xs text-rose-400">{errors.description.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select h-10" {...register('category_id', { valueAsNumber: true })} defaultValue="">
                <option value="" disabled>
                  Select category
                </option>
                {categoryOptions.length === 0 && <option value="">No categories available</option>}
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-xs text-rose-400">{errors.category_id.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input h-10" type="number" min={1} max={100} {...register('quantity', { valueAsNumber: true })} />
              {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity.message}</p>}
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Asset Image URL</label>
              <input className="form-input h-10" type="url" placeholder="https://..." {...register('image_url')} />
              {errors.image_url && <p className="text-xs text-rose-400">{errors.image_url.message}</p>}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-start gap-3">
            <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Asset'}
            </button>
          </div>

          <div className="min-h-5 space-y-1">
            {createMutation.error && <p className="text-xs text-rose-400">{createMutation.error.message}</p>}
            {notice && <p className="text-xs text-emerald-400">{notice}</p>}
          </div>
        </form>

        <div className="space-y-3 border-t border-zinc-800 pt-6">
          <h3 className="text-base font-semibold text-white">Image Preview</h3>
          <img
            className="w-full max-w-md h-40 object-cover rounded-xl border border-zinc-800 mt-2"
            src={previewImage || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
            alt="Asset preview"
            onError={(event) => {
              event.currentTarget.src =
                'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'
            }}
          />
          <p className="text-xs text-zinc-500">Use a direct image URL so users can visually identify assets.</p>
        </div>
      </div>
    </section>
  )
}
