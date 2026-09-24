import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/+esm';

const MODEL = 'onnx-community/SmolLM2-360M-Instruct-ONNX';
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.useFSCache = true;

const report = (p) => {
  self.postMessage({
    type: 'progress',
    progress: {
      status: String(p?.status || ''),
      name: String(p?.name || ''),
      file: String(p?.file || ''),
      progress: Number.isFinite(Number(p?.progress)) ? Number(p.progress) : undefined,
      loaded: Number.isFinite(Number(p?.loaded)) ? Number(p.loaded) : undefined,
      total: Number.isFinite(Number(p?.total)) ? Number(p.total) : undefined
    }
  });
};

let gen = null;
let device = 'wasm';
let dtype = 'q4';
const FORCE_WASM = new URL(self.location.href).searchParams.get('forceWasm') === '1';

async function load() {
  let adapter = null;
  if (!FORCE_WASM) {
    try {
      adapter = self.navigator?.gpu ? await self.navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }) : null;
    } catch (_) {}
  }

  if (adapter){
    try {
      device = 'webgpu';
      dtype = 'q4f16';
      gen = await pipeline('text-generation', MODEL, {
        dtype: 'q4f16',
        device: 'webgpu',
        progress_callback: report
      });
    } catch (_) {
      device = 'wasm';
      dtype = 'q4';
      gen = await pipeline('text-generation', MODEL, {
        dtype: 'q4',
        device: 'wasm',
        progress_callback: report
      });
    }
  } else {
    gen = await pipeline('text-generation', MODEL, {
      dtype: 'q4',
      device: 'wasm',
      progress_callback: report
    });
  }

  self.postMessage({ type: 'ready', device, dtype });
}

const readyPromise = load().catch((err) => {
  self.postMessage({ type: 'fatal', error: String(err?.stack || err?.message || err) });
  return false;
});

self.onmessage = async (event) => {
  const d = event.data || {};
  if (!d.id || !gen) return;
  await readyPromise;
  if (!gen) {
    self.postMessage({ type: 'error', id: d.id, error: 'KAI 51 local runtime is not ready.' });
    return;
  }
  try {
    const out = await gen(d.prompt, {
      max_new_tokens: d.maxTokens || 320,
      temperature: 0.25,
      do_sample: true
    });
    const text = Array.isArray(out)
      ? (out[0]?.generated_text || '')
      : String(out?.generated_text || out || '');
    self.postMessage({ type: 'result', id: d.id, text });
  } catch (err) {
    self.postMessage({ type: 'error', id: d.id, error: String(err?.message || err) });
  }
};