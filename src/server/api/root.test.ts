import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./root";
import { eonetClient } from "@/server/eonet/client";
import { EonetUpstreamError } from "@/server/eonet/errors";

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
      description: "Natural events from EONET.",
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
      description: "Natural events from EONET.",
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
    expect(result.rawSizeBytes).toBeGreaterThan(0);
    expect(result.shapedSizeBytes).toBeGreaterThan(0);
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
