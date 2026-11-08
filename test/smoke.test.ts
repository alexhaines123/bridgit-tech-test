import { describe, expect, it } from "vitest";

// Trivial test proving the Vitest harness runs. Behaviour tests live next to
// the code they cover (e.g. src/server/env/validation.test.ts).
describe("test harness", () => {
  it("runs an assertion", () => {
    expect([1, 2, 3].map((n) => n * 2)).toEqual([2, 4, 6]);
  });
});
