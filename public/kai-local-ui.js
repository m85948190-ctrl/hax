(() => {
  const userModelKey=()=>{const n=(localStorage.getItem('haxbro_username')||'anonymous-device').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'_').slice(0,64)||'anonymous-device';return 'haxbro:user:'+n+':model_choice'};
  const state={model:localStorage.getItem(userModelKey())||'kai-router',preparing:false,activeProfile:'light',initProgress:0,displayProgress:0,progressTimer:null,overlayReleased:false};
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
    el.innerHTML='<div class="kai-init-card"><div class="kai-init-brand"><span class="kai-init-live-dot"></span><span>LOCAL ENGINE</span><span class="kai-init-brand-line"></span><span>KAI 51</span></div><div class="kai-init-orbit"><i class="kai-init-ring" aria-hidden="true"></i><span id="kaiInitPercent" class="kai-init-percent">0%</span></div><div class="kai-init-title">KAI 51 · LOCAL RUNTIME</div><div id="kaiInitStatus" class="kai-init-status">Starting secure local initialization…</div><div class="kai-init-track"><div id="kaiInitFill" class="kai-init-fill"></div></div><div id="kaiInitPhase" class="kai-init-phase"><span class="kai-init-phase-dot"></span><span>MODEL DOWNLOAD</span><b>0%</b></div><div class="kai-init-hint">Downloaded once · cached locally · no provider handoff</div></div>';
    document.body.appendChild(el);return el;
  }
  function overlay(mode='show',progress=0,status='Retrieving KAI 51…',phase='download'){
    const el=initOverlay(),pct=Math.max(0,Math.min(100,Math.round(Number(progress)||0)));
    const fill=$('kaiInitFill'),label=$('kaiInitPercent'),copy=$('kaiInitStatus'),phaseEl=$('kaiInitPhase');
    if(fill)fill.style.width=pct+'%';
    if(label)label.textContent=pct+'%';
    if(copy)copy.textContent=status;
    if(phaseEl){
      phaseEl.classList.toggle('is-initializing',phase==='initializing');
      phaseEl.innerHTML=phase==='initializing'
        ? '<span class="kai-init-phase-dot"></span><span>INITIALIZING RUNTIME</span><b class="kai-init-live-text">ACTIVE</b>'
        : '<span class="kai-init-phase-dot"></span><span>MODEL DOWNLOAD</span><b>'+pct+'%</b>';
    }
    if(mode==='show'){el.style.opacity='1';el.style.visibility='visible';el.classList.remove('is-leaving');el.classList.add('is-visible');el.setAttribute('aria-hidden','false')}
    if(mode==='hide'){el.style.opacity='0';el.style.visibility='hidden';el.classList.remove('is-visible');el.classList.add('is-leaving');el.setAttribute('aria-hidden','true');setTimeout(()=>el.remove(),900)}
  }
  function animateProgress(target){
    target=Math.max(0,Math.min(100,Number(target)||0));
    clearInterval(state.progressTimer);
    state.progressTimer=setInterval(()=>{
      if(state.displayProgress>=target){clearInterval(state.progressTimer);return}
      const step=state.displayProgress<20?1:state.displayProgress<70?2:1;
      state.displayProgress=Math.min(target,state.displayProgress+step);
      button('download',state.displayProgress);
      const fill=$('kaiInitFill'),label=$('kaiInitPercent'),phase=$('kaiInitPhase');
      if(fill)fill.style.width=state.displayProgress+'%';
      if(label)label.textContent=state.displayProgress+'%';
      if(phase&&!phase.classList.contains('is-initializing')){const b=phase.querySelector('b');if(b)b.textContent=state.displayProgress+'%';}
    },55);
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
  function removeExternalProviderOptions(){
    document.querySelectorAll('.model-option[data-model-choice="openai"],.model-option[data-model-choice="google"],.model-option[data-model-choice="openrouter"],.model-option[data-model-choice="groq"],.model-option[data-model-choice="mistral"]').forEach(el=>el.remove());
  }
  function applyChoice(choice){
    const allowed=new Set(['kai-router','kai-local','kai-github','kai-largest','kai-lite']);
    state.model=allowed.has(choice)?choice:'kai-local';
    localStorage.setItem(userModelKey(),state.model);
    window.HAxBROSelectedModel=state.model;
    document.documentElement.dataset.haxbroModel=state.model;
    document.querySelectorAll('.model-option').forEach(x=>x.classList.toggle('active',x.dataset.modelChoice===state.model));
    const label=$('selectedModelLabel');
    if(label)label.textContent=state.model==='kai-router'?'KAI ROUTER · AUTO':state.model==='kai-lite'?'KAI LITE':state.model==='kai-largest'?'KAI 51 · LARGEST 1.7B':state.model==='kai-github'?'KAI 51 · GITHUB 360M':'KAI 51 · LOCAL';
    if(state.model==='kai-lite') state.preparing=false;
    button('send');
    window.dispatchEvent(new CustomEvent('haxbro:model-selected',{detail:{model:state.model}}));
  }
  async function runLocal(value){
    const api=window.HAxBROLocalKai;
    if(!api)return false;
    // Deterministic/simple requests never need KAI 51 initialization or model inference.
    const trivialLocal=/^\s*[0-9](?:[0-9+*%().\s-]{0,80})\s*$/.test(value)||/^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay)\b/i.test(value);
    state.activeProfile=trivialLocal?'light':(api.profileFor?.(value)||'light');
    const orchestration=window.HAxBROKai51?.buildPlan?.(value,localStorage.getItem('haxbro_username')||'anonymous-device');
    const target=orchestration?.localCapability||'';
    const lower=String(value||'').toLowerCase();
    if(/\b(decode|decrypt)\b/.test(lower) && window.HAxBRODecodingPartner?.openWithInput){
      window.HAxBRODecodingPartner.openWithInput(value.replace(/^.*?\b(decode|decrypt)\b/i,'').trim()||''); return true;
    }
    if(/\b(encode|encrypt)\b/.test(lower) && (window.HAxBRODecodingPartner?.openEncrypt||window.HAxBRODecodingPartner?.open)){
      const payload=String(value).replace(/^.*?\b(encode|encrypt|encryption)\b/i,'').trim();
      if(window.HAxBRODecodingPartner?.openEncrypt) window.HAxBRODecodingPartner.openEncrypt(payload); else window.HAxBRODecodingPartner.open(); return true;
    }
    if(/\b(app maker|build me an app|build an app|create an app|make an app)\b/.test(lower) && window.HAxBROFutureMaker?.open){
      await window.HAxBROFutureMaker.open(value,true); return true;
    }
    if(/\b(x pro|deep analysis|investigate this|analyze this deeply)\b/.test(lower) && window.HAxBRODeepX?.openWithTarget){
      window.HAxBRODeepX.openWithTarget(value); return true;
    }
    // KAI remains primary. Pick the fast 135M runtime for simple requests and the full 360M KAI 51 runtime for complex work.
    if(!api.status().ready || api.status().profile!==state.activeProfile){
      if(!state.preparing) beginWarmup(state.activeProfile);
      if(!state.overlayReleased && !api.status().models?.[state.activeProfile]?.installed){
        overlay('show',state.initProgress,state.activeProfile==='heavy'?'Installing KAI 51 locally…':'Installing KAI FAST locally…');
        button('download',state.initProgress);
      }
      await api.prepare(state.activeProfile);
    }
    if(window.setBusy)window.setBusy(true);
    try{
      let result=null;
      result=api.status().ready ? await api.respond(value,state.activeProfile==='heavy'?'deep':'light') : null;
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
  /* Main chat is owned by public/script.js. Do not intercept submit/click here: that used to bypass KAI's real router and made Decoder/Encoder/Expert/App Maker handoffs appear broken. */
  function beginWarmup(profile='light'){
    const api=window.HAxBROLocalKai;
    if(!api||state.model!=='kai'||state.preparing||api.status().profile===profile)return;
    state.preparing=true;state.activeProfile=profile;
    const installed=!!api.status().models?.[profile]?.installed;
    if(!installed){button('download',state.initProgress);overlay('show',state.initProgress,profile==='heavy'?'Installing KAI 51 locally…':'Installing KAI FAST locally…','download');}
    api.prepare(profile).then(ok=>{state.preparing=false;if(ok){state.initProgress=100;state.displayProgress=100;button('ready');if(!installed)overlay('hide',100,profile==='heavy'?'KAI 51 installed and ready.':'KAI FAST installed and ready.','initializing');}else{button('send');if(!installed)overlay('hide',state.initProgress,'KAI 51 continues warming in the background…','download');}});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    removeExternalProviderOptions();
    const picker=$('modelPickerBtn'),menu=$('modelPickerMenu');
    if(picker&&menu){
      picker.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();menu.hidden=!menu.hidden;picker.setAttribute('aria-expanded',menu.hidden?'false':'true')});
      menu.querySelectorAll('.model-option').forEach(btn=>btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();applyChoice(btn.dataset.modelChoice);
        menu.hidden=true;picker.setAttribute('aria-expanded','false');
      }));
      document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==picker){menu.hidden=true;picker.setAttribute('aria-expanded','false')}});
    }
    /* The main KAI orchestrator owns Send/Enter. This UI module only renders local-model state; it must never block workspace routing or API recovery. */
    window.addEventListener('haxbro:kai-local-progress',e=>{
      if(state.model!=='kai'||!state.preparing)return;
      const p=e.detail||{}; if((p.profile||'light')!==state.activeProfile || p.installed)return;
      const b=send();
      if(b&&Number.isFinite(Number(p.progress))){
        const incoming=Math.max(0,Math.min(100,Number(p.progress)));
        const n=Math.max(state.initProgress,incoming);
        state.initProgress=n;
        if(state.overlayReleased) return;
        animateProgress(n);
        const status=String(p.status||'').toLowerCase();
        const file=p.file?String(p.file).split('/').pop():'';
        const initializing=n>=100 && !apiStatusReady();
        if(n>=100){
          state.overlayReleased=true;
          button('ready');
          overlay('hide',100,'KAI 51 initializing in background…','initializing');
          return;
        }
        const label=initializing?'Download complete — initializing KAI 51 locally…':(status.includes('download')||status==='progress'?'Downloading '+(file||'KAI 51 model')+'…':'Retrieving KAI 51…');
        overlay('show',n,label,initializing?'initializing':'download');
      }
    });
    function apiStatusReady(){return !!window.HAxBROLocalKai?.status?.().ready;}
    window.addEventListener('haxbro:kai-local-ready',e=>{if(state.model==='kai'){const p=e.detail?.profile||state.activeProfile;if(p!==state.activeProfile)return;state.preparing=false;state.initProgress=100;state.displayProgress=100;state.overlayReleased=true;button('ready');if(!e.detail?.profile||!window.HAxBROLocalKai?.status?.().models?.[p]?.installed)overlay('hide',100,p==='heavy'?'KAI 51 ready':'KAI FAST ready','initializing')}});
    window.addEventListener('haxbro:kai-local-error',e=>{if(state.model==='kai'&&state.preparing){state.preparing=false;const detail=String(e?.detail||'');console.warn('KAI local model is still warming; KAI Lite remains available',detail);overlay('hide',state.initProgress,'KAI 51 continues warming in the background…','download');button('send')}});
    applyChoice(localStorage.getItem(userModelKey())||'kai-router');
    window.addEventListener('haxbro:username-changed',()=>applyChoice(localStorage.getItem(userModelKey())||'kai-local'));
    // Do not auto-install or re-initialize KAI on every page visit. The model is prepared on first KAI use.
    // This keeps returning users out of the installation flow and prevents the 100% initialization box from reappearing between chats.
  });
})();