const NODE_NAMES = [
  'identity','memory','context','planner','reasoner','tools',
  'app-maker','code-writer','security','research','verifier','recovery'
];

function clean(value, max = 12000) {
  return String(value ?? '').replace(/\u0000/g, '').slice(0, max);
}

function localCapability(prompt) {
  const text = clean(prompt, 4000).toLowerCase();
  if (/^\s*(what is|calculate|compute|solve)\b/.test(text) && /[0-9][0-9+\-*/().\s]+$/.test(text)) return 'deterministic-math';
  if (/\b(timer|stopwatch|countdown)\b/.test(text)) return 'browser-timer';
  if (/\b(unit conversion|convert)\b/.test(text)) return 'unit-conversion';
  if (/\b(json|format json|validate json)\b/.test(text)) return 'json-tool';
  return null;
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
    userScope: clean(username, 64) || 'anonymous-device',
    memoryScope: 'browser-local-per-user',
    request: requested,
    historyPresent: Boolean(history),
    capability,
    needsProvider: !capability,
    nodeTrace,
    steps: [
      { step: 'understand', status: 'complete' },
      { step: 'plan', status: 'complete' },
      { step: capability ? 'local-capability' : 'provider-delegation-check', status: 'complete' },
      { step: 'verify', status: capability ? 'pending' : 'provider-dependent' }
    ]
  };
}

export function localMemoryKey(username = '') {
  const safe = clean(username, 64).replace(/[^a-zA-Z0-9_-]/g, '_') || 'anonymous-device';
  return `haxbro:kai51:${safe}:memory`;
}

export function truthfulIdentity() {
  return 'I am KAI 51, HAxBRO\'s local-first intelligence and orchestration layer. HAxBRO may delegate selected tasks to external providers as optional compute; those providers are not my identity, and KAI 51 is not currently a standalone foundation model.';
}

export const KAI51_NODES = NODE_NAMES;