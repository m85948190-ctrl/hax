import test from "node:test";
import assert from "node:assert/strict";
import { createHaxbroServer } from "../server.js";

async function withServer(options, run) {
  const server = createHaxbroServer(options);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test("health endpoint responds successfully", async () => {
  await withServer({}, async base => {
    const res = await fetch(base + "/api/health");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.service, "HAxBRO");
  });
});

test("models endpoint exposes local, light, heavy and image profiles", async () => {
  await withServer({}, async base => {
    const res = await fetch(base + "/api/models");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(data.models.map(x => x.key), ["local", "tiny", "light", "heavy", "image"]);
  });
});

test("chat endpoint keeps the LOCAL browser lane separate from server inference", async () => {
  await withServer({ env: {}, fetchImpl: async () => { throw Error("must not fetch"); } }, async base => {
    const res = await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", profile: "local" })
    });
    const data = await res.json();
    assert.equal(res.status, 409);
    assert.match(data.error, /browser/);
  });
});

test("chat endpoint requires runtime HF_TOKEN for remote models", async () => {
  await withServer({ env: {}, fetchImpl: async () => { throw Error("must not fetch"); } }, async base => {
    const res = await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "Hello", profile: "heavy" })
    });
    const data = await res.json();
    assert.equal(res.status, 503);
    assert.match(data.error, /HF_TOKEN/);
  });
});

test("image endpoint returns explicit configuration error without token", async () => {
  await withServer({ env: {}, fetchImpl: async () => { throw Error("must not fetch"); } }, async base => {
    const res = await fetch(base + "/api/images/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "A blue robot" })
    });
    const data = await res.json();
    assert.equal(res.status, 503);
    assert.match(data.error, /HF_TOKEN/);
  });
});

test("unknown endpoint returns 404", async () => {
  await withServer({}, async base => {
    const res = await fetch(base + "/not-a-route");
    assert.equal(res.status, 404);
  });
});
