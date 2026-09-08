import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Users, Star, CalendarX2, Sparkles } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { EventGridSkeleton } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";

export default function Feed() {
  const { user } = useAuth();
  const [committees, setCommittees] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeClub, setActiveClub] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCommittees().then(setCommittees).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeClub) params.club = activeClub.id;
    if (query) params.search = query;

    const timeout = setTimeout(() => {
      api.getEvents(params).then(setEvents).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeClub, query]);

  return (
    <div>
      {!user && (
        <div style={{ borderBottom: "1px solid rgba(27,31,59,0.08)", background: "linear-gradient(180deg, rgba(242,169,59,0.08), transparent)" }}>
          <div className="fade-in" style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px 40px", textAlign: "center" }}>
            <div className="pill" style={{ background: "rgba(242,169,59,0.15)", color: "#B87A1F", marginBottom: 14 }}>
              <Sparkles size={13} /> 37 clubs, one feed
            </div>
            <p className="serif" style={{ fontSize: 32, lineHeight: 1.2, marginBottom: 10 }}>
              Every club event at Poornima, in one place.
            </p>
            <p style={{ fontSize: 15, opacity: 0.6, marginBottom: 20 }}>
              Stop checking a dozen WhatsApp groups. Browse, RSVP, and see what's actually worth going to.
            </p>
            <Link to="/signup"><button className="btn-primary" style={{ padding: "12px 24px" }}>Get started — it's free</button></Link>
          </div>
        </div>
      )}

      <div className="responsive-grid" style={{ display: "flex", gap: 32, padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <aside className="responsive-sidebar" style={{ width: 220, flexShrink: 0, maxHeight: "80vh", overflowY: "auto", position: "sticky", top: 90, alignSelf: "flex-start" }}>
          <button
            onClick={() => setActiveClub(null)}
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, marginBottom: 8,
              background: !activeClub ? "#1B1F3B" : "transparent", color: !activeClub ? "#FAF6EF" : "#1B1F3B",
              border: "none", fontSize: 14, fontWeight: 600,
            }}
          >
            All clubs
          </button>
          {committees.map((committee) => (
            <div key={committee.id} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.45, letterSpacing: 0.3, margin: "6px 0 4px 10px" }}>
                {committee.name.toUpperCase()}
              </p>
              {committee.clubs.map((club) => {
                const isActive = activeClub?.id === club.id;
                return (
                  <button
                    key={club.id}
                    onClick={() => setActiveClub(club)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                      padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 13,
                      background: isActive ? "#1B1F3B" : "transparent", color: isActive ? "#FAF6EF" : "#1B1F3B",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: committee.color, flexShrink: 0 }} />
                    {club.name}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", flex: 1 }}>
              <Search size={16} opacity={0.5} />
              <input
                className="input"
                style={{ border: "none", padding: 0 }}
                placeholder="Search events or clubs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {/* Mobile club filter, since sidebar is hidden on small screens */}
            <select
              className="input show-mobile"
              style={{ width: "auto", display: "none" }}
              value={activeClub?.id || ""}
              onChange={(e) => {
                const club = committees.flatMap((c) => c.clubs).find((c) => String(c.id) === e.target.value);
                setActiveClub(club || null);
              }}
            >
              <option value="">All clubs</option>
              {committees.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {c.clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {error && <p style={{ color: "#E85D4E" }}>{error}</p>}

          {loading ? (
            <EventGridSkeleton />
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="No events yet"
              subtitle={activeClub ? `${activeClub.name} hasn't posted anything yet — check back soon.` : "Try a different search or club filter."}
            />
          ) : (
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {events.map((ev, i) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card fade-in"
                  style={{ overflow: "hidden", display: "block", animationDelay: `${i * 30}ms` }}
                >
                  <div style={{ height: 56, background: ev.tag_color, opacity: 0.88 }} />
                  <div style={{ padding: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: ev.tag_color, marginBottom: 4 }}>{ev.club_name.toUpperCase()}</p>
                    <p className="serif" style={{ fontSize: 15, marginBottom: 8, lineHeight: 1.3 }}>{ev.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, opacity: 0.6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {ev.event_date}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> {ev.attending}</span>
                      {ev.avg_rating && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} /> {ev.avg_rating}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
