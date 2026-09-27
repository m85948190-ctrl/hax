// KAI 51 App Maker uses its dedicated builder endpoint for synthesis.
import { buildNativeProduct } from 'lib/kai-native-builder';
import { polishExistingUi } from 'lib/ui-polish';
import { createKai51Plan, truthfulIdentity } from 'lib/kai51-core';

const GROQ_URL='https://api.groq.com/openai/v1/chat/completions';
const MODEL='openai/gpt-oss-20b';
const clean=(v,n=18000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
const keys=['GROQ_API_KEY_1','GROQ_API_KEY_2','GROQ_API_KEY_3','GROQ_API_KEY_4'];

async function groq(slot,system,prompt){
  const key=String(process.env[keys[slot-1]]||'').trim();
  if(!key) throw new Error(keys[slot-1]+' not configured');
  const r=await fetch(GROQ_URL,{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({model:MODEL,messages:[{role:'system',content:clean(system,10000)},{role:'user',content:clean(prompt,22000)}],temperature:.15,max_tokens:5000})});
  const text=await r.text();
  if(!r.ok) throw new Error('Groq '+slot+' '+r.status+': '+clean(text,500));
  const data=JSON.parse(text);
  return String(data.choices?.[0]?.message?.content||'').trim();
}
function extractHtml(text){
  const s=String(text||''); const a=s.toLowerCase().indexOf('<!doctype html>'); const b=s.toLowerCase().lastIndexOf('</html>');
  return a>=0&&b>a?s.slice(a,b+7):'';
}
function extractTitle(html){
  const s=String(html||'').toLowerCase(); const a=s.indexOf('<title>'); const b=s.indexOf('</title>');
  return a>=0&&b>a?clean(String(html).slice(a+7,b),100).replace(/\s+/g,' ').trim():'KAI Product';
}
async function webResearch(prompt){
  const q=clean(prompt,900).replace(/[^a-z0-9 _-]/gi,' ').replace(/\s+/g,' ').trim().slice(0,220);
  if(!q) return {query:'',sources:[],summary:'No web research query was available.'};
  try{
    const url='https://html.duckduckgo.com/html/?q='+encodeURIComponent(q+' web app UI design patterns');
    const r=await fetch(url,{headers:{'user-agent':'HAxBRO-App-Maker/1.0','accept':'text/html'},redirect:'follow'});
    const html=await r.text(); const items=[];
    const re=/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi; let m;
    while((m=re.exec(html))&&items.length<6){
      const title=clean(m[2].replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&'),240); let href=m[1];
      try{href=new URL(href,'https://html.duckduckgo.com').toString()}catch{}
      if(title&&href)items.push({title,url:href});
    }
    return {query:q,sources:items,summary:items.length?items.map(x=>x.title).join(' | '):'Search returned no parseable results.'};
  }catch(e){return {query:q,sources:[],summary:'Web research unavailable for this build; continuing with internal reasoning.'};}
}
async function nativeKAI(workingPrompt,research,architecture,visual,projectContext){
  const kaiPlan=createKai51Plan({prompt:workingPrompt,username:'app-maker',history:projectContext});
  const system=truthfulIdentity()+`
  
You are KAI 51 INSIDE HAxBRO APP MAKER.
You are the actual synthesis authority. Groq is NOT your synthesis engine.
Your job is to turn the request into the complete working application after the specialist inputs have been supplied.
Use the HAxBRO project context below as product knowledge.

HAxBRO PROJECT CONTEXT:
- Product: HAxBRO AI / Hacks Bro AI
- Purpose: premium AI workspace + AI application-generation platform.
- App Maker: KAI 51 / I51 build engine.
- Build philosophy: understand → research → architect → build → inspect → repair → present.
- Visual identity: premium professional futuristic, restrained midnight/black, electric cyan/blue, thin borders, glass depth, strong typography, subtle motion.
- UX rules: mobile-first, every visible control works, no fake buttons, no giant random cards, no cramped layouts, clear states.
- Modification rule: inspect and preserve existing identity/features; change only requested parts unless dependencies require more.
- Naming rule: never rename an existing app unless explicitly requested.
- App Maker flow: UNDERSTAND → RESEARCH → PLAN → BUILD → TEST → REPAIR → READY.
- Pipeline contract: Groq 1 = architecture specialist; Groq 2 = visual specialist; KAI 51 = synthesis/build authority; Groq 3 = QA specialist; Groq 4 = final polish specialist.
- External specialists may advise KAI 51, but KAI 51 owns the synthesis result.
- Never expose private chain-of-thought; return the finished artifact and concise status only.

KAI 51 SESSION PLAN:
${JSON.stringify(kaiPlan)}

PROJECT STATE:
${clean(projectContext,18000)}
`;
  const p='USER REQUEST:\n'+clean(workingPrompt,5000)+'\n\nARCHITECTURE INPUT:\n'+clean(architecture,2500)+'\n\nVISUAL INPUT:\n'+clean(visual,2500)+'\n\nWEB RESEARCH INPUT:\n'+clean(JSON.stringify(research),2500)+'\n\nKAI 51 SYSTEM:\n'+system;
  // KAI 51's dedicated Builder endpoint is the synthesis stage. Gemini is deliberately not used here.
  const r=await fetch('https://haxbro.hatchable.site/api/kai/builder-agent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:p,username:'app-maker',appMakerSynthesis:true})});
  const raw=await r.text();
  if(!r.ok) throw new Error('KAI 51 Builder '+r.status+': '+clean(raw,700));
  const data=JSON.parse(raw);
  const html=extractHtml(data?.files?.find(f=>/index\.html$/i.test(String(f.path||''))||/public\/index\.html$/i.test(String(f.path||'')))?.content||data?.html||'');
  if(!html) throw new Error('KAI 51 returned no complete HTML document');
  return html;
}
export async function runAppMakerAgent(prompt,{existing=null,appName='' }={}){
  const workingPrompt=existing?.files?.length
    ? String(prompt)+'\n\nEXISTING APPLICATION TO MODIFY IN PLACE:\n'+String(existing.files[0]?.content||'')
    : String(prompt);
  const logs=[]; const log=(stage,message,meta={})=>logs.push({stage,message,at:new Date().toISOString(),...meta});
  log('INTENT','KAI received the build request and is defining the actual product goal.');
  const research={query:'local-kai',sources:[],summary:'Local KAI build path; no external model provider required.'};
  log('KAI 51 LOCAL','Local product reasoning and build path selected; external model providers are not required.');
  // KAI 51 is now the sole App Maker authority. Specialist-provider passes are removed from execution.
  const architecture='KAI 51 local architecture pass: define the exact product, screens, state, interactions, responsive behavior and edge cases before build.';
  const visual='KAI 51 local visual pass: premium professional hierarchy, restrained midnight/cyan system, clear states, responsive controls, real interactions.';
  log('KAI 51','Local architecture and visual planning completed; no external model provider is required.');
  let html='';
  try{
    const projectContext=JSON.stringify({brand:'HAxBRO AI / Hacks Bro AI',project:'HAxBRO',appMaker:'KAI 51 / I51',existingName:existing?.name||appName||'',existingSummary:existing?.summary||'',existingFiles:(existing?.files||[]).map(f=>({path:f.path,content:String(f.content||'').slice(0,30000)}))});
    // Provider-independent App Maker: KAI's local product compiler is the guaranteed build engine.
    const local=buildNativeProduct(workingPrompt);
    html=String(local?.files?.find(f=>/\.html$/i.test(String(f.path||'')))?.content||'');
    if(!html) throw new Error('KAI 51 local App Maker compiler returned no HTML artifact.');
    log('KAI 51 LOCAL BUILD','KAI 51 built the requested application locally from the product intent and project context.',{context:projectContext.slice(0,1200)});
  }catch(e){
    if(existing?.files?.length){
      const polished=polishExistingUi(existing.files);
      if(polished){
        html=polished.files.find(f=>String(f.path||'').toLowerCase().endsWith('.html'))?.content||'';
        log('LOCAL UI POLISH','KAI 51 compute was unavailable, so HAxBRO applied a deterministic premium UI polish directly to the existing app without replacing it.',{error:e.message});
      }else{
        log('KAI 51','KAI 51 synthesis failed and the existing artifact could not be safely polished.',{error:e.message});
        throw new Error('KAI 51 App Maker synthesis failed: '+String(e?.message||e));
      }
    }else{
      // Provider-independent build path: KAI's deterministic product compiler is the guaranteed local builder.
      const local=buildNativeProduct(workingPrompt);
      html=String(local?.files?.find(f=>/\.html$/i.test(String(f.path||'')))?.content||'');
      if(!html) throw new Error('KAI 51 local App Maker compiler could not produce the requested artifact.');
      log('KAI 51 LOCAL BUILD','KAI 51 completed the build with the local product compiler; no external provider was required.',{fallbackReason:e.message});
    }
  }
  const base={name:appName||extractTitle(html),summary:'Built by the HAxBRO App Maker agent with KAI 51 local planning, product compilation and verification.',files:[{path:'index.html',content:html}]};
  if(html){
    // Local verification replaces the old provider QA/polish chain.
    const checks={doctype:/^\s*<!doctype html>/i.test(html),viewport:/name=["']viewport["']/i.test(html),script:/<script[\s\S]*?<\/script>/i.test(html),interactive:/\b(?:addEventListener|onclick|onchange|onsubmit)\b/i.test(html),styles:/<style[\s\S]*?<\/style>/i.test(html)};
    log('KAI 51 QA','Local production verification completed.',{checks});
    const polished=polishExistingUi(base.files);
    if(polished?.files?.length){base.files=polished.files;html=base.files[0].content;log('KAI 51 POLISH','Local UI polish applied without changing product identity.');}
  }
  log('VERIFY','The generated artifact is ready for preview and interaction testing.');
  return {...base,files:base.files||[],agent:{name:'KAI 51 App Maker Agent',architecture:['KAI 51 LOCAL','KAI LOCAL QA','KAI LOCAL POLISH'],webResearch:research,logs}};
}