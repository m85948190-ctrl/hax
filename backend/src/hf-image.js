import { MODEL_REGISTRY } from "./model-registry.js";

const MAX_PROMPT_LENGTH = 4000;
const DEFAULT_TIMEOUT_MS = 90000;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function safePrompt(value) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, MAX_PROMPT_LENGTH);
}

function response(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body };
}

/**
 * Runtime-neutral image-generation handler.
 * Supply HF_TOKEN (or HUGGINGFACEHUB_API_TOKEN) in the chosen server runtime.
 * This uses Hugging Face's model inference endpoint; it does not call OpenAI DALL·E.
 */
export async function generateHuggingFaceImage(
  input,
  {
    env = process.env,
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = {}
) {
  const prompt = safePrompt(input?.prompt);
  if (!prompt) return response(400, { ok: false, error: "A non-empty prompt is required." });
  if (typeof fetchImpl !== "function") {
    return response(500, { ok: false, error: "This runtime does not provide fetch()." });
  }

  const token = env.HF_TOKEN || env.HUGGINGFACEHUB_API_TOKEN;
  if (!token) {
    return response(503, {
      ok: false,
      error: "Hugging Face image generation is not configured: set HF_TOKEN in the backend runtime."
    });
  }

  const model = String(env.HF_IMAGE_MODEL || MODEL_REGISTRY.image.id);
  const endpoint = env.HF_IMAGE_ENDPOINT ||
    `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model).replace(/%2F/gi, "/")}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "image/*, application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true }
      }),
      signal: controller.signal
    });

    const contentType = upstream.headers?.get?.("content-type") || "";
    if (!upstream.ok) {
      const detail = contentType.includes("json")
        ? await upstream.json().catch(() => ({}))
        : { message: (await upstream.text().catch(() => "")).slice(0, 600) };
      const message = detail.error || detail.message || `Hugging Face returned HTTP ${upstream.status}`;
      return response(upstream.status === 401 || upstream.status === 403 ? 502 : 502, {
        ok: false,
        provider: "huggingface",
        model,
        error: String(message).slice(0, 700)
      });
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length) {
      return response(502, { ok: false, provider: "huggingface", model, error: "Hugging Face returned an empty image." });
    }

    if (contentType.includes("application/json")) {
      // Some inference endpoints return a JSON error object with HTTP 200.
      const text = bytes.toString("utf8");
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      if (data?.error) {
        return response(502, { ok: false, provider: "huggingface", model, error: String(data.error).slice(0, 700) });
      }
      return response(502, { ok: false, provider: "huggingface", model, error: "Expected image bytes but received JSON." });
    }

    const mime = /^image\/[a-zA-Z0-9.+-]+$/.test(contentType.split(";")[0])
      ? contentType.split(";")[0]
      : "image/png";

    return response(200, {
      ok: true,
      provider: "huggingface",
      model,
      mimeType: mime,
      imageBase64: bytes.toString("base64"),
      dataUrl: `data:${mime};base64,${bytes.toString("base64")}`
    });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return response(502, {
      ok: false,
      provider: "huggingface",
      model,
      error: timedOut ? "Hugging Face image generation timed out." : String(error?.message || "Hugging Face request failed").slice(0, 500)
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Framework-neutral route contract: POST { prompt } -> JSON image response. */
export async function handleHuggingFaceImageRequest(request, options) {
  if (request?.method && request.method.toUpperCase() !== "POST") {
    return response(405, { ok: false, error: "Method not allowed. Use POST." });
  }
  let input = request?.body ?? request;
  if (typeof input === "string") {
    try { input = JSON.parse(input); } catch {
      return response(400, { ok: false, error: "Request body must be valid JSON." });
    }
  }
  return generateHuggingFaceImage(input, options);
}
