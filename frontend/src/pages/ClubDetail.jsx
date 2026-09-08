import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Users, Star, ArrowLeft, CalendarX2 } from "lucide-react";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { EventGridSkeleton } from "../components/Skeletons";

export default function ClubDetail() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getClubs().then((clubs) => {
      const found = clubs.find((c) => String(c.id) === id);
      setClub(found || null);
    }).catch((e) => setError(e.message));

    api.getEvents({ club: id }).then(setEvents).catch((e) => setError(e.message));
  }, [id]);

  const totalAttending = events?.reduce((s, e) => s + e.attending, 0) ?? 0;
  const ratedEvents = events?.filter((e) => e.avg_rating) ?? [];
  const avgRating = ratedEvents.length
    ? (ratedEvents.reduce((s, e) => s + e.avg_rating, 0) / ratedEvents.length).toFixed(1)
    : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
      <Link to="/"><button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}><ArrowLeft size={14} /> All events</button></Link>

      {error && <p style={{ color: "#E85D4E" }}>{error}</p>}

      {!club ? (
        <div className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 20 }} />
      ) : (
        <div className="card fade-in" style={{ padding: 20, marginBottom: 24, borderLeft: `4px solid ${club.committee_color}` }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: club.committee_color, marginBottom: 4 }}>{club.committee_name?.toUpperCase()}</p>
          <p className="serif" style={{ fontSize: 24, marginBottom: 12 }}>{club.name}</p>
          <div style={{ display: "flex", gap: 20, fontSize: 13, opacity: 0.7 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={14} /> {events?.length ?? "..."} events</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={14} /> {totalAttending} total attendance</span>
            {avgRating && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={14} /> {avgRating} avg rating</span>}
          </div>
        </div>
      )}

      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Event history</p>

      {!events ? (
        <EventGridSkeleton count={4} />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarX2} title="No events posted yet" subtitle="Check back once this club posts its first event." />
      ) : (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {events.map((ev, i) => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="card fade-in" style={{ overflow: "hidden", display: "block", animationDelay: `${i * 30}ms` }}>
              <div style={{ height: 56, background: ev.tag_color, opacity: 0.88 }} />
              <div style={{ padding: 14 }}>
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
