export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  const MODEL = 'haxbro-ai-model';
  const MODEL_HOST = 'https://github.com/m85948190-ctrl/haxbro/releases/download/kai51-model-latest';
  const MODEL_CACHE = 'haxbro-kai51-v5';
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
      env.cacheKey = MODEL_CACHE;
      env.remoteHost = MODEL_HOST;
      env.remotePathTemplate = '{file}';
      env.fetch = (input,init)=>{
        const raw = typeof input === 'string' ? input : (input && input.url) || String(input);
        if (raw.startsWith(MODEL_HOST + '/')) {
          const file = raw.slice(raw.lastIndexOf(MODEL_HOST + '/') + (MODEL_HOST + '/').length).replace(/^haxbro-ai-model\//,'').replace(/^onnx\//,'');
          return fetch(MODEL_HOST + '/' + file, init);
        }
        return fetch(input,init);
      };
      try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch {}
      let useWebGPU = !!navigator.gpu;
      if (useWebGPU) {
        try { useWebGPU = !!(await navigator.gpu.requestAdapter()); } catch { useWebGPU = false; }
      }

      const makeOptions = (targetDevice) => ({
        device: targetDevice,
        dtype: targetDevice==='webgpu' ? 'q4f16' : 'q4',
        progress_callback: p => {
          const loaded = Number(p?.progress);
          if (Number.isFinite(loaded)) progress(10 + loaded*0.88,'loading/restoring KAI 51 model');
        }
      });

      // WebGPU can be exposed by the browser while its driver still rejects
      // the quantized ONNX graph during session creation. Retry the exact same
      // model on the stable WASM/q4 runtime instead of leaving the user at 99%.
      if (useWebGPU) {
        try {
          device = 'webgpu';
          progress(8,'restoring KAI 51 on WebGPU');
          generator = await pipeline('text-generation',MODEL,makeOptions('webgpu'));
        } catch (webgpuError) {
          generator = null;
          device = 'wasm';
          progress(8,'WebGPU initialization failed · switching to stable WASM runtime');
          generator = await pipeline('text-generation',MODEL,makeOptions('wasm'));
        }
      } else {
        device = 'wasm';
        progress(8,'restoring KAI 51 on WASM');
        generator = await pipeline('text-generation',MODEL,makeOptions('wasm'));
      }
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