export const access = "public";
export const methods = ["POST"];

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  const prompt=String(req.body?.prompt||"").trim();
  if(!prompt) return res.status(400).json({error:"Describe the app you want to build."});
  try{
    const origin=req.headers?.origin||"";
    const base=origin && /^https?:\/\//i.test(origin) ? origin : "https://haxbro.hatchable.site";
    const r=await fetch(base+"/api/app-builder",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:prompt.slice(0,12000),username:req.body?.username||"app-maker",kaiMode:"deep",kai51Context:{mode:"KAI DEEP",workspace:"APP MAKER",policy:"KAI-first; public web retrieval for requirements; external model/API only as recovery compute",goal:"Understand the product before implementation and build the requested product itself, not a generic chatbot."}})});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json(data);
    return res.json(data);
  }catch(e){
    console.error("App Maker Builder bridge error",e);
    return res.status(500).json({error:e?.message||"KAI Builder connection failed"});
  }
}