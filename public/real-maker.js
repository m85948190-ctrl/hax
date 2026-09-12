(()=>{
  const $=s=>document.querySelector(s); const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const panel=$('#realMaker'); if(!panel) return;
  const open=()=>{panel.hidden=false;requestAnimationFrame(()=>panel.classList.add('open'));document.body.classList.add('real-maker-open')};
  const close=()=>{window.location.href='/app/'};
  $('#realMakerBtn')?.addEventListener('click',open); $('#mobileRealMakerBtn')?.addEventListener('click',open); $('#realMakerClose')?.addEventListener('click',close);
  const state={project:null};
  function renderProject(p){
    state.project=p; const scenes=p.scenes||[];
    $('#rmProjectTitle').textContent=p.title||'Untitled project';
    $('#rmSceneList').innerHTML=scenes.map((s,i)=>`<div class="rm-scene ${i===0?'active':''}" data-scene="${i}"><div class="rm-thumb">${String(s.id||i+1).padStart(2,'0')}</div><div><b>${esc(s.title||`Scene ${i+1}`)}</b><span>${esc(s.duration||'3s')} · ${esc(s.shot||s.goal||'shot')}</span></div></div>`).join('')||'<div class="rm-card"><p>No scenes yet. Generate a project to build the storyboard.</p></div>';
    $('#rmTimeline').innerHTML=scenes.map((s,i)=>`<div class="rm-scene ${i===0?'active':''}" data-scene="${i}"><div class="rm-thumb">${String(i+1).padStart(2,'0')}</div><div><b>${esc(s.title||`Scene ${i+1}`)}</b><span>${esc(s.duration||'3s')}</span></div></div>`).join('');
    $('#rmBrief').textContent=p.brief||'—'; $('#rmAudience').textContent=p.audience||'—'; $('#rmStyle').textContent=p.visualStyle||'—';
    $('#rmScript').textContent=p.script||'—'; $('#rmResult').hidden=false;
    document.querySelectorAll('[data-scene]').forEach(el=>el.addEventListener('click',()=>selectScene(Number(el.dataset.scene)))); selectScene(0);
  }
  function selectScene(i){const s=state.project?.scenes?.[i];if(!s)return;document.querySelectorAll('[data-scene]').forEach(x=>x.classList.toggle('active',Number(x.dataset.scene)===i));$('#rmSceneTitle').textContent=s.title||`Scene ${i+1}`;$('#rmSceneDetails').textContent=[s.shot,s.camera,s.action,s.dialogue,s.caption].filter(Boolean).join('\n\n')||'Scene details will appear here.';$('#rmCanvasText').innerHTML=`<strong>${esc(s.title||'Scene')}</strong><span>${esc(s.visual||s.action||'Production-ready scene')}</span>`}
  async function generate(){
    const idea=$('#rmIdea').value.trim(); if(!idea){$('#rmStatus').textContent='Tell Real Maker what you want to create first.';return}
    $('#rmStatus').textContent='Real Maker is planning the production…';$('#rmProgress').hidden=false;$('#rmGenerate').disabled=true;
    try{const r=await fetch('/api/real-maker',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idea,format:$('#rmFormat').value,duration:$('#rmDuration').value,goal:$('#rmGoal').value,username:localStorage.getItem('haxbro_username')||''})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Real Maker failed');renderProject(d.project);$('#rmStatus').textContent='Production plan ready — review the canvas and scenes.';$('#rmProvider').textContent=(d.providerTelemetry||[]).map(x=>`${x.provider} · ${x.status}`).join('  /  ')}catch(e){$('#rmStatus').textContent=e.message||'Generation failed.'}finally{$('#rmProgress').hidden=true;$('#rmGenerate').disabled=false}}
  $('#rmGenerate')?.addEventListener('click',generate); $('#rmIdea')?.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')generate()});
  $('#rmNewProject')?.addEventListener('click',()=>{$('#rmIdea').value='';$('#rmResult').hidden=true;$('#rmStatus').textContent='Ready for a new idea.';state.project=null});
  $('#rmExport')?.addEventListener('click',()=>alert('Export pipeline is being prepared from the current Real Maker project. The workspace and scene plan are ready; media rendering/publishing will plug into this project without replacing the editor.'));
  $('#rmPublish')?.addEventListener('click',()=>alert('Real Maker Publish is reserved for the final render package. No external service is being substituted here.'));
})();