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
      progress(3,'loading browser ML runtime');
      const {pipeline,env} = await import(CDN);
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      let useWebGPU = !!navigator.gpu;
      if (useWebGPU) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          useWebGPU = !!adapter;
        } catch { useWebGPU = false; }
      }
      device = useWebGPU ? 'webgpu' : 'wasm';
      progress(8,device==='webgpu'?'initializing WebGPU local inference':'initializing WASM local inference');
      const options = {
        device,
        dtype: device==='webgpu' ? 'q4f16' : 'q4',
        progress_callback: p => {
          const loaded = Number(p?.progress);
          if (Number.isFinite(loaded)) progress(10 + loaded*0.88,'loading KAI 51 model');
        }
      };
      generator = await pipeline('text-generation',MODEL,options);
      progress(99,'verifying local KAI 51 generation');
      const test = await generator([{role:'user',content:'Reply with exactly: KAI 51 READY'}],{max_new_tokens:8});
      const text = extract(test).trim();
      if (!text) throw new Error('Local model self-test returned no text');
      onReady({model:MODEL,device,verified:true});
      return {ok:true,model:MODEL,device};
    })().catch(e=>{loading=null;throw e;});
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
    const recent = Array.isArray(history) ? history.slice(-8).map(x=>({
      role:x?.who==='user'?'user':'assistant',
      content:String(x?.text||'').slice(0,3000)
    })) : [];
    recent.push({role:'user',content:String(message||'').slice(0,6000)});
    const result = await generator(recent,{
      max_new_tokens:256,
      temperature:0.7,
      do_sample:true
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