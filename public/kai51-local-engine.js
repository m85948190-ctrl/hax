export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  const MODEL='HAxBRO/KAI-51-SMOLLM2-360M';
  const VERSION='kai51-real-model-v1';
  let pipe=null, loading=null;
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
      env.cacheKey='haxbro-kai51-real-model-v1';
      progress(15,'Loading KAI 51 model files');
      pipe=await pipeline('text-generation',MODEL,{
        dtype:'q4f16',
        device:'wasm',
        model_file_name:'model_q4f16'
      });
      progress(95,'Running KAI 51 neural self-test');
      const test=await pipe('User: Say exactly: KAI 51 online.\nAssistant:',{max_new_tokens:12,do_sample:false});
      const text=String(test?.[0]?.generated_text||'').trim();
      if(!text) throw new Error('KAI 51 neural model returned no output');
      progress(100,'KAI 51 neural model ready');
      onReady({model:MODEL,device:'browser-wasm',verified:true,realModel:true,localModel:true});
      return {ok:true,model:MODEL,device:'browser-wasm',realModel:true,localModel:true};
    })().catch(e=>{pipe=null;loading=null;progress(99,'KAI 51 neural runtime failed');throw e});
    return loading;
  }
  async function generate(message,history=[]){
    await prepare();
    const prompt=String(message||'').trim();
    if(!prompt) throw new Error('KAI 51 received an empty request');
    const context=(history||[]).slice(-8).map(x=>String(x?.role||'user').toUpperCase()+': '+String(x?.content||x?.text||'')).join('\n');
    const full=(context?context+'\n':'')+'USER: '+prompt+'\nASSISTANT:';
    const result=await pipe(full,{max_new_tokens:256,do_sample:true,temperature:0.7,top_p:0.9,return_full_text:false});
    const response=String(result?.[0]?.generated_text||result?.[0]?.text||'').trim();
    if(!response) throw new Error('KAI 51 neural model returned an empty response');
    return {response,provider:'KAI 51 LOCAL NEURAL MODEL',model:MODEL,local:true,localModel:true,device:'browser-wasm',realModel:true};
  }
  return {model:MODEL,prepare,generate,chat:generate,isReady:()=>!!pipe,status:()=>({ready:!!pipe,model:MODEL,device:'browser-wasm',local:true,realModel:true,externalChatProviders:false,cache:VERSION})};
}