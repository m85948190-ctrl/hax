(() => {
  const username = () => {
    try { return localStorage.getItem('haxbro_username') || 'anonymous-device'; }
    catch { return 'anonymous-device'; }
  };
  const memKey = () => `haxbro:kai51:${username().replace(/[^a-zA-Z0-9._-]/g, '_')}:memory`;
  const readMemory = () => {
    try { return JSON.parse(localStorage.getItem(memKey()) || '{"notes":[]}'); }
    catch { return { notes: [] }; }
  };
  const writeMemory = memory => {
    try { localStorage.setItem(memKey(), JSON.stringify({ notes: (memory.notes || []).slice(-12) })); }
    catch {}
  };
  const addMemory = note => {
    const memory = readMemory();
    memory.notes.push({ text: String(note || '').slice(0, 500), at: Date.now() });
    writeMemory(memory);
  };
  const status = () => window.HAxBROKai51Bootstrap?.state?.() || { status: 'bootstrap', ready: false, apiKeyRequired: false };
  const prepare = () => window.HAxBROKai51Bootstrap?.prepare?.();
  const respond = async (prompt, history = [], options = {}) => {
    const q = String(prompt || '').trim();
    if (!q) return null;
    const bootstrap = window.HAxBROKai51Bootstrap;
    if (!bootstrap?.generate) throw new Error('KAI 51 browser-local runtime is not loaded.');
    const current = status();
    if (current.ready && bootstrap.generate) {
      try { return await bootstrap.generate(q, history, options, 'local'); }
      catch (error) {
        if (error?.name === 'AbortError') throw error;
        return window.HAxBROKaiLite?.respond?.(q, history, options);
      }
    }
    return window.HAxBROKaiLite?.respond?.(q, history, options);
  };
  window.HAxBROLocalKai = {
    start: prepare, prepare, generate: respond, respond,
    profileFor: () => 'local',
    isTrivial: t => /^(hi|hello|hey|yo|thanks|thank you|okay|ok)$/i.test(String(t || '').trim()),
    readMemory, addMemory, status,
    apiStatus: async () => ({ ...status(), apiKeyRequired: false, execution: 'browser-local' })
  };
})();