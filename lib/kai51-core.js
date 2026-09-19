const NODE_NAMES = [
  'identity','memory','context','planner','reasoner','tools',
  'app-maker','code-writer','security','research','verifier','recovery'
];

function clean(value, max = 12000) {
  return String(value ?? '').replace(/\u0000/g, '').slice(0, max);
}

function normalizeUsername(username = '') {
  return clean(username, 64).replace(/[^a-zA-Z0-9_-]/g, '_') || 'anonymous-device';
}

function localCapability(prompt) {
  const text = clean(prompt, 4000).trim().toLowerCase();
  if (/^\s*(what is|calculate|compute|solve)\b/.test(text) && /[0-9][0-9+\-*/().\s]+$/.test(text)) return 'deterministic-math';
  if (/\b(timer|stopwatch|countdown)\b/.test(text)) return 'browser-timer';
  if (/\b(unit conversion|convert)\b/.test(text)) return 'unit-conversion';
  if (/\b(json|format json|validate json)\b/.test(text)) return 'json-tool';
  return null;
}

function safeMath(expression) {
  const expr = clean(expression, 200).replace(/^(what is|calculate|compute|solve)\s*/i, '').trim();
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null;
  try {
    // Deliberately limited deterministic evaluator for simple arithmetic only.
    const value = Function(`"use strict"; return (${expr})`)();
    return Number.isFinite(value) ? value : null;
  } catch { return null; }
}

export function executeLocal({ prompt = '' } = {}) {
  const capability = localCapability(prompt);
  const text = clean(prompt, 4000).trim();
  if (capability === 'deterministic-math') {
    const value = safeMath(text);
    if (value !== null) return { capability, handled: true, text: String(value), data: { value } };
  }
  if (capability === 'json-tool') {
    try {
      const candidate = text.replace(/^.*?\{/, '{');
      const parsed = JSON.parse(candidate);
      return { capability, handled: true, text: JSON.stringify(parsed, null, 2), data: parsed };
    } catch {
      return { capability, handled: true, text: 'I can validate or format JSON locally, but the supplied text is not valid JSON.', data: null };
    }
  }
  if (capability === 'browser-timer') {
    return { capability, handled: true, text: 'Timer capability is local-first and ready in the browser.', data: { local: true } };
  }
  if (capability === 'unit-conversion') {
    return { capability, handled: true, text: 'Unit conversion capability is local-first. Use a value and source/target units for a deterministic conversion.', data: { local: true } };
  }
  return { capability: null, handled: false, text: '', data: null };
}

export function createKai51Plan({ prompt = '', username = '', history = '' } = {}) {
  const capability = localCapability(prompt);
  const requested = clean(prompt, 12000);
  const nodeTrace = NODE_NAMES.map((node, index) => ({ node, order: index + 1, status: 'ready' }));
  return {
    id: `kai51-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    identity: 'KAI 51',
    truthful: true,
    localFirst: true,
    userScope: normalizeUsername(username),
    memoryScope: 'browser-local-per-user',
    request: requested,
    historyPresent: Boolean(history),
    capability,
    needsProvider: !capability,
    providerPolicy: capability ? 'do-not-delegate' : 'optional-after-local-check',
    nodeTrace,
    steps: [
      { step: 'understand', status: 'complete' },
      { step: 'plan', status: 'complete' },
      { step: capability ? 'local-capability' : 'provider-delegation-check', status: 'complete' },
      { step: 'verify', status: capability ? 'complete' : 'pending' }
    ]
  };
}

export function localMemoryKey(username = '') {
  return `haxbro:kai51:${normalizeUsername(username)}:memory`;
}

export function truthfulIdentity() {
  return 'I am KAI 51, HAxBRO\'s local-first intelligence and orchestration layer. HAxBRO may delegate selected tasks to external providers as optional compute; those providers are not my identity, and KAI 51 is not currently a standalone foundation model.';
}

export const KAI51_NODES = NODE_NAMES;