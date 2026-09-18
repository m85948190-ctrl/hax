// ── KAI ROAST SYSTEM · separate trigger + confirmed red workspace ──
(function(){
  const ROAST_VARIANTS=/\\b(?:moinak|moinac|moinakh|moynak|moinak+|monak|moinack|mainack|mainak)\\b/i;
  const EXACT_MAINAK=/\\bI\\s+am\\s+Mainak\\b/i;
  let roastMode=false, roastConfirmOpen=false, roastOverlay=null, roastLog=null, roastInput=null;
  function roastEsc(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML.replace(/\\n/g,'<br>')}
  function ensureRoastUI(){
    if(roastOverlay)return;
    roastOverlay=document.createElement('section');roastOverlay.className='roast-mode-overlay';roastOverlay.hidden=true;roastOverlay.setAttribute('aria-label','Roast Mode');
    roastOverlay.innerHTML='<div class="roast-mode-top"><div class="roast-mode-brand"><span class="roast-mode-dot"></span><span>ROAST MODE</span></div><div class="roast-mode-status">KAI · RED COMEDY CORE · ONLINE</div><button type="button" class="roast-mode-exit">EXIT</button></div><div class="roast-mode-log"></div><div class="roast-mode-compose"><textarea class="roast-mode-input" rows="1" placeholder="Say the name. KAI is listening..."></textarea><button type="button" class="roast-mode-send" aria-label="Send roast">➜</button></div>';
    document.body.appendChild(roastOverlay);roastLog=roastOverlay.querySelector('.roast-mode-log');roastInput=roastOverlay.querySelector('.roast-mode-input');
    roastOverlay.querySelector('.roast-mode-exit').onclick=exitRoastMode;
    roastOverlay.querySelector('.roast-mode-send').onclick=()=>sendRoast(roastInput.value);
    roastInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendRoast(roastInput.value)}});
  }
  function addRoastLine(text,who){ensureRoastUI();if(roastLog.querySelector('.roast-mode-empty'))roastLog.innerHTML='';const row=document.createElement('div');row.className='roast-mode-line '+(who==='user'?'user':'bot');const bubble=document.createElement('div');bubble.className='roast-mode-bubble';const label=document.createElement('div');label.className='roast-mode-label';label.textContent=who==='user'?'MAINAK':'KAI · ROAST';bubble.innerHTML=label.outerHTML+roastEsc(text);row.appendChild(bubble);roastLog.appendChild(row);roastLog.scrollTop=roastLog.scrollHeight}
  function activateRoastMode(){
    ensureRoastUI();roastMode=true;roastConfirmOpen=false;document.body.classList.add('roast-mode');roastOverlay.hidden=false;localStorage.setItem('haxbro_roast_mode','on');roastLog.innerHTML='<div class="roast-mode-empty"><strong>🔴 ROAST MODE: ON</strong><span>Red comedy workspace active. Name the target.</span></div>';setTimeout(()=>roastInput?.focus(),60);
  }
  function exitRoastMode(){roastMode=false;roastConfirmOpen=false;document.body.classList.remove('roast-mode');if(roastOverlay)roastOverlay.hidden=true;localStorage.removeItem('haxbro_roast_mode')}
  function askRoastMode(){
    if(roastConfirmOpen||roastMode)return;
    roastConfirmOpen=true;
    const old=document.querySelector('.roast-mode-confirm');old?.remove();
    const box=document.createElement('div');box.className='roast-mode-confirm';box.innerHTML='<h3>ROAST MODE?</h3><p>KAI detected a name trigger. Do you want to shift to Roast Mode?</p><div class="roast-mode-confirm-actions"><button class="roast-confirm-yes" type="button">YES · SHIFT</button><button class="roast-confirm-no" type="button">NO · STAY</button></div>';document.body.appendChild(box);
    box.querySelector('.roast-confirm-yes').onclick=()=>{box.remove();activateRoastMode()};
    box.querySelector('.roast-confirm-no').onclick=()=>{box.remove();roastConfirmOpen=false};
  }
  async function sendRoast(text){
    const value=String(text||'').trim();if(!value)return;
    addRoastLine(value,'user');roastInput.value='';
    try{
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,mode:'normal',study:false,username:localStorage.getItem('haxbro_username')||'',history:'[]',prompt:'You are KAI ROAST CORE inside a user-confirmed Roast Mode. Respond in English only, with a strong Indian/desi comedic flavor. Be savage, punchy, slang-heavy and witty when the user asks for a roast. Roast the target named by the user, not protected traits. Do not threaten, encourage violence, or produce hateful/protected-class abuse. Do not claim real harm. If the user is not asking for a roast, remain in roast-mode persona and ask what name or subject they want roasted.\nUSER REQUEST:\n'+value})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||('HTTP '+r.status));addRoastLine(d.response||d.text||d.message||d.answer||'KAI ROAST CORE returned no line.','bot');
    }catch(e){addRoastLine('Roast Core connection error: '+(e?.message||'Unknown error'),'bot')}
  }
  const originalSendChat=window.sendChat||sendChat;
  window.sendChat=async function(value){
    const v=String(value||'').trim();if(!v)return false;
    if(roastMode){await sendRoast(v);return true}
    if(EXACT_MAINAK.test(v)){activateRoastMode();return true}
    if(ROAST_VARIANTS.test(v)){askRoastMode();return true}
    return originalSendChat(v);
  };
  // Rebind the existing form/click handlers to the wrapped router without touching normal tools.
  const form=document.getElementById('chatForm'),button=document.getElementById('sendBtn'),field=document.getElementById('promptInput');
  if(form){form.onsubmit=e=>{e.preventDefault();window.sendChat(field?.value||'')}}
  if(button){button.onclick=()=>window.sendChat(field?.value||'')}
  if(field){field.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();window.sendChat(field.value)}}}
  if(localStorage.getItem('haxbro_roast_mode')==='on')activateRoastMode();
})();