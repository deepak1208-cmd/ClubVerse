import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Mail } from "lucide-react";
import { api } from "../api";
import EmptyState from "../components/EmptyState";

export default function Participants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getParticipants(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px" }}>
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back
      </button>

      {error && <p style={{ color: "#E85D4E" }}>{error}</p>}

      {!data ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      ) : (
        <>
          <p className="serif" style={{ fontSize: 22, marginBottom: 4 }}>{data.event_title}</p>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} /> {data.count} participant{data.count === 1 ? "" : "s"}
          </p>

          {data.participants.length === 0 ? (
            <EmptyState icon={Users} title="No RSVPs yet" subtitle="Once students start RSVPing, they'll show up here." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.participants.map((p) => (
                <div key={p.id} className="card fade-in" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                    <p style={{ fontSize: 12, opacity: 0.6, display: "flex", alignItems: "center", gap: 4 }}><Mail size={11} /> {p.email}</p>
                  </div>
                  <p style={{ fontSize: 11, opacity: 0.45 }}>{p.rsvp_at?.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
