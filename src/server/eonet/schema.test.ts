import { describe, expect, it } from "vitest";
import { eonetResponseSchema } from "./schema";

describe("eonetResponseSchema", () => {
  it("validates a response without unused fields", () => {
    const raw = {
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          geometry: [
            {
              magnitudeValue: null,
              magnitudeUnit: null,
              date: "2025-01-01T00:00:00Z",
              coordinates: [0, 0],
            },
          ],
        },
      ],
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(true);
  });

  it("validates a minimal valid response", () => {
    const raw = {
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          geometry: [
            {
              magnitudeValue: null,
              magnitudeUnit: null,
              date: "2025-01-01T00:00:00Z",
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
      // Missing events
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it("rejects an event with no categories", () => {
    const raw = {
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [], // Empty - should fail
          geometry: [
            {
              magnitudeValue: null,
              magnitudeUnit: null,
              date: "2025-01-01T00:00:00Z",
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
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          geometry: [], // Empty - should fail
        },
      ],
    };

    const result = eonetResponseSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it("accepts null magnitude values", () => {
    const raw = {
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          geometry: [
            {
              magnitudeValue: null,
              magnitudeUnit: null,
              date: "2025-01-01T00:00:00Z",
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
      events: [
        {
          id: "EONET_TEST",
          title: "Test Event",
          description: null,
          link: "https://example.com",
          closed: null,
          categories: [{ id: "wildfires", title: "Wildfires" }],
          geometry: [
            {
              magnitudeValue: 100.5,
              magnitudeUnit: "acres",
              date: "2025-01-01T00:00:00Z",
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
