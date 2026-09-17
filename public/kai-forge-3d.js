(()=>{
  let started=false, state={phase:4};
  const $=(root,id)=>root.querySelector(id);
  async function start(root){
    if(started) return; started=true;
    const canvas=$('#kaiForge3D',root); if(!canvas) return;
    try{
      const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)); renderer.shadowMap.enabled=true;
      const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x050505,.02);
      const camera=new THREE.PerspectiveCamera(34,1,.1,100); camera.position.set(6.2,3.2,8.6); camera.lookAt(0,1.15,0);
      scene.add(new THREE.HemisphereLight(0xffffff,0x050505,1.8));
      const key=new THREE.DirectionalLight(0xffffff,4); key.position.set(4,7,5); key.castShadow=true; scene.add(key);
      const red=new THREE.PointLight(0xff263d,18,8); red.position.set(0,2,1); scene.add(red);
      const metal=new THREE.MeshStandardMaterial({color:0x9a9a9a,metalness:.9,roughness:.2});
      const dark=new THREE.MeshStandardMaterial({color:0x111111,metalness:.75,roughness:.27});
      const glow=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xff2036,emissiveIntensity:2,metalness:.4,roughness:.2});
      const enemyMat=new THREE.MeshStandardMaterial({color:0x454545,metalness:.8,roughness:.32});
      const box=(a,b,c,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),m);o.castShadow=o.receiveShadow=true;return o};
      const cyl=(r,h,m)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),m);o.castShadow=o.receiveShadow=true;return o};
      const robot=new THREE.Group(); robot.position.y=.1; scene.add(robot);
      const torso=box(1.35,1.45,.9,metal); torso.position.y=1.55; robot.add(torso);
      const chest=box(.75,.52,.96,dark); chest.position.set(0,1.65,.48); robot.add(chest);
      const core=cyl(.24,.12,glow); core.rotation.x=Math.PI/2; core.position.set(0,1.63,.58); robot.add(core);
      const head=box(1,.78,.82,dark); head.position.y=2.75; robot.add(head);
      const eye=box(.58,.13,.08,glow); eye.position.set(0,2.73,.45); robot.add(eye);
      const hip=box(1.05,.42,.7,dark); hip.position.y=.78; robot.add(hip);
      function leg(side){const g=new THREE.Group();g.position.set(side*.38,.58,0);robot.add(g);const u=box(.34,.85,.42,metal);u.position.y=-.45;g.add(u);const k=cyl(.18,.18,glow);k.rotation.z=Math.PI/2;k.position.y=-.9;g.add(k);const l=box(.38,.82,.45,dark);l.position.y=-1.3;g.add(l);const f=box(.5,.22,.85,metal);f.position.set(0,-1.76,.18);g.add(f);return g} leg(-1);leg(1);
      function arm(side){const s=new THREE.Group();s.position.set(side*1,2.08,0);robot.add(s);const u=box(.34,.9,.42,metal);u.position.y=-.42;s.add(u);const e=new THREE.Group();e.position.y=-.9;s.add(e);const j=cyl(.17,.2,glow);j.rotation.z=Math.PI/2;e.add(j);const f=box(.34,.85,.42,dark);f.position.y=-.42;e.add(f);const w=new THREE.Group();w.position.y=-.85;e.add(w);const h=box(.48,.38,.52,metal);h.position.y=-.23;w.add(h);return{s,e,w}};
      const L=arm(-1),R=arm(1);
      const hammer=new THREE.Group();hammer.position.set(1.55,1.35,.2);robot.add(hammer);const handle=box(.16,2.1,.16,metal);handle.position.y=-.72;hammer.add(handle);const headH=box(.95,.34,.46,metal);headH.position.y=.38;hammer.add(headH);
      const anvil=box(1.6,.3,1,dark);anvil.position.set(0,.02,.35);scene.add(anvil);const anvilTop=box(1.12,.16,.8,metal);anvilTop.position.set(0,.24,.35);scene.add(anvilTop);
      const foe=new THREE.Group();foe.position.set(-2.25,.12,-.15);scene.add(foe);const fb=box(.9,1.5,.7,enemyMat);fb.position.y=1.2;foe.add(fb);const fh=box(.72,.58,.6,dark);fh.position.y=2.28;foe.add(fh);const fe=box(.45,.08,.06,glow);fe.position.set(0,2.27,.33);foe.add(fe);
      [-1,1].forEach(s=>{const a=box(.28,1.15,.32,enemyMat);a.position.set(s*.72,1.2,0);a.rotation.z=s*.18;foe.add(a)});
      const floor=new THREE.Mesh(new THREE.CylinderGeometry(4.8,4.8,.16,64),new THREE.MeshStandardMaterial({color:0x080808,metalness:.7,roughness:.4}));floor.position.y=-.2;floor.receiveShadow=true;scene.add(floor);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(3.6,.025,8,96),new THREE.MeshBasicMaterial({color:0x3a3a3a}));ring.rotation.x=Math.PI/2;ring.position.y=-.1;scene.add(ring);
      const sparks=[];for(let i=0;i<22;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.035,.18,.035),glow);scene.add(s);sparks.push({m:s,v:new THREE.Vector3(),life:0})}
      function burst(){sparks.forEach(s=>{s.m.position.set((Math.random()-.5)*.75,.22+Math.random()*.25,.35+(Math.random()-.5)*.35);s.v.set((Math.random()-.5)*2,1+Math.random()*2.2,(Math.random()-.5)*1.5);s.life=.25+Math.random()*.55})}
      function resize(){const w=Math.max(280,canvas.clientWidth||420),h=Math.max(230,canvas.clientHeight||300);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()} new ResizeObserver(resize).observe(canvas); resize();
      let last=performance.now(),t=0,nextBurst=0;
      function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;t+=dt;const fight=Math.floor(t/6)%2===1;const motion=$('#kaiForgeMotion',root);if(motion)motion.textContent=fight?'COMBAT · COUNTER':'FORGE · HAMMER';
        robot.rotation.y=Math.sin(t*.35)*.12;robot.position.y=.1+Math.sin(t*1.8)*.025;
        if(fight){const hit=(Math.sin(t*5.2)+1)/2;R.s.rotation.z=-.25-1.05*hit;R.e.rotation.z=.15+1.25*hit;R.w.rotation.z=-.35-.7*hit;L.s.rotation.z=.2+.32*Math.sin(t*5.2);L.e.rotation.z=-.2+.45*Math.sin(t*5.2);hammer.rotation.z=-.2+.25*Math.sin(t*5.2);foe.position.x=-2.25+.35*Math.sin(t*2.6);foe.rotation.y=.4*Math.sin(t*2.6);if(hit>.97&&Math.floor(t*5.2)%2===0)burst()}
        else{const strike=(Math.sin(t*6.2)+1)/2;R.s.rotation.z=-.15-1.2*strike;R.e.rotation.z=.12+.75*strike;R.w.rotation.z=-.2-.5*strike;L.s.rotation.z=.15+.2*Math.sin(t*3);hammer.rotation.z=.1+1.35*strike;hammer.position.y=1.4-.28*strike;if(strike>.96&&t>nextBurst){burst();nextBurst=t+.7}}
        sparks.forEach(s=>{if(s.life>0){s.life-=dt;s.m.position.addScaledVector(s.v,dt);s.v.y-=4*dt;s.m.scale.setScalar(Math.max(.1,s.life*2))}});renderer.render(scene,camera);requestAnimationFrame(frame)}requestAnimationFrame(frame);
    }catch(e){started=false;console.warn('KAI 3D forge failed',e);root.classList.add('kai-3d-fallback')}
  }
  window.kaiStart3DForge=start; window.kaiSet3DForgePhase=(n)=>{state.phase=n};
})();