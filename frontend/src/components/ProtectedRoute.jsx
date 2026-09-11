import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    // Not logged in -> Redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no specific role is required, allow access
  if (!role) return children;

  // Normalize role to array for easy checking
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (allowedRoles.includes(user.role)) {
    return children;
  }

  // ROLE MISMATCH: Redirect based on user's actual role
  // This prevents the "Dead End" screen
  if (user.role === "dean") {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (user.role === "club_admin") {
    return <Navigate to="/admin" replace />;
  }
  
  if (user.role === "student") {
    return <Navigate to="/events" replace />;
  }

  // Fallback
  return <Navigate to="/" replace />;
}
