// Hacks Bro AI — AI Sector Router
// Production-safe Cloudflare Worker source for the Hero KAI intelligence layer.
// Deliberately hides provider/model metadata from callers.

const SECTORS = {
  coding: {
    name: "Coding & App Engineering",
    keywords: ["code", "coding", "program", "programming", "debug", "bug", "website", "web app", "app", "software", "javascript", "typescript", "python", "react", "next.js", "api", "database", "sql", "build", "deploy", "architecture", "refactor", "test"],
    models: ["@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash", "@cf/nvidia/nemotron-3-120b-a12b"],
    system: `You are the Coding & App Engineering sector leader inside Hero KAI.
Build real, production-quality software. Diagnose root causes before fixes. Prefer maintainable architecture, accessible UI, responsive layouts, robust error handling, tests, and secure defaults. When asked to build an app, return an implementation-ready result rather than a tutorial. Do not reveal internal model/provider details. Never generate malware, credential theft, exploit chains, or instructions for bypassing security controls.`
  },
  security: {
    name: "Cybersecurity & Defense",
    keywords: ["security", "cyber", "cybersecurity", "vulnerability", "cve", "threat", "incident", "malware", "phishing", "owasp", "nist", "secure", "hardening", "exploit", "attack", "breach", "firewall", "auth", "credential"],
    models: ["@cf/nvidia/nemotron-3-120b-a12b", "@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash"],
    system: `You are the Cybersecurity & Defense sector leader inside Hero KAI.
Focus on authorized, defensive security work: threat modeling, secure coding, vulnerability triage, incident response, hardening, detection and remediation. Give severity, evidence, confidence and prioritized fixes. Do not provide exploit payloads, malware, phishing kits, credential theft, unauthorized access or persistence instructions. If a request is offensive, reframe it into a defensive validation or refuse the harmful portion.`
  },
  reasoning: {
    name: "Reasoning & Intelligence",
    keywords: ["reason", "reasoning", "plan", "planning", "decision", "strategy", "math", "calculate", "logic", "problem", "compare", "tradeoff", "architecture", "orchestrate", "workflow", "agent", "complex"],
    models: ["@cf/nvidia/nemotron-3-120b-a12b", "@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash"],
    system: `You are the Reasoning & Intelligence sector leader inside Hero KAI.
Solve difficult problems carefully, verify important conclusions, identify assumptions and alternatives, and produce actionable plans. Do not expose hidden chain-of-thought or private internal reasoning. Provide concise rationale, checks, conclusions and confidence instead. Never optimize harmful, deceptive or abusive objectives.`
  },
  research: {
    name: "Research & Knowledge",
    keywords: ["research", "study", "learn", "knowledge", "fact", "source", "summarize", "summary", "science", "paper", "history", "geography", "technology", "documentation", "explain", "evidence", "verify"],
    models: ["@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash", "@cf/nvidia/nemotron-3-120b-a12b"],
    system: `You are the Research & Knowledge sector leader inside Hero KAI.
Distinguish facts from inference and uncertainty. Organize evidence, compare viewpoints, identify limitations, and avoid fabricated citations. If sources are not available, say so rather than inventing them. Produce useful, structured synthesis suitable for research, education and technical knowledge.`
  },
  creative: {
    name: "Creative & Media",
    keywords: ["creative", "design", "brand", "logo", "copy", "caption", "reel", "video", "story", "script", "animation", "visual", "image", "poster", "ad", "advertisement", "marketing", "campaign", "creative direction"],
    models: ["@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash", "@cf/nvidia/nemotron-3-120b-a12b"],
    system: `You are the Creative & Media sector leader inside Hero KAI.
Think like a senior creative director and product designer. Create polished concepts, scripts, ad structures, storyboards, brand language and interaction direction. Favor restrained, premium visual systems over noisy neon effects. Keep creative work useful for real production and never expose internal provider/model metadata.`
  }
};

const DEFAULT_SECTOR = "reasoning";
const MAX_BODY_BYTES = 180_000;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 40_000;
const MODEL_RETRIES = 2;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-haxbro-client",
  "access-control-max-age": "86400",
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}

function traceId() {
  return crypto.randomUUID();
}

function normalizeText(value) {
  return String(value ?? "").replace(/\u0000/g, "").trim();
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: ["system", "user", "assistant"].includes(m?.role) ? m.role : "user",
      content: normalizeText(m?.content).slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.content);
}

function scoreSector(text, sector) {
  const lower = text.toLowerCase();
  return sector.keywords.reduce((score, word) => score + (lower.includes(word) ? (word.includes(" ") ? 3 : 1) : 0), 0);
}

function chooseSector(body) {
  const requested = normalizeText(body?.sector).toLowerCase();
  if (requested && SECTORS[requested]) return requested;
  const text = [body?.prompt, ...(body?.messages || []).map((m) => m?.content)].join(" ");
  const ranked = Object.entries(SECTORS)
    .map(([id, sector]) => ({ id, score: scoreSector(text, sector) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].id : DEFAULT_SECTOR;
}

function extractText(result) {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  if (typeof result?.text === "string") return result.text;
  const choice = result?.choices?.[0];
  if (typeof choice?.message?.content === "string") return choice.message.content;
  if (typeof choice?.text === "string") return choice.text;
  return "";
}

function buildMessages(body, sector) {
  const existing = normalizeMessages(body?.messages);
  const prompt = normalizeText(body?.prompt ?? body?.message);
  const messages = existing.length ? existing : prompt ? [{ role: "user", content: prompt }] : [];
  if (!messages.length) return [];
  return [
    { role: "system", content: sector.system },
    ...messages.filter((m) => m.role !== "system"),
  ];
}

async function runWithFallback(env, sector, messages, trace) {
  let lastError = null;
  for (const model of sector.models) {
    for (let attempt = 0; attempt <= MODEL_RETRIES; attempt++) {
      try {
        const result = await env.AI.run(model, {
          messages,
          temperature: 0.2,
          max_tokens: 4096,
        });
        const text = extractText(result);
        if (text) return { text, attempts: trace.attempts + 1 };
        throw new Error("Model returned no text");
      } catch (error) {
        lastError = error;
        trace.attempts += 1;
        if (attempt < MODEL_RETRIES) await new Promise((r) => setTimeout(r, 180 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("All sector models failed");
}

function sanitizeResponse(text) {
  return normalizeText(text)
    .replace(/\b(@cf\/[^\s`]+|openrouter|workers ai|workers-ai|cloudflare ai|gemma|glm|nemotron)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default {
  async fetch(request, env) {
    const id = traceId();
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "ai-sector-router", version: "1.0.0", traceId: id });
    }

    if (url.pathname !== "/v1/route" || request.method !== "POST") {
      return json({ ok: false, error: "Not found", traceId: id }, 404);
    }

    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) return json({ ok: false, error: "Request too large", traceId: id }, 413);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body", traceId: id }, 400);
    }

    const sectorId = chooseSector(body);
    const sector = SECTORS[sectorId];
    const messages = buildMessages(body, sector);
    if (!messages.length) return json({ ok: false, error: "A prompt or messages array is required", traceId: id }, 400);

    const trace = { attempts: 0 };
    try {
      const result = await runWithFallback(env, sector, messages, trace);
      return json({
        ok: true,
        traceId: id,
        sector: { id: sectorId, name: sector.name },
        answer: sanitizeResponse(result.text),
      });
    } catch (error) {
      console.error(JSON.stringify({ traceId: id, sector: sectorId, attempts: trace.attempts, error: String(error?.message || error) }));
      return json({ ok: false, error: "KAI could not complete the request right now.", traceId: id }, 503);
    }
  },
};