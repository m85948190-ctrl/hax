(() => {
  const VERSION = 'kai51-unified-controller-v22-failure-based-backup-chain';
  const explicitWebRequest=message=>/\b(?:search (?:the )?(?:web|internet|online)|look up|latest|recent|today|news|price|cost|weather|current version|official source|verify online|check online|find sources|research current)\b/i.test(String(message||''));
  const userScope=()=>{const n=(localStorage.getItem('haxbro_username')||'anonymous-device').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'_').slice(0,64)||'anonymous-device';return n;};
  const KEY = ()=>'haxbro:kai51:'+userScope()+':installation:v15-github-q4';
  const LOCAL_KEY = ()=>'haxbro:kai51:'+userScope()+':local-intelligence:og-v1';
  const MODEL = 'onnx-community/SmolLM2-360M-Instruct-ONNX';
  const safe = (v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
  const withTimeout=(work,ms,label='KAI 51 request')=>{let timer,abortHandler;const signal=window.HAxBROActiveChatSignal;const races=[Promise.resolve().then(()=>typeof work==='function'?work():work),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out after '+ms+'ms')),ms);})];if(signal)races.push(new Promise((_,reject)=>{abortHandler=()=>reject(new DOMException('Response stopped by user','AbortError'));if(signal.aborted)abortHandler();else signal.addEventListener('abort',abortHandler,{once:true})}));return Promise.race(races).finally(()=>{clearTimeout(timer);if(signal&&abortHandler)signal.removeEventListener('abort',abortHandler)});};

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
      const x = JSON.parse(localStorage.getItem(KEY())||'null');
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
    try { localStorage.setItem(KEY(),JSON.stringify(next)); } catch {}
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
  window.addEventListener('haxbro:username-changed',()=>{state=read();const localEngine=window.HAxBROKai51LocalFastEngine;const githubEngine=window.HAxBROKai51Engine;const readyEngine=localEngine?.isReady?.()?localEngine:githubEngine?.isReady?.()?githubEngine:null;if(readyEngine)state=write({status:'ready',installed:true,verified:true,model:readyEngine.model||state.model,error:null});});
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
      const mod=await import('/kai51-local-engine.js?v=67');
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
      const x=JSON.parse(localStorage.getItem(LOCAL_KEY())||'null');
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
    try{localStorage.setItem(LOCAL_KEY(),JSON.stringify(info));}catch{}
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
    const signal=hooks?.signal;const ensureActive=()=>{if(signal?.aborted)throw new DOMException('Response stopped by user','AbortError')};ensureActive();
    if(profile==='largest'){
      hooks.onStage?.('largest','Starting the selected KAI 51 Largest 1.7B model');
      const mod=await import('/kai51-largest-engine.js?v=1');
      const engine=await withTimeout(()=>mod.createKai51LargestEngine({
        onProgress:p=>{try{hooks.onProgress?.(p);emit({...p,profile:'heavy'});}catch{}},
        onReady:info=>{state=write({status:'ready',installed:true,verified:true,model:info?.model||'SmolLM2-1.7B-Instruct',error:null});}
      }),600000,'KAI 51 Largest 1.7B download/initialization');
      ensureActive();
      const result=await withTimeout(()=>engine.generate(message,history,signal),180000,'KAI 51 Largest 1.7B inference');
      ensureActive();
      return {...result,lane:'largest'};
    }
    const forward=e=>{try{if(e?.detail?.profile==='heavy') hooks.onProgress?.(e.detail);}catch{}};
    window.addEventListener('haxbro:kai-local-progress',forward);
    try{
      /* GITHUB mode shares the same fast conversation and evidence-first web preflight.
         Only open-ended turns that need neural synthesis should trigger the large release download. */
      if(profile==='github'&&window.HAxBROKaiLocalIntelligence?.run){
        try{
          const turn=await window.HAxBROKaiLocalIntelligence.run(message,history,{onStage:hooks.onStage,signal});ensureActive();
          if(turn?.response&&!turn.handoff) return {...turn,lane:'github',provider:'KAI 51 GITHUB · fast conversation/evidence path',model:turn.model||'shared fast local/web path',preflight:true};
          if(turn?.handoff&&turn?.research&&explicitWebRequest(message)){
            hooks.onStage?.('searching','KAI 51 GITHUB · research intent identified; continuing to GitHub neural synthesis');
          }
        }catch(e){console.warn('KAI 51 GITHUB fast preflight failed; loading neural model',e);}
      }
      /* Respect the selected model. GITHUB must load and infer with the GITHUB profile; never silently answer with LOCAL or LITE. */
      const engine=await withTimeout(()=>loadEngine(profile),90000,'KAI 51 '+profile.toUpperCase()+' model initialization');ensureActive();
      const result=await withTimeout(()=>engine.generate(message,history),profile==='local'?60000:90000,'KAI 51 '+profile.toUpperCase()+' inference');ensureActive();
      return {...result,lane:profile==='github'?'github':'local'};
    }finally{window.removeEventListener('haxbro:kai-local-progress',forward);}
  }

  async function chat(message,history=[]) {
    return generate(message,history);
  }

  async function routerGenerate(message,history=[],hooks={}){
    const signal=hooks?.signal;
    const ensureActive=()=>{if(signal?.aborted)throw new DOMException('Response stopped by user','AbortError')};
    const preferred=String(hooks?.preferred||'kai-router');
    const names=preferred==='kai-largest'?['largest','github','local','lite']
      :preferred==='kai-github'?['github','local','largest','lite']
      :preferred==='kai-local'?['local','github','largest','lite']
      :['largest','github','local','lite'];
    const labels={largest:'KAI 51 Largest 1.7B',github:'KAI 51 GitHub 360M',local:'KAI 51 LOCAL',lite:'KAI Lite'};
    const errors=[];
    const timeouts={largest:240000,github:120000,local:90000,lite:15000};
    for(const name of names){
      ensureActive();
      const label=labels[name];
      hooks.onStage?.('router',`Trying ${label} (${name===preferred.replace('kai-','')?'selected model':'backup'})`);
      try{
        let result;
        const run=async()=>{
          if(name==='largest') return generate(message,history,{signal,onProgress:hooks.onProgress,onStage:hooks.onStage},'largest');
          if(name==='github') return generate(message,history,{signal,onProgress:hooks.onProgress,onStage:hooks.onStage},'github');
          if(name==='local') return unifiedGenerate(message,history,{signal,onProgress:hooks.onProgress,onStage:hooks.onStage});
          const lite=window.HAxBROKaiLite;
          if(!lite?.respond) throw new Error('KAI Lite runtime is unavailable');
          return lite.respond(message,history,{signal});
        };
        result=await Promise.race([
          run(),
          new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out after '+Math.round(timeouts[name]/1000)+' seconds')),timeouts[name])),
          ...(signal?[new Promise((_,reject)=>{if(signal.aborted)reject(new DOMException('Response stopped by user','AbortError'));else signal.addEventListener('abort',()=>reject(new DOMException('Response stopped by user','AbortError')),{once:true})})]:[])
        ]);
        ensureActive();
        const response=String(result?.response||'').trim();
        if(!response) throw new Error(label+' returned an empty response');
        const previousFailures=errors.slice();
        if(previousFailures.length){
          const failed=previousFailures.map(x=>x.split(':')[0]).join(', ');
          const notice='⚠️ **KAI backup notice:** '+failed+' did not produce a usable answer, so KAI switched to '+label+' for this response.\n\n';
          hooks.onStage?.('router-fallback',failed+' failed; '+label+' answered successfully');
          return {...result,response:notice+response,lane:name,router:preferred==='kai-router',fallback:true,fallbackFrom:previousFailures,routerReason:'failure-based backup'};
        }
        return {...result,lane:name,router:preferred==='kai-router',fallback:false,routerReason:name===preferred.replace('kai-','')?'selected model answered':'first working model'};
      }catch(error){
        if(signal?.aborted)throw error;
        const reason=safe(error?.message||error,220);
        errors.push(label+': '+reason);
        hooks.onStage?.('router-fallback',label+' failed ('+reason+'); trying the next backup');
      }
    }
    throw new Error('KAI could not produce an answer. All model attempts failed: '+errors.join(' | '));
  }

  function status() {
    state = read();
    return {
      ...state,
      ready: state.status === 'ready',
      runtimeReady: !!((window.HAxBROKai51Engine && typeof window.HAxBROKai51Engine.isReady==='function' && window.HAxBROKai51Engine.isReady()) || (window.HAxBROKai51LocalFastEngine && typeof window.HAxBROKai51LocalFastEngine.isReady==='function' && window.HAxBROKai51LocalFastEngine.isReady())),
      local:true,
      externalChatProviders:false,
      model:state.model||MODEL,
      controller:VERSION
    };
  }

  async function unifiedGenerate(message,history=[],hooks={}){
    const ensureActive=()=>{if(hooks?.signal?.aborted)throw new DOMException('Response stopped by user','AbortError')};ensureActive();
    try{ await installLocalFirst();ensureActive(); }catch(e){if(hooks?.signal?.aborted)throw e;hooks.onStage?.('local-error','KAI 51 LOCAL initialization failed; continuing with the browser-local neural lane'); }
    const local=window.HAxBROKaiLocalIntelligence;
    let turn=null;
    if(local?.run){
      try{
        turn=await local.run(message,history,hooks);ensureActive();
        if(turn?.response&&!turn.handoff) return {...turn,lane:'local',combined:true};
        if(turn?.handoff&&turn?.research&&explicitWebRequest(message)){
          hooks.onStage?.('searching','KAI 51 LOCAL · evidence gathered; continuing to local neural synthesis');
        }
        if(turn?.handoff) hooks.onStage?.('local-neural','KAI 51 LOCAL · synthesizing retrieved evidence');
      }catch(e){
        if(hooks?.signal?.aborted)throw e;
        hooks.onStage?.('local-error','KAI 51 LOCAL retrieval failed; continuing with local neural synthesis');
      }
    }
    /* Greetings and other non-retrieval turns go to the smaller, dedicated browser-local model.
       This is genuine neural inference, not a phrase table or remote-provider handoff. */
    try{
      hooks.onStage?.('local-neural','KAI 51 LOCAL · browser-local neural synthesis');
      const neuralPrompt=turn?.evidencePrompt||message;
      const neural=await withTimeout(()=>generate(neuralPrompt,history,{signal:hooks?.signal,onProgress:p=>hooks.onStage?.('local-neural-progress',p?.status||('KAI 51 LOCAL '+Math.round(Number(p?.progress)||0)+'%'))},'local'),118000,'KAI 51 LOCAL neural synthesis');ensureActive();
      if(neural?.response) return {...neural,lane:'local',combined:true,sources:turn?.sources||[],searchEngines:turn?.searchEngines||[]};
    }catch(e){
      if(hooks?.signal?.aborted)throw e;
      hooks.onStage?.('local-error','KAI 51 LOCAL neural inference failed');
    }
    throw new Error('KAI 51 LOCAL intelligence and neural synthesis could not complete this turn; KAI LITE was not substituted.');
  }

  window.HAxBROKai51Bootstrap = {
    version:VERSION,
    state:()=>({...status(),localInstalled:!!localInstallState()}),
    maybeInstall,
    prepare:maybeInstall,
    generate,
    chat,
    routerGenerate,
    unifiedGenerate,
    isInstalled:()=>read().status==='ready'&&!!localInstallState(),
    resetForTesting() {
      try { localStorage.removeItem(KEY()); } catch {}
      state = write(defaultState());
    }
  };

  try { navigator.storage?.persist?.().catch(()=>{}); } catch {}
  /* Ordered per-device model pipeline: LOCAL 135M → GitHub 360M → Largest 1.7B.
     Downloads are sequential, cached by their runtimes, and independent on each device. */
  setTimeout(()=>maybeInstall().catch(()=>{}),250);
  let pipelinePromise=null;
  const warmSelectedLocal=()=>{
    if(pipelinePromise)return pipelinePromise;
    pipelinePromise=(async()=>{
      try{await loadEngine('local');}catch(e){console.warn('KAI Router: LOCAL download/initialization failed; continuing pipeline',e);}
      try{await loadEngine('github');}catch(e){console.warn('KAI Router: GitHub 360M download/initialization failed; continuing to Largest',e);}
      try{
        const mod=await import('/kai51-largest-engine.js?v=2');
        await mod.createKai51LargestEngine({onProgress:p=>emit({...p,profile:'largest'}),onReady:info=>emit({profile:'largest',progress:100,status:'KAI 51 Largest 1.7B verified and ready',installed:true,verified:true,lane:'largest',model:info?.model})});
      }catch(e){console.warn('KAI Router: Largest 1.7B is unavailable on this device; 360M/LOCAL remain available',e);}
      return {local:!!window.HAxBROKai51LocalFastEngine?.isReady?.(),github:!!window.HAxBROKai51Engine?.isReady?.(),largest:!!window.HAxBROKai51LargestEngine?.isReady?.()};
    })().finally(()=>{pipelinePromise=null;});
    return pipelinePromise;
  };
  window.HAxBROKai51BootstrapPipeline={start:warmSelectedLocal,status:()=>({local:!!window.HAxBROKai51LocalFastEngine?.isReady?.(),github:!!window.HAxBROKai51Engine?.isReady?.(),largest:!!window.HAxBROKai51LargestEngine?.isReady?.(),running:!!pipelinePromise})};
  if(!window.HAxBRODisableKAI51Warmup){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',warmSelectedLocal,{once:true});
    else warmSelectedLocal();
    window.addEventListener('haxbro:model-selected',e=>{if(['kai-local','kai-github','kai-largest','kai-router'].includes(e?.detail?.model))warmSelectedLocal();});
  }
  setInterval(()=>{
    try{
      const s=read();
      if((s.status==='not_installed'||s.status==='error') && !enginePromise) maybeInstall().catch(()=>{});
    }catch{}
  },15000);
})();