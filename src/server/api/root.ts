import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { eonetClient } from "@/server/eonet/client";
import { EonetUpstreamError } from "@/server/eonet/errors";
import { shapeResponse } from "@/server/eonet/shape";
import { eventsInputSchema } from "@/server/eonet/input";
import type { WindowDays } from "@/server/eonet/types";
import { RedisEventsCache } from "@/server/cache/redis-cache";
import { CacheUnavailableError } from "@/server/cache/errors";
import { REGIONS } from "@/server/regions/lookup";
import { computeAllMeasurements } from "@/server/measurements";
import { MEASUREMENT_IDS, type MeasurementId } from "@/server/measurements/types";
import { measurementsSchema } from "@/server/measurements/schema";
import { briefingClient } from "@/server/briefing";
import { buildBriefingPayload } from "@/server/briefing/payload";
import { BriefingError } from "@/server/briefing/errors";

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
      region: z.enum(REGIONS),
      earliestDate: z.string(),
    }),
  ),
  rawSizeBytes: z.number(),
  shapedSizeBytes: z.number(),
  totalEventsBeforeFilter: z.number(),
  totalEventsAfterFilter: z.number(),
  /** All five Measurements computed from the events on the server. */
  measurements: measurementsSchema,
  /** The deterministic default Measurement to show until the AI picks one. */
  defaultMeasurementId: z.enum(MEASUREMENT_IDS),
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
   *
   * Also computes all five Measurements on the server and returns them
   * alongside the events. The default Measurement is chosen deterministically.
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

        // Compute all Measurements from the shaped events
        const measurements = computeAllMeasurements(cached.data.events);

        // Determine the default Measurement deterministically:
        // Pick the first non-empty measurement from a priority list.
        const defaultMeasurementId = determineDefaultMeasurement(measurements);

        return {
          ...cached.data,
          measurements,
          defaultMeasurementId,
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

  /**
   * Generates an AI Briefing summary for the current data.
   *
   * Takes the Window and uses the server-computed Measurements to build a
   * bounded payload, calls Claude via the Vercel AI SDK, and validates the
   * output against a Zod schema. Results are cached by input hash so the
   * same data never costs a second AI call.
   *
   * This is a soft dependency: AI failures surface as typed errors with
   * user-friendly messages, so the map, list and chart keep working.
   */
  briefing: publicProcedure
    .input(eventsInputSchema)
    .output(
      z.object({
        summary: z.string(),
        measurementTitle: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Fetch the events and compute Measurements (same as the events procedure)
        const cached = await eventsCache.getOrFetch(input.windowDays, async () => {
          const raw = await eonetClient.fetchEvents(input.windowDays);
          return shapeResponse(raw, input.windowDays);
        });

        const measurements = computeAllMeasurements(cached.data.events);
        const defaultMeasurementId = determineDefaultMeasurement(measurements);
        const defaultMeasurement = measurements[defaultMeasurementId];

        // Build the payload and call the AI
        const payload = buildBriefingPayload({
          measurements,
          windowDays: input.windowDays as WindowDays,
          totalEventCount: cached.data.events.length,
          stale: cached.stale,
          defaultMeasurementId,
        });

        const result = await briefingClient.generateBriefing(payload);

        return {
          summary: result.summary,
          measurementTitle: defaultMeasurement.title,
        };
      } catch (error) {
        if (error instanceof BriefingError) {
          // Surface AI errors with user-friendly messages
          throw new Error(error.userMessage);
        }
        if (error instanceof CacheUnavailableError) {
          throw new Error(
            "The cache service is unavailable. Please try again in a moment.",
          );
        }
        if (error instanceof EonetUpstreamError) {
          throw new Error(error.userMessage);
        }
        throw error;
      }
    }),
});

/**
 * Determines the default Measurement to show, deterministically.
 * Picks the first non-empty measurement from a priority list:
 * 1. eventsByCategory (if there are events with categories)
 * 2. eventsByRegion (if there are events with regions)
 * 3. startedPerDay (if there are events with dates)
 * 4. newVsOngoing (always has data, even if zeros)
 * 5. biggestInCategory (fallback)
 */
function determineDefaultMeasurement(
  measurements: ReturnType<typeof computeAllMeasurements>,
): MeasurementId {
  if (measurements.eventsByCategory.data.length > 0) {
    return "eventsByCategory";
  }
  if (measurements.eventsByRegion.data.length > 0) {
    return "eventsByRegion";
  }
  if (measurements.startedPerDay.data.length > 0) {
    return "startedPerDay";
  }
  if (
    measurements.newVsOngoing.data.newCount > 0 ||
    measurements.newVsOngoing.data.ongoingCount > 0
  ) {
    return "newVsOngoing";
  }
  return "biggestInCategory";
}

export type AppRouter = typeof appRouter;
