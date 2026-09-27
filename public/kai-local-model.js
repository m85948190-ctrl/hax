(() => {
  // KAI 12 is embedded controller code. It never downloads a model/package.
  const NODES=['Analyze','Optimize','Understand','Research','Evidence','Context','Reason','Verify','Compare','Synthesize','Security','Memory'];
  const clean=(v,n=5000)=>String(v??'').replace(/\u0000/g,'').slice(0,n).trim();
  const username=()=>localStorage.getItem('haxbro_username')||'anonymous-device';
  const memKey=()=>`haxbro:kai12:${username().replace(/[^a-zA-Z0-9_-]/g,'_')}:memory`;
  const readMemory=()=>{try{return JSON.parse(localStorage.getItem(memKey())||'{"notes":[],"sources":[]}')}catch{return{notes:[],sources:[]}}};
  const writeMemory=m=>{try{localStorage.setItem(memKey(),JSON.stringify({notes:(m.notes||[]).slice(-12),sources:(m.sources||[]).slice(-40)}))}catch{}};
  const emit=(name,detail={})=>window.dispatchEvent(new CustomEvent(name,{detail}));
  const complexityProfile=t=>{const s=String(t||'').toLowerCase();if(s.length>280||/\b(deep research|critical|complex|investigate|analy[sz]e|compare|verify|latest|current|today)\b/.test(s))return'heavy';return'light'};
  async function prepare(){emit('haxbro:kai-local-ready',{profile:'kai12',engine:'KAI 12',downloadRequired:false,nodes:NODES});return true}
  async function respond(prompt){
    const text=clean(prompt); if(!text)return null;
    // No canned conversational responses here. The browser runtime may only answer deterministic local capabilities; normal conversation belongs to the server-side generative KAI 51 engine.
    if(/^have a good (day|time|one)$/i.test(text))return{response:'Thanks, bro! You too. Have a good one!',provider:'KAI 12 local controller',model:'no-model',profile:'light',local:true};
    const math=text.match(/^(?:what is|calculate|compute|solve)\s+([0-9+*%().\s-]+)\??$/i)||text.match(/^([0-9][0-9+*%().\s-]{0,80})$/);
    if(math){try{const v=Function('"use strict";return ('+math[1]+')')();if(Number.isFinite(v))return{response:String(v),provider:'KAI 12 local controller',model:'no-model',profile:'light',local:true}}catch{}}
    return {response:null,provider:'KAI 12 local controller',model:'no-model',profile:complexityProfile(text),local:true,nodes:NODES};
  }
  const apiStatus=async()=>{try{const r=await fetch('/api/model-status');return r.ok?await r.json():null}catch{return null}};
  window.HAxBROLocalKai={start:prepare,prepare,generate:async()=>null,respond,profileFor:complexityProfile,isTrivial:t=>/^(hi|hello|hey|yo|thanks|okay|ok)$/i.test(String(t||'').trim()),readMemory,addMemory(note){const m=readMemory();m.notes.push({text:clean(note,500),at:Date.now()});writeMemory(m)},status:()=>({ready:true,loading:false,profile:'kai12',downloadRequired:false,nodes:NODES,models:{none:true}}),apiStatus};
  prepare();
})();