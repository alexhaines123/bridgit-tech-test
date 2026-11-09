import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BriefingClient } from "./client";
import { BriefingError } from "./errors";
import type { BriefingPayload } from "./payload";

// MSW server for HTTP-level mocking
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

const mockPayload: BriefingPayload = {
  measurements: {
    eventsByCategory: {
      id: "eventsByCategory",
      title: "Events by Category",
      data: [{ categoryId: "wildfires", categoryTitle: "Wildfires", count: 5 }],
    },
    eventsByRegion: {
      id: "eventsByRegion",
      title: "Events by Region",
      data: [{ region: "North America", count: 3 }],
    },
    biggestInCategory: {
      id: "biggestInCategory",
      title: "Biggest in a Category",
      data: {
        categoryId: "wildfires",
        categoryTitle: "Wildfires",
        magnitudeValue: 1000,
        magnitudeUnit: "acres",
      },
    },
    newVsOngoing: {
      id: "newVsOngoing",
      title: "New vs ongoing",
      data: { newCount: 2, ongoingCount: 3 },
    },
    startedPerDay: {
      id: "startedPerDay",
      title: "Started per day",
      data: [{ date: "2025-01-01", count: 2 }],
    },
  },
  windowDays: 30,
  totalEventCount: 5,
  stale: false,
};

describe("BriefingClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid summary on a successful response", async () => {
    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, () => {
        return HttpResponse.json({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: '{"summary":"Wildfires dominated the event count this month. North America saw the most activity."}',
            },
          ],
          usage: { input_tokens: 100, output_tokens: 20 },
        });
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
    });

    const result = await client.generateBriefing(mockPayload);

    expect(result.summary).toContain("Wildfires");
    expect(result.usage).toBeDefined();
  });

  it("rejects malformed output and retries once", async () => {
    let callCount = 0;
    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, () => {
        callCount++;
        return HttpResponse.json({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "not json at all" }],
          usage: { input_tokens: 10, output_tokens: 5 },
        });
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
    });

    try {
      await client.generateBriefing(mockPayload);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BriefingError);
      if (error instanceof BriefingError) {
        expect(error.code).toBe("ai-invalid-output");
      }
    }

    // Initial call + 1 retry = 2 calls
    expect(callCount).toBe(2);
  });

  it("rejects off-topic output", async () => {
    let callCount = 0;
    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, () => {
        callCount++;
        // Output that's off-topic: only 1 sentence, which fails the schema
        return HttpResponse.json({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: '{"summary":"I cannot help with that request."}',
            },
          ],
          usage: { input_tokens: 10, output_tokens: 15 },
        });
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
    });

    try {
      await client.generateBriefing(mockPayload);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BriefingError);
      if (error instanceof BriefingError) {
        expect(error.code).toBe("ai-invalid-output");
      }
    }
    expect(callCount).toBe(2); // initial + 1 retry
  });

  it("throws ai-rate-limited on 429", async () => {
    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, () => {
        return HttpResponse.json(
          { error: { message: "Rate limit exceeded" } },
          { status: 429 },
        );
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
    });

    try {
      await client.generateBriefing(mockPayload);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BriefingError);
      if (error instanceof BriefingError) {
        expect(error.code).toBe("ai-rate-limited");
      }
    }
  });

  it("throws ai-timeout on timeout", async () => {
    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, async () => {
        // Simulate a timeout by delaying the response
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ error: "timeout" });
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
      timeoutMs: 100, // Very short timeout for testing
    });

    try {
      await client.generateBriefing(mockPayload);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BriefingError);
      if (error instanceof BriefingError) {
        expect(error.code).toBe("ai-timeout");
      }
    }
  });

  it("caches results by input hash", async () => {
    let callCount = 0;
    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, () => {
        callCount++;
        return HttpResponse.json({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: '{"summary":"Wildfires dominated the count. Storms followed."}',
            },
          ],
          usage: { input_tokens: 100, output_tokens: 20 },
        });
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
    });

    // First call
    const result1 = await client.generateBriefing(mockPayload);
    expect(callCount).toBe(1);

    // Second call with same input should hit cache
    const result2 = await client.generateBriefing(mockPayload);
    expect(callCount).toBe(1); // No additional call
    expect(result2.summary).toBe(result1.summary);
  });

  it("logs token usage without secrets", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    server.use(
      http.post(`${ANTHROPIC_BASE_URL}/v1/messages`, () => {
        return HttpResponse.json({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: '{"summary":"Wildfires led the count. Storms followed."}',
            },
          ],
          usage: { input_tokens: 150, output_tokens: 25 },
        });
      }),
    );

    const client = new BriefingClient({
      apiKey: "test-key",
      modelId: "claude-test",
      baseUrl: ANTHROPIC_BASE_URL,
    });

    await client.generateBriefing(mockPayload);

    // Check that token usage was logged
    const logCalls = consoleSpy.mock.calls.map((call) => call.join(" "));
    const tokenLog = logCalls.find((log) => log.includes("Briefing AI") && log.includes("tokens"));
    expect(tokenLog).toBeDefined();

    // Check that the API key is NOT in any log
    for (const log of logCalls) {
      expect(log).not.toContain("test-key");
    }

    consoleSpy.mockRestore();
  });
});
