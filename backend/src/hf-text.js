import { MODEL_REGISTRY } from "./model-registry.js";

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const MAX_INPUT = 12000;

function result(statusCode, body) {
  return { statusCode, headers: HEADERS, body };
}

export async function generateHuggingFaceText(
  input,
  { env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 60000 } = {}
) {
  const prompt = String(input?.prompt ?? input?.message ?? "").replace(/\u0000/g, "").trim().slice(0, MAX_INPUT);
  if (!prompt) return result(400, { ok: false, error: "A non-empty prompt is required." });

  const profile = String(input?.profile || "heavy").toLowerCase();
  if (profile === "local") {
    return result(409, {
      ok: false,
      profile,
      error: "The LOCAL model runs in the user's browser; call the browser-local engine instead of the server inference endpoint."
    });
  }
  if (profile !== "heavy" && profile !== "light" && profile !== "tiny") {
    return result(400, { ok: false, error: "profile must be local, tiny, light, or heavy." });
  }

  const token = env.HF_TOKEN || env.HUGGINGFACEHUB_API_TOKEN;
  if (!token) return result(503, { ok: false, error: "Hugging Face text inference is not configured: set HF_TOKEN in the backend runtime." });

  const model = String(profile === "heavy"
    ? env.HF_HEAVY_TEXT_MODEL || MODEL_REGISTRY.heavy.id
    : profile === "tiny"
      ? env.HF_TINY_TEXT_MODEL || MODEL_REGISTRY.tiny.id
      : env.HF_LIGHT_TEXT_MODEL || MODEL_REGISTRY.light.id);
  const endpoint = env.HF_TEXT_ENDPOINT ||
    `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model).replace(/%2F/gi, "/")}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetchImpl(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: Math.min(512, Math.max(16, Number(input?.maxNewTokens) || 160)), return_full_text: false },
        options: { wait_for_model: true }
      }),
      signal: controller.signal
    });
    const data = await upstream.json().catch(async () => ({ error: await upstream.text().catch(() => "") }));
    if (!upstream.ok || data?.error) {
      return result(502, {
        ok: false,
        provider: "huggingface",
        profile,
        model,
        error: String(data?.error || data?.message || `Hugging Face returned HTTP ${upstream.status}`).slice(0, 700)
      });
    }

    const item = Array.isArray(data) ? data[0] : data;
    const text = item?.generated_text ?? item?.choices?.[0]?.message?.content ?? item?.summary_text;
    if (typeof text !== "string" || !text.trim()) {
      return result(502, { ok: false, provider: "huggingface", profile, model, error: "Hugging Face returned no generated text." });
    }
    return result(200, { ok: true, provider: "huggingface", profile, model, text: text.trim() });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return result(502, {
      ok: false,
      provider: "huggingface",
      profile,
      model,
      error: timedOut ? "Hugging Face text inference timed out." : String(error?.message || "Hugging Face request failed").slice(0, 500)
    });
  } finally {
    clearTimeout(timer);
  }
}
