const CHUNK=8*1024*1024;
const isModel=(url)=>url.origin===self.location.origin&&url.pathname==='/api/kai-model'&&/model_q4(?:f16)?\.onnx/i.test(url.searchParams.get('file')||'')&&!url.searchParams.has('sw');

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

function rangeInfo(value,total){
  const m=String(value||'').match(/^bytes=(\d+)-(\d*)$/i);
  if(!m)return {start:0,end:total-1,partial:false};
  return {start:Number(m[1]),end:m[2]===''?total-1:Number(m[2]),partial:true};
}
function rangedUrl(url,start,end){
  const u=new URL(url);
  u.searchParams.set('sw','1');
  return u.toString();
}
async function getPart(url,start,end,request){
  const h=new Headers(request.headers);
  h.set('Range','bytes='+start+'-'+end);
  return fetch(rangedUrl(url,start,end),{method:'GET',headers:h,credentials:'omit',cache:'force-cache'});
}
async function modelResponse(request){
  const url=new URL(request.url);
  const probe=await getPart(url,0,CHUNK-1,request);
  if(!probe.ok&&probe.status!==206)return probe;
  const cr=probe.headers.get('content-range')||'';
  const total=Number(cr.split('/')[1]||0);
  if(!total)return probe;
  const info=rangeInfo(request.headers.get('range'),total);
  if(info.partial&&info.end-info.start<CHUNK)return getPart(url,info.start,info.end,request);
  const start=info.start;
  const end=Math.min(info.end,total-1);
  const parts=new Map();
  parts.set(start,new Uint8Array(await probe.arrayBuffer()));
  const starts=[];
  for(let s=Math.max(start+CHUNK,CHUNK);s<=end;s+=CHUNK)starts.push(s);
  const firstEnd=Math.min(start+CHUNK-1,end);
  let cursor=firstEnd+1;
  while(cursor<=end){starts.push(cursor);cursor+=CHUNK}
  const unique=[...new Set(starts)].filter(s=>s<=end&&s!==start);
  for(let i=0;i<unique.length;i+=4){
    const batch=unique.slice(i,i+4);
    const got=await Promise.all(batch.map(async s=>{
      const e=Math.min(end,s+CHUNK-1);
      const r=await getPart(url,s,e,request);
      if(!r.ok||r.status!==206)throw new Error('KAI 51 model range '+s+'-'+e+' failed: HTTP '+r.status);
      return {s,b:new Uint8Array(await r.arrayBuffer())};
    }));
    for(const x of got)parts.set(x.s,x.b);
  }
  const ordered=[];
  let pos=start;
  while(pos<=end){
    const b=parts.get(pos);
    if(!b)throw new Error('KAI 51 model range assembly gap at '+pos);
    ordered.push(b);
    pos+=b.byteLength;
  }
  const bytes=new Uint8Array(ordered.reduce((n,b)=>n+b.byteLength,0));
  let off=0;
  for(const b of ordered){bytes.set(b,off);off+=b.byteLength}
  const headers=new Headers({
    'Content-Type':'application/octet-stream',
    'Content-Length':String(bytes.byteLength),
    'Accept-Ranges':'bytes',
    'Cache-Control':'public,max-age=31536000,immutable'
  });
  if(info.partial)headers.set('Content-Range','bytes '+start+'-'+end+'/'+total);
  return new Response(bytes,{status:info.partial?206:200,headers});
}
// KAI 51 model transport is now handled directly by /api/kai-model and
// Transformers.js browser caching. Do not assemble the 386 MB model in a
// service-worker Response: that creates an avoidable large transient memory peak.
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);const match=url.origin===self.location.origin&&url.pathname.startsWith('/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/');if(!match)return;const file=decodeURIComponent(url.pathname.split('/').pop()||'');if(!file)return;const target=new URL('/api/kai-model',self.location.origin);target.searchParams.set('file',file);event.respondWith(fetch(new Request(target.toString(),{method:event.request.method,headers:event.request.headers,credentials:'omit',cache:'no-store'})));});