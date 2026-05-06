import { Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy, type ReactElement } from "react";
import { AuthProvider, useAuth } from "./auth-context";
import { AppLayout } from "./components/AppLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/HomePage";

// Lazy load all route pages for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const AssetsPage = lazy(() => import("./pages/AssetsPage").then((m) => ({ default: m.AssetsPage })));
const BookingsPage = lazy(() => import("./pages/BookingsPage").then((m) => ({ default: m.BookingsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("./pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

// Lazy load admin pages
const AdminAssetsPage = lazy(() => import("./pages/admin/Assets").then((m) => ({ default: m.AdminAssetsPage })));
const AdminCategoriesPage = lazy(() =>
  import("./pages/admin/Categories").then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminOperationsPage = lazy(() =>
  import("./pages/admin/Operations").then((m) => ({ default: m.AdminOperationsPage }))
);
const AdminPlansPage = lazy(() => import("./pages/admin/Plans").then((m) => ({ default: m.AdminPlansPage })));
const AdminUsersPage = lazy(() => import("./pages/admin/Users").then((m) => ({ default: m.AdminUsersPage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/Dashboard").then((m) => ({ default: m.AdminDashboardPage })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 bg-blue-600 rounded-2xl animate-pulse"></div>
      <div className="mt-4 text-sm font-medium text-gray-500">Loading...</div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const { token, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/assets" replace />;
  }
  return children;
}

// Blocks admins from accessing public routes — redirects them to /admin
function AdminGuardedPublicLayout() {
  const { token, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (token && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <AppLayout />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public and User Routes — admin users are redirected to /admin */}
        <Route element={<AdminGuardedPublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/assets" element={<AssetsPage />} />
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
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dedicated Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="assets" element={<AdminAssetsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="ops" element={<AdminOperationsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
