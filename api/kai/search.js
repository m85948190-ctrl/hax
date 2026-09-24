import { browser } from "hatchable";
export const access="public";
export const methods=["POST"];

const clean=(v,n=5000)=>String(v??"").replace(/\u0000/g,"").replace(/\s+/g," ").trim().slice(0,n);

function extractLinks(html){
  const out=[];const s=String(html||"");let m;
  const re=/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  while((m=re.exec(s))&&out.length<8){
    let url=m[1].replace(/&amp;/g,"&");
    const title=clean(m[2].replace(/<[^>]+>/g," "));
    if(!title)continue;
    if(url.startsWith("/url?q="))try{url=decodeURIComponent(url.slice(7).split("&")[0])}catch{}
    if(url.startsWith("//"))url="https:"+url;
    if(/^https?:\/\//i.test(url)){
      try{if(new URL(url).hostname.includes("google."))continue}catch{}
      if(!out.some(x=>x.url===url))out.push({title,url});
    }
  }
  return out;
}

const pageText=html=>clean(String(html||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," "),6000);

async function googleSearch(query){
  const url="https://www.google.com/search?gbv=1&hl=en&q="+encodeURIComponent(query);
  return browser.session(async page=>{
    await page.goto(url,{waitUntil:"domcontentloaded"});
    return await page.evaluate(()=>{
      const out=[];const seen=new Set();
      for(const a of Array.from(document.querySelectorAll('a'))){
        const href=a.href||'',title=(a.innerText||a.textContent||'').replace(/\\s+/g,' ').trim();
        if(!href.startsWith('http://')&&!href.startsWith('https://'))continue;
        let host='';try{host=new URL(href).hostname}catch{continue}
        if(host.includes('google.'))continue;
        if(!title||seen.has(href))continue;
        seen.add(href);out.push({title,url:href});
        if(out.length>=6)break;
      }
      return out;
    });
  });
}

function queryVariants(query){
  const q=clean(query,700).trim();
  if(!q)return [];
  const short=/^[a-z0-9][a-z0-9._-]{1,40}$/i.test(q);
  if(!short)return [q];
  return [
    `"${q}" meaning`,
    `"${q}" definition`,
    `"${q}" slang`,
    `"${q}" abbreviation`,
    `"${q}" typo`,
    `"${q}"`
  ];
}

async function multiSearch(query){
  const variants=queryVariants(query);
  const googleResults=await Promise.all(variants.map(async q=>{
    try{return await googleSearch(q)}catch{return []}
  }));
  const links=[];const seen=new Set();
  for(const list of googleResults)for(const x of list){
    if(!seen.has(x.url)){seen.add(x.url);links.push(x)}
    if(links.length>=12)break;
  }
  if(links.length)return {links,engine:"Google Web"};
  const fallbackResults=await Promise.all(variants.slice(0,4).map(async q=>{
    try{return await ddgSearch(q)}catch{return []}
  }));
  const fallback=[];const seenFallback=new Set();
  for(const list of fallbackResults)for(const x of list){
    if(!seenFallback.has(x.url)){seenFallback.add(x.url);fallback.push(x)}
    if(fallback.length>=12)break;
  }
  return {links:fallback,engine:fallback.length?"Fallback Web Search":"Web Search"};
}

async function ddgSearch(query){
  const sr=await fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(query),{headers:{"user-agent":"Mozilla/5.0 HAxBRO-KAI-Web"}});
  if(!sr.ok)throw new Error("fallback search HTTP "+sr.status);
  return extractLinks(await sr.text()).slice(0,6);
}

export default async function(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST required"});
  const query=clean(req.body?.query,700);
  if(!query)return res.status(400).json({error:"query required"});
  const mode=req.body?.mode==="deep"?"deep":"fast";
  try{
    const searched=await multiSearch(query);
    const links=searched.links||[];
    const take=mode==="deep"?5:4;
    const pages=await Promise.all(links.slice(0,take).map(async x=>{try{return {...x,text:pageText(await browser.html(x.url))}}catch{return {...x,text:""}}}));
    return res.json({ok:true,engine:searched.engine,mode,query,searchQueries:queryVariants(query),sources:pages.filter(x=>x.text).slice(0,take)});
  }catch(e){
    return res.status(502).json({ok:false,error:"KAI web search unavailable",detail:clean(e?.message,300)});
  }
}