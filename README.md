# Study Planner — Real App (Next.js + Supabase)

This replaces the earlier static preview (`dashboard.jsx` standalone) with a
deployable Next.js app: real accounts, real per-user data, ready for Vercel.

**Start here → `DEPLOY.md`** for the exact steps to get this live with your
own Supabase project. This file covers what's actually in the codebase.

## What changed from the prototype

The previous version had every card's data hardcoded in React state — tasks,
meetings, notes, all reset on refresh, no accounts. This version:

- Adds email/password sign-up and sign-in via Supabase Auth (`app/login`)
- Adds a Postgres schema with Row Level Security so each user's data is
  isolated at the database level, not just by the app remembering to filter
  (`supabase/schema.sql`)
- Replaces every hardcoded array with a fetch from an API route on load,
  and a write-through on every interaction (checking a box, adding a note,
  moving a tracker dot)
- Adds middleware that redirects signed-out visitors to `/login` and keeps
  the auth session refreshed

The visual design — colors, spacing, card dimensions, the timeline math fix
from before — carries over unchanged from `UI_Design.md`.

## Guest mode

Anyone who isn't logged in can click **Continue as guest** on `/login` and
land on a fully interactive dashboard, pre-filled with sample data. Every
interaction — checking off a task, adding a note, moving a tracker dot —
still works, but nothing leaves the browser: no fetch calls fire, nothing
touches Supabase. A refresh (or the "Sign in to save" prompt in the nav)
is the only way out, and a refresh resets the sample data back to its
starting point.

**No schema changes needed for this.** Guest data never reaches Supabase,
so `supabase/schema.sql` is unchanged and doesn't need to be re-run.

Mechanically: a plain `sp_guest` cookie (not a Supabase session, no data in
it) is set when someone clicks "Continue as guest," and `middleware.js`
checks for either a real session or that cookie before allowing `/`. Once
on the dashboard, the page itself only cares whether `supabase.auth.getUser()`
returned someone — no user means guest, full stop, regardless of why
middleware let the request through. That single check is what every write
handler (`togglePriorityTask`, `addNote`, `saveDaily`, etc.) uses to skip
its network call and just update local React state instead.

## Planners, folders, templates, PDF export, and drag-and-drop

This is a real architectural shift, not additive UI: the app used to treat
"your data" as one undifferentiated pool per account. Now every account can
have multiple named planners, organized into folders, each built from one
of three templates.

**Run `supabase/migration_002_planners_folders.sql` in the SQL Editor** —
after `schema.sql`, as a second step. This is not optional if you already
have real users: it's what creates the `planners`/`folders` tables and
migrates existing tasks/notes/meetings/timeline/daily_state rows onto a
default planner so nothing is orphaned. I ran this migration against a real
local Postgres instance with simulated pre-existing user data (not just
Supabase, since I don't have credentials for a live project) and confirmed
row counts matched exactly before and after, no row was left with a null
`planner_id`, and RLS genuinely isolated two different simulated users from
each other's planners — tested as a non-superuser role, since Postgres
superusers bypass RLS by default and would give a false pass.

**What's new:**
- `/` is now the **Library** — your planners, grouped by folder, with a
  "New folder" button and a "Move to folder" dropdown per planner (not
  drag-and-drop into folders — that's a bigger feature than what a plain
  select accomplishes, kept out for now)
- `/gallery` — pick one of **3 real templates** (Dashboard, Weekly, Minimal)
  to create a new planner. The original proposal listed ~23; building
  bespoke designs for the other 20 would mean inventing designs with no
  spec to work from, so this stays honest at 3 working ones rather than
  faking a bigger gallery
- `/planner/[id]` — the actual interactive planner, dispatching to
  whichever template component matches
- `/planner/guest` — the one route an unauthenticated visitor can reach;
  guest mode is unchanged in spirit, always the Dashboard template, never
  touches the network
- **Drag-and-drop**: on the Dashboard template, the Priorities/Goal cards
  and the Due Next/Meetings cards can each be reordered within their
  column via a small grip handle (visible on hover, not the whole card —
  so it can't accidentally fire from clicking a checkbox). This is
  block-level reordering within the existing designed layout, not
  free-form pixel placement, which would mean abandoning the curated grid
  from `UI_Design.md` in favor of a generic layout engine
- **PDF export**: real, tested — verified end-to-end in this sandbox using
  a standalone Node script before it was ever wired into a route, including
  the exact component with realistic data (magic bytes, structure, and a
  `file` command all confirm a genuine PDF, not just bytes with a `.pdf`
  extension). Deliberately a **light theme**, not the app's dark UI —
  printing a near-solid-black page wastes ink and defeats the point of
  "printable." Currently Dashboard-only; Weekly and Minimal show no export
  button rather than a broken one. Guests export entirely client-side from
  in-memory sample data (no server round-trip possible — there's no
  persisted planner row to look up)

## Structure

```
app/
  page.js                    — Library: your planners, grouped by folder
  gallery/page.js             — template picker, creates a new planner
  planner/[id]/page.js        — the actual interactive planner
  login/page.js                — sign up / sign in / continue as guest
  auth/callback/route.js       — handles email confirmation redirect
  api/
    planners/                  — list/create; [id] for get/rename/move/delete
    folders/                    — list/create; [id] for rename/delete
    tasks/ meetings/ notes/ timeline/ trackers/
                                — all planner_id-scoped now (see below)
    planners/[id]/pdf/          — server-side PDF export (Dashboard template only)
components/
  TopNav.js, GuestBanner.js    — shared across Library and Planner shell
  ExportPdfButton.js            — handles both real (server) and guest (client) export
  PlannerPDFDocument.js         — the shared print-layout, light theme
  templateCatalog.js            — the 3-template catalog
  templates/
    DashboardTemplate.js         — the full daily view, with drag-and-drop
    WeeklyTemplate.js             — 7-day grid
    MinimalTemplate.js            — single flat checklist
lib/
  supabase-browser.js          — client-side Supabase instance
  supabase-server.js            — server-side instance (route handlers read cookies)
middleware.js                   — session refresh + route protection
supabase/
  schema.sql                    — run first
  migration_002_planners_folders.sql
                                 — run second (see above)
```

## How data flows

Every table has a `user_id` column and an RLS policy checking
`auth.uid() = user_id`. The API routes also filter by the session's user id
explicitly (redundant with RLS, but makes the code's intent readable without
cross-referencing the policy file). The one thing to never do: don't add a
`service_role` key anywhere client-reachable — it bypasses RLS entirely, and
this app has no code path that needs it. `.env.local.example` has a longer
note on this.

The dashboard does optimistic updates: clicking a checkbox flips it in the
UI immediately, then confirms with the server in the background. If the
server call fails, it reverts. This keeps interactions feeling instant
without lying about what's actually saved.

## What I verified vs. couldn't verify here

I ran a full `npm run build` in this sandbox and confirmed every route,
the middleware, and all component logic compile cleanly with no errors —
that catches the class of bug (typos, bad imports, broken JSX) most likely
to surface as a build failure on Vercel.

One thing I could *not* fully verify end-to-end here: this sandbox's network
allowlist blocks `fonts.googleapis.com`, which `next/font` needs to reach at
build time to self-host the Inter and Caveat fonts. I confirmed the rest of
the app builds clean with fonts stripped out, and `next/font` is Next.js's
standard, documented approach for exactly this (it's what `create-next-app`
generates by default) — but I want to be upfront that this specific piece
is untested by me directly, since Vercel's build environment has open
internet access and mine doesn't. If the build fails on Vercel specifically
at the font-loading step, swapping `next/font/google` for a plain `<link>`
tag in `app/layout.js` (like the original prototype used) is the fallback.

I also have not tested this against a live Supabase instance, since I don't
have credentials for one — the schema and RLS policies are written correctly
per Supabase's documented patterns, but the "add a task, refresh, confirm
it's still there" check in `DEPLOY.md` step 7 is the real end-to-end test,
and it's worth doing carefully rather than assuming it just works.

## Local development

```bash
cp .env.local.example .env.local
# fill in your Supabase URL + anon key
npm install
npm run dev
```

## Not built yet

Everything in the original "Not built yet" list — template gallery, PDF
export, drag-and-drop, folder organization — now has a real, working
implementation. What's still simplified or missing, stated plainly rather
than left implicit:

- **Only 3 templates**, not the ~23 the original proposal listed. Building
  the rest needs actual design specs the way `UI_Design.md` gave for the
  Dashboard — happy to build more once there's something to build from,
  rather than inventing looks with no spec.
- **Drag-and-drop is block-level**, not free-form. Cards reorder within
  their existing column, not to arbitrary positions — full pixel-placement
  would mean replacing the curated grid layout with a generic grid engine.
- **PDF export is Dashboard-only.** Weekly and Minimal don't show an
  export button rather than a broken one.
- **Folder assignment is a dropdown, not drag-and-drop.** Moving a planner
  into a folder works, just not via dragging the card itself.
- **No drag-and-drop for full-customization** in the broader sense the
  original proposal described (resize elements, change fonts/colors per
  planner, upload photos/logos, choose page size/orientation for export).
  Those weren't part of this round — worth scoping separately if wanted.

