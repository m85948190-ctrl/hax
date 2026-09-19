(() => {
  const NODE_NAMES = ['identity','memory','context','planner','reasoner','tools','app-maker','code-writer','security','research','verifier','recovery'];
  const VERSION = 'kai51-local-v1';
  const safe = (value, max = 12000) => String(value ?? '').replace(/\u0000/g, '').slice(0, max);

  function scope(username) {
    const normalized = safe(username, 64).replace(/[^a-zA-Z0-9_-]/g, '_') || 'anonymous-device';
    return `haxbro:kai51:${normalized}`;
  }

  function readMemory(username) {
    try { return JSON.parse(localStorage.getItem(`${scope(username)}:memory`) || '{"notes":[],"updatedAt":null}'); }
    catch { return { notes: [], updatedAt: null }; }
  }

  function writeMemory(username, memory) {
    const next = { notes: Array.isArray(memory?.notes) ? memory.notes.slice(-12) : [], updatedAt: new Date().toISOString() };
    localStorage.setItem(`${scope(username)}:memory`, JSON.stringify(next));
    return next;
  }

  function buildPlan(prompt, username) {
    const text = safe(prompt, 4000).toLowerCase();
    const localCapability = /\b(timer|stopwatch|countdown|calculator|unit conversion|json)\b/.test(text);
    return {
      version: VERSION,
      identity: 'KAI 51',
      truthful: true,
      localFirst: true,
      userScope: scope(username),
      nodes: NODE_NAMES.map((name, index) => ({ name, order: index + 1, status: 'ready' })),
      request: safe(prompt),
      localCapability: localCapability ? 'available' : null,
      providerPolicy: localCapability ? 'do-not-delegate' : 'optional-after-local-check',
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
    readMemory,
    writeMemory,
    addNote,
    buildPlan,
    identity() {
      return 'I am KAI 51, HAxBRO\'s local-first intelligence and orchestration layer. HAxBRO may delegate selected tasks to external providers as optional compute; those providers are not my identity, and KAI 51 is not currently a standalone foundation model.';
    }
  };
})();