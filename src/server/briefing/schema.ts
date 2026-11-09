import { z } from "zod";

/**
 * Zod schema for the AI-generated Briefing summary.
 *
 * Per ADR 0003: AI output is validated before use. The Briefing is a single
 * plain-English paragraph (2-4 sentences, at most 500 characters) that reads
 * the chart's Measurement for a student. Output that fails this schema is
 * rejected, and the caller retries once before falling back to a clear error.
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
 * A single non-empty plain-text paragraph.
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
  })
  .transform((data) => ({
    summary: data.summary,
  }));

export type BriefingOutput = z.infer<typeof briefingOutputSchema>;
