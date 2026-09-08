import React from "react";

export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink)" }}>
      {Icon && (
        <div style={{ display: "inline-flex", padding: 14, borderRadius: 99, background: "rgba(27,31,59,0.05)", marginBottom: 14 }}>
          <Icon size={22} opacity={0.4} />
        </div>
      )}
      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, opacity: 0.55, marginBottom: action ? 16 : 0 }}>{subtitle}</p>}
      {action}
    </div>
  );
}
