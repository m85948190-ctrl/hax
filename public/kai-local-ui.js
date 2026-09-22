(() => {
  const state={model:localStorage.getItem('haxbro_model_choice')||'kai',preparing:false};
  const $=id=>document.getElementById(id);
  const statusEl=()=>{
    let el=$('kaiDownloadStatus');
    if(!el){
      el=document.createElement('div');el.id='kaiDownloadStatus';el.className='kai-download-status';el.hidden=true;
      document.querySelector('.composer')?.insertAdjacentElement('afterend',el);
    }
    return el;
  };
  function setStatus(text,show=true,kind=''){
    const el=statusEl();el.textContent=text;el.hidden=!show;el.dataset.kind=kind;
  }
  function setBadge(mode){
    const b=$('kaiDownloadBadge');if(!b)return;
    b.className='kai-download-badge '+mode;
    b.textContent=mode==='ready'?'✓':mode==='loading'?'⋯':'↓';
    b.title=mode==='ready'?'KAI local model ready':'First KAI message downloads the local model';
  }
  function applyChoice(choice){
    state.model=choice||'kai';localStorage.setItem('haxbro_model_choice',state.model);
    window.HAxBROSelectedModel=state.model;
    document.querySelectorAll('.model-option').forEach(x=>x.classList.toggle('active',x.dataset.modelChoice===state.model));
    const label=$('selectedModelLabel');if(label)label.textContent=state.model==='kai'?'KAI':(document.querySelector('.model-option.active b')?.textContent||'AI');
    setBadge(state.model==='kai'?(window.HAxBROLocalKai?.status()?.ready?'ready':'idle'):'hidden');
    if(state.model==='kai')setStatus('KAI LOCAL · first send downloads the model to this browser.',true,'idle');else setStatus('',false);
  }
  async function runLocal(value){
    const api=window.HAxBROLocalKai;if(!api)return false;
    if(!api.status().ready){
      state.preparing=true;setBadge('loading');setStatus('KAI LOCAL · downloading model… please wait a few seconds.',true,'loading');
      if(window.setBusy)window.setBusy(true);
      const ok=await api.prepare();
      state.preparing=false;
      if(!ok){setBadge('idle');setStatus('KAI LOCAL · download could not finish. No provider fallback was used.',true,'error');if(window.setBusy)window.setBusy(false);return true;}
    }
    setBadge('ready');setStatus('KAI LOCAL · model ready on this browser.',true,'ready');
    if(window.setBusy)window.setBusy(true);
    try{
      const result=await api.respond(value);
      if(result?.response){
        window.kaiActivityFinish?.({sources:result.sources||[]});
        window.addMessage?.(result.response,'bot');
      }else{
        window.kaiActivityFinish?.({sources:[]});
        window.addMessage?.('KAI LOCAL could not produce a response. No provider fallback was used.','bot');
      }
    }catch(e){
      window.kaiActivityFinish?.({sources:[]});
      window.addMessage?.('KAI LOCAL error: '+(e?.message||'Unknown error')+'. No provider fallback was used.','bot');
    }finally{if(window.setBusy)window.setBusy(false)}
    return true;
  }
  function intercept(e){
    if(state.model!=='kai')return;
    const value=String($('promptInput')?.value||'').trim();if(!value)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(window.checkAdmin69)return;
    window.addMessage?.(value,'user');$('promptInput').value='';window.resize?.();
    runLocal(value);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const picker=$('modelPickerBtn'),menu=$('modelPickerMenu');
    if(picker&&menu){
      picker.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();menu.hidden=!menu.hidden;picker.setAttribute('aria-expanded',menu.hidden?'false':'true')});
      menu.querySelectorAll('.model-option').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyChoice(btn.dataset.modelChoice);menu.hidden=true;picker.setAttribute('aria-expanded','false')}));
      document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==picker){menu.hidden=true;picker.setAttribute('aria-expanded','false')}});
    }
    document.addEventListener('click',e=>{if(e.target.closest('#sendBtn'))intercept(e)},true);
    document.addEventListener('submit',e=>{if(e.target?.id==='chatForm')intercept(e)},true);
    document.addEventListener('keydown',e=>{
      if(e.target?.id==='promptInput'&&e.key==='Enter'&&!e.shiftKey&&state.model==='kai')intercept(e);
    },true);
    window.addEventListener('haxbro:kai-local-progress',e=>{
      if(state.model!=='kai')return;
      const p=e.detail||{};
      if(p.status==='progress_total'&&Number.isFinite(p.progress))setStatus('KAI LOCAL · downloading model '+Math.round(p.progress)+'% · please wait a few seconds.',true,'loading');
      else if(p.status==='download')setStatus('KAI LOCAL · downloading model… please wait a few seconds.',true,'loading');
    });
    window.addEventListener('haxbro:kai-local-ready',()=>{if(state.model==='kai'){setBadge('ready');setStatus('KAI LOCAL · model ready on this browser.',true,'ready')}});
    window.addEventListener('haxbro:kai-local-error',e=>{if(state.model==='kai'){setBadge('idle');setStatus('KAI LOCAL · model download failed. No provider fallback was used.',true,'error')}});
    applyChoice(localStorage.getItem('haxbro_model_choice')||'kai');
  });
})();