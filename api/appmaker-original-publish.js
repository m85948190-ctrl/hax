export const access = "public";

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  try{
    const body=req.body||{};
    const html=String(body.html||"");
    if(html.length<20) return res.status(400).json({error:"No app HTML supplied."});
    const upstream=await fetch("https://pagedrop.io/api/upload",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({html,ttl:"3d",fileName:"haxbro-app.html",visibility:"public"})
    });
    const text=await upstream.text();
    let data={};
    try{data=JSON.parse(text)}catch{data={error:text||"External host returned invalid JSON."}}
    const url=data?.data?.url||data?.url;
    if(!upstream.ok || !url){
      const message=typeof data?.error==="string"?data.error:(data?.error?.message||"External host rejected the deployment.");
      return res.status(upstream.status||502).json({error:message});
    }
    return res.json({url:String(url),expires_at:data?.data?.expires_at||data?.expires_at||null});
  }catch(e){
    console.error("external publish proxy failed",e);
    return res.status(502).json({error:e?.message||"External publish connection failed."});
  }
}