(() => {
  const mic=document.getElementById('micBtn');
  if(!mic)return;
  let stream=null,ctx=null,analyser=null,data=null,raf=0,recognition=null,listening=false;
  let lastTranscript='',startedAt=0,lastSpeechAt=0,speechSamples=0,dbSmooth=0,intensitySmooth=0;
  const state={db:0,voiceLevel:0,frustration:0,label:'CALM',transcript:''};
  const $=s=>document.querySelector(s);
  function hud(){
    let el=$('#kaiVoiceHud');if(el)return el;
    el=document.createElement('div');el.id='kaiVoiceHud';el.className='kai-voice-hud';
    el.innerHTML='<div class="kai-voice-top"><span class="kai-voice-label">KAI 51 · VOICE INTELLIGENCE</span><span class="kai-voice-metrics"><span>VOICE <b id="kaiVoiceDb">— dB</b></span><span id="kaiVoiceState" class="kai-voice-state">CALM</span></span></div><div id="kaiVoiceBars" class="kai-voice-bars"></div><div class="kai-voice-foot"><span id="kaiVoiceHint">Listening for voice characteristics…</span><strong id="kaiVoiceFrustration">SIGNAL · LOW</strong></div>';
    for(let i=0;i<48;i++){const b=document.createElement('i');el.querySelector('#kaiVoiceBars').appendChild(b)}
    document.body.appendChild(el);return el;
  }
  function setHud(on){hud().classList.toggle('is-live',on)}
  function classify(){
    const high=state.voiceLevel>0.62;
    const elevated=state.voiceLevel>0.46;
    const words=lastTranscript.toLowerCase();
    const lexical=/\b(why|again|broken|doesn't work|not working|wtf|damn|fuck|hell|frustrat|annoy|ridiculous|useless|stuck|come on|what the hell)\b/i.test(words);
    const urgency=/\b(quick|quickly|urgent|hurry|now|immediately|asap)\b/i.test(words);
    const score=Math.min(1,Math.max(0,intensitySmooth*.68+(lexical?.28:0)+(urgency?.08:0)));
    state.frustration=score;
    state.label=score>.72?'HIGH FRUSTRATION':score>.48?'ELEVATED':urgency&&elevated?'URGENT':high?'INTENSE': 'CALM';
  }
  function snapshot(){return {...state,estimated:true,source:'browser microphone'} }
  function render(){
    if(!listening)return;
    const h=hud(),arr=data, n=arr.length;
    let sum=0,peak=0;
    for(let i=0;i<n;i++){const x=(arr[i]-128)/128;sum+=x*x;peak=Math.max(peak,Math.abs(x))}
    const rms=Math.sqrt(sum/n);
    const rawDb=rms>0.0001?20*Math.log10(rms)+100:0;
    dbSmooth=dbSmooth?dbSmooth*.82+rawDb*.18:rawDb;
    state.db=Math.round(Math.max(30,Math.min(96,dbSmooth)));
    state.voiceLevel=Math.max(0,Math.min(1,(state.db-40)/48));
    intensitySmooth=intensitySmooth*.84+state.voiceLevel*.16;
    classify();
    const db=$('#kaiVoiceDb'),st=$('#kaiVoiceState'),fr=$('#kaiVoiceFrustration');
    if(db)db.textContent=state.db+' dB';
    if(st)st.textContent=state.label;
    if(fr)fr.textContent='FRUSTRATION SIGNAL · '+(state.frustration>.72?'HIGH':state.frustration>.48?'ELEVATED':'LOW');
    const bars=h.querySelectorAll('#kaiVoiceBars i');
    bars.forEach((b,i)=>{const v=Math.max(2,Math.min(34,(peak*34)*(0.35+Math.abs(Math.sin(i*.72+performance.now()*.006))*0.65)));b.style.height=v+'px';b.style.transform='scaleY('+(0.45+peak*1.4)+')';b.style.opacity=String(.28+Math.min(.72,peak*1.4))});
    const hint=$('#kaiVoiceHint');if(hint)hint.textContent=state.label==='HIGH FRUSTRATION'?'KAI is adapting for a calmer, more direct response.':state.label==='URGENT'?'KAI is prioritizing the immediate task.':'Listening to your voice characteristics…';
    raf=requestAnimationFrame(render);
  }
  function setupRecognition(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    recognition=new SR();recognition.lang=navigator.language||'en-US';recognition.continuous=true;recognition.interimResults=true;
    recognition.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript+' ';lastTranscript=t.trim();state.transcript=lastTranscript;lastSpeechAt=Date.now();speechSamples++};
    recognition.onerror=()=>{};
    recognition.onend=()=>{if(listening){try{recognition.start()}catch{}}};
  }
  async function start(){
    if(listening){stop();return}
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      const src=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.72;src.connect(analyser);data=new Uint8Array(analyser.fftSize);
      listening=true;startedAt=Date.now();lastTranscript='';speechSamples=0;setHud(true);setupRecognition();try{recognition?.start()}catch{};render();
      mic.classList.add('voice-active');mic.setAttribute('aria-label','Stop voice input');
    }catch(e){setHud(false);console.warn('KAI voice input unavailable',e)}
  }
  function stop(){
    listening=false;if(raf)cancelAnimationFrame(raf);raf=0;
    try{recognition?.stop()}catch{};recognition=null;
    stream?.getTracks?.().forEach(t=>t.stop());stream=null;try{ctx?.close()}catch{};ctx=null;analyser=null;data=null;
    mic.classList.remove('voice-active');mic.setAttribute('aria-label','Start voice input');
    setHud(false);
    const text=String(lastTranscript||'').trim();
    const voice=snapshot();
    window.HAxBROVoiceContext=voice;
    if(text){const input=document.getElementById('promptInput');if(input){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}}
  }
  mic.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();start()});
  window.HAxBROVoiceIntelligence={start,stop,snapshot:()=>snapshot(),isListening:()=>listening};
})();