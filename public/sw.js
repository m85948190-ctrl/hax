const CACHE='haxbro-shell-v24';
const ASSETS=['/','/index.html','/app/','/app/index.html','/style.css','/ui-fixes.css','/responsive-fixes.css','/script.js?v=357','/work-canvas.js','/work-canvas.css','/install.js','/site.webmanifest','/favicon.svg','/icon-192.svg','/icon-512.svg','/kai51-local.js?v=13','/kai51-local-engine.js?v=34','/kai-local-model.js?v=6','/kai-local-ui.js?v=3','/kai-lite.js?v=3','/kai51-boot-stamp.js?v=9','/decoding-partner.js?v=2','/encryptor-machine.js?v=1','/deepx.js?v=1','/pro-mode.js?v=1','/workspace-bridge.js?v=1','/kai-predictive-timer.js?v=1'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('haxbro-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=new URL(event.request.url);
  // NEVER intercept KAI 51 model transport. Transformers.js owns its persistent
  // model cache, and Range responses must not be put into the shell cache.
  if(u.pathname==='/api/kai-model')return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('/'))));
});