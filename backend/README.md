# HAxBRO backend — GitHub-owned source

This directory is the migration target for HAxBRO backend code. **Vercel is not part of this design.**

## Responsibilities
- Keep backend source, route contracts, tests, model routing, and model references in this repository.
- Keep secrets out of Git; supply them through the chosen runtime's secret manager.
- Keep the existing frontend at `https://haxbro.hatchable.site` unchanged until replacement endpoints are verified.
- Port each existing Hatchable route and replace Hatchable SDK dependencies with explicit adapters before switching traffic.

## Model lanes
The registry in `src/model-registry.js` is explicit:
- **KAI LOCAL:** `onnx-community/SmolLM2-135M-Instruct-ONNX-MHA` — real browser-local text generation with no inference API key.
- **KAI TINY:** `StentorLabs/Stentor-30M-Instruct` — catalogued 30.4M model; not yet wired into the browser because the public repository does not currently supply the ONNX format required by Transformers.js.
- **KAI LIGHT:** `onnx-community/SmolLM2-360M-Instruct-ONNX` — browser-local 360M text generation with no inference API key.
- **KAI HEAVY:** `HuggingFaceTB/SmolLM2-1.7B-Instruct` — catalogued 1.7B model; it is not currently wired to the no-key browser runtime because the checked ONNX model ID was not found. The server-side inference route requires a token and is not used by the no-key browser lanes.
- **HAxBRO Image:** `stabilityai/stable-diffusion-3-medium-diffusers` — separate text-to-image model through Hugging Face inference.

The image-generation adapter is `src/hf-image.js`. Its route contract is `POST { prompt }`; it returns a JSON response containing `dataUrl` and `imageBase64`. It does **not** call OpenAI DALL·E. It uses Hugging Face's image inference endpoint and reports failures instead of silently switching to another vendor. The server-side KAI core remains a separate optional inference path; it is not required for the browser-local workspaces.

## Image endpoint environment
- `HF_TOKEN` — required, server-side Hugging Face token with inference permission.
- `HF_TEXT_ENDPOINT` — optional text endpoint override if the selected model is not hosted on the default serverless inference route.
- `HF_HEAVY_TEXT_MODEL` / `HF_TINY_TEXT_MODEL` / `HF_LIGHT_TEXT_MODEL` — optional model ID overrides.
- `HF_IMAGE_MODEL` — optional image model override; defaults to the registry image model.
- `HF_IMAGE_ENDPOINT` — optional endpoint override, useful for a dedicated provider/model endpoint.

Never place `HF_TOKEN` in frontend JavaScript or commit it to GitHub. Configure it only in the chosen backend runtime's secret settings.

## No-key workspace route
The app shell loads `kai51-local-engine.js`, `kai51-local.js`, `kai-lite.js`, and `kai-capability-bridge.js`. Text responses and App Maker recovery run in the browser using public ONNX weights. The browser downloads model files from Hugging Face and the Transformers.js library from a public CDN; neither requires a Hugging Face inference token. KAI Lite tries the local 135M model then the 360M model. This is actual neural inference, not a phrase-response table. The 135M/360M models are much smaller than 1.7B and have lower capability; do not label them as 1.7B.

## Important runtime boundary
GitHub is the source-control and automation layer, not a permanent HTTP execution environment. GitHub Actions can lint, test, package, and trigger deployment, but it does not provide a continuously running API endpoint. The tests use mocked model responses unless a separately configured live-inference smoke test is run with a valid secret. A non-Vercel runtime must be selected and authorized before Hatchable can call this backend. Until then, the existing Hatchable backend remains active.

## Migration policy
1. Do not disable or delete existing Hatchable routes before parity tests pass.
2. Port route request/response contracts and authentication semantics.
3. Replace database, auth, file storage, browser/retrieval, model inference, and scheduling dependencies with documented adapters.
4. Test every route and workspace in staging.
5. Change only the frontend API base after the new runtime passes end-to-end checks.
6. Keep a rollback path.
