import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Clock, Users, Star, CalendarX2, MapPin } from "lucide-react";
import { api } from "../api";
import { EventGridSkeleton } from "./Skeletons";
import EmptyState from "./EmptyState";

export default function EventFeed({ activeClubFilter = null }) {
  const [committees, setCommittees] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeClub, setActiveClub] = useState(activeClubFilter);
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
      api.getEvents(params)
        .then(setEvents)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeClub, query]);

  // Helper to format date (e.g., "17 Sept 2025")
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Helper to format time (e.g., "10:00 AM")
  const formatTime = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="events-section">
      <div className="events-layout">
        {/* Sidebar - Club Filters */}
        <aside className="events-sidebar">
          <div className="sidebar-header">
            <h3>Filter by Club</h3>
          </div>
          <button
            onClick={() => setActiveClub(null)}
            className={`filter-btn ${!activeClub ? 'active' : ''}`}
          >
            All clubs
          </button>
          {committees.map((committee) => (
            <div key={committee.id} className="committee-group">
              <p className="committee-label">{committee.name}</p>
              {committee.clubs.map((club) => {
                const isActive = activeClub?.id === club.id;
                return (
                  <button
                    key={club.id}
                    onClick={() => setActiveClub(club)}
                    className={`filter-btn ${isActive ? 'active' : ''}`}
                  >
                    <span 
                      className="club-dot"
                      style={{ background: committee.color }}
                    />
                    {club.name}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Events Grid */}
        <div className="events-content">
          <div className="events-header">
            <div>
              <h2 className="events-title">Upcoming Events</h2>
              <p className="events-subtitle">
                {activeClub 
                  ? `Showing events from ${activeClub.name}`
                  : 'Browse all upcoming campus events'}
              </p>
            </div>
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                className="search-input"
                placeholder="Search events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
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
            <div className="events-grid">
              {events.map((ev) => {
                // Calculate time display
                const startTime = formatTime(ev.start_time);
                const endTime = formatTime(ev.end_time);
                const timeDisplay = startTime ? (endTime ? `${startTime} - ${endTime}` : startTime) : null;

                return (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="event-card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {/* Card Header / Image Placeholder */}
                    <div className="event-card-image" style={{
                      height: '160px',
                      background: ev.image_url ? `url(${ev.image_url}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px 12px 0 0',
                      position: 'relative'
                    }}>
                       {!ev.image_url && (
                         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                           <Calendar size={40} color="rgba(255,255,255,0.5)" />
                         </div>
                       )}
                       <div className="event-tag" style={{ 
                         position: 'absolute', 
                         top: 12, 
                         left: 12, 
                         background: 'rgba(255, 255, 255, 0.95)', 
                         color: ev.tag_color || '#4338CA',
                         padding: '4px 10px',
                         borderRadius: '20px',
                         fontSize: '11px',
                         fontWeight: '700',
                         textTransform: 'uppercase'
                       }}>
                         {ev.club_name}
                       </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '16px' }}>
                      <h3 className="event-title" style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4',
                        color: '#101828'
                      }}>
                        {ev.title}
                      </h3>

                      <div className="event-meta" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Date & Time Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                          <Calendar size={14} />
                          <span>{formatDate(ev.event_date)}</span>
                          {timeDisplay && (
                            <>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <Clock size={14} />
                              <span>{timeDisplay}</span>
                            </>
                          )}
                        </div>

                        {/* Location Row (if available) */}
                        {ev.venue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                            <MapPin size={14} />
                            <span style={{ truncate: 'true' }}>{ev.venue}</span>
                          </div>
                        )}

                        {/* Attendees Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                          <Users size={14} />
                          <span>{ev.attending || 0} attending</span>
                          {ev.avg_rating && (
                            <>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <Star size={14} style={{ fill: '#FBBF24', color: '#FBBF24' }} />
                              <span>{ev.avg_rating}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
