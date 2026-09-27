import { runAppMakerAgent } from 'lib/appmaker-agent';

export const access='public';
export const methods=['POST'];

export default async function(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST required'});
  const prompt=String(req.body?.prompt||req.body?.idea||'').trim();
  if(!prompt) return res.status(400).json({ok:false,error:'Tell KAI what application to build.'});
  try{
    const existing=req.body?.existing&&typeof req.body.existing==='object'?req.body.existing:null;
    const result=await runAppMakerAgent(prompt,{existing,appName:String(req.body?.appName||'').trim()});
    return res.json({ok:true,...result});
  }catch(e){
    console.error('KAI 51 App Maker live-agent error',e);
    return res.status(500).json({ok:false,error:e?.message||'KAI 51 App Maker failed'});
  }
}