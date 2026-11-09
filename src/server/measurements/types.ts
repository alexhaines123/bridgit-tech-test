/**
 * Measurement: a named statistic from a fixed list that can be charted.
 *
 * The AI picks which one to show (in ticket #21); the numbers always come
 * from real server-computed data. Each Measurement has a fixed ID, a
 * human-readable title, and typed data.
 */

import type { ShapedEvent } from "@/server/eonet/types";

/**
 * The five supported Measurement IDs. These are the only values the AI
 * is allowed to choose from (validated in ticket #21).
 */
export const MEASUREMENT_IDS = [
  "eventsByCategory",
  "eventsByRegion",
  "biggestInCategory",
  "newVsOngoing",
  "startedPerDay",
] as const;

export type MeasurementId = (typeof MEASUREMENT_IDS)[number];

/**
 * A single data point in the "Events by Category" Measurement.
 * Each Category has a count of Events.
 */
export interface EventsByCategoryEntry {
  categoryId: string;
  categoryTitle: string;
  count: number;
}

/**
 * A single data point in the "Events by Region" Measurement.
 * Each Region has a count of Events.
 */
export interface EventsByRegionEntry {
  region: string;
  count: number;
}

/**
 * The "Biggest in a Category" Measurement.
 * Reports the largest Magnitude within one Category, with its own unit.
 * Magnitudes are never compared across Categories.
 * If there are no Events in the Category, or no Event has a Magnitude,
 * the result is null.
 */
export interface BiggestInCategoryResult {
  categoryId: string;
  categoryTitle: string;
  eventId: string | null;
  eventTitle: string | null;
  magnitudeValue: number | null;
  magnitudeUnit: string | null;
}

/**
 * The "New vs ongoing" Measurement.
 * "new" = events that just started (first seen in this Window),
 * "ongoing" = events that are still active (not closed).
 */
export interface NewVsOngoingResult {
  newCount: number;
  ongoingCount: number;
}

/**
 * A single data point in the "Started per day" Measurement.
 * Each day has a count of Events whose earliest geometry date falls on it.
 */
export interface StartedPerDayEntry {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  count: number;
}

/**
 * A Measurement result with a fixed ID, title, and typed data.
 * The variant of `data` depends on `id`.
 */
export type Measurement =
  | {
      id: "eventsByCategory";
      title: "Events by Category";
      data: EventsByCategoryEntry[];
    }
  | {
      id: "eventsByRegion";
      title: "Events by Region";
      data: EventsByRegionEntry[];
    }
  | {
      id: "biggestInCategory";
      title: "Biggest in a Category";
      data: BiggestInCategoryResult;
    }
  | {
      id: "newVsOngoing";
      title: "New vs ongoing";
      data: NewVsOngoingResult;
    }
  | {
      id: "startedPerDay";
      title: "Started per day";
      data: StartedPerDayEntry[];
    };

/**
 * A summary of all Measurements, keyed by MeasurementId.
 * Each key maps to its specific Measurement variant.
 */
export interface MeasurementSummary {
  eventsByCategory: Extract<Measurement, { id: "eventsByCategory" }>;
  eventsByRegion: Extract<Measurement, { id: "eventsByRegion" }>;
  biggestInCategory: Extract<Measurement, { id: "biggestInCategory" }>;
  newVsOngoing: Extract<Measurement, { id: "newVsOngoing" }>;
  startedPerDay: Extract<Measurement, { id: "startedPerDay" }>;
}

/**
 * Re-export for convenience.
 */
export type { ShapedEvent };
