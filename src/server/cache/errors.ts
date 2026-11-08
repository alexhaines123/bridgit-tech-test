/**
 * Error thrown when Redis is unreachable within the bounded timeout.
 *
 * This is distinct from an upstream (EONET) failure: per ADR 0004, Redis is
 * our own infrastructure and its unavailability is a hard error, not a
 * silent bypass.
 */
export class CacheUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "CacheUnavailableError";
  }
}
