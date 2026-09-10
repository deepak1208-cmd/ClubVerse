import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calendar, Users, Star, CalendarX2, ArrowRight, Sparkles } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { EventGridSkeleton } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [committees, setCommittees] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeClub, setActiveClub] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'dean') {
        navigate('/dashboard');
      } else if (user.role === 'club_admin') {
        navigate('/admin');
      } else if (user.role === 'student') {
        navigate('/events'); // Changed from /my-events to /events
      }
    }
  }, [user, authLoading, navigate]);

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

  // Get ALL clubs for directory (not just first 6)
  const allClubs = committees.flatMap(c => c.clubs);

  return (
    <div className="feed-page">
      {/* Hero Section - Editorial Style */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sparkles size={14} />
            <span>CLUBVERSE · POORNIMA UNIVERSITY</span>
          </div>
          <h1 className="hero-headline">
            Find your people.<br />
            Make campus happen.
          </h1>
          <p className="hero-subtitle">
            Discover university clubs, explore upcoming events, and keep your RSVPs in one place.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore events
              <ArrowRight size={18} />
            </button>
            <button 
              className="btn-secondary"
              onClick={() => document.getElementById('clubs-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Discover clubs
            </button>
          </div>
        </div>
        
        {/* Editorial Image Collage */}
        <div className="hero-visual">
          <div className="collage-grid">
            <div className="collage-main">
              <div className="collage-image" style={{ background: 'linear-gradient(135deg, #174C3C 0%, #2D6A4F 100%)' }}>
                <Users size={48} color="#DDF3A0" />
              </div>
            </div>
            <div className="collage-side">
              <div className="collage-image collage-small-1" style={{ background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)' }}>
                <Calendar size={32} color="#EEF2FF" />
              </div>
              <div className="collage-image collage-small-2" style={{ background: 'linear-gradient(135deg, #DDF3A0 0%, #BBE68A 100%)' }}>
                <Star size={32} color="#174C3C" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Club Discovery Strip - ALL CLUBS */}
      <section id="clubs-section" className="clubs-section">
        <div className="section-header">
          <h2 className="section-title">Explore Clubs</h2>
          <p className="section-subtitle">Find your community among our diverse student organizations</p>
        </div>
        <div className="clubs-grid">
          {allClubs.map((club, idx) => {
            const committee = committees.find(c => c.clubs.some(cl => cl.id === club.id));
            return (
              <button
                key={club.id}
                className="club-card"
                onClick={() => {
                  setActiveClub(club);
                  document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div 
                  className="club-icon"
                  style={{ background: `${committee?.color}20`, color: committee?.color }}
                >
                  {club.name.charAt(0)}
                </div>
                <span className="club-name">{club.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Discover</h3>
            <p>Browse through diverse clubs and find ones that match your interests</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h3>Explore</h3>
            <p>Check out upcoming events, workshops, and activities</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h3>RSVP</h3>
            <p>Register for events and connect with your campus community</p>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events-section" className="events-section">
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
      </section>
    </div>
  );
}
