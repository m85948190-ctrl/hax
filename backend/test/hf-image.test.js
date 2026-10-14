import test from "node:test";
import assert from "node:assert/strict";
import { generateHuggingFaceImage, handleHuggingFaceImageRequest } from "../src/hf-image.js";

function fakeResponse({ status = 200, contentType = "image/png", bytes = [1, 2, 3], json = null } = {}) {
  const payload = json === null ? Uint8Array.from(bytes) : new TextEncoder().encode(JSON.stringify(json));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => name.toLowerCase() === "content-type" ? contentType : null },
    arrayBuffer: async () => payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength),
    text: async () => new TextDecoder().decode(payload),
    json: async () => json ?? JSON.parse(new TextDecoder().decode(payload))
  };
}

test("requires a prompt", async () => {
  const result = await generateHuggingFaceImage({}, { env: { HF_TOKEN: "test" }, fetchImpl: async () => { throw Error("must not fetch"); } });
  assert.equal(result.statusCode, 400);
});

test("does not expose a route when HF_TOKEN is missing", async () => {
  const result = await generateHuggingFaceImage({ prompt: "A robot in a blue room" }, { env: {}, fetchImpl: async () => { throw Error("must not fetch"); } });
  assert.equal(result.statusCode, 503);
  assert.match(result.body.error, /HF_TOKEN/);
});

test("sends prompt to the configured Hugging Face model and returns image bytes", async () => {
  let request;
  const result = await generateHuggingFaceImage(
    { prompt: "A blue robot" },
    {
      env: { HF_TOKEN: "test-token", HF_IMAGE_MODEL: "test/image-model" },
      fetchImpl: async (url, init) => {
        request = { url, init };
        return fakeResponse({ bytes: [137, 80, 78, 71], contentType: "image/png" });
      }
    }
  );
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.provider, "huggingface");
  assert.equal(result.body.model, "test/image-model");
  assert.equal(result.body.imageBase64, "iVBORw==");
  assert.equal(request.url, "https://router.huggingface.co/hf-inference/models/test/image-model");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.authorization, "Bearer test-token");
  assert.deepEqual(JSON.parse(request.init.body), { inputs: "A blue robot", options: { wait_for_model: true } });
});

test("reports upstream provider errors clearly without hidden provider substitution", async () => {
  const result = await generateHuggingFaceImage(
    { prompt: "A landscape" },
    { env: { HF_TOKEN: "test" }, fetchImpl: async () => fakeResponse({ status: 503, contentType: "application/json", json: { error: "Model loading" } }) }
  );
  assert.equal(result.statusCode, 502);
  assert.equal(result.body.provider, "huggingface");
  assert.equal(result.body.error, "Model loading");
});

test("rejects JSON success payload instead of pretending it is an image", async () => {
  const result = await generateHuggingFaceImage(
    { prompt: "A landscape" },
    { env: { HF_TOKEN: "test" }, fetchImpl: async () => fakeResponse({ contentType: "application/json", json: { error: "not ready" } }) }
  );
  assert.equal(result.statusCode, 502);
  assert.equal(result.body.error, "not ready");
});

test("request adapter rejects malformed JSON and non-POST methods", async () => {
  assert.equal((await handleHuggingFaceImageRequest({ method: "GET" })).statusCode, 405);
  assert.equal((await handleHuggingFaceImageRequest({ method: "POST", body: "{" })).statusCode, 400);
});
