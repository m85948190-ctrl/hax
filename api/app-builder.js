import { complete } from 'lib/core';
import { browser } from 'hatchable';

export const access='public';
export const methods=['POST'];

const safe=(s,n=12000)=>String(s??'').replace(/\u0000/g,'').slice(0,n);
const cleanName=s=>String(s||'').replace(/[<>"'`]/g,'').replace(/\s+/g,' ').trim().slice(0,70);
const json=text=>{try{const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');return JSON.parse(raw)}catch{return null}};
function requestedName(s){
  const q=String(s||'');
  const rs=[/\b(?:called|named|name it|call it)\s+["']?([^"'\n,.!?]{1,60})["']?/i,/\b(?:make|build|create)\s+(?:me\s+)?(?:an?\s+)?(?:ai|app|application|website|site|game|assistant|agent|bot)\s+(?:called|named)\s+["']?([^"'\n,.!?]{1,60})/i];
  for(const r of rs){const m=q.match(r);if(m?.[1])return cleanName(m[1])}return '';
}
const gameLike=s=>/\b(game|arcade|runner|platformer|puzzle|quiz|snake|pong|tetris|shooter)\b/i.test(s);
const aiLike=s=>/\b(ai|assistant|chatbot|agent|copilot|llm|artificial intelligence)\b/i.test(s);
const calcLike=s=>/\b(calculator|calculate|calc)\b/i.test(s);
const weatherLike=s=>/\b(weather|forecast|temperature|rain|humidity|climate)\b/i.test(s);

function identityLayer(result,identity){
  if(!result)return result;
  const name=cleanName(identity)||cleanName(result.name)||'KAI Product';
  const bad=[/Hacks Bro AI/gi,/HAxBRO AI/gi,/HAxBRO App/gi,/HAxBRO Starter App/gi,/HAxBRO Game/gi,/HAxBRO Calculator/gi,/HAxBRO Weather/gi];
  const files=(result.files||[]).map(f=>{let c=String(f.content||'');for(const r of bad)c=c.replace(r,name);return {...f,content:c}});
  return {...result,name,files};
}

async function research(prompt){
  if(!/\b(research|search|latest|current|competitor|integration|api|library|framework|reference|trend)\b/i.test(prompt))return null;
  try{
    const html=String(await browser.html('https://www.bing.com/search?q='+encodeURIComponent(String(prompt).slice(0,220)))||'');
    const text=html.replace(/<script.*?<\/script>/gis,' ').replace(/<style.*?<\/style>/gis,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    return {engine:'public search',query:String(prompt).slice(0,220),evidence:text.slice(0,7000)};
  }catch{return {engine:'public search',query:String(prompt).slice(0,220),evidence:''};}
}

function emergency(prompt){
  const title=cleanName(requestedName(prompt))||'KAI Product';
  if(calcLike(prompt))return {name:title,summary:'Working calculator fallback.',files:[
    {path:'index.html',content:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="style.css"><main><h1>${title}</h1><input id="d" placeholder="12*8"><button id="go">CALCULATE</button><output id="o">0</output></main><script src="app.js"></script>`},
    {path:'style.css',content:`body{margin:0;min-height:100vh;display:grid;place-items:center;background:#030b14;color:#eaf8ff;font:16px system-ui}main{width:min(430px,90vw);padding:28px;border:1px solid #49c9ff55;border-radius:26px;background:linear-gradient(145deg,#0d2236,#07111c);box-shadow:0 30px 100px #0008}input,button{width:100%;box-sizing:border-box;padding:15px;border-radius:14px;margin-top:12px}input{background:#081827;color:white;border:1px solid #4bcfff55}button{background:#1b9ddd;color:white;border:0;font-weight:800}output{display:block;font-size:42px;margin-top:24px;color:#79ddff}`},
    {path:'app.js',content:`const d=document.querySelector('#d'),o=document.querySelector('#o');document.querySelector('#go').onclick=()=>{try{o.textContent=String(Function('return ('+d.value.replace(/[^0-9+*/%.() -]/g,'')+')')())}catch{o.textContent='Invalid'}}`}
  ]};
  return {name:title,summary:'Emergency working starter generated because the multi-stage AI compiler was unavailable.',files:[{path:'index.html',content:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="style.css"><main><div class="badge">KAI 2.0</div><h1>${title}</h1><p id="out">Your working app is ready.</p><button id="go">RUN</button></main><script src="app.js"></script>`},{path:'style.css',content:`body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 30% 10%,#103c5a,#02060b 70%);color:#effaff;font:16px system-ui}main{width:min(720px,90vw);padding:42px;border:1px solid #54d8ff44;border-radius:30px;background:#071522cc;box-shadow:0 40px 120px #0008}.badge{color:#6fe4ff;letter-spacing:.18em;font-size:11px}h1{font-size:clamp(38px,7vw,76px);margin:14px 0}button{padding:14px 22px;border:0;border-radius:14px;background:linear-gradient(135deg,#2a8dff,#12c7e7);color:#fff;font-weight:800}`},{path:'app.js',content:`document.querySelector('#go').onclick=()=>document.querySelector('#out').textContent='Running ✓'`}]};
}

async function kai1(prompt,identity,existing,researchData,kai12Context){
  const r=await complete({username:'app-maker',maxTokens:1800,system:`You are KAI 1.0, the intelligence/architect inside HAxBRO App Maker. You decide WHAT should be built before any code is written. Extract the user's real goal, product type, audience, screens, interaction loops, states, data/logic, responsive behavior, visual direction and acceptance tests. Be decisive: infer sensible missing details. A game must have a real gameplay loop. An AI app must actually converse. A modification must preserve unrelated behavior. KAI 12.0 may have spent many messages learning the user's intent; treat that conversation and its build brief as high-value product requirements, not disposable chat. Resolve contradictions by preferring the newest explicit user instruction while preserving unrelated working behavior. Return ONLY JSON with productName,productType,goal,audience,screens,interactions,states,dataAndLogic,visualDirection,responsiveRules,acceptanceTests,constraints.`,prompt:`USER REQUEST:\n${prompt}\nREQUESTED NAME:\n${identity||'(infer)'}\nEXISTING PRODUCT:\n${existing||'(new)'}\nKAI 12.0 CONTINUOUS-BUILD CONTEXT:\n${kai12Context||'(none)'}\nPUBLIC RESEARCH:\n${JSON.stringify(researchData||{})}`});
  return json(r.text)||{productName:identity||'KAI Product',productType:gameLike(prompt)?'game':aiLike(prompt)?'AI app':'application',goal:prompt,audience:'end user',screens:['main experience'],interactions:['primary flow'],states:['loading','error','success'],dataAndLogic:['working client logic'],visualDirection:'premium futuristic dark interface',responsiveRules:['desktop and mobile'],acceptanceTests:['main flow works end to end'],constraints:['no owner secrets']};
}

async function kai3(prompt,plan,existing,researchData,kai12Context){
  const r=await complete({username:'app-maker',maxTokens:5600,system:`You are KAI 3.0, the UI selector/generator inside HAxBRO. KAI 1.0 already decided WHAT the product is. You decide HOW it looks, which UI patterns/components fit it, and implement the complete interface. You are a senior product designer + frontend engineer. Build real HTML/CSS/JS, not a concept or text explanation. The first viewport must be premium, dimensional and purposeful. Every primary control must work. Include loading/error/success states where relevant, responsive mobile controls, keyboard support where relevant, and intentional motion. Use stable IDs/classes. VISUAL QUALITY GATE: never ship terminal-green, plain monospace, browser-default, bare-canvas, raw-card, white-dashboard, or placeholder aesthetics. Choose a deliberate visual system with hierarchy, typography, spacing, atmospheric depth, polished surfaces, focused primary actions, responsive states, and meaningful motion. For games, build a polished game shell around the gameplay: title/start state, HUD, status feedback, pause/restart, touch controls, effects, progression and clear win/lose states; never a few colored rectangles on a blank canvas. For AI apps, build a real chat product with message hierarchy, composer states, thinking/streaming feedback, conversation history behavior, empty state and mobile layout. Never use HAxBRO private APIs, /api/chat, lib/core, process.env, owner secrets or owner-only routes. AI apps must use a public/free no-key endpoint when feasible plus a local fallback. Games must be playable for multiple minutes. When modifying an existing product, edit the existing product rather than throwing it away; preserve working features and improve only what the continuous-build brief asks for. Return ONLY JSON in the shape {name,summary,files:[{path,content}]}.`,prompt:`KAI 1.0 CONTRACT:\n${JSON.stringify(plan)}\nORIGINAL USER REQUEST:\n${prompt}\nKAI 12.0 CONTINUOUS-BUILD CONTEXT:\n${kai12Context||'(none)'}\nEXISTING PRODUCT:\n${existing||'(new)'}\nRESEARCH:\n${JSON.stringify(researchData||{})}`});
  return json(r.text);
}

async function kai2(prompt,plan,ui,existing,kai12Context){
  const r=await complete({username:'app-maker',maxTokens:6200,system:`You are KAI 2.0, the compiler and delivery brain. KAI 1.0 created the product contract and KAI 3.0 created the UI/code. Compile them into one production-quality working browser app. Do not simplify it into a text page. Repair broken HTML/CSS/JS, selectors, event handlers, responsive controls and state transitions. Enforce every acceptance test. Perform a final visual and interaction audit before returning code. If UI is weak, improve it while preserving product intent. Reject terminal-green, bare-canvas, browser-default, static-card or placeholder presentation and upgrade it to a cohesive premium interface. Games must have real gameplay, collisions/rules, scoring, progression, pause/restart, touch controls and a polished HUD/game shell. AI apps must really answer users using public/free no-key access when feasible and local fallback. Never ship HAxBRO private keys, /api/chat, lib/core, process.env secrets or owner routes. For a continuous build, treat the existing product and KAI 12.0 conversation as the source of truth for edits: fix, extend, refactor or redesign the requested parts without deleting unrelated working functionality. Return ONLY JSON {name,summary,files:[{path,content}]}.`,prompt:`PRODUCT CONTRACT:\n${JSON.stringify(plan)}\nKAI 3.0 CODE:\n${JSON.stringify(ui||{})}\nUSER REQUEST:\n${prompt}\nKAI 12.0 CONTINUOUS-BUILD CONTEXT:\n${kai12Context||'(none)'}\nEXISTING PRODUCT:\n${existing||'(new)'}`});
  return json(r.text);
}

export default async function(req,res){
  const prompt=safe(req.body?.prompt);if(!prompt)return res.status(400).json({error:'Tell KAI what app to build.'});
  const identity=requestedName(prompt)||cleanName(req.body?.appName);
  const existing=req.body?.existingProduct?.files?JSON.stringify(req.body.existingProduct).slice(0,60000):'';
  const kai12=req.body?.kai12Context?safe(JSON.stringify(req.body.kai12Context),60000):'';
  const researchData=await research(prompt);
  try{
    const plan=await kai1(prompt,identity,existing,researchData,kai12);
    const ui=await kai3(prompt,plan,existing,researchData,kai12);
    const compiled=ui?.files?.length?await kai2(prompt,plan,ui,existing,kai12):null;
    const result=identityLayer(compiled?.files?.length?compiled:ui?.files?.length?ui:emergency(prompt),identity);
    result.kai={version:'2.0',pipeline:['KAI 1.0 · intent + architecture','KAI 3.0 · UI selector + implementation','KAI 2.0 · compile + repair + acceptance test'],architecture:plan,researched:Boolean(researchData),ownerSecretsExcluded:true};
    return res.json(result);
  }catch(e){
    console.error('KAI pipeline failed',e);
    const result=identityLayer(emergency(prompt),identity);result.kai={version:'2.0',pipeline:['KAI 1.0','KAI 3.0','KAI 2.0'],fallback:true,ownerSecretsExcluded:true};return res.json(result);
  }
}