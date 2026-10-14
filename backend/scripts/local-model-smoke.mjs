import { pipeline, env } from "@huggingface/transformers";

const model = "onnx-community/SmolLM2-135M-Instruct-ONNX-MHA";
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false;

console.log("LIVE NO-KEY MODEL TEST: downloading public model assets and loading", model);
console.log("No Hugging Face inference token is read or required; generation runs locally on this runner.");
const generator = await pipeline("text-generation", model, { dtype: "q4", device: "cpu" });
const prompt = "You are KAI 51, a helpful assistant. Answer in one short sentence: What is 2 + 2?";
const result = await generator(prompt, {
  max_new_tokens: 48,
  do_sample: false,
  return_full_text: false
});
const text = String(result?.[0]?.generated_text ?? "").trim();
console.log("MODEL:", model);
console.log("GENERATED_TEXT:", text);
if (!text) throw new Error("The local model returned an empty answer.");
if (!/\b4\b|four/i.test(text)) {
  console.warn("The model generated text but did not explicitly state the expected arithmetic result; inspect the answer above.");
}
console.log("PASS: real model weights loaded and produced non-empty generated text without an API key.");
try { await generator.dispose?.(); } catch {}
