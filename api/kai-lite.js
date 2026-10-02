import { browser, ai } from "hatchable";

export const access="public";
export const methods=["POST"];

const clean=(v,n=5000)=>String(v??"").replace(/\u0000/g,"").replace(/\s+/g," ").trim().slice(0,n);

function pageText(html){
  return clean(String(html||"")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi," ")
    .replace(/<[^>]+>/g," "),7000);
}

function htmlDecode(v){
  return String(v||'')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'\"').replace(/&#39;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function decodeBingUrl(href){
  const raw=htmlDecode(href);
  try{
    const u=new URL(raw);
    const encoded=u.searchParams.get('u');
    if(encoded){
      const b=encoded.replace(/^a1/i,'').replace(/-/g,'+').replace(/_/g,'/');
      const padded=b+'='.repeat((4-b.length%4)%4);
      const bin=atob(padded);
      const decoded=decodeURIComponent(Array.from(bin,c=>String.fromCharCode(c.charCodeAt(0))).join(''));
      if(/^https?:\/\//i.test(decoded))return decoded;
    }
  }catch{}
  return raw;
}
async function webRetrieve(query){
  /* Bing's public RSS search feed is fast and stable in managed Chromium.
     Kai Lite scrapes live result titles, URLs and descriptions, then optionally
     reads one real public source without blocking the chat turn on a slow page. */
  const url="https://www.bing.com/search?format=rss&q="+encodeURIComponent(query);
  const html=String(await browser.html(url));
  const items=html.split('<item>').slice(1).map(block=>{
    const readTag=name=>{
      const a=block.indexOf('<'+name+'>');if(a<0)return'';
      const b=block.indexOf('</'+name+'>',a);if(b<0)return'';
      return htmlDecode(block.slice(a+name.length+2,b).trim());
    };
    return {title:readTag('title'),url:readTag('link'),text:readTag('description')};
  }).filter(x=>x.title&&/^https?:\/\//i.test(x.url)).slice(0,8);
  const results=[];
  for(const item of items){
    if(results.some(x=>x.url===item.url))continue;
    results.push(item);
  }
  const first=results[0];
  if(first){
    try{
      const page=await Promise.race([
        browser.html(first.url),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('source timeout')),3000))
      ]);
      const body=pageText(page);
      if(body&&body.length>300)first.text=body.slice(0,9000);
    }catch{}
  }
  return results.slice(0,6);
}

function extractiveAnswer(query,sources){
  const qWords=new Set(clean(query,700).toLowerCase().split(/\W+/).filter(x=>x.length>2));
  const scored=sources.map(s=>{
    const sentences=String(s.text||"").split(/(?<=[.!?])\s+/).filter(Boolean);
    const ranked=sentences.map(sentence=>({sentence,score:[...sentence.toLowerCase().matchAll(/[a-z0-9]+/g)].reduce((n,m)=>n+(qWords.has(m[0])?1:0),0)})).sort((a,b)=>b.score-a.score);
    return {...s,excerpt:ranked.slice(0,3).map(x=>x.sentence).join(" ").slice(0,1200)};
  }).filter(x=>x.excerpt);
  if(!scored.length)return "Kai Lite could not retrieve readable public web content for that request. Try the question again.";
  return "Kai Lite web result:\n\n"+scored.slice(0,3).map((s,i)=>String(i+1)+". "+s.title+"\n"+s.excerpt+"\nSource: "+s.url).join("\n\n");
}

export default async function(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST required"});
  const query=clean(req.body?.message,1800);
  if(!query)return res.status(400).json({error:"message required"});
  try{
    const sources=await webRetrieve(query);
    if(!sources.length)return res.status(502).json({ok:false,error:"Kai Lite could not retrieve public web sources."});
    const context=sources.map((s,i)=>"SOURCE "+(i+1)+": "+s.title+"\nURL: "+s.url+"\nCONTENT:\n"+s.text.slice(0,6000)).join("\n\n");
    try{
      const result=await ai.generateText({
        model:"gpt-mini",
        system:"You are Kai Lite, HAxBRO's fast web-grounded chat layer. Answer naturally and concisely using the retrieved public web material. Do not invent facts. If the sources do not answer the request, say so. For casual conversation, respond naturally without pretending the web was necessary. Never mention internal implementation.",
        messages:[{role:"user",content:"User request: "+query+"\n\nRetrieved public web material:\n"+context}],
        maxOutputTokens:500,
        purpose:"haxbro-kai-lite"
      });
      return res.json({ok:true,response:clean(result.text,6000),provider:"KAI LITE · WEB",model:result.model||"gpt-mini",lite:true,sources:sources.map(({title,url})=>({title,url}))});
    }catch{
      return res.json({ok:true,response:extractiveAnswer(query,sources),provider:"KAI LITE · WEB SCRAPER",model:"web-retrieval",lite:true,sources:sources.map(({title,url})=>({title,url}))});
    }
  }catch(e){
    return res.status(502).json({ok:false,error:"Kai Lite web retrieval unavailable",detail:clean(e?.message,300)});
  }
}