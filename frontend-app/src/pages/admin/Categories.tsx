import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'

export function AdminCategoriesPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

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
      await queryClient.invalidateQueries({ queryKey: ['categories', token] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; name: string }) => {
      if (!token) throw new Error('Missing token')
      return api.updateCategory(token, payload.id, { name: payload.name })
    },
    onSuccess: async () => {
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

  if (categoriesQuery.isLoading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg p-6">Loading categories...</div>
      </section>
    )
  }

  if (categoriesQuery.isError) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg p-6">Failed to load categories.</div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Admin Categories</h1>
        <p className="text-sm text-zinc-400">Create, rename, and delete categories for asset organization.</p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              className="form-input h-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new category name"
            />
          </div>
          <button
            className="btn btn-primary h-10 px-5"
            onClick={() => createMutation.mutate()}
            type="button"
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Category'}
          </button>
        </div>

        {(createMutation.error || updateMutation.error || deleteMutation.error) && (
          <p className="error-text">
            {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
          </p>
        )}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoriesQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    No categories found.
                  </td>
                </tr>
              )}
              {categoriesQuery.data?.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          const next = window.prompt('New name', category.name)
                          if (next && next.trim()) {
                            updateMutation.mutate({ id: category.id, name: next.trim() })
                          }
                        }}
                      >
                        {updateMutation.isPending ? 'Renaming...' : 'Rename'}
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete category ${category.name}?`)) {
                            deleteMutation.mutate(category.id)
                          }
                        }}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
