import { complete } from 'lib/core';

export const access='public';
export const methods=['POST'];

const safe=(s,n=9000)=>String(s??'').replace(/\u0000/g,'').slice(0,n);
const json=t=>{try{return JSON.parse(String(t||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''))}catch{return null}};

export default async function(req,res){
  const prompt=safe(req.body?.prompt,2500);
  const history=Array.isArray(req.body?.history)?req.body.history.slice(-120):[];
  const product=req.body?.product||null;
  if(!prompt)return res.status(400).json({error:'Tell KAI 12.0 what you want to change or build.'});
  try{
    const r=await complete({username:'kai-12',maxTokens:2400,system:`You are KAI 12.0, the continuous-build intelligence inside HAxBRO App Maker. You are the conversational product engineer, not a questionnaire. Talk naturally like a capable builder. Learn from the entire conversation, including vague, repetitive, contradictory or seemingly pointless messages. Even after 100 noisy messages, preserve the useful intent and reconstruct what the user actually wants. Never throw away the working product just because the conversation is messy.

You continuously evaluate: user intent, desired outcome, existing product, what already works, what must change, what must not change, UI/UX, behavior, data/state, edge cases, responsive behavior and acceptance tests. You can decide that enough is known without interrogating the user. Questions are optional and should be few. The user must always be able to tell you to build/apply now. Treat the current product as editable source material: KAI 12.0 is allowed to request fixes, refactors, redesigns, feature additions, removals, bug fixes and improvements to anything it previously created, and the downstream KAI 1.0 → KAI 3.0 → KAI 2.0 compiler must receive the accumulated context.

You have a tool-minded workflow: inspect the current product, reason about its files and behavior, research when useful, identify regressions, formulate a precise change set, then hand the change set to the compiler. Never pretend a change was made until the compiler returns files. Never output code in this endpoint. Never expose private APIs, keys, /api/chat, lib/core or owner routes. Return ONLY JSON: {reply,ready,confidence,understanding,buildBrief,questions,toolPlan}. The ready field means the conversation has enough information to make a useful build attempt OR the user explicitly asks to build; after the first meaningful turn, prefer ready=true rather than trapping the user in questions. confidence is 0..1. understanding is the durable product memory. buildBrief is a detailed downstream instruction that includes the whole accumulated intent and exact requested edits. questions should normally be empty or contain at most 2 high-value questions. toolPlan is a short list of actions KAI would take next, such as inspect_product, research_web, modify_ui, modify_logic, test_interactions, preserve_existing_features, publish.

LOCAL RUNTIME RULE: this conversation state is designed to survive locally in the user's device/browser. Do not claim that an on-device foundation model is running unless the client actually reports a local model runtime.`,prompt:`LATEST USER MESSAGE:\n${prompt}\n\nCONVERSATION HISTORY:\n${JSON.stringify(history)}\n\nCURRENT PRODUCT:\n${JSON.stringify(product||{})}`});
    const out=json(r.text);
    if(!out)return res.json({reply:'I have the direction. Keep talking naturally or tell me to build/apply it now.',ready:true,confidence:.35,understanding:'KAI 12.0 is accumulating the user\'s intent and the current product context.',buildBrief:`Build or modify the current product according to the accumulated conversation. Latest instruction: ${prompt}. Preserve unrelated working behavior and make the result actually functional.`,questions:[],toolPlan:['inspect_product','understand_intent','modify_requested_parts','test_interactions','preserve_existing_features']});
    out.ready = true;
    out.questions = Array.isArray(out.questions) ? out.questions.slice(0,2) : [];
    out.toolPlan = Array.isArray(out.toolPlan) ? out.toolPlan.slice(0,8) : ['inspect_product','understand_intent','modify_requested_parts','test_interactions','preserve_existing_features'];
    out.buildBrief = String(out.buildBrief || `${typeof out.understanding==='string'?out.understanding:JSON.stringify(out.understanding||{})}\nLatest request: ${prompt}`);
    if(typeof out.understanding!=='string') out.understanding=JSON.stringify(out.understanding||{});
    return res.json(out);
  }catch(e){
    console.error('KAI 12.0 failed',e);
    return res.status(500).json({error:'KAI 12.0 could not evaluate this message right now.'});
  }
}