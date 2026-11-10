import { describe, expect, it } from "vitest";
import { createFullMeasurementSummary } from "../../../test/fixtures/measurements";
import { isMeasurementApplicable } from "./applicable";

describe("isMeasurementApplicable", () => {
  describe("with full data", () => {
    const measurements = createFullMeasurementSummary();

    it("eventsByCategory is applicable", () => {
      expect(isMeasurementApplicable("eventsByCategory", measurements)).toBe(true);
    });

    it("eventsByRegion is applicable", () => {
      expect(isMeasurementApplicable("eventsByRegion", measurements)).toBe(true);
    });

    it("biggestInCategory is applicable when magnitude is present", () => {
      expect(isMeasurementApplicable("biggestInCategory", measurements)).toBe(true);
    });

    it("newVsOngoing is always applicable", () => {
      expect(isMeasurementApplicable("newVsOngoing", measurements)).toBe(true);
    });

    it("startedPerDay is applicable", () => {
      expect(isMeasurementApplicable("startedPerDay", measurements)).toBe(true);
    });
  });

  describe("with empty category data", () => {
    const measurements = createFullMeasurementSummary();
    measurements.eventsByCategory.data = [];

    it("eventsByCategory is not applicable", () => {
      expect(isMeasurementApplicable("eventsByCategory", measurements)).toBe(false);
    });

    it("other Measurements are still applicable", () => {
      expect(isMeasurementApplicable("eventsByRegion", measurements)).toBe(true);
      expect(isMeasurementApplicable("startedPerDay", measurements)).toBe(true);
    });
  });

  describe("with empty region data", () => {
    const measurements = createFullMeasurementSummary();
    measurements.eventsByRegion.data = [];

    it("eventsByRegion is not applicable", () => {
      expect(isMeasurementApplicable("eventsByRegion", measurements)).toBe(false);
    });
  });

  describe("with no magnitude data in biggestInCategory", () => {
    const measurements = createFullMeasurementSummary();
    measurements.biggestInCategory.data = {
      categoryId: "wildfires",
      categoryTitle: "Wildfires",
      eventId: null,
      eventTitle: null,
      magnitudeValue: null,
      magnitudeUnit: null,
    };

    it("biggestInCategory is not applicable when magnitude is null", () => {
      expect(isMeasurementApplicable("biggestInCategory", measurements)).toBe(false);
    });
  });

  describe("with empty startedPerDay data", () => {
    const measurements = createFullMeasurementSummary();
    measurements.startedPerDay.data = [];

    it("startedPerDay is not applicable", () => {
      expect(isMeasurementApplicable("startedPerDay", measurements)).toBe(false);
    });
  });

  describe("newVsOngoing edge cases", () => {
    it("newVsOngoing is applicable even when both counts are zero", () => {
      const measurements = createFullMeasurementSummary();
      measurements.newVsOngoing.data = { newCount: 0, ongoingCount: 0 };
      expect(isMeasurementApplicable("newVsOngoing", measurements)).toBe(true);
    });
  });
});
