# Planet Watch

A student-friendly dashboard that turns NASA's live natural-event data into an interactive map, AI-chosen charts and a plain-English briefing. Built for the Bridgit full-stack assessment.

## Running locally

Prerequisites: **Node.js 20+**, **npm**, and **Docker** (for Redis).

```bash
# 1. Clone and install
git clone <repo-url> && cd bridgit-tech-test
npm install

# 2. Start Redis in Docker (matches REDIS_URL=redis://localhost:6379)
docker compose up -d

# 3. Copy the example env file and fill in the secrets
cp .env.example .env.local
#   ANTHROPIC_API_KEY  — the key supplied for the exercise
#   AI_MODEL           — e.g. claude-sonnet-4-6 (verify against your account)
#   REDIS_URL          — already set to redis://localhost:6379

# 4. Start the dev server
npm run dev
```

Then open <http://localhost:3000>.

Verify the stack from a fresh shell:

```bash
# Redis is up
npm run redis:check

# Tests pass (199 tests, no network calls)
npm test

# Types check cleanly
npm run typecheck
```

## Why there is no NASA API key

EONET is free and public; it does not issue API keys. The app hits `https://eonet.gsfc.nasa.gov/api/v3/events?days=<N>` directly from the server, with no authentication header.

This was a deliberate choice, not an oversight. DONKI (space weather) was evaluated as a second data source and rejected after it returned 503s and timeouts on the day of the build — see [ADR 0001: EONET as the only NASA source](docs/adr/0001-eonet-as-the-only-nasa-source.md).

## Design decisions

Six decisions shape the app. Each has a full ADR in [`docs/adr/`](docs/adr/).

| # | Decision | Short rationale | ADR |
|---|---|---|---|
| 1 | EONET only; no DONKI | DONKI was flaky on build day; EONET answered in ~1s | [0001](docs/adr/0001-eonet-as-the-only-nasa-source.md) |
| 2 | Claude via Vercel AI SDK; Jev considered | Model supplied for the exercise; structured output validated with Zod | [0002](docs/adr/0002-claude-via-vercel-ai-sdk-jev-considered.md) |
| 3 | AI judges and explains; server computes every number | Numbers stay reproducible and explainable | [0003](docs/adr/0003-ai-judges-and-explains-server-computes-numbers.md) |
| 4 | Redis is a hard dependency; upstreams degrade gracefully | Stale cache makes EONET failures survivable; no silent bypass | [0004](docs/adr/0004-external-services-degrade-redis-is-a-hard-dependency.md) |
| 5 | MapLibre GL JS (via `react-map-gl`) | GPU-accelerated vector tiles; data-driven expressions | [0005](docs/adr/0005-maplibre-gl-js-for-maps.md) |
| 6 | Planetary Stress Index deferred; Briefing is one chart summary | Parks the largest ticket so the AI phase could ship in budget | [0006](docs/adr/0006-stress-index-deferred-briefing-is-one-chart-summary.md) |

Further design details (theme tokens, Category colour + shape + label channels, dashboard layout, awkward states, MUI patterns) live in [`DESIGN.md`](DESIGN.md).

## The two tRPC procedures

The app exposes exactly two data procedures over `/api/trpc`, both using `httpLink` (no batching — each request is independently visible in the network tab).

### `events`

Fetches live events from EONET, shapes and filters them by Window, computes the five Measurements on the server, and returns them with cache metadata.

**Input:**

```ts
{ windowDays: 7 | 30 | 90 }   // default 30; invalid values (e.g. 15) are rejected
```

**Output (abbreviated):**

```ts
{
  events: ShapedEvent[],           // id, title, description, category, latest coords/date/magnitude, region, etc.
  measurements: MeasurementSummary, // all five server-computed Measurements
  defaultMeasurementId: MeasurementId,
  rawSizeBytes: number,            // before shaping
  shapedSizeBytes: number,         // after geometry trimming + filtering
  totalEventsBeforeFilter: number,
  totalEventsAfterFilter: number,
  stale: boolean,                  // true when served from stale cache
  staleAgeMs?: number,
  cachedAt?: string,
}
```

**Error codes surfaced to the client:**

| Code | When | Retryable |
|---|---|---|
| `upstream_unavailable` | EONET 5xx, network failure | yes |
| `rate_limited` | EONET 429 | yes (honours retry hint) |
| `timeout` | Request exceeded 10s bounded timeout | yes |
| `malformed` | EONET response failed Zod validation | no |
| `cache_unavailable` | Redis unreachable within 3s connect timeout | no (hard error, per ADR 0004) |

### `briefing`

Generates an AI-written paragraph that reads the chosen Measurement, plus the AI's choice of which Measurement to show, with a caption and reason. Uses the same server-computed Measurements, not raw events. Results are cached by input hash.

**Input:**

```ts
{ windowDays: 7 | 30 | 90 }
```

**Output:**

```ts
{
  summary: string,                // plain-English paragraph
  chosenMeasurementId: MeasurementId,
  caption: string,                // chart caption
  reason: string,                 // why this Measurement was chosen
  measurementTitle: string,       // human title for the chosen Measurement
}
```

**Error codes:**

| Code | When | Retryable |
|---|---|---|
| `ai_invalid_output` | Claude's response failed Zod validation or chose an inapplicable Measurement | yes |
| `ai_unavailable` | Claude returned 5xx or network failed | yes |
| `ai_rate_limited` | Claude returned 429 | yes |
| `ai_timeout` | AI call exceeded bounded timeout | yes |
| `cache_unavailable` | Redis unreachable (shared with `events`) | no |

The Briefing is a **soft dependency**: when it fails, the map, event list and chart keep working; only the Briefing card shows an error with a retry.

## Assumptions

- **Browser targets**: modern Evergreen browsers (Chrome, Firefox, Safari, Edge latest two majors). No IE11; MapLibre GL JS requires WebGL2.
- **EONET availability**: the public endpoint is reachable from the server at build and demo time. If it goes down, the stale cache covers it for up to 24 hours.
- **Single-region deployment**: the app is designed for one deployment region; Region lookup is a coordinate-to-continent mapping, not a geo-service call.
- **One user at a time** for the demo. The Redis cache handles concurrent identical requests via request coalescing, but there is no auth, no per-user state, and no horizontal scaling tested.
- **Magnitude semantics**: Magnitudes are Category-specific and never compared across Categories (e.g., wildfire acres vs iceberg square nautical miles). The app enforces this in the UI.
- **Window filter semantics**: "events in the last N days" means events with recent activity, not first-seen date. An event first seen years ago but updated yesterday is included.

## Jev: the considered alternative

[Jev (TypeSafe AI)](https://jev.ai) is a "decision model" that returns typed probabilities instead of text. It was considered for two of the AI's jobs:

- choosing which Measurement is most interesting (a Choice question), and
- rating overall stress (a Score question).

**Why it was not used:**

1. The brief supplies one model (Claude). Reviewers would need a separate TypeSafe key to run the app.
2. Jev cannot write text, so Claude would still be needed for the Briefing — giving two providers and two failure modes inside a 3–4 hour build.
3. Its accuracy figures are self-reported and it is not fully deterministic.

Because AI calls sit behind one service module, a Jev adapter for the decision steps is the first thing to try with more time. The Vercel AI SDK's provider abstraction keeps that change small. See [ADR 0002](docs/adr/0002-claude-via-vercel-ai-sdk-jev-considered.md).

## Testing

### What is tested

**199 tests across 19 files**, all in Vitest with `jsdom` for components and `node` for server code. No real NASA or AI calls in the suite.

| Layer | What is covered |
|---|---|
| EONET client | Success, 5xx, 429, timeout, malformed response, retry logic |
| Shaping & trimming | Geometry trimming, Window filtering, payload size recording |
| Schema validation | Valid/invalid EONET payloads, nullable magnitudes |
| API router (tRPC) | Input validation, shaped output, error surfacing |
| Redis cache | Fresh/stale TTLs, request coalescing, upstream-failure fallback, connect timeout (`integration` test uses a real Redis) |
| Briefing client | Zod schema validation, AI error codes, Measurement choice validation |
| Measurements | Compute logic, applicability check, deterministic default |
| Regions | Coordinate-to-region lookup |
| Env validation | Missing/invalid env vars; error message never includes secret values |
| Components | Category filter, window selector, recent events, dashboard skeleton |
| Map utilities | Geometry helpers |
| Smoke | End-to-end tRPC wiring (health check) |

**Property-style guarantees tested:**
- Error responses contain no stack traces and no secret values.
- Env validation error messages name the offending variable but never include its supplied value.
- Magnitudes are never summed or compared across Categories.

### What is not yet tested

- **End-to-end browser tests** (Playwright with MSW mocking tRPC). Planned in ticket #24, which is blocked by the accessibility pass (#23). The scenarios are designed: happy path, Window change, Category filter, Event details, AI degraded with retry, stale-data banner, error state.
- **Visual regression** — no screenshot baselines yet.
- **Load / soak tests** — the cache's request coalescing is unit-tested but not under concurrent load.

### How testing would grow

1. Land Playwright (#24) with MSW mocks — covers the real UI against deterministic fixtures.
2. Add property-based tests (e.g., `fast-check`) for shaping invariants.
3. Add contract tests between the Briefing client and the Zod schema.
4. Introduce a `coverage/` threshold once Playwright lands, to catch UI regressions.

Run the suite locally:

```bash
npm test            # single run
npm run test:watch  # watch mode
```

## Scaling, rate limits, cost and deployment

### Rate limits

- **EONET**: NASA publishes no formal limit; the community-observed ceiling is ~30 req/min. The app stays well under this via the Redis cache (60s fresh TTL, 24h stale TTL) and bounded retry (2 attempts, 1s delay). A 429 is honoured with its retry hint.
- **Claude (Anthropic)**: per-model TPM/RPM limits apply. The Briefing cache-by-input-hash means the same data never costs a second AI call. Invalid output is retried with a bounded attempt count.

### Cost

- **EONET**: free.
- **Claude**: per-token. The Briefing payload carries Measurement summaries, not raw event text, so token cost per call is small. Switching `AI_MODEL` to a faster/cheaper model is a one-line env change.
- **Redis**: the local Docker container is free; any managed Redis (Upstash, Redis Cloud, ElastiCache) works with a connection string.

### Scaling notes

- The Redis cache is the shared store a multi-instance deployment needs. The `pw:` key prefix avoids collisions if the same instance is shared.
- Request coalescing (in-memory `Map` keyed by Window) is per-instance; under heavy concurrent load, multiple instances may each issue one EONET call per Window before the cache is populated. This is acceptable for the demo and a small change to distributed locking if needed.
- The EONET client's timeout (10s) and Redis connect timeout (3s) are bounded so one slow upstream cannot stall the event loop.
- There is no horizontal auto-scaling, no CDN, no object cache in front of the API. These are natural next steps for production.

### Deployment

The app is a standard Next.js build:

```bash
npm run build
npm start
```

It expects `REDIS_URL`, `ANTHROPIC_API_KEY` and `AI_MODEL` in the environment. `NEXT_PUBLIC_MAP_STYLE` is optional (defaults to MapLibre demo tiles). A container image with Node 20+ and the env vars above is sufficient; no special build step is needed beyond `npm ci && npm run build`.

## What to do next with more time

In priority order, roughly aligned with the open sub-issues on the [tracking issue](../../issues/1):

1. **Planetary Stress Index (#18)** — the factor rubrics, combining formula, rule-based baseline, 0–100 score and gauge UI are all designed (see ADR 0003, ADR 0006). The Briefing already calls into the AI service; adding factor ratings to the same call is the smallest resumable step.
2. **Playwright end-to-end tests (#24)** — deterministic browser scenarios against MSW-mocked tRPC.
3. **Accessibility and responsive pass (#23)** — keyboard/screen-reader, WCAG AA contrast, 360px-to-desktop layout, reduced-motion.
4. **Failure-mode hardening (#22)** — the error taxonomy is designed; the remaining work is the integration tests that prove no stack trace or secret leaks, and the structured logs.
5. **Category filter and Event details** — the UI scaffolding exists; wiring is incremental.
6. **Stale-data banner and AI-degraded states** — the visual designs are approved; the components need to land.
7. **Jev adapter** — add a TypeSafe provider for the Measurement choice and Stress Index ratings behind the existing AI service module.
8. **Distributed locking / cache warming** — for multi-instance deployments.
9. **CDN / object cache** in front of the tRPC endpoint for the Events response.
10. **Observability**: structured logs, OpenTelemetry traces across the EONET → cache → AI path, and a dashboard for cache hit rates and AI call latency.

## Where AI tools were used

Honest note, because the brief asks for one:

- **Code generation and refactoring** — the scaffold, the tRPC wiring, the EONET client, the shaping logic and the Redis cache were drafted with Claude (the same model the app calls at runtime) inside this harness. The ADRs, the error taxonomy, the Window semantics and the decision to reject DONKI are owner-authored.
- **Test authoring** — many of the unit tests were generated from acceptance criteria the owner supplied; the owner reviewed each for intent, not just syntax.
- **Debugging** — several Zod schema iterations and one Redis connect-timeout bug were diagnosed in conversation with the model.
- **Not AI-generated**: the project structure decisions, the ticket breakdown, the review comments on each phase, the GLOSSARY, and every ADR rationale.

Nothing in the submission was submitted without the owner reading and accepting it. If a generated test passed for the wrong reason, that is on the review, not the tool.

## License

Private; submitted for the Bridgit full-stack assessment.
