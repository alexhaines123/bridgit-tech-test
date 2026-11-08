# Plan: Planet Watch

Draft for approval. Nothing is built until you approve this. Vocabulary follows `GLOSSARY.md`; decisions follow `docs/adr/`.

## How we work

- One phase at a time. At the end of each phase I stop, summarise the files and why they are shaped that way, and wait for your review.
- One commit per approved phase, so the history shows the progression.
- Where a real fork appears, I ask first.
- You create `.env.local` yourself. I never read or write real secret values.

## Proposed decisions that need your approval

1. **tRPC with TanStack Query, two query procedures, not one.** `events.list({ window })` returns real data immediately (map, list, stress score). `briefing.get({ window })` returns the AI parts. The map renders while the AI call (seconds) is still running, and an AI failure cannot block the data. The cost is two queries and two sets of states in the UI.
   - Mounted once at `src/app/api/trpc/[trpc]/route.ts` via the fetch adapter; client hooks come from `@trpc/tanstack-react-query`. Components stay client-side (no server-component prefetching), so the browser-to-backend boundary stays explicit.
   - The client must use `httpLink`, not `httpBatchLink`. A batched request waits for every procedure in it, which would make the map wait for Claude and defeat the split. As a bonus, unbatched URLs are simpler to mock in Playwright.
   - Input validation uses Zod on each procedure. Response types are inferred from the router (`AppRouter`), so there is no hand-written contract to drift.
2. **Errors.** Services throw an `AppError` with a code and a `retryable` flag; a tRPC `errorFormatter` exposes them to the client as `data.appCode` and `data.retryable` (plus Zod issues for bad input). Codes: `INVALID_INPUT`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_RATE_LIMITED`, `AI_UNAVAILABLE`, `AI_INVALID_OUTPUT`, `CACHE_UNAVAILABLE`. Stack traces never reach the client.
3. **Layout** (backend is plain TypeScript; the tRPC routers stay thin):

```
src/app/                 pages + api/trpc/[trpc]/route.ts (fetch adapter only)
src/server/
  trpc/                  init (context, errorFormatter), root router, events + briefing routers
  config/                Zod-validated env
  errors/                AppError + error codes
  cache/                 Cache interface, Redis implementation
  eonet/                 raw schemas + client (timeout, retry, error mapping)
  domain/                events, regions, measurements, stress index (pure functions)
  ai/                    prompt builder, output schema, semantic checks, AI SDK call
  services/              eventsService, briefingService (orchestrate the above)
src/ui/                  theme, components, tRPC client + provider, query hooks
tests/                   unit, integration, e2e
```

## Phases (estimates fit the 3-4 hour budget)

| # | Phase | Delivers | Your review focus |
|---|---|---|---|
| 0 | Repo | `git init`, `.gitignore` covering `.env*`, `.env.example` with placeholders, docs committed, private GitHub repo | Nothing secret is tracked |
| 1 | Scaffold | Next.js + TypeScript, lint/format, `docker-compose.yml` (Redis), Zod env config that fails fast on bad config | Folder layout, config handling |
| 2 | Design | Dark mission-control mockups (map, charts, briefing, states), map library decision, MUI theme tokens | Look and feel; choose map library |
| 3 | EONET client + shaping | Raw EONET schemas, client with timeout/retry/error mapping, normalised `Event` (latest position, trimmed history), Window filter, region lookup | Boundary validation, trimming |
| 4 | Measurements + stress index | Five Measurements and the Planetary Stress Index as pure functions, with unit tests | **You choose the formula weights** |
| 5 | Cache | `Cache` interface, Redis adapter, keys/TTLs, in-flight de-duplication, stale copy for EONET | Failure rule from ADR 0004 |
| 6 | AI orchestration | AI SDK call with one structured request, trimmed input, schema + semantic validation (real Notable Event IDs, known Measurement), one retry, model from env | Prompt, validation, error mapping |
| 7 | tRPC API | Router, `events.list` and `briefing.get` procedures, input validation, `errorFormatter`; integration tests (call the router with MSW upstreams + real Redis) | Procedure shapes, error mapping |
| 8 | Frontend | Page shell, TanStack Query hooks, Window and Category controls, map, list, charts, briefing, stress panel; loading/empty/error/stale/degraded states; keyboard and a11y basics | Component structure, state |
| 9 | E2E (cut first if late) | Playwright with `@msw/playwright` mocking `/api/trpc/*`: happy path, AI degraded, stale banner, error | Scenarios |
| 10 | README | Run locally (Docker), design decisions, assumptions, Jev note, testing view, what next | A new teammate can follow it |

## Known risks to watch

- Map library and Redis-in-Docker add setup weight; Phase 2 and 1 respectively should stay small.
- Open EONET Events carry long position histories; the Window must filter on recent activity, not creation date.
- tRPC's contract is the router's TypeScript types, not a REST spec. The README should list the two procedures, their inputs and their error codes so reviewers can see the API without reading the code.
- AI SDK, MSW and tRPC have recent major versions (AI SDK 7, MSW 3); pin versions and check current docs before use. `@msw/playwright` compatibility with MSW 3 is not yet verified.
- The Anthropic token may need a custom base URL; Phase 6 begins with a smoke call you run yourself.
- NASA gateway upstreams (DONKI, `api.nasa.gov/EONET`) were returning 503s on 8 Nov 2026; EONET direct was healthy. Reassess if that changes.

## Open items deliberately left to phase reviews

Map library (Phase 2), stress formula weights (Phase 4), exact TTLs (Phase 5), prompt wording (Phase 6).
