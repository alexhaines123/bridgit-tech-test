import { z } from "zod";

// Every environment variable the app reads lives in this schema.
// Keep it in sync with .env.example: each variable below must be listed
// there with a placeholder value, and nothing else belongs there.
const envSchema = z.object({
  ANTHROPIC_API_KEY: z
    .string({ error: "Required" })
    .min(1, "Required (an empty placeholder counts as missing)"),
  AI_MODEL: z
    .string({ error: "Required" })
    .min(1, "Required (an empty placeholder counts as missing)"),
  REDIS_URL: z
    .string({ error: "Required" })
    .min(1, "Required")
    .refine(
      (value) => /^rediss?:\/\/.+/.test(value),
      "Must be a URL starting with redis:// or rediss://",
    ),
  NODE_ENV: z
    .enum(["development", "test", "production"], {
      error: "Must be development, test or production",
    })
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

export type EnvValidationResult =
  | { success: true; env: Env }
  | { success: false; message: string };

/**
 * Validates raw environment variables without touching process.env and
 * without exiting, so it is unit-testable in isolation.
 *
 * The failure message names each offending variable and what is wrong with
 * it. It never includes the supplied values: some of them are secrets.
 */
export function validateEnv(
  raw: Readonly<Record<string, string | undefined>>,
): EnvValidationResult {
  const result = envSchema.safeParse(raw);
  if (result.success) {
    return { success: true, env: result.data };
  }

  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  return {
    success: false,
    message: [
      "Invalid environment configuration:",
      problems,
      "",
      "Copy .env.example to .env.local, fill in every variable, and restart.",
    ].join("\n"),
  };
}
