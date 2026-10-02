(() => {
  if(!document.getElementById('kai51BootStyles')){
    const s=document.createElement('style');s.id='kai51BootStyles';s.textContent='.kai51-boot-stamp{display:block!important;visibility:visible!important;opacity:1!important;position:fixed;top:18px;right:18px;z-index:2147483000;width:min(360px,calc(100vw - 28px));padding:14px 16px;border:1px solid rgba(170,184,198,.58);border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 16px 42px rgba(20,35,50,.14),0 0 0 1px rgba(255,255,255,.7);backdrop-filter:blur(18px);font-family:Inter,system-ui,sans-serif;pointer-events:none}.kai51-boot-kicker{display:flex;align-items:center;gap:7px;font-size:9px;font-weight:800;letter-spacing:.12em;color:#70808f;text-transform:uppercase}.kai51-boot-dot{width:6px;height:6px;border-radius:50%;background:#26bfe8;box-shadow:0 0 10px rgba(38,191,232,.65);animation:kai51BootPulse 1.1s ease-in-out infinite}.kai51-boot-title{margin-top:8px;font-size:12px;font-weight:800;color:#17232d}.kai51-boot-text{margin-top:4px;font-size:10px;line-height:1.45;color:#72818e}.kai51-boot-bar{height:4px;margin-top:12px;border-radius:99px;background:#e8edf1;overflow:hidden}.kai51-boot-bar i{display:block;width:0;height:100%;border-radius:99px;background:linear-gradient(90deg,#26bfe8,#5a8dff);transition:width .25s ease}.kai51-boot-meta{display:flex;justify-content:space-between;gap:12px;margin-top:7px;font-size:9px;color:#84919d}.kai51-boot-meta b{font-size:10px;color:#2f5368;font-variant-numeric:tabular-nums}.kai51-boot-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@keyframes kai51BootPulse{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}@media(max-width:600px){.kai51-boot-stamp{top:12px;right:12px;width:calc(100vw - 24px)}}';document.head.appendChild(s);
  }
  let el=null;
  function mount(){if(el)return el;el=document.createElement('aside');el.id='kai51BootStamp';el.className='kai51-boot-stamp';el.setAttribute('aria-live','polite');el.innerHTML='<div class="kai51-boot-kicker"><span class="kai51-boot-dot"></span><span>HAxBRO AI</span></div><div id="kai51BootTitle" class="kai51-boot-title">KAI 51 · REAL INTELLIGENCE MODEL IS LOADING</div><div id="kai51BootText" class="kai51-boot-text">Kai Lite is chatting with you while the real KAI 51 intelligence model loads in the background.</div><div class="kai51-boot-bar"><i id="kai51BootFill"></i></div><div class="kai51-boot-meta"><b id="kai51BootPercent">0%</b><span id="kai51BootStatus">Preparing KAI 51</span></div>';document.body.appendChild(el);return el}
  function render(d={}){
    const pct=Math.max(0,Math.min(100,Math.round(Number(d.progress)||0))),box=mount();
    const ready=pct>=100||d.status==='ready'||d.status==='KAI 51 implemented';
    document.getElementById('kai51BootTitle').textContent=ready?'KAI 51 · REAL INTELLIGENCE MODEL READY':'KAI 51 · REAL INTELLIGENCE MODEL IS LOADING';
    document.getElementById('kai51BootText').textContent=ready?'KAI 51 advanced intelligence is ready.':'Kai Lite is chatting with you while the real KAI 51 intelligence model loads in the background.';
    document.getElementById('kai51BootFill').style.width=pct+'%';
    document.getElementById('kai51BootPercent').textContent=pct+'%';
    document.getElementById('kai51BootStatus').textContent=String(d.status||'Preparing KAI 51');
  }
  mount();
  /* The native KAI 51 conversation lane is available immediately. Do not present a browser-model download as a prerequisite. */
  render({progress:100,status:'KAI 51 native intelligence ready'});
  window.addEventListener('haxbro:kai-local-progress',e=>render(e.detail||{}));
  window.addEventListener('haxbro:kai51-bootstrap',e=>render(e.detail||{}));
  window.addEventListener('haxbro:kai51-ready',()=>render({progress:100,status:'ready'}));
})();