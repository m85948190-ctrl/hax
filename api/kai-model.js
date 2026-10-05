export const access='public';
export const methods=['GET','HEAD','OPTIONS'];

const OWNER='m85948190-ctrl';
const REPO='haxbro';
const TAG='kai51-model-latest';
let manifestPromise=null;

async function manifest(){
  if(manifestPromise)return manifestPromise;
  manifestPromise=(async()=>{
    const r=await fetch('https://api.github.com/repos/'+OWNER+'/'+REPO+'/releases/tags/'+TAG,{
      headers:{Accept:'application/vnd.github+json','User-Agent':'HAxBRO-KAI51-Proxy'}
    });
    if(!r.ok)throw new Error('GitHub release lookup failed: '+r.status);
    const data=await r.json();
    const map={};
    for(const a of (data.assets||[]))map[String(a.name)]=a;
    return map;
  })().catch(e=>{manifestPromise=null;throw e});
  return manifestPromise;
}

function requestedName(req){
  const raw=String(req.query?.file||'').trim();
  try{return decodeURIComponent(raw).split('/').pop()}catch{return raw.split('/').pop()}
}

export default async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Range,Accept,Content-Type');
  res.setHeader('Access-Control-Expose-Headers','Content-Length,Content-Range,Accept-Ranges,ETag');
  res.setHeader('Vary','Origin');
  if(req.method==='OPTIONS')return res.status(204).send('');
  const name=requestedName(req);
  if(!name)return res.status(400).send('Missing model asset name.');

  let assets;
  try{assets=await manifest()}catch(e){return res.status(502).send('KAI 51 model manifest unavailable.')}
  const asset=assets[name]||Object.values(assets).find(a=>String(a.name).endsWith('/'+name));
  if(!asset)return res.status(404).send('KAI 51 model asset not found: '+name);

  const headers={
    Accept:'application/octet-stream',
    'User-Agent':'HAxBRO-KAI51-Proxy'
  };
  const range=req.headers?.range||req.headers?.Range;
  if(range)headers.Range=range;

  const upstream=await fetch('https://api.github.com/repos/'+OWNER+'/'+REPO+'/releases/assets/'+asset.id,{
    headers,
    redirect:'follow'
  });
  if(!upstream.ok)return res.status(upstream.status).send('KAI 51 model asset fetch failed: '+name);

  res.setHeader('Content-Type',upstream.headers.get('content-type')||'application/octet-stream');
  res.setHeader('Cache-Control','public,max-age=31536000,immutable');
  res.setHeader('Accept-Ranges',upstream.headers.get('accept-ranges')||'bytes');
  for(const h of ['content-length','content-range','etag']){
    const v=upstream.headers.get(h);
    if(v)res.setHeader(h==='content-length'?'Content-Length':h==='content-range'?'Content-Range':'ETag',v);
  }
  if(req.method==='HEAD')return res.status(upstream.status).send('');
  // Stream large ONNX assets instead of buffering hundreds of MB in one isolate.
  // The browser needs the GitHub release bytes intact and supports ranged requests.
  if(upstream.body && typeof res.write==='function' && typeof res.end==='function'){
    res.status(upstream.status);
    const reader=upstream.body.getReader();
    try{
      while(true){
        const part=await reader.read();
        if(part.done)break;
        if(part.value?.length)res.write(Buffer.from(part.value));
      }
    }finally{
      try{reader.releaseLock()}catch{}
    }
    return res.end();
  }
  return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
}