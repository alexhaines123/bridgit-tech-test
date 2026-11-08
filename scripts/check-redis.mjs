// Reachability check for local development: run `docker compose up -d`,
// then `npm run redis:check`. Reads REDIS_URL, defaulting to the compose port.
import Redis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
const client = new Redis(url, {
  lazyConnect: true,
  connectTimeout: 3000,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // fail fast; do not reconnect in a check script
});

try {
  await client.connect();
  const reply = await client.ping();
  console.log(`Redis reachable at ${url} (PING -> ${reply})`);
  process.exitCode = reply === "PONG" ? 0 : 1;
} catch {
  console.error(
    `Redis NOT reachable at ${url}.\nStart it with: docker compose up -d`,
  );
  process.exitCode = 1;
} finally {
  client.disconnect();
}
