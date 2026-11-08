import { describe, expect, it } from "vitest";
import { appRouter } from "./root";

describe("appRouter.health", () => {
  it("reports the app as ok", async () => {
    const caller = appRouter.createCaller({});

    await expect(caller.health()).resolves.toEqual({
      status: "ok",
      name: "Planet Watch",
    });
  });
});
