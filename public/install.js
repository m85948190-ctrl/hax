(()=>{
let deferredPrompt=null;
const buttons=[document.querySelector('#installAppBtn'),document.querySelector('#mobileInstallAppBtn'),document.querySelector('#sidebarInstallAppBtn'),document.querySelector('#landingInstallBtn')].filter(Boolean);
const uninstallButtons=[];
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=()=>/android/i.test(navigator.userAgent);
const panel=()=>document.querySelector('#installExperience');
const guide=()=>document.querySelector('#installGuide');
function render(){buttons.forEach(b=>{b.hidden=isStandalone();if(b.id==='landingInstallBtn')b.innerHTML='<span>DEPLOY HAxBRO TO DEVICE</span><b>⇩</b>';else b.innerHTML='⇩ INSTALL HAxBRO APP <small>DEVICE DEPLOYMENT</small>'});uninstallButtons.forEach(b=>b.hidden=!isStandalone())}
function openPanel(){const p=panel();if(!p)return openInstallLegacy();p.hidden=false;p.setAttribute('aria-hidden','false');document.body.classList.add('install-open');guide()?.setAttribute('hidden','');}
function closePanel(){const p=panel();if(p){p.hidden=true;p.setAttribute('aria-hidden','true')}document.body.classList.remove('install-open')}
async function triggerAndroid(){window.location.href='/download/';return;if(isStandalone())return;if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch{}deferredPrompt=null;render();return}if(/chrome|chromium|edg|opera/i.test(navigator.userAgent)){alert('HAxBRO is ready to install. Open your browser menu and choose “Install app” or “Add to Home screen”.');return}alert('On Android, open HAxBRO in Chrome and choose “Install app” or “Add to Home screen”.')}
function showGuide(device){const g=guide();if(!g)return;if(device==='android'){g.hidden=false;document.querySelector('#installGuideKicker').textContent='ANDROID · DIRECT DEPLOYMENT';document.querySelector('#installGuideTitle').textContent='Install HAxBRO';document.querySelector('#installGuideBody').innerHTML='<div class="install-direct"><b>ANDROID INSTALL</b><p>KAI detected Android. Use the browser install prompt for a native-style HAxBRO home-screen app.</p><button id="androidInstallNow" type="button">INSTALL NOW ↗</button><small>If the browser does not expose the prompt, Chrome → ⋮ → Install app / Add to Home screen.</small></div>';document.querySelector('#androidInstallNow').onclick=triggerAndroid;return}
g.hidden=false;document.querySelector('#installGuideKicker').textContent='iOS · SAFARI DEPLOYMENT';document.querySelector('#installGuideTitle').textContent='Add HAxBRO to Home Screen';document.querySelector('#installGuideBody').innerHTML='<div class="ios-steps">'+['Open HAxBRO in Safari on your iPhone or iPad.','Tap the Share button in Safari.','Scroll the Share Sheet if needed.','Find “Add to Home Screen”.','Tap “Add to Home Screen”.','Check that the HAxBRO name and icon look correct.','Tap “Add” in the top-right corner.','Return to your Home Screen.','Find the new HAxBRO icon.','Tap HAxBRO to launch the installed web app.','Use HAxBRO from the Home Screen without the normal Safari chrome.','For the cleanest result, keep the latest iOS version and Safari updated.'].map((s,i)=>`<div class="ios-step"><span>${String(i+1).padStart(2,'0')}</span><p>${s}</p></div>`).join('')+'</div><div class="ios-note"><b>QUICK PATH</b><span>Safari → Share → Add to Home Screen → Add</span></div>'}
function openInstallLegacy(){if(isStandalone())return;if(isIOS()){showGuide('ios');return}triggerAndroid()}
buttons.forEach(b=>b.addEventListener('click',openPanel));
document.querySelector('#installExperienceClose')?.addEventListener('click',closePanel);
document.querySelector('.install-backdrop')?.addEventListener('click',closePanel);
document.querySelectorAll('.install-choice').forEach(b=>b.addEventListener('click',()=>showGuide(b.dataset.device)));
document.querySelector('#installGuideBack')?.addEventListener('click',()=>{const g=guide();if(g)g.hidden=true});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;showButtons(true)});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;render();closePanel()});
window.addEventListener('load',()=>{const b=document.querySelector('#sidebarInstallAppBtn');if(b&&!b.nextElementSibling?.classList.contains('uninstall-app-btn')){const u=document.createElement('button');u.type='button';u.className='uninstall-app-btn';u.textContent='⊗ UNINSTALL';u.hidden=true;u.addEventListener('click',()=>alert('Remove HAxBRO from the device home screen using your browser/device controls.'));b.insertAdjacentElement('afterend',u);uninstallButtons.push(u)}render();if(!isStandalone()&&(deferredPrompt||isIOS()||isAndroid()))showButtons(true)});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
})();