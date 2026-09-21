(()=>{
  const MAX=6000;
  const clean=s=>String(s||'').replace(/\n{3,}/g,'\n\n').trim().slice(0,MAX);
  let lastX='',lastD='';
  function emit(type,detail){window.dispatchEvent(new CustomEvent('haxbro:workspace-result',{detail:{type,...detail}}))}
  function xpro(){
    const panel=document.getElementById('deepxPanel');
    if(!panel||panel.style.display==='none')return;
    const result=document.getElementById('deepxResults');
    const state=document.getElementById('dxRunState');
    const text=clean(result?.innerText||'');
    if(text&&text!==lastX&&String(state?.textContent||'').toUpperCase()==='COMPLETE'&&!/X PRO STANDBY/.test(text)){
      lastX=text;
      emit('xpro',{title:'X PRO REPORT',target:document.getElementById('deepxInput')?.value||'',report:text});
    }
  }
  function decoder(){
    const root=document.getElementById('haxDecodingWorkspace');
    if(!root)return;
    const result=root.querySelector('#dpResult');
    const status=root.querySelector('#dpStatus');
    const text=clean(result?.innerText||'');
    const st=String(status?.textContent||'').toUpperCase();
    if(text&&text!==lastD&&(st==='COMPLETE'||st==='DECRYPTED')&&!/Waiting for input/.test(text)){
      lastD=text;
      emit('decoder',{title:'DECODING PARTNER REPORT',target:root.querySelector('#dpInput')?.value||'',report:text});
    }
  }
  const mo=new MutationObserver(()=>{xpro();decoder()});
  const start=()=>{mo.observe(document.body,{childList:true,subtree:true,characterData:true});xpro();decoder()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();