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
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px",
      background: "var(--bg-primary)"
    }}>
      <div className="card" style={{ maxWidth: 400, width: "100%", padding: 48 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Log in to RSVP and review events
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <input 
              className="input" 
              type="email" 
              placeholder="you@poornima.edu.in" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
              Password
            </label>
            <input 
              className="input" 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && (
            <div style={{ 
              padding: "14px 18px", 
              fontSize: 13, 
              borderColor: "var(--error)", 
              background: "var(--error-bg)",
              color: "var(--error)",
              borderRadius: 8
            }}>
              {error}
            </div>
          )}

          <button 
            className="btn-primary" 
            type="submit" 
            disabled={loading} 
            style={{ marginTop: 8 }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ 
          fontSize: 14, 
          textAlign: "center",
          marginTop: 24,
          color: "var(--text-secondary)"
        }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ 
            color: "var(--primary)", 
            fontWeight: 600
          }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
