(() => {
  const NODE_NAMES = ['identity','memory','context','planner','reasoner','tools','app-maker','code-writer','security','research','verifier','recovery'];
  const VERSION = 'kai51-local-v2';
  const safe = (value, max = 12000) => String(value ?? '').replace(/\u0000/g, '').slice(0, max);
  const normalize = (username) => safe(username, 64).replace(/[^a-zA-Z0-9_-]/g, '_') || 'anonymous-device';
  const scope = (username) => `haxbro:kai51:${normalize(username)}`;
  const memoryKey = (username) => `${scope(username)}:memory`;

  function readMemory(username) {
    try { return JSON.parse(localStorage.getItem(memoryKey(username)) || '{"notes":[],"updatedAt":null}'); }
    catch { return { notes: [], updatedAt: null }; }
  }

  function writeMemory(username, memory) {
    const next = { notes: Array.isArray(memory?.notes) ? memory.notes.slice(-12) : [], updatedAt: new Date().toISOString() };
    localStorage.setItem(memoryKey(username), JSON.stringify(next));
    return next;
  }

  function localCapability(prompt) {
    const text = safe(prompt, 4000).trim().toLowerCase();
    if (/^\s*(what is|calculate|compute|solve)\b/.test(text) && /[0-9][0-9+\-*/().\s]+$/.test(text)) return 'deterministic-math';
    if (/\b(timer|stopwatch|countdown)\b/.test(text)) return 'browser-timer';
    if (/\b(unit conversion|convert)\b/.test(text)) return 'unit-conversion';
    if (/\b(json|format json|validate json)\b/.test(text)) return 'json-tool';
    return null;
  }

  function executeLocal(prompt) {
    const capability = localCapability(prompt);
    const text = safe(prompt, 200).replace(/^(what is|calculate|compute|solve)\s*/i, '').trim();
    if (capability === 'deterministic-math' && /^[0-9+\-*/().\s]+$/.test(text)) {
      try { const value = Function(`"use strict"; return (${text})`)(); if (Number.isFinite(value)) return { handled: true, capability, text: String(value), data: { value } }; } catch {}
    }
    if (capability === 'json-tool') {
      try { const candidate = safe(prompt, 4000).replace(/^.*?\{/, '{'); const parsed = JSON.parse(candidate); return { handled: true, capability, text: JSON.stringify(parsed, null, 2), data: parsed }; }
      catch { return { handled: true, capability, text: 'The supplied text is not valid JSON.', data: null }; }
    }
    if (capability === 'browser-timer') return { handled: true, capability, text: 'Timer capability is available locally in this browser.', data: { local: true } };
    if (capability === 'unit-conversion') return { handled: true, capability, text: 'Unit conversion is local-first. Provide a value and source/target units.', data: { local: true } };
    return { handled: false, capability: null, text: '', data: null };
  }

  function buildPlan(prompt, username) {
    const capability = localCapability(prompt);
    return {
      version: VERSION,
      identity: 'KAI 51',
      truthful: true,
      localFirst: true,
      userScope: scope(username),
      nodes: NODE_NAMES.map((name, index) => ({ name, order: index + 1, status: 'ready' })),
      request: safe(prompt),
      localCapability: capability,
      providerPolicy: capability ? 'do-not-delegate' : 'optional-after-local-check',
      trace: [
        { step: 'understand', status: 'complete' },
        { step: 'plan', status: 'complete' },
        { step: capability ? 'local-capability' : 'provider-delegation-check', status: 'complete' },
        { step: capability ? 'local-execution' : 'provider-delegation', status: capability ? 'available' : 'allowed-after-local-check' }
      ],
      createdAt: new Date().toISOString()
    };
  }

  function addNote(username, note) {
    const memory = readMemory(username);
    memory.notes.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), text: safe(note, 500), createdAt: new Date().toISOString() });
    return writeMemory(username, memory);
  }

  window.HAxBROKai51 = {
    version: VERSION,
    nodes: NODE_NAMES,
    scope,
    memoryKey,
    readMemory,
    writeMemory,
    addNote,
    localCapability,
    executeLocal,
    buildPlan,
    identity() {
      return 'I am KAI 51, HAxBRO\'s local-first intelligence and orchestration layer. HAxBRO may delegate selected tasks to external providers as optional compute; those providers are not my identity, and KAI 51 is not currently a standalone foundation model.';
    }
  };
})();