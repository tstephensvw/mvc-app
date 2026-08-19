# ERW Suite MVP — Architecture Decision Document

**Status:** Rev 2 — all six open questions answered by Tim (2026-08-19); resolutions folded in below (§15). Awaiting final approval before scaffolding.
**Author:** Claude Code, from `ERW_Suite_Handoff_Brief.md` plus source review of `BO1prioritization_2.html`, `BO2dependencymapping_2.html`, `BO4workaroundreadiness_2.html`, and `CBS_Solar_Map_Interactive_DEMO.html` (all verified generic demo builds; BO3 specified from the brief and from BO4's BO3-importer contract). Master-workbook shape (Appendix A) extracted from the engagement master workbook — **structure, labels, and formatting only; no client data was carried into this repo or document.**
**Date:** 2026-08-19

---

## 0. Decision summary

| # | Decision | Choice | Section |
|---|----------|--------|---------|
| D1 | Stack | TypeScript end-to-end: React + Vite SPA, Express API, Drizzle ORM, PostgreSQL, `ws` WebSockets, Zod contracts. Single deployable Node process. | §2 |
| D2 | Tenancy | Multi-tenant by **engagement**; HealthCo ships as the seed engagement | §3 |
| D3 | Core spine | `dep_id` slugs remain the **external** identity in exports; **internal** identity is surrogate keys with real foreign keys | §3.3 |
| D4 | Dependency dedup | `dependencies` (cluster) and `dependency_instances` (service × dependency) are separate tables; BO3 answers attach per **instance**, BO4 assessments attach per **cluster with an optional per-service override** (decided in review — §15-A4) | §3.2, §14-DEV1 |
| D5 | Everything derived stays derived | RTO/tier display, SPoF auto-flag, concentration, primary-system heuristic, BO4 traffic light — computed server-side, never stored as writable fields | §4 |
| D6 | Event log | Append-only `events` table, DB-enforced (no UPDATE/DELETE grants); it is both audit trail and the real-time sync primitive | §3.2, §7 |
| D7 | Real-time | Server-authoritative REST writes; event fan-out over WebSocket with polling fallback on the same `GET /events?after_seq` primitive | §7 |
| D8 | Conflicts | Last-write-wins at field level, event log as truth (per brief §8.4) | §7 |
| D9 | Offline | Optimistic client write-queue with replay + a local "emergency export" escape hatch; no CRDT engine | §8 |
| D10 | Exports | Server-side pipeline; HTML-era JSON contracts preserved byte-compatible (tool IDs, field names, `dep_id` format); BO4 brought to full parity; Solar PPTX/PDF builders ported as a shared zero-dep library | §9 |
| D11 | AI | Server-side Anthropic API (official TS SDK, `claude-opus-5`, adaptive thinking, streaming); every output lands in `ai_drafts` behind an explicit accept/reject gate | §10 |
| D12 | Seed data | Single-source TypeScript generator (`packages/dataset`) replacing `dataset.py`; walkthrough service flows end-to-end incl. Solar default (fixes brief §8.1) | §11 |
| D13 | Deployment | Replit Reserved VM (or Autoscale min-1) running one Node process; Replit-managed Postgres | §12 |
| D14 | Build order | 6 slices; slice 1 = walking skeleton (auth + engagement + events + BO1 + exports + seed, deployed) | §13 |
| D15 | Closeout | Export-and-freeze: `archived_at` + read-only, with a closeout package (XLSX master per Appendix A, JSON feeds, MD readouts, Solar slides, SOR-friendly per-entity CSVs) | §9, §15-A5 |

Deviations from the brief are flagged inline and collected in §14. The review resolutions (all six former open questions, answered) are in §15; the master-workbook export spec is Appendix A.

---

## 1. Constraints recap (what this design must not break)

From the brief §1 and §3, restated as design inputs:

1. **HealthCo fictional data only** in every seed, fixture, and test.
2. **RTO is derived, never entered** — no writable RTO/tier field anywhere downstream of BO1; BO4 shows tier read-only.
3. **Five lenses locked**: People / Process / Technology / Facilities / Third Parties.
4. **Four breakout groups, fixed colors**, configurable per engagement but consistent across modules within one.
5. **Flag, don't fabricate**: `origin` + `unreviewed` on all prepopulated content; blanks stay blank.
6. **Reset clears the board, keeps the log** — the activity log is never destroyed by user action.
7. **Importers only widen contracts** — every prior export version stays ingestible.
8. **No regulatory/framework anchors** anywhere in the product.
9. **Exports are the client boundary** — export fidelity with the HTML-era formats is a hard requirement (downstream AI-synthesis pipelines already consume them).
10. **"AI-enabled facilitation tool"** is the only positioning language in user-facing copy.
11. **Hostile Wi-Fi assumption** — offline tolerance is a requirement.

---

## 2. Stack (D1)

**TypeScript end-to-end. React 18 + Vite SPA, Express API, Drizzle ORM, PostgreSQL, `ws` for WebSockets, Zod for shared runtime contracts. One Node process serves the API, the WebSocket endpoint, and the built SPA.**

Why this and not the alternatives:

- **One language.** The suite's crown-jewel engineering — the zero-dependency ZIP/PDF/PPTX builders in the Solar Map, the CSV two-block writer, `clean()`/`escapeMD()` boundary hygiene, the derived-status functions — is already portable JavaScript. A TS monorepo lets that code move into a `shared/` package used verbatim by server exports, client rendering, and tests. A Python backend would force a rewrite of exactly the code that is already proven.
- **Shared contracts.** The export formats are the product's edge. Zod schemas in `shared/contracts/` define them once; the server validates on export, the legacy importer validates on ingest, and the client gets the types for free. Contract drift becomes a compile error.
- **Express over Next.js.** The app is an authenticated internal tool — no SEO, no SSR benefit. What it does need is a persistent WebSocket server and a long-lived process for live sessions, which plain Node/Express does trivially and Next's serverless-leaning model complicates. This is the "boring" choice the brief asks for, and it is also Replit's most-native full-stack template shape (React + Vite + Express + Drizzle + Postgres), which matters for Replit importability.
- **Drizzle + Postgres.** Drizzle is SQL-first (the concentration/SPoF queries in §4 are honest SQL, not ORM gymnastics), migration-friendly, and standard on Replit. Postgres gives us enums for the locked taxonomies, JSONB for lens-specific answer banks, and grant-level enforcement of the append-only event log.

Repo layout (monorepo, single deploy):

```
/client          React SPA (Vite)
/server          Express API + WS + export pipeline + AI service
/shared
  /contracts     Zod schemas: DB DTOs + HTML-era export formats (BO1..BO4, Solar)
  /derive        Pure functions: status, SPoF, concentration, primary-system, gap counts
  /export-kit    csv two-block writer, clean()/escapeMD(), zip/pdf/pptx builders, md writers
  /dataset       HealthCo single-source generator (see §11)
/db              Drizzle schema + migrations + seed runner
```

---

## 3. Domain and data model (D2, D3, D4)

### 3.1 Tenancy

`engagement` is the tenant root. It owns everything: catalog, groups, tiers, services, dependencies, instances, answers, assessments, events, drafts, live sessions. All queries are engagement-scoped; there is no cross-engagement read path in the MVP.

### 3.2 ERD

```
engagements 1──* groups
engagements 1──* tiers
engagements 1──* services ──────────────┐
engagements 1──* dependencies (cluster) │
                     │                  │
                     │ 1                │ 1
                     *                  *
              dependency_instances  (service × dependency, UNIQUE pair)
                     │ 1                      │ 1
                     │                        │
                     * (0..1)                 │
              risk_answers                    │
                                              │
dependencies 1──(0..1) workaround_assessments │   ← cluster-level, see D4/§14-DEV1
                                              │
engagements 1──* events  (append-only)        │
engagements 1──* live_sessions                │
engagements 1──* ai_drafts                    │
users *──* engagements  (engagement_members: role, group scope)
```

Tables (key columns only; every row also carries `engagement_id`, timestamps, and actor columns):

- **`engagements`** — `id`, `name`, `client_label`, `is_demo`.
- **`users`** — `id`, `email`, `name`, `password_hash`. Simple auth per brief §7 (out of scope: SSO).
- **`engagement_members`** — `user_id`, `engagement_id`, `role ∈ {facilitator, participant}`, `group_id NULL` (participant scope). Viewer role deferred, agreeing with the brief.
- **`groups`** — `code` (`G1`…, `Gx…` for workshop-added), `label`, `desc`, `color`, `color_dark`, `origin ∈ {seed, workshop}`, `sort`. Colors live here once; every module reads the same row → cross-tool color consistency is structural (rule 4).
- **`tiers`** — `code ∈ {t1..t5}` (fixed, ordered — the semantics), `label`, `desc` (editable — the presentation). The enum of codes is not user-extensible: tier *semantics* are locked, labels are not (BO1 behavior preserved).
- **`services`** (CBS) — `slug` (external ID `svc_<slug>`, unique per engagement), `name`, `group_id`, `functional_area`, `description`, `seeded_tier_code`, `current_tier_code`, `origin ∈ {client-inventory, workshop}`, `deep_dive bool`, `notes`, `deleted_at` (soft delete — deletions are events, and exports of the log must still name them). Keeping `seeded_tier` + `current_tier` preserves the "moved from EY hypothesis" semantics BO1's UI and MD readout depend on.
- **`dependencies`** (the deduplicated cluster BO3 reasons about) — `name`, `normalized_name`, `lens_code` (Postgres **enum** of the five lenses — rule 3 enforced in the type system), `spof_manual BOOL NULL` (manual override; NULL = follow auto), unique on `(engagement_id, lens_code, normalized_name)`. Normalization = the existing `slug()` rules (lowercase, non-alphanumerics → `_`).
- **`dependency_instances`** (the suite's real spine) — `service_id`, `dependency_id` (UNIQUE pair), `dep_slug` (the minted external `svc_x::lens_y` ID, collision-suffixed exactly as BO2 does today, immutable once minted), `origin ∈ {prepopulated, manual}`, `confirmed ∈ {unreviewed, yes, no}` **NOT NULL DEFAULT 'unreviewed'** (rule 5 as a column default), `rank INT NULL`, `notes`, `deleted_at`.
- **`risk_answers`** — `dependency_instance_id UNIQUE`, `answers JSONB` (validated by the per-lens Zod question bank, which ships as versioned code — `LENS_Q` semantics carried over), plus extracted columns for queryability: `service_halting BOOL`, `flagged BOOL`, `sensitive_data BOOL`, `bank_version`. Per-instance, never per cluster — "the same EHR can be service-halting for the ED and merely degrading for marketing" is preserved exactly (brief §4/BO3).
- **`workaround_assessments`** — `dependency_id NOT NULL`, `dependency_instance_id NULL`; a NULL instance is the **cluster default** (assessed once per dependency), a non-NULL instance is a **per-service override** used only when that service's situation genuinely differs (decided in review — §15-A4; overrides are logged events). Unique on `(dependency_id, dependency_instance_id)`. Fields: `wa_exists BOOL NULL`, `documented BOOL NULL`, `tested BOOL NULL`, `sustain tier_code NULL` (reuses the time-band enum, as BO4 does), `notes`. Effective assessment for a service = its override row if present, else the cluster default. All fields nullable: unanswered stays "Not assessed" (rule 5). There is **no status column** — status is derived (§4).
- **`events`** — `id BIGSERIAL`, `engagement_id`, `live_session_id NULL`, `seq` (monotonic per engagement), `module ∈ {BO1, BO2, BO3, BO4, SOLAR, SYSTEM, AI}`, `type` (the existing vocabulary: `move, confirm, reject, unreview, add, del, note, rate, spof, mark, reset, scope, import, ai_accept, …` — open set, widen-only), `actor_user_id`, `refs JSONB` (entity pointers), `detail JSONB`, `ts`. **Append-only enforced at the database**: the application role has INSERT+SELECT only, no UPDATE/DELETE grant on this table (rule 6 made structural — a reset physically cannot destroy the log).
- **`live_sessions`** — `name`, `facilitator_id`, `active_module`, `presenting_group_id NULL`, `started_at`, `ended_at`, `export_session_id` (an ISO-timestamp+facilitator string in the HTML-era format, so exports keep their `SESSION_ID` continuity).
- **`ai_drafts`** — `kind ∈ {digest, themes, findings, anomaly}`, `input_ref JSONB` (which exports/event-ranges fed it), `model`, `prompt_version`, `content`, `status ∈ {draft, accepted, rejected}` **DEFAULT 'draft'**, `reviewed_by`, `reviewed_at`. Accepting a draft copies its content into the target record **via the normal write path** (so it emits events and is attributed `origin='ai-accepted'`); the draft row itself is immutable history.

### 3.3 Identity: surrogate keys inside, slugs outside (D3)

Internally everything joins on UUIDs/serials — renames don't cascade through identity, FKs are honest. The HTML-era name-slug IDs (`svc_<slug>`, `svc_<slug>::<lens>_<slug>`) are **minted once, stored, and never regenerated**, and appear in every export for continuity with the downstream synthesis pipelines. On rename, the slug stays frozen (matching current BO2 behavior, where a rename does not re-mint `dep_id`) and the new name travels in the name fields.

---

## 4. Locked methodology rules → structural enforcement (D5)

| Rule | Enforcement mechanism |
|---|---|
| RTO derived, never entered | No tier/RTO column exists on `dependencies`, `dependency_instances`, `risk_answers`, or `workaround_assessments`. Tier lives only on `services`; the BO3/BO4/Solar APIs return it as a read-only join field. There is no API route that writes it outside the BO1 module. |
| Five lenses locked | `lens_code` is a Postgres enum; there is no lens CRUD endpoint. |
| Group color consistency | Single `groups` row per group per engagement; all modules read it. |
| Flag, don't fabricate | `origin` NOT NULL on services and instances; `confirmed` defaults `unreviewed`; assessment/answer fields nullable; derived status maps NULLs to "Not assessed". Seeded content is written by the seed runner with `origin` set — there is no code path that creates a record without one. |
| Reset keeps the log | Reset endpoints rewrite state tables and INSERT a `reset` event in the same transaction; the DB role cannot delete events. |
| Widen-only contracts | Export Zod schemas are versioned append-only in `shared/contracts/`; a CI test snapshot-diffs each export format against the committed golden files and fails on any field rename/removal. Importers use `.passthrough()` schemas — unknown fields survive round-trips. |
| Fail loud imports | Legacy import dispatch validates `tool` identity + shape before any write; rejection is atomic (transaction) with a specific message. Never partially applied. |
| No framework anchors | Copy-review concern; a lint rule greps user-facing strings for a denylist (control-ID patterns, standard names) as a tripwire. |

**Derived values — computed in `shared/derive/`, one implementation, used by server (API + exports) and importable by tests:**

- **BO4 traffic light** — exact port of `statusOf()`: no answer → *Not assessed*; `exists=false` → *Critical gap*; exists but (undocumented ∨ untested ∨ sustain unset ∨ sustain < 24h) → *At risk*; else *Resilient*.
- **Concentration** — count of confirmed instances per dependency cluster (SQL view).
- **SPoF auto-flag** — concentration ≥ `SPOF_MIN`, an engagement setting defaulting to 3 (confirmed in review — §15-A6; changes to the threshold are logged); `effective_spof = spof_manual ?? auto`. Manual toggles are events with undo.
- **Primary-system heuristic** and **cascade line** — ported verbatim from BO3's rules (≥3 confirmed services, ≥2 rank-1 positions, rank-1s ≥ half of confirmed).
- The live-facilitation moment where validating an unreviewed instance raises the concentration count in view survives automatically: confirmation writes → event → WS push → sidebar recomputes.

---

## 5. API surface

REST for writes and reads, WebSocket for fan-out. All routes engagement-scoped: `/api/engagements/:eid/…`. Every mutating route: validates (Zod) → mutates + inserts event in one transaction → broadcasts the event.

**Auth & membership** — `POST /api/auth/login|logout`, `GET /api/me`; `POST /:eid/members` (facilitator invites / join-code redemption, §15-Q1).

**BO1 (services & tiers)**
- `GET /:eid/services` (with tier, group, moved-from-hypothesis flags)
- `POST /:eid/services` (workshop add) · `PATCH /services/:id` (tier move, rename, notes) · `DELETE` (soft)
- `PATCH /:eid/tiers/:code` (label/desc only) · `POST /:eid/groups` / `PATCH /groups/:id` (label/desc/color)
- `POST /:eid/bo1/reset` (restore seeded tiers, event logged)

**BO2 (instances)**
- `GET /services/:id/instances` (grouped by lens, prepop rank order)
- `POST /services/:id/instances` (manual add — upserts cluster by normalized name, mints `dep_slug`)
- `PATCH /instances/:id` (confirm/reject/unreview, rank, notes, rename) · `DELETE`
- `POST /:eid/bo2/reset` (re-prepopulate, drop manual instances, keep log)

**BO3 (risk)**
- `GET /:eid/risk-register?group=&lens=&flagged=` (instances + cluster sidebars: concentration, SPoF, primary, cascade)
- `PUT /instances/:id/risk-answers` (bank-validated JSONB)
- `PUT /dependencies/:id/spof-override` (`true|false|null`)

**BO4 (workarounds)**
- `GET /:eid/assessments?band=` (clusters with risk band, SPoF/halts badges, supported-services + their tiers read-only, override indicators)
- `PUT /dependencies/:id/assessment` (cluster default)
- `PUT /instances/:id/assessment-override` / `DELETE` (per-service override, logged)

**Solar** — `GET /services/:id/solar` → derived render model `{cbs, rto_label, pillar, deps:[{lens, name, status}]}` where `status` is BO4's derived status mapped to `crit|atrisk|res|na` (fixes brief §8.2: no independent clickable status). `POST /services/:id/solar-override` allows a logged manual override per dep for read-out day.

**Events & sync** — `GET /:eid/events?after_seq=N` (the polling fallback and audit read); `WS /ws?engagement=…` (event fan-out; also carries live-session presence).

**Live sessions** — `POST /:eid/live-sessions`, `PATCH /live-sessions/:id` (active module, presenting group), `POST …/end`.

**Exports** — `GET /:eid/export/bo1.(json|csv|md)` … `bo4.(json|csv|md)`, `GET /:eid/export/workbook.xlsx`, `GET /services/:id/solar.(pptx|pdf|png|json)`.

**Legacy import** — `POST /:eid/import` accepting any HTML-era JSON export (BO1/BO2/BO3/BO4 saves); dispatches on `tool` field exactly as BO4's hardened dispatcher does; fail-loud; writes an `import` event. This is the migration bridge from in-flight engagements.

**AI** — `POST /:eid/ai/:kind` → creates `ai_drafts` row (async job); `GET /:eid/ai/drafts`; `POST /ai/drafts/:id/review {action: accept|reject, edits?}`.

---

## 6. Roles & permissions

| Capability | Facilitator | Participant |
|---|---|---|
| Engagement setup, members, groups/tier labels | ✔ | ✘ |
| BO1 tier moves, add/delete services | ✔ | own group only |
| BO2 confirm/reject/add | ✔ | own group only |
| BO3 answers, SPoF override | ✔ | own group only (override: facilitator only) |
| BO4 assessments | ✔ | own group's services' dependencies |
| Reset actions, imports | ✔ | ✘ |
| Exports | ✔ | ✘ (MVP; revisit) |
| AI draft creation + review | ✔ | ✘ — review gate is facilitator-only |
| Live-session control (module, presenting group) | ✔ | ✘ |

Group scoping resolves through the service: a participant may write to instances/answers whose service belongs to their group. Cluster-level BO4 assessments are writable by a participant if **any** supporting service is in their group (facilitator resolves disputes; every write is attributed in the event log). Executive **viewer** role: deferred past MVP, agreeing with the brief.

**Resolved in review (§15-A1/A2):** the validated operating model is facilitator-driven — one facilitator per breakout drives the tool, screen-shared, with the room contributing verbally. That mode is the primary mode of the MVP and works from slice 1. Participant devices (slice 5) are an additive capability, onboarded with room-friendly **join codes + display name** (no email required for participants), writing **directly with attribution** — no propose-then-approve queue; the event log makes every write reviewable and reversible.

## 7. Live sessions & real-time (D6–D8)

**Server-authoritative, events as the sync primitive.** No operational transforms, no CRDTs.

- Every write commits `(state mutation, event row)` atomically, then broadcasts the event JSON on the engagement's WS channel.
- Clients hold a `last_seq` cursor. WS message → apply/refetch affected slice. WS down → poll `GET /events?after_seq` every few seconds — **the same wire format**, so the fallback is not a second code path.
- Reconnect = catch up from cursor; a gap too large simply refetches module state. The projector view is just another client with presentation styling.
- **Conflicts:** last-write-wins per field; the event log is the arbitration record (brief §8.4 accepted). The one guarded case: stale writes carry the client's `last_seen_seq`, and the server attaches a `superseded` marker to the event when it overwrote a newer value — surfaced as a soft toast, never a blocking merge dialog. Facilitation flow beats strictness here.

## 8. Offline tolerance (D9)

Hostile-Wi-Fi posture, explicitly **not** an offline-first sync engine:

1. SPA assets precached (service worker) — the app shell loads without network.
2. Facilitator's client keeps an optimistic write queue (IndexedDB) with idempotency keys; replays in order on reconnect; sync-state banner (mirroring the current tools' non-blocking save banner).
3. **Emergency export escape hatch:** the client can always dump its current in-memory state + queued writes as a local JSON file — the spiritual successor of the HTML tools' "export now and avoid refreshing" path, and it re-imports through the legacy import endpoint.
4. Participants' devices degrade to read-only-with-banner when offline; only the facilitator queue replays (keeps conflict surface tiny in the worst case).

## 9. Export pipeline (D10)

Exports are the client-facing product boundary and the AI-synthesis input; fidelity is a hard requirement.

- **Formats preserved byte-compatible in shape:** tool IDs (`BO1-CBS`, `BO2-CBS-DEPENDENCY-MAPPING`, `BO3-RISK`), field names (`final_state[]`, `dep_id`, `confirmed: "yes"|"no"|"unreviewed"`, `origin`, `rank`, `facilitator_notes`, `risk_*` namespace, `dependency_risk[]`…), `SESSION_ID` string format, CSV two-block layout (meta banner raw / data rows cleaned), and the `clean()`/`escapeMD()`-at-boundary-only discipline. Golden-file snapshot tests in CI (§4).
- **BO4 parity (fixes brief §8.3):** new `tool: "BO4-WORKAROUND"` JSON primary feed — `{tool, version, session_id, …, groups, lenses, activity_log, final_state[]}` with per-dependency assessment fields, derived status + reason, carried BO2/BO3 lineage — plus the existing log/CSV/MD. Additive, widen-only.
- **XLSX master workbook** via `exceljs`, multi-tab matching the established master-workbook shape — now fully specified from the engagement master workbook in **Appendix A** (structure/labels/formatting only; no client data). The hidden `_data` spine sheet and its formula-driven Risk Rollup are reproduced so the workbook stays live after export.
- **Engagement closeout = export-and-freeze (§15-A5).** Closing an engagement produces a **closeout package** and sets `archived_at` (engagement becomes read-only; events record the closure). The package targets downstream systems of record — the client uploads into ServiceNow, Fusion, or similar if they have one, and keeps a well-organized workbook if they don't: the XLSX master (Appendix A), the four JSON primary feeds, the MD readouts, per-service Solar slides, **and flat per-entity CSVs designed for SOR import mapping** (`services.csv`, `dependencies.csv`, `dependency_instances.csv`, `risk_answers.csv`, `workaround_assessments.csv`, `events.csv`) — snake_case headers, one row per record, stable external IDs (`svc_…`, `dep_id`) as join keys, no merged cells or multi-block layouts.
- **Solar Map PPTX/PDF/PNG:** the proven zero-dep builders (STORE ZIP + CRC32, minimal PDF, raw-OOXML PPTX) move into `shared/export-kit/` unchanged in logic. Rendering stays **client-side** (SVG → canvas rasterize → builder), as today — it is proven across browsers and avoids adding a server-side rasterizer; the server serves only the derived render model. Server-side rendering can be added later behind the same builder library if head-less export jobs are ever needed. *(Deviation noted: §14-DEV3.)*
- Solar renders **live from BO4/BO3 state** (brief §8.2); the embedded-dataset pattern disappears.

## 10. AI features & review gating (D11)

- **Integration:** server-side only, official Anthropic TypeScript SDK (`@anthropic-ai/sdk`). Default model `claude-opus-5` (adaptive thinking, streaming for long syntheses); model string is config, not code. API key in Replit secrets; no client-side calls, no keys in the browser.
- **Input contract = export contract.** Every AI feature consumes the same JSON exports the pipeline already produces (digest ← activity log export; themes/cascade ← BO3 feed; draft findings ← BO3+BO4 feeds; anomaly prompts ← cross-module state). This makes the AI pipeline a consumer-zero test of export fidelity and keeps prompts stable across HTML-era and MVP data.
- **Gating (hard rule): nothing AI-generated enters the record unreviewed.** All outputs land in `ai_drafts` with `status='draft'`. The review UI shows draft + provenance (inputs, model, prompt version). Accept → content is written through the normal write path with `origin='ai-accepted'` + an `ai_accept` event naming draft, reviewer, and target; reject → retained for audit. Drafts are excluded from all exports except an optional explicitly-labeled appendix.
- **Anomaly prompts** (e.g. "confirmed for 6 services, no workaround assessment") are deterministic queries first, LLM-phrased second — the detection must not depend on the model, only the wording may.
- Prompt templates are versioned files in-repo; `prompt_version` recorded per draft.

## 11. Seed & demo data strategy (D12)

- `shared/dataset/` — a single-source **TypeScript** generator replacing `dataset.py` *(deviation §14-DEV5)*, emitting: the 52 HealthCo services, prepop tech/third-party matrices, BO3 sample answers, BO4 sample assessments, and the Solar walkthrough defaults.
- **The walkthrough service ("Inpatient Nursing Units") flows end-to-end** — generator output is validated by a test that walks BO1→BO2→BO3→BO4→Solar for it (fixes brief §8.1).
- Seed runs idempotently at boot when the DB is empty, creating the "HealthCo (Demo)" engagement with `is_demo=true` (resettable to pristine from the UI; reset writes events, as always).
- The same generator produces the fixture set for contract snapshot tests — seed and tests cannot drift (preserving the BO1/BO2 single-source pattern, now suite-wide).
- New engagements start empty or clone the structural config (groups, tiers) without HealthCo content; client inventories arrive via CSV/XLSX import (facilitator-only, origin `client-inventory`, `unreviewed`).

## 12. Deployment on Replit (D13)

- **One deployable:** `npm run build` (Vite → `client/dist`, esbuild → `server/dist`); `npm start` runs Express serving API + WS + static SPA. `npm run dev` runs Vite middleware mode for Replit's workspace preview.
- **Database:** Replit-managed PostgreSQL (Neon) via `DATABASE_URL`; Drizzle migrations run on boot.
- **Deployment type:** **Reserved VM** recommended — workshop days need stable long-lived WebSockets and no cold starts with a room full of executives; Autoscale (min instances 1) is the fallback if cost matters between engagements.
- **Secrets:** `DATABASE_URL`, `SESSION_SECRET`, `ANTHROPIC_API_KEY` via Replit Secrets.
- **Offline note:** Google Fonts degrade to system-ui exactly as today (fonts self-hosted in the bundle to remove even that dependency).

## 13. Build sequence (D14)

Each slice ships deployed and demoable; the walking skeleton comes first so every risky element (datastore, events, export fidelity, Replit deploy) is proven before breadth.

1. **Slice 1 — Walking skeleton + BO1.** Monorepo scaffold, auth, engagement + membership, groups/tiers, event log (append-only enforced), **BO1 module complete** (tier matrix, drag/drop, notes, add/delete, undo, reset-keeps-log, present mode), BO1 exports (JSON/CSV/MD, golden-tested), HealthCo seed, Replit deploy. *Proves the architecture end to end.*
2. **Slice 2 — BO2.** Instances + cluster upsert, `dep_slug` minting, prepop from seed, confirm/reject/unreview, lens board UI, BO2 exports, legacy BO1-export import.
3. **Slice 3 — BO3.** Question banks (versioned), per-instance answers, concentration/SPoF/primary/cascade derivations, register view + filters + concentration sidebar, BO3 exports, legacy BO2 import.
4. **Slice 4 — BO4 + Solar.** Cluster assessments, derived traffic light, tier-alongside-sustain read-only display, gap dashboard; Solar live render + manual override + PNG/PDF/PPTX; **BO4 full export parity**; legacy BO3/BO4 import.
5. **Slice 5 — Multi-user live sessions.** WS fan-out + polling fallback, participant role + group scoping, projector/participant views, presenting-group control, offline write queue + emergency export.
6. **Slice 6 — AI + workbook.** `ai_drafts` + review gate UI, digest/themes/findings/anomalies, XLSX master workbook, engagement cloning polish.

Post-MVP backlog: viewer dashboards, richer offline, white-labeling, SSO.

## 14. Deviations from the brief (flagged per §9)

- **DEV1 (D4) — RESOLVED (§15-A4): BO4 assessments attach at the dependency-cluster level with an optional per-service override.** The brief's per-tool spec was ambiguous: BO4's per-item fields ride on cards that, when fed from BO3 (the *preferred* path), are deduped clusters — BO4's own importer proves this — while the BO2 fallback path produced per-instance cards. Tim chose the middle ground: a workaround for "MediCore EHR" is assessed once, every supporting service inherits it (with its own tier shown read-only for the sustain-vs-tier judgment), and a specific service can override when its situation genuinely differs — overrides are logged. The nullable `dependency_instance_id` column in `workaround_assessments` implements this without contract breakage.
- **DEV2: Slices 1–4 are facilitator-single-writer.** Multi-device participation lands in slice 5, after all four modules exist. Rationale: parity-first de-risks the migration — the suite is usable for a real engagement from slice 4 in exactly today's operating model (which review confirmed is facilitator-driven with the room contributing verbally — §15-A1), and the concurrency model then lands on stable modules rather than being rebuilt four times.
- **DEV3: Solar board-slide rendering stays client-side.** The brief implies a server export pipeline for everything; for Solar PPTX/PDF the proven browser rasterize→build path is kept (builders shared, server serves the render model). Avoids a server-side SVG rasterizer dependency in the MVP.
- **DEV4: WebSocket *with* polling fallback** rather than "WebSocket or polling": both ride the same `events?after_seq` primitive, so the fallback is nearly free and covers hostile conference-room networks that kill long-lived connections.
- **DEV5: `dataset.py` → TypeScript.** One language for the single-source generator so seed, fixtures, and contract tests share code. The Python file remains the reference for content parity during the port.
- **DEV6: Live-session identity.** Internal sessions get surrogate IDs; the HTML-era `SESSION_ID` string (ISO start + facilitator) is preserved as `export_session_id` so export consumers see the unchanged format.

## 15. Review resolutions (Tim, 2026-08-19)

All six open questions from rev 1 are answered; the body above is updated accordingly.

- **A1 — Participant onboarding.** Historical operating model: each breakout facilitator drove the tool on their own laptop, screen-shared, with participants contributing verbally. The MVP keeps facilitator-driven as the primary mode from slice 1; when participant devices arrive (slice 5), onboarding is join code + display name, no email required. (§6)
- **A2 — Participant write model:** direct write with attribution. (§6)
- **A3 — Master workbook spec:** provided (engagement master workbook); shell extracted into **Appendix A** — structure, labels, and formatting only; no client data enters the repo, the seed, or the tests. (§9, Appendix A)
- **A4 — BO4 grain:** once per dependency **plus** a per-service override when a service's situation genuinely differs; overrides logged. (D4, §3.2, §14-DEV1)
- **A5 — Retention:** export-and-freeze. The tool is EY-internal; the closeout package must upload into a client SOR (ServiceNow, Fusion, …) with relative ease, or stand alone as a well-organized workbook when the client has none. Drives `archived_at` + read-only mode + the closeout package spec. (§9)
- **A6 — `SPOF_MIN`:** engagement setting, default 3, changes logged. (§4)

---

*Next step on approval: scaffold the repo per §2/§13 slice 1. No code has been generated yet.*

---

## Appendix A — Master workbook export spec

Extracted from the engagement master workbook (shell only — tab order, columns, labels, formatting conventions; every example value here is HealthCo-fictional). This is the target shape for `GET /:eid/export/workbook.xlsx`.

### A.1 Tab order and layout

Every visible data tab follows one chrome convention: **row 1** = tab title, **row 2** = one-line subtitle explaining the tab, **row 3** blank, **row 4** = column headers (Arial bold, white on dark navy `#1F2D5A`), **data from row 5**; freeze panes below the header; autofilter on the header row.

| # | Tab | Columns / structure |
|---|-----|--------------------|
| 1 | **README & Provenance** | Title (client + engagement name) · subtitle "Consolidated Master — Critical Business Services, Dependencies & Risk" · engagement date line · **CONTENTS** block (tab name → one-line description, two columns) · "How findings were rated" methodology note (states flag-don't-fabricate: nothing invented where the workshop captured no value) · dated provenance notes. Generated from engagement metadata + event log. |
| 2 | **Funnel & Reconciliation** | `Pillar · Enterprise services (RTO-rated) · Critical CBS worked · Risk-rated* · BO4 assessed` — one row per pillar + `TOTAL`. Shows how the enterprise inventory narrows to the deepest-worked findings. |
| 3 | **CBS Inventory** | `Pillar · Service / CBS · Functional Area · RTO Tier · Description · Worked to BO2` — the full BO1 output, deduplicated. |
| 4–8 | **People / Process / Technology / Facilities / Third Parties** (one tab per lens) | Identical 12 columns: `Pillar · CBS · RTO · Dependency · Data Status · Risk Band · SPoF · Workaround · Sensitive Data · Impact if Unavailable · Downstream Impact · Notes`. Worked (confirmed or risk-rated) dependencies only. |
| 9 | **Rated Findings Register** | The 12 lens-tab columns **plus `Lens`** (13 total: `Pillar · CBS · RTO · Lens · Dependency · Data Status · Risk Band · SPoF · Workaround Status · Sensitive Data · Impact if Unavailable · Downstream Impact · Notes`) — every risk-rated dependency in one flat register. |
| 10 | **Gap Log** | `Pillar · CBS · Lens · Dependency · Risk Band · Workaround Status · Impact if Unavailable · Notes` — filtered to critical gaps and at-risk workarounds. |
| 11 | **SPoF & Concentration** | Two blocks: **SPoF** (`Pillar · CBS · Lens · Dependency (SPoF=Yes) · Risk Band · Workaround Status · Notes`) and, below a section label row "CONCENTRATION — dependencies spanning multiple CBS", **Concentration** (`Dependency · # of CBS · CBS list`). |
| 12 | **`_data`** (hidden) | Flat spine: `area · cbs · lens · dependency · band · wa_status · spof · data_status` — one row per rated finding; the formula source for Risk Rollup. MVP addition: append stable external IDs (`cbs_id`, `dep_id`) as extra columns (widen-only) so this sheet doubles as an SOR-mapping source. |
| 13 | **Risk Rollup** | `Pillar · Critical · High · Moderate · Low · Rated total` — **live `COUNTIFS` formulas over `_data`** plus a `TOTAL` row of `SUM`s. Must remain formula-driven, not baked values, so the workbook recalculates if `_data` is amended. |
| 14 | **Leading-Practice Uplift** | `Pillar · CBS · Dependency · Risk Band · Workaround Status · Suggested Workaround · Leading Practice / Reference · Theme` — recommendations on the highest-risk findings, explicitly framed "to validate". In the MVP this tab is populated from **accepted `ai_drafts` (kind = findings) only** — the review gate (§10) is what feeds it; nothing unreviewed is exported. |

### A.2 Conventions carried into the generator

- **Fonts:** Arial throughout data tabs.
- **Status color fills (static fills by value, matching the tool palette):** Risk band — Critical `#E8665D`, High `#F4A259`, Moderate `#F7D154`, Low `#9CCC65`. Workaround status — Critical gap `#E8665D`, At risk `#F4A259`, Resilient `#9CCC65`.
- **`Data Status` column** is the per-row provenance label (e.g. "Risk-rated (deep-dived)") — flag-don't-fabricate made visible in the deliverable; the MVP derives it from `origin` + review state + BO3/BO4 coverage.
- **`Workaround` / `Workaround Status`** carries BO4's derived status labels; **`SPoF`** is yes/no from the effective SPoF flag; **`Impact if Unavailable` / `Downstream Impact` / `Sensitive Data`** map from the BO3 lens-question answers.
- **Framework references note:** the "no regulatory/framework anchors" rule (brief §3.7) applies to the *tools*; the workbook's Leading-Practice Uplift tab may carry leading-practice references in its recommendation text, as the engagement master does. These arrive only through facilitator-reviewed AI drafts or manual entry — never generated into the tool UI itself.
- The MVP generator reproduces this workbook from live state at any time, not only at closeout; closeout freezes the final one into the closeout package (§9).
