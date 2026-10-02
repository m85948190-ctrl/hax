import { decodeInput } from 'lib/kai-decoder';
import { buildNativeProduct } from 'lib/kai-native-builder';

export const KAI51_IDENTITY=Object.freeze({name:'KAI 51',version:'51.4-independent-first-party',owner:'HAxBRO AI',provider:null,externalModel:false,networkModel:false});
const NODES=Object.freeze(['identity','memory','context','planner','reasoner','tools','research','app-maker','code-writer','project-maker','god-engine','ai-control-panel','decoding-partner','security','study','web','media','workspace','verifier','recovery']);
const CAPABILITIES=Object.freeze({'app-maker':['intent','architect','build','test','preview','modify','publish'],'code-writer':['write','debug','review','refactor'],'project-maker':['scaffold','plan','validate'],'god-engine':['orchestrate','validate','recover'],'ai-control-panel':['inspect','configure','status'],'decoding-partner':['detect','decode','encode','report'],'security':['audit','threat-model','verify','report'],'research':['collect','synthesize','cite'],'study':['explain','quiz','review'],'memory':['store','retrieve','delete'],'web':['retrieve','inspect','summarize'],'media':['generate','inspect','attach'],'workspace':['route','open','inspect']});
const clean=(v,n=16000)=>String(v??'').replace(/\0/g,'').trim().slice(0,n);
export function createKai51ServerPlan(input){
 const intent=clean(input),l=intent.toLowerCase();
 const checks=[['app-maker',/\b(app|website|calculator|todo|task|note|timer|build|preview|publish|modify)\b/],['code-writer',/\b(code|javascript|typescript|python|html|css|json|sql|debug|refactor)\b/],['decoding-partner',/\b(decode|encode|cipher|rot13|base64|hex|morse)\b/],['security',/\b(security|secure|vulnerability|cve|threat|incident|scan)\b/],['research',/\b(research|sources|compare|latest)\b/],['study',/\b(study|teach|quiz|explain)\b/],['memory',/\b(remember|memory|forget)\b/],['web',/\b(search|look up|web)\b/],['workspace',/\b(workspace|xcode)\b/]];
 const route=checks.filter(x=>x[1].test(l)).map(x=>x[0]);
 return {intent,route:[...new Set(route.length?route:['reasoner'])],nodes:NODES,capabilities:CAPABILITIES,provider:null,externalModel:false};
}
function localAnswer(q,plan){
 const l=q.toLowerCase();
 const simple=q.match(/^\s*(?:what is|calculate|compute|solve)?\s*(-?\d+(?:\.\d+)?)\s*([+*\/%-])\s*(-?\d+(?:\.\d+)?)\s*\??\s*$/i);
 if(simple){
  const a=Number(simple[1]),op=simple[2],b=Number(simple[3]);
  const v=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?(b===0?NaN:a/b):a%b;
  if(Number.isFinite(v))return String(v);
 }
 if(/who are you|what are you|what is kai/.test(l))return "I am KAI 51 — HAxBRO AI's first-party intelligence runtime. This local lane uses no external model provider.";
 if(/what can you do|capabilities/.test(l))return Object.entries(CAPABILITIES).map(([k,v])=>k+': '+v.join(', ')).join('\n');
 if(plan.route.includes('app-maker'))return 'KAI 51 routed this request to App Maker: Intent → Architect → Build → Test → Preview → Modify/Publish.';
 if(plan.route.includes('decoding-partner'))return 'KAI 51 routed this request to Decoding Partner, with 25 local decoding keys.';
 if(plan.route.includes('security'))return 'KAI 51 routed this request to the defensive Security capability.';
 if(plan.route.includes('research'))return 'KAI 51 routed this request to the Research capability.';
 if(plan.route.includes('code-writer'))return 'KAI 51 routed this request to Code Writer.';
 return 'KAI 51 understood the request locally and completed its first-party planning and routing pass.';
}
export async function runKai51Server(input){
 const q=clean(input);
 if(!q)return{ok:false,error:'Enter a request.'};
 const plan=createKai51ServerPlan(q);
 let answer=localAnswer(q,plan);
 if(plan.route.includes('decoding-partner')&&/\b(decode|decrypt|decipher|encoded)\b/i.test(q)){
  const payload=q.replace(/^\s*(?:decode|decipher|decrypt)\s*(?:this|the following)?\s*[:\-]?\s*/i,'').trim()||q;
  answer=JSON.stringify(decodeInput(payload),null,2);
 }
 return {ok:true,answer,plan,identity:KAI51_IDENTITY,status:{ready:true,provider:null,externalModel:false,networkModel:false}};
}
export function buildKai51App(input,options={}){return buildNativeProduct(input,{appName:options.name||options.appName||''});}