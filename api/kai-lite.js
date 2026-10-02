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

async function webRetrieve(query){
  const url="https://www.google.com/search?gbv=1&hl=en&q="+encodeURIComponent(query);
  const links=await browser.session(async page=>{
    await page.goto(url,{waitUntil:"domcontentloaded"});
    return await page.evaluate(()=>{
      const out=[],seen=new Set();
      for(const a of Array.from(document.querySelectorAll("a"))){
        const href=a.href||"",title=(a.innerText||a.textContent||"").replace(/\s+/g," ").trim();
        if(!/^https?:\/\//i.test(href)||!title)continue;
        let host="";try{host=new URL(href).hostname}catch{continue}
        if(/google\./i.test(host)||seen.has(href))continue;
        seen.add(href);out.push({title,url:href});
        if(out.length>=6)break;
      }
      return out;
    });
  });
  const pages=[];
  for(const link of links.slice(0,4)){
    try{const html=await browser.html(link.url);const text=pageText(html);if(text)pages.push({...link,text});}catch{}
  }
  return pages;
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