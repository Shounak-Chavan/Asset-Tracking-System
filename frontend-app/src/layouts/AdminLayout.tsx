import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Wrench, Package2, Tag, ClipboardList, Users,
  LogOut, Bell, Briefcase, Shirt,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

const adminNav = [
  { to: "/admin/ops",          label: "Operations Check", icon: Wrench },
  { to: "/admin/assets",       label: "Asset Manifest",   icon: Package2 },
  { to: "/admin/categories",   label: "Categories",       icon: Tag },
  { to: "/admin/plans",        label: "Rental Logic",     icon: ClipboardList },
  { to: "/admin/users",        label: "User Control",     icon: Users },
  { to: "/admin/dry-cleaning", label: "Dry Cleaning",     icon: Shirt, badgeKey: 'dc' },
];

export function AdminLayout() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pending dry cleaning count for sidebar badge
  const pendingQuery = useQuery({
    queryKey: ['dc-pending-send', token],
    queryFn: () => api.getDryCleaningPendingSend(token!),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  })
  const pendingCount = pendingQuery.data?.length ?? 0

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "inherit" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: "260px",
        minWidth: "260px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "linear-gradient(180deg, #0f172a 0%, #0d1526 100%)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}>

        {/* Logo area */}
        <div style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Briefcase size={16} color="white" />
          </div>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>AdminCore</span>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <p style={{
            padding: "20px 20px 8px",
            fontSize: "10px", fontWeight: 600,
            letterSpacing: "1.2px", color: "#6b7280",
            textTransform: "uppercase", margin: 0,
          }}>
            Main Modules
          </p>

          {adminNav.map(({ to, label, icon: Icon, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                margin: "2px 8px",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: 500,
                color: isActive ? "#ffffff" : "#9ca3af",
                background: isActive ? "rgba(0,201,167,0.08)" : "transparent",
                borderLeft: isActive ? "3px solid #00c9a7" : "3px solid transparent",
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                if (!el.getAttribute("aria-current")) {
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.color = "#e5e7eb";
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (!el.getAttribute("aria-current")) {
                  el.style.background = "transparent";
                  el.style.color = "#9ca3af";
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} color={isActive ? "#60a5fa" : "currentColor"} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badgeKey === 'dc' && pendingCount > 0 && (
                    <span style={{
                      background: '#f59e0b', color: '#fff',
                      fontSize: '10px', fontWeight: 700,
                      padding: '1px 6px', borderRadius: 999, lineHeight: '16px',
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom section */}
        <div style={{
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "16px",
          flexShrink: 0,
        }}>
          {/* User info row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", fontWeight: 600, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#e5e7eb", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "1px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", borderRadius: "8px",
              fontSize: "13px", fontWeight: 500, color: "#9ca3af",
              background: "transparent", border: "none", cursor: "pointer",
              width: "100%", marginTop: "8px", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* TOPBAR */}
        <header style={{
          height: "56px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,201,167,0.3)",
          boxShadow: "0 1px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,201,167,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}>
          {/* Left: branding */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827", lineHeight: 1.2 }}>AdminCore</span>
            <span style={{ fontSize: "9px", letterSpacing: "1.5px", color: "#9ca3af", display: "block", textTransform: "uppercase" }}>System V1</span>
          </div>

          {/* Right: bell */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              aria-label="Notifications"
              style={{
                position: "relative", width: "34px", height: "34px",
                borderRadius: "8px", background: "#f3f4f6",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#6b7280",
              }}
            >
              <Bell size={16} />
              {pendingCount > 0 && (
                <span style={{
                  position: "absolute", top: "5px", right: "5px",
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#ef4444",
                }} />
              )}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          background: "#f0f4f8",
          padding: "32px 36px",
          minHeight: "calc(100vh - 56px)",
        }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
