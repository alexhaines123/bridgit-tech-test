# EONET is the only NASA data source

The app is built on NASA's EONET natural-event tracker alone. We shortlisted EONET and DONKI (space weather), but DONKI requests failed (503s and timeouts, including against NASA's own host) when we probed it on 8 Nov 2026, while EONET answered in about a second. A demo that depends on a failing upstream is a worse risk than a smaller data story, so DONKI is out of scope.

## Consequences

- The backend calls EONET's own host (`eonet.gsfc.nasa.gov`), which needs no NASA API key, so the README explains why none is used. The `api.nasa.gov/EONET` gateway route returned 503 "no healthy upstream" on 8 Nov 2026 while NeoWs through the same gateway worked, so it was rejected as the primary path.
- Magnitude units differ per Category (acres, knots, square nautical miles), so cross-Category magnitude comparisons are not allowed.
- "Open" Events can carry years of position history, so the payload is trimmed before it reaches the AI.
