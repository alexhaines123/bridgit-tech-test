import { describe, expect, it } from "vitest";
import {
  shapeEvent,
  shapeResponse,
  trimGeometry,
  filterByWindow,
  estimateSize,
  MAX_GEOMETRY_ENTRIES,
} from "./shape";
import {
  realEonetFixture,
  oldEventWithRecentActivity,
  eventWithNoRecentActivity,
} from "./fixtures";
import type { EonetEvent } from "./schema";

describe("trimGeometry", () => {
  it("sorts by date descending and keeps most recent entries", () => {
    const geometry = [
      {
        magnitudeValue: 1.0,
        magnitudeUnit: "test",
        date: "2024-01-01T00:00:00Z",
        type: "Point" as const,
        coordinates: [0, 0] as [number, number],
      },
      {
        magnitudeValue: 2.0,
        magnitudeUnit: "test",
        date: "2025-01-01T00:00:00Z",
        type: "Point" as const,
        coordinates: [1, 1] as [number, number],
      },
      {
        magnitudeValue: 3.0,
        magnitudeUnit: "test",
        date: "2023-01-01T00:00:00Z",
        type: "Point" as const,
        coordinates: [2, 2] as [number, number],
      },
    ];

    const result = trimGeometry(geometry);

    expect(result.trimmed).toHaveLength(3);
    expect(result.trimmed[0].date).toBe("2025-01-01T00:00:00Z");
    expect(result.trimmed[1].date).toBe("2024-01-01T00:00:00Z");
    expect(result.trimmed[2].date).toBe("2023-01-01T00:00:00Z");
    expect(result.wasTrimmed).toBe(false);
    expect(result.originalLength).toBe(3);
  });

  it("trims to MAX_GEOMETRY_ENTRIES when exceeded", () => {
    const geometry = Array.from({ length: 20 }, (_, i) => ({
      magnitudeValue: i,
      magnitudeUnit: "test",
      date: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      type: "Point" as const,
      coordinates: [0, 0] as [number, number],
    }));

    const result = trimGeometry(geometry);

    expect(result.trimmed).toHaveLength(MAX_GEOMETRY_ENTRIES);
    expect(result.originalLength).toBe(20);
    expect(result.wasTrimmed).toBe(true);
  });

  it("does not trim when at or below MAX_GEOMETRY_ENTRIES", () => {
    const geometry = Array.from({ length: MAX_GEOMETRY_ENTRIES }, (_, i) => ({
      magnitudeValue: i,
      magnitudeUnit: "test",
      date: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      type: "Point" as const,
      coordinates: [0, 0] as [number, number],
    }));

    const result = trimGeometry(geometry);

    expect(result.trimmed).toHaveLength(MAX_GEOMETRY_ENTRIES);
    expect(result.originalLength).toBe(MAX_GEOMETRY_ENTRIES);
    expect(result.wasTrimmed).toBe(false);
  });
});

describe("shapeEvent", () => {
  it("extracts the most recent location and magnitude", () => {
    const raw: EonetEvent = {
      id: "EONET_TEST",
      title: "Test Event",
      description: "Test description",
      link: "https://example.com",
      closed: null,
      categories: [{ id: "wildfires", title: "Wildfires" }],
      sources: [],
      geometry: [
        {
          magnitudeValue: 100.0,
          magnitudeUnit: "acres",
          date: "2024-01-01T00:00:00Z",
          type: "Point",
          coordinates: [-120, 40],
        },
        {
          magnitudeValue: 200.0,
          magnitudeUnit: "acres",
          date: "2025-01-01T00:00:00Z",
          type: "Point",
          coordinates: [-121, 41],
        },
      ],
    };

    const shaped = shapeEvent(raw);

    expect(shaped.id).toBe("EONET_TEST");
    expect(shaped.title).toBe("Test Event");
    expect(shaped.description).toBe("Test description");
    expect(shaped.categoryId).toBe("wildfires");
    expect(shaped.categoryTitle).toBe("Wildfires");
    expect(shaped.closed).toBe(false);
    expect(shaped.latest.date).toBe("2025-01-01T00:00:00Z");
    expect(shaped.latest.coordinates).toEqual([-121, 41]);
    expect(shaped.latest.magnitude).toEqual({ value: 200.0, unit: "acres" });
    expect(shaped.historyLength).toBe(2);
    expect(shaped.historyTrimmed).toBe(false);
  });

  it("handles null magnitude gracefully", () => {
    const raw: EonetEvent = {
      id: "EONET_NO_MAG",
      title: "Event Without Magnitude",
      description: null,
      link: "https://example.com",
      closed: null,
      categories: [{ id: "earthquakes", title: "Earthquakes" }],
      sources: [],
      geometry: [
        {
          magnitudeValue: null,
          magnitudeUnit: null,
          date: "2025-01-01T00:00:00Z",
          type: "Point",
          coordinates: [0, 0],
        },
      ],
    };

    const shaped = shapeEvent(raw);

    expect(shaped.latest.magnitude).toBeNull();
  });

  it("marks closed events correctly", () => {
    const raw: EonetEvent = {
      id: "EONET_CLOSED",
      title: "Closed Event",
      description: null,
      link: "https://example.com",
      closed: "2024-12-31T00:00:00Z",
      categories: [{ id: "floods", title: "Floods" }],
      sources: [],
      geometry: [
        {
          magnitudeValue: null,
          magnitudeUnit: null,
          date: "2024-12-30T00:00:00Z",
          type: "Point",
          coordinates: [0, 0],
        },
      ],
    };

    const shaped = shapeEvent(raw);

    expect(shaped.closed).toBe(true);
  });

  it("records trimming metadata for long histories", () => {
    const raw: EonetEvent = {
      id: "EONET_LONG",
      title: "Long History Event",
      description: null,
      link: "https://example.com",
      closed: null,
      categories: [{ id: "seaLakeIce", title: "Sea and Lake Ice" }],
      sources: [],
      geometry: Array.from({ length: 15 }, (_, i) => ({
        magnitudeValue: i,
        magnitudeUnit: "NM^2",
        date: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
        type: "Point" as const,
        coordinates: [0, 0] as [number, number],
      })),
    };

    const shaped = shapeEvent(raw);

    expect(shaped.historyLength).toBe(15);
    expect(shaped.historyTrimmed).toBe(true);
  });
});

describe("filterByWindow", () => {
  it("includes events with recent activity", () => {
    const events = realEonetFixture.events.map(shapeEvent);
    const now = new Date("2026-11-08T00:00:00Z");

    const filtered = filterByWindow(events, 30, now);

    // All three events in the fixture have activity within 30 days of Nov 8, 2026
    expect(filtered).toHaveLength(3);
  });

  it("excludes events with no recent activity", () => {
    const events = eventWithNoRecentActivity.events.map(shapeEvent);
    const now = new Date("2026-11-08T00:00:00Z");

    const filtered = filterByWindow(events, 30, now);

    // The event's last activity was Jan 1, 2025 - over 30 days ago
    expect(filtered).toHaveLength(0);
  });

  it("includes old events with recent activity", () => {
    const events = oldEventWithRecentActivity.events.map(shapeEvent);
    const now = new Date("2026-11-08T00:00:00Z");

    const filtered = filterByWindow(events, 30, now);

    // Event first seen in 2020 but updated Nov 1, 2026 - should be included
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("EONET_OLD_BUT_ACTIVE");
  });

  it("respects different window sizes", () => {
    const events = realEonetFixture.events.map(shapeEvent);
    const now = new Date("2026-11-08T00:00:00Z");

    const filtered7 = filterByWindow(events, 7, now);
    const filtered30 = filterByWindow(events, 30, now);
    const filtered90 = filterByWindow(events, 90, now);

    // 7 days: Nov 2 (Wild River) and Nov 6 (Iceberg B22A)
    expect(filtered7).toHaveLength(2);
    expect(filtered7.map(e => e.id)).toContain("EONET_26057");
    expect(filtered7.map(e => e.id)).toContain("EONET_2736");

    // 30 days: all three events (Oct 30, Nov 2, Nov 6)
    expect(filtered30).toHaveLength(3);

    // 90 days: all three events (no older events in fixture)
    expect(filtered90).toHaveLength(3);
  });
});

describe("shapeResponse", () => {
  it("shapes, filters and records payload sizes", () => {
    const result = shapeResponse(realEonetFixture, 30);

    expect(result.events).toHaveLength(3);
    expect(result.totalEventsBeforeFilter).toBe(3);
    expect(result.totalEventsAfterFilter).toBe(3);
    expect(result.rawSizeBytes).toBeGreaterThan(0);
    expect(result.shapedSizeBytes).toBeGreaterThan(0);
    expect(result.shapedSizeBytes).toBeLessThan(result.rawSizeBytes);
  });

  it("filters events based on window", () => {
    const result = shapeResponse(eventWithNoRecentActivity, 30);

    expect(result.totalEventsBeforeFilter).toBe(1);
    expect(result.totalEventsAfterFilter).toBe(0);
    expect(result.events).toHaveLength(0);
  });

  it("preserves magnitudes with their units", () => {
    const result = shapeResponse(realEonetFixture, 30);

    const wildfire = result.events.find((e) => e.id === "EONET_26057");
    expect(wildfire?.latest.magnitude).toEqual({ value: 982.0, unit: "acres" });

    const iceberg = result.events.find((e) => e.id === "EONET_2736");
    expect(iceberg?.latest.magnitude?.unit).toBe("NM^2");
  });

  it("never sums or compares magnitudes across categories", () => {
    const result = shapeResponse(realEonetFixture, 30);

    // Each event keeps its own magnitude with its own unit
    const magnitudes = result.events.map((e) => e.latest.magnitude);
    expect(magnitudes).toHaveLength(3);

    // Verify units are different and not normalized
    const units = magnitudes.map((m) => m?.unit).filter(Boolean);
    expect(units).toContain("NM^2");
    expect(units).toContain("acres");
  });
});

describe("estimateSize", () => {
  it("returns byte size of JSON-serialized value", () => {
    const value = { test: "data", number: 42 };
    const size = estimateSize(value);

    expect(size).toBeGreaterThan(0);
    expect(size).toBe(new TextEncoder().encode(JSON.stringify(value)).length);
  });
});
