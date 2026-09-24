import { ai } from 'hatchable';

export const access='public';
export const methods=['POST','OPTIONS'];

const clean=(v,n=5000)=>String(v??'').replace(/\u0000/g,'').slice(0,n).trim();

const fallbackNormalize=text=>{
  const typo={
    hsve:'have',hve:'have',hvae:'have',helo:'hello',hllo:'hello',
    godo:'good',goood:'good',giod:'good',godo:'good',
    tme:'time',tim:'time',thx:'thanks',thnak:'thank',thnaks:'thanks',
    pls:'please',plz:'please',yu:'you',ur:'your',u:'you'
  };
  const corrected=text.split(/(\s+)/).map(part=>{
    if(!/^[a-z]+$/i.test(part))return part;
    return typo[part.toLowerCase()]||part;
  }).join('');
  return corrected;
};

export default async function(req,res){
  if(req.method==='OPTIONS')return res.status(204).send('');
  const input=clean(req.body?.text||req.body?.message);
  if(!input)return res.status(400).json({ok:false,error:'text required'});

  const deterministic=fallbackNormalize(input);
  let interpreted=null;
  try{
    const model=await ai.generateText({
      model:'gpt-5',
      purpose:'haxbro-kai-89-language-understanding',
      maxSteps:1,
      prompt:'You are KAI 89, HAxBRO AI language-understanding and typo-repair engine. You run BEFORE KAI 51. Your ONLY job is to infer what the user means, repair obvious spelling/typing mistakes, normalize slang/abbreviations when context supports it, and identify the likely intent. Do not answer the user. Do not invent missing facts. Preserve names, URLs, numbers, code, and technical tokens exactly unless clearly mistyped. If the text is already clear, return it unchanged. Return ONLY valid JSON: {"normalizedText":"...","intent":"conversation|question|instruction|research|build|code|decode|encode|other","confidence":0.0,"changed":true|false}. User text: '+input
    });
    const raw=typeof model==='string'?model:(model?.text||model?.output_text||model?.content||'');
    if(raw)interpreted=JSON.parse(raw);
  }catch(e){console.warn('KAI 89 unavailable',e?.message||e);}
  const normalized=clean(interpreted?.normalizedText||deterministic);
  return res.json({
    ok:true,
    engine:'KAI 89',
    normalizedText:normalized||input,
    intent:String(interpreted?.intent||'other'),
    confidence:Number.isFinite(Number(interpreted?.confidence))?Number(interpreted.confidence):0,
    changed:Boolean(interpreted?.changed)||normalized!==input,
    handoff:'KAI 51'
  });
}