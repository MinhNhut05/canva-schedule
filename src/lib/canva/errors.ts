import "server-only";

/**
 * Thrown when Canva returns HTTP 429 (rate limited) — either on a REST API call
 * or on the OAuth token-refresh endpoint. Carries the cooldown so callers can set
 * a global cooldown and surface a "retry after N seconds" message instead of
 * letting the user hammer the endpoint.
 *
 * Lives in its own module so both client.ts and oauth.ts can import it without a
 * circular dependency (client.ts imports oauth.ts).
 */
export class CanvaRateLimitError extends Error {
  constructor(public cooldownSeconds: number) {
    super(`Canva rate limited. Retry after ${cooldownSeconds} seconds.`);
    this.name = "CanvaRateLimitError";
  }
}
