(() => {
  const VERSION = 'kai51-local-controller-v9';
  const KEY = 'haxbro:kai51:installation:v5';
  const MODEL = 'HAxBRO/KAI-51-SMOLLM2-360M';
  const safe = (v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);

  const defaultState = () => ({
    status:'not_installed',
    installed:false,
    verified:false,
    model:MODEL,
    updatedAt:null,
    error:null
  });

  const read = () => {
    try {
      const x = JSON.parse(localStorage.getItem(KEY)||'null');
      if (!x || typeof x !== 'object') return defaultState();
      return {
        status: ['not_installed','installing','ready','error'].includes(x.status) ? x.status : 'not_installed',
        installed: x.status === 'ready' || x.installed === true,
        verified: x.status === 'ready' || x.verified === true,
        model: x.model || MODEL,
        updatedAt: x.updatedAt || null,
        error: x.error || null
      };
    } catch { return defaultState(); }
  };

  const write = patch => {
    const next = {...read(),...patch,updatedAt:new Date().toISOString()};
    try { localStorage.setItem(KEY,JSON.stringify(next)); } catch {}
    window.HAxBROKai51BootstrapState = next;
    window.dispatchEvent(new CustomEvent('haxbro:kai51-bootstrap',{detail:next}));
    return next;
  };

  let state = read();
  let enginePromise = null;

  function emit(detail) {
    window.dispatchEvent(new CustomEvent('haxbro:kai-local-progress',{detail}));
    window.dispatchEvent(new CustomEvent('haxbro:kai51-bootstrap',{detail}));
  }

  async function loadEngine() {
    if (window.HAxBROKai51Engine?.generate) return window.HAxBROKai51Engine;
    if (enginePromise) return enginePromise;

    state = write({status:'installing',installed:state.installed,verified:false,error:null});
    emit({profile:'heavy',progress:state.installed ? 95 : 2,status:state.installed
      ? 'KAI 51 installed · restoring local intelligence'
      : 'KAI 51 first-time installation starting'});

    enginePromise = (async () => {
      const mod = await import('/kai51-local-engine.js?v=15');
      const engine = await mod.createKai51Engine({
        onProgress:p => emit({profile:'heavy',...p}),
        onReady:info => {
          state = write({status:'ready',installed:true,verified:true,model:info?.model||MODEL,error:null});
          emit({profile:'heavy',progress:100,status:'KAI 51 installed and verified',installed:true,verified:true});
          window.HAxBROKai51Installed = true;
          window.HAxBRO_KAI51_LOCAL_READY = true;
          window.dispatchEvent(new CustomEvent('haxbro:kai51-ready',{detail:info||{}}));
        }
      });
      window.HAxBROKai51Engine = engine;
      await engine.prepare();
      return engine;
    })().catch(err => {
      state = write({status:'error',installed:state.installed,verified:false,error:safe(err?.message||err,500)});
      emit({profile:'heavy',progress:99,status:'KAI 51 verification failed — retry required',error:state.error});
      enginePromise = null;
      throw err;
    });

    return enginePromise;
  }

  async function maybeInstall() {
    state = read();
    // A READY state means the model was already downloaded and verified on this device.
    // We still restore the runtime after a page reload, but this is NOT a new download.
    return loadEngine();
  }

  async function generate(message,history=[]) {
    const engine = await loadEngine();
    return engine.generate(message,history);
  }

  async function chat(message,history=[]) {
    return generate(message,history);
  }

  function status() {
    state = read();
    return {
      ...state,
      ready: state.status === 'ready',
      runtimeReady: !!window.HAxBROKai51Engine?.generate,
      local:true,
      externalChatProviders:false,
      model:state.model||MODEL,
      controller:VERSION
    };
  }

  window.HAxBROKai51Bootstrap = {
    version:VERSION,
    state:status,
    maybeInstall,
    prepare:maybeInstall,
    generate,
    chat,
    isInstalled:()=>read().status==='ready',
    resetForTesting() {
      try { localStorage.removeItem(KEY); } catch {}
      state = write(defaultState());
    }
  };

  // Durable browser storage is requested so the downloaded model is less likely
  // to be evicted under storage pressure.
  try { navigator.storage?.persist?.().catch(()=>{}); } catch {}

  // Restore the already-installed model runtime in the background.
  // This does not mean "download again"; Transformers.js reuses its browser cache.
  setTimeout(()=>maybeInstall().catch(()=>{}),250);
})();