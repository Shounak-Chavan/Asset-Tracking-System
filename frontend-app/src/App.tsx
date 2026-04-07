import { Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy, type ReactElement } from 'react'
import { AuthProvider, useAuth } from './auth-context'
import { AppLayout } from './components/AppLayout.tsx'
import { AdminLayout } from './layouts/AdminLayout.tsx'

// Lazy load all route pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage.tsx').then(m => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage.tsx').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage.tsx').then(m => ({ default: m.RegisterPage })))
const AssetsPage = lazy(() => import('./pages/AssetsPage.tsx').then(m => ({ default: m.AssetsPage })))
const BookingsPage = lazy(() => import('./pages/BookingsPage.tsx').then(m => ({ default: m.BookingsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx').then(m => ({ default: m.ProfilePage })))

// Lazy load admin pages
const AdminAssetsPage = lazy(() => import('./pages/admin/Assets.tsx').then(m => ({ default: m.AdminAssetsPage })))
const AdminCategoriesPage = lazy(() => import('./pages/admin/Categories.tsx').then(m => ({ default: m.AdminCategoriesPage })))
const AdminOperationsPage = lazy(() => import('./pages/admin/Operations.tsx').then(m => ({ default: m.AdminOperationsPage })))
const AdminPlansPage = lazy(() => import('./pages/admin/Plans.tsx').then(m => ({ default: m.AdminPlansPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/Users.tsx').then(m => ({ default: m.AdminUsersPage })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-indigo-600 rounded-lg"></div>
        <div className="text-sm text-zinc-400">Loading page...</div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminRoute({ children }: { children: ReactElement }) {
  const { token, user } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/assets" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="assets" element={<AdminAssetsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="ops" element={<AdminOperationsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
