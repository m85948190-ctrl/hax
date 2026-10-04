export async function createKai51Engine({onProgress=()=>{},onReady=()=>{}}={}) {
  const MODEL = 'HAxBRO/KAI-51-FIRST-PARTY';
  const LOCAL_CORE = '/kai51-runtime/first-party-core.js';
  const MODEL_CACHE = 'haxbro-kai51-first-party-v2';
  let generator = null;
  let loading = null;
  let device = 'browser-first-party';

  const progress = (p,status='loading local KAI 51') => {
    const raw = typeof p === 'number' ? p : Number(p?.progress ?? 0);
    onProgress({progress:Math.max(0,Math.min(100,Math.round(raw))),status,file:p?.file||''});
  };

  async function prepare() {
    if (generator) return {ok:true,model:MODEL,device,firstParty:true};
    if (loading) return loading;
    loading = (async()=>{
      progress(25,'loading HAxBRO first-party KAI 51');
      const mod = await import(LOCAL_CORE + '?v=52');
      const core = mod?.kai51 || (mod?.KAI51 ? new mod.KAI51() : null);
      if (!core?.run) throw new Error('HAxBRO local KAI 51 core could not be loaded');
      generator = core;
      progress(90,'verifying KAI 51 local core');
      const probe = await generator.run('KAI 51 runtime self-test');
      if (!probe?.ok || !String(probe?.answer||'').trim()) {
        generator = null;
        throw new Error('KAI 51 local core self-test returned no answer');
      }
      progress(100,'KAI 51 first-party runtime ready');
      onReady({model:MODEL,device,verified:true,firstParty:true,localCore:true});
      return {ok:true,model:MODEL,device,firstParty:true,localCore:true};
    })().catch(e=>{
      generator=null;
      loading=null;
      onProgress({progress:99,status:'KAI 51 first-party runtime failed',error:String(e?.message||e)});
      throw e;
    });
    return loading;
  }

  async function generate(message,history=[],voiceContext=null) {
    await prepare();
    const prompt=String(message||'').trim();
    if(!prompt) throw new Error('KAI 51 received an empty request');
    try {
      const result = await generator.run(prompt);
      const text = String(result?.answer || '').trim();
      if (!text) throw new Error('KAI 51 local core returned no answer');
      return {response:text,provider:'KAI 51 FIRST-PARTY',model:MODEL,local:true,device,firstParty:true,localCore:true,plan:result?.plan||null};
    } catch(firstError) {
      // One local-only recovery attempt. Never switch providers here.
      try {
        generator = null;
        await prepare();
        const result = await generator.run(prompt);
        const text = String(result?.answer || '').trim();
        if (!text) throw new Error('KAI 51 local recovery returned no answer');
        return {response:text,provider:'KAI 51 FIRST-PARTY',model:MODEL,local:true,device,firstParty:true,localCore:true,recovered:true,plan:result?.plan||null};
      } catch(recoveryError) {
        const first=String(firstError?.message||firstError);
        const second=String(recoveryError?.message||recoveryError);
        throw new Error('KAI 51 local runtime failed: '+first+' | recovery: '+second);
      }
    }
  }

  return {model:MODEL,prepare,generate,chat:generate,isReady:()=>!!generator,status:()=>({ready:!!generator,model:MODEL,device,externalChatProviders:false,firstParty:true,localCore:true,cache:MODEL_CACHE})};
}