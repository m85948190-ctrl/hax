(() => {
  if(!document.getElementById('kai51BootStyles')){
    const s=document.createElement('style');
    s.id='kai51BootStyles';
    s.textContent=`
      .kai51-boot-stamp{
        display:block!important;visibility:visible!important;opacity:1!important;
        position:fixed;right:18px;top:78px;left:auto;bottom:auto;transform:none;
        z-index:2147483000;width:min(420px,calc(100vw - 36px));
        padding:12px 15px;border:1px solid rgba(170,184,198,.58);border-radius:14px;
        background:rgba(255,255,255,.97);box-shadow:0 14px 38px rgba(20,35,50,.14),0 0 0 1px rgba(255,255,255,.7);
        backdrop-filter:blur(18px);font-family:Inter,system-ui,sans-serif;pointer-events:none
      }
      .kai51-boot-kicker{display:flex;align-items:center;gap:7px;font-size:9px;font-weight:800;letter-spacing:.12em;color:#70808f;text-transform:uppercase}
      .kai51-boot-dot{width:6px;height:6px;border-radius:50%;background:#26bfe8;box-shadow:0 0 10px rgba(38,191,232,.65);animation:kai51BootPulse 1.1s ease-in-out infinite}
      .kai51-boot-title{margin-top:7px;font-size:12px;font-weight:800;color:#17232d}
      .kai51-boot-text{margin-top:4px;font-size:10px;line-height:1.45;color:#72818e}
      .kai51-boot-bar{height:4px;margin-top:10px;border-radius:99px;background:#e8edf1;overflow:hidden}
      .kai51-boot-bar i{display:block;width:0;height:100%;border-radius:99px;background:linear-gradient(90deg,#26bfe8,#5a8dff);transition:width .25s ease}
      .kai51-boot-meta{display:flex;justify-content:space-between;gap:12px;margin-top:7px;font-size:9px;color:#84919d}
      .kai51-boot-meta b{font-size:10px;color:#2f5368;font-variant-numeric:tabular-nums}
      .kai51-boot-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      @keyframes kai51BootPulse{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
      @media(max-width:600px){.kai51-boot-stamp{right:12px;top:68px;width:calc(100vw - 24px)}}
    `;
    document.head.appendChild(s);
  }

  let el=null;
  function mount(){
    if(el)return el;
    el=document.createElement('aside');
    el.id='kai51BootStamp';
    el.className='kai51-boot-stamp';
    el.setAttribute('aria-live','polite');
    el.innerHTML=`
      <div class="kai51-boot-kicker"><span class="kai51-boot-dot"></span><span>HAxBRO AI</span></div>
      <div id="kai51BootTitle" class="kai51-boot-title">KAI 51 · REAL INTELLIGENCE MODEL IS LOADING</div>
      <div id="kai51BootText" class="kai51-boot-text"></div>
      <div class="kai51-boot-bar"><i id="kai51BootFill"></i></div>
      <div class="kai51-boot-meta"><b id="kai51BootPercent">0%</b><span id="kai51BootStatus">Preparing KAI 51</span></div>`;
    document.body.appendChild(el);
    return el;
  }

  function hide(){
    if(el){
      el.remove();
      el=null;
    }
  }

  function render(d={}){
    const nativeState=window.HAxBROKai51Bootstrap?.state?.();
    // READY is a durable installation state, not merely an in-memory runtime state.
    if(nativeState?.installed && nativeState?.verified && nativeState?.status==='ready'){
      hide();
      return;
    }

    const incoming=Math.max(0,Math.min(99,Math.round(Number(d.progress)||0)));
    const current=Number(document.getElementById('kai51BootPercent')?.textContent?.replace('%',''))||0;
    const pct=Math.max(current,incoming);
    mount();

    const title=document.getElementById('kai51BootTitle');
    const body=document.getElementById('kai51BootText');
    if(title) title.textContent='KAI 51 · REAL INTELLIGENCE MODEL IS LOADING';
    if(body) body.textContent='The full KAI 51 model is downloading from the HAxBRO GitHub Release and will be cached on this device. No manual download is required. After the first install, KAI 51 restores from the local browser cache.';
    document.getElementById('kai51BootFill').style.width=pct+'%';
    document.getElementById('kai51BootPercent').textContent=pct+'%';
    document.getElementById('kai51BootStatus').textContent=String(d.status||'Preparing KAI 51');
  }

  const initial=window.HAxBROKai51Bootstrap?.state?.();
  if(initial?.installed && initial?.verified && initial?.status==='ready'){
    hide();
    window.HAxBRO_KAI51_LOCAL_READY=true;
  }else{
    render({progress:initial?.status==='installing'?5:0,status:initial?.status==='installing'
      ?'Restoring KAI 51 from this device…'
      :'KAI LITE IS ACTIVE · KAI 51 is loading in the background'});
  }

  window.addEventListener('haxbro:kai-local-progress',e=>render(e.detail||{}));
  window.addEventListener('haxbro:kai51-bootstrap',e=>render(e.detail||{}));
  window.addEventListener('haxbro:kai51-ready',()=>{
    window.HAxBRO_KAI51_LOCAL_READY=true;
    hide();
  });
})();