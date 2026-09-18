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
  // Provider credentials are intentionally kept behind Hatchable's server-side AI capability.
  // This endpoint reports the configured routing surface, not a claim that every upstream key is healthy.
  const configured={openai:true,google:true,openrouter:true,groq:true,mistral:true};
  const live={auto:true,...configured};
  res.setHeader('cache-control','no-store');
  return res.json({live,configured:{...live}});
}