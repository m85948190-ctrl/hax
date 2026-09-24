export const access = "public";
export const methods = ["POST"];

import { buildNativeProduct } from 'lib/kai-native-builder';

const clean=(v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  const prompt=String(req.body?.prompt||"").trim();
  if(!prompt) return res.status(400).json({error:"Describe the app you want to build."});
  try{
    const origin=req.headers?.origin||"";
    const base=origin && /^https?:\/\//i.test(origin) ? origin : "https://haxbro.hatchable.site";
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(base+"/api/app-builder",{method:"POST",signal:controller.signal,headers:{"content-type":"application/json"},body:JSON.stringify({prompt:prompt.slice(0,12000),username:req.body?.username||"app-maker",kaiMode:"deep",kai51Context:{mode:"KAI DEEP",workspace:"APP MAKER",goal:"Understand the product before implementation and build the requested product itself."}})});
      const data=await r.json().catch(()=>({}));
      if(r.ok&&Array.isArray(data?.files)&&data.files.length)return res.json(data);
    }catch(e){
      console.warn("App Maker API generation unavailable; using native KAI fallback",e?.name||e?.message||e);
    }finally{clearTimeout(timer)}
    const fallback=buildNativeProduct(prompt,{appName:"",existing:null});
    return res.json({ok:true,...fallback,kai:{engine:"KAI 51 App Maker",provider:"KAI Native fallback",mode:"fast-recovery"}});
  }catch(e){
    console.error("App Maker Builder bridge error",e);
    return res.status(500).json({error:e?.message||"KAI Builder connection failed"});
  }
}