/**
 * Domain model types for Events. These are shaped from the raw EONET response
 * and form the contract between the server and the UI.
 */

import type { Region } from "@/server/regions/lookup";
import type { MeasurementId, MeasurementSummary } from "@/server/measurements/types";

/**
 * The span of recent days whose Events the dashboard shows.
 * The Window filters on recent activity, not first-seen date: an Event
 * first seen years ago but updated recently is included.
 */
export const VALID_WINDOW_DAYS = [7, 30, 90] as const;
export type WindowDays = (typeof VALID_WINDOW_DAYS)[number];
export const DEFAULT_WINDOW_DAYS: WindowDays = 30;

/**
 * A magnitude with its own unit specific to the Event's Category.
 * Magnitudes are never compared across Categories.
 */
export interface Magnitude {
  value: number;
  unit: string;
}

/**
 * The most recent location and magnitude of an Event.
 * Derived from the latest geometry entry after trimming.
 */
export interface LatestLocation {
  coordinates: [number, number]; // [longitude, latitude]
  date: string; // ISO 8601
  magnitude: Magnitude | null;
}

/**
 * A shaped Event ready for display.
 */
export interface ShapedEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  categoryId: string;
  categoryTitle: string;
  closed: boolean;
  latest: LatestLocation;
  /** Number of geometry entries originally present (before trimming). */
  historyLength: number;
  /** Whether this event had its history trimmed during shaping. */
  historyTrimmed: boolean;
  /** Coarse Region derived from the latest coordinates. */
  region: Region;
  /**
   * The earliest date known for this Event (from the oldest geometry entry
   * before trimming). Used by "Started per day" to count Events by the day
   * they first appeared, not the day they were last observed.
   */
  earliestDate: string; // ISO 8601
}

/**
 * The result of shaping a raw EONET response.
 * Includes the shaped events plus metadata about the shaping process
 * and pre-computed Measurements (cached to avoid recomputation on every request).
 */
export interface ShapingResult {
  events: ShapedEvent[];
  /** All five Measurements computed from the events on the server. */
  measurements: MeasurementSummary;
  /** The deterministic default Measurement to show until the AI picks one. */
  defaultMeasurementId: MeasurementId;
  /** Total raw payload size in bytes before shaping. */
  rawSizeBytes: number;
  /** Total shaped payload size in bytes after shaping. */
  shapedSizeBytes: number;
  /** Number of events before window filtering. */
  totalEventsBeforeFilter: number;
  /** Number of events after window filtering. */
  totalEventsAfterFilter: number;
}
