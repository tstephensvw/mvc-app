# Enterprise Resilience Workout (ERW) Suite — Claude Code Handoff Brief

**Purpose of this document:** Complete technical and methodological context for re-architecting a proven 5-tool HTML facilitation suite into an MVP web application with a real backend. Read this fully before proposing architecture.

**Provenance:** Built and delivered by EY (owner: Tim Stephens) on a live enterprise resilience engagement at a large integrated health system (hospitals + health plan + corporate functions). The suite took the client from cold start to a board-ready resilience program in ~3 weeks. All data in the accompanying demo files is the fictional **"HealthCo"** dataset — no real client names, systems, vendors, or facilities.

**Sequencing instruction for Claude Code:** Produce an **architecture decision document first**. Do not scaffold code until that document is reviewed and approved. Then scaffold a repo importable into Replit.

---

## 1. Data boundary rules (non-negotiable)

1. **HealthCo fictional data only.** Every seed, fixture, test, and demo dataset in the new app uses the HealthCo dataset or newly invented fictional data. No real client names, systems, vendors, facilities, or people — ever.
2. **File manifest check:** The four `BO*_2.html` files are verified generic demo builds. If a file named `CBS_Solar_Map_Interactive.html` is present without a `_DEMO` marker, **do not read its embedded dataset** — treat it as reference for rendering/export mechanics only. A demo-data replacement is the correct input.
3. **Client outputs are Excel/CSV/PDF/PPTX exports.** The tooling itself is EY-owned IP; clients receive data exports, not the tool. Preserve this boundary in the MVP: export is the product's client-facing edge.
4. **Positioning language:** The suite is described as an **"AI-enabled facilitation tool."** Never describe it by its technical construction in any user-facing copy.

---

## 2. What the suite is

A facilitated workshop methodology encoded as four sequential breakout tools plus one visualization, run live in a room with 20–30 executives split into four breakout groups over a multi-day workout. A facilitator drives each tool on one machine, projected; the room debates; every decision is captured with full provenance.

**The workflow chain (data flows forward only):**

```
BO1 (prioritize services) → BO2 (map dependencies) → BO3 (rate risk / find SPoF) → BO4 (assess workarounds)
                                                                                          ↓
                                                    CBS Solar Map (single-service read-out visualization)
```

Each tool exports JSON (primary feed), CSV, and Markdown. The next tool ingests the prior tool's JSON export. The JSON exports are deliberately **AI-ingestible**: downstream synthesis (summary reports, board packages, roadmaps) is produced by feeding these exports into an LLM pipeline with human review.

**What it supported on the engagement** (mapped to contracted deliverables):
- Prioritized critical business service (CBS) list with tiers and ownership → BO1
- Dependency maps across five lenses for prioritized services → BO2
- Risk themes, fragilities, concentration risks, single points of failure, failure-cascade considerations → BO3
- Workaround/readiness assessment feeding pilot selection and the 30/60/90-day roadmap → BO4
- Executive read-out visuals (one-slide-per-service dependency status) → Solar Map
- Decision/issue logs for every session → the per-tool activity log

---

## 3. Locked methodology rules

These are suite-wide non-negotiables. The MVP must enforce them structurally, not by convention.

1. **RTO is derived, never entered.** Recovery-urgency tiers are seeded as an EY starting hypothesis and adjusted by the room through debate. RTO is never a direct input field or a scored criterion anywhere in the suite. BO4 carries the tier forward **read-only** so the room can judge workaround sustainability against it — it is never auto-written into any assessment field.
2. **Five lenses, locked:** People / Process / Technology / Facilities / Third Parties. "Vendor" is retired (use Third Parties). Identity/access and clinical devices fold into Technology. Glossary terms (CBS, Tier, Readiness) are fixed.
3. **Four breakout groups with fixed colors:** G1 Clinical `#3a8d3f` · G2 IT/Cyber `#c77d2e` · G3 Health Plan `#a8568f` · G4 Back Office/Supply Chain `#a96fd6`. Consistent across all tools. Groups are configurable per engagement in the MVP, but color consistency across tools within an engagement is required.
4. **Flag, don't fabricate.** Uncaptured values stay blank and flagged. Nothing is invented to fill a gap. Prepopulated content is always marked with its origin (`prepopulated` vs `manual`) and starts `unreviewed` until the room confirms or rejects it.
5. **Reset clears the board, keeps the log.** A reset writes a "Process reset selected" event and resumes recording. The activity log is never destroyed by user action.
6. **Importers only widen contracts** — never rename or remove fields. Downstream tools must accept every prior export version.
7. **Regulatory/framework anchors are cut suite-wide.** No control IDs, standards citations, or framework references appear in the tools.

---

## 4. Per-tool specification

### BO1 — CBS Prioritization (`BO1-prioritization_2.html`, ~56 KB)

**Job:** Get the room to a prioritized list of critical business services with agreed recovery-urgency tiers.

**Mechanics:**
- Drag-and-drop grid: services (chips) × 5 tier columns. Demo dataset: 52 services across the 4 groups, each `{name, group, tier, functional_area, description}`.
- Tiers: t1 `< 4 Hours` (life/safety) · t2 `4–24 Hours` · t3 `1–3 Days` · t4 `3–7 Days` · t5 `> 1 Week`. Tier and group **labels are editable in-session** (methodology is client-adaptable); tier semantics are not.
- Seeded placements = EY hypothesis. Every chip move, label edit, note, add, and delete is a typed, sequenced log event.
- Add services/groups in-session (added groups draw from a fallback color palette). Per-service notes modal. Group presentation filter (present one breakout group's slice at a time). Undo stack.

**Persistence/session:** `localStorage` autosave under a versioned key; session ID = ISO timestamp + facilitator name; `?fresh=1` escape hatch.

**Exports:** CSV decision log · JSON primary feed (consumed by BO2) · Markdown readout.

### BO2 — Dependency Mapping (`BO2-dependency-mapping_2.html`, ~87 KB)

**Job:** For each prioritized service, map what it depends on across the five lenses; confirm or reject a prepopulated hypothesis.

**Mechanics:**
- Ingests BO1's JSON export (also accepts CSV). Ships `CBS_CATALOG` + `PREPOP` generated from the **same source dataset** as BO1's services (a `dataset.py` generator) so the two cannot drift — preserve this single-source pattern in the MVP.
- `PREPOP` prefills ranked Technology and Third Parties dependencies per service (fictional stack: EHR, patient monitoring, interface engine, LIS, PACS, dispensing cabinets, staffing agency, couriers, utilities, etc.). People / Process / Facilities start empty — the room adds them live.
- Each (service × dependency) instance carries: `confirmed` (`yes` / `no` / `unreviewed`), `rank`, `origin` (`prepopulated` / `manual`), `facilitator_notes`.
- **BO2 mints the suite's join key:** `dep_id = svc_<service_slug>::<lens_code>_<dependency_slug>` (e.g., `svc_emergency_department_trauma::tech_medicore_ehr`). Slug: lowercase, non-alphanumerics → `_`, trimmed. This spine joins BO2 → BO3 → BO4.

**Exports:** CSV two-block · JSON primary feed (`{tool, version, session_id, groups, lenses, activity_log, final_state[]}`) · Markdown.

### BO3 — Dependency Risk & SPoF (`BO3-risk-spof_2.html`, ~149 KB)

**Job:** Rate confirmed dependencies with lens-specific questions; auto-surface concentration risk, single points of failure, and cascade considerations.

**Mechanics:**
- Ingests BO2's JSON export. Also ships a baked standalone `SEED` (a sample BO2 export) so it demos without a live chain.
- **Answers attach per `dep_id`** — per (service × dependency) instance, never per deduplicated dependency. The same EHR can be service-halting for the ED and merely degrading for marketing. This is a core architectural decision; keep it.
- **Lens-specific question banks** (`LENS_Q`):
  - *Technology:* service-halting? (Y flags risk) · sensitive data? (Y flags) · impact text · downstream-functions text
  - *Third Parties:* same shape as Technology
  - *Process:* service-halting? · impact · downstream
  - *People:* licensing/regulatory requirements? · workforce resilience strategies (cross-training/backfills)? (**No** flags risk; carries forward) · normal staffing (number) · minimum staffing (number) · downstream impact
  - *Facilities:* alternate location possible? (**No** flags risk) · impact
- **Concentration engine:** dependencies cluster by normalized name across services. Confirmed-service count = concentration. At `SPOF_MIN = 3` confirmed services, SPoF **auto-flags** (manual toggle also available, with undo). Validating an unreviewed instance from the concentration sidebar raises the count live — a deliberate facilitation moment.
- "Primary system" heuristic: ≥3 confirmed services, ≥2 rank-1 positions, rank-1s ≥ half of confirmed. Cascade line generated per cluster.
- CBS-primary register view with lens sub-grouping, hard group-scope filter, filter-linked concentration sidebar.

**Exports:** CSV (answer columns from a fixed `ANS_KEYS` superset) · JSON primary feed (risk objects in a `risk_*` namespace alongside pass-through BO2 fields) · Markdown.

### BO4 — Workaround & Recovery Assessment (`BO4-workaround-readiness_2.html`, ~54 KB)

**Job:** For each dependency: does a workaround exist, is it documented, is it tested, how long does it sustain — and does that hold up against the service's recovery-urgency tier?

**Mechanics:**
- Ingests BO3 (preferred) or BO2. Group → pillar, dependency → card, lens → type. Assessment fields start blank — **the room answers them**.
- Per-item fields: `exists` (bool) · `documented` (bool) · `tested` (bool) · `sustain` (duration bucket) · `notes`. BO2 lineage (`dep_id`, tier, origin, confirmed, rank) rides along read-only.
- **Derived status (the deck-driving traffic light):**
  - `Not assessed` — no workaround answer yet
  - `Critical gap` (red) — workaround does not exist: single point of failure, service stops
  - `At risk` (amber) — workaround exists but not documented, not tested, sustain unset, or sustains < 24 hrs
  - `Resilient` (green) — exists + documented + tested + sustains beyond 24 hrs
- Tier displayed alongside sustain for the judgment call ("workaround sustains 8 hrs; service tier is < 4 hrs — fine; tier 1–3 days — problem"). Never auto-scored.
- `localStorage` with an in-memory fallback shim (survives blocked storage), `?fresh=1`.

**Exports:** Session log export · CSV.

### CBS Solar Map (`CBS_Solar_Map_Interactive.html`, ~45 KB)

**Job:** Executive read-out visualization — one service as a "solar system": service at center, five lens orbits, dependency chips on the rings, status-colored.

**Mechanics:**
- Pure hand-built SVG, zero libraries. Chip status click-cycles `crit → atrisk → res → na` (`#E0301E` / `#E8902A` / `#2DB757` / `#BFC4CC`), matching BO4's status semantics.
- **Client-side export builders written from scratch:** an uncompressed ZIP writer (STORE + CRC32 table), a minimal PDF generator, and a minimal PPTX generator (raw OOXML strings, correct slide sizing from pixel aspect). One click yields a board-ready slide with no server and no dependencies.
- Default focused service is the suite's walkthrough service ("Inpatient Nursing Units").
- **The reviewed copy of this file embeds a live-client dataset.** Use it only as a mechanics reference per §1. The MVP renders the same visualization directly from BO4/BO3 state — the embedded-dataset pattern disappears entirely.

---

## 5. Cross-cutting engineering contracts (carry these forward)

- **Export hardening:** `SESSION_ID` + monotonic `seq` on every log event; `clean()`/`escapeMD()` applied at the export boundary only; `esc()` for DOM only; CSV two-block + JSON primary + MD; non-blocking save banner.
- **Activity log as first-class data:** typed events (`move`, `confirm`, `reject`, `add`, `rate`, `spof`, `mark`, …) with timestamps and detail strings. This is the audit trail and the AI-synthesis input. In the MVP it becomes an append-only event table.
- **Origin + review-state on all prepopulated content** (`origin`, `confirmed: unreviewed`) — the structural encoding of "flag, don't fabricate."
- **Fail loud.** Import dispatch validates tool identity before ingesting; malformed input is rejected with a clear message, never partially applied.
- **Offline-safe:** current tools run with no network (fonts degrade to system-ui). The MVP is facilitated live in client conference rooms — assume hostile Wi-Fi. Local-first behavior with sync, or at minimum aggressive offline tolerance, is a requirement, not a nice-to-have.

---

## 6. Why an MVP with a backend (the friction the current architecture creates)

1. **Single facilitator, single machine.** All input funnels through one person at the projector. Breakout groups can't work in parallel in the same dataset.
2. **`localStorage` persistence.** Per-browser, per-machine, size-capped, wiped by profile cleanup. No server-side record, no recovery if the laptop dies mid-session.
3. **File-passing between tools.** JSON export → manual import is robust but manual; the chain breaks if a stale export is loaded (version stamps mitigate, don't eliminate).
4. **Data baked into HTML.** Every new engagement means regenerating and re-shipping five HTML files. Demo continuity bugs happen (see §8).
5. **No engagement separation.** One dataset per file copy. Cross-engagement reuse means forking files.
6. **The "AI-enabled" label is currently downstream.** AI synthesis happens outside the tools, on the exports. Building it into the product (with human-review gates) trues up the label.

---

## 7. MVP shape — direction, not a spec

Claude Code should challenge and improve this; it's a starting position, with the recommended answer stated where there is one.

**Core model:** multi-tenant by **engagement**. An engagement owns: a service catalog, groups (labels + colors), tier labels, dependency instances, risk answers, workaround assessments, and an append-only event log. HealthCo ships as the seed engagement.

**Roles:** `facilitator` (full control, runs sessions) and `participant` (scoped to their breakout group; can propose/confirm within it). Board/executive `viewer` (read-only dashboards) is a candidate — recommend deferring past MVP.

**The four tools become four modules over one datastore.** The `dep_id` spine becomes real foreign keys (`services`, `dependencies`, `dependency_instances`, `risk_answers`, `workaround_assessments`, `events`). Name-slug IDs remain as stable external identifiers in exports for continuity with the HTML-era format.

**Sessions:** a live-session concept (which module is active, which group is presenting) enabling the projector view + participant devices pattern. Recommended transport: server-authoritative state with WebSocket or polling sync — simple beats clever here.

**Exports remain the client boundary:** XLSX (multi-tab, matching the established master-workbook shape), CSV, JSON, MD, and the Solar Map's one-click PPTX/PDF per service. Export fidelity with the current formats is a hard requirement — downstream synthesis pipelines already consume them.

**AI features (differentiators, all draft-gated):** session-log → narrative digest; risk-answer synthesis into themes/cascade narratives; draft finding generation from BO3/BO4 state; anomaly prompts ("this dependency is confirmed for 6 services but has no workaround assessment"). Every AI output is marked draft-pending-review. **Nothing AI-generated enters the record unreviewed.**

**Stack guidance:** Replit-friendly and boring. Recommended: a mainstream full-stack TypeScript or Python framework, Postgres, server-rendered or SPA per Claude Code's judgment. No exotic infrastructure. Single deployable unit.

**Out of scope for MVP:** SSO/enterprise auth (simple auth is fine), multi-firm white-labeling, mobile-native apps, offline-first sync engines (offline *tolerance*, yes; a full CRDT sync engine, no).

---

## 8. Known gaps to fix in the MVP

1. **Seed continuity:** the BO3 standalone seed covers 14 deep-dive services but omits the walkthrough service ("Inpatient Nursing Units"), so the BO1/BO2 walkthrough doesn't carry through BO3/BO4 in standalone demo mode. In the MVP, regenerate all seed data from the single-source generator so the walkthrough service flows end to end — including the Solar Map default.
2. **Solar Map integration:** currently a standalone file with its own embedded dataset. In the MVP it renders live from assessment state; the status enum unifies with BO4's derived status rather than being independently clickable (manual override allowed, logged).
3. **BO4 export parity:** BO4's export is lighter than BO1–BO3's (log + CSV). Bring it up to the full contract (JSON primary feed included).
4. **Concurrency:** the whole current suite assumes one writer. The MVP's multi-user model needs explicit conflict handling (server-authoritative, last-write-wins with event log as truth is acceptable for MVP).

---

## 9. Acceptance shape for the architecture document

The architecture doc Claude Code produces should cover, at minimum: data model (ERD-level), API surface, role/permission model, session/real-time approach, export pipeline design, AI-feature integration points with review gating, seed/demo data strategy, deployment shape on Replit, and a build sequence (what ships in slice 1 vs later). Flag every place where it deviates from this brief, with reasoning.
