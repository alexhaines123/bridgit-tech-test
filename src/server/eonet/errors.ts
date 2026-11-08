/**
 * Error taxonomy for EONET upstream failures.
 *
 * These are surfaced to the user as plain-language messages with a retry action
 * and no stack trace (acceptance criteria from ticket #15).
 */
export class EonetUpstreamError extends Error {
  readonly code: "upstream_unavailable" | "rate_limited" | "timeout" | "malformed";

  constructor(
    code: EonetUpstreamError["code"],
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EonetUpstreamError";
    this.code = code;
  }

  /** A user-friendly message for the UI. No stack trace. */
  get userMessage(): string {
    switch (this.code) {
      case "upstream_unavailable":
        return "NASA's event data is temporarily unavailable. Please try again.";
      case "rate_limited":
        return "We've hit the rate limit for NASA's data. Please wait a moment and retry.";
      case "timeout":
        return "NASA's event data is taking too long to respond. Please try again.";
      case "malformed":
        return "NASA's event data is in an unexpected format. Please try again later.";
    }
  }
}
