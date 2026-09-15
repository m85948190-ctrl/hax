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
  // Only expose models that are actually usable by the current HAxBRO API
  // configuration. A secret being present is NOT proof that the provider works.
  // The current live probe confirms Gemini is responding; OpenAI is returning
  // 401, OpenRouter is returning 401/404, Mistral is rate-limited, and the
  // Cloudflare Astra request is returning 401. Keep those choices disabled so
  // the UI cannot route users straight into a known-broken provider.
  const cloudflareToken=!!String(process.env.CLOUDFLARE_AI_API_TOKEN||'');
  const cloudflareAccount=!!String(process.env.CLOUDFLARE_ACCOUNT_ID||'');
  const live={
    auto:true,
    openai:false,
    google:true,
    openrouter:false,
    groq:false,
    mistral:false,
    astra:false
  };
  res.setHeader('cache-control','no-store');
  return res.json({live,configured:{...live},astraDiagnostics:{token:cloudflareToken,accountId:cloudflareAccount,status:'401 authentication error'}});
}