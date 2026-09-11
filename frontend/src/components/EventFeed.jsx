import React from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

export default function EventCard({ event, onRSVP }) {
  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const startTime = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const timeDisplay = startTime ? (endTime ? `${startTime} - ${endTime}` : startTime) : null;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
    }}
    >
      {/* Media */}
      {event.media_url ? (
        <div style={{
          height: 200,
          background: "var(--bg-secondary)",
          overflow: "hidden",
        }}>
          {event.media_url.endsWith(".mp4") || event.media_url.endsWith(".webm") ? (
            <video
              src={event.media_url}
              controls
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={event.media_url}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      ) : (
        <div style={{
          height: 200,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Calendar size={48} color="rgba(255,255,255,0.3)" />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 20 }}>
        {/* Club Badge */}
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--primary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          {event.club}
        </span>

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "8px 0",
          lineHeight: 1.3,
        }}>
          {event.title}
        </h3>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {/* Date & Time */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <Calendar size={14} />
            <span>{formatDate(event.date)}</span>
            {timeDisplay && (
              <>
                <span style={{ margin: "0 4px" }}>•</span>
                <Clock size={14} />
                <span>{timeDisplay}</span>
              </>
            )}
          </div>

          {/* Venue */}
          {event.venue && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <MapPin size={14} />
              <span>{event.venue}</span>
            </div>
          )}

          {/* Eligibility & Capacity */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <Users size={14} />
            <span>{event.eligibility}</span>
            {event.max_participants && (
              <>
                <span style={{ margin: "0 4px" }}>•</span>
                <span>Max {event.max_participants} participants</span>
              </>
            )}
          </div>
        </div>

        {/* RSVP Button */}
        {onRSVP && (
          <button
            onClick={() => onRSVP(event)}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "var(--primary)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "var(--primary-dark)")}
            onMouseLeave={(e) => (e.target.style.background = "var(--primary)")}
          >
            RSVP Now
          </button>
        )}
      </div>
    </div>
  );
}
