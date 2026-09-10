import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../AuthContext";

// Mirrors backend/.env's ALLOWED_EMAIL_DOMAIN. Keep these two in sync if you
// change the allowed domain — this one only powers the friendly client-side
// check; the backend is what actually enforces it.
const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || "poornima.edu.in";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.toLowerCase().trim().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      setError(`Please use your university email (@${ALLOWED_EMAIL_DOMAIN})`);
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px" }}>
      <p className="serif" style={{ fontSize: 26, marginBottom: 4 }}>Join ClubVerse</p>
      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>Create a student account to RSVP and review events.</p>

      <div className="pill" style={{ background: "rgba(27,127,121,0.1)", color: "#1B7F79", marginBottom: 16 }}>
        <GraduationCap size={14} /> Requires a @{ALLOWED_EMAIL_DOMAIN} email
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" type="email" placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p style={{ color: "#E85D4E", fontSize: 13 }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>
        Already have an account? <Link to="/login" style={{ color: "#1B7F79", fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
