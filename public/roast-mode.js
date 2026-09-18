// KAI RED ROAST CORE — Jazib trigger for normal HAxBRO chat
(function(){
  const JAZIB=/\bjazib\b/i;
  const NAME=/\b(?:moinak|moinac|moinakh|moynak|monak|moinack|mainack|mainak)\b/i;
  const ROAST=/\b(?:roast|cook|flame|clown|roasting|roasted|roasts)\b/i;

  async function roastDirect(value){
    const v=String(value||'').trim(); if(!v)return false;
    try{
      const r=await fetch('/api/roast-core',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:v,username:localStorage.getItem('haxbro_username')||''})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
      if(typeof window.addMessage==='function')window.addMessage(d.response||'Red Roast Core returned no response.','bot');
      else{
        const box=document.querySelector('#messages');
        if(box){const el=document.createElement('div');el.className='message bot';el.textContent=d.response||'Red Roast Core returned no response.';box.appendChild(el);box.scrollTop=box.scrollHeight}
      }
    }catch(e){
      const msg='Red Roast Core error: '+(e?.message||'Unknown error');
      if(typeof window.addMessage==='function')window.addMessage(msg,'bot');
    }
    return true;
  }

  const previous=window.sendChat;
  window.sendChat=async function(value){
    const v=String(value||'').trim(); if(!v)return false;
    // Any user message containing the exact name Jazib is a direct trigger.
    // This intentionally catches pasted ChatGPT roast text too, without opening a separate workspace.
    if(JAZIB.test(v)){
      if(typeof window.addMessage==='function')window.addMessage(v,'user');
      const field=document.querySelector('#promptInput');if(field)field.value='';
      return roastDirect(v);
    }
    // Preserve the Mainak + roast trigger for variants that do not name Jazib.
    if(NAME.test(v)&&ROAST.test(v)){
      if(typeof window.addMessage==='function')window.addMessage(v,'user');
      const field=document.querySelector('#promptInput');if(field)field.value='';
      return roastDirect(v);
    }
    return previous(v);
  };
})();