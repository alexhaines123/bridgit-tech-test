import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./root";
import { eonetClient } from "@/server/eonet/client";
import { EonetUpstreamError } from "@/server/eonet/errors";

// Mock the cache module so unit tests of the router don't need Redis.
// The cache's own integration tests cover the Redis behavior.
vi.mock("@/server/cache/redis-cache", () => {
  class MockRedisEventsCache {
    getOrFetch = vi.fn(async (_windowDays: number, fetcher: () => Promise<unknown>) => {
      const data = await fetcher();
      return { data, stale: false };
    });
    close = vi.fn();
  }
  return { RedisEventsCache: MockRedisEventsCache };
});

describe("appRouter.health", () => {
  it("reports the app as ok", async () => {
    const caller = appRouter.createCaller({});

    await expect(caller.health()).resolves.toEqual({
      status: "ok",
      name: "Planet Watch",
    });
  });
});

describe("appRouter.events", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates the Window input", async () => {
    const caller = appRouter.createCaller({});

    await expect(caller.events({ windowDays: 15 })).rejects.toThrow();
  });

  it("accepts valid Window values (7, 30, 90)", async () => {
    const mockResponse = {
      title: "EONET Events",
      description: "Natural events from NASA.",
      link: "https://eonet.gsfc.nasa.gov/api/v3/events",
      events: [],
    };

    vi.spyOn(eonetClient, "fetchEvents").mockResolvedValue(mockResponse);

    const caller = appRouter.createCaller({});

    await expect(caller.events({ windowDays: 7 })).resolves.toBeDefined();
    await expect(caller.events({ windowDays: 30 })).resolves.toBeDefined();
    await expect(caller.events({ windowDays: 90 })).resolves.toBeDefined();
  });

  it("returns shaped events with metadata", async () => {
    const mockResponse = {
      title: "EONET Events",
      description: "Natural events from NASA.",
      link: "https://eonet.gsfc.nasa.gov/api/v3/events",
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          sources: [],
          geometry: [
            {
              magnitudeValue: 100.0,
              magnitudeUnit: "acres",
              date: new Date().toISOString(),
              type: "Point" as const,
              coordinates: [0, 0] as [number, number],
            },
          ],
        },
      ],
    };

    vi.spyOn(eonetClient, "fetchEvents").mockResolvedValue(mockResponse);

    const caller = appRouter.createCaller({});
    const result = await caller.events({ windowDays: 30 });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe("EONET_TEST");
    expect(result.events[0].region).toBeDefined();
    expect(result.rawSizeBytes).toBeGreaterThan(0);
    expect(result.shapedSizeBytes).toBeGreaterThan(0);
    expect(result.stale).toBe(false);
    expect(result.measurements).toBeDefined();
    expect(result.defaultMeasurementId).toBeDefined();
  });

  it("returns all five measurements", async () => {
    const mockResponse = {
      title: "EONET Events",
      description: "Natural events from NASA.",
      link: "https://eonet.gsfc.nasa.gov/api/v3/events",
      events: [
        {
          id: "EONET_1",
          title: "Wildfire",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          sources: [],
          geometry: [
            {
              magnitudeValue: 100.0,
              magnitudeUnit: "acres",
              date: new Date().toISOString(),
              type: "Point" as const,
              coordinates: [-100, 40] as [number, number],
            },
          ],
        },
        {
          id: "EONET_2",
          title: "Earthquake",
          description: null,
          link: "https://example.com",
          closed: "2026-01-01T00:00:00Z",
          categories: [{ id: "earthquakes", title: "Earthquakes" }],
          sources: [],
          geometry: [
            {
              magnitudeValue: 5.0,
              magnitudeUnit: "Richter",
              date: new Date().toISOString(),
              type: "Point" as const,
              coordinates: [140, 35] as [number, number],
            },
          ],
        },
      ],
    };

    vi.spyOn(eonetClient, "fetchEvents").mockResolvedValue(mockResponse);

    const caller = appRouter.createCaller({});
    const result = await caller.events({ windowDays: 30 });

    expect(Object.keys(result.measurements)).toHaveLength(5);
    expect(result.measurements.eventsByCategory).toBeDefined();
    expect(result.measurements.eventsByRegion).toBeDefined();
    expect(result.measurements.biggestInCategory).toBeDefined();
    expect(result.measurements.newVsOngoing).toBeDefined();
    expect(result.measurements.startedPerDay).toBeDefined();
  });

  it("chooses a deterministic default measurement", async () => {
    const mockResponse = {
      title: "EONET Events",
      description: "Natural events from NASA.",
      link: "https://eonet.gsfc.nasa.gov/api/v3/events",
      events: [
        {
          id: "EONET_1",
          title: "Wildfire",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          sources: [],
          geometry: [
            {
              magnitudeValue: 100.0,
              magnitudeUnit: "acres",
              date: new Date().toISOString(),
              type: "Point" as const,
              coordinates: [-100, 40] as [number, number],
            },
          ],
        },
      ],
    };

    vi.spyOn(eonetClient, "fetchEvents").mockResolvedValue(mockResponse);

    const caller = appRouter.createCaller({});
    const result1 = await caller.events({ windowDays: 30 });
    const result2 = await caller.events({ windowDays: 30 });

    // Same data → same default
    expect(result1.defaultMeasurementId).toBe(result2.defaultMeasurementId);
    expect(result1.defaultMeasurementId).toBe("eventsByCategory");
  });

  it("handles empty events with a default measurement", async () => {
    const mockResponse = {
      title: "EONET Events",
      description: "Natural events from NASA.",
      link: "https://eonet.gsfc.nasa.gov/api/v3/events",
      events: [],
    };

    vi.spyOn(eonetClient, "fetchEvents").mockResolvedValue(mockResponse);

    const caller = appRouter.createCaller({});
    const result = await caller.events({ windowDays: 30 });

    expect(result.events).toHaveLength(0);
    expect(result.defaultMeasurementId).toBeDefined();
    expect(Object.keys(result.measurements)).toHaveLength(5);
  });

  it("surfaces upstream errors as user-friendly messages", async () => {
    vi.spyOn(eonetClient, "fetchEvents").mockRejectedValue(
      new EonetUpstreamError("upstream_unavailable", "EONET returned 500"),
    );

    const caller = appRouter.createCaller({});

    await expect(caller.events({ windowDays: 30 })).rejects.toThrow(
      "temporarily unavailable",
    );
  });

  it("surfaces rate limit errors as user-friendly messages", async () => {
    vi.spyOn(eonetClient, "fetchEvents").mockRejectedValue(
      new EonetUpstreamError("rate_limited", "EONET returned 429"),
    );

    const caller = appRouter.createCaller({});

    await expect(caller.events({ windowDays: 30 })).rejects.toThrow(
      "rate limit",
    );
  });
});
