# Theme Tokens

Design tokens for the Planet Watch dark dashboard. The MUI theme in `src/lib/theme.ts` reads these values directly; every component should use theme tokens rather than hard-coded colours or spacing.

## Palette

### Surface colours

| Token | Hex | Usage |
|---|---|---|
| `bg.default` | `#0d1117` | Page background |
| `bg.paper` | `#161b22` | Cards, panels, sidebar |
| `bg.elevated` | `#1c2128` | Popovers, tooltips, dropdowns |
| `bg.subtle` | `#21262d` | Hover states, selected chips |
| `border.default` | `#30363d` | Card borders, dividers |
| `border.subtle` | `#21262d` | In-panel separators |

### Text colours

| Token | Hex | Contrast on `bg.default` | Usage |
|---|---|---|---|
| `text.primary` | `#e6edf3` | 12.6:1 | Body text, headings |
| `text.secondary` | `#8b949e` | 5.7:1 | Captions, descriptions, timestamps |
| `text.disabled` | `#484f58` | 2.7:1 | Inactive controls |
| `text.inverse` | `#0d1117` | — | Text on bright accent backgrounds |

### Accent colours

| Token | Hex | Usage |
|---|---|---|
| `accent.primary` | `#58a6ff` | Links, active states, focus rings |
| `accent.primaryHover` | `#79c0ff` | Link hover |
| `accent.success` | `#3fb950` | Healthy status, positive deltas |
| `accent.warning` | `#d29922` | Stale-data banner, caution |
| `accent.error` | `#f85149` | Error states, destructive actions |
| `accent.info` | `#58a6ff` | Informational badges |

### Semantic colours

| Token | Hex | Usage |
|---|---|---|
| `stale.banner` | `#d29922` | Stale-data banner background (at 15% opacity) + text |
| `stale.bannerText` | `#d29922` | Banner text on the above background |
| `ai.degraded` | `#8b949e` | AI-degraded panel border + text |
| `psi.low` | `#3fb950` | Stress Index 0–33 — deferred with #18 (ADR 0006); the token is on the theme and unused |
| `psi.medium` | `#d29922` | Stress Index 34–66 — deferred with #18 (ADR 0006); unused |
| `psi.high` | `#f85149` | Stress Index 67–100 — deferred with #18 (ADR 0006); unused |

## Type scale

Based on MUI's default typography scale with adjustments for the dark dashboard context.

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `h1` | 2rem (32px) | 700 | 1.2 | Page title ("Planet Watch") |
| `h2` | 1.5rem (24px) | 600 | 1.3 | Panel headings (Briefing, Stress Index) |
| `h3` | 1.25rem (20px) | 600 | 1.4 | Card headings |
| `subtitle1` | 1rem (16px) | 500 | 1.5 | Chart titles, measurement names |
| `body1` | 1rem (16px) | 400 | 1.6 | Body text, briefing paragraphs |
| `body2` | 0.875rem (14px) | 400 | 1.5 | Secondary body, event list items |
| `caption` | 0.75rem (12px) | 400 | 1.4 | Timestamps, chart axis labels, footnotes |
| `overline` | 0.625rem (10px) | 600 | 1.6 | Category chip labels (uppercase, letter-spacing 0.1em) |
| `button` | 0.875rem (14px) | 600 | 1.5 | Button labels, Window selector pills |

## Spacing scale

4px base unit. MUI's `spacing()` function is configured with this scale.

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px (0.25rem) | Gap between chip + icon, inner icon padding |
| `sm` | 8px (0.5rem) | Gap between related chips, inner card padding |
| `md` | 16px (1rem) | Card padding, gap between cards |
| `lg` | 24px (1.5rem) | Panel padding, section gaps |
| `xl` | 32px (2rem) | Page gutter, gap between major sections |
| `2xl` | 48px (3rem) | Top-level section spacing on desktop |

## Border radii

| Token | Value | Usage |
|---|---|---|
| `sm` | 4px | Chips, small badges |
| `md` | 8px | Cards, panels |
| `lg` | 12px | Map container, large panels |
| `full` | 9999px | Pill buttons, circular stress index gauge |

## Shadows

Dark mode uses subtle shadows plus visible borders for elevation:

| Token | Value | Usage |
|---|---|---|
| `elevation.1` | `0 1px 3px rgba(0,0,0,0.4)` | Cards at rest |
| `elevation.2` | `0 4px 12px rgba(0,0,0,0.5)` | Hovered cards, popovers |
| `elevation.3` | `0 8px 24px rgba(0,0,0,0.6)` | Modals, overlays |

## Motion

| Token | Value | Usage |
|---|---|---|
| `duration.fast` | 150ms | Hover states, chip selection |
| `duration.normal` | 250ms | Panel transitions, accordion |
| `duration.slow` | 400ms | Map fly-to, page transitions |
| `easing.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions |
| `easing.decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen |
