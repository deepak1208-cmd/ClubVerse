import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import { Calendar, Clock, MapPin, Users, Image as ImageIcon, X } from "lucide-react";

export default function PostEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    club: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
    eligibility: "All students",
    maxParticipants: "",
    isMultiDay: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title || !formData.club || !formData.date || !formData.startTime) {
      setError("Please fill in all required fields (Title, Club, Date, and Start Time are required)");
      return;
    }

    if (formData.endTime && formData.startTime > formData.endTime) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = null;

      // Upload media if exists
      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("event-media")
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;
        mediaUrl = uploadData.path;
      }

      // Insert event into database
      const { data, error: insertError } = await supabase
        .from("events")
        .insert([
          {
            title: formData.title,
            club: formData.club,
            date: formData.date,
            start_time: formData.startTime || null,
            end_time: formData.endTime || null,
            venue: formData.venue,
            description: formData.description,
            eligibility: formData.eligibility,
            max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
            is_multi_day: formData.isMultiDay,
            media_url: mediaUrl,
            posted_by: user.id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      alert("Event posted successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error posting event:", err);
      setError(err.message || "Failed to post event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "24px 16px",
    }}>
      <div style={{
        maxWidth: 680,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}>Post an Event</h1>
        <p style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          marginBottom: 32,
        }}>Create a new event for your club. You can edit or delete it later from your dashboard.</p>

        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            color: "#DC2626",
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Tech Fest 2025"
              style={inputStyle}
              required
            />
          </div>

          {/* Club */}
          <div>
            <label style={labelStyle}>Club Name *</label>
            <input
              type="text"
              name="club"
              value={formData.club}
              onChange={handleChange}
              placeholder="e.g., Computer Society of India"
              style={inputStyle}
              required
            />
          </div>

          {/* Date and Time Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}>
            {/* Date */}
            <div>
              <label style={labelStyle}>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            {/* Start Time */}
            <div>
              <label style={labelStyle}>Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label style={labelStyle}>End Time (Optional)</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Multi-day checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="isMultiDay"
              name="isMultiDay"
              checked={formData.isMultiDay}
              onChange={handleChange}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="isMultiDay" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              This event runs across multiple days
            </label>
          </div>

          {/* Venue */}
          <div>
            <label style={labelStyle}>Venue / Location</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., Main Auditorium, Block A"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the event, agenda, speakers, etc."
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
              rows={4}
            />
          </div>

          {/* Eligibility */}
          <div>
            <label style={labelStyle}>Eligibility</label>
            <select
              name="eligibility"
              value={formData.eligibility}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="All students">All students</option>
              <option value="First years only">First years only</option>
              <option value="Second years only">Second years only</option>
              <option value="Third years only">Third years only</option>
              <option value="Final years only">Final years only</option>
              <option value="Specific branches">Specific branches</option>
            </select>
          </div>

          {/* Max Participants */}
          <div>
            <label style={labelStyle}>Maximum Participants (Optional)</label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="e.g., 100"
              style={inputStyle}
              min="1"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label style={labelStyle}>Event Poster / Image (Optional)</label>
            <div style={{
              border: "2px dashed var(--border-light)",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                setMediaFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setMediaPreview(reader.result);
                reader.readAsDataURL(file);
              }
            }}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                style={{ display: "none" }}
                id="media-upload"
              />
              <label htmlFor="media-upload" style={{ cursor: "pointer" }}>
                {mediaPreview ? (
                  <div style={{ position: "relative" }}>
                    {mediaFile?.type.startsWith("video") ? (
                      <video src={mediaPreview} controls style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                    ) : (
                      <img src={mediaPreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setMediaPreview(null);
                        setMediaFile(null);
                      }}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.7)",
                        border: "none",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={16} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={32} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
                      Drag & drop or click to upload
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
                      Supports images and videos
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Posting..." : "Post Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  color: "var(--text-primary)",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 14,
  border: "1px solid var(--border-light)",
  borderRadius: 10,
  outline: "none",
  transition: "all 0.2s",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "14px 24px",
  fontSize: 15,
  fontWeight: 600,
  color: "#fff",
  background: "var(--primary)",
  border: "none",
  borderRadius: 10,
  marginTop: 8,
};
