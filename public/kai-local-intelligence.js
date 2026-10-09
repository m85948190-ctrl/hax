(() => {
  /* KAI 51 LOCAL: fast evidence retrieval + neural conversation.
     This file routes and gathers evidence; it must not fabricate a response from phrase rules. */
  const VERSION='kai51-local-evidence-synthesis-v4';
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
    const url='https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(query)+'&srlimit=3&format=json&origin=*';
    const r=await fetch(url,{mode:'cors',cache:'no-store'});
    if(!r.ok) throw new Error('Wikipedia HTTP '+r.status);
    const d=await r.json();
    const rows=Array.isArray(d?.query?.search)?d.query.search:[];
    const summaries=await Promise.all(rows.slice(0,2).map(async row=>{
      try{
        const p=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(String(row.title||'').replace(/ /g,'_')),{cache:'no-store'});
        if(!p.ok)return null;
        const x=await p.json();
        if(!x?.extract)return null;
        return {title:x.title||row.title,url:x.content_urls?.desktop?.page||('https://en.wikipedia.org/wiki/'+encodeURIComponent(String(row.title||'').replace(/ /g,'_'))),text:clean(x.extract,2200),source:'Wikipedia'};
      }catch{return null}
    }));
    return summaries.filter(Boolean);
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

  async function run(message,history=[],hooks={}){
    const prompt=clean(message);
    if(!prompt) throw new Error('empty request');
    hooks.onStage?.('understanding','KAI 51 · LOCAL is understanding the request');
    const query=queryFor(prompt);
    let web=null,wiki=[],files=[];
    if(shouldSearch(prompt)){
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
    /* LOCAL is intentionally a lightweight evidence-first lane. It never boots or
       calls the 360M neural model for every request. Only return an answer when the
       retrieved text is actually relevant; otherwise throw so the controller can
       hand the turn to GITHUB. This is source-grounded extraction, not a canned
       phrase-response table, and every answer includes its source. */
    const grounded=evidenceAnswer(query,unique);
    if(!grounded){
      const reason=unique.length?'No sufficiently relevant readable evidence was found':'No usable evidence was retrieved';
      const err=new Error(reason);
      err.code='KAI_LOCAL_EVIDENCE_INSUFFICIENT';
      throw err;
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