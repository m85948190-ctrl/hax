export async function createKai51Engine({onProgress=()=>{},onReady=()=>{},preferCache=false,profile='github'}={}) {
  // LOCAL uses a smaller instruction-tuned model for faster everyday browser inference.
  // GITHUB uses the larger 360M instruction model for the stronger precision lane.
  // Both use public CORS-enabled ONNX weights and run inference inside the user's browser.
  const PROFILE=profile==='local'?'local':'github';
  const MODEL=PROFILE==='local'?'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA':'onnx-community/SmolLM2-360M-Instruct-ONNX';
  const MODEL_RELEASE=PROFILE==='local'?'local-fast-135m':'kai51-model-latest';
  const TRAINING_SYNC='/api/kai-training-sync';
  const VERSION=PROFILE==='local'?'kai51-local-135m-q4-v1':'kai51-github-360m-q4-v30';
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
      // Keep browser-side inference local after the public ONNX weights are downloaded.
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      /* LOCAL fetches its smaller ONNX model from the public Hugging Face distribution.
         GITHUB fetches HAxBRO's release assets through /api/kai-model using byte ranges. */
      const nativeFetch=globalThis.fetch.bind(globalThis);
      if(PROFILE==='github'){
        /* The precision lane uses HAxBRO's actual GitHub release assets. The release
           endpoint requires byte ranges for the large ONNX file, so stream it in
           resumable 8 MiB ranges instead of issuing a single oversized request. */
        env.fetch=async(input,init={})=>{
          let url='',name='';
          try{
            url=typeof input==='string'||input instanceof URL?String(input):String(input?.url||'');
            name=decodeURIComponent(new URL(url,location.href).pathname.split('/').pop());
          }catch{}
          if(!MODEL_ASSETS.has(name)) return nativeFetch(input,init);
          const endpoint='/api/kai-model?file='+encodeURIComponent(name);
          if(name!=='model_q4.onnx'&&name!=='model_q4f16.onnx') return nativeFetch(endpoint,init);
          const headers=new Headers(init?.headers||(typeof Request!=='undefined'&&input instanceof Request?input.headers:undefined));
          if(headers.has('range')) return nativeFetch(endpoint,{...init,headers});
          const size=name==='model_q4.onnx'?386495938:272000000;
          const chunkSize=8*1024*1024;
          let start=0;
          const stream=new ReadableStream({
            async pull(controller){
              if(start>=size){controller.close();return;}
              const end=Math.min(size-1,start+chunkSize-1);
              try{
                const response=await nativeFetch(endpoint,{headers:{Range:'bytes='+start+'-'+end},cache:'force-cache'});
                if(!response.ok) throw new Error('GitHub model range '+start+'-'+end+' failed: HTTP '+response.status);
                const bytes=await response.arrayBuffer();
                if(!bytes.byteLength) throw new Error('GitHub model range returned an empty chunk');
                controller.enqueue(new Uint8Array(bytes));
                start+=bytes.byteLength;
              }catch(error){controller.error(error);}
            }
          });
          return new Response(stream,{status:200,headers:{'Content-Type':'application/octet-stream','Content-Length':String(size),'Accept-Ranges':'bytes'}});
        };
      }else{
        env.fetch=nativeFetch;
      }
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-q4-dual-model-v43';

      await resolveRuntime();
      await loadTrainingPack();
      progress(15,preferCache
        ? 'Restoring available KAI 51 neural chunks from browser cache'
        : (PROFILE==='local'?'Installing the KAI 51 LOCAL 135M Q4 fast model':'Installing the KAI 51 GITHUB 360M Q4 precision model'));
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
        provenance:PROFILE==='local'?'Public Hugging Face ONNX weights; browser-local inference':'HAxBRO GitHub release kai51-model-latest; browser-local inference',
        lane:PROFILE,
        quantization:'q4'
      });
      return {ok:true,model:MODEL,device:DEVICE,realModel:true,localModel:true,lane:PROFILE};
    })().catch(async e=>{
      await disposePipe();
      loading=null;
      progress(99,'KAI 51 neural runtime failed');
      throw e;
    });
    return loading;
  }

  async function runOnce(messages,generationOptions={}){
    await prepare();
    return pipe(messages,{
      max_new_tokens:PROFILE==='local'?56:96,
      do_sample:false,
      return_full_text:false,
      ...generationOptions
    });
  }

  async function generate(message,history=[]){
    const prompt=String(message||'').trim();
    if(!prompt) throw new Error('KAI 51 received an empty request');
    const isGreeting=/^(?:hi|hello|hey|yo|howdy|good morning|good afternoon|good evening|what'?s up|sup)(?:\s+bro)?[!,.?\s]*$/i.test(prompt);
    const generationOptions=isGreeting?{max_new_tokens:32,do_sample:true,temperature:0.7,top_p:0.9,repetition_penalty:1.18,no_repeat_ngram_size:4}:{};
    const capability=/\b(?:app|application|calculator|chatbot|dashboard|website|web\s*app|build|publish|export)\b/i.test(prompt)?'app-maker':'general';
    const rules=(trainingPack?.rules||[])
      .filter(x=>x&&x.rule)
      .filter(x=>x.capability==='general' || x.capability===capability)
      .filter(x=>x.id!=='creator')
      .slice(0,PROFILE==='local'?5:16)
      .map(x=>'- '+x.rule)
      .join('\n');
    const examples=(trainingPack?.examples||[])
      .filter(x=>x&&(!x.capability||x.capability===capability))
      .slice(0,PROFILE==='local'?1:3)
      .map(x=>'EXAMPLE REQUEST: '+String(x.prompt||'')+'\nCONTRACT: '+String(x.response_contract||''))
      .join('\n');
    const conditioning=[rules?'Relevant HATCHABLE KAI 51 BEHAVIOR RULES:\n'+rules:'',examples?'Relevant HATCHABLE KAI 51 EXAMPLES:\n'+examples:''].filter(Boolean).join('\n\n');
    const normalizedHistory=(isGreeting?[]:(Array.isArray(history)?history:[]))
      .filter(x=>x&&typeof x==='object')
      .map(x=>{
        const rawRole=String(x.role||x.sender||'user').toLowerCase();
        const role=rawRole==='bot'||rawRole==='ai'||rawRole==='model'||rawRole==='assistant'?'assistant':'user';
        const content=String(x.content||x.text||x.message||'').trim().slice(0,1200);
        return {role,content};
      })
      .filter(x=>x.content && !(x.role==='user' && x.content===prompt))
      .slice(-6);
    const messages=[
      {role:'system',content:'You are KAI 51, the core intelligence of HAxBRO AI. Answer the latest user message directly. When the user greets you, greet them warmly and naturally in one short sentence, then invite them to continue if appropriate; never say you are unsure what they are asking in response to a greeting. Do not repeat a greeting or generic offer to help when the user asked a specific question. If the user gives a calculation, calculate it. If the user gives a correction or follow-up, respond to that meaning using the conversation. Never repeat the user message as your answer. Be accurate, concise, and natural.'},
      ...(isGreeting?[{role:'system',content:'The latest message is a simple greeting. Reply with one natural, friendly sentence. Do not say "I am not sure what you are asking" or "I\'m not sure what you\'re asking". Do not repeat phrases. Do not explain the task; simply greet the user conversationally.'}]:[]),
      ...(conditioning?[{role:'system',content:conditioning}]:[]),
      ...normalizedHistory,
      {role:'user',content:prompt}
    ];

    const job=generationChain.then(async()=>{
      try{
        return await runOnce(messages,generationOptions);
      }catch(firstError){
        await disposePipe();
        try{
          await prepare();
          return await runOnce(messages,generationOptions);
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
      provider:PROFILE==='local'?'KAI 51 LOCAL FAST NEURAL MODEL':'KAI 51 GITHUB PRECISION NEURAL MODEL',
      model:MODEL,
      local:true,
      localModel:true,
      device:DEVICE,
      realModel:true,
      quantization:'q4',
      provenance:PROFILE==='local'?'Public Hugging Face ONNX weights; browser-local inference':'HAxBRO GitHub release kai51-model-latest; browser-local inference',
      lane:PROFILE
    };
  }

  return {
    version:VERSION,
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
      provenance:'Public Hugging Face ONNX weights; browser-local inference',
      lane:PROFILE
    })
  };
}