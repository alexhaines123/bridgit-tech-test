import { describe, expect, it } from "vitest";
import { eventsToGeoJSON } from "./map-utils";
import type { ShapedEvent } from "@/server/eonet/types";
import { deriveRegion } from "@/server/regions/lookup";

const makeEvent = (
  id: string,
  categoryId: string,
  lon: number,
  lat: number,
): ShapedEvent => ({
  id,
  title: `Event ${id}`,
  description: null,
  link: "https://example.com",
  categoryId,
  categoryTitle: categoryId,
  closed: false,
  latest: {
    coordinates: [lon, lat],
    date: "2026-11-01T00:00:00Z",
    magnitude: null,
  },
  historyLength: 1,
  historyTrimmed: false,
  region: deriveRegion([lon, lat]),
  earliestDate: "2026-11-01T00:00:00Z",
});

describe("eventsToGeoJSON", () => {
  it("creates a FeatureCollection from events", () => {
    const events = [
      makeEvent("1", "wildfires", -120, 40),
      makeEvent("2", "earthquakes", 140, 35),
    ];

    const geojson = eventsToGeoJSON(events);

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2);
  });

  it("places each event at its latest coordinates", () => {
    const events = [makeEvent("1", "wildfires", -120.5, 40.5)];

    const geojson = eventsToGeoJSON(events);

    expect(geojson.features[0].geometry.type).toBe("Point");
    expect(geojson.features[0].geometry.coordinates).toEqual([-120.5, 40.5]);
  });

  it("includes event properties for popup rendering", () => {
    const events = [makeEvent("1", "wildfires", 0, 0)];
    const geojson = eventsToGeoJSON(events);

    expect(geojson.features[0].properties?.id).toBe("1");
    expect(geojson.features[0].properties?.categoryId).toBe("wildfires");
    expect(geojson.features[0].properties?.title).toBe("Event 1");
  });

  it("returns empty FeatureCollection for no events", () => {
    const geojson = eventsToGeoJSON([]);
    expect(geojson.features).toHaveLength(0);
  });
});
