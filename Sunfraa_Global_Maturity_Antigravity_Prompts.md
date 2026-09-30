# Sunfraa Global — Maturity Roadmap: Antigravity Build Prompts

**How to use this file:** Same rules as the original 11-prompt playbook — run these **in order**, one at a time, in the same Antigravity project that already has the live app. Every prompt here extends existing code; none of them are greenfield. Start every prompt by having the agent read the relevant existing module's code first, not just the spec doc, so it extends what's there instead of guessing at it or rewriting it.

Reference doc for all of this: `Sunfraa_Global_Maturity_Roadmap.md`. Where a prompt says **"Stop and confirm before continuing,"** actually stop.

---

## Part A — Shared Foundations (build these first; later prompts depend on them)

### Prompt 1 — Shared List Utilities: CSV Export + Saved Views

```
Before touching any specific module, build two small, reusable pieces of infrastructure
that every list view in the app (Pipeline, Accounts, Execution, Store, Design, Liaisoning)
will use going forward:

1. A CSV export utility — a single reusable component/hook that takes a dataset and column
   config and triggers a client-side CSV download. Add an "Export CSV" button to every
   existing list view in the app (pipeline, accounts, execution, store, design, liaisoning)
   using this shared utility, without changing anything else about those pages yet.

2. A saved-views mechanism — let a user save their current filter combination on any list
   view with a name, and recall it later from a dropdown. Store these per-user (linked to
   auth.uid()) in a new saved_views table (user_id, module_name, view_name, filter_json).
   Add the save/recall UI to the same list views as above.

Keep both genuinely generic — they should not contain any module-specific logic. Every
later prompt in this sequence will assume these two things already exist and just plug
list views into them.
```

### Prompt 2 — Role-Based Home Dashboards

```
Referencing the "Cross-Cutting" section of Sunfraa_Global_Maturity_Roadmap.md:

Build a proper home/landing page per role, replacing the current behavior of landing
directly on a raw list. Each role's home page should summarize what needs their attention
today, using data that already exists in the schema — don't invent new fields for this,
just surface what's already there differently:

- SALES: leads needing follow-up today, leads about to go stale, today's scheduled site
  surveys
- ACCOUNTS: payments overdue/aging, today's collected total, projects with no payment
  activity in 15+ days
- SITE_EXECUTION: today's labour assignments, projects with an incomplete stage sitting
  idle
- STORE_PURCHASE: low BOM-fill queue, any pending stock-out awaiting a challan
- DESIGN: count in each of the two queues (Design, CEI Drawing)
- LIAISONING: DISCOM follow-ups due, projects with no liaisoning activity logged recently
- DIRECTOR: pending approvals count, a rollup across every role's attention items above

Each role's home page becomes their new default landing route (replacing the direct-to-list
redirect from the middleware). Keep this visually consistent with the existing Airtable
design system already in use elsewhere in the app.
```

### Prompt 3 — Notification Center

```
Build a bell-icon notification center in the top bar, visible on every authenticated page,
consistent for every role.

This should aggregate the same "needs attention" signals used in Prompt 2's home dashboards
into a dropdown list, each item deep-linking to the relevant project/page. Use a database
view or a lightweight query layer that computes these counts server-side rather than
duplicating the logic between the home dashboard and the notification dropdown — write one
shared query/function each signal type reads from, so the two surfaces can never drift out
of sync with each other.

Show an unread/new-count badge on the bell icon itself. A notification is "read" once its
target page has been visited — no need for a separate read/unread database column if you
can derive it from existing timestamps, but if that's not clean, add a minimal
notification_reads table (user_id, notification_key, read_at).
```

### Prompt 4 — Global Search & Breadcrumbs

```
1. Add a global search input to the top bar (visible on every page): search across
   projects by client name, phone, and address. Results should respect the same RLS-backed
   scoping every other view already respects (a Sales user searching should still only see
   their own leads' results unless they're a Director, etc. — this should fall out
   naturally from querying through the same RLS-protected client, not a separate
   unscoped search path).

2. Add consistent breadcrumbs to every nested page in the app (e.g., Pipeline > [Client
   Name] > Site Survey). Build this as one shared breadcrumb component driven by route
   segments, not hand-written per page, so it stays consistent as more pages get added.
```

---

## Part B — Module Depth

### Prompt 5 — Sales Pipeline Depth

```
Read the existing /pipeline module code first. Then, referencing the "Module 1 — Sales
Pipeline" section of Sunfraa_Global_Maturity_Roadmap.md, extend it with:

1. New fields on lead intake: lead_source (enum: REFERRAL, PAID_ADS, CAMPAIGN, WALK_IN,
   GOVT_TENDER, COLD_OUTREACH), source_detail (text, e.g. referrer name or campaign name),
   temperature (enum: HOT, WARM, COLD), expected_close_date.
2. Duplicate detection: when creating a new lead, check for existing projects with the same
   phone number or a close address match, and surface a warning (not a hard block) before
   the user proceeds.
3. A new lead_activities table (project_id, type: NOTE|CALL|MEETING, content, call_outcome
   nullable, created_by_id, created_at) and an activity timeline UI on the project detail
   page — this is distinct from the existing automated follow_up_logs, which stay as-is.
4. A document_checklist_items table (project_id, document_name, required boolean, uploaded
   boolean, file_url) seeded with a different default checklist depending on project
   category (residential vs. commercial needs different documents — define both lists
   explicitly).
5. Quotation versioning: a new quotations table (project_id, version, line_items jsonb,
   total_amount, sent_at, created_by_id) replacing the single quotation_amount field's role
   as the source of truth — keep quotation_amount on projects as a denormalized
   "current/latest" value for backward compatibility with existing queries, but every new
   quotation creates a new version row. Build a simple line-item entry UI (item name,
   category, qty, rate) that computes the total.
6. A "mark lost" action (separate from the existing stale auto-flagging) capturing a reason
   (enum: PRICE, COMPETITOR, PROJECT_SHELVED, FINANCING_FELL_THROUGH, OTHER) and an optional
   competitor name.
7. A conversion funnel report view: count of projects at each stage, with drop-off
   percentages between consecutive stages.

Stop and confirm the quotations table design with me before wiring the UI — this one
changes how "quotation amount" is sourced throughout the app and I want to see the
approach before it's built.
```

### Prompt 6 — Accounts Dashboard Depth

```
Read the existing /accounts module code first. Then, referencing "Module 2 — Accounts
Dashboard" in Sunfraa_Global_Maturity_Roadmap.md, extend it with:

1. A payment_milestones table (project_id, label, due_date, amount, status: PENDING|PAID)
   — allow Accounts/Director to define a milestone schedule per project instead of relying
   on the single payment_status flag. Keep payment_status/paymentCollectedAt on projects as
   the "fully paid" summary signal (updated automatically once all milestones are PAID), so
   the existing RLS/trigger logic from the original build keeps working without changes.
2. A payment_transactions table (project_id, milestone_id nullable, amount, paid_at, mode:
   BANK_TRANSFER|UPI|CHEQUE|CASH|LOAN_DISBURSEMENT, reference_number, receipt_url) for the
   actual transaction log — supports multiple partial payments per milestone.
3. A financing_records table (project_id, partner_name, loan_amount, disbursement_status,
   disbursement_date) for loan-financed projects.
4. Auto-generated receipt on each transaction (simple PDF, project + amount + date + mode).
5. An aging report view: outstanding balance per project bucketed into 0-30/30-60/60-90/90+
   days since the relevant due date.
6. A per-client statement page: full transaction history for one project, formatted to be
   shareable with the client directly.
7. A revenue trend chart on the main dashboard: collected vs. pending, by month.

This is the second prompt that changes how payment status is derived (Prompt 5 changed
quotation_amount's role; this one changes payment_status's). Stop and confirm the
milestone-to-payment_status auto-sync logic with me before implementing the trigger.
```

### Prompt 7 — Project Execution Depth

```
Read the existing /execution module code first. Then, referencing "Module 3 — Project
Execution" in Sunfraa_Global_Maturity_Roadmap.md, extend it with:

1. A site_diary_entries table (project_id, entry_date, weather, manpower_count, notes,
   created_by_id) — independent of stage completion, a free-form daily log.
2. Extend execution_stage_progress to support multiple photos per stage instead of one:
   add a stage_photos table (stage_progress_id, photo_url, caption) and update the UI to a
   gallery upload instead of a single-photo field.
3. A weather_delays table (project_id, delay_date, condition, expected_resume_date).
4. A snag_list_items table (project_id, title, description, photo_url, severity:
   LOW|MEDIUM|HIGH, assigned_to_id, status: OPEN|RESOLVED, due_date).
5. A safety_checklist_items table (stage_progress_id, item_name, checked boolean) seeded
   with a standard checklist per stage (PPE worn, site fencing, electrical lockout-tagout,
   structural sign-off where relevant) — require all items checked before a stage can be
   marked complete (this tightens the existing stage-completion business rule, don't weaken
   it).
6. If labour teams are subcontracted rather than internal, add subcontractor fields to
   labour_teams (company_name nullable, agreed_rate nullable, payment_terms nullable) —
   nullable so internal teams aren't forced to fill these in.
7. GPS-stamped check-in: a simple check_ins table (user_id, project_id, latitude,
   longitude, checked_in_at) with a check-in button on the mobile execution view.
8. A cost roll-up: compute labour cost per project as headcount × days assigned × a
   day_rate field on labour_teams (add this field), displayed against the BOM's material
   cost for a basic margin view.
9. A Gantt-style timeline view of planned vs. actual dates across the four stages.
```

### Prompt 8 — Director Approvals Depth

```
Read the existing /director/approvals module code first. Then, referencing "Module 4 —
Director Approvals" in Sunfraa_Global_Maturity_Roadmap.md:

1. Add a reject/request-changes action alongside the existing approve action, requiring a
   mandatory comment. On reject, move the project's stage back to a state that makes sense
   (confirm with me which prior stage is correct before implementing — likely back to
   QUOTATION_SENT or wherever it was before approval was requested) rather than leaving it
   stuck.
2. An approval_history table (project_id, action: APPROVED|REJECTED, comment, actor_id,
   created_at) logging every decision, with a history view accessible from each project.
3. Surface an SLA flag on the approvals queue — highlight any project that's been waiting
   longer than a configurable threshold (default 3 days).
4. A batch-approve action for selecting multiple queue items and approving them in one
   action, with the same trigger logic as individual approval firing for each.
```

### Prompt 9 — Store & Purchase: Foundational Masters

```
Read the existing /store module code first. Then, referencing "Module 5 — Store &
Purchase" in Sunfraa_Global_Maturity_Roadmap.md, build the two master tables this module
is currently missing entirely:

1. A vendors table (name, contact_person, phone, gstin, payment_terms, category:
   PANELS|INVERTERS|STRUCTURE|CABLES|BOS|OTHER, notes) with a directory UI (list, create,
   edit).
2. An item_catalog table (name, category, unit, reference_cost, preferred_vendor_id
   nullable) with a similar directory UI.
3. Update the existing BOM item entry UI to select from item_catalog (with an "add new
   item to catalog" inline option for anything not yet in it) instead of free-typing item
   names — this is the important part, since retyped free-text item names are the actual
   problem being solved here. Existing bom_items rows with free-text names can stay as-is;
   only new entries need to go through the catalog.

Stop and confirm before continuing to Prompt 10 — the next prompt (Purchase Orders) depends
entirely on these two tables existing and being populated correctly.
```

### Prompt 10 — Store & Purchase: Procurement Workflow

```
Continuing directly from Prompt 9's vendors and item_catalog tables, and referencing the
same "Module 5" section of Sunfraa_Global_Roadmap.md:

1. A purchase_orders table (po_number auto-generated, vendor_id, project_id nullable —
   POs can be general restock or project-specific, status: DRAFT|SENT|CONFIRMED|
   PARTIALLY_RECEIVED|RECEIVED|CLOSED, expected_delivery_date, created_by_id) and a
   purchase_order_items table (po_id, item_catalog_id, quantity_ordered, rate).
2. A goods_received_notes table (po_id, received_date, received_by_id) and
   grn_items (grn_id, po_item_id, quantity_received) — supporting partial receipt against a
   single PO across multiple GRNs.
3. On a GRN being recorded, create the corresponding stock_ledger IN entries automatically
   (don't make Store re-enter what was just received in the GRN as a separate manual stock
   IN action — that's a redundant, error-prone double-entry).
4. A vendor_rate_history view — derived from purchase_order_items over time per
   vendor+item_catalog combination, not a separately maintained table — chart or table
   showing how a vendor's rate for a given item has moved.
5. Low-stock alerts: a reorder_point field on item_catalog, surfaced as a flag on the
   current-stock view (and feeding into Prompt 3's notification center for STORE_PURCHASE).
6. Stock valuation: compute using weighted-average cost per item from purchase history,
   shown as a total inventory value figure on the store dashboard.
7. Add a location field to stock_ledger (default a single "Main Warehouse" value for now,
   but build the field and filtering UI so multi-location isn't a schema change later).
8. An rma_records table (item_catalog_id, vendor_id, quantity, reason, status:
   PENDING|RETURNED|REPLACED) for damaged/incorrect goods.
9. A procurement-cost-vs-BOM-budget report per project.
```

### Prompt 11 — Design Team Depth

```
Read the existing /design module code first. Then, referencing "Module 6 — Design Team" in
Sunfraa_Global_Maturity_Roadmap.md:

1. Add a status field to design_files (DRAFT, REVISION_REQUESTED, RESUBMITTED, APPROVED)
   and a design_comments table (design_file_id, comment, created_by_id, created_at) so
   Sales or Director can request changes and Design can respond in-thread, rather than the
   current one-shot upload with no feedback loop.
2. A design_checklist_items table (project_id, item_name: e.g. "Shadow Analysis",
   "Structural Load Calculation", "Single Line Diagram", uploaded boolean, file_url) —
   distinct trackable deliverables instead of one generic PDF slot. Seed the default
   checklist and let it vary by whether the project is CEI-required (CEI projects likely
   need the SLD, standard ones may not — confirm this assumption with me if you're unsure,
   don't guess silently).
3. Allow multiple file types/slots per design_files row (or a small child table) — source
   file (DWG) + exported PDF + reference images — rather than one url field.
4. A basic template library: a design_templates table (name, system_size_range,
   roof_type, file_url) Design can reference/clone from when starting a similar project.
5. Compute and display time-in-queue on each design (queue-entry timestamp already exists
   via stage transition history — use that rather than adding a new timestamp field if one
   already captures this).
```

### Prompt 12 — Liaisoning & CEI Depth

```
Read the existing /liaisoning module code first. Then, referencing "Module 7 — Liaisoning &
CEI" in Sunfraa_Global_Roadmap.md — and keep the existing govt-estimate-vs-customer-
quotation visual disambiguation exactly as it is, don't touch that part:

1. Add a scheme field to liaisoning_records (enum: PM_SURYA_GHAR, STATE_SCHEME, NONE) with
   scheme-specific required-field logic if the two schemes genuinely need different data —
   confirm with me which fields differ before building conditional logic, rather than
   guessing.
2. A liaisoning_document_checklist table (project_id, document_name, required, uploaded,
   file_url) with a default list that varies by the project's category (residential /
   commercial / industrial), same pattern as Prompt 5's Sales document checklist.
3. Replace the current flat form with a visual status stepper component (Submitted → Under
   Review → Estimate Generated → Paid → DISCOM File Ready → Inspection Scheduled →
   Connected) — this is a UI/UX change on top of existing fields, not a new data model;
   the stepper's current position is derived from which timestamp fields are already set.
4. An escalation rule: if the most recent discom_follow_up_logs entry for a project is
   older than 21 days (3 missed 7-day cycles) while still unconnected, flag it — feed this
   into Prompt 3's notification center for LIAISONING and DIRECTOR.
5. A net_metering_agreement_url field, distinct from the existing meter_report_url — these
   are different documents and shouldn't share a field.
6. An inspection_scheduled_date field on cei_records, with a reminder tied into the
   notification center as the date approaches.
7. A subsidy_disbursement table (project_id, amount, disbursed_to: CUSTOMER|SUNFRAA,
   disbursed_at) — kept separate from estimate_paid_at, since this is a different money
   flow with a different recipient.
```

### Prompt 13 — Manager Control Depth

```
Read the existing /admin/users module code first. Then, referencing "Module 8 — Manager
Control" in Sunfraa_Global_Roadmap.md:

1. A login_history table (user_id, logged_in_at, device_info nullable) populated via a
   Supabase Auth hook or middleware on successful login, with a per-user activity view in
   the admin panel.
2. CSV bulk import for user creation: upload a CSV (name, phone, role), preview parsed rows
   before confirming, create each via the same admin API path Prompt used for single-user
   creation in the original build (don't build a second, separate user-creation code path).
3. Add a team/zone free-text field to profiles (e.g. which Labour Team a SITE_EXECUTION
   user is part of, which DISCOM zone a LIAISONING user covers) — purely informational for
   now, not tied to any permission logic.
```

---

## Part C — Capstone

### Prompt 14 — Reports Section (build this one carefully — it's the highest-value item on the whole roadmap)

```
This is the single most important prompt in this entire sequence — it's the original ask
Sunfraa's Directors made in the very first discovery conversation, and nothing built so far
actually delivers it. Take your time on this one.

Build a new top-level /reports section (Director-only by default, per the existing RLS
pattern — confirm whether Accounts should also see the financial ones before locking that
down) with the following views, each pulling from data that already exists across the
modules built in Prompts 5-13:

1. Project-wise P&L: revenue (from payment_transactions), material cost (from BOM +
   stock_ledger/purchase_order_items), labour cost (from Prompt 7's cost roll-up) —
   per project, and aggregated by month.
2. Pipeline conversion report: the funnel view built in Prompt 5, promoted to a proper
   report with date-range filtering.
3. Inventory valuation: the stock valuation figure from Prompt 10, with historical
   trend if feasible, otherwise current snapshot.
4. DISCOM turnaround time: average and per-project days from liaisoning_records creation
   to connected_at, from Module 7's data.
5. Every report should support the CSV export utility from Prompt 1.

Build each report as its own tab/page rather than one giant dashboard — these serve
different audiences and different review cadences (P&L monthly, pipeline weekly, DISCOM
turnaround as-needed), and cramming them into one view will make each individually worse.

Stop and confirm the P&L calculation logic with me specifically before finalizing it —
margin numbers are the kind of thing that erodes trust fast if the underlying math is
wrong, more than almost anything else in this app.
```

### Prompt 15 — In-App Project Comments

```
Add a lightweight comment thread to the Project Hub / project detail page (visible from
every module's project detail view, not a separate page) — a project_comments table
(project_id, comment, created_by_id, created_at) with a simple chronological thread UI.
This is intentionally simple: no @mentions, no rich text, no notifications wiring beyond
what Prompt 3 already handles generically — the goal is just giving cross-department
coordination about a specific project somewhere to live inside the app instead of a
WhatsApp thread nobody else can see.
```

### Prompt 16 — PWA Installability

```
Configure the existing Next.js app as an installable PWA (manifest.json, service worker via
next-pwa or the App Router equivalent, appropriate icons). Prioritize this working well on
the mobile-first views already built for SITE_EXECUTION (Site Survey, Execution stage
forms, GPS check-in from Prompt 7) — that's who actually benefits from "install to home
screen" the most. This is a configuration/tooling prompt, not a UI change — nothing about
how any page looks or behaves should change, only how the app can be installed and whether
it works offline for basic viewing.
```

### Prompt 17 — Final Regression Pass

```
Go through Sunfraa_Global_Maturity_Roadmap.md section by section and confirm every item
built in Prompts 1-16 actually works end to end, the same way Prompt 11 in the original
build sequence verified the first 6 modules. In particular:

1. Re-run the original 7-scenario RLS/trigger test suite from the first build (payment
   permission, director-approval permission, labour uniqueness, stock-out challan
   requirement, and the three auto-trigger handoffs) to confirm none of Prompts 5-13
   accidentally weakened any of them while extending the same tables.
2. Confirm the new payment_milestones -> payment_status sync (Prompt 6) and the new
   quotations versioning (Prompt 5) haven't broken the original Accounts Dashboard
   acceptance criteria from the first build.
3. Confirm role-based nav and RLS still correctly scope every new table and page added in
   this sequence to the right roles — a new table is only as safe as its RLS policy, and
   it's easy to add a table in one of these prompts and forget the policy.
4. Confirm the Reports section's numbers (Prompt 14) reconcile against what you'd get
   manually querying the underlying tables for at least one test project, end to end.
```
