(() => {
  const state={model:localStorage.getItem('haxbro_model_choice')||'kai',preparing:false,initProgress:0};
  const $=id=>document.getElementById(id);
  const send=()=>$('sendBtn');
  function initOverlay(){
    let el=$('kaiInitOverlay');
    if(el)return el;
    el=document.createElement('div');el.id='kaiInitOverlay';el.className='kai-init-overlay';el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="kai-init-card"><div class="kai-init-orbit"><span id="kaiInitPercent" class="kai-init-percent">0%</span></div><div class="kai-init-title">KAI 51 · FIRST-USE INITIALIZATION</div><div id="kaiInitStatus" class="kai-init-status">Connecting to the model server…</div><div class="kai-init-track"><div id="kaiInitFill" class="kai-init-fill"></div></div><div class="kai-init-hint">The model is downloaded once and cached on this device. Do not close this tab.</div></div>';
    document.body.appendChild(el);return el;
  }
  function overlay(mode='show',progress=0,status='Retrieving KAI 51…'){
    const el=initOverlay(),pct=Math.max(0,Math.min(100,Math.round(Number(progress)||0)));
    const fill=$('kaiInitFill'),label=$('kaiInitPercent'),copy=$('kaiInitStatus');
    if(fill)fill.style.width=pct+'%';if(label)label.textContent=pct+'%';if(copy)copy.textContent=status;
    if(mode==='show'){el.classList.remove('is-leaving');el.classList.add('is-visible');el.setAttribute('aria-hidden','false')}
    if(mode==='hide'){el.classList.remove('is-visible');el.classList.add('is-leaving');el.setAttribute('aria-hidden','true');setTimeout(()=>el.remove(),1100)}
  }
  function button(mode='send',progress=0){
    const b=send(); if(!b)return;
    b.classList.remove('kai-download-mode','kai-download-loading','kai-download-ready','kai-download-error');
    if(mode==='download'){
      b.classList.add('kai-download-mode','kai-download-loading');
      b.disabled=true;
      b.setAttribute('aria-label','Preparing KAI 51');
      const pct=Math.max(0,Math.min(100,Math.round(progress)));
      b.innerHTML='<span class="kai-download-ring" aria-hidden="true"></span><span class="kai-download-text"><span class="kai-download-percent">'+pct+'%</span></span>';
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
    const orchestration=window.HAxBROKai51?.buildPlan?.(value,localStorage.getItem('haxbro_username')||'anonymous-device');
    const target=orchestration?.localCapability||'';
    const lower=String(value||'').toLowerCase();
    if(/\b(decode|decrypt)\b/.test(lower) && window.HAxBRODecodingPartner?.openWithInput){
      window.HAxBRODecodingPartner.openWithInput(value.replace(/^.*?\b(decode|decrypt)\b/i,'').trim()||''); return true;
    }
    if(/\b(encode|encrypt)\b/.test(lower) && window.HAxBRODecodingPartner?.open){
      window.HAxBRODecodingPartner.open(); return true;
    }
    if(/\b(app maker|build me an app|build an app|create an app|make an app)\b/.test(lower) && window.HAxBROFutureMaker?.open){
      await window.HAxBROFutureMaker.open(value,true); return true;
    }
    if(/\b(x pro|deep analysis|investigate this|analyze this deeply)\b/.test(lower) && window.HAxBRODeepX?.openWithTarget){
      window.HAxBRODeepX.openWithTarget(value); return true;
    }
    if(!api.status().ready){
      state.preparing=true;
      window.addMessage?.('KAI 51 is initializing for first use. The real model download has started and will be cached on this device.','bot');
      button('download',0);overlay('show',0,'Connecting to the KAI 51 model server…');
      const ok=await api.prepare();
      state.preparing=false;
      if(!ok){
        overlay('show',state.initProgress,'KAI 51 could not finish retrieving the model. Retry to resume.');
        window.addMessage?.('KAI 51 initialization failed. The model was not marked ready. Retry to resume the real download.','bot');
        button('error');
        return true;
      }
      overlay('show',100,'KAI 51 is ready. Finalizing local cache…');
      setTimeout(()=>overlay('hide',100,'KAI 51 ready'),420);
      window.addMessage?.('KAI 51 is ready. Ask anything.','bot');
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
      if(b&&Number.isFinite(Number(p.progress))){
        const n=Math.max(0,Math.min(100,Number(p.progress)));
        state.initProgress=n; button('download',n);
        const status=String(p.status||'').toLowerCase();
        const file=p.file?String(p.file).split('/').pop():'';
        const label=status.includes('ready')?'Finalizing local model…':(status.includes('download')||status==='progress'?'Downloading '+(file||'KAI 51 model')+'…':'Retrieving KAI 51…');
        overlay('show',n,label+' '+Math.round(n)+'%');
      }
    });
    window.addEventListener('haxbro:kai-local-ready',()=>{if(state.model==='kai'){state.preparing=false;state.initProgress=100;button('ready');overlay('show',100,'KAI 51 is ready. Finalizing local cache…');setTimeout(()=>overlay('hide',100,'KAI 51 ready'),420)}});
    window.addEventListener('haxbro:kai-local-error',e=>{if(state.model==='kai'&&state.preparing){state.preparing=false;overlay('show',state.initProgress,'Model retrieval failed — retry to resume.');button('error')}});
    applyChoice(localStorage.getItem('haxbro_model_choice')||'kai');
  });
})();