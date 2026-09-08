import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Star, CalendarX2 } from "lucide-react";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { EventGridSkeleton } from "../components/Skeletons";

export default function MyEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMyEvents().then(setEvents).catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
      <p className="serif" style={{ fontSize: 24, marginBottom: 4 }}>My RSVPs</p>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>Events you've signed up for, soonest first.</p>

      {error && <p style={{ color: "#E85D4E" }}>{error}</p>}

      {!events ? (
        <EventGridSkeleton count={4} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No RSVPs yet"
          subtitle="Browse the feed and RSVP to events you want to attend."
          action={<Link to="/"><button className="btn-primary">Browse events</button></Link>}
        />
      ) : (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {events.map((ev, i) => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="card fade-in" style={{ overflow: "hidden", display: "block", animationDelay: `${i * 30}ms` }}>
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
  );
}
