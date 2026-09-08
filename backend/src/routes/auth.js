const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// Only accounts with this email domain can sign up — keeps ClubVerse restricted
// to the university. Change this in backend/.env (ALLOWED_EMAIL_DOMAIN=...) if
// your actual student email domain is different from poornima.edu.in.
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || "poornima.edu.in").toLowerCase();

// Students sign up freely (as long as their email matches the college domain).
// club_admin/dean accounts should be created by the dean via the admin endpoint
// below (not open self-signup), so random students can't grant themselves
// posting rights over a club.
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return res.status(400).json({
      error: `Please sign up with your university email (@${ALLOWED_EMAIL_DOMAIN})`,
    });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')")
    .run(name, normalizedEmail, passwordHash);

  const user = { id: info.lastInsertRowid, name, email: normalizedEmail, role: "student", club_id: null };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
  res.status(201).json({ token, user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role, club_id: row.club_id };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user });
});

module.exports = router;
