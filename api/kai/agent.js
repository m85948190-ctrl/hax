import { browser } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const SYSTEM = `You are KAI, the execution agent inside HAxBRO ADMIN ULTIMAX.
You are an action-oriented authorized security-testing agent, not a roleplay chatbot. Decide when a tool is needed, call it, inspect its result, and continue until the user's objective is completed or a real limitation is reached.
For HAxBRO security work, actively discover and safely validate weaknesses in the authorized target. Use the security_probe tool for attack-surface testing: exposed files/routes, security headers, CORS, harmless input reflection, and other non-destructive checks. Use public_web and browser_visit_click for additional reconnaissance and evidence. Explain realistic ATTACK PATHS from confirmed evidence: entry point -> weakness -> what an attacker could reach -> consequence. You may describe safe proof steps and harmless request shapes, but never obtain credentials, bypass authentication or CAPTCHA, extract private data, persist access, change application state, delete data, or cause damage.
Return a concise report with MODE, ACTIONS, FINDINGS, EVIDENCE, ATTACK PATH, RISK, FIX, and VERIFY. Do not merely print tool logs. Findings must be based on tool evidence; distinguish confirmed findings from hypotheses.`;
const PROVIDERS=[
  {name:'OPENROUTER_API_KEY_1',type:'openrouter',model:'openrouter/auto',url:'https://openrouter.ai/api/v1/chat/completions'},
  {name:'OPENROUTER_API_KEY_2',type:'openrouter',model:'openrouter/auto',url:'https://openrouter.ai/api/v1/chat/completions'},
  {name:'OPENROUTER_API_KEY_3',type:'openrouter',model:'openrouter/auto',url:'https://openrouter.ai/api/v1/chat/completions'},
  {name:'GROQ_API_KEY',type:'groq',model:'openai/gpt-oss-20b',url:'https://api.groq.com/openai/v1/chat/completions'},
  {name:'GROQ_API_KEY_2',type:'groq',model:'openai/gpt-oss-20b',url:'https://api.groq.com/openai/v1/chat/completions'},
  {name:'GROQ_API_KEY_3',type:'groq',model:'openai/gpt-oss-20b',url:'https://api.groq.com/openai/v1/chat/completions'}
];
const TARGET_HOST='haxbro.hatchable.site';

function clean(v,max=12000){return String(v??'').replace(/\u0000/g,'').slice(0,max)}
function publicUrl(v){try{const u=new URL(String(v||'').trim());if(!/^https?:$/i.test(u.protocol))return '';const h=u.hostname.toLowerCase();if(h==='localhost'||h.endsWith('.localhost')||h==='0.0.0.0'||h==='::1'||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||h.endsWith('.local')||h.endsWith('.internal')||h.startsWith('169.254.'))return '';const m=h.match(/^172\.(\d{1,3})\./);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return '';return u.toString()}catch{return ''}}
function targetUrl(v){const u=publicUrl(v);if(!u)return '';try{return new URL(u).hostname.toLowerCase()===TARGET_HOST?u:''}catch{return ''}}
function textOnly(body){return clean(String(body||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '),7000)}
async function requestProbe(url,method='GET',headers={}){try{const r=await fetch(url,{method,headers,redirect:'manual'});const body=method==='HEAD'?'':await r.text();return{status:r.status,url:r.url||url,headers:Object.fromEntries(r.headers.entries()),text:textOnly(body),bodyLength:body.length}}catch(e){return{status:0,url,error:clean(e?.message||e,900)}}}

const toolFns={
  public_web:async({url})=>{const u=publicUrl(url);if(!u)return{ok:false,error:'Only public http(s) URLs are allowed.'};const r=await requestProbe(u);return{ok:r.status>=200&&r.status<500,...r}},
  browser_visit_click:async({url,clickText})=>{const u=publicUrl(url);if(!u)return{ok:false,error:'Only public http(s) URLs are allowed.'};try{return await browser.session(async page=>{await page.goto(u,{waitUntil:'domcontentloaded'});if(clickText){const clicked=await page.evaluate(wanted=>{const target=String(wanted).trim().toLowerCase();const nodes=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="submit"],input[type="button"]'));const el=nodes.find(n=>((n.innerText||n.textContent||n.value||'').trim().toLowerCase().includes(target)));if(!el)return false;el.click();return true},clickText);if(clicked)await new Promise(r=>setTimeout(r,700));if(!clicked)return{ok:false,url:await page.url(),title:await page.title(),error:`No clickable element matched: ${clickText}`}}const text=await page.$eval('body',el=>(el.innerText||el.textContent||'').trim().slice(0,9000)).catch(()=> '');return{ok:true,url:await page.url(),title:await page.title(),text}})}catch(e){return{ok:false,error:clean(e?.message||e,1200)}}},
  security_probe:async({url})=>{
    const base=targetUrl(url||`https://${TARGET_HOST}/`);if(!base)return{ok:false,error:`Security probe is locked to the authorized target https://${TARGET_HOST}.`};
    const origin=`https://${TARGET_HOST}`;const u=new URL(base);const paths=[u.pathname||'/','/robots.txt','/sitemap.xml','/.env','/.git/HEAD','/swagger.json','/openapi.json','/api','/api/status','/api/plugins','/admin','/login','/app/'];
    const checks=[];const findings=[];
    for(const p of [...new Set(paths)]){const full=origin+p;const r=await requestProbe(full);checks.push({path:p,status:r.status,length:r.bodyLength,location:r.headers?.location||''});
      if((p==='/.env'||p==='/.git/HEAD')&&r.status===200&&r.bodyLength>0)findings.push({severity:'HIGH',type:'sensitive-file-exposure',url:full,evidence:`HTTP ${r.status} with ${r.bodyLength} bytes`});
      if((p==='/swagger.json'||p==='/openapi.json')&&r.status===200)findings.push({severity:'MEDIUM',type:'api-definition-exposure',url:full,evidence:'HTTP 200'});
      if((p==='/api'||p==='/admin')&&r.status>=200&&r.status<300)findings.push({severity:'INFO',type:'reachable-surface',url:full,evidence:`HTTP ${r.status}`});
    }
    const home=await requestProbe(origin+'/');const headers=home.headers||{};const required=['content-security-policy','strict-transport-security','x-content-type-options','referrer-policy'];
    required.forEach(h=>{if(!headers[h])findings.push({severity:h==='content-security-policy'?'MEDIUM':'LOW',type:'missing-security-header',header:h,url:origin+'/',evidence:'Header not present'});});
    const cors=await requestProbe(origin+'/api/status','GET',{'Origin':'https://evil.example'});const allow=cors.headers?.['access-control-allow-origin']||'';if(allow==='*'||allow==='https://evil.example')findings.push({severity:'MEDIUM',type:'permissive-cors',url:origin+'/api/status',evidence:`Access-Control-Allow-Origin: ${allow}`});
    const canary='KAI_CANARY_7F3A9';const probeUrl=origin+(u.pathname||'/')+(u.search?'&':'?')+'kai_probe='+canary;const reflected=await requestProbe(probeUrl);const isReflected=reflected.text.includes(canary);if(isReflected)findings.push({severity:'MEDIUM',type:'reflected-input',url:probeUrl,evidence:'Harmless canary was reflected in the response'});
    return{ok:true,target:origin,checks,findings,home:{status:home.status,headers:Object.fromEntries(required.map(h=>[h,headers[h]||null]))},cors:{status:cors.status,allowOrigin:allow||null},canary:{reflected:isReflected},note:'Non-destructive validation only: no credentials, state changes, data extraction, persistence, or destructive payloads.'};
  }
};
const TOOL_DEFS=[
 {type:'function',function:{name:'public_web',description:'Fetch a public web URL and return HTTP status and compact text.',parameters:{type:'object',properties:{url:{type:'string'}},required:['url']}}},
 {type:'function',function:{name:'browser_visit_click',description:'Open a public URL in managed Chromium, optionally click a visible button/link by text, then return URL, title, and page text.',parameters:{type:'object',properties:{url:{type:'string'},clickText:{type:'string'}},required:['url']}}},
 {type:'function',function:{name:'security_probe',description:'Run an authorized, non-destructive attack-mode web security probe against HAxBRO. Checks exposed files/routes, security headers, CORS, and harmless reflected-input canary. Use this for real vulnerability validation, then explain the attack path and fix from the evidence.',parameters:{type:'object',properties:{url:{type:'string',description:'HAxBRO URL to probe; must be on haxbro.hatchable.site'}}}}}
];

async function verifyAdmin(req){
  const cookie=String(req.headers?.cookie||'').match(/(?:^|;\s*)haxbro_admin69=([^;]+)/);const auth=String(req.headers?.authorization||'').trim();const bearer=/^Bearer\s+(.+)$/i.exec(auth)?.[1]||'';const supplied=String(req.headers?.['x-haxbro-admin69']||req.body?.adminToken||bearer||(cookie?decodeURIComponent(cookie[1]):'')).trim();const secret=String(process.env.ADMIN69_PASSWORD||'');if(!supplied||!secret)return false;
  const parts=supplied.split('.');if(parts.length!==2)return false;const [issuedAt,sig]=parts;const ts=Number(issuedAt);const now=Math.floor(Date.now()/1000);if(!Number.isFinite(ts)||ts>now||now-ts>3600)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);const raw=sig.replace(/-/g,'+').replace(/_/g,'/');const bin=atob(raw+'='.repeat((4-raw.length%4)%4));const got=Uint8Array.from(bin,c=>c.charCodeAt(0));return crypto.subtle.verify('HMAC',key,got,new TextEncoder().encode(issuedAt));
}

async function runWithProvider(provider,key,objective){
  const messages=[{role:'system',content:SYSTEM},{role:'user',content:objective}];const trace=[];
  for(let step=0;step<8;step++){
    const r=await fetch(provider.url,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model:provider.model,messages,tools:provider.type==='openrouter'?TOOL_DEFS:TOOL_DEFS,tool_choice:'auto',max_tokens:1800,temperature:0.2})});
    const raw=await r.text();if(!r.ok)throw new Error(`OpenRouter HTTP ${r.status}: ${clean(raw,900)}`);const data=JSON.parse(raw);const msg=data?.choices?.[0]?.message;if(!msg)throw new Error('OpenRouter returned no assistant message');messages.push(msg);
    const calls=Array.isArray(msg.tool_calls)?msg.tool_calls:[];if(!calls.length)return{text:clean(msg.content||'Execution completed.'),steps:step+1,trace};
    for(const call of calls){const name=call?.function?.name;let args={};try{args=JSON.parse(call?.function?.arguments||'{}')}catch{args={}};const fn=toolFns[name];trace.push({type:'tool_start',tool:name,args:{url:args.url||'',clickText:args.clickText||''},at:Date.now()});const result=fn?await fn(args):{ok:false,error:`Unknown tool: ${name}`};trace.push({type:'tool_result',tool:name,ok:!!result?.ok,status:result?.status||null,url:result?.url||args.url||'',title:result?.title||'',error:result?.error||'',at:Date.now(),security:result?.findings||null});messages.push({role:'tool',tool_call_id:call.id,name,content:JSON.stringify(result).slice(0,14000)});}
  }
  try{const finalMessages=messages.concat([{role:'user',content:'Stop using tools. Produce the final ATTACK MODE security report from the evidence collected. Do not just repeat logs. Include confirmed findings, exact affected URLs/routes, realistic attack path, risk, fix, and verification steps. Clearly label hypotheses.'}]);const r=await fetch(provider.url,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model:provider.model,messages:finalMessages,tool_choice:'none',max_tokens:2200,temperature:0.2})});const raw=await r.text();if(!r.ok)throw new Error(`OpenRouter HTTP ${r.status}: ${clean(raw,900)}`);const data=JSON.parse(raw);const text=data?.choices?.[0]?.message?.content;if(text)return{text:clean(text),steps:8,trace};}catch(e){trace.push({type:'final_synthesis_error',error:clean(e?.message||e,900),at:Date.now()})}
  return{text:'KAI completed the available security checks. Use the evidence and findings returned in this report.',steps:8,trace};
}

export default async function(req,res){
  if(!(await verifyAdmin(req)))return res.status(401).json({ok:false,error:'Admin Ultimax authentication required.'});
  const objective=clean(req.body?.objective||req.body?.message||req.body?.prompt,12000).trim();if(!objective)return res.status(400).json({ok:false,error:'objective required'});
  const attempts=[];for(const provider of PROVIDERS){const key=String(process.env[provider.name]||'');if(!key){attempts.push({provider:provider.name,status:'missing'});continue}const t=Date.now();try{const result=await runWithProvider(provider,key,objective);attempts.push({provider:provider.name,status:'success',elapsedMs:Date.now()-t});return res.json({ok:true,agent:'KAI',mode:'ADMIN ULTIMAX · ATTACK MODE',text:result.text,tooling:Object.keys(toolFns),steps:result.steps,provider:provider.name,model:provider.model,attempts,trace:result.trace||[]})}catch(e){attempts.push({provider:provider.name,status:'failed',elapsedMs:Date.now()-t,error:clean(e?.message||e,900)})}}
  return res.status(502).json({ok:false,agent:'KAI',error:`All KAI provider keys failed. ${attempts.map(a=>`${a.provider}: ${a.error||a.status}`).join(' | ')}`,tooling:Object.keys(toolFns),attempts});
}