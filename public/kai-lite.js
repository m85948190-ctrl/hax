(() => {
  const clean=s=>String(s||'').trim();
  function respond(prompt){
    const q=clean(prompt), l=q.toLowerCase().replace(/[.!?]+$/,'').trim();
    if(!q)return null;
    if(/^(hi|hello|hey|yo|sup|good morning|good evening)$/.test(l))
      return {response:'Hey bro 👋 I’m Kai Lite. We can chat right now while advanced KAI intelligence warms up.',provider:'KAI LITE',model:'KAI LITE',local:true,lite:true};
    if(/^(what|huh|what do you mean|come again)$/.test(l))
      return {response:'Yeah bro — I’m here. Kai Lite is ready. Ask me anything simple, and complex work can be handed to advanced KAI.',provider:'KAI LITE',model:'KAI LITE',local:true,lite:true};
    if(/^(thanks|thank you|thx)$/.test(l))
      return {response:'Anytime, bro. 🚀',provider:'KAI LITE',model:'KAI LITE',local:true,lite:true};
    if(/^(ok|okay|alright|cool|got it)$/.test(l))
      return {response:'Got it. Send the next thing.',provider:'KAI LITE',model:'KAI LITE',local:true,lite:true};
    if(/^(who are you|what are you|what is kai|what is kai lite)$/.test(l))
      return {response:'I’m Kai Lite — HAxBRO’s fast first-response layer. I handle everyday chat and quick tasks while advanced KAI intelligence works in the background.',provider:'KAI LITE',model:'KAI LITE',local:true,lite:true};
    const m=q.match(/^\s*(?:calculate|compute|solve)?\s*(-?\d+(?:\.\d+)?)\s*([+*\/%-])\s*(-?\d+(?:\.\d+)?)\s*\??\s*$/i);
    if(m){
      const a=Number(m[1]),b=Number(m[3]),op=m[2],v=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?(b===0?NaN:a/b):a%b;
      if(Number.isFinite(v))return {response:String(v),provider:'KAI LITE',model:'KAI LITE',local:true,lite:true};
    }
    return null;
  }
  window.HAxBROKaiLite={respond,status:()=>({ready:true,model:'KAI LITE',local:true})};
})();