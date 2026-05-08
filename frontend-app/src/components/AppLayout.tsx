import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth-context";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

function getInitials(name: string | undefined) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function AppLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/assets", label: "Catalog" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
    { to: "/terms", label: "Terms" },
  ];
  const authLinks = [{ to: "/bookings", label: "My Bookings" }];
  const adminLinks = user?.role === 'admin' ? [{ to: "/admin", label: "Admin" }] : [];
  const navLinks = token ? [...publicLinks, ...authLinks, ...adminLinks] : publicLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 overflow-x-hidden" style={{ background: '#f0f4f8' }}>
      <header className="header-glass" style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
        <div className="page-container">
          <div className="h-[64px] flex items-center justify-between gap-4">

            {/* Logo */}
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <img src="/logo.svg" alt="AssetTrack Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8 shrink-0">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    cn("flex items-center text-sm transition-colors pb-[2px]",
                      isActive
                        ? "font-semibold border-b-2"
                        : "text-gray-600 font-medium"
                    )
                  }
                  style={({ isActive }) => isActive
                    ? { color: '#1a3a6b', borderBottomColor: '#00c9a7' }
                    : undefined
                  }
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1a3a6b' }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    if (!el.classList.contains('border-b-2')) el.style.color = ''
                  }}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {(!token || user?.role === 'dry_cleaner') && (
              <NavLink
                to="/dry-cleaning/login"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 13px', borderRadius: '8px',
                  border: '1.5px solid #99f6e4', background: '#f0fdfa',
                  color: '#0d9488', fontSize: '13px', fontWeight: 500,
                  textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ccfbf1'; e.currentTarget.style.borderColor = '#2dd4bf' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.borderColor = '#99f6e4' }}
              >
                🧺 Staff Portal
              </NavLink>
              )}
              {token ? (
                <>
                  <button
                    onClick={() => navigate("/profile")}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: '#0f172a', border: 'none',
                      borderRadius: '100px', padding: '6px 14px 6px 8px',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a' }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#00c9a7', color: '#fff',
                      fontSize: '12px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {getInitials(user?.full_name)}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }} className="hidden lg:inline">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: '#fff', border: '1.5px solid #fca5a5',
                      borderRadius: '8px', padding: '7px 14px',
                      fontSize: '13px', fontWeight: 500, color: '#ef4444',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      background: 'transparent', border: '1.5px solid #d1d5db',
                      color: '#374151', borderRadius: '8px', padding: '8px 20px',
                      fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1a3a6b'; e.currentTarget.style.color = '#1a3a6b'; e.currentTarget.style.background = '#f0f4ff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'transparent' }}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    style={{
                      background: '#00c9a7', border: '1.5px solid #00c9a7',
                      color: '#fff', borderRadius: '8px', padding: '8px 20px',
                      fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#00b396'; e.currentTarget.style.borderColor = '#00b396'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,201,167,0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#00c9a7'; e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0 ml-auto"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
            >
              <div className="px-4 py-5 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      cn("text-sm font-semibold px-4 py-2.5 rounded-lg",
                        isActive ? "bg-teal-50 text-[#1a3a6b]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="border-t border-gray-100 my-2" />
                {token ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" className="w-full" onClick={() => navigate("/profile")}>My Profile</Button>
                    <Button variant="outline" className="w-full text-red-600 hover:border-red-200" onClick={handleLogout}>Sign out</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>Sign in</Button>
                    <Button className="w-full" onClick={() => navigate("/register")} style={{ background: '#00c9a7', borderColor: '#00c9a7' }}>Get started</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      <footer style={{ background: '#0f172a', color: 'rgba(255,255,255,0.7)', padding: '48px 24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px' }} className="footer-cols">
            {/* Col 1 — Brand */}
            <div>
              <img
                src="/logo.svg"
                alt="AssetTrack"
                style={{ height: 36, width: 'auto', filter: 'brightness(0) invert(1)' }}
              />
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>
                Rent smarter. Manage better.
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '24px' }}>
                © 2026 AssetTrack. All rights reserved.
              </p>
            </div>

            {/* Col 2 — Product */}
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', fontWeight: 600, marginBottom: '16px' }}>Product</p>
              <NavLink to="/assets" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Catalog</NavLink>
              <NavLink to="/bookings" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>My Bookings</NavLink>
              <a href="#how-it-works" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>How it works</a>
            </div>

            {/* Col 3 — Company */}
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', fontWeight: 600, marginBottom: '16px' }}>Company</p>
              <NavLink to="/about" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>About Us</NavLink>
              <NavLink to="/contact" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Contact</NavLink>
              <NavLink to="/terms" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Terms</NavLink>
            </div>

            {/* Col 4 — Account */}
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', fontWeight: 600, marginBottom: '16px' }}>Account</p>
              <NavLink to="/login" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Sign In</NavLink>
              <NavLink to="/register" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>Create Account</NavLink>
              <NavLink to="/profile" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'block', marginBottom: '10px' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>My Profile</NavLink>
            </div>
          </div>

          <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>© 2026 AssetTrack. All rights reserved.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <NavLink
                to="/dry-cleaning/login"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              >
                Dry Cleaning Staff Login
              </NavLink>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Made with ♥ in India</span>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) { .footer-cols { grid-template-columns: 1fr 1fr !important; } }
          @media (max-width: 480px) { .footer-cols { grid-template-columns: 1fr !important; } }
        `}</style>
      </footer>
    </div>
  );
}
