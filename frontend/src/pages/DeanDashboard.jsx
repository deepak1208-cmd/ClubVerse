import React, { useEffect, useState } from "react";
import { LayoutGrid, Calendar, Star, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api";

export default function DeanDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ padding: 32, color: "#E85D4E" }}>{error}</p>;
  if (!data) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 20 }} />
        <div className="responsive-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 88 }} />)}
        </div>
      </div>
    );
  }

  const chartData = data.events_by_committee.map((c) => ({ name: c.name, events: c.event_count, color: c.color }));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
      <p className="serif" style={{ fontSize: 24, marginBottom: 20 }}>Dean's Dashboard</p>

      <div className="responsive-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Active clubs", value: data.total_clubs, icon: LayoutGrid },
          { label: "Committees", value: data.total_committees, icon: BarChart3 },
          { label: "Events posted", value: data.total_events, icon: Calendar },
          { label: "Avg. rating", value: data.avg_rating ?? "—", icon: Star },
        ].map((s) => (
          <div key={s.label} className="card fade-in" style={{ padding: 14 }}>
            <s.icon size={16} color="#1B7F79" />
            <p className="serif" style={{ fontSize: 22, margin: "8px 0 2px" }}>{s.value}</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card fade-in" style={{ padding: 18, marginBottom: 20 }}>
        <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          <BarChart3 size={16} color="#1B7F79" /> Events posted by committee
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,31,59,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#1B1F3B" }} interval={0} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11, fill: "#1B1F3B" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "white", border: "1px solid rgba(27,31,59,0.12)", borderRadius: 8, fontSize: 13 }}
              cursor={{ fill: "rgba(27,31,59,0.04)" }}
            />
            <Bar dataKey="events" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.inactive_clubs.length > 0 && (
        <div className="card fade-in" style={{ padding: 18 }}>
          <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#E85D4E" /> Clubs with no events posted yet ({data.inactive_clubs.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.inactive_clubs.map((c) => (
              <span key={c.name} className="pill" style={{ background: "#FAF6EF" }}>{c.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
