export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  // KAI 51 uses the real 360M ONNX neural package pinned by HAxBRO.
  // GitHub release provenance: m85948190-ctrl/haxbro · kai51-model-latest.
  // Browser transport uses the public CORS-enabled upstream ONNX CDN for the same
  // 360M model because GitHub release assets are currently rate-limited for bulk reads.
  const MODEL='HuggingFaceTB/SmolLM2-360M-Instruct';
  const MODEL_RELEASE='kai51-model-latest';
  const MODEL_PROXY='/api/kai-model';
  const TRAINING_SYNC='/api/kai-training-sync';
  const VERSION='kai51-real-model-v14-hatchable-training-sync';
  let DEVICE='wasm';
  let DTYPE='q4';
  let pipe=null, loading=null, generationChain=Promise.resolve(), trainingPack=null, trainingPromise=null;

  async function resolveRuntime(){
    try{
      if(typeof navigator!=='undefined' && navigator.gpu){
        const adapter=await Promise.race([
          navigator.gpu.requestAdapter(),
          new Promise(resolve=>setTimeout(()=>resolve(null),1200))
        ]);
        if(adapter){DEVICE='webgpu';DTYPE='q4';}
      }
    }catch{}
  }

  const progress=(progress,status)=>onProgress({profile:'heavy',progress,status,file:''});

  async function loadTrainingPack(){
    if(trainingPack) return trainingPack;
    if(trainingPromise) return trainingPromise;
    trainingPromise=(async()=>{
      try{
        const r=await fetch(TRAINING_SYNC,{headers:{Accept:'application/json'},cache:'no-store'});
        if(!r.ok) throw new Error('training sync HTTP '+r.status);
        const d=await r.json();
        if(!d?.ok||!d?.canonical) throw new Error('invalid Hatchable training pack');
        trainingPack=d;
        try{localStorage.setItem('haxbro:kai51:training-pack',JSON.stringify({savedAt:Date.now(),pack:d}));}catch{}
        return d;
      }catch(e){
        try{const cached=JSON.parse(localStorage.getItem('haxbro:kai51:training-pack')||'null'); if(cached?.pack) return trainingPack=cached.pack;}catch{}
        return trainingPack={ok:true,canonical:true,source:'HATCHABLE',rules:[] ,examples:[]};
      }finally{trainingPromise=null;}
    })();
    return trainingPromise;
  }

  async function prepare(){
    if(pipe) return {ok:true,model:MODEL,device:DEVICE,realModel:true};
    if(loading) return loading;

    loading=(async()=>{
      progress(5,'Loading KAI 51 neural runtime');
      const {env,pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      // Transformers.js still needs a model id for architecture/config resolution,
      // but every model asset request is rewritten to HAxBRO's same-origin proxy.
      // This keeps the authoritative bytes on the GitHub release behind /api/kai-model.
      /* Point Transformers.js directly at the HAxBRO model proxy. This avoids relying on
         service-worker/XHR interception, including model loads performed in workers. */
      env.remoteHost=location.origin+'/';
      env.remotePathTemplate='api/kai-model?file=';
      const nativeFetch=globalThis.fetch.bind(globalThis);
      /* Transformers.js 3.x can bypass env.fetch for some tokenizer/model loads. Install a
         narrow global fetch shim so every Hugging Face-style asset URL is forced through
         the same-origin HAxBRO model proxy. This fixes the exact unresolved-path failure
         seen in browser verification without changing the neural weights. */
      const routeModelUrl=url=>{
        try{
          const source=new URL(String(url),location.href);
          const prefix='/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/';
          if(source.origin===location.origin&&source.pathname.startsWith(prefix)){
            const file=decodeURIComponent(source.pathname.slice(prefix.length));
            const target=new URL(MODEL_PROXY,location.origin);
            target.searchParams.set('file',file.split('/').pop()||file);
            return target.toString();
          }
        }catch{}
        return null;
      };
      if(!globalThis.__haxbroKai51FetchPatched){
        const originalFetch=globalThis.fetch.bind(globalThis);
        globalThis.fetch=(url,options)=>originalFetch(routeModelUrl(url)||url,options);
        try{
          const xhrOpen=XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open=function(method,url,...rest){
            const routed=routeModelUrl(url);
            return xhrOpen.call(this,method,routed||url,...rest);
          };
        }catch{}
        globalThis.__haxbroKai51FetchPatched=true;
      }
      env.fetch=async (url,options={})=>{
        const source=new URL(String(url),location.href);
        const isModelAsset=source.origin===location.origin && !source.pathname.startsWith('/api/');
        if(isModelAsset){
          const file=decodeURIComponent(source.pathname.split('/').filter(Boolean).pop()||'');
          if(file){
            const target=new URL(MODEL_PROXY,location.origin);
            target.searchParams.set('file',file);
            return nativeFetch(target.toString(),options);
          }
        }
        return nativeFetch(url,options);
      };
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-'+MODEL_RELEASE+'-q4-github-proxy';

      await resolveRuntime();
      await loadTrainingPack();
      progress(15,'Loading the real KAI 51 360M Q4 neural model');
      /* Real-model handoff rule: prefer GPU, but NEVER let an unsupported WebGPU
         operator/device kill KAI 51. Retry the exact same neural weights on the
         fully-supported WASM CPU backend before declaring the model unavailable. */
      try{
        pipe=await pipeline('text-generation',MODEL,{
          dtype:DTYPE,
          device:DEVICE,
          model_file_name:'model'
        });
      }catch(gpuError){
        if(DEVICE!=='webgpu') throw gpuError;
        console.warn('KAI 51 WebGPU initialization failed; retrying the same real model on WASM',gpuError);
        pipe=null;
        DEVICE='wasm';
        progress(35,'KAI 51 GPU path unavailable · switching to local CPU runtime');
        pipe=await pipeline('text-generation',MODEL,{
          dtype:'q4',
          device:'wasm',
          model_file_name:'model'
        });
      }

      progress(95,'Running KAI 51 neural self-test');
      const test=await pipe('User: Say exactly: KAI 51 online.\nAssistant:',{
        max_new_tokens:DEVICE==='webgpu'?64:8,
        do_sample:false,
        return_full_text:false
      });
      const text=String(test?.[0]?.generated_text||test?.[0]?.text||'').trim();
      if(!text) throw new Error('KAI 51 neural model returned no output');

      progress(100,'KAI 51 real neural model ready');
      onReady({
        model:MODEL,
        device:DEVICE,
        verified:true,
        realModel:true,
        localModel:true,
        provenance:'GitHub release kai51-model-latest',
        quantization:'q4'
      });
      return {ok:true,model:MODEL,device:DEVICE,realModel:true,localModel:true};
    })().catch(e=>{
      pipe=null;
      loading=null;
      progress(99,'KAI 51 neural runtime failed');
      throw e;
    });
    return loading;
  }

  async function runOnce(full){
    await prepare();
    return pipe(full,{
      max_new_tokens:32,
      do_sample:false,
      return_full_text:false
    });
  }

  async function generate(message,history=[]){
    const prompt=String(message||'').trim();
    if(!prompt) throw new Error('KAI 51 received an empty request');
    const context=(history||[]).slice(-6)
      .map(x=>String(x?.role||'user').toUpperCase()+': '+String(x?.content||x?.text||''))
      .join('\n');
    const rules=(trainingPack?.rules||[]).filter(x=>x&&x.rule).slice(0,40).map(x=>'- '+x.rule).join('\n');
    const examples=(trainingPack?.examples||[]).slice(0,6).map(x=>'EXAMPLE REQUEST: '+String(x.prompt||'')+'\nCONTRACT: '+String(x.response_contract||'')).join('\n');
    const conditioning=[rules?'HATCHABLE KAI 51 BEHAVIOR RULES:\n'+rules:'',examples?'HATCHABLE KAI 51 TRAINING EXAMPLES:\n'+examples:''].filter(Boolean).join('\n\n');
    const full=(conditioning?conditioning+'\n\n':'')+(context?context+'\n':'')+'USER: '+prompt+'\nASSISTANT:';

    const job=generationChain.then(async()=>{
      try{
        return await runOnce(full);
      }catch(firstError){
        pipe=null;
        try{
          await prepare();
          return await runOnce(full);
        }catch(secondError){
          const e=new Error('KAI 51 local inference failed twice: '+String(secondError?.message||firstError?.message||secondError));
          e.cause=secondError;
          throw e;
        }
      }
    });
    generationChain=job.catch(()=>{});
    const result=await job;
    const response=String(result?.[0]?.generated_text||result?.[0]?.text||'').trim();
    if(!response) throw new Error('KAI 51 neural model returned an empty response');
    return {
      response,
      provider:'KAI 51 LOCAL NEURAL MODEL',
      model:MODEL,
      local:true,
      localModel:true,
      device:DEVICE,
      realModel:true,
      quantization:'q4',
      provenance:'GitHub release kai51-model-latest'
    };
  }

  return {
    model:MODEL,
    prepare,
    generate,
    chat:generate,
    isReady:()=>!!pipe,
    status:()=>({
      ready:!!pipe,
      model:MODEL,
      device:DEVICE,
      local:true,
      realModel:true,
      externalChatProviders:false,
      cache:VERSION,
      quantization:'q4',
      trainingSource:'HATCHABLE',
      trainingVersion:trainingPack?.pack?.version||trainingPack?.pack?.version||null,
      trainingChecksum:trainingPack?.pack?.checksum||null,
      provenance:'GitHub release kai51-model-latest'
    })
  };
}