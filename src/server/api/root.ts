import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { eonetClient } from "@/server/eonet/client";
import { EonetUpstreamError } from "@/server/eonet/errors";
import { shapeResponse } from "@/server/eonet/shape";
import { eventsInputSchema } from "@/server/eonet/input";
import type { ShapingResult } from "@/server/eonet/types";

/**
 * Output schema for the events procedure.
 * Matches the ShapingResult type from the EONET module.
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
   * specified Window (7, 30, or 90 days).
   *
   * Validates the raw EONET response at the boundary. Upstream failures
   * (5xx, timeouts, rate limits) are surfaced as typed errors with
   * user-friendly messages.
   */
  events: publicProcedure
    .input(eventsInputSchema)
    .output(eventsOutputSchema)
    .query(async ({ input }): Promise<ShapingResult> => {
      try {
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
      } catch (error) {
        if (error instanceof EonetUpstreamError) {
          // Surface typed errors with user-friendly messages
          throw new Error(error.userMessage);
        }
        throw error;
      }
    }),
});

export type AppRouter = typeof appRouter;
