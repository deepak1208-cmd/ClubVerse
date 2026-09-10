import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Users, Star, CalendarX2, Sparkles, Zap, Trophy } from "lucide-react";
import { motion } from "framer-motion";
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
    <div style={{ minHeight: "100vh" }}>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      {!user && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ 
            borderBottom: "1px solid rgba(139, 92, 246, 0.15)", 
            background: "linear-gradient(180deg, rgba(139, 92, 246, 0.08), transparent)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Hero Section */}
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="pill pill-glow" style={{ marginBottom: 20, padding: "8px 18px" }}>
                <Sparkles size={14} /> 
                <span>The ultimate hub for campus life</span>
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="gradient-text"
              style={{ 
                fontSize: 56, 
                lineHeight: 1.1, 
                marginBottom: 16,
                fontWeight: 800,
                letterSpacing: "-1px"
              }}
            >
              Every Club Event.<br />
              One Beautiful Feed.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ 
                fontSize: 18, 
                opacity: 0.7, 
                marginBottom: 32,
                maxWidth: 600,
                margin: "0 auto 32px"
              }}
            >
              Stop checking a dozen WhatsApp groups. Browse, RSVP, and discover what's actually worth going to — all in one place.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
            >
              <Link to="/signup">
                <button className="btn-primary" style={{ padding: "16px 32px", fontSize: 16 }}>
                  <span>Get started — it's free</span>
                </button>
              </Link>
              <Link to="/login">
                <button className="btn-secondary" style={{ padding: "16px 32px", fontSize: 16 }}>
                  Sign in instead
                </button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ 
                display: "flex", 
                gap: 40, 
                justifyContent: "center", 
                marginTop: 48,
                flexWrap: "wrap"
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg, #C4B5FD 0%, #67E8F9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>37+</div>
                <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Active Clubs</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg, #C4B5FD 0%, #67E8F9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>500+</div>
                <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Events Yearly</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg, #C4B5FD 0%, #67E8F9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>2K+</div>
                <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Students</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="responsive-grid" style={{ display: "flex", gap: 40, padding: "40px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Sidebar */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="responsive-sidebar" 
          style={{ 
            width: 240, 
            flexShrink: 0, 
            maxHeight: "calc(100vh - 120px)", 
            overflowY: "auto", 
            position: "sticky", 
            top: 100, 
            alignSelf: "flex-start",
            paddingRight: 20
          }}
        >
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} style={{ color: "#F59E0B" }} />
              Filter by Club
            </h3>
            <button
              onClick={() => setActiveClub(null)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: 12, marginBottom: 8,
                background: !activeClub ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))" : "transparent",
                color: !activeClub ? "#C4B5FD" : "var(--text-secondary)",
                border: !activeClub ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid var(--border-glass)",
                fontSize: 14, fontWeight: 600,
                transition: "all 0.2s ease"
              }}
            >
              All clubs
            </button>
            {committees.map((committee) => (
              <div key={committee.id} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.4, letterSpacing: 1, margin: "12px 0 8px 12px", textTransform: "uppercase" }}>
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
                        padding: "10px 16px", borderRadius: 12, border: "none", fontSize: 13,
                        background: isActive ? "rgba(139, 92, 246, 0.15)" : "transparent",
                        color: isActive ? "#C4B5FD" : "var(--text-secondary)",
                        fontWeight: isActive ? 600 : 400,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.target.style.background = "rgba(255,255,255,0.03)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.target.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 99, 
                        background: committee.color, 
                        flexShrink: 0,
                        boxShadow: isActive ? `0 0 10px ${committee.color}` : "none"
                      }} />
                      {club.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.aside>

        {/* Events Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ display: "flex", gap: 12, marginBottom: 28 }}
          >
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", flex: 1, background: "rgba(255,255,255,0.03)" }}>
              <Search size={18} opacity={0.5} style={{ color: "var(--text-tertiary)" }} />
              <input
                className="input"
                style={{ border: "none", padding: 0, background: "transparent", fontSize: 15 }}
                placeholder="Search events or clubs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="input show-mobile"
              style={{ width: "auto", display: "none", padding: "14px 18px" }}
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
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
              style={{ padding: 20, marginBottom: 20, borderColor: "rgba(232, 93, 78, 0.3)", background: "rgba(232, 93, 78, 0.05)" }}
            >
              <p style={{ color: "#E85D4E" }}>{error}</p>
            </motion.div>
          )}

          {loading ? (
            <EventGridSkeleton />
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyState
                icon={CalendarX2}
                title="No events yet"
                subtitle={activeClub ? `${activeClub.name} hasn't posted anything yet — check back soon.` : "Try a different search or club filter."}
              />
            </motion.div>
          ) : (
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link
                    to={`/events/${ev.id}`}
                    className="card fade-in"
                    style={{ 
                      overflow: "hidden", 
                      display: "block",
                      height: "100%",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <div style={{ height: 8, background: ev.tag_color, opacity: 0.9 }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 700, 
                          color: ev.tag_color, 
                          padding: "4px 10px",
                          borderRadius: 99,
                          background: `${ev.tag_color}20`,
                          textTransform: "uppercase",
                          letterSpacing: 0.5
                        }}>
                          {ev.club_name}
                        </span>
                      </div>
                      <p className="serif" style={{ fontSize: 18, marginBottom: 12, lineHeight: 1.4, fontWeight: 600, color: "var(--text-primary)" }}>
                        {ev.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, opacity: 0.6, color: "var(--text-secondary)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={14} /> {ev.event_date}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Users size={14} /> {ev.attending} attending
                        </span>
                        {ev.avg_rating && (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Star size={14} style={{ color: "#F59E0B" }} /> {ev.avg_rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
