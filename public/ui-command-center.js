(()=>{
  const $=id=>document.getElementById(id);
  const username=()=>String(localStorage.getItem('haxbro_username')||'guest').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'_').slice(0,32)||'guest';
  const key=()=>`haxbro_ui_command_${username()}`;
  const defaults={theme:'light',accent:'#4d9dff',app:'✦ App Maker',art:'✦ Art Generation',density:'balanced',motion:true,sidebar:true};
  function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(key())||'{}')}}catch{return {...defaults}}}
  function save(v){localStorage.setItem(key(),JSON.stringify(v))}
  function paint(v){
    document.documentElement.style.setProperty('--hb-blue',v.accent);
    window.applyVisualTheme?.(v.theme);
    document.body.dataset.uiDensity=v.density;
    document.body.dataset.uiMotion=v.motion?'on':'off';
    document.body.dataset.uiSidebar=v.sidebar?'on':'off';
    [['appMakerBtn',v.app],['mobileAppMakerBtn',v.app],['artGenerationBtn',v.art],['mobileArtGenerationBtn',v.art]].forEach(([id,label])=>{const e=$(id);if(!e)return;const small=e.querySelector('small');e.childNodes[0].textContent=label+(small?' ':'')});
  }
  function open(){
    let p=$('uiCommandCenter');
    if(!p){
      p=document.createElement('section');p.id='uiCommandCenter';p.className='ui-command-center';p.hidden=true;
      p.innerHTML=`<div class="ui-command-card" role="dialog" aria-modal="true" aria-labelledby="uiCommandTitle"><div class="ui-command-scan"></div><header class="ui-command-header"><div class="ui-command-brand"><span class="ui-command-orb"><i></i></span><div><span class="ui-command-kicker">HAxBRO // PERSONAL CONTROL LAYER</span><h2 id="uiCommandTitle">UI Command Center</h2><small>Shape your interface without touching the shared HAxBRO system.</small></div></div><div class="ui-command-header-right"><span class="ui-command-user">USER · ${username()}</span><button id="uiCommandClose" type="button" aria-label="Close">×</button></div></header><div class="ui-command-scroll"><section class="ui-command-hero"><div><span class="ui-command-live"><i></i> LOCAL PROFILE ONLINE</span><h3>Control the surface.<br><em>Keep the core untouched.</em></h3><p>Your presentation preferences live only in this browser profile.</p></div><div class="ui-command-radar" aria-hidden="true"><span></span><b></b><i></i></div></section><div class="ui-command-section"><div class="ui-command-section-head"><span>01</span><div><b>APPEARANCE</b><small>Primary visual system</small></div></div><div class="ui-command-grid"><label>THEME<select id="uiTheme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>PRIMARY ACCENT<input id="uiAccent" value="#4d9dff" maxlength="7" spellcheck="false"></label><label>INTERFACE DENSITY<select id="uiDensity"><option value="compact">Compact</option><option value="balanced">Balanced</option><option value="spacious">Spacious</option></select></label><label>MOTION<select id="uiMotion"><option value="on">Enabled</option><option value="off">Reduced</option></select></label></div></div><div class="ui-command-section"><div class="ui-command-section-head"><span>02</span><div><b>WORKSPACE LABELS</b><small>Personal naming only</small></div></div><div class="ui-command-grid"><label>APP MAKER LABEL<input id="uiAppLabel" value="✦ App Maker"></label><label>ART GENERATION LABEL<input id="uiArtLabel" value="✦ Art Generation"></label><label>SIDEBAR<select id="uiSidebar"><option value="on">Visible</option><option value="off">Minimized</option></select></label><div class="ui-command-readout"><span>PROFILE</span><b id="uiProfileName">LOCAL</b></div></div></div><div class="ui-command-section ui-command-system"><div class="ui-command-section-head"><span>03</span><div><b>ISOLATION STATUS</b><small>What this panel is allowed to change</small></div></div><div class="ui-command-status-grid"><div><i></i><b>YOUR UI</b><span>Writable</span></div><div><i></i><b>OTHER USERS</b><span>Untouched</span></div><div><i></i><b>BACKEND</b><span>Untouched</span></div><div><i></i><b>SHARED CODE</b><span>Untouched</span></div></div></div></div><footer class="ui-command-footer"><div><span class="ui-command-foot-status" id="uiStatus">READY · LOCAL PROFILE</span><small>Changes are stored under this username in this browser.</small></div><div class="ui-command-actions"><button id="uiReset" type="button">RESET MY UI</button><button id="uiApply" type="button">APPLY TO MY UI <b>↗</b></button></div></footer></div>`;
      document.body.appendChild(p);$('uiCommandClose').onclick=close;$('uiApply').onclick=apply;$('uiReset').onclick=reset;
      p.addEventListener('click',e=>{if(e.target===p)close()});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&p.classList.contains('open'))close()});
    }
    const v=load();$('uiTheme').value=v.theme;$('uiAccent').value=v.accent;$('uiDensity').value=v.density;$('uiMotion').value=v.motion?'on':'off';$('uiSidebar').value=v.sidebar?'on':'off';$('uiAppLabel').value=v.app;$('uiArtLabel').value=v.art;$('uiProfileName').textContent=username().toUpperCase();p.hidden=false;requestAnimationFrame(()=>p.classList.add('open'));$('uiTheme')?.focus();
  }
  function close(){const p=$('uiCommandCenter');if(p){p.classList.remove('open');setTimeout(()=>{if(!p.classList.contains('open'))p.hidden=true},220)}}
  function apply(){
    const v={theme:$('uiTheme')?.value==='dark'?'dark':'light',accent:String($('uiAccent')?.value||defaults.accent).trim(),density:$('uiDensity')?.value||'balanced',motion:$('uiMotion')?.value!=='off',sidebar:$('uiSidebar')?.value!=='off',app:String($('uiAppLabel')?.value||defaults.app).trim(),art:String($('uiArtLabel')?.value||defaults.art).trim()};
    if(!/^#[0-9a-f]{6}$/i.test(v.accent)){const s=$('uiStatus');if(s)s.textContent='ERROR · USE A 6-DIGIT HEX ACCENT';return}
    save(v);paint(v);const s=$('uiStatus');if(s)s.textContent='APPLIED · LOCAL PROFILE UPDATED';
  }
  function reset(){localStorage.removeItem(key());const v={...defaults};paint(v);$('uiTheme').value=v.theme;$('uiAccent').value=v.accent;$('uiDensity').value=v.density;$('uiMotion').value='on';$('uiSidebar').value='on';$('uiAppLabel').value=v.app;$('uiArtLabel').value=v.art;const s=$('uiStatus');if(s)s.textContent='RESET · LOCAL PROFILE RESTORED'}
  function bind(){[['uiCommandCenterBtn',open],['mobileUiCommandCenterBtn',open]].forEach(([id,fn])=>$(id)?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()}));paint(load())}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.HAxBROUICommandCenter={open,close,apply,reset};
})();