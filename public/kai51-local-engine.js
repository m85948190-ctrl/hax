export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  const MODEL = 'HuggingFaceTB/SmolLM2-360M-Instruct';
  const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
  let generator = null;
  let loading = null;
  let device = 'wasm';

  const progress = (p,status='loading local KAI 51') => {
    const raw = typeof p === 'number' ? p : Number(p?.progress ?? 0);
    onProgress({progress:Math.max(0,Math.min(99,Math.round(raw))),status,file:p?.file||''});
  };

  async function prepare() {
    if (generator) return {ok:true,model:MODEL,device};
    if (loading) return loading;

    loading = (async()=>{
      progress(3,'restoring KAI 51 local runtime');
      const {pipeline,env} = await import(CDN);

      // Browser Cache is the persistent model store. Keep it enabled so a
      // previously downloaded model is reused instead of fetched again.
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;
      env.cacheKey = 'haxbro-kai51-v1';

      try {
        if (navigator.storage?.persist) await navigator.storage.persist();
      } catch {}

      let useWebGPU = !!navigator.gpu;
      if (useWebGPU) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          useWebGPU = !!adapter;
        } catch { useWebGPU = false; }
      }

      device = useWebGPU ? 'webgpu' : 'wasm';
      progress(8,device==='webgpu'?'restoring KAI 51 on WebGPU':'restoring KAI 51 on WASM');

      const options = {
        device,
        dtype: device==='webgpu' ? 'q4f16' : 'q4',
        progress_callback: p => {
          const loaded = Number(p?.progress);
          if (Number.isFinite(loaded)) progress(10 + loaded*0.88,'loading/restoring KAI 51 model');
        }
      };

      generator = await pipeline('text-generation',MODEL,options);

      progress(99,'verifying KAI 51 local intelligence');
      const test = await generator('KAI 51 READY',{max_new_tokens:8});
      const text = extract(test).trim();
      if (!text) throw new Error('Local model self-test returned no text');

      onProgress({progress:100,status:'KAI 51 installed and verified',file:''});
      onReady({model:MODEL,device,verified:true});
      return {ok:true,model:MODEL,device};
    })().catch(e=>{
      onProgress({progress:99,status:'KAI 51 verification failed — retry required',file:''});
      loading=null;
      throw e;
    });

    return loading;
  }

  function extract(result) {
    try {
      const item = Array.isArray(result) ? result[0] : result;
      const generated = item?.generated_text;
      if (Array.isArray(generated)) {
        const last = generated[generated.length-1];
        return String(last?.content ?? last ?? '');
      }
      if (typeof generated === 'string') return generated;
      return String(item?.text ?? item?.content ?? '');
    } catch { return ''; }
  }

  async function generate(message,history=[]) {
    await prepare();
    const prompt=String(message||'').trim();
    const recent = Array.isArray(history) ? history.slice(-6).map(x=>({
      role:x?.who==='user'?'user':'assistant',
      content:String(x?.text||'').slice(0,1800)
    })) : [];
    recent.push({role:'user',content:prompt.slice(0,5000)});

    // Conversation must feel immediate. Reserve long generation for real work.
    const casual=/^(hi|hello|hey|yo|sup|what'?s up|what|who are you|good morning|good evening|good night|thanks|thank you|ok|okay|cool|nice|great)([.!?\s]|$)/i.test(prompt);
    const complex=prompt.length>500 || /\b(code|build|debug|research|analy[sz]e|compare|investigate|write|design|app|project|security|cyber|explain in detail)\b/i.test(prompt);
    const max_new_tokens=casual?48:(complex?192:96);

    const result = await generator(recent,{
      max_new_tokens,
      temperature:0.65,
      do_sample:true,
      return_full_text:false
    });
    const text = extract(result).trim();
    if (!text) throw new Error('KAI 51 local generation returned no text');
    return {response:text,provider:'KAI 51 LOCAL',model:MODEL,local:true,device};
  }

  return {
    model:MODEL,
    prepare,
    generate,
    chat:generate,
    isReady:()=>!!generator,
    status:()=>({ready:!!generator,model:MODEL,device,externalChatProviders:false})
  };
}