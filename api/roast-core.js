// KAI RED ROAST CORE — dedicated endpoint
export const access = "public";
export const methods = ["POST"];

const blocked = /(\bkill\b|\bshoot\b|\bharm\b|\bterrorist\b|\bnazi\b|\bslave\b)/i;

export default async function handler(req){
  if(req.method !== "POST") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"content-type":"application/json"}});
  let body={}; try{body=await req.json()}catch{}
  const message=String(body?.message||"").trim();
  if(!message) return new Response(JSON.stringify({error:"Message required"}),{status:400,headers:{"content-type":"application/json"}});
  if(blocked.test(message)) return new Response(JSON.stringify({response:"KAI Roast Core won't turn a joke into threats, hateful abuse, or real-world harm. Give me a name and I'll keep it comedic."}),{headers:{"content-type":"application/json"}});
  const targetMatch=message.match(/(?:roast|cook|destroy|flame|clown)\s+(?:the\s+)?(.+)/i);
  const target=(targetMatch?.[1]||message).replace(/^[\s"'“”]+|[\s"'“”]+$/g,"").slice(0,80);
  const lines=[
    target+"? Bro, that name walked in with main-character confidence and somehow forgot to bring the main character.",
    "Bro, "+target+" has the kind of confidence that makes a loading screen look productive.",
    "If "+target+" were a software update, the changelog would just say: 'minor improvements to absolutely nothing.'",
    target+" is not running on premium hardware, bro. The personality is trial version and the license expired yesterday.",
    "Bro, even autocorrect sees "+target+" and says, 'I don't know this guy either.'"
  ];
  const response=lines[Math.floor(Math.random()*lines.length)];
  return new Response(JSON.stringify({ok:true,response,engine:"KAI RED ROAST CORE"}),{headers:{"content-type":"application/json"}});
}