import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Feed from "./pages/Feed";
import EventDetail from "./pages/EventDetail";
import ClubDetail from "./pages/ClubDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DeanDashboard from "./pages/DeanDashboard";
import ManageAdmins from "./pages/ManageAdmins";
import PostEvent from "./pages/PostEvent";
import EditEvent from "./pages/EditEvent";
import Participants from "./pages/Participants";
import AdminDashboard from "./pages/AdminDashboard";
import MyEvents from "./pages/MyEvents";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/clubs/:id" element={<ClubDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/my-events" element={<ProtectedRoute role="student"><MyEvents /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute role="club_admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/post-event" element={<ProtectedRoute role="club_admin"><PostEvent /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute role={["club_admin", "dean"]}><EditEvent /></ProtectedRoute>} />
            <Route path="/events/:id/participants" element={<ProtectedRoute role={["club_admin", "dean"]}><Participants /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute role="dean"><DeanDashboard /></ProtectedRoute>} />
            <Route path="/manage-admins" element={<ProtectedRoute role="dean"><ManageAdmins /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
