// KAI RED ROAST CORE — direct response service, separate from normal HAxBRO chat
export const access="public";
export const methods=["POST","OPTIONS"];

const blocked=/(\bkill\b|\bshoot\b|\bharm\b|\bterrorist\b|\bnazi\b|\bslave\b)/i;
const jazib=/\bjazib\b/i;
const send=(res,data,status=200)=>res.status(status).json(data);
const choose=a=>a[Math.floor(Math.random()*a.length)];

const jazibRoasts=[
  "Jazib really pulled up to roast an AI, bro. Bold move from a forehead that looks like it has enough runway for an international airport. ✈️",
  "Bro, Jazib's head is giving express-highway energy. At this point Google Maps should be asking for the nearest exit. 🛣️",
  "Those teeth are not just making an entrance, bro — they look like they have their own release schedule.",
  "Jazib's face is giving alien-character-prototype energy, like the character creator shipped the first build by accident. 👽",
  "That forehead has premium real estate. Developers could sketch an airport terminal up there and still have room for parking.",
  "Jazib roasted HAxBRO? Bro shipped a few games and walked into the AI arena like the final-boss music had already started.",
  "The forehead is doing cloud infrastructure, the teeth are doing frontend, the head is doing highway engineering — and the brain department is apparently still loading.",
  "If forehead area translated directly into computing power, Jazib would be a supercomputer. Unfortunately, the benchmark is still buffering.",
  "Bro's character model looks like an alien DLC collided with a human beta build. Somehow both versions shipped.",
  "Jazib came to roast an AI while his own head is giving open-world-map-loading-in-the-background energy.",
  "The forehead has expansion capacity, the teeth have independent deployment, and the head has its own highway system. That's not a face, bro — that's infrastructure.",
  "Bro has enough forehead for an airport terminal and enough developer confidence to challenge an AI. That's a whole startup pitch deck."
];

export default async function(req,res){
  if(req.method==="OPTIONS")return send(res,{ok:true});
  if(req.method!=="POST")return send(res,{error:"Method not allowed"},405);
  const message=String(req.body?.message||"").trim();
  if(!message)return send(res,{error:"Message required"},400);
  if(blocked.test(message))return send(res,{response:"KAI Red Roast Core keeps the roast comedic — no threats, hateful abuse, or real-world harm."});
  if(jazib.test(message))return send(res,{ok:true,response:choose(jazibRoasts),engine:"KAI RED ROAST CORE"});
  const m=message.match(/(?:roast|cook|flame|clown)\s+(?:the\s+)?(.+)/i);
  const target=(m?.[1]||message).replace(/^[\s"'“”]+|[\s"'“”]+$/g,"").slice(0,80);
  return send(res,{ok:true,response:choose([
    target+"? Bro walked in with final-boss confidence and forgot to install the final-boss software.",
    "Bro, "+target+" has premium confidence running on a free trial.",
    "If "+target+" were a software release, the changelog would say: confidence increased; functionality still loading."
  ]),engine:"KAI RED ROAST CORE"});
}