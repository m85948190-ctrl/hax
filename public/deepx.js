(()=>{const $=id=>document.getElementById(id);const state={busy:false};const permissions={level:"ELEVATED NON-DESTRUCTIVE",allowed:["READ PUBLIC WEB","ANALYZE INPUT","EXTRACT EVIDENCE","RUN DEFENSIVE SIMULATIONS","SAVE DIAGNOSTIC REPORTS"],blocked:["DELETE","MODIFY REMOTE SYSTEMS","DESTRUCTIVE EXECUTION"]};
function ensure(){if($("deepxPanel"))return $("deepxPanel");const p=document.createElement("section");p.id="deepxPanel";p.innerHTML=`
<div class="dx-bg"><div class="dx-grid"></div><div class="dx-scan"></div><div class="dx-particles"></div></div>
<div class="dx-shell"><header class="dx-top"><div class="dx-brand"><div class="dx-reactor"><i></i><i></i><i></i><b>DX</b></div><div><strong>X PRO</strong><small>HAxBRO INTELLIGENCE · KAI 51</small></div></div><div class="dx-top-right"><span class="dx-live"><i></i>KAI 51 LOCAL CORE</span><span class="dx-access">ELEVATED · NON-DESTRUCTIVE</span><button id="deepxClose" class="dx-close">×</button></div></header>
<aside id="dxSideRail" class="dx-side-rail"><div class="dx-side-head"><span>X PRO // TELEMETRY</span><button id="dxSideClose">×</button></div><div class="dx-side-status"><i></i><b id="dxSideState">LIVE</b><small>KAI 51 · LOCAL CORE</small></div><div id="dxSideLog" class="dx-side-log"><div><i></i>Waiting for investigation…</div></div><div class="dx-side-divider"></div><div class="dx-side-note">X PRO · INVESTIGATION ONLY<br><small>DECODING PARTNER is a separate HAxBRO workspace.</small></div></aside><main class="dx-main"><div class="dx-command"><div><span class="dx-kicker">AUTONOMOUS INTELLIGENCE WORKSPACE</span><h1>Investigate anything public.</h1><p>Paste a public URL, code, text, log, encoded value, or source material. X Pro automatically chooses the right analysis path and returns one structured evidence report.</p></div><div class="dx-core"><span></span><b>K51</b><small>CORE ONLINE</small></div></div>
<section class="dx-target-card"><div class="dx-target-head"><div><b>TARGET</b><span>AUTO ANALYSIS · NO MACHINE SELECTION</span></div><span id="dxRunState">READY</span></div><div class="dx-input-wrap"><textarea id="deepxInput" placeholder="Paste a public URL or investigation target…&#10;&#10;Example: https://example.com"></textarea><div class="dx-input-glow"></div></div><div class="dx-actions"><input id="deepxFile" placeholder="Label / filename (optional)"><button id="deepxRun"><span class="dx-btn-pulse"></span>INVESTIGATE WITH X PRO <b>↗</b></button></div></section>
<section id="deepxProgress" class="dx-progress" hidden><div class="dx-progress-head"><div><span>KAI 51 → DEEPX</span><b id="dxProgressTitle">INITIALIZING INVESTIGATION</b></div><span id="dxProgressPct">0%</span></div><div class="dx-progress-track"><i id="dxProgressBar"></i></div><div id="dxLiveLog" class="dx-live-log"></div></section>
<section id="deepxResults" class="dx-results"><div class="dx-empty"><div class="dx-empty-orb">DX</div><b>X PRO STANDBY</b><span>One target in. One structured report out.</span></div></section>
<section id="dxFollowup" class="dx-followup" hidden>
<div class="dx-followup-head"><span>X PRO · CONTINUE INVESTIGATION</span><small>Ask about the report without leaving X PRO</small></div>
<form id="dxFollowupForm" class="dx-followup-form">
<textarea id="dxFollowupInput" rows="1" placeholder="Ask X Pro a follow-up question about this investigation…"></textarea>
<button id="dxFollowupSend" type="submit">SEND <b>↗</b></button>
</form>
<div id="dxFollowupStatus" class="dx-followup-status">X PRO is ready for follow-up questions.</div>
</section>
<div class="dx-foot"><span>READ · ANALYZE · MAP · VERIFY</span><span>DESTRUCTIVE ACTIONS BLOCKED</span><span>LOCAL KAI 51 CORE</span></div></main></div>`;
document.body.appendChild(p);
$("deepxClose").onclick=()=>p.style.display="none";
$("dxFollowupForm").onsubmit=followup;
$("dxFollowupInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("dxFollowupForm").requestSubmit()}});
$("dxSideClose").onclick=()=>p.classList.remove("dx-rail-open");$("deepxRun").onclick=run;setInterval(()=>{if(p.style.display!=="none"){const c=$("dxClock");if(c)c.textContent=new Date().toLocaleTimeString([], {hour12:false})}},1000);return p}
function log(text,kind=""){const box=$("dxLiveLog");const side=$("dxSideLog");if(box){const r=document.createElement("div");r.className="dx-log "+kind;r.innerHTML='<i></i><span>'+esc(text)+'</span>';box.appendChild(r);box.scrollTop=box.scrollHeight}if(side){const r=document.createElement("div");r.className="dx-side-line "+kind;r.innerHTML='<i></i><span>'+esc(text)+'</span>';side.appendChild(r);side.scrollTop=side.scrollHeight}}
function progress(title,pct){const t=$("dxProgressTitle"),n=$("dxProgressPct"),b=$("dxProgressBar");if(t)t.textContent=title;if(n)n.textContent=pct+"%";if(b)b.style.width=pct+"%"}
async function run(){ensure();if(state.busy)return;const raw=$("deepxInput").value.trim(),filename=$("deepxFile").value.trim(),out=$("deepxResults");if(!raw){out.innerHTML='<div class="dx-empty"><b>NO TARGET</b><span>Paste a public URL or investigation material.</span></div>';return}state.busy=true;$("dxRunState").textContent="RUNNING";$("deepxProgress").hidden=false;$("dxLiveLog").innerHTML="";out.innerHTML="";
const isUrl=/^https?:\/\/[^\s]+$/i.test(raw),steps=isUrl?["KAI 51 received investigation request","Sending signal to X Pro","Opening public target","Reading response headers and HTML source","Extracting scripts, links, metadata and technology","Checking public security and exposure signals","Correlating evidence","Building structured report"]:["KAI 51 received analysis request","Sending signal to DEEPX","Normalizing target","Running automatic X-Ray and decoder checks","Extracting evidence and risk signals","Correlating findings","Building structured report"];
try{for(let i=0;i<steps.length;i++){log(steps[i],i===1?"handoff":i===steps.length-1?"final":"");progress(steps[i].toUpperCase(),Math.round((i/steps.length)*85));await new Promise(r=>setTimeout(r,isUrl?190:110))}
const r=await fetch("/api/deepx",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"auto",input:isUrl?"":raw,url:isUrl?raw:"",filename})}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||"DEEPX failed");progress("REPORT COMPLETE",100);log("X Pro returned verified analysis payload","ok");render(d.result,d.mode,isUrl?raw:"");$("dxRunState").textContent="COMPLETE"}catch(e){log("Investigation failed: "+(e.message||"Unknown error"),"error");out.innerHTML='<article class="dx-report-card error"><h3>X PRO CORE ERROR</h3><p>'+esc(e.message)+'</p></article>';$("dxRunState").textContent="ERROR"}finally{state.busy=false}}
function field(label,value,wide=false){if(value===undefined||value===null||value==="")return"";let v=Array.isArray(value)?value.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join("\n"):typeof value==="object"?JSON.stringify(value,null,2):String(value);return '<div class="dx-field '+(wide?"wide":"")+'"><b>'+esc(label)+'</b><pre>'+esc(v)+'</pre></div>'}
function render(r,mode,target){const out=$("deepxResults"),blocks=[];
const follow=$("dxFollowup");if(follow)follow.hidden=false;
window.__HAxBRO_XPRO_REPORT=JSON.stringify({mode,target,result:r});
blocks.push('<div class="dx-report-head"><div><span>X PRO EVIDENCE REPORT</span><h2>'+esc(mode==="webmap"?"PUBLIC TARGET INTELLIGENCE":"AUTOMATIC ANALYSIS")+'</h2><small>'+esc(target||"LOCAL INPUT")+'</small></div><div class="dx-report-state"><i></i>ANALYSIS COMPLETE</div></div>');
if(r.target||r.httpStatus!==undefined)blocks.push('<article class="dx-report-card hero-report"><h3>01 · TARGET & RESPONSE</h3>'+field("FINAL URL",r.target)+field("HTTP STATUS",r.httpStatus)+field("CONTENT TYPE",r.headers?.contentType)+field("SERVER",r.headers?.server)+field("RESPONSE SIZE",r.responseSizeBytes? r.responseSizeBytes+" bytes":null)+'</article>');
if(r.pageXray)blocks.push('<article class="dx-report-card"><h3>02 · SOURCE X-RAY</h3>'+field("STRUCTURE",r.pageXray.layers)+field("PUBLIC URLS",r.pageXray.urls,true)+field("KEY-LIKE FIELDS",r.pageXray.keys,true)+field("SOURCE PREVIEW",r.pageXray.preview,true)+'</article>');
if(r.sourceCode?.rawHtml)blocks.push('<article class="dx-report-card source-card"><h3>03 · FULL PUBLIC SOURCE CODE</h3>'+field("SOURCE SIZE",r.sourceCode.rawHtml.length+" chars")+field("HTML / SOURCE",r.sourceCode.rawHtml,true)+'</article>');
if(r.secretFindings?.length)blocks.push('<article class="dx-report-card secret-card"><h3>04 · SECRET / CREDENTIAL EXPOSURE</h3>'+field("FINDINGS",r.secretFindings,true)+'<p class="dx-safe-note">Detected secret-like material is intentionally redacted. DEEPX identifies the type and location without exposing usable credentials.</p></article>');
if(r.sourceCode)blocks.push('<article class="dx-report-card"><h3>03 · SOURCE CODE MAP</h3>'+field("INLINE SCRIPTS",r.sourceCode.inlineScripts,true)+field("EXTERNAL SCRIPTS",r.sourceCode.externalScripts,true)+field("FORMS",r.sourceCode.forms,true)+field("META",r.sourceCode.meta,true)+'</article>');
if(r.technologies)blocks.push('<article class="dx-report-card"><h3>04 · TECHNOLOGY & RESOURCES</h3>'+field("TECHNOLOGIES",r.technologies,true)+field("PUBLIC LINKS",r.publicLinks,true)+field("SCRIPTS",r.scripts,true)+'</article>');
if(r.securitySignals||r.exposure)blocks.push('<article class="dx-report-card"><h3>05 · EXPOSURE SIGNALS</h3>'+field("SECURITY SIGNALS",r.securitySignals,true)+field("EXPOSURE",r.exposure,true)+'</article>');
if(r.layers)blocks.push('<article class="dx-report-card"><h3>STRUCTURE</h3>'+field("LAYERS",r.layers,true)+'</article>');
if(r.codeSignals)blocks.push('<article class="dx-report-card"><h3>CODE SIGNALS</h3>'+field("FINDINGS",r.codeSignals.findings,true)+field("IMPORTS",r.codeSignals.imports,true)+'</article>');
if(r.primary||r.candidates)blocks.push('<article class="dx-report-card"><h3>DECODING · AUTO-DETECTED</h3>'+field("PRIMARY",r.primary)+field("CANDIDATES",r.candidates,true)+'</article>');
if(r.architecture)blocks.push('<article class="dx-report-card"><h3>REVERSE ARCHITECTURE</h3>'+field("MODEL",r.targetModel)+field("RECONSTRUCTION",r.reconstruction,true)+'</article>');
if(r.artifact)blocks.push('<article class="dx-report-card"><h3>FORENSIC ARTIFACT</h3>'+field("ARTIFACT",r.artifact)+field("INDICATORS",r.indicators,true)+'</article>');
if(r.attackPath)blocks.push('<article class="dx-report-card"><h3>DEFENSIVE THREAT MAP</h3>'+field("SCOPE",r.scope)+field("ATTACK SURFACES",r.attackPath,true)+'</article>');
blocks.push('<div class="dx-report-footer"><span>PERMISSION · '+esc(permissions.level)+'</span><span>NO DELETE / NO REMOTE MODIFICATION</span><span>KAI 51 LOCAL CORE</span></div>');out.innerHTML=blocks.join("");out.scrollIntoView({behavior:"smooth",block:"start"})}
async function followup(e){
e?.preventDefault();
const q=$("dxFollowupInput")?.value.trim(); if(!q)return;
const status=$("dxFollowupStatus"), btn=$("dxFollowupSend"), box=$("dxFollowupInput");
const report=window.__HAxBRO_XPRO_REPORT||"";
if(btn)btn.disabled=true;if(status)status.textContent="X PRO · KAI 51 is analyzing the follow-up…";
try{
 const rr=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,prompt:"X PRO FOLLOW-UP MODE. Use ONLY the completed X Pro investigation report below as evidence. Explain observed behavior, architecture, technologies, and evidence clearly. Do not invent findings. If the report does not contain the answer, say so.\n\nREPORT:\n"+report+"\n\nFOLLOW-UP:\n"+q,mode:"normal",study:false,username:localStorage.getItem("haxbro_username")||"",history:"[]"})});
 const d=await rr.json().catch(()=>({})); if(!rr.ok)throw Error(d.error||("HTTP "+rr.status));
 const answer=d.response||d.text||d.message||d.answer||d.output||"No answer returned.";
 const card=document.createElement("article");card.className="dx-report-card dx-followup-answer";card.innerHTML="<h3>KAI 51 · FOLLOW-UP</h3><div class=\"dx-followup-question\"></div><div class=\"dx-followup-answer-text\"></div>";
 card.querySelector(".dx-followup-question").textContent=q;card.querySelector(".dx-followup-answer-text").textContent=answer;
 $("deepxResults")?.appendChild(card);card.scrollIntoView({behavior:"smooth",block:"center"});
 box.value="";if(status)status.textContent="X PRO · FOLLOW-UP COMPLETE";
}catch(err){if(status)status.textContent="X PRO · "+(err.message||"Follow-up failed");}
finally{if(btn)btn.disabled=false;box?.focus()}
}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
async function openDecoder(){const input=window.prompt("DECODING PARTNER · paste encoded text");if(!input)return;log("DECODING PARTNER activated","handoff");try{const rr=await fetch("/api/deepx",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"decode",input})}),dd=await rr.json();if(!rr.ok||!dd.ok)throw Error(dd.error||"Decoder failed");render(dd.result,"decode","DECODING PARTNER INPUT");log("25-method decoding report returned","ok");}catch(e){log("Decoder error: "+e.message,"error")}}
function open(target=""){
const p=ensure();p.style.display="block";p.scrollTop=0;
document.body.classList.add("xpro-open");
setTimeout(()=>{$("deepxInput")?.focus();},40);if(target){const field=$("deepxInput");if(field){field.value=target;setTimeout(()=>run(),60)}}}
function bind(){["deepxBtn","mobileDeepxBtn","deepxWorkspaceBtn"].forEach(id=>$(id)?.addEventListener("click",e=>{e.preventDefault();open()}))}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();window.HAxBRODeepX={open,openWithTarget:open};
window.addEventListener("haxbro:open-xpro",e=>open(String(e.detail?.target||"")));})();