import { describe, expect, it } from "vitest";
import { eonetResponseSchema } from "./schema";

describe("eonetResponseSchema", () => {
  it("validates a minimal valid response", () => {
    const raw = {
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

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(true);
  });

  it("rejects a response missing required fields", () => {
    const raw = {
      title: "EONET Events",
      // Missing description, link, events
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it("rejects an event with no categories", () => {
    const raw = {
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
          categories: [], // Empty - should fail
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

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it("rejects an event with no geometry", () => {
    const raw = {
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
          geometry: [], // Empty - should fail
        },
      ],
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it("rejects a geometry with wrong type", () => {
    const raw = {
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
              type: "Polygon", // Wrong type - should fail
              coordinates: [0, 0],
            },
          ],
        },
      ],
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it("accepts null magnitude values", () => {
    const raw = {
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

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(true);
  });

  it("accepts numeric magnitude values", () => {
    const raw = {
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
              magnitudeValue: 100.5,
              magnitudeUnit: "acres",
              date: "2025-01-01T00:00:00Z",
              type: "Point",
              coordinates: [0, 0],
            },
          ],
        },
      ],
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.events[0].geometry[0].magnitudeValue).toBe(100.5);
      expect(result.data.events[0].geometry[0].magnitudeUnit).toBe("acres");
    }
  });
});
