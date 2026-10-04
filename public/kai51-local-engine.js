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
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;
      env.cacheKey = 'haxbro-kai51-v1';
      try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch {}
      let useWebGPU = !!navigator.gpu;
      if (useWebGPU) {
        try { useWebGPU = !!(await navigator.gpu.requestAdapter()); } catch { useWebGPU = false; }
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
      onProgress({progress:100,status:'KAI 51 runtime ready',file:''});
      onReady({model:MODEL,device,verified:true});
      return {ok:true,model:MODEL,device};
    })().catch(e=>{
      onProgress({progress:99,status:'KAI 51 runtime failed — retry required',file:''});
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
    const recent = Array.isArray(history) ? history.slice(-3).map(x=>({
      role:x?.who==='user'?'user':'assistant',
      content:String(x?.text||'').slice(0,900)
    })) : [];
    recent.push({role:'user',content:prompt.slice(0,2500)});
    const result = await generator(recent,{
      max_new_tokens:64,
      temperature:0.45,
      do_sample:false,
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