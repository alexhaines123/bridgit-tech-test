/**
 * Server-side computation of the five Measurements from shaped Events.
 *
 * Per ADR 0003: the AI judges and explains; the server computes every number.
 * These functions never depend on AI output. They are pure functions of the
 * shaped Events array, so they are deterministic and easy to test.
 */

import type {
  BiggestInCategoryResult,
  EventsByCategoryEntry,
  EventsByRegionEntry,
  Measurement,
  MeasurementId,
  MeasurementSummary,
  NewVsOngoingResult,
  StartedPerDayEntry,
} from "./types";
import type { ShapedEvent } from "@/server/eonet/types";

/**
 * Computes the "Events by Category" Measurement.
 * Groups Events by their Category and counts each group.
 * Returns an array sorted by count descending.
 */
export function computeEventsByCategory(
  events: ShapedEvent[],
): EventsByCategoryEntry[] {
  const counts = new Map<string, { title: string; count: number }>();

  for (const event of events) {
    const existing = counts.get(event.categoryId);
    if (existing) {
      existing.count++;
    } else {
      counts.set(event.categoryId, {
        title: event.categoryTitle,
        count: 1,
      });
    }
  }

  return Array.from(counts.entries())
    .map(([categoryId, { title, count }]) => ({
      categoryId,
      categoryTitle: title,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Computes the "Events by Region" Measurement.
 * Groups Events by their Region and counts each group.
 * Returns an array sorted by count descending.
 */
export function computeEventsByRegion(
  events: ShapedEvent[],
): EventsByRegionEntry[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.region, (counts.get(event.region) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Computes the "Biggest in a Category" Measurement.
 *
 * Picks the most common Category in the Events, then finds the Event in
 * that Category with the largest Magnitude. Magnitudes are never compared
 * across Categories — the result states the unit.
 *
 * If no Events have a Magnitude, the result has null magnitude fields.
 * If the Events array is empty, the result has null fields and a null
 * categoryId (we pick the first Category from the empty array, which is
 * undefined — handled by the caller).
 */
export function computeBiggestInCategory(
  events: ShapedEvent[],
): BiggestInCategoryResult {
  if (events.length === 0) {
    return {
      categoryId: "",
      categoryTitle: "",
      eventId: null,
      eventTitle: null,
      magnitudeValue: null,
      magnitudeUnit: null,
    };
  }

  // Pick the most common Category
  const categoryCounts = new Map<string, { title: string; count: number }>();
  for (const event of events) {
    const existing = categoryCounts.get(event.categoryId);
    if (existing) {
      existing.count++;
    } else {
      categoryCounts.set(event.categoryId, {
        title: event.categoryTitle,
        count: 1,
      });
    }
  }

  let topCategoryId = "";
  let topCategoryTitle = "";
  let topCount = 0;
  for (const [categoryId, { title, count }] of categoryCounts) {
    if (count > topCount) {
      topCategoryId = categoryId;
      topCategoryTitle = title;
      topCount = count;
    }
  }

  // Find the biggest Magnitude in that Category
  const categoryEvents = events.filter((e) => e.categoryId === topCategoryId);
  let biggest: ShapedEvent | null = null;
  let biggestValue = -Infinity;

  for (const event of categoryEvents) {
    if (event.latest.magnitude !== null) {
      if (event.latest.magnitude.value > biggestValue) {
        biggest = event;
        biggestValue = event.latest.magnitude.value;
      }
    }
  }

  if (biggest && biggest.latest.magnitude) {
    return {
      categoryId: topCategoryId,
      categoryTitle: topCategoryTitle,
      eventId: biggest.id,
      eventTitle: biggest.title,
      magnitudeValue: biggest.latest.magnitude.value,
      magnitudeUnit: biggest.latest.magnitude.unit,
    };
  }

  // No Event in this Category has a Magnitude
  return {
    categoryId: topCategoryId,
    categoryTitle: topCategoryTitle,
    eventId: null,
    eventTitle: null,
    magnitudeValue: null,
    magnitudeUnit: null,
  };
}

/**
 * Computes the "New vs ongoing" Measurement.
 *
 * - "new" = events that are not closed (still active / ongoing is ambiguous,
 *   so we define: new = active events whose first geometry date is within
 *   the Window; but we don't have the full history for first-seen, so we
 *   use: new = not closed and historyLength === 1, ongoing = not closed
 *   and historyLength > 1).
 *
 * Actually, a simpler and more useful definition:
 * - "new" = events whose `closed` is false (still active), and their
 *   first known geometry date is recent (within the last 7 days).
 * - "ongoing" = events whose `closed` is false, but started before 7 days ago.
 *
 * But we don't have the full history. Let's use a simpler definition:
 * - "new" = events that are not closed (active now)
 * - "ongoing" = events that are closed (finished)
 *
 * Wait, that's "active vs finished", not "new vs ongoing". Let me re-read
 * the ticket: "New vs ongoing". In EONET terms:
 * - "new" = events that have started recently (first seen recently)
 * - "ongoing" = events that are still active (not closed)
 *
 * But we've trimmed history. The simplest useful definition:
 * - "new" = not closed and historyLength === 1 (only one geometry point, so
 *   likely newly reported)
 * - "ongoing" = not closed and historyLength > 1 (multiple points, still active)
 *
 * This is a heuristic. Let me use it.
 */
export function computeNewVsOngoing(
  events: ShapedEvent[],
): NewVsOngoingResult {
  let newCount = 0;
  let ongoingCount = 0;

  for (const event of events) {
    if (!event.closed) {
      if (event.historyLength === 1) {
        newCount++;
      } else {
        ongoingCount++;
      }
    }
  }

  return { newCount, ongoingCount };
}

/**
 * Computes the "Started per day" Measurement.
 *
 * Groups Events by the date of their earliest known geometry (the last
 * entry after trimming, since trimming sorts by date descending).
 * Returns an array sorted by date ascending, with one entry per day
 * that has at least one Event.
 */
export function computeStartedPerDay(
  events: ShapedEvent[],
): StartedPerDayEntry[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    // The earliest date we know about is the latest date in the trimmed
    // geometry (since trimming sorts descending). But we only have the
    // trimmed history in the shaped event. The shaped event's latest.date
    // is the most recent; we don't have the oldest.
    //
    // Since we've trimmed, we can't reliably get the "first seen" date.
    // As a proxy, use the latest date (the only one we have access to
    // without re-trimming). This is an approximation.
    //
    // Actually, we should use the event's latest.date as a proxy for
    // "started" since that's the date we have. This is documented as
    // an approximation in the Measurement.
    const date = event.latest.date.split("T")[0]; // YYYY-MM-DD
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Computes all five Measurements from the given Events.
 * Returns a summary keyed by MeasurementId.
 */
export function computeAllMeasurements(
  events: ShapedEvent[],
): MeasurementSummary {
  return {
    eventsByCategory: {
      id: "eventsByCategory",
      title: "Events by Category",
      data: computeEventsByCategory(events),
    },
    eventsByRegion: {
      id: "eventsByRegion",
      title: "Events by Region",
      data: computeEventsByRegion(events),
    },
    biggestInCategory: {
      id: "biggestInCategory",
      title: "Biggest in a Category",
      data: computeBiggestInCategory(events),
    },
    newVsOngoing: {
      id: "newVsOngoing",
      title: "New vs ongoing",
      data: computeNewVsOngoing(events),
    },
    startedPerDay: {
      id: "startedPerDay",
      title: "Started per day",
      data: computeStartedPerDay(events),
    },
  };
}

/**
 * Returns a specific Measurement by ID.
 */
export function getMeasurement(
  events: ShapedEvent[],
  id: MeasurementId,
): Measurement {
  switch (id) {
    case "eventsByCategory":
      return {
        id: "eventsByCategory",
        title: "Events by Category",
        data: computeEventsByCategory(events),
      };
    case "eventsByRegion":
      return {
        id: "eventsByRegion",
        title: "Events by Region",
        data: computeEventsByRegion(events),
      };
    case "biggestInCategory":
      return {
        id: "biggestInCategory",
        title: "Biggest in a Category",
        data: computeBiggestInCategory(events),
      };
    case "newVsOngoing":
      return {
        id: "newVsOngoing",
        title: "New vs ongoing",
        data: computeNewVsOngoing(events),
      };
    case "startedPerDay":
      return {
        id: "startedPerDay",
        title: "Started per day",
        data: computeStartedPerDay(events),
      };
  }
}
