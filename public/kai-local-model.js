(() => {
  const PROFILES={
    light:{id:'onnx-community/SmolLM2-135M-Instruct-ONNX',label:'KAI FAST',maxTokens:180},
    heavy:{id:'onnx-community/SmolLM2-360M-Instruct-ONNX',label:'KAI 51',maxTokens:420}
  };
  const CDN='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/+esm';
  let worker=null,readyProfile=null,loading=false,queue=new Map(),seq=0,preparePromises=new Map();
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
    worker=new Worker('/kai-local-worker.js?v=2',{type:'module'});
    worker.onerror=err=>emit('haxbro:kai-local-error',String(err?.message||'KAI worker failed to start'));
    worker.onmessage=e=>{
      const d=e.data||{};
      if(d.type==='progress'){
        const p=d.progress||{}, raw=Number(p.progress),loaded=Number(p.loaded),total=Number(p.total);
        const pct=Number.isFinite(loaded)&&Number.isFinite(total)&&total>0?(loaded/total)*100:(Number.isFinite(raw)?raw:(['ready','done'].includes(String(p.status).toLowerCase())?100:0));
        emit('haxbro:kai-local-progress',{...p,progress:Math.max(0,Math.min(100,pct)),profile:d.profile||'light',installed:isInstalled(d.profile||'light')});
      }
      if(d.type==='ready'){
        const p=d.profile||'light';
        readyProfile=p;
        loading=false;
        localStorage.setItem(installedKey(p),'1');
        emit('haxbro:kai-local-ready',{profile:p,model:d.model,label:d.label});
        const waiter=preparePromises.get(p);if(waiter){waiter.resolve(true);preparePromises.delete(p)}
      }
      if(d.type==='fatal'){
        loading=false;
        const p=d.profile||'light',waiter=preparePromises.get(p);
        if(waiter){waiter.resolve(false);preparePromises.delete(p)}
        emit('haxbro:kai-local-error',d.error);
      }
      if(d.id&&queue.has(d.id)){
        const r=queue.get(d.id);queue.delete(d.id);
        d.type==='result'?r(d.text):r(null);
      }
    };
  }

  function prepare(profile='light'){
    profile=PROFILES[profile]?profile:'light';
    if(readyProfile===profile)return Promise.resolve(true);
    const existing=preparePromises.get(profile);if(existing)return existing.promise;
    ensureWorker();loading=true;
    let resolve;const promise=new Promise(r=>resolve=r);
    preparePromises.set(profile,{promise,resolve});
    worker.postMessage({type:'prepare',profile});
    return promise;
  }

  const status=()=>({ready:!!readyProfile,loading,profile:readyProfile,models:{
    light:{...PROFILES.light,installed:isInstalled('light')},
    heavy:{...PROFILES.heavy,installed:isInstalled('heavy')}
  }});

  const complexityProfile=text=>{
    const t=String(text||'').trim().toLowerCase();
    if(/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|thanks|thank you|ok|okay)\b/.test(t))return'light';
    if(t.length<140 && !/https?:\/\//.test(t) && !/\b(code|debug|research|investigate|analyze|security|cyber|app|build|create|compare|explain deeply|latest|today|current)\b/.test(t))return'light';
    return'heavy';
  };

  const scrape=async url=>{try{const r=await fetch('/api/kai/browser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});const d=await r.json();return r.ok?d:null}catch{return null}};

  async function generate(prompt,maxTokens,profile='light'){
    if(!await prepare(profile))return null;
    return new Promise(resolve=>{
      const id='k'+(++seq);queue.set(id,resolve);
      worker.postMessage({id,prompt,maxTokens:maxTokens||PROFILES[profile].maxTokens,profile});
      setTimeout(()=>{if(queue.has(id)){queue.delete(id);resolve(null)}},90000);
    });
  }

  async function respond(userPrompt){
    const text=clean(userPrompt,5000).trim();if(!text)return null;
    const profile=complexityProfile(text);
    if(!await prepare(profile))return null;
    const urls=[...text.matchAll(/https?:\/\/[^\s<>"']+/gi)].map(x=>x[0].replace(/[),.;!?]+$/,'')).slice(0,3);
    const sources=[];
    for(const url of urls){const d=await scrape(url);if(d?.ok)sources.push({url:d.url,title:d.title,text:clean(d.text,3500)})}
    const m=readMemory();
    const web=sources.map((s,i)=>'SOURCE '+(i+1)+': '+(s.title||s.url)+'\n'+s.text).join('\n\n');
    const prompt='You are KAI, HAxBRO AI\'s browser-local intelligence. '+(profile==='light'?'You are KAI FAST for short/simple requests.':'You are KAI 51 for complex reasoning.')+'\n'
      +'Be concise and direct. Do not claim to be an external provider. Use local memory and supplied public-web evidence when useful.\n'
      +'USER: '+text+'\nLOCAL MEMORY: '+JSON.stringify(m.notes.slice(-12))+'\nPUBLIC WEB EVIDENCE: '+(web||'None retrieved.')+'\nRespond directly to the user.';
    const answer=await generate(prompt,PROFILES[profile].maxTokens,profile);
    if(answer){
      if(sources.length){m.sources.push(...sources.map(s=>({url:s.url,title:s.title,at:Date.now()})));writeMemory(m)}
      return {response:answer.replace(/^.*?assistant\s*[:：]\s*/i,''),provider:'KAI LOCAL',model:PROFILES[profile].id,profile,local:true,sources:sources.map(s=>({url:s.url,title:s.title}))};
    }
    return null;
  }

  window.HAxBROLocalKai={start:prepare,prepare,generate,respond,profileFor:complexityProfile,readMemory,addMemory(note){const m=readMemory();m.notes.push({text:clean(note,500),at:Date.now()});writeMemory(m)},status};
})();