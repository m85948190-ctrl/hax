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
  // Report the provider surface without exposing raw provider credentials.
  const configured={openrouter:true,groq:true,mistral:true,cerebras:true,google:true,openai:true};
  const live={auto:true,...configured,kai51:true,kai89:true};
  res.setHeader('cache-control','no-store');
  return res.json({live,configured:{...live}});
}