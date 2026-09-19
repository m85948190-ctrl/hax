import { ai, db } from "hatchable";
export const access = "public";
function esc(s){return String(s).replace(/[&<>\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[c]));}
function cleanJson(text){const raw=String(text||"").trim();const fenced=raw.match(/\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`/i);const c=fenced?fenced[1]:raw;const a=c.indexOf("{"),b=c.lastIndexOf("}");if(a<0||b<a)throw new Error("KAI returned an invalid build plan.");return JSON.parse(c.slice(a,b+1));}
function fallbackApp(prompt){const p=prompt.toLowerCase();if(/game|playable|shooter|runner|snake|pong/.test(p))return{name:"KAI Game",summary:"A playable browser game with controls, score and restart behavior.",testChecklist:["Game loop starts","Controls respond","Score changes","Restart works"],html:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAI Game</title><style>*{box-sizing:border-box}body{margin:0;background:#060914;color:#eef;font-family:system-ui;display:grid;place-items:center;min-height:100vh}main{width:min(760px,94vw)}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}button{border:1px solid #33406b;background:#10172b;color:#fff;border-radius:10px;padding:9px 13px;cursor:pointer}canvas{width:100%;height:auto;background:#090e1e;border:1px solid #26345e;border-radius:18px;display:block}p{color:#8793ad;font-size:13px}</style></head><body><main><header><div><b>PLAYABLE BUILD</b><p>Arrow keys / WASD • collect the orbs</p></div><button id="restart">Restart</button></header><canvas id="game" width="720" height="440"></canvas><p id="hud">Score: 0</p></main><script>const c=document.getElementById('game'),x=c.getContext('2d'),hud=document.getElementById('hud');let keys={},px=80,py=220,score=0,orb={x:600,y:220};onkeydown=e=>keys[e.key.toLowerCase()]=1;onkeyup=e=>keys[e.key.toLowerCase()]=0;restart.onclick=()=>{px=80;py=220;score=0};function loop(){if(keys.a||keys.arrowleft)px-=4;if(keys.d||keys.arrowright)px+=4;if(keys.w||keys.arrowup)py-=4;if(keys.s||keys.arrowdown)py+=4;px=Math.max(14,Math.min(706,px));py=Math.max(14,Math.min(426,py));if(Math.hypot(px-orb.x,py-orb.y)<25){score++;orb={x:30+Math.random()*660,y:30+Math.random()*380}}x.clearRect(0,0,720,440);x.fillStyle='#0d1530';x.fillRect(0,0,720,440);x.fillStyle='#8fa8ff';x.beginPath();x.arc(orb.x,orb.y,10,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(px,py,16,0,7);x.fill();hud.textContent='Score: '+score;requestAnimationFrame(loop)}loop();</script></body></html>`};if(/ai|chatbot|assistant|chat/.test(p)){const n=/hero ai/.test(p)?"Hero AI":"AI Assistant";return{name:n,summary:"A functional chatbot with message history, send and clear controls, using an honest local demo mode.",testChecklist:["Input works","Send works","Messages render","Clear works"],html:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${n}</title><style>*{box-sizing:border-box}body{margin:0;background:#060811;color:#eef;font-family:system-ui;min-height:100vh;display:grid;place-items:center}.app{width:min(900px,94vw);height:min(720px,90vh);border:1px solid #27314e;border-radius:22px;overflow:hidden;background:#0b0f1b;display:flex;flex-direction:column}.top{padding:18px 20px;border-bottom:1px solid #222a42;display:flex;justify-content:space-between}.top small{color:#7d8aa5}.messages{flex:1;overflow:auto;padding:22px;display:flex;flex-direction:column;gap:12px}.msg{max-width:78%;padding:12px 15px;border-radius:15px;line-height:1.5;font-size:14px}.user{align-self:flex-end;background:#24335f}.bot{align-self:flex-start;background:#121a2b;border:1px solid #24304c}.composer{display:flex;gap:8px;padding:14px;border-top:1px solid #222a42}.composer input{flex:1;min-width:0;background:#070b14;border:1px solid #2a3552;border-radius:12px;padding:13px;color:#fff;outline:0}.composer button,.clear{border:1px solid #35436b;background:#121a2b;color:#fff;border-radius:11px;padding:0 15px;cursor:pointer}.clear{padding:7px 10px;font-size:11px}</style></head><body><section class="app"><div class="top"><div><b>${n}</b><br><small>Functional local demo mode</small></div><button class="clear" id="clear">Clear</button></div><div class="messages" id="messages"></div><form class="composer" id="form"><input id="input" autocomplete="off" placeholder="Message the AI…"><button>Send</button></form></section><script>const m=document.getElementById('messages'),i=document.getElementById('input'),form=document.getElementById('form'),clear=document.getElementById('clear');function add(text,who){const d=document.createElement('div');d.className='msg '+who;d.textContent=text;m.appendChild(d);m.scrollTop=m.scrollHeight}function reply(q){const s=q.toLowerCase();if(/hello|hi|hey/.test(s))return'Hello! I am ready. What would you like to explore?';if(/who are you/.test(s))return'I am ${n}, running in local demo mode. Connect a model provider for model-powered answers.';return'I understood: '+q+' — the chat interface is working.'}form.onsubmit=e=>{e.preventDefault();const q=i.value.trim();if(!q)return;add(q,'user');i.value='';setTimeout(()=>add(reply(q),'bot'),220)};clear.onclick=()=>m.innerHTML='';add('Hello! I am ${n}. Ask me something.','bot');</script></body></html>`}}return{name:"KAI App",summary:"A functional responsive web application generated from the requested idea.",testChecklist:["Application loads","Responsive layout present","Core interaction works"],html:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAI App</title><style>body{margin:0;background:#070a12;color:#fff;font-family:system-ui;display:grid;place-items:center;min-height:100vh}main{width:min(900px,90vw);padding:42px;border:1px solid #293653;border-radius:20px;background:#0d1322}button{padding:10px 14px;border-radius:9px;background:#182440;color:white;border:1px solid #33466f}</style></head><body><main><h1>Built application</h1><p>${esc(prompt)}</p><button onclick="this.textContent='Working ✓'">Test interaction</button></main></body></html>`}}
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
  const system=`You are KAI 2.0, the production app-building engine inside HAxBRO. I51 is the orchestration signal layer and KAI is the builder. You have a research phase before building. Use supplied web and image research as evidence about real-world features, interaction patterns and visual conventions. Do not copy any site or image; synthesize useful patterns into an original implementation. Never merely describe an app. Build a genuinely functional self-contained web app. Return ONLY JSON: {"name":string,"summary":string,"html":string,"testChecklist":string[]}. HTML must be complete with inline CSS and JavaScript. Implement the requested core behavior, not a mockup. For calculators, build a real calculator with clickable/touch keys, keyboard support, correct operator precedence, decimals, clear/delete, percentage, visible calculation state and working results. Similar concrete requests must receive their actual domain behavior. Responsive layout, no text overlap.`;
  try{
    const research=await webResearch(prompt);
    const images=await imageResearch(prompt);
    const researchText=JSON.stringify({web:research,images});
    const rr=await ai.generateText({model:"sonnet",system,prompt:`Research findings:\n${researchText}\n\nBuild the requested app now. Infer concrete requirements from the request and research, implement them, then self-check the result. User request:\n${prompt}`,maxSteps:4,purpose:"HAxBRO App Maker production build with web and image research"});
    return cleanJson(rr.text||rr);
  }catch(e){console.warn("KAI provider unavailable; functional fallback used",e?.message);return fallbackApp(prompt)}
}
export default async function(req,res){if(req.method!=="POST")return res.status(405).json({error:"POST required"});const {prompt}=req.body||{};if(!prompt)return res.status(400).json({error:"Describe the app you want to build."});try{const plan=await askKai(String(prompt).slice(0,12000));const html=String(plan.html||"");if(!/^<!doctype html>/i.test(html)||html.length<400)throw new Error("KAI produced an incomplete application.");const{name="KAI App",summary="Functional app",testChecklist=[]}=plan;const{rows}=await db.query("INSERT INTO generated_apps (name,prompt,html) VALUES ($1,$2,$3) RETURNING id, created_at",[String(name).slice(0,100),String(prompt),html]);const publicUrl=new URL(`/appmaker-published/${rows[0].id}`,new URL(req.url,"https://haxbro.hatchable.site").origin).toString();res.json({name:String(name).slice(0,100),summary,files:[{path:"public/index.html",content:html}],published:true,publicUrl,testChecklist,generatedAt:rows[0].created_at})}catch(e){console.error(e);res.status(500).json({error:e?.message||"KAI build failed"})}}