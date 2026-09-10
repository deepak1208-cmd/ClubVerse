import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
      padding: "20px"
    }}>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: 48,
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 30px rgba(139, 92, 246, 0.4)"
            }}
          >
            <GraduationCap size={28} color="white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="gradient-text"
            style={{ fontSize: 32, marginBottom: 8, fontWeight: 700 }}
          >
            Join ClubVerse
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ fontSize: 15, color: "var(--text-secondary)" }}
          >
            Create a student account to RSVP and review events
          </motion.p>
        </div>

        {/* University Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="pill pill-glow"
          style={{ 
            marginBottom: 24, 
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <CheckCircle size={14} />
          <span>Requires a @{ALLOWED_EMAIL_DOMAIN} email</span>
        </motion.div>

        {/* Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onSubmit={handleSubmit} 
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="card"
              style={{ 
                padding: "14px 18px", 
                fontSize: 13, 
                borderColor: "rgba(232, 93, 78, 0.3)", 
                background: "rgba(232, 93, 78, 0.05)",
                color: "#E85D4E"
              }}
            >
              {error}
            </motion.div>
          )}

          <button 
            className="btn-primary" 
            type="submit" 
            disabled={loading} 
            style={{ 
              marginTop: 8, 
              padding: "16px 24px",
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
        </motion.form>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{ 
            fontSize: 14, 
            textAlign: "center",
            marginTop: 24,
            color: "var(--text-secondary)"
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ 
            color: "#C4B5FD", 
            fontWeight: 600,
            textDecoration: "none",
            position: "relative"
          }}>
            Log in
            <span style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              width: 0,
              height: 1,
              background: "#8B5CF6",
              transition: "width 0.3s ease"
            }} />
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
