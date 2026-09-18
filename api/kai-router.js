export const access = "public";
export const methods = ["POST"];

const APP_NOUN = /\b(app|application|website|web\s*app|web\s*application|dashboard|portal|platform|saas|pwa|mobile\s+app|desktop\s+app|software|tool|game|ai\s+(?:app|assistant|agent|bot|tool|system))\b/i;
const BUILD_VERB = /\b(make|build|create|develop|design|generate|code|program|turn|convert|launch|deploy|publish|ship|forge)\b/i;
const DIRECT_REQUEST = /\b(can|could|would|will|please|help)\s+(?:you|u|me)?\s*(?:make|build|create|develop|design|generate|code|program|turn|launch|deploy|publish|ship)\b/i;
const FIRST_PERSON_INTENT = /\b(i|we)\s+(?:want|need|would\s+like|am\s+trying)\s+to\s+(?:make|build|create|develop|design|generate|launch|deploy)\b/i;
const EXPLICIT = /^(?:please\s+)?(?:make|build|create|develop|design|generate)\b[\s\S]{0,500}\b(?:app|application|website|web\s*app|dashboard|portal|platform|tool|game|assistant|agent|bot|system)\b/i;
const META = /^(?:what|why|how|when|where|tell|explain|do you|did you|is this|are you|can you explain|chatgpt told|deepseek told|hexuro|roast|joke|review|compare|discuss)\b/i;

function classify(text){
  const t=String(text||"").trim();
  if(!t) return {wantsApp:false,confidence:0};
  const lower=t.toLowerCase();
  if(/^chatgpt told (?:this|me)|^you told (?:me|chatgpt)|^deepseek told|^hexuro told/i.test(lower))
    return {wantsApp:false,confidence:.98};
  let score=0;
  if(EXPLICIT.test(t)) score+=.85;
  if(DIRECT_REQUEST.test(t)) score+=.70;
  if(FIRST_PERSON_INTENT.test(t)) score+=.75;
  if(BUILD_VERB.test(t)&&APP_NOUN.test(t)) score+=.55;
  if(/\bmy\s+(?:app|website|project|software|tool)\b/i.test(t)&&BUILD_VERB.test(t)) score+=.35;
  if(META.test(t)&&!DIRECT_REQUEST.test(t)&&!FIRST_PERSON_INTENT.test(t)&&!EXPLICIT.test(t)) score-=.75;
  if(/\b(?:about|regarding|discussing|talking\s+about|explain|what\s+is)\b[\s\S]{0,80}\b(?:app|website|ai|software)\b/i.test(t)) score-=.45;
  const confidence=Math.max(0,Math.min(.99,score));
  return {wantsApp:confidence>=.72,confidence};
}

export default async function(req,res){
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"Method not allowed"});
  const result=classify(req.body?.message);
  return res.json({ok:true,...result,engine:"KAI ROUTER"});
}