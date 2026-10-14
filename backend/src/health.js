/**
 * Runtime-neutral health handler for the HAxBRO backend migration.
 * Adapt this function to the eventual HTTP runtime; it intentionally has
 * no Hatchable SDK, Vercel SDK, database, or model dependency.
 */
export function health() {
  return {
    statusCode: 200,
    headers: { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" },
    body: { ok: true, service: "HAxBRO", component: "github-backend", status: "healthy" }
  };
}
