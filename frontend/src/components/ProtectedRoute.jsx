import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import EmptyState from "./EmptyState";
import { ShieldAlert } from "lucide-react";

// role: optional string or array of allowed roles. If omitted, just requires any login.
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const allowed = !role || (Array.isArray(role) ? role.includes(user.role) : user.role === role);
  if (!allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        subtitle={`This page is only available to ${Array.isArray(role) ? role.join(" or ") : role} accounts.`}
      />
    );
  }

  return children;
}
