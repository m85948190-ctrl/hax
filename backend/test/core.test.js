import test from "node:test";
import assert from "node:assert/strict";
import { complete, KAI51_IDENTITY } from "../../lib/core.js";

const envKeys = ["HF_TOKEN", "KAI_MODEL_API_KEY", "HUGGINGFACEHUB_API_TOKEN", "KAI_MODEL_PROFILE"];
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));

function restoreEnv() {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
}

test("KAI core calls the configured Hugging Face model and returns generated text", async () => {
  const originalFetch = globalThis.fetch;
  try {
    process.env.HF_TOKEN = "test-token";
    process.env.KAI_MODEL_PROFILE = "heavy";
    globalThis.fetch = async (url, init) => {
      assert.match(String(url), /router\.huggingface\.co\/hf-inference\/models\/HuggingFaceTB\/SmolLM2-1\.7B-Instruct/);
      assert.equal(init.method, "POST");
      assert.equal(init.headers.authorization, "Bearer test-token");
      const request = JSON.parse(init.body);
      assert.match(request.inputs, /CURRENT USER REQUEST:\nWhat is 2\+2\?/);
      return {
        ok: true,
        status: 200,
        json: async () => [{ generated_text: "2 + 2 = 4." }],
        text: async () => ""
      };
    };
    const result = await complete({ prompt: "What is 2+2?", searchMode: "normal" });
    assert.equal(result.text, "2 + 2 = 4.");
    assert.equal(result.model, "HuggingFaceTB/SmolLM2-1.7B-Instruct");
    assert.equal(result.status, "kai51-huggingface-response-complete");
    assert.equal(KAI51_IDENTITY.version, "51.8-github-huggingface");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});

test("KAI core fails clearly when Hugging Face credentials are missing", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const key of ["HF_TOKEN", "KAI_MODEL_API_KEY", "HUGGINGFACEHUB_API_TOKEN"]) delete process.env[key];
    process.env.KAI_MODEL_PROFILE = "heavy";
    globalThis.fetch = async () => { throw new Error("fetch must not run without credentials"); };
    await assert.rejects(
      complete({ prompt: "Hello", searchMode: "normal" }),
      error => error.code === "KAI_MODEL_CONFIG_MISSING" && /HF_TOKEN/.test(error.message)
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});

test("KAI core does not silently send local-profile requests to remote inference", async () => {
  const originalFetch = globalThis.fetch;
  try {
    process.env.HF_TOKEN = "test-token";
    process.env.KAI_MODEL_PROFILE = "local";
    globalThis.fetch = async () => { throw new Error("local profile must not call remote inference"); };
    await assert.rejects(
      complete({ prompt: "Hello", searchMode: "normal" }),
      error => error.code === "KAI_MODEL_UPSTREAM_ERROR" && /browser/.test(error.message)
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});
