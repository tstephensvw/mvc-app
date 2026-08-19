# Enterprise Resilience Workout (ERW) Suite — MVP

Re-architecture of a proven 5-tool HTML facilitation suite (CBS prioritization → dependency mapping → risk/SPoF → workaround readiness → solar-map read-out) into a multi-user web application. **This repo is a complete Replit handoff package: import it into Replit and let Replit Agent build MVP v1 from the brief.**

## How to hand off to Replit

1. Import this GitHub repo into Replit (Create App → Import from GitHub).
2. Replit Agent reads `replit.md` automatically. Point it at the work: *"Build slice 1 of docs/replit-build-brief.md."* Then proceed slice by slice (1 → 6), verifying each slice's acceptance criteria before the next.
3. Set Secrets: `SESSION_SECRET` (any random string); `ANTHROPIC_API_KEY` only when you reach slice 6. The PostgreSQL module provides `DATABASE_URL`.
4. Deploy as a **Reserved VM** for workshop use (stable WebSockets, no cold starts).

## What's in the package

| Path | Contents |
|---|---|
| `replit.md` | Replit Agent instructions: stack, non-negotiable rules, build order. |
| `docs/replit-build-brief.md` | The work order — seed spec + slices 1–6 with acceptance criteria. MVP v1 = slices 1–4. |
| `docs/architecture-decision.md` | The approved architecture (data model, API, roles, real-time, exports, AI gating, master-workbook spec). |
| `docs/reference/` | Handoff brief + the four verified generic demo builds (fictional HealthCo data) — UX and compatibility oracles. |
| `shared/dataset/` | HealthCo demo dataset: 52 services, prepop matrices, BO4/Solar demo statuses, locked taxonomy. |
| `shared/derive/` | All derived logic: BO4 traffic light, slug/dep_id minting, SPoF/concentration/primary-system. |
| `shared/contracts/` | Zod schemas for the four export JSON contracts + fail-loud import dispatcher + BO3 question banks. |
| `shared/export-kit/` | Export-boundary hygiene, two-block CSV writer, zero-dep ZIP/PDF/PPTX builders. |
| `db/schema.ts` | Complete Drizzle schema (architecture doc §3.2). |

Pre-built code is tested: `npm install && npm test` (40 tests) and `npm run typecheck` must stay green.

## Data boundary

All data in this repo is the fictional **HealthCo** dataset. No real client names, systems, vendors, facilities, or people — ever (see `docs/architecture-decision.md` §1).
