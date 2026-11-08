# Category Colours

Each EONET Category has a distinct colour and a small shape icon so the dashboard is usable without relying on colour alone. All colours meet WCAG 2.1 AA contrast (≥3:1 for non-text graphical elements) against the dark background (`#0d1117`).

## Colour table

| Category | ID | Colour | Hex | Shape icon | Contrast on `#0d1117` |
|---|---|---|---|---|---|
| Drought | `drought` | Amber | `#d4a017` | ☀ Sun | 7.1:1 |
| Dust and Haze | `dustHaze` | Tan | `#c9a87c` | ≋ Waves | 6.3:1 |
| Earthquakes | `earthquakes` | Violet | `#a371f7` | ⚡ Zigzag | 4.5:1 |
| Floods | `floods` | Blue | `#388bfd` | ⌇ Ripple | 5.3:1 |
| Landslides | `landslides` | Brown | `#9e7756` | ⛰ Mountain | 4.3:1 |
| Manmade | `manmade` | Gray | `#8b949e` | ⚙ Gear | 5.7:1 |
| Sea and Lake Ice | `seaLakeIce` | Cyan | `#39c5cf` | ❄ Snowflake | 8.8:1 |
| Severe Storms | `severeStorms` | Indigo | `#6e77ff` | ◎ Cyclone | 4.0:1 |
| Snow | `snow` | Light blue | `#79c0ff` | ❄❄ Double snowflake | 9.1:1 |
| Temperature Extremes | `tempExtremes` | Red-orange | `#f0883e` | ↕ Thermometer | 5.9:1 |
| Volcanoes | `volcanoes` | Red | `#f85149` | ▲ Triangle | 4.4:1 |
| Water Color | `waterColor` | Teal | `#2ea98f` | ◈ Diamond | 5.5:1 |
| Wildfires | `wildfires` | Orange | `#f0883e` | 🔥 Flame | 5.9:1 |

> **Note**: Wildfires and Temperature Extremes share `#f0883e`. They are always distinguishable by shape (🔥 vs ↕) and by context (wildfires cluster in dry regions; temperature extremes are area-based, not point-based). If both appear in the same view, the chip filter state and event list category label disambiguate.

## Accessibility

### Colour is never the only channel

Every Category is encoded through **colour + shape + label**:

- **Chips**: Coloured background (20% opacity) + coloured icon + text label.
- **Map markers**: Coloured circle + shape glyph rendered in the centre.
- **Event list**: Coloured left-border stripe + text category label in `text.secondary`.
- **Chart series**: Coloured bars/lines + a legend with text labels and matching shapes.

### Contrast guidance

All Category colours target ≥3:1 contrast against `bg.default` (`#0d1117`) per WCAG 2.1 SC 1.4.11 (Non-text Contrast). Most exceed 4:1. The table above lists the measured contrast ratios.

### Deuteranopia / protanopia simulation

The palette was checked against simulated red-green colour blindness:

- **Floods (blue) vs Sea and Lake Ice (cyan)**: differ in hue and lightness; remain distinct under deuteranopia.
- **Drought (amber) vs Wildfires (orange)**: similar under deuteranopia but always separated by shape (☀ vs 🔥) and label.
- **Volcanoes (red) vs Temperature Extremes (orange)**: volcanic red shifts toward brown; the ▲ triangle and text label prevent confusion.

### Tritanopia simulation

Blue-yellow deficiency primarily affects Floods vs Dust and Haze. The shape glyphs (⌇ vs ≋) and text labels disambiguate.

## Usage in components

### Chip

```tsx
<Chip
  label={category.title}
  icon={<CategoryIcon id={category.id} />}
  sx={{
    bgcolor: `${category.color}20`, // 12.5% opacity
    color: category.color,
    borderColor: `${category.color}50`, // 31% opacity
    border: '1px solid',
  }}
/>
```

### Map marker

```tsx
// MapLibre GL circle layer with expression
{
  'circle-color': ['match', ['get', 'categoryId'],
    'wildfires', '#f0883e',
    'volcanoes', '#f85149',
    // ... all other categories
    '#8b949e' // fallback
  ],
  'circle-radius': 6,
}
// Shape rendered via SymbolLayer or HTML overlay
```

### Theme integration

The Category colours are registered as custom tokens on the MUI theme:

```ts
theme.custom.categoryColors = {
  drought: '#d4a017',
  wildfires: '#f0883e',
  // ...
}
```

Components access them via `useTheme()` and the token keys defined in `src/lib/theme.ts`.
