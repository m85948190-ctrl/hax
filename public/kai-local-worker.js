import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/+esm';

const PROFILES = {
  light: { id:'onnx-community/SmolLM2-135M-Instruct-ONNX', dtype:'q4', label:'KAI FAST' },
  heavy: { id:'onnx-community/SmolLM2-360M-Instruct-ONNX', dtype:'q4', label:'KAI 51' }
};

env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.useFSCache = true;
env.useWasmCache = true;

const report = (profile,p) => self.postMessage({
  type:'progress',
  profile,
  progress:{
    status:String(p?.status||''),
    name:String(p?.name||''),
    file:String(p?.file||''),
    progress:Number.isFinite(Number(p?.progress))?Number(p.progress):undefined,
    loaded:Number.isFinite(Number(p?.loaded))?Number(p.loaded):undefined,
    total:Number.isFinite(Number(p?.total))?Number(p.total):undefined
  }
});

const runtimes = new Map();
const loads = new Map();

async function load(profileName){
  if(runtimes.has(profileName)) return runtimes.get(profileName);
  if(loads.has(profileName)) return loads.get(profileName);
  const profile=PROFILES[profileName]||PROFILES.light;
  const promise=(async()=>{
    const gen=await pipeline('text-generation',profile.id,{
      dtype:profile.dtype,
      device:'wasm',
      progress_callback:p=>report(profileName,p)
    });
    runtimes.set(profileName,gen);
    self.postMessage({type:'ready',profile:profileName,model:profile.id,dtype:profile.dtype,label:profile.label});
    return gen;
  })().catch(err=>{
    self.postMessage({type:'fatal',profile:profileName,error:String(err?.stack||err?.message||err)});
    throw err;
  });
  loads.set(profileName,promise);
  try{return await promise}finally{loads.delete(profileName)}
}

self.onmessage=async event=>{
  const d=event.data||{};
  if(d.type==='prepare'){
    try{await load(d.profile||'light')}catch{}
    return;
  }
  if(!d.id)return;
  const profileName=d.profile||'light';
  try{
    const gen=await load(profileName);
    const out=await gen(d.prompt,{
      max_new_tokens:d.maxTokens||160,
      temperature:0.2,
      do_sample:false
    });
    const text=Array.isArray(out)
      ? (out[0]?.generated_text||'')
      : String(out?.generated_text||out||'');
    self.postMessage({type:'result',id:d.id,profile:profileName,text});
  }catch(err){
    self.postMessage({type:'error',id:d.id,profile:profileName,error:String(err?.message||err)});
  }
};