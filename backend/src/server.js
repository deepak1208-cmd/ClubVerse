require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const authRoutes = require("./routes/auth");
const clubRoutes = require("./routes/clubs");
const eventRoutes = require("./routes/events");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());

// Uploaded event photos/videos — see routes/events.js for the upload endpoint.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api", clubRoutes); // exposes /api/committees, /api/clubs
app.use("/api/events", eventRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// Fallback error handler — special-cases file upload errors (too large, wrong
// type) so the person sees a useful message instead of a generic 500.
app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "That file is too large — max 25MB per file" });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message && err.message.includes("Only image or video files")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

// db.init() loads the WASM SQLite engine and runs schema/seed setup — this
// must finish before the server accepts any requests, since route handlers
// assume the database is already ready the moment a request comes in.
async function main() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`ClubVerse API running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start ClubVerse API:", err);
  process.exit(1);
});
