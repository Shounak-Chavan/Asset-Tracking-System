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
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>
          Categories
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px", marginBottom: 0 }}>
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
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}>
        {/* Label sits clearly above the input row */}
        <label style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "#374151",
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
              color: "#111827",
              background: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
            }}
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            style={{ height: "40px", paddingLeft: "16px", paddingRight: "16px", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <Plus size={15} />
            Add
          </Button>
        </div>

        {createMutation.error && (
          <div style={{ marginTop: "12px" }}>
            <Alert variant="error" message={createMutation.error.message} />
          </div>
        )}
      </div>

      {/* ── Category list card ── */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}>
        {/* List header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>
            All Categories
          </span>
          {categories.length > 0 && (
            <span style={{
              fontSize: "11px", fontWeight: 600,
              color: "#6b7280", background: "#f3f4f6",
              padding: "2px 8px", borderRadius: "999px",
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
                background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FolderKanban size={20} color="#9ca3af" />
              </div>
              <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
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
                  borderBottom: i < categories.length - 1 ? "1px solid #f3f4f6" : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Left: index badge + name */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    background: "#eff6ff", border: "1px solid #bfdbfe",
                    color: "#2563eb", fontSize: "11px", fontWeight: 700,
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
                        color: "#111827",
                        background: "#ffffff",
                        border: "1px solid #3b82f6",
                        borderRadius: "8px",
                        outline: "none",
                        boxShadow: "0 0 0 3px rgba(59,130,246,0.12)",
                        maxWidth: "280px",
                        width: "100%",
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: "13.5px", fontWeight: 500, color: "#111827",
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
                          fontSize: "12px", fontWeight: 500, color: "#2563eb",
                          background: "transparent", border: "none", cursor: "pointer",
                          transition: "background 0.12s, color 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
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
                          fontSize: "12px", fontWeight: 500, color: "#dc2626",
                          background: "transparent", border: "none", cursor: "pointer",
                          transition: "background 0.12s",
                          opacity: deleteMutation.isPending ? 0.5 : 1,
                          pointerEvents: deleteMutation.isPending ? "none" : "auto",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
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
