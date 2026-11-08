import type { ShapedEvent } from "@/server/eonet/types";

export interface MapFeatureProperties {
  id: string;
  title: string;
  categoryId: string;
  categoryTitle: string;
}

export interface MapFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: MapFeatureProperties;
}

export interface MapFeatureCollection {
  type: "FeatureCollection";
  features: MapFeature[];
}

/**
 * Transforms shaped Events into a GeoJSON FeatureCollection for MapLibre.
 * Each Event becomes a Point feature at its latest coordinates.
 */
export function eventsToGeoJSON(events: ShapedEvent[]): MapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: event.latest.coordinates,
      },
      properties: {
        id: event.id,
        title: event.title,
        categoryId: event.categoryId,
        categoryTitle: event.categoryTitle,
      },
    })),
  };
}
