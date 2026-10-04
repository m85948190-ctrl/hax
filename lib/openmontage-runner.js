const runner=()=>String(process.env.OPENMONTAGE_RUNNER_URL||'').replace(/\/$/,'');
const token=()=>String(process.env.OPENMONTAGE_RUNNER_TOKEN||'');
export function openMontageConfigured(){ return !!runner(); }
export async function runOpenMontage({prompt,referenceUrl,type='video',duration,aspectRatio='16:9'}){
  const base=runner();
  if(!base) throw new Error('OpenMontage runtime is not connected. Configure OPENMONTAGE_RUNNER_URL to a real OpenMontage runner.');
  const res=await fetch(base+'/api/produce',{method:'POST',headers:{'content-type':'application/json',...(token()?{authorization:'Bearer '+token()}: {})},body:JSON.stringify({prompt,reference_url:referenceUrl||null,type,duration,aspect_ratio:aspectRatio})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||('OpenMontage runner returned HTTP '+res.status));
  return data;
}