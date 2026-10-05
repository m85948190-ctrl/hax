export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  // KAI 51 is backed by the exact browser-ready model package produced for HAxBRO.
  // The package is published in the GitHub release "kai51-model-latest":
  // HuggingFaceTB/SmolLM2-360M-Instruct -> ONNX -> Q4.
  // The same-origin proxy keeps the browser on haxbro.hatchable.site while sourcing
  // every model asset from that immutable GitHub release.
  const MODEL='onnx-community/SmolLM2-360M-Instruct-ONNX';
  const MODEL_RELEASE='kai51-model-latest';
  const MODEL_PROXY='/api/kai-model?file=';
  const VERSION='kai51-real-model-v10-github-360m-q4';
  let DEVICE='wasm';
  let DTYPE='q4';
  let pipe=null, loading=null, generationChain=Promise.resolve();
  async function resolveRuntime(){
    try{
      if(typeof navigator!=='undefined' && navigator.gpu){
        const adapter=await Promise.race([
          navigator.gpu.requestAdapter(),
          new Promise(resolve=>setTimeout(()=>resolve(null),1200))
        ]);
        if(adapter){DEVICE='webgpu';DTYPE='q4f16';}
      }
    }catch{}
  }
  const progress=(progress,status)=>onProgress({profile:'heavy',progress,status,file:''});

  async function prepare(){
    if(pipe) return {ok:true,model:MODEL,device:'browser-wasm',realModel:true};
    if(loading) return loading;
    loading=(async()=>{
      progress(5,'Loading KAI 51 neural runtime');
      const {env,pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      // IMPORTANT: do not resolve the runtime from Hugging Face at inference time.
      // The actual KAI 51 model assets are served from HAxBRO's GitHub release proxy.
      env.remoteHost=location.origin+MODEL_PROXY;
      env.remotePathTemplate='{model}/resolve/main/';
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-'+MODEL_RELEASE+'-360m-q4';
      // Hatchable's function gateway can reject a single 386 MB response even though
      // ranged requests are healthy. For the ONNX asset only, assemble bounded 8 MiB
      // ranges in the browser. The bytes still come exclusively from our GitHub release.
      const nativeFetch=globalThis.fetch.bind(globalThis);
      env.fetch=async(input,init={})=>{
        const url=String(input?.url||input||'');
        if(!/\/api\/kai-model\?file=.*model_q4(?:f16)?\.onnx/i.test(url)) return nativeFetch(input,init);
        const headers=new Headers(init?.headers||{});
        if(headers.has('range')) return nativeFetch(input,init);
        const first=await nativeFetch(url,{...init,headers:new Headers({...Object.fromEntries(headers.entries()),Range:'bytes=0-0'})});
        if(!first.ok && first.status!==206) return first;
        const cr=first.headers.get('content-range')||'';
        const total=Number(cr.split('/')[1]||0);
        if(!total) return first;
        const chunkSize=8*1024*1024;
        const parts=[new Uint8Array(await first.arrayBuffer())];
        for(let start=1;start<total;start+=chunkSize){
          const end=Math.min(total-1,start+chunkSize-1);
          const part=await nativeFetch(url,{...init,headers:new Headers({...Object.fromEntries(headers.entries()),Range:'bytes='+start+'-'+end})});
          if(!part.ok || part.status!==206) throw new Error('KAI 51 model range '+start+'-'+end+' failed: HTTP '+part.status);
          parts.push(new Uint8Array(await part.arrayBuffer()));
          onProgress({profile:'heavy',progress:15+Math.min(70,Math.round(end/total*70)),status:'Downloading KAI 51 neural model · '+Math.round(end/total*100)+'%'});
        }
        const bytes=new Uint8Array(parts.reduce((n,x)=>n+x.byteLength,0));
        let offset=0;
        for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}
        return new Response(bytes,{status:200,headers:{'content-type':'application/octet-stream','content-length':String(bytes.byteLength),'accept-ranges':'bytes'}});
      };
      await resolveRuntime();
      progress(15,'Loading KAI 51 local neural model');
      pipe=await pipeline('text-generation',MODEL,{
        dtype:DTYPE,
        device:DEVICE,
        // Let Transformers.js derive the quantized filename from dtype: q4 -> model_q4.onnx,
        // q4f16 -> model_q4f16.onnx. Supplying model_q4 here would double the suffix.
        model_file_name:'model'
      });
      progress(95,'Running KAI 51 neural self-test');
      const test=await pipe('User: Say exactly: KAI 51 online.\nAssistant:',{max_new_tokens:DEVICE==='webgpu'?64:8,do_sample:false,return_full_text:false});
      const text=String(test?.[0]?.generated_text||test?.[0]?.text||'').trim();
      if(!text) throw new Error('KAI 51 neural model returned no output');
      progress(100,'KAI 51 neural model ready');
      onReady({model:MODEL,device:DEVICE,verified:true,realModel:true,localModel:true});
      return {ok:true,model:MODEL,device:DEVICE,realModel:true,localModel:true};
    })().catch(e=>{pipe=null;loading=null;progress(99,'KAI 51 neural runtime failed');throw e});
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
    const context=(history||[]).slice(-6).map(x=>String(x?.role||'user').toUpperCase()+': '+String(x?.content||x?.text||'')).join('\n');
    const full=(context?context+'\n':'')+'USER: '+prompt+'\nASSISTANT:';

    /* ONNX Runtime Web serializes WASM inference internally; this explicit queue
       also prevents HAxBRO from accidentally starting two generations at once. */
    const job=generationChain.then(async()=>{
      try{
        return await runOnce(full);
      }catch(firstError){
        /* One controlled local retry. Do not jump directly to KAI Lite after a
           transient WASM/session failure. If the session is poisoned, rebuild it. */
        const first=firstError;
        pipe=null;
        try{ await prepare(); return await runOnce(full); }
        catch(secondError){
          const e=new Error('KAI 51 local inference failed twice: '+String(secondError?.message||first?.message||secondError));
          e.cause=secondError;
          throw e;
        }
      }
    });
    generationChain=job.catch(()=>{});
    const result=await job;
    const response=String(result?.[0]?.generated_text||result?.[0]?.text||'').trim();
    if(!response) throw new Error('KAI 51 neural model returned an empty response');
    return {response,provider:'KAI 51 LOCAL NEURAL MODEL',model:MODEL,local:true,localModel:true,device:DEVICE,realModel:true};
  }

  return {
    model:MODEL,prepare,generate,chat:generate,
    isReady:()=>!!pipe,
    status:()=>({ready:!!pipe,model:MODEL,device:DEVICE,local:true,realModel:true,externalChatProviders:false,cache:VERSION})
  };
}