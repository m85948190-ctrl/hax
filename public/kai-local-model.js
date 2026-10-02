(() => {
  const username=()=>localStorage.getItem('haxbro_username')||'anonymous-device';
  const memKey=()=>`haxbro:kai51:${username().replace(/[^a-zA-Z0-9_-]/g,'_')}:memory`;
  const readMemory=()=>{try{return JSON.parse(localStorage.getItem(memKey())||'{"notes":[]}')}catch{return{notes:[]}}};
  const writeMemory=m=>{try{localStorage.setItem(memKey(),JSON.stringify({notes:(m.notes||[]).slice(-12)}))}catch{}};
  const addMemory=note=>{const m=readMemory();m.notes.push({text:String(note||'').slice(0,500),at:Date.now()});writeMemory(m)};
  const status=()=>window.HAxBROKai51Bootstrap?.state?.()||{status:'bootstrap',successes:0,target:6,ready:false};
  const prepare=()=>window.HAxBROKai51Bootstrap?.prepare?.();
  const respond=async(prompt,history=[])=>{
    const lite=window.HAxBROKaiLite?.respond?.(prompt);
    if(lite?.response)return lite;
    // Never force the heavy local KAI 51 model to download during an emergency
    // fallback. Advanced intelligence remains a background capability.
    return null;
  };
  window.HAxBROLocalKai={
    start:prepare,prepare,generate:respond,respond,
    profileFor:()=> 'heavy',
    isTrivial:t=>/^(hi|hello|hey|yo|thanks|thank you|okay|ok)$/i.test(String(t||'').trim()),
    readMemory,addMemory,status,
    apiStatus:async()=>status()
  };
})();