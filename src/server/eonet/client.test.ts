import { beforeEach, describe, expect, it, vi } from "vitest";
import { EonetClient } from "./client";
import { EonetUpstreamError } from "./errors";

describe("EonetClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchEvents", () => {
    it("fetches and validates a successful response", async () => {
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
                magnitudeValue: null,
                magnitudeUnit: null,
                date: "2025-01-01T00:00:00Z",
                type: "Point",
                coordinates: [0, 0],
              },
            ],
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new EonetClient({ baseUrl: "https://mock.eonet" });
      const result = await client.fetchEvents(30);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe("EONET_TEST");
    });

    it("throws rate_limited error on 429", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Too Many Requests", { status: 429 }),
      );

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 0,
      });

      await expect(client.fetchEvents(30)).rejects.toThrow(EonetUpstreamError);
      await expect(client.fetchEvents(30)).rejects.toMatchObject({
        code: "rate_limited",
      });
    });

    it("throws upstream_unavailable error on 500", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Internal Server Error", { status: 500 }),
      );

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 0,
      });

      await expect(client.fetchEvents(30)).rejects.toThrow(EonetUpstreamError);
      await expect(client.fetchEvents(30)).rejects.toMatchObject({
        code: "upstream_unavailable",
      });
    });

    it("throws upstream_unavailable error on 503", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Service Unavailable", { status: 503 }),
      );

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 0,
      });

      await expect(client.fetchEvents(30)).rejects.toThrow(EonetUpstreamError);
      await expect(client.fetchEvents(30)).rejects.toMatchObject({
        code: "upstream_unavailable",
      });
    });

    it("throws malformed error on invalid JSON structure", async () => {
      const malformedResponse = {
        title: "EONET Events",
        // Missing required fields
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(malformedResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new EonetClient({ baseUrl: "https://mock.eonet" });

      try {
        await client.fetchEvents(30);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(EonetUpstreamError);
        if (error instanceof EonetUpstreamError) {
          expect(error.code).toBe("malformed");
        }
      }
    });

    it("retries on 5xx errors up to maxRetries", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response("Server Error", { status: 500 }));

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 2,
        retryDelayMs: 1,
      });

      await expect(client.fetchEvents(30)).rejects.toThrow(EonetUpstreamError);

      // Initial attempt + 2 retries = 3 calls
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it("retries on 429 errors", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response("Rate Limited", { status: 429 }));

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 1,
        retryDelayMs: 1,
      });

      await expect(client.fetchEvents(30)).rejects.toThrow(EonetUpstreamError);

      // Initial attempt + 1 retry = 2 calls
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("does not retry on malformed responses", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ invalid: "data" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 2,
      });

      await expect(client.fetchEvents(30)).rejects.toThrow(EonetUpstreamError);

      // Only 1 call - no retries on malformed
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("succeeds after transient failures", async () => {
      const mockResponse = {
        title: "EONET Events",
        description: "Natural events from EONET.",
        link: "https://eonet.gsfc.nasa.gov/api/v3/events",
        events: [],
      };

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("Server Error", { status: 500 }))
        .mockResolvedValueOnce(new Response("Server Error", { status: 500 }))
        .mockResolvedValue(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 2,
        retryDelayMs: 1,
      });

      const result = await client.fetchEvents(30);

      expect(result.events).toHaveLength(0);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it("provides user-friendly error messages", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Server Error", { status: 500 }),
      );

      const client = new EonetClient({
        baseUrl: "https://mock.eonet",
        maxRetries: 0,
      });

      try {
        await client.fetchEvents(30);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(EonetUpstreamError);
        if (error instanceof EonetUpstreamError) {
          expect(error.userMessage).toContain("temporarily unavailable");
          expect(error.userMessage).toContain("try again");
        }
      }
    });
  });
});
