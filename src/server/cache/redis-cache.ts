/**
 * Redis-backed implementation of the events cache.
 *
 * Design:
 * - Fresh key (`pw:fresh:{windowDays}`) stores the ShapingResult JSON with a
 *   short TTL. A hit here means the data is current.
 * - Stale key (`pw:stale:{windowDays}`) stores `{ data, cachedAt }` with a
 *   long TTL. It is written alongside the fresh key on every successful fetch.
 * - On upstream failure, if the fresh key is missing but the stale key exists,
 *   the stale data is served with its age so the UI can show a banner.
 * - Concurrent identical requests share a single in-flight upstream call
 *   (request coalescing) via an in-memory Map keyed by Window.
 * - Redis connectivity errors within the bounded timeout surface as
 *   CacheUnavailableError. They do NOT silently bypass the cache.
 */

import Redis from "ioredis";
import type { EventsCache, CachedResult } from "./types";
import { FRESH_TTL_SECONDS, STALE_TTL_SECONDS, freshKey, staleKey } from "./types";
import { CacheUnavailableError } from "./errors";
import type { ShapingResult } from "@/server/eonet/types";

interface StaleEntry {
  data: ShapingResult;
  cachedAt: string; // ISO 8601
}

export interface RedisEventsCacheOptions {
  /** Override the Redis connect/command timeout in ms. */
  connectTimeoutMs?: number;
}

export class RedisEventsCache implements EventsCache {
  private readonly redis: Redis;
  /** In-flight promises for request coalescing, keyed by Window. */
  private readonly inFlight = new Map<number, Promise<CachedResult>>();

  constructor(redisUrl: string, options: RedisEventsCacheOptions = {}) {
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: options.connectTimeoutMs ?? 3_000,
      maxRetriesPerRequest: 1,
      // Disable auto-reconnect for command-level operations so we fail fast.
      retryStrategy: () => null,
    });
  }

  async getOrFetch(
    windowDays: number,
    fetcher: () => Promise<ShapingResult>,
  ): Promise<CachedResult> {
    // Check for an in-flight request for this Window (request coalescing)
    const existing = this.inFlight.get(windowDays);
    if (existing) {
      return existing;
    }

    const promise = this.getOrFetchInternal(windowDays, fetcher);
    this.inFlight.set(windowDays, promise);

    try {
      return await promise;
    } finally {
      // Only clear if this is still the current in-flight for this window
      if (this.inFlight.get(windowDays) === promise) {
        this.inFlight.delete(windowDays);
      }
    }
  }

  private async getOrFetchInternal(
    windowDays: number,
    fetcher: () => Promise<ShapingResult>,
  ): Promise<CachedResult> {
    // 1. Try fresh key
    const freshData = await this.tryGetFresh(windowDays);
    if (freshData !== null) {
      return { data: freshData, stale: false };
    }

    // 2. Fresh miss → call upstream
    try {
      const result = await fetcher();
      // Store both fresh and stale
      await this.storeResult(windowDays, result);
      return { data: result, stale: false };
    } catch (upstreamError) {
      // 3. Upstream failed → try stale
      const staleEntry = await this.tryGetStale(windowDays);
      if (staleEntry !== null) {
        const staleAgeMs = Date.now() - new Date(staleEntry.cachedAt).getTime();
        return {
          data: staleEntry.data,
          stale: true,
          staleAgeMs,
          cachedAt: staleEntry.cachedAt,
        };
      }

      // 4. No stale → re-throw the upstream error
      throw upstreamError;
    }
  }

  /**
   * Reads the fresh cache entry. Returns null on miss or Redis error.
   * Throws CacheUnavailableError on connectivity failures.
   */
  private async tryGetFresh(windowDays: number): Promise<ShapingResult | null> {
    try {
      const raw = await this.redis.get(freshKey(windowDays));
      if (raw === null) return null;
      return JSON.parse(raw) as ShapingResult;
    } catch (error) {
      // Redis errors during get → cache unavailable
      throw new CacheUnavailableError(
        "Cache is unavailable: could not read from Redis",
        error,
      );
    }
  }

  /**
   * Reads the stale cache entry. Returns null on miss or Redis error.
   * Throws CacheUnavailableError on connectivity failures.
   */
  private async tryGetStale(windowDays: number): Promise<StaleEntry | null> {
    try {
      const raw = await this.redis.get(staleKey(windowDays));
      if (raw === null) return null;
      return JSON.parse(raw) as StaleEntry;
    } catch (error) {
      throw new CacheUnavailableError(
        "Cache is unavailable: could not read from Redis",
        error,
      );
    }
  }

  /**
   * Stores the result in both fresh and stale keys.
   * Throws CacheUnavailableError on connectivity failures.
   */
  private async storeResult(
    windowDays: number,
    result: ShapingResult,
  ): Promise<void> {
    try {
      const staleEntry: StaleEntry = {
        data: result,
        cachedAt: new Date().toISOString(),
      };

      // Use a pipeline to write both atomically
      const pipeline = this.redis.pipeline();
      pipeline.set(freshKey(windowDays), JSON.stringify(result), "EX", FRESH_TTL_SECONDS);
      pipeline.set(staleKey(windowDays), JSON.stringify(staleEntry), "EX", STALE_TTL_SECONDS);
      await pipeline.exec();
    } catch (error) {
      throw new CacheUnavailableError(
        "Cache is unavailable: could not write to Redis",
        error,
      );
    }
  }

  close(): void {
    this.redis.disconnect();
  }
}
