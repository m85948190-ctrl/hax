export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  const MODEL='HAxBRO/KAI-51-SMOLLM2-360M';
  const VERSION='kai51-real-model-v3-local-webgpu-q4';
  /* v2 uses the Q4 ONNX asset because the Q4F16 release asset was intermittently
     returning 502 from the same-origin model proxy. Q4 is larger, but it is the
     verified 386 MB asset and does not require external-data shards. */
  const DEVICE=(typeof navigator!=='undefined' && navigator.gpu) ? 'webgpu' : 'wasm';
  let pipe=null, loading=null, generationChain=Promise.resolve();
  const progress=(progress,status)=>onProgress({profile:'heavy',progress,status,file:''});

  async function prepare(){
    if(pipe) return {ok:true,model:MODEL,device:'browser-wasm',realModel:true};
    if(loading) return loading;
    loading=(async()=>{
      progress(5,'Loading KAI 51 neural runtime');
      const {env,pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      env.remoteHost=location.origin+'/api/kai-model';
      env.remotePathTemplate='?file={file}';
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-real-model-v3-local-webgpu-q4';
      progress(15,'Loading KAI 51 local Q4 model');
      pipe=await pipeline('text-generation',MODEL,{
        dtype:'q4',
        device:DEVICE,
        model_file_name:'model_q4'
      });
      progress(95,'Running KAI 51 neural self-test');
      const test=await pipe('User: Say exactly: KAI 51 online.\nAssistant:',{max_new_tokens:8,do_sample:false,return_full_text:false});
      const text=String(test?.[0]?.generated_text||test?.[0]?.text||'').trim();
      if(!text) throw new Error('KAI 51 neural model returned no output');
      progress(100,'KAI 51 neural model ready');
      onReady({model:MODEL,device:'browser-wasm',verified:true,realModel:true,localModel:true});
      return {ok:true,model:MODEL,device:'browser-wasm',realModel:true,localModel:true};
    })().catch(e=>{pipe=null;loading=null;progress(99,'KAI 51 neural runtime failed');throw e});
    return loading;
  }

  async function runOnce(full){
    await prepare();
    return pipe(full,{
      max_new_tokens:128,
      do_sample:true,
      temperature:0.7,
      top_p:0.9,
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
    return {response,provider:'KAI 51 LOCAL NEURAL MODEL',model:MODEL,local:true,localModel:true,device:'browser-wasm',realModel:true};
  }

  return {
    model:MODEL,prepare,generate,chat:generate,
    isReady:()=>!!pipe,
    status:()=>({ready:!!pipe,model:MODEL,device:'browser-wasm',local:true,realModel:true,externalChatProviders:false,cache:VERSION})
  };
}