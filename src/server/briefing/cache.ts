import { createHash } from "crypto";
import type { BriefingPayload } from "./payload";
import type { BriefingOutput } from "./schema";

/**
 * In-memory cache for Briefing results keyed by a hash of the trimmed input.
 *
 * The same data never costs a second AI call. The cache is simple and
 * non-persistent: it lives in the process memory. For production, swap this
 * for a Redis-backed implementation.
 */
export class BriefingCache {
  private readonly cache = new Map<string, CachedEntry>();

  /**
   * Computes a stable hash of the Briefing payload for use as a cache key.
   */
  static hashPayload(payload: BriefingPayload): string {
    const serialized = JSON.stringify(payload);
    return createHash("sha256").update(serialized).digest("hex");
  }

  /**
   * Returns the cached result if present and not expired, or undefined.
   */
  get(payload: BriefingPayload): BriefingOutput | undefined {
    const key = BriefingCache.hashPayload(payload);
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.result;
  }

  /**
   * Stores a result in the cache with a TTL.
   */
  set(payload: BriefingPayload, result: BriefingOutput, ttlMs: number): void {
    const key = BriefingCache.hashPayload(payload);
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Clears all cached entries. Useful for testing.
   */
  clear(): void {
    this.cache.clear();
  }
}

interface CachedEntry {
  result: BriefingOutput;
  expiresAt: number;
}
