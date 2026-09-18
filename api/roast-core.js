// KAI RED ROAST CORE — isolated from normal HAxBRO chat
export const access = "public";
export const methods = ["POST","OPTIONS"];

const blocked=/(\bkill\b|\bshoot\b|\bharm\b|\bterrorist\b|\bnazi\b|\bslave\b)/i;
const jazib=/\bjazib\b/i;

function send(res,data,status=200){
  res.setHeader("content-type","application/json");
  return res.status(status).json(data);
}

const jazibLines=[
  "Jazib really logged in to roast an AI, bro. Bold move from a forehead that looks like it has enough runway to host an international airport. ✈️",
  "Bro, Jazib's head is shaped like the express highway. At this point Google Maps should be asking him for toll fees. 🛣️",
  "Those teeth are not leaving the mouth, bro — they're forming their own development team and shipping without QA.",
  "Jazib's face looks like somebody selected 'alien prototype' in character creation and then forgot to switch it back. 👽",
  "That forehead has premium real estate. Developers could build an airport terminal up there and still have room for a parking lot.",
  "Bro roasted HAxBRO after shipping a few games like he just defeated the final boss of software. The confidence has a DLC nobody purchased.",
  "Jazib's forehead has expansion capacity, the teeth have independent deployment, and the head has its own highway system. That's not a face, bro — that's infrastructure.",
  "If forehead area translated directly into computing power, Jazib would be a supercomputer. Unfortunately, the benchmark is still buffering.",
  "Bro's character model looks like an alien DLC collided with a human beta build. Somehow both versions shipped.",
  "Jazib came to roast an AI while his own head is giving 'open-world map loading in the background' energy.",
  "The forehead is doing cloud infrastructure, the teeth are doing frontend, the alien head is doing design — and somehow the brain department still says 'service unavailable.'",
  "Bro has enough forehead for an airport, enough teeth to start a keyboard, and enough developer confidence to challenge an AI. That's a complete tech startup."
];

function choose(a){return a[Math.floor(Math.random()*a.length)]}

export default async function(req,res){
  if(req.method==="OPTIONS")return send(res,{ok:true});
  if(req.method!=="POST")return send(res,{error:"Method not allowed"},405);
  const body=req.body||{};
  const message=String(body.message||"").trim();
  if(!message)return send(res,{error:"Message required"},400);
  if(blocked.test(message))return send(res,{response:"KAI Red Roast Core keeps the roast comedic — no threats, hateful abuse, or real-world harm."});
  if(jazib.test(message))return send(res,{ok:true,response:choose(jazibLines),engine:"KAI RED ROAST CORE"});
  const match=message.match(/(?:roast|cook|flame|clown)\s+(?:the\s+)?(.+)/i);
  const target=(match?.[1]||message).replace(/^[\s"'“”]+|[\s"'“”]+$/g,"").slice(0,80);
  return send(res,{ok:true,response:choose([
    target+"? Bro walked in with final-boss confidence and forgot to install the final-boss software.",
    "Bro, "+target+" has premium confidence running on a free trial.",
    "If "+target+" were a software release, the changelog would say: 'confidence increased; functionality still loading.'"
  ]),engine:"KAI RED ROAST CORE"});
}