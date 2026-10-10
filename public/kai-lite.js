(() => {
  async function respond(prompt,history=[],options={}){
    const q=String(prompt||'').trim();
    if(!q)return null;
    const r=await fetch('/api/kai-lite',{method:'POST',headers:{'Content-Type':'application/json'},signal:options?.signal,body:JSON.stringify({message:q,history})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok||!d.response)return null;
    return d;
  }
  window.HAxBROKaiLite={respond,status:()=>({ready:true,model:'KAI LITE · WEB',web:true})};
})();