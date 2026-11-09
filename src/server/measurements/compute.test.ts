import { describe, expect, it } from "vitest";
import {
  computeEventsByCategory,
  computeEventsByRegion,
  computeBiggestInCategory,
  computeNewVsOngoing,
  computeStartedPerDay,
  computeAllMeasurements,
  getMeasurement,
} from "./compute";
import type { ShapedEvent } from "@/server/eonet/types";

const makeEvent = (
  overrides: Partial<ShapedEvent> & { id: string },
): ShapedEvent => ({
  title: `Event ${overrides.id}`,
  description: null,
  link: "https://example.com",
  categoryId: "wildfires",
  categoryTitle: "Wildfires",
  closed: false,
  latest: {
    coordinates: [0, 0],
    date: "2026-11-01T00:00:00Z",
    magnitude: null,
  },
  historyLength: 1,
  historyTrimmed: false,
  region: "Africa",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Events by Category
// ---------------------------------------------------------------------------

describe("computeEventsByCategory", () => {
  it("returns empty array for no events", () => {
    expect(computeEventsByCategory([])).toEqual([]);
  });

  it("counts a single event", () => {
    const events = [makeEvent({ id: "1", categoryId: "wildfires", categoryTitle: "Wildfires" })];
    const result = computeEventsByCategory(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      categoryId: "wildfires",
      categoryTitle: "Wildfires",
      count: 1,
    });
  });

  it("groups multiple events by category", () => {
    const events = [
      makeEvent({ id: "1", categoryId: "wildfires", categoryTitle: "Wildfires" }),
      makeEvent({ id: "2", categoryId: "wildfires", categoryTitle: "Wildfires" }),
      makeEvent({ id: "3", categoryId: "earthquakes", categoryTitle: "Earthquakes" }),
    ];
    const result = computeEventsByCategory(events);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      categoryId: "wildfires",
      categoryTitle: "Wildfires",
      count: 2,
    });
    expect(result[1]).toEqual({
      categoryId: "earthquakes",
      categoryTitle: "Earthquakes",
      count: 1,
    });
  });

  it("sorts by count descending", () => {
    const events = [
      makeEvent({ id: "1", categoryId: "earthquakes", categoryTitle: "Earthquakes" }),
      makeEvent({ id: "2", categoryId: "wildfires", categoryTitle: "Wildfires" }),
      makeEvent({ id: "3", categoryId: "wildfires", categoryTitle: "Wildfires" }),
      makeEvent({ id: "4", categoryId: "wildfires", categoryTitle: "Wildfires" }),
    ];
    const result = computeEventsByCategory(events);

    expect(result[0].categoryId).toBe("wildfires");
    expect(result[0].count).toBe(3);
    expect(result[1].categoryId).toBe("earthquakes");
    expect(result[1].count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Events by Region
// ---------------------------------------------------------------------------

describe("computeEventsByRegion", () => {
  it("returns empty array for no events", () => {
    expect(computeEventsByRegion([])).toEqual([]);
  });

  it("counts a single event", () => {
    const events = [makeEvent({ id: "1", region: "Europe" })];
    const result = computeEventsByRegion(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ region: "Europe", count: 1 });
  });

  it("groups multiple events by region", () => {
    const events = [
      makeEvent({ id: "1", region: "Europe" }),
      makeEvent({ id: "2", region: "Europe" }),
      makeEvent({ id: "3", region: "Asia" }),
    ];
    const result = computeEventsByRegion(events);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ region: "Europe", count: 2 });
    expect(result[1]).toEqual({ region: "Asia", count: 1 });
  });

  it("sorts by count descending", () => {
    const events = [
      makeEvent({ id: "1", region: "Asia" }),
      makeEvent({ id: "2", region: "Europe" }),
      makeEvent({ id: "3", region: "Europe" }),
      makeEvent({ id: "4", region: "Europe" }),
    ];
    const result = computeEventsByRegion(events);

    expect(result[0].region).toBe("Europe");
    expect(result[0].count).toBe(3);
    expect(result[1].region).toBe("Asia");
    expect(result[1].count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Biggest in a Category
// ---------------------------------------------------------------------------

describe("computeBiggestInCategory", () => {
  it("returns null fields for no events", () => {
    const result = computeBiggestInCategory([]);

    expect(result.categoryId).toBe("");
    expect(result.eventId).toBeNull();
    expect(result.magnitudeValue).toBeNull();
    expect(result.magnitudeUnit).toBeNull();
  });

  it("finds the biggest magnitude in the most common category", () => {
    const events = [
      makeEvent({
        id: "1",
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: { value: 100, unit: "acres" },
        },
      }),
      makeEvent({
        id: "2",
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: { value: 500, unit: "acres" },
        },
      }),
      makeEvent({
        id: "3",
        categoryId: "earthquakes",
        categoryTitle: "Earthquakes",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: { value: 5.0, unit: "Richter" },
        },
      }),
    ];
    const result = computeBiggestInCategory(events);

    // Wildfires is the most common (2 events), so the biggest in wildfires is 500 acres
    expect(result.categoryId).toBe("wildfires");
    expect(result.categoryTitle).toBe("Wildfires");
    expect(result.eventId).toBe("2");
    expect(result.magnitudeValue).toBe(500);
    expect(result.magnitudeUnit).toBe("acres");
  });

  it("never compares magnitudes across categories", () => {
    const events = [
      makeEvent({
        id: "1",
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: { value: 100, unit: "acres" },
        },
      }),
      makeEvent({
        id: "2",
        categoryId: "earthquakes",
        categoryTitle: "Earthquakes",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: { value: 9.0, unit: "Richter" },
        },
      }),
    ];
    const result = computeBiggestInCategory(events);

    // Both have 1 event each; the first one encountered wins the tie.
    // But the result is always within a single category.
    expect(result.categoryId).toBe("wildfires");
    expect(result.magnitudeUnit).toBe("acres");
    // It should NOT report 9.0 (from earthquakes) with "acres" unit.
    expect(result.magnitudeValue).not.toBe(9.0);
  });

  it("returns null magnitude when no event in the category has one", () => {
    const events = [
      makeEvent({
        id: "1",
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: null,
        },
      }),
    ];
    const result = computeBiggestInCategory(events);

    expect(result.categoryId).toBe("wildfires");
    expect(result.eventId).toBeNull();
    expect(result.magnitudeValue).toBeNull();
  });

  it("handles a single event", () => {
    const events = [
      makeEvent({
        id: "1",
        categoryId: "volcanoes",
        categoryTitle: "Volcanoes",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: { value: 3, unit: "VEI" },
        },
      }),
    ];
    const result = computeBiggestInCategory(events);

    expect(result.categoryId).toBe("volcanoes");
    expect(result.eventId).toBe("1");
    expect(result.magnitudeValue).toBe(3);
    expect(result.magnitudeUnit).toBe("VEI");
  });
});

// ---------------------------------------------------------------------------
// New vs ongoing
// ---------------------------------------------------------------------------

describe("computeNewVsOngoing", () => {
  it("returns zeros for no events", () => {
    expect(computeNewVsOngoing([])).toEqual({ newCount: 0, ongoingCount: 0 });
  });

  it("counts new (single-geometry) and ongoing (multi-geometry) active events", () => {
    const events = [
      makeEvent({ id: "1", closed: false, historyLength: 1 }), // new
      makeEvent({ id: "2", closed: false, historyLength: 5 }), // ongoing
      makeEvent({ id: "3", closed: false, historyLength: 3 }), // ongoing
      makeEvent({ id: "4", closed: true, historyLength: 10 }), // closed — not counted
    ];
    const result = computeNewVsOngoing(events);

    expect(result.newCount).toBe(1);
    expect(result.ongoingCount).toBe(2);
  });

  it("handles a single new event", () => {
    const events = [makeEvent({ id: "1", closed: false, historyLength: 1 })];
    const result = computeNewVsOngoing(events);

    expect(result.newCount).toBe(1);
    expect(result.ongoingCount).toBe(0);
  });

  it("handles a single ongoing event", () => {
    const events = [makeEvent({ id: "1", closed: false, historyLength: 5 })];
    const result = computeNewVsOngoing(events);

    expect(result.newCount).toBe(0);
    expect(result.ongoingCount).toBe(1);
  });

  it("ignores closed events", () => {
    const events = [
      makeEvent({ id: "1", closed: true, historyLength: 1 }),
      makeEvent({ id: "2", closed: true, historyLength: 5 }),
    ];
    const result = computeNewVsOngoing(events);

    expect(result.newCount).toBe(0);
    expect(result.ongoingCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Started per day
// ---------------------------------------------------------------------------

describe("computeStartedPerDay", () => {
  it("returns empty array for no events", () => {
    expect(computeStartedPerDay([])).toEqual([]);
  });

  it("groups events by date", () => {
    const events = [
      makeEvent({
        id: "1",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T10:00:00Z",
          magnitude: null,
        },
      }),
      makeEvent({
        id: "2",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T15:00:00Z",
          magnitude: null,
        },
      }),
      makeEvent({
        id: "3",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-02T08:00:00Z",
          magnitude: null,
        },
      }),
    ];
    const result = computeStartedPerDay(events);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: "2026-11-01", count: 2 });
    expect(result[1]).toEqual({ date: "2026-11-02", count: 1 });
  });

  it("sorts by date ascending", () => {
    const events = [
      makeEvent({
        id: "1",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-03T00:00:00Z",
          magnitude: null,
        },
      }),
      makeEvent({
        id: "2",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-01T00:00:00Z",
          magnitude: null,
        },
      }),
    ];
    const result = computeStartedPerDay(events);

    expect(result[0].date).toBe("2026-11-01");
    expect(result[1].date).toBe("2026-11-03");
  });

  it("handles a single event", () => {
    const events = [
      makeEvent({
        id: "1",
        latest: {
          coordinates: [0, 0],
          date: "2026-11-05T12:00:00Z",
          magnitude: null,
        },
      }),
    ];
    const result = computeStartedPerDay(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: "2026-11-05", count: 1 });
  });
});

// ---------------------------------------------------------------------------
// computeAllMeasurements
// ---------------------------------------------------------------------------

describe("computeAllMeasurements", () => {
  it("returns all five measurements", () => {
    const events = [
      makeEvent({ id: "1", categoryId: "wildfires", region: "Europe" }),
    ];
    const summary = computeAllMeasurements(events);

    expect(Object.keys(summary)).toHaveLength(5);
    expect(summary.eventsByCategory.id).toBe("eventsByCategory");
    expect(summary.eventsByRegion.id).toBe("eventsByRegion");
    expect(summary.biggestInCategory.id).toBe("biggestInCategory");
    expect(summary.newVsOngoing.id).toBe("newVsOngoing");
    expect(summary.startedPerDay.id).toBe("startedPerDay");
  });

  it("handles empty events", () => {
    const summary = computeAllMeasurements([]);

    expect(summary.eventsByCategory.data).toEqual([]);
    expect(summary.eventsByRegion.data).toEqual([]);
    expect(summary.biggestInCategory.data.magnitudeValue).toBeNull();
    expect(summary.newVsOngoing.data).toEqual({ newCount: 0, ongoingCount: 0 });
    expect(summary.startedPerDay.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getMeasurement
// ---------------------------------------------------------------------------

describe("getMeasurement", () => {
  it("returns a specific measurement by ID", () => {
    const events = [makeEvent({ id: "1", region: "Europe" })];

    const result = getMeasurement(events, "eventsByRegion");
    expect(result.id).toBe("eventsByRegion");
    expect(result.title).toBe("Events by Region");
  });

  it("returns the same data as computeAllMeasurements for each ID", () => {
    const events = [
      makeEvent({ id: "1", categoryId: "wildfires", region: "Europe", closed: false, historyLength: 1 }),
      makeEvent({ id: "2", categoryId: "earthquakes", region: "Asia", closed: false, historyLength: 5 }),
    ];
    const summary = computeAllMeasurements(events);

    for (const id of ["eventsByCategory", "eventsByRegion", "biggestInCategory", "newVsOngoing", "startedPerDay"] as const) {
      const result = getMeasurement(events, id);
      expect(result).toEqual(summary[id]);
    }
  });
});
