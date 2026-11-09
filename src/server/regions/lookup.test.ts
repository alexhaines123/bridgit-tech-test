import { describe, expect, it } from "vitest";
import { deriveRegion, REGION_UNKNOWN, REGION_BOUNDS } from "./lookup";

describe("deriveRegion", () => {
  // --- Landmasses ---

  it("returns Africa for coordinates in central Africa", () => {
    // Nairobi, Kenya
    expect(deriveRegion([36.8, -1.3])).toBe("Africa");
  });

  it("returns Europe for coordinates in western Europe", () => {
    // Paris, France
    expect(deriveRegion([2.3, 48.9])).toBe("Europe");
  });

  it("returns Asia for coordinates in eastern Asia", () => {
    // Tokyo, Japan
    expect(deriveRegion([139.7, 35.7])).toBe("Asia");
  });

  it("returns Asia for coordinates in the Russian Far East (antimeridian wrap)", () => {
    // Anadyr, Russia (west of the antimeridian in western hemisphere coords)
    expect(deriveRegion([-177.5, 64.7])).toBe("Asia");
  });

  it("returns North America for coordinates in the continental US", () => {
    // Denver, Colorado
    expect(deriveRegion([-104.9, 39.7])).toBe("North America");
  });

  it("returns North America for coordinates in Central America", () => {
    // Guatemala City
    expect(deriveRegion([-90.5, 14.6])).toBe("North America");
  });

  it("returns South America for coordinates in Brazil", () => {
    // São Paulo, Brazil
    expect(deriveRegion([-46.6, -23.5])).toBe("South America");
  });

  it("returns Oceania for coordinates in eastern Australia", () => {
    // Sydney, Australia
    expect(deriveRegion([151.2, -33.9])).toBe("Oceania");
  });

  it("returns Oceania for coordinates in New Zealand", () => {
    // Wellington, New Zealand
    expect(deriveRegion([174.8, -41.3])).toBe("Oceania");
  });

  it("returns Antarctica for coordinates on the Antarctic continent", () => {
    // McMurdo Station, Antarctica
    expect(deriveRegion([166.7, -77.8])).toBe("Antarctica");
  });

  // --- Oceans ---

  it("returns Atlantic Ocean for coordinates in the mid-Atlantic", () => {
    // Mid-Atlantic, between Africa and South America
    expect(deriveRegion([-30, 0])).toBe("Atlantic Ocean");
  });

  it("returns Indian Ocean for coordinates in the central Indian Ocean", () => {
    // Central Indian Ocean
    expect(deriveRegion([75, -10])).toBe("Indian Ocean");
  });

  it("returns Pacific Ocean for coordinates in the central Pacific", () => {
    // Mid-Pacific at the equator (open ocean, far from any island)
    expect(deriveRegion([-150, 10])).toBe("Pacific Ocean");
  });

  it("returns Pacific Ocean for coordinates west of the antimeridian", () => {
    // Western Pacific, east of the Philippines (open water)
    expect(deriveRegion([160, 10])).toBe("Pacific Ocean");
  });

  it("returns Pacific Ocean for coordinates east of the antimeridian", () => {
    // East Pacific near Hawaii
    expect(deriveRegion([-155, 20])).toBe("Pacific Ocean");
  });

  it("returns Arctic Ocean for coordinates in the high Arctic", () => {
    // North of Greenland
    expect(deriveRegion([-30, 82])).toBe("Arctic Ocean");
  });

  // --- Border / edge cases ---

  it("returns Africa for coordinates on the Africa/Europe latitude boundary", () => {
    // On the exact Africa latitude boundary (lat = 37)
    expect(deriveRegion([10, 37])).toBe("Africa");
  });

  it("returns Africa for coordinates near the Africa/Atlantic boundary", () => {
    // Just off the west coast of Africa — within the Africa box
    expect(deriveRegion([-15, 10])).toBe("Africa");
  });

  it("returns Asia/Pacific correctly near the boundary", () => {
    // Manila, Philippines — land in Asia
    expect(deriveRegion([121, 14.5])).toBe("Asia");
    // Open Pacific east of Asia (east of lon 145)
    expect(deriveRegion([150, 15])).toBe("Pacific Ocean");
  });

  it("returns South America/Atlantic correctly near the boundary", () => {
    // Just off Brazil's east coast — within South America box
    expect(deriveRegion([-35, -10])).toBe("South America");
    // Further east into the Atlantic
    expect(deriveRegion([-25, -10])).toBe("Atlantic Ocean");
  });

  // --- Fallback ---

  it("returns Unknown for NaN coordinates", () => {
    expect(deriveRegion([NaN, 0])).toBe(REGION_UNKNOWN);
    expect(deriveRegion([0, NaN])).toBe(REGION_UNKNOWN);
  });

  it("returns Unknown for Infinity coordinates", () => {
    expect(deriveRegion([Infinity, 0])).toBe(REGION_UNKNOWN);
    expect(deriveRegion([0, -Infinity])).toBe(REGION_UNKNOWN);
  });

  it("returns Unknown for out-of-range coordinates", () => {
    expect(deriveRegion([200, 0])).toBe(REGION_UNKNOWN);
    expect(deriveRegion([-200, 0])).toBe(REGION_UNKNOWN);
    expect(deriveRegion([0, 100])).toBe(REGION_UNKNOWN);
    expect(deriveRegion([0, -100])).toBe(REGION_UNKNOWN);
  });

  // --- All bounds produce valid Region values ---

  it("every bounding box center produces a known Region value", () => {
    for (const box of REGION_BOUNDS) {
      const centerLon = (box.lonMin + box.lonMax) / 2;
      const centerLat = (box.latMin + box.latMax) / 2;
      const result = deriveRegion([centerLon, centerLat]);
      expect(result).not.toBe(REGION_UNKNOWN);
      expect(typeof result).toBe("string");
    }
  });

  // --- Edge cases near boundaries ---

  it("returns Africa for coordinates in North Africa (near Mediterranean)", () => {
    // Tripoli, Libya
    expect(deriveRegion([13.2, 32.9])).toBe("Africa");
  });

  it("returns Europe for coordinates in southern Europe", () => {
    // Rome, Italy
    expect(deriveRegion([12.5, 41.9])).toBe("Europe");
  });

  it("returns Indian Ocean for coordinates in the southern Indian Ocean", () => {
    // Southern Indian Ocean, well south of India
    expect(deriveRegion([70, -10])).toBe("Indian Ocean");
  });
});
