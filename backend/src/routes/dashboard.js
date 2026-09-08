const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Dean-only: summary stats + events-per-committee + low-turnout flags
router.get("/", requireAuth, requireRole("dean"), (req, res) => {
  const totalClubs = db.prepare("SELECT COUNT(*) AS c FROM clubs").get().c;
  const totalCommittees = db.prepare("SELECT COUNT(*) AS c FROM committees").get().c;
  const totalEvents = db.prepare("SELECT COUNT(*) AS c FROM events").get().c;
  const avgRating = db.prepare("SELECT AVG(rating) AS avg FROM reviews").get().avg;

  const eventsByCommittee = db
    .prepare(
      `SELECT committees.name, committees.color, COUNT(events.id) AS event_count
       FROM committees
       LEFT JOIN clubs ON clubs.committee_id = committees.id
       LEFT JOIN events ON events.club_id = clubs.id
       GROUP BY committees.id
       ORDER BY event_count DESC`
    )
    .all();

  // Clubs with zero events posted — worth flagging to the dean
  const inactiveClubs = db
    .prepare(
      `SELECT clubs.name, committees.name AS committee_name
       FROM clubs
       JOIN committees ON clubs.committee_id = committees.id
       LEFT JOIN events ON events.club_id = clubs.id
       WHERE events.id IS NULL
       ORDER BY clubs.name`
    )
    .all();

  res.json({
    total_clubs: totalClubs,
    total_committees: totalCommittees,
    total_events: totalEvents,
    avg_rating: avgRating ? Number(avgRating.toFixed(1)) : null,
    events_by_committee: eventsByCommittee,
    inactive_clubs: inactiveClubs,
  });
});

module.exports = router;
