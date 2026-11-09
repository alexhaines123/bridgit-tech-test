/**
 * AI Briefing module.
 *
 * Generates a student-friendly summary of the chart's Measurement using
 * Claude through the Vercel AI SDK. Per ADR 0002 and ADR 0003:
 * - Model ID comes from configuration (AI_MODEL env var)
 * - Server computes every number; the AI judges and explains
 * - Output is validated against a Zod schema before use
 * - Results are cached by input hash; the same data never costs a second call
 * - Graceful degradation: AI failures surface as typed errors, not crashes
 *
 * Per ticket #21: the AI also chooses which Measurement to display, with a
 * caption and reason. The choice is validated against the fixed Measurement
 * list and checked for applicability to the data.
 */

export { BriefingClient, type BriefingClientConfig, type BriefingResult } from "./client";
export { BriefingError, type BriefingErrorCode } from "./errors";
export { buildBriefingPayload, type BriefingPayload, type BuildBriefingPayloadInput, MAX_PAYLOAD_SIZE_BYTES } from "./payload";
export { briefingOutputSchema, type BriefingOutput } from "./schema";
export { BriefingCache } from "./cache";

import { BriefingClient } from "./client";
import { env } from "@/server/env";

/**
 * Singleton Briefing client configured from the environment.
 * Use this for production code; tests should create their own instance.
 */
export const briefingClient = new BriefingClient({
  apiKey: env.ANTHROPIC_API_KEY,
  modelId: env.AI_MODEL,
});
