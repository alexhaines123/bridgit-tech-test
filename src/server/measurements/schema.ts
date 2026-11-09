import { z } from "zod";
import { MEASUREMENT_IDS } from "@/server/measurements/types";

/**
 * Zod schema for Measurement data returned by the API.
 * Per ADR 0003: the server computes every number and validates its output
 * against a schema before using it. The measurements are server-computed
 * (not AI), but they still cross the API boundary and must be validated.
 *
 * Each Measurement has a discriminated union shape: the `id` field
 * determines the shape of `data`.
 */
export const measurementSchema = z.discriminatedUnion("id", [
  z.object({
    id: z.literal("eventsByCategory"),
    title: z.string(),
    data: z.array(
      z.object({
        categoryId: z.string(),
        categoryTitle: z.string(),
        count: z.number(),
      }),
    ),
  }),
  z.object({
    id: z.literal("eventsByRegion"),
    title: z.string(),
    data: z.array(
      z.object({
        region: z.string(),
        count: z.number(),
      }),
    ),
  }),
  z.object({
    id: z.literal("biggestInCategory"),
    title: z.string(),
    data: z.object({
      categoryId: z.string(),
      categoryTitle: z.string(),
      eventId: z.string().nullable(),
      eventTitle: z.string().nullable(),
      magnitudeValue: z.number().nullable(),
      magnitudeUnit: z.string().nullable(),
    }),
  }),
  z.object({
    id: z.literal("newVsOngoing"),
    title: z.string(),
    data: z.object({
      newCount: z.number(),
      ongoingCount: z.number(),
    }),
  }),
  z.object({
    id: z.literal("startedPerDay"),
    title: z.string(),
    data: z.array(
      z.object({
        date: z.string(),
        count: z.number(),
      }),
    ),
  }),
]);

export const measurementsSchema = z.record(
  z.enum(MEASUREMENT_IDS),
  measurementSchema,
);
