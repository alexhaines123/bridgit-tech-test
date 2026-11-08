# MapLibre GL JS for maps

We chose **MapLibre GL JS** over Leaflet for the interactive map on the dashboard. Both libraries are open-source and support dark basemaps, but MapLibre GL JS better fits the "mission control" aesthetic and the event-density story the dashboard tells.

## Shortlist

| Criterion | MapLibre GL JS | Leaflet |
|---|---|---|
| Rendering | GPU-accelerated WebGL2 (vector tiles, custom layers) | DOM-based raster tiles (Canvas for vector plugin) |
| Dark basemaps | Native dark styles (e.g. `demotiles` dark, MapTiler dark) — smooth, crisp at all zoom | Raster dark tiles exist but blur when zoomed; no subpixel interpolation |
| Marker clusters | `@mapbox/supercluster` integrates natively; handles thousands of points | MarkerCluster plugin works but DOM cost grows with marker count |
| Custom layers | `addLayer` with expressions, heatmap, circle, fill — all GPU-accelerated | Custom layers via L.Canvas or Leaflet.heatmap; slower at scale |
| 3D / terrain | Built-in terrain and pitch controls | Requires third-party plugins (e.g. deck.gl overlay) |
| Bundle size | ~200 kB gzipped | ~45 kB gzipped |
| License | BSD-3 | BSD-2 |

## Decision

MapLibre GL JS wins on the two criteria that matter most for this dashboard:

1. **Visual quality on a dark theme.** GPU-rendered vector tiles stay crisp at every zoom level, while Leaflet's raster tiles blur. The "mission control" look depends on that crispness.
2. **Expressive event markers.** MapLibre's `circle` and `heatmap` layers with data-driven styling (colour from the Category token, radius from magnitude, opacity from recency) let us encode three dimensions on one map without a separate legend for each. Leaflet can do this with plugins, but at the cost of DOM nodes and render time.

The ~150 kB larger bundle is acceptable for a dashboard that already loads MUI, Recharts and the AI SDK.

## Consequences

- The map component uses `react-map-gl` (v8+) with `maplibre` as the `mapLib` prop. This wraps MapLibre GL JS in React-friendly hooks.
- Basemap style URL lives in an env variable (`NEXT_PUBLIC_MAP_STYLE`) so the demo can use MapLibre's free demotiles and a production deploy can swap to a MapTiler or self-hosted style without a code change.
- Category colours from the theme tokens are passed to the map layer's `circle-color` expression, keeping map and chip colours in sync.
- If bundle size becomes a concern later, switching the renderer to a lighter tile-only view is a component-level change; the data pipeline and Category tokens are independent of the map library.
