(() => {
  const VERSION = 'kai51-unified-controller-v14-local-first';
  const KEY = 'haxbro:kai51:installation:v14-github-q4';
  const LOCAL_KEY = 'haxbro:kai51:local-intelligence:og-v1';
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
        status: ['not_installed','installing','restoring','ready','error'].includes(x.status) ? x.status : 'not_installed',
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
  let enginePromise = window.__HAxBROKai51EnginePromise || null;
  let transportPromise = null;

  function emit(detail) {
    window.dispatchEvent(new CustomEvent('haxbro:kai-local-progress',{detail}));
    window.dispatchEvent(new CustomEvent('haxbro:kai51-bootstrap',{detail}));
  }

  async function prepareTransport() {
    if (transportPromise) return transportPromise;
    transportPromise = (async()=>{
      if (!('serviceWorker' in navigator)) return false;
      return false; // Legacy model service-worker transport is retired; KAI 51 uses the engine's browser cache.
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

    const restoring=state.installed===true;
    state = write({status:restoring?'restoring':'installing',installed:state.installed,verified:false,error:null});
    emit({profile:'heavy',progress:restoring ? 95 : 2,status:restoring
      ? 'KAI 51 installed · restoring from persistent browser cache'
      : 'KAI 51 neural installation starting'});

    enginePromise = window.__HAxBROKai51EnginePromise = (async () => {
      // The current browser-ready ONNX package is fetched directly from Hugging Face.
      // Do not register the legacy GitHub model service worker on this path.
      const mod = await import('/kai51-local-engine.js?v=34');
      const engine = await mod.createKai51Engine({
        onProgress:p => emit({profile:'heavy',...p}),
        preferCache:state.installed===true,
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

  function localInstallState(){
    try{
      const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');
      return x&&x.ready===true?x:null;
    }catch{return null}
  }

  async function installLocalFirst(){
    /* LOCAL is the OG orchestration intelligence, so its "installation" is the
       deterministic registration/initialization of that intelligence layer — no
       386MB neural download belongs to LOCAL. */
    if(!window.HAxBROKaiLocalIntelligence?.run) throw new Error('KAI 51 LOCAL intelligence is not loaded');
    const existing=localInstallState();
    const info={ready:true,version:window.HAxBROKaiLocalIntelligence.version||'kai51-local-intelligence-v1',installedAt:existing?.installedAt||new Date().toISOString()};
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify(info));}catch{}
    window.HAxBROKaiLocalInstalled=true;
    window.HAxBRO_KAI51_LOCAL_READY=true;
    window.dispatchEvent(new CustomEvent('haxbro:kai-local-installed',{detail:info}));
    emit({profile:'local',progress:100,status:'KAI 51 · LOCAL installed and ready',installed:true,verified:true});
    return info;
  }

  let unifiedBootPromise=null;
  async function maybeInstall() {
    if(unifiedBootPromise) return unifiedBootPromise;
    unifiedBootPromise=(async()=>{
      /* HARD ORDER: LOCAL first. Only after LOCAL is initialized do we start GITHUB. */
      await installLocalFirst();
      emit({profile:'heavy',progress:0,status:'KAI 51 · GITHUB installation starting after LOCAL'});
      return loadEngine();
    })().catch(e=>{unifiedBootPromise=null;throw e;});
    return unifiedBootPromise;
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

  async function unifiedGenerate(message,history=[],hooks={}){
    /* Combined intelligence contract: LOCAL is always the first reasoning lane;
       GITHUB is the precision neural lane; LITE is always present as final recovery. */
    await installLocalFirst();
    const local=window.HAxBROKaiLocalIntelligence;
    if(local?.run){
      const turn=await local.run(message,history,hooks);
      if(turn?.response&&!turn.handoff) return {...turn,lane:'local',combined:true};
      if(turn?.handoff) hooks.onHandoff?.(turn.reason||'LOCAL requested deeper precision');
    }
    try{
      hooks.onStage?.('github','KAI 51 · GITHUB is handling the precision lane');
      const github=await generate(message,history);
      if(github?.response) return {...github,lane:'github',combined:true};
    }catch(e){
      hooks.onStage?.('lite','KAI LITE remains available as the final working lane');
    }
    const lite=await window.HAxBROKaiLite?.respond?.(message,history);
    if(lite?.response) return {...lite,lane:'lite',combined:true};
    throw new Error('No KAI intelligence lane is currently available');
  }

  window.HAxBROKai51Bootstrap = {
    version:VERSION,
    state:()=>({...status(),localInstalled:!!localInstallState()}),
    maybeInstall,
    prepare:maybeInstall,
    generate,
    chat,
    unifiedGenerate,
    isInstalled:()=>read().status==='ready'&&!!localInstallState(),
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
      if(s.status==='not_installed' && !enginePromise) maybeInstall().catch(()=>{});
    }catch{}
  },15000);
})();