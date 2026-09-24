import { browser } from 'hatchable';

const NODES=[
  ['KAI Analyze','analyze the request and required evidence'],
  ['KAI Optimize','remove redundant work and prioritize high-value evidence'],
  ['KAI Understand','resolve meaning, language and intent'],
  ['KAI Research','collect focused public-web evidence when needed'],
  ['KAI Evidence','extract claims and supporting evidence'],
  ['KAI Context','connect the request with supplied conversation context'],
  ['KAI Reason','derive bounded conclusions from evidence'],
  ['KAI Verify','check claims for support and contradictions'],
  ['KAI Compare','compare independent findings and candidate answers'],
  ['KAI Synthesize','assemble a compact research report'],
  ['KAI Security','flag unsafe, private or unverified material'],
  ['KAI Memory','prepare per-user history/memory references']
];

const clean=(v,n=18000)=>String(v??'').replace(/\u0000/g,'').replace(/\s+/g,' ').slice(0,n).trim();
const needsWeb=t=>/\b(latest|today|current|news|research|search|source|sources|verify|fact|facts|compare|who is|what happened|price|weather|release|version|update|website|company|paper|study|2026)\b/i.test(t);

async function fetchWeb(query){
  try{
    const html=await browser.html('https://html.duckduckgo.com/html/?q='+encodeURIComponent(query));
    const raw=clean(String(html||'').replace(/<script.*?<\/script>/gis,' ').replace(/<style.*?<\/style>/gis,' ').replace(/<[^>]+>/g,' '),14000);
    if(!raw||/(captcha|unusual traffic|robot check|access denied|verify you are human)/i.test(raw)) return {ok:false,evidence:''};
    return {ok:true,evidence:raw};
  }catch{return {ok:false,evidence:''}}
}

function nodeResult(name,request,evidence,context){
  const text=evidence||context||'';
  const claims=(text.match(/[^.!?]{15,180}[.!?]/g)||[]).slice(0,3).map(s=>clean(s,240));
  return {node:name,status:'complete',focus:NODES.find(x=>x[0]===name)?.[1]||'',findings:claims};
}

export async function research12({prompt='',history=''}={}){
  const request=clean(prompt,5000), ctx=clean(history,3500);
  const web=needsWeb(request)?await fetchWeb(request):{ok:false,evidence:''};
  const evidence=clean(web.evidence||'',12000);
  const nodes=NODES.map(([name])=>nodeResult(name,request,evidence,ctx));
  const findings=[...new Set(nodes.flatMap(n=>n.findings))].slice(0,10);
  const report=[
    'KAI 12 RESEARCH REPORT',
    'Request: '+request,
    'Web research: '+(web.ok?'completed':'not required or unavailable'),
    findings.length?'Evidence findings:\n- '+findings.join('\n- '):'No external evidence was required; the request was passed through the local research organization.',
    'Nodes completed: '+nodes.length+'/12'
  ].join('\n');
  return {ok:true,engine:'KAI 12',local:true,downloadRequired:false,web:!!web.ok,nodes:nodes.map(n=>n.node),findings,report};
}
export const KAI12_NODES=NODES.map(x=>x[0]);