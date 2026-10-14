import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("KAI browser engine loads public ONNX weights without an inference token or server proxy", async () => {
  const engine = await read("../../public/kai51-local-engine.js");
  assert.match(engine, /onnx-community\/SmolLM2-135M-Instruct-ONNX-MHA/);
  assert.match(engine, /onnx-community\/SmolLM2-360M-Instruct-ONNX/);
  assert.match(engine, /env\.fetch=globalThis\.fetch\.bind\(globalThis\)/);
  assert.doesNotMatch(engine, /HF_TOKEN|HUGGINGFACEHUB_API_TOKEN/);
  assert.doesNotMatch(engine, /\/api\/kai-model|\/api\/kai-training-sync/);
  assert.doesNotMatch(engine, /HATCHABLE/);
});

test("KAI Lite recovery uses local neural profiles instead of a server chat endpoint", async () => {
  const lite = await read("../../public/kai-lite.js");
  assert.match(lite, /profile: 'local'/);
  assert.match(lite, /profile: 'github'/);
  assert.match(lite, /bootstrap\.generate/);
  assert.match(lite, /apiKeyRequired: false/);
  assert.doesNotMatch(lite, /fetch\s*\(\s*['"`]\/api\//);
});

test("App Maker recovery uses browser-local generation rather than a server API", async () => {
  const bridge = await read("../../public/kai-capability-bridge.js");
  assert.match(bridge, /HAxBROKai51Bootstrap/);
  assert.match(bridge, /HAxBROKai51Bootstrap/);
  assert.doesNotMatch(bridge, /fetch\s*\(\s*['"`]\/api\//);
});

test("app shell loads the current no-key browser runtime scripts", async () => {
  const html = await read("../../public/app/index.html");
  assert.match(html, /kai51-local-engine\.js\?v=75/);
  assert.match(html, /kai51-local\.js\?v=61/);
  assert.match(html, /kai-lite\.js\?v=5/);
  assert.match(html, /kai-local-model\.js\?v=7/);
  assert.ok(html.includes("kai-capability-bridge.js?v=6"));
});
