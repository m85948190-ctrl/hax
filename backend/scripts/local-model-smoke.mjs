import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false;

const checks = [
  { model: "onnx-community/SmolLM2-135M-Instruct-ONNX-MHA", label: "KAI LOCAL · 135M" },
  { model: "onnx-community/SmolLM2-360M-Instruct-ONNX", label: "KAI GITHUB · 360M" }
];
let failed = 0;

for (const check of checks) {
  console.log("LIVE NO-KEY MODEL TEST: downloading public model assets and loading", check.model);
  console.log("No Hugging Face inference token is read or required; generation runs locally on this runner.");
  let generator;
  try {
    generator = await pipeline("text-generation", check.model, { dtype: "q4", device: "cpu" });
    const messages = [
      { role: "system", content: "You are KAI 51, a helpful assistant. Answer the user's request directly." },
      { role: "user", content: "In one short sentence, explain what 2 + 2 equals." }
    ];
    const result = await generator(messages, {
      max_new_tokens: 48,
      do_sample: false,
      return_full_text: false
    });
    const item = Array.isArray(result) ? result[0] : result;
    const generated = item?.generated_text;
    const text = (typeof generated === "string"
      ? generated
      : Array.isArray(generated)
        ? String(generated.filter(message => message?.role === "assistant").at(-1)?.content ?? generated.at(-1)?.content ?? "")
        : String(item?.text ?? item?.response ?? "")).trim();
    console.log("MODEL:", check.model);
    console.log("GENERATED_TEXT:", text);
    if (!text) {
      failed += 1;
      console.error("FAIL:", check.label, "returned an empty answer.");
    } else {
      console.log("PASS:", check.label, "loaded public weights and generated", text.length, "characters without an API key.");
    }
  } catch (error) {
    failed += 1;
    console.error("FAIL:", check.label, String(error?.stack || error));
  } finally {
    try { await generator?.dispose?.(); } catch {}
  }
}

if (failed) throw new Error("No-key local inference failed for " + failed + " model profile(s).");
console.log("PASS: both browser-compatible KAI text model profiles generated non-empty responses without an inference API key.");
