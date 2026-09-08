import React from "react";

export function EventCardSkeleton() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="skeleton" style={{ height: 56, borderRadius: 0 }} />
      <div style={{ padding: 14 }}>
        <div className="skeleton" style={{ height: 10, width: "40%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: "85%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 10, width: "60%" }} />
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6 }) {
  return (
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
