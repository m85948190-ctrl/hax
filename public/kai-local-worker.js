import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/+esm';
const PROFILES={light:{id:'onnx-community/SmolLM2-135M-Instruct-ONNX',dtype:'q4',label:'KAI FAST'},heavy:{id:'onnx-community/SmolLM2-360M-Instruct-ONNX',dtype:'q4',label:'KAI 51'}};
env.allowRemoteModels=true;env.allowLocalModels=false;env.useBrowserCache=true;env.useFSCache=true;env.useWasmCache=true;env.cacheKey='haxbro-kai-models-v3';
const report=(profile,p)=>self.postMessage({type:'progress',profile,progress:{status:String(p?.status||''),name:String(p?.name||''),file:String(p?.file||''),progress:Number.isFinite(Number(p?.progress))?Number(p.progress):undefined,loaded:Number.isFinite(Number(p?.loaded))?Number(p.loaded):undefined,total:Number.isFinite(Number(p?.total))?Number(p.total):undefined}});
const runtimes=new Map(),loads=new Map();
async function load(profileName){
  if(runtimes.has(profileName))return runtimes.get(profileName);
  if(loads.has(profileName))return loads.get(profileName);
  const p=PROFILES[profileName]||PROFILES.light;
  const promise=(async()=>{
    let gen=null;
    try{
      if(self.navigator?.gpu){
        const adapter=await self.navigator.gpu.requestAdapter({powerPreference:'high-performance'});
        if(adapter)gen=await pipeline('text-generation',p.id,{dtype:'q4f16',device:'webgpu',progress_callback:x=>report(profileName,x)});
      }
    }catch(_){}
    if(!gen)gen=await pipeline('text-generation',p.id,{dtype:p.dtype,device:'wasm',progress_callback:x=>report(profileName,x)});
    runtimes.set(profileName,gen);
    self.postMessage({type:'ready',profile:profileName,model:p.id,dtype:gen?.processor?'webgpu':p.dtype,label:p.label});
    return gen;
  })().catch(err=>{self.postMessage({type:'fatal',profile:profileName,error:String(err?.stack||err?.message||err)});throw err});
  loads.set(profileName,promise);try{return await promise}finally{loads.delete(profileName)}
}
self.onmessage=async e=>{
 const d=e.data||{};
 if(d.type==='prepare'){try{await load(d.profile||'light')}catch{}return}
 if(!d.id)return;
 try{
  const gen=await load(d.profile||'light');
  const out=await gen(d.prompt,{max_new_tokens:d.maxTokens||64,temperature:.2,do_sample:false});
  const text=Array.isArray(out)?(out[0]?.generated_text||''):String(out?.generated_text||out||'');
  self.postMessage({type:'result',id:d.id,profile:d.profile||'light',text});
 }catch(err){self.postMessage({type:'error',id:d.id,profile:d.profile||'light',error:String(err?.message||err)})}
};