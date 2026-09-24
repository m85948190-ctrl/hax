import { buildNativeProduct } from 'lib/kai-native-builder';
import { createKai51Plan } from 'lib/kai51-core';

export const access='public';
export const methods=['POST'];

const safe=(v,n=14000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
const cleanName=v=>String(v||'').replace(/[<>"'\`]/g,'').replace(/\s+/g,' ').trim().slice(0,70);
const requestedName=q=>{const m=String(q||'').match(/\b(?:called|named|name it|call it)\s+["']?([^"'\n,.!?]{1,60})/i);return cleanName(m?.[1]||'')};

function harden(result){
  if(!result?.files?.length)return result;
  const files=result.files.map(f=>({...f,content:String(f.content||'')}));
  const html=files.find(f=>/index\.html$/i.test(f.path));
  if(html&&!/name=["']viewport["']/i.test(html.content))html.content=html.content.replace(/<head[^>]*>/i,m=>m+'<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">');
  const css=files.find(f=>/\.css$/i.test(f.path));
  if(css&&!css.content.includes('KAI NATIVE RESPONSIVE HARDENING'))css.content+='\n/* KAI NATIVE RESPONSIVE HARDENING */\n*,*::before,*::after{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}img,video,canvas,svg{max-width:100%}@media(max-width:720px){button{min-height:44px}input,textarea,select{font-size:16px;min-width:0}}\n';
  return {...result,files};
}

function identity(result,name){
  if(!result)return result;
  const n=cleanName(name)||cleanName(result.name)||'KAI Product';
  const files=(result.files||[]).map(f=>({...f,content:String(f.content||'').replace(/HAxBRO AI|HAxBRO App|Hacks Bro AI/gi,n)}));
  return {...result,name:n,files};
}

export default async function(req,res){
  const prompt=safe(req.body?.prompt||req.body?.idea);
  if(!prompt)return res.status(400).json({ok:false,error:'Tell KAI what app to build.'});
  try{
    const existing=req.body?.existingProduct?.files?req.body.existingProduct:null;
    const appName=requestedName(prompt)||cleanName(req.body?.appName);
    const kai51Plan=createKai51Plan({prompt,username:req.body?.username||'local-user',history:''});
    const result=harden(identity(buildNativeProduct(prompt,{existing,appName}),appName));
    result.kai={
      engine:'KAI 51 → KAI Native Product Compiler',
      mode:'provider-free',
      provider:'none',
      local:true,
      pipeline:['intent','product-type detection','native build','responsive hardening','delivery'],
      plan:kai51Plan,
      ownerSecretsExcluded:true
    };
    return res.json({ok:true,...result});
  }catch(e){
    console.error('KAI native App Maker failed',e);
    return res.status(500).json({ok:false,error:'KAI native App Maker failed.',detail:safe(e?.message||e,300)});
  }
}