/**
 * BO3 lens-specific question banks (LENS_Q) — locked methodology, shipped as
 * versioned code (arch doc §3.2). Answers live in risk_answers.answers JSONB,
 * validated against the bank for the instance's lens; flag columns are
 * extracted for queryability. Widen-only: never rename or remove a key —
 * append new questions and bump BANK_VERSION.
 *
 * Source: handoff brief §4 / BO3.
 */
import { z } from "zod";
import type { LensCode } from "../dataset/constants.js";

export const BANK_VERSION = 1;

export type QuestionType = "bool" | "text" | "number";

export interface QuestionDef {
  key: string;
  label: string;
  type: QuestionType;
  /** Which boolean answer flags risk (carries into the risk profile). */
  flagsWhen?: true | false;
}

export const LENS_Q: Record<LensCode, readonly QuestionDef[]> = {
  tech: [
    { key: "service_halting", label: "Does loss of this halt the service?", type: "bool", flagsWhen: true },
    { key: "sensitive_data", label: "Does it hold or process sensitive data?", type: "bool", flagsWhen: true },
    { key: "impact", label: "Impact if unavailable", type: "text" },
    { key: "downstream", label: "Downstream functions affected", type: "text" },
  ],
  thirdparty: [
    { key: "service_halting", label: "Does loss of this halt the service?", type: "bool", flagsWhen: true },
    { key: "sensitive_data", label: "Does it hold or process sensitive data?", type: "bool", flagsWhen: true },
    { key: "impact", label: "Impact if unavailable", type: "text" },
    { key: "downstream", label: "Downstream functions affected", type: "text" },
  ],
  process: [
    { key: "service_halting", label: "Does loss of this halt the service?", type: "bool", flagsWhen: true },
    { key: "impact", label: "Impact if unavailable", type: "text" },
    { key: "downstream", label: "Downstream functions affected", type: "text" },
  ],
  people: [
    { key: "licensing_regulatory", label: "Licensing / regulatory requirements?", type: "bool" },
    { key: "workforce_resilience", label: "Workforce resilience strategies (cross-training / backfills)?", type: "bool", flagsWhen: false },
    { key: "normal_staffing", label: "Normal staffing (number)", type: "number" },
    { key: "min_staffing", label: "Minimum staffing (number)", type: "number" },
    { key: "downstream", label: "Downstream impact", type: "text" },
  ],
  facilities: [
    { key: "alternate_location", label: "Alternate location possible?", type: "bool", flagsWhen: false },
    { key: "impact", label: "Impact if unavailable", type: "text" },
  ],
};

/**
 * Fixed CSV answer-column superset — every lens's answers export into these
 * columns, blanks where a question doesn't apply (BO3's ANS_KEYS pattern).
 */
export const ANS_KEYS: readonly string[] = [
  "service_halting",
  "sensitive_data",
  "licensing_regulatory",
  "workforce_resilience",
  "alternate_location",
  "normal_staffing",
  "min_staffing",
  "impact",
  "downstream",
];

/** Zod schema for one lens's answer object (all questions optional — blanks stay blank). */
export function answersSchema(lens: LensCode) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of LENS_Q[lens]) {
    shape[q.key] =
      q.type === "bool" ? z.boolean().nullable().optional() : q.type === "number" ? z.number().nullable().optional() : z.string().optional();
  }
  return z.object(shape).passthrough();
}

/** True when any flagged question is answered in its risk-flagging direction. */
export function isFlagged(lens: LensCode, answers: Record<string, unknown>): boolean {
  return LENS_Q[lens].some((q) => q.flagsWhen !== undefined && answers[q.key] === q.flagsWhen);
}
