(()=>{
  const $=id=>document.getElementById(id);
  let installed=false;
  let messages=[];
  function esc(s){return String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}
  function install(){
    if(installed)return;
    const panel=$('appMakerPanel');
    if(!panel)return;
    installed=true;
    if(!panel.querySelector('#appMakerWorkspaceClose')){
      const close=document.createElement('button');
      close.id='appMakerWorkspaceClose';
      close.type='button';
      close.className='app-maker-workspace-close';
      close.setAttribute('aria-label','Close App Maker workspace');
      close.title='Close workspace';
      close.textContent='×';
      close.addEventListener('click',()=>{panel.hidden=true;panel.style.display='none';panel.classList.remove('open');document.body.classList.remove('app-maker-open')});
      panel.appendChild(close);
    }
    const wrap=document.createElement('section');
    wrap.id='appMakerChatWorkspace';
    wrap.className='app-maker-chat-workspace';
    wrap.innerHTML='<div class="app-maker-chat-head"><div><span class="section-label">KAI BUILDER CHAT</span><b>Keep building in the same conversation</b><small>Ask for changes, fixes, features, layout updates or a complete rebuild without leaving App Maker.</small></div><span class="app-maker-chat-state">LIVE</span></div><div id="appMakerChatMessages" class="app-maker-chat-messages"><div class="app-maker-chat-msg bot"><b>KAI</b><span>App Maker chat is ready. Build the first version, then tell me what to change.</span></div></div><form id="appMakerChatForm" class="app-maker-chat-form"><textarea id="appMakerChatInput" rows="2" placeholder="Change the app… e.g. “add login, make the navbar glass, fix mobile spacing”"></textarea><button type="submit">SEND →</button></form>';
    panel.appendChild(wrap);
    const form=$('appMakerChatForm'), input=$('appMakerChatInput'), box=$('appMakerChatMessages');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const text=input.value.trim();
      if(!text)return;
      add('user',text);
      const base=$('appMakerPrompt');
      const current=String(base?.value||'').trim();
      const combined=current?current+'\n\nAPP MAKER UPDATE:\n'+text:text;
      if(base)base.value=combined;
      input.value='';
      add('bot','Got it. Rebuilding the app with that change…');
      const build=$('appMakerBuild');
      if(build){build.click();setTimeout(()=>{const s=$('appMakerStatus');if(s?.textContent)replaceLast(s.textContent.includes('❌')?s.textContent:'Build finished. Preview the updated app above.');},700)}
    });
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
    function add(who,text){
      const node=document.createElement('div');node.className='app-maker-chat-msg '+who;node.innerHTML='<b>'+(who==='user'?'YOU':'KAI')+'</b><span>'+esc(text)+'</span>';box.appendChild(node);box.scrollTop=box.scrollHeight;messages.push({who,text})
    }
    function replaceLast(text){const nodes=box.querySelectorAll('.app-maker-chat-msg');const n=nodes[nodes.length-1];if(n&&n.classList.contains('bot'))n.querySelector('span').textContent=text}
  }
  const observer=new MutationObserver(install);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();