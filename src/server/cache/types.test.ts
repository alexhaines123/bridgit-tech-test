/**
 * Unit tests for cache TTL constants.
 *
 * These tests pin the expected TTL values and document the rationale
 * behind each choice, so future changes require updating the test
 * (and the rationale comment) rather than silently drifting.
 */

import { describe, expect, it } from "vitest";
import { FRESH_TTL_SECONDS, STALE_TTL_SECONDS } from "./types";

describe("cache TTL constants", () => {
  describe("FRESH_TTL_SECONDS", () => {
    it("is 7200 seconds (2 hours)", () => {
      // Rationale: EONET's upstream data changes infrequently.
      //
      // Research findings (2026-11-09):
      // - Severe storms (fastest-changing): geometry updates every 6-24 hours
      //   (e.g. Tropical Cyclone 03S geometry at 2026-11-07T18:00Z, Typhoon
      //   Cempaka at 2026-11-07T00:00Z — 18-hour gap between advisories).
      // - Wildfires: updates every few days (IRWIN source publishes incident
      //   updates on the order of days, not minutes).
      // - Icebergs: National Ice Center updates their list every Friday,
      //   EONET ingests on Saturday morning — weekly cadence.
      // - EONET itself states "no fixed schedule"; third-party consumers
      //   poll every 30 min to 4 hours.
      //
      // A 2-hour fresh TTL reduces upstream calls by 120× compared to the
      // previous 60-second TTL, while still keeping data meaningfully fresh
      // for the most dynamic event type (storms). For wildfires and icebergs,
      // the fresh entry is effectively always current.
      //
      // Trade-off: in the worst case a user sees storm data that is 2 hours
      // old. This is acceptable for a visualization dashboard (not an alerting
      // system) and matches the cadence of other EONET consumers.
      expect(FRESH_TTL_SECONDS).toBe(7200);
    });
  });

  describe("STALE_TTL_SECONDS", () => {
    it("is 86400 seconds (24 hours)", () => {
      // Stale TTL is unchanged. It serves as a fallback when upstream is
      // unreachable — 24 hours is long enough to survive transient EONET
      // outages without serving excessively old data.
      expect(STALE_TTL_SECONDS).toBe(86400);
    });

    it("is much larger than the fresh TTL", () => {
      // The stale TTL must be >> fresh TTL so that the stale fallback
      // actually provides resilience. At 24h stale vs 2h fresh, we have
      // a 12× ratio.
      expect(STALE_TTL_SECONDS).toBeGreaterThan(FRESH_TTL_SECONDS * 4);
    });
  });
});
