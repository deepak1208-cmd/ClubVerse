import React, { useState } from "react";

const emptyForm = {
  title: "", venue: "", event_date: "", end_date: "", description: "",
  eligibility: "", max_participants: "", format_details: "", why_participate: "",
  contact_name: "", contact_role: "", contact_phone: "", contact_email: "", winners: "",
};

export default function EventForm({ initialValues, onSubmit, submitLabel, loading }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [isMultiDay, setIsMultiDay] = useState(!!initialValues?.end_date);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      end_date: isMultiDay ? form.end_date || null : null,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
    });
  }

  const section = { fontSize: 12, fontWeight: 600, opacity: 0.5, letterSpacing: 0.3, margin: "18px 0 8px" };
  const row = { display: "flex", gap: 10 };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={section}>THE BASICS</p>
      <input className="input" placeholder="Event title" value={form.title} onChange={set("title")} required />
      <input className="input" placeholder="Venue (e.g. Volleyball Ground)" value={form.venue} onChange={set("venue")} />
      <div style={row}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, opacity: 0.6 }}>{isMultiDay ? "Start date" : "Date"}</label>
          <input className="input" type="date" value={form.event_date} onChange={set("event_date")} required />
        </div>
        {isMultiDay && (
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, opacity: 0.6 }}>End date</label>
            <input className="input" type="date" value={form.end_date} onChange={set("end_date")} />
          </div>
        )}
      </div>
      <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: 0.75 }}>
        <input type="checkbox" checked={isMultiDay} onChange={(e) => setIsMultiDay(e.target.checked)} />
        This runs across multiple days
      </label>
      <textarea className="input" placeholder="Short description — what is this event?" value={form.description} onChange={set("description")} rows={3} />

      <p style={section}>WHO CAN JOIN</p>
      <input className="input" placeholder="Eligibility (e.g. Open to all branches, or Hostellers only)" value={form.eligibility} onChange={set("eligibility")} />
      <input className="input" type="number" min="1" placeholder="Max participants / teams (optional)" value={form.max_participants} onChange={set("max_participants")} />

      <p style={section}>FORMAT (one point per line)</p>
      <textarea className="input" placeholder={"e.g.\nBest of 3 sets\n1st set: 11 points\nDeciding set: 15 points"} value={form.format_details} onChange={set("format_details")} rows={3} />

      <p style={section}>WHY PARTICIPATE (one point per line)</p>
      <textarea className="input" placeholder={"e.g.\nShowcase your skills\nWin prizes\nRepresent your team"} value={form.why_participate} onChange={set("why_participate")} rows={3} />

      <p style={section}>CONTACT PERSON</p>
      <div style={row}>
        <input className="input" placeholder="Name" value={form.contact_name} onChange={set("contact_name")} />
        <input className="input" placeholder="Role (e.g. Captain, Outdoor Sports Club)" value={form.contact_role} onChange={set("contact_role")} />
      </div>
      <div style={row}>
        <input className="input" placeholder="Phone" value={form.contact_phone} onChange={set("contact_phone")} />
        <input className="input" type="email" placeholder="Email" value={form.contact_email} onChange={set("contact_email")} />
      </div>

      <p style={section}>RESULTS (add or edit any time, even after the event)</p>
      <input className="input" placeholder="Winners (e.g. Team Nightfall — Best Playable Demo)" value={form.winners} onChange={set("winners")} />

      <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
