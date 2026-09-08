import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Users, Trash2, ArrowLeft, ImagePlus } from "lucide-react";
import { api } from "../api";
import { useToast } from "../ToastContext";
import EventForm from "../components/EventForm";
import EventMediaManager from "../components/EventMediaManager";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function load() {
    api.getEvent(id).then(setEvent).catch((e) => toast.error(e.message));
  }
  useEffect(load, [id]);

  async function handleSubmit(values) {
    setLoading(true);
    try {
      await api.updateEvent(id, values);
      toast.success("Event updated");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteEvent(id);
      toast.success("Event deleted");
      navigate("/admin");
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  if (!event) return <div className="skeleton" style={{ height: 300, maxWidth: 460, margin: "24px auto", borderRadius: 12 }} />;

  return (
    <div style={{ maxWidth: 460, margin: "24px auto", padding: "0 20px 40px" }}>
      <Link to="/admin"><button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}><ArrowLeft size={14} /> My dashboard</button></Link>

      <p className="serif" style={{ fontSize: 24, marginBottom: 4 }}>Manage event</p>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 16 }}>{event.title}</p>

      <Link to={`/events/${id}/participants`}>
        <button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <Users size={14} /> View {event.attending} participant{event.attending === 1 ? "" : "s"}
        </button>
      </Link>

      <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, letterSpacing: 0.3, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <ImagePlus size={13} /> PHOTOS & VIDEOS
      </p>
      <div style={{ marginBottom: 24 }}>
        <EventMediaManager eventId={id} media={event.media || []} onChange={load} />
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, letterSpacing: 0.3, marginBottom: 8 }}>EDIT DETAILS</p>
      <EventForm initialValues={event} onSubmit={handleSubmit} submitLabel="Save changes" loading={loading} />

      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(27,31,59,0.1)" }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", color: "#E85D4E", fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <Trash2 size={14} /> Delete this event
          </button>
        ) : (
          <div className="card" style={{ padding: 14, borderColor: "#E85D4E" }}>
            <p style={{ fontSize: 13, marginBottom: 10 }}>Delete "{event.title}" permanently? This removes all RSVPs, reviews, and media too.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)} style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: "#E85D4E", color: "white", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
