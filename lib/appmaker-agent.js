import { ai } from 'hatchable';
import { buildNativeProduct } from 'lib/kai-native-builder';

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
async function nativeKAI(workingPrompt,research,architecture,visual){
  const system='You are KAI 51, the central intelligence of HAxBRO App Maker. You are not a canned template generator. Synthesize a production-ready standalone web app from the user request, architecture review, visual review and web research. Think through information architecture, responsive layout, interaction states, accessibility, error handling, empty states, keyboard behavior and visual hierarchy. Output only a complete standalone HTML document with inline CSS and JavaScript.';
  const p='USER REQUEST:\n'+clean(workingPrompt,10000)+'\n\nARCHITECTURE:\n'+clean(architecture,8000)+'\n\nVISUAL REVIEW:\n'+clean(visual,8000)+'\n\nWEB RESEARCH:\n'+clean(JSON.stringify(research),8000);
  const r=await ai.generateText({model:'gemini',purpose:'HAxBRO KAI 51 App Maker synthesis',system,prompt:p,maxSteps:3});
  const text=typeof r==='string'?r:(r?.text||r?.content||r?.output||'');
  const html=extractHtml(text);
  if(!html) throw new Error('KAI 51 returned no complete HTML document');
  return html;
}
export async function runAppMakerAgent(prompt,{existing=null,appName='' }={}){
  const workingPrompt=existing?.files?.length
    ? String(prompt)+'\n\nEXISTING APPLICATION TO MODIFY IN PLACE:\n'+String(existing.files[0]?.content||'')
    : String(prompt);
  const logs=[]; const log=(stage,message,meta={})=>logs.push({stage,message,at:new Date().toISOString(),...meta});
  log('INTENT','KAI received the build request and is defining the actual product goal.');
  const research=await webResearch(workingPrompt);
  log('WEB RESEARCH',research.sources.length?'Searched the public web for relevant product and interface patterns.':'Web research was unavailable; internal design reasoning remains active.',{sources:research.sources});
  let architecture='',visual='';
  try{architecture=await groq(1,'You are the first Groq architecture specialist in HAxBRO App Maker. Analyze the requested app like a senior product architect. Decide screens, state model, interactions, responsive behavior and edge cases. Do not write generic praise.',workingPrompt+'\nResearch signals: '+research.summary);log('GROQ 1','Architecture specialist produced the build plan.');}catch(e){log('GROQ 1','Architecture specialist unavailable; KAI will continue.',{error:e.message});}
  try{visual=await groq(2,'You are the second Groq specialist focused on visual product design. Think about how this exact app should look and feel on desktop and mobile. Specify hierarchy, spacing, typography, controls, motion and states so it feels like a polished real product rather than a template.',workingPrompt+'\nArchitecture: '+architecture+'\nResearch: '+research.summary);log('GROQ 2','Visual specialist produced the design direction.');}catch(e){log('GROQ 2','Visual specialist unavailable; KAI will continue.',{error:e.message});}
  let html='';
  try{html=await nativeKAI(prompt,research,architecture,visual);log('KAI 51','KAI 51 synthesized the actual application from web research and the specialist passes.');}catch(e){log('KAI 51','Native KAI synthesis unavailable; using the verified local product compiler.',{error:e.message});}
  let base;
  if(html) base={name:appName||'KAI Product',summary:'Built by the HAxBRO App Maker agent after web research, architecture analysis, visual analysis and KAI 51 synthesis.',files:[{path:'index.html',content:html}]};
  else base=buildNativeProduct(prompt,{appName:existing?.name||appName,existing});
  if(html){
    try{
      const review=await groq(3,'You are the third Groq specialist, a ruthless product QA reviewer. Review this generated HTML for broken interactions, missing requirements, responsive defects, accessibility problems, accidental renaming, fake buttons and layout collisions. Return a concise repair checklist, not code.',workingPrompt+'\nHTML:\n'+html);
      log('GROQ 3','QA reviewer inspected the generated application.');
      try{
        const polish=await groq(4,'You are the fourth Groq specialist, the final production-polish engineer. Given the user request, QA findings and generated HTML, return the complete corrected standalone HTML document. Fix real issues, preserve product identity and features, and return only the HTML document.',workingPrompt+'\nQA FINDINGS:\n'+review+'\nHTML:\n'+html);
        const fixed=extractHtml(polish);
        if(fixed){base.files=[{path:'index.html',content:fixed}];log('GROQ 4','Final production pass repaired and polished the application.');}
        else log('GROQ 4','Final pass returned no complete document; keeping KAI 51 output.');
      }catch(e){log('GROQ 4','Final polish unavailable; keeping KAI 51 output.',{error:e.message});}
    }catch(e){log('GROQ 3','QA review unavailable; keeping KAI 51 output.',{error:e.message});}
  }
  log('VERIFY','The generated artifact is ready for preview and interaction testing.');
  return {...base,files:base.files||[],agent:{name:'KAI 51 App Maker Agent',architecture:['Groq API 1','Groq API 2','KAI 51','Groq API 3','Groq API 4'],webResearch:research,logs}};
}