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
      try{const host=new URL(url).hostname;if(host.includes("google.")||host.includes("duckduckgo.")||host.includes("bing."))continue}catch{}
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
        seen.add(href);
        const block=a.closest('div.MjjYud')||a.parentElement?.parentElement||a.parentElement;
        const text=(block?.innerText||block?.textContent||'').replace(/\\s+/g,' ').trim().slice(0,1400);
        out.push({title,url:href,text});
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

async function bingSearch(query){
  const url="https://www.bing.com/search?q="+encodeURIComponent(query);
  return browser.session(async page=>{
    await page.goto(url,{waitUntil:"domcontentloaded"});
    return await page.evaluate(()=>{
      const out=[];const seen=new Set();
      for(const a of Array.from(document.querySelectorAll("li.b_algo h2 a, h2 a"))){
        const href=a.href||"",title=(a.innerText||a.textContent||"").replace(/\\s+/g," ").trim();
        if((!href.startsWith("http://")&&!href.startsWith("https://"))||!title||seen.has(href))continue;
        let host="";try{host=new URL(href).hostname}catch{continue}
        if(host.includes("bing.com"))continue;
        seen.add(href);
        const block=a.closest("li.b_algo")||a.parentElement?.parentElement||a.parentElement;
        const text=(block?.innerText||block?.textContent||"").replace(/\\s+/g," ").trim().slice(0,1400);
        out.push({title,url:href,text});
        if(out.length>=8)break;
      }
      return out;
    });
  });
}

async function multiSearch(query,mode="fast"){
  const variants=queryVariants(query);
  const primary=variants.slice(0,mode==="deep"?3:1);
  // Google and Bing run concurrently; never wait for one engine to fail before starting the other.
  const deadline=mode==="deep"?5000:1800;
  const settled=await Promise.race([
    Promise.all([
      Promise.all(primary.map(async q=>{try{return await googleSearch(q)}catch{return []}})),
      Promise.all(primary.map(async q=>{try{return await bingSearch(q)}catch{return []}}))
    ]),
    new Promise(resolve=>setTimeout(()=>resolve([[],[]]),deadline))
  ]);
  const [googleResults,bingResults]=settled||[[],[]];
  const collect=(lists,engine,limit)=>{const out=[],seen=new Set();for(const list of lists||[])for(const x of list||[]){if(!x?.url||seen.has(x.url))continue;seen.add(x.url);out.push({...x,engine});if(out.length>=limit)return out;}return out;};
  const google=collect(googleResults,"Google Web",6);
  const bing=collect(bingResults,"Bing Web",6);
  const merged=[],seen=new Set();
  // Interleave results so one engine cannot monopolize the evidence set.
  for(let i=0;i<Math.max(google.length,bing.length);i++){for(const x of [google[i],bing[i]])if(x&&!seen.has(x.url)){seen.add(x.url);merged.push(x);}}
  if(merged.length)return {links:merged.slice(0,mode==="deep"?12:8),engine:"Google + Bing Web",engines:{google:google.length,bing:bing.length}};
  const fallbackResults=await Promise.all(primary.slice(0,2).map(async q=>{try{return await ddgSearch(q)}catch{return []}}));
  return {links:collect(fallbackResults,"Fallback Web Search",8),engine:"Fallback Web Search"};
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
    const searched=await multiSearch(query,mode);
    const links=searched.links||[];
    const take=mode==="deep"?5:3;
    const pages=await Promise.all(links.slice(0,take).map(async x=>{
      const snippet=clean(x.text||"",1400);
      if(snippet.length>=90)return {...x,text:snippet};
      try{
        const timeout=mode==="deep"?2200:650;
        const html=await Promise.race([browser.html(x.url),new Promise((_,reject)=>setTimeout(()=>reject(new Error("source timeout")),timeout))]);
        const text=pageText(html);
        return {...x,text:text.length>snippet.length?text:snippet};
      }catch{return {...x,text:snippet}}
    }));
    return res.json({ok:true,engine:searched.engine,mode,query,searchQueries:queryVariants(query),sources:pages.filter(x=>x.text||x.title).slice(0,take)});
  }catch(e){
    return res.status(502).json({ok:false,error:"KAI web search unavailable",detail:clean(e?.message,300)});
  }
}