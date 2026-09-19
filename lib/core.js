import { browser, ai } from 'hatchable';
import { createKai51Plan, truthfulIdentity } from 'lib/kai51-core';

const CORE_MODELS = [
  { provider:'OpenRouter 1', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY_1' },
  { provider:'OpenRouter 2', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY_2' },
  { provider:'OpenRouter 3', model:'openai/gpt-oss-120b', base:'https://openrouter.ai/api/v1', keyEnv:'OPENROUTER_API_KEY_3' },
  { provider:'Groq 1', model:'openai/gpt-oss-20b', kind:'groq', base:'https://api.groq.com/openai/v1', keyEnv:'GROQ_API_KEY' },
  { provider:'Groq 2', model:'openai/gpt-oss-20b', kind:'groq', base:'https://api.groq.com/openai/v1', keyEnv:'GROQ_API_KEY_2' },
  { provider:'Groq 3', model:'openai/gpt-oss-20b', kind:'groq', base:'https://api.groq.com/openai/v1', keyEnv:'GROQ_API_KEY_3' },
  { provider:'Google Gemini', model:'gemini-3.6-flash', kind:'google', keyEnv:'GOOGLE_API_KEY' },
  { provider:'OpenAI', model:'gpt-5.4-mini', base:'https://api.openai.com/v1', keyEnv:'OPENAI_API_KEY' },
  { provider:'Mistral', model:'mistral-small-latest', base:'https://api.mistral.ai/v1', keyEnv:'MISTRAL_API_KEY' }
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
export async function complete({system='',prompt,maxTokens=1800,username='',history='',imageData='',modelChoice='auto'}={}){
  const started=Date.now(),agent='KAI 51',plan=createKai51Plan({prompt,username,history}),messages=[{role:'system',content:`${clean(system,12000)}\n\n${truthfulIdentity()}\n\nUse KAI 51 as the local-first planner and orchestrator. Execute deterministic/local capabilities before considering provider delegation. Never expose API keys or private implementation secrets.`},...(history?[{role:'user',content:`Conversation context:\n${clean(history,12000)}`}]:[]),{role:'user',content:clean(prompt,12000)}],attempts=[];
  if(modelChoice==='astra')modelChoice='auto';
  const selected=String(modelChoice||'auto');
  const filtered=selected==='openai'?CORE_MODELS.filter(c=>c.provider==='OpenAI'):selected==='google'?CORE_MODELS.filter(c=>c.kind==='google'):selected==='openrouter'?CORE_MODELS.filter(c=>c.provider.startsWith('OpenRouter')):selected==='groq'?CORE_MODELS.filter(c=>c.provider.startsWith('Groq')):selected==='mistral'?CORE_MODELS.filter(c=>c.provider==='Mistral'):CORE_MODELS;
  for(const candidate of filtered){const t=Date.now(),attempt={provider:candidate.provider,model:candidate.model,stage:'primitive-provider',status:'attempted'};try{const result=candidate.kind==='google'?await googleGenerate(candidate,messages,maxTokens,imageData):await openaiCompatible(candidate,messages,maxTokens,imageData);attempt.status='success';attempt.elapsedMs=Date.now()-t;attempts.push(attempt);return{provider:candidate.provider,model:candidate.model,text:result.text,elapsedMs:Date.now()-started,status:'ok',attempts,agent,plan,steps:[...plan.steps,{step:'provider-delegation',status:'used',provider:candidate.provider}],usage:result.usage}}catch(e){attempt.status='failed';attempt.elapsedMs=Date.now()-t;attempt.error=clean(e?.message||e,900);attempts.push(attempt)}}
  try{const text=await hatchableAIFallback({system,messages,maxTokens});attempts.push({provider:'Hatchable AI',model:'sonnet',stage:'managed-fallback',status:'success'});return{provider:'Hatchable AI',model:'sonnet',text,elapsedMs:Date.now()-started,status:'managed-fallback',attempts,agent,steps:[],usage:null}}catch(e){attempts.push({provider:'Hatchable AI',model:'sonnet',stage:'managed-fallback',status:'failed',error:clean(e?.message||e,900)})}
  const fallback=await kai51WebFallback({prompt,system,maxTokens});return{provider:'KAI 51',model:'web-research-fallback',text:fallback.text,elapsedMs:Date.now()-started,status:'final-fallback',attempts,agent:'KAI 51',steps:fallback.webSteps||[],usage:null}
}
export const CORE_PROVIDER_CHAIN=[...CORE_MODELS.map(x=>x.provider),'KAI 51'];