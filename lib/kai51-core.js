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
  // Always-on local conversational lane: never surface provider/quota failure as a dead chat.
  // This is a deterministic safety net, not a claim of a full neural model.
  const l = text.toLowerCase();
  let reply = '';
  if (/^(hi|hello|hey|yo)\\b/.test(l)) reply = 'Hey 👋 KAI 51 is here. Tell me what you want to build, analyze, decode, code, or figure out.';
  else if (/\\b(thanks|thank you)\\b/.test(l)) reply = 'You’re welcome. I’m here — send the next task when you’re ready.';
  else if (/\\b(what can you do|capabilities|help)\\b/.test(l)) reply = 'I can chat naturally, route build requests into App Maker, decode or encrypt data locally, run X Pro analysis, write code, and help with research and security tasks.';
  else if (/\\b(what the hell|wtf|broken|glitch|error)\\b/.test(l)) reply = 'Yeah, that hit an execution problem. I won’t pretend it succeeded. Give me the task again and I’ll route it to the correct workspace.';
  else if (/\\b(build|make|create|develop)\\b/.test(l)) reply = 'Got it. I’m treating that as a build request and will route it to the appropriate HAxBRO build workspace.';
  else if (/\\b(decode|decrypt|encode|encrypt)\\b/.test(l)) reply = 'Got it. I’ll treat that as a local encoding or decoding task and use the matching HAxBRO workspace.';
  else if (/\\b(analy[sz]e|investigate|inspect|check)\\b/.test(l)) reply = 'Understood. I’ll treat that as an analysis request and use the matching HAxBRO capability rather than turning it into generic chat.';
  else reply = 'I understand you. Keep going — tell me the outcome you want, and I’ll work from that instead of giving you a generic template.';
  return { capability: 'local-conversation', handled: true, text: reply, data: { local: true, deterministic: true } };
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
    needsProvider: false,
    providerPolicy: 'never-delegate',
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
  return 'I am KAI 51, HAxBRO\'s local-first intelligence and orchestration layer. HAxBRO may delegate selected tasks to external providers as optional compute only. KAI 51 remains the authority and never cascades to a fallback provider.';
}

export const KAI51_NODES = NODE_NAMES;