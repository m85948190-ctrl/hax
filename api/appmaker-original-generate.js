export const access = "public";
export const methods = ["POST"];

import { runAppMakerAgent } from 'lib/appmaker-agent';
import { buildNativeProduct } from 'lib/kai-native-builder';

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  const prompt=String(req.body?.prompt||"").trim();
  if(!prompt) return res.status(400).json({error:"Describe the app you want to build."});
  try{
    const existing=req.body?.existing&&typeof req.body.existing==='object'?req.body.existing:null;
    const result=await runAppMakerAgent(prompt,{appName:String(req.body?.appName||existing?.name||'').trim(),existing});
    return res.json({ok:true,...result});
  }catch(e){
    console.error("App Maker agent error",e);
    try{
      const native=buildNativeProduct(prompt,{existing,appName:String(req.body?.appName||existing?.name||'').trim()});
      return res.json({
        ok:true,
        ...native,
        published:false,
        publicUrl:'',
        fallback:true,
        recovery:'first-party-local-app-maker',
        agent:{name:'KAI 51 Native App Maker Recovery',authority:'KAI 51',compute:'local-deterministic',provider:null},
        export:{route:'/api/app-export',downloadRoute:'/api/app-download',formats:['html','bundle']}
      });
    }catch(nativeError){
      return res.status(500).json({error:e?.message||'KAI App Maker agent failed',recoveryError:nativeError?.message||'Local recovery failed'});
    }
  }
}