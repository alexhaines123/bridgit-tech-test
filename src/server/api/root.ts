import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { eonetClient } from "@/server/eonet/client";
import { EonetUpstreamError } from "@/server/eonet/errors";
import { shapeResponse } from "@/server/eonet/shape";
import { eventsInputSchema } from "@/server/eonet/input";
import { RedisEventsCache } from "@/server/cache/redis-cache";
import { CacheUnavailableError } from "@/server/cache/errors";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Singleton cache instance. Redis is a hard dependency per ADR 0004: if it is
 * unreachable, the API returns a clear "cache unavailable" error.
 */
const eventsCache = new RedisEventsCache(REDIS_URL);

/**
 * Output schema for the events procedure.
 * Includes the shaped events plus cache metadata (stale flag and age).
 */
const eventsOutputSchema = z.object({
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      link: z.string(),
      categoryId: z.string(),
      categoryTitle: z.string(),
      closed: z.boolean(),
      latest: z.object({
        coordinates: z.tuple([z.number(), z.number()]),
        date: z.string(),
        magnitude: z
          .object({
            value: z.number(),
            unit: z.string(),
          })
          .nullable(),
      }),
      historyLength: z.number(),
      historyTrimmed: z.boolean(),
    }),
  ),
  rawSizeBytes: z.number(),
  shapedSizeBytes: z.number(),
  totalEventsBeforeFilter: z.number(),
  totalEventsAfterFilter: z.number(),
  /** True when data was served from the stale cache (upstream was down). */
  stale: z.boolean(),
  /** Age in ms of the stale data, when stale is true. */
  staleAgeMs: z.number().optional(),
  /** ISO timestamp of when the stale data was cached. */
  cachedAt: z.string().optional(),
});

export type EventsOutput = z.infer<typeof eventsOutputSchema>;

export const appRouter = router({
  /**
   * Liveness probe proving the tRPC wiring end to end. The scaffold page
   * renders its result; later tickets add real routers beside it.
   */
  health: publicProcedure
    .output(
      z.object({
        status: z.literal("ok"),
        name: z.string(),
      }),
    )
    .query(() => ({ status: "ok" as const, name: "Planet Watch" })),

  /**
   * Fetches live events from NASA's EONET API, shaped and filtered by the
   * specified Window (7, 30, or 90 days). Results are cached in Redis:
   * - Fresh cache: 60s TTL
   * - Stale cache: 24h TTL, served when EONET is down (with age banner)
   * - Redis unreachable: clear error (bounded timeout), per ADR 0004
   *
   * Validates the raw EONET response at the boundary. Upstream failures
   * (5xx, timeouts, rate limits) are absorbed by the stale cache when
   * available; otherwise surfaced as typed errors with user-friendly messages.
   */
  events: publicProcedure
    .input(eventsInputSchema)
    .output(eventsOutputSchema)
    .query(async ({ input }) => {
      try {
        const cached = await eventsCache.getOrFetch(input.windowDays, async () => {
          const raw = await eonetClient.fetchEvents(input.windowDays);
          const result = shapeResponse(raw, input.windowDays);

          // Log the trimming benefit for observability
          console.log(
            `[EONET] Shaped ${result.totalEventsBeforeFilter} events → ` +
              `${result.totalEventsAfterFilter} after ${input.windowDays}d filter. ` +
              `Payload: ${result.rawSizeBytes}B → ${result.shapedSizeBytes}B ` +
              `(${Math.round((1 - result.shapedSizeBytes / result.rawSizeBytes) * 100)}% reduction)`,
          );

          return result;
        });

        return {
          ...cached.data,
          stale: cached.stale,
          staleAgeMs: cached.staleAgeMs,
          cachedAt: cached.cachedAt,
        };
      } catch (error) {
        if (error instanceof CacheUnavailableError) {
          // Redis unreachable: clear error, per ADR 0004
          throw new Error(
            "The cache service is unavailable. Please try again in a moment.",
          );
        }
        if (error instanceof EonetUpstreamError) {
          // Surface typed errors with user-friendly messages
          throw new Error(error.userMessage);
        }
        throw error;
      }
    }),
});

export type AppRouter = typeof appRouter;
