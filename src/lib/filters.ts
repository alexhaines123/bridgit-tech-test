import type { ShapedEvent } from "@/server/eonet/types";

/**
 * Filters Events by their Category.
 * When selectedCategories is empty, returns all Events (no filter applied).
 */
export function filterEventsByCategories(
  events: ShapedEvent[],
  selectedCategories: string[],
): ShapedEvent[] {
  if (selectedCategories.length === 0) return events;
  const set = new Set(selectedCategories);
  return events.filter((e) => set.has(e.categoryId));
}

/**
 * Extracts unique Category IDs from Events, preserving first-seen order.
 */
export function getCategoriesFromEvents(events: ShapedEvent[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of events) {
    if (!seen.has(e.categoryId)) {
      seen.add(e.categoryId);
      result.push(e.categoryId);
    }
  }
  return result;
}

/**
 * Builds a mapping from Category ID to Category title from Events.
 */
export function getCategoryTitlesFromEvents(
  events: ShapedEvent[],
): Record<string, string> {
  const titles: Record<string, string> = {};
  for (const e of events) {
    if (!titles[e.categoryId]) {
      titles[e.categoryId] = e.categoryTitle;
    }
  }
  return titles;
}
