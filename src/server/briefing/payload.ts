/**
 * Builds the payload sent to the AI for the Briefing summary.
 *
 * Per ADR 0003 and ADR 0006: the AI judges and explains, the server computes
 * every number. The payload carries server-computed data only — no Event titles,
 * descriptions or IDs. This shrinks the prompt-injection surface to EONET
 * Category and Region names, which are treated as data, not instructions.
 *
 * The payload has a size cap to keep token costs bounded.
 */

import type { MeasurementSummary, MeasurementId } from "@/server/measurements/types";
import type { WindowDays } from "@/server/eonet/types";

/**
 * The maximum serialized size of the payload in bytes.
 * Keeps token costs bounded and makes the AI's job tractable.
 */
export const MAX_PAYLOAD_SIZE_BYTES = 10_000; // 10KB

/**
 * Input to the payload builder.
 */
export interface BuildBriefingPayloadInput {
  measurements: MeasurementSummary;
  windowDays: WindowDays;
  totalEventCount: number;
  stale: boolean;
  /** The Measurement the chart currently displays. Tells the AI which to describe. */
  defaultMeasurementId: MeasurementId;
}

/**
 * The Briefing payload sent to the AI.
 * All five Measurements plus context, with Event identifiers stripped.
 */
export interface BriefingPayload {
  measurements: SanitizedMeasurements;
  windowDays: WindowDays;
  totalEventCount: number;
  stale: boolean;
  /** The Measurement the chart currently displays. The AI reads this one. */
  defaultMeasurementId: MeasurementId;
}

/**
 * Measurements with Event IDs and titles stripped from biggestInCategory.
 * The AI only needs the magnitude, category and unit — not which specific Event.
 */
interface SanitizedMeasurements {
  eventsByCategory: MeasurementSummary["eventsByCategory"];
  eventsByRegion: MeasurementSummary["eventsByRegion"];
  biggestInCategory: {
    id: "biggestInCategory";
    title: string;
    data: {
      categoryId: string;
      categoryTitle: string;
      magnitudeValue: number | null;
      magnitudeUnit: string | null;
    };
  };
  newVsOngoing: MeasurementSummary["newVsOngoing"];
  startedPerDay: MeasurementSummary["startedPerDay"];
}

/**
 * Builds the Briefing payload from the server-computed Measurements.
 *
 * Strips Event identifiers from biggestInCategory so no Event titles or
 * descriptions reach the AI. Enforces the size cap: if the payload exceeds
 * the limit, it is truncated (the largest arrays are trimmed first).
 */
export function buildBriefingPayload(input: BuildBriefingPayloadInput): BriefingPayload {
  const sanitized: SanitizedMeasurements = {
    eventsByCategory: input.measurements.eventsByCategory,
    eventsByRegion: input.measurements.eventsByRegion,
    biggestInCategory: {
      id: "biggestInCategory",
      title: input.measurements.biggestInCategory.title,
      data: {
        categoryId: input.measurements.biggestInCategory.data.categoryId,
        categoryTitle: input.measurements.biggestInCategory.data.categoryTitle,
        magnitudeValue: input.measurements.biggestInCategory.data.magnitudeValue,
        magnitudeUnit: input.measurements.biggestInCategory.data.magnitudeUnit,
        // eventId and eventTitle are intentionally omitted
      },
    },
    newVsOngoing: input.measurements.newVsOngoing,
    startedPerDay: input.measurements.startedPerDay,
  };

  const payload: BriefingPayload = {
    measurements: sanitized,
    windowDays: input.windowDays,
    totalEventCount: input.totalEventCount,
    stale: input.stale,
    defaultMeasurementId: input.defaultMeasurementId,
  };

  // Enforce the size cap by trimming arrays if necessary
  return enforceSizeCap(payload);
}

/**
 * If the serialized payload exceeds the cap, trim the largest arrays first
 * until it fits. Category and region lists are trimmed by dropping entries
 * from the tail (lowest counts). "Started per day" is trimmed by keeping
 * only the most recent days.
 */
function enforceSizeCap(payload: BriefingPayload): BriefingPayload {
  const serialized = JSON.stringify(payload);
  if (serialized.length <= MAX_PAYLOAD_SIZE_BYTES) {
    return payload;
  }

  // Work on a mutable copy
  const result = structuredClone(payload);

  // Trim arrays from largest to smallest until we fit
  const trimmableArrays: Array<{
    key: keyof SanitizedMeasurements;
    getLength: () => number;
    trim: (newLength: number) => void;
  }> = [
    {
      key: "eventsByCategory",
      getLength: () => result.measurements.eventsByCategory.data.length,
      trim: (n) => {
        result.measurements.eventsByCategory.data =
          result.measurements.eventsByCategory.data.slice(0, n);
      },
    },
    {
      key: "eventsByRegion",
      getLength: () => result.measurements.eventsByRegion.data.length,
      trim: (n) => {
        result.measurements.eventsByRegion.data =
          result.measurements.eventsByRegion.data.slice(0, n);
      },
    },
    {
      key: "startedPerDay",
      getLength: () => result.measurements.startedPerDay.data.length,
      trim: (n) => {
        // Keep the most recent days (last n entries)
        const data = result.measurements.startedPerDay.data;
        result.measurements.startedPerDay.data = data.slice(Math.max(0, data.length - n));
      },
    },
  ];

  // Sort by array size descending, trim the largest first
  for (let iterations = 0; iterations < 100; iterations++) {
    if (JSON.stringify(result).length <= MAX_PAYLOAD_SIZE_BYTES) {
      return result;
    }

    // Find the largest trimmable array that still has entries
    trimmableArrays.sort((a, b) => b.getLength() - a.getLength());
    const largest = trimmableArrays[0];
    if (largest.getLength() === 0) {
      // All arrays empty and still over cap — truncate long strings
      truncateLongStrings(result);
      return result;
    }

    // Halve the largest array
    largest.trim(Math.floor(largest.getLength() / 2));
  }

  return result;
}

/**
 * Truncates long strings in the payload to fit the size cap.
 * Category titles and region names longer than 50 chars are trimmed.
 */
function truncateLongStrings(result: BriefingPayload): void {
  const MAX_STRING_LENGTH = 50;

  for (const entry of result.measurements.eventsByCategory.data) {
    if (entry.categoryTitle.length > MAX_STRING_LENGTH) {
      entry.categoryTitle = entry.categoryTitle.slice(0, MAX_STRING_LENGTH) + "…";
    }
  }
  for (const entry of result.measurements.eventsByRegion.data) {
    if (entry.region.length > MAX_STRING_LENGTH) {
      entry.region = entry.region.slice(0, MAX_STRING_LENGTH) + "…";
    }
  }
  const biggest = result.measurements.biggestInCategory.data;
  if (biggest.categoryTitle.length > MAX_STRING_LENGTH) {
    biggest.categoryTitle = biggest.categoryTitle.slice(0, MAX_STRING_LENGTH) + "…";
  }
}
