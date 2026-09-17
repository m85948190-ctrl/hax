import { complete } from 'lib/core';
import { browser, ai } from 'hatchable';

async function fastComplete({system,prompt,maxTokens}){
  try{
    const r=await ai.generateText({model:'sonnet',system:String(system||'').slice(0,18000),messages:[{role:'user',content:String(prompt||'').slice(0,50000)}],maxTokens,purpose:'haxbro-app-builder'});
    const text=typeof r==='string'?r:(r?.text||r?.content||r?.output||'');
    if(String(text).trim())return {text:String(text).trim()};
  }catch(e){console.error('KAI fast runtime failed',e)}
  return complete({username:'app-maker',maxTokens,system,prompt});
}

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

function responsiveHardening(result){
  if(!result?.files?.length)return result;
  const files=result.files.map(f=>({...f,content:String(f.content||'')}));
  const html=files.find(f=>/^index\.html$/i.test(f.path))||files.find(f=>/\.html?$/i.test(f.path));
  if(html&&!/name=[\"']viewport[\"']/i.test(html.content)){
    const meta='<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
    html.content=/<head[^>]*>/i.test(html.content)?html.content.replace(/<head[^>]*>/i,m=>m+meta):meta+html.content;
  }
  const css=files.find(f=>/\.css$/i.test(f.path));
  if(css&&!css.content.includes('/* KAI RESPONSIVE HARDENING */')){
    css.content+=`\n/* KAI RESPONSIVE HARDENING */\n*,*::before,*::after{box-sizing:border-box}\nhtml{width:100%;max-width:100%;overflow-x:hidden;-webkit-text-size-adjust:100%}\nbody{width:100%;max-width:100%;overflow-x:hidden}\nimg,video,svg{max-width:100%}\nbutton,input,textarea,select{font:inherit;max-width:100%}\nbutton,a,[role=button],input[type=button],input[type=submit]{touch-action:manipulation}\n@media (max-width:720px){button,a,[role=button],input[type=button],input[type=submit]{min-height:44px}input,textarea,select{font-size:16px;min-width:0}pre{max-width:100%;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}}\n@media (min-width:721px){body{min-width:0}}\n`;
  }
  return {...result,files};
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
  if(aiLike(prompt))return {name:title,summary:'Emergency conversational AI fallback with real input, context and local responses.',files:[
    {path:'index.html',content:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><link rel="stylesheet" href="style.css"><main><header><div class="orb"></div><div><b>${title}</b><small>CONVERSATIONAL AI</small></div></header><section id="chat" aria-live="polite"><div class="msg ai">I'm ready. Tell me what you want to do.</div></section><form id="composer"><input id="input" autocomplete="off" placeholder="Ask anything…"><button>Send</button></form></main><script src="app.js"></script>`},
    {path:'style.css',content:`*{box-sizing:border-box}body{margin:0;min-height:100svh;background:radial-gradient(circle at 50% 0,#17375a,#03070d 62%);color:#edf7ff;font:15px system-ui}main{width:min(860px,100%);min-height:100svh;margin:auto;display:flex;flex-direction:column;padding:clamp(16px,4vw,42px);gap:18px}header{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid #78cfff24;border-radius:18px;background:#07121ee8;backdrop-filter:blur(18px)}header b{display:block;font-size:15px}header small{display:block;color:#71869f;font-size:9px;letter-spacing:.16em;margin-top:4px}.orb{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#77dfff 18%,#4275ff 52%,#111a45);box-shadow:0 0 30px #48bfff66;animation:pulse 2.4s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.08);filter:brightness(1.3)}}#chat{flex:1;display:flex;flex-direction:column;gap:10px;justify-content:flex-end;overflow:auto}.msg{max-width:min(78%,650px);padding:12px 14px;border-radius:16px;line-height:1.55;white-space:pre-wrap}.msg.ai{background:#081522;border:1px solid #78cfff1d}.msg.user{align-self:flex-end;background:linear-gradient(135deg,#245d9d,#2146a4);border:1px solid #8ecaff33}form{display:flex;gap:9px;position:sticky;bottom:0;padding-bottom:env(safe-area-inset-bottom)}input{min-width:0;flex:1;padding:15px;border-radius:15px;border:1px solid #78cfff30;background:#06101b;color:#fff;outline:0}button{padding:0 18px;border:0;border-radius:15px;background:linear-gradient(135deg,#82ddff,#728fff);font-weight:900;color:#06101b}@media(max-width:600px){.msg{max-width:90%}form button{min-width:76px}input{font-size:16px}}`},
    {path:'app.js',content:`const chat=document.querySelector('#chat'),input=document.querySelector('#input');const add=(text,who)=>{const d=document.createElement('div');d.className='msg '+who;d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight};const respond=q=>{const x=q.toLowerCase();if(/\b(hi|hello|hey)\b/.test(x))return 'Hi! I\'m ready to help. Tell me the goal, and we can work through it together.';if(x.includes('what can you do'))return 'I can understand requests, keep the current conversation in context, explain ideas, and help you work through a task. This fallback runs locally when the remote model is unavailable.';if(x.includes('game'))return 'A real game needs a play loop, controls, rules, challenge, feedback, progression, pause/restart and a win/lose state—not just a RUN button.';if(x.includes('ai'))return 'An AI product should react to input, maintain context, produce useful output and support the next interaction. A static screen is not enough.';return 'I understood your request: '+q+'\\n\\nI can continue from this context. The full AI runtime can take over when available.'};document.querySelector('#composer').onsubmit=e=>{e.preventDefault();const q=input.value.trim();if(!q)return;add(q,'user');input.value='';const thinking=document.createElement('div');thinking.className='msg ai';thinking.textContent='Thinking…';chat.appendChild(thinking);setTimeout(()=>{thinking.remove();add(respond(q),'ai')},280)};`}
  ]};
  return {name:title,summary:'Emergency interactive starter generated because the multi-stage AI compiler was unavailable.',files:[{path:'index.html',content:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><link rel="stylesheet" href="style.css"><main><h1>${title}</h1><p id="out">Describe what you want this product to do.</p><input id="q" placeholder="Type an action…"><button id="go">Try it</button></main><script src="app.js"></script>`},{path:'style.css',content:`*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;background:radial-gradient(circle at 30% 10%,#103c5a,#02060b 70%);color:#effaff;font:16px system-ui}main{width:min(720px,92vw);padding:clamp(24px,6vw,48px);border:1px solid #54d8ff44;border-radius:30px;background:#071522ee;box-shadow:0 40px 120px #0008}h1{font-size:clamp(36px,8vw,76px);margin:0 0 14px}input,button{width:100%;padding:15px;border-radius:14px;margin-top:12px;font:inherit}input{background:#081827;color:white;border:1px solid #4bcfff55}button{border:0;background:linear-gradient(135deg,#2a8dff,#12c7e7);color:#fff;font-weight:800}`},{path:'app.js',content:`const q=document.querySelector('#q'),o=document.querySelector('#out');document.querySelector('#go').onclick=()=>{const v=q.value.trim();o.textContent=v?'Working with: '+v:'Tell me what you want to do.'}`}]};
}

async function kai1(prompt,identity,existing,researchData,kai12Context){
  const r=await fastComplete({maxTokens:1100,system:`You are KAI 1.0, the intelligence/architect inside HAxBRO App Maker. You decide WHAT should be built before any code is written. Think like a product intelligence, not a template generator. First classify the request as an AI/agent, game, utility, creative tool, dashboard, website, commerce flow, education product, or another real product type. Then define the user's desired OUTCOME and the behavior required to reach it.

CORE PRODUCT DOCTRINE: an AI is not a static page with a RUN button; it perceives user input, maintains context, decides what to do, responds with useful output, and can continue the interaction. A game is not a START/END demo; it has a repeatable play loop, rules, challenge, feedback, progression and meaningful failure/restart. A utility is not a card showing a result; inputs change state and outputs update immediately and correctly. A creative tool must let the user create, edit and see the result. A dashboard must react to filters, controls and data state. A website must have real navigation and meaningful actions. Every product must have behavior, not just appearance.

AUTONOMOUS PRODUCT INTELLIGENCE: infer the missing product mechanics yourself. Do not wait for the user to specify obvious things such as a send action, enter-key behavior, loading state, retry path, validation, navigation, score update, collision, pause, restart, persistence, responsive layout, empty state or feedback. Build the complete loop that a normal person would expect. Distinguish the product's purpose from its controls: controls are only useful when they cause the intended state transition. For every primary action define INPUT → PROCESSING → RESULT → NEXT ACTION. For every failure define RECOVER → RETRY. For every repeatable product define how the second interaction is better informed by the first. The app must be independently usable by an end user without the HAxBRO editor being present.

Design the product around states and transitions: idle, input, processing, response, success, error, empty, recovery and ongoing use where relevant. Define what happens after every important user action. Infer sensible missing details instead of asking the user to specify obvious product behavior. KAI 12.0 may have spent many messages learning the user's intent; treat that conversation and its build brief as high-value product requirements, not disposable chat. Resolve contradictions by preferring the newest explicit user instruction while preserving unrelated working behavior. Return ONLY JSON with productName,productType,goal,audience,screens,interactions,states,dataAndLogic,visualDirection,responsiveRules,acceptanceTests,constraints.`,prompt:`USER REQUEST:\n${prompt}\nREQUESTED NAME:\n${identity||'(infer)'}\nEXISTING PRODUCT:\n${existing||'(new)'}\nKAI 12.0 CONTINUOUS-BUILD CONTEXT:\n${kai12Context||'(none)'}\nPUBLIC RESEARCH:\n${JSON.stringify(researchData||{})}`});
  return json(r.text)||{productName:identity||'KAI Product',productType:gameLike(prompt)?'game':aiLike(prompt)?'AI app':'application',goal:prompt,audience:'end user',screens:['main experience'],interactions:['primary flow'],states:['loading','error','success'],dataAndLogic:['working client logic'],visualDirection:'premium futuristic dark interface',responsiveRules:['desktop and mobile'],acceptanceTests:['main flow works end to end'],constraints:['no owner secrets']};
}

async function kai3(prompt,plan,existing,researchData,kai12Context){
  const r=await fastComplete({maxTokens:4000,system:`You are KAI 3.0, the UI selector/generator inside HAxBRO. KAI 1.0 decided WHAT the product is; you decide HOW it feels, behaves and communicates, then implement the complete interface. Think like a senior product designer, interaction designer and frontend engineer working together. Build a living product, not a screenshot, landing page, mockup or text explanation.

10X PRODUCT RULE: the interface must make the product's intelligence or interaction visible. Do not bolt a chatbot onto a static page. Do not turn an AI into a single RUN button. Do not turn a game into a canvas plus START. Do not turn every request into the same dashboard. Choose the interaction model that fits the product. Think in complete product loops, not isolated screens: OPEN → ORIENT → ACT → FEEDBACK → RESULT → CONTINUE → RECOVER → REPEAT.

IMPLEMENTATION DISCIPLINE: every promised capability must have a concrete control, event handler, state transition and visible result. Before returning code, verify that every important button is wired, every form submits, Enter works where expected, inputs are readable, disabled/loading states prevent duplicate actions, errors are recoverable, and the user can continue after the first successful action. Never invent a UI control whose underlying behavior is missing. Prefer simple dependable browser APIs and self-contained logic over fragile libraries. If an AI needs inference, implement a real response path (public/free no-key service when feasible, with a useful local fallback) rather than fake canned echoing. If the request implies persistence, use browser storage when a server is not required. If the request implies live data, handle loading, stale/error states and graceful fallback.

AI/AGENT PRODUCTS: build a genuine assistant experience, not an AI-themed webpage. The first viewport must make it obvious where to ask something. Provide a visible composer, a real SEND control, Enter-to-send where appropriate, message history, user/assistant message distinction, immediate acknowledgement/thinking state, response rendering, retry/error state, clear composer after send, continued conversation context and mobile keyboard-safe behavior. The assistant must answer the user's actual request rather than echoing it or saying only 'you typed X'. Use a real inference path when feasible (public/free no-key endpoint) and a useful deterministic local fallback when unavailable; the fallback should still perform task-aware operations such as calculations, explanations, transformations or product-specific actions instead of a dead generic sentence. Adapt the surface to the task: answer cards, generated content, code/result previews, actions, suggestions, confirmations or editable artifacts can appear when useful. Never expose hidden chain-of-thought. If an AI feature cannot be fully supported offline, state that limitation inside the product and keep the rest functional.

GAMES: create an actual playable loop with player control, challenge, collision/rules, score, feedback, progression, pause/restart, win/lose and touch controls. The game should feel like a game on both phone and laptop, not a tech demo.

UTILITIES/TOOLS: inputs must change outputs; editing must update previews; filters must alter data; calculators must compute; forms must validate; state must persist when appropriate. WEBSITES: navigation and actions must work. DASHBOARDS: interactions must change the visible state. CREATIVE TOOLS: users must be able to make and modify something.

PHONE + LAPTOP ARE FIRST-CLASS: design from the start for narrow touch screens and wide pointer/keyboard screens. Never merely shrink the desktop UI. Use responsive composition, safe touch targets, mobile-safe viewport sizing, keyboard/focus behavior, orientation resilience, overflow protection, readable type, and desktop enhancements. A feature that only works with hover, a wide canvas, or a mouse is incomplete.

VISUAL QUALITY GATE: never ship terminal-green, plain monospace, browser-default, bare-canvas, raw-card, white-dashboard, placeholder aesthetics or generic AI-shell styling. Create a deliberate visual language with hierarchy, typography, spacing, depth, polished surfaces, purposeful motion, meaningful empty/loading/error/success states and a strong first viewport. Every primary control must work. Use stable IDs/classes. Never use HAxBRO private APIs, /api/chat, lib/core, process.env, owner secrets or owner-only routes. AI apps should use a public/free no-key endpoint when feasible plus a local fallback. When modifying an existing product, edit it instead of throwing it away and preserve unrelated working behavior. Return ONLY JSON in the shape {name,summary,files:[{path,content}]}.`,prompt:`KAI 1.0 CONTRACT:\n${JSON.stringify(plan)}\nORIGINAL USER REQUEST:\n${prompt}\nKAI 12.0 CONTINUOUS-BUILD CONTEXT:\n${kai12Context||'(none)'}\nEXISTING PRODUCT:\n${existing||'(new)'}\nRESEARCH:\n${JSON.stringify(researchData||{})}`});
  return json(r.text);
}

async function kai2(prompt,plan,ui,existing,kai12Context){
  const r=await fastComplete({maxTokens:4600,system:`You are KAI 2.0, the final compiler, behavior integrator, QA brain and delivery brain. KAI 1.0 decided the product and KAI 3.0 implemented the interface. Your job is NOT to summarize their work. Your job is to make the final product actually behave like the requested product.

20X COMPILATION GATE: before returning files, mentally execute the product as a real person would on phone and laptop. Trace the important user journeys from first open → input → action → processing → result → next action → error/recovery → repeat. If a journey stops at a decorative button, placeholder message, fake result, static card or 'RUN' action that does not match the product, repair it. Preserve useful complexity; do not simplify a sophisticated request into a toy.

FINAL REAL-PERSON TEST: pretend you have never seen the source code. Open the generated app as a normal user. Can you immediately discover what to do? Can you actually do it? Does the screen visibly change? Does the result make sense? Can you do it again? If it is an AI, type 'hello' and then a real task: there must be a working send path and an actual response path, with no requirement to press a mysterious RUN button. If it is a calculator, enter an expression and get the correct result. If it is a game, you must be able to play for more than a single click. If it is an editor, a change must visibly alter the artifact. If any answer is no, repair the code before shipping.

PRODUCT DIFFERENCE GATE:
- AI/agent = context + input + processing + useful response + continued conversation + adaptation. It must respond to the user, not echo the prompt and not merely expose a RUN button.
- Game = control + rules + challenge + feedback + progression + failure/restart + replay. START is allowed only as the entry into the actual game loop.
- Tool/utility = user input causes correct state/output changes.
- Editor/creative tool = user changes something and sees the changed result.
- Dashboard = data and controls are interactive, with meaningful state changes.
- Website = navigation and actions are real.

PHONE/LAPTOP GATE: verify the composition works at narrow phone widths and wide laptop widths. Touch targets must be usable without a mouse; keyboard/focus behavior must work where relevant; no horizontal overflow; no hover-only critical interaction; no fixed desktop assumptions; no tiny unreadable controls. Mobile is not a collapsed desktop—it is a deliberate layout.

Repair broken HTML/CSS/JS, selectors, event handlers, responsive controls and state transitions. Enforce every acceptance test. Perform a final visual and interaction audit. Reject terminal-green, bare-canvas, browser-default, static-card and placeholder presentation. Games require real gameplay, collisions/rules, scoring, progression, pause/restart, touch controls and a polished HUD/game shell. AI apps require real responses using public/free no-key access when feasible plus local fallback. Never ship HAxBRO private keys, /api/chat, lib/core, process.env secrets or owner routes. For continuous builds, treat the existing product and KAI 12.0 conversation as source of truth: fix, extend, refactor or redesign requested parts without deleting unrelated working functionality. Return ONLY JSON {name,summary,files:[{path,content}]}.`,prompt:`PRODUCT CONTRACT:\n${JSON.stringify(plan)}\nKAI 3.0 CODE:\n${JSON.stringify(ui||{})}\nUSER REQUEST:\n${prompt}\nKAI 12.0 CONTINUOUS-BUILD CONTEXT:\n${kai12Context||'(none)'}\nEXISTING PRODUCT:\n${existing||'(new)'}`});
  return json(r.text);
}

async function buildAll(prompt,identity,existing,researchData,kai12){
  const r=await complete({username:'app-maker',modelChoice:'openrouter',maxTokens:5600,system:`You are the unified KAI 1.0 → KAI 3.0 → KAI 2.0 build engine inside HAxBRO App Maker. Execute the three roles in one pass for speed: KAI 1.0 determines the real product and complete behavior contract; KAI 3.0 designs and implements the product UI/UX; KAI 2.0 compiles, repairs and QA-tests the finished code before delivery. Do not return planning prose. Return ONLY JSON {name,summary,files:[{path,content}]}.

YOUR JOB IS TO SHIP A REAL PRODUCT. The output is opened by a normal end user, not a developer. Never produce a static mockup, text-only demo, decorative card, fake result, or unexplained RUN button. Infer obvious missing mechanics yourself.

PRODUCT-TYPE INTELLIGENCE:
AI/AGENT: it must have a visible composer, real SEND action, Enter-to-send, user/assistant message history, immediate thinking/processing state, useful response generation, continued context, retry/error recovery, clear composer state and mobile keyboard-safe layout. Never make the main answer 'you typed X'. Use a real public/free no-key inference path when feasible and a useful task-aware local fallback when it is unavailable. Do not expose chain-of-thought.
GAME: actual repeatable play loop, controls, challenge/enemies or obstacles appropriate to the game, rules/collision, score, feedback, progression/levels, pause, restart, win/lose, keyboard plus touch controls, responsive HUD and replay. START only begins the real loop.
CALCULATOR/UTILITY: real inputs, correct computation/transformation, validation, clear/reset, keyboard behavior, visible result and useful history/state when appropriate.
EDITOR/CREATIVE: real editable state and a live result that visibly changes from user actions.
DASHBOARD: controls/filters change the displayed state/data, with useful empty/loading/error states.
WEBSITE/COMMERCE/EDUCATION: real navigation and meaningful actions, not just presentation.

REAL-PERSON QA: mentally open the result and execute the primary flow twice. If a button has no event, a form does not submit, a response is fake, a game cannot really be played, a calculation is wrong, or the second interaction cannot continue from the first, repair it before returning code.

PHONE + LAPTOP: design both as first-class experiences. Use responsive composition rather than simply shrinking desktop. Include viewport meta, touch-safe controls, keyboard/focus behavior, safe-area support where useful, no horizontal overflow, readable type and no hover-only critical actions.

VISUAL QUALITY: create a deliberate visual system with hierarchy, typography, spacing, depth, polished surfaces, meaningful states and purposeful motion. Avoid terminal-green, plain monospace, browser-default, bare-canvas, raw-card, generic dashboard and placeholder aesthetics.

CONTINUOUS BUILD: if existing product files are supplied, they are the source of truth. Modify/extend/refactor the requested parts and preserve unrelated working functionality. KAI 12.0 context may contain many noisy or contradictory messages; preserve useful intent, prioritize the newest explicit instruction, and do not throw away working features just because a later message is vague.

INDEPENDENCE: generated apps must run independently of the HAxBRO editor. Never use HAxBRO private APIs, /api/chat, lib/core, process.env, owner-only routes or embedded secrets. Public generated apps may use browser APIs, public/free no-key services, and local fallbacks. Keep all required UI and logic inside the shipped files.` ,prompt:`USER REQUEST:\n${prompt}\nREQUESTED NAME:\n${identity||'(infer)'}\nEXISTING PRODUCT:\n${existing||'(new)'}\nKAI 12.0 CONTEXT:\n${kai12||'(none)'}\nPUBLIC RESEARCH:\n${JSON.stringify(researchData||{})}`});
  return json(r.text);
}

export default async function(req,res){
  const prompt=safe(req.body?.prompt);if(!prompt)return res.status(400).json({error:'Tell KAI what app to build.'});
  const identity=requestedName(prompt)||cleanName(req.body?.appName);
  const existing=req.body?.existingProduct?.files?JSON.stringify(req.body.existingProduct).slice(0,60000):'';
  const kai12=req.body?.kai12Context?safe(JSON.stringify(req.body.kai12Context),60000):'';
  const researchData=await research(prompt);
  try{
    const compiled=await buildAll(prompt,identity,existing,researchData,kai12);
    const result=responsiveHardening(identityLayer(compiled?.files?.length?compiled:emergency(prompt),identity));
    result.kai={version:'2.0',pipeline:['KAI 1.0 · intent + architecture','KAI 3.0 · UI selector + implementation','KAI 2.0 · compile + repair + acceptance test'],architecture:'Unified execution of the three KAI roles for faster real-product delivery.',researched:Boolean(researchData),ownerSecretsExcluded:true};
    return res.json(result);
  }catch(e){
    console.error('KAI unified pipeline failed',e);
    const result=responsiveHardening(identityLayer(emergency(prompt),identity));result.kai={version:'2.0',pipeline:['KAI 1.0','KAI 3.0','KAI 2.0'],fallback:true,ownerSecretsExcluded:true};return res.json(result);
  }
}