/**
 * Region: a coarse part of the world (a continent or ocean) that an Event
 * is placed in from its coordinates.
 *
 * The lookup uses a documented coarse bounding-box approach. Coordinates
 * are mapped to one of the regions defined in REGION_BOUNDS. If no region
 * matches, the explicit fallback REGION_UNKNOWN is returned.
 */

/**
 * All possible Region values. The "Unknown" region is the explicit fallback
 * for positions that match no known bounding box.
 */
export const REGION_UNKNOWN = "Unknown" as const;

export const REGIONS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
  "Arctic Ocean",
  "Atlantic Ocean",
  "Indian Ocean",
  "Pacific Ocean",
  REGION_UNKNOWN,
] as const;

export type Region = (typeof REGIONS)[number];

/**
 * A bounding box for a Region, expressed in longitude/latitude degrees.
 * Longitude: -180 to 180. Latitude: -90 to 90.
 * Coordinates are [lon, lat] (GeoJSON order).
 */
interface RegionBounds {
  region: Region;
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
}

/**
 * Documented coarse Region lookup table.
 *
 * Regions are simplified bounding boxes covering major landmasses and oceans.
 * The boxes are ordered so that land checks come before the surrounding
 * ocean checks, giving landmasses priority (e.g. the Mediterranean is
 * Europe/Africa, not Atlantic Ocean).
 *
 * Coordinates outside every box fall through to REGION_UNKNOWN.
 *
 * Notes:
 * - Antarctica covers everything south of 60°S.
 * - Arctic Ocean covers everything north of 75°N.
 * - Southern Ocean covers 60°S to 90°S outside Antarctica's landmass
 *   (approximated as lon outside -180..180 is not used — landmass is
 *   covered by Antarctica box for simplicity).
 * - Ocean boxes are ordered after land boxes so that coastal events
 *   resolve to the nearest land Region first.
 */
export const REGION_BOUNDS: readonly RegionBounds[] = [
  // --- Landmasses (checked first so coastal events resolve to land) ---
  { region: "Africa", lonMin: -20, lonMax: 55, latMin: -35, latMax: 37 },
  { region: "Europe", lonMin: -12, lonMax: 45, latMin: 35, latMax: 72 },
  { region: "Asia", lonMin: 45, lonMax: 145, latMin: 0, latMax: 75 },
  // Asia wraps across the antimeridian: the Russian Far East / Chukotka peninsula
  { region: "Asia", lonMin: -180, lonMax: -169, latMin: 60, latMax: 75 },
  { region: "North America", lonMin: -140, lonMax: -50, latMin: 15, latMax: 75 },
  // Central America / Caribbean bridge
  { region: "North America", lonMin: -95, lonMax: -77, latMin: 7, latMax: 25 },
  { region: "South America", lonMin: -82, lonMax: -34, latMin: -56, latMax: 13 },
  { region: "Oceania", lonMin: 110, lonMax: 180, latMin: -50, latMax: 0 },
  // Oceania wraps across the antimeridian for Pacific islands (Fiji, Samoa, etc.)
  // Narrowed to lat -30 to -5 to avoid capturing open ocean at the equator
  { region: "Oceania", lonMin: -180, lonMax: -130, latMin: -30, latMax: -5 },
  { region: "Antarctica", lonMin: -180, lonMax: 180, latMin: -90, latMax: -60 },

  // --- Oceans (checked after land so coastal events don't fall into water) ---
  { region: "Arctic Ocean", lonMin: -180, lonMax: 180, latMin: 75, latMax: 90 },
  { region: "Atlantic Ocean", lonMin: -70, lonMax: 20, latMin: -60, latMax: 72 },
  { region: "Indian Ocean", lonMin: 20, lonMax: 120, latMin: -60, latMax: 30 },
  { region: "Pacific Ocean", lonMin: 120, lonMax: 180, latMin: -60, latMax: 75 },
  { region: "Pacific Ocean", lonMin: -180, lonMax: -70, latMin: -60, latMax: 75 },
];

// Note: Everything south of 60°S is classified as Antarctica in this coarse
// lookup. The Southern Ocean (waters surrounding Antarctica) is not distinguished
// separately. This is a documented simplification for the bounding-box approach.

/**
 * Derives a Region from longitude/latitude coordinates using the documented
 * coarse bounding-box lookup. Coordinates are [lon, lat] (GeoJSON order).
 *
 * Returns REGION_UNKNOWN when no bounding box matches.
 */
export function deriveRegion(coordinates: [number, number]): Region {
  const [lon, lat] = coordinates;

  // Guard against out-of-range inputs
  if (!isFinite(lon) || !isFinite(lat)) {
    return REGION_UNKNOWN;
  }
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    return REGION_UNKNOWN;
  }

  for (const box of REGION_BOUNDS) {
    if (
      lon >= box.lonMin &&
      lon <= box.lonMax &&
      lat >= box.latMin &&
      lat <= box.latMax
    ) {
      return box.region;
    }
  }

  return REGION_UNKNOWN;
}
