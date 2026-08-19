/**
 * ERW Suite data model — implements docs/architecture-decision.md §3.2 exactly.
 *
 * Structural enforcement of locked methodology (arch doc §4):
 *  - No writable RTO/tier column exists downstream of `services` (rule: RTO derived, never entered).
 *  - `lens` is a pg enum — the five lenses are locked; there is no lens CRUD.
 *  - `events` is append-only: after migration, REVOKE UPDATE, DELETE ON events FROM the app role
 *    (see db/migrations note in the build brief) — reset can never destroy the log.
 *  - `confirmed` defaults 'unreviewed'; assessment/answer fields are nullable — blanks stay blank.
 *  - External slugs (svc_…, dep_id) are minted once (shared/derive) and never regenerated.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  bigserial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ---------------- enums (locked taxonomies) ---------------- */

export const lensEnum = pgEnum("lens", ["people", "process", "tech", "facilities", "thirdparty"]);
export const tierCodeEnum = pgEnum("tier_code", ["t1", "t2", "t3", "t4", "t5"]);
export const confirmedEnum = pgEnum("confirmed_state", ["unreviewed", "yes", "no"]);
export const serviceOriginEnum = pgEnum("service_origin", ["client-inventory", "workshop"]);
export const instanceOriginEnum = pgEnum("instance_origin", ["prepopulated", "manual"]);
export const roleEnum = pgEnum("member_role", ["facilitator", "participant"]);
export const moduleEnum = pgEnum("module", ["BO1", "BO2", "BO3", "BO4", "SOLAR", "SYSTEM", "AI"]);
export const draftKindEnum = pgEnum("draft_kind", ["digest", "themes", "findings", "anomaly"]);
export const draftStatusEnum = pgEnum("draft_status", ["draft", "accepted", "rejected"]);

/* ---------------- tenancy & people ---------------- */

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  clientLabel: text("client_label").notNull().default(""),
  isDemo: boolean("is_demo").notNull().default(false),
  /** SPoF auto-flag threshold — engagement setting, default 3 (§15-A6). */
  spofMin: integer("spof_min").notNull().default(3),
  archivedAt: timestamp("archived_at", { withTimezone: true }), // export-and-freeze (§15-A5)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  /** Participants may join by code + display name only — no email required (§15-A1). */
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const engagementMembers = pgTable(
  "engagement_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    role: roleEnum("role").notNull(),
    /** Participant scope — the breakout group they may write within. NULL for facilitators. */
    groupId: uuid("group_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("member_unique").on(t.engagementId, t.userId)],
);

/* ---------------- structural config ---------------- */

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    code: text("code").notNull(), // G1..G4, Gx5… for workshop-added
    label: text("label").notNull(),
    desc: text("desc").notNull().default(""),
    color: text("color").notNull(),
    colorDark: text("color_dark").notNull(),
    origin: serviceOriginEnum("origin").notNull().default("client-inventory"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [uniqueIndex("group_code_unique").on(t.engagementId, t.code)],
);

export const tiers = pgTable(
  "tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    code: tierCodeEnum("code").notNull(), // semantics locked (ordered); labels editable
    label: text("label").notNull(),
    desc: text("desc").notNull().default(""),
  },
  (t) => [uniqueIndex("tier_code_unique").on(t.engagementId, t.code)],
);

/* ---------------- BO1: services (CBS) ---------------- */

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    /** External identity `svc_<slug>` — minted once, frozen across renames (arch doc §3.3). */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    groupId: uuid("group_id").notNull().references(() => groups.id),
    functionalArea: text("functional_area").notNull().default(""),
    description: text("description").notNull().default(""),
    /** EY starting hypothesis vs. the room's current call — both kept (BO1 'moved' semantics). */
    seededTierCode: tierCodeEnum("seeded_tier_code").notNull(),
    currentTierCode: tierCodeEnum("current_tier_code").notNull(),
    origin: serviceOriginEnum("origin").notNull(),
    deepDive: boolean("deep_dive").notNull().default(false),
    notes: text("notes").notNull().default(""),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete — the log must still name it
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("service_slug_unique").on(t.engagementId, t.slug)],
);

/* ---------------- BO2/BO3: dependencies (cluster) + instances (spine) ---------------- */

export const dependencies = pgTable(
  "dependencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    name: text("name").notNull(),
    /** slug(name) — BO3 clusters by normalized name within a lens. */
    normalizedName: text("normalized_name").notNull(),
    lens: lensEnum("lens").notNull(),
    /** Manual SPoF override: NULL = follow the auto flag (concentration >= engagement.spof_min). */
    spofManual: boolean("spof_manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("dependency_cluster_unique").on(t.engagementId, t.lens, t.normalizedName)],
);

export const dependencyInstances = pgTable(
  "dependency_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    serviceId: uuid("service_id").notNull().references(() => services.id),
    dependencyId: uuid("dependency_id").notNull().references(() => dependencies.id),
    /** External identity `svc_<slug>::<lens>_<slug>[ _n]` — minted once, frozen (BO2 contract). */
    depSlug: text("dep_slug").notNull(),
    origin: instanceOriginEnum("origin").notNull(),
    /** Flag-don't-fabricate: prepopulated content starts unreviewed (brief §3.4). */
    confirmed: confirmedEnum("confirmed").notNull().default("unreviewed"),
    rank: integer("rank"),
    notes: text("notes").notNull().default(""),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("instance_pair_unique").on(t.serviceId, t.dependencyId),
    uniqueIndex("instance_slug_unique").on(t.engagementId, t.depSlug),
    index("instance_dep_idx").on(t.dependencyId),
  ],
);

/* ---------------- BO3: risk answers (per INSTANCE — never per cluster) ---------------- */

export const riskAnswers = pgTable(
  "risk_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    dependencyInstanceId: uuid("dependency_instance_id").notNull().references(() => dependencyInstances.id),
    /** Validated against shared/contracts/question-banks.ts for the instance's lens. */
    answers: jsonb("answers").notNull().default({}),
    bankVersion: integer("bank_version").notNull().default(1),
    /** Extracted flags for queryability (derived from answers on write). */
    serviceHalting: boolean("service_halting"),
    sensitiveData: boolean("sensitive_data"),
    flagged: boolean("flagged").notNull().default(false),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("risk_answer_unique").on(t.dependencyInstanceId)],
);

/* ---------------- BO4: workaround assessments (cluster default + per-service override, §15-A4) ---------------- */

export const workaroundAssessments = pgTable(
  "workaround_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    dependencyId: uuid("dependency_id").notNull().references(() => dependencies.id),
    /** NULL = cluster default (assessed once per dependency); set = per-service override (logged). */
    dependencyInstanceId: uuid("dependency_instance_id").references(() => dependencyInstances.id),
    waExists: boolean("wa_exists"),
    documented: boolean("documented"),
    tested: boolean("tested"),
    /** Time band the workaround holds for — reuses tier band codes. NOT the service's RTO (never writable here). */
    sustain: tierCodeEnum("sustain"),
    notes: text("notes").notNull().default(""),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Postgres treats NULLs as distinct in unique indexes, so cluster defaults
    // (instance NULL) need NULLS NOT DISTINCT semantics — enforced here:
    uniqueIndex("assessment_unique").on(t.dependencyId, t.dependencyInstanceId).with({ nullsNotDistinct: true }),
  ],
);

/* ---------------- events (append-only — audit trail AND the realtime sync primitive) ---------------- */

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
    liveSessionId: uuid("live_session_id"),
    /** Monotonic per engagement — clients sync with GET /events?after_seq. */
    seq: integer("seq").notNull(),
    module: moduleEnum("module").notNull(),
    /** Open vocabulary, widen-only: move, confirm, reject, unreview, add, del, note, rate, spof, mark, reset, scope, import, ai_accept, … */
    type: text("type").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    /** Entity pointers: {service_id?, dependency_id?, instance_id?, draft_id?, …}. */
    refs: jsonb("refs").notNull().default({}),
    detail: jsonb("detail").notNull().default({}),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("event_seq_unique").on(t.engagementId, t.seq), index("event_engagement_idx").on(t.engagementId, t.id)],
);

/* ---------------- live sessions ---------------- */

export const liveSessions = pgTable("live_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  name: text("name").notNull(),
  facilitatorId: uuid("facilitator_id").notNull().references(() => users.id),
  activeModule: moduleEnum("active_module").notNull().default("BO1"),
  presentingGroupId: uuid("presenting_group_id"),
  /** HTML-era SESSION_ID string (ISO start + facilitator) — preserved verbatim in exports (DEV6). */
  exportSessionId: text("export_session_id").notNull(),
  /** Room join code for participant devices (§15-A1). */
  joinCode: text("join_code"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

/* ---------------- AI drafts (review-gated — nothing enters the record unreviewed) ---------------- */

export const aiDrafts = pgTable("ai_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  kind: draftKindEnum("kind").notNull(),
  /** Which exports / event ranges fed this draft (provenance). */
  inputRef: jsonb("input_ref").notNull().default({}),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  content: jsonb("content").notNull(),
  status: draftStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});
