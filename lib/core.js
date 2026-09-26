import { browser, ai } from 'hatchable';
import { createKai51Plan, truthfulIdentity, executeLocal } from 'lib/kai51-core';
import { research12, KAI12_NODES } from 'lib/kai12';
import { raceApis, KAI678_PROVIDERS } from 'lib/kai678';
import { judgeReports } from 'lib/kai-judges';
import { KAI_NATIVE_ONLY } from 'lib/kai-native-test-mode';
import { adjudicate456 } from 'lib/kai456';

const CORE_MODELS = [
  { provider:'OpenRouter 1', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY_1' },
  { provider:'Groq 1', model:'openai/gpt-oss-20b', kind:'groq', base:'https://api.groq.com/openai/v1', keyEnv:'GROQ_API_KEY_2' },
  { provider:'OpenRouter 2', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY_2' },
  { provider:'Groq 2', model:'openai/gpt-oss-20b', kind:'groq', base:'https://api.groq.com/openai/v1', keyEnv:'GROQ_API_KEY_2' },
  { provider:'KAI 89 → KAI 51', kind:'kai-backup' },
  { provider:'Mistral', model:'mistral-small-latest', base:'https://api.mistral.ai/v1', keyEnv:'MISTRAL_API_KEY' },
  { provider:'Cerebras', model:'llama-3.3-70b', base:'https://api.cerebras.ai/v1', keyEnv:'CEREBRAS_API_KEY' },
  { provider:'OpenRouter 3', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY_3' },
  { provider:'OpenRouter final', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY' },
  { provider:'Google Gemini', model:'gemini-3.6-flash', kind:'google', keyEnv:'GOOGLE_API_KEY' },
  { provider:'OpenAI', model:'gpt-5.4-mini', base:'https://api.openai.com/v1', keyEnv:'OPENAI_API_KEY' }
];
function clean(value,max=12000){return String(value??'').replace(/\u0000/g,'').slice(0,max)}
function keyFor(c){return c?.keyEnv?process.env[c.keyEnv]:''}
async function openaiCompatible(c,messages,maxTokens,imageData=''){
  const key=keyFor(c);if(!key)throw new Error(`${c.provider} API key is not configured`);
  const payloadMessages=imageData?messages.map((m,i)=>i===messages.length-1&&m.role==='user'?{...m,content:[{type:'text',text:m.content},{type:'image_url',image_url:{url:imageData}}]}:m):messages;
  const r=await fetch(`${c.base}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model:c.model,messages:payloadMessages,max_tokens:maxTokens,temperature:.15})});
  const raw=await r.text();if(!r.ok)throw new Error(`${c.provider} HTTP ${r.status}: ${clean(raw,700)}`);
  const data=JSON.parse(raw),text=data?.choices?.[0]?.message?.content;if(!text)throw new Error(`${c.provider} returned no text`);return{text,usage:data.usage||null}
}
async function googleGenerate(c,messages,maxTokens,imageData=''){
  const key=keyFor(c);if(!key)throw new Error('Google Gemini API key is not configured');
  const system=messages.find(m=>m.role==='system')?.content||'';
  const contents=messages.filter(m=>m.role!=='system').map((m,i,arr)=>({role:m.role==='assistant'?'model':'user',parts:[{text:clean(m.content,14000)},...(imageData&&i===arr.length-1&&m.role==='user'?[{inline_data:{mime_type:imageData.match(/^data:(image\/[^;]+);base64,/)?.[1]||'image/jpeg',data:imageData.replace(/^data:image\/[^;]+;base64,/,'')}}]:[])]}));
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${c.model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:clean(system,12000)}]},contents,generationConfig:{maxOutputTokens:maxTokens,temperature:.15}})});
  const raw=await r.text();if(!r.ok)throw new Error(`Google Gemini HTTP ${r.status}: ${clean(raw,700)}`);
  const data=JSON.parse(raw),text=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';if(!text)throw new Error('Google Gemini returned no text');return{text,usage:data.usageMetadata||null}
}
async function kai51WebFallback({prompt,system,maxTokens}){
  const query=clean(prompt,700).replace(/\s+/g,' ').trim();let webText='';
  try{const html=await browser.html(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);const raw=String(html||'');const blocked=/(unusual traffic|captcha|verify (you are|you're) human|robot check|are you a robot|automated queries|access denied)/i.test(raw);if(!blocked)webText=raw.replace(/<script.*?<\/script>/gis,' ').replace(/<style.*?<\/style>/gis,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,18000)}catch(e){console.error('KAI 51 web retrieval failed',e)}
  if(!webText)webText='No usable public search results were retrieved for this fallback request.';
  const researchMessages=[{role:'system',content:`${clean(system,10000)}\n\nYou are KAI 51, the final web-research fallback. Answer using the supplied public web evidence. Be concise, useful, and honest about uncertainty. Never expose internal providers, API keys, CAPTCHA, or search-engine block pages.`},{role:'user',content:`User request:\n${query}\n\nPublic web evidence:\n${webText}`}];
  for(const s of [
    {provider:'Groq 2',run:()=>openaiCompatible(CORE_MODELS.find(c=>c.provider==='Groq 2'),researchMessages,maxTokens)},
    {provider:'OpenRouter 1',run:()=>openaiCompatible(CORE_MODELS.find(c=>c.provider==='OpenRouter 1'),researchMessages,maxTokens)},
    {provider:'OpenRouter 2',run:()=>openaiCompatible(CORE_MODELS.find(c=>c.provider==='OpenRouter 2'),researchMessages,maxTokens)},
    {provider:'OpenRouter 3',run:()=>openaiCompatible(CORE_MODELS.find(c=>c.provider==='OpenRouter 3'),researchMessages,maxTokens)},
    {provider:'Google Gemini',run:()=>googleGenerate(CORE_MODELS.find(c=>c.kind==='google'),researchMessages,maxTokens)},
    {provider:'Mistral',run:()=>openaiCompatible(CORE_MODELS.find(c=>c.provider==='Mistral'),researchMessages,maxTokens)}
  ]){try{const r=await s.run();if(r?.text)return{text:r.text,webSteps:[{provider:'KAI 51',action:'web-research',query},{provider:s.provider,action:'synthesis'}]}}catch(e){console.error(`KAI 51 ${s.provider} synthesis failed`,e)}}
  return{text:`I’m KAI 51. I couldn’t reach a synthesis model for this request, so I won’t pretend I completed it.\n\nYour request was: ${query}`,webSteps:[{provider:'KAI 51',action:'web-research',query},{provider:'KAI 51',action:'honest-emergency-response'}]}
}
async function hatchableAIFallback({system,messages,maxTokens}){
  const result=await ai.generateText({model:'sonnet',system:clean(system,12000),messages:messages.filter(m=>m.role!=='system'),maxTokens,purpose:'haxbro-chat-fallback'});
  const text=typeof result==='string'?result:(result?.text||result?.content||result?.output||'');if(!String(text).trim())throw new Error('Hatchable AI returned no text');return String(text).trim();
}
async function legacyComplete({system='',prompt,maxTokens=1800,username='',history='',imageData='',modelChoice='auto'}={}){
  const started=Date.now(),agent='KAI 51',plan=createKai51Plan({prompt,username,history}),attempts=[];
  const messages=[{role:'system',content:clean(system,12000)+'\\n\\n'+truthfulIdentity()+'\\n\\nKAI 51 is the HAxBRO orchestrator. External APIs are ordered recovery adapters. Never expose API keys or private implementation secrets.'},...(history?[{role:'user',content:'Conversation context:\\n'+clean(history,12000)}]:[]),{role:'user',content:clean(prompt,12000)}];
  const chain=CORE_MODELS;
  for(const candidate of chain){
    const attempt={provider:candidate.provider,model:candidate.model||candidate.provider,stage:candidate.kind==='kai-backup'?'kai-backup':'api-fallback',status:'attempted'};
    const t=Date.now();
    try{
      let result;
      if(candidate.kind==='kai-backup'){
        let normalized=clean(prompt,12000),evidence='',language='unknown';
        try{
          const kr=await fetch('https://haxbro.hatchable.site/api/kai/understanding',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:normalized})});
          if(kr.ok){const kd=await kr.json();normalized=clean(kd?.normalizedText||normalized,12000);evidence=clean(kd?.webEvidence||'',4000);language=clean(kd?.language||'unknown',80);}
        }catch(err){console.error('KAI 89 backup unavailable',err)}
        const local=executeLocal({prompt:normalized});
        if(!local?.handled)throw new Error('KAI 51 local capability did not handle this request');
        result={text:local.text,usage:null,steps:[{step:'KAI 89 web-language recognition',status:'success',language,evidence:evidence?'present':'none'},{step:'KAI 51 local capability',status:'success'}]};
      }else if(candidate.kind==='google'){
        result=await googleGenerate(candidate,messages,maxTokens,imageData);
      }else{
        result=await openaiCompatible(candidate,messages,maxTokens,imageData);
      }
      if(!result?.text)throw new Error('Empty response');
      attempt.status='success';attempt.elapsedMs=Date.now()-t;attempts.push(attempt);
      return{provider:candidate.provider,model:candidate.model||'KAI 51',text:result.text,elapsedMs:Date.now()-started,status:candidate.kind==='kai-backup'?'kai-backup':'api-fallback',attempts,agent,plan,steps:[...plan.steps,...(result.steps||[]),{step:'ordered-chain',status:'recovered',provider:candidate.provider}],usage:result.usage||null,local:candidate.kind==='kai-backup'};
    }catch(err){
      attempt.status='failed';attempt.elapsedMs=Date.now()-t;attempt.error=clean(err?.message||err,900);attempts.push(attempt);
    }
  }
  const fallback=await kai51WebFallback({prompt,system,maxTokens});
  return{provider:'KAI 51 recovery',model:'web-research-recovery',text:fallback.text,elapsedMs:Date.now()-started,status:'recovery',attempts,agent,plan,steps:[...plan.steps,...(fallback.webSteps||[])]};
}
/* KAI 51 architecture v2: KAI 90/6·7·8 races APIs; KAI 12 researches in parallel; KAI 1–4 judge; GUY 456 adjudicates hard/conflicting cases. */
export async function complete({system='',prompt,maxTokens=1800,username='',history='',imageData='',modelChoice='auto'}={}) {
  const started=Date.now();
  const request=clean(prompt,12000);
  const casual=/^(hi|hello|hey|yo|sup|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(request);
  const complexity=/\b(deep research|comprehensive research|investigate|investigation|forensic|threat model|threatmodel|source code|architecture|compare|comparison|analyze|analysis|latest|current|evidence|multiple|step[- ]by[- ]step)\b/i.test(request)||request.length>2200||/\n/.test(request)&&request.length>900;
  const budgetMs=complexity?27000:4700;
  const apiBudgetMs=complexity?8500:4000;
  const apiPrompt=clean(system,9000)+'\n\n'+clean(truthfulIdentity(),1000)+'\n\nINTELLIGENCE CONTRACT: Understand the user\'s actual goal before answering. Use conversation context to resolve references and implied intent. Answer directly when the intent is clear; ask one concise clarification only when a missing detail truly blocks a correct answer. Do not echo internal reasoning, orchestration, provider details, or implementation secrets.\n\nUSER REQUEST:\n'+request+(history?'\n\nCONTEXT:\n'+clean(history,5000):'');
  const safeResearch=Promise.race([
    research12({prompt:request,history}),
    new Promise(resolve=>setTimeout(()=>resolve({ok:false,engine:'KAI 12',local:true,web:false,nodes:KAI12_NODES,findings:[],report:'Research window expired; answer using available compute.'}),complexity?12000:3600))
  ]);
  const safeApi=KAI_NATIVE_ONLY
    ? Promise.resolve({ok:false,error:'KAI_NATIVE_ONLY',attempts:[]})
    : Promise.race([
      raceApis({prompt:apiPrompt,maxTokens,timeoutMs:apiBudgetMs}),
      new Promise(resolve=>setTimeout(()=>resolve({ok:false,error:'compute-window',attempts:[]}),apiBudgetMs+300))
    ]);
  const [apiResult,researchResult]=await Promise.race([
    Promise.all([safeApi,safeResearch]),
    new Promise(resolve=>setTimeout(()=>resolve([{ok:false,error:'compute-window',attempts:[]},{ok:false,engine:'KAI 12',local:true,web:false,nodes:KAI12_NODES,findings:[],report:''}]),budgetMs))
  ]);
  const apiReport=apiResult?.ok?clean(apiResult.text,14000):'';
  const researchReport=researchResult?.report||'';
  const judgment=judgeReports({question:request,research:researchReport,api:apiReport});
  const adjudication=judgment.needs456?adjudicate456({question:request,research:researchReport,api:apiReport,judgment}):null;
  const casualReply=/^(hi|hello|hey|yo|sup|hiya)[!. ]*$/i.test(request)?'Hey! 👋 I’m HAxBRO. What are we building or working on today?':/^(good morning|good afternoon|good evening)[!. ]*$/i.test(request)?'Hey! 👋 I’m HAxBRO. What are we working on today?':'';
  // Research output is internal evidence, never a user-facing fallback. If no synthesis answer exists, use a clean capability response instead of leaking reports/source snippets.
  const internalResearchFallback=/^(?:please\s+)?(?:research|investigate|analy[sz]e|compare|find|check)\b/i.test(request)
    ? 'I can work on that, but I do not have a usable final synthesis available right now. Please try the request again.'
    : 'I’m HAxBRO. I can help with that — tell me what you want to do, and I’ll take it from there.';
  const finalText=casualReply||apiReport||adjudication?.finalReport||internalResearchFallback;
  return {provider:apiResult?.provider||'KAI 12',model:apiResult?.model||'KAI 12 local research organization',text:finalText,response:finalText,elapsedMs:Date.now()-started,status:apiReport?'api-primary':'kai12-fallback',agent:'KAI 51',
    architecture:{mainBrain:'KAI 51',research:'KAI 12',apiController:'KAI 6·7·8 / KAI 90',judges:judgment.judges.map(j=>j.id),adjudicator:adjudication?'GUY 456':null,localDownload:false,normalTargetMs:5000,deepTargetMs:30000},
    apiRace:{ok:!!apiResult?.ok,provider:apiResult?.provider||null,attempts:apiResult?.attempts||[]},
    kai12:{nodes:KAI12_NODES,web:!!researchResult?.web,report:researchReport},judgment,adjudication,usage:apiResult?.usage||null,local:true,
    steps:[{step:'KAI 51 received request',status:'complete'},{step:'KAI 12 research organization',status:'complete',nodes:12,parallel:true},{step:'KAI 6·7·8 / KAI 90 API race',status:apiResult?.ok?'complete':'unavailable',primary:true},{step:'KAI 1–4 report judges',status:'complete',parallel:true},{step:'GUY 456 adjudication',status:adjudication?'complete':'not-needed'},{step:'KAI 51 final response',status:'complete'}]
  };
}
export const CORE_PROVIDER_CHAIN=['KAI 51','KAI 12','KAI 6·7·8 / KAI 90'];