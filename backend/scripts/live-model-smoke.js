import { generateHuggingFaceText } from "../src/hf-text.js";

if (!process.env.HF_TOKEN) {
  console.error("LIVE MODEL TEST BLOCKED: configure the repository Actions secret HF_TOKEN with Inference Providers permission.");
  process.exit(2);
}

const checks = [
  { profile: "heavy", expected: process.env.HF_HEAVY_TEXT_MODEL || "HuggingFaceTB/SmolLM2-1.7B-Instruct" },
  { profile: "tiny", expected: process.env.HF_TINY_TEXT_MODEL || "StentorLabs/Stentor-30M-Instruct" }
];

let failed = 0;
for (const check of checks) {
  console.log(`Testing live Hugging Face model profile "${check.profile}" (${check.expected})...`);
  const result = await generateHuggingFaceText(
    { profile: check.profile, prompt: "Reply with a short greeting.", maxNewTokens: 32 },
    { env: process.env, timeoutMs: 90000 }
  );
  if (result.statusCode !== 200 || !result.body?.ok || !result.body?.text) {
    failed += 1;
    console.error(`FAIL ${check.profile}: ${result.statusCode} — ${result.body?.error || "empty model response"}`);
    continue;
  }
  console.log(`PASS ${check.profile}: model=${result.body.model}; outputChars=${result.body.text.length}`);
}
if (failed) {
  console.error(`Live inference smoke test failed for ${failed} model profile(s). No automatic model substitution was performed.`);
  process.exit(1);
}
console.log("LIVE MODEL TEST PASSED: both requested Hugging Face text models generated non-empty responses.");
