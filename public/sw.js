const CACHE='haxbro-shell-v39';
const ASSETS=[
  '/','/index.html','/app/','/app/index.html',
  '/style.css?v=219','/ui-fixes.css?v=218','/responsive-fixes.css?v=218',
  '/script.js?v=387','/work-canvas.js?v=13','/install.js?v=220',
  '/haxbro-cinematic-intro.css?v=3','/haxbro-onboarding.css?v=3','/haxbro-onboarding.js?v=4','/deepx.js?v=2','/onboarding-kai.png','/onboarding-appmaker.png','/onboarding-creation.png','/onboarding-ecosystem.jpg',
  '/kai-image-worker.js?v=3','/kai51-local.js?v=59','/kai51-local-engine.js?v=72','/kai-local-intelligence.js?v=26',
  '/kai-lite.js?v=4','/kai51-largest-engine.js?v=14','/kai51-largest-worker.js?v=9','/kai-local-model.js?v=6','/kai-local-ui.js?v=9','/kai51-runtime-indicator.js?v=5',
  '/decoding-partner.js?v=3','/encryptor-machine.js?v=1','/deepx.js?v=2','/pro-mode.js?v=1',
  '/workspace-bridge.js?v=1','/kai-predictive-timer.js?v=1','/site.webmanifest?v=744',
  '/logo-symbol.svg?v=753','/terms.html','/privacy.html'
];
const isSameOriginStatic=request=>{
  if(request.method!=='GET'||request.headers.has('range'))return false;
  const u=new URL(request.url);
  if(u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return false;
  if(u.pathname==='/kai51-model-sw.js')return false;
  return true;
};
const isDocument=request=>request.mode==='navigate'||request.destination==='document';
async function cacheResponse(request,response){
  if(response&&response.ok&&response.type!=='opaque'){
    try{const cache=await caches.open(CACHE);await cache.put(request,response.clone())}catch{}
  }
  return response;
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Cache core files independently: one optional missing asset must not break PWA installation.
    await Promise.allSettled(ASSETS.map(async path=>{
      const request=new Request(new URL(path,self.location.origin).toString(),{cache:'reload',credentials:'same-origin'});
      const response=await fetch(request);
      if(response.ok&&response.type!=='opaque')await cache.put(request,response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('haxbro-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(!isSameOriginStatic(request))return;
  const url=new URL(request.url);
  // Keep dynamic app APIs and model transport online; Transformers.js owns persistent model caching.
  if(url.pathname.startsWith('/api/'))return;
  if(isDocument(request)){
    event.respondWith((async()=>{
      try{return await cacheResponse(request,await fetch(request))}catch(error){
        const cached=await caches.match(request);
        if(cached)return cached;
        const fallback=await caches.match(url.pathname.startsWith('/app')?'/app/':'/');
        if(fallback)return fallback;
        throw error;
      }
    })());
    return;
  }
  // Cache-first for same-origin static assets. Versioned asset URLs change when the app updates,
  // so returning visitors reuse the exact files already downloaded to their own browser.
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    return cacheResponse(request,await fetch(request));
  })());
});