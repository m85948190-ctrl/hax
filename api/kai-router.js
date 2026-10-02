export const access="public";
export const methods=["POST"];
const clean=(v,n=12000)=>String(v??"").replace(/\u0000/g,"").trim().slice(0,n);
const APP=/\b(app|application|website|web\s*app|web\s*application|dashboard|portal|platform|saas|pwa|mobile\s+app|desktop\s+app|software|tool|game|product|system|assistant|agent|bot|calculator|tracker|timer|notes?|todo|planner|editor|generator|converter|monitor|viewer|reader|form|booking|store|shop|portfolio|landing\s+page|chatbot|copilot|crm|marketplace)\b/i;
const BUILD=/\b(make|build|create|develop|design|generate|code|program|turn|convert|launch|deploy|publish|ship|forge)\b/i;
const MODIFY=/\b(modify|change|update|edit|adjust|fix|improve|redesign|restyle|rename|add|remove|replace)\b/i;
const OPEN=/^\s*(?:please\s+)?(?:open|launch|enter|show)\s+(?:the\s+)?(?:app\s*maker|appmaker)\s*$/i;
const FIRST=/\b(?:i|we)\s+(?:want|need|would\s+like|am\s+trying|wanna)\s+(?:to\s+)?(?:make|build|create|develop|design|generate|launch)\b/i;
const EXPLICIT=/^\s*(?:please\s+)?(?:make|build|create|develop|design|generate|forge|ship|launch|deploy|publish)\b[\s\S]{0,600}\b(?:app|application|website|web\s*app|dashboard|portal|platform|tool|game|product|system|assistant|agent|bot|calculator|tracker|timer|todo|notes?|planner|editor|converter|store|shop|crm|pwa|saas)\b/i;
function classify(message){
 const t=clean(message),l=t.toLowerCase();
 if(!t)return {wantsApp:false,confidence:0,reason:"empty",destination:null,prompt:t,autoBuild:false};
 if(OPEN.test(t))return {wantsApp:true,confidence:1,reason:"explicit-app-maker",destination:"app-maker",prompt:t,autoBuild:false};
 let score=0,reason=[];
 if(EXPLICIT.test(t)){score+=.9;reason.push("explicit-build")}
 if(FIRST.test(t)){score+=.8;reason.push("first-person-build")}
 if(BUILD.test(t)&&APP.test(t)){score+=.65;reason.push("build+product")}
 if(MODIFY.test(t)&&APP.test(t)){score+=.72;reason.push("modify+product")}
 if(/\b(existing|current|this|the)\s+(app|website|project|tool|dashboard|system)\b/i.test(t)){score+=.2;reason.push("existing-product")}
 if(/\bmake\s+ai\b/i.test(l)){score+=1;reason.push("make-ai")}
 if(/^\s*(?:what|why|how|when|where|tell|explain|can you explain|do you know)\b/i.test(t)&&!BUILD.test(t)&&!MODIFY.test(t))score-=.8;
 const confidence=Math.max(0,Math.min(.99,score));
 const wantsApp=confidence>=.72;
 const autoBuild=wantsApp&&!OPEN.test(t)&&(/\b(?:make|build|create|develop|design|generate|forge|ship|launch|deploy|publish)\b/i.test(t));
 return {wantsApp,confidence,reason:reason.join("+")||"general",destination:wantsApp?"app-maker":null,prompt:t,autoBuild};
}
export default async function(req,res){
 if(req.method!=="POST")return res.status(405).json({ok:false,error:"Method not allowed"});
 const result=classify(req.body?.message);
 return res.json({ok:true,engine:"KAI 51 · SINGLE INTENT ROUTER",capability:result.wantsApp?"app-maker":"chat",...result,pipeline:["understand","classify","preserve-original-prompt","handoff"]});
}