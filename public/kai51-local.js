(() => {
  const VERSION = 'kai51-local-controller-v3';
  const TARGET = 6;
  const KEY = 'haxbro:kai51:bootstrap:v1';
  const safe = (v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
  const read = () => {
    try {
      const x = JSON.parse(localStorage.getItem(KEY)||'{}');
      return {
        successes: Math.max(0, Math.min(TARGET, Number(x.successes)||0)),
        status: ['bootstrap','installing','ready','error'].includes(x.status) ? x.status : 'bootstrap',
        updatedAt: x.updatedAt || null,
        model: x.model || null,
        error: x.error || null
      };
    } catch { return {successes:0,status:'bootstrap',updatedAt:null,model:null,error:null}; }
  };
  const write = s => {
    const next = {...s,updatedAt:new Date().toISOString()};
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
    state = write({...state,status:'installing',error:null});
    emit({profile:'heavy',progress:2,status:'initializing local runtime'});
    enginePromise = (async () => {
      const mod = await import('/kai51-local-engine.js?v=1');
      const engine = await mod.createKai51Engine({
        onProgress:p => emit({profile:'heavy',...p}),
        onReady:info => {
          state = write({...state,status:'ready',model:info?.model||'local-model',error:null});
          emit({profile:'heavy',progress:100,status:'KAI 51 local runtime ready',installed:true});
          window.dispatchEvent(new CustomEvent('haxbro:kai51-ready',{detail:info||{}}));
        }
      });
      window.HAxBROKai51Engine = engine;
      await engine.prepare();
      return engine;
    })().catch(err => {
      state = write({...state,status:'error',error:safe(err?.message||err,500)});
      emit({profile:'heavy',progress:99,status:'KAI 51 local runtime failed — retry required',error:state.error});
      enginePromise = null;
      throw err;
    });
    return enginePromise;
  }

  async function maybeInstall() {
    state = read();
    if (state.status === 'ready') return window.HAxBROKai51Engine || loadEngine();
    /* KAI 51 downloads immediately in the background. KAI Lite owns chat until
       this real browser model reports verified readiness. */
    return loadEngine();
  }

  function recordSuccess() {
    state = read();
    if (state.status === 'ready' || state.status === 'installing') return state;
    const successes = Math.min(TARGET, state.successes + 1);
    state = write({...state,successes,status:successes >= TARGET ? 'installing' : 'bootstrap',error:null});
    emit({
      profile:'heavy',
      progress: Math.round((successes/TARGET)*100),
      status: successes >= TARGET ? 'bootstrap threshold reached — preparing KAI 51 locally' : ('bootstrap conversation '+successes+'/'+TARGET)
    });
    /* The sixth successful KAI Lite/web turn is the handoff point: start the
       REAL browser model download in the background. Chat remains on KAI Lite
       until the engine reports verified readiness. */
    if(successes>=TARGET){
      queueMicrotask(()=>loadEngine().catch(()=>{}));
    }
    return state;
  }

  async function generate(message, history=[]) {
    const engine = await loadEngine();
    return engine.generate(message, history);
  }

  async function chat(message, history=[]) {
    return generate(message, history);
  }

  function status() {
    state = read();
    return {
      ...state,
      target: TARGET,
      ready: state.status === 'ready' && !!window.HAxBROKai51Engine?.generate,
      local: true,
      externalChatProviders: state.status !== 'ready',
      model: state.model || 'HuggingFaceTB/SmolLM2-360M-Instruct',
      controller: VERSION
    };
  }

  window.HAxBROKai51Bootstrap = {
    version: VERSION,
    target: TARGET,
    state: status,
    recordSuccess,
    maybeInstall,
    prepare: maybeInstall,
    generate,
    chat,
    resetForTesting() {
      localStorage.removeItem(KEY);
      state = write({successes:0,status:'bootstrap',updatedAt:null,model:null,error:null});
    }
  };

  // Start the real local KAI 51 download without blocking the chat UI.
  // KAI Lite remains the live chat engine until onReady() verifies the model.
  setTimeout(()=>maybeInstall().catch(()=>{}),250);
})();