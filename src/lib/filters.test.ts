import { describe, expect, it } from "vitest";
import {
  filterEventsByCategories,
  getCategoriesFromEvents,
  getCategoryTitlesFromEvents,
} from "./filters";
import type { ShapedEvent } from "@/server/eonet/types";
import { deriveRegion } from "@/server/regions/lookup";

const makeEvent = (id: string, categoryId: string, categoryTitle?: string): ShapedEvent => ({
  id,
  title: `Event ${id}`,
  description: null,
  link: "https://example.com",
  categoryId,
  categoryTitle: categoryTitle || categoryId,
  closed: false,
  latest: {
    coordinates: [0, 0],
    date: "2026-11-01T00:00:00Z",
    magnitude: null,
  },
  historyLength: 1,
  historyTrimmed: false,
  region: deriveRegion([0, 0]),
  earliestDate: "2026-11-01T00:00:00Z",
});

const events: ShapedEvent[] = [
  makeEvent("1", "wildfires"),
  makeEvent("2", "earthquakes"),
  makeEvent("3", "floods"),
  makeEvent("4", "wildfires"),
];

describe("filterEventsByCategories", () => {
  it("returns all events when no categories are selected", () => {
    expect(filterEventsByCategories(events, [])).toEqual(events);
  });

  it("returns only events matching selected categories", () => {
    const result = filterEventsByCategories(events, ["wildfires"]);
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.categoryId === "wildfires")).toBe(true);
  });

  it("returns events matching any selected category", () => {
    const result = filterEventsByCategories(events, ["wildfires", "floods"]);
    expect(result).toHaveLength(3);
  });

  it("returns empty array when no events match", () => {
    const result = filterEventsByCategories(events, ["volcanoes"]);
    expect(result).toEqual([]);
  });
});

describe("getCategoriesFromEvents", () => {
  it("returns unique categories from events", () => {
    const categories = getCategoriesFromEvents(events);
    expect(categories).toEqual(["wildfires", "earthquakes", "floods"]);
  });

  it("returns empty array when no events", () => {
    expect(getCategoriesFromEvents([])).toEqual([]);
  });
});

describe("getCategoryTitlesFromEvents", () => {
  it("builds a mapping from category ID to title", () => {
    const eventsWithTitles = [
      makeEvent("1", "wildfires", "Wildfires"),
      makeEvent("2", "earthquakes", "Earthquakes"),
    ];
    const titles = getCategoryTitlesFromEvents(eventsWithTitles);
    expect(titles).toEqual({
      wildfires: "Wildfires",
      earthquakes: "Earthquakes",
    });
  });

  it("returns empty object when no events", () => {
    expect(getCategoryTitlesFromEvents([])).toEqual({});
  });
});
