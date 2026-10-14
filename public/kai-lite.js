(() => {
  const clean = value => String(value ?? '').replace(/\u0000/g, '').trim().slice(0, 12000);
  let active = null;
  async function respond(prompt, history = [], options = {}) {
    const q = clean(prompt);
    if (!q) return null;
    const bootstrap = window.HAxBROKai51Bootstrap;
    if (!bootstrap?.generate) throw new Error('KAI 51 browser-local neural runtime is not loaded yet.');
    if (active) return active;
    active = (async () => {
      const attempts = [
        { profile: 'local', label: 'KAI LOCAL · 135M' },
        { profile: 'github', label: 'KAI GITHUB · 360M' }
      ];
      const errors = [];
      for (const attempt of attempts) {
        if (options?.signal?.aborted) throw new DOMException('Response stopped by user', 'AbortError');
        try {
          options.onStage?.('local-neural', 'KAI LITE is loading ' + attempt.label + ' in this browser');
          const result = await bootstrap.generate(q, Array.isArray(history) ? history : [], {
            signal: options?.signal,
            onStage: options?.onStage,
            onProgress: options?.onProgress
          }, attempt.profile);
          const response = clean(result?.response || result?.text);
          if (!response) throw new Error(attempt.label + ' returned an empty response.');
          return {
            ...result,
            ok: true,
            response,
            provider: 'HAxBRO browser-local inference',
            model: result.model || attempt.label,
            local: true,
            apiKeyRequired: false
          };
        } catch (error) {
          if (error?.name === 'AbortError') throw error;
          errors.push(attempt.label + ': ' + String(error?.message || error));
        }
      }
      throw new Error('No browser-local model could answer this turn. ' + errors.join(' | '));
    })().finally(() => { active = null; });
    return active;
  }
  window.HAxBROKaiLite = {
    respond,
    status: () => ({
      ready: !!window.HAxBROKai51Bootstrap?.generate,
      model: 'KAI LITE · browser-local 135M / 360M',
      web: false,
      apiKeyRequired: false
    })
  };
})();