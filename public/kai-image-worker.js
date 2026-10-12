import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

let captionerPromise=null;
function getCaptioner(){
  if(captionerPromise)return captionerPromise;
  captionerPromise=pipeline('image-to-text','Xenova/vit-gpt2-image-captioning').catch(error=>{captionerPromise=null;throw error});
  return captionerPromise;
}

self.onmessage=async event=>{
  const data=event.data||{};
  if(data.type==='reset'){captionerPromise=null;return}
  if(data.type!=='analyze')return;
  const id=data.id;
  let url='';
  try{
    if(!(data.buffer instanceof ArrayBuffer))throw new Error('Image bytes were not received by the local vision worker.');
    self.postMessage({type:'status',id,status:'Loading the lightweight local image-caption model'});
    const captioner=await getCaptioner();
    url=URL.createObjectURL(new Blob([data.buffer],{type:data.mime||'image/jpeg'}));
    self.postMessage({type:'status',id,status:'Analyzing the image on this device'});
    const output=await captioner(url,{max_new_tokens:64});
    const caption=Array.isArray(output)?String(output[0]?.generated_text||''):String(output?.generated_text||'');
    if(!caption.trim())throw new Error('The local image model returned no description.');
    self.postMessage({type:'result',id,ok:true,caption:caption.trim().slice(0,2500),device:'browser-local'});
  }catch(error){
    self.postMessage({type:'result',id,ok:false,error:String(error?.message||error||'Local image analysis failed').slice(0,700)});
  }finally{if(url)URL.revokeObjectURL(url)}
};