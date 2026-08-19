# ERW Suite MVP v1 — Build Brief (for Replit Agent)

This is the work order. `docs/architecture-decision.md` is the authority on *why*; this file is the *what and in which order*. The `shared/` and `db/` code in this repo is pre-built and tested — build the app around it.

**Definition of MVP v1 = slices 1–4 complete.** Slices 5–6 are in scope for v1.x if time allows, in this order. Never break `npm test` or `npm run typecheck`.

---

## Global conventions

- **Layout:** `client/` (React + Vite), `server/` (Express + ws), reuse existing `shared/` + `db/`. One `npm run dev` (Express with Vite middleware) and one `npm run build && npm start` for deployment.
- **API shape:** REST under `/api/engagements/:eid/…` exactly as architecture doc §5. Zod-validate every body. Every mutation = one DB transaction: state change + `events` insert (per-engagement monotonic `seq`) + WS broadcast after commit.
- **Auth (simple, per brief):** email+password login for facilitators; session cookie (`express-session` + Postgres store). Participants (slice 5) join with a live-session join code + display name, no email.
- **Derived values** always come from `shared/derive`. API responses carry them as read-only fields.
- **Visual language:** carry the suite's look — teal-on-white (`#00708c` accent family), Archivo + Source Serif 4 (Google Fonts with system-ui fallback), the four locked group colors from `shared/dataset/constants.ts`, and the red/amber/green/slate status chips used in the HTML tools (see `docs/reference/*.html` for exact styling cues). Present mode (large type, chrome hidden) on every module — these tools are projected in a room.
- **Every module has:** an activity-log drawer (rendered from `events`), a Reset action that restores the module's EY-hypothesis state *and keeps the log* (writes a `reset` event), and export buttons (JSON / CSV / MD per module).

## Seed (runs when the DB is empty)

Create the **"HealthCo (Demo)"** engagement (`is_demo=true`) from `shared/dataset`:

1. Groups + tiers from `GROUPS` / `TIERS`; one facilitator user (`demo@healthco.example` / password `healthco-demo`, displayed on the login screen for the demo).
2. All 52 `SERVICES` → `services` rows: `origin='client-inventory'`, `seeded_tier_code = current_tier_code = tier`, slug via `serviceSlug()`. Mark the 13 `SOLAR_DEMO` services `deep_dive=true`.
3. For every service, its `PREPOP` tech/thirdparty entries → `dependencies` clusters (upsert by `clusterKey`) + `dependency_instances` (`origin='prepopulated'`, `confirmed='unreviewed'`, rank, `dep_slug` via `mintDepId`).
4. For the 13 `SOLAR_DEMO` services, also create their people/process/facilities deps as instances (`origin='prepopulated'`, `confirmed='unreviewed'`).
5. **Demo BO3 answers** (deterministic synthesis — documented, fictional): for every instance of a `SOLAR_DEMO` service, set `confirmed='yes'` and write `risk_answers` per lens bank: tech/thirdparty/process `service_halting=true` when the demo status is `crit` (else `false`), `sensitive_data=true` for tech deps named MediCore EHR / LabLine LIS / ClaimBridge Core Admin / CoreERP Finance & HR; people `workforce_resilience=false` when status is `crit` or `atrisk`; facilities `alternate_location=false` when status is `crit`. Leave text fields blank (flag-don't-fabricate).
6. **Demo BO4 assessments** from `SOLAR_DEMO` statuses, per the mapping documented in `shared/dataset/solar-demo.ts` (crit → exists=false; atrisk → exists=true/documented=false/tested=false/sustain=t2; res → exists/documented/tested=true/sustain=t4; na → all null). Cluster-level rows only (no overrides in seed). Where the same dependency has conflicting statuses across services (e.g. MediCore EHR is `crit` in one service, `atrisk` in another), the cluster default takes the **worst** status and each differing service gets a per-service override row — demonstrating the override feature.
7. Seed writes NO events (the log starts clean); a "Reset demo engagement" admin action restores this state and logs a `reset` event.

**Walkthrough check (must pass):** "Inpatient Nursing Units" is visible in BO1 at tier `4 – 24 Hours`, has prepop deps in BO2, risk answers + SPoF context in BO3, assessments in BO4, and renders in the Solar Map — end to end.

---

## Slice 1 — Walking skeleton + BO1 (the priority)

**Build:** project scaffold, auth, seed, event log plumbing, WS channel (broadcast only — the facilitator UI consumes it for the activity drawer), and the complete BO1 module:

- Tier matrix grid: rows = groups (locked colors), columns = 5 tiers; service chips drag-and-drop between tier cells. Chip shows a "moved" marker when `current_tier != seeded_tier`. Undo. Group presentation filter. Notes modal per service (with the EY-drafted description shown). Add service (origin `workshop`), soft-delete service, relabel tiers/groups, add group (palette from `GROUP_PALETTE`). Mark-round checkpoint events. Present mode.
- Deep-dive flag per service (checkbox in the notes modal) — this is what narrows scope for BO2.
- **Exports:** BO1 JSON matching `Bo1Export` exactly (validate with the schema in a test), two-block CSV via `twoBlockCsv()` matching the HTML-era column order (see `docs/reference/BO1prioritization_2.html` export functions), MD readout (net changes from hypothesis, adds, deletes, notes, full decision log).

**Accept when:** login → see HealthCo BO1 board seeded with 52 services → drag a chip → event appears in the log drawer with seq+timestamp → reset restores placements but keeps the log → all three exports download and the JSON parses with `Bo1Export` → `npm test` green → deployed and reachable.

## Slice 2 — BO2 Dependency Mapping

- Sidebar of in-scope services (deep-dive selected, else all), grouped by breakout group with confirmed/total counts. Main panel: 5 lens columns; prepopulated chips ordered by rank with "Matrix rank N" origin badges, manual adds with "ADDED" badges; ✓/✗/unreview cycling; per-dep notes/rename modal; descope service. New manual dep upserts the cluster and mints `dep_slug` via `mintDepId` (uniqueness against the service's existing instances).
- **Legacy import:** `POST /api/engagements/:eid/import` using `dispatchLegacyImport` — BO1 files narrow scope to deep-dive flags exactly like the HTML tool; fail loud, atomic, `import` event.
- **Exports:** JSON matching `Bo2Cell`/`Bo2Export` (group as LABEL, lens label + `lens_code`, `confirmed` as yes/no/unreviewed strings), two-block CSV, MD.

**Accept when:** confirming a prepop dep updates counts live; a manual dep gets a correct `dep_id`; BO2 JSON validates against `Bo2Export`; importing a real HTML-era BO1 JSON export works.

## Slice 3 — BO3 Risk & SPoF

- Register view: instances grouped by CBS then lens, hard group-scope filter, per-instance answer forms from `shared/contracts/question-banks.ts` (bank-driven rendering — no hardcoded forms). Writing answers extracts `service_halting`/`sensitive_data`/`flagged` columns via `isFlagged`.
- Concentration sidebar (live): clusters with `concentration`/`concentrationPotential`, auto-SPoF at `engagements.spof_min` (default 3), manual SPoF toggle (logged, undoable), `isPrimarySystem` + `cascadeLine` per cluster. Confirming an unreviewed instance from the sidebar raises the count in view (the facilitation moment).
- Risk band per instance: derived default from flags (any flag → high; `service_halting` + SPoF cluster → critical; no flags → moderate when answered, unrated when blank) with a facilitator override dropdown (logged). Keep the derivation in `shared/derive` (add a function + tests).
- **Exports:** BO3 JSON matching `Bo3Export` (deduped `dependency_risk` clusters + per-instance `final_state` with `risk_*` fields), CSV with the `ANS_KEYS` column superset, MD.

**Accept when:** answering tech questions on 3+ services' shared dependency auto-flags SPoF; the manual toggle overrides it; BO3 JSON validates and imports into the HTML-era BO4 tool (`docs/reference/BO4workaroundreadiness_2.html`) without error — that file is the compatibility oracle.

## Slice 4 — BO4 + Solar Map

- BO4 board: clusters grouped by risk band (Critical → High → Moderate → Low → Unrated), SPoF / "halts N" badges, supported services with their tiers shown read-only next to the sustain dropdown. Yes/No toggles for exists/documented/tested (documented/tested/sustain go n/a when exists=false), sustain = the five time bands, notes. Status chip from `statusOf()`. Gap summary bar (counts by status). Per-service override editor on each supported-service row (§15-A4) — visible indicator when an override exists.
- Solar Map: SVG render from live state (service center, five lens arcs, status-colored dots + labels, legend with counts) — port the layout math from `docs/reference/CBS_Solar_Map_Interactive_DEMO.html` (`layout()`, `anchor()`, dot/label sizing). Status = derived BO4 status via `toSolarStatus`; manual per-dep display override allowed (logged). Client-side PNG/PDF/PPTX export: rasterize the SVG on canvas, then `buildPDF`/`buildPPTX` from `shared/export-kit` — plus Solar JSON matching `SolarJson`.
- **BO4 full-parity export:** JSON matching `Bo4Export` (the new `BO4-WORKAROUND` feed), CSV, MD.

**Accept when:** flipping an assessment updates the Solar dot color; the PPTX opens in PowerPoint (verify the zip structure test still passes and do a manual open); BO4 JSON validates; the walkthrough service demos end to end.

## Slice 5 — Live sessions & participants

- Live session create/end; facilitator controls active module + presenting group; join code shown as text + QR. Participant joins with code + display name → scoped to their breakout group; direct writes with attribution (their name in every event). Projector view = present mode following the live session's active module.
- Sync: WS event fan-out with `GET /api/engagements/:eid/events?after_seq=` polling fallback (same payload). Client keeps `last_seq`; on reconnect, catch up or refetch. Last-write-wins; show a soft "superseded" toast when the server reports an overwrite of a newer value.
- Offline tolerance: facilitator client queues writes in IndexedDB with idempotency keys, replays on reconnect, shows a sync banner; "Emergency export" dumps current state + queue as JSON (re-importable).

**Accept when:** two browsers (facilitator + participant) see each other's writes within a second; killing the network and restoring it replays the facilitator's queued writes; a participant cannot write outside their group.

## Slice 6 — AI features & master workbook

- **XLSX master workbook** (`exceljs`): implement Appendix A of the architecture doc exactly — 14 tabs, header chrome (Arial bold white on `#1F2D5A`, freeze panes, autofilter), status fills (Critical `#E8665D`, High `#F4A259`, Moderate `#F7D154`, Low `#9CCC65`; workaround Critical gap `#E8665D` / At risk `#F4A259` / Resilient `#9CCC65`), hidden `_data` spine (+ `cbs_id`/`dep_id` columns), live `COUNTIFS` Risk Rollup, README tab generated from engagement metadata + event log. Leading-Practice Uplift tab renders **accepted** `ai_drafts` (kind=findings) only.
- **Closeout:** archive action → `archived_at`, read-only mode, closeout ZIP (via `zip()` from export-kit) containing the workbook, 4 JSON feeds, MD readouts, per-service Solar JSONs, and flat per-entity CSVs (snake_case, stable `svc_…`/`dep_id` keys) for SOR upload.
- **AI drafts** (server-side only, official `@anthropic-ai/sdk`, model `claude-opus-5`, streaming, adaptive thinking left at defaults): four kinds — session-log digest, risk themes/cascade narrative, draft findings (feeds Leading-Practice Uplift after review), anomaly prompts (deterministic queries phrased by the model). Inputs are the module JSON exports. Review UI: draft + provenance → accept (writes through the normal path, `origin='ai-accepted'`, `ai_accept` event) or reject. Prompt templates versioned in `server/ai/prompts/`; record `prompt_version` + `model` on every draft.

**Accept when:** the workbook opens in Excel with a working Risk Rollup; a rejected draft never appears in any export; an accepted findings draft appears in the Uplift tab.

---

## Testing bar

- Keep the existing 40 `shared/` tests green.
- Add per-slice: export golden tests (generate → validate with `shared/contracts` → snapshot), seed integrity (walkthrough check above), API permission tests (participant scope), and the BO4-oracle check in slice 3.
- Manual gate per slice: the demo walkthrough on the deployed app.
