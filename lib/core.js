const CORE_MODELS = [
  { provider: 'OpenAI', model: 'gpt-5.4-mini', base: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY' },
  { provider: 'Groq', model: 'openai/gpt-oss-20b', base: 'https://api.groq.com/openai/v1', keyEnv: 'GROQ_API_KEY' },
  { provider: 'Mistral', model: 'mistral-small-latest', base: 'https://api.mistral.ai/v1', keyEnv: 'MISTRAL_API_KEY' },
  { provider: 'Google Gemini', model: 'gemini-3.8-flash', kind: 'google', keyEnv: 'GOOGLE_API_KEY' },
  { provider: 'Hugging Face', model: 'Qwen/Qwen2.5-7B-Instruct', kind: 'huggingface', keyEnv: 'HF_TOKEN' }
];

function clean(value, max = 12000) { return String(value ?? '').replace(/\u0000/g, '').slice(0, max); }

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

async function huggingFace(c, messages, maxTokens) {
  const key = keyFor(c);
  if (!key) throw new Error('Hugging Face token is not configured');
  const r = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: c.model, messages, max_tokens: maxTokens, temperature: 0.2 })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`Hugging Face HTTP ${r.status}: ${clean(raw, 700)}`);
  const data = JSON.parse(raw);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Hugging Face returned no text');
  return { text, usage: data.usage || null };
}

function localAgentName(username) { return `${clean(username, 64) || 'local-user'} AI Agent`; }

export async function complete({ system = '', prompt, maxTokens = 1800, username = '', history = '', imageData = '' } = {}) {
  const started = Date.now();
  const agent = localAgentName(username);
  const messages = [
    { role: 'system', content: `${clean(system, 12000)}\n\nYou are the user's personal AI agent inside HAxBRO. Your user-facing identity is ${agent}. Never expose API keys or private implementation secrets.` },
    ...(history ? [{ role: 'user', content: `Conversation context:\n${clean(history, 12000)}` }] : []),
    { role: 'user', content: clean(prompt, 12000) }
  ];
  const attempts = [];
  for (const candidate of CORE_MODELS) {
    const t = Date.now();
    const attempt = { provider: candidate.provider, model: candidate.model, stage: 'core-provider', status: 'attempted' };
    try {
      let result;
      if (candidate.kind === 'google') result = await googleGenerate(candidate, messages, maxTokens, imageData);
      else if (candidate.kind === 'huggingface') result = await huggingFace(candidate, messages, maxTokens);
      else result = await openaiCompatible(candidate, messages, maxTokens, imageData);
      attempt.status = 'success'; attempt.elapsedMs = Date.now() - t; attempts.push(attempt);
      return { provider: candidate.provider, model: candidate.model, text: result.text, elapsedMs: Date.now() - started, status: 'ok', attempts, agent, steps: [], usage: result.usage };
    } catch (e) {
      attempt.status = 'failed'; attempt.elapsedMs = Date.now() - t; attempt.error = clean(e?.message || e, 900); attempts.push(attempt);
    }
  }
  throw new Error(`All main HAxBRO providers failed. Attempts: ${attempts.map(a => `${a.provider}: ${a.error || a.status}`).join(' | ')}`);
}

export const CORE_PROVIDER_CHAIN = CORE_MODELS.map(x => x.provider);