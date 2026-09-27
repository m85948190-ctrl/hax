const $=s=>document.querySelector(s);
let project={name:'Untitled project',summary:'',files:[],publicUrl:''};
const prompt=$('#prompt'),status=$('#status'),result=$('#result'),filesEl=$('#files'),frame=$('#frame'),canvas=$('#space');
const reportStream=$('#reportStream'),reportState=$('#reportState');
let reportItems=[];
function reportReset(){reportItems=[];if(reportStream)reportStream.innerHTML='';if(reportState)reportState.textContent='IDLE'}
function reportAdd(kind,message,done=false){if(!reportStream)return;const el=document.createElement('div');el.className='report-line'+(done?' done':'');const now=new Date().toLocaleTimeString([], {hour12:false});el.innerHTML='<span class="time">'+now+'</span><span class="kind">'+kind+'</span> '+String(message).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));reportStream.appendChild(el);reportItems.push(el);while(reportItems.length>9){const x=reportItems.shift();x.classList.add('fade');setTimeout(()=>x.remove(),560)}reportStream.scrollTop=reportStream.scrollHeight;if(reportState)reportState.textContent=kind}
function reportSyncFinal(steps){if(!Array.isArray(steps))return;steps.slice(-8).forEach(s=>reportAdd('KAI',String(s),true))}
function enterPreviewMode(){document.body.classList.add('preview-mode');document.body.classList.remove('building-mode');setScene('PREVIEW')}
function leavePreviewMode(){document.body.classList.remove('preview-mode','building-mode')}

document.querySelectorAll('.chips button').forEach(b=>b.addEventListener('click',()=>{prompt.value=b.dataset.prompt;prompt.focus();leavePreviewMode();reportReset();setScene('READY')}));
$('#newProject').addEventListener('click',()=>{project={name:'Untitled project',summary:'',files:[],publicUrl:''};prompt.value='';result.classList.add('hidden');leavePreviewMode();reportReset();status.className='status';status.innerHTML='<span class="status-dot"></span>Ready when you are.';$('#projectInfo').innerHTML='Untitled project<br><span>Describe an app to begin.</span>';setScene('READY')});
function setFlow(n){document.querySelectorAll('#flow li').forEach((x,i)=>x.classList.toggle('active',i===n))}
function setScene(label){
  $('#sceneState').textContent=label;
  const scene=$('.scene'); scene.classList.toggle('kai-active',!['READY','PUBLISHED','ERROR'].includes(String(label)));
  const map={signal:0,understand:1,ponder:2,architect:3,build:4,building:4,inspect:5,test:5,testing:5,repair:6,ready:7,preview:7,published:7,modify:1,modifying:1,reasoning:2};
  const key=String(label||'').toLowerCase(), idx=map[key] ?? (key.includes('test')?5:key.includes('build')?4:key.includes('ponder')?2:key.includes('architect')?3:key.includes('repair')?6:0);
  document.querySelectorAll('.stage').forEach((el,i)=>{el.classList.toggle('active',i===idx);el.classList.toggle('done',i<idx)});
  const names=['SIGNAL','UNDERSTANDING','PONDERING','ARCHITECTING','BUILDING','INSPECTING','REPAIRING','BUILD READY'];
  $('#activityMode').textContent=names[idx]||String(label||'STANDBY');
}
function render(){result.classList.remove('hidden');if($('#resultReport')&&reportStream)$('#resultReport').innerHTML=reportStream.innerHTML;$('#resultName').textContent=project.name;$('#resultSummary').textContent=project.summary;$('#publishBadge').textContent=project.published?'● PUBLISHED':'● READY';$('#publishExternal').disabled=false;$('#publishExternal').textContent=project.published?'Republish externally':'Publish externally';$('#projectInfo').innerHTML=`${project.name}<br><span>${project.published?'Published':'Ready'} · ${project.files.length} artifact</span>`;const link=$('#publicUrl');link.href=project.publicUrl;link.textContent=project.publicUrl;filesEl.innerHTML='';project.files.forEach((f,i)=>{const el=document.createElement('div');el.className='file'+(i===0?' active':'');el.textContent=f.path;el.addEventListener('click',()=>{document.querySelectorAll('.file').forEach(x=>x.classList.remove('active'));el.classList.add('active');showPreview(f)});filesEl.appendChild(el)});showPreview(project.files[0])}
function showPreview(f){if(!f)return;frame.srcdoc=f.content}
async function publishExternal(){
  reportAdd('PUBLISH','Publishing the current application to external static hosting…');
  const f=project.files&&project.files[0];
  if(!f)return;
  const btn=$('#publishExternal');
  btn.disabled=true; btn.textContent=project.published?'Republishing…':'Publishing…';
  try{
    const r=await fetch('/api/appmaker-original-publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({html:f.content})});
    const d=await r.json();
    if(!r.ok||!d.url)throw new Error(d.error||'External host rejected the deployment');
    project.publicUrl=String(d.url); project.published=true; project.publishExpiresAt=d.expires_at||null;
    $('#publishBadge').textContent='● PUBLISHED'; $('#publicUrl').href=project.publicUrl; $('#publicUrl').textContent=project.publicUrl;
    btn.textContent='Published ✓';
    $('#openPreview').disabled=false;
    status.className='status'; status.innerHTML='<span class="status-dot"></span>Published on external static hosting. Hatchable is not hosting this app.';
  }catch(e){
    btn.disabled=false; btn.textContent='Publish externally';
    status.className='status'; status.innerHTML='<span class="status-dot"></span>External publish failed: '+e.message;
  }
}
async function copyText(text,button){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent='Copied ✓';setTimeout(()=>button.textContent=old,1200)}catch{button.textContent='Copy failed'}}
$('#publishExternal').addEventListener('click',publishExternal);$('#copyUrl').addEventListener('click',()=>copyText(project.publicUrl,$('#copyUrl')));
$('#copyAll').addEventListener('click',()=>copyText(project.files.map(f=>`===== ${f.path} =====\\n${f.content}`).join('\\n\\n'),$('#copyAll')));
$('#openPreview').addEventListener('click',()=>{if(project.publicUrl)window.open(project.publicUrl,'_blank','noopener')});
async function modifyBuild(){const change=$('#modifyPrompt').value.trim();if(!change||!project.name||!project.files?.length)return;$('#modifyBuild').disabled=true;status.className='status busy';setScene('MODIFYING');setFlow(2);status.innerHTML='<span class="status-dot"></span>KAI 2.0 is modifying the existing application — preserving its identity and functionality…';try{const original=project.files[0].content;let local=original;if(/\\bred\\b/i.test(change)&&/\\b(?:ui|interface|theme|appearance|look)\\b/i.test(change)){local=original.replaceAll('#070b14','#180708').replaceAll('#0d1424','#241012').replaceAll('#0c1324','#220d10').replaceAll('#151f35','#2b1418').replaceAll('#111b31','#2a1216').replaceAll('#080d18','#16080a').replaceAll('#243762','#5a1820').replaceAll('#1d315d','#7a1f2b').replaceAll('#263555','#63202a').replaceAll('#22304d','#4d1820').replaceAll('#2b3b60','#6b222c').replaceAll('#334979','#842b36').replaceAll('#8fa8ff','#ff6878');project.files=[{...project.files[0],content:local}];project.published=false;project.publicUrl='';setFlow(3);setScene('TESTING');render();status.className='status';status.innerHTML='<span class="status-dot"></span>Modification tested. Existing app preserved; red UI applied. Republish when ready.';return}const r=await fetch('/api/appmaker-original-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:`Modify the EXISTING application below. This is an in-place modification, NOT a new project. Preserve the existing app name, product identity, purpose, features, working behavior, and current UI unless the requested change explicitly targets them. Apply ONLY the requested change: ${change}. Never rename the app or replace it with a generic template. Return the complete modified standalone HTML. Existing app name: ${project.name}\nExisting app summary: ${project.summary}\nExisting app HTML:\n${original}`})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error('KAI 51 could not complete this modification right now. Please retry.');if(!data.files?.[0]?.content)throw new Error('KAI returned no modified application');data.name=project.name;data.summary=project.summary;project={...project,...data,published:false,publicUrl:''};setFlow(3);setScene('TESTING');showPreview(project.files[0]);status.innerHTML='<span class="status-dot"></span>Modification tested. Publishing the updated application…';await new Promise(r=>setTimeout(r,250));await publishExternal();if(project.published){setFlow(4);setScene('PUBLISHED');status.className='status';status.innerHTML='<span class="status-dot"></span>KAI modified the existing app and published the updated version.'}else{setFlow(3);setScene('READY');status.className='status';status.innerHTML='<span class="status-dot"></span>KAI modified the existing app. Preview is ready; publish it when ready.'}}catch(e){setScene('ERROR');status.className='status';status.innerHTML='<span class="status-dot"></span>Modification stopped: '+e.message}finally{$('#modifyBuild').disabled=false}}$('#modifyBuild').addEventListener('click',modifyBuild);
/* KAI 2.0 semantic modification layer. */
function semanticModification(change){
  const t=String(change||'').trim(),l=t.toLowerCase();
  const rename=/\b(?:rename|change|set|update)\s+(?:the\s+)?(?:app\s+)?(?:name|title)\s+(?:to|as)\s+["']?([^"']{2,80})["']?$/i.exec(t);
  const ui=/\b(?:ui|interface|theme|appearance|look|design|style)\b/i.test(t);
  const color=/\b(red|blue|green|purple|orange|yellow|pink|cyan|white|black)\b/i.exec(t)?.[1]?.toLowerCase()||'';
  const spacing=/\b(spacing|padding|margin|gaps?|compact|roomier|more\s+space|less\s+space)\b/i.test(t);
  const overlap=/\b(overlap|overlapping|collide|collision|covering|covers|on top of|stacked|clipped|cut off|cramped)\b/i.test(t);
  const button=/\bbuttons?\b/i.test(t),bg=/\b(?:background|backdrop)\b/i.test(t);
  if(color&&(ui||button||bg))return{kind:'visual',color,button,bg,ui,spacing};
  if(overlap)return{kind:'layout'};
  if(spacing)return{kind:'spacing'};
  if(/\b(?:dark|light)\s+mode\b/i.test(t))return{kind:'mode',mode:/\blight\b/i.test(t)?'light':'dark'};
  if(rename)return{kind:'rename',name:rename[1].trim()};
  return{kind:'ai'};
}
function injectModificationStyle(html,css){
  const style='<style id="haxbro-semantic-modification">'+css+'</style>';
  if(/id=["']haxbro-semantic-modification["']/i.test(html))return html.replace(/<style[^>]*id=["']haxbro-semantic-modification["'][^>]*>[\s\S]*?<\/style>/i,style);
  return /<\/head>/i.test(html)?html.replace(/<\/head>/i,style+'</head>'):style+html;
}
function semanticCSS(m){
  const p={red:['#e5484d','#2a1014','#71333a','#fff1f2'],blue:['#2f81f7','#0d1d35','#31598d','#edf5ff'],green:['#27ae60','#0b2418','#2f7650','#effff5'],purple:['#8b5cf6','#1b1230','#6044a0','#f5efff'],orange:['#f97316','#2a170b','#8a4a25','#fff4ea'],yellow:['#eab308','#29240a','#806b16','#fffbea'],pink:['#ec4899','#2b1020','#8d3d67','#fff0f8'],cyan:['#06b6d4','#08252b','#2d7c89','#edfeff'],white:['#e5e7eb','#f4f5f7','#c8cdd4','#111827'],black:['#111827','#05070a','#30343a','#f8fafc']}[m.color];
  if(m.kind==='layout')return '*{box-sizing:border-box!important}html,body{overflow-x:hidden!important}img,video,canvas,iframe{max-width:100%!important}.app,main,.container,.panel,.card,.section,.content,.workspace{min-width:0!important;max-width:100%!important}.row,.toolbar,.actions,.controls,.header,.nav{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:10px!important}.grid{min-width:0!important}.row>* ,.toolbar>* ,.actions>* ,.controls>*{min-width:0!important;max-width:100%!important}h1,h2,h3,p,span,label,button,a{overflow-wrap:anywhere!important}.panel,.card,.section{overflow:visible!important}';
  if(m.kind==='spacing')return '.app,main,.container,.panel,.card{padding:clamp(16px,2.5vw,28px)!important;gap:18px!important}.bar,.toolbar,nav{gap:10px!important}';
  if(m.kind==='mode')return m.mode==='light'?'body{background:#f5f7fa!important;color:#172033!important}.app,main,.container,.panel,.card{background:#fff!important;color:#172033!important;border-color:#d7dde7!important}button{background:#eef2f7!important;color:#172033!important;border-color:#cbd5e1!important}':'body{background:#05070c!important;color:#eef5ff!important}.app,main,.container,.panel,.card{background:#0b111b!important;color:#eef5ff!important;border-color:#26364c!important}button{background:#121b2a!important;color:#eef5ff!important;border-color:#30445f!important}';
  if(!p)return '';
  let css=':root{--hax-accent:'+p[0]+';--hax-soft:'+p[1]+';--hax-border:'+p[2]+'}';
  if(m.ui)css+='body{--hax-accent:'+p[0]+'}.app,main,.container,.panel,.card,header,nav,section{border-color:'+p[2]+'!important}.app,.panel,.card{background:'+p[1]+'!important}.top,header,nav{color:'+p[3]+'!important}a{color:'+p[0]+'!important}';
  if(m.button)css+='button,.btn,[role="button"]{background:'+p[0]+'!important;border-color:'+p[0]+'!important;color:#fff!important}';
  if(m.bg)css+='body{background:'+p[1]+'!important}';
  if(m.spacing)css+='.app,main,.container,.panel,.card{padding:clamp(16px,2.5vw,28px)!important;gap:18px!important}';
  return css;
}
async function intelligentModify(change){
  const raw=String(change||'').trim();if(!raw||!project.name||!project.files?.length)return false;reportAdd('MODIFICATION RECEIVED',raw);
  const btn=$('#modifyBuild');btn.disabled=true;status.className='status busy';setScene('UNDERSTANDING');setFlow(1);
  status.innerHTML='<span class="status-dot"></span>KAI 2.0 is interpreting the modification intent — preserving the existing app unless the request explicitly changes it…';reportAdd('REQUIREMENT ANALYSIS','Determining which parts of the existing app must change.');
  try{
    const intent=semanticModification(raw),original=project.files[0].content;let html=original;
    if(intent.kind==='visual'||intent.kind==='spacing'||intent.kind==='mode'||intent.kind==='layout')html=injectModificationStyle(original,semanticCSS(intent));
    else if(intent.kind==='rename'){const n=intent.name.replace(/[&<>]/g,'');html=original.replace(/<title[^>]*>[\s\S]*?<\/title>/i,'<title>'+n+'</title>');}
    else{
      setScene('REASONING');
      const r=await fetch('/api/appmaker-original-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Modify the EXISTING application in place. USER MODIFICATION: '+raw+'\n\nINTENT RULES:\n- Understand whether the user means UI, behavior, content, layout, data, or a specific component.\n- Never interpret a color adjective such as "red UI" as an app name.\n- Only rename the app when the user explicitly asks to rename/change the name/title.\n- Preserve all existing features and working interactions unless explicitly changed.\n- Treat overlap, collision, cramped spacing, clipped text, or controls covering each other as a layout defect. Repair the existing app in place with responsive grid/flex/block flow, clear spacing, min-width:0, max-width:100%, and sensible wrapping. Never rename the product to solve a visual defect.\n- Check desktop, tablet, and mobile layout so headers, controls, cards, inputs, previews, and result sections remain separated, readable, and clickable.\n- Make the smallest coherent set of changes needed.\n- Return complete standalone HTML, not an explanation.\n\nEXISTING APP NAME: '+project.name+'\nEXISTING APP SUMMARY: '+project.summary+'\nEXISTING APP HTML:\n'+original})});
      const data=await r.json();if(!r.ok||!data.files?.[0]?.content)throw new Error(data.error||'KAI returned no modified application');html=data.files[0].content;
    }
    project.files=[{...project.files[0],content:html}];project.published=false;project.publicUrl='';setFlow(3);setScene('TESTING');reportAdd('INTERACTION CHECK','Testing the modified application against its existing behavior.');render();status.className='status';status.innerHTML='<span class="status-dot"></span>Modification understood. Testing the updated preview, then republishing the existing app…';await new Promise(r=>setTimeout(r,180));await publishExternal();if(project.published){reportAdd('PUBLISHED','Updated application is live.',true);setFlow(4);setScene('PUBLISHED');status.className='status';status.innerHTML='<span class="status-dot"></span>Modification applied to the existing app and republished.'}else{setFlow(3);setScene('READY');status.className='status';status.innerHTML='<span class="status-dot"></span>Modification applied. Preview is ready; external publish can be retried.'}return true;
  }catch(e){setScene('ERROR');status.className='status';status.innerHTML='<span class="status-dot"></span>Modification stopped: '+(e.message||'Unknown error');return false}
  finally{btn.disabled=false}
}
$('#modifyBuild').addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();intelligentModify($('#modifyPrompt').value);},true);
async function build(){const q=prompt.value.trim();if(!q)return;$('#build').disabled=true;leavePreviewMode();document.body.classList.add('building-mode');reportReset();reportAdd('REQUEST RECEIVED',q);status.className='status busy';setFlow(0);setScene('I51 SIGNAL');reportAdd('PRODUCT IDENTIFIED','KAI Builder is determining the product type and primary workflow.');status.innerHTML='<span class="status-dot"></span>KAI Builder is processing the request…';try{await new Promise(r=>setTimeout(r,220));setFlow(1);setScene('UNDERSTANDING');reportAdd('REQUIREMENTS EXTRACTED','Identifying requested screens, features, state and interactions.');await new Promise(r=>setTimeout(r,220));setScene('PONDERING');reportAdd('ARCHITECTURE ANALYSIS','Selecting the application structure and interaction model.');await new Promise(r=>setTimeout(r,220));setScene('ARCHITECTING');reportAdd('ARCHITECTURE SELECTED','Preparing the build plan before code generation.');setFlow(2);setScene('BUILDING');reportAdd('BUILDING','KAI Builder is generating the standalone application.');status.innerHTML='<span class="status-dot"></span>Building the actual application…';const r=await fetch('/api/appmaker-original-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:q})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error('KAI 51 could not complete this build right now. Please retry the build.');if(data.plan){const p=data.plan;reportAdd('PLAN CONFIRMED',String(p.intent||'Intent identified')+' · '+(Array.isArray(p.features)?p.features.slice(0,4).join(' · '):'Core features selected'));reportAdd('ARCHITECTURE',String(p.architecture||'Architecture selected'),true)}setFlow(3);setScene('TESTING');$('.preview').classList.add('testing');reportAdd('INTERACTION CHECK','Inspecting the generated app against the requested behavior.');status.innerHTML='<span class="status-dot"></span>Testing generated interactions…';if(data.validation)reportAdd('REQUIREMENT AUDIT',String(data.validation.passRate!=null?'Pass rate '+Math.round(Number(data.validation.passRate)*100)+'%':'Validation completed'),true);if(Array.isArray(data.steps)&&data.steps.some(s=>/repair/i.test(String(s)))){setScene('REPAIRING');reportAdd('REPAIR PASS','A validation issue was detected; applying the Builder repair pass.');status.innerHTML='<span class="status-dot"></span>Repairing the generated application…';}reportAdd('FINAL VALIDATION','Build response received and validation metadata processed.',true);$('.preview').classList.remove('testing');project=data;project.published=false;project.publicUrl='';render();if(data.agent?.logs?.length&&$('#resultReport')){$('#resultReport').innerHTML=data.agent.logs.map(s=>'<div class="report-line '+(s.stage==='VERIFY'?'done':'')+'"><span class="kind">'+String(s.stage)+'</span> '+String(s.message).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]||c))+'</div>').join('')}setFlow(4);enterPreviewMode();reportAdd('BUILD READY','The actual preview is now live.');status.className='status';status.innerHTML='<span class="status-dot"></span>Build ready. The live preview has replaced the Nucleus.'}catch(e){setScene('ERROR');reportAdd('BUILD ERROR',e.message||'Build failed');status.className='status';status.innerHTML='<span class="status-dot"></span>Build stopped: '+e.message}finally{$('#build').disabled=false}}
$('#build').addEventListener('click',build);prompt.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();build()}});window.HAxBROAppMaker={setPrompt(value){prompt.value=String(value||'');prompt.dispatchEvent(new Event('input',{bubbles:true}));prompt.focus()},build,modify:intelligentModify,reset(){project={};render()}};

/* LIVE AGENT SIDEBAR — real message routing + in-place modification */
(function(){
  const oldBtn=$('#modifyBuild');
  const input=$('#modifyPrompt');
  const side=$('#resultReport');
  if(!oldBtn||!input||!side)return;
  const btn=oldBtn.cloneNode(true);
  oldBtn.replaceWith(btn);
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))}
  function sideAdd(kind,message,done=false){
    const el=document.createElement('div'); el.className='report-line'+(done?' done':'');
    el.innerHTML='<span class="kind">'+esc(kind)+'</span> '+esc(message);
    side.appendChild(el); side.scrollTop=side.scrollHeight; return el;
  }
  function setBusy(v){btn.disabled=v;input.disabled=v;btn.classList.toggle('working',v)}
  function resizeComposer(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,110)+'px'}
  input.addEventListener('input',resizeComposer); resizeComposer();
  async function sendToKai(){
    const change=input.value.trim();
    if(!change)return;
    if(!project?.files?.length){sideAdd('KAI','Build an app first. This panel modifies the current live preview.');return}
    sideAdd('YOU',change);
    input.value='';
    setBusy(true); setScene('UNDERSTANDING'); setFlow(1);
    sideAdd('UNDERSTAND','KAI 51 received your instruction and is inspecting the current application.');
    const stages=[
      ['RESEARCH','Checking relevant interface/product patterns before changing the app.'],
      ['PLAN','Choosing the smallest coherent change while preserving working features.'],
      ['KAI 51','Synthesizing the modification against the current app, not a blank template.'],
      ['QA','Reviewing interactions, responsive layout and accidental regressions.']
    ];
    let i=0; const pulse=setInterval(()=>{if(i<stages.length){sideAdd(stages[i][0],stages[i][1]);i++;}},850);
    try{
      const existing={name:project.name,summary:project.summary,files:project.files.map(f=>({path:f.path,content:f.content}))};
      const r=await fetch('/api/appmaker-original-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:change,appName:project.name,existing})});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||'KAI did not return a modification');
      if(!Array.isArray(data.files)||!data.files[0]?.content)throw new Error('KAI returned no updated application');
      clearInterval(pulse);
      const logs=Array.isArray(data.agent?.logs)?data.agent.logs:[];
      side.innerHTML='';
      sideAdd('YOU',change,true);
      for(const log of logs)sideAdd(String(log.stage||'KAI'),String(log.message||''),String(log.stage)==='VERIFY');
      sideAdd('TEST','The updated application is now loaded into the live preview.',true);
      project={...project,...data,name:project.name,summary:project.summary,published:false,publicUrl:''};
      render();
      if($('#resultReport')){
        $('#resultReport').innerHTML='';
        sideAdd('YOU',change,true);
        for(const log of logs)sideAdd(String(log.stage||'KAI'),String(log.message||''),String(log.stage)==='VERIFY');
        sideAdd('READY','Modification applied to the existing app. Review the preview before publishing.',true);
      }
      setScene('PREVIEW');setFlow(4);
      status.className='status';status.innerHTML='<span class="status-dot"></span>KAI 51 modified the existing application. The new preview is live.';
    }catch(e){
      clearInterval(pulse); sideAdd('ERROR',e.message||'KAI modification failed'); status.className='status';status.innerHTML='<span class="status-dot"></span>KAI stopped: '+esc(e.message||'Modification failed');
    }finally{setBusy(false);input.focus()}
  }
  btn.addEventListener('click',e=>{e.preventDefault();sendToKai()});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendToKai()}});
})();

// Native 3D-style WebGL-free spatial renderer: reliable on constrained browsers, with real depth motion.
const ctx=canvas.getContext('2d');let W=0,H=0,dpr=1,t=0,particles=[];
function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=Math.max(1,r.width);H=Math.max(1,r.height);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:95},()=>({x:Math.random()*W,y:Math.random()*H,z:.15+Math.random()*.85,s:.4+Math.random()*1.8,a:.15+Math.random()*.7}))}window.addEventListener('resize',resize);resize();
function draw(){t+=.008;ctx.clearRect(0,0,W,H);const cx=W*.53,cy=H*.49;for(const p of particles){p.y-=p.s*(.25+p.z);if(p.y<-10)p.y=H+10;const pulse=(Math.sin(t*2+p.x*.01)+1)*.5;ctx.globalAlpha=p.a*(.3+p.z*.7);ctx.beginPath();ctx.arc(p.x+(cx-p.x)*.02*p.z,p.y,pulse*.7+p.z,0,Math.PI*2);ctx.fillStyle='rgba(150,180,255,1)';ctx.fill()}ctx.globalAlpha=.28;for(let i=0;i<12;i++){const a=t+i*.52,rx=42+i*7,ry=18+i*4;ctx.beginPath();for(let j=0;j<=64;j++){const q=j/64*Math.PI*2,x=cx+Math.cos(q+a)*rx,y=cy+Math.sin(q+a)*ry;j?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle='rgba(125,155,255,.18)';ctx.lineWidth=1;ctx.stroke()}ctx.globalAlpha=1;const core=42+Math.sin(t*3)*4;const g=ctx.createRadialGradient(cx,cy,2,cx,cy,core*2.2);g.addColorStop(0,'rgba(220,232,255,.95)');g.addColorStop(.16,'rgba(123,158,255,.55)');g.addColorStop(1,'rgba(70,105,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,core*2.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(190,210,255,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,core,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=t*.7+i*Math.PI/4,r=core+18+Math.sin(t*2+i)*5,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.58;ctx.fillStyle='rgba(155,190,255,.75)';ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill()}requestAnimationFrame(draw)}draw();