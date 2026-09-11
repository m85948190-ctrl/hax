(()=>{
  const KEY='haxbro_marketing_counter_v1';
  const $=id=>document.getElementById(id);
  const fmt=n=>Number(n||0).toLocaleString('en-IN');
  const platformFromUrl=url=>{try{const h=new URL(url).hostname.toLowerCase();if(h.includes('youtube')||h.includes('youtu.be'))return 'YouTube';if(h.includes('instagram'))return 'Instagram';if(h.includes('tiktok'))return 'TikTok';if(h.includes('facebook')||h.includes('fb.watch'))return 'Facebook';if(h.includes('x.com')||h.includes('twitter'))return 'X';return 'Web';}catch{return 'Web'}};
  const normalize=url=>{try{const u=new URL(url.trim());u.hash='';u.hostname=u.hostname.toLowerCase();return u.toString().replace(/\/$/,'')}catch{return url.trim().toLowerCase().replace(/\/$/,'')}};
  let state={targetVideos:20,targetViews:40000,goalMonths:12,startAt:null,videos:[]};
  try{state={...state,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const panel=$('marketingCounterPanel');
  if(!panel)return;
  const AUTH_NAME='subham mondal';
  let marketingUnlocked=sessionStorage.getItem('haxbro_marketing_unlocked')==='1';
  const open=()=>{if(!marketingUnlocked){showNameGate();return}panel.hidden=false;render()};
  const close=()=>{panel.hidden=true};
  const showNameGate=()=>{const gate=$('marketingNameGate');if(gate){gate.hidden=false;$('marketingNameInput')?.focus()}};
  const hideNameGate=()=>{const gate=$('marketingNameGate');if(gate)gate.hidden=true};
  $('marketingCounterBtn')?.addEventListener('click',open);
  $('mobileMarketingCounterBtn')?.addEventListener('click',()=>{open();document.getElementById('mobileDrawer')?.classList.remove('open');document.getElementById('mobileDrawer')?.setAttribute('aria-hidden','true')});
  $('marketingNameGateClose')?.addEventListener('click',hideNameGate);
  $('marketingNameGate')?.addEventListener('click',e=>{if(e.target===$('marketingNameGate'))hideNameGate()});
  $('marketingNameGateForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('marketingNameInput'),msg=$('marketingNameGateMessage');const name=input.value.trim().toLowerCase().replace(/\\s+/g,' ');if(name===AUTH_NAME){marketingUnlocked=true;sessionStorage.setItem('haxbro_marketing_unlocked','1');hideNameGate();panel.hidden=false;render();msg.textContent=''}else{msg.textContent='Access denied. This Marketing Center is restricted.';msg.classList.add('marketing-danger');input.select()}});
  $('marketingCounterClose')?.addEventListener('click',close);
  panel.addEventListener('click',e=>{if(e.target===panel)close()});
  const ensureCampaign=()=>{if(!state.startAt)state.startAt=Date.now();save()};
  const render=()=>{
    const totalViews=state.videos.reduce((s,v)=>s+Number(v.views||0),0), count=state.videos.length;
    $('marketingVideoCount').textContent=fmt(count);
    $('marketingViewCount').textContent=fmt(totalViews);
    $('marketingTargetViews').textContent=fmt(state.targetViews);
    $('marketingTargetVideos').textContent=fmt(state.targetVideos);
    const pct=Math.min(100,Math.max(0,state.targetViews?totalViews/state.targetViews*100:0));
    $('marketingProgress').style.width=pct+'%';
    $('marketingProgressText').textContent=Math.round(pct)+'% of view target';
    updateTimer();
    const list=$('marketingVideoList');
    if(!count){list.innerHTML='<div class="marketing-empty">No videos added yet. Paste the first video link above.</div>';return}
    list.innerHTML=state.videos.map(v=>`<div class="marketing-video-row"><a class="marketing-video-link" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer" title="${esc(v.url)}">${esc(v.url)}</a><span class="marketing-platform">${esc(v.platform)}</span><span class="marketing-views">${fmt(v.views)}</span><button class="marketing-delete" data-id="${esc(v.id)}" title="Remove video" aria-label="Remove video">×</button></div>`).join('');
    list.querySelectorAll('.marketing-delete').forEach(b=>b.addEventListener('click',()=>{state.videos=state.videos.filter(v=>v.id!==b.dataset.id);save();render()}));
  };
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const addMonths=(timestamp,months)=>{const d=new Date(timestamp);const day=d.getDate();d.setMonth(d.getMonth()+months);if(d.getDate()!==day)d.setDate(0);return d.getTime()};
  const updateTimer=()=>{
    const timer=$('marketingTimer'), label=$('marketingTimerLabel');
    const months=Math.max(12,Math.min(24,Number(state.goalMonths)||12));
    if(!state.startAt){timer.textContent=`${months}mo 000d 00:00:00`;label.textContent=`${months}-month campaign not started`;return}
    const end=addMonths(state.startAt,months), left=Math.max(0,end-Date.now()), sec=Math.floor(left/1000);
    const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=sec%60;
    const elapsed=Math.max(0,Date.now()-state.startAt), year=Math.min(Math.floor(elapsed/(365.2425*24*60*60*1000))+1,months/12);
    timer.textContent=`${months}mo ${String(d).padStart(3,'0')}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    label.textContent=left>0?`${months}-month goal · Year ${year}`:`${months}-month campaign finished`;
    const goalYears=document.getElementById('marketingGoalYears');if(goalYears)goalYears.textContent=months===24?'2 years':'1 year';
  };
  setInterval(()=>{if(!panel.hidden)updateTimer()},1000);
  setInterval(()=>{if(!panel.hidden)refreshViews()},60000);
  const checkVideo=async(url)=>{
    const r=await fetch((window.__HATCHABLE__?.api||'/api')+'/marketing-validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok || !data.ok) throw new Error('verify');
    return data;
  };
  const refreshViews=async()=>{
    if(!state.videos.length)return;
    let changed=false;
    for(const v of state.videos){
      try{
        const data=await checkVideo(v.url);
        if(data.relevant && Number.isFinite(Number(data.views)) && Number(data.views)>=0 && Number(data.views)!==Number(v.views||0)){
          v.views=Number(data.views);changed=true;
        }
      }catch{}
    }
    if(changed){save();render()}
  };
  $('marketingAddVideo')?.addEventListener('click',async()=>{
    const input=$('marketingVideoUrl'), msg=$('marketingCounterMessage'), btn=$('marketingAddVideo');
    const raw=input.value.trim(), url=normalize(raw);
    msg.textContent='';msg.classList.remove('marketing-danger');
    if(!/^https?:\/\//i.test(url)){msg.textContent='Enter a valid http(s) video link.';msg.classList.add('marketing-danger');return}
    if(state.videos.some(v=>v.url===url)){msg.textContent='That video is already counted — duplicate blocked.';msg.classList.add('marketing-danger');return}
    btn.disabled=true; const old=btn.textContent; btn.textContent='Checking HAxBRO…';
    try{
      const r=await fetch((window.__HATCHABLE__?.api||'/api')+'/marketing-validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok || !data.ok){msg.textContent='Could not verify this video. Try again with a public video link.';msg.classList.add('marketing-danger');return}
      if(!data.relevant){msg.textContent='This video is not about HAxBRO, so it was not submitted or counted.';msg.classList.add('marketing-danger');return}
      if(!Number.isFinite(Number(data.views)) || Number(data.views)<0){msg.textContent='HAxBRO video verified, but its public view count could not be read automatically yet.';msg.classList.add('marketing-danger');return}
      ensureCampaign();
      state.videos.push({id:crypto.randomUUID?.()||String(Date.now()+Math.random()),url,views:Number(data.views),platform:platformFromUrl(url),addedAt:Date.now(),validated:true,title:data.title||''});
      save();input.value='';msg.textContent=`HAxBRO video verified and counted at ${fmt(data.views)} views.`;render();
    }catch(e){msg.textContent='Could not verify this video. Try again with a public video link.';msg.classList.add('marketing-danger')}
    finally{btn.disabled=false;btn.textContent=old}
  });
  $('marketingStartBtn')?.addEventListener('click',()=>{state.startAt=Date.now();save();render()});
  $('marketingResetBtn')?.addEventListener('click',()=>{if(confirm('Reset the campaign and remove all tracked videos?')){state={targetVideos:20,targetViews:40000,goalMonths:12,startAt:null,videos:[]};save();render()}});
  $('marketingGoalMonthsInput')?.addEventListener('change',e=>{state.goalMonths=Number(e.target.value)===24?24:12;save();render()});
  $('marketingTargetVideosInput')?.addEventListener('change',e=>{state.targetVideos=Math.max(1,Math.floor(Number(e.target.value)||20));save();render()});
  $('marketingTargetViewsInput')?.addEventListener('change',e=>{state.targetViews=Math.max(1,Math.floor(Number(e.target.value)||40000));save();render()});
  const tv=$('marketingTargetVideosInput'),tw=$('marketingTargetViewsInput'),gm=$('marketingGoalMonthsInput');if(tv)tv.value=state.targetVideos;if(tw)tw.value=state.targetViews;if(gm)gm.value=state.goalMonths===24?'24':'12';
  render();
})();