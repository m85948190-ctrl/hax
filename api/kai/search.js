import { browser } from "hatchable";
export const access="public";
export const methods=["POST"];
const clean=(v,n=5000)=>String(v??"").replace(/\u0000/g,"").replace(/\s+/g," ").trim().slice(0,n);
function linksFrom(html){
  const out=[];const s=String(html||"");
  const re=/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(s))&&out.length<8){
    const href=m[1];const title=clean(m[2].replace(/<[^>]+>/g," "));
    if(!title||/bing|microsoft|google|duckduckgo/i.test(href))continue;
    let url=href;const q=url.match(/[?&]uddg=([^&]+)/i);if(q)try{url=decodeURIComponent(q[1])}catch{}
    if(/^https?:\/\//i.test(url)&&!out.some(x=>x.url===url))out.push({title,url});
  }return out;
}
const pageText=html=>clean(String(html||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," "),6000);
export default async function(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST required"});
  const query=clean(req.body?.query,700);if(!query)return res.status(400).json({error:"query required"});
  try{
    const searchHtml=await browser.html("https://www.bing.com/search?q="+encodeURIComponent(query));
    const links=linksFrom(searchHtml).slice(0,5);
    const pages=await Promise.all(links.map(async x=>{try{return {...x,text:pageText(await browser.html(x.url))}}catch{return {...x,text:""}}}));
    return res.json({ok:true,engine:"KAI WEB ENGINE",query,sources:pages.filter(x=>x.text).slice(0,5)});
  }catch(e){return res.status(502).json({ok:false,error:"KAI web search unavailable",detail:clean(e?.message,300)})}
}