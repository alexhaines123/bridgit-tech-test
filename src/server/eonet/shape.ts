import type { EonetEvent, EonetResponse } from "./schema";
import type { ShapedEvent, ShapingResult } from "./types";
import { deriveRegion } from "@/server/regions/lookup";

/**
 * Maximum number of geometry entries to keep per event.
 * EONET events like Iceberg B22A can have decades of history; we trim
 * to the most recent entries to keep payloads small.
 */
export const MAX_GEOMETRY_ENTRIES = 10;

/**
 * Estimates the byte size of a JSON-serializable value.
 */
export function estimateSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Trims an event's geometry history to the most recent MAX_GEOMETRY_ENTRIES
 * entries, sorted by date descending. Returns the trimmed entries plus
 * metadata about the trimming.
 */
export function trimGeometry(
  geometry: EonetEvent["geometry"],
): { trimmed: EonetEvent["geometry"]; originalLength: number; wasTrimmed: boolean } {
  const sorted = [...geometry].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const originalLength = sorted.length;
  const trimmed = sorted.slice(0, MAX_GEOMETRY_ENTRIES);

  return {
    trimmed,
    originalLength,
    wasTrimmed: originalLength > MAX_GEOMETRY_ENTRIES,
  };
}

/**
 * Shapes a single raw EONET event into a domain ShapedEvent.
 * The latest location is the first entry after trimming (most recent).
 * A Region is derived from the latest coordinates using a coarse lookup.
 */
export function shapeEvent(raw: EonetEvent): ShapedEvent {
  const { trimmed, originalLength, wasTrimmed } = trimGeometry(raw.geometry);
  const latest = trimmed[0];
  const region = deriveRegion(latest.coordinates);

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    link: raw.link,
    categoryId: raw.categories[0].id,
    categoryTitle: raw.categories[0].title,
    closed: raw.closed !== null,
    latest: {
      coordinates: latest.coordinates,
      date: latest.date,
      magnitude:
        latest.magnitudeValue !== null && latest.magnitudeUnit !== null
          ? { value: latest.magnitudeValue, unit: latest.magnitudeUnit }
          : null,
    },
    historyLength: originalLength,
    historyTrimmed: wasTrimmed,
    region,
  };
}

/**
 * Filters events by recent activity within the given window.
 *
 * An event is included if its most recent geometry date falls within
 * `windowDays` of today. This filters on recent activity, not first-seen
 * date: an event first seen years ago but updated recently is included,
 * and one with no recent activity is excluded.
 */
export function filterByWindow(
  events: ShapedEvent[],
  windowDays: number,
  now: Date = new Date(),
): ShapedEvent[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffMs = cutoff.getTime();

  return events.filter((event) => {
    const latestDateMs = new Date(event.latest.date).getTime();
    return latestDateMs >= cutoffMs;
  });
}

/**
 * Shapes and filters a raw EONET response into the domain model.
 *
 * Records the before/after payload sizes so callers can log the trimming benefit.
 */
export function shapeResponse(raw: EonetResponse, windowDays: number): ShapingResult {
  const rawSizeBytes = estimateSize(raw);

  // Shape all events first (so we can count before filtering)
  const allShaped = raw.events.map(shapeEvent);
  const totalEventsBeforeFilter = allShaped.length;

  // Filter by window
  const filtered = filterByWindow(allShaped, windowDays);
  const totalEventsAfterFilter = filtered.length;

  const shapedSizeBytes = estimateSize(filtered);

  return {
    events: filtered,
    rawSizeBytes,
    shapedSizeBytes,
    totalEventsBeforeFilter,
    totalEventsAfterFilter,
  };
}
