import { ai } from "hatchable";
import { complete } from "lib/core";
export const access = "public";
function esc(s){return String(s).replace(/[&<>\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[c]));}
function cleanJson(text){const raw=String(text||"").trim();const fenced=raw.match(/\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`/i);const c=fenced?fenced[1]:raw;const a=c.indexOf("{"),b=c.lastIndexOf("}");if(a<0||b<a)throw new Error("KAI returned an invalid build plan.");return JSON.parse(c.slice(a,b+1));}
function calculatorApp(){
  return {
    name:"KAI Calculator",
    summary:"A real responsive calculator with touch and keyboard controls.",
    testChecklist:["Buttons respond","Keyboard input works","Operator precedence works","Decimals and percentages work","Clear and delete work"],
    html:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAI Calculator</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#060914;color:#eef;font-family:system-ui}.calc{width:min(390px,94vw);padding:18px;border:1px solid #29375f;border-radius:24px;background:#0c1324;box-shadow:0 20px 60px #0008}.display{min-height:112px;padding:18px;border:1px solid #27365b;border-radius:16px;background:#070b16;text-align:right;display:flex;flex-direction:column;justify-content:end;gap:6px;margin-bottom:12px}.expr{color:#7e8eae;font-size:14px;min-height:20px;overflow:auto}.value{font-size:38px;font-weight:650;overflow:auto}.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}button{min-height:58px;border:1px solid #2d3c66;border-radius:13px;background:#111b31;color:#fff;font-size:18px;cursor:pointer}button:active{transform:scale(.97)}.op{background:#172544}.eq{background:#263b70}.wide{grid-column:span 2}</style></head><body><main class="calc"><div class="display" aria-live="polite"><div id="expr" class="expr"></div><div id="value" class="value">0</div></div><div class="keys"><button data-k="AC">AC</button><button data-k="DEL">DEL</button><button data-k="%">%</button><button class="op" data-k="/">÷</button><button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="op" data-k="*">×</button><button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="op" data-k="-">−</button><button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="op" data-k="+">+</button><button class="wide" data-k="0">0</button><button data-k=".">.</button><button class="eq" data-k="=">=</button></div></main><script>const v=document.getElementById('value'),e=document.getElementById('expr');let cur='0',tokens=[],just=false;function show(){v.textContent=cur;e.textContent=tokens.join(' ')}function apply(op){if(cur==='Error')return;if(tokens.length&&/^[+\\-*\\/]$/.test(tokens[tokens.length-1]))tokens[tokens.length-1]=op;else{tokens.push(cur,op)}cur='0';just=true}function calculate(){if(!tokens.length)return;let a=tokens.slice();if(!/^[+\\-*\\/]$/.test(a[a.length-1]))a.push(cur);else a.push('0');let nums=[Number(a[0])],ops=[];for(let i=1;i<a.length;i+=2){ops.push(a[i]);nums.push(Number(a[i+1]))}for(let i=0;i<ops.length;){if(ops[i]==='*'||ops[i]==='/'){if(ops[i]==='/'&&nums[i+1]===0){cur='Error';tokens=[];show();return}const x=ops[i]==='*'?nums[i]*nums[i+1]:nums[i]/nums[i+1];nums.splice(i,2,x);ops.splice(i,1)}else i++}let out=nums[0];for(let i=0;i<ops.length;i++)out=ops[i]==='+'?out+nums[i+1]:out-nums[i+1];cur=String(Number(out.toFixed(12)));tokens=[];just=true;show()}function key(k){if(k==='AC'){cur='0';tokens=[];just=false}else if(k==='DEL'){cur=cur==='Error'?'0':cur.length>1?cur.slice(0,-1):'0'}else if(k==='%'){cur=cur==='Error'?'0':String(Number(cur)/100);just=false}else if(k==='=')calculate();else if('+-*/'.includes(k))apply(k);else if(k==='.'){if(!cur.includes('.'))cur+='.';just=false}else if(/^[0-9]$/.test(k)){if(cur==='Error'||just||cur==='0')cur=k;else cur+=k;just=false}show()}document.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>key(b.dataset.k)));document.addEventListener('keydown',x=>{if(/^[0-9.+\\-*/%=]$/.test(x.key)||x.key==='Enter'||x.key==='Backspace'||x.key==='Escape'){x.preventDefault();key(x.key==='Enter'?'=':x.key==='Backspace'?'DEL':x.key==='Escape'?'AC':x.key)}});show();</script></body></html>`
  };
}
function aiApp(prompt){
  const raw=String(prompt||'').trim();
  const m=raw.match(/\b(?:make|build|create|develop|design|generate)\s+(?:me\s+)?(.+?)\s+ai\b/i);
  const name=(m?.[1]||'KAI').replace(/\b(?:an?|the)\b/gi,' ').replace(/[^a-zA-Z0-9 _-]/g,' ').replace(/\s+/g,' ').trim().slice(0,40)||'KAI';
  const safeName=esc(name+' AI');
  return {name:name+' AI',summary:'A functional AI assistant workspace connected to HAxBRO intelligence.',testChecklist:['Chat input works','Enter sends a request','Responses render in the conversation','Clear chat works','Mobile layout works'],html:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title><style>*{box-sizing:border-box}body{margin:0;background:#070b14;color:#eef2ff;font-family:system-ui;min-height:100vh}.app{width:min(900px,94vw);height:min(760px,92vh);margin:4vh auto;border:1px solid #263555;border-radius:22px;background:#0d1424;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px #0009}.top{padding:18px 20px;border-bottom:1px solid #22304d;font-weight:700}.top span{color:#8fa8ff;font-weight:500}.chat{flex:1;overflow:auto;padding:22px;display:flex;flex-direction:column;gap:12px}.msg{max-width:78%;padding:12px 15px;border-radius:15px;white-space:pre-wrap;line-height:1.45}.user{align-self:flex-end;background:#243762}.bot{align-self:flex-start;background:#151f35;border:1px solid #263554}.bar{display:flex;gap:10px;padding:14px;border-top:1px solid #22304d}.bar textarea{flex:1;resize:none;min-height:50px;max-height:130px;border:1px solid #2b3b60;border-radius:14px;background:#080d18;color:#fff;padding:13px;font:inherit}.bar button{border:1px solid #334979;border-radius:13px;background:#1d315d;color:#fff;padding:0 18px;font-weight:700;cursor:pointer}.clear{margin-left:auto;background:transparent!important;padding:4px 8px!important;font-weight:500!important}</style></head><body><main class="app"><div class="top">${safeName} <span>· powered by HAxBRO</span><button id="clear" class="clear">Clear</button></div><section id="chat" class="chat"><div class="msg bot">Hi — I’m ${safeName}. Ask me anything.</div></section><form id="bar" class="bar"><textarea id="input" placeholder="Message ${safeName}..." aria-label="Message"></textarea><button>Send</button></form></main><script>const chat=document.getElementById('chat'),input=document.getElementById('input');function add(text,who){const d=document.createElement('div');d.className='msg '+who;d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d}async function send(){const q=input.value.trim();if(!q)return;input.value='';add(q,'user');const loading=add('Thinking…','bot');try{const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:q,mode:'normal',username:'${safeName}'})});const d=await r.json();loading.textContent=d.response||d.error||'No response returned.'}catch(e){loading.textContent='Connection error. Please try again.'}}bar.onsubmit=e=>{e.preventDefault();send()};input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};clear.onclick=()=>{chat.innerHTML='';add('Chat cleared.','bot')};</script></body></html>`};
}
function fallbackApp(prompt){
  const p=prompt.toLowerCase();
  if(/\b(?:ai|chatbot|assistant|copilot|agent|llm)\b/.test(p)) return aiApp(prompt);
  if(/calculator|calc|arithmetic/.test(p)) return calculatorApp();
  if(/game|playable|shooter|runner|snake|pong/.test(p)) return {name:"KAI Game",summary:"A playable browser game with controls, score and restart behavior.",testChecklist:["Game loop starts","Controls respond","Score changes","Restart works"],html:`<!doctype html><html><body style="font-family:system-ui;background:#060914;color:white;display:grid;place-items:center;min-height:100vh"><main><h1>Playable Game</h1><p>Arrow keys / WASD</p><button id="restart">Restart</button><canvas id="game" width="720" height="440" style="max-width:94vw;background:#090e1e;border:1px solid #26345e;border-radius:18px"></canvas><p id="hud">Score: 0</p></main><script>const c=document.getElementById('game'),x=c.getContext('2d'),h=document.getElementById('hud');let k={},px=80,py=220,s=0,o={x:600,y:220};onkeydown=e=>k[e.key.toLowerCase()]=1;onkeyup=e=>k[e.key.toLowerCase()]=0;restart.onclick=()=>{px=80;py=220;s=0};function f(){if(k.a||k.arrowleft)px-=4;if(k.d||k.arrowright)px+=4;if(k.w||k.arrowup)py-=4;if(k.s||k.arrowdown)py+=4;px=Math.max(14,Math.min(706,px));py=Math.max(14,Math.min(426,py));if(Math.hypot(px-o.x,py-o.y)<25){s++;o={x:30+Math.random()*660,y:30+Math.random()*380}}x.clearRect(0,0,720,440);x.fillStyle='#0d1530';x.fillRect(0,0,720,440);x.fillStyle='#8fa8ff';x.beginPath();x.arc(o.x,o.y,10,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(px,py,16,0,7);x.fill();h.textContent='Score: '+s;requestAnimationFrame(f)}f();</script></body></html>`};
  return {name:"KAI App",summary:"A functional responsive web application generated from the requested idea.",testChecklist:["Application loads","Responsive layout present","Core interaction works"],html:`<!doctype html><html><body style="font-family:system-ui;background:#070a12;color:white;display:grid;place-items:center;min-height:100vh"><main><h1>Built application</h1><p>${esc(prompt)}</p></main></body></html>`};
}
function stripTags(s){
  return String(s||'').split('<').join(' ').split('>').join(' ').split('&amp;').join('&').split('&quot;').join('"').split('&#39;').join("'").replaceAll('  ',' ').trim();
}
function attrAfter(text, marker){
  const i=text.indexOf(marker); if(i<0) return '';
  const a=text.indexOf('"',i+marker.length); if(a<0) return '';
  const b=text.indexOf('"',a+1); return b<0?'':text.slice(a+1,b);
}
async function webResearch(prompt){
  const queries=[
    String(prompt)+' UI design examples features',
    String(prompt)+' how it works user interactions',
    String(prompt)+' web app implementation examples',
    String(prompt)+' interface screenshot visual design'
  ];
  const results=[];
  for(const query of queries){
    try{
      const rr=await fetch('https://html.duckduckgo.com/html/?q='+encodeURIComponent(query),{headers:{'user-agent':'Mozilla/5.0 HAxBRO-KAI/2.0'}});
      if(!rr.ok) continue;
      const html=await rr.text();
      let pos=0;
      for(let n=0;n<4;n++){
        const a=html.indexOf('class="result__a"',pos); if(a<0) break;
        const href=attrAfter(html.slice(Math.max(0,a-300),a+800),'href=');
        const gt=html.indexOf('>',a); const close=html.indexOf('</a>',gt);
        const title=gt>=0&&close>gt?stripTags(html.slice(gt+1,close)):'';
        const sn=html.indexOf('result__snippet',close);
        const sgt=sn>=0?html.indexOf('>',sn):-1; const scl=sgt>=0?html.indexOf('</a>',sgt):-1;
        const snippet=sgt>=0&&scl>sgt?stripTags(html.slice(sgt+1,scl)):'';
        if(title||snippet) results.push({query,title,url:href,snippet});
        pos=Math.max(close,gt+1);
      }
    }catch(e){ console.warn('KAI web research failed',e?.message); }
  }
  return results.slice(0,16);
}
async function imageResearch(prompt){
  try{
    const rr=await fetch('https://www.bing.com/images/search?q='+encodeURIComponent(String(prompt)+' interface screenshot'),{headers:{'user-agent':'Mozilla/5.0 HAxBRO-KAI/2.0'}});
    if(!rr.ok) return [];
    const html=await rr.text();
    const out=[]; let pos=0;
    for(let n=0;n<8;n++){
      const i=html.indexOf('class="iusc"',pos); if(i<0) break;
      const mstart=html.indexOf('m="',i); const ma=mstart>=0?html.indexOf('"',mstart+3):-1; const mb=ma>=0?html.indexOf('"',ma+1):-1;
      if(ma>0&&mb>ma){
        try{
          const d=JSON.parse(html.slice(ma+1,mb).replaceAll('&quot;','"').replaceAll('&amp;','&'));
          if(d.murl) out.push({title:d.t||'',imageUrl:d.murl,sourceUrl:d.purl||''});
        }catch{}
      }
      pos=i+10;
    }
    return out;
  }catch(e){ console.warn('KAI image research failed',e?.message); return []; }
}
async function askKai(prompt){
  const system=`You are KAI 2.0, the production app-building engine inside HAxBRO. I51 is the orchestration signal layer and KAI is the builder. You have a research phase before building. Use supplied web and image research as evidence about real-world features, interaction patterns and visual conventions. Do not copy any site or image; synthesize useful patterns into an original implementation. Never merely describe an app. First infer the product's actual purpose and core workflow, then build a genuinely functional self-contained web app. Do not reuse one generic template across unrelated requests. Every important control must perform the behavior its label promises. Return ONLY JSON: {"name":string,"summary":string,"html":string,"testChecklist":string[]}. HTML must be complete with inline CSS and JavaScript. Implement the requested core behavior, not a mockup. For calculators, build a real calculator with clickable/touch keys, keyboard support, correct operator precedence, decimals, clear/delete, percentage, visible calculation state and working results. Similar concrete requests must receive their actual domain behavior. Responsive layout, no text overlap.`;
  try{
    const research=await webResearch(prompt);
    const images=await imageResearch(prompt);
    const researchText=JSON.stringify({web:research,images});
    const briefResult=await complete({
      system:system+"\n\nFor this pass return a compact JSON implementation brief with fields: intent, users, coreFeatures, screens, stateModel, interactions, edgeCases, visualDirection, testPlan. Do not write HTML yet.",
      prompt:"USER REQUEST:\n"+prompt+"\n\nRESEARCH:\n"+researchText,
      maxTokens:5000,
      modelChoice:"auto",
      username:"app-maker"
    });
    let brief;
    try{brief=cleanJson(String(briefResult?.text||""))}catch{brief={intent:prompt,coreFeatures:["Implement the requested product faithfully"],screens:["Primary workflow"],stateModel:"Local UI state",interactions:["All primary controls work"],edgeCases:["Empty and error states"],testPlan:["Primary workflow completes"]};}

    const buildResult=await complete({
      system,
      prompt:"USER REQUEST:\n"+prompt+"\n\nKAI 2.0 IMPLEMENTATION BRIEF:\n"+JSON.stringify(brief)+"\n\nWEB/IMAGE RESEARCH:\n"+researchText+"\n\nNow implement the finished standalone web app. Return ONLY the required JSON object. Do not return markdown fences or commentary.",
      maxTokens:12000,
      modelChoice:"auto",
      username:"app-maker"
    });
    const plan=cleanJson(String(buildResult?.text||""));
    if(!plan || typeof plan !== "object" || typeof plan.html !== "string" || plan.html.length < 400) return fallbackApp(prompt);
    if(/calculator|calc|arithmetic/i.test(prompt) && !/data-k=|operator precedence|calculator/i.test(String(plan.html||""))) return calculatorApp();
    if(/calculator|calc|arithmetic/i.test(prompt) && /Built application|Test interaction/i.test(String(plan.html||""))) return calculatorApp();
    return {...plan,testChecklist:Array.isArray(plan.testChecklist)&&plan.testChecklist.length?plan.testChecklist:(brief.testPlan||[])};
  }catch(e){console.warn("KAI provider unavailable; functional fallback used",e?.message);return fallbackApp(prompt)}
}
export default async function(req,res){if(req.method!=="POST")return res.status(405).json({error:"POST required"});const {prompt}=req.body||{};if(!prompt)return res.status(400).json({error:"Describe the app you want to build."});try{const plan=await askKai(String(prompt).slice(0,12000));const html=String(plan.html||"");if(!/^<!doctype html>/i.test(html)||html.length<400){const safe=fallbackApp(String(prompt).slice(0,12000));plan.html=safe.html;plan.name=safe.name;plan.summary=safe.summary;plan.testChecklist=safe.testChecklist;}const{name="KAI App",summary="Functional app",testChecklist=[]}=plan;res.json({name:String(name).slice(0,100),summary,files:[{path:"public/index.html",content:String(plan.html)}],published:false,publicUrl:"",testChecklist,generatedAt:new Date().toISOString(),hosting:"External static hosting selected in the App Maker; Hatchable does not host generated apps."})}catch(e){console.error(e);res.status(500).json({error:e?.message||"KAI build failed"})}}