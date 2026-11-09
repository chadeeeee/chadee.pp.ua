import * as THREE from "three";

// Ashima / Stefan Gustavson 3D simplex noise (MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export type SceneState = {
  blobX: number;
  blobY: number;
  blobScale: number;
  camZ: number;
  hue: number;
  spin: number;
  warp: number;
};

export function createScene(canvas: HTMLCanvasElement, opts: { mobile: boolean; reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.mobile, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x06060a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06060a, 0.045);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(0, 0, 7);

  const state: SceneState = { blobX: 1.6, blobY: 0.1, blobScale: 1, camZ: 7, hue: 0, spin: 0, warp: 0 };
  const mouse = new THREE.Vector2();
  const mouseTarget = new THREE.Vector2();
  let velocity = 0;

  // ── Iridescent liquid blob ──────────────────────────────────────
  const blobUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uWarp: { value: 0 },
    uHue: { value: 0 },
  };
  const blobMat = new THREE.ShaderMaterial({
    uniforms: blobUniforms,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform vec2 uMouse; uniform float uWarp;
      varying vec3 vView; varying float vDisp; varying vec3 vWorld;
      ${NOISE}
      void main(){
        vec3 p = position;
        float t = uTime * 0.35;
        float n = snoise(p * 0.9 + vec3(t, t * 0.6, -t * 0.4));
        float n2 = snoise(p * 2.4 + vec3(-t * 1.3, t, uMouse.x)) * 0.35;
        float d = (n + n2) * (0.28 + uWarp * 0.5) + dot(normalize(p).xy, uMouse) * 0.18;
        vDisp = d;
        p += normal * d;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vView = mv.xyz;
        vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uHue;
      varying vec3 vView; varying float vDisp; varying vec3 vWorld;
      vec3 pal(float t){ return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + vec3(0.0, 0.33, 0.67))); }
      void main(){
        vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
        vec3 v = normalize(-vView);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 2.2);
        float t = fres * 0.9 + vDisp * 1.6 + uTime * 0.04 + uHue;
        vec3 irid = pal(t);
        vec3 lime = vec3(0.83, 1.0, 0.23);
        vec3 base = vec3(0.04, 0.03, 0.08);
        float light = max(dot(n, normalize(vec3(0.6, 0.8, 0.7))), 0.0);
        vec3 col = mix(base, irid * 0.85, fres + 0.12);
        col += lime * pow(fres, 4.0) * 0.9;
        col += pow(light, 18.0) * 0.8;
        col += irid * light * 0.08;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, opts.mobile ? 40 : 72), blobMat);
  scene.add(blob);

  // ── Particle galaxy ─────────────────────────────────────────────
  const COUNT = opts.mobile ? 1800 : 4200;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 3 + Math.pow(Math.random(), 0.6) * 22;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
    pos[i * 3 + 2] = r * Math.cos(ph) - 6;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const pUniforms = { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uVel: { value: 0 } };
  const pMat = new THREE.ShaderMaterial({
    uniforms: pUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPx; uniform float uVel;
      attribute float aSeed; varying float vSeed; varying float vFade;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.5 + aSeed * 40.0) * 0.15;
        p.z += uVel * aSeed * 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.0 + aSeed * 3.0) * uPx * (14.0 / -mv.z) * (1.0 + abs(uVel) * 0.6);
        vSeed = aSeed;
        vFade = smoothstep(40.0, 4.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying float vSeed; varying float vFade;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        float tw = 0.55 + 0.45 * sin(uTime * 2.0 + vSeed * 80.0);
        vec3 c = mix(vec3(0.55, 0.42, 1.0), vec3(0.83, 1.0, 0.23), step(0.82, vSeed));
        c = mix(c, vec3(1.0, 0.31, 0.85), step(0.94, vSeed));
        gl_FragColor = vec4(c, a * tw * vFade * 0.9);
      }`,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Orbit ring of dots ──────────────────────────────────────────
  const ringGroup = new THREE.Group();
  const RING = 420;
  const rPos = new Float32Array(RING * 3);
  for (let i = 0; i < RING; i++) {
    const a = (i / RING) * Math.PI * 2;
    const r = 2.3 + (Math.random() - 0.5) * 0.25;
    rPos[i * 3] = Math.cos(a) * r;
    rPos[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
    rPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const rGeo = new THREE.BufferGeometry();
  rGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
  const ring = new THREE.Points(rGeo, new THREE.PointsMaterial({ color: 0xd4ff3a, size: 0.025, transparent: true, opacity: 0.8 }));
  ringGroup.add(ring);
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.75, 0.004, 8, 200),
    new THREE.MeshBasicMaterial({ color: 0x8b6cff, transparent: true, opacity: 0.5 })
  );
  ring2.rotation.x = Math.PI / 2;
  ringGroup.add(ring2);
  ringGroup.rotation.set(1.15, 0.2, -0.35);
  blob.add(ringGroup);

  // ── Floating wireframe polyhedra ────────────────────────────────
  const floaters: { mesh: THREE.LineSegments; speed: THREE.Vector3; base: THREE.Vector3; phase: number }[] = [];
  const shapes: [THREE.BufferGeometry, number][] = [
    [new THREE.IcosahedronGeometry(0.45, 0), 0xd4ff3a],
    [new THREE.OctahedronGeometry(0.4, 0), 0xff4fd8],
    [new THREE.DodecahedronGeometry(0.35, 0), 0x8b6cff],
    [new THREE.TetrahedronGeometry(0.4, 0), 0xffffff],
    [new THREE.BoxGeometry(0.5, 0.5, 0.5), 0xd4ff3a],
    [new THREE.TorusGeometry(0.32, 0.1, 6, 12), 0x8b6cff],
  ];
  const spots = [
    [-3.6, 1.8, -1], [3.9, -2.0, -2], [-2.6, -2.3, 0.5], [2.6, 2.4, -0.5], [-5.2, -0.4, -3], [5.4, 0.8, -3.5],
  ];
  shapes.forEach(([g, c], i) => {
    const m = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.75 }));
    const base = new THREE.Vector3(...(spots[i] as [number, number, number]));
    m.position.copy(base);
    scene.add(m);
    floaters.push({ mesh: m, base, phase: Math.random() * 10, speed: new THREE.Vector3(Math.random() + 0.3, Math.random() + 0.3, Math.random() * 0.5) });
  });

  // ── Loop ───────────────────────────────────────────────────────
  const clock = { last: performance.now(), elapsedTime: 0, getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d; } };
  let running = true;
  let visible = true;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // keep blob off-center on wide screens, centered on narrow
    const narrow = w < 900;
    (state as SceneState & { _narrow?: boolean })._narrow = narrow;
  }
  resize();
  window.addEventListener("resize", resize);

  const speedMul = opts.reduced ? 0.25 : 1;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime * speedMul;

    mouse.lerp(mouseTarget, 0.06);
    velocity *= 0.92;

    blobUniforms.uTime.value = t;
    blobUniforms.uMouse.value.copy(mouse);
    blobUniforms.uWarp.value += (state.warp + Math.min(Math.abs(velocity) * 0.04, 0.6) - blobUniforms.uWarp.value) * 0.08;
    blobUniforms.uHue.value = state.hue;

    const narrow = (state as SceneState & { _narrow?: boolean })._narrow;
    const tx = narrow ? state.blobX * 0.15 : state.blobX;
    const ty = narrow ? state.blobY + 0.9 : state.blobY;
    blob.position.x += (tx + mouse.x * 0.3 - blob.position.x) * 0.06;
    blob.position.y += (ty + mouse.y * 0.2 - blob.position.y) * 0.06;
    const s = state.blobScale * (narrow ? 0.72 : 1);
    blob.scale.setScalar(blob.scale.x + (s - blob.scale.x) * 0.08);
    blob.rotation.y += dt * 0.15 * speedMul + velocity * 0.0015;
    blob.rotation.x = mouse.y * 0.4 + state.spin;
    ringGroup.rotation.z += dt * 0.25 * speedMul;

    particles.rotation.y = t * 0.02 + state.spin * 0.3;
    particles.rotation.x = mouse.y * 0.05;
    pUniforms.uTime.value = t;
    pUniforms.uVel.value += (Math.max(-3, Math.min(3, velocity * 0.08)) - pUniforms.uVel.value) * 0.1;

    floaters.forEach((f, i) => {
      f.mesh.rotation.x += dt * f.speed.x * speedMul;
      f.mesh.rotation.y += dt * f.speed.y * speedMul;
      f.mesh.position.y = f.base.y + Math.sin(t * 0.8 + f.phase) * 0.35 - state.spin * (i % 2 ? 1.5 : -1.5);
      f.mesh.position.x = f.base.x + Math.cos(t * 0.5 + f.phase) * 0.2 + mouse.x * (0.2 + i * 0.08);
    });

    camera.position.z += (state.camZ - camera.position.z) * 0.06;
    camera.position.x += (mouse.x * 0.35 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.25 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  frame();

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) clock.getDelta();
  });

  return {
    state,
    setMouse(x: number, y: number) {
      mouseTarget.set(x, y);
    },
    setVelocity(v: number) {
      velocity = v;
    },
    destroy() {
      running = false;
      renderer.dispose();
    },
  };
}
