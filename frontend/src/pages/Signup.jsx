import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "../AuthContext";

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
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px",
      background: "var(--bg-primary)"
    }}>
      <div className="card" style={{ maxWidth: 480, width: "100%", padding: 48 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <GraduationCap size={28} color="white" />
          </div>
          
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
            Join ClubVerse
          </h1>
          
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Create a student account to RSVP and review events
          </p>
        </div>

        {/* University Badge */}
        <div style={{ 
          marginBottom: 24, 
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "var(--success-bg)",
          borderRadius: 8
        }}>
          <CheckCircle size={16} style={{ color: "var(--success)" }} />
          <span style={{ fontSize: 14, color: "var(--success)", fontWeight: 500 }}>Requires a @{ALLOWED_EMAIL_DOMAIN} email</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <User 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: 16, 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)"
                }} 
              />
              <input 
                className="input" 
                type="text"
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{ paddingLeft: 48 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: 16, 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)"
                }} 
              />
              <input 
                className="input" 
                type="email" 
                placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ paddingLeft: 48 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: 16, 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)"
                }} 
              />
              <input 
                className="input" 
                type="password" 
                placeholder="Min 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6}
                style={{ paddingLeft: 48 }}
              />
            </div>
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
            style={{ 
              marginTop: 8, 
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10
            }}
          >
            {loading ? (
              "Creating account..."
            ) : (
              <>
                <span>Sign up</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={{ 
          fontSize: 14, 
          textAlign: "center",
          marginTop: 24,
          color: "var(--text-secondary)"
        }}>
          Already have an account?{" "}
          <Link to="/login" style={{ 
            color: "var(--primary)", 
            fontWeight: 600
          }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
