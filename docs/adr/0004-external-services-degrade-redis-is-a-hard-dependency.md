# External services degrade gracefully; Redis is a hard dependency

Failures in services we do not control (EONET, Claude) are absorbed and shown to the user: an EONET failure serves a stale cached copy with a visible banner, and an AI failure or invalid AI output leaves the map, charts and Stress Index working with an inline error and retry in the AI sections. Redis is our own infrastructure, so if it is unreachable the API returns a clear "service unavailable" error instead of silently bypassing the cache.

The cache holds the stale copy that makes EONET failures survivable, protects the NASA and AI rate limits, and is the shared store a multi-instance deployment needs. Failing fast on its loss keeps one simple rule and avoids a hidden mode where every request hits both upstreams.

## Consequences

- The README requires Docker (compose file provided) to run the app locally.
- If EONET and Redis are both unavailable there is no stale copy, so the user sees an error state.
- A fail-open or in-memory fallback is a small, reversible change if the stricter rule proves too brittle.
