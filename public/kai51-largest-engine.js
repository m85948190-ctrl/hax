let enginePromise=null;
let engine=null;
let worker=null;
let requestId=0;
const pending=new Map();
const MODEL_ID='onnx-community/gemma-3-1b-it-ONNX';
const emit=(onProgress,progress,status,file='')=>{try{onProgress?.({profile:'largest',progress,status,file});}catch{}};
function rejectPending(error){
  for(const item of pending.values())item.reject(error);
  pending.clear();
}
export async function createKai51LargestEngine({onProgress=()=>{},onReady=()=>{}}={}){
  if(engine)return engine;
  if(enginePromise)return enginePromise;
  enginePromise=(async()=>{
    emit(onProgress,1,'Checking browser-local Gemma 3 runtime');
    worker=new Worker('/kai51-largest-worker.js?v=3',{type:'module'});
    worker.onmessage=event=>{
      const data=event.data||{};
      if(data.type==='progress'){emit(onProgress,data.progress,data.status,data.file);return;}
      if(data.type==='loaded'&&data.id==null){
        const item=pending.get('load');if(item){pending.delete('load');item.resolve(data);}return;
      }
      const item=pending.get(data.id);
      if(!item)return;
      if(data.type==='loaded'||data.type==='generated'){pending.delete(data.id);item.resolve(data);}
      else if(data.type==='error'){pending.delete(data.id);item.reject(new Error(data.message||'Gemma 3 failed'));}
    };
    worker.onerror=event=>{
      const error=new Error('Gemma 3 worker failed: '+String(event?.message||'unknown worker error'));
      rejectPending(error);
    };
    const ask=(type,payload={})=>new Promise((resolve,reject)=>{
      const id=++requestId;pending.set(id,{resolve,reject});
      worker.postMessage({type,id,...payload});
    });
    // The worker owns the model so a first-use download or inference does not freeze chat UI.
    const info=await Promise.race([
      ask('load'),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Gemma 3 download/initialization is taking too long. Keep this tab open and retry; no remote API was used.')),600000))
    ]);
    if(info?.model!==MODEL_ID)throw new Error('Gemma 3 model identity check failed.');
    const selfTest=await ask('generate',{messages:[{role:'user',content:'Reply with exactly: Gemma 3 local model ready.'}]});
    if(!String(selfTest?.response||'').trim())throw new Error('Gemma 3 self-test returned no text.');
    engine={
      model:MODEL_ID,
      async generate(message,history=[],signal){
        if(signal?.aborted)throw new DOMException('Response stopped by user','AbortError');
        const recent=(Array.isArray(history)?history:[]).slice(-8).map(x=>{
          const raw=String(x?.role||x?.sender||'user').toLowerCase();
          const role=['assistant','bot','ai','model'].includes(raw)?'assistant':'user';
          const content=String(x?.content||x?.text||x?.message||'').slice(0,1800);
          return {role,content};
        }).filter(x=>x.content);
        const messages=[
          {role:'system',content:'You are KAI 51, powered by Google Gemma 3 1B Instruct running locally in the user’s browser. Be clear, accurate, thoughtful and conversational. Do not claim to browse or use tools unless evidence is supplied. State uncertainty instead of inventing facts. Follow the user’s requested format.'},
          ...recent,
          {role:'user',content:String(message||'').trim()}
        ];
        emit(onProgress,98,'Generating with Google Gemma 3 1B locally');
        const work=ask('generate',{messages});
        let abortHandler;
        const aborted=new Promise((_,reject)=>{
          if(!signal)return;
          abortHandler=()=>reject(new DOMException('Response stopped by user','AbortError'));
          if(signal.aborted)abortHandler();else signal.addEventListener('abort',abortHandler,{once:true});
        });
        let result;
        try{result=signal?await Promise.race([work,aborted]):await work;}
        finally{if(abortHandler)signal.removeEventListener('abort',abortHandler);}
        if(signal?.aborted)throw new DOMException('Response stopped by user','AbortError');
        const response=String(result?.response||'').trim();
        if(!response)throw new Error('Google Gemma 3 1B returned an empty answer.');
        return {response,provider:'KAI 51 · GOOGLE GEMMA 3 1B · LOCAL',model:MODEL_ID,local:true,localModel:true,realModel:true,device:result.device||'webgpu-or-wasm',quantization:'q4',lane:'largest',provenance:'Google Gemma 3 1B Instruct ONNX weights; model inference runs in this browser without an AI API'};
      },
      isReady:()=>true,
      status:()=>({ready:true,model:MODEL_ID,device:'worker-webgpu-or-wasm',realModel:true,quantization:'q4',lane:'largest'})
    };
    window.HAxBROKai51LargestEngine=engine;
    emit(onProgress,100,'Google Gemma 3 1B ready');
    try{onReady({model:MODEL_ID,device:info.device||'worker-webgpu-or-wasm',verified:true,realModel:true,lane:'largest',quantization:'q4'});}catch{}
    return engine;
  })().catch(error=>{
    const detail={message:String(error?.message||error||'unknown Gemma 3 error').slice(0,700),at:new Date().toISOString(),model:MODEL_ID};
    window.HAxBROKai51LargestError=detail;
    emit(onProgress,99,'Google Gemma 3 failed: '+detail.message);
    enginePromise=null;engine=null;try{worker?.terminate()}catch{}worker=null;rejectPending(error);throw error;
  });
  return enginePromise;
}