# Sunfraa Global — Operations Platform
## Technical PRD / Build Spec for Antigravity

**Status:** Client-approved scope (6 modules). This is the authoritative technical spec for the build — the companion client-facing PRD covers the same scope in business language; this document covers implementation.

---

## 1. Objective

Build a single Next.js application replacing Sunfraa Global's Excel/WhatsApp/Tally-based coordination across six departments: Sales, Accounts, Project Execution, Store & Purchase, Design, and Liaisoning. One shared `Project` entity flows through all six modules — this is not six separate tools bolted together, it's one project record moving through stages, with each module owning a slice of that record's lifecycle.

Service/After-Sales and dedicated Director-only views are explicitly out of scope (Section 9).

---

## 2. Tech Stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth — email/phone + password. A `profiles` table (1:1 with `auth.users`, keyed by `id`) carries `name`, `phone`, `role`, `active`, since Supabase's built-in `auth.users` table doesn't hold custom app fields
- **Data access:** Supabase client (`@supabase/supabase-js` + `@supabase/ssr` for server/client split in App Router). Enforce every permission rule in Section 3 as a **Postgres Row Level Security (RLS) policy** on each table, not just in application code — this is the Supabase-idiomatic way to guarantee server-side enforcement and it means a rule holds even if a future client (mobile app, direct API call) bypasses the Next.js layer entirely
- **File storage:** Supabase Storage (buckets: `site-survey-photos`, `design-files`, `delivery-challans`, `meter-reports`), with Storage policies mirroring the same role rules
- **Hosting:** Next.js deployment (Vercel or equivalent) + Supabase project (hosted)
- **Mutations:** Prefer Next.js Server Actions calling the Supabase client over separate API routes, except where a plain REST/Route Handler is clearly simpler (e.g., file upload handling)

---

## 2A. Supabase RLS Strategy (read this before writing any policy)

Every table in Section 4 needs RLS enabled with policies derived directly from the Section 3 permissions table. The pattern to use throughout:

```sql
-- Helper: get the current user's role from profiles, reusable in every policy
create or replace function auth_role() returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql stable security definer;
```

Then, for example, the payment-update rule (Business Rule 4) becomes an actual database guarantee, not just a UI restriction:

```sql
create policy "only accounts or director can update payment fields"
  on projects for update
  using (auth_role() in ('ACCOUNTS', 'DIRECTOR'))
  with check (auth_role() in ('ACCOUNTS', 'DIRECTOR'));
```

Apply the same pattern for every "only X role can Y" rule in this document — Sales editing only their own leads (`lead_owner_id = auth.uid() or auth_role() in ('DIRECTOR')`), Design only touching their two queues, Liaisoning only past payment stage, and so on. **Do not rely on hiding buttons in the UI as the actual enforcement mechanism anywhere in this build** — RLS is the enforcement; the UI just reflects it.

---

## 3. Roles & Permissions

```
enum UserRole {
  DIRECTOR
  SALES
  ACCOUNTS
  SITE_EXECUTION   // merged Site Engineer + Project Execution Team — same people, one role
  STORE_PURCHASE
  DESIGN
  LIAISONING
}
```

| Role | Access Summary |
|---|---|
| `DIRECTOR` | Full read/write on every project and module. Approves projects before execution. Overrides any permission below. **Also the only role that can access the Manager Control Page (Module 7) to create and manage user accounts.** |
| `SALES` | Full read/write on projects where they are `leadOwnerId`. Cannot edit `paymentStatus`. |
| `ACCOUNTS` | Read access to all projects. The **only** role (besides `DIRECTOR`) that can write `paymentStatus` / `paymentCollectedAt`. No other write access. |
| `SITE_EXECUTION` | Read/write on `SiteSurvey` for assigned projects. Read/write on execution stages, labour assignment, and completion data for projects past Director approval. No access to quotation or payment fields. |
| `STORE_PURCHASE` | Read/write on `BOM`, `StockLedger`, `DeliveryChallan`. Read-only on project basic info needed for context. |
| `DESIGN` | Read/write on `DesignFile` records (both `INITIAL` and `CEI_DRAWING` types) for projects in their queues. Read-only on `SiteSurvey` for reference. No access to quotation, payment, or execution data. |
| `LIAISONING` | Read/write on `LiaisoningRecord`, `DiscomFollowUpLog`, and `CEIRecord` for projects past payment stage. Read-only on documents Sales attaches. No access to quotation editing or payment collection. |

**"Manager" note:** the client asked for a "manager control page" — in this schema that maps to the existing `DIRECTOR` role, not a new separate role. If Sunfraa Global later wants someone who can manage users but isn't a full Director, that's a schema change (a distinct `MANAGER` role with a narrower permission set), not something to guess at now — flag it back to the client if it comes up.

### Role-Based Navigation

Every user, regardless of role, sees **only the nav items/modules that match their role** — Sales never sees a "Store & Purchase" link, Design never sees "Accounts," and so on. Two layers, both required:

1. **Nav rendering:** the sidebar/nav component reads `currentUser.role` and renders only the matching module links, from a single lookup table (role → array of module routes) so this stays in one place, not scattered `if` checks across components.
2. **Route guards:** middleware (`middleware.ts`) checks the requesting user's role against the route being accessed and redirects to their own default module if it doesn't match — this is the actual security boundary; the nav-hiding in (1) is just UX, someone typing a URL directly must still be blocked server-side (backed further by the RLS policies in Section 2A, which block the underlying data regardless of what route they reach).


**Enforce every rule server-side.** UI hiding is not sufficient anywhere in this spec — this is called out again per-module below because it matters most for payment and approval actions.

---

## 4. Data Model

### `profiles` (referred to as `User` throughout this document, for readability)
1:1 with Supabase's `auth.users`, created via a trigger on signup or directly by the Manager Control Page (Module 7).

| Field | Type | Notes |
|---|---|---|
| id | uuid | **same value as `auth.users.id`** — FK + PK, not a separate generated id |
| name | string | |
| phone | string | |
| role | `UserRole` | |
| active | boolean | default true; `false` blocks login |

### `Project` — the central entity
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| clientName | string | required |
| address | string | required |
| phone | string | required |
| category | enum `ProjectCategory`: `RESIDENTIAL_BUNGALOW`, `RESIDENTIAL_FLAT`, `COMMERCIAL`, `INDUSTRIAL` | |
| kwRequired | float | |
| sanctionedLoad | string \| null | may be filled at lead intake or site survey |
| connectionNumber | string \| null | same as above |
| leadOwnerId | FK → User | Sales owner; drives Sales edit permission only, not payment |
| stage | enum `ProjectStage` (see below) | |
| quotationAmount | decimal \| null | Accounts/Sales customer-facing quotation |
| quotationSentAt | datetime \| null | |
| paymentStatus | enum: `PENDING`, `COLLECTED` | |
| paymentCollectedAt | datetime \| null | writable only by `ACCOUNTS` / `DIRECTOR` |
| paymentCollectedById | FK → User \| null | |
| directorApprovedAt | datetime \| null | |
| directorApprovedById | FK → User \| null | |
| ceiRequired | boolean | computed: `kwRequired > 10`, recompute on any kW change |
| createdAt / updatedAt | datetime | |

**`ProjectStage` enum:**
```
LEAD
SITE_SURVEY_SCHEDULED
SITE_SURVEY_DONE
DESIGN_PENDING
DESIGN_UPLOADED
QUOTATION_SENT
STALE
PAYMENT_COLLECTED
DIRECTOR_APPROVED
EXECUTION_IN_PROGRESS
EXECUTION_COMPLETE
LIAISONING_IN_PROGRESS
CEI_IN_PROGRESS        // only entered if ceiRequired
CONNECTED
CLOSED
```

### `SiteSurvey` (1:1 with Project)
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| projectId | FK → Project | |
| noOfPanels | int | |
| physicalMeasurement | text | |
| photoUrls | string[] | required, min 1 |
| diagramUrls | string[] | optional |
| gpsLocation | string (lat,lng) | |
| contactedPerson | string | on-site contact |
| surveyedById | FK → User | must have role `SITE_EXECUTION` |
| surveyedAt | datetime | |

### `DesignFile`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| projectId | FK → Project | |
| type | enum: `INITIAL`, `CEI_DRAWING` | drives which Design queue it belongs to |
| fileUrl | string | |
| version | int | increments on re-upload |
| uploadedById | FK → User | role `DESIGN` |
| uploadedAt | datetime | |

Design Queue = projects where `stage = SITE_SURVEY_DONE` and no `DesignFile` with `type=INITIAL` exists yet.
CEI Drawing Queue = projects where `ceiRequired = true`, `stage = EXECUTION_COMPLETE` or later, and no `DesignFile` with `type=CEI_DRAWING` exists yet (or the existing one hasn't been approved — see `CEIRecord`).

### `BOM` / `BOMItem`
| `BOM` field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| createdById | FK → User |
| createdAt | datetime |

| `BOMItem` field | Type |
|---|---|
| id | uuid |
| bomId | FK → BOM |
| itemName | string |
| category | string |
| quantity | float |
| unit | string |

### `StockLedger`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| itemName | string | |
| direction | enum: `IN`, `OUT` | |
| quantity | float | |
| projectId | FK → Project \| null | required for `OUT`, null for general `IN` |
| deliveryChallanId | FK → DeliveryChallan \| null | required for `OUT` |
| createdById | FK → User | role `STORE_PURCHASE` |
| createdAt | datetime | |

### `DeliveryChallan`
| Field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| vehicleType | string |
| registrationNumber | string |
| driverName | string |
| driverMobile | string |
| distance | float |
| createdById | FK → User |
| createdAt | datetime |

### `LabourTeam`
| Field | Type |
|---|---|
| id | uuid |
| name | string |
| headcount | int |
| available | boolean |

### `LabourAssignment`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| labourTeamId | FK → LabourTeam | |
| projectId | FK → Project | |
| stage | `ExecutionStage` enum (below) | |
| assignedDate | date | |

**Constraint:** unique on `(labourTeamId, assignedDate)` — enforce at the database level, not just in application logic, so a labour team can never hold two active assignments on the same date across any project.

### `ExecutionStageProgress`
| Field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| stage | enum `ExecutionStage`: `STRUCTURE_FABRICATION`, `PANEL`, `WIRING`, `CIVIL` |
| photoUrl | string |
| comment | text |
| completedAt | datetime |
| completedById | FK → User |

Stages must be completed in order — enforce server-side that `PANEL` cannot be marked complete before `STRUCTURE_FABRICATION` has a completion record for the same project, and so on.

### `ExecutionCompletion` (1:1 with Project, created once all 4 stages are done)
| Field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| panelSerialNumbers | string[] |
| panelCount | int |
| inverterSerialNumber | string |
| capturedVia | enum: `SCAN`, `PHOTO_OCR` |
| completedAt | datetime |

### `FollowUpLog` (Sales, 3-day cadence)
| Field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| reminderSentAt | datetime |
| assignedToId | FK → User |
| acknowledged | boolean |

### `LiaisoningRecord` (1:1 with Project, created when `stage` reaches `PAYMENT_COLLECTED`)
| Field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| documentsReceivedAt | datetime \| null |
| acknowledgementNumber | string \| null |
| govtEstimateQuotationNumber | string \| null |
| govtEstimateAmount | decimal \| null |
| estimatePaidAt | datetime \| null |
| discomFileReadyAt | datetime \| null |
| connectedAt | datetime \| null |
| meterReportUrl | string \| null |
| meterReportUploadedAt | datetime \| null |

### `DiscomFollowUpLog`
| Field | Type |
|---|---|
| id | uuid |
| liaisoningRecordId | FK → LiaisoningRecord |
| followUpDate | date |
| note | text |
| loggedById | FK → User |

### `CEIRecord` (1:1 with Project, only created if `ceiRequired = true`)
| Field | Type |
|---|---|
| id | uuid |
| projectId | FK → Project |
| selfCertificateGeneratedAt | datetime \| null |
| filedForClientSigningAt | datetime \| null |
| drawingApprovalDesignFileId | FK → DesignFile \| null | must be `type=CEI_DRAWING` |
| ceiPortalReferenceNumber | string \| null |
| ceiApprovedAt | datetime \| null |
| ceiApprovalUploadUrl | string \| null |
| inspectionReferenceNumber | string \| null |
| inspectorName | string \| null |
| inspectorDate | date \| null |
| inspectorContact | string \| null |

---

## 5. Module 1 — Pipeline (Sales)

### Pages
- **`/pipeline`** — kanban/list by `stage`. Directors see all; Sales sees only their own (`leadOwnerId = currentUser.id`).
- **`/pipeline/new`** — lead intake form (Section 4 `Project` fields at lead stage).
- **`/pipeline/[projectId]`** — full project detail:
  - Lead info (edit: owner/Director)
  - Site Survey section (empty state until `SiteSurvey` exists; edit: assigned `SITE_EXECUTION` user only)
  - Design section — shows latest `DesignFile type=INITIAL`, read-only for Sales
  - Quotation section — amount, "Mark as sent" (sets `quotationSentAt`); sending itself stays manual (WhatsApp), tool only logs it
  - Payment section — status shown for visibility; **no edit control here** — the write action lives only in the Accounts Dashboard (Module 2)
  - Stale badge — auto from Business Rule 1
  - Follow-up log — list with acknowledge action
- **`/pipeline/[projectId]/site-survey`** — mobile-friendly form for `SITE_EXECUTION`, matching `SiteSurvey` fields.

### Business Rules
1. **Stale rule:** daily cron — if `stage = QUOTATION_SENT` and `now() - quotationSentAt > 15 days`, set `stage = STALE`.
2. **Reminder cadence:** if `stage = QUOTATION_SENT`, create a `FollowUpLog` every 3 days from `quotationSentAt`, assigned to `leadOwnerId`. Stop once stage leaves `QUOTATION_SENT`.
3. **Sanctioned load fallback:** `sanctionedLoad`/`connectionNumber` optional at intake; block `SITE_SURVEY_DONE` transition if still null after survey submission.

---

## 6. Module 2 — Accounts Dashboard

### Pages
- **`/accounts`** — dashboard, one write action:
  - Summary cards: active projects, payments pending (count + value), payments collected (this month)
  - Table: client, category, stage, quotation amount, payment status, days since quotation sent, stale flag
  - Filters: stage, payment status, category
  - **"Mark payment collected"** per row

### Business Rule
4. **Payment permission:** action authorized only if `currentUser.role === 'ACCOUNTS'` or `currentUser.role === 'DIRECTOR'`. Enforce server-side. On success: set `paymentStatus = COLLECTED`, `paymentCollectedAt = now()`, `paymentCollectedById = currentUser.id`, and advance `stage = PAYMENT_COLLECTED`. This also triggers `LiaisoningRecord` creation (see Module 6).

---

## 7. Module 3 — Project Execution

### Pages
- **`/execution`** — queue of projects with `stage = DIRECTOR_APPROVED` or later, not yet `EXECUTION_COMPLETE`.
- **`/execution/[projectId]`**:
  - BOM reference (read from Module 4, created here or by Store & Purchase — see note below)
  - Material-received confirmation toggle
  - Labour assignment panel: assign a `LabourTeam` + date per stage (enforce the one-active-date constraint at save time, return a clear error if violated)
  - Four stage cards (`STRUCTURE_FABRICATION` → `PANEL` → `WIRING` → `CIVIL`), each requiring photo + comment to mark complete, enforced in order
  - Completion form (unlocks once all 4 stages done): panel serial numbers (scan or photo+OCR), panel count, inverter serial number → creates `ExecutionCompletion`, sets `stage = EXECUTION_COMPLETE`

### Business Rules
5. **Approval gate:** a project cannot enter `/execution` until `directorApprovedAt` is set. Director approval action lives on `/pipeline/[projectId]` or a dedicated `/director/approvals` queue — build the simpler of the two unless the client specifies otherwise.
6. **BOM-to-Store handoff:** on `directorApprovedAt` being set, auto-create a `BOM` shell (if none exists) and notify/flag it in Store & Purchase's queue (Module 4).
7. **Labour uniqueness:** enforce `(labourTeamId, assignedDate)` uniqueness at the database level (see Section 4).
8. **Stage order:** reject a completion attempt on `PANEL` if `STRUCTURE_FABRICATION` has no completion record for the same project (and so on for `WIRING`, `CIVIL`).
9. **Post-completion handoff:** on `ExecutionCompletion` creation, set `stage = LIAISONING_IN_PROGRESS` (or `CEI_IN_PROGRESS` if `ceiRequired`), making the project appear in Liaisoning's queue (Module 6) and, if applicable, Design's CEI Drawing Queue (Module 5).

---

## 8. Module 4 — Store & Purchase

### Pages
- **`/store`**:
  - Incoming queue: projects with a `BOM` shell created but no `BOMItem`s yet — Store fills in the BOM based on the design received via Sales/Site team
  - Current Stock view: aggregate `StockLedger` by item (`SUM(IN) - SUM(OUT)`)
  - Stock IN form (general restock, `projectId = null`)
  - Stock OUT form (tied to a project's BOM) — requires creating a `DeliveryChallan` first (vehicle type, registration number, driver name, driver mobile, distance), then logs `StockLedger` rows with `direction=OUT` referencing it

### Business Rule
10. **Challan requirement:** a `StockLedger` row with `direction=OUT` cannot be created without a linked `deliveryChallanId`. Enforce at the write layer, not just the form.

---

## 9. Module 5 — Design Team

### Pages
- **`/design`** — two tabs:
  - **Design Queue:** projects with `stage = SITE_SURVEY_DONE` and no `DesignFile type=INITIAL`. Upload action per project → creates `DesignFile`, sets `stage = DESIGN_UPLOADED`, makes it visible on `/pipeline/[projectId]`.
  - **CEI Drawing Queue:** projects with `ceiRequired = true`, `stage >= EXECUTION_COMPLETE`, no approved `DesignFile type=CEI_DRAWING`. Upload action → creates `DesignFile type=CEI_DRAWING`, which `LiaisoningRecord`'s `CEIRecord.drawingApprovalDesignFileId` references once filed.
- **`/design/[projectId]`** — site survey data (read-only reference) + upload history for both file types + re-upload (increments `version`).

### Business Rule
11. **Two independent triggers:** Design Queue and CEI Drawing Queue are computed independently — a project can be off one queue and still on the other (this is expected, not a bug: initial design happens early, CEI drawing happens post-execution).

---

## 10. Module 6 — Liaisoning Team

### Pages
- **`/liaisoning`** — queue of projects with `stage >= PAYMENT_COLLECTED`. `LiaisoningRecord` auto-created on payment collection (Business Rule 4).
- **`/liaisoning/[projectId]`**:
  - Document intake confirmation (documents collected by Sales, visible here for reference — read-only, Sales owns the upload)
  - Registration: acknowledgement number field
  - Estimate generation: govt-portal quotation number + amount (**visually and structurally distinct from the Accounts quotation on `/pipeline/[projectId]` — do not reuse the same UI component or label without disambiguating text, since both are called "quotation" by the client but are unrelated numbers**)
  - "Mark estimate paid" → sets `estimatePaidAt`, `discomFileReadyAt`
  - DISCOM follow-up log: add entry (date + note), prompted roughly every 7 days (a dashboard nudge, not an automatic notification — DISCOM's timeline isn't something the system controls)
  - "Mark connected" → sets `connectedAt`, unlocks meter report upload (sets `meterReportUrl`, `meterReportUploadedAt`, and advances `stage = CONNECTED`)
  - **If `ceiRequired`:** a CEI sub-panel — self-certificate generation, "filed for client signing" toggle, drawing approval status (pulled from Module 5's `DesignFile type=CEI_DRAWING`), CEI portal reference number, "mark approved" + upload, inspection details (reference number, inspector name, date, contact)

### Business Rules
12. **Auto-creation:** `LiaisoningRecord` is created automatically the moment `paymentStatus = COLLECTED` — Liaisoning should never need to manually "start" a project.
13. **CEI gating:** the CEI sub-panel only renders/activates if `Project.ceiRequired = true`. Do not show it for ≤10kW projects.
14. **Portals stay external:** nothing in this module calls or integrates with National Portal, GEDA, or the CEI Portal. Every field here is a manually entered status/reference number that the Liaisoning team captures after acting on the actual government system themselves.

---

## 10A. Module 7 — Manager Control Page (User Management)

### Purpose
Gives `DIRECTOR` a page to create and manage every user account and role — this is the admin surface for onboarding Sunfraa Global's team onto the platform, and the thing that makes role-based navigation (Section 3) actually usable day one.

### Pages
- **`/admin/users`** — table of all users: name, phone, role, active/inactive. `DIRECTOR`-only route (blocked at both the route guard and RLS layers for every other role).
- **`/admin/users/new`** — create a user: name, phone, role (single-select from `UserRole`), triggers Supabase Auth user creation (invite-by-phone/email flow, or a Director-set temporary password — pick whichever Supabase Auth flow is simpler to wire up first) plus the matching `profiles` row.
- **`/admin/users/[userId]`** — edit name/role, toggle `active` (deactivating blocks login without deleting history — every `...ById` field elsewhere in the schema stays intact).

### Business Rules
15. **Director-only, enforced twice:** both the Next.js route guard (Section 3, Role-Based Navigation) and an RLS policy on `profiles` (`update`/`insert` restricted to `auth_role() = 'DIRECTOR'`) must block this — don't rely on just one layer.
16. **Role changes take effect immediately:** since nav and RLS both read `role` live from `profiles`, changing a user's role here immediately changes what they can see and do, with no separate sync step needed.
17. **Deactivation, not deletion:** `active = false` should block login (check in middleware/auth callback) but never delete the user row or null out the `...ById` references throughout the schema — those references need to stay valid for historical records.

---



- **Mobile-first:** Site Survey form (Module 1) and Execution stage forms (Module 3) — both used from the field. Support local draft save before submit given inconsistent site connectivity.
- **Server-side enforcement everywhere:** every business rule in Sections 5–10 must be enforced in the server action / API handler, never only in the client UI. This applies most critically to Business Rules 4 (payment), 7 (labour uniqueness), 8 (stage order), and 10 (challan requirement).
- **File uploads:** photos, diagrams, design files, CEI drawings, delivery challans, meter reports — all need reliable storage with reasonable size limits (a few MB each). No versioning needed except on `DesignFile` (built-in via the `version` field).
- **Audit trail:** `createdAt`/`updatedAt` timestamps plus the `...ById` fields already in the schema are sufficient — no need for full field-level history logging in this phase.
- **Notifications:** in-app queue/badge counts are sufficient for Phase 1 (e.g., "3 projects in your Design Queue"). SMS/WhatsApp/email notifications are not required unless the client asks.

---

## 12. Out of Scope (matches the client-approved PRD)

- Service / After-Sales (complaint tracking) — not yet scoped
- Dedicated Director-only views beyond the full-access permissions already defined in Section 3
- WhatsApp API integration — quotation "sending" stays a manual action, the tool only logs it
- GST / e-invoicing / Tally integration — Accounts stays a status dashboard, not a financial system
- Any direct integration with National Portal, GEDA, or the CEI Portal — see Business Rule 14

---

## 13. Acceptance Criteria

- [ ] A lead can be created and appears on `/pipeline` with correct `stage`
- [ ] `SITE_EXECUTION` can submit a Site Survey from mobile; `sanctionedLoad`/`connectionNumber` block completion if still empty
- [ ] Design Queue shows a project immediately after Site Survey is marked done, and it disappears once a design is uploaded
- [ ] Marking a quotation "sent" starts both the 15-day stale timer and the 3-day reminder cycle independently
- [ ] A project auto-flags `STALE` after 15 days with no stage change, no manual action required
- [ ] Only `ACCOUNTS` or `DIRECTOR` can mark payment collected — verified via a direct server action call bypassing the UI, not just by hiding the button
- [ ] Marking payment collected auto-creates a `LiaisoningRecord` and advances the project to Liaisoning's queue
- [ ] Director approval is required before a project appears in `/execution`
- [ ] Attempting to complete `PANEL` before `STRUCTURE_FABRICATION` is rejected server-side
- [ ] Assigning a labour team to a date that conflicts with an existing assignment is rejected with a clear error
- [ ] A `StockLedger` OUT entry cannot be created without a `DeliveryChallan`
- [ ] CEI Drawing Queue only shows projects where `ceiRequired = true` and only becomes relevant after `EXECUTION_COMPLETE`
- [ ] The CEI sub-panel in Liaisoning is completely hidden/inactive for projects ≤10kW
- [ ] DISCOM follow-up entries can be logged and are visually distinct from Sales' follow-up log
- [ ] A `DIRECTOR` can create a new user with a role via `/admin/users/new`, and that user can immediately log in
- [ ] A non-Director attempting to visit `/admin/users` directly (typed URL, not nav click) is redirected — verify this at the route level, not just by confirming the nav link is hidden
- [ ] Logging in as each of the 7 roles shows a different, correctly-scoped nav — Sales never sees Store & Purchase, Design never sees Accounts, etc.
- [ ] Deactivating a user blocks their next login attempt but does not remove their name from historical `...ById` fields elsewhere in the app
- [ ] The govt-portal estimate (Liaisoning) and the customer quotation (Accounts/Sales) are never displayed in a way that could be confused for the same number
