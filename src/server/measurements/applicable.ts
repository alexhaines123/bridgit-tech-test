/**
 * Checks whether a chosen Measurement is applicable to the data.
 *
 * Per ticket #21: the AI's choice of Measurement must be validated. A choice
 * that does not apply to the data (for example "biggestInCategory" in a
 * Category with no Events that have magnitudes) is rejected and falls back
 * to the deterministic default.
 *
 * This is a pure server-side check — the AI picks any ID from the fixed list,
 * and the server decides whether it makes sense for the current data.
 */

import type { MeasurementId, MeasurementSummary } from "./types";

/**
 * Returns true if the given Measurement ID is applicable to the data.
 *
 * Applicability rules:
 * - eventsByCategory: at least one Event with a Category (data non-empty)
 * - eventsByRegion: at least one Event with a Region (data non-empty)
 * - biggestInCategory: the most common Category has at least one Event with
 *   a non-null magnitude (magnitudeValue is not null)
 * - newVsOngoing: always applicable (counts can be zero)
 * - startedPerDay: at least one Event with a date (data non-empty)
 */
export function isMeasurementApplicable(
  id: MeasurementId,
  measurements: MeasurementSummary,
): boolean {
  switch (id) {
    case "eventsByCategory":
      return measurements.eventsByCategory.data.length > 0;
    case "eventsByRegion":
      return measurements.eventsByRegion.data.length > 0;
    case "biggestInCategory":
      return measurements.biggestInCategory.data.magnitudeValue !== null;
    case "newVsOngoing":
      return true;
    case "startedPerDay":
      return measurements.startedPerDay.data.length > 0;
  }
}
