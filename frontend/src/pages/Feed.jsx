import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Users, Star, CalendarX2 } from "lucide-react";
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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Compact Page Introduction */}
      <div style={{ 
        maxWidth: 1280, 
        margin: "0 auto", 
        padding: "32px 32px 24px" 
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
          Discover campus events
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 500 }}>
          Browse upcoming events from all clubs. Filter by club or search for specific events.
        </p>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: "flex", 
        gap: 32, 
        padding: "0 32px 40px", 
        maxWidth: 1280, 
        margin: "0 auto" 
      }}>
        {/* Sidebar - Club Filters */}
        <aside 
          className="responsive-sidebar" 
          style={{ 
            width: 240, 
            flexShrink: 0, 
            maxHeight: "calc(100vh - 180px)", 
            overflowY: "auto", 
            position: "sticky", 
            top: 80, 
            alignSelf: "flex-start"
          }}
        >
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Filter by Club
            </h3>
            <button
              onClick={() => setActiveClub(null)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 8, marginBottom: 8,
                background: !activeClub ? "var(--primary-light)" : "transparent",
                color: !activeClub ? "var(--primary)" : "var(--text-secondary)",
                border: !activeClub ? "1px solid var(--primary)" : "1px solid var(--border-light)",
                fontSize: 14, fontWeight: !activeClub ? 600 : 400,
                transition: "all var(--transition-fast)"
              }}
            >
              All clubs
            </button>
            {committees.map((committee) => (
              <div key={committee.id} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", margin: "12px 0 8px 12px", textTransform: "uppercase" }}>
                  {committee.name}
                </p>
                {committee.clubs.map((club) => {
                  const isActive = activeClub?.id === club.id;
                  return (
                    <button
                      key={club.id}
                      onClick={() => setActiveClub(club)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                        padding: "10px 14px", borderRadius: 8, border: "none", fontSize: 14,
                        background: isActive ? "var(--primary-light)" : "transparent",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: isActive ? 600 : 400,
                        transition: "all var(--transition-fast)"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.target.style.background = "var(--bg-tertiary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.target.style.background = isActive ? "var(--primary-light)" : "transparent";
                        }
                      }}
                    >
                      <span style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 99, 
                        background: committee.color, 
                        flexShrink: 0
                      }} />
                      {club.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Events Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", flex: 1 }}>
              <Search size={18} style={{ color: "var(--text-tertiary)" }} />
              <input
                className="input"
                style={{ border: "none", padding: 0, background: "transparent", fontSize: 14 }}
                placeholder="Search events or clubs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="input show-mobile"
              style={{ width: "auto", display: "none", padding: "10px 16px" }}
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

          {error && (
            <div className="card" style={{ padding: 16, marginBottom: 20, borderColor: "var(--error)", background: "var(--error-bg)" }}>
              <p style={{ color: "var(--error)", fontSize: 14 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <EventGridSkeleton />
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="No events found"
              subtitle={activeClub ? `${activeClub.name} hasn't posted any events yet.` : "Try adjusting your search or filter."}
            />
          ) : (
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card fade-in"
                  style={{ 
                    overflow: "hidden", 
                    display: "block",
                    height: "100%"
                  }}
                >
                  <div style={{ height: 6, background: ev.tag_color }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 600, 
                        color: ev.tag_color, 
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: `${ev.tag_color}15`,
                        textTransform: "uppercase"
                      }}>
                        {ev.club_name}
                      </span>
                    </div>
                    <p style={{ fontSize: 16, marginBottom: 12, lineHeight: 1.4, fontWeight: 600, color: "var(--text-primary)" }}>
                      {ev.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} /> {ev.event_date}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={14} /> {ev.attending} attending
                      </span>
                      {ev.avg_rating && (
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Star size={14} style={{ color: "#D97706" }} /> {ev.avg_rating}
                        </span>
                      )}
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
