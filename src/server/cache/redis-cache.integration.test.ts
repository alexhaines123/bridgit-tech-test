/**
 * Integration tests for the Redis events cache.
 *
 * These tests run against a real Redis instance from the Docker compose file.
 * If Redis is not already running, the test setup starts it via
 * `docker compose up -d` and waits for it to become healthy.
 *
 * Tests cover the acceptance criteria from ticket #17:
 * - Cache hit (fresh data returned)
 * - Cache miss (upstream called, result stored)
 * - Stale served (upstream fails, stale copy returned with age)
 * - Redis down (clear error, bounded timeout)
 */

import { execSync } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Redis from "ioredis";
import { RedisEventsCache } from "./redis-cache";
import { CacheUnavailableError } from "./errors";
import {
  FRESH_TTL_SECONDS,
  STALE_TTL_SECONDS,
  freshKey,
  staleKey,
} from "./types";
import type { ShapingResult } from "@/server/eonet/types";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const COMPOSE_DIR = process.cwd();

/**
 * Ensures Redis is running, starting Docker compose if needed.
 * This is called once before all tests in this file.
 */
async function ensureRedisRunning(): Promise<void> {
  const redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  try {
    await redis.connect();
    const reply = await redis.ping();
    if (reply !== "PONG") throw new Error("Redis not healthy");
    redis.disconnect();
    return;
  } catch {
    redis.disconnect();
  }

  // Start Docker compose and wait for healthy
  execSync("docker compose up -d", { cwd: COMPOSE_DIR, stdio: "pipe" });
  // Poll until healthy (up to 30s)
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const status = execSync(
        `docker inspect --format='{{.State.Health.Status}}' planet-watch-redis`,
        { stdio: "pipe" },
      )
        .toString()
        .trim();
      if (status === "healthy") return;
    } catch {
      // Container may not exist yet; keep waiting
    }
    execSync("sleep 1", { stdio: "pipe" });
  }
  throw new Error("Redis did not become healthy within 30s");
}

/**
 * A minimal ShapingResult fixture for testing.
 */
function makeShapingResult(id: string = "EONET_TEST"): ShapingResult {
  return {
    events: [
      {
        id,
        title: "Test Event",
        description: null,
        link: "https://example.com",
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        closed: false,
        latest: {
          coordinates: [0, 0],
          date: new Date().toISOString(),
          magnitude: null,
        },
        historyLength: 1,
        historyTrimmed: false,
      },
    ],
    rawSizeBytes: 100,
    shapedSizeBytes: 80,
    totalEventsBeforeFilter: 1,
    totalEventsAfterFilter: 1,
  };
}

describe("RedisEventsCache (integration)", () => {
  let cache: RedisEventsCache;
  let adminClient: Redis;

  beforeAll(async () => {
    await ensureRedisRunning();
    cache = new RedisEventsCache(REDIS_URL);
    adminClient = new Redis(REDIS_URL);
  });

  afterAll(() => {
    cache.close();
    adminClient.disconnect();
  });

  beforeEach(async () => {
    // Flush only the Planet Watch cache keys before each test
    const keys = await adminClient.keys("pw:*");
    if (keys.length > 0) {
      await adminClient.del(...keys);
    }
  });

  describe("cache miss", () => {
    it("calls upstream and stores both fresh and stale entries", async () => {
      const result = makeShapingResult("EONET_MISS");
      let fetchCalls = 0;
      const fetcher = async () => {
        fetchCalls++;
        return result;
      };

      const cached = await cache.getOrFetch(30, fetcher);

      expect(cached.stale).toBe(false);
      expect(cached.data.events[0].id).toBe("EONET_MISS");
      expect(fetchCalls).toBe(1);

      // Verify both keys were stored in Redis
      const fresh = await adminClient.get(freshKey(30));
      const stale = await adminClient.get(staleKey(30));
      expect(fresh).not.toBeNull();
      expect(stale).not.toBeNull();

      // Verify TTLs are set correctly
      const freshTtl = await adminClient.ttl(freshKey(30));
      const staleTtl = await adminClient.ttl(staleKey(30));
      expect(freshTtl).toBeGreaterThan(0);
      expect(freshTtl).toBeLessThanOrEqual(FRESH_TTL_SECONDS);
      expect(staleTtl).toBeGreaterThan(FRESH_TTL_SECONDS);
      expect(staleTtl).toBeLessThanOrEqual(STALE_TTL_SECONDS);
    });
  });

  describe("cache hit", () => {
    it("returns cached data without calling upstream", async () => {
      const result = makeShapingResult("EONET_HIT");
      await cache.getOrFetch(30, async () => result);

      let fetchCalls = 0;
      const cached = await cache.getOrFetch(30, async () => {
        fetchCalls++;
        return makeShapingResult("EONET_DIFFERENT");
      });

      expect(cached.stale).toBe(false);
      expect(cached.data.events[0].id).toBe("EONET_HIT");
      expect(fetchCalls).toBe(0);
    });

    it("respects the Window dimension (different Windows are independent)", async () => {
      await cache.getOrFetch(7, async () => makeShapingResult("EONET_7"));
      await cache.getOrFetch(30, async () => makeShapingResult("EONET_30"));

      const hit7 = await cache.getOrFetch(7, async () => makeShapingResult("NOPE"));
      const hit30 = await cache.getOrFetch(30, async () => makeShapingResult("NOPE"));

      expect(hit7.data.events[0].id).toBe("EONET_7");
      expect(hit30.data.events[0].id).toBe("EONET_30");
    });
  });

  describe("request coalescing", () => {
    it("concurrent identical requests share a single upstream call", async () => {
      let fetchCalls = 0;
      const fetcher = async () => {
        fetchCalls++;
        // Simulate upstream latency
        await new Promise((r) => setTimeout(r, 50));
        return makeShapingResult("EONET_COALESCE");
      };

      const results = await Promise.all([
        cache.getOrFetch(30, fetcher),
        cache.getOrFetch(30, fetcher),
        cache.getOrFetch(30, fetcher),
      ]);

      expect(fetchCalls).toBe(1);
      expect(results[0].data.events[0].id).toBe("EONET_COALESCE");
      expect(results[1].data.events[0].id).toBe("EONET_COALESCE");
      expect(results[2].data.events[0].id).toBe("EONET_COALESCE");
    });

    it("concurrent requests for different Windows do NOT share upstream calls", async () => {
      let fetchCalls = 0;
      const fetcher = async () => {
        fetchCalls++;
        await new Promise((r) => setTimeout(r, 20));
        return makeShapingResult();
      };

      await Promise.all([
        cache.getOrFetch(7, fetcher),
        cache.getOrFetch(30, fetcher),
        cache.getOrFetch(90, fetcher),
      ]);

      expect(fetchCalls).toBe(3);
    });
  });

  describe("stale served on upstream failure", () => {
    it("serves stale data with age when upstream fails and stale exists", async () => {
      // First call succeeds and populates the cache
      const original = makeShapingResult("EONET_STALE");
      await cache.getOrFetch(30, async () => original);

      // Wait a moment so stale age is measurable
      await new Promise((r) => setTimeout(r, 100));

      // Now make upstream fail
      const failingFetcher = async () => {
        throw new Error("EONET is down");
      };

      // Delete the fresh key so the cache tries upstream
      await adminClient.del(freshKey(30));

      const cached = await cache.getOrFetch(30, failingFetcher);

      expect(cached.stale).toBe(true);
      expect(cached.data.events[0].id).toBe("EONET_STALE");
      expect(cached.staleAgeMs).toBeDefined();
      expect(cached.staleAgeMs!).toBeGreaterThanOrEqual(0);
      expect(cached.cachedAt).toBeDefined();
    });

    it("throws when upstream fails and no stale copy exists", async () => {
      const failingFetcher = async () => {
        throw new Error("EONET is down");
      };

      await expect(cache.getOrFetch(30, failingFetcher)).rejects.toThrow(
        "EONET is down",
      );
    });
  });

  describe("Redis down", () => {
    it("throws CacheUnavailableError with bounded timeout when Redis is unreachable", async () => {
      // Create a cache pointing at a non-existent Redis
      const deadCache = new RedisEventsCache("redis://localhost:1", {
        connectTimeoutMs: 500,
      });

      try {
        await expect(
          deadCache.getOrFetch(30, async () => makeShapingResult()),
        ).rejects.toThrow(CacheUnavailableError);
      } finally {
        deadCache.close();
      }
    });
  });
});
