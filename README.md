# ClubVerse

A single feed for every club and event at Poornima University — students browse, RSVP,
and review; club admins run their own club's event page (with photos, video, and full
event details); the dean's office oversees clubs and admins university-wide.

This is a **real, working full-stack app** (not a mockup): a Node/Express + SQLite
backend, and a React frontend, wired together over a REST API.

## What's new in this version

- **Rich event details** — venue, date range, eligibility, capacity, a format
  breakdown, a "why participate" list, and a named contact person (phone + email) —
  matching the level of detail a real club announcement needs.
- **Photos & videos** — club admins can attach media to any of their events; students
  see it right on the event page.
- **Participant lists** — the dean (any event) and a club's own admin (their events
  only) can see exactly who RSVP'd.
- **Edit & delete events** — club admins have full control over their own posts.
- **A real Club Admin Dashboard** — previously admins only had a "post event" form;
  now they have a proper dashboard scoped to their own club: stats, an event list with
  manage/edit/delete actions, and a ratings & reviews feed.
- **2 admins per club, max** — enforced on the backend, not just the UI.
- **Reviews only open after the event ends** — no more reviewing something that
  hasn't happened yet.

## Project structure

```
clubverse/
├── backend/    Node.js + Express + SQLite (via sql.js) API
└── frontend/   React + Vite app
```

## How the roles work

- **student** — signs up with a `@poornima.edu.in` email. Browses events, RSVPs, and
  reviews events once they've ended.
- **club_admin** — has a dashboard scoped to their own club: post/edit/delete events,
  attach photos/videos, see who RSVP'd, and read their club's reviews. Can't RSVP or
  review (they run events, they don't attend as a student). Capped at 2 per club.
- **dean** — sees the university-wide dashboard, promotes/demotes club admins, and can
  view the participant list for *any* event. Also can't RSVP or review.

There's no self-signup for `club_admin` or `dean`. Instead:

1. A student signs up normally.
2. The dean promotes them — log in as dean, go to **Manage admins**, search the
   student, pick their club, click "Make admin." Each club shows how many of its 2
   admin slots are filled; a full club's option is disabled in the dropdown.
3. That student logs out and back in, and lands on their own **Dashboard** (`/admin`)
   from then on — this is a completely different view from the dean's or a student's,
   scoped entirely to their one club.

A default dean account is seeded automatically:
- Email: `dean@poornima.edu.in`
- Password: `changeme123` — **change this before this ever goes near real users.**

## Signup is restricted to your college email

Only `@poornima.edu.in` emails can sign up (enforced on the backend). If your real
student email domain differs, change it in `backend/.env` (`ALLOWED_EMAIL_DOMAIN=...`)
and `frontend/.env` (`VITE_ALLOWED_EMAIL_DOMAIN=...` — this one only powers the
friendly client-side hint).

## Running it locally

You need [Node.js](https://nodejs.org) installed (v18+).

**⚠️ If your project folder lives inside OneDrive, Dropbox, or Google Drive**, move it
to a plain local folder first (e.g. `C:\Projects\ClubVerse`). Cloud-sync tools lock
and scan files while Node writes to them, which causes confusing errors.

### 1. Backend

```bash
cd backend
npm install
npm start
```

Starts the API on `http://localhost:4000`. First run creates `clubverse.sqlite`
(seeded with your real clubs/committees + the dean account) and an `uploads/` folder
for photos/videos — nothing else to configure.

**Upgrading from an older copy of this project?** Your existing database is safe —
the app automatically adds the new columns it needs to your existing data the first
time it starts (see `migrateExistingEventsTable` in `backend/src/db/index.js` if
you're curious how). You don't need to delete anything.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Starts the app on `http://localhost:5173`, already pointed at the backend above.

## What's built

- **Auth** — college-domain-restricted signup, login, JWT sessions, 3 roles
- **Student feed** — search + filter by club/committee, rich event pages (venue,
  dates, eligibility, format, contact info, photo/video gallery), RSVP toggle,
  reviews (once an event has ended), a "My RSVPs" page
- **Club pages** (`/clubs/:id`) — a club's public event history and stats
- **Club Admin Dashboard** (`/admin`) — club-scoped stats, event list with
  manage/edit/delete, ratings & reviews feed, and a "post new event" flow with every
  field a real event announcement needs
- **Media uploads** — photos and videos per event, stored on disk and served
  statically (not bloating the database — see the note in `backend/src/routes/events.js`
  if you're curious why that matters for our SQLite setup)
- **Participant lists** — dean (any event) or the event's own club admin
- **Dean Dashboard** — KPI summary, events-per-committee chart, inactive-clubs list
- **Manage Admins** — promote/demote with the 2-per-club cap enforced and visible
- **UI polish** — toasts, skeleton loading, empty states, mobile-responsive nav,
  animations, a landing hero, a 404 page

## Deploying it for real

**Backend** (Node + SQLite + local file uploads):
- [Render](https://render.com) — "New Web Service", build command `npm install`,
  start command `npm start`, root directory `backend`. Set `JWT_SECRET` and
  `ALLOWED_EMAIL_DOMAIN` env vars.
- ⚠️ Render's free tier has an *ephemeral filesystem* — both the SQLite file **and**
  any uploaded photos/videos reset on redeploy. Fine for a hackathon demo. For
  anything longer-term, ask me about migrating to Postgres + a proper file storage
  service (e.g. Cloudinary or S3) — that's a bigger change than the database swap
  alone, since it also touches the upload endpoint.

**Frontend** (React/Vite):
- [Vercel](https://vercel.com)/[Netlify](https://netlify.com) — root directory
  `frontend`, build command `npm run build`, output directory `dist`. Set
  `VITE_API_URL` and `VITE_ALLOWED_EMAIL_DOMAIN`.

## Good next additions

- Email notifications when a club posts a new event
- A dean UI for promoting admins that also shows a searchable list of *all* clubs
  and their current admins in one table (right now that list is at the bottom of
  Manage Admins)
- Pagination once the event list gets long
- Migrating from SQLite + local disk to Postgres + cloud storage for a permanent
  (non-hackathon) deployment
