# ERW Suite MVP — Replit Agent instructions

You are building **MVP v1** of the Enterprise Resilience Workout (ERW) suite: a facilitated-workshop web app that takes a client from a service inventory to a board-ready resilience readout through four sequential modules (BO1 prioritize → BO2 map dependencies → BO3 rate risk/SPoF → BO4 assess workarounds) plus a Solar Map read-out visualization.

**Read these before writing any code, in this order:**
1. `docs/replit-build-brief.md` — what to build, slice by slice, with acceptance criteria. Follow it.
2. `docs/architecture-decision.md` — the approved architecture. It is authoritative on data model, API, roles, real-time, exports, and AI gating.
3. The `shared/` and `db/` directories — **already built and tested. Use them; do not rewrite them.**

## What is already in this repo (do not reinvent)

| Path | What it is |
|---|---|
| `shared/dataset/` | The complete fictional **HealthCo** demo dataset: 52 services, prepopulated dependency matrices, BO4/Solar demo statuses, locked taxonomy constants. Single source for seeding and fixtures. |
| `shared/derive/` | Every derived value: BO4 traffic-light `statusOf()`, `slug()`/`mintDepId()` identity minting, SPoF/concentration/primary-system rules, Solar status mapping. **Never store these; always compute via these functions.** |
| `shared/contracts/` | Zod schemas for the four export JSON formats (field names are load-bearing — downstream pipelines consume them), the fail-loud legacy import dispatcher, and the BO3 question banks. |
| `shared/export-kit/` | Export-boundary hygiene (`clean`, two-block CSV writer, session-id format) and zero-dependency ZIP/PDF/PPTX builders (proven in production — do not replace with libraries). |
| `db/schema.ts` | The full Drizzle schema. Implements the architecture doc §3.2 exactly. |

Run `npm test` and `npm run typecheck` — both must stay green after every change you make.

## Stack (decided — do not substitute)

TypeScript everywhere. React 18 + Vite client, Express API + `ws` WebSockets, Drizzle ORM on the Replit PostgreSQL database, Zod validation, single Node process serving API + WS + built SPA. Vitest for tests. Add `express`, `ws`, `react`, `vite`, `drizzle-kit`, `pg` etc. as you scaffold slice 1; keep `zod` and `drizzle-orm` at the installed versions.

## Non-negotiable rules (from the approved architecture — enforce structurally)

1. **Fictional HealthCo data only** in every seed, fixture, and test. Never invent or import real client names, systems, vendors, facilities, or people.
2. **RTO/tier is derived, never entered** downstream of BO1. No API route or UI field writes a tier anywhere except the BO1 module. BO3/BO4/Solar show it read-only.
3. **Five lenses locked** (People/Process/Technology/Facilities/Third Parties) — they are a Postgres enum; build no lens CRUD.
4. **Flag, don't fabricate**: prepopulated content starts `origin='prepopulated'`, `confirmed='unreviewed'`. Blank stays blank; derived status maps blanks to "Not assessed".
5. **The event log is append-only.** Every mutating API route inserts an event in the same transaction. Reset endpoints clear state tables but never touch `events`. After the first migration, run `REVOKE UPDATE, DELETE ON events FROM <app role>`.
6. **Exports are the product's edge.** Use `shared/contracts` schemas and `shared/export-kit` helpers; never rename or remove an export field (widen-only). `clean()`/`escapeMD()` at the export boundary only.
7. **AI outputs are draft-gated.** Anything model-generated lands in `ai_drafts` with `status='draft'` and enters the record only through an explicit facilitator accept (which emits an `ai_accept` event). Server-side Anthropic SDK only; never expose the API key to the client.
8. **User-facing copy** describes the product as an "AI-enabled facilitation tool" — never by its technical construction. No regulatory-framework citations or control IDs anywhere in the tool UI.
9. Follow the repo's derived logic: if you need a status, a slug, a SPoF flag, or a concentration count, import it from `shared/derive` — do not re-implement.
10. **Sector-agnostic product.** The demo engagement happens to be healthcare (HealthCo), but the tool serves any sector — banking, energy, manufacturing, government, retail. Healthcare terms may appear ONLY inside the HealthCo engagement's data. Never in: schema, enums, API routes, UI chrome/labels/placeholders/empty states, error messages, export headers, or AI prompt templates. New engagements seed from `GENERIC_GROUPS` / `GENERIC_TIERS` (sector-neutral); groups and tier labels are configured per engagement. Say "service", "dependency", "organization" — never "patient", "clinical", "hospital" — in product copy. (Only the five lenses and the ordered tier codes t1–t5 are locked suite-wide.)

## Build order

Work the slices in `docs/replit-build-brief.md` in order (1 → 6). Each slice has acceptance criteria — meet them before moving on. Slice 1 (walking skeleton + BO1 + exports + seed) is the priority; a deployed, demoable slice 1 beats a half-built slice 3.

## Environment

- `DATABASE_URL` — Replit PostgreSQL (already configured by the postgresql module).
- `SESSION_SECRET` — set in Replit Secrets.
- `ANTHROPIC_API_KEY` — set in Replit Secrets (slice 6 only).
- Serve on `process.env.PORT` (5000). Deployment target: Reserved VM (stable WebSockets).
