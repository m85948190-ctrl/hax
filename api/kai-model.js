export const access='public';
const ASSETS={
  "config.json":"609319996",
  "generation_config.json":"609319997",
  "MODEL-MANIFEST.json":"609319995",
  "model_q4.onnx":"609320000",
  "model_q4f16.onnx":"609319994",
  "special_tokens_map.json":"609320010",
  "tokenizer.json":"609320008",
  "tokenizer_config.json":"609320011"
};
export const methods=['GET','HEAD','OPTIONS'];
export default async function(req,res){
  if(req.method==='OPTIONS') return res.status(204).set({'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Range,Accept,Content-Type','Access-Control-Expose-Headers':'Content-Length,Content-Range,Accept-Ranges'}).send('');
  const raw=String(req.query?.file||'').replace(/^.*\//,'');
  const asset=ASSETS[raw];
  if(!asset) return res.status(404).json({error:'Unknown KAI 51 model asset'});
  const url='https://api.github.com/repos/m85948190-ctrl/haxbro/releases/assets/'+asset;
  const headers={'Accept':'application/octet-stream','User-Agent':'HAxBRO-KAI51'};
  const range=req.headers?.range||req.headers?.Range;
  if(range) headers.Range=range;
  const upstream=await fetch(url,{headers,redirect:'follow'});
  if(!upstream.ok) return res.status(upstream.status).send('KAI 51 model asset fetch failed');
  const body=req.method==='HEAD'?null:Buffer.from(await upstream.arrayBuffer());
  const out={
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Expose-Headers':'Content-Length,Content-Range,Accept-Ranges',
    'Cache-Control':'public,max-age=31536000,immutable',
    'Accept-Ranges':upstream.headers.get('accept-ranges')||'bytes',
    'Content-Type':upstream.headers.get('content-type')||'application/octet-stream'
  };
  for(const h of ['content-length','content-range']){const v=upstream.headers.get(h);if(v)out[h==='content-length'?'Content-Length':'Content-Range']=v;}
  return res.status(upstream.status).set(out).send(body);
}