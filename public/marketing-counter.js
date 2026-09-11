(()=>{
  const KEY='haxbro_marketing_counter_v1';
  const $=id=>document.getElementById(id);
  const fmt=n=>Number(n||0).toLocaleString('en-IN');
  const platformFromUrl=url=>{try{const h=new URL(url).hostname.toLowerCase();if(h.includes('youtube')||h.includes('youtu.be'))return 'YouTube';if(h.includes('instagram'))return 'Instagram';if(h.includes('tiktok'))return 'TikTok';if(h.includes('facebook')||h.includes('fb.watch'))return 'Facebook';if(h.includes('x.com')||h.includes('twitter'))return 'X';return 'Web';}catch{return 'Web'}};
  const normalize=url=>{try{const u=new URL(url.trim());u.hash='';u.hostname=u.hostname.toLowerCase();return u.toString().replace(/\/$/,'')}catch{return url.trim().toLowerCase().replace(/\/$/,'')}};
  let state={targetVideos:20,targetViews:40000,startAt:null,videos:[]};
  try{state={...state,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const panel=$('marketingCounterPanel');
  if(!panel)return;
  const open=()=>{panel.hidden=false;render()};
  const close=()=>{panel.hidden=true};
  $('marketingCounterBtn')?.addEventListener('click',open);
  $('mobileMarketingCounterBtn')?.addEventListener('click',()=>{open();document.getElementById('mobileDrawer')?.classList.remove('open');document.getElementById('mobileDrawer')?.setAttribute('aria-hidden','true')});
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
  const updateTimer=()=>{
    const timer=$('marketingTimer'), label=$('marketingTimerLabel');
    if(!state.startAt){timer.textContent='30d 00:00:00';label.textContent='Campaign not started';return}
    const end=state.startAt+30*24*60*60*1000, left=Math.max(0,end-Date.now()), sec=Math.floor(left/1000);
    const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=sec%60;
    timer.textContent=`${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    label.textContent=left>0?'Time remaining':'30-day campaign finished';
  };
  setInterval(()=>{if(!panel.hidden)updateTimer()},1000);
  $('marketingAddVideo')?.addEventListener('click',()=>{
    const input=$('marketingVideoUrl'), viewsInput=$('marketingVideoViews'), msg=$('marketingCounterMessage');
    const raw=input.value.trim(), url=normalize(raw), views=Math.max(0,Math.floor(Number(viewsInput.value||0)));
    msg.textContent='';msg.classList.remove('marketing-danger');
    if(!/^https?:\/\//i.test(url)){msg.textContent='Enter a valid http(s) video link.';msg.classList.add('marketing-danger');return}
    if(state.videos.some(v=>v.url===url)){msg.textContent='That video is already counted — duplicate blocked.';msg.classList.add('marketing-danger');return}
    ensureCampaign();
    state.videos.push({id:crypto.randomUUID?.()||String(Date.now()+Math.random()),url,views,platform:platformFromUrl(url),addedAt:Date.now()});
    save();input.value='';viewsInput.value='';render();
  });
  $('marketingStartBtn')?.addEventListener('click',()=>{state.startAt=Date.now();save();render()});
  $('marketingResetBtn')?.addEventListener('click',()=>{if(confirm('Reset the 30-day campaign and remove all tracked videos?')){state={targetVideos:20,targetViews:40000,startAt:null,videos:[]};save();render()}});
  $('marketingTargetVideosInput')?.addEventListener('change',e=>{state.targetVideos=Math.max(1,Math.floor(Number(e.target.value)||20));save();render()});
  $('marketingTargetViewsInput')?.addEventListener('change',e=>{state.targetViews=Math.max(1,Math.floor(Number(e.target.value)||40000));save();render()});
  const tv=$('marketingTargetVideosInput'),tw=$('marketingTargetViewsInput');if(tv)tv.value=state.targetVideos;if(tw)tw.value=state.targetViews;
  render();
})();