(() => {
  const mic=document.getElementById('micBtn');
  if(!mic)return;

  let stream=null,ctx=null,analyser=null,timeData=null,freqData=null,raf=0,recognition=null,listening=false;
  let lastTranscript='',lastSpeechAt=0;
  const state={transcript:'',listening:false};

  const $=s=>document.querySelector(s);

  function hud(){
    let el=$('#kaiVoiceHud');
    if(el)return el;
    el=document.createElement('div');
    el.id='kaiVoiceHud';
    el.className='kai-voice-hud';
    el.innerHTML='<div class="kai-voice-top"><span class="kai-voice-label">KAI 51 · VOICE</span><span id="kaiVoiceState" class="kai-voice-state">LISTENING</span></div><div id="kaiVoiceBars" class="kai-voice-bars" aria-hidden="true"></div><div class="kai-voice-foot"><span id="kaiVoiceHint">Speak naturally. Tap the square to stop.</span></div>';
    for(let i=0;i<36;i++){const b=document.createElement('i');el.querySelector('#kaiVoiceBars').appendChild(b);}
    document.body.appendChild(el);
    return el;
  }

  function setHud(on){
    const h=hud();
    h.classList.toggle('is-live',on);
    if(!on)h.classList.remove('is-live');
  }

  function render(){
    if(!listening||!analyser||!timeData||!freqData)return;
    analyser.getByteTimeDomainData(timeData);
    analyser.getByteFrequencyData(freqData);

    let sum=0;
    for(let i=0;i<timeData.length;i++){
      const x=(timeData[i]-128)/128;
      sum+=x*x;
    }
    const rms=Math.sqrt(sum/timeData.length);
    state.level=Math.max(0,Math.min(1,rms*4.8));

    const bars=hud().querySelectorAll('#kaiVoiceBars i');
    const bins=Math.max(1,Math.floor(freqData.length/bars.length));
    bars.forEach((b,i)=>{
      let total=0;
      const start=i*bins;
      const end=Math.min(freqData.length,start+bins);
      for(let j=start;j<end;j++)total+=freqData[j];
      const avg=end>start?total/(end-start)/255:0;
      const floor=state.level<0.018?0.04:0.08;
      const level=Math.max(floor,Math.min(1,avg*1.9+state.level*.45));
      b.style.height=Math.round(4+level*30)+'px';
      b.style.opacity=String(.35+level*.65);
    });

    const status=$('#kaiVoiceState');
    if(status)status.textContent=lastTranscript?'LISTENING':'READY';
    raf=requestAnimationFrame(render);
  }

  function setupRecognition(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    recognition=new SR();
    recognition.lang=navigator.language||'en-US';
    recognition.continuous=true;
    recognition.interimResults=true;
    recognition.onresult=e=>{
      let t='';
      for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript+' ';
      lastTranscript=t.trim();
      state.transcript=lastTranscript;
      lastSpeechAt=Date.now();
    };
    recognition.onerror=()=>{};
    recognition.onend=()=>{
      if(listening){
        try{recognition.start()}catch{}
      }
    };
  }

  async function start(){
    if(listening){stop();return;}
    try{
      stream=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
      });
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended')await ctx.resume().catch(()=>{});
      const src=ctx.createMediaStreamSource(stream);
      analyser=ctx.createAnalyser();
      analyser.fftSize=1024;
      analyser.smoothingTimeConstant=.58;
      src.connect(analyser);
      timeData=new Uint8Array(analyser.fftSize);
      freqData=new Uint8Array(analyser.frequencyBinCount);

      listening=true;
      state.listening=true;
      lastTranscript='';
      setHud(true);
      setupRecognition();
      try{recognition?.start()}catch{}
      mic.classList.add('voice-active','listening');
      mic.setAttribute('aria-label','Stop voice input');
      mic.setAttribute('title','Stop voice input');
      mic.setAttribute('aria-pressed','true');
      render();
    }catch(e){
      cleanup(false);
      console.warn('KAI voice input unavailable',e);
    }
  }

  function cleanup(saveContext=true){
    listening=false;
    state.listening=false;
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    try{recognition?.stop()}catch{}
    recognition=null;
    stream?.getTracks?.().forEach(t=>t.stop());
    stream=null;
    try{ctx?.close()}catch{}
    ctx=null;
    analyser=null;
    timeData=null;
    freqData=null;
    mic.classList.remove('voice-active','listening');
    mic.setAttribute('aria-label','Start voice input');
    mic.setAttribute('title','Start voice input');
    mic.setAttribute('aria-pressed','false');
    setHud(false);
    if(saveContext)window.HAxBROVoiceContext={...state,source:'browser microphone'};
  }

  function stop(){
    if(!listening)return;
    const text=String(lastTranscript||'').trim();
    cleanup(true);
    setTimeout(()=>{
      if(!text)return;
      const input=document.getElementById('promptInput');
      if(input){
        input.value=text;
        input.dispatchEvent(new Event('input',{bubbles:true}));
      }
      const send=window.sendChat;
      if(typeof send==='function')send(text,{voice:true});
      else document.getElementById('sendBtn')?.click();
    },180);
  }

  mic.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    listening?stop():start();
  });

  window.HAxBROVoiceIntelligence={
    start,stop,
    snapshot:()=>({...state,source:'browser microphone'}),
    isListening:()=>listening
  };
})();