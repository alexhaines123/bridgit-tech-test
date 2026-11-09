import { describe, expect, it } from "vitest";
import { briefingOutputSchema } from "./schema";

/** Helper to build a valid base output; tests override individual fields. */
function validOutput(overrides: Record<string, unknown> = {}) {
  return {
    summary: "Wildfires dominated the count. Storms followed.",
    chosenMeasurementId: "eventsByCategory",
    caption: "Events grouped by Category",
    reason: "Wildfires are the most common Category this window.",
    ...overrides,
  };
}

describe("briefingOutputSchema", () => {
  describe("summary", () => {
    it("accepts a valid summary with 2 sentences", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({
          summary:
            "In the last 30 days, wildfires dominated the event count. Storms were the second most common category.",
        }),
      );
      expect(result.success).toBe(true);
    });

    it("accepts a valid summary with 3 sentences", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({
          summary:
            "Wildfires led the event count this month with 5 events. Severe storms followed with 3 events. North America saw the most activity overall.",
        }),
      );
      expect(result.success).toBe(true);
    });

    it("accepts a valid summary with 4 sentences", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({
          summary:
            "Wildfires led the event count this month with 5 events. Severe storms followed with 3 events. North America saw the most activity overall. The data covers a 30-day window.",
        }),
      );
      expect(result.success).toBe(true);
    });

    it("rejects an empty summary", () => {
      const result = briefingOutputSchema.safeParse(validOutput({ summary: "" }));
      expect(result.success).toBe(false);
    });

    it("rejects a summary with only one sentence", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ summary: "Wildfires dominated the event count." }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a summary with five or more sentences", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({
          summary:
            "Wildfires led the count. Storms followed. North America saw the most activity. The data covers 30 days. This is a fifth sentence.",
        }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a summary exceeding 500 characters", () => {
      const longSummary = "This is a very long summary. ".repeat(30);
      const result = briefingOutputSchema.safeParse(
        validOutput({ summary: longSummary }),
      );
      expect(result.success).toBe(false);
    });

    it("accepts a summary at exactly 500 characters", () => {
      const s = "X".repeat(249) + ". " + "Y".repeat(248) + ".";
      expect(s.length).toBe(500);
      const result = briefingOutputSchema.safeParse(validOutput({ summary: s }));
      expect(result.success).toBe(true);
    });

    it("rejects non-string summaries", () => {
      const result = briefingOutputSchema.safeParse(validOutput({ summary: 42 }));
      expect(result.success).toBe(false);
    });

    it("rejects null summaries", () => {
      const result = briefingOutputSchema.safeParse(validOutput({ summary: null }));
      expect(result.success).toBe(false);
    });

    it("trims whitespace before validation", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ summary: "  Wildfires led the count. Storms followed.  " }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe("Wildfires led the count. Storms followed.");
      }
    });
  });

  describe("chosenMeasurementId", () => {
    it("accepts each valid Measurement ID", () => {
      const ids = [
        "eventsByCategory",
        "eventsByRegion",
        "biggestInCategory",
        "newVsOngoing",
        "startedPerDay",
      ] as const;
      for (const id of ids) {
        const result = briefingOutputSchema.safeParse(
          validOutput({ chosenMeasurementId: id }),
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.chosenMeasurementId).toBe(id);
        }
      }
    });

    it("rejects an unknown Measurement ID", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ chosenMeasurementId: "unknownMeasurement" }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a non-string Measurement ID", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ chosenMeasurementId: 42 }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a missing chosenMeasurementId", () => {
      const { chosenMeasurementId, ...rest } = validOutput();
      const result = briefingOutputSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects null chosenMeasurementId", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ chosenMeasurementId: null }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("caption", () => {
    it("accepts a valid caption", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ caption: "Events grouped by Category" }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caption).toBe("Events grouped by Category");
      }
    });

    it("rejects an empty caption", () => {
      const result = briefingOutputSchema.safeParse(validOutput({ caption: "" }));
      expect(result.success).toBe(false);
    });

    it("rejects a caption exceeding 120 characters", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ caption: "x".repeat(121) }),
      );
      expect(result.success).toBe(false);
    });

    it("accepts a caption at exactly 120 characters", () => {
      const caption = "x".repeat(120);
      const result = briefingOutputSchema.safeParse(validOutput({ caption }));
      expect(result.success).toBe(true);
    });

    it("trims whitespace from caption", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ caption: "  Events by Category  " }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caption).toBe("Events by Category");
      }
    });
  });

  describe("reason", () => {
    it("accepts a valid reason", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ reason: "Wildfires are the most common Category this window." }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe(
          "Wildfires are the most common Category this window.",
        );
      }
    });

    it("rejects an empty reason", () => {
      const result = briefingOutputSchema.safeParse(validOutput({ reason: "" }));
      expect(result.success).toBe(false);
    });

    it("rejects a reason exceeding 200 characters", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ reason: "x".repeat(201) }),
      );
      expect(result.success).toBe(false);
    });

    it("accepts a reason at exactly 200 characters", () => {
      const reason = "x".repeat(200);
      const result = briefingOutputSchema.safeParse(validOutput({ reason }));
      expect(result.success).toBe(true);
    });

    it("trims whitespace from reason", () => {
      const result = briefingOutputSchema.safeParse(
        validOutput({ reason: "  Wildfires are the top Category.  " }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe("Wildfires are the top Category.");
      }
    });
  });

  describe("overall shape", () => {
    it("rejects an object without a summary field", () => {
      const result = briefingOutputSchema.safeParse({
        chosenMeasurementId: "eventsByCategory",
        caption: "Events by Category",
        reason: "It shows the most common Category.",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an object missing caption and reason", () => {
      const result = briefingOutputSchema.safeParse({
        summary: "Wildfires led. Storms followed.",
        chosenMeasurementId: "eventsByCategory",
      });
      expect(result.success).toBe(false);
    });

    it("produces all expected fields on success", () => {
      const result = briefingOutputSchema.safeParse(validOutput());
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          summary: "Wildfires dominated the count. Storms followed.",
          chosenMeasurementId: "eventsByCategory",
          caption: "Events grouped by Category",
          reason: "Wildfires are the most common Category this window.",
        });
      }
    });
  });
});
