export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  /* KAI 51 is first-party: use the HAxBRO GitHub runtime as the source of truth.
     Do not download a Hugging Face model in the HAxBRO browser runtime. */
  const MODEL = 'HAxBRO/KAI-51-FIRST-PARTY';
  const GITHUB_CORE = 'https://raw.githubusercontent.com/m85948190-ctrl/haxbro/main/kai51/first-party-core.js';
  const MODEL_CACHE = 'haxbro-kai51-first-party-v1';
  const CDN = null; // retained only for backwards-compatible cache metadata; never imported.
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
      progress(15,'loading HAxBRO first-party KAI 51');
      /* This is a browser ES module from the user's own GitHub repository.
         Its relative imports (capabilities/decoder/app-maker) stay first-party
         as well. No Hugging Face, ONNX download, or provider model is involved. */
      const mod = await import(GITHUB_CORE + '?v=51.3');
      const core = mod?.kai51 || (mod?.KAI51 ? new mod.KAI51() : null);
      if (!core?.run) throw new Error('HAxBRO first-party KAI 51 core could not be loaded');
      generator = core;
      device = 'browser-first-party';
      progress(100,'KAI 51 first-party runtime ready');
      onProgress({progress:100,status:'KAI 51 first-party runtime ready',file:''});
      onReady({model:MODEL,device,verified:true,firstParty:true});
      return {ok:true,model:MODEL,device,firstParty:true};
    })().catch(e=>{
      onProgress({progress:99,status:'KAI 51 first-party runtime failed',file:''});
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

  async function generate(message,history=[],voiceContext=null) {
    await prepare();
    const prompt=String(message||'').trim();
    const recent = Array.isArray(history) ? history.slice(-3).map(x=>({
      role:x?.who==='user'?'user':'assistant',
      content:String(x?.text||'').slice(0,900)
    })) : [];
    const vc=voiceContext&&typeof voiceContext==='object'?voiceContext:null;
    if(vc&&Number(vc.db)>0){
      recent.unshift({role:'system',content:'Voice context is auxiliary and must not be mentioned unless relevant. Estimated microphone level: '+Math.round(Number(vc.db)||0)+' dB. Voice state signal: '+String(vc.label||'CALM')+'. Frustration signal: '+Math.round((Number(vc.frustration)||0)*100)+'%. Use this only to adjust tone: if elevated/high, be calmer, direct and solution-focused.'});
    }
    /* The first-party GitHub core owns routing, memory and capability execution.
       It returns immediately; there is no model compilation or token generation. */
    const result = await generator.run(prompt);
    const text = String(result?.answer || '').trim();
    if (!text) throw new Error('KAI 51 first-party core returned no answer');
    return {
      response:text,
      provider:'KAI 51 FIRST-PARTY',
      model:MODEL,
      local:true,
      device,
      firstParty:true,
      plan:result?.plan||null
    };
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