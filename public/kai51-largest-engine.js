let enginePromise=null;
let engine=null;
const MODEL_ID='smollm2-1.7b-instruct-q4f16';
const MODEL_URL='https://huggingface.co/skillsafe-ai/smollm2-1.7b-instruct-q4f16';
const MODEL_LIB='https://huggingface.co/skillsafe-ai/smollm2-1.7b-instruct-q4f16/resolve/main/lib/SmolLM2-1.7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm';
const emit=(onProgress,progress,status)=>{try{onProgress?.({profile:'heavy',progress,status,file:''});}catch{}};
export async function createKai51LargestEngine({onProgress=()=>{},onReady=()=>{}}={}){
  if(engine)return engine;
  if(enginePromise)return enginePromise;
  enginePromise=(async()=>{
    emit(onProgress,2,'Checking WebGPU support for KAI 51 Largest 1.7B');
    if(!globalThis.navigator?.gpu?.requestAdapter)throw new Error('KAI 51 Largest 1.7B requires a browser with WebGPU support. Choose KAI 51 GITHUB 360M on this device.');
    const adapter=await navigator.gpu.requestAdapter();
    if(!adapter)throw new Error('WebGPU adapter unavailable. Choose KAI 51 GITHUB 360M on this device.');
    emit(onProgress,5,'Loading the WebGPU inference runtime');
    const {CreateMLCEngine}=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm');
    emit(onProgress,8,'Preparing KAI 51 Largest · first-use download may be large');
    const appConfig={model_list:[{
      model:MODEL_URL,
      model_id:MODEL_ID,
      model_lib:MODEL_LIB,
      overrides:{context_window_size:4096,prefill_chunk_size:1024}
    }]};
    const mlc=await CreateMLCEngine(MODEL_ID,{
      appConfig,
      initProgressCallback:info=>{
        const p=Number(info?.progress);
        if(Number.isFinite(p))emit(onProgress,Math.max(8,Math.min(96,Math.round(8+p*0.88))),String(info?.text||info?.status||'Downloading and initializing KAI 51 Largest 1.7B'));
      }
    });
    emit(onProgress,97,'Running KAI 51 Largest self-test');
    const test=await mlc.chat.completions.create({messages:[
      {role:'system',content:'You are KAI 51. Reply with exactly: KAI 51 Largest online.'},
      {role:'user',content:'Status check.'}
    ],max_tokens:16,temperature:0});
    if(!String(test?.choices?.[0]?.message?.content||'').trim())throw new Error('KAI 51 Largest self-test returned no text.');
    engine={
      model:MODEL_ID,
      async generate(message,history=[],signal){
        if(signal?.aborted)throw new DOMException('Response stopped by user','AbortError');
        const recent=(Array.isArray(history)?history:[]).slice(-8).map(x=>{
          const raw=String(x?.role||x?.sender||'user').toLowerCase();
          return {role:['assistant','bot','ai','model'].includes(raw)?'assistant':'user',content:String(x?.content||x?.text||x?.message||'').slice(0,1200)};
        }).filter(x=>x.content);
        const messages=[
          {role:'system',content:'You are KAI 51, the largest optional neural model in HAxBRO AI. Be clear, accurate, thoughtful and conversational. Do not claim to browse or use tools unless evidence is supplied. State uncertainty instead of inventing facts. Follow the user’s requested format.'},
          ...recent,
          {role:'user',content:String(message||'').trim()}
        ];
        emit(onProgress,98,'Generating with KAI 51 Largest 1.7B in this browser');
        const result=await mlc.chat.completions.create({messages,max_tokens:512,temperature:0.35,top_p:0.9});
        if(signal?.aborted)throw new DOMException('Response stopped by user','AbortError');
        const response=String(result?.choices?.[0]?.message?.content||'').trim();
        if(!response)throw new Error('KAI 51 Largest returned an empty answer.');
        return {response,provider:'KAI 51 LARGEST 1.7B · Hugging Face WebGPU',model:MODEL_ID,local:true,localModel:true,realModel:true,device:'webgpu',quantization:'q4f16',lane:'largest',provenance:'SmolLM2-1.7B-Instruct Q4F16 browser weights on Hugging Face; inference runs in this browser'};
      },
      isReady:()=>true,
      status:()=>({ready:true,model:MODEL_ID,device:'webgpu',realModel:true,quantization:'q4f16',lane:'largest'})
    };
    window.HAxBROKai51LargestEngine=engine;
    emit(onProgress,100,'KAI 51 Largest 1.7B ready');
    try{onReady({model:MODEL_ID,device:'webgpu',verified:true,realModel:true,lane:'largest',quantization:'q4f16'});}catch{}
    return engine;
  })().catch(error=>{enginePromise=null;engine=null;throw error;});
  return enginePromise;
}