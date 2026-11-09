/**
 * Error taxonomy for AI Briefing failures.
 *
 * The AI Briefing is a soft dependency: when it fails, the map, list and
 * chart still work. Only the Briefing card shows an error with a retry.
 * These errors are surfaced to the UI with clear, user-friendly messages.
 */

export type BriefingErrorCode =
  | "ai-invalid-output"
  | "ai-unavailable"
  | "ai-rate-limited"
  | "ai-timeout";

export class BriefingError extends Error {
  readonly code: BriefingErrorCode;

  constructor(
    code: BriefingErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "BriefingError";
    this.code = code;
  }

  /** A user-friendly message for the UI. No stack trace. */
  get userMessage(): string {
    switch (this.code) {
      case "ai-invalid-output":
        return "The AI briefing could not be generated. Please try again.";
      case "ai-unavailable":
        return "The AI service is temporarily unavailable. Please try again.";
      case "ai-rate-limited":
        return "We've hit the rate limit for the AI service. Please wait a moment and retry.";
      case "ai-timeout":
        return "The AI service is taking too long to respond. Please try again.";
    }
  }
}
