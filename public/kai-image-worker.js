import { AutoProcessor, AutoModelForVision2Seq, RawImage } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

let runtimePromise=null;
async function getRuntime(){
  if(runtimePromise)return runtimePromise;
  runtimePromise=(async()=>{
    const modelId='HuggingFaceTB/SmolVLM-256M-Instruct';
    let device='wasm';
    try{
      if(self.navigator?.gpu?.requestAdapter){
        const adapter=await Promise.race([self.navigator.gpu.requestAdapter(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('GPU probe timed out')),3000))]);
        if(adapter){
          const probe=await Promise.race([adapter.requestDevice(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('GPU device probe timed out')),3000))]);
          try{probe.destroy?.()}catch{}
          device='webgpu';
        }
      }
    }catch{}
    self.postMessage({type:'status',status:'Loading the local vision model ('+device.toUpperCase()+')'});
    const processor=await AutoProcessor.from_pretrained(modelId);
    const model=await AutoModelForVision2Seq.from_pretrained(modelId,{
      dtype:{embed_tokens:'q4',vision_encoder:'q4',decoder_model_merged:'q4'},
      device
    });
    return {processor,model,device};
  })().catch(error=>{runtimePromise=null;throw error});
  return runtimePromise;
}

self.onmessage=async event=>{
  const data=event.data||{};
  if(data.type==='reset'){runtimePromise=null;return}
  if(data.type!=='analyze')return;
  const id=data.id;
  try{
    if(!(data.buffer instanceof ArrayBuffer))throw new Error('Image bytes were not received by the local vision worker.');
    self.postMessage({type:'status',id,status:'Preparing image locally'});
    const runtime=await getRuntime();
    const image=await RawImage.fromBlob(new Blob([data.buffer],{type:data.mime||'image/jpeg'}));
    const messages=[{role:'user',content:[{type:'image'},{type:'text',text:'Describe this image carefully. Identify visible objects, scene, layout, and readable text. Do not guess details that are not visible.'}]}];
    const prompt=runtime.processor.apply_chat_template(messages,{add_generation_prompt:true});
    const inputs=await runtime.processor(prompt,[image],{do_image_splitting:false});
    const output=await runtime.model.generate({...inputs,max_new_tokens:120});
    const caption=runtime.processor.batch_decode(output.slice(null,[inputs.input_ids.dims.at(-1),null]),{skip_special_tokens:true})?.[0]||'';
    if(!String(caption).trim())throw new Error('The local image model returned no description.');
    self.postMessage({type:'result',id,ok:true,caption:String(caption).trim().slice(-4000),device:runtime.device});
  }catch(error){
    self.postMessage({type:'result',id,ok:false,error:String(error?.message||error||'Local image analysis failed').slice(0,700)});
  }
};