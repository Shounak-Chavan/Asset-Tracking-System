import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package2,
  CalendarCheck2,
  Users,
  FolderKanban,
  CreditCard,
  Wrench,
  Bell,
  Search,
  LogOut,
  User,
  ChevronLeft,
  Menu,
  Settings,
  Shield,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../auth-context'

interface NavItemDef {
  to: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  authRequired?: boolean
  badge?: string
}

const mainNav: NavItemDef[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard />, authRequired: false },
  { to: '/assets', label: 'Assets', icon: <Package2 />, authRequired: true },
  { to: '/bookings', label: 'My Bookings', icon: <CalendarCheck2 />, authRequired: true },
  { to: '/profile', label: 'Profile', icon: <User />, authRequired: true },
]

const adminNav: NavItemDef[] = [
  { to: '/admin/assets', label: 'Asset Manager', icon: <Package2 />, adminOnly: true },
  { to: '/admin/categories', label: 'Categories', icon: <FolderKanban />, adminOnly: true },
  { to: '/admin/plans', label: 'Rental Plans', icon: <CreditCard />, adminOnly: true },
  { to: '/admin/users', label: 'Users', icon: <Users />, adminOnly: true },
  { to: '/admin/ops', label: 'Operations', icon: <Wrench />, adminOnly: true },
]

function SidebarNavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      {item.icon}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            className="nav-item-label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge && (
        <span className="nav-badge">{item.badge}</span>
      )}
    </NavLink>
  )
}

export function AppLayout() {
  const { user, token, logout, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'admin'
  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path === '/assets') return 'Assets'
    if (path === '/bookings') return 'My Bookings'
    if (path === '/profile') return 'Profile'
    if (path.startsWith('/admin/assets')) return 'Asset Manager'
    if (path.startsWith('/admin/categories')) return 'Categories'
    if (path.startsWith('/admin/plans')) return 'Rental Plans'
    if (path.startsWith('/admin/users')) return 'Users'
    if (path.startsWith('/admin/ops')) return 'Operations'
    return 'AssetFlow'
  }

  const sidebarWidth = sidebarCollapsed ? 64 : 240

  return (
    <div className="page-shell">
      {/* ── Sidebar ── */}
      <motion.aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 overflow-hidden"
              >
                <span className="sidebar-logo-text">AssetFlow</span>
                <div className="sidebar-logo-dot" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Nav */}
        <nav className="sidebar-nav">
          {!sidebarCollapsed && (
            <p className="sidebar-section">Main Menu</p>
          )}
          {mainNav.map((item) => {
            if (item.authRequired && !token) return null
            return <SidebarNavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
          })}

          {/* Auth links when logged out */}
          {!token && (
            <>
              {!sidebarCollapsed && <p className="sidebar-section">Account</p>}
              <SidebarNavItem item={{ to: '/login', label: 'Login', icon: <User /> }} collapsed={sidebarCollapsed} />
              <SidebarNavItem item={{ to: '/register', label: 'Register', icon: <Settings /> }} collapsed={sidebarCollapsed} />
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2 px-3 py-2 mt-4">
                  <Shield className="w-3.5 h-3.5 text-primary-500" />
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest">
                    Admin
                  </p>
                </div>
              )}
              {sidebarCollapsed && <div className="my-2 border-t border-surface-800" />}
              {adminNav.map((item) => (
                <SidebarNavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
              ))}
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="nav-item w-full"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Top Navbar ── */}
      <div
        className="topbar"
        style={{ left: sidebarWidth, transition: 'left 0.25s ease' }}
      >
        {/* Mobile toggle */}
        <button className="topbar-icon-btn lg:hidden" onClick={() => setSidebarCollapsed((p) => !p)}>
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <span className="text-sm font-semibold text-white hidden sm:block">{getPageTitle()}</span>

        {/* Search */}
        <div className="topbar-search hidden md:flex">
          <Search className="w-4 h-4 text-surface-500 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets, bookings..."
          />
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          {/* Notification bell */}
          <button className="topbar-icon-btn">
            <Bell className="w-5 h-5" />
            <span className="notif-dot" />
          </button>

          {/* Avatar dropdown */}
          {token ? (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-800 transition-all"
                onClick={() => setDropdownOpen((p) => !p)}
              >
                <div className="avatar-btn">{userInitials}</div>
                {!sidebarCollapsed && (
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-semibold text-white leading-none">
                      {user?.full_name?.split(' ')[0] ?? 'User'}
                    </span>
                    <span className="text-[10px] text-surface-500 mt-0.5 capitalize">{user?.role}</span>
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-surface-500 hidden sm:block" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className="px-4 py-3 border-b border-surface-700">
                      <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      className="dropdown-item w-full"
                      onClick={() => { setDropdownOpen(false); navigate('/profile') }}
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item w-full text-rose-400 hover:text-rose-300"
                      onClick={() => void handleLogout()}
                      disabled={loading}
                    >
                      <LogOut className="w-4 h-4" /> {loading ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button className="btn-primary btn-sm btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main
        className="content-area"
        style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.25s ease' }}
      >
        <div className="content-inner">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  )
}
