(()=>{const $=s=>document.querySelector(s);let type='auto',plan=null;
function mount(){
  if($('#haxbroCreative'))return;
  const el=document.createElement('section');el.id='haxbroCreative';el.innerHTML=`
    <div class="hcb-shell">
      <aside class="hcb-side">
        <div class="hcb-brand"><img src="/logo-symbol.svg?v=218" alt=""><div><b>HAxBRO AI</b><small>CREATIVE BEAST</small></div></div>
        <div class="hcb-kicker">PIPELINE ENGINE</div><h2>One prompt.<br>Full production.</h2>
        <p>KAI coordinates intent, story, assets, motion, composition and QA. It uses existing generation infrastructure rather than pretending one model does everything.</p>
        <div class="hcb-pipeline" id="hcbPipeline"></div>
      </aside>
      <main class="hcb-main">
        <header class="hcb-head"><div><div class="hcb-kicker">HAXBRO CREATIVE BEAST · KAI ORCHESTRATOR</div><h1>Create without switching tools.</h1></div><button class="hcb-close" id="hcbClose">×</button></header>
        <div class="hcb-grid">
          <section class="hcb-card">
            <textarea id="hcbPrompt" class="hcb-prompt" placeholder="Example: Create a cinematic 20-second sci-fi trailer about a robot discovering a hidden city…"></textarea>
            <div class="hcb-controls"><button class="hcb-chip active" data-hcb-type="auto">AUTO</button><button class="hcb-chip" data-hcb-type="image">IMAGE</button><button class="hcb-chip" data-hcb-type="video">VIDEO</button><button class="hcb-generate" id="hcbGenerate">PLAN + GENERATE</button></div>
            <div id="hcbPlan" class="hcb-plan"></div>
          </section>
          <section class="hcb-card"><div class="hcb-kicker">OUTPUT</div><div id="hcbResult" class="hcb-result">Your production result will appear here.</div></section>
        </div>
        <div class="hcb-bottom"><span>KAI · INTENT → STORY → ASSETS → MOTION → COMPOSE → QA</span><span>HAxBRO · OPEN PIPELINE ARCHITECTURE</span></div>
      </main>
    </div>`;
  document.body.appendChild(el);
  $('#hcbClose').onclick=close;
  el.addEventListener('click',e=>{const b=e.target.closest('[data-hcb-type]');if(!b)return;type=b.dataset.hcbType;el.querySelectorAll('[data-hcb-type]').forEach(x=>x.classList.toggle('active',x===b));});
  $('#hcbGenerate').onclick=run;
}
function close(){const e=$('#haxbroCreative');if(e)e.classList.remove('open');document.body.style.overflow='';}
function open(){mount();$('#haxbroCreative').classList.add('open');document.body.style.overflow='hidden';$('#hcbPrompt')?.focus();}
function renderPlan(p){
  plan=p;
  $('#hcbPipeline').innerHTML=p.stages.map(s=>`<div class="hcb-stage ${s.status}"><i></i><span>${s.name}</span></div>`).join('');
  $('#hcbPlan').innerHTML=p.stages.map(s=>`<div class="hcb-plan-row"><b>${s.name}</b><span>${s.detail}</span></div>`).join('');
}
async function run(){
  const prompt=$('#hcbPrompt')?.value.trim();if(!prompt){$('#hcbResult').textContent='Describe the production first.';return}
  const btn=$('#hcbGenerate');btn.disabled=true;$('#hcbResult').textContent='KAI is building the production plan…';
  try{
    const r=await fetch('/api/haxbro-creative',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'plan',prompt,type})});
    const p=await r.json();if(!r.ok||!p.ok)throw Error(p.error||'Planning failed');renderPlan(p);
    $('#hcbResult').textContent='Plan ready. Sending the primary visual task to HAxBRO generation infrastructure…';
    const output=p.output==='video'?'video':'image';
    const provider=output==='video'?'video1':'image2';
    const g=await fetch('/api/art-generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:output,provider,prompt,ratio:p.recommendations.aspect})});
    const d=await g.json();if(!g.ok||!d.ok)throw Error(d.error||'Generation provider failed');
    if(d.url){
      $('#hcbResult').innerHTML=output==='video'?'<video controls playsinline src="'+d.url+'"></video>':'<img src="'+d.url+'" alt="HAxBRO generated visual">';
    }else{
      $('#hcbResult').innerHTML='<div><b>Generation job started.</b><br><small>'+String(d.provider||'Provider')+' · '+String(d.taskId||'processing')+'</small></div>';
    }
  }catch(e){$('#hcbResult').textContent='Creative engine: '+(e.message||'generation failed');}
  finally{btn.disabled=false;}
}
window.HAxBROCreative={open,close};
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('creativeBeastBtn')?.addEventListener('click',open);document.getElementById('mobileCreativeBeastBtn')?.addEventListener('click',open);});
})();