const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Public: anyone can browse the committee/club structure
router.get("/committees", (req, res) => {
  const committees = db.prepare("SELECT * FROM committees ORDER BY id").all();
  const clubs = db.prepare("SELECT * FROM clubs ORDER BY name").all();

  const result = committees.map((c) => ({
    ...c,
    clubs: clubs.filter((club) => club.committee_id === c.id),
  }));
  res.json(result);
});

router.get("/clubs", (req, res) => {
  const clubs = db
    .prepare(
      `SELECT clubs.*, committees.name AS committee_name, committees.color AS committee_color,
              (SELECT COUNT(*) FROM users WHERE users.role = 'club_admin' AND users.club_id = clubs.id) AS admin_count
       FROM clubs JOIN committees ON clubs.committee_id = committees.id
       ORDER BY clubs.name`
    )
    .all();
  res.json(clubs);
});

// Dean-only: promote a user to club_admin for a given club.
// This is how a club gets someone who can post events on its behalf.
// Capped at 2 admins per club — keeps posting rights tightly held.
router.post("/clubs/:clubId/admins", requireAuth, requireRole("dean"), (req, res) => {
  const { clubId } = req.params;
  const { userId } = req.body;

  const club = db.prepare("SELECT * FROM clubs WHERE id = ?").get(clubId);
  if (!club) return res.status(404).json({ error: "Club not found" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const currentAdminCount = db
    .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'club_admin' AND club_id = ?")
    .get(clubId).c;
  if (currentAdminCount >= 2) {
    return res.status(409).json({ error: `${club.name} already has 2 admins — remove one before adding another` });
  }

  db.prepare("UPDATE users SET role = 'club_admin', club_id = ? WHERE id = ?").run(clubId, userId);
  res.json({ message: `${user.name} is now the admin for ${club.name}` });
});

// Dean, or that club's own admin: every review left across the club's events —
// powers the "ratings & reviews" section on the club admin dashboard.
router.get("/clubs/:clubId/reviews", requireAuth, (req, res) => {
  const { clubId } = req.params;
  const isOwnClub = req.user.role === "club_admin" && String(req.user.club_id) === String(clubId);
  if (req.user.role !== "dean" && !isOwnClub) {
    return res.status(403).json({ error: "You can only view reviews for your own club" });
  }

  const reviews = db
    .prepare(
      `SELECT reviews.rating, reviews.comment, reviews.created_at,
              users.name AS user_name, events.id AS event_id, events.title AS event_title
       FROM reviews
       JOIN events ON reviews.event_id = events.id
       JOIN users ON reviews.user_id = users.id
       WHERE events.club_id = ?
       ORDER BY reviews.created_at DESC`
    )
    .all(clubId);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  res.json({ average_rating: avg ? Number(avg.toFixed(1)) : null, count: reviews.length, reviews });
});

module.exports = router;
