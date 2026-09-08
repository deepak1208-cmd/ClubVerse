import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import EventForm from "../components/EventForm";

export default function PostEvent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values) {
    setLoading(true);
    try {
      const { id } = await api.createEvent(values);
      toast.success("Event posted!");
      navigate(`/events/${id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "24px auto", padding: "0 20px 40px" }}>
      <p className="serif" style={{ fontSize: 24, marginBottom: 4 }}>Post an event</p>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
        This appears in the feed immediately. You can add photos/videos and edit any of this later from your dashboard.
      </p>
      <EventForm onSubmit={handleSubmit} submitLabel="Post event" loading={loading} />
    </div>
  );
}
