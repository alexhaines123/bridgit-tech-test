import { z } from "zod";
import { MEASUREMENT_IDS } from "@/server/measurements/types";

/**
 * Zod schema for the AI-generated Briefing output.
 *
 * Per ADR 0003: AI output is validated before use. The Briefing includes:
 * - A summary: a single plain-English paragraph (2-4 sentences, at most 500
 *   characters) that reads the chart's chosen Measurement for a student.
 * - A chosen Measurement ID from the fixed list (validated against the enum).
 * - A caption: a short title for the chart (at most 120 characters).
 * - A reason: a short explanation of why this Measurement was chosen
 *   (at most 200 characters).
 *
 * Output that fails this schema is rejected, and the caller retries once
 * before falling back to a clear error.
 */

/**
 * Counts sentences by splitting on sentence-ending punctuation (. ! ?)
 * followed by whitespace or end of string. This is a simple heuristic
 * suitable for the constrained AI output we expect.
 */
function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  // Split on sentence-ending punctuation followed by whitespace or end
  const sentences = trimmed.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0);
  return sentences.length;
}

/**
 * The validated Briefing output from the AI.
 * Includes the summary, the chosen Measurement, a caption, and a reason.
 */
export const briefingOutputSchema = z
  .object({
    summary: z
      .string()
      .min(1, "Summary must be non-empty")
      .max(500, "Summary must be at most 500 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, "Summary must be non-empty after trimming")
      .refine(
        (val) => countSentences(val) >= 2,
        "Summary must be at least 2 sentences",
      )
      .refine(
        (val) => countSentences(val) <= 4,
        "Summary must be at most 4 sentences",
      ),
    chosenMeasurementId: z.enum(MEASUREMENT_IDS),
    caption: z
      .string()
      .min(1, "Caption must be non-empty")
      .max(120, "Caption must be at most 120 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, "Caption must be non-empty after trimming"),
    reason: z
      .string()
      .min(1, "Reason must be non-empty")
      .max(200, "Reason must be at most 200 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, "Reason must be non-empty after trimming"),
  })
  .transform((data) => ({
    summary: data.summary,
    chosenMeasurementId: data.chosenMeasurementId,
    caption: data.caption,
    reason: data.reason,
  }));

export type BriefingOutput = z.infer<typeof briefingOutputSchema>;
