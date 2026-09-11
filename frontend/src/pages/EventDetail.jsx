import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar, Users, Star, Award, ArrowLeft, CheckCircle2, Info, MapPin, ShieldCheck,
  ListChecks, Sparkles, Phone, Mail, Settings, Clock,
} from "lucide-react";
import { api, SERVER_ROOT } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";

function bulletLines(text) {
  return (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  function load() {
    api.getEvent(id).then(setEvent).catch((e) => setError(e.message));
  }
  useEffect(load, [id]);

  async function handleRsvp() {
    if (!user) return navigate("/login", { state: { from: `/events/${id}` } });
    setRsvpLoading(true);
    try {
      if (event.viewer_has_rsvpd) {
        await api.cancelRsvp(id);
        toast.success("RSVP removed");
      } else {
        await api.rsvp(id);
        toast.success("You're on the list!");
      }
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleReview(e) {
    e.preventDefault();
    if (!user) return navigate("/login", { state: { from: `/events/${id}` } });
    setReviewLoading(true);
    try {
      await api.postReview(id, rating, comment);
      toast.success("Review posted — thanks!");
      setComment("");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewLoading(false);
    }
  }

  if (error) return <p style={{ padding: 32, color: "#E85D4E" }}>{error}</p>;
  if (!event) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <div className="skeleton" style={{ height: 140, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 12 }} />
      </div>
    );
  }

  const isStaffAccount = user && user.role !== "student";
  const canManage = user && (user.role === "dean" || (user.role === "club_admin" && user.club_id === event.club_id));
  const formatPoints = bulletLines(event.format_details);
  const whyPoints = bulletLines(event.why_participate);
  const hasContact = event.contact_name || event.contact_phone || event.contact_email;
  const dateRange = event.end_date && event.end_date !== event.event_date
    ? `${event.event_date} – ${event.end_date}`
    : event.event_date;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Back
        </button>
        {canManage && (
          <Link to={`/events/${id}/edit`}>
            <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}><Settings size={14} /> Manage</button>
          </Link>
        )}
      </div>

      {/* Hero banner — bigger, richer treatment than before so the event feels
          like a real poster even before real photos are uploaded. */}
      <div className="card fade-in" style={{ overflow: "hidden" }}>
        <div style={{ padding: 28, background: `linear-gradient(135deg, ${event.tag_color}, ${event.tag_color}CC)`, color: "white" }}>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, marginBottom: 6 }}>{event.club_name.toUpperCase()} · {event.committee_name}</p>
          <p className="serif" style={{ fontSize: 28, lineHeight: 1.2 }}>{event.title}</p>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", fontSize: 13, opacity: 0.75, marginBottom: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={14} /> {dateRange}</span>
            {event.venue && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {event.venue}</span>}
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={14} /> {event.attending} attending{event.max_participants ? ` · max ${event.max_participants}` : ""}</span>
            {event.avg_rating && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Star size={14} /> {event.avg_rating} ({event.review_count})</span>}
          </div>

          {event.description && <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 18 }}>{event.description}</p>}

          {event.eligibility && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FAF6EF", borderRadius: 9, padding: "10px 12px", marginBottom: 14, fontSize: 13 }}>
              <ShieldCheck size={16} color="#1B7F79" style={{ flexShrink: 0, marginTop: 1 }} />
              <span><b>Eligibility:</b> {event.eligibility}</span>
            </div>
          )}

          {formatPoints.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, letterSpacing: 0.3, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <ListChecks size={13} /> FORMAT
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
                {formatPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {whyPoints.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, letterSpacing: 0.3, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} /> WHY PARTICIPATE
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
                {whyPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {event.winners && (
            <div style={{ background: "#FAF6EF", borderRadius: 10, padding: 12, marginBottom: 18 }}>
              <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, opacity: 0.5, marginBottom: 4 }}>
                <Award size={14} /> WINNERS
              </p>
              <p style={{ fontSize: 14 }}>{event.winners}</p>
            </div>
          )}

          {isStaffAccount ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(27,31,59,0.05)", borderRadius: 9, padding: "10px 14px", fontSize: 13, opacity: 0.7 }}>
              <Info size={15} style={{ flexShrink: 0 }} /> RSVPs are for students only.
            </div>
          ) : (
            <button
              className={event.viewer_has_rsvpd ? "btn-secondary" : "btn-primary"}
              onClick={handleRsvp}
              disabled={rsvpLoading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {event.viewer_has_rsvpd && <CheckCircle2 size={16} />}
              {rsvpLoading ? "..." : event.viewer_has_rsvpd ? "You're attending — tap to cancel" : "RSVP to this event"}
            </button>
          )}
        </div>
      </div>

      {/* Photos & videos, once the club admin has posted any */}
      {event.media?.length > 0 && (
        <div className="fade-in" style={{ marginTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Photos & videos</p>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {event.media.map((m) => (
              <div 
                key={m.id} 
                style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: "#00000010", cursor: "pointer" }}
                onClick={() => {
                  const mediaUrl = `${SERVER_ROOT}${m.url}`;
                  if (m.media_type === "video") {
                    const video = document.createElement("video");
                    video.src = mediaUrl;
                    video.controls = true;
                    video.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90vw; max-height: 90vh; z-index: 9999; background: #000;";
                    document.body.appendChild(video);
                    video.play();
                    video.onclick = () => {
                      video.pause();
                      video.remove();
                    };
                    const overlay = document.createElement("div");
                    overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 9998;";
                    overlay.onclick = () => {
                      video.pause();
                      video.remove();
                      overlay.remove();
                    };
                    document.body.appendChild(overlay);
                  } else {
                    const img = document.createElement("img");
                    img.src = mediaUrl;
                    img.onerror = () => {
                      alert("Failed to load image");
                      overlay.remove();
                    };
                    img.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90vw; max-height: 90vh; z-index: 9999;";
                    document.body.appendChild(img);
                    const overlay = document.createElement("div");
                    overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 9998;";
                    overlay.onclick = () => {
                      img.remove();
                      overlay.remove();
                    };
                    document.body.appendChild(overlay);
                  }
                }}
              >
                {m.media_type === "video" ? (
                  <video src={`${SERVER_ROOT}${m.url}`} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                ) : (
                  <img src={`${SERVER_ROOT}${m.url}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:12px;">Failed to load</div>'; }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact card — the "email support" a participant needs */}
      {hasContact && (
        <div className="card fade-in" style={{ padding: 18, marginTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Questions about this event?</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{event.contact_name}</p>
          {event.contact_role && <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>{event.contact_role}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {event.contact_phone && (
              <a href={`tel:${event.contact_phone}`} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#1B7F79" }}>
                <Phone size={13} /> {event.contact_phone}
              </a>
            )}
            {event.contact_email && (
              <a href={`mailto:${event.contact_email}`} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#1B7F79" }}>
                <Mail size={13} /> {event.contact_email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Reviews only open once the event has actually happened */}
      {!isStaffAccount && !event.viewer_has_reviewed && (
        event.has_ended ? (
          <div className="card fade-in" style={{ padding: 20, marginTop: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Leave a review</p>
            <form onSubmit={handleReview} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
              </select>
              <textarea className="input" placeholder="What did you think?" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              <button className="btn-secondary" type="submit" disabled={reviewLoading}>{reviewLoading ? "Posting..." : "Post review"}</button>
            </form>
          </div>
        ) : (
          <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(27,31,59,0.05)", borderRadius: 9, padding: "12px 14px", marginTop: 20, fontSize: 13, opacity: 0.7 }}>
            <Clock size={15} style={{ flexShrink: 0 }} /> Reviews open once this event has ended.
          </div>
        )
      )}

      {event.reviews?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>What people are saying</p>
          {event.reviews.map((r, i) => (
            <div key={i} className="card fade-in" style={{ padding: 14, marginBottom: 10, animationDelay: `${i * 40}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{r.user_name}</p>
                <p style={{ fontSize: 13, color: "#F2A93B" }}>{"★".repeat(r.rating)}</p>
              </div>
              {r.comment && <p style={{ fontSize: 13, opacity: 0.8 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
