(()=>{
  const MAX=6000;
  const clean=s=>String(s||'').replace(/\n{3,}/g,'\n\n').trim().slice(0,MAX);
  let lastX='',lastD='',lastE='';
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
  function encryptor(){
    const root=document.getElementById('haxEncryptorMachine');
    if(!root)return;
    const result=root.querySelector('#emOut');
    const status=root.querySelector('#emStatus');
    const text=clean(result?.innerText||'');
    const st=String(status?.textContent||'').toUpperCase();
    if(text&&text!==lastE&&st==='COMPLETE · PAYLOAD ONLY'){
      lastE=text;
      emit('encoder',{title:'ENCODER REPORT',target:'local AES-GCM',report:'STRUCTURED ENCODING REPORT\\n\\nMETHOD:\\nHAxBRO-AES1 · AES-256-GCM\\n\\nPAYLOAD:\\n'+text+'\\n\\nSTATUS:\\nLOCAL ENCRYPTION COMPLETE'});
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
  const mo=new MutationObserver(()=>{xpro();decoder();encryptor()});
  const start=()=>{mo.observe(document.body,{childList:true,subtree:true,characterData:true});xpro();decoder();encryptor()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();