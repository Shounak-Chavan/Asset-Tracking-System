import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../auth-context";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export function AdminCategoriesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [notice, setNotice] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => api.listCategories(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: async () => api.createCategory(token!, { name }),
    onSuccess: async () => {
      setName("");
      setNotice("Category created successfully!");
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setTimeout(() => setNotice(""), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; name: string }) =>
      api.updateCategory(token!, payload.id, { name: payload.name }),
    onSuccess: async () => {
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.deleteCategory(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const categories = categoriesQuery.data ?? [];

  return (
    /* Outer column — fixed max-width so both sections align */
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "720px" }}>

      {/* ── Page header ── */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
          Categories
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px", marginBottom: 0 }}>
          Organize and manage classification groups for assets.
        </p>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert variant="success" message={notice} onDismiss={() => setNotice("")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create category card ── */}
      <div style={{
        background: "#2D1020",
        border: "1px solid rgba(201,169,110,0.15)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}>
        {/* Label sits clearly above the input row */}
        <label style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "#C9A96E",
          marginBottom: "8px",
        }}>
          Create Category
        </label>

        {/* Input + button on the same row, fully decoupled */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Laptops, Hardware, Accessories..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !createMutation.isPending)
                createMutation.mutate();
            }}
            style={{
              flex: 1,
              height: "40px",
              padding: "0 12px",
              fontSize: "13.5px",
              color: "#F5ECD7",
              background: "#1A0A12",
              border: "1px solid rgba(201,169,110,0.3)",
              borderRadius: "8px",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#C9A96E";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
            }}
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            style={{
              background: "transparent",
              border: "1.5px solid #C9A96E",
              color: "#C9A96E",
              borderRadius: "4px",
              padding: "0 16px",
              height: "40px",
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: !name.trim() || createMutation.isPending ? "not-allowed" : "pointer",
              opacity: !name.trim() || createMutation.isPending ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!(!name.trim() || createMutation.isPending)) {
                e.currentTarget.style.background = "#C9A96E";
                e.currentTarget.style.color = "#1E0A14";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#C9A96E";
            }}
          >
            <Plus size={15} />
            Add
          </button>
        </div>

        {createMutation.error && (
          <div style={{ marginTop: "12px" }}>
            <Alert variant="error" message={createMutation.error.message} />
          </div>
        )}
      </div>

      {/* ── Category list card ── */}
      <div style={{
        background: "#2D1020",
        border: "1px solid rgba(201,169,110,0.15)",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}>
        {/* List header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(201,169,110,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#F5ECD7" }}>
            All Categories
          </span>
          {categories.length > 0 && (
            <span style={{
              fontSize: "11px", fontWeight: 600,
              color: "#C9A96E", background: "rgba(201,169,110,0.1)",
              padding: "2px 8px", borderRadius: "999px",
              border: "1px solid rgba(201,169,110,0.2)",
            }}>
              {categories.length}
            </span>
          )}
        </div>

        {(updateMutation.error || deleteMutation.error) && (
          <div style={{ padding: "16px 24px 0" }}>
            <Alert
              variant="error"
              message={updateMutation.error?.message || deleteMutation.error?.message || ""}
            />
          </div>
        )}

        {/* List rows */}
        <div>
          {categoriesQuery.isError ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#ef4444", fontSize: "13px" }}>
              Failed to load categories.
            </div>
          ) : categories.length === 0 && !categoriesQuery.isLoading ? (
            <div style={{
              padding: "56px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "10px",
                background: "rgba(201,169,110,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FolderKanban size={20} color="#6B5548" />
              </div>
              <p style={{ fontSize: "13px", color: "#9E8070", margin: 0 }}>
                No categories yet. Add one above.
              </p>
            </div>
          ) : (
            categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  /* 24px padding on all sides — right edge has full 24px clearance */
                  padding: "14px 24px",
                  borderBottom: i < categories.length - 1 ? "1px solid rgba(201,169,110,0.1)" : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#3A1528"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Left: index badge + name */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    background: "#3A1528", border: "1px solid rgba(201,169,110,0.3)",
                    color: "#C9A96E", fontSize: "11px", fontWeight: 700,
                    fontFamily: "monospace",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>

                  {editingId === cat.id ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editingName.trim())
                          updateMutation.mutate({ id: cat.id, name: editingName.trim() });
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      style={{
                        height: "36px",
                        padding: "0 10px",
                        fontSize: "13.5px",
                        color: "#F5ECD7",
                        background: "#1A0A12",
                        border: "1px solid #C9A96E",
                        borderRadius: "8px",
                        outline: "none",
                        boxShadow: "0 0 0 3px rgba(201,169,110,0.12)",
                        maxWidth: "280px",
                        width: "100%",
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: "13.5px", fontWeight: 500, color: "#F5ECD7",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {cat.name}
                    </span>
                  )}
                </div>

                {/* Right: action buttons — always 24px from the right edge via parent padding */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "16px" }}>
                  {editingId === cat.id ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!editingName.trim() || updateMutation.isPending}
                        onClick={() => {
                          if (editingName.trim())
                            updateMutation.mutate({ id: cat.id, name: editingName.trim() });
                        }}
                      >
                        <Check size={13} />
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        <X size={13} />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "6px 10px", borderRadius: "6px",
                          fontSize: "12px", fontWeight: 500, color: "#C9A96E",
                          background: "transparent", border: "none", cursor: "pointer",
                          transition: "background 0.12s, color 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,169,110,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Pencil size={13} />
                        Rename
                      </button>
                      <button
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete category "${cat.name}"?`))
                            deleteMutation.mutate(cat.id);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "6px 10px", borderRadius: "6px",
                          fontSize: "12px", fontWeight: 500, color: "#E07070",
                          background: "transparent", border: "none", cursor: "pointer",
                          transition: "background 0.12s",
                          opacity: deleteMutation.isPending ? 0.5 : 1,
                          pointerEvents: deleteMutation.isPending ? "none" : "auto",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(224,112,112,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
