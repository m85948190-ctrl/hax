(() => {
  const canvas = document.getElementById('haxbro3d');
  if (!canvas || !window.THREE) return;

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 8.6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const root = new THREE.Group();
  scene.add(root);

  const cyan = new THREE.MeshBasicMaterial({ color: 0x19c9ff });
  const blue = new THREE.MeshBasicMaterial({ color: 0x087cff });
  const glass = new THREE.MeshBasicMaterial({ color: 0x9beeff, transparent: true, opacity: .22, wireframe: true });
  const dark = new THREE.MeshBasicMaterial({ color: 0x06111b, transparent: true, opacity: .92 });

  // Futuristic robotic head / person silhouette.
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1.72, 2), dark);
  head.scale.set(.86, 1.18, .78);
  head.position.set(1.55, .55, .05);
  root.add(head);

  // Keep the silhouette clean: the dense wireframe shell read as visual noise/glitch.
  const visor = new THREE.Mesh(new THREE.TorusGeometry(.48, .055, 10, 64, Math.PI * .92), cyan);
  visor.rotation.set(Math.PI / 2.8, -.18, .02);
  visor.position.set(1.82, .72, 1.25);
  visor.scale.set(1.5, .55, .8);
  root.add(visor);

  const faceBeam = new THREE.Mesh(new THREE.BoxGeometry(1.12, .025, .025), blue);
  faceBeam.position.set(1.78, .22, 1.27);
  faceBeam.rotation.z = -.1;
  root.add(faceBeam);

  // Neural brain floating behind the head.
  const brain = new THREE.Group();
  brain.position.set(-1.05, .18, .15);
  brain.scale.set(1.08, 1.08, 1.08);
  root.add(brain);

  const lobes = [];
  [-.42, .42].forEach((x, i) => {
    const lobe = new THREE.Mesh(new THREE.IcosahedronGeometry(.88, 2), new THREE.MeshBasicMaterial({ color: i ? 0x087cff : 0x18cfff, wireframe: true, transparent: true, opacity: .58 }));
    lobe.scale.set(.82, 1.04, .72);
    lobe.position.x = x;
    brain.add(lobe);
    lobes.push(lobe);
  });

  const nodeGroup = new THREE.Group();
  brain.add(nodeGroup);
  // A restrained neural core: fewer points, no random connecting lines.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const p = new THREE.Vector3(
      Math.cos(a) * (.42 + Math.random() * .25),
      Math.sin(a * 1.7) * (.45 + Math.random() * .25),
      Math.sin(a * 2.1) * (.28 + Math.random() * .2)
    );
    const n = new THREE.Mesh(new THREE.SphereGeometry(.022 + Math.random() * .012, 7, 7), cyan);
    n.position.copy(p);
    nodeGroup.add(n);
  }

  const rings = new THREE.Group();
  root.add(rings);
  [2.0, 2.35, 2.7].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 6, 120), new THREE.MeshBasicMaterial({ color: i === 1 ? 0x1bd7ff : 0x087cff, transparent: true, opacity: .28 }));
    ring.rotation.set(i * .42, i * .66, i * .24);
    rings.add(ring);
  });

  const stars = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ color: 0x69ddff, size: .025, transparent: true, opacity: .7 })
  );
  const starPositions = [];
  for (let i = 0; i < 500; i++) {
    starPositions.push((Math.random() - .5) * 13, (Math.random() - .5) * 6.5, (Math.random() - .5) * 4.5);
  }
  stars.geometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(stars);

  const clock = new THREE.Clock();
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  function frame() {
    const t = clock.getElapsedTime();
    root.rotation.y = Math.sin(t * .18) * .11;
    root.rotation.x = Math.sin(t * .14) * .025;
    head.rotation.y = Math.sin(t * .38) * .09;
    brain.rotation.y = -Math.sin(t * .26) * .2;
    brain.rotation.z = Math.sin(t * .18) * .035;
    lobes.forEach((lobe, i) => { lobe.rotation.y += .0015 * (i ? -1 : 1); });
    nodeGroup.rotation.y += .002;
    rings.rotation.y += .0018;
    rings.rotation.z = Math.sin(t * .12) * .12;
    stars.rotation.y = t * .003;
    camera.position.x += ((window.innerWidth < 720 ? .15 : .35) - camera.position.x) * .02;
    camera.lookAt(0, .15, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
})();