(() => {
  /*
   * HAxBRO KAI 51 · LOCAL — OG intelligence/orchestration lane.
   * This is deliberately NOT a foundational neural model.
   * It understands the request, decides whether evidence is needed,
   * searches web/knowledge, analyzes evidence, and composes a response locally.
   */
  const VERSION='kai51-local-intelligence-v1-og';
  const clean=(v,n=9000)=>String(v??'').replace(/\u0000/g,'').trim().slice(0,n);
  const words=s=>clean(s,5000).toLowerCase().split(/\s+/).filter(Boolean);
  const stop=new Set(['the','a','an','and','or','but','is','are','was','were','to','of','in','on','for','with','what','who','when','where','why','how','can','could','would','should','this','that','it','i','you','me','my','your','about','tell','please','does','do','did','from','as','be','has','have']);

  function signals(message,history=[]){
    const m=clean(message), t=m.toLowerCase(), w=words(m);
    const research=/\b(latest|recent|today|news|price|cost|version|release|update|current|weather|who is|what is|what are|when did|where is|how much|compare|comparison|evidence|sources?|research|look up|find out|verify|check|search|according to|statistics|study|paper|official)\b/i.test(t);
    const hard=/\b(architecture|debug|diagnose|deep|complex|precise|precision|exact|technical|security|vulnerability|legal|medical|financial|algorithm|code|program|database|deploy|deployment|production|analyze|analysis|investigate|reason|calculate|derive|multiple|step by step|why exactly|prove|proof|citation|cite)\b/i.test(t);
    const creation=/\b(build|make|create|develop|design|generate|write|code|app|application|website|dashboard|file|pdf|pptx|zip|video|image)\b/i.test(t);
    const long=m.length>650 || w.length>110;
    const ambiguity=/\b(it|that|this|they|them|there|same|again|above|below)\b/i.test(t) && history.length>0;
    let score=0.10;
    if(research) score+=0.22;
    if(hard) score+=0.38;
    if(creation) score+=0.16;
    if(long) score+=0.12;
    if(ambiguity) score+=0.05;
    if(/\?/.test(m)) score+=0.04;
    if(w.length<5 && !research && !hard) score-=0.08;
    return {research,hard,creation,score:Math.max(0,Math.min(1,score))};
  }

  function queryFor(message){
    return clean(message)
      .replace(/^\s*(?:please\s+)?(?:can you|could you|would you|tell me|explain|help me)\s+/i,'')
      .replace(/[?]+$/,'').trim().slice(0,700);
  }

  function selectSentences(text,query,limit=5){
    const q=new Set(words(query).filter(x=>x.length>2&&!stop.has(x)));
    const sentences=clean(text,7000).replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).filter(s=>s.length>35);
    return sentences.map((s,i)=>{
      const sw=words(s), hit=sw.reduce((n,x)=>n+(q.has(x)?1:0),0);
      const score=hit*4+Math.min(2,s.length/250)-(i*0.002);
      return {s,score};
    }).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.s);
  }

  async function searchWeb(query,mode='fast'){
    const r=await fetch('/api/kai/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,mode})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok) throw new Error(d.error||'web search unavailable');
    return d;
  }

  async function searchKnowledge(query){
    try{
      const r=await fetch('/api/knowledge/search?q='+encodeURIComponent(query),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      return r.ok&&Array.isArray(d.results)?d.results:[];
    }catch{return []}
  }

  function conversational(message,history){
    const t=clean(message).toLowerCase();
    const last=history?.length?clean(history[history.length-1]?.content||history[history.length-1]?.text||''): '';
    if(/^(hi|hello|hey|yo|good morning|good evening|good afternoon)\b/i.test(t))
      return {response:'Hey! I\'m KAI 51 · LOCAL. What are we working on?',confidence:0.98};
    if(/^(thanks|thank you|thx|ty)\b/i.test(t))
      return {response:'You\'re welcome. I\'m ready for the next one.',confidence:0.98};
    if(/^(ok|okay|sure|yes|yeah|yep|no|nah|got it)\b/i.test(t) && last)
      return {response:'Got it. I\'ll keep the previous context in mind. What should I do next?',confidence:0.82};
    if(/^(who are you|what are you)\??$/i.test(t))
      return {response:'I\'m KAI 51 · LOCAL — HAxBRO\'s fast local intelligence lane. I understand the request, use available evidence when needed, and handle straightforward conversation locally.',confidence:0.97};
    return null;
  }

  async function run(message,history=[],hooks={}){
    const prompt=clean(message);
    if(!prompt) throw new Error('empty request');
    const s=signals(prompt,history);
    hooks.onStage?.('understanding','KAI 51 · LOCAL is understanding the request');
    const direct=conversational(prompt,history);
    if(direct && s.score<0.45){
      hooks.onStage?.('composing','KAI 51 · LOCAL is composing the answer');
      return {...direct,lane:'local',handoff:false,reason:'straightforward conversation',sources:[]};
    }

    const query=queryFor(prompt);
    const needsEvidence=s.research || s.score>=0.42;
    let web=null, files=[];
    if(needsEvidence){
      hooks.onStage?.('searching','KAI 51 · LOCAL is searching for evidence');
      [web,files]=await Promise.all([
        searchWeb(query,s.score>=0.68?'deep':'fast').catch(()=>null),
        searchKnowledge(query)
      ]);
    }

    const sources=[];
    for(const x of (web?.sources||[])) if(x?.text) sources.push({title:clean(x.title,220),url:clean(x.url,700),text:clean(x.text,5000),kind:'web'});
    for(const x of files) if(x?.content) sources.push({title:clean(x.title||'HATCHABLE knowledge',220),url:clean(x.url,700),text:clean(x.content,5000),kind:'file'});

    /*
     * Handoff is a capability decision, not a canned answer rule:
     * LOCAL owns ordinary conversation and evidence-backed questions.
     * GITHUB owns requests whose precision/complexity exceeds this lane.
     */
    const precisionRequired=s.hard || s.score>=0.68 || (sources.length===0 && (s.research||prompt.length>220));
    if(precisionRequired){
      const why=s.hard?'The request needs deeper technical reasoning.':s.research&&sources.length===0?'The request needs precise external evidence that LOCAL could not establish.':'The request is complex enough to benefit from the newer neural reasoning lane.';
      hooks.onHandoff?.(why);
      return {lane:'local',handoff:true,reason:why,confidence:s.score,sources:sources.slice(0,8)};
    }

    hooks.onStage?.('analyzing','KAI 51 · LOCAL is analyzing the evidence');
    let response='';
    if(s.research && sources.length){
      const ranked=[];
      for(const src of sources){
        for(const sentence of selectSentences(src.text,prompt,4)) ranked.push({sentence,source:src});
      }
      const seen=new Set();
      const chosen=ranked.filter(x=>{const k=x.sentence.toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,6);
      response=chosen.length
        ? chosen.map((x,i)=>x.sentence+(i<3?'':'')).join(' ')
        : 'I found relevant evidence, but LOCAL could not extract a reliable concise answer from it.';
      const labels=[...new Set(chosen.slice(0,4).map(x=>x.source.title).filter(Boolean))];
      if(labels.length) response+='\n\nSources checked: '+labels.join(' · ');
    } else if(sources.length){
      const chosen=selectSentences(sources[0].text,prompt,4);
      response=chosen.join(' ');
    } else {
      response='I understand what you\'re asking, but I don\'t have enough local evidence to answer that reliably.';
    }
    hooks.onStage?.('composing','KAI 51 · LOCAL is composing the answer');
    return {lane:'local',handoff:false,response:clean(response,7000),confidence:Math.max(0.55,1-s.score/2),sources:sources.slice(0,8),evidenceCount:sources.length};
  }

  window.HAxBROKaiLocalIntelligence={
    version:VERSION,
    ready:true,
    classify:(message,history=[])=>signals(message,history),
    run,
    chat:run,
    status:()=>({ready:true,local:true,foundationalModel:false,mode:'OG search-analysis-conversation',version:VERSION})
  };
  window.dispatchEvent(new CustomEvent('haxbro:kai-local-ready',{detail:{version:VERSION}}));
})();