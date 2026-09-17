(()=>{
  const decorate=()=>{
    const panel=document.getElementById('hxAppMakerPanel');
    if(!panel||panel.dataset.future2050==='1')return;
    const card=panel.querySelector('.hx-prof-card');
    if(!card)return;
    panel.dataset.future2050='1';
    const head=panel.querySelector('.hx-prof-head');
    if(head){
      const badge=document.createElement('span');
      badge.className='hx2050-mode-badge';
      badge.textContent='CREATION ENGINE';
      head.appendChild(badge);
    }
    const preview=panel.querySelector('.hx-prof-preview');
    if(preview){
      const core=document.createElement('div');
      core.className='hx2050-orbit-core';
      core.setAttribute('aria-hidden','true');
      core.innerHTML='<i></i><i></i><i></i><b></b>';
      preview.appendChild(core);
    }
  };
  const observer=new MutationObserver(decorate);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();