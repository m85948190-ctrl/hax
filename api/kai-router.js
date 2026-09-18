import { ai } from "hatchable";

export const access = "public";

export default async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  const text = String(req.body?.message || "").trim();
  if (!text) return res.json({ ok:true, wantsApp:false, confidence:0 });

  const system = `You are KAI ROUTER, a lightweight intent detector for HAxBRO AI.
Your ONLY job is to decide whether the user's message is actually asking HAxBRO to make, build, create, generate, develop, design, turn into, or deploy a software product/app/website/tool/game/AI assistant.

Return ONLY valid JSON:
{"wantsApp":true|false,"confidence":0-1}

Rules:
- Understand meaning, not keywords.
- wantsApp=true when the user is directly asking to build/create/modify/turn something into a software product.
- wantsApp=false for ordinary conversation, questions, explanations, jokes, roasts, pasted chat transcripts, quoted messages, reviews, commentary, or discussions ABOUT apps/AI/building.
- If a pasted message contains an explicit build request as the user's intended instruction, classify true.
- Do not classify merely because words like "app", "AI", "build", "project", or "create" appear.
- Confidence should be below 0.5 when intent is ambiguous.`;

  try {
    const out = await ai.generateText({
      model: "gpt-mini",
      system,
      prompt: text,
      maxTokens: 80,
      purpose: "intent-routing"
    });
    const raw = String(out?.text || out?.response || out || "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    const confidence = Math.max(0, Math.min(1, Number(parsed?.confidence || 0)));
    const wantsApp = parsed?.wantsApp === true && confidence >= 0.72;
    return res.json({ ok:true, wantsApp, confidence });
  } catch (e) {
    return res.json({ ok:true, wantsApp:false, confidence:0, fallback:true });
  }
}