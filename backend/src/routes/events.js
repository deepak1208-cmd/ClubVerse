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
  let attending;
  if (event.registration_type === "team") {
    // For team events, count active teams (not withdrawn)
    attending = db.prepare(
      "SELECT COUNT(*) AS c FROM event_teams WHERE event_id = ? AND withdrawn_at IS NULL"
    ).get(event.id).c;
  } else {
    // For individual events, count RSVPs
    attending = db.prepare("SELECT COUNT(*) AS c FROM rsvps WHERE event_id = ?").get(event.id).c;
  }
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

  // For team events, return teams instead of individual RSVPs
  if (event.registration_type === "team") {
    const teams = db.prepare(`
      SELECT et.id, et.name, et.captain_user_id, et.withdrawn_at,
             u.name AS captain_name,
             (SELECT COUNT(*) FROM event_team_members WHERE team_id = et.id) AS member_count
      FROM event_teams et
      JOIN users u ON et.captain_user_id = u.id
      WHERE et.event_id = ? AND et.withdrawn_at IS NULL
      ORDER BY et.created_at ASC
    `).all(req.params.id);
    
    // Get members for each team
    const getMembers = db.prepare(`
      SELECT etm.user_id, u.name, u.email
      FROM event_team_members etm
      JOIN users u ON etm.user_id = u.id
      WHERE etm.team_id = ?
    `);
    
    const result = teams.map(team => ({
      ...team,
      members: getMembers.all(team.id)
    }));
    
    res.json({ 
      event_title: event.title, 
      count: result.length, 
      registration_type: "team",
      max_teams: event.max_teams,
      participants: result 
    });
  } else {
    // Individual event - existing behavior
    const participants = db
      .prepare(
        `SELECT users.id, users.name, users.email, rsvps.created_at AS rsvp_at
         FROM rsvps JOIN users ON rsvps.user_id = users.id
         WHERE rsvps.event_id = ? ORDER BY rsvps.created_at ASC`
      )
      .all(req.params.id);

    res.json({ event_title: event.title, count: participants.length, registration_type: "individual", participants });
  }
});

// club_admin only: create an event for their own club
router.post("/", requireAuth, requireRole("club_admin"), (req, res) => {
  const {
    title, description, event_date, end_date, start_time, end_time, venue, eligibility, max_participants,
    format_details, why_participate, contact_name, contact_role, contact_phone, contact_email, winners,
    registration_type, max_teams, min_team_size, max_team_size,
  } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: "title and event_date are required" });
  }

  // Validate time range if both provided
  if (start_time && end_time && start_time >= end_time) {
    return res.status(400).json({ error: "end_time must be after start_time" });
  }

  // Validate team registration fields if team mode
  if (registration_type === "team") {
    if (!max_teams || max_teams < 1) {
      return res.status(400).json({ error: "max_teams is required for team events" });
    }
    if (!max_team_size || max_team_size < 1) {
      return res.status(400).json({ error: "max_team_size is required for team events" });
    }
    const minSize = min_team_size || 2;
    if (minSize > max_team_size) {
      return res.status(400).json({ error: "min_team_size cannot exceed max_team_size" });
    }
  }

  const info = db
    .prepare(
      `INSERT INTO events (
        club_id, title, description, event_date, end_date, start_time, end_time, venue, eligibility, max_participants,
        format_details, why_participate, contact_name, contact_role, contact_phone, contact_email,
        winners, created_by, registration_type, max_teams, min_team_size, max_team_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.club_id, title, description || null, event_date, end_date || null, start_time || null, end_time || null, venue || null,
      eligibility || null, max_participants || null, format_details || null, why_participate || null,
      contact_name || null, contact_role || null, contact_phone || null, contact_email || null,
      winners || null, req.user.id, registration_type || "individual", max_teams || null, min_team_size || null, max_team_size || null
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
    title, description, event_date, end_date, start_time, end_time, venue, eligibility, max_participants,
    format_details, why_participate, contact_name, contact_role, contact_phone, contact_email, winners,
    registration_type, max_teams, min_team_size, max_team_size,
  } = req.body;

  // Validate time range if both provided
  if (start_time && end_time && start_time >= end_time) {
    return res.status(400).json({ error: "end_time must be after start_time" });
  }

  // Validate team registration fields if switching to team mode
  if (registration_type === "team") {
    if (!max_teams || max_teams < 1) {
      return res.status(400).json({ error: "max_teams is required for team events" });
    }
    if (!max_team_size || max_team_size < 1) {
      return res.status(400).json({ error: "max_team_size is required for team events" });
    }
    const minSize = min_team_size || 2;
    if (minSize > max_team_size) {
      return res.status(400).json({ error: "min_team_size cannot exceed max_team_size" });
    }
  }

  db.prepare(
    `UPDATE events SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      event_date = COALESCE(?, event_date),
      end_date = ?,
      start_time = ?,
      end_time = ?,
      venue = COALESCE(?, venue),
      eligibility = COALESCE(?, eligibility),
      max_participants = ?,
      format_details = COALESCE(?, format_details),
      why_participate = COALESCE(?, why_participate),
      contact_name = COALESCE(?, contact_name),
      contact_role = COALESCE(?, contact_role),
      contact_phone = COALESCE(?, contact_phone),
      contact_email = COALESCE(?, contact_email),
      winners = COALESCE(?, winners),
      registration_type = COALESCE(?, registration_type),
      max_teams = ?,
      min_team_size = ?,
      max_team_size = ?
     WHERE id = ?`
  ).run(
    title, description, event_date, end_date, start_time || null, end_time || null, venue, eligibility, max_participants, format_details,
    why_participate, contact_name, contact_role, contact_phone, contact_email, winners,
    registration_type, max_teams, min_team_size, max_team_size, req.params.id
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
// For team events, RSVP is disabled - teams register instead.
router.post("/:id/rsvp", requireAuth, requireRole("student"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  // Block individual RSVP for team events
  if (event.registration_type === "team") {
    return res.status(400).json({ error: "This is a team event. Please create or join a team to register." });
  }
  
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
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (event && event.registration_type === "team") {
    return res.status(400).json({ error: "This is a team event. Individual RSVP is not available." });
  }
  db.prepare("DELETE FROM rsvps WHERE event_id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ message: "RSVP removed" });
});

// Team registration endpoints for team-mode events
// Create a team for a team-based event
router.post("/:id/teams", requireAuth, requireRole("student"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  if (event.registration_type !== "team") {
    return res.status(400).json({ error: "This event does not support team registration" });
  }
  
  const { name, member_emails } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Team name is required" });
  }
  
  // Check max_teams limit atomically
  const currentTeams = db.prepare("SELECT COUNT(*) AS c FROM event_teams WHERE event_id = ? AND withdrawn_at IS NULL").get(req.params.id).c;
  if (currentTeams >= event.max_teams) {
    return res.status(409).json({ error: "All team slots are filled" });
  }
  
  // Check if user already belongs to a team for this event
  const existingMembership = db.prepare(`
    SELECT etm.* FROM event_team_members etm
    JOIN event_teams et ON etm.team_id = et.id
    WHERE et.event_id = ? AND etm.user_id = ? AND et.withdrawn_at IS NULL
  `).get(req.params.id, req.user.id);
  if (existingMembership) {
    return res.status(409).json({ error: "You are already on a team for this event" });
  }
  
  const minSize = event.min_team_size || 2;
  const maxSize = event.max_team_size;
  
  // Validate member emails if provided
  let memberUsers = [];
  if (member_emails && Array.isArray(member_emails)) {
    const findUser = db.prepare("SELECT id, name, email FROM users WHERE email = ? AND role = 'student'");
    for (const email of member_emails) {
      const user = findUser.get(email.trim().toLowerCase());
      if (!user) {
        return res.status(400).json({ error: `User not found: ${email}` });
      }
      if (user.id === req.user.id) {
        return res.status(400).json({ error: "Cannot add yourself as a member (you're the captain)" });
      }
      memberUsers.push(user);
    }
    
    // Check for duplicate emails in the list
    const uniqueEmails = new Set(member_emails.map(e => e.trim().toLowerCase()));
    if (uniqueEmails.size !== member_emails.length) {
      return res.status(400).json({ error: "Duplicate member emails provided" });
    }
  }
  
  // Check team size constraints
  const totalMembers = 1 + memberUsers.length; // captain + members
  if (totalMembers > maxSize) {
    return res.status(400).json({ error: `Max team size is ${maxSize}` });
  }
  
  // Create team and add members atomically
  try {
    db.transaction(() => {
      // Re-check max_teams inside transaction
      const freshCount = db.prepare("SELECT COUNT(*) AS c FROM event_teams WHERE event_id = ? AND withdrawn_at IS NULL").get(req.params.id).c;
      if (freshCount >= event.max_teams) {
        throw new Error("All team slots are filled");
      }
      
      // Insert team
      const teamInfo = db.prepare(
        "INSERT INTO event_teams (event_id, name, captain_user_id) VALUES (?, ?, ?)"
      ).run(req.params.id, name.trim(), req.user.id);
      const teamId = teamInfo.lastInsertRowid;
      
      // Add captain as first member
      db.prepare("INSERT INTO event_team_members (team_id, user_id) VALUES (?, ?)").run(teamId, req.user.id);
      
      // Add other members
      const insertMember = db.prepare("INSERT INTO event_team_members (team_id, user_id) VALUES (?, ?)");
      for (const member of memberUsers) {
        insertMember.run(teamId, member.id);
      }
    })();
    
    res.status(201).json({ message: "Team created successfully" });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "A team with this name already exists for this event" });
    }
    if (err.message === "All team slots are filled") {
      return res.status(409).json({ error: err.message });
    }
    console.error("Error creating team:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// Get teams for an event
router.get("/:id/teams", optionalAuth, (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  if (event.registration_type !== "team") {
    return res.status(400).json({ error: "This event does not support team registration" });
  }
  
  const teams = db.prepare(`
    SELECT et.id, et.name, et.captain_user_id, et.created_at, et.withdrawn_at,
           u.name AS captain_name,
           (SELECT COUNT(*) FROM event_team_members etm WHERE etm.team_id = et.id AND etm.joined_at IS NOT NULL) AS member_count
    FROM event_teams et
    JOIN users u ON et.captain_user_id = u.id
    WHERE et.event_id = ?
    ORDER BY et.withdrawn_at ASC, et.created_at ASC
  `).all(req.params.id);
  
  // Get members for each team (only show captain name, not member emails unless public)
  const getMembers = db.prepare(`
    SELECT etm.user_id, u.name, u.email
    FROM event_team_members etm
    JOIN users u ON etm.user_id = u.id
    WHERE etm.team_id = ?
  `);
  
  const result = teams.map(team => ({
    ...team,
    members: getMembers.all(team.id)
  }));
  
  res.json(result);
});

// Get my team for an event
router.get("/:id/my-team", requireAuth, requireRole("student"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  if (event.registration_type !== "team") {
    return res.status(400).json({ error: "This event does not support team registration" });
  }
  
  const myTeam = db.prepare(`
    SELECT et.id, et.name, et.captain_user_id, et.withdrawn_at,
           u.name AS captain_name,
           (SELECT COUNT(*) FROM event_team_members WHERE team_id = et.id) AS member_count
    FROM event_teams et
    JOIN users u ON et.captain_user_id = u.id
    JOIN event_team_members etm ON etm.team_id = et.id
    WHERE et.event_id = ? AND etm.user_id = ? AND et.withdrawn_at IS NULL
  `).get(req.params.id, req.user.id);
  
  if (!myTeam) {
    return res.json(null); // Not on any team
  }
  
  // Get all members
  const members = db.prepare(`
    SELECT etm.user_id, u.name
    FROM event_team_members etm
    JOIN users u ON etm.user_id = u.id
    WHERE etm.team_id = ?
  `).all(myTeam.id);
  
  res.json({ ...myTeam, members });
});

// Captain withdraws team, or member leaves team
router.delete("/:id/teams/:teamId", requireAuth, requireRole("student"), (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  const team = db.prepare("SELECT * FROM event_teams WHERE id = ? AND event_id = ?").get(req.params.teamId, req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });
  
  // Check if user is on this team
  const membership = db.prepare("SELECT * FROM event_team_members WHERE team_id = ? AND user_id = ?").get(req.params.teamId, req.user.id);
  if (!membership) {
    return res.status(403).json({ error: "You are not a member of this team" });
  }
  
  const minSize = event.min_team_size || 2;
  const memberCount = db.prepare("SELECT COUNT(*) AS c FROM event_team_members WHERE team_id = ?").get(req.params.teamId).c;
  
  try {
    db.transaction(() => {
      if (team.captain_user_id === req.user.id) {
        // Captain withdraws entire team
        db.prepare("UPDATE event_teams SET withdrawn_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.teamId);
        // Members are effectively removed (team is marked withdrawn)
      } else {
        // Member leaving
        if (memberCount <= minSize) {
          // Leaving would drop below min, so withdraw the whole team
          db.prepare("UPDATE event_teams SET withdrawn_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.teamId);
        } else {
          // Just remove this member
          db.prepare("DELETE FROM event_team_members WHERE team_id = ? AND user_id = ?").run(req.params.teamId, req.user.id);
        }
      }
    })();
    
    res.json({ message: "Operation successful" });
  } catch (err) {
    console.error("Error in team operation:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
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
