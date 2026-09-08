const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db = require("../db");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ---------------------------------------------------------------------------
// Media upload setup (photos/videos on an event). Files are saved to disk in
// backend/uploads/ and served statically (see server.js) — we only ever store
// the resulting URL string in the database, never the file bytes themselves.
// This matters specifically because our DB engine (sql.js) keeps the whole
// database in memory and re-exports it to disk on every write; storing large
// media blobs *in* the database would make every single write slower as the
// app grows. Keeping media on disk and the DB text-only avoids that entirely.
// ---------------------------------------------------------------------------
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 8 }, // 25MB/file, up to 8 at once
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed"));
    }
  },
});

function attachStats(event) {
  const attending = db.prepare("SELECT COUNT(*) AS c FROM rsvps WHERE event_id = ?").get(event.id).c;
  const reviewStats = db
    .prepare("SELECT COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE event_id = ?")
    .get(event.id);
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, matches <input type=date>
  const effectiveEnd = event.end_date || event.event_date;
  return {
    ...event,
    attending,
    review_count: reviewStats.count,
    avg_rating: reviewStats.avg ? Number(reviewStats.avg.toFixed(1)) : null,
    has_ended: effectiveEnd < todayStr,
  };
}

function attachMedia(event) {
  const media = db
    .prepare("SELECT id, media_type, url, created_at FROM event_media WHERE event_id = ? ORDER BY created_at ASC")
    .all(event.id);
  return { ...event, media };
}

// A club_admin may only touch events for their own club; a dean may touch any.
function canManageEvent(user, event) {
  return user.role === "dean" || (user.role === "club_admin" && user.club_id === event.club_id);
}

// Public: browse/search/filter events. Query params: club (id), search (text)
router.get("/", (req, res) => {
  const { club, search } = req.query;

  let sql = `
    SELECT events.*, clubs.name AS club_name, committees.color AS tag_color, committees.name AS committee_name
    FROM events
    JOIN clubs ON events.club_id = clubs.id
    JOIN committees ON clubs.committee_id = committees.id
    WHERE 1=1
  `;
  const params = [];

  if (club) {
    sql += " AND events.club_id = ?";
    params.push(club);
  }
  if (search) {
    sql += " AND (events.title LIKE ? OR clubs.name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY events.event_date ASC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(attachStats));
});

// Auth required: events the current user has RSVP'd to.
// Registered before /:id so Express doesn't treat "mine" as an :id param.
router.get("/mine", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT events.*, clubs.name AS club_name, committees.color AS tag_color, committees.name AS committee_name,
              rsvps.created_at AS rsvp_at
       FROM rsvps
       JOIN events ON events.id = rsvps.event_id
       JOIN clubs ON events.club_id = clubs.id
       JOIN committees ON clubs.committee_id = committees.id
       WHERE rsvps.user_id = ?
       ORDER BY events.event_date ASC`
    )
    .all(req.user.id);

  res.json(rows.map(attachStats));
});

router.get("/:id", optionalAuth, (req, res) => {
  const event = db
    .prepare(
      `SELECT events.*, clubs.name AS club_name, committees.color AS tag_color, committees.name AS committee_name
       FROM events JOIN clubs ON events.club_id = clubs.id
       JOIN committees ON clubs.committee_id = committees.id
       WHERE events.id = ?`
    )
    .get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const reviews = db
    .prepare(
      `SELECT reviews.rating, reviews.comment, reviews.created_at, users.name AS user_name
       FROM reviews JOIN users ON reviews.user_id = users.id
       WHERE reviews.event_id = ? ORDER BY reviews.created_at DESC`
    )
    .all(req.params.id);

  let viewer_has_rsvpd = false;
  let viewer_has_reviewed = false;
  if (req.user) {
    viewer_has_rsvpd = !!db
      .prepare("SELECT 1 FROM rsvps WHERE event_id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
    viewer_has_reviewed = !!db
      .prepare("SELECT 1 FROM reviews WHERE event_id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
  }

  res.json({ ...attachMedia(attachStats(event)), reviews, viewer_has_rsvpd, viewer_has_reviewed });
});

// Dean (any event) or the event's own club_admin: who's coming.
router.get("/:id/participants", requireAuth, (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!canManageEvent(req.user, event)) {
    return res.status(403).json({ error: "You can only view participants for your own club's events" });
  }

  const participants = db
    .prepare(
      `SELECT users.id, users.name, users.email, rsvps.created_at AS rsvp_at
       FROM rsvps JOIN users ON rsvps.user_id = users.id
       WHERE rsvps.event_id = ? ORDER BY rsvps.created_at ASC`
    )
    .all(req.params.id);

  res.json({ event_title: event.title, count: participants.length, participants });
});

// club_admin only: create an event for their own club
router.post("/", requireAuth, requireRole("club_admin"), (req, res) => {
  const {
    title, description, event_date, end_date, venue, eligibility, max_participants,
    format_details, why_participate, contact_name, contact_role, contact_phone, contact_email, winners,
  } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: "title and event_date are required" });
  }

  const info = db
    .prepare(
      `INSERT INTO events (
        club_id, title, description, event_date, end_date, venue, eligibility, max_participants,
        format_details, why_participate, contact_name, contact_role, contact_phone, contact_email,
        winners, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.club_id, title, description || null, event_date, end_date || null, venue || null,
      eligibility || null, max_participants || null, format_details || null, why_participate || null,
      contact_name || null, contact_role || null, contact_phone || null, contact_email || null,
      winners || null, req.user.id
    );

  res.status(201).json({ id: info.lastInsertRowid });
});

// club_admin (own club) or dean: full edit of an event
router.patch("/:id", requireAuth, requireRole("club_admin", "dean"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!canManageEvent(req.user, event)) {
    return res.status(403).json({ error: "You can only edit events for your own club" });
  }

  const {
    title, description, event_date, end_date, venue, eligibility, max_participants,
    format_details, why_participate, contact_name, contact_role, contact_phone, contact_email, winners,
  } = req.body;

  db.prepare(
    `UPDATE events SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      event_date = COALESCE(?, event_date),
      end_date = ?,
      venue = COALESCE(?, venue),
      eligibility = COALESCE(?, eligibility),
      max_participants = ?,
      format_details = COALESCE(?, format_details),
      why_participate = COALESCE(?, why_participate),
      contact_name = COALESCE(?, contact_name),
      contact_role = COALESCE(?, contact_role),
      contact_phone = COALESCE(?, contact_phone),
      contact_email = COALESCE(?, contact_email),
      winners = COALESCE(?, winners)
     WHERE id = ?`
  ).run(
    title, description, event_date, end_date, venue, eligibility, max_participants, format_details,
    why_participate, contact_name, contact_role, contact_phone, contact_email, winners, req.params.id
  );

  res.json({ message: "Updated" });
});

// club_admin (own club) or dean: delete an event entirely (RSVPs/reviews/media cascade)
router.delete("/:id", requireAuth, requireRole("club_admin", "dean"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!canManageEvent(req.user, event)) {
    return res.status(403).json({ error: "You can only delete events for your own club" });
  }

  // Clean up media files from disk before removing the DB rows.
  const media = db.prepare("SELECT url FROM event_media WHERE event_id = ?").all(req.params.id);
  for (const m of media) {
    const filePath = path.join(UPLOADS_DIR, path.basename(m.url));
    fs.unlink(filePath, () => {}); // best-effort; ignore if already gone
  }

  db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
  res.json({ message: "Event deleted" });
});

// club_admin (own club) or dean: attach photos/videos to an event
router.post("/:id/media", requireAuth, requireRole("club_admin", "dean"), upload.array("files", 8), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!canManageEvent(req.user, event)) {
    return res.status(403).json({ error: "You can only add media to your own club's events" });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const insertMedia = db.prepare(
    "INSERT INTO event_media (event_id, media_type, url, uploaded_by) VALUES (?, ?, ?, ?)"
  );
  for (const file of req.files) {
    const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
    insertMedia.run(req.params.id, mediaType, `/uploads/${file.filename}`, req.user.id);
  }

  res.status(201).json({ message: `${req.files.length} file(s) uploaded` });
});

router.delete("/:id/media/:mediaId", requireAuth, requireRole("club_admin", "dean"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!canManageEvent(req.user, event)) {
    return res.status(403).json({ error: "You can only remove media from your own club's events" });
  }

  const media = db.prepare("SELECT * FROM event_media WHERE id = ? AND event_id = ?").get(req.params.mediaId, req.params.id);
  if (!media) return res.status(404).json({ error: "Media not found" });

  fs.unlink(path.join(UPLOADS_DIR, path.basename(media.url)), () => {});
  db.prepare("DELETE FROM event_media WHERE id = ?").run(req.params.mediaId);
  res.json({ message: "Media removed" });
});

// Students only: dean and club_admin accounts are there to manage/post, not attend.
router.post("/:id/rsvp", requireAuth, requireRole("student"), (req, res) => {
  try {
    db.prepare("INSERT INTO rsvps (event_id, user_id) VALUES (?, ?)").run(req.params.id, req.user.id);
    res.status(201).json({ message: "RSVP'd" });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "You've already RSVP'd to this event" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id/rsvp", requireAuth, requireRole("student"), (req, res) => {
  db.prepare("DELETE FROM rsvps WHERE event_id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ message: "RSVP removed" });
});

// Students only, and only once the event has actually happened.
router.post("/:id/reviews", requireAuth, requireRole("student"), (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const todayStr = new Date().toISOString().slice(0, 10);
  const effectiveEnd = event.end_date || event.event_date;
  if (effectiveEnd >= todayStr) {
    return res.status(400).json({ error: "Reviews open once the event has ended" });
  }

  try {
    db.prepare("INSERT INTO reviews (event_id, user_id, rating, comment) VALUES (?, ?, ?, ?)").run(
      req.params.id,
      req.user.id,
      rating,
      comment || null
    );
    res.status(201).json({ message: "Review posted" });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "You've already reviewed this event" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
