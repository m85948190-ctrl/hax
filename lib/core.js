import { runKai51Server, KAI51_IDENTITY } from 'lib/kai51-server-core';

const clean=(v,n=16000)=>String(v??'').replace(/\0/g,'').trim().slice(0,n);

export async function complete({prompt='',username='',history='',onEvent=()=>{}}={}){
 const started=Date.now();
 const request=clean(prompt);
 onEvent({type:'planning',label:'KAI 51',detail:'Understanding the request locally'});
 const result=await runKai51Server(request);
 if(!result.ok)throw new Error(result.error||'KAI 51 request rejected');
 onEvent({type:'synthesis-start',label:'KAI 51',detail:'Producing first-party response'});
 return {
  provider:null,
  model:'KAI 51',
  text:result.answer,
  response:result.answer,
  elapsedMs:Date.now()-started,
  status:'first-party-local-complete',
  agent:'KAI 51',
  local:true,
  apiRace:{ok:false,providers:[]},
  architecture:{mainBrain:'KAI 51',execution:'first-party-local',externalProviders:false,judges:false,adjudicator:false},
  plan:result.plan,
  identity:KAI51_IDENTITY,
  sources:[],
  knowledgeContext:null,
  toolResults:[],
  steps:[
   {step:'KAI 51 received request',status:'complete'},
   {step:'KAI 51 classified intent',status:'complete'},
   {step:'KAI 51 executed first-party capability lane',status:'complete'},
   {step:'KAI 51 final response',status:'complete'}
  ]
 };
}

export const CORE_PROVIDER_CHAIN=['KAI 51'];
export { KAI51_IDENTITY };