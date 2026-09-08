import { browser } from 'hatchable';

import { KAI_CONTROL, personalityPolicy } from 'lib/kai-control.js';

// KAI's provider chain is also controlled by the single KAI command center.
// Change lib/kai-control.js to change the chain instead of editing this file.
const KAI_MODELS = KAI_CONTROL.ai.providerChain;
const VENDOR_PROVIDERS = KAI_MODELS.map(x => x.provider);
// Legacy export kept for modules that import it; Google is no longer in the KAI chain.
const GOOGLE_EMERGENCY = { provider: 'Google Gemini', model: 'disabled' };

function clean(value, max = 12000) { return String(value ?? '').replace(/\u0000/g, '').slice(0, max); }
function normalizeUrl(value) { try { const u = new URL(value); return /^https?:$/i.test(u.protocol) ? u.toString() : ''; } catch { return ''; } }

function keyFor(candidate) {
  return candidate?.keyEnv ? process.env[candidate.keyEnv] : '';
}

async function openaiCompatible(candidate, messages, maxTokens, imageData = '') {
  const key = keyFor(candidate);
  if (!key) throw new Error(`${candidate.provider} API key is not configured`);
  const base = candidate.base || 'https://api.openai.com/v1';
  const payloadMessages = imageData && candidate.provider.startsWith('OpenRouter')
    ? messages.map((m, i) => i === messages.length - 1 && m.role === 'user'
      ? { ...m, content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: imageData } }] }
      : m)
    : messages;
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: candidate.model, messages: payloadMessages, ...(candidate.provider === 'OpenAI' ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }), temperature: KAI_CONTROL.ai.temperature })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`${candidate.provider} HTTP ${r.status}: ${clean(raw, 700)}`);
  const data = JSON.parse(raw);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${candidate.provider} returned no text`);
  return { text, usage: data.usage || null };
}

async function googleGenerate(messages, maxTokens, imageData = '') {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('Google Gemini API key is not configured');
  const system = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages.filter(m => m.role !== 'system').map((m, i, arr) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: clean(m.content, 14000) }, ...(imageData && i === arr.length - 1 && m.role === 'user' ? [{ inline_data: { mime_type: 'image/jpeg', data: imageData.replace(/^data:image\/[^;]+;base64,/, '') } }] : [])]
  }));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_EMERGENCY.model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: clean(system, 12000) }] }, contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 } })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`Google Gemini HTTP ${r.status}: ${clean(raw, 700)}`);
  const data = JSON.parse(raw);
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!text) throw new Error('Google Gemini returned no text');
  return { text, usage: data.usageMetadata || null };
}

async function googleSearch(query) {
  const q = clean(query, 500);
  if (!q) return { query: q, results: [] };
  try {
    const result = await browser.session(async page => {
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(q)}&num=8`, { waitUntil: 'domcontentloaded' });
      const results = await page.$$eval('a', anchors => anchors.map(a => {
        const h3 = a.querySelector('h3'); const href = a.href || ''; const title = (h3?.innerText || a.innerText || '').trim();
        return { title, url: href };
      }).filter(x => x.title && /^https?:/i.test(x.url)).slice(0, 8));
      return { results };
    });
    return { query: q, results: result?.results || [] };
  } catch (browserError) {
    try {
      const r = await fetch(`https://www.google.com/search?q=${encodeURIComponent(q)}&num=8`, { headers: { 'user-agent': 'Mozilla/5.0 HAxBRO-KAI/100' } });
      const html = await r.text(); const results = []; const re = /<a[^>]+href="(https?:\/\/[^"&]+)[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi; let m;
      while ((m = re.exec(html)) && results.length < 8) { const title = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(); const url = normalizeUrl(m[1]); if (title && url) results.push({ title, url }); }
      return { query: q, results, degraded: true };
    } catch (directError) { return { query: q, results: [], error: String(directError?.message || browserError?.message || 'Google search unavailable') }; }
  }
}

async function fetchPage(url) {
  const target = normalizeUrl(url); if (!target) return { url, error: 'Invalid URL' };
  try { const r = await fetch(target, { redirect: 'follow' }); const text = await r.text(); return { url: target, status: r.status, content: clean(text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '), 10000) }; }
  catch (e) { return { url: target, error: String(e?.message || e) }; }
}

// KAI-51 is ONLY invoked after every vendor API and Google emergency attempt fails.
async function kai51Research(prompt) {
  const query = clean(prompt, 700); const search = await googleSearch(query); const pages = [];
  for (const item of (search.results || []).slice(0, 5)) { const page = await fetchPage(item.url); if (page.content) pages.push({ title: item.title, url: item.url, content: page.content }); }
  return { coordinator: 'KAI-51', query, results: search.results || [], pages };
}

function baseSystem(system, localAgent) {
  const personality = personalityPolicy();
  const behavior = KAI_CONTROL.behavior;
  return `${clean(system, 12000)}\n\nYou are the user's personal AI agent inside HAxBRO. Your user-facing identity is ${localAgent}. Follow the KAI789 command center as the source of truth for behavior and authorization. Speak ${personality.tone}; ${personality.style}. Avoid ${personality.avoid.join(', ')}. Never call the user 'Kai 61' or 'temporarily unavailable'. HACKING + CHAT ARE ONE EXPERIENCE: ${behavior.hackingAndChatAreOneExperience ? 'keep security questions and normal conversation in the same natural experience.' : 'follow the configured separation.'} If asked whether you can hack, answer directly according to the authorization policy in the command center. Do not demand a URL unless a target inspection is actually requested. Do not expose API keys or private implementation secrets.`;
}

export async function complete({ system = '', prompt, maxTokens = 1800, username = '', history = '', imageData = '' } = {}) {
  const started = Date.now(); const identity = clean(username, 64) || 'local-user'; const localAgent = `${identity} AI Agent`; const attempts = [];
  const messages = [
    { role: 'system', content: baseSystem(system, localAgent) },
    ...(history ? [{ role: 'user', content: `Conversation context:\n${clean(history, 12000)}` }] : []),
    { role: 'user', content: clean(prompt, 12000) }
  ];

  // Keep the same three-key OpenRouter chain for text and image requests.
  // The selected OpenRouter model must support vision when imageData is supplied.
  const candidates = KAI_MODELS;
  for (const candidate of candidates) {
    const attempt = { provider: candidate.provider, model: candidate.model, stage: 'primary-vendor', status: 'attempted' };
    const t = Date.now();
    try {
      const result = await openaiCompatible(candidate, messages, maxTokens, imageData);
      attempt.status = 'success'; attempt.elapsedMs = Date.now() - t; attempts.push(attempt);
      return { provider: candidate.provider, model: candidate.model, text: result.text, elapsedMs: Date.now() - started, status: 'ok', attempts, agent: localAgent, steps: [], usage: result.usage };
    } catch (e) {
      attempt.status = 'failed'; attempt.elapsedMs = Date.now() - t; attempt.error = clean(e?.message || e, 900); attempts.push(attempt);
    }
  }

  // KAI deliberately stops after the three OpenRouter keys. The rest of HAxBRO's
  // existing provider/fallback architecture is untouched outside this module.
  throw new Error(`All three OpenRouter KAI keys failed. Attempts: ${attempts.map(a => `${a.provider}: ${a.error || a.status}`).join(' | ')}`);
}

export async function monitor() {
  return {
    checkedAt: new Date().toISOString(), independent: false, providerApis: true,
    providerChain: VENDOR_PROVIDERS, emergencyFallback: 'none', finalFallback: 'none',
    webSearch: 'disabled as an AI fallback', agentRuntime: 'KAI-61', storage: 'browser-local',
    configured: { OpenRouter1: !!process.env.OPENROUTER_API_KEY_1, OpenRouter2: !!process.env.OPENROUTER_API_KEY_2, OpenRouter3: !!process.env.OPENROUTER_API_KEY_3 }
  };
}

export { KAI_MODELS, VENDOR_PROVIDERS, GOOGLE_EMERGENCY };