import { eonetResponseSchema, type EonetResponse } from "./schema";
import { EonetUpstreamError } from "./errors";

/**
 * Configuration for the EONET HTTP client.
 */
export interface EonetClientConfig {
  /** Base URL for EONET API. Defaults to NASA's public endpoint. */
  baseUrl?: string;
  /** Maximum time in milliseconds to wait for a response. */
  timeoutMs?: number;
  /** Maximum number of retry attempts for transient failures. */
  maxRetries?: number;
  /** Delay in milliseconds between retries. */
  retryDelayMs?: number;
}

const DEFAULT_CONFIG: Required<EonetClientConfig> = {
  baseUrl: "https://eonet.gsfc.nasa.gov/api/v3",
  timeoutMs: 10_000, // 10 seconds
  maxRetries: 2,
  retryDelayMs: 1_000,
};

/**
 * Fetches events from NASA's EONET API with bounded timeout and limited retry.
 *
 * Validates the response at the boundary using Zod schemas. A malformed response
 * produces a typed error, not a crash. Upstream 5xx and timeouts surface as
 * "upstream unavailable" errors; 429 as "rate limited" errors.
 */
export class EonetClient {
  private readonly config: Required<EonetClientConfig>;

  constructor(config: EonetClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetches events from EONET filtered by recent activity.
   *
   * @param days - Number of days to look back for recent activity.
   *               The filter is on recent activity, not first-seen date:
   *               an event first seen years ago but updated recently is included.
   */
  async fetchEvents(days: number): Promise<EonetResponse> {
    const url = `${this.config.baseUrl}/events?days=${days}`;

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.fetchWithTimeout(url);
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) except 429
        if (error instanceof EonetUpstreamError) {
          if (error.code === "rate_limited") {
            // Retry on rate limit
            await this.delay(this.config.retryDelayMs);
            continue;
          }
          if (error.code === "malformed") {
            // Don't retry malformed responses
            throw error;
          }
          // Retry on upstream_unavailable and timeout
          if (attempt < this.config.maxRetries) {
            await this.delay(this.config.retryDelayMs);
            continue;
          }
        }

        // Unknown error, retry
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs);
          continue;
        }
      }
    }

    // All retries exhausted
    if (lastError instanceof EonetUpstreamError) {
      throw lastError;
    }

    throw new EonetUpstreamError(
      "upstream_unavailable",
      "Failed to fetch events from NASA EONET",
      lastError,
    );
  }

  private async fetchWithTimeout(url: string): Promise<EonetResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 429) {
          throw new EonetUpstreamError(
            "rate_limited",
            `EONET returned 429 Too Many Requests`,
          );
        }
        if (response.status >= 500) {
          throw new EonetUpstreamError(
            "upstream_unavailable",
            `EONET returned ${response.status} ${response.statusText}`,
          );
        }
        throw new EonetUpstreamError(
          "upstream_unavailable",
          `EONET returned ${response.status} ${response.statusText}`,
        );
      }

      // Parse and validate response
      const raw = await response.json();
      const result = eonetResponseSchema.safeParse(raw);

      if (!result.success) {
        throw new EonetUpstreamError(
          "malformed",
          "EONET response failed validation",
          result.error,
        );
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new EonetUpstreamError(
          "timeout",
          `EONET request timed out after ${this.config.timeoutMs}ms`,
        );
      }

      // Re-throw EonetUpstreamError as-is
      if (error instanceof EonetUpstreamError) {
        throw error;
      }

      // Wrap unknown errors
      throw new EonetUpstreamError(
        "upstream_unavailable",
        "Failed to fetch from EONET",
        error,
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default singleton client instance for use in production code.
 */
export const eonetClient = new EonetClient();
