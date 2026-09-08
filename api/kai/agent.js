import { browser } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const SYSTEM = `You are KAI, the execution agent inside HAxBRO ADMIN ULTIMAX.
You are an action-oriented agent, not a roleplay chatbot. Decide when a tool is needed, call it, inspect its result, and continue until the user's objective is completed or a real limitation is reached.
You may research public web pages, browse public URLs, extract page text, and perform non-destructive browser interactions such as clicking and typing into public forms. For security work, keep actions scoped to systems the operator owns or is explicitly authorized to test. Your security role is vulnerability discovery and safe validation: actively look for weaknesses in the authorized target's public attack surface, including exposed implementation details, undocumented routes, insecure client-side logic, missing or weak authorization checks, and other plausible security flaws. When a suspected weakness can be validated safely without obtaining unauthorized data, taking over accounts, bypassing CAPTCHA or access controls, changing state, deleting data, persisting access, or causing damage, perform that validation and record the evidence. Do not turn a finding into destructive or invasive exploitation. Never claim a vulnerability or action is real unless you have evidence from a tool result.
Return a concise security execution report with ACTIONS, FINDINGS, EVIDENCE, ATTACK PATH, RISK, and SAFE NEXT STEPS; include LIMITATIONS when applicable. For each confirmed or strongly supported weakness, ATTACK PATH should explain in plain language how a malicious user could reach or abuse the weakness, identify the relevant URL/route/component, and state the likely consequence. Give safe, bounded proof steps or example request shape when needed to demonstrate the flaw, but do not provide instructions that enable destructive exploitation, credential theft, persistence, account takeover, or unauthorized data access.`;
const KEYS=['OPENROUTER_API_KEY_1','OPENROUTER_API_KEY_2','OPENROUTER_API_KEY_3'];
const MODEL='openrouter/auto';

function clean(v,max=12000){return String(v??'').replace(/\u0000/g,'').slice(0,max)}
function publicUrl(v){try{const u=new URL(String(v||'').trim());if(!/^https?:$/i.test(u.protocol))return '';const h=u.hostname.toLowerCase();if(h==='localhost'||h.endsWith('.localhost')||h==='0.0.0.0'||h==='::1'||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||h.endsWith('.local')||h.endsWith('.internal')||h.startsWith('169.254.'))return '';const m=h.match(/^172\.(\d{1,3})\./);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return '';return u.toString()}catch{return ''}}

const toolFns={
  public_web:async({url})=>{const u=publicUrl(url);if(!u)return{ok:false,error:'Only public http(s) URLs are allowed.'};try{const r=await fetch(u,{method:'GET',redirect:'follow'});const body=await r.text();return{ok:true,status:r.status,url:r.url||u,text:clean(body.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '),9000)}}catch(e){return{ok:false,error:clean(e?.message||e,1000)}}},
  browser_visit_click:async({url,clickText})=>{const u=publicUrl(url);if(!u)return{ok:false,error:'Only public http(s) URLs are allowed.'};try{return await browser.session(async page=>{await page.goto(u,{waitUntil:'domcontentloaded'});if(clickText){const clicked=await page.evaluate(wanted=>{const target=String(wanted).trim().toLowerCase();const nodes=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="submit"],input[type="button"]'));const el=nodes.find(n=>((n.innerText||n.textContent||n.value||'').trim().toLowerCase().includes(target)));if(!el)return false;el.click();return true},clickText);if(clicked)await new Promise(r=>setTimeout(r,700));if(!clicked)return{ok:false,url:await page.url(),title:await page.title(),error:`No clickable element matched: ${clickText}`}}const text=await page.$eval('body',el=>(el.innerText||el.textContent||'').trim().slice(0,9000)).catch(()=> '');return{ok:true,url:await page.url(),title:await page.title(),text}})}catch(e){return{ok:false,error:clean(e?.message||e,1200)}}}
};
const TOOL_DEFS=[
 {type:'function',function:{name:'public_web',description:'Fetch a public web URL and return HTTP status and compact text.',parameters:{type:'object',properties:{url:{type:'string'}},required:['url']}}},
 {type:'function',function:{name:'browser_visit_click',description:'Open a public URL in managed Chromium, optionally click a visible button/link by text, then return URL, title, and page text.',parameters:{type:'object',properties:{url:{type:'string'},clickText:{type:'string'}},required:['url']}}}
];

async function verifyAdmin(req){
  const cookie=String(req.headers?.cookie||'').match(/(?:^|;\s*)haxbro_admin69=([^;]+)/);
  const auth=String(req.headers?.authorization||'').trim();
  const bearer=/^Bearer\s+(.+)$/i.exec(auth)?.[1]||'';
  const supplied=String(req.headers?.['x-haxbro-admin69']||req.body?.adminToken||bearer|| (cookie?decodeURIComponent(cookie[1]):'')).trim();
  const secret=String(process.env.ADMIN69_PASSWORD||'');if(!supplied||!secret)return false;
  const parts=supplied.split('.');if(parts.length!==2)return false;const [issuedAt,sig]=parts;const ts=Number(issuedAt);const now=Math.floor(Date.now()/1000);if(!Number.isFinite(ts)||ts>now||now-ts>3600)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const raw=sig.replace(/-/g,'+').replace(/_/g,'/');const bin=atob(raw+'='.repeat((4-raw.length%4)%4));const got=Uint8Array.from(bin,c=>c.charCodeAt(0));return crypto.subtle.verify('HMAC',key,got,new TextEncoder().encode(issuedAt));
}

async function runWithKey(key,objective){
  const messages=[{role:'system',content:SYSTEM},{role:'user',content:objective}];
  const trace=[];
  for(let step=0;step<8;step++){
    const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model:MODEL,messages,tools:TOOL_DEFS,tool_choice:'auto',max_tokens:1800,temperature:0.2})});
    const raw=await r.text();if(!r.ok)throw new Error(`OpenRouter HTTP ${r.status}: ${clean(raw,900)}`);
    const data=JSON.parse(raw);const msg=data?.choices?.[0]?.message;if(!msg)throw new Error('OpenRouter returned no assistant message');
    messages.push(msg);
    const calls=Array.isArray(msg.tool_calls)?msg.tool_calls:[];
    if(!calls.length)return{text:clean(msg.content||'Execution completed.'),steps:step+1,trace};
    for(const call of calls){
      const name=call?.function?.name;let args={};try{args=JSON.parse(call?.function?.arguments||'{}')}catch{args={}};
      const fn=toolFns[name];
      trace.push({type:'tool_start',tool:name,args:{url:args.url||'',clickText:args.clickText||''},at:Date.now()});
      const result=fn?await fn(args):{ok:false,error:`Unknown tool: ${name}`};
      trace.push({type:'tool_result',tool:name,ok:!!result?.ok,status:result?.status||null,url:result?.url||args.url||'',title:result?.title||'',error:result?.error||'',at:Date.now()});
      messages.push({role:'tool',tool_call_id:call.id,name,content:JSON.stringify(result).slice(0,12000)});
    }
  }
  // If the model keeps selecting tools until the execution budget is exhausted,
  // force one final synthesis turn with tools disabled. The user should never see
  // the internal step-limit message when we already have usable tool results.
  try {
    const finalMessages = messages.concat([{role:'user',content:'Now stop using tools and produce the final execution report from the evidence collected above. Be concise. Include ACTIONS, RESULTS, and LIMITATIONS if relevant.'}]);
    const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model:MODEL,messages:finalMessages,tool_choice:'none',max_tokens:1800,temperature:0.2})});
    const raw=await r.text();if(!r.ok)throw new Error(`OpenRouter HTTP ${r.status}: ${clean(raw,900)}`);
    const data=JSON.parse(raw);const text=data?.choices?.[0]?.message?.content;
    if(text)return{text:clean(text),steps:8,trace};
  }catch(e){trace.push({type:'final_synthesis_error',error:clean(e?.message||e,900),at:Date.now()})}
  return{text:'KAI completed the available execution steps. See the recorded actions/results above.',steps:8,trace};
}

export default async function(req,res){
  if(!(await verifyAdmin(req)))return res.status(401).json({ok:false,error:'Admin Ultimax authentication required.'});
  const objective=clean(req.body?.objective||req.body?.message||req.body?.prompt,12000).trim();if(!objective)return res.status(400).json({ok:false,error:'objective required'});
  const attempts=[];
  for(const envName of KEYS){const key=String(process.env[envName]||'');if(!key){attempts.push({provider:envName,status:'missing'});continue}const t=Date.now();try{const result=await runWithKey(key,objective);attempts.push({provider:envName,status:'success',elapsedMs:Date.now()-t});return res.json({ok:true,agent:'KAI',mode:'ADMIN ULTIMAX',text:result.text,tooling:Object.keys(toolFns),steps:result.steps,provider:envName,model:MODEL,attempts,trace:result.trace||[]})}catch(e){attempts.push({provider:envName,status:'failed',elapsedMs:Date.now()-t,error:clean(e?.message||e,900)})}}
  return res.status(502).json({ok:false,agent:'KAI',error:`All OpenRouter KAI keys failed. ${attempts.map(a=>`${a.provider}: ${a.error||a.status}`).join(' | ')}`,tooling:Object.keys(toolFns),attempts});
}