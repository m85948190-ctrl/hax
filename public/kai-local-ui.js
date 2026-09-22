(() => {
  const state={model:localStorage.getItem('haxbro_model_choice')||'kai',preparing:false};
  const $=id=>document.getElementById(id);
  const send=()=>$('sendBtn');
  function button(mode='send',progress=0){
    const b=send(); if(!b)return;
    b.classList.remove('kai-download-mode','kai-download-loading','kai-download-ready','kai-download-error');
    if(mode==='download'){
      b.classList.add('kai-download-mode','kai-download-loading');
      b.disabled=true;
      b.setAttribute('aria-label','Downloading KAI model');
      b.innerHTML='<span class="kai-download-icon">↓</span><span class="kai-download-text">DOWNLOAD KAI</span>';
    } else if(mode==='ready'){
      b.classList.add('kai-download-ready');
      b.disabled=false;
      b.setAttribute('aria-label','Send');
      b.innerHTML='<b>➜</b><span>➜</span>';
    } else if(mode==='error'){
      b.classList.add('kai-download-error');
      b.disabled=false;
      b.setAttribute('aria-label','Retry KAI model download');
      b.innerHTML='<span class="kai-download-icon">↻</span><span class="kai-download-text">RETRY KAI</span>';
    } else {
      b.disabled=false;
      b.setAttribute('aria-label','Send');
      b.innerHTML='<b>➜</b><span>➜</span>';
    }
  }
  function applyChoice(choice){
    state.model=choice||'kai';
    localStorage.setItem('haxbro_model_choice',state.model);
    window.HAxBROSelectedModel=state.model;
    document.querySelectorAll('.model-option').forEach(x=>x.classList.toggle('active',x.dataset.modelChoice===state.model));
    const label=$('selectedModelLabel');
    if(label)label.textContent=state.model==='kai'?'KAI':(document.querySelector('.model-option.active b')?.textContent||'AI');
    button('send');
  }
  async function runLocal(value){
    const api=window.HAxBROLocalKai;
    if(!api)return false;
    if(!api.status().ready){
      state.preparing=true;
      // First-use KAI setup is communicated inside the conversation, not as a download button.
      button('send');
      const prepMessage=window.addMessage?.('KAI needs to be downloaded for first use. Wait a few seconds — it will download automatically.','bot');
      const ok=await api.prepare();
      state.preparing=false;
      if(!ok){
        window.addMessage?.('KAI could not finish its first-time download. Please try sending again.','bot');
        button('send');
        return true;
      }
      window.addMessage?.('KAI downloaded. Ask anything.','bot');
    }
    button('ready');
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
    }finally{
      if(window.setBusy)window.setBusy(false);
      button('send');
    }
    return true;
  }
  function intercept(e){
    if(state.model!=='kai')return;
    const value=String($('promptInput')?.value||'').trim();
    if(!value || state.preparing)return;
    e.preventDefault();e.stopImmediatePropagation();
    window.addMessage?.(value,'user');
    $('promptInput').value='';
    runLocal(value);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const picker=$('modelPickerBtn'),menu=$('modelPickerMenu');
    if(picker&&menu){
      picker.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();menu.hidden=!menu.hidden;picker.setAttribute('aria-expanded',menu.hidden?'false':'true')});
      menu.querySelectorAll('.model-option').forEach(btn=>btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();applyChoice(btn.dataset.modelChoice);
        menu.hidden=true;picker.setAttribute('aria-expanded','false');
      }));
      document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==picker){menu.hidden=true;picker.setAttribute('aria-expanded','false')}});
    }
    document.addEventListener('click',e=>{if(e.target.closest('#sendBtn'))intercept(e)},true);
    document.addEventListener('submit',e=>{if(e.target?.id==='chatForm')intercept(e)},true);
    document.addEventListener('keydown',e=>{
      if(e.target?.id==='promptInput'&&e.key==='Enter'&&!e.shiftKey&&state.model==='kai')intercept(e);
    },true);
    window.addEventListener('haxbro:kai-local-progress',e=>{
      if(state.model!=='kai'||!state.preparing)return;
      const p=e.detail||{},b=send();
      if(b&&p.status==='progress_total'&&Number.isFinite(p.progress)){
        const n=Math.round(p.progress);
        b.innerHTML='<span class="kai-download-icon">↓</span><span class="kai-download-text">DOWNLOAD '+n+'%</span>';
      }
    });
    window.addEventListener('haxbro:kai-local-ready',()=>{if(state.model==='kai'&&!state.preparing)button('send')});
    window.addEventListener('haxbro:kai-local-error',()=>{if(state.model==='kai'&&state.preparing){state.preparing=false;button('error')}});
    applyChoice(localStorage.getItem('haxbro_model_choice')||'kai');
  });
})();