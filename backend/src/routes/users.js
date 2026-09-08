const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Dean-only: search users by name/email, to find who to promote to club_admin.
// Excludes the dean's own account from results.
router.get("/", requireAuth, requireRole("dean"), (req, res) => {
  const { search } = req.query;

  let sql = `
    SELECT users.id, users.name, users.email, users.role, users.club_id, clubs.name AS club_name
    FROM users
    LEFT JOIN clubs ON users.club_id = clubs.id
    WHERE users.role != 'dean'
  `;
  const params = [];

  if (search) {
    sql += " AND (users.name LIKE ? OR users.email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY users.name LIMIT 25";

  res.json(db.prepare(sql).all(...params));
});

// Dean-only: demote a club_admin back to a plain student (e.g. handing off the role)
router.post("/:userId/demote", requireAuth, requireRole("dean"), (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.prepare("UPDATE users SET role = 'student', club_id = NULL WHERE id = ?").run(req.params.userId);
  res.json({ message: `${user.name} is now a regular student` });
});

module.exports = router;
