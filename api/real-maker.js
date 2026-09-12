import { complete } from "../lib/core.js";

export const access = "public";

const clean = (v, n = 14000) => String(v ?? "").replace(/\u0000/g, "").slice(0, n);

function parseJson(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(raw); } catch {}
  const a = raw.indexOf("{"); const b = raw.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(raw.slice(a, b + 1)); } catch {} }
  return null;
}

async function ask(stage, prompt, username) {
  const system = `You are the ${stage} inside HAxBRO Real Maker, a professional AI creative production workspace. Work like a production specialist, not a chatbot. Be concrete, visual, structured and production-ready. Do not claim to have rendered media unless it was actually rendered. Return valid JSON only when requested.`;
  return complete({ system, prompt, maxTokens: 2600, username });
}

export default async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
  const body = req.body || {};
  const idea = clean(body.idea, 9000).trim();
  const username = clean(body.username, 64).trim();
  const format = clean(body.format, 40) || "9:16";
  const duration = clean(body.duration, 30) || "20s";
  const goal = clean(body.goal, 1200) || "short-form marketing video";
  if (!idea) return res.status(400).json({ error: "Tell Real Maker what you want to create." });

  const director = await ask("Director", `Plan this project from one idea. Create a concise production brief, audience, hook, tone, visual language, duration, aspect ratio and 5-8 scene beats.\n\nIDEA: ${idea}\nGOAL: ${goal}\nFORMAT: ${format}\nDURATION: ${duration}\n\nReturn JSON with keys: title, brief, audience, hook, tone, visualStyle, scenes (array of {id,title,goal,visual,dialogue,caption,duration}), assetPlan.`, username);
  const directorJson = parseJson(director.text) || { title: "Real Maker Project", brief: director.text, scenes: [] };

  const creative = await ask("Creative Producer", `Turn this production brief into polished short-form creative direction. Improve the hook, scene continuity, dialogue/captions, camera language, character consistency and CTA. Do not change the user's core idea.\n\nBRIEF:\n${clean(JSON.stringify(directorJson), 11000)}\n\nReturn JSON with keys: hook, script, characterBible, visualBible, scenes (array with id,title,shot,camera,action,dialogue,caption,transition,duration,assetNeeds), cta.`, username);
  const creativeJson = parseJson(creative.text) || { script: creative.text, scenes: directorJson.scenes || [] };

  const critic = await ask("Creative Critic", `Quality-check this proposed production as if it will be shown to a paying client. Identify weak scenes, continuity problems, generic visuals, pacing issues and missing assets, then produce a corrected final scene list. Preserve the core idea.\n\nDIRECTOR:\n${clean(JSON.stringify(directorJson), 9000)}\n\nCREATIVE:\n${clean(JSON.stringify(creativeJson), 11000)}\n\nReturn JSON with keys: verdict, fixes, finalScenes, finalScript, publishChecklist.`, username);
  const criticJson = parseJson(critic.text) || { verdict: "READY WITH REVIEW", fixes: [], finalScenes: creativeJson.scenes || directorJson.scenes || [], finalScript: creativeJson.script || "", publishChecklist: [] };

  return res.json({
    ok: true,
    engine: "HAxBRO Real Maker",
    architecture: ["Director", "Creative Producer", "Creative Critic", "ULTIMAX-ready orchestration"],
    project: {
      title: directorJson.title || "Real Maker Project",
      brief: directorJson.brief || "",
      audience: directorJson.audience || "",
      hook: creativeJson.hook || directorJson.hook || "",
      tone: directorJson.tone || "",
      format,
      duration,
      visualStyle: directorJson.visualStyle || "",
      characterBible: creativeJson.characterBible || "",
      visualBible: creativeJson.visualBible || "",
      script: criticJson.finalScript || creativeJson.script || "",
      scenes: criticJson.finalScenes || creativeJson.scenes || directorJson.scenes || [],
      fixes: criticJson.fixes || [],
      cta: creativeJson.cta || "",
      publishChecklist: criticJson.publishChecklist || [],
      assetPlan: directorJson.assetPlan || []
    },
    providerTelemetry: [director, creative, critic].map(x => ({ provider: x.provider, model: x.model, elapsedMs: x.elapsedMs, status: x.status }))
  });
}