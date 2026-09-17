import { complete } from 'lib/core';

export const access='public';
export const methods=['POST'];

const safe=(s,n=9000)=>String(s??'').replace(/\u0000/g,'').slice(0,n);
const json=t=>{try{return JSON.parse(String(t||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''))}catch{return null}};

export default async function(req,res){
  const prompt=safe(req.body?.prompt,2500);
  const history=Array.isArray(req.body?.history)?req.body.history.slice(-40):[];
  const product=req.body?.product||null;
  if(!prompt)return res.status(400).json({error:'Tell KAI 12.0 what you want to change or build.'});
  try{
    const r=await complete({username:'kai-12',maxTokens:1800,system:`You are KAI 12.0, the continuous-build intelligence inside HAxBRO App Maker. You do NOT rush to code. You listen to the user, evaluate what they mean, remember the evolving product, detect contradictions and missing requirements, and ask focused questions only when they materially improve the result. You may take many conversations before a build is appropriate. Your job is to turn a vague idea into a precise build brief, then hand that brief to the existing KAI 1.0 → KAI 3.0 → KAI 2.0 compiler. Never pretend you built something. Never output code. Never expose private APIs, keys, /api/chat, lib/core or owner routes. Return ONLY JSON: {reply,ready,confidence,understanding,buildBrief,questions}. ready=true only when the request is sufficiently understood OR the user explicitly asks to build now. confidence is 0..1. understanding is a concise statement of what you believe the user wants. buildBrief is a detailed instruction for the downstream builder, including product type, audience, core flow, UI, interactions, data/state, edge cases, responsive behavior and acceptance tests. If an existing product is supplied, treat it as the source of truth and describe modifications rather than replacing unrelated behavior.`,prompt:`LATEST USER MESSAGE:\n${prompt}\n\nCONVERSATION HISTORY:\n${JSON.stringify(history)}\n\nCURRENT PRODUCT:\n${JSON.stringify(product||{})}`});
    const out=json(r.text);
    if(!out)return res.json({reply:'I understand the direction. Tell me the most important behavior you want next, and I will keep refining the build brief.',ready:false,confidence:.25,understanding:'Continuing discovery.',buildBrief:prompt,questions:['What should the user be able to do first?']});
    return res.json(out);
  }catch(e){
    console.error('KAI 12.0 failed',e);
    return res.status(500).json({error:'KAI 12.0 could not evaluate this message right now.'});
  }
}