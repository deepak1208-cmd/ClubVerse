import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!allowedRoles.includes(user.role)) {
    // AUTOMATIC REDIRECT BASED ON ROLE
    if (user.role === "student") return <Navigate to="/events" replace />;
    if (user.role === "dean") return <Navigate to="/dashboard" replace />;
    if (user.role === "club_admin") return <Navigate to="/admin" replace />;
    
    // Fallback redirect
    return <Navigate to="/" replace />;
  }

  return children;
}
