/**
 * AI Briefing client.
 *
 * Calls Claude through the Vercel AI SDK (per ADR 0002) with a bounded
 * payload of server-computed numbers. Validates the response against a
 * Zod schema, retries once on invalid output or failure, and caches results
 * by a hash of the trimmed input. Token usage is logged for cost awareness;
 * no secrets appear in logs.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { BriefingError } from "./errors";
import { BriefingCache } from "./cache";
import { briefingOutputSchema, type BriefingOutput } from "./schema";
import type { BriefingPayload } from "./payload";

/**
 * Configuration for the Briefing client.
 */
export interface BriefingClientConfig {
  /** Anthropic API key. */
  apiKey: string;
  /** Model ID from configuration (env AI_MODEL). */
  modelId: string;
  /** Base URL for the Anthropic API (for testing). */
  baseUrl?: string;
  /** Maximum time in milliseconds to wait for a response. */
  timeoutMs?: number;
  /** Cache TTL in milliseconds. Defaults to 5 minutes. */
  cacheTtlMs?: number;
}

/**
 * The result of a successful Briefing generation.
 */
export interface BriefingResult {
  /** The validated AI-generated summary. */
  summary: string;
  /** Token usage for cost awareness. */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

const DEFAULT_CONFIG = {
  timeoutMs: 30_000, // 30 seconds
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
};

type ResolvedConfig = BriefingClientConfig & typeof DEFAULT_CONFIG;

/**
 * The system prompt for the Briefing AI call.
 * Defines the role, constraints, and output format.
 */
const BRIEFING_SYSTEM_PROMPT = `You are writing a student-friendly briefing for a dashboard about natural events from NASA's EONET. Your audience is a student who wants to understand what the chart shows.

Write ONE plain-English paragraph that reads the Measurement data provided. The paragraph must:
- Be 2 to 4 sentences long
- Be at most 500 characters
- Describe what the data shows in simple terms
- Reference only the numbers provided in the payload
- Use a friendly, educational tone

Do NOT:
- Make up numbers not in the payload
- Discuss events not in the data
- Go off-topic or refuse the task
- Use markdown, lists, or special formatting

Output ONLY a JSON object with this exact shape: {"summary": "your paragraph here"}
Nothing else before or after the JSON.`;

/**
 * Client for generating AI Briefings.
 */
export class BriefingClient {
  private readonly config: ResolvedConfig;
  private readonly cache: BriefingCache;

  constructor(config: BriefingClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new BriefingCache();
  }

  /**
   * Generates a Briefing summary from the server-computed payload.
   *
   * Checks the cache first. On a cache miss, calls Claude with the payload,
   * validates the output, and retries once on invalid output or failure.
   * Returns a validated summary with token usage, or throws a typed error.
   */
  async generateBriefing(payload: BriefingPayload): Promise<BriefingResult> {
    // Check cache first
    const cached = this.cache.get(payload);
    if (cached) {
      return { summary: cached.summary, usage: { inputTokens: 0, outputTokens: 0 } };
    }

    // Try to generate, with one retry on invalid output
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await this.callAI(payload);
        // Cache the successful result
        this.cache.set(payload, result.output, this.config.cacheTtlMs);
        return {
          summary: result.output.summary,
          usage: result.usage,
        };
      } catch (error) {
        lastError = error;

        // Don't retry on rate limits or timeouts — those are transient infrastructure issues
        if (error instanceof BriefingError) {
          if (error.code === "ai-rate-limited" || error.code === "ai-timeout") {
            throw error;
          }
          // Retry on ai-invalid-output and ai-unavailable
          if (attempt < 1) {
            continue;
          }
        }

        // Unknown error — retry once
        if (attempt < 1) {
          continue;
        }
      }
    }

    // All retries exhausted
    if (lastError instanceof BriefingError) {
      throw lastError;
    }

    throw new BriefingError(
      "ai-unavailable",
      "Failed to generate briefing",
      lastError,
    );
  }

  /**
   * Makes a single AI call and validates the output.
   */
  private async callAI(payload: BriefingPayload): Promise<{
    output: BriefingOutput;
    usage: { inputTokens: number; outputTokens: number };
  }> {
    const anthropic = createAnthropic({
      apiKey: this.config.apiKey,
      ...(this.config.baseUrl ? { baseURL: this.config.baseUrl } : {}),
    });

    const model = anthropic(this.config.modelId);
    const userMessage = buildUserMessage(payload);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const result = await generateText({
        model,
        system: BRIEFING_SYSTEM_PROMPT,
        prompt: userMessage,
        abortSignal: controller.signal,
        maxRetries: 0, // Disable SDK retries; we handle retries ourselves
      });

      clearTimeout(timeoutId);

      // Extract text from the response
      const text = result.text?.trim();
      if (!text) {
        throw new BriefingError("ai-invalid-output", "AI returned empty response");
      }

      // Parse as JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new BriefingError(
          "ai-invalid-output",
          "AI response was not valid JSON",
        );
      }

      // Validate against the schema
      const validation = briefingOutputSchema.safeParse(parsed);
      if (!validation.success) {
        throw new BriefingError(
          "ai-invalid-output",
          "AI response failed schema validation",
          validation.error,
        );
      }

      // Log token usage (no secrets)
      const usage = {
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      };
      console.log(
        `[Briefing AI] tokens: ${usage.inputTokens} in, ${usage.outputTokens} out, model: ${this.config.modelId}`,
      );

      return { output: validation.data, usage };
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new BriefingError(
          "ai-timeout",
          `AI request timed out after ${this.config.timeoutMs}ms`,
        );
      }

      // Re-throw BriefingError
      if (error instanceof BriefingError) {
        throw error;
      }

      // Check for rate limit errors from the SDK
      // The AI SDK wraps HTTP errors with a statusCode property
      if (error instanceof Error && isRateLimitError(error)) {
        throw new BriefingError("ai-rate-limited", "AI service rate limit exceeded", error);
      }

      // Wrap unknown errors
      throw new BriefingError("ai-unavailable", "AI service call failed", error);
    }
  }
}

/**
 * Builds the user message from the payload.
 * Formats the measurements as readable data for the AI.
 */
function buildUserMessage(payload: BriefingPayload): string {
  const lines: string[] = [
    `Write a student-friendly briefing for the following data:`,
    ``,
    `Window: ${payload.windowDays} days`,
    `Total Events: ${payload.totalEventCount}`,
    `Data is ${payload.stale ? "stale (cached from an earlier fetch)" : "fresh"}`,
    ``,
    `Measurements:`,
    JSON.stringify(payload.measurements, null, 2),
  ];
  return lines.join("\n");
}

/**
 * Checks whether an error represents a 429 rate limit response.
 * The AI SDK wraps HTTP errors with a statusCode property.
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for statusCode property (AI SDK wraps HTTP errors)
    if ("statusCode" in error && (error as { statusCode: unknown }).statusCode === 429) {
      return true;
    }
    // Fallback: check message
    if (error.message?.includes("429")) {
      return true;
    }
  }
  return false;
}
