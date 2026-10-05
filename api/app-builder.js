import { runAppMakerAgent } from 'lib/appmaker-agent';
import { buildNativeProduct } from 'lib/kai-native-builder';

export const access='public';
export const methods=['POST'];

export default async function(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST required'});
  const prompt=String(req.body?.prompt||req.body?.idea||'').trim();
  if(!prompt) return res.status(400).json({ok:false,error:'Tell KAI what application to build.'});
  const existing=req.body?.existing&&typeof req.body.existing==='object'?req.body.existing:null;
  try{
    const result=await runAppMakerAgent(prompt,{existing,appName:String(req.body?.appName||'').trim()});
    return res.json({ok:true,...result,export:{route:'/api/app-export',downloadRoute:'/api/app-download',formats:['html','bundle']}});
  }catch(e){
    console.error('KAI 51 App Maker live-agent error',e);
    try{
      const native=buildNativeProduct(prompt,{existing,appName:String(req.body?.appName||'').trim()});
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
      return res.status(500).json({ok:false,error:e?.message||'KAI 51 App Maker failed',recoveryError:nativeError?.message||'Local recovery failed'});
    }
  }
}