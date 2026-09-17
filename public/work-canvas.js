(()=>{
  const $=id=>document.getElementById(id);
  let currentFiles=[];
  let currentUrl='';

  function ensure(){
    let el=$('kaiWorkCanvas');
    if(el)return el;
    el=document.createElement('section');
    el.id='kaiWorkCanvas';
    el.className='kai-work-canvas';
    el.innerHTML=`
      <div class="kai-work-grid"></div>
      <div class="kai-work-orbit"><div class="kai-work-core"></div></div>
      <i class="kai-work-node n1"></i><i class="kai-work-node n2"></i><i class="kai-work-node n3"></i><i class="kai-work-node n4"></i>
      <div class="kai-work-head"><div class="kai-work-brand"><span class="kai-work-orb-mini"></span><div><div class="kai-work-kicker">KAI · WORK ENGINE</div><div class="kai-work-title">LIVE BUILD ENVIRONMENT</div></div></div><div class="kai-work-head-actions"><span id="kaiWorkStatus" class="kai-work-status">INITIALIZING</span><button id="kaiWorkClose" class="kai-work-close" type="button" aria-label="Close workspace" title="Close workspace">×</button></div></div>
      <div class="kai-work-body"><aside class="kai-forge"><div class="kai-forge-label">KAI 2.0 · FORGE ENGINE</div><div class="kai-robot" aria-hidden="true"><div class="kai-robot-head"><i></i><b></b></div><div class="kai-robot-neck"></div><div class="kai-robot-body"><i class="arm left"></i><i class="arm right"></i><span class="forge-core"></span></div><div class="kai-robot-feet"><i></i><i></i></div><div class="kai-sparks"><i></i><i></i><i></i><i></i><i></i></div></div><div class="kai-forge-hammer"><span></span></div><div id="kaiForgeAction" class="kai-forge-action">FORGING THE PRODUCT</div><div id="kaiForgeDetail" class="kai-forge-detail">KAI is turning your instruction into a live interface.</div></aside><div class="kai-work-left"><div id="kaiWorkPhase" class="kai-work-phase">THINKING</div><div id="kaiWorkMessage" class="kai-work-message">Turning your idea into a real product.</div><div id="kaiWorkSub" class="kai-work-sub">KAI is planning the experience, implementation and validation path.</div><div id="kaiWorkProgress" class="kai-work-progress"><i></i><i></i><i></i><i></i><i></i></div><div id="kaiWorkActivity" class="kai-work-activity"></div></div><div class="kai-work-preview-shell"><div class="kai-work-preview-head"><div class="kai-work-preview-dots"><i></i><i></i><i></i></div><span id="kaiWorkPreviewLabel">PREVIEW · WAITING</span></div><iframe id="kaiWorkPreview" class="kai-work-preview-frame" title="KAI live app preview" sandbox="allow-scripts allow-forms allow-modals"></iframe></div></div>
      <div class="kai-work-actions"><a id="kaiWorkLive" class="primary" target="_blank" rel="noopener" hidden>OPEN LIVE APP ↗</a><button id="kaiWorkOpen" type="button">OPEN PREVIEW ↗</button><button id="kaiWorkCode" type="button">VIEW FILES</button><span id="kaiWorkFiles" class="kai-work-files"></span></div>
      <pre id="kaiWorkCodeBlock" class="kai-work-code"></pre>`;
    document.body.appendChild(el);
    el.querySelector('#kaiWorkClose').onclick=()=>{el.classList.remove('active','ready');document.body.style.overflow=''};
    el.querySelector('#kaiWorkOpen').onclick=()=>{const f=el.querySelector('#kaiWorkPreview');if(f?.srcdoc)window.open(URL.createObjectURL(new Blob([f.srcdoc],{type:'text/html'})),'_blank','noopener')};
    el.querySelector('#kaiWorkCode').onclick=()=>el.classList.toggle('show-code');
    return el;
  }

  function inlineState(title,message,active=true){
    const form=$('chatForm');if(!form)return;
    let bar=$('kaiInlineWork');
    if(!bar){
      bar=document.createElement('div');
      bar.id='kaiInlineWork';
      bar.className='kai-inline-work';
      bar.innerHTML='<span class="kai-inline-orbit"><i></i><i></i><i></i></span><span class="kai-inline-copy"><b></b><small></small></span>';
      form.appendChild(bar);
    }
    bar.classList.toggle('active',active);
    bar.querySelector('b').textContent=title||'KAI';
    bar.querySelector('small').textContent=message||'';
  }

  function phase(n,title,message,sub,status){
    inlineState(title,message,true);
    const el=ensure();
    el.classList.add('active');el.classList.remove('ready');el.dataset.stage=String(n);
    const forgeAction=el.querySelector('#kaiForgeAction');
    const forgeDetail=el.querySelector('#kaiForgeDetail');
    const forgeMap={1:['UNDERSTANDING THE REQUEST','Reading intent, constraints and the exact product identity.'],2:['ARCHITECTING THE EXPERIENCE','Choosing the interface structure and interaction flow.'],3:['SHAPING THE DESIGN','Forging layout, typography, components and visual language.'],4:['FORGING THE PRODUCT','Writing the actual implementation and wiring interactions.'],5:['STRESS-TESTING THE BUILD','Rendering the live product and checking the important states.'],6:['HANDING OVER THE FINISHED PRODUCT','The build is ready for your next instruction.']};
    if(forgeAction)forgeAction.textContent=forgeMap[n]?.[0]||'FORGING THE PRODUCT';
    if(forgeDetail)forgeDetail.textContent=forgeMap[n]?.[1]||message;
    el.querySelector('#kaiWorkPhase').textContent=title;
    el.querySelector('#kaiWorkMessage').textContent=message;
    el.querySelector('#kaiWorkSub').textContent=sub;
    el.querySelector('#kaiWorkStatus').textContent=status;
    el.querySelectorAll('#kaiWorkProgress i').forEach((x,i)=>x.classList.toggle('active',i<n));
    el.querySelector('#kaiWorkPreviewLabel').textContent=n>=5?'PREVIEW · TESTING':'PREVIEW · BUILDING';
  }

  function activity(text){
    const el=ensure();const box=el.querySelector('#kaiWorkActivity');
    if(!box)return;
    const row=document.createElement('div');row.className='kai-work-activity-line';
    row.innerHTML='<span></span><b>'+String(text).replace(/[<>]/g,'')+'</b>';
    box.appendChild(row);box.scrollTop=box.scrollHeight;
  }

  function normalizeFiles(files){return Array.isArray(files)?files.filter(x=>x&&x.path&&typeof x.content==='string'):[]}

  function buildSrcdoc(files){
    const list=normalizeFiles(files);const index=list.find(f=>f.path==='index.html')||list.find(f=>/\.html?$/i.test(f.path));if(!index)return '';
    let html=index.content;
    const css=list.filter(f=>/\.css$/i.test(f.path)).map(f=>f.content).join('\n');
    const js=list.filter(f=>/\.js$/i.test(f.path)&&f.path!=='index.js').map(f=>f.content).join('\n');
    if(css)html=html.replace(/<link[^>]+href=["'][^"']+\.css[^"']*["'][^>]*>/gi,`<style>${css}</style>`);
    if(js)html=html.replace(/<script[^>]+src=["'][^"']+\.js[^"']*[^>]*><\/script>/gi,'').replace(/<\/body>/i,`<script>${js.replace(/<\/script/gi,'<\\/script')}</script></body>`);
    return html;
  }

  async function publish(name,files){
    const r=await fetch('/api/app-publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name||'Hacks Bro AI App',files})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)throw new Error(d.error||'Public publishing failed');
    return d.url||d.publicUrl||d.appUrl||'';
  }

  async function run(prompt,apiCall){
    const el=ensure();if(!el)return apiCall();
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    phase(1,'THINKING','KAI is understanding the outcome, constraints and product intent.','No UI redirect. The build capability is running inside KAI.','KAI · THINKING');activity('Understanding product intent');await wait(300);
    phase(2,'CONTACTING','KAI is connecting the request to the active intelligence path.','Selecting the right engineering strategy without exposing provider internals.','KAI · CONTACTING');activity('Selecting execution strategy');await wait(300);
    phase(3,'MAKING IT REAL','Designing the product structure, interface and interactions.','The goal is a usable first version, not a specification or code dump.','KAI · DESIGNING');activity('Designing application architecture');
    const result=await apiCall();
    const files=normalizeFiles(result?.files);currentFiles=files;
    if(!files.length)throw new Error('KAI returned no build artifacts');
    try{localStorage.setItem('haxbro_active_app',JSON.stringify({name:result?.name||'Hacks Bro AI App',summary:result?.summary||'',files:files.slice(0,16)}))}catch{}
    phase(4,'BUILDING','Turning your imagination into a real product.','Generating the actual implementation and wiring the experience together.','KAI · BUILDING');activity(`${files.length} build artifacts generated`);
    el.querySelector('#kaiWorkFiles').textContent=`${files.length} artifact${files.length===1?'':'s'} generated`;
    el.querySelector('#kaiWorkCodeBlock').textContent=files.map(f=>`// ${f.path}\n${f.content}`).join('\n\n');
    const frame=el.querySelector('#kaiWorkPreview');frame.srcdoc=buildSrcdoc(files);
    phase(5,'TESTING','KAI is loading the product and checking the generated surface.','Preview render, interactive controls and basic structure are being checked.','KAI · TESTING');activity('Rendering live preview');
    await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};frame.onload=()=>setTimeout(finish,650);setTimeout(finish,2400)});
    let checks=0;try{const doc=frame.contentDocument;if(doc?.body){checks=1+(doc.querySelectorAll('button,input,textarea,a,select').length>0?1:0)+(doc.querySelectorAll('style,link[rel=stylesheet]').length>0?1:0)}}catch{}
    phase(6,'PUBLISHING','KAI is preparing the finished product for a public handoff.','Publishing is automatic when the public App Engine accepts the build.','KAI · PUBLISHING');activity('Preparing public deployment');
    try{
      currentUrl=await publish(result?.name||'Hacks Bro AI App',files);
      const live=el.querySelector('#kaiWorkLive');if(live&&currentUrl){live.hidden=false;live.href=currentUrl;live.textContent='OPEN LIVE APP ↗'}
      activity('Public deployment complete');
    }catch(e){
      activity('Public deployment needs a retry');
    }
    el.classList.add('ready');
    phase(6,'YOUR APP IS READY',currentUrl?'The finished product is live. Ask KAI to change anything and it will continue from this version.':'The product is ready in the workspace preview.','KAI keeps the build context so your next instruction can continue the same product.','KAI · READY');
    el.querySelector('#kaiWorkPreviewLabel').textContent=`PREVIEW · READY${checks?` · ${checks}/3 CHECKS`:''}`;
    inlineState(currentUrl?'READY':'READY · PREVIEW',currentUrl?'Build complete. You can type the next change directly below.':'Build complete in the workspace preview. Type the next change directly below.',false);
    return {...result,publicUrl:currentUrl};
  }

  window.haxbroBuildExperience=run;
  window.haxbroWorkCanvas={ensure,phase,getFiles:()=>currentFiles,buildSrcdoc,getPublicUrl:()=>currentUrl};
})();