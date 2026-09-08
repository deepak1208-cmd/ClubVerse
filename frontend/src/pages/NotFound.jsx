import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <div style={{ display: "inline-flex", padding: 16, borderRadius: 99, background: "rgba(27,31,59,0.05)", marginBottom: 16 }}>
        <Compass size={24} opacity={0.4} />
      </div>
      <p className="serif" style={{ fontSize: 22, marginBottom: 8 }}>Nothing here</p>
      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 20 }}>That page doesn't exist — maybe the event was removed, or the link's off.</p>
      <Link to="/"><button className="btn-primary">Back to the feed</button></Link>
    </div>
  );
}
