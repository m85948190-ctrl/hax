(()=>{
  const open=()=>{
    const text=prompt('DECODING PARTNER\\n\\nPaste the text/code you want KAI to decode:');
    if(!text) return;
    const out=document.createElement('div');
    out.style.cssText='position:fixed;inset:12%;z-index:99999;background:#f7f9fb;color:#111;border:1px solid #cbd3da;border-radius:18px;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.25);overflow:auto;font:14px/1.5 system-ui';
    const close=document.createElement('button'); close.textContent='×'; close.style.cssText='float:right;font-size:24px;border:0;background:none;cursor:pointer'; close.onclick=()=>out.remove();
    const title=document.createElement('h2'); title.textContent='⌁ Decoding Partner';
    const pre=document.createElement('pre'); pre.style.whiteSpace='pre-wrap';
    const s=text.trim(); let decoded='';
    try{ decoded=s.replace(/[A-Za-z]/g,c=>String.fromCharCode((c<='Z'?90:122)>=c.charCodeAt(0)+13?c.charCodeAt(0)+13:c.charCodeAt(0)-13)); }catch{}
    pre.textContent='INPUT\\n'+s+'\\n\\nROT13 CANDIDATE\\n'+decoded+'\\n\\nKAI NOTE\\nUse the main HAxBRO chat for deeper multi-layer decoding, cipher identification, and context analysis.';
    out.append(close,title,pre); document.body.append(out);
  };
  document.addEventListener('click',e=>{if(e.target.closest('#decodingPartnerBtn,#mobileDecodingPartnerBtn,#shortcutDecode'))open();});
})();