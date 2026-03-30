import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-white">Admin Console</h1>
          <p className="text-xs text-zinc-400">Manage assets, categories, plans, users, and operations.</p>
        </div>
      </header>
      <Outlet />
    </section>
  )
}