(() => {
  const $=s=>document.querySelector(s);
  let active=null,tick=null;
  const fmt=s=>{s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
  const predict=t=>{
    const x=String(t||'').trim();
    if(!x)return 3;
    if(/build|create|generate|app maker|code|research|investigate|analy[sz]e|compare|latest|current|security|decode|encrypt|website|file/i.test(x)) return Math.min(30,Math.max(8,Math.ceil(x.length/160)*3));
    return x.length>400?7:4;
  };
  function stop(){if(tick){clearInterval(tick);tick=null}active=null}
  function start(text){
    stop();
    const rail=$('#ultimaxLiveRail'),elapsed=$('#ultimaxElapsed'),state=$('#ultimaxLiveState'),log=$('#ultimaxLiveLog');
    if(!rail||!elapsed||!state)return;
    const estimate=predict(text); active={started:performance.now(),estimate}; rail.hidden=false;
    state.textContent='THINKING';state.className='ultimax-live-state running';
    if(log){const row=document.createElement('div');row.className='ultimax-log-line';row.textContent='KAI 51 · predicted response window '+estimate+'s';log.appendChild(row);log.scrollTop=log.scrollHeight}
    tick=setInterval(()=>{
      if(!active)return;
      const sec=(performance.now()-active.started)/1000,over=sec-active.estimate;
      elapsed.textContent=over>0?'-'+fmt(over):fmt(sec);
      state.textContent=over>0?'OVERRUN':'THINKING';state.classList.toggle('overrun',over>0);
    },100);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#sendBtn')){
      const input=$('#promptInput'); if(input?.value.trim()) start(input.value);
    }
  },true);
  const messages=$('#messages');
  if(messages)new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes||[])if(n.nodeType===1&&n.classList?.contains('bot-msg')){stop();const state=$('#ultimaxLiveState');if(state){state.textContent='READY';state.className='ultimax-live-state done'}}}).observe(messages,{childList:true});
  window.HAxBROPredictiveTimer={start,stop,predict};
})();