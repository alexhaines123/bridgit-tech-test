import { describe, expect, it } from "vitest";
import { validateEnv } from "./validation";

// A fully populated raw environment, as it would come from process.env.
const validEnv = {
  ANTHROPIC_API_KEY: "sk-ant-placeholder",
  AI_MODEL: "claude-placeholder-model",
  REDIS_URL: "redis://localhost:6379",
  NODE_ENV: "test",
};

describe("validateEnv", () => {
  it("accepts a fully populated environment", () => {
    const result = validateEnv(validEnv);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.env).toEqual({
        ANTHROPIC_API_KEY: "sk-ant-placeholder",
        AI_MODEL: "claude-placeholder-model",
        REDIS_URL: "redis://localhost:6379",
        NODE_ENV: "test",
      });
    }
  });

  it("accepts a TLS Redis URL", () => {
    const result = validateEnv({ ...validEnv, REDIS_URL: "rediss://cache.example.com:6380" });

    expect(result.success).toBe(true);
  });

  it("defaults NODE_ENV to development when unset", () => {
    const result = validateEnv({
      ANTHROPIC_API_KEY: validEnv.ANTHROPIC_API_KEY,
      AI_MODEL: validEnv.AI_MODEL,
      REDIS_URL: validEnv.REDIS_URL,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.env.NODE_ENV).toBe("development");
    }
  });

  it("rejects an unknown NODE_ENV and names it", () => {
    const result = validateEnv({ ...validEnv, NODE_ENV: "staging" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("NODE_ENV");
    }
  });

  it("names every missing variable in the failure message", () => {
    const result = validateEnv({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("ANTHROPIC_API_KEY");
      expect(result.message).toContain("AI_MODEL");
      expect(result.message).toContain("REDIS_URL");
    }
  });

  it("treats an empty placeholder value as missing", () => {
    // Copying .env.example without filling it in must not pass.
    const result = validateEnv({
      ANTHROPIC_API_KEY: "",
      AI_MODEL: "",
      REDIS_URL: "redis://localhost:6379",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("ANTHROPIC_API_KEY");
      expect(result.message).toContain("AI_MODEL");
      expect(result.message).not.toContain("REDIS_URL");
    }
  });

  it("rejects a REDIS_URL that is not a redis:// or rediss:// URL", () => {
    const result = validateEnv({ ...validEnv, REDIS_URL: "http://localhost:6379" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("REDIS_URL");
      expect(result.message).toContain("redis://");
    }
  });

  it("never echoes supplied values back in the failure message", () => {
    const secret = "sk-ant-sup3r-s3cret-value";
    const result = validateEnv({ ...validEnv, ANTHROPIC_API_KEY: secret, REDIS_URL: "nope" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).not.toContain(secret);
      expect(result.message).not.toContain("nope");
    }
  });
});
