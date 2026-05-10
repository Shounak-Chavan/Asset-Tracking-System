import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "calc(100vh - 68px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--color-bg-primary)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 400, width: "100%" }}>
        <Crown size={32} color="var(--color-accent-gold)" strokeWidth={1.5} style={{ margin: "0 auto 20px" }} />
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 100,
            fontWeight: 600,
            color: "var(--color-border)",
            lineHeight: 1,
            marginBottom: 0,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 28,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: "12px 0 8px 0",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--color-text-muted)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-ghost" style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "10px 20px" }} onClick={() => navigate(-1)}>
            Go back
          </button>
          <button className="btn-gold" style={{ padding: "10px 24px" }} onClick={() => navigate("/")}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
