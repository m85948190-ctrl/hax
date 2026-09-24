export const access = "public";
export const methods = ["POST"];

import { buildNativeProduct } from 'lib/kai-native-builder';

const clean=(v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  const prompt=String(req.body?.prompt||"").trim();
  if(!prompt) return res.status(400).json({error:"Describe the app you want to build."});
  try{
    // This endpoint is the App Maker's fast delivery path. Do not synchronously call another
    // serverless endpoint here: nested function execution can consume the platform's outer
    // timeout even when an AbortController is present. Build locally first so normal requests
    // return immediately and never surface a runtime timeout.
    const fallback=buildNativeProduct(prompt,{appName:"",existing:null});
    return res.json({ok:true,...fallback,kai:{engine:"KAI 51 App Maker",provider:"KAI Native fallback",mode:"fast-native"}});
  }catch(e){
    console.error("App Maker Builder bridge error",e);
    return res.status(500).json({error:e?.message||"KAI Builder connection failed"});
  }
}