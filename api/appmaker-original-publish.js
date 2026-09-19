export const access = "public";

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  try{
    const html=String(req.body?.html||"");
    if(html.length<20) return res.status(400).json({error:"No app HTML supplied."});

    // Anonymous public static deployment. Keep this server-side so the
    // browser never has to call the hosting provider directly.
    const upstream=await fetch("https://ship.page/deploy",{
      method:"POST",
      headers:{"content-type":"text/html","accept":"application/json"},
      body:html
    });

    const raw=await upstream.text();
    let data={};
    try{data=JSON.parse(raw)}catch{}

    const url=data?.url||data?.data?.url;
    if(!upstream.ok || !url){
      const message=data?.error?.message||data?.error||data?.message||raw||"External host rejected the deployment.";
      return res.status(upstream.status||502).json({error:String(message),provider_status:upstream.status});
    }

    return res.status(200).json({
      url:String(url),
      expires_at:data?.expires_at||data?.data?.expires_at||null,
      claim_token:data?.claim_token||data?.data?.claim_token||null
    });
  }catch(e){
    console.error("external publish proxy failed",e);
    return res.status(502).json({error:e?.message||"External publish connection failed."});
  }
}