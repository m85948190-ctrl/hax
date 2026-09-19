export const access = "public";

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST required"});
  try{
    const body=req.body||{};
    const html=String(body.html||"");
    if(html.length<20) return res.status(400).json({error:"No app HTML supplied."});

    // PageDrop's documented API is the pagedrop.dev REST endpoint. It is
    // intended for programmatic/CI use; keep the upstream request server-side
    // so browser Origin/Sec-Fetch restrictions never reach the provider.
    const upstream=await fetch("https://pagedrop.dev/api/v1/sites",{
      method:"POST",
      headers:{"content-type":"application/json","accept":"application/json"},
      body:JSON.stringify({html})
    });

    const raw=await upstream.text();
    let data=null;
    try{ data=JSON.parse(raw); }catch{}

    const url=data?.data?.url||data?.url;
    if(!upstream.ok || !url){
      const message=data?.message||data?.error?.message||data?.error||raw||"External host rejected the deployment.";
      return res.status(upstream.status||502).json({error:String(message),provider_status:upstream.status});
    }

    return res.status(200).json({
      url:String(url),
      site_id:data?.data?.siteId||data?.siteId||null,
      delete_token:data?.data?.deleteToken||data?.deleteToken||null,
      expires_at:data?.data?.expiresAt||data?.expiresAt||null
    });
  }catch(e){
    console.error("external publish proxy failed",e);
    return res.status(502).json({error:e?.message||"External publish connection failed."});
  }
}