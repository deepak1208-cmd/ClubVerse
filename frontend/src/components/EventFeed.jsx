import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Users, Star, CalendarX2 } from "lucide-react";
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
      api.getEvents(params).then(setEvents).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeClub, query]);

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
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="event-card"
                >
                  <div className="event-tag" style={{ background: `${ev.tag_color}15`, color: ev.tag_color }}>
                    {ev.club_name}
                  </div>
                  <h3 className="event-title">{ev.title}</h3>
                  <div className="event-meta">
                    <span className="meta-item">
                      <Calendar size={14} />
                      {ev.event_date}
                    </span>
                    <span className="meta-item">
                      <Users size={14} />
                      {ev.attending} attending
                    </span>
                    {ev.avg_rating && (
                      <span className="meta-item">
                        <Star size={14} />
                        {ev.avg_rating}
                      </span>
                    )}
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
