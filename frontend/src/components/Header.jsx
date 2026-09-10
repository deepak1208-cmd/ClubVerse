import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, PlusCircle, CalendarCheck } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  function close() {
    setMenuOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{ 
      position: "sticky", 
      top: 0, 
      zIndex: 100, 
      background: "rgba(255, 255, 255, 0.95)", 
      backdropFilter: "blur(8px)", 
      borderBottom: "1px solid var(--border-light)" 
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "14px 32px", 
        maxWidth: 1280, 
        margin: "0 auto" 
      }}>
        <Link to="/" onClick={close} style={{ textDecoration: "none" }}>
          <p style={{ fontSize: 20, margin: 0, lineHeight: 1.1, fontWeight: 700, color: "var(--text-primary)" }}>ClubVerse</p>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontWeight: 500 }}>Poornima University</p>
        </Link>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {user?.role === "student" && (
            <Link to="/my-events">
              <button 
                className={`btn-ghost ${isActive("/my-events") ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <CalendarCheck size={16} />
                My RSVPs
              </button>
            </Link>
          )}
          {user?.role === "dean" && (
            <>
              <Link to="/dashboard"><button className={`btn-ghost ${isActive("/dashboard") ? "active" : ""}`}>Dashboard</button></Link>
              <Link to="/manage-admins"><button className={`btn-ghost ${isActive("/manage-admins") ? "active" : ""}`}>Manage admins</button></Link>
            </>
          )}
          {user?.role === "club_admin" && (
            <>
              <Link to="/admin"><button className={`btn-ghost ${isActive("/admin") ? "active" : ""}`}>Dashboard</button></Link>
              <Link to="/post-event"><button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}><PlusCircle size={15} /> Post event</button></Link>
            </>
          )}
          {user ? (
            <>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 8, marginRight: 4 }}>Hi, {user.name.split(" ")[0]}</span>
              <button className="btn-secondary" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Log in</button></Link>
              <Link to="/signup"><button className="btn-primary">Sign up</button></Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="show-mobile btn-ghost" onClick={() => setMenuOpen((v) => !v)} style={{ padding: 8 }}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="show-mobile fade-in" style={{ 
          padding: "12px 20px 20px", 
          display: "flex", 
          flexDirection: "column", 
          gap: 8,
          borderTop: "1px solid var(--border-light)"
        }}>
          {user?.role === "student" && (
            <Link to="/my-events" onClick={close}><button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }}><CalendarCheck size={16} /> My RSVPs</button></Link>
          )}
          {user?.role === "dean" && (
            <>
              <Link to="/dashboard" onClick={close}><button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }}><LayoutDashboard size={16} /> Dashboard</button></Link>
              <Link to="/manage-admins" onClick={close}><button className="btn-secondary" style={{ width: "100%" }}>Manage admins</button></Link>
            </>
          )}
          {user?.role === "club_admin" && (
            <>
              <Link to="/admin" onClick={close}><button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }}><LayoutDashboard size={16} /> Dashboard</button></Link>
              <Link to="/post-event" onClick={close}><button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }}><PlusCircle size={16} /> Post event</button></Link>
            </>
          )}
          {user ? (
            <button className="btn-primary" onClick={handleLogout} style={{ width: "100%" }}>Log out ({user.name.split(" ")[0]})</button>
          ) : (
            <>
              <Link to="/login" onClick={close}><button className="btn-secondary" style={{ width: "100%" }}>Log in</button></Link>
              <Link to="/signup" onClick={close}><button className="btn-primary" style={{ width: "100%" }}>Sign up</button></Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
