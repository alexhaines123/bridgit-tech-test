import type { EonetResponse } from "./schema";

/**
 * A trimmed real fixture from EONET API (https://eonet.gsfc.nasa.gov/api/v3/events?days=30).
 * Contains 3 events with varying geometry counts to test trimming and window filtering.
 */
export const realEonetFixture: EonetResponse = {
  events: [
    {
      id: "EONET_2736",
      title: "Iceberg B22A",
      description: null,
      link: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_2736",
      closed: null,
      categories: [
        {
          id: "seaLakeIce",
          title: "Sea and Lake Ice",
        },
      ],
      geometry: [
        // 45+ entries in real data; trimmed to 15 for test fixture
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-03-26T00:00:00Z",
          coordinates: [-178.6, -70.7],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-05-08T00:00:00Z",
          coordinates: [-179.72, -70.31],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-05-15T00:00:00Z",
          coordinates: [178.75, -70.08],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-05-29T00:00:00Z",
          coordinates: [177.27, -69.7],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-06-12T00:00:00Z",
          coordinates: [175.86, -69.97],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-06-18T00:00:00Z",
          coordinates: [174.59, -69.77],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-07-03T00:00:00Z",
          coordinates: [174.74, -69.18],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-07-30T00:00:00Z",
          coordinates: [172.86, -69.01],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-08-20T00:00:00Z",
          coordinates: [171.19, -69.24],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-09-04T00:00:00Z",
          coordinates: [167.34, -69.79],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-09-10T00:00:00Z",
          coordinates: [164.79, -69.88],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2026-11-06T00:00:00Z",
          coordinates: [163.59, -69.59],
        },
        // Older entries (would be trimmed)
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2025-11-28T00:00:00Z",
          coordinates: [-178.57, -70.25],
        },
        {
          magnitudeValue: 725.0,
          magnitudeUnit: "NM^2",
          date: "2025-10-31T00:00:00Z",
          coordinates: [-177.22, -70.62],
        },
      ],
    },
    {
      id: "EONET_26057",
      title: "Wildfire Wild River, Coos, New Hampshire",
      description: "5 Miles SW from Shelburne, NH",
      link: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_26057",
      closed: null,
      categories: [
        {
          id: "wildfires",
          title: "Wildfires",
        },
      ],
      geometry: [
        {
          magnitudeValue: 982.0,
          magnitudeUnit: "acres",
          date: "2026-11-02T07:58:00Z",
          coordinates: [-71.031283, 44.330583],
        },
      ],
    },
    {
      id: "EONET_25984",
      title: "Prescribed Fire Dry Lake Hills Piles RX, Coconino, Arizona",
      description: null,
      link: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_25984",
      closed: null,
      categories: [
        {
          id: "wildfires",
          title: "Wildfires",
        },
      ],
      geometry: [
        {
          magnitudeValue: 902.0,
          magnitudeUnit: "acres",
          date: "2026-10-30T10:13:00Z",
          coordinates: [-111.616667, 35.266667],
        },
      ],
    },
  ],
};

/**
 * A fixture with an event that has old first-seen date but recent activity.
 * Tests the "recent activity" filter behavior.
 */
export const oldEventWithRecentActivity: EonetResponse = {
  events: [
    {
      id: "EONET_OLD_BUT_ACTIVE",
      title: "Old Event With Recent Activity",
      description: null,
      link: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_OLD_BUT_ACTIVE",
      closed: null,
      categories: [
        {
          id: "volcanoes",
          title: "Volcanoes",
        },
      ],
      geometry: [
        // First seen years ago
        {
          magnitudeValue: 1.0,
          magnitudeUnit: "VEI",
          date: "2020-01-01T00:00:00Z",
          coordinates: [0, 0],
        },
        // But updated recently
        {
          magnitudeValue: 2.0,
          magnitudeUnit: "VEI",
          date: "2026-11-01T00:00:00Z",
          coordinates: [10, 10],
        },
      ],
    },
  ],
};

/**
 * A fixture with an event that has no recent activity.
 * Tests that inactive events are excluded from the window.
 */
export const eventWithNoRecentActivity: EonetResponse = {
  events: [
    {
      id: "EONET_INACTIVE",
      title: "Inactive Event",
      description: null,
      link: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_INACTIVE",
      closed: "2025-01-01T00:00:00Z",
      categories: [
        {
          id: "earthquakes",
          title: "Earthquakes",
        },
      ],
      geometry: [
        {
          magnitudeValue: 5.0,
          magnitudeUnit: "Richter",
          date: "2025-01-01T00:00:00Z",
          coordinates: [0, 0],
        },
      ],
    },
  ],
};
