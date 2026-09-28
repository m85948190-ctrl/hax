window.haxbroLoadRealtime=async function(jobId,onEvent){
  if(!window.hatchable?.events){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/__hatchable/events.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});}
  if(!window.hatchable?.events)return null;
  const token=await fetch('/api/events-token?job='+encodeURIComponent(jobId)).then(r=>r.json());
  const client=window.hatchable.events.connect({token:token.token});
  const channel=client.channel('kai:'+jobId);
  channel.on('activity',ev=>onEvent(ev.data||ev));
  return client;
};