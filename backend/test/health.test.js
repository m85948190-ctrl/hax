import test from "node:test";
import assert from "node:assert/strict";
import { health } from "../src/health.js";

test("health returns a no-store JSON success response", () => {
  const result = health();
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(result.headers["content-type"], "application/json; charset=utf-8");
  assert.deepEqual(result.body, {
    ok: true,
    service: "HAxBRO",
    component: "github-backend",
    status: "healthy"
  });
});
