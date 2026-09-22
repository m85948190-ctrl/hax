import { ai } from "hatchable";

export const access = "public";
export const methods = ["POST"];

function extractJson(value){
  const raw=String(value||"").trim();
  const fenced=raw.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/i);
  const text=fenced?fenced[1]:raw;
  const a=text.indexOf("{"), b=text.lastIndexOf("}");
  if(a<0||b<a) throw new Error("KAI Builder returned invalid JSON.");
  return JSON.parse(text.slice(a,b+1));
}

function staticInspect(html, request){
  const h=String(html||"");
  const lower=h.toLowerCase();
  const req=String(request||"").toLowerCase();
  const checks=[
    ["doctype", /^\s*<!doctype html>/i.test(h)],
    ["html content", h.length>1200],
    ["javascript", /<script[\s>]/i.test(h)],
    ["interactive controls", /<button|<input|<select|<textarea/i.test(h)],
    ["event behavior", /addEventListener|onclick|onsubmit|oninput|onchange/i.test(h)],
    ["responsive viewport", /name=["']viewport["']/i.test(h)]
  ];
  if(/calculator|calculator app|arithmetic/.test(req)){
    checks.push(["calculator controls", /data-k=|calc|calculator/i.test(lower)]);
    checks.push(["keyboard support", /keydown|keyup/i.test(lower)]);
    checks.push(["clear/delete", /(?:ac|clear|delete|del)/i.test(h)]);
    checks.push(["calculation logic", /(?:operator|precedence|evaluate|calculate|function\s+calculate)/i.test(lower)]);
  }
  if(/game|playable/.test(req)){
    checks.push(["game surface", /canvas|game|requestAnimationFrame/i.test(lower)]);
    checks.push(["game controls", /keydown|pointer|touch|click/i.test(lower)]);
  }
  const passed=checks.filter(x=>x[1]).length;
  return {checks:checks.map(([name,ok])=>({name,ok})),passed,total:checks.length,passRate:passed/checks.length};
}

async function research(query){
  const q=String(query||"").slice(0,500);
  try{
    const r=await fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(q),{headers:{"user-agent":"Mozilla/5.0 HAxBRO-KAI-Builder"}});
    if(!r.ok) return {results:[]};
    const html=await r.text();
    const out=[]; let p=0;
    for(let i=0;i<6;i++){
      const a=html.indexOf('class="result__a"',p); if(a<0) break;
      const gt=html.indexOf(">",a), end=html.indexOf("</a>",gt);
      const title=gt>0&&end>gt?html.slice(gt+1,end).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").trim():"";
      const hrefMatch=html.slice(a,a+1200).match(/href="([^"]+)"/i);
      if(title) out.push({title,url:hrefMatch?.[1]||""});
      p=Math.max(end,a+20);
    }
    return {results:out};
  }catch(e){ return {results:[],error:String(e?.message||e)}; }
}

async function generateDraft(request, plan, evidence){
  const r=await ai.generateText({
    model:"gemini",
    purpose:"haxbro-builder-draft",
    maxTokens:9000,
    system:`You are the BUILD sub-agent inside HAxBRO KAI Builder.
Generate a complete standalone web application from the supplied request and plan.
The product type is authoritative. Never substitute a generic chatbot.
Implement real interactions, not decorative controls.
Return ONLY JSON with:
{"name":string,"summary":string,"html":string,"testChecklist":string[]}
The html must begin with <!doctype html>, be self-contained, and contain inline CSS and JavaScript.
Do not expose chain-of-thought.`,
    prompt:"REQUEST:\n"+request+"\n\nPLAN:\n"+JSON.stringify(plan)+"\n\nRESEARCH:\n"+JSON.stringify(evidence)
  });
  return extractJson(r?.text);
}

async function repairDraft(request, draft, inspection){
  const r=await ai.generateText({
    model:"gpt",
    purpose:"haxbro-builder-repair",
    maxTokens:9500,
    system:`You are the REPAIR sub-agent inside HAxBRO KAI Builder.
Repair the supplied application against the user's request and failed validation checks.
Preserve working functionality. Do not turn the product into a chatbot.
Return ONLY JSON with {"name":string,"summary":string,"html":string,"testChecklist":string[]}.
Return complete standalone HTML, not a patch and not markdown.`,
    prompt:"REQUEST:\n"+request+"\n\nCURRENT BUILD:\n"+String(draft.html||"")+"\n\nVALIDATION:\n"+JSON.stringify(inspection)
  });
  return extractJson(r?.text);
}

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  const request=String(req.body?.prompt||"").trim();
  if(!request) return res.status(400).json({error:"Describe the application you want to build."});
  try{
    let final=null;
    let plan=null;
    let evidence=[];
    let steps=[];

    const planner=await ai.generateText({
      model:"gpt",
      purpose:"haxbro-builder-plan",
      maxTokens:3500,
      system:`You are KAI BUILDER's planning brain.
Determine the actual product type and implementation requirements before code generation.
Do not write code yet.
Never use the implementation format as the product name.
Return ONLY JSON:
{"intent":string,"productType":string,"features":string[],"screens":string[],"state":string[],"architecture":string,"validation":string[],"researchQueries":string[]}
Current request is authoritative.`,
      prompt:request
    });
    plan=extractJson(planner?.text);
    steps.push({stage:"UNDERSTAND",status:"complete",productType:plan.productType});

    const queries=Array.isArray(plan.researchQueries)?plan.researchQueries.slice(0,3):[request+" features interactions",request+" web app UX"];
    for(const q of queries){
      const rr=await research(q);
      evidence.push(...(rr.results||[]));
    }
    steps.push({stage:"RESEARCH",status:"complete",sources:evidence.length});

    final=await generateDraft(request,plan,evidence.slice(0,10));
    steps.push({stage:"BUILD",status:"complete"});

    let inspection=staticInspect(final.html,request);
    steps.push({stage:"VALIDATE",status:inspection.passRate>=0.8?"pass":"repair_required",checks:inspection.checks});

    for(let attempt=0;attempt<2 && inspection.passRate<0.8;attempt++){
      final=await repairDraft(request,final,inspection);
      inspection=staticInspect(final.html,request);
      steps.push({stage:"REPAIR_"+(attempt+1),status:inspection.passRate>=0.8?"pass":"repair_required",checks:inspection.checks});
    }

    // Hard product-type guard against the failure mode we are replacing.
    if(/marketing|post generator|campaign|instagram/.test(request.toLowerCase()) &&
       /chatbot|ask me anything|thinking\.\.\.|chat assistant/i.test(String(final.html))){
      final=await repairDraft(request,final,{checks:[{name:"product type",ok:false}],passed:0,total:1,passRate:0});
      inspection=staticInspect(final.html,request);
    }

    if(!final?.html || !/^\s*<!doctype html>/i.test(final.html) || final.html.length<1200)
      throw new Error("KAI Builder could not produce a valid application.");

    return res.json({
      name:String(final.name||plan.productType||"HAxBRO App").slice(0,100),
      summary:String(final.summary||"Functional application generated by KAI Builder."),
      files:[{path:"public/index.html",content:final.html}],
      published:false,
      publicUrl:"",
      testChecklist:Array.isArray(final.testChecklist)?final.testChecklist:plan.validation||[],
      plan,
      agent:"KAI BUILDER",
      steps,
      validation:inspection
    });
  }catch(e){
    console.error("KAI Builder error",e);
    return res.status(500).json({error:e?.message||"KAI Builder failed",agent:"KAI BUILDER"});
  }
}