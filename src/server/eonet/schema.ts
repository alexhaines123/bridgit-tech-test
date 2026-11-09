import { z } from "zod";

/**
 * Zod schemas for validating the raw EONET API response.
 * These schemas enforce the boundary between external data and our domain model.
 */

// A single geometry point in an event's history
export const eonetGeometrySchema = z.object({
  magnitudeValue: z.number().nullable(),
  magnitudeUnit: z.string().nullable(),
  date: z.string(), // ISO 8601 date string
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export type EonetGeometry = z.infer<typeof eonetGeometrySchema>;

// A category assigned to an event
export const eonetCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type EonetCategory = z.infer<typeof eonetCategorySchema>;

// A single event from EONET
export const eonetEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  link: z.string(),
  closed: z.string().nullable(), // ISO date or null if still active
  categories: z.array(eonetCategorySchema).min(1),
  geometry: z.array(eonetGeometrySchema).min(1),
});

export type EonetEvent = z.infer<typeof eonetEventSchema>;

// The top-level EONET API response
export const eonetResponseSchema = z.object({
  events: z.array(eonetEventSchema),
});

export type EonetResponse = z.infer<typeof eonetResponseSchema>;
