/* HAxBRO capability rail — presentation/routing only. KAI 69 backend is untouched. */
(()=> {
  const $=s=>document.querySelector(s);
  const actions=[
    ['Generate App','app','primary'],['Generate Image','art',''],['Make Image','art',''],
    ['Generate Art','art',''],['Write Code','code',''],['Research','research',''],
    ['Secure','secure',''],['Create File','file','']
  ];
  function clickExisting(id){const e=document.getElementById(id);if(e){e.click();return true}return false}
  function route(kind){
    if(kind==='app') return clickExisting('appMakerBtn');
    if(kind==='art') return clickExisting('artGenerationBtn');
    if(kind==='code') return clickExisting('codeWriterBtn');
    if(kind==='file') return clickExisting('fileCreatorBtn');
    if(kind==='secure'){clickExisting('modeBtnBeast');const b=document.querySelector('.mode-btn[data-mode="beast"]');if(b){b.click();return true}return false}
    if(kind==='research'){const input=$('#promptInput');if(input){input.value='Research this topic thoroughly and provide a concise sourced briefing: ';input.focus();input.dispatchEvent(new Event('input',{bubbles:true}));return true}}
    return false;
  }
  function mount(){
    if($('#haxCapabilityMount'))return;
    const form=$('#chatForm');if(!form)return;
    const wrap=document.createElement('div');wrap.id='haxCapabilityMount';wrap.innerHTML='<div class="hax-capability-rail"><div class="hax-capability-brand">HAxBRO AI</div><div class="hax-capability-pills"></div></div>';
    document.body.appendChild(wrap);
    const row=wrap.querySelector('.hax-capability-pills');
    actions.forEach(([label,kind,cls])=>{
      const b=document.createElement('button');b.type='button';b.className='hax-capability-pill '+cls;b.textContent=label;b.dataset.kind=kind;
      b.addEventListener('click',()=>route(kind));row.appendChild(b);
    });
  }
  function init(){mount();const saved=localStorage.getItem('haxbro_theme');if(!saved){document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark';localStorage.setItem('haxbro_theme','dark')}else{document.documentElement.dataset.theme=saved}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();