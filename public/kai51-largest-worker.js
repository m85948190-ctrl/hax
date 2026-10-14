import { env, pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@next';

const MODEL_ID='onnx-community/gemma-3-270m-it-ONNX';
let generator=null;
let loading=null;
let activeDevice='webgpu';
let sequence=0;

env.allowLocalModels=false;
env.allowRemoteModels=true;
env.useBrowserCache=true;

function send(type,data={}){self.postMessage({type,...data});}
function describeRuntimeError(error,device='browser'){
  const raw=String(error?.message||error||'unknown runtime error');
  return /^\\d+$/.test(raw)?'Google Gemma 3 local '+String(device).toUpperCase()+' inference failed with internal runtime code '+raw+'. This browser could not initialize the model; check WebGPU support and available memory. No API fallback was used.':raw;
}
function progressCallback(info={}){
  const progress=Number(info.progress);
  send('progress',{progress:Number.isFinite(progress)?progress:0,status:String(info.status||info.file||'Downloading Gemma 3 270M'),file:String(info.file||'')});
}
async function load(){
  if(generator)return {model:MODEL_ID,device:activeDevice};
  if(loading)return loading;
  loading=(async()=>{
    send('progress',{progress:2,status:'Preparing Google Gemma 3 270M Instruct'});
    let firstError=null;
    // Prefer the smaller Q4F16 weights on WebGPU. Only use the proven FP32/WASM path
    // when this browser cannot initialize the quantized GPU path; do not start with a 1.1 GB download.
    const choices=['webgpu','wasm'];
    for(const device of choices){
      try{
        send('progress',{progress:device==='webgpu'?5:50,status:device==='webgpu'?'Trying compact Gemma Q4F16 on WebGPU':'GPU path unavailable · trying Gemma FP32 on CPU'});
        generator=await pipeline('text-generation',MODEL_ID,{
          dtype:device==='webgpu'?'q4f16':'fp32',
          device,
          progress_callback:progressCallback
        });
        activeDevice=device;
        send('progress',{progress:96,status:'Checking Gemma 3 270M inference'});
        const prompt=[{role:'user',content:'Reply with exactly: Gemma 3 local model ready.'}];
        const out=await generator(prompt,{max_new_tokens:24,do_sample:false});
        const text=extractText(out);
        if(!text)throw new Error('Gemma 3 self-test returned no text.');
        send('progress',{progress:100,status:'Google Gemma 3 270M ready · '+device.toUpperCase()});
        return {model:MODEL_ID,device:activeDevice};
      }catch(error){
        firstError=new Error(describeRuntimeError(error,device));
        generator=null;
        send('progress',{progress:device==='webgpu'?42:98,status:'Gemma 3 '+device.toUpperCase()+' initialization failed: '+describeRuntimeError(error,device).slice(0,180)});
      }
    }
    throw firstError||new Error('Gemma 3 could not initialize on this browser.');
  })().finally(()=>{loading=null;});
  return loading;
}
function extractText(output,prompt=''){
  const item=Array.isArray(output)?output[0]:output;
  const generated=item?.generated_text;
  if(typeof generated==='string')return (prompt&&generated.startsWith(prompt)?generated.slice(prompt.length):generated).trim();
  if(Array.isArray(generated)){
    const last=generated.slice().reverse().find(x=>x?.role==='assistant'||x?.role==='model')||generated[generated.length-1];
    return String(last?.content||last?.text||'').trim();
  }
  return String(item?.text||item?.content||'').trim();
}
self.onmessage=async event=>{
  const msg=event.data||{};
  const id=msg.id;
  try{
    if(msg.type==='load'){
      const info=await load();
      send('loaded',{id,...info});
      return;
    }
    if(msg.type==='generate'){
      await load();
      const messages=Array.isArray(msg.messages)?msg.messages:[{role:'user',content:String(msg.message||'')}];
      const system=messages.find(x=>x?.role==='system')?.content||'You are KAI 51, a helpful, accurate assistant. Do not invent sources or claim to browse unless evidence is supplied.';
      const turns=messages.filter(x=>x&&x.role!=='system'&&String(x.content||'').trim());
      const chat=[{role:'system',content:String(system).slice(0,2200)},...turns.map(x=>({role:['assistant','model','bot','ai'].includes(String(x.role||'').toLowerCase())?'assistant':'user',content:String(x.content||'').slice(0,5000)}))];
      send('progress',{progress:98,status:'Generating with Google Gemma 3 270M locally'});
      // Keep everyday replies short and responsive; users can ask follow-up questions for detail.
      const output=await generator(chat,{max_new_tokens:96,do_sample:true,temperature:0.35,top_p:0.9});
      const response=extractText(output);
      if(!response)throw new Error('Gemma 3 returned an empty answer.');
      send('generated',{id,response,model:MODEL_ID,device:activeDevice});
    }
  }catch(error){
    send('error',{id,message:describeRuntimeError(error,activeDevice).slice(0,900)});
  }
};