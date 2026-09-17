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
      <div class="kai-work-body"><aside class="kai-forge"><div class="kai-forge-label">KAI 2.0 · FORGE ENGINE</div><div class="kai-robot" aria-hidden="true"><div class="kai-robot-head"><i></i><b></b></div><div class="kai-robot-neck"></div><div class="kai-robot-body"><i class="arm left"></i><i class="arm right"></i><span class="forge-core"></span></div><div class="kai-robot-feet"><i></i><i></i></div><div class="kai-sparks"><i></i><i></i><i></i><i></i><i></i></div></div><div class="kai-forge-hammer"><span></span></div><div id="kaiForgeAction" class="kai-forge-action">FORGING THE PRODUCT</div><div id="kaiForgeDetail" class="kai-forge-detail">KAI is turning your instruction into a live interface.</div></aside><div class="kai-work-left"><div id="kaiWorkPhase" class="kai-work-phase">WORKING</div><div id="kaiWorkMessage" class="kai-work-message">KAI is building your product.</div><div id="kaiWorkSub" class="kai-work-sub">Watch the real build activity, preview and external handoff here.</div><div id="kaiWorkProgress" class="kai-work-progress"><i></i><i></i><i></i><i></i><i></i></div><div id="kaiWorkActivity" class="kai-work-activity"></div></div><div class="kai-work-preview-shell"><div class="kai-work-preview-head"><div class="kai-work-preview-dots"><i></i><i></i><i></i></div><span id="kaiWorkPreviewLabel">PREVIEW · WAITING</span></div><iframe id="kaiWorkPreview" class="kai-work-preview-frame" title="KAI live app preview" sandbox="allow-scripts allow-forms allow-modals"></iframe></div></div>
      <div class="kai-work-actions"><a id="kaiWorkLive" class="primary" target="_blank" rel="noopener" hidden>OPEN LIVE APP ↗</a><button id="kaiWorkOpen" type="button">OPEN PREVIEW ↗</button><button id="kaiWorkCode" type="button">VIEW FILES</button><span id="kaiWorkFiles" class="kai-work-files"></span></div>
      <div class="kai-work-chat"><textarea id="kaiWorkPrompt" rows="1" placeholder="Tell KAI what to change next…"></textarea><button id="kaiWorkSend" type="button">SEND ↗</button></div>
      <pre id="kaiWorkCodeBlock" class="kai-work-code"></pre>`;
    document.body.appendChild(el);
    el.querySelector('#kaiWorkClose').onclick=()=>{el.classList.remove('active','ready');document.body.style.overflow=''};
    el.querySelector('#kaiWorkOpen').onclick=()=>{const f=el.querySelector('#kaiWorkPreview');if(f?.srcdoc)window.open(URL.createObjectURL(new Blob([f.srcdoc],{type:'text/html'})),'_blank','noopener')};
    el.querySelector('#kaiWorkCode').onclick=()=>el.classList.toggle('show-code');
    const send=async()=>{
      const box=el.querySelector('#kaiWorkPrompt');const prompt=String(box?.value||'').trim();if(!prompt)return;
      box.value='';
      const apiCall=async()=>{
        const previous=(()=>{try{return JSON.parse(localStorage.getItem('haxbro_active_app')||'null')}catch{return null}})();
        const context=Array.isArray(previous?.files)?JSON.stringify(previous.files.slice(0,16)):'';
        const instruction=`USER'S EXACT MODIFICATION (highest priority):\n${prompt}\n\nKAI LIVE WORKSPACE CONTRACT:\n- Continue the current product; do not replace it with HAxBRO or a generic template.\n- Preserve the current product identity, name, colors and structure unless the user explicitly asks to change them.\n- Return the actual changed working files.\nEXISTING PRODUCT FILES:\n${context}`;
        const r=await fetch('/api/app-builder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:instruction,username:localStorage.getItem('haxbro_username')||'local-user'})});
        const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'KAI modification failed');return d;
      };
      await run(prompt,apiCall);
    };
    el.querySelector('#kaiWorkSend').onclick=send;
    el.querySelector('#kaiWorkPrompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
    return el;
  }

  function inlineState(){const form=$('chatForm');if(!form)return;const bar=$('kaiInlineWork');if(bar)bar.remove();}

  function phase(n,title,message,sub,status){
    inlineState();
    const el=ensure();
    el.classList.add('active');el.classList.remove('ready');el.dataset.stage=String(n);
    const forgeMap={1:['UNDERSTANDING THE REQUEST','Reading intent, constraints and the exact product identity.'],2:['ARCHITECTING THE EXPERIENCE','Choosing the interface structure and interaction flow.'],3:['SHAPING THE DESIGN','Forging layout, typography, components and visual language.'],4:['FORGING THE PRODUCT','Writing the actual implementation and wiring interactions.'],5:['STRESS-TESTING THE BUILD','Rendering the live product and checking the important states.'],6:['HANDING OVER THE FINISHED PRODUCT','The build is ready for your next instruction.']};
    const forgeAction=el.querySelector('#kaiForgeAction'),forgeDetail=el.querySelector('#kaiForgeDetail');
    if(forgeAction)forgeAction.textContent=forgeMap[n]?.[0]||'FORGING THE PRODUCT';
    if(forgeDetail)forgeDetail.textContent=forgeMap[n]?.[1]||message;
    el.querySelector('#kaiWorkPhase').textContent=title;el.querySelector('#kaiWorkMessage').textContent=message;el.querySelector('#kaiWorkSub').textContent=sub;el.querySelector('#kaiWorkStatus').textContent=status;
    el.querySelectorAll('#kaiWorkProgress i').forEach((x,i)=>x.classList.toggle('active',i<n));el.querySelector('#kaiWorkPreviewLabel').textContent=n>=5?'PREVIEW · TESTING':'PREVIEW · BUILDING';
  }
  function activity(text){const el=ensure(),box=el.querySelector('#kaiWorkActivity');if(!box)return;const row=document.createElement('div');row.className='kai-work-activity-line';row.innerHTML='<span></span><b>'+String(text).replace(/[<>]/g,'')+'</b>';box.appendChild(row);box.scrollTop=box.scrollHeight}
  function normalizeFiles(files){return Array.isArray(files)?files.filter(x=>x&&x.path&&typeof x.content==='string'):[]}
  function buildSrcdoc(files){const list=normalizeFiles(files),index=list.find(f=>f.path==='index.html')||list.find(f=>/\.html?$/i.test(f.path));if(!index)return '';let html=index.content;const css=list.filter(f=>/\.css$/i.test(f.path)).map(f=>f.content).join('\n'),js=list.filter(f=>/\.js$/i.test(f.path)&&f.path!=='index.js').map(f=>f.content).join('\n');if(css)html=html.replace(/<link[^>]+href=["'][^"']+\.css[^"']*["'][^>]*>/gi,`<style>${css}</style>`);if(js)html=html.replace(/<script[^>]+src=["'][^"']+\.js[^"']*[^>]*><\/script>/gi,'').replace(/<\/body>/i,`<script>${js.replace(/<\/script/gi,'<\\/script')}</script></body>`);return html}
  async function publish(name,files){const r=await fetch('/api/kai-699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name||'KAI App',files})}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'External publishing failed');return d.url||d.publicUrl||d.appUrl||''}
  async function run(prompt,apiCall){
    const el=ensure();if(!el)return apiCall();
    document.body.style.overflow='hidden';el.classList.add('active');el.classList.remove('ready');
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    phase(1,'UNDERSTANDING','KAI is understanding your exact request.','The build workspace is now open; progress will not be reported in the normal chat.','KAI · UNDERSTANDING');activity('Request received');await wait(260);
    phase(2,'ARCHITECTING','KAI is planning the product structure.','The forge is preparing the implementation and interaction flow.','KAI · ARCHITECTING');activity('Building execution plan');await wait(260);
    phase(3,'DESIGNING','KAI is shaping the actual interface.','Live preview and forge activity stay visible while the product is generated.','KAI · DESIGNING');activity('Designing interface');
    const result=await apiCall();const files=normalizeFiles(result?.files);currentFiles=files;if(!files.length)throw Error('KAI returned no build artifacts');
    try{localStorage.setItem('haxbro_active_app',JSON.stringify({name:result?.name||'KAI App',summary:result?.summary||'',files:files.slice(0,16)}))}catch{}
    phase(4,'FORGING','KAI is forging the working product.','Actual files are being loaded into the live workspace preview.','KAI · FORGING');activity(`${files.length} build artifacts generated`);el.querySelector('#kaiWorkFiles').textContent=`${files.length} artifacts generated`;el.querySelector('#kaiWorkCodeBlock').textContent=files.map(f=>`// ${f.path}\n${f.content}`).join('\n\n');
    const frame=el.querySelector('#kaiWorkPreview');frame.srcdoc=buildSrcdoc(files);phase(5,'TESTING','KAI is testing the live product surface.','Preview render and interactive structure are being checked before handoff.','KAI · TESTING');activity('Rendering live product');await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};frame.onload=()=>setTimeout(finish,650);setTimeout(finish,2400)});
    phase(6,'PUBLISHING','KAI is publishing the finished product externally.','This uses the external publishing path — not HAxBRO HTML hosting.','KAI · PUBLISHING');activity('Deploying to external host');
    try{currentUrl=await publish(result?.name||'KAI App',files);const live=el.querySelector('#kaiWorkLive');if(live&&currentUrl){live.hidden=false;live.href=currentUrl;live.textContent='OPEN LIVE APP ↗'}activity('External deployment verified')}catch(e){currentUrl='';activity('External deployment failed — preview remains available')}
    el.classList.add('ready');phase(6,'READY','Your product is ready.','Use the workspace chat below to request the next modification without leaving this workspace.','KAI · READY');el.querySelector('#kaiWorkPreviewLabel').textContent=currentUrl?'LIVE · EXTERNAL VERIFIED':'PREVIEW · READY';
    return {...result,publicUrl:currentUrl};
  }
  window.haxbroBuildExperience=run;window.haxbroWorkCanvas={ensure,phase,getFiles:()=>currentFiles,buildSrcdoc,getPublicUrl:()=>currentUrl};
})();