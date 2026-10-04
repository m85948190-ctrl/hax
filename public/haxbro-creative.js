(()=>{
  const $=s=>document.querySelector(s);
  let type='video';
  const OPENMONTAGE_ZIP='https://github.com/calesthio/OpenMontage/archive/refs/heads/main.zip';

  function kaiState(){
    try{return window.HAxBROKai51Bootstrap?.state?.()||{status:'not_installed',installed:false,verified:false}}
    catch{return {status:'not_installed',installed:false,verified:false}}
  }

  function mount(){
    if($('#haxbroCreative')) return;
    const el=document.createElement('section');
    el.id='haxbroCreative';
    el.innerHTML=`
      <div class="hcb-shell">
        <aside class="hcb-side">
          <div class="hcb-brand"><img src="/logo-symbol.svg?v=218" alt=""><div><b>HAxBRO AI</b><small>CREATIVE BEAST</small></div></div>
          <div class="hcb-kicker">REAL OPENMONTAGE RUNTIME</div>
          <h2>One prompt.<br>Real production.</h2>
          <p>Creative Beast uses HAxBRO's local KAI 51 intelligence for orchestration and the actual OpenMontage project for production. No fake OpenMontage renderer is used.</p>
          <div class="hcb-pipeline" id="hcbPipeline"></div>
        </aside>
        <main class="hcb-main">
          <header class="hcb-head">
            <div><div class="hcb-kicker">HAXBRO CREATIVE BEAST · OPENMONTAGE</div><h1>Build the video. Let OpenMontage produce it.</h1></div>
            <button class="hcb-close" id="hcbClose" type="button">×</button>
          </header>

          <section id="hcbInstallGate" class="hcb-install-gate">
            <div class="hcb-install-icon">OM</div>
            <div class="hcb-install-copy">
              <div class="hcb-kicker">CREATIVE ENGINE INITIALIZATION</div>
              <h2>Download the production engines first</h2>
              <p>KAI 51 is the HAxBRO local intelligence layer. OpenMontage is the real open-source video production system. OpenMontage requires Python 3.10+, Node 18+ and FFmpeg on the machine where it runs.</p>
              <div class="hcb-install-actions">
                <button id="hcbKaiDownload" class="hcb-install-btn" type="button">DOWNLOAD / ACTIVATE KAI 51</button>
                <a class="hcb-install-btn secondary" href="${OPENMONTAGE_ZIP}" target="_blank" rel="noopener noreferrer" download>DOWNLOAD OPENMONTAGE</a>
              </div>
              <div class="hcb-install-status" id="hcbInstallStatus">KAI 51: checking this device… · OpenMontage: package not downloaded from HAxBRO yet.</div>
            </div>
          </section>

          <div class="hcb-grid">
            <section class="hcb-card">
              <textarea id="hcbPrompt" class="hcb-prompt" placeholder="Example: Create a cinematic 20-second 3D sci-fi trailer about a robot discovering a hidden city…"></textarea>
              <div class="hcb-controls">
                <button class="hcb-chip" data-hcb-type="image" type="button">IMAGE</button>
                <button class="hcb-chip active" data-hcb-type="video" type="button">VIDEO</button>
                <button class="hcb-generate" id="hcbGenerate" type="button">RENDER WITH OPENMONTAGE</button>
              </div>
              <div id="hcbPlan" class="hcb-plan"></div>
            </section>
            <section class="hcb-card"><div class="hcb-kicker">OPENMONTAGE OUTPUT</div><div id="hcbResult" class="hcb-result">Install/activate KAI 51 and download OpenMontage, then submit a production prompt.</div></section>
          </div>
          <div class="hcb-bottom"><span>KAI 51 → OPENMONTAGE → RESEARCH → ASSETS → MOTION → COMPOSE → QA</span><span>REAL RUNTIME · NO FAKE RENDERER</span></div>
        </main>
      </div>`;
    document.body.appendChild(el);
    $('#hcbClose').onclick=close;
    el.addEventListener('click',e=>{
      const b=e.target.closest('[data-hcb-type]');
      if(!b)return;
      type=b.dataset.hcbType;
      el.querySelectorAll('[data-hcb-type]').forEach(x=>x.classList.toggle('active',x===b));
    });
    $('#hcbKaiDownload').onclick=async()=>{
      const btn=$('#hcbKaiDownload');
      btn.disabled=true; btn.textContent='DOWNLOADING / ACTIVATING KAI 51…';
      try{
        await window.HAxBROKai51Bootstrap?.prepare?.();
        updateInstallState('KAI 51 ready on this device. OpenMontage package download is a separate step.');
      }catch(e){
        updateInstallState('KAI 51 could not be prepared: '+(e?.message||e));
      }finally{btn.disabled=false;btn.textContent='DOWNLOAD / ACTIVATE KAI 51'}
    };
    updateInstallState();
    $('#hcbGenerate').onclick=run;
  }

  function updateInstallState(extra=''){
    const s=kaiState();
    const kai=s.ready||s.status==='ready';
    const el=$('#hcbInstallStatus');
    if(el)el.textContent=(kai?'KAI 51: READY on this device.':'KAI 51: NOT READY — activate/download it first.')+' OpenMontage: download the official package above. '+extra;
  }

  function close(){
    const e=$('#haxbroCreative');
    if(e)e.classList.remove('open');
    document.body.style.overflow='';
  }

  function open(){
    mount();
    $('#haxbroCreative').classList.add('open');
    document.body.style.overflow='hidden';
    updateInstallState();
    $('#hcbPrompt')?.focus();
  }

  function renderPlan(p){
    $('#hcbPipeline').innerHTML=(p.stages||[]).map(s=>'<div class="hcb-stage '+(s.status||'')+'"><i></i><span>'+escapeHtml(s.name)+'</span></div>').join('');
    $('#hcbPlan').innerHTML=(p.stages||[]).map(s=>'<div class="hcb-plan-row"><b>'+escapeHtml(s.name)+'</b><span>'+escapeHtml(s.detail||'')+'</span></div>').join('');
  }

  function escapeHtml(v){
    const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML;
  }

  async function run(){
    const prompt=$('#hcbPrompt')?.value.trim();
    const result=$('#hcbResult');
    const btn=$('#hcbGenerate');
    if(!prompt){result.textContent='Describe the production first.';return}

    const s=kaiState();
    if(!(s.ready||s.status==='ready')){
      result.innerHTML='<b>KAI 51 is not ready.</b><br><small>Use DOWNLOAD / ACTIVATE KAI 51 first.</small>';
      return;
    }

    btn.disabled=true;
    result.textContent='Sending the production request to the real OpenMontage runtime…';

    try{
      const r=await window.HAxBROOpenMontage?.produce?.({
        prompt,
        type,
        duration:20,
        aspectRatio:'16:9'
      });
      if(!r?.connected) throw new Error('OpenMontage runtime is not connected to HAxBRO yet.');
      result.innerHTML='<b>OpenMontage accepted the production.</b><br><small>Job/runtime response received from the real OpenMontage runner.</small>';
      if(r.result?.url) result.innerHTML='<video controls playsinline src="'+escapeHtml(r.result.url)+'"></video>';
    }catch(e){
      result.innerHTML='<b>OpenMontage is not connected yet.</b><br><small>'+escapeHtml(e?.message||e)+'</small>';
    }finally{btn.disabled=false}
  }

  window.HAxBROCreative={open,close};
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('creativeBeastBtn')?.addEventListener('click',open);
    document.getElementById('mobileCreativeBeastBtn')?.addEventListener('click',open);
    window.addEventListener('haxbro:kai51-ready',()=>updateInstallState('KAI 51 verification complete.'));
  });
})();