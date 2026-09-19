export const access = "public";

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  try{
    const body=req.body||{};
    const html=String(body.html||"");
    if(html.length<20) return res.status(400).json({error:"No app HTML supplied."});
    const upstream=await fetch("https://pagedrop.dev/api/v1/sites",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({html})
    });
    const text=await upstream.text();
    let data={};
    try{data=JSON.parse(text)}catch{data={error:text||"External host returned invalid JSON."}}
    if(!upstream.ok || !data.url){
      return res.status(upstream.status||502).json({error:data.error||"External host rejected the deployment."});
    }
    return res.json({url:String(data.url),expires_at:data.expires_at||null});
  }catch(e){
    console.error("external publish proxy failed",e);
    return res.status(502).json({error:e?.message||"External publish connection failed."});
  }
}