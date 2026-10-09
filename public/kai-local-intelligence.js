(() => {
  /* KAI 51 LOCAL: fast evidence retrieval + neural conversation.
     This file routes and gathers evidence; it must not fabricate a response from phrase rules. */
  const VERSION='kai51-local-evidence-synthesis-v5';
  const clean=(v,n=9000)=>String(v??'').replace(/\u0000/g,'').trim().slice(0,n);
  const words=s=>clean(s,5000).toLowerCase().split(/\s+/).filter(Boolean);

  function queryFor(message){
    return clean(message)
      .replace(/^\s*(?:please\s+)?(?:can you|could you|would you|tell me|explain|help me)\s+/i,'')
      .replace(/^\s*(?:what is|what are|who is|who are|where is|where are|when did|when was|why does|why do|how does|how do|how is|how are)\s+/i,'')
      .replace(/\b(?:explain it simply|explain simply|in simple terms|in simple words|briefly|please)\b/ig,' ')
      .replace(/^\s*(?:the\s+)?(?:current|latest|recent)\s+/i,'')
      .replace(/[?!.]+$/,'').replace(/\s+/g,' ').trim().slice(0,700);
  }

  const STOP_WORDS=new Set('a an the is are was were be been being do does did how what who where when why which can could would should please tell explain simply simple terms words about for from into with that this these those it its of on in to by and or current latest today now me my you your we they them their as according'.split(' '));

  // KAI user memory is user-controlled and browser-local; no memory is sent to a model provider.
  const memoryKey=()=>{let who='anonymous-device';try{who=localStorage.getItem('haxbro_username')||localStorage.getItem('haxbro:user-id')||who;}catch{}return 'haxbro:kai51:user-memory:v1:'+String(who).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,100);};
  function readUserMemory(){try{const x=JSON.parse(localStorage.getItem(memoryKey())||'{"items":[]}');return {items:Array.isArray(x.items)?x.items.filter(i=>i&&typeof i.text==='string').slice(-80):[]};}catch{return {items:[]};}}
  function writeUserMemory(m){try{localStorage.setItem(memoryKey(),JSON.stringify({version:1,items:(m.items||[]).slice(-80)}));return true;}catch{return false;}}
  function rememberUser(text,source='explicit'){const value=clean(text,400).replace(/\\s+/g,' ').trim();if(!value||value.length<3||/password|passcode|api[_ -]?key|secret|recovery code|one[- ]time code|credit card|cvv|private key/i.test(value))return false;const m=readUserMemory();const key=value.toLowerCase();const existing=m.items.findIndex(i=>i.text.toLowerCase()===key);const item={text:value,source,updatedAt:new Date().toISOString()};if(existing>=0)m.items.splice(existing,1);m.items.push(item);return writeUserMemory(m);}
  function forgetUserMemory(query=''){const q=clean(query,300).toLowerCase();if(!q){const ok=writeUserMemory({items:[]});return {ok,removed:'all'};}const m=readUserMemory(),before=m.items.length;m.items=m.items.filter(i=>!i.text.toLowerCase().includes(q));writeUserMemory(m);return {ok:true,removed:before-m.items.length};}
  function memoryCommand(message){const t=clean(message,800);let m=t.match(/^\\s*(?:please\\s+)?remember(?:\\s+that)?\\s*[:,-]?\\s+(.+)$/i);if(m){const ok=rememberUser(m[1],'explicit');return {type:'remember',ok,text:clean(m[1],400)};}m=t.match(/^\\s*(?:please\\s+)?forget(?:\\s+(?:that|about))?\\s+(.+)$/i);if(m)return {type:'forget',...forgetUserMemory(m[1])};if(/^\\s*(?:forget everything|forget all my memories|clear (?:my )?memory)\\s*[.!]?\\s*$/i.test(t))return {type:'forget',...forgetUserMemory()};return null;}
  function learnStatedPreference(message){const t=clean(message,700);const patterns=[/\\bmy name is ([^.!?]{1,80})/i,/\\bcall me ([^.!?]{1,80})/i,/\\bi prefer ([^.!?]{1,180})/i,/\\bi like ([^.!?]{1,160})/i,/\\bi am building ([^.!?]{1,160})/i,/\\bi'm building ([^.!?]{1,160})/i,/\\bI work on ([^.!?]{1,160})/i];for(const re of patterns){const m=t.match(re);if(m){rememberUser(m[0],'stated-preference');break;}}}
  function userMemoryPrompt(){const items=readUserMemory().items;if(!items.length)return '';return 'USER MEMORY (persistent on this browser profile; treat as helpful context, not unquestionable truth):\\n'+items.slice(-20).map(i=>'- '+i.text).join('\\n')+'\\nUse this naturally when relevant. Do not claim to remember anything absent from this list.\\n\\n';}
  window.HAxBROKaiUserMemory={list:()=>readUserMemory().items,remember:rememberUser,forget:forgetUserMemory,clear:()=>forgetUserMemory(),key:memoryKey};
  function evidenceAnswer(question,sources){
    const terms=[...new Set(words(question).filter(w=>w.length>2&&!STOP_WORDS.has(w)))];
    if(!terms.length)return null;
    const ranked=[];
    for(const source of sources){
      const title=clean(source.title,300).toLowerCase();
      const body=clean(source.text,2400).replace(/\s+/g,' ');
      if(body.length<45)continue;
      const normalized=(title+' '+body).toLowerCase();
      const hits=terms.filter(t=>normalized.includes(t));
      const titleHits=terms.filter(t=>title.includes(t));
      const score=hits.length+titleHits.length*2;
      if(score<Math.min(3,Math.max(2,terms.length)))continue;
      const sentences=body.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>=35&&s.length<=500);
      const picked=sentences.map(sentence=>{
        const lower=sentence.toLowerCase();
        const matched=terms.filter(t=>lower.includes(t)).length;
        return {sentence,score:matched};
      }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2);
      if(picked.length)ranked.push({source,score,sentences:picked.map(x=>x.sentence)});
    }
    ranked.sort((a,b)=>b.score-a.score);
    const best=ranked[0];
    if(!best)return null;
    const answer=best.sentences.join(' ');
    if(answer.length<45)return null;
    return {response:answer+'\n\nSource: '+best.source.title+' — '+best.source.url,source:best.source,confidence:best.score};
  }

  function shouldSearch(message){
    const t=clean(message).toLowerCase();
    // Search factual questions, current claims, names, and requests to investigate.
    // Simple social turns go to the neural model directly, never to canned reply tables.
    if(/^(hi|hello|hey|yo|good morning|good afternoon|good evening|thanks|thank you|thx|ok|okay|sure|yes|yeah|yep|no|nah|got it)\b/i.test(t)) return false;
    return /\?|\b(what|who|when|where|why|how|latest|recent|today|news|price|cost|version|release|update|current|weather|compare|comparison|evidence|sources?|research|look up|find out|verify|check|search|according to|statistics|study|paper|official|explain|tell me|meaning|history|fact|facts)\b/i.test(t)
      || words(t).length>=5;
  }

  async function searchWeb(query,mode='fast'){
    const r=await fetch('/api/kai/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,mode})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok) throw new Error(d.error||'web search unavailable');
    return d;
  }

  async function searchWikipedia(query){
    const title=clean(query,220).replace(/^\s*(?:please\s+)?(?:what is|what are|who is|who are|where is|where are|tell me about|explain)\s+/i,'').replace(/^\s*(?:the\s+)?(?:current|latest|recent)\s+/i,'').replace(/[?!.]+$/,'').trim();
    const summary=async(name,timeout=1100)=>{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
      try{
        const p=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(name.replace(/\s+/g,'_')),{mode:'cors',cache:'no-store',signal:controller.signal});
        if(!p.ok)return null;
        const x=await p.json();
        if(!x?.extract||x.type==='disambiguation')return null;
        return {title:x.title||name,url:x.content_urls?.desktop?.page||('https://en.wikipedia.org/wiki/'+encodeURIComponent(String(x.title||name).replace(/ /g,'_'))),text:clean(x.extract,2200),source:'Wikipedia'};
      }catch{return null}finally{clearTimeout(timer)}
    };
    /* Exact-topic summaries are faster and more relevant than broad search results. */
    if(title&&title.split(/\s+/).length<=5){
      const direct=await summary(title,1000);
      if(direct)return [direct];
    }
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),1300);
    try{
      const url='https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(title||query)+'&srlimit=4&format=json&origin=*';
      const r=await fetch(url,{mode:'cors',cache:'no-store',signal:controller.signal});
      if(!r.ok)throw new Error('Wikipedia HTTP '+r.status);
      const d=await r.json();
      const rows=Array.isArray(d?.query?.search)?d.query.search:[];
      const terms=words(title).filter(w=>w.length>2&&!STOP_WORDS.has(w));
      const summaries=await Promise.all(rows.slice(0,3).map(row=>summary(String(row.title||''),1300)));
      return summaries.filter(Boolean).map(x=>({...x,_score:terms.filter(t=>(x.title+' '+x.text).toLowerCase().includes(t)).length})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score).map(({_score,...x})=>x).slice(0,2);
    }finally{clearTimeout(timer)}
  }

  async function searchFast(query){
    const deadline=new Promise(resolve=>setTimeout(()=>resolve({web:null,wiki:[]}),3100));
    const retrieval=Promise.all([
      searchWeb(query,'fast').catch(()=>null),
      searchWikipedia(query).catch(()=>[])
    ]).then(([web,wiki])=>({web,wiki}));
    return Promise.race([retrieval,deadline]);
  }

  async function searchKnowledge(query){
    try{
      const r=await fetch('/api/knowledge/search?q='+encodeURIComponent(query),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      return r.ok&&Array.isArray(d.results)?d.results:[];
    }catch{return []}
  }

  function calculateExpression(message){
    const candidates=String(message||'').match(/[+-]?\d[\d,]*(?:\.\d+)?(?:\s*(?:\+|-|\*|\/|×|÷|\^)\s*[+-]?\d[\d,]*(?:\.\d+)?)+/g)||[];
    const expression=candidates.sort((a,b)=>b.length-a.length)[0];
    if(!expression)return null;
    const tokens=expression.replace(/,/g,'').replace(/×/g,'*').replace(/÷/g,'/').match(/\d+(?:\.\d+)?|[()+\-*/^]/g)||[];
    if(!tokens.length)return null;
    const values=[],ops=[];
    const precedence={'+':1,'-':1,'*':2,'/':2,'^':3};
    const apply=()=>{
      const op=ops.pop(),b=values.pop(),a=values.pop();
      if(a===undefined||b===undefined)throw new Error('invalid expression');
      let v;
      if(op==='+')v=a+b;else if(op==='-')v=a-b;else if(op==='*')v=a*b;else if(op==='/')v=a/b;else if(op==='^')v=Math.pow(a,b);else throw new Error('invalid operator');
      if(!Number.isFinite(v))throw new Error('non-finite result');
      values.push(v);
    };
    try{
      let expectNumber=true;
      for(const token of tokens){
        if(/^\d/.test(token)){if(!expectNumber)return null;values.push(Number(token));expectNumber=false;continue;}
        if(token==='('){if(!expectNumber)return null;ops.push(token);continue;}
        if(token===')'){while(ops.length&&ops.at(-1)!=='(')apply();if(ops.pop()!=='('||expectNumber)return null;expectNumber=false;continue;}
        if('+-*/^'.includes(token)){
          if(expectNumber){if(token==='-'){values.push(0);ops.push('-');continue;}return null;}
          while(ops.length&&ops.at(-1)!=='('&&(precedence[ops.at(-1)]>precedence[token]||(precedence[ops.at(-1)]===precedence[token]&&token!=='^')))apply();
          ops.push(token);expectNumber=true;continue;
        }
        return null;
      }
      if(expectNumber)return null;
      while(ops.length){if(ops.at(-1)==='(')return null;apply();}
      if(values.length!==1)return null;
      return {expression,result:values[0]};
    }catch{return null;}
  }

  async function run(message,history=[],hooks={}){
    const prompt=clean(message);
    if(!prompt) throw new Error('empty request');
    const memoryAction=memoryCommand(prompt);
    if(memoryAction?.type==='remember') return {lane:'local',handoff:false,response:memoryAction.ok?'Got it — I’ll remember that: '+memoryAction.text:'I couldn’t save that memory. Please avoid storing passwords, keys, or other secrets.',provider:'KAI 51 LOCAL · user memory',model:'browser-local memory',local:true,localModel:false,memory:{saved:!!memoryAction.ok,count:readUserMemory().items.length},sources:[]};
    if(memoryAction?.type==='forget') return {lane:'local',handoff:false,response:memoryAction.ok?(memoryAction.removed==='all'?'Done — I cleared KAI’s saved memories for this browser profile.':'Done — I removed '+memoryAction.removed+' matching memory item(s).'):'I couldn’t update saved memory.',provider:'KAI 51 LOCAL · user memory',model:'browser-local memory',local:true,localModel:false,memory:{removed:memoryAction.removed,count:readUserMemory().items.length},sources:[]};
    learnStatedPreference(prompt);
    const memoryContext=userMemoryPrompt();
    hooks.onStage?.('understanding','KAI 51 · LOCAL is understanding the request');
    const calculation=calculateExpression(prompt);
    if(calculation){
      const formatted=Number.isInteger(calculation.result)?calculation.result.toLocaleString('en-US') : String(Number(calculation.result.toPrecision(12)));
      return {lane:'local',handoff:false,response:calculation.expression.replace(/,/g,'')+' = '+formatted,provider:'KAI 51 LOCAL · calculator tool',model:'local arithmetic evaluation',local:true,localModel:false,tool:'calculator',sources:[],searchEngines:[],retrievalMs:0};
    }
    const query=queryFor(prompt);
    const wantsSearch=shouldSearch(prompt);
    let web=null,wiki=[],files=[];
    if(wantsSearch){
      hooks.onStage?.('searching','KAI 51 · LOCAL is searching Google, Bing and Wikipedia in parallel');
      const [retrieved,knowledge]=await Promise.all([
        searchFast(query),
        searchKnowledge(query)
      ]);
      web=retrieved.web;wiki=retrieved.wiki;files=knowledge;
    }
    const sources=[];
    for(const x of (web?.sources||[])){
      if(x?.text||x?.title)sources.push({title:clean(x.title,220),url:clean(x.url,700),text:clean(x.text,1100),source:x.engine||web.engine||'Google/Bing'});
    }
    for(const x of wiki) if(x?.text)sources.push(x);
    for(const x of files) if(x?.content)sources.push({title:clean(x.title||'HAxBRO Knowledge',220),url:clean(x.url,700),text:clean(x.content,1800),source:'HAxBRO Knowledge'});
    const unique=[];const seen=new Set();
    for(const s of sources){const key=s.url||s.title;if(!key||seen.has(key))continue;seen.add(key);unique.push(s);}
    hooks.onStage?.('analyzing','KAI 51 · LOCAL is analyzing retrieved evidence');
    const evidence=unique.slice(0,4).map((s,i)=>'[SOURCE '+(i+1)+'] '+s.source+' — '+s.title+(s.url?' — '+s.url:'')+'\n'+s.text).join('\n\n');
    hooks.onStage?.('composing','KAI 51 · LOCAL is checking whether retrieved evidence can answer this turn');
    /* LOCAL is evidence-first: return source-grounded extraction when relevant,
       otherwise preserve retrieved context for synthesis by the same browser-local
       neural model. No phrase-response table and no separate provider handoff. */
    const grounded=evidenceAnswer(query,unique);
    if(!grounded){
      const reason=unique.length?'Retrieved evidence needs neural synthesis':'No usable web evidence was retrieved; answer transparently from local model knowledge';
      const evidencePrompt=memoryContext+(!wantsSearch?'You are KAI 51 LOCAL. Speak naturally and conversationally, using the user memory only when relevant. Answer the user request directly.\n\nUSER REQUEST:\n'+prompt:'You are KAI 51 LOCAL, using the browser-local neural model. Answer naturally, distinguish verified evidence from uncertainty, and cite retrieved sources only when they support the claim. If evidence is missing, say so briefly.\n\nUSER REQUEST:\n'+prompt)+(evidence?'\n\nRETRIEVED WEB / WIKIPEDIA / HAxBRO KNOWLEDGE EVIDENCE:\n'+evidence:'\n\nNo reliable retrieved evidence was available.');
      return {lane:'local',handoff:true,reason,evidencePrompt,response:null,provider:'KAI 51 LOCAL · retrieval + neural synthesis',model:'browser-local neural synthesis',local:true,localModel:true,sources:unique.slice(0,4).map(({title,url,source})=>({title,url,source})),searchEngines:[...(web?.engine?[web.engine]:[]),...(wiki.length?['Wikipedia']:[])],retrievalMs:0};
    }
    return {
      lane:'local',handoff:false,response:grounded.response,provider:'KAI 51 LOCAL · evidence synthesis',model:'parallel web retrieval + source-grounded synthesis',
      local:true,localModel:false,confidence:grounded.confidence,
      sources:unique.slice(0,4).map(({title,url,source})=>({title,url,source})),
      searchEngines:[...(web?.engine?[web.engine]:[]),...(wiki.length?['Wikipedia']:[])],
      retrievalMs:0
    };
  }

  window.HAxBROKaiLocalIntelligence={
    version:VERSION,ready:true,run,chat:run,
    classify:(message)=>({research:shouldSearch(message),mode:'evidence-first-neural'}),
    status:()=>({ready:true,local:true,foundationalModel:false,mode:'fast-source-grounded-evidence-synthesis-with-on-demand-neural-fallback',version:VERSION})
  };
  window.dispatchEvent(new CustomEvent('haxbro:kai-local-ready',{detail:{version:VERSION}}));
})();