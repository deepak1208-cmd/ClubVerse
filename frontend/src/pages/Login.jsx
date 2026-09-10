import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users back to their previous destination and show login errors inline.
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px" }}>
      <p className="serif" style={{ fontSize: 26, marginBottom: 4 }}>Welcome back</p>
      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>Log in to RSVP and review events.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: "#E85D4E", fontSize: 13 }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>
        Don't have an account? <Link to="/signup" style={{ color: "#1B7F79", fontWeight: 600 }}>Sign up</Link>
      </p>

      {/* <div className="card" style={{ marginTop: 24, padding: 12, fontSize: 12, opacity: 0.6 }}>
        Dean demo login: <b>dean@poornima.edu.in</b> / <b>changeme123</b> — change this password before real use.
      </div> */}
    </div>
  );
}
