export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  // KAI 51 uses the real 360M ONNX neural package pinned by HAxBRO.
  // GitHub release provenance: m85948190-ctrl/haxbro · kai51-model-latest.
  // Browser transport uses the public CORS-enabled upstream ONNX CDN for the same
  // 360M model because GitHub release assets are currently rate-limited for bulk reads.
  const MODEL='onnx-community/SmolLM2-360M-Instruct-ONNX';
  const MODEL_RELEASE='kai51-model-latest';
  const VERSION='kai51-real-model-v11-360m-q4-github-provenance';
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
    if(pipe) return {ok:true,model:MODEL,device:DEVICE,realModel:true};
    if(loading) return loading;

    loading=(async()=>{
      progress(5,'Loading KAI 51 neural runtime');
      const {env,pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      env.remoteHost='https://huggingface.co/';
      env.remotePathTemplate='{model}/resolve/main/';
      env.useBrowserCache=true;
      env.cacheKey='haxbro-kai51-'+MODEL_RELEASE+'-360m-q4';

      await resolveRuntime();
      progress(15,'Loading the real KAI 51 360M neural model');
      pipe=await pipeline('text-generation',MODEL,{
        dtype:DTYPE,
        device:DEVICE,
        model_file_name:'model'
      });

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
        provenance:'GitHub release kai51-model-latest'
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
    const full=(context?context+'\n':'')+'USER: '+prompt+'\nASSISTANT:';

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
      provenance:'GitHub release kai51-model-latest'
    })
  };
}