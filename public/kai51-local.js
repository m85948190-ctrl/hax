(() => {
  const VERSION = 'kai51-unified-controller-v21-bounded-chat-recovery';
  const explicitWebRequest=message=>/\b(?:search (?:the )?(?:web|internet|online)|look up|latest|recent|today|news|price|cost|weather|current version|official source|verify online|check online|find sources|research current)\b/i.test(String(message||''));
  const KEY = 'haxbro:kai51:installation:v15-github-q4';
  const LOCAL_KEY = 'haxbro:kai51:local-intelligence:og-v1';
  const MODEL = 'onnx-community/SmolLM2-360M-Instruct-ONNX';
  const safe = (v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
  const withTimeout=(work,ms,label='KAI 51 request')=>{let timer;return Promise.race([Promise.resolve().then(()=>typeof work==='function'?work():work),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out after '+ms+'ms')),ms);})]).finally(()=>clearTimeout(timer));};

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

  const ENGINE_VERSION='kai51-github-360m-q4-v35-creative-fallback';
  const LOCAL_ENGINE_VERSION='kai51-local-135m-q4-v15-creative-fallback';
  if(window.HAxBROKai51Engine && window.HAxBROKai51Engine.version!==ENGINE_VERSION){
    window.HAxBROKai51Engine=null;
    window.__HAxBROKai51EnginePromise=null;
  }
  if(window.HAxBROKai51LocalFastEngine && window.HAxBROKai51LocalFastEngine.version!==LOCAL_ENGINE_VERSION){
    window.HAxBROKai51LocalFastEngine=null;
    window.__HAxBROKai51LocalFastEnginePromise=null;
  }
  let state = read();
  let enginePromise = window.HAxBROKai51Engine?.version===ENGINE_VERSION ? (window.__HAxBROKai51EnginePromise||null) : null;
  let localEnginePromise = window.HAxBROKai51LocalFastEngine?.version===LOCAL_ENGINE_VERSION ? (window.__HAxBROKai51LocalFastEnginePromise||null) : null;

  function emit(detail) {
    window.dispatchEvent(new CustomEvent('haxbro:kai-local-progress',{detail}));
    window.dispatchEvent(new CustomEvent('haxbro:kai51-bootstrap',{detail}));
  }

  async function loadEngine(profile='local') {
    const isLocal=profile==='local';
    const expected=isLocal?LOCAL_ENGINE_VERSION:ENGINE_VERSION;
    const globalName=isLocal?'HAxBROKai51LocalFastEngine':'HAxBROKai51Engine';
    const promiseName=isLocal?'__HAxBROKai51LocalFastEnginePromise':'__HAxBROKai51EnginePromise';
    let current=window[globalName];
    let pending=isLocal?localEnginePromise:enginePromise;
    if(current?.generate&&current.version===expected) return current;
    if(current&&current.version!==expected){
      window[globalName]=null;
      window[promiseName]=null;
      current=null;
      pending=null;
      if(isLocal)localEnginePromise=null;else enginePromise=null;
    }
    if(pending) return pending;

    const model=isLocal?'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA':'onnx-community/SmolLM2-360M-Instruct-ONNX';
    const restoring=state.status==='ready'&&state.verified===true&&state.model===model;
    state=write({status:restoring?'restoring':'installing',installed:restoring,verified:false,error:null,model});
    emit({profile:'heavy',progress:restoring?95:2,status:isLocal
      ?'KAI 51 LOCAL fast model starting'
      :'KAI 51 GITHUB precision model starting'});

    const job=(async()=>{
      const mod=await import('/kai51-local-engine.js?v=60');
      const engine=await mod.createKai51Engine({
        profile:isLocal?'local':'github',
        onProgress:p=>emit({profile:'heavy',...p}),
        preferCache:restoring,
        onReady:info=>{
          state=write({status:'ready',installed:true,verified:true,model:info?.model||model,error:null});
          emit({profile:'heavy',progress:100,status:isLocal?'KAI 51 LOCAL fast model ready':'KAI 51 GITHUB precision model ready',installed:true,verified:true,lane:isLocal?'local':'github'});
          window.HAxBROKai51Installed=true;
          window.HAxBRO_KAI51_LOCAL_READY=true;
          window.dispatchEvent(new CustomEvent('haxbro:kai51-ready',{detail:info||{}}));
        }
      });
      window[globalName]=engine;
      await engine.prepare();
      return engine;
    })().catch(err=>{
      state=write({status:'error',installed:false,verified:false,error:safe(err?.message||err,700),model});
      emit({profile:'heavy',progress:99,status:'KAI 51 '+(isLocal?'LOCAL':'GITHUB')+' model failed — retry required',error:state.error});
      if(isLocal){localEnginePromise=null;window[promiseName]=null;}
      else{enginePromise=null;window[promiseName]=null;}
      throw err;
    });
    if(isLocal){localEnginePromise=job;window[promiseName]=job;}
    else{enginePromise=job;window[promiseName]=job;}
    return job;
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
    /* Boot only the lightweight LOCAL intelligence. Do not download the 386 MB
       neural model at page startup; GITHUB is loaded on demand only if LOCAL
       cannot answer with sufficiently relevant evidence or the user selects it. */
    if(unifiedBootPromise) return unifiedBootPromise;
    unifiedBootPromise=installLocalFirst().catch(e=>{unifiedBootPromise=null;throw e;});
    return unifiedBootPromise;
  }

  async function generate(message,history=[],hooks={},profile='local') {
    const forward=e=>{try{if(e?.detail?.profile==='heavy') hooks.onProgress?.(e.detail);}catch{}};
    window.addEventListener('haxbro:kai-local-progress',forward);
    try{
      /* GITHUB mode shares the same fast conversation and evidence-first web preflight.
         Only open-ended turns that need neural synthesis should trigger the large release download. */
      if(profile==='github'&&window.HAxBROKaiLocalIntelligence?.run){
        try{
          const turn=await window.HAxBROKaiLocalIntelligence.run(message,history,{onStage:hooks.onStage});
          if(turn?.response&&!turn.handoff) return {...turn,lane:'github',provider:'KAI 51 GITHUB · fast conversation/evidence path',model:turn.model||'shared fast local/web path',preflight:true};
          if(turn?.handoff&&turn?.research&&explicitWebRequest(message)&&window.HAxBROKaiLite?.respond){
            try{
              hooks.onStage?.('searching','KAI 51 GITHUB · lightweight live web evidence');
              const webTurn=await withTimeout(()=>window.HAxBROKaiLite.respond(message,history),12000,'KAI LITE web recovery');
              if(webTurn?.response) return {...webTurn,lane:'github',provider:'KAI 51 GITHUB · live web evidence',model:'Google/Bing website search',preflight:true};
            }catch(e){console.warn('KAI 51 GITHUB web preflight failed',e);}
          }
        }catch(e){console.warn('KAI 51 GITHUB fast preflight failed; loading neural model',e);}
      }
      if(profile==='github'&&!(window.HAxBROKai51Engine&&typeof window.HAxBROKai51Engine.isReady==='function'&&window.HAxBROKai51Engine.isReady())){
        /* Never leave a first-time GITHUB user staring at a 270–386 MB download
           without an answer. Use the already-local 135M model for this turn, then
           begin warming GITHUB after the answer is ready. Every result identifies
           the actual model used; later turns use GITHUB once it is verified ready. */
        const localEngine=await withTimeout(()=>loadEngine('local'),12000,'KAI 51 LOCAL model initialization');
        const localResult=await withTimeout(()=>localEngine.generate(message,history),12000,'KAI 51 LOCAL inference');
        setTimeout(()=>loadEngine('github').catch(e=>console.warn('KAI 51 GITHUB background warm-up failed',e)),50);
        return {...localResult,lane:'local',fallbackLane:'github',provider:'KAI 51 LOCAL · temporary fallback while GITHUB installs',fallbackReason:'The GitHub neural model was not ready yet; this response was generated by the browser-local model.'};
      }
      const engine=await withTimeout(()=>loadEngine(profile),12000,'KAI 51 '+profile.toUpperCase()+' model initialization');
      const result=await withTimeout(()=>engine.generate(message,history),15000,'KAI 51 '+profile.toUpperCase()+' inference');
      return {...result,lane:profile==='github'?'github':'local'};
    }finally{window.removeEventListener('haxbro:kai-local-progress',forward);}
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
    try{ await installLocalFirst(); }catch(e){ hooks.onStage?.('local-error','KAI 51 LOCAL initialization failed; continuing with the browser-local neural lane'); }
    const local=window.HAxBROKaiLocalIntelligence;
    let turn=null;
    if(local?.run){
      try{
        turn=await local.run(message,history,hooks);
        if(turn?.response&&!turn.handoff) return {...turn,lane:'local',combined:true};
        if(turn?.handoff&&turn?.research&&explicitWebRequest(message)&&window.HAxBROKaiLite?.respond){
          hooks.onStage?.('searching','KAI 51 LOCAL · lightweight live web search');
          try{
            const webTurn=await withTimeout(()=>window.HAxBROKaiLite.respond(message,history),12000,'KAI LITE web search');
            if(webTurn?.response) return {...webTurn,lane:'local',combined:true,provider:'KAI 51 LOCAL · live web retrieval',model:'Google/Bing website search',local:true,localModel:false,searchEngines:[webTurn.engine||'Google/Bing Web'],sources:webTurn.sources||[]};
          }catch(e){console.warn('KAI 51 local live-web fallback failed',e);}
        }
        if(turn?.handoff) hooks.onStage?.('local-neural','KAI 51 LOCAL · synthesizing retrieved evidence');
      }catch(e){
        hooks.onStage?.('local-error','KAI 51 LOCAL retrieval failed; continuing with local neural synthesis');
      }
    }
    /* Greetings and other non-retrieval turns go to the smaller, dedicated browser-local model.
       This is genuine neural inference, not a phrase table or remote-provider handoff. */
    try{
      hooks.onStage?.('local-neural','KAI 51 LOCAL · browser-local neural synthesis');
      const neuralPrompt=turn?.evidencePrompt||message;
      const neural=await withTimeout(()=>generate(neuralPrompt,history,{onProgress:p=>hooks.onStage?.('local-neural-progress',p?.status||('KAI 51 LOCAL '+Math.round(Number(p?.progress)||0)+'%'))},'local'),28000,'KAI 51 LOCAL neural synthesis');
      if(neural?.response) return {...neural,lane:'local',combined:true,sources:turn?.sources||[],searchEngines:turn?.searchEngines||[]};
    }catch(e){
      hooks.onStage?.('local-error','KAI 51 LOCAL neural inference failed');
    }
    try{
      hooks.onStage?.('lite','KAI LITE remains available as the final recovery lane');
      if(!explicitWebRequest(message)) throw new Error('KAI 51 LOCAL neural model is still initializing; refusing an unrelated web answer');
      const lite=await withTimeout(()=>window.HAxBROKaiLite?.respond?.(message,history),12000,'KAI LITE recovery');
      if(lite?.response) return {...lite,lane:'lite',combined:true};
    }catch{}
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
  /* Register lightweight LOCAL routing immediately, then warm the smaller 135M
     neural model in the background so the first chat turn is less likely to wait
     for model installation. GITHUB's larger 360M model remains on-demand. */
  setTimeout(()=>maybeInstall().catch(()=>{}),250);
  const warmSelectedLocal=()=>{
    const chosen=window.HAxBROSelectedModel||localStorage.getItem('haxbro_model_choice')||'kai-local';
    if(chosen==='kai-local'){
      loadEngine('local').catch(e=>console.warn('KAI 51 LOCAL background warm-up failed',e));
      return;
    }
    if(chosen==='kai-github'){
      // Warm the small local fallback first so a first-turn request can answer quickly,
      // then begin the larger GitHub model download while the user is already in the workspace.
      loadEngine('local').then(()=>{
        const current=window.HAxBROSelectedModel||localStorage.getItem('haxbro_model_choice')||chosen;
        if(current==='kai-github') return loadEngine('github');
      }).catch(e=>console.warn('KAI 51 GitHub prewarm failed',e));
    }
  };
  /* App Maker must stay interactive on first paint. Heavy ONNX model warm-up is on-demand there; other HAxBRO pages retain the normal background warm-up. */
  if(!window.HAxBRODisableKAI51Warmup){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',warmSelectedLocal,{once:true});
    else warmSelectedLocal();
    window.addEventListener('haxbro:model-selected',e=>{if(e?.detail?.model==='kai-local'||e?.detail?.model==='kai-github') warmSelectedLocal();});
  }
  setInterval(()=>{
    try{
      const s=read();
      if((s.status==='not_installed'||s.status==='error') && !enginePromise) maybeInstall().catch(()=>{});
    }catch{}
  },15000);
})();