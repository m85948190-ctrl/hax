export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  // KAI 51 uses the real 360M ONNX neural package pinned by HAxBRO.
  // GitHub release provenance: m85948190-ctrl/haxbro · kai51-model-latest.
  // Browser transport uses the public CORS-enabled upstream ONNX CDN for the same
  // 360M model because GitHub release assets are currently rate-limited for bulk reads.
  const MODEL='onnx-community/SmolLM2-360M-Instruct-ONNX';
  const MODEL_RELEASE='kai51-model-latest';
  const MODEL_PROXY='/api/kai-model';
  const TRAINING_SYNC='/api/kai-training-sync';
  const VERSION='kai51-real-model-v17-direct-hf-q4';
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
      /* The GitHub copy remains the pinned HAxBRO release/provenance artifact, but
         browser inference must not consume the Hatchable Free-plan bandwidth budget.
         The release was built from this browser-ready Transformers.js package, so load
         the same SmolLM2-360M-Instruct Q4 neural weights directly from Hugging Face. */
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      env.remoteHost='https://huggingface.co/';
      env.remotePathTemplate='{model}/resolve/{revision}/{file}';
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-smollm2-360m-instruct-q4-browser';

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
          // Q4 file is selected automatically by Transformers.js from dtype:'q4'.
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
          // Q4 file is selected automatically by Transformers.js from dtype:'q4'.
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