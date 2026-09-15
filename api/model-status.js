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
  const live={
    auto:true,
    openai:false,
    google:true,
    openrouter:false,
    groq:false,
    mistral:false
  };
  res.setHeader('cache-control','no-store');
  return res.json({live,configured:{...live}});
}