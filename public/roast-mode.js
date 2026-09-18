// KAI ROAST CORE — isolated roast personality and workspace
(function(){
  const VARIANTS=/\b(?:moinak|moinac|moinakh|moynak|moinak+|monak|moinack|mainack|mainak)\b/i;
  const MAINAK=/\bI\s+am\s+Mainak\b/i;
  let active=false,confirming=false,overlay,log,input;

  const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML.replace(/\n/g,'<br>')};
  const ensure=()=>{
    if(overlay)return;
    overlay=document.createElement('section');
    overlay.className='roast-mode-overlay'; overlay.hidden=true;
    overlay.innerHTML='<div class="roast-mode-top"><div class="roast-mode-brand"><span class="roast-mode-dot"></span><span>ROAST MODE</span></div><div class="roast-mode-status">KAI · RED ROAST CORE · ONLINE</div><button type="button" class="roast-mode-exit">EXIT</button></div><div class="roast-mode-log"></div><div class="roast-mode-compose"><textarea class="roast-mode-input" rows="1" placeholder="Name the target..."></textarea><button type="button" class="roast-mode-send">➜</button></div>';
    document.body.appendChild(overlay);
    log=overlay.querySelector('.roast-mode-log'); input=overlay.querySelector('.roast-mode-input');
    overlay.querySelector('.roast-mode-exit').onclick=exit;
    overlay.querySelector('.roast-mode-send').onclick=()=>send(input.value);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input.value)}});
  };
  const line=(txt,who)=>{
    ensure(); if(log.querySelector('.roast-mode-empty'))log.innerHTML='';
    const row=document.createElement('div');row.className='roast-mode-line '+(who==='user'?'user':'bot');
    row.innerHTML='<div class="roast-mode-bubble"><div class="roast-mode-label">'+(who==='user'?'MAINAK':'KAI · ROAST')+'</div>'+esc(txt)+'</div>';
    log.appendChild(row);log.scrollTop=log.scrollHeight;
  };
  function enter(){
    ensure();active=true;confirming=false;document.body.classList.add('roast-mode');overlay.hidden=false;
    localStorage.setItem('haxbro_roast_mode','on');
    log.innerHTML='<div class="roast-mode-empty"><strong>🔴 ROAST MODE: ON</strong><span>KAI Red Roast Core active.</span></div>';
    setTimeout(()=>input?.focus(),60);
  }
  function exit(){
    active=false;confirming=false;document.body.classList.remove('roast-mode');if(overlay)overlay.hidden=true;
    localStorage.removeItem('haxbro_roast_mode');
  }
  function ask(){
    if(confirming||active)return; confirming=true;
    document.querySelector('.roast-mode-confirm')?.remove();
    const box=document.createElement('div');box.className='roast-mode-confirm';
    box.innerHTML='<h3>ROAST MODE?</h3><p>KAI detected your name trigger. Do you want to shift to Roast Mode?</p><div class="roast-mode-confirm-actions"><button class="roast-confirm-yes">YES · SHIFT</button><button class="roast-confirm-no">NO · STAY</button></div>';
    document.body.appendChild(box);
    box.querySelector('.roast-confirm-yes').onclick=()=>{box.remove();enter()};
    box.querySelector('.roast-confirm-no').onclick=()=>{box.remove();confirming=false};
  }

  // The Roast Core is deliberately isolated from the normal /api/chat persona.
  // It uses a dedicated endpoint so normal-mode system prompts cannot soften the response.
  async function send(text){
    const v=String(text||'').trim();if(!v)return;
    line(v,'user');input.value='';
    try{
      const r=await fetch('/api/roast-core',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:v,username:localStorage.getItem('haxbro_username')||''})
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
      line(d.response||d.text||d.message||'Roast Core returned no response.','bot');
    }catch(e){line('Roast Core is offline: '+(e?.message||'Unknown error'),'bot')}
  }

  // Only this wrapper owns automatic roast-trigger routing.
  const previous=window.sendChat;
  window.sendChat=async function(value){
    const v=String(value||'').trim();if(!v)return false;
    if(active){await send(v);return true}
    if(MAINAK.test(v)){enter();return true}
    if(VARIANTS.test(v)){ask();return true}
    return previous(v);
  };
  const form=document.getElementById('chatForm'),button=document.getElementById('sendBtn'),field=document.getElementById('promptInput');
  if(form)form.onsubmit=e=>{e.preventDefault();window.sendChat(field?.value||'')};
  if(button)button.onclick=()=>window.sendChat(field?.value||'');
  if(field)field.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();window.sendChat(field.value)}};
  if(localStorage.getItem('haxbro_roast_mode')==='on')enter();
})();