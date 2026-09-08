// Central place for all backend calls. Change VITE_API_URL in a .env file
// (or your hosting provider's env settings) once the backend is deployed —
// see the root README for deployment instructions.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
// Uploaded photos/videos are served from the server root (not under /api) —
// e.g. API_URL = ".../api" but media lives at ".../uploads/...". Derive that
// root once here so every component can build a full media URL consistently.
export const SERVER_ROOT = API_URL.replace(/\/api\/?$/, "");

function getToken() {
  return localStorage.getItem("clubverse_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

// Separate from request() because file uploads must NOT set a JSON
// Content-Type header — the browser needs to set its own multipart boundary.
async function uploadRequest(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

export const api = {
  // auth
  signup: (name, email, password) => request("/auth/signup", { method: "POST", body: { name, email, password } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  // clubs / committees
  getCommittees: () => request("/committees"),
  getClubs: () => request("/clubs"),
  promoteToClubAdmin: (clubId, userId) =>
    request(`/clubs/${clubId}/admins`, { method: "POST", auth: true, body: { userId } }),
  getClubReviews: (clubId) => request(`/clubs/${clubId}/reviews`, { auth: true }),

  // events
  getEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/events${qs ? `?${qs}` : ""}`);
  },
  getEvent: (id) => request(`/events/${id}`, { auth: true }), // auth optional server-side; sends token if present so viewer state comes back
  createEvent: (payload) => request("/events", { method: "POST", auth: true, body: payload }),
  updateEvent: (id, payload) => request(`/events/${id}`, { method: "PATCH", auth: true, body: payload }),
  deleteEvent: (id) => request(`/events/${id}`, { method: "DELETE", auth: true }),
  rsvp: (id) => request(`/events/${id}/rsvp`, { method: "POST", auth: true }),
  cancelRsvp: (id) => request(`/events/${id}/rsvp`, { method: "DELETE", auth: true }),
  postReview: (id, rating, comment) =>
    request(`/events/${id}/reviews`, { method: "POST", auth: true, body: { rating, comment } }),
  getMyEvents: () => request("/events/mine", { auth: true }),
  getParticipants: (id) => request(`/events/${id}/participants`, { auth: true }),
  uploadMedia: (id, files) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    return uploadRequest(`/events/${id}/media`, formData);
  },
  deleteMedia: (eventId, mediaId) => request(`/events/${eventId}/media/${mediaId}`, { method: "DELETE", auth: true }),

  // dashboard
  getDashboard: () => request("/dashboard", { auth: true }),

  // users (dean only)
  searchUsers: (search = "") => request(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`, { auth: true }),
  demoteUser: (userId) => request(`/users/${userId}/demote`, { method: "POST", auth: true }),
};
