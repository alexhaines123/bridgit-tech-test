# Planet Watch — Design Decisions

This document summarises the design decisions for Planet Watch. Each section has a short rationale and a link to the detailed source. Decisions here are frozen as of the ticket #14 merge; changes go through a new ADR or a PR comment that updates this file.

---

## 1. Map library: MapLibre GL JS

**Decision:** Use MapLibre GL JS (via `react-map-gl`) for the interactive map.

**Why:** GPU-accelerated vector tiles stay crisp at every zoom on a dark basemap. Leaflet's raster tiles blur when zoomed. MapLibre's `circle` and `heatmap` layers with data-driven expressions let us encode three dimensions (Category colour, magnitude radius, recency opacity) on one map without extra DOM cost.

**Trade-offs acknowledged:**

| Concern | Mitigation |
|---|---|
| ~150 kB larger bundle than Leaflet | Dashboard already loads MUI + Recharts + AI SDK; the map is the core surface so this cost is justified |
| WebGL2 required (no IE11) | Not a concern; target browsers are modern Evergreen |
| Style URL is an env variable | `NEXT_PUBLIC_MAP_STYLE` lets demo and production use different basemaps without code changes |

**See:** [`docs/adr/0005-maplibre-gl-js-for-maps.md`](docs/adr/0005-maplibre-gl-js-for-maps.md)

---

## 2. Theme: dark mode with MUI

**Decision:** MUI `createTheme` with `mode: "dark"`, extended with custom tokens for Category colours, PSI bands, stale-data and AI-degraded states.

**Why:** The spec calls for a dark "mission control" dashboard. MUI's dark palette gives us a consistent component library; custom tokens on the theme object mean every component reads Category colours and semantic states from one source of truth, keeping map markers, chips, chart series and list borders in sync.

**Key tokens (abbreviated):**

| Group | Example tokens | Where defined |
|---|---|---|
| Surface | `bg.default #0d1117`, `bg.paper #161b22` | `src/lib/theme.ts` |
| Text | `text.primary #e6edf3`, `text.secondary #8b949e` | `src/lib/theme.ts` |
| Accent | `primary #58a6ff`, `success #3fb950`, `warning #d29922`, `error #f85149` | `src/lib/theme.ts` |
| Category | `categoryColors.wildfires #f0883e`, … (13 entries) | `src/lib/theme.ts` |
| Semantic | `psi.low/medium/high`, `stale.banner`, `ai.degraded` | `src/lib/theme.ts` |

**See:** [`docs/design/theme-tokens.md`](docs/design/theme-tokens.md), [`src/lib/theme.ts`](src/lib/theme.ts)

---

## 3. Category colours: colour + shape + label

**Decision:** Every EONET Category gets a colour, a small shape glyph, and a text label. Colour is never the only channel.

**Why:** Colour-blind users (deuteranopia/protanopia/tritanopia) cannot distinguish all 13 Category colours. Encoding through three channels — colour, shape, and text label — keeps the map, chips, event list and chart all accessible without adding a legend-per-view.

**Colour choices (sample):**

| Category | Colour | Shape | Contrast on `#0d1117` |
|---|---|---|---|
| Wildfires | `#f0883e` orange | 🔥 flame | 5.9:1 |
| Volcanoes | `#f85149` red | ▲ triangle | 4.4:1 |
| Sea and Lake Ice | `#39c5cf` cyan | ❄ snowflake | 8.8:1 |
| Floods | `#388bfd` blue | ⌇ ripple | 5.3:1 |
| Earthquakes | `#a371f7` violet | ⚡ zigzag | 4.5:1 |

All 13 colours hit ≥3:1 against the dark background (WCAG 2.1 SC 1.4.11). Wildfires and Temperature Extremes share `#f0883e` but are always separated by shape and context.

**See:** [`docs/design/categories.md`](docs/design/categories.md)

---

## 4. Data source: EONET only

**Decision:** NASA EONET is the sole data source. DONKI (space weather) was evaluated and rejected.

**Why:** On 8 Nov 2026, DONKI returned 503s and timeouts even against NASA's own host. EONET answered in ~1 second. A demo that depends on a failing upstream is a worse risk than a smaller data story.

**See:** [`docs/adr/0001-eonet-as-the-only-nasa-source.md`](docs/adr/0001-eonet-as-the-only-nasa-source.md)

---

## 5. AI: Claude via Vercel AI SDK

**Decision:** The AI layer uses Claude through the Vercel AI SDK. Jev was considered but not chosen.

**Why:** Vercel AI SDK gives a stable, well-typed interface for streaming and tool calls. Claude's output quality on the Briefing and Stress Index commentary is strong. The AI always degrades gracefully — if it fails or returns invalid output, the map, chart and Stress Index (server-computed) keep working.

**See:** [`docs/adr/0002-claude-via-vercel-ai-sdk-jev-considered.md`](docs/adr/0002-claude-via-vercel-ai-sdk-jev-considered.md), [`docs/adr/0003-ai-judges-and-explains-server-computes-numbers.md`](docs/adr/0003-ai-judges-and-explains-server-computes-numbers.md)

---

## 6. Resilience: Redis is a hard dependency

**Decision:** Redis is required. If it is unreachable, the API returns 503 instead of silently bypassing the cache. EONET failures serve a stale cached copy with a visible amber banner.

**Why:** The cache is the single point that makes EONET failures survivable and protects rate limits. Failing fast on its loss keeps one simple rule; a fail-open or in-memory fallback is a small reversible change if this proves too strict.

**See:** [`docs/adr/0004-external-services-degrade-redis-is-a-hard-dependency.md`](docs/adr/0004-external-services-degrade-redis-is-a-hard-dependency.md)

---

## 7. Dashboard layout

**Decision:** Desktop uses a two-column layout (map left, sidebar right) with an event list pinned below. Mobile stacks everything vertically with the map pinned to the top.

**Why:** The map is the primary surface — it gets the most space on desktop. The right sidebar groups the controls (Window, Categories) above the output panels (PSI, Briefing, chart) so the user reads top-to-bottom: "what am I looking at?" → "what does it mean?" → "show me the detail". Mobile inverts that by putting the map first, then scrolling down.

**See:** [`docs/design/mockups/desktop-dashboard.jpg`](docs/design/mockups/desktop-dashboard.jpg), [`docs/design/mockups/mobile-dashboard.jpg`](docs/design/mockups/mobile-dashboard.jpg)

---

## 8. Awkward states

**Decision:** Five distinct states are designed up front: loading, empty, error, stale-data banner, and AI-degraded.

**Why:** The spec calls out these states explicitly (ADR 0004). Designing them now means ticket #22 (failure-mode hardening) has a visual target to hit, not an ambiguity to resolve.

| State | Visual treatment |
|---|---|
| Loading | Skeleton shimmer placeholders |
| Empty | Globe illustration + "No events in this window" + widen-Window hint |
| Error | Red card with reason + Retry button |
| Stale data | Amber banner pinned to top: "Showing cached data from N ago" |
| AI degraded | Map, chart, PSI work normally; Briefing replaced with inline "AI temporarily unavailable" + Retry |

**See:** [`docs/design/mockups/awkward-states.jpg`](docs/design/mockups/awkward-states.jpg)

---

## 9. MUI component patterns

**Decision:** Use MUI's `<Stack>` for flex layouts, `<Box>` for sizing and positioning.

**Why:** `<Stack>` is a flex container with built-in spacing, direction, and alignment props. Using it for flex layouts keeps the codebase consistent and avoids repetitive `sx={{ display: "flex" }}` boilerplate. `<Box>` remains available for sizing, positioning, and non-flex containers where `<Stack>`'s flex defaults don't apply.

**Patterns:**

```tsx
// ✅ Vertical or horizontal stack with spacing
<Stack direction="row" spacing={2} alignItems="center">
  <Chip label="Category" />
  <Typography>Label</Typography>
</Stack>

// ✅ Sizing container (no flex children)
<Box sx={{ width: "100%", height: 300 }}>
  <ResponsiveContainer>
    <Chart />
  </ResponsiveContainer>
</Box>

// ❌ Box with display: flex — use Stack instead
<Box sx={{ display: "flex", alignItems: "center" }}>
  <Chip label="Category" />
</Box>
```

---

## Questions for later review

These are the decisions most likely to be challenged. Notes for whoever picks them up:

- **MapLibre vs Leaflet bundle size** — if the app needs to stay under a tight budget, Leaflet with `react-leaflet` and `@vis.gl/react-maplibre` as a progressive upgrade is viable. The data pipeline and Category tokens are independent of the map library.
- **Wildfires / Temperature Extremes colour collision** — both use `#f0883e`. Always separated by shape (🔥 vs ↕) and context (point vs area events). If this causes confusion in user testing, give Temperature Extremes `#f778ba` (magenta) instead.
- **Theme token structure** — custom tokens are on `theme.custom` rather than MUI's built-in slots. This is intentional (avoids fighting MUI's type system) but means `useTheme()` consumers need to know about `theme.custom`. Consider extracting a `useDesignTokens()` hook if more components need them.
- **Basemap style** — currently a free MapLibre demo style. For production, swap `NEXT_PUBLIC_MAP_STYLE` to a MapTiler dark style or self-hosted tiles.
