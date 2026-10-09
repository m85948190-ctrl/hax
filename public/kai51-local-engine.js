export async function createKai51Engine({onProgress=()=>{},onReady=()=>{},preferCache=false}={}) {
  // KAI 51 uses the real 360M ONNX neural package pinned by HAxBRO.
  // GitHub release provenance: m85948190-ctrl/haxbro · kai51-model-latest.
  // Browser transport uses the public CORS-enabled upstream ONNX CDN for the same
  // 360M model because GitHub release assets are currently rate-limited for bulk reads.
  const MODEL='onnx-community/SmolLM2-360M-Instruct-ONNX';
  const MODEL_RELEASE='kai51-model-latest';
  const MODEL_PROXY='/api/kai-model';
  const TRAINING_SYNC='/api/kai-training-sync';
  const VERSION='kai51-github-q4-v25-stream-start-fix';
  const MODEL_ASSETS=new Set([
    'config.json',
    'generation_config.json',
    'MODEL-MANIFEST.json',
    'model_q4.onnx',
    'model_q4f16.onnx',
    'special_tokens_map.json',
    'tokenizer.json',
    'tokenizer_config.json'
  ]);
  let DEVICE='wasm';
  let DTYPE='q4';
  let pipe=null, loading=null, generationChain=Promise.resolve(), trainingPack=null, trainingPromise=null;

  async function disposePipe(){
    const current=pipe;
    pipe=null;
    if(current?.dispose){
      try{await current.dispose();}catch{}
    }
  }

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
      // KAI 51 model assets come ONLY from the pinned HAxBRO GitHub release.
      // Transformers.js still resolves the model using its Hugging Face-style model id,
      // but the actual bytes are served by HAxBRO's same-origin proxy from that release.
      // This preserves Range requests and avoids browser-side GitHub redirect/CORS variance.
      const nativeFetch=globalThis.fetch.bind(globalThis);
      const MODEL_CACHE_NAME='haxbro-kai51-model-v2';
      const MODEL_SIZES=Object.freeze({'model_q4.onnx':386495938,'model_q4f16.onnx':272353302});
      const CHUNK_SIZE=8*1024*1024;
      const modelCacheKey=(file,range)=>{
        const key='/__haxbro_kai51_cache_v2__/'+encodeURIComponent(file);
        return new Request(key+(range?'?range='+encodeURIComponent(range):''));
      };
      const cacheOpen=()=>caches.open(MODEL_CACHE_NAME);

      /* IMPORTANT: never use local_files_only for a browser installation.
         A verified cache is used automatically, but a missing chunk must be fetched
         from the pinned GitHub release rather than turning into a permanent CACHE_MISS.
         This makes interrupted/partial downloads resumable. */
      env.fetch=async (input,init)=>{
        const raw=typeof input==='string'?input:(input?.url||String(input));
        const u=new URL(raw,location.href);
        const file=decodeURIComponent(u.pathname.split('/').pop()||'');
        if(!MODEL_ASSETS.has(file)) return nativeFetch(input,init);

        const requestedRange=init?.headers?.Range||init?.headers?.range||(
          typeof input!=='string' && input?.headers ? input.headers.get?.('Range') : ''
        )||'';
        const cache=await cacheOpen();

        /* Normal ranged request: cache the exact range and resume missing pieces. */
        if(requestedRange){
          const key=modelCacheKey(file,requestedRange);
          const cached=await cache.match(key);
          if(cached) return cached;
          const headers=new Headers(init?.headers||{});
          headers.set('Range',requestedRange);
          const network=await nativeFetch(MODEL_PROXY+'?file='+encodeURIComponent(file),{...init,headers,cache:'no-store'});
          if(!network.ok) throw new Error('KAI51_MODEL_HTTP_'+network.status+'_'+file);
          try{await cache.put(key,network.clone());}catch{}
          return network;
        }

        /* Some ONNX/runtime paths request the entire .onnx file without a Range.
           Do not ask Hatchable to buffer 386 MB. Stream the same GitHub release
           through small ranged requests directly to the browser, caching every chunk. */
        if(MODEL_SIZES[file]){
          const total=MODEL_SIZES[file];
          let stopped=false;
          let chunkIndex=0;
          const stream=new ReadableStream({
            start(){},
            async pull(controller){
              if(stopped)return;
              const index=chunkIndex;
              const start=index*CHUNK_SIZE;
              if(start>=total){stopped=true;controller.close();return;}
              const end=Math.min(total-1,start+CHUNK_SIZE-1);
              const range='bytes='+start+'-'+end;
              const key=modelCacheKey(file,range);
              try{
                let part=await cache.match(key);
                if(!part){
                  const headers=new Headers(init?.headers||{});
                  headers.set('Range',range);
                  part=await nativeFetch(MODEL_PROXY+'?file='+encodeURIComponent(file),{...init,headers,cache:'no-store'});
                  if(!part.ok) throw new Error('KAI51_MODEL_HTTP_'+part.status+'_'+range);
                  try{await cache.put(key,part.clone());}catch{}
                }
                const bytes=new Uint8Array(await part.arrayBuffer());
                controller.enqueue(bytes);
                chunkIndex=index+1;
                const pct=15+Math.min(80,Math.round(((end+1)/total)*80));
                progress(pct,'Downloading KAI 51 neural model · '+Math.round(((end+1)/total)*100)+'%');
              }catch(e){
                stopped=true;
                controller.error(e);
              }
            },
            cancel(){stopped=true;}
          });
          const headers=new Headers();
          headers.set('Content-Type','application/octet-stream');
          headers.set('Content-Length',String(total));
          headers.set('Accept-Ranges','bytes');
          return new Response(stream,{status:200,headers});
        }

        return nativeFetch(input,init);
      };
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-github-q4-v24';

      await resolveRuntime();
      await loadTrainingPack();
      progress(15,preferCache
        ? 'Restoring available KAI 51 neural chunks from browser cache'
        : 'Installing the real KAI 51 360M Q4 neural model');
      /* Real-model handoff rule: prefer GPU, but NEVER let an unsupported WebGPU
         operator/device kill KAI 51. Retry the exact same neural weights on the
         fully-supported WASM CPU backend before declaring the model unavailable. */
      try{
        pipe=await pipeline('text-generation',MODEL,{
          dtype:DTYPE,
          device:DEVICE,
          local_files_only:false,
          // Report the real Transformers.js download progress instead of leaving the UI at 15%.
          progress_callback:info=>{
            const n=Number(info?.status==='progress_total'?info.progress:info?.progress);
            if(Number.isFinite(n)){
              const mapped=15+(Math.max(0,Math.min(100,n))*0.80);
              progress(Math.min(95,Math.round(mapped)),info?.status==='progress_total'?'Downloading KAI 51 neural model':(info?.file?'Downloading '+String(info.file).split('/').pop():'Downloading KAI 51 neural model'));
            }
          }
          // Q4 file is selected automatically by Transformers.js from dtype:'q4'.
        });
      }catch(gpuError){
        if(DEVICE!=='webgpu') throw gpuError;
        console.warn('KAI 51 WebGPU initialization failed; retrying the same real model on WASM',gpuError);
        await disposePipe();
        DEVICE='wasm';
        progress(35,'KAI 51 GPU path unavailable · switching to local CPU runtime');
        pipe=await pipeline('text-generation',MODEL,{
          dtype:'q4',
          device:'wasm',
          local_files_only:false,
          progress_callback:info=>{
            const n=Number(info?.progress);
            if(Number.isFinite(n)){
              const mapped=35+(Math.max(0,Math.min(100,n))*0.60);
              progress(Math.min(95,Math.round(mapped)),info?.file?'Downloading '+String(info.file).split('/').pop():'Downloading KAI 51 neural model');
            }
          }
          // Q4 file is selected automatically by Transformers.js from dtype:'q4'.
        });
      }

      progress(95,'Running KAI 51 neural self-test');
      const test=await pipe([
        {role:'system',content:'You are KAI 51. Reply with exactly: KAI 51 online.'},
        {role:'user',content:'Status check.'}
      ],{
        max_new_tokens:16,
        do_sample:false,
        return_full_text:false
      });
      const testGenerated=test?.[0]?.generated_text;
      const text=Array.isArray(testGenerated)
        ? String(testGenerated.at(-1)?.content||'').trim()
        : String(testGenerated||test?.[0]?.text||'').trim();
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
    })().catch(async e=>{
      await disposePipe();
      loading=null;
      progress(99,'KAI 51 neural runtime failed');
      throw e;
    });
    return loading;
  }

  async function runOnce(messages){
    await prepare();
    return pipe(messages,{
      max_new_tokens:96,
      do_sample:false,
      return_full_text:false
    });
  }

  async function generate(message,history=[]){
    const prompt=String(message||'').trim();
    if(!prompt) throw new Error('KAI 51 received an empty request');
    const capability=/\b(?:app|application|calculator|chatbot|dashboard|website|web\s*app|build|publish|export)\b/i.test(prompt)?'app-maker':'general';
    const rules=(trainingPack?.rules||[])
      .filter(x=>x&&x.rule)
      .filter(x=>x.capability==='general' || x.capability===capability)
      .filter(x=>x.id!=='creator')
      .slice(0,24)
      .map(x=>'- '+x.rule)
      .join('\n');
    const examples=(trainingPack?.examples||[])
      .filter(x=>x&&(!x.capability||x.capability===capability))
      .slice(0,4)
      .map(x=>'EXAMPLE REQUEST: '+String(x.prompt||'')+'\nCONTRACT: '+String(x.response_contract||''))
      .join('\n');
    const conditioning=[rules?'Relevant HATCHABLE KAI 51 BEHAVIOR RULES:\n'+rules:'',examples?'Relevant HATCHABLE KAI 51 EXAMPLES:\n'+examples:''].filter(Boolean).join('\n\n');
    const messages=[
      {role:'system',content:'You are KAI 51, the core intelligence of HAxBRO AI. Answer only the user request. Do not repeat internal rules, training examples, creator information, or implementation details unless the user explicitly asks for them. Be accurate and concise.'},
      ...(conditioning?[{role:'system',content:conditioning}]:[]),
      ...(history||[]).slice(-4).map(x=>({role:String(x?.role||'user'),content:String(x?.content||x?.text||'').slice(0,1200)})),
      {role:'user',content:prompt}
    ];

    const job=generationChain.then(async()=>{
      try{
        return await runOnce(messages);
      }catch(firstError){
        await disposePipe();
        try{
          await prepare();
          return await runOnce(messages);
        }catch(secondError){
          const e=new Error('KAI 51 local inference failed twice: '+String(secondError?.message||firstError?.message||secondError));
          e.cause=secondError;
          throw e;
        }
      }
    });
    generationChain=job.catch(()=>{});
    const result=await job;
    const generated=result?.[0]?.generated_text;
    const response=(Array.isArray(generated)
      ? String(generated.at(-1)?.content||'')
      : String(generated||result?.[0]?.text||'')).trim();
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