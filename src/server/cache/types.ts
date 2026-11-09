/**
 * Types and interface for the events cache.
 *
 * The cache wraps the EONET upstream call with:
 * - Short-lived fresh entries per Window
 * - Longer-lived stale entries that survive upstream failures
 * - Request coalescing for concurrent identical requests
 * - Bounded Redis timeout (fail-fast, no hang)
 *
 * Cache keys (documented):
 *   pw:fresh:{windowDays}  — Fresh ShapingResult, short TTL (2 h)
 *   pw:stale:{windowDays}  — Stale ShapingResult with cachedAt timestamp, long TTL (24 h)
 *
 * The key prefix `pw:` (Planet Watch) avoids collisions if the same Redis
 * instance is shared with other apps.
 */

import type { ShapingResult } from "@/server/eonet/types";

/**
 * A cached result, either fresh or stale.
 *
 * When `stale` is true, `staleAgeMs` and `cachedAt` are set so the UI can
 * display a banner stating how old the data is.
 */
export interface CachedResult {
  data: ShapingResult;
  /** True when the data came from the stale copy (upstream was unreachable). */
  stale: boolean;
  /** Age in milliseconds since the stale data was originally cached. */
  staleAgeMs?: number;
  /** ISO 8601 timestamp of when the stale data was originally cached. */
  cachedAt?: string;
}

/**
 * The cache interface. The implementation is behind this small surface so
 * that tests and future swaps (e.g. in-memory for unit tests) are trivial.
 */
export interface EventsCache {
  /**
   * Returns cached events for the given Window, fetching from upstream
   * (via `fetcher`) on a miss. Concurrent calls for the same Window share
   * a single upstream call.
   *
   * Throws `CacheUnavailableError` if Redis is unreachable (bounded timeout).
   * Throws the upstream error if both Redis fresh and stale are missing and
   * the upstream call fails.
   */
  getOrFetch(windowDays: number, fetcher: () => Promise<ShapingResult>): Promise<CachedResult>;

  /** Release the underlying Redis connection. */
  close(): void;
}

/**
 * Fresh TTL: 2 hours (7200 seconds).
 *
 * EONET's upstream data changes infrequently — storms update every 6–24h,
 * wildfires every few days, icebergs weekly. A 2-hour TTL reduces upstream
 * API calls by 120× compared to the previous 60-second value while keeping
 * data meaningfully fresh for the most dynamic event types.
 *
 * See `types.test.ts` for the full research rationale.
 */
export const FRESH_TTL_SECONDS = 7200;

/** Stale TTL: 24 hours. Long enough to survive EONET outages. */
export const STALE_TTL_SECONDS = 24 * 60 * 60;

/** Redis connect/command timeout: 3 seconds. Fail-fast, no hang. */
export const REDIS_TIMEOUT_MS = 3_000;

/**
 * Builds the fresh cache key for a given Window.
 */
export function freshKey(windowDays: number): string {
  return `pw:fresh:${windowDays}`;
}

/**
 * Builds the stale cache key for a given Window.
 */
export function staleKey(windowDays: number): string {
  return `pw:stale:${windowDays}`;
}
