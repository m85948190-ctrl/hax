export const access = 'public';
export const methods = ['GET','OPTIONS'];

function cors(res){
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-methods','GET, OPTIONS');
  res.setHeader('access-control-allow-headers','content-type');
}

export default async function(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).send('');
  // OpenAI + Google are declared through Hatchable's managed [ai] capability;
  // OpenRouter is a required HAxBRO secret. Optional providers stay disabled
  // until their routes are explicitly configured.
  const cloudflareToken=!!String(process.env.CLOUDFLARE_AI_API_TOKEN||'');
  const cloudflareAccount=!!String(process.env.CLOUDFLARE_ACCOUNT_ID||'');
  const live={
    auto:true,
    openai:true,
    google:true,
    openrouter:true,
    groq:false,
    mistral:false,
    astra:cloudflareToken&&cloudflareAccount
  };
  res.setHeader('cache-control','no-store');
  return res.json({live,configured:{...live},astraDiagnostics:{token:cloudflareToken,accountId:cloudflareAccount}});
}