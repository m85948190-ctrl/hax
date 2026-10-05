(() => {
  const VERSION = 'kai51-local-controller-v11-github-q4';
  const KEY = 'haxbro:kai51:installation:v14-github-q4';
  const MODEL = 'HuggingFaceTB/SmolLM2-360M-Instruct';
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
  let transportPromise = null;

  function emit(detail) {
    window.dispatchEvent(new CustomEvent('haxbro:kai-local-progress',{detail}));
    window.dispatchEvent(new CustomEvent('haxbro:kai51-bootstrap',{detail}));
  }

  async function prepareTransport() {
    if (transportPromise) return transportPromise;
    transportPromise = (async()=>{
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.register('/kai51-model-sw.js?v=3',{scope:'/'});
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve=>{
          let finished=false;
          const finish=()=>{if(finished)return;finished=true;resolve()};
          navigator.serviceWorker.addEventListener('controllerchange',finish,{once:true});
          setTimeout(finish,5000);
        });
      }
      return !!navigator.serviceWorker.controller;
    })().catch(()=>false);
    return transportPromise;
  }

  async function loadEngine() {
    if (window.HAxBROKai51Engine?.generate) return window.HAxBROKai51Engine;
    if (enginePromise) return enginePromise;

    state = write({status:'installing',installed:state.installed,verified:false,error:null});
    emit({profile:'heavy',progress:state.installed ? 95 : 2,status:state.installed
      ? 'KAI 51 installed · restoring GitHub-backed neural intelligence'
      : 'KAI 51 GitHub-backed neural installation starting'});

    enginePromise = (async () => {
      await prepareTransport();
      const mod = await import('/kai51-local-engine.js?v=25');
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
      state = write({status:'error',installed:state.installed,verified:false,error:safe(err?.message||err,700)});
      emit({profile:'heavy',progress:99,status:'KAI 51 verification failed — retry required',error:state.error});
      enginePromise = null;
      throw err;
    });

    return enginePromise;
  }

  async function maybeInstall() {
    state = read();
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
      runtimeReady: !!(window.HAxBROKai51Engine && typeof window.HAxBROKai51Engine.isReady==='function' && window.HAxBROKai51Engine.isReady()),
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

  try { navigator.storage?.persist?.().catch(()=>{}); } catch {}
  /* Keep retrying the real model in the background. KAI Lite remains the user-facing
     bridge until the neural model is actually verified. */
  setTimeout(()=>maybeInstall().catch(()=>{}),250);
  setInterval(()=>{
    try{
      const s=read();
      if(s.status!=='ready' && !enginePromise) maybeInstall().catch(()=>{});
    }catch{}
  },15000);
})();