import { buildNativeProduct } from 'lib/kai-native-builder';
import { createKai51Plan } from 'lib/kai51-core';

export const access='public';
export const methods=['POST'];

const safe=(v,n=14000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
const cleanName=v=>String(v||'').replace(/[<>"'\`]/g,'').replace(/\s+/g,' ').trim().slice(0,70);
const requestedName=q=>{const m=String(q||'').match(/\b(?:called|named|name it|call it)\s+["']?([^"'\n,.!?]{1,60})/i);return cleanName(m?.[1]||'')};

async function kaiWebBuildResearch(prompt,origin){
  try{
    const r=await fetch(origin+'/api/kai/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:String(prompt||'').slice(0,700),mode:'deep'})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)return {ok:false,sources:[],blueprint:''};
    const sources=Array.isArray(d.sources)?d.sources.slice(0,5).map(x=>({title:safe(x.title,180),url:safe(x.url,500),text:safe(x.text,1200)})):[];
    const blueprint=['WEB BUILD BLUEPRINT — KAI WEB AGENT','Build request: '+safe(prompt,3000),...sources.map((s,i)=>'Reference '+(i+1)+': '+s.title+'\nURL: '+s.url+'\nEvidence: '+s.text),'Use public evidence as design/feature guidance only; do not copy proprietary code or private data.'].join('\n\n');
    return {ok:true,engine:d.engine||'KAI Web Search',sources,blueprint};
  }catch(e){return {ok:false,sources:[],blueprint:''};}
}

function harden(result){
  if(!result?.files?.length)return result;
  const files=result.files.map(f=>({...f,content:String(f.content||'')}));
  const html=files.find(f=>/index\.html$/i.test(f.path));
  if(html&&!/name=["']viewport["']/i.test(html.content))html.content=html.content.replace(/<head[^>]*>/i,m=>m+'<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">');
  const css=files.find(f=>/\.css$/i.test(f.path));
  if(css&&!css.content.includes('KAI NATIVE RESPONSIVE HARDENING'))css.content+='\n/* KAI NATIVE RESPONSIVE HARDENING */\n*,*::before,*::after{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}img,video,canvas,svg{max-width:100%;height:auto}.shell,.top,.grid,.row,.card,.item,.tabs,.view{min-width:0}.shell{width:min(1180px,calc(100% - 24px));margin-inline:auto;overflow:clip}.top{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:18px}.top>*{min-width:0}.top h1,.top p,.card h1,.card h2,.card h3,.item span{overflow-wrap:anywhere;word-break:break-word}.grid{grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))}.row{align-items:stretch}.row>*{min-width:0;max-width:100%}.card{overflow:hidden}.item{overflow:hidden}.item>*{min-width:0;overflow-wrap:anywhere}.tabs{overflow-x:auto;scrollbar-width:thin}.tabs button{flex:0 0 auto;white-space:nowrap}@media(max-width:720px){.top{grid-template-columns:1fr}.shell{width:calc(100% - 20px)}.grid{grid-template-columns:1fr!important}.row{flex-direction:column}.row>*{width:100%;flex-basis:auto}button{min-height:44px;white-space:normal}input,textarea,select{font-size:16px;min-width:0;max-width:100%}}\n';
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
    const origin=req.headers?.origin&&String(req.headers.origin).startsWith('http')?req.headers.origin:'https://haxbro.hatchable.site';
    /* KAI 51 LOCAL BUILD: no external search, provider API, judge or remote builder is used. */
    const researchedPrompt=prompt;
    let result=buildNativeProduct(researchedPrompt,{existing,appName});
    const computeSource='local';
    result=harden(identity(result,appName));
    result.kai={
      engine:'KAI 51 App Maker',
      mode:'local-only',
      provider:'KAI 51 LOCAL',
      local:true,
      pipeline:['intent','product-type detection','local build','validation','delivery'],
      plan:kai51Plan,
      ownerSecretsExcluded:true
    };
    return res.json({ok:true,...result});
  }catch(e){
    console.error('KAI native App Maker failed',e);
    return res.status(500).json({ok:false,error:'KAI native App Maker failed.',detail:safe(e?.message||e,300)});
  }
}