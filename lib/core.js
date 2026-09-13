import { browser, ai } from 'hatchable';

// Primitive HAxBRO provider chain. Keep this order stable unless the product
// owner explicitly changes the failover policy.
const CORE_MODELS = [
  { provider: 'Google Gemini', model: 'gemini-3.8-flash', kind: 'google', keyEnv: 'GOOGLE_API_KEY' },
  { provider: 'OpenRouter 1', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_1' },
  { provider: 'Groq 1', model: 'openai/gpt-oss-20b', base: 'https://api.groq.com/openai/v1', keyEnv: 'GROQ_API_KEY' },
  { provider: 'OpenRouter 2', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_2' },
  { provider: 'Groq 2', model: 'openai/gpt-oss-20b', base: 'https://api.groq.com/openai/v1', keyEnv: 'GROQ_API_KEY_2' },
  { provider: 'OpenAI', model: 'gpt-5.4-mini', base: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY' }
];

function clean(value, max = 12000) {
  return String(value ?? '').replace(/\u0000/g, '').slice(0, max);
}

function keyFor(c) { return c?.keyEnv ? process.env[c.keyEnv] : ''; }

async function openaiCompatible(c, messages, maxTokens, imageData = '') {
  const key = keyFor(c);
  if (!key) throw new Error(`${c.provider} API key is not configured`);
  const payloadMessages = imageData
    ? messages.map((m, i) => i === messages.length - 1 && m.role === 'user'
      ? { ...m, content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: imageData } }] }
      : m)
    : messages;
  const r = await fetch(`${c.base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: c.model, messages: payloadMessages, max_tokens: maxTokens, temperature: 0.2 })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`${c.provider} HTTP ${r.status}: ${clean(raw, 700)}`);
  const data = JSON.parse(raw);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${c.provider} returned no text`);
  return { text, usage: data.usage || null };
}

async function googleGenerate(c, messages, maxTokens, imageData = '') {
  const key = keyFor(c);
  if (!key) throw new Error('Google Gemini API key is not configured');
  const system = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages.filter(m => m.role !== 'system').map((m, i, arr) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [
      { text: clean(m.content, 14000) },
      ...(imageData && i === arr.length - 1 && m.role === 'user'
        ? [{ inline_data: { mime_type: imageData.match(/^data:(image\/[^;]+);base64,/)?.[1] || 'image/jpeg', data: imageData.replace(/^data:image\/[^;]+;base64,/, '') } }]
        : [])
    ]
  }));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${c.model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: clean(system, 12000) }] }, contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 } })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`Google Gemini HTTP ${r.status}: ${clean(raw, 700)}`);
  const data = JSON.parse(raw);
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!text) throw new Error('Google Gemini returned no text');
  return { text, usage: data.usageMetadata || null };
}

async function kai51WebFallback({ prompt, system, maxTokens }) {
  const query = clean(prompt, 700).replace(/\s+/g, ' ').trim();
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  let webText = '';
  try {
    const html = await browser.html(searchUrl);
    webText = String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 18000);
  } catch (e) {
    webText = `Web retrieval failed: ${clean(e?.message || e, 600)}`;
  }

  // KAI 51 is the final research layer. It uses Hatchable's managed AI
  // gateway only after the dedicated provider chain has exhausted itself.
  try {
    const result = await ai.generateText({
      model: 'gpt-mini',
      system: `${clean(system, 10000)}\n\nYou are KAI 51, the final web-research fallback. Use the supplied web material as evidence. Be explicit when evidence is incomplete. Do not claim browsing you did not perform.`,
      prompt: `User request:\n${query}\n\nPublic web material collected for this request:\n${webText}`,
      maxSteps: 1,
      maxTokens,
      purpose: 'haxbro-kai51-web-fallback'
    });
    if (result?.text) return { text: result.text, webSteps: [{ provider: 'KAI 51', action: 'web-research', query }] };
  } catch (e) {
    console.error('KAI 51 managed-AI synthesis failed', e);
  }

  return {
    text: webText || 'KAI 51 could not retrieve enough public web information to answer this request.',
    webSteps: [{ provider: 'KAI 51', action: 'web-research', query }]
  };
}

export async function complete({ system = '', prompt, maxTokens = 1800, username = '', history = '', imageData = '' } = {}) {
  const started = Date.now();
  const agent = `${clean(username, 64) || 'local-user'} AI Agent`;
  const messages = [
    { role: 'system', content: `${clean(system, 12000)}\n\nYou are the user's personal AI agent inside HAxBRO. Your user-facing identity is ${agent}. Never expose API keys or private implementation secrets.` },
    ...(history ? [{ role: 'user', content: `Conversation context:\n${clean(history, 12000)}` }] : []),
    { role: 'user', content: clean(prompt, 12000) }
  ];
  const attempts = [];

  for (const candidate of CORE_MODELS) {
    const t = Date.now();
    const attempt = { provider: candidate.provider, model: candidate.model, stage: 'primitive-provider', status: 'attempted' };
    try {
      const result = candidate.kind === 'google'
        ? await googleGenerate(candidate, messages, maxTokens, imageData)
        : await openaiCompatible(candidate, messages, maxTokens, imageData);
      attempt.status = 'success';
      attempt.elapsedMs = Date.now() - t;
      attempts.push(attempt);
      return { provider: candidate.provider, model: candidate.model, text: result.text, elapsedMs: Date.now() - started, status: 'ok', attempts, agent, steps: [], usage: result.usage };
    } catch (e) {
      attempt.status = 'failed';
      attempt.elapsedMs = Date.now() - t;
      attempt.error = clean(e?.message || e, 900);
      attempts.push(attempt);
    }
  }

  const fallback = await kai51WebFallback({ prompt, system, maxTokens });
  return {
    provider: 'KAI 51',
    model: 'web-research-fallback',
    text: fallback.text,
    elapsedMs: Date.now() - started,
    status: 'final-fallback',
    attempts,
    agent: 'KAI 51',
    steps: fallback.webSteps || [],
    usage: null
  };
}

export const CORE_PROVIDER_CHAIN = [...CORE_MODELS.map(x => x.provider), 'KAI 51'];