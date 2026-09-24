(() => {
  const PROFILES={
    light:{id:'onnx-community/SmolLM2-135M-Instruct-ONNX',label:'KAI FAST',maxTokens:128,timeout:22000},
    heavy:{id:'onnx-community/SmolLM2-360M-Instruct-ONNX',label:'KAI 51',maxTokens:512,timeout:35000}
  };
  let worker=null,readyProfiles=new Set(),loadingProfiles=new Map(),queue=new Map(),seq=0;
  const clean=(v,n=12000)=>String(v??'').replace(/\u0000/g,'').slice(0,n);
  const username=()=>localStorage.getItem('haxbro_username')||'anonymous-device';
  const memKey=()=> 'haxbro:kai-local:'+username().replace(/[^a-zA-Z0-9_-]/g,'_')+':memory';
  const readMemory=()=>{try{return JSON.parse(localStorage.getItem(memKey())||'{"notes":[],"sources":[]}')}catch{return {notes:[],sources:[]}}};
  const writeMemory=m=>{try{localStorage.setItem(memKey(),JSON.stringify({notes:(m.notes||[]).slice(-12),sources:(m.sources||[]).slice(-40)}))}catch{}};
  const emit=(name,detail={})=>window.dispatchEvent(new CustomEvent(name,{detail}));
  const installedKey=p=>'haxbro:kai:model-installed:'+p;
  const isInstalled=p=>localStorage.getItem(installedKey(p))==='1';

  function ensureWorker(){
    if(worker)return;
    worker=new Worker('/kai-local-worker.js?v=3',{type:'module'});
    worker.onerror=err=>emit('haxbro:kai-local-error',String(err?.message||'KAI worker failed to start'));
    worker.onmessage=e=>{
      const d=e.data||{};
      if(d.type==='progress'){
        const p=d.progress||{},raw=Number(p.progress),loaded=Number(p.loaded),total=Number(p.total);
        const pct=Number.isFinite(loaded)&&Number.isFinite(total)&&total>0?(loaded/total)*100:(Number.isFinite(raw)?raw:0);
        emit('haxbro:kai-local-progress',{...p,progress:Math.max(0,Math.min(100,pct)),profile:d.profile||'light',installed:isInstalled(d.profile||'light')});
      }
      if(d.type==='ready'){
        const p=d.profile||'light';readyProfiles.add(p);
        localStorage.setItem(installedKey(p),'1');
        const waiter=loadingProfiles.get(p);if(waiter){waiter.resolve(true);loadingProfiles.delete(p)}
        emit('haxbro:kai-local-ready',{profile:p,model:d.model,label:d.label});
      }
      if(d.type==='fatal'){
        const p=d.profile||'light';const waiter=loadingProfiles.get(p);
        if(waiter){waiter.resolve(false);loadingProfiles.delete(p)}
        emit('haxbro:kai-local-error',d.error);
      }
      if(d.id&&queue.has(d.id)){const r=queue.get(d.id);queue.delete(d.id);d.type==='result'?r(d.text):r(null)}
    };
  }

  function prepare(profile='light'){
    profile=PROFILES[profile]?profile:'light';
    if(readyProfiles.has(profile))return Promise.resolve(true);
    const existing=loadingProfiles.get(profile);if(existing)return existing.promise;
    ensureWorker();
    let resolve;const promise=new Promise(r=>resolve=r);
    loadingProfiles.set(profile,{promise,resolve});
    worker.postMessage({type:'prepare',profile});
    return promise;
  }

  const status=()=>({ready:readyProfiles.size>0,loading:loadingProfiles.size>0,profile:readyProfiles.has('heavy')?'heavy':readyProfiles.has('light')?'light':null,models:{
    light:{...PROFILES.light,installed:isInstalled('light'),ready:readyProfiles.has('light')},
    heavy:{...PROFILES.heavy,installed:isInstalled('heavy'),ready:readyProfiles.has('heavy')}
  }});

  const complexityProfile=text=>{
    const t=String(text||'').trim().toLowerCase();
    if(/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|thanks|thank you|ok|okay)\b/.test(t))return'light';
    if(t.length<140&&!/https?:\/\//.test(t)&&!/\b(code|debug|research|investigate|analyze|security|cyber|app|build|create|compare|explain deeply|latest|today|current|project|prompt|decode|encode)\b/.test(t))return'light';
    return'heavy';
  };

  async function generate(prompt,maxTokens,profile='light'){
    if(!await prepare(profile))return null;
    const id='k'+(++seq);
    return new Promise(resolve=>{
      let settled=false;
      const finish=v=>{if(settled)return;settled=true;queue.delete(id);resolve(v)};
      queue.set(id,finish);
      worker.postMessage({id,prompt,maxTokens:maxTokens||PROFILES[profile].maxTokens,profile});
      setTimeout(()=>finish(null),PROFILES[profile].timeout);
    });
  }

  const scrape=async()=>null; // Disabled: local-only KAI does not use server/web retrieval.

  async function respond(userPrompt,forcedMode='auto'){
    const text=clean(userPrompt,5000).trim();if(!text)return null;
    const trivial=/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|thanks|thank you|ok|okay)\b/i.test(text);
    if(trivial)return {response:/^(thanks|thank you|ok|okay)\b/i.test(text)?'You got it.':'Hey! 👋 I’m KAI. What are we working on?',provider:'KAI LOCAL',model:'deterministic-local',profile:'light',local:true,sources:[]};
    // Native KAI capability layer: deterministic tasks bypass the small local model.
    const math=text.match(/^\s*(?:what is|calculate|compute|solve)\s+([0-9+*%().\s-]+)\??\s*$/i)||text.match(/^\s*([0-9][0-9+*%().\s-]{1,80})\s*$/);
    if(math){try{const expr=math[1].trim();if(/^[0-9+*%().\s-]+$/.test(expr)){const value=Function('"use strict";return ('+expr+')')();if(Number.isFinite(value))return {response:String(value),provider:'KAI LOCAL',model:'deterministic-math',profile:'light',local:true,sources:[]}}}catch{}}
    const lower=text.toLowerCase();
    if(/^(what can you do|what are you capable of|help me)\??$/i.test(text))return {response:'I’m KAI, HAxBRO’s local intelligence runtime. I can reason, explain, code, analyze, build with native HAxBRO workspaces, encode/decode, and use browser-local memory. Light reasoning is the default; deeper processing is reserved for genuinely complex or explicitly deep requests.',provider:'KAI LOCAL',model:'deterministic-capability',profile:'light',local:true,sources:[]};
    const typoMap={helo:'hello',whre:'where',calcultor:'calculator',wht:'what',hw:'how',plz:'please'};
    if(/^[a-z]{2,20}$/i.test(text)&&typoMap[lower])return {response:'Did you mean “'+typoMap[lower]+'”?',provider:'KAI LOCAL',model:'deterministic-clarifier',profile:'light',local:true,sources:[]};
    if(/^[a-z]{2,20}$/i.test(text)&&!['hello','hey','hi','thanks','okay'].includes(lower))return {response:'I’m not sure what “'+text+'” refers to yet. Give me a little context and I’ll work it out instead of inventing a meaning.',provider:'KAI LOCAL',model:'deterministic-clarifier',profile:'light',local:true,sources:[]};
    const explicitResearch=/\b(?:do|please|can you|could you)\s+(?:a\s+)?(?:deep\s+)?research\b|\bdeep\s+research\b|\b(?:research|investigate|look\s+up)\s+(?:this|that|it|the)\b/i.test(text);
    const freshness=/\b(?:latest|today|current|right now|news|recent|this week|this month|up to date)\b/i.test(text);
    const forced=forcedMode==='light'?'light':forcedMode==='deep'?'heavy':null;
    const profile=forced||((explicitResearch||freshness||complexityProfile(text)==='heavy')?'heavy':'light');
    const sources=[];
    const m=readMemory();
    const prompt='You are KAI 51, HAxBRO AI\'s private local intelligence runtime. Start with a lightweight interpretation. Only treat this as a deep task when the user explicitly asks for research/deep research, asks for an elaborate or deep explanation, requests current/latest information, or the task is genuinely complex. For short, ambiguous, misspelled, invented, or unfamiliar words, do not fail or invent a definition: briefly say what you can infer and ask what the user means. Never output an empty response. Use the local model and browser-local memory only. Do not call, mention, simulate, or depend on any API, provider, server model, web-search service, or external intelligence. USER: '+text+'\nLOCAL MEMORY: '+JSON.stringify(m.notes.slice(-12))+'\nRespond directly.';
    const answer=await generate(prompt,PROFILES[profile].maxTokens,profile);
    if(!answer)return null;
    if(sources.length){m.sources.push(...sources.map(s=>({url:s.url,title:s.title,at:Date.now()})));writeMemory(m)}
    return {response:answer.replace(/^.*?assistant\s*[:：]\s*/i,''),provider:'KAI LOCAL',model:PROFILES[profile].id,profile,local:true,sources:sources.map(s=>({url:s.url,title:s.title}))};
  }
  window.HAxBROLocalKai={start:prepare,prepare,generate,respond,profileFor:complexityProfile,readMemory,addMemory(note){const m=readMemory();m.notes.push({text:clean(note,500),at:Date.now()});writeMemory(m)},status};
})();