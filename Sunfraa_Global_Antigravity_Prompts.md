# Sunfraa Global — Antigravity Build Prompts

**How to use this file:** Run these prompts **in order**, one at a time, in the same Antigravity project. Let each one finish and verify it (build succeeds, no obvious errors) before pasting the next — don't queue them all at once. Each prompt assumes `Sunfraa_Global_Technical_PRD_Antigravity.md` is available in the project context; reference it explicitly the first time so the agent reads it before writing code.

Where a prompt says **"Stop and confirm before continuing"**, actually stop — those are the points where a wrong turn is expensive to unwind later (schema shape, RLS strategy, nav structure).

---

## Prompt 1 — Project Foundation & Supabase Setup

```
Read Sunfraa_Global_Technical_PRD_Antigravity.md in full before doing anything else — it's the
source of truth for this entire build. Then:

1. Scaffold a new Next.js 14+ App Router project with TypeScript and Tailwind CSS.
2. Set up Supabase: install @supabase/supabase-js and @supabase/ssr. Create the standard
   browser client, server client, and middleware client helpers for App Router (separate
   files under lib/supabase/), following Supabase's official Next.js App Router pattern —
   not the older auth-helpers package, which is deprecated.
3. Set up environment variables for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY,
   with a .env.example file (no real values) committed and .env.local gitignored.
4. Set up the base Tailwind config and a minimal, clean design system: a neutral color
   palette, one accent color, and consistent spacing — this is an internal operations tool,
   not a marketing site, so prioritize clarity and density over visual flourish.
5. Do NOT build any pages, schema, or auth logic yet. This prompt is infrastructure only.

Confirm the project builds and runs with `npm run dev` before stopping.
```

---

## Prompt 2 — Database Schema & RLS Policies

```
Using Section 4 (Data Model) and Section 2A (Supabase RLS Strategy) of
Sunfraa_Global_Technical_PRD_Antigravity.md as the exact spec, write the full Supabase
migration SQL for every table in Section 4: profiles, projects, site_surveys, design_files,
boms, bom_items, stock_ledger, delivery_challans, labour_teams, labour_assignments,
execution_stage_progress, execution_completions, follow_up_logs, liaisoning_records,
discom_follow_up_logs, and cei_records.

Requirements:
- Use snake_case for all table and column names (Postgres convention), even though the PRD
  document uses camelCase for readability — translate consistently.
- Every enum in the PRD (UserRole, ProjectCategory, ProjectStage, ExecutionStage, etc.)
  becomes a Postgres enum type.
- Every foreign key relationship in the PRD must be an actual FK constraint.
- Implement the (labour_team_id, assigned_date) uniqueness constraint from Business Rule 7
  as a real database UNIQUE constraint, not application logic.
- Enable Row Level Security on every table.
- Implement the auth_role() helper function exactly as shown in Section 2A, then write RLS
  policies for every table based on the Section 3 permissions table. Every "only X role can
  do Y" statement in Section 3 and in the per-module Business Rules (Sections 5-10A) needs a
  corresponding policy — go through each role row in the Section 3 table and each numbered
  Business Rule one at a time, and write the policy for it. Do not skip any.
- Set up Supabase Storage buckets: site-survey-photos, design-files, delivery-challans,
  meter-reports — with storage policies matching the same role rules.

Output this as one or more numbered SQL migration files in supabase/migrations/, in the
correct dependency order (tables with no foreign keys first). Stop and confirm the schema
with me before writing any application code against it.
```

---

## Prompt 3 — Auth, Profiles, and Manager Control Page

```
Referencing Section 10A (Module 7 — Manager Control Page) and the profiles table from
Section 4 of Sunfraa_Global_Technical_PRD_Antigravity.md:

1. Build the login page and Supabase Auth session handling (middleware.ts checking session
   on every request).
2. On first login for a user with no profiles row (only relevant for whatever seed/bootstrap
   Director account we create manually in Supabase directly), redirect to a minimal setup
   flow — but for every user created from here on, the profile is created directly by the
   Manager Control Page in step 3, not by self-signup. There is no public sign-up page in
   this app.
3. Build /admin/users (list), /admin/users/new (create), and /admin/users/[userId] (edit,
   deactivate) exactly as specified in Section 10A. Use Supabase Auth's admin API
   (server-side only, using the service role key, never exposed to the client) to create
   auth users, then insert the matching profiles row in the same server action.
4. Enforce Business Rules 15-17 from Section 10A: Director-only access (route guard AND
   relying on the RLS policies already written in Prompt 2 — don't re-implement permission
   logic here, the database already enforces it), immediate effect of role changes, and
   deactivation-not-deletion.
5. Build a basic account menu (top-right, shows current user's name and role, sign-out
   action) that will appear on every authenticated page going forward.

Test this by manually creating one Director account directly in Supabase, logging in as
them, and confirming they can create a second user of each other role from the UI.
```

---

## Prompt 4 — App Shell & Role-Based Navigation

```
Referencing the "Role-Based Navigation" subsection under Section 3 of
Sunfraa_Global_Technical_PRD_Antigravity.md:

1. Build the authenticated app shell: sidebar nav + top bar (reusing the account menu from
   Prompt 3), consistent across every module.
2. Build a single role -> module routes lookup table (one file, not scattered conditionals)
   mapping each of the 7 roles to the nav items they should see:
   - DIRECTOR: everything, including Admin
   - SALES: Pipeline
   - ACCOUNTS: Accounts Dashboard
   - SITE_EXECUTION: Site Survey (within Pipeline) + Execution
   - STORE_PURCHASE: Store & Purchase
   - DESIGN: Design
   - LIAISONING: Liaisoning
3. The sidebar renders only the current user's matching items, read from that lookup table.
4. Add middleware-level route guards: if a user's role doesn't match the route they're
   requesting, redirect them to their own default module's home page rather than showing
   an error page — keep it seamless.
5. Build placeholder pages (just a heading, "Coming soon") for every route in the lookup
   table so navigation can be tested end-to-end right now, before any module has real
   functionality.

Test by logging in as one user per role (create them via /admin/users if you haven't
already) and confirming each sees a different, correctly-scoped sidebar, and that typing
another role's URL directly redirects rather than showing their content.
```

---

## Prompt 5 — Module 1: Pipeline (Sales)

```
Build Module 1 exactly as specified in Section 5 of Sunfraa_Global_Technical_PRD_Antigravity.md.
Replace the placeholder pages from Prompt 4 for this module.

Include:
- /pipeline (list/kanban by stage, scoped to lead_owner_id for SALES role, all projects for
  DIRECTOR — this scoping should already be enforced by RLS from Prompt 2, but the UI query
  should also filter sensibly rather than fetching everything and hiding rows client-side)
- /pipeline/new (lead intake form — exact fields from the Project entity's lead-stage fields)
- /pipeline/[projectId] (full detail page, all sections listed in Section 5)
- /pipeline/[projectId]/site-survey (mobile-first form, exact fields from the SiteSurvey
  entity)

Implement Business Rules 1-3 from Section 5:
- The 15-day stale rule as a Supabase scheduled Edge Function (or a cron-triggered database
  function, whichever is more idiomatic for Supabase) — not something computed only at
  read-time in the frontend.
- The 3-day reminder cadence, same approach.
- The sanctioned load fallback validation.

The Payment section on this page shows status only, with no edit control — that action
lives in Module 2 (Accounts Dashboard), which we'll build next. Don't build it here even
as a placeholder.
```

---

## Prompt 6 — Module 2: Accounts Dashboard

```
Build Module 2 exactly as specified in Section 6 of Sunfraa_Global_Technical_PRD_Antigravity.md.

Include:
- /accounts (summary cards, full project table with filters, and the "Mark payment
  collected" action)

Implement Business Rule 4 precisely: marking payment collected must set paymentStatus,
paymentCollectedAt, paymentCollectedById, and advance stage to PAYMENT_COLLECTED, AND must
auto-create the liaisoning_records row for that project (this is the trigger described in
Module 6 / Business Rule 12 — implement it now even though we haven't built the Liaisoning
UI yet, since the row needs to exist by the time we get there). Do this as a database
trigger on the projects table (on paymentStatus changing to COLLECTED), not as
application-level logic split across two places — a trigger guarantees it happens no
matter which code path updates the row.

Verify the RLS policy from Prompt 2 actually blocks a non-Accounts, non-Director user from
calling this update directly (test via the Supabase client in a script or the SQL editor
impersonating another role, not just by confirming the button is hidden in the UI).
```

---

## Prompt 7 — Module 3: Project Execution

```
Build Module 3 exactly as specified in Section 7 of Sunfraa_Global_Technical_PRD_Antigravity.md.

Include:
- /execution (queue, filtered to director_approved_at is not null and stage not yet
  EXECUTION_COMPLETE)
- /execution/[projectId] with: BOM reference, material-received toggle, labour assignment
  panel, the four ordered stage cards, and the completion form

Implement Business Rules 5-9:
- Director approval gate (build the simpler option mentioned in Business Rule 5 — a
  dedicated /director/approvals queue page rather than burying it in the Pipeline detail
  page, since Directors will want one place to see everything awaiting their approval).
- The BOM-shell auto-creation trigger on director_approved_at being set.
- The labour uniqueness constraint (already enforced at the DB level from Prompt 2 — here,
  just make sure the UI surfaces the resulting database error as a clear, human-readable
  message rather than a raw constraint violation).
- Stage order enforcement (check this server-side in the server action, in addition to
  disabling out-of-order buttons in the UI).
- The post-completion handoff trigger advancing stage to LIAISONING_IN_PROGRESS or
  CEI_IN_PROGRESS based on ceiRequired.

Build the /director/approvals page as part of this prompt too, since it's tightly coupled
to this module's entry point.
```

---

## Prompt 8 — Module 4: Store & Purchase

```
Build Module 4 exactly as specified in Section 8 of Sunfraa_Global_Technical_PRD_Antigravity.md.

Include:
- /store with: the incoming BOM-shell queue (fill in BOM items), current stock aggregate
  view, Stock IN form, and Stock OUT form

Implement Business Rule 10: a stock_ledger row with direction=OUT must fail at the database
level without a linked delivery_challan_id (this should already be enforced by a NOT NULL +
check constraint or similar from Prompt 2 — if it isn't, add it now rather than only
validating in the form). The Stock OUT flow should require creating the Delivery Challan
first, then use its id when logging the ledger entries, all as one atomic transaction —
don't leave a state where a challan exists with no stock movement, or vice versa.
```

---

## Prompt 9 — Module 5: Design Team

```
Build Module 5 exactly as specified in Section 9 of Sunfraa_Global_Technical_PRD_Antigravity.md.

Include:
- /design with two tabs: Design Queue and CEI Drawing Queue, computed independently per
  Business Rule 11
- /design/[projectId] with site survey reference data, upload history for both file types,
  and re-upload/versioning (increment the version field, keep prior versions retrievable
  rather than overwriting)

Pay particular attention to the queue-computation logic — re-read the exact queue
definitions under Module 5 in the PRD (Design Queue vs CEI Drawing Queue conditions) and
implement them precisely; these two queues have different trigger conditions and it's easy
to accidentally merge them into one incorrect query.
```

---

## Prompt 10 — Module 6: Liaisoning Team

```
Build Module 6 exactly as specified in Section 10 of Sunfraa_Global_Technical_PRD_Antigravity.md.
This is the most detail-dense module — read it twice before starting.

Include:
- /liaisoning (queue of projects with stage >= PAYMENT_COLLECTED)
- /liaisoning/[projectId] with: document intake reference, registration, estimate
  generation, "mark estimate paid," DISCOM follow-up log, "mark connected" + meter report
  upload, and — conditionally, only when ceiRequired is true — the full CEI sub-panel

Critical details, don't skip these:
- The govt-portal estimate section must be visually and structurally distinct from the
  Accounts customer quotation (Business Rule/note in Section 10) — use different labels,
  different section styling, maybe even a different color accent, so nobody confuses the
  two numbers. This has been flagged twice in the source PRD as an easy mistake — take it
  seriously.
- The CEI sub-panel must be completely absent from the DOM (not just visually hidden) when
  ceiRequired is false, for projects <=10kW — confirm this by inspecting the rendered page
  for a non-CEI project, not just by checking the conditional in the code.
- The CEI drawing approval status pulls live from Module 5's DesignFile records
  (type=CEI_DRAWING) — this is a cross-module read, make sure it reflects the actual
  current state there, not a stale copy.
- Confirm Business Rule 12 (auto-creation on payment) from Prompt 6 is working correctly by
  testing that a freshly-paid project appears in this queue without any manual action.
```

---

## Prompt 11 — Final Cross-Module QA Pass

```
Now that all 7 modules (Pipeline, Accounts, Execution, Store & Purchase, Design, Liaisoning,
and Manager Control) are built, go through Section 13 (Acceptance Criteria) of
Sunfraa_Global_Technical_PRD_Antigravity.md item by item. For each checkbox:

1. State how you verified it (which page, which action, which role you tested as).
2. If you cannot verify one — implement whatever is missing to make it pass, don't just
   note it as a gap and move on.

Pay special attention to every acceptance criterion that says "verified via a direct
server action call bypassing the UI" or similar — these are testing that RLS/server-side
enforcement actually works, not just that a button is hidden. Write a short test script (or
manually test via the Supabase SQL editor impersonating each role) for at least the payment
permission, labour uniqueness, stage order, and delivery challan requirement rules, since
those are the four explicitly called out as most likely to be shortcut by an AI agent.

Finally, do a pass across all six business modules confirming the shared Project.stage
value is being read and written consistently everywhere it's referenced — this is the one
field every module depends on, and inconsistency here is the most likely source of subtle
bugs.
```

---

## After This: What's Genuinely Out of Scope

Don't feed Antigravity prompts for Service/After-Sales, dedicated Director-only dashboards beyond what's built here, WhatsApp API integration, GST/e-invoicing/Tally integration, or any direct government portal integration — all confirmed out of scope in Section 12 of the technical PRD. If these come up later, they're new prompts against an updated PRD, not something to sneak into one of the eleven above.
