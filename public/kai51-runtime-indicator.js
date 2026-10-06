(() => {
  const id='kai51RuntimeHook';
  let el=null;
  const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
  function mount(){
    if(el)return el;
    el=document.createElement('div');el.id=id;el.setAttribute('aria-live','polite');
    el.innerHTML='<span class="hook-lock">🔒</span><span class="hook-dot"></span><span class="hook-name">KAI 51</span><span class="hook-pct">0%</span><span class="hook-lite">· MODEL LOADING</span>';
    document.body.appendChild(el);return el;
  }
  function render(d={}){
    const state=window.HAxBROKai51Bootstrap?.state?.()||{};
    const x=mount();
    if(state.status==='ready'&&state.installed&&state.verified){
      x.classList.add('is-ready');
      const p=x.querySelector('.hook-pct');if(p)p.textContent='100%';
      const lite=x.querySelector('.hook-lite');if(lite)lite.textContent='· KAI 51 READY · GITHUB Q4';
      return;
    }
    x.classList.remove('is-ready');
    const pct=clamp(d.progress??(state.status==='installing'?5:0));
    const p=x.querySelector('.hook-pct');if(p)p.textContent=pct+'%';
    const lite=x.querySelector('.hook-lite');
    if(lite){
      lite.textContent=state.status==='ready'
        ? '· KAI 51 READY'
        : (state.status==='error'
          ? '· KAI LITE ACTIVE · MODEL RETRYING'
          : '· KAI LITE ACTIVE · MODEL DOWNLOADING');
    }
  }
  window.addEventListener('haxbro:kai-local-progress',e=>render(e.detail||{}));
  window.addEventListener('haxbro:kai51-bootstrap',e=>render(e.detail||{}));
  window.addEventListener('haxbro:kai51-ready',()=>{const x=mount();x.classList.add('is-ready')});
  setTimeout(()=>render(),400);
})();