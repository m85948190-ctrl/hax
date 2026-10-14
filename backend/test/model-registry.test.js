import test from "node:test";
import assert from "node:assert/strict";
import { MODEL_REGISTRY, TEXT_FALLBACK_ORDER, getModelProfile, describeModelProfiles } from "../src/model-registry.js";

test("registry contains explicit local, light, heavy and image models", () => {
  assert.equal(MODEL_REGISTRY.local.id, "onnx-community/gemma-3-270m-it-ONNX");
  assert.equal(MODEL_REGISTRY.light.id, "HuggingFaceTB/SmolLM2-360M-Instruct");
  assert.equal(MODEL_REGISTRY.heavy.id, "HuggingFaceTB/SmolLM2-1.7B-Instruct");
  assert.equal(MODEL_REGISTRY.image.task, "text-to-image");
});

test("text fallback order is explicit and does not include image model", () => {
  assert.deepEqual(TEXT_FALLBACK_ORDER, ["heavy", "light", "local"]);
  assert.ok(TEXT_FALLBACK_ORDER.every(key => MODEL_REGISTRY[key].task === "text-generation"));
});

test("unknown profile fails explicitly rather than silently substituting", () => {
  assert.throws(() => getModelProfile("unknown"), /Unknown HAxBRO model profile/);
});

test("model profile listing is inspectable", () => {
  assert.deepEqual(describeModelProfiles().map(x => x.key), ["local", "light", "heavy", "image"]);
});
