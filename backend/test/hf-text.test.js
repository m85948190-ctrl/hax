import test from "node:test";
import assert from "node:assert/strict";
import { generateHuggingFaceText } from "../src/hf-text.js";

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

test("routes heavy profile to the 1.7B model", async () => {
  let call;
  const result = await generateHuggingFaceText(
    { prompt: "Explain gravity", profile: "heavy" },
    {
      env: { HF_TOKEN: "test" },
      fetchImpl: async (url, init) => {
        call = { url, init };
        return jsonResponse([{ generated_text: "Gravity attracts masses." }]);
      }
    }
  );
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.model, "HuggingFaceTB/SmolLM2-1.7B-Instruct");
  assert.equal(result.body.text, "Gravity attracts masses.");
  assert.match(call.url, /SmolLM2-1\.7B-Instruct/);
});

test("routes tiny profile to the requested 30M model", async () => {
  const result = await generateHuggingFaceText(
    { prompt: "Say hello", profile: "tiny" },
    { env: { HF_TOKEN: "test" }, fetchImpl: async () => jsonResponse([{ generated_text: "Hello from the tiny model." }]) }
  );
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.model, "StentorLabs/Stentor-30M-Instruct");
});

test("routes light profile to the 360M model", async () => {
  const result = await generateHuggingFaceText(
    { prompt: "Say hello", profile: "light" },
    { env: { HF_TOKEN: "test" }, fetchImpl: async () => jsonResponse([{ generated_text: "Hello." }]) }
  );
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.model, "onnx-community/SmolLM2-360M-Instruct-ONNX");
});

test("does not pretend the local browser model is server inference", async () => {
  const result = await generateHuggingFaceText(
    { prompt: "Say hello", profile: "local" },
    { env: { HF_TOKEN: "test" }, fetchImpl: async () => { throw Error("must not fetch"); } }
  );
  assert.equal(result.statusCode, 409);
  assert.match(result.body.error, /browser/);
});

test("requires HF_TOKEN for remote text inference", async () => {
  const result = await generateHuggingFaceText({ prompt: "Hello", profile: "light" }, { env: {}, fetchImpl: async () => { throw Error("must not fetch"); } });
  assert.equal(result.statusCode, 503);
});

test("reports model endpoint errors rather than silently switching models", async () => {
  const result = await generateHuggingFaceText(
    { prompt: "Hello", profile: "heavy" },
    { env: { HF_TOKEN: "test" }, fetchImpl: async () => jsonResponse({ error: "Model not deployed" }, 503) }
  );
  assert.equal(result.statusCode, 502);
  assert.equal(result.body.model, "HuggingFaceTB/SmolLM2-1.7B-Instruct");
  assert.equal(result.body.error, "Model not deployed");
});
