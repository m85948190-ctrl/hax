(()=>{
  const $=id=>document.getElementById(id);
  const username=()=>String(localStorage.getItem('haxbro_username')||'guest').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'_').slice(0,32)||'guest';
  const key=()=>`haxbro_ui_command_${username()}`;
  const defaults={theme:'light',accent:'#4d9dff',app:'✦ App Maker',art:'✦ Art Generation'};
  function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(key())||'{}')}}catch{return {...defaults}}}
  function save(v){localStorage.setItem(key(),JSON.stringify(v))}
  function paint(v){
    document.documentElement.style.setProperty('--hb-blue',v.accent);
    window.applyVisualTheme?.(v.theme);
    [['appMakerBtn',v.app],['mobileAppMakerBtn',v.app],['artGenerationBtn',v.art],['mobileArtGenerationBtn',v.art]].forEach(([id,label])=>{const e=$(id);if(!e)return;const small=e.querySelector('small');e.childNodes[0].textContent=label+(small?' ':'')});
  }
  function open(){
    let p=$('uiCommandCenter');
    if(!p){
      p=document.createElement('section');p.id='uiCommandCenter';p.className='ui-command-center';p.innerHTML=`<div class="ui-command-card"><header><div><span>HAxBRO // PERSONAL CONTROL</span><h2>UI Command Center</h2><small>Private presentation controls for this HAxBRO user.</small></div><button id="uiCommandClose" type="button" aria-label="Close">×</button></header><div class="ui-command-grid"><label>THEME<select id="uiTheme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>PRIMARY ACCENT<input id="uiAccent" value="#4d9dff" maxlength="7"></label><label>APP MAKER LABEL<input id="uiAppLabel" value="✦ App Maker"></label><label>ART MAKER LABEL<input id="uiArtLabel" value="✦ Art Generation"></label></div><div class="ui-command-actions"><button id="uiApply" type="button">APPLY TO MY UI</button><button id="uiReset" type="button">RESET MY UI</button><span id="uiStatus">Changes stay local to this user.</span></div><div class="ui-command-note">These controls affect only this user's browser profile. They do not modify HAxBRO's shared product UI, code, backend, or other users.</div></div>`;document.body.appendChild(p);$('uiCommandClose').onclick=close;$('uiApply').onclick=apply;$('uiReset').onclick=reset
    }
    const v=load();p.hidden=false;$('uiTheme').value=v.theme;$('uiAccent').value=v.accent;$('uiAppLabel').value=v.app;$('uiArtLabel').value=v.art;requestAnimationFrame(()=>p.classList.add('open'))
  }
  function close(){const p=$('uiCommandCenter');if(p){p.classList.remove('open');setTimeout(()=>{if(!p.classList.contains('open'))p.hidden=true},160)}}
  function apply(){
    const v={theme:$('uiTheme')?.value==='dark'?'dark':'light',accent:String($('uiAccent')?.value||defaults.accent).trim(),app:String($('uiAppLabel')?.value||defaults.app).trim(),art:String($('uiArtLabel')?.value||defaults.art).trim()};
    if(!/^#[0-9a-f]{6}$/i.test(v.accent)){const s=$('uiStatus');if(s)s.textContent='Use a 6-digit hex accent, e.g. #4d9dff';return}
    save(v);paint(v);const s=$('uiStatus');if(s)s.textContent='MY UI UPDATED · SAVED LOCALLY'
  }
  function reset(){
    localStorage.removeItem(key());paint(defaults);$('uiTheme').value=defaults.theme;$('uiAccent').value=defaults.accent;$('uiAppLabel').value=defaults.app;$('uiArtLabel').value=defaults.art;const s=$('uiStatus');if(s)s.textContent='MY UI RESET · APP UNCHANGED'
  }
  function bind(){[['uiCommandCenterBtn',open],['mobileUiCommandCenterBtn',open]].forEach(([id,fn])=>$(id)?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()}));paint(load())}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.HAxBROUICommandCenter={open,close,apply,reset};
})();