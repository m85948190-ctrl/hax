const PROVIDERS=[
 {provider:'OpenRouter 1',model:'openai/gpt-oss-120b',base:'https://openrouter.ai/api/v1',keyEnv:'OPENROUTER_API_KEY_1'},
 {provider:'Groq 1',model:'openai/gpt-oss-20b',base:'https://api.groq.com/openai/v1',keyEnv:'GROQ_API_KEY_2'},
 {provider:'OpenRouter 2',model:'openai/gpt-oss-120b',base:'https://openrouter.ai/api/v1',keyEnv:'OPENROUTER_API_KEY_2'},
 {provider:'Groq 2',model:'openai/gpt-oss-20b',base:'https://api.groq.com/openai/v1',keyEnv:'GROQ_API_KEY_2'},
 {provider:'Mistral',model:'mistral-small-latest',base:'https://api.mistral.ai/v1',keyEnv:'MISTRAL_API_KEY'},
 {provider:'Cerebras',model:'llama-3.3-70b',base:'https://api.cerebras.ai/v1',keyEnv:'CEREBRAS_API_KEY'},
 {provider:'OpenRouter 3',model:'openai/gpt-oss-120b',base:'https://openrouter.ai/api/v1',keyEnv:'OPENROUTER_API_KEY_3'},
 {provider:'OpenRouter final',model:'openai/gpt-oss-120b',base:'https://openrouter.ai/api/v1',keyEnv:'OPENROUTER_API_KEY'}
];
const clean=(v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
async function ask(c,prompt,maxTokens,signal){
 const key=process.env[c.keyEnv]; if(!key)throw new Error('not configured');
 const r=await fetch(c.base+'/chat/completions',{method:'POST',signal,headers:{'content-type':'application/json',authorization:'Bearer '+key},body:JSON.stringify({model:c.model,messages:[{role:'system',content:'You are the API compute worker for HAxBRO KAI 90. Answer the user accurately and directly. Do not discuss internal routing.'},{role:'user',content:clean(prompt,14000)}],max_tokens:maxTokens,temperature:.15})});
 const raw=await r.text(); if(!r.ok)throw new Error(c.provider+' HTTP '+r.status);
 const d=JSON.parse(raw),text=d?.choices?.[0]?.message?.content;
 if(!text)throw new Error('empty'); return {text,provider:c.provider,model:c.model,usage:d.usage||null};
}
export async function raceApis({prompt='',maxTokens=1800,timeoutMs=4200}={}){
 const candidates=PROVIDERS.filter(c=>process.env[c.keyEnv]);
 if(!candidates.length)return {ok:false,error:'No configured API providers',attempts:[]};
 const controllers=candidates.map(()=>new AbortController());
 let settled=false;
 const attempts=[];
 return await new Promise(resolve=>{
   const timer=setTimeout(()=>{if(settled)return;settled=true;controllers.forEach(c=>c.abort());resolve({ok:false,error:'API race timed out',attempts})},timeoutMs);
   candidates.forEach((c,i)=>ask(c,prompt,maxTokens,controllers[i].signal).then(r=>{
     attempts.push({provider:c.provider,status:'success'});
     if(!settled){settled=true;clearTimeout(timer);controllers.forEach((x,j)=>j!==i&&x.abort());resolve({ok:true,...r,attempts});}
   }).catch(e=>attempts.push({provider:c.provider,status:'failed',error:clean(e?.message||e,300)})));
 });
}
export const KAI678_PROVIDERS=PROVIDERS.map(x=>x.provider);