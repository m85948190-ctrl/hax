(() => {
  const canvas=document.getElementById('haxbro3d'); if(!canvas||!window.THREE)return;
  const T=window.THREE, scene=new T.Scene(), camera=new T.PerspectiveCamera(34,1,.1,100); camera.position.set(0,.15,8.5);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)); renderer.outputColorSpace=T.SRGBColorSpace;
  const root=new T.Group(); scene.add(root);
  const coreMat=new T.MeshBasicMaterial({color:0x8ee8ff});
  const core=new T.Mesh(new T.IcosahedronGeometry(.72,3),new T.MeshBasicMaterial({color:0x07131b,transparent:true,opacity:.96})); root.add(core);
  const shell=new T.Mesh(new T.IcosahedronGeometry(.92,2),new T.MeshBasicMaterial({color:0x4fd7ff,wireframe:true,transparent:true,opacity:.28})); root.add(shell);
  const pulse=new T.Mesh(new T.SphereGeometry(.32,24,24),coreMat); root.add(pulse);
  const rings=new T.Group(); root.add(rings);
  [1.35,1.8,2.3,2.8].forEach((r,i)=>{const m=new T.MeshBasicMaterial({color:i%2?0x198fe0:0x62ddff,transparent:true,opacity:.2-(i*.025)});const q=new T.Mesh(new T.TorusGeometry(r,.012,6,160),m);q.rotation.set(i*.45,i*.7,i*.22);rings.add(q)});
  const nodes=new T.Group();root.add(nodes);
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=1.65+(i%4)*.28,n=new T.Mesh(new T.SphereGeometry(.025+(i%3)*.008,8,8),new T.MeshBasicMaterial({color:i%2?0x4acfff:0x8ee8ff}));n.position.set(Math.cos(a)*r,Math.sin(a*1.7)*(.7+r*.12),Math.sin(a)*r*.42);nodes.add(n)}
  const pts=[];for(let i=0;i<260;i++)pts.push((Math.random()-.5)*11,(Math.random()-.5)*6,(Math.random()-.5)*4.2);
  const stars=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0x6ccfff,size:.018,transparent:true,opacity:.4}));stars.geometry.setAttribute('position',new T.Float32BufferAttribute(pts,3));scene.add(stars);
  function resize(){const r=canvas.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()} addEventListener('resize',resize,{passive:true});resize();
  const clock=new T.Clock(); function frame(){const t=clock.getElapsedTime();root.rotation.y=Math.sin(t*.17)*.1;root.rotation.x=Math.sin(t*.11)*.035;core.rotation.y=t*.12;shell.rotation.y=-t*.1;shell.rotation.z=t*.07;pulse.scale.setScalar(1+Math.sin(t*2.4)*.1);rings.rotation.y=t*.08;rings.rotation.z=Math.sin(t*.17)*.1;nodes.rotation.y=-t*.12;stars.rotation.y=t*.002;camera.position.x+=((innerWidth<720?.12:.3)-camera.position.x)*.02;camera.lookAt(0,.1,0);renderer.render(scene,camera);requestAnimationFrame(frame)} frame();
})();