import { validateEnv, type Env } from "./validation";

function loadEnv(): Env {
  const result = validateEnv(process.env);
  if (!result.success) {
    // Misconfiguration is an expected operator error, not a bug: print one
    // clear secret-free message and stop. No stack trace.
    console.error(result.message);
    process.exit(1);
  }
  return result.env;
}

/**
 * The validated environment for server code. Importing this module fails
 * fast (see src/instrumentation.ts) when any variable is missing or invalid.
 */
export const env = loadEnv();
