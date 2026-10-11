(()=>{'use strict';
const consent=document.getElementById('haxbroConsentGate');
const intro=document.getElementById('haxbroCinematicIntro');
const check=document.getElementById('hboTermsCheck');
const enter=document.getElementById('hboEnterBtn');
const consentKey='haxbro:onboarding:consent:v1';
const consentValue=()=>{try{return JSON.parse(localStorage.getItem(consentKey)||'null')}catch{return null}};
if(consent&&intro){
  if(consentValue()?.accepted===true){consent.hidden=true}
  else {consent.hidden=false;intro.style.visibility='hidden'}
  check?.addEventListener('change',()=>{if(enter)enter.disabled=!check.checked});
  enter?.addEventListener('click',()=>{
    if(!check?.checked)return;
    try{localStorage.setItem(consentKey,JSON.stringify({accepted:true,termsVersion:'2026-10-11',privacyVersion:'2026-10-11',acceptedAt:new Date().toISOString()}))}catch{}
    consent.hidden=true;intro.style.visibility='';
    window.dispatchEvent(new CustomEvent('haxbro:onboarding-consent-accepted'));
  });
}
const slides=[
 {eyebrow:'01 / INTELLIGENCE',title:'Meet your <span>intelligence.</span>',body:'Think through questions, explore ideas, research information, and work with KAI 51 in one focused space.',tags:['KAI 51','LOCAL AI','RESEARCH'],image:'/onboarding-kai.svg',alt:'Original cyan neural intelligence illustration'},
 {eyebrow:'02 / APP MAKER',title:'Make your <span>dreams real.</span>',body:'Turn ideas into app concepts, build interfaces, and work through the code behind your projects.',tags:['APP MAKER','CODE','PROTOTYPES'],image:'/onboarding-appmaker.svg',alt:'Original app-building workspace illustration'},
 {eyebrow:'03 / CREATION TOOLS',title:'Create. Build. <span>Transform.</span>',body:'Work with code and files, create project assets, and use the Decoder and Encoder tools in your HAxBRO workspace.',tags:['CODE WRITER','FILES','DECODE / ENCODE'],image:'/onboarding-creation.svg',alt:'Original creative tools illustration'},
 {eyebrow:'04 / THE ECOSYSTEM',title:'Your ideas. <span>Your universe.</span>',body:'Move between connected workspaces for building, coding, learning, and creating—without losing sight of your next idea.',tags:['ONE WORKSPACE','CONNECTED TOOLS','YOUR PROJECTS'],image:'/onboarding-ecosystem.svg',alt:'Original connected HAxBRO ecosystem illustration'}
];
let currentStatus='Preparing KAI 51 on this device';
let currentProgress=0;
const modelReady=()=>!!(window.HAxBROKai51LocalFastEngine?.isReady?.()||window.HAxBROKai51Engine?.isReady?.());
function setStatus(t){const n=document.getElementById('hfsFooterStatus');if(n)n.textContent=t||currentStatus}
function renderProgress(){
 const status=document.getElementById('hfsReadyStatus');if(status)status.textContent=currentStatus;
 const bar=document.querySelector('#haxbroFeatureSequence .hfs-progress span');if(bar)bar.style.width=currentProgress+'%';
 const foot=document.getElementById('hfsFooterStatus');if(foot)foot.textContent=currentStatus;
 const pct=document.getElementById('hfsPercent');if(pct)pct.textContent=Math.round(currentProgress)+'%';
 if(modelReady())showReady();
}
function progressFrom(e){
 const d=e?.detail||{};
 if(d.status)currentStatus=String(d.status).slice(0,140);
 const p=Number(d.progress);
 if(Number.isFinite(p))currentProgress=Math.max(0,Math.min(100,p));
 renderProgress();
}
window.addEventListener('haxbro:kai-local-progress',progressFrom);
window.addEventListener('haxbro:kai51-bootstrap',progressFrom);
window.addEventListener('haxbro:kai51-ready',()=>{currentProgress=100;currentStatus='KAI 51 neural model verified and ready';renderProgress()});
function ensureSequence(){
 let root=document.getElementById('haxbroFeatureSequence');if(root)return root;
 root=document.createElement('section');root.id='haxbroFeatureSequence';root.hidden=true;root.setAttribute('aria-label','Discover HAxBRO AI');
 root.innerHTML='<header class="hfs-top"><div class="hfs-brand"><img src="/logo-symbol.svg?v=753" alt=""><span>HAxBRO <span style="color:#75e9ff">AI</span></span></div><div class="hfs-top-label">YOUR PERSONAL AI WORKSPACE</div></header><main class="hfs-main" id="hfsMain"><div class="hfs-copy"><div class="hfs-step" id="hfsStep"></div><h1 id="hfsTitle"></h1><p id="hfsBody"></p><div class="hfs-proof" id="hfsTags"></div></div><div class="hfs-visual"><img id="hfsImage" alt=""></div></main><footer class="hfs-bottom"><div class="hfs-bottom-row"><div class="hfs-dots" role="progressbar" aria-label="Feature introduction" aria-valuemin="1" aria-valuemax="4" aria-valuenow="1" id="hfsDots"></div><div class="hfs-status"><i></i><span id="hfsFooterStatus">Preparing your personal KAI copy…</span></div></div><div class="hfs-footer-note">MODEL DOWNLOAD AND INITIALIZATION CONTINUE IN THE BACKGROUND · LOCAL COPIES ARE SAVED WHEN THE BROWSER ALLOWS</div></footer>';
 document.body.appendChild(root);return root;
}
let root=null,slideIndex=0,slideTimer=null,waitTimer=null,readyTimer=null,started=false,tourComplete=false;
function renderSlide(index){
 slideIndex=index;const s=slides[index];
 document.getElementById('hfsStep').textContent=s.eyebrow;
 document.getElementById('hfsTitle').innerHTML=s.title;
 document.getElementById('hfsBody').textContent=s.body;
 const tags=document.getElementById('hfsTags');tags.innerHTML='';s.tags.forEach(t=>{const el=document.createElement('span');el.textContent=t;tags.appendChild(el)});
 const img=document.getElementById('hfsImage');img.style.animation='none';void img.offsetWidth;img.style.animation='';img.src=s.image;img.alt=s.alt;
 const dots=document.getElementById('hfsDots');dots.innerHTML='';dots.setAttribute('aria-valuenow',String(index+1));
 slides.forEach((_,i)=>{const d=document.createElement('span');d.className='hfs-dot'+(i===index?' active':'');d.setAttribute('aria-hidden','true');dots.appendChild(d)});
 setStatus(currentStatus);
}
function showReady(){
 if(started&&!tourComplete)return;
 const main=document.getElementById('hfsMain');if(!main||main.dataset.ready==='yes')return;
 main.dataset.ready='yes';
 if(slideTimer){clearInterval(slideTimer);slideTimer=null}if(waitTimer){clearTimeout(waitTimer);waitTimer=null}
 main.innerHTML='<div class="hfs-ready"><div class="hfs-ready-mark" aria-hidden="true">✓</div><div class="hfs-step">DEVICE MODEL VERIFIED</div><h1>Your KAI is <span style="color:#75e9ff">ready.</span></h1><p>The local neural runtime passed its readiness check. Your browser can reuse cached model files on future visits when storage remains available. Larger model lanes may continue preparing in the background.</p><div class="hfs-progress"><span style="width:100%"></span></div><div class="hfs-ready-status" id="hfsReadyStatus">KAI 51 neural model verified and ready</div><button type="button" class="hbo-enter hfs-enter" id="hfsEnterWorkspace">ENTER HAxBRO <span aria-hidden="true">↗</span></button></div><div class="hfs-visual"><img src="/onboarding-ecosystem.svg" alt="HAxBRO connected AI ecosystem illustration"></div>';
 currentProgress=100;currentStatus='KAI 51 neural model verified and ready';renderProgress();
 document.getElementById('hfsEnterWorkspace')?.addEventListener('click',finish);
}
function showWait(){
 const main=document.getElementById('hfsMain');if(!main||main.dataset.ready==='yes')return;
 main.innerHTML='<div class="hfs-ready"><div class="hfs-ready-mark" aria-hidden="true">◌</div><div class="hfs-step">PERSONAL DEVICE SETUP</div><h1>Preparing your <span style="color:#75e9ff">KAI copy.</span></h1><p>The feature tour is complete. KAI is still downloading or initializing its real neural model. This screen updates when the runtime reports readiness; the animation will not pretend installation is complete.</p><div class="hfs-progress"><span></span></div><div class="hfs-ready-status" id="hfsReadyStatus"></div><div class="hfs-ready-status"><span id="hfsPercent">0%</span> · LIVE INSTALLATION STATUS</div><button type="button" class="hfs-retry" id="hfsRetry">Retry model preparation</button></div><div class="hfs-visual"><img src="/onboarding-ecosystem.svg" alt="HAxBRO connected AI ecosystem illustration"></div>';
 document.getElementById('hfsRetry')?.addEventListener('click',()=>{
  setStatus('Retrying the KAI model pipeline…');
  const b=window.HAxBROKai51BootstrapPipeline;
  if(b?.start)b.start().catch(()=>{});
  else window.HAxBROKai51Bootstrap?.prepare?.().catch(()=>{});
 });
 renderProgress();
}
function finish(){
 if(!modelReady()){showWait();return}
 if(root)root.hidden=true;
 if(intro){intro.hidden=true;intro.style.visibility='';intro.style.opacity='';}
 try{localStorage.setItem('haxbro:onboarding:features:v1',JSON.stringify({seen:true,at:new Date().toISOString()}))}catch{}
 document.getElementById('promptInput')?.focus({preventScroll:true});
}
function beginSequence(){
 if(started)return;started=true;
 if(intro){intro.classList.add('hci-exit');intro.style.opacity='0';intro.style.visibility='hidden';intro.querySelector('video')?.pause();}
 root=ensureSequence();root.hidden=false;root.style.opacity='1';renderSlide(0);
 let n=0;
 slideTimer=setInterval(()=>{
  n++;
  if(n<slides.length){renderSlide(n);return}
  clearInterval(slideTimer);slideTimer=null;tourComplete=true;
  if(modelReady())showReady();else showWait();
 },2500);
 waitTimer=setTimeout(()=>{if(!modelReady())showWait()},10500);
 readyTimer=setTimeout(()=>{if(!modelReady()){currentStatus='KAI installation needs a retry on this device';setStatus(currentStatus);const n=document.getElementById('hfsReadyStatus');if(n)n.textContent=currentStatus}},30*60*1000);
}
function setIntroLabel(){
 const btn=intro?.querySelector('.hci-continue');if(!btn)return;
 const state=window.HAxBROKai51Bootstrap?.state?.();
 const seconds=Number(btn.dataset.remaining||30);
 if(modelReady()){btn.disabled=false;btn.textContent='CONTINUE →';const timer=intro.querySelector('[data-hci-countdown]');if(timer)timer.textContent='KAI 51 LOCAL MODEL READY';return}
 if(seconds<=0){btn.disabled=false;btn.textContent='CONTINUE →';const timer=intro.querySelector('[data-hci-countdown]');if(timer)timer.textContent='CONTINUE · INSTALLATION CONTINUES';return}
 btn.disabled=true;btn.textContent='CONTINUE · '+seconds+'s';const timer=intro.querySelector('[data-hci-countdown]');if(timer)timer.textContent=state?.status==='installing'?'KAI MODEL INSTALLING':'KAI IS PREPARING';
}
if(intro){
 const btn=intro.querySelector('.hci-continue');
 if(btn){
  let left=30;btn.dataset.remaining='30';setIntroLabel();
  const tick=setInterval(()=>{left=Math.max(0,left-1);btn.dataset.remaining=String(left);setIntroLabel();if(left===0||modelReady())clearInterval(tick)},1000);
  window.addEventListener('haxbro:kai51-ready',()=>{btn.dataset.remaining='0';setIntroLabel()});
  btn.addEventListener('click',()=>{if(btn.disabled)return;beginSequence()});
 }
 intro.querySelector('video')?.play?.().catch(()=>{});
}
window.addEventListener('haxbro:kai51-ready',()=>{currentProgress=100;currentStatus='KAI 51 neural model verified and ready';renderProgress();if(started)showReady()});
window.addEventListener('haxbro:kai51-bootstrap',e=>{if(e?.detail?.status==='ready'&&modelReady()){currentProgress=100;currentStatus='KAI 51 neural model verified and ready';renderProgress()}});
})();