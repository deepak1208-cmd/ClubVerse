const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const initSqlJs = require("sql.js");

// ---------------------------------------------------------------------------
// Why sql.js instead of better-sqlite3:
//
// better-sqlite3 is a *native* module — it ships prebuilt binaries for common
// platform/Node-version combos, but falls back to compiling from source with
// node-gyp when no matching prebuild exists. That fallback needs a working
// C++ toolchain (Python, Visual Studio Build Tools on Windows, etc.), which a
// student's laptop often doesn't have — and when it fails, npm prints a wall
// of gyp/node-gyp errors that look like "the whole project is broken" to
// someone new to this.
//
// sql.js is SQLite compiled to WebAssembly. It needs no compilation on any
// platform — install is just a normal npm download, every time. The tradeoff
// is it's fully in-memory, so we manually export the DB to a file after every
// write (see persist() below). For this app's scale that's completely fine.
// ---------------------------------------------------------------------------

const DB_PATH = path.join(__dirname, "clubverse.sqlite");

let sqljsDb = null;
let inTransaction = false;

function persist() {
  if (inTransaction || !sqljsDb) return; // batched writes persist once, after COMMIT
  const data = sqljsDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// sql.js throws if you bind `undefined` (only null/number/string/buffer are
// allowed) — normalize undefined -> null so routes can pass optional fields
// straight from req.body without every call site remembering `|| null`.
function normalize(params) {
  return params.map((p) => (p === undefined ? null : p));
}

function prepare(sql) {
  return {
    get(...params) {
      const stmt = sqljsDb.prepare(sql);
      try {
        stmt.bind(normalize(params));
        return stmt.step() ? stmt.getAsObject() : undefined;
      } finally {
        stmt.free();
      }
    },
    all(...params) {
      const stmt = sqljsDb.prepare(sql);
      const rows = [];
      try {
        stmt.bind(normalize(params));
        while (stmt.step()) rows.push(stmt.getAsObject());
      } finally {
        stmt.free();
      }
      return rows;
    },
    run(...params) {
      const stmt = sqljsDb.prepare(sql);
      try {
        stmt.bind(normalize(params));
        stmt.step();
      } finally {
        stmt.free();
      }
      const idResult = sqljsDb.exec("SELECT last_insert_rowid() AS id");
      const lastInsertRowid = idResult.length ? idResult[0].values[0][0] : undefined;
      const changes = sqljsDb.getRowsModified();
      persist();
      return { lastInsertRowid, changes };
    },
  };
}

function exec(sql) {
  sqljsDb.exec(sql);
  persist();
}

// Mirrors better-sqlite3's db.transaction(fn) — returns a function that, when
// called, runs fn inside BEGIN/COMMIT (or rolls back on error), persisting to
// disk once at the end instead of after every individual .run() inside it.
function transaction(fn) {
  return (...args) => {
    inTransaction = true;
    sqljsDb.exec("BEGIN");
    try {
      const result = fn(...args);
      sqljsDb.exec("COMMIT");
      inTransaction = false;
      persist();
      return result;
    } catch (err) {
      sqljsDb.exec("ROLLBACK");
      inTransaction = false;
      throw err;
    }
  };
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS committees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  committee_id INTEGER NOT NULL,
  FOREIGN KEY (committee_id) REFERENCES committees(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','club_admin','dean')),
  club_id INTEGER, -- set only when role = club_admin
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  end_date TEXT,               -- optional, for multi-day events (e.g. a 5-day tournament)
  venue TEXT,
  eligibility TEXT,             -- e.g. "Only hostellers can register"
  max_participants INTEGER,     -- e.g. "first 8 teams only" — null means unlimited
  format_details TEXT,          -- free text, one point per line, rendered as a bullet list
  why_participate TEXT,         -- free text, one point per line, rendered as a bullet list
  contact_name TEXT,
  contact_role TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  winners TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS event_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),
  url TEXT NOT NULL,
  uploaded_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const COMMITTEES_SEED = [
  { name: "Technical", color: "#1B7F79", clubs: [
    "Pandora Rebels", "Hack Elite", "Udaan - Aerodynamic Club", "AWS Community",
    "MS Azure Community", "GitHub Community", "HackerRank Community", "Ethical Hacking", "MLSA Club",
  ]},
  { name: "Cultural", color: "#E85D4E", clubs: [
    "Dance and Music Club", "Art and Design Club", "Literary and Theatre Club",
  ]},
  { name: "Public Relations", color: "#F2A93B", clubs: [
    "Poornima Paathshala", "Young Indians Yuva Club", "Inter College Affairs Club", "PUAS",
    "NSS Unit", "Poornima MUN Society", "Debate Society", "वाद-संवाद संगठन", "Hospitality Club",
    "Book Club", "Anchoring Club", "Animal Welfare Club", "Environment Club", "Sustainability Club",
    "INDGenius Club", "Disaster Risk Reduction Club", "IQAC Supporting Club",
  ]},
  { name: "Creative Media & Design", color: "#7A6FD9", clubs: [
    "Photography and Videography Club", "Social Media Club", "Podcast Club", "Graphic Designing Club",
  ]},
  { name: "Panthers Sports", color: "#1B7F79", clubs: [
    "Indoor Sports Club", "Outdoor Sports Club", "Health Club",
  ]},
  { name: "International", color: "#E85D4E", clubs: [
    "International Relation Club",
  ]},
];

// `CREATE TABLE IF NOT EXISTS` only creates a table if it's missing entirely —
// it won't add new columns to a table that already exists from a previous
// version of this app. So for anyone upgrading with an existing local
// clubverse.sqlite (rather than starting fresh), add the new columns here.
// Each ALTER is wrapped individually: SQLite errors if a column already
// exists, which we just ignore — that just means this column was already
// added on a previous run.
const NEW_EVENT_COLUMNS = [
  "end_date TEXT",
  "venue TEXT",
  "eligibility TEXT",
  "max_participants INTEGER",
  "format_details TEXT",
  "why_participate TEXT",
  "contact_name TEXT",
  "contact_role TEXT",
  "contact_phone TEXT",
  "contact_email TEXT",
  "start_time TEXT",
  "end_time TEXT",
];

function migrateExistingEventsTable() {
  for (const columnDef of NEW_EVENT_COLUMNS) {
    try {
      sqljsDb.exec(`ALTER TABLE events ADD COLUMN ${columnDef};`);
    } catch (err) {
      // "duplicate column name" — already migrated on a previous run, fine.
    }
  }
  persist();
}

// Must be awaited once, before the server starts accepting requests — see
// server.js. Everything below this point in a request's lifecycle (route
// handlers calling db.prepare(...)) runs after init() has already resolved,
// so it's safe for them to stay synchronous.
async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    sqljsDb = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    sqljsDb = new SQL.Database();
  }

  exec("PRAGMA foreign_keys = ON;");
  exec(SCHEMA_SQL);
  migrateExistingEventsTable();

  const committeeCount = prepare("SELECT COUNT(*) AS c FROM committees").get().c;
  if (committeeCount === 0) {
    const insertCommittee = prepare("INSERT INTO committees (name, color) VALUES (?, ?)");
    const insertClub = prepare("INSERT INTO clubs (name, committee_id) VALUES (?, ?)");
    const insertUser = prepare(
      "INSERT INTO users (name, email, password_hash, role, club_id) VALUES (?, ?, ?, ?, ?)"
    );

    const seedAll = transaction(() => {
      for (const committee of COMMITTEES_SEED) {
        const info = insertCommittee.run(committee.name, committee.color);
        const committeeId = info.lastInsertRowid;
        for (const clubName of committee.clubs) {
          insertClub.run(clubName, committeeId);
        }
      }

      // Seed one dean account so there's something to log in with immediately.
      // IMPORTANT: change this password after first login in a real deployment.
      const deanPasswordHash = bcrypt.hashSync("changeme123", 10);
      insertUser.run("Dean Office", "dean@poornima.edu.in", deanPasswordHash, "dean", null);
    });

    seedAll();
    console.log("Database seeded with committees, clubs, and a default dean account.");
  }
}

module.exports = { init, prepare, exec, transaction };
