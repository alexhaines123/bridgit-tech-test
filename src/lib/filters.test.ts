import { describe, expect, it } from "vitest";
import { filterEventsByCategories, getCategoriesFromEvents } from "./filters";
import type { ShapedEvent } from "@/server/eonet/types";

const makeEvent = (id: string, categoryId: string): ShapedEvent => ({
  id,
  title: `Event ${id}`,
  description: null,
  link: "https://example.com",
  categoryId,
  categoryTitle: categoryId,
  closed: false,
  latest: {
    coordinates: [0, 0],
    date: "2026-11-01T00:00:00Z",
    magnitude: null,
  },
  historyLength: 1,
  historyTrimmed: false,
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
