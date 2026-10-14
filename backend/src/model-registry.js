/**
 * Explicit model catalogue for HAxBRO's browser-local and Hugging Face lanes.
 * Text models run locally only when the browser engine loads their ONNX assets.
 * The image model is a separate text-to-image model; a text LLM cannot draw images
 * by itself. No silent provider substitution is performed.
 */
export const MODEL_REGISTRY = Object.freeze({
  local: Object.freeze({
    id: "onnx-community/gemma-3-270m-it-ONNX",
    label: "KAI LOCAL · Gemma 3 270M",
    parameters: "270M",
    execution: "browser-local",
    task: "text-generation",
    source: "https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX"
  }),
  tiny: Object.freeze({
    id: "StentorLabs/Stentor-30M-Instruct",
    label: "KAI TINY · Stentor 30M",
    parameters: "30.4M",
    execution: "hugging-face-inference",
    task: "text-generation",
    source: "https://huggingface.co/StentorLabs/Stentor-30M-Instruct"
  }),
  light: Object.freeze({
    id: "HuggingFaceTB/SmolLM2-360M-Instruct",
    label: "KAI LIGHT · SmolLM2 360M",
    parameters: "360M",
    execution: "browser-local-or-configured-hugging-face-runtime",
    task: "text-generation",
    source: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct"
  }),
  heavy: Object.freeze({
    id: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
    label: "KAI HEAVY · SmolLM2 1.7B",
    parameters: "1.7B",
    execution: "browser-local-or-configured-hugging-face-runtime",
    task: "text-generation",
    source: "https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct"
  }),
  image: Object.freeze({
    id: "stabilityai/stable-diffusion-3-medium-diffusers",
    label: "HAxBRO Image · Hugging Face",
    task: "text-to-image",
    execution: "hugging-face-inference",
    source: "https://huggingface.co/stabilityai/stable-diffusion-3-medium-diffusers"
  })
});

export const TEXT_FALLBACK_ORDER = Object.freeze(["heavy", "tiny", "light", "local"]);

export function getModelProfile(profile) {
  const model = MODEL_REGISTRY[profile];
  if (!model) throw new TypeError(`Unknown HAxBRO model profile: ${String(profile)}`);
  return model;
}

export function describeModelProfiles() {
  return Object.entries(MODEL_REGISTRY).map(([key, model]) => ({ key, ...model }));
}
