import { ai } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const clean=(v,n=12000)=>String(v??"").slice(0,n);

function answerFromEvidence(question, report){
  const q=String(question||"").toLowerCase();
  const r=report||{};
  const sc=r.sourceCode||{};
  const meta=sc.meta||{};
  const tech=(r.technologies||[]).join(", ")||"No technology was confidently detected.";
  const scripts=(r.scripts||[]).length;
  const links=(r.publicLinks||[]).length;
  if(/who (made|created|built|developed|designed)|creator|author|developer/.test(q)){
    const author=meta.author||r.pageXray?.author||"";
    return author
      ? "Public evidence identifies the author/creator as: "+author+". This is a public-page attribution, not independent proof of ownership."
      : "The public evidence collected by X Pro does not establish who made or owns this site. I won't invent a creator name.";
  }
  if(/what (is|are).*tech|technolog|framework|stack|cms|built with/.test(q)){
    return "Detected technology signals: "+tech+"\nExternal scripts: "+scripts+"\nPublic links: "+links+".\nThese are evidence-based detections from the returned page/source and may not reveal the complete backend stack.";
  }
  if(/how (was|is).*made|how.*built|architecture|structure|source|code|each|detail/.test(q)){
    const layers=r.pageXray?.layers||[];
    return [
      "X Pro reconstruction from public evidence:",
      "",
      "1. Page identity: "+(meta.title||"No public title detected."),
      "2. Technology signals: "+tech,
      "3. External JavaScript assets: "+scripts,
      "4. Public links: "+links,
      "5. Inline scripts: "+((sc.inlineScripts||[]).length),
      "6. Forms: "+((sc.forms||[]).length),
      "7. Source size: "+(sc.sourceBytes??r.responseSizeBytes??"unknown")+" bytes",
      "8. Structure signals: "+layers.map(x=>x.name+": "+x.detail).join(" | "),
      "",
      "This describes what can be reconstructed from public HTML, headers, scripts and linked assets. Server-side source, private databases, deployment pipelines and private APIs are not visible unless publicly exposed."
    ].join("\n");
  }
  return "";
}

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"Method not allowed"});
  const q=clean(req.body?.question,4000).trim();
  let report=req.body?.report;
  if(!q||!report) return res.status(400).json({ok:false,error:"A report and follow-up question are required."});
  if(typeof report==="string"){try{report=JSON.parse(report)}catch{report={raw:clean(report,12000)}}}
  const deterministic=answerFromEvidence(q,report);
  if(deterministic) return res.json({ok:true,answer:deterministic,engine:"KAI 12 · X PRO EVIDENCE NODE",nodes:["TARGET","IDENTITY","SOURCE","TECH","ASSETS","STRUCTURE","DATA FLOW","SECURITY","EXPOSURE","CORRELATION","RECONSTRUCTION","REPORT"]});
  try{
    const context=clean(JSON.stringify(report),24000);
    const result=await ai.generateText({
      model:"auto",
      maxTokens:2200,
      temperature:0.15,
      purpose:"xpro-followup",
      system:"You are KAI 12 operating inside HAxBRO X Pro. Answer only from the supplied public-web investigation evidence. Do not invent ownership, private backend details, credentials, or hidden implementation. Clearly distinguish observed evidence from inference. If the evidence cannot answer the question, say what is missing. Be precise and technical.",
      prompt:"COMPLETED X PRO REPORT:\n"+context+"\n\nFOLLOW-UP QUESTION:\n"+q
    });
    return res.json({ok:true,answer:String(result?.text||"No evidence-backed answer was returned."),engine:"KAI 12 · X PRO EVIDENCE NODE",nodes:["TARGET","IDENTITY","SOURCE","TECH","ASSETS","STRUCTURE","DATA FLOW","SECURITY","EXPOSURE","CORRELATION","RECONSTRUCTION","REPORT"],provider:result?.provider||null});
  }catch(e){
    return res.status(503).json({ok:false,error:"KAI 12 follow-up could not complete the synthesis from the evidence.",detail:clean(e?.message||e,300)});
  }
}