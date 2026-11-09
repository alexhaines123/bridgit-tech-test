/**
 * Shared test fixtures for Measurement-related tests.
 *
 * Provides a full MeasurementSummary with all five Measurements populated,
 * suitable for unit tests that need realistic server-computed data.
 */

import type { MeasurementSummary } from "@/server/measurements/types";

/**
 * A MeasurementSummary with all five Measurements populated.
 * Use this as a base for tests that need realistic server-computed data.
 *
 * Clone with structuredClone() before mutating to avoid test cross-contamination.
 */
export function createFullMeasurementSummary(): MeasurementSummary {
  return {
    eventsByCategory: {
      id: "eventsByCategory",
      title: "Events by Category",
      data: [{ categoryId: "wildfires", categoryTitle: "Wildfires", count: 5 }],
    },
    eventsByRegion: {
      id: "eventsByRegion",
      title: "Events by Region",
      data: [{ region: "North America", count: 3 }],
    },
    biggestInCategory: {
      id: "biggestInCategory",
      title: "Biggest in a Category",
      data: {
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        eventId: "evt1",
        eventTitle: "Test Fire",
        magnitudeValue: 1000,
        magnitudeUnit: "acres",
      },
    },
    newVsOngoing: {
      id: "newVsOngoing",
      title: "New vs ongoing",
      data: { newCount: 2, ongoingCount: 3 },
    },
    startedPerDay: {
      id: "startedPerDay",
      title: "Started per day",
      data: [{ date: "2025-01-01", count: 2 }],
    },
  };
}
