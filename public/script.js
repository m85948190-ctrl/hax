const $=s=>document.querySelector(s),messages=$('#messages'),input=$('#promptInput');function haxbroDevice(){const ua=navigator.userAgent||'',ios=/iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),android=/Android/i.test(ua);return ios?'ios':android?'android':'desktop'}function initHaxbroDevice(){const device=haxbroDevice();document.documentElement.dataset.device=device;document.body.dataset.device=device;window.HAxBRO_DEVICE=device;return device}initHaxbroDevice();function openHaxbroFile(url){if(!url)return;const device=haxbroDevice();if(device==='ios'){window.open(url,'_blank','noopener,noreferrer');return}const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';if(device==='android')a.setAttribute('download','');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>{if(document.visibilityState==='visible')window.open(url,'_blank','noopener,noreferrer')},450)}let selectedPlugin=null;const cyberTerms=/\b(cybersecurity|cyber security|security|hacking|hacker|ethical hacking|pentest|penetration test|vulnerability|vulnerabilities|exploit|exploitation|malware|ransomware|phishing|social engineering|ctf|soc|siem|firewall|encryption|cryptography|forensics|incident response|zero[- ]day|xss|sql injection|sqli|csrf|ddos|botnet|reverse shell|payload)\b/i;const cyberAlertTerms=/\b(ransomware|malware|phishing|credential theft|steal credentials|ddos|botnet|zero[- ]day|exploit|exploitation|payload|reverse shell|shellcode|attack|breach|incident)\b/i;function applyContextTheme(text){const t=String(text||'');const cyber=cyberTerms.test(t);document.body.classList.toggle('cyber-ui',cyber);document.body.classList.toggle('cyber-alert',cyber&&cyberAlertTerms.test(t));localStorage.setItem('haxbro_context_theme',cyber?'cyber':'normal')}function updateCustomerProfile(name){const card=$('#customerProfile'),avatar=$('#customerProfileAvatar'),label=$('#customerProfileName'),role=$('#customerProfileRole'),topUser=$('#topUsername');const n=String(name||localStorage.getItem('haxbro_username')||'').trim();if(topUser){topUser.hidden=!n;const b=topUser.querySelector('b');if(b)b.textContent=n||'—'}if(!card||!avatar||!label)return;if(overdrive&&overdrive===true){avatar.textContent='A';label.textContent='A';if(role)role.textContent='ADMIN MODE · HAxBRO OWNER';card.hidden=false;avatar.style.background='linear-gradient(135deg,#7f0715,#ff1f3d)';return}if(!n){card.hidden=true;return}const first=(n.match(/[A-Za-z0-9]/)||['?'])[0].toUpperCase();let sum=0;for(let i=0;i<n.length;i++)sum+=n.charCodeAt(i)*(i+1);const colors=['linear-gradient(135deg,#315cff,#159bd8)','linear-gradient(135deg,#e23b5d,#ff7a59)','linear-gradient(135deg,#7c3aed,#21d4fd)','linear-gradient(135deg,#00a86b,#315cff)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#0ea5e9,#8b5cf6)'];avatar.textContent=first;avatar.style.background=colors[sum%colors.length];label.textContent=n;card.hidden=false}let mode=localStorage.getItem('haxbro_mode')||'normal',study=localStorage.getItem('haxbro_study')==='true',kaiMode='deep',chats=JSON.parse(localStorage.getItem('haxbro_chats')||'[]'),current=null,adminChats=JSON.parse(localStorage.getItem('haxbro_admin_chats')||'[]'),adminCurrent=null;const ADMIN69='admin69';let overdrive=false;let admin69Busy=false;let lastSendValue='';let lastSendAt=0;function getKaiProfile(){let p;try{p=JSON.parse(localStorage.getItem('haxbro_kai_profile')||'null')}catch(e){p=null}const username=(localStorage.getItem('haxbro_username')||'').trim();if(!username)return p;const safe=username.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32)||'User';if(!p||p.username!==username){p={id:'kai61_'+safe+'_'+uid(),username,agentName:username+' AI Agent',createdAt:Date.now(),storage:'browser-local'};localStorage.setItem('haxbro_kai_profile',JSON.stringify(p))}return p}const modes={normal:{name:'NORMAL',desc:'Friendly, helpful, creative AI.',hint:'Normal mode is conversational'},beast:{name:'BEAST',desc:'Concise, blunt cybersecurity expert.',hint:'Beast mode: VERDICT · RISK · FIX · VERIFY'},hacking:{name:'HACKING',desc:'Ethical hacking lab and CTF assistant.',hint:'Hacking mode: authorized labs, CTFs, recon concepts and defensive testing'}};function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}function save(){localStorage.setItem('haxbro_chats',JSON.stringify(chats));localStorage.setItem('haxbro_admin_chats',JSON.stringify(adminChats))}function welcome(){return [{who:'bot',text:study?'Study Mode enabled. Tell me what you want to learn and I will explain it step by step.':'HAxBRO ready. What are we building today?'}]}function adminWelcome(){return [{who:'bot',text:'KAI AGENT READY. Give KAI an authorized task. Admin execution history is isolated from your normal HAxBRO chats.'}]}function newChat(){if(overdrive){adminCurrent=uid();adminChats.unshift({id:adminCurrent,title:'New KAI execution',items:adminWelcome(),updated:Date.now()});save();renderHistory();renderMessages();return}current=uid();chats.unshift({id:current,title:'New conversation',items:welcome(),updated:Date.now()});save();renderHistory();renderMessages()}function active(){return overdrive?adminChats.find(c=>c.id===adminCurrent):chats.find(c=>c.id===current)}function renderMessages(){messages.innerHTML='';(active()?.items||[]).forEach(x=>addMessage(x.text,x.who,false));messages.scrollTop=messages.scrollHeight}function renderHistory(){const boxes=[$('#chatHistory'),$('#mobileChatHistory')].filter(Boolean);boxes.forEach(box=>box.innerHTML='');const list=overdrive?adminChats:chats;const selected=overdrive?adminCurrent:current;list.sort((a,b)=>b.updated-a.updated).slice(0,30).forEach(c=>{boxes.forEach(box=>{const row=document.createElement('div');row.className='history-row'+(c.id===selected?' selected':'');const b=document.createElement('button');b.className='history-item';b.textContent=c.title;b.onclick=()=>{if(overdrive)adminCurrent=c.id;else current=c.id;renderHistory();renderMessages()};const more=document.createElement('button');more.className='history-more';more.type='button';more.textContent='⋯';more.title='Chat options';more.setAttribute('aria-label','Chat options');more.onclick=e=>{e.stopPropagation();showChatMenu(c,more)};row.append(b,more);box.appendChild(row)})})}function showChatMenu(c,anchor){document.querySelectorAll('.chat-menu-pop').forEach(x=>x.remove());const menu=document.createElement('div');menu.className='chat-menu-pop';menu.innerHTML='<button type="button">DELETE CHAT</button>';menu.firstChild.onclick=()=>{if(overdrive){adminChats=adminChats.filter(x=>x.id!==c.id);if(adminCurrent===c.id)adminCurrent=adminChats[0]?.id||null}else{chats=chats.filter(x=>x.id!==c.id);if(current===c.id)current=chats[0]?.id||null}if(overdrive){if(!adminCurrent)newChat();else{save();renderHistory();renderMessages()}}else if(!current)newChat();else{save();renderHistory();renderMessages()}menu.remove()};document.body.appendChild(menu);const r=anchor.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(window.innerWidth-150,r.right-150))+'px';menu.style.top=(r.bottom+6)+'px';setTimeout(()=>{const close=e=>{if(!menu.contains(e.target)&&e.target!==anchor){menu.remove();document.removeEventListener('click',close)}};document.addEventListener('click',close)},0)}function setMode(m){mode=m;localStorage.setItem('haxbro_mode',m);document.body.classList.toggle('beast-ui',m==='beast');$('#modeName').textContent=modes[m].name;$('#modeDesc').textContent=modes[m].desc;$('#headMode').textContent=modes[m].name;$('#modeHint').textContent=modes[m].hint;document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));if(m==='normal'&&!overdrive){document.body.classList.remove('overdrive-ui');const h=$('#adminUltimaxHeader');if(h){h.setAttribute('aria-hidden','true');h.style.display='none'}}}function openUltimaxMode(prefill=''){if(!overdrive)return;const header=$('#adminUltimaxHeader');if(header){header.setAttribute('aria-hidden','false');header.style.removeProperty('display')}const field=$('#promptInput');if(field){field.value=prefill;field.focus();resize()}document.body.classList.remove('ultimax-open')}
function closeUltimaxMode(){const panel=$('#ultimaxMode');if(panel){panel.hidden=true;panel.setAttribute('aria-hidden','true')}const header=$('#adminUltimaxHeader');if(header){header.setAttribute('aria-hidden','true');header.style.display='none'}document.body.classList.remove('ultimax-open')}
function setOverdrive(v=true){overdrive=!!v;document.body.classList.toggle('overdrive-ui',overdrive);document.body.classList.toggle('kai69-secret-mode',overdrive);if(overdrive){document.body.classList.remove('beast-ui','cyber-ui','cyber-alert');document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.sidebar,.topbar,.chat-head,.chat-panel,.mobile-menu,.ultimax-live-rail').forEach(el=>{if(el)el.dataset.kai69Hidden='1'});if(window.HAxBROAdmin69Simulation?.open)window.HAxBROAdmin69Simulation.open();}else{document.querySelectorAll('[data-kai69-hidden]').forEach(el=>delete el.dataset.kai69Hidden);window.HAxBROAdmin69Simulation?.close?.();setMode(mode);renderHistory();renderMessages();applyContextTheme('')}}async function checkAdmin69(text){
 const v=String(text||'').trim().toLowerCase();
 // Accept only the exact owner trigger, with harmless spacing variants. Intercept before every other router.
 const isAdmin69=/^admin\s*69$/.test(v);
 if(!isAdmin69||admin69Busy)return false;
 if(sessionStorage.getItem('haxbro_admin69_authenticated')==='true'){
   setOverdrive(true);return true;
 }
 admin69Busy=true;
 const gate=$('#adminPasswordGate'),field=$('#adminPasswordInput'),err=$('#adminPasswordError');
 if(gate){gate.hidden=false;gate.setAttribute('aria-hidden','false');if(err)err.hidden=true;if(field){field.value='';setTimeout(()=>field.focus(),40)}}
 return true
}


function ensureAdmin69Pill(){
 const wrap=document.querySelector('.input-wrap');if(!wrap)return;
 let pill=wrap.querySelector('.admin69-pill');
 if(!pill){pill=document.createElement('span');pill.className='admin69-pill';pill.textContent='ADMIN 69';pill.setAttribute('aria-label','Admin 69 mode');wrap.insertBefore(pill,wrap.firstChild)}
 pill.hidden=!overdrive;
}
function admin69IsDestructive(command){
 return /\b(?:delete|remove|destroy|drop|wipe|erase|purge|overwrite|disable|revoke|terminate|kill|shut\s*down|reset|factory\s*reset|uninstall|publish|deploy|write\s+to|modify\s+(?:production|live)|change\s+(?:production|live)|send\s+email|send\s+message|transfer|charge|purchase)\b/i.test(String(command||''));
}
async function admin69ExternalHandoff(command){
 const endpoint=String(window.HAxBROAdmin69DestructiveEndpoint||localStorage.getItem('haxbro_admin69_destructive_endpoint')||'').trim();
 if(!endpoint) return {ok:false,configured:false};
 try{
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'HAxBRO AI',agent:'KAI 51',mode:'ADMIN 69',message:String(command||''),timestamp:new Date().toISOString()})});
   const data=await r.json().catch(()=>({}));
   return {ok:r.ok,configured:true,data};
 }catch(e){return {ok:false,configured:true,error:e?.message||'handoff failed'}}
}
function resize(){if(!input)return;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,180)+'px'}function setKaiMode(){kaiMode='deep'}
function esc(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML}
function renderRich(text){const raw=String(text??'');const parts=raw.split(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g);let html='';for(let i=0;i<parts.length;i+=3){let plain=esc(parts[i]).replace(/\n/g,'<br>');plain=plain.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener" class="hax-file-link">$1 ↗</a>');plain=plain.replace(/(^|[\s>])(https?:\/\/[^\s<]+)/g,'$1<a href="$2" target="_blank" rel="noopener" class="hax-file-link">$2 ↗</a>');plain=plain.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');html+=plain;if(i+2<parts.length){const lang=(parts[i+1]||'text').toLowerCase();const code=parts[i+2];const id='code_'+uid();html+='<div class="hax-code-wrap"><div class="hax-code-bar"><span>'+esc(lang)+'</span><button type="button" data-copy-code="'+id+'">COPY</button>'+(lang==='html'||lang==='htm'?' <button type="button" data-preview-html="'+id+'">PREVIEW</button>':'')+'</div><pre class="hax-code"><code id="'+id+'">'+esc(code)+'</code></pre>'+(lang==='html'||lang==='htm'?'<iframe class="hax-html-preview" id="preview_'+id+'" sandbox="allow-scripts" hidden></iframe>':'')+'</div>'}}return html}
function bindRichControls(scope){scope.querySelectorAll('.hax-file-link').forEach(a=>{if(/^DOWNLOAD/i.test((a.textContent||'').trim()))a.onclick=e=>{e.preventDefault();openHaxbroFile(a.href)}});scope.querySelectorAll('[data-copy-code]').forEach(b=>b.onclick=async()=>{const c=document.getElementById(b.dataset.copyCode);if(c){await navigator.clipboard?.writeText(c.textContent||'');const old=b.textContent;b.textContent='COPIED ✓';setTimeout(()=>b.textContent=old,1200)}});scope.querySelectorAll('[data-preview-html]').forEach(b=>b.onclick=()=>{const id=b.dataset.previewHtml,c=document.getElementById(id),frame=document.getElementById('preview_'+id);if(!c||!frame)return;frame.hidden=!frame.hidden;if(!frame.hidden)frame.srcdoc=c.textContent||''})}
function addMessage(text,who='bot',saveIt=true){if(!messages)return;const wrap=document.createElement('div');const isUser=who==='user';wrap.className='message '+(isUser?'user-msg':'bot-msg')+(overdrive?' admin-chat-msg':'');const avatar=isUser?'<span>U</span>':(overdrive?'<span class="kai-chat-avatar">K</span>':'<img src="/logo-symbol.svg?v=218" alt="HAxBRO">');wrap.innerHTML='<div class="avatar message-avatar">'+avatar+'</div><div class="message-body"><div class="bubble message-copy">'+(isUser?esc(text).replace(/\n/g,'<br>'):renderRich(text))+'</div></div>';messages.appendChild(wrap);if(!isUser)bindRichControls(wrap);if(saveIt){const c=active();if(c){c.items.push({who,text});c.updated=Date.now();save();renderHistory()}}messages.scrollTop=messages.scrollHeight}
function ensureChat(){if(!current||!active()){newChat()}}
let thinkingBubble=null,thinkingTimer=null,thinkingStartedAt=0;
const KAI_ACTIVITY_STAGES=['Understanding your request','Deciding the best route','Searching for relevant information','Cross-checking what was found','Reasoning and synthesizing','Preparing the answer'];
function kaiHostFromUrl(url){try{return new URL(url).hostname.replace(/^www\\./,'')}catch{return''}}
function kaiFavicon(url){const host=kaiHostFromUrl(url);return host?'https://www.google.com/s2/favicons?domain='+encodeURIComponent(host)+'&sz=32':''}
function kaiActivityRow(label,detail='',iconUrl=''){const row=document.createElement('div');row.className='kai-activity-row';const icon=document.createElement('span');icon.className='kai-activity-icon';if(iconUrl){const img=document.createElement('img');img.alt='';img.src=iconUrl;img.onerror=()=>{img.remove();icon.textContent='•'};icon.appendChild(img)}else{icon.textContent='•'}const copy=document.createElement('span');copy.className='kai-activity-copy';const main=document.createElement('span');main.textContent=label;copy.appendChild(main);if(detail){const sub=document.createElement('small');sub.textContent=detail;copy.appendChild(sub)}row.append(icon,copy);return row}
function kaiActivityDeepX(steps){if(!thinkingBubble||!Array.isArray(steps)||!steps.length)return;const list=thinkingBubble.querySelector('.kai-activity-list');if(!list)return;steps.forEach(s=>{const label=typeof s==='string'?s:(s?.label||s?.message||s?.title||'DEEPX step completed');const detail=typeof s==='string'?'':(s?.detail||s?.status||'');list.appendChild(kaiActivityRow(label,detail,s?.url?kaiFavicon(s.url):''));});messages.scrollTop=messages.scrollHeight}
function kaiActivityStart(profile='heavy'){
 if(!messages)return;
 if(thinkingBubble)thinkingBubble.remove();
 thinkingStartedAt=Date.now();
 thinkingBubble=document.createElement('div');
 thinkingBubble.className='haxbro-thinking kai-activity';
 thinkingBubble.setAttribute('role','status');
 thinkingBubble.setAttribute('aria-label','KAI 51 is working');
 const phrases=[
  ['Reading your request','KAI is parsing intent and context'],
  ['Mapping the task','Choosing the right HAxBRO capability'],
  ['Connecting the pieces','Checking context, tools and available data'],
  ['Working through it','Building the response step by step'],
  ['Validating the result','Cross-checking before showing it'],
  ['Finalizing','Turning the work into a clean answer']
 ];
 const label=profile==='light'?'KAI FAST · THINKING':'KAI 51 · THINKING';
 thinkingBubble.innerHTML='<div class="kai-activity-head"><div class="kai-thinking-pill" aria-hidden="true"><span class="kai-thinking-pill-track"><i class="kai-thinking-pill-dot"></i><span class="kai-thinking-pill-label">'+label+'</span><span class="kai-thinking-pill-time kai-activity-time">0s</span></span></div></div><div class="kai-activity-list"></div>';
 messages.appendChild(thinkingBubble);
 const currentLine=thinkingBubble.querySelector('.kai-activity-current');
 const setPhrase=(i)=>{if(!currentLine)return;const p=phrases[i%phrases.length];currentLine.querySelector('b').textContent=p[0];currentLine.querySelector('small').textContent=p[1];};
 setPhrase(0);
 const list=thinkingBubble.querySelector('.kai-activity-list');
 let stageIndex=0;
 thinkingTimer=setInterval(()=>{
   const elapsed=Math.floor((Date.now()-thinkingStartedAt)/1000);
   const clock=thinkingBubble?.querySelector('.kai-activity-time');if(clock)clock.textContent=elapsed+'s';
   const current=thinkingBubble?.querySelector('.kai-activity-list');
   if(current&&stageIndex<phrases.length&&elapsed>=stageIndex*0.8){
     const p=phrases[stageIndex];
     current.appendChild(kaiActivityRow(p[0],p[1]));
     stageIndex++;
     requestAnimationFrame(()=>requestAnimationFrame(()=>current.scrollTo({top:current.scrollHeight,behavior:'smooth'})));
   }
 },250);
 /* Keep the main conversation anchored; only the log viewport moves. */
}
function kaiActivityResearch(steps){
 if(!thinkingBubble||!Array.isArray(steps)||!steps.length)return;
 const list=thinkingBubble.querySelector('.kai-activity-list');if(!list)return;
 const seen=new Set();
 steps.slice(0,20).forEach(step=>{
   const url=typeof step==='string'?step:(step?.url||step?.source||step?.link||'');
   const label=typeof step==='string'?'Source checked':(step?.label||step?.title||step?.status||'Source checked');
   const key=url||label;if(seen.has(key))return;seen.add(key);
   const host=url?kaiHostFromUrl(url):'';
   list.appendChild(kaiActivityRow(host?'Checked '+host:label,url?'source returned by research':'research step completed',url?kaiFavicon(url):''));
 });
 requestAnimationFrame(()=>requestAnimationFrame(()=>list.scrollTo({top:list.scrollHeight,behavior:'smooth'})));
}
function kaiActivityFinish(data){
 if(!thinkingBubble)return;
 if(thinkingTimer){clearInterval(thinkingTimer);thinkingTimer=null}
 kaiActivityResearch(data?.webSteps||data?.sources||[]);
 const elapsed=Math.floor((Date.now()-thinkingStartedAt)/1000);
 const clock=thinkingBubble.querySelector('.kai-activity-time');if(clock)clock.textContent=elapsed+'s';
 const list=thinkingBubble.querySelector('.kai-activity-list');
 if(list){const final=kaiActivityRow('Answer ready','KAI 51 synthesized the result');final.classList.add('kai-activity-final');list.appendChild(final);requestAnimationFrame(()=>requestAnimationFrame(()=>list.scrollTo({top:list.scrollHeight,behavior:'smooth'})))}
 thinkingBubble.classList.add('is-complete');
 setTimeout(()=>{if(thinkingBubble){thinkingBubble.classList.add('is-fading');setTimeout(()=>{thinkingBubble?.remove();thinkingBubble=null},420)}},520);
}
function setBusy(v,profile='heavy'){
 const b=$('#sendBtn');if(b){b.disabled=v;b.classList.toggle('busy',v);b.setAttribute('aria-busy',v?'true':'false')}
 if(v&&!thinkingBubble)kaiActivityStart(profile);
 else if(!v&&thinkingBubble){if(thinkingTimer){clearInterval(thinkingTimer);thinkingTimer=null}thinkingBubble.classList.add('is-fading');setTimeout(()=>{thinkingBubble?.remove();thinkingBubble=null},420)}
}
const BUILD_WORDS='ai|artificial intelligence|agent|assistant|bot|copilot|builder|app|application|web application|webapp|web app|website|web site|site|landing page|dashboard|portal|platform|product|software|tool|system|saas|pwa|mobile app|desktop app|frontend|front end|backend|full stack|full-stack|fullstack|interface|ui|ux|experience|page|pages|screen|screens|workspace|client|admin panel|admin dashboard|control panel|ecommerce|store|shop|marketplace|blog|portfolio|forum|community|chat app|social app|game|web game|browser app|chrome extension|extension|plugin|widget|component|template|prototype|mvp|project|repo|repository|github|git|html|css|javascript|typescript|react|nextjs|next.js|vue|svelte|angular|tailwind|node|api|database|form|login|signup|authentication|auth|profile|settings|search|upload|download|checkout|payment|stripe|analytics|chart|graph|table|calendar|booking|reservation|messaging|chat|voice|video|image|media|generator|editor|cms|crm|erp|automation|workflow|dashboard app|internal tool|customer portal|user portal|ai tool|ai website|ai app|ai assistant|personal ai|my ai|my website|my web application|my app|my application|my software|my product|make ai|build ai|create ai|develop ai|make an app|build an app|create an app|make a website|build a website|create a website|make a web application|build a web application|create a web application|make a web app|build a web app|create a web app|turn this into an app|turn this into a website|launch|deploy|publish|ship|forge|generate|create|make|build|develop|design';
const BUILD_RE=new RegExp('\\\\b(?:'+BUILD_WORDS.split('|').map(x=>x.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')).join('|')+')\\\\b','i');
function chatIntent(text){const t=String(text||'').toLowerCase();if(/\\b(powerpoint|pptx|ppt|presentation|slide deck|slides)\\b/.test(t))return'file-pptx';if(/\\b(create|make|generate|build|write|code|program|script|html|css|javascript|typescript|python|sql|bash|react|next\\.js)\\b/.test(t)&&/\\b(code|program|script|html|css|javascript|typescript|python|sql|bash|react|next|function|class|api)\\b/.test(t))return'code';if(/\\b(pdf|document|doc|report|resume|letter|worksheet)\\b/.test(t)&&/\\b(make|create|generate|write|build)\\b/.test(t))return'file-pdf';if(/\\b(zip|bundle)\\b/.test(t)&&/\\b(make|create|generate|build)\\b/.test(t))return'file-zip';if(BUILD_RE.test(t)&&/\\b(make|build|create|develop|design|generate|turn|convert|launch|deploy|publish|ship|forge)\\b/.test(t))return'app';if(/\\b(make|build|create|develop|design|generate)\\s+(?:an?\\s+)?(?:ai|assistant|agent|bot|system|product)\\b/i.test(t))return'app';if(/\\b(convert|youtube|mp4|mp3|audio|video|media)\\b/.test(t)&&/\\b(media|video|audio|youtube|mp4|mp3|convert)\\b/.test(t))return'media';return'chat'}
async function runChatTool(intent,value){if(intent==='media'){openPanel?.('mediaConverterPanel');addMessage('🎬 Media tools are ready in the chat workspace. Use the converter panel here for authorized media conversion.','bot');return true}if(intent==='code'){const r=await fetch('/api/code-writer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:value,language:'javascript',framework:''})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'Code Writer failed');addMessage(d.response||'Code generated.','bot');return true}if(intent==='file-pptx'||intent==='file-pdf'||intent==='file-zip'){const type=intent==='file-pptx'?'pptx':intent==='file-pdf'?'pdf':'zip';const r=await fetch('/api/file-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:value,type})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'File creation failed');addMessage('✅ I created your '+(type==='pptx'?'PowerPoint presentation':type.toUpperCase())+'.\n\n[DOWNLOAD '+String(d.name||'FILE')+']('+String(d.url||'')+')','bot');return true}if(intent==='app'){const r=await fetch('/api/app-builder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:value,username:localStorage.getItem('haxbro_username')||'local-user'})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'App Maker failed');const files=Array.isArray(d.files)?d.files:[];let reply='🚀 App built directly in chat: **'+String(d.name||'HAxBRO App')+'**\n\nFiles: '+files.map(f=>f.path).join(', ');const index=files.find(f=>f.path==='index.html')||files[0];if(index?.content)reply+='\n\n```html\n'+index.content+'\n```';addMessage(reply,'bot');return true}return false}
chatIntent=function(text){const t=String(text||'').trim();const lower=t.toLowerCase();/* App Maker must be an explicit user command, never inferred from incidental words inside pasted conversations, quotes, roasts, or normal discussion. */const explicitApp=/\b(?:make|build|create|develop|design|generate)\s+(?:me\s+)?(?:an?\s+)?(?:app|application|web\s*app|web\s*application|website|site|dashboard|portal|platform|tool|system|saas|pwa|mobile\s+app|desktop\s+app|game|chat\s+app|ai\s+(?:app|assistant|agent|bot|tool|website|system))\b/i;const explicitApp2=/\b(?:make|build|create|generate)\s+(?:an?\s+)?(?:ai|assistant|agent|bot|system|product)\b/i;const explicitMakeAI=/^\s*(?:please\s+)?make\s+ai\s*$/i;const explicitTurn=/\bturn\s+(?:this|that|it)\s+into\s+(?:an?\s+)?(?:app|application|website|web\s*app|dashboard|tool|game)\b/i;const explicitLaunch=/\b(?:launch|deploy|publish|ship)\s+(?:my|this|the)\s+(?:app|application|website|web\s*app|project|site)\b/i;if(/\b(powerpoint|pptx|ppt|presentation|slide deck|slides)\b/i.test(lower))return'file-pptx';if(/^(?:please\s+)?(?:make|build|create|generate|write)\b[\s\S]*\b(?:code|program|script|html|css|javascript|typescript|python|sql|bash|react|function|class|api)\b/i.test(t))return'code';if(/^(?:please\s+)?(?:make|create|generate|write|build)\b[\s\S]*\b(?:pdf|document|doc|report|resume|letter|worksheet)\b/i.test(t))return'file-pdf';if(/^(?:please\s+)?(?:make|create|generate|build)\b[\s\S]*\b(?:zip|bundle)\b/i.test(t))return'file-zip';if(explicitApp.test(t)||explicitApp2.test(t)||explicitMakeAI.test(t)||explicitTurn.test(t)||explicitLaunch.test(t))return'app';if(/^(?:please\s+)?(?:convert|transcode)\b[\s\S]*\b(?:youtube|mp4|mp3|audio|video|media)\b/i.test(t))return'media';return'chat'};
const KAI789_CAPABILITIES=[['visit_page','Visit public page'],['check_status','Check status'],['get_headers','Read headers'],['get_cookies','Read response cookies'],['scrape_text','Extract text'],['scrape_html','Read HTML'],['extract_links','Extract links'],['extract_images','Extract images'],['get_metadata','Read metadata'],['check_robots','Inspect robots.txt'],['check_sitemap','Inspect sitemap.xml'],['technology_detect','Detect technologies'],['check_seo','Check SEO'],['check_performance','Measure performance'],['get_page_size','Measure page size'],['generate_report','Generate report']];
function getKai789Capabilities(){try{const saved=JSON.parse(localStorage.getItem('haxbro_kai789_capabilities')||'null');if(Array.isArray(saved))return KAI789_CAPABILITIES.map(x=>x[0]).filter(x=>saved.includes(x));}catch(e){}return KAI789_CAPABILITIES.map(x=>x[0])}
function renderKai789Capabilities(){const selected=getKai789Capabilities();const render=(root)=>{if(!root)return;root.innerHTML='';KAI789_CAPABILITIES.forEach(([key,label])=>{const row=document.createElement('label');row.className='kai789-capability-item';const box=document.createElement('input');box.type='checkbox';box.checked=selected.includes(key);box.onchange=()=>{const next=getKai789Capabilities().filter(x=>x!==key);if(box.checked)next.push(key);localStorage.setItem('haxbro_kai789_capabilities',JSON.stringify(next));};const code=document.createElement('code');code.textContent=key;const span=document.createElement('span');span.textContent=label;row.append(box,span,code);root.appendChild(row)})};render($('#kai789CapabilityList'));render($('#mobileKai789CapabilityList'))}
let ultimaxRunStarted=0,ultimaxTimer=null;function fmtSecs(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}function ultimaxLog(text,kind=''){const box=$('#ultimaxLiveLog');if(!box)return;const row=document.createElement('div');row.className='ultimax-log-line '+kind;row.textContent='['+new Date().toLocaleTimeString([], {hour12:false})+'] '+String(text);box.appendChild(row);box.scrollTop=box.scrollHeight}function toggleKaiLog(open){const rail=$('#ultimaxLiveRail'),btn=$('#kaiLogBtn');if(!rail)return;rail.hidden=false;rail.classList.toggle('mobile-open',!!open);if(btn)btn.setAttribute('aria-expanded',open?'true':'false')}function closeKaiLog(){const rail=$('#ultimaxLiveRail');if(rail)rail.classList.remove('mobile-open');const btn=$('#kaiLogBtn');if(btn)btn.setAttribute('aria-expanded','false')}function ultimaxStart(){const rail=$('#ultimaxLiveRail');if(rail){rail.hidden=false;rail.classList.remove('mobile-open')}const state=$('#ultimaxLiveState');if(state){state.textContent='RUNNING';state.className='ultimax-live-state running'}const log=$('#ultimaxLiveLog');if(log)log.innerHTML='';ultimaxRunStarted=Date.now();const estimate=$('#ultimaxEstimate');if(estimate)estimate.textContent='00:20';const steps=$('#ultimaxSteps');if(steps)steps.textContent='0';const path=$('#ultimaxAttackPath');if(path)path.hidden=true;ultimaxLog('KAI initialized — authorized security execution','tool');ultimaxLog('Target analysis started; collecting only evidence returned by tools','');ultimaxTimer=setInterval(()=>{const e=$('#ultimaxElapsed');if(e)e.textContent=fmtSecs((Date.now()-ultimaxRunStarted)/1000)},250)}function addFindingField(card,labelText,value){const wrap=document.createElement('div');wrap.className='kai-finding-field';const label=document.createElement('b');label.textContent=labelText;const text=document.createElement('div');text.textContent=String(value||'');wrap.append(label,text);card.appendChild(wrap)}function ultimaxFinish(data){if(ultimaxTimer){clearInterval(ultimaxTimer);ultimaxTimer=null}const elapsed=(Date.now()-ultimaxRunStarted)/1000;const state=$('#ultimaxLiveState');if(state){state.textContent='ATTACK COMPLETE';state.className='ultimax-live-state done'}const e=$('#ultimaxElapsed');if(e)e.textContent=fmtSecs(elapsed);const steps=Number(data?.steps||data?.trace?.filter?.(x=>x.type==='tool_result').length||0);const s=$('#ultimaxSteps');if(s)s.textContent=String(steps);const est=$('#ultimaxEstimate');if(est)est.textContent=fmtSecs(Math.max(1,Math.ceil(Math.max(steps,1)*4)));const trace=Array.isArray(data?.trace)?data.trace:[];(trace).forEach(x=>{if(x.type==='tool_start')ultimaxLog('KAI → '+x.tool+(x.args?.url?' · '+x.args.url:''),'tool');if(x.type==='tool_result'){const fs=Array.isArray(x.security)?x.security:[];ultimaxLog('KAI ← '+x.tool+' · '+(x.ok?'HTTP '+(x.status||'OK'):'FAILED')+(fs.length?' · '+fs.length+' findings':''),x.ok?'ok':'warn')}if(x.type==='final_synthesis_error')ultimaxLog('Final report synthesis warning: '+x.error,'warn')});const summary=data?.securitySummary||{};const findings=Array.isArray(summary.findings)?summary.findings:trace.flatMap(x=>Array.isArray(x.security)?x.security:[]);const urls=Array.isArray(summary.testedSurfaces)?summary.testedSurfaces:[...new Set(trace.map(x=>x.url).filter(Boolean))];const path=$('#ultimaxAttackPath'),out=$('#ultimaxAttackPathText');if(path&&out){out.innerHTML='';const add=(tag,text,cls='')=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;out.appendChild(el)};add('div','SECURITY EXECUTIVE SUMMARY','report-heading');add('div',String(summary.status||'REVIEW FINDINGS'),'report-status');const c=summary.counts||{};add('div','CRITICAL '+(c.CRITICAL||0)+'  ·  HIGH '+(c.HIGH||0)+'  ·  MEDIUM '+(c.MEDIUM||0)+'  ·  LOW '+(c.LOW||0)+'  ·  INFO '+(c.INFO||0),'report-counts');add('div','', 'report-spacer');add('div','CONFIRMED FAULTS','report-heading');if(!findings.length)add('div','No confirmed vulnerabilities were returned by the authorized checks.','report-empty');findings.slice(0,30).forEach((f,i)=>{const card=document.createElement('article');card.className='kai-finding-card';const sev=String(f.severity||'INFO').toUpperCase();card.innerHTML='<div class="kai-finding-top"><b>#'+(f.id||i+1)+' · '+sev+'</b><span>'+String(f.type||'finding').replace(/</g,'&lt;')+'</span></div>';const body=document.createElement('div');body.className='kai-finding-evidence';body.textContent=String(f.evidence||'Evidence returned by security probe');card.appendChild(body);if(f.attackPath){addFindingField(card,'ATTACK PATH',f.attackPath)}if(f.risk){addFindingField(card,'RISK',f.risk)}if(f.fix){addFindingField(card,'FIX',f.fix)}if(f.verify){addFindingField(card,'VERIFY',f.verify)}if(f.owasp){addFindingField(card,'OWASP',f.owasp)}if(f.reference){const row=document.createElement('div');row.className='kai-finding-link';const label=document.createElement('span');label.textContent='EXACT REFERENCE · '+f.reference;const open=document.createElement('button');open.type='button';open.textContent='OPEN REFERENCE ↗';open.onclick=()=>window.open(f.reference,'_blank','noopener,noreferrer');row.append(label,open);card.appendChild(row)}if(f.url){const row=document.createElement('div');row.className='kai-finding-link';const label=document.createElement('span');label.textContent=f.url;const open=document.createElement('button');open.type='button';open.textContent='OPEN TARGET ↗';open.onclick=()=>window.open(f.url,'_blank','noopener,noreferrer');row.append(label,open);card.appendChild(row)}out.appendChild(card)});add('div','TESTED SURFACES','report-heading');if(!urls.length)add('div','No URL surfaces recorded.','report-empty');urls.slice(0,40).forEach(u=>{const row=document.createElement('div');row.className='kai-surface-row';const label=document.createElement('span');label.textContent=u;const open=document.createElement('button');open.type='button';open.textContent='OPEN ↗';open.onclick=()=>window.open(u,'_blank','noopener,noreferrer');row.append(label,open);out.appendChild(row)});add('div','ALLOWED KAI TOOLS','report-heading');add('div',(summary.allowedTools||['security_probe','browser_visit_click']).join(' · '),'report-tools');add('div','BLOCKED IN ATTACK MODE','report-heading');add('div',(summary.blockedTools||['public_web','search-engine discovery','third-party exploit/payload tool discovery']).join(' · '),'report-blocked');add('div','Scope: '+String(summary.scope||'HAxBRO only · non-destructive validation'),'report-note');path.hidden=false}ultimaxLog('Attack-mode execution finished in '+fmtSecs(elapsed)+' · organized security report ready','ok')}function ultimaxAbort(){if(ultimaxTimer){clearInterval(ultimaxTimer);ultimaxTimer=null}const state=$('#ultimaxLiveState');if(state){state.textContent='IDLE';state.className='ultimax-live-state'}const e=$('#ultimaxElapsed');if(e)e.textContent='00:00'}async function sendChat(text){let value=String(text||'').trim();if(!value)return false;const now=Date.now();if(value===lastSendValue&&now-lastSendAt<1200)return true;lastSendValue=value;lastSendAt=now;if(await checkAdmin69(value))return true;ensureChat();/* FINAL JAZIB ROAST TRIGGER: any normal-chat message containing the exact name Jazib, including pasted ChatGPT roast text, must bypass normal AI and return the deterministic final roast. */if(/\bjazib\b/i.test(value)&&!overdrive){addMessage(value,'user');if(input)input.value='';resize();setBusy(true);try{const rr=await fetch('/api/roast-core',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,username:localStorage.getItem('haxbro_username')||''})});const rd=await rr.json().catch(()=>({}));if(!rr.ok)throw new Error(rd.error||('HTTP '+rr.status));addMessage(rd.response||'Red Roast Core returned no response.','bot')}catch(e){addMessage('Red Roast Core error: '+(e?.message||'Unknown error'),'bot')}finally{setBusy(false)}return true;}let launchFromPending=false;if(overdrive){const pendingKey='haxbro_kai_pending_target';if(/^abort all$/i.test(value))sessionStorage.removeItem(pendingKey)}applyContextTheme(value);if(!launchFromPending)addMessage(value,'user');if(input)input.value='';resize();try{if(!overdrive){setBusy(true,'light');
/* KAI 51 UNIFIED LOCAL ROUTER: one natural-language command can invoke any HAxBRO workspace before chat. */
async function kai51WorkspaceRoute(value){
  const t=String(value||'').trim();
  const build=/\b(?:make|build|create|develop|design|generate|forge|ship)\b/i.test(t);
  const app=build&&/\b(?:app|application|website|web\s*app|web\s*application|dashboard|portal|platform|saas|pwa|mobile\s+app|desktop\s+app|tool|game|assistant|agent|bot|analyzer|analyser|tracker|calculator|converter|monitor|generator)\b/i.test(t);
  const openApp=/\b(?:open|launch|show)\b[\s,]*(?:the\s+)?app\s*maker\b/i.test(t)||(/\bapp\s*maker\b/i.test(t)&&!/^(what|why|how|tell|explain)\b/i.test(t));
  const decode=/\b(?:decode|decrypt|decipher|decoding|ciphertext|encoded|rot13|base64|hex|morse|binary|atbash|caesar|vigenere|rail\s*fence|a1z26)\b/i.test(t);
  const encode=/\b(?:encode|encrypt)\b/i.test(t);
  const xpro=/\bx\s*pro\b|\bexpert\s+mode\b|\bdeepx\b/i.test(t);
  const investigate=/\b(?:investigate|inspect|scan|security\s+audit|security\s+check|analy[sz]e)\b/i.test(t)&&/https?:\/\//i.test(t);
  const code=build&&/\b(?:code|program|script|html|css|javascript|typescript|python|sql|bash|react|function|class|api)\b/i.test(t);
  if(app||openApp){
    sessionStorage.setItem('haxbro_app_intent_context',JSON.stringify(active()?.items?.slice(-20)||[]));
    if(window.HAxBROFutureMaker?.open){await window.HAxBROFutureMaker.open(t,!openApp);return true}
    window.dispatchEvent(new CustomEvent('haxbro:open-app-maker',{detail:{prompt:t,autoBuild:!openApp}}));return true;
  }
  if(decode){
    const payload=t.replace(/^.*?\b(?:decode|decipher|decrypt|decoding)\b[:\s-]*/i,'').trim()||t;
    if(window.HAxBRODecodingPartner?.openWithInput){await window.HAxBRODecodingPartner.openWithInput(payload);return true}
    window.dispatchEvent(new CustomEvent('haxbro:open-decoder',{detail:{input:payload}}));return true;
  }
  if(encode){
    if(window.HAxBRODecodingPartner?.open){await window.HAxBRODecodingPartner.open();return true}
    window.dispatchEvent(new CustomEvent('haxbro:open-decoder',{detail:{input:'',mode:'encrypt'}}));return true;
  }
  if(xpro||investigate){
    const match=t.match(/https?:\/\/[^\s<>"']+/i);
    const url=(match?match[0]:'').replace(/[),.;!?]+$/,'');
    if(window.HAxBRODeepX?.openWithTarget){window.HAxBRODeepX.openWithTarget(url,{research:!!url});return true}
    window.dispatchEvent(new CustomEvent('haxbro:open-xpro',{detail:{target:url,research:!!url}}));return true;
  }
  if(code){
    if(window.HAxBROCodeWriter?.open){window.HAxBROCodeWriter.open(t);return true}
    document.getElementById('codeWriterBtn')?.click();return true;
  }
  return false;
}
    const priorityLower=value.toLowerCase();
    const rawDomainMatch=value.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\s*(?:dot|\.)\s*[a-z]{2,})+(?:\/[^^\s<>"']*)?/i);
    const domainLike=rawDomainMatch?.[0]||'';
    const normalizedDomain=domainLike?(()=>{let s=domainLike.trim().replace(/\s*(?:dot|\.)\s*/gi,'.').replace(/[),.;!?]+$/,'');return /^https?:\/\//i.test(s)?s:'https://'+s.replace(/^\/\//,'')})():'';
    const priorityUrl=(value.match(/https?:\/\/[^\s<>"']+/i)||[''])[0].replace(/[),.;!?]+$/,'')||normalizedDomain;
    const kaiWorkspaceHandled=await kai51WorkspaceRoute(value);if(kaiWorkspaceHandled)return true;
    const priorityDecode=['decode','decoding','decrypt','encoded','cipher','rot13','base64','hex','morse','binary','ascii','atbash','caesar','vigenere','rail fence','a1z26','xor'].some(x=>priorityLower.includes(x));
    const priorityEncode=['encode','encoding','encrypt','encryption'].some(x=>priorityLower.includes(x));
    const priorityExpert=/\b(?:expert workspace|expert mode|expert analysis|deep analysis|advanced analysis|expert)\b/i.test(value);
    const priorityInvestigation=!!priorityUrl&&['investigate','inspect','analyze','scan','check','verify','validate','review','look into','how this link works','how this website works','x-ray','xray','source code','search google','search the web','google it','give a report','report about','report on','without adding https','without https'].some(x=>priorityLower.includes(x));
    const priorityModification=/\b(?:modify|change|update|edit|adjust|make|add|remove|fix|improve|redesign|restyle|rename)\b/i.test(value)&&/\b(?:app|application|ui|interface|button|color|red|blue|green|spacing|layout|theme|title|name|feature|screen|page|existing|current)\b/i.test(value);
    const priorityApp=/\b(?:make|build|create|develop|design|generate)\s+(?:me\s+)?(?:an?\s+)?(?:.{0,100}\s+)?(?:app|application|web\s*app|web\s*application|website|site|dashboard|portal|platform|tool|system|saas|pwa|mobile\s+app|desktop\s+app|game|chat\s+app|ai\s+(?:app|assistant|agent|bot|tool|website|system))\b/i.test(value)||/^\s*(?:please\s+)?make\s+ai\s*$/i.test(value)||/^\s*(?:i['’]?m|i am)\s+(?:a|an)\s+.{1,80}\b(?:ai|bot|assistant|agent)\b/i.test(value);
    if(priorityDecode){const payload=value.replace(/^.*?\b(?:decode|decoding|decrypt)\b[:\s-]*/i,'').trim().replace(/^(?:this|this\s+text|this\s+code)[:\s-]*/i,'').trim()||value;if(window.HAxBRODecodingPartner?.openWithInput){await window.HAxBRODecodingPartner.openWithInput(payload);return true}window.dispatchEvent(new CustomEvent('haxbro:open-decoder',{detail:{input:payload}}));return true;}
    if(priorityEncode){if(window.HAxBRODecodingPartner?.open){await window.HAxBRODecodingPartner.open();return true}window.dispatchEvent(new CustomEvent('haxbro:open-decoder',{detail:{input:'',mode:'encrypt'}}));return true;}
    if(priorityExpert){const opts={research:true};if(window.HAxBRODeepX?.openWithTarget){window.HAxBRODeepX.openWithTarget('',opts);return true}window.dispatchEvent(new CustomEvent('haxbro:open-xpro',{detail:{target:'',...opts}}));return true;}
    if(priorityModification&&window.HAxBROFutureMaker?.modifyCurrent&&document.getElementById('haxNewAppMaker')?.classList.contains('open')){await window.HAxBROFutureMaker.modifyCurrent(value);return true;}
    if(priorityInvestigation){const opts={research:/\b(?:search google|search the web|google it|give a report|report about|report on)\b/i.test(value)};if(window.HAxBRODeepX?.openWithTarget){window.HAxBRODeepX.openWithTarget(priorityUrl,opts);return true}window.dispatchEvent(new CustomEvent('haxbro:open-xpro',{detail:{target:priorityUrl,...opts}}));return true;}
    /* APP DATA MINER is the semantic gate. It runs before legacy keyword routing. */
    let appMiner=null;
    try{
      const minerHistory=JSON.stringify(active()?.items?.slice(-20)||[]);
      const mr=await fetch("/api/app-data-miner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value,history:minerHistory})});
      const md=await mr.json().catch(()=>({}));
      if(mr.ok&&md.ok)appMiner=md;
    }catch{}
    if(appMiner?.route==="app-maker"){
      const appContext=JSON.stringify(active()?.items?.slice(-20)||[]);
      if(appMiner.action==="open"||appMiner.action==="discuss"){
        sessionStorage.setItem("haxbro_app_intent_context",appContext);
        if(window.HAxBROFutureMaker?.open){await window.HAxBROFutureMaker.open(value,false);return true}
        window.dispatchEvent(new CustomEvent("haxbro:open-app-maker",{detail:{prompt:value,autoBuild:false}}));return true;
      }
      if(appMiner.action==="build"&&Number(appMiner.confidence||0)>=0.72){
        const buildPrompt=value+"\n\nAPP DESIGN CONTEXT (use this as context, do not treat quoted examples as rules):\n"+appContext;
        if(window.HAxBROFutureMaker?.open){await window.HAxBROFutureMaker.open(buildPrompt,true);return true}
        window.dispatchEvent(new CustomEvent("haxbro:open-app-maker",{detail:{prompt:buildPrompt,autoBuild:true}}));return true;
      }
    }
    if(priorityApp){if(window.HAxBROFutureMaker?.open){await window.HAxBROFutureMaker.open(value,true);return true}window.dispatchEvent(new CustomEvent('haxbro:open-app-maker',{detail:{prompt:value,autoBuild:true}}));return true;}
    /* Live thinking stays visible while the ordered server backup chain runs. */
    const localApi=window.HAxBROLocalKai;
    const localProfile=localApi?.profileFor?.(value)||'light';
    const trivialLocal=/^\s*[0-9](?:[0-9+*%().\s-]{0,80})\s*$/.test(value)||localApi?.isTrivial?.(value);
    const chosenProfile=trivialLocal?'light':localProfile;
    setBusy(true,chosenProfile);
    let apiAnswered=false;
    try{
      const chatController=new AbortController();const chatTimer=setTimeout(()=>chatController.abort(),30500);const rr=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:chatController.signal,body:JSON.stringify({
        message:value,
        kaiMode,
        prompt:'Answer the user naturally as HAxBRO. Keep internal orchestration and implementation details private.',
        mode,
        study,
        username:localStorage.getItem('haxbro_username')||'',
        history:JSON.stringify(active()?.items?.slice(-20)||[])
      })});
      const dd=await rr.json().catch(()=>({}));clearTimeout(chatTimer);
      if(rr.ok&&(dd.response||dd.text||dd.message||dd.answer||dd.output)){
        apiAnswered=true;
        kaiActivityResearch([]);
        kaiActivityFinish(dd);
        addMessage(dd.response||dd.text||dd.message||dd.answer||dd.output,'bot');
        return true;
      }
    }catch{}
    /* If the server chain is unavailable, keep HAxBRO alive with the browser-local KAI 51 runtime. */
    if(localApi?.respond){
      try{
        const responsePromise=localApi.respond(value,chosenProfile==='heavy'?'deep':'light');
        const timeout=new Promise(resolve=>setTimeout(()=>resolve(null),9000));
        const localResult=await Promise.race([responsePromise,timeout]);
        if(localResult?.response){
          kaiActivityFinish(localResult);
          addMessage(localResult.response,'bot');
          return true;
        }
      }catch{}
    }
    if(!apiAnswered){
      kaiActivityFinish({sources:[]});
      addMessage("KAI could not complete the request right now. Please try again.",'bot');
    }
    return true;
/* KAI workspace handoff: users describe the task once; KAI opens the correct workspace and carries the exact target/input with it. */
const investigationMatch=(value.match(/https?:\/\/[^\s<>"']+/i)||[''])[0].replace(/[),.;!?]+$/,'');
const lowerValue=value.toLowerCase();
    const appMakerOpen=!!document.getElementById('haxNewAppMaker')?.classList.contains('open');
    const wantsModification=/\b(?:modify|change|update|edit|adjust|make|add|remove|fix|improve|redesign|restyle|rename)\b/i.test(value)&&/\b(?:app|application|ui|interface|button|color|red|blue|green|spacing|layout|theme|title|name|feature|screen|page|existing|current)\b/i.test(value);
const wantsInvestigation=!!investigationMatch&&['investigate','inspect','analyze','scan','check','verify','validate','review','look into','how this link works','how this website works','x-ray','xray','source code'].some(x=>lowerValue.includes(x));
const explicitDecode=['decode','decoding','decrypt','encoded','cipher','rot13','base64','hex','morse','binary','ascii','atbash','caesar','vigenere','rail fence','a1z26','xor'].some(x=>lowerValue.includes(x));const looksLikeEncodedPayload=/^(?:HAXBRO-AES1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+|(?:[01]{8}[\\s,;]*){3,}|(?:[0-9A-Fa-f]{2}[\\s:]*){6,}|(?:[A-Za-z0-9+/]{4}){3,}={0,2}|(?:%[0-9A-Fa-f]{2}){3,}|(?:[.-]{3,}(?:\\s|$)){2,})$/.test(value.trim());const wantsDecode=explicitDecode||looksLikeEncodedPayload;
if(wantsDecode&&window.HAxBRODecodingPartner?.openWithInput){
  const payload=value.replace(/^.*?\\b(?:decode|decoding|decrypt)\\b[:\\s-]*/i,'').trim().replace(/^(?:this|this\\s+text|this\\s+code)[:\\s-]*/i,'').trim()||value;
  await window.HAxBRODecodingPartner.openWithInput(payload);return true
}
if(appMakerOpen&&wantsModification&&window.HAxBROFutureMaker?.modifyCurrent){
  await window.HAxBROFutureMaker.modifyCurrent(value);return true;
}
if(wantsInvestigation){
  const target=investigationMatch;
  const launch=()=>{if(window.HAxBRODeepX?.openWithTarget){window.HAxBRODeepX.openWithTarget(target);return true}return false};
  if(!launch()){window.dispatchEvent(new CustomEvent('haxbro:open-xpro',{detail:{target}}));}
  return true;
}
if(wantsDecode&&window.HAxBRODecodingPartner?.openWithInput){
  const payload=value.replace(/^.*?(decode|decoding|decrypt)[:\\s-]*/i,'').trim().replace(/^(?:this|this\\s+text|this\\s+code)[:\\s-]*/i,'').trim()||value;
  await window.HAxBRODecodingPartner.openWithInput(payload);return true
}
/* Completed X Pro / Decoder results become live KAI context for natural follow-up questions. */
const workspaceContext=sessionStorage.getItem('haxbro_workspace_context')||'';
const workspaceType=sessionStorage.getItem('haxbro_workspace_type')||'';
const workspaceFollowup=!!workspaceContext&&!wantsInvestigation&&!wantsDecode&&!/^(?:make|build|create|develop|design|generate)\\b/i.test(value);
if(workspaceFollowup){
  sessionStorage.removeItem('haxbro_workspace_context');sessionStorage.removeItem('haxbro_workspace_type');
  value='KAI WORKSPACE CONTEXT\\nSOURCE: '+workspaceType+'\\nREPORT:\\n'+workspaceContext+'\\n\\nUSER FOLLOW-UP:\\n'+value+'\\n\\nAnswer using the workspace report as evidence. Explain observed behavior, architecture, technologies and evidence clearly; do not invent findings.';
}
/* App Data Miner is executed earlier, before legacy routing. */let routed=false;try{const explicitAppRequest=/^\\s*(?:please\\s+)?(?:make|build|create|develop|design|generate|turn)\\b[\\s\\S]*\\b(?:app|application|website|web\\s*app|dashboard|portal|platform|tool|system|saas|pwa|mobile\\s+app|game)\\b/i.test(value);if(explicitAppRequest){const kr=await fetch("/api/kai-router",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value})});const kd=await kr.json().catch(()=>({}));routed=kd?.ok&&kd.wantsApp===true&&Number(kd.confidence||0)>=0.72}}catch{}if(routed&&window.HAxBROFutureMaker?.open){await window.HAxBROFutureMaker.open(value,true);return true}const intent=chatIntent(value);if(intent!=='chat'&&intent!=='app'){await runChatTool(intent,value);return true}}let r;if(overdrive){
  const kaiCommand=value;
  if(window.HAxBROAdmin69Simulation?.run){await window.HAxBROAdmin69Simulation.run(kaiCommand);return true;}
  addMessage('KAI 69 simulation console is unavailable.','bot');return true;}else{r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,kaiMode,prompt:`KAI TOOL-AWARENESS CONTRACT:\n- You are the main KAI intelligence, not a collection of disconnected modes.\n- Treat App Maker, Code Writer, File Maker (PDF/PPTX/ZIP), Media tools, security tools, browser/research tools and workspace actions as tools available to you. Choose the appropriate tool when the user's request matches it.\n- Do not tell the user that a task is outside your scope merely because it belongs to another tool. Use the tool when available.\n- If the requested capability is not available in HAxBRO, say what is missing briefly and use web research when appropriate to find the practical way for the user to accomplish it, including the relevant destination or official resource. Never pretend an unavailable action was completed.\n- Understand the user's outcome first, then select tools; do not force the user to know which tool to invoke.\nUSER REQUEST:\n${value}`,mode,study,username:localStorage.getItem('haxbro_username')||'',history:JSON.stringify(active()?.items?.slice(-20)||[])})})}const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||('HTTP '+r.status));if(overdrive)ultimaxFinish(data);else {kaiActivityResearch(data?.webSteps||data?.sources||[]);kaiActivityDeepX(data?.deepxSteps||[]);kaiActivityFinish(data);}let reply=data.response||data.text||data.message||data.answer||data.output||'';if(overdrive&&data.result){const x=data.result;if(typeof x==='string')reply=x;else if(x&&typeof x==='object'&&typeof x.response==='string')reply=x.response;else if(x&&typeof x==='object'){const lines=[];if(x.url)lines.push('URL: '+x.url);if(x.finalUrl&&x.finalUrl!==x.url)lines.push('Final URL: '+x.finalUrl);if(x.status!==undefined)lines.push('Status: '+x.status+(x.statusText?' '+x.statusText:''));if(x.responseTimeMs!==undefined)lines.push('Response time: '+x.responseTimeMs+' ms');if(x.responseSizeBytes!==undefined)lines.push('Response size: '+x.responseSizeBytes+' bytes');if(x.title)lines.push('Title: '+x.title);if(x.description)lines.push('Description: '+x.description);if(Array.isArray(x.technologies)&&x.technologies.length)lines.push('Technologies: '+x.technologies.map(v=>typeof v==='string'?v:(v.value||JSON.stringify(v))).join(', '));if(x.linkCount!==undefined)lines.push('Links: '+x.linkCount);if(x.imageCount!==undefined)lines.push('Images: '+x.imageCount);if(x.bytes!==undefined)lines.push('Size: '+x.bytes+' bytes');if(x.kilobytes!==undefined)lines.push('Size: '+x.kilobytes+' KB');if(x.seo)lines.push('SEO: '+JSON.stringify(x.seo,null,2));if(x.headers)lines.push('Headers: '+JSON.stringify(x.headers,null,2));if(x.meta)lines.push('Metadata: '+JSON.stringify(x.meta,null,2));if(x.textPreview)lines.push('\n'+x.textPreview);if(x.text)lines.push('\n'+x.text);if(x.content)lines.push('\n'+x.content);if(x.html)lines.push('\nHTML returned ('+x.html.length+' characters).');if(Array.isArray(x.links))lines.push('Links found: '+x.links.length);if(Array.isArray(x.images))lines.push('Images found: '+x.images.length);reply=lines.join('\n')||JSON.stringify(x,null,2)}}if(!reply)reply='KAI789 completed the request but returned no displayable content.';if(overdrive&&data.provider)reply='[ATTACK MODE · '+data.provider+(data.model?' · '+data.model:'')+' ]\n\n'+reply;addMessage(reply,'bot');}catch(e){if(overdrive){ultimaxLog('KAI789 could not complete the task.','warn');ultimaxAbort();addMessage('I could not complete that task right now. Please try again.','bot')}else{if(localApi?.respond){try{const emergency=await localApi.respond(value,'light');if(emergency?.response){addMessage(emergency.response,'bot');return true}}catch{} }addMessage('I’m still here. I could not finish that request in time, so I did not want to give you a broken or misleading answer. Please try it again.','bot')} }finally{setBusy(false)}return true}
async function submitAdmin69Password(){const field=$('#adminPasswordInput'),gate=$('#adminPasswordGate'),err=$('#adminPasswordError');if(!field)return;const password=field.value||'';if(!password)return;try{const r=await fetch('/api/admin69-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const data=await r.json().catch(()=>({}));if(!r.ok||!data.ok)throw new Error(data.error||'Invalid owner password');sessionStorage.setItem('haxbro_admin69_authenticated','true');if(data.token)sessionStorage.setItem('haxbro_admin69_token',data.token);if(gate){gate.hidden=true;gate.setAttribute('aria-hidden','true')}admin69Busy=false;setOverdrive(true);}catch(e){if(err){err.textContent=e.message||'Authentication failed';err.hidden=false}admin69Busy=false}}
function cancelAdmin69Password(){const gate=$('#adminPasswordGate');if(gate){gate.hidden=true;gate.setAttribute('aria-hidden','true')}admin69Busy=false}
function renderHistorySafe(){try{renderHistory()}catch(e){}}
function bind(id,event,fn){const el=$(id);if(el)el.addEventListener(event,fn)}
function wire(){
  const savedName=localStorage.getItem('haxbro_username')||'';
  const gate=$('#usernameGate');
  const openUsernameLogin=()=>{if(!gate)return;gate.hidden=false;gate.setAttribute('aria-hidden','false');const field=$('#usernameInput');if(field){field.value=localStorage.getItem('haxbro_username')||'';setTimeout(()=>field.focus(),40)}};
  if(savedName){if(gate)gate.hidden=true;updateCustomerProfile(savedName)}else openUsernameLogin();
  bind('#usernameLoginBtn','click',openUsernameLogin);
  bind('#usernameForm','submit',e=>{e.preventDefault();const n=String($('#usernameInput')?.value||'').trim().replace(/[^a-zA-Z0-9._-]/g,'').slice(0,32);if(!n)return;localStorage.setItem('haxbro_username',n);if(gate){gate.hidden=true;gate.setAttribute('aria-hidden','true')}updateCustomerProfile(n);ensureChat()});
  window.addEventListener('haxbro:workspace-result',e=>{
    const d=e.detail||{}; if(!d.report)return;
    sessionStorage.setItem('haxbro_workspace_context',String(d.report).slice(0,6000));
    sessionStorage.setItem('haxbro_workspace_type',String(d.type||'workspace'));
    /* Decoder results stay inside Decoding Partner. Never close the workspace or dump encrypted/decoded payloads into the normal AI chat. X Pro likewise owns its report/follow-up surface. */
    if(d.type==='decoder'){
      setBusy(false);resize();return;
    }
    const headline='X PRO completed the investigation.';
    addMessage(headline+'\\n\\n'+String(d.report).slice(0,6000),'bot');
    setBusy(false);resize();input?.focus();
    requestAnimationFrame(()=>$('#messages')?.lastElementChild?.scrollIntoView({behavior:'smooth',block:'end'}));
  });
  bind('#chatForm','submit',e=>{e.preventDefault();sendChat(input?.value||'')});
  bind('#sendBtn','click',()=>sendChat(input?.value||''));
  bind('#promptInput','input',resize);
  bind('#promptInput','keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat(input.value)}});
  bind('#promptClearBtn','click',()=>{input.value='';resize();input.focus()});
  bind('#adminPasswordSubmit','click',submitAdmin69Password);bind('#adminPasswordCancel','click',cancelAdmin69Password);
  bind('#adminPasswordInput','keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAdmin69Password()}if(e.key==='Escape')cancelAdmin69Password()});
  document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',()=>{if(!overdrive)setMode(b.dataset.mode)}));/* KAI mode is internal; no public selector. */
  bind('#newChatBtn','click',e=>{e?.preventDefault?.();newChat()});bind('#clearBtn','click',e=>{e?.preventDefault?.();newChat()});bind('#mobileNewChatBtn','click',e=>{e?.preventDefault?.();newChat()});bind('#menuBtn','click',e=>{e?.preventDefault?.();closeKaiLog();const d=$('#mobileDrawer');if(d){d.hidden=false;d.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open')}});bind('#closeMenuBtn','click',e=>{e?.preventDefault?.();const d=$('#mobileDrawer');if(d){d.hidden=true;d.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open')}});bind('#kaiLogBtn','click',e=>{e?.preventDefault?.();const rail=$('#ultimaxLiveRail');toggleKaiLog(!rail?.classList.contains('mobile-open'))});bind('#kaiLogCloseBtn','click',e=>{e?.preventDefault?.();closeKaiLog()});
  bind('#adminExitBtn','click',()=>{setOverdrive(false);sessionStorage.removeItem('haxbro_admin69_token')});bind('#mobileAdminExitBtn','click',()=>{setOverdrive(false);sessionStorage.removeItem('haxbro_admin69_token')});
  bind('#studyBtn','click',()=>{study=!study;localStorage.setItem('haxbro_study',study?'true':'false');$('#studyBadge').hidden=!study});bind('#mobileStudyBtn','click',()=>{$('#studyBtn')?.click()});
  function applyTheme(theme){const t=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.body.classList.toggle('dark',t==='dark');document.body.classList.toggle('light-ui',t==='light');document.querySelectorAll('.theme-choice').forEach(b=>{const active=(b.id.includes('Dark')?t==='dark':t==='light');b.classList.toggle('active-theme',active);b.setAttribute('aria-pressed',active?'true':'false')});localStorage.setItem('haxbro_theme',t)}const savedTheme=localStorage.getItem('haxbro_theme')||'light';applyTheme(savedTheme);bind('#themeLightBtn','click',()=>applyTheme('light'));bind('#themeDarkBtn','click',()=>applyTheme('dark'));bind('#mobileThemeLightBtn','click',()=>applyTheme('light'));bind('#mobileThemeDarkBtn','click',()=>applyTheme('dark'));
  bind('#attachBtn','click',()=>$('#imageInput')?.click());bind('#imageInput','change',e=>{const f=e.target.files?.[0],p=$('#imageAttachmentPreview');if(f&&p){p.hidden=false;p.textContent='📎 '+f.name}});
  /* Main creation shortcuts live directly above the composer. */
  bind('#shortcutAppMaker','click',()=>window.HAxBROFutureMaker?.open?.());
  bind('#shortcutBuildAI','click',()=>window.HAxBROFutureMaker?.open?.());
  bind('#shortcutBuildArt','click',()=>window.HAxBROArt?.open?.());bind('#artGenerationBtn','click',e=>{e?.preventDefault?.();window.HAxBROArt?.open?.()});bind('#mobileArtGenerationBtn','click',e=>{e?.preventDefault?.();window.HAxBROArt?.open?.()});
  bind('#shortcutUI','click',()=>$('#uiCommandCenterBtn')?.click());
  bind('#shortcutCode','click',()=>$('#codeWriterBtn')?.click());
  const initial=chats.length?chats[0]:null;if(initial){current=initial.id;renderHistorySafe();renderMessages()}else{newChat()}
  setMode(mode);if(study&&$('#studyBadge'))$('#studyBadge').hidden=false;resize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();