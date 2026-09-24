(() => {
  const state={model:localStorage.getItem('haxbro_model_choice')||'kai',preparing:false,initProgress:0};
  const $=id=>document.getElementById(id);
  const send=()=>$('sendBtn');
  function initOverlay(){
    let el=$('kaiInitOverlay');
    if(el)return el;
    el=document.createElement('div');el.id='kaiInitOverlay';el.className='kai-init-overlay';el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="kai-init-card"><div class="kai-init-orbit"><span id="kaiInitPercent" class="kai-init-percent">0%</span></div><div class="kai-init-title">KAI 51 · FIRST-USE INITIALIZATION</div><div id="kaiInitStatus" class="kai-init-status">Connecting to the model server…</div><div class="kai-init-track"><div id="kaiInitFill" class="kai-init-fill"></div></div><div class="kai-init-hint">The model is downloaded once and cached on this device. Do not close this tab.</div></div>';
    if(!document.getElementById('kai51InlineStyle')){const s=document.createElement('style');s.id='kai51InlineStyle';s.textContent='@keyframes kaiRingSpin{to{transform:rotate(360deg)}}';document.head.appendChild(s)}
    el.style.pointerEvents='none';
    el.style.position='fixed';el.style.inset='0';el.style.zIndex='99999';el.style.display='flex';el.style.alignItems='center';el.style.justifyContent='center';el.style.opacity='0';el.style.visibility='hidden';el.style.transition='opacity .7s ease,visibility .7s ease';el.style.background='rgba(247,250,252,.72)';el.style.backdropFilter='blur(10px)';
    el.innerHTML='<div class="kai-init-card" style="width:min(390px,calc(100vw - 40px));padding:28px 26px 24px;border:1px solid rgba(0,170,220,.24);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 24px 80px rgba(0,80,120,.16);text-align:center"><div class="kai-init-orbit" style="width:76px;height:76px;margin:0 auto 16px;border-radius:50%;border:4px solid rgba(0,180,230,.14);border-top-color:#00bde8;border-right-color:#00d9ff;animation:kaiRingSpin .8s linear infinite;position:relative"><span id="kaiInitPercent" class="kai-init-percent" style="font:900 17px/1 ui-monospace,monospace;color:#087f9f;position:absolute;inset:0;display:grid;place-items:center">0%</span></div><div class="kai-init-title" style="font:900 13px/1.2 ui-monospace,monospace;letter-spacing:.12em;color:#102532">KAI 51 · LOCAL RUNTIME</div><div id="kaiInitStatus" class="kai-init-status" style="margin-top:7px;font:600 11px/1.4 ui-monospace,monospace;color:#5c7380;min-height:16px">Warming in background…</div><div class="kai-init-track" style="height:7px;margin-top:18px;border-radius:99px;background:rgba(0,160,210,.11);overflow:hidden"><div id="kaiInitFill" class="kai-init-fill" style="height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#00a9df,#00e0ff,#00a9df);transition:width .45s ease"></div></div><div class="kai-init-hint" style="margin-top:12px;font:600 9px/1.4 ui-monospace,monospace;color:#78909b">This full-capacity local model warms once. You can keep chatting immediately.</div></div>';
    document.body.appendChild(el);return el;
  }
  function overlay(mode='show',progress=0,status='Retrieving KAI 51…'){
    const el=initOverlay(),pct=Math.max(0,Math.min(100,Math.round(Number(progress)||0)));
    const fill=$('kaiInitFill'),label=$('kaiInitPercent'),copy=$('kaiInitStatus');
    if(fill)fill.style.width=pct+'%';if(label)label.textContent=pct+'%';if(copy)copy.textContent=status;
    if(mode==='show'){el.style.opacity='1';el.style.visibility='visible';el.classList.remove('is-leaving');el.classList.add('is-visible');el.setAttribute('aria-hidden','false')}
    if(mode==='hide'){el.style.opacity='0';el.style.visibility='hidden';el.classList.remove('is-visible');el.classList.add('is-leaving');el.setAttribute('aria-hidden','true');setTimeout(()=>el.remove(),900)}
  }
  function button(mode='send',progress=0){
    const b=send(); if(!b)return;
    b.classList.remove('kai-download-mode','kai-download-loading','kai-download-ready','kai-download-error');
    if(mode==='download'){
      b.classList.add('kai-download-mode','kai-download-loading');
      b.disabled=false;
      b.setAttribute('aria-label','Send while KAI 51 warms in background');
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
    // Never make the user wait for a browser model download. KAI 51's full local model warms in the background,
    // while the normal server compute path answers immediately. The local runtime becomes a zero-network fallback once ready.
    if(!api.status().ready && !state.preparing){
      state.preparing=true; state.initProgress=0;
      window.addMessage?.('KAI 51 local runtime is warming in the background. Your response does not wait for the download.','bot');
      button('download',0); overlay('show',0,'Warming the full KAI 51 local runtime in background…');
      api.prepare().then(ok=>{
        state.preparing=false;
        if(ok){overlay('show',100,'KAI 51 local runtime ready. Switching to instant local fallback…');setTimeout(()=>overlay('hide',100),420);button('ready');window.addMessage?.('KAI 51 local runtime is ready on this device.','bot');}
        else {overlay('hide');button('send');window.addMessage?.('KAI 51 local runtime could not finish warming. Server KAI remains available.','bot');}
      });
    }
    if(window.setBusy)window.setBusy(true);
    try{
      let result=null;
      if(api.status().ready){
        result=await api.respond(value);
      } else {
        const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:value,mode:'normal',username:localStorage.getItem('haxbro_username')||'',kaiId:'KAI51',modelChoice:'auto'})});
        const d=await r.json().catch(()=>({}));
        if(r.ok&&d.response) result={response:d.response,provider:d.provider||'KAI 51 compute',sources:d.sources||[]};
      }
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
    if(!value)return;
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