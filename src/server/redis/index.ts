import Redis from "ioredis";
import { env } from "../env";

let client: Redis | null = null;

/**
 * Returns the shared Redis client, connecting on first use. Creation is
 * lazy so importing server modules never needs a live Redis — unit tests
 * stay hermetic. Redis is a hard dependency (ADR 0004): when it is down,
 * commands must fail loudly rather than fall back to an in-memory cache.
 */
export function getRedis(): Redis {
  if (client === null) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
  }
  return client;
}
