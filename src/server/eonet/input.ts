import { z } from "zod";
import { VALID_WINDOW_DAYS, DEFAULT_WINDOW_DAYS } from "./types";

/**
 * Input schema for the events procedure.
 * Validates the Window parameter and rejects invalid values.
 */
export const eventsInputSchema = z.object({
  windowDays: z
    .number()
    .int()
    .refine((val) => (VALID_WINDOW_DAYS as readonly number[]).includes(val), {
      message: `Window must be one of: ${VALID_WINDOW_DAYS.join(", ")}`,
    })
    .default(DEFAULT_WINDOW_DAYS),
});

export type EventsInput = z.infer<typeof eventsInputSchema>;
