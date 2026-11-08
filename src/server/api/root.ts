import { z } from "zod";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  /**
   * Liveness probe proving the tRPC wiring end to end. The scaffold page
   * renders its result; later tickets add real routers beside it.
   */
  health: publicProcedure
    .output(
      z.object({
        status: z.literal("ok"),
        name: z.string(),
      }),
    )
    .query(() => ({ status: "ok" as const, name: "Planet Watch" })),
});

export type AppRouter = typeof appRouter;
