# Design direction for Planet Watch

This folder captures the visual direction for the Planet Watch dashboard before any UI code is written. Everything here is approved by the owner and frozen as the reference for later tickets.

## Contents

```
docs/design/
├── mockups/
│   ├── desktop-dashboard.jpg    — Full dashboard on a wide viewport
│   ├── mobile-dashboard.jpg     — Same dashboard on a phone layout
│   └── awkward-states.jpg       — Loading, empty, error, stale-data and AI-degraded states
├── theme-tokens.md              — Palette, type scale, spacing, radii, shadows, motion
├── categories.md                — Per-Category colour + shape + label rules
└── design-direction.md          — This file; the owner-approved decision record
```

The companion architecture decision for the map library lives in `docs/adr/0005-maplibre-gl-js-for-maps.md`.

## What was decided

1. **Map library**: MapLibre GL JS, wrapped in `react-map-gl`. Reason and consequences are in ADR 0005.
2. **Theme tokens**: The MUI theme in `src/lib/theme.ts` implements the tokens documented in `theme-tokens.md`. Category colours are registered as custom tokens on the theme so components always pull from one source of truth.
3. **Category colours**: Every EONET Category has a colour, a shape glyph, and a text label. Colour alone is never the only channel (see `categories.md` for the full table and the accessibility rationale).

## Mockup summary

> The mockup images predate ADR 0006 and still show the Planetary Stress Index gauge. That gauge is deferred: the sidebar goes Window selector → Category chips → Briefing card → chart, and the Briefing card holds one paragraph that reads the chart's Measurement.

### Desktop (desktop-dashboard.jpg)

- Dark background (`#0d1117`) with the map taking the full left two-thirds.
- Right sidebar, top to bottom: Window selector (7d / 30d / 90d pills), Category filter chips, Planetary Stress Index gauge *(deferred by ADR 0006)*, Briefing card, chart.
- Bottom panel: scrollable event list with a coloured left border per Category.
- Map markers use the Category colour and a small shape glyph in the centre.

### Mobile (mobile-dashboard.jpg)

- Single column, map pinned to the top.
- Window selector becomes a horizontal pill bar directly under the app header.
- Category chips sit in a horizontally scrollable row.
- Stress Index *(deferred by ADR 0006)*, Briefing, chart and event list stack vertically beneath the map.
- Cards use full-width with the same border and padding rules as desktop.

### Awkward states (awkward-states.jpg)

Five states are shown side by side:

1. **Loading** — skeleton shimmer placeholders where the map, list and briefing will render.
2. **Empty** — friendly message ("No events in this window") with a globe illustration and a suggestion to widen the Window.
3. **Error** — red error card with the failure reason and a Retry button.
4. **Stale-data banner** — amber banner pinned to the top of the viewport reading "Showing cached data from N ago — live data unavailable".
5. **AI-degraded** — map, chart and Stress Index *(deferred by ADR 0006)* remain fully interactive; the Briefing panel is replaced by an inline "AI temporarily unavailable" message with a Retry button.

## Acceptance criteria check

| Criterion | Status | Where to find it |
|---|---|---|
| Mockups for desktop and mobile covering the map, Event list, Category chips, Window selector, chart, Briefing and Planetary Stress Index panels | ✅ | `mockups/desktop-dashboard.jpg`, `mockups/mobile-dashboard.jpg` |
| Mockups for loading, empty, error, stale-data banner and AI-degraded states | ✅ | `mockups/awkward-states.jpg` |
| Map library chosen and reason recorded | ✅ | `docs/adr/0005-maplibre-gl-js-for-maps.md` |
| Theme tokens defined (palette, type scale, spacing, one colour per Category) | ✅ | `theme-tokens.md`, `categories.md`, `src/lib/theme.ts` |
| Category colours distinguishable without colour alone and meet contrast guidance | ✅ | `categories.md` (shape + label + colour, contrast ratios per Category) |
| Mockups and decisions saved in the repo | ✅ | `docs/design/` |
| Owner has reviewed and approved the direction | ✅ | Owner picked MapLibre GL JS; mockups and tokens reviewed below |
