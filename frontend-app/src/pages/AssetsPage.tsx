import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package2, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth-context";
import { AssetBookingModal } from "../components/AssetBookingModal";
import type { Asset } from "../types";
import { getCatalogAvailabilityLabel } from "../lib/assetStatus";

function AssetCard({
  asset, availableAsset, available, total, categoryName, minDailyRate, onRent,
}: {
  asset: Asset; availableAsset: Asset | null; available: number; total: number;
  categoryName: string; minDailyRate: number | null;
  onRent: (asset: Asset | null, isAvailable: boolean) => void;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isAvailable = available > 0;
  const isElectronics = categoryName === "Electronics";

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: `1px solid ${hovered ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        position: "relative",
        boxShadow: hovered ? "var(--shadow-gold)" : "none",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
        opacity: isAvailable ? 1 : 0.65,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/assets/${asset.id}`)}
    >
      {/* Image */}
      <div style={{ width: "100%", aspectRatio: "3 / 4", overflow: "hidden", position: "relative", background: "var(--color-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {imgError ? (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Package2 size={28} color="var(--color-text-faint)" />
            <span style={{ fontSize: 11, color: "var(--color-text-faint)", fontFamily: "var(--font-sans)" }}>No image</span>
          </div>
        ) : (
          <img
            src={asset.image_url?.trim() || ""}
            alt={asset.name}
            style={{ width: "100%", height: "100%", objectFit: isElectronics ? "contain" : "cover", objectPosition: isElectronics ? "center" : "top", display: "block", padding: isElectronics ? "16px" : "0", boxSizing: "border-box", transform: hovered && !isElectronics ? "scale(1.04)" : "scale(1)", transition: "transform 0.35s ease" }}
            onError={() => setImgError(true)}
          />
        )}

        {!isAvailable && <div style={{ position: "absolute", inset: 0, background: "rgba(30,10,20,0.4)", pointerEvents: "none" }} />}

        {total > 1 && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(30,10,20,0.75)", color: "var(--color-text-muted)", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 2, fontFamily: "var(--font-sans)", letterSpacing: "0.06em" }}>
            {available}/{total}
          </div>
        )}

        {/* RENT NOW overlay */}
        <button
          onClick={(e) => { e.stopPropagation(); onRent(availableAsset, isAvailable); }}
          disabled={!isAvailable}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: isAvailable ? "var(--color-accent-gold)" : "var(--color-text-faint)",
            color: isAvailable ? "var(--color-bg-primary)" : "var(--color-bg-secondary)",
            border: "none", padding: "12px",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em",
            cursor: isAvailable ? "pointer" : "not-allowed",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
          }}
        >
          {isAvailable ? "Rent Now" : "Out of Stock"}
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: "10px 12px 14px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, color: "var(--color-accent-gold)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
          {categoryName}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-primary)", margin: "4px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {asset.name}
        </p>
        {minDailyRate != null && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--color-accent-gold)" }}>₹{minDailyRate}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-text-faint)", letterSpacing: "0.06em" }}>/day</span>
          </div>
        )}
        {(() => {
          const { label, color } = getCatalogAvailabilityLabel(isAvailable, asset.is_in_dry_cleaning, asset.status);
          return (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, margin: "5px 0 0 0", color, letterSpacing: "0.04em" }}>
              ● {label}
            </p>
          );
        })()}
      </div>
    </div>
  );
}

function AssetsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | number>("all");
  const [sortBy, setSortBy] = useState<"featured" | "name">("featured");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loginPromptAsset, setLoginPromptAsset] = useState<Asset | null>(null);

  const assetsQuery = useQuery({ queryKey: ["assets-public"], queryFn: async () => { try { return await api.listAssets(token); } catch { return []; } } });
  const categoriesQuery = useQuery({ queryKey: ["categories-public"], queryFn: async () => { try { return await api.listCategories(token); } catch { return []; } } });
  const rentalPlansQuery = useQuery({ queryKey: ["rental-plans-public"], queryFn: async () => { try { return await api.listRentalPlans(""); } catch { return []; } } });

  const assets = assetsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const rentalPlans = rentalPlansQuery.data ?? [];

  const minDailyRate = useMemo(() => {
    const active = rentalPlans.filter((p) => p.is_active);
    if (active.length === 0) return null;
    return Math.min(...active.map((p) => p.daily_rate));
  }, [rentalPlans]);

  const getCategoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const grouped = useMemo(() => {
    const map = new Map<string, { asset: Asset; availableAsset: Asset | null; available: number; total: number }>();
    for (const a of assets) {
      if (!a.is_active) continue;
      const key = `${a.name.trim().toLowerCase()}__${a.category_id}`;
      const existing = map.get(key);
      const isAvailable = a.status === "available" && !a.is_in_dry_cleaning;
      if (existing) {
        existing.total += 1;
        if (isAvailable) { existing.available += 1; if (!existing.availableAsset) existing.availableAsset = a; }
      } else {
        map.set(key, { asset: a, availableAsset: isAvailable ? a : null, total: 1, available: isAvailable ? 1 : 0 });
      }
    }
    return Array.from(map.values());
  }, [assets]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = grouped.filter(({ asset }) => {
      const matchesSearch = term === "" || asset.name.toLowerCase().includes(term) || asset.asset_code.toLowerCase().includes(term) || getCategoryName(asset.category_id).toLowerCase().includes(term);
      const matchesCategory = selectedCategory === "all" || asset.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    if (sortBy === "name") return [...items].sort((a, b) => a.asset.name.localeCompare(b.asset.name));
    return items;
  }, [grouped, search, selectedCategory, sortBy, categories]);

  const handleRentNow = (asset: Asset | null, isAvailable: boolean) => {
    if (!isAvailable || !asset) return;
    if (!token) { setLoginPromptAsset(asset); return; }
    setSelectedAsset(asset);
  };

  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
      {/* Category tab bar */}
      <div style={{ background: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)", overflowX: "auto", WebkitOverflowScrolling: "touch", position: "sticky", top: 68, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
          {(["all", ...categories] as const).map((item) => {
            const isAll = item === "all";
            const id = isAll ? "all" : (item as { id: number }).id;
            const label = isAll ? "All" : (item as { name: string }).name;
            const active = selectedCategory === id;
            return (
              <button
                key={String(id)}
                onClick={() => setSelectedCategory(id as "all" | number)}
                style={{
                  padding: "14px 20px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.65rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  border: "none",
                  borderBottom: active ? `2px solid var(--color-accent-gold)` : "2px solid transparent",
                  background: "transparent",
                  color: active ? "var(--color-accent-gold)" : "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--color-text-primary)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--color-text-muted)"; }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border)", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)" }}>
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)", width: 13, height: 13, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark"
                style={{ padding: "8px 10px 8px 30px", width: 180, fontSize: 13 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent-gold)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "featured" | "name")}
              className="input-dark"
              style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer" }}
            >
              <option value="featured">Recommended</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px 60px" }}>
        {assetsQuery.isLoading ? (
          <div className="assets-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <div style={{ aspectRatio: "3 / 4" }} className="skeleton-shimmer" />
                <div style={{ padding: "10px 12px 14px" }}>
                  <div style={{ height: 10, borderRadius: 2, marginBottom: 6, width: "50%" }} className="skeleton-shimmer" />
                  <div style={{ height: 13, borderRadius: 2, width: "80%" }} className="skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : assetsQuery.isError ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", background: "rgba(224,112,112,0.06)", border: "1px solid rgba(224,112,112,0.2)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <AlertCircle style={{ width: 32, height: 32, color: "var(--color-error)", marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-error)", margin: "0 0 4px 0", fontFamily: "var(--font-sans)" }}>Failed to load assets</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, fontFamily: "var(--font-sans)" }}>Please check your connection and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <Package2 style={{ width: 36, height: 36, color: "var(--color-text-faint)", marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px 0", fontFamily: "var(--font-sans)" }}>No pieces found</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px 0", fontFamily: "var(--font-sans)" }}>Try a different search or category.</p>
            <button onClick={() => { setSearch(""); setSelectedCategory("all"); }} className="btn-gold" style={{ padding: "8px 20px" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="assets-grid">
            {filtered.map(({ asset, availableAsset, available, total }) => (
              <AssetCard key={asset.id} asset={asset} availableAsset={availableAsset} available={available} total={total} categoryName={getCategoryName(asset.category_id)} minDailyRate={minDailyRate} onRent={handleRentNow} />
            ))}
          </div>
        )}
      </div>

      {/* Login prompt modal */}
      {loginPromptAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,2,8,0.75)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }} onClick={() => setLoginPromptAsset(null)}>
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", boxShadow: "var(--shadow-lg)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLoginPromptAsset(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", padding: 4 }}>
              <X size={18} />
            </button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 8px 0" }}>Sign in to rent</h3>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 20px 0", lineHeight: 1.6 }}>
              Please sign in to rent <strong style={{ color: "var(--color-text-primary)" }}>{loginPromptAsset.name}</strong>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => navigate("/login")} className="btn-gold" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }}>Sign in</button>
              <button onClick={() => setLoginPromptAsset(null)} className="btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "10px 0", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {token && (
        <AssetBookingModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} token={token} onBookingSuccess={() => { setSelectedAsset(null); void assetsQuery.refetch(); }} />
      )}
    </div>
  );
}

export { AssetsPage };
export default AssetsPage;
