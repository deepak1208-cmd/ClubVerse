import React, { useRef, useState } from "react";
import { Image as ImageIcon, Video, Upload, X } from "lucide-react";
import { api, SERVER_ROOT } from "../api";
import { useToast } from "../ToastContext";

export default function EventMediaManager({ eventId, media, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      await api.uploadMedia(eventId, files);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(mediaId) {
    try {
      await api.deleteMedia(eventId, mediaId);
      onChange();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {media.map((m) => (
          <div key={m.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", background: "#00000010" }}>
            {m.media_type === "video" ? (
              <video src={`${SERVER_ROOT}${m.url}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
            ) : (
              <img src={`${SERVER_ROOT}${m.url}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <button
              onClick={() => handleDelete(m.id)}
              style={{ position: "absolute", top: 4, right: 4, background: "rgba(27,31,59,0.75)", border: "none", borderRadius: 99, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={12} color="white" />
            </button>
            {m.media_type === "video" && (
              <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(27,31,59,0.75)", borderRadius: 4, padding: "2px 5px" }}>
                <Video size={11} color="white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Upload size={14} /> {uploading ? "Uploading..." : "Add photos / videos"}
      </button>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Up to 8 files at once, 25MB each.</p>
    </div>
  );
}
