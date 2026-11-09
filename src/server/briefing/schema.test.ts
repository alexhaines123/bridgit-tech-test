import { describe, expect, it } from "vitest";
import { briefingOutputSchema } from "./schema";

describe("briefingOutputSchema", () => {
  it("accepts a valid summary with 2 sentences", () => {
    const result = briefingOutputSchema.safeParse({
      summary: "In the last 30 days, wildfires dominated the event count. Storms were the second most common category.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid summary with 3 sentences", () => {
    const result = briefingOutputSchema.safeParse({
      summary:
        "Wildfires led the event count this month with 5 events. Severe storms followed with 3 events. North America saw the most activity overall.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid summary with 4 sentences", () => {
    const result = briefingOutputSchema.safeParse({
      summary:
        "Wildfires led the event count this month with 5 events. Severe storms followed with 3 events. North America saw the most activity overall. The data covers a 30-day window.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty summary", () => {
    const result = briefingOutputSchema.safeParse({
      summary: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a summary with only one sentence", () => {
    const result = briefingOutputSchema.safeParse({
      summary: "Wildfires dominated the event count.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a summary with five or more sentences", () => {
    const result = briefingOutputSchema.safeParse({
      summary:
        "Wildfires led the event count. Storms followed. North America saw the most activity. The data covers 30 days. This is a fifth sentence.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a summary exceeding 500 characters", () => {
    const longSummary =
      "This is a very long summary. ".repeat(30); // ~900 chars
    const result = briefingOutputSchema.safeParse({
      summary: longSummary,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a summary at exactly 500 characters", () => {
    // 500 chars, 2 sentences
    const s = "X".repeat(249) + ". " + "Y".repeat(248) + ".";
    expect(s.length).toBe(500);
    const result = briefingOutputSchema.safeParse({ summary: s });
    expect(result.success).toBe(true);
  });

  it("rejects non-string summaries", () => {
    const result = briefingOutputSchema.safeParse({
      summary: 42,
    });

    expect(result.success).toBe(false);
  });

  it("rejects null summaries", () => {
    const result = briefingOutputSchema.safeParse({
      summary: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects objects without a summary field", () => {
    const result = briefingOutputSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("counts sentences by period-ending punctuation", () => {
    // Sentence counting: split by . ! ? followed by space or end
    // A summary with abbreviations like "U.S." should still be handled
    // For simplicity, we count periods followed by space or end of string
    const summary = "Wildfires led the count. Storms followed.";
    const result = briefingOutputSchema.safeParse({ summary });
    expect(result.success).toBe(true);
  });

  it("trims whitespace before validation", () => {
    const result = briefingOutputSchema.safeParse({
      summary: "  Wildfires led the count. Storms followed.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary).toBe("Wildfires led the count. Storms followed.");
    }
  });
});
