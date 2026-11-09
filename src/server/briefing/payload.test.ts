import { describe, expect, it } from "vitest";
import { buildBriefingPayload } from "./payload";
import type { MeasurementSummary } from "@/server/measurements/types";
import type { WindowDays } from "@/server/eonet/types";

describe("buildBriefingPayload", () => {
  const mockMeasurements: MeasurementSummary = {
    eventsByCategory: {
      id: "eventsByCategory",
      title: "Events by Category",
      data: [
        { categoryId: "wildfires", categoryTitle: "Wildfires", count: 5 },
        { categoryId: "storms", categoryTitle: "Severe Storms", count: 3 },
      ],
    },
    eventsByRegion: {
      id: "eventsByRegion",
      title: "Events by Region",
      data: [
        { region: "North America", count: 4 },
        { region: "Europe", count: 2 },
      ],
    },
    biggestInCategory: {
      id: "biggestInCategory",
      title: "Biggest in a Category",
      data: {
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        eventId: "EONET_123",
        eventTitle: "Test Fire",
        magnitudeValue: 1000,
        magnitudeUnit: "acres",
      },
    },
    newVsOngoing: {
      id: "newVsOngoing",
      title: "New vs ongoing",
      data: { newCount: 3, ongoingCount: 5 },
    },
    startedPerDay: {
      id: "startedPerDay",
      title: "Started per day",
      data: [
        { date: "2025-01-01", count: 2 },
        { date: "2025-01-02", count: 1 },
      ],
    },
  };

  it("includes all five Measurements", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 8,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    expect(payload.measurements).toHaveProperty("eventsByCategory");
    expect(payload.measurements).toHaveProperty("eventsByRegion");
    expect(payload.measurements).toHaveProperty("biggestInCategory");
    expect(payload.measurements).toHaveProperty("newVsOngoing");
    expect(payload.measurements).toHaveProperty("startedPerDay");
  });

  it("includes the Window length", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 7 as WindowDays,
      totalEventCount: 10,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    expect(payload.windowDays).toBe(7);
  });

  it("includes the total Event count", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 42,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    expect(payload.totalEventCount).toBe(42);
  });

  it("includes the stale flag", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 10,
      stale: true,
      defaultMeasurementId: "eventsByCategory",
    });

    expect(payload.stale).toBe(true);
  });

  it("does not include Event titles or descriptions", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 10,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    const payloadString = JSON.stringify(payload);
    expect(payloadString).not.toContain("Test Fire");
    expect(payloadString).not.toContain("EONET_123");
  });

  it("strips Event IDs and titles from biggestInCategory", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 10,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    expect(payload.measurements.biggestInCategory.data).not.toHaveProperty("eventId");
    expect(payload.measurements.biggestInCategory.data).not.toHaveProperty("eventTitle");
  });

  it("respects the size cap", () => {
    // Create a large payload that would exceed the cap
    const largeMeasurements: MeasurementSummary = {
      ...mockMeasurements,
      eventsByCategory: {
        id: "eventsByCategory",
        title: "Events by Category",
        data: Array.from({ length: 100 }, (_, i) => ({
          categoryId: `cat_${i}`,
          categoryTitle: `Category ${i}`.repeat(100), // Long strings
          count: i,
        })),
      },
    };

    const payload = buildBriefingPayload({
      measurements: largeMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 1000,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    const payloadSize = JSON.stringify(payload).length;
    expect(payloadSize).toBeLessThanOrEqual(10_000); // 10KB cap
  });

  it("includes the default Measurement ID for the AI to focus on", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 10,
      stale: false,
      defaultMeasurementId: "eventsByRegion",
    });

    expect(payload.defaultMeasurementId).toBe("eventsByRegion");
  });

  it("serializes to JSON without error", () => {
    const payload = buildBriefingPayload({
      measurements: mockMeasurements,
      windowDays: 30 as WindowDays,
      totalEventCount: 10,
      stale: false,
      defaultMeasurementId: "eventsByCategory",
    });

    expect(() => JSON.stringify(payload)).not.toThrow();
  });
});
