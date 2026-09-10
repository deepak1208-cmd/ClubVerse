import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Star, PlusCircle, Settings, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import EmptyState from "../components/EmptyState";
import EventFeed from "../components/EventFeed";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getClubs().then((clubs) => setClub(clubs.find((c) => c.id === user.club_id))).catch((e) => setError(e.message));
    api.getEvents({ club: user.club_id }).then(setEvents).catch((e) => setError(e.message));
    api.getClubReviews(user.club_id).then(setReviews).catch((e) => setError(e.message));
  }, [user.club_id]);

  const totalAttending = events?.reduce((s, e) => s + e.attending, 0) ?? 0;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="section-title" style={{ fontSize: 28, fontWeight: 700, color: '#101828', marginBottom: 8 }}>
          Club Administration
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', maxWidth: 600 }}>
          Manage your club's events and view campus-wide activity.
        </p>
      </div>

      {/* This banner is what makes the admin view feel distinct from the student
          feed and the dean dashboard — it's scoped and branded to THIS club. */}
      <div
        className="card fade-in"
        style={{ padding: 22, marginBottom: 24, background: `linear-gradient(135deg, ${club?.committee_color || "#1B7F79"}15, white)`, borderLeft: `4px solid ${club?.committee_color || "#1B7F79"}` }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, opacity: 0.6, marginBottom: 4 }}>CLUB ADMIN DASHBOARD</p>
        {!club ? <div className="skeleton" style={{ height: 28, width: 200 }} /> : (
          <>
            <p className="serif" style={{ fontSize: 26 }}>{club.name}</p>
            <p style={{ fontSize: 13, opacity: 0.6 }}>{club.committee_name} committee</p>
          </>
        )}
      </div>

      {error && <p style={{ color: "#E85D4E" }}>{error}</p>}

      <div className="responsive-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 14 }}>
          <Calendar size={16} color="#1B7F79" />
          <p className="serif" style={{ fontSize: 22, margin: "8px 0 2px" }}>{events?.length ?? "..."}</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Events posted</p>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <Users size={16} color="#1B7F79" />
          <p className="serif" style={{ fontSize: 22, margin: "8px 0 2px" }}>{totalAttending}</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Total RSVPs</p>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <Star size={16} color="#1B7F79" />
          <p className="serif" style={{ fontSize: 22, margin: "8px 0 2px" }}>{reviews?.average_rating ?? "—"}</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Avg. rating ({reviews?.count ?? 0} reviews)</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Your events</p>
        <Link to="/post-event"><button className="btn-teal" style={{ display: "flex", alignItems: "center", gap: 6 }}><PlusCircle size={14} /> New event</button></Link>
      </div>

      {!events ? (
        <div className="skeleton" style={{ height: 160, borderRadius: 12, marginBottom: 24 }} />
      ) : events.length === 0 ? (
        <EmptyState icon={Calendar} title="No events yet" subtitle="Post your first event to get it in front of students." action={<Link to="/post-event"><button className="btn-primary">Post an event</button></Link>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {events.map((ev) => (
            <div key={ev.id} className="card fade-in" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={11} /> {ev.event_date}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={11} /> {ev.attending}</span>
                  {ev.avg_rating && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} /> {ev.avg_rating}</span>}
                  <span className="pill" style={{ background: ev.has_ended ? "rgba(27,31,59,0.06)" : "rgba(27,127,121,0.12)", color: ev.has_ended ? "inherit" : "#1B7F79", padding: "2px 8px" }}>
                    {ev.has_ended ? <><CheckCircle2 size={10} /> Ended</> : <><Clock size={10} /> Upcoming</>}
                  </span>
                </div>
              </div>
              <Link to={`/events/${ev.id}/edit`}><button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}><Settings size={13} /> Manage</button></Link>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <MessageSquare size={16} /> Ratings & reviews
      </p>
      {!reviews ? (
        <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />
      ) : reviews.reviews.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No reviews yet" subtitle="Reviews appear here once students review your past events." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reviews.reviews.map((r, i) => (
            <div key={i} className="card fade-in" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{r.user_name} <span style={{ fontWeight: 400, opacity: 0.5 }}>on {r.event_title}</span></p>
                <p style={{ fontSize: 13, color: "#F2A93B" }}>{"★".repeat(r.rating)}</p>
              </div>
              {r.comment && <p style={{ fontSize: 13, opacity: 0.8 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Campus-wide Events Feed - Now visible for Club Admin */}
      <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#101828', marginBottom: 8 }}>
          Campus Events
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
          Browse all upcoming events across campus clubs.
        </p>
        <EventFeed />
      </div>
    </div>
  );
}
