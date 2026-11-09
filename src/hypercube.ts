import * as THREE from "three";

/**
 * Real n-dimensional hypercube: 2^n vertices, n·2^(n-1) edges.
 * Rotated in several n-D planes every frame, then projected to 3D:
 *  – n ≤ 4: perspective projection (the classic tesseract look)
 *  – n ≥ 5: Petrie-style projection (each axis gets its own direction on a circle)
 */
export function createHypercube(canvas: HTMLCanvasElement, opts: { reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 7.5;

  const group = new THREE.Group();
  scene.add(group);

  let n = 0;
  let V = 0;
  let base: Float32Array = new Float32Array(0); // V*n
  let work: Float32Array = new Float32Array(0); // V*n
  let positions: Float32Array = new Float32Array(0); // V*3
  let lines: THREE.LineSegments | null = null;
  let points: THREE.Points | null = null;
  let axes: [number, number][] = [];
  let basis: number[][] = [];
  let angles: number[] = [];
  let speeds: number[] = [];
  let pop = 1;

  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const pointMat = new THREE.PointsMaterial({ vertexColors: true, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

  const colA = new THREE.Color(0xd4ff3a);
  const colB = new THREE.Color(0x8b6cff);
  const colC = new THREE.Color(0xff4fd8);

  function popcount(x: number) {
    let c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
  }

  function build(dim: number) {
    n = dim;
    V = 1 << n;
    base = new Float32Array(V * n);
    work = new Float32Array(V * n);
    positions = new Float32Array(V * 3);
    const colors = new Float32Array(V * 3);
    const c = new THREE.Color();
    for (let v = 0; v < V; v++) {
      for (let k = 0; k < n; k++) base[v * n + k] = (v >> k) & 1 ? 1 : -1;
      const t = popcount(v) / n;
      if (t < 0.5) c.copy(colA).lerp(colB, t * 2);
      else c.copy(colB).lerp(colC, (t - 0.5) * 2);
      colors[v * 3] = c.r; colors[v * 3 + 1] = c.g; colors[v * 3 + 2] = c.b;
    }
    const E = n * (V >> 1);
    const index = new Uint32Array(E * 2);
    let e = 0;
    for (let v = 0; v < V; v++) {
      for (let k = 0; k < n; k++) {
        if (!((v >> k) & 1)) { index[e++] = v; index[e++] = v | (1 << k); }
      }
    }

    // rotation planes: neighbours + a few long-range pairs for chaos
    axes = [];
    for (let k = 0; k < n; k++) axes.push([k, (k + 1) % n]);
    if (n > 4) for (let k = 0; k < Math.min(n, 6); k++) axes.push([k, (k + Math.floor(n / 2)) % n]);
    angles = axes.map(() => 0);
    speeds = axes.map((_, i) => (0.12 + ((i * 37) % 11) / 30) * (i % 2 ? 1 : -1));

    // Petrie basis
    basis = [];
    for (let k = 0; k < n; k++) {
      const a = (Math.PI * k) / n;
      basis.push([Math.cos(a), Math.sin(a), Math.sin((2 * Math.PI * k) / n) * 0.3]);
    }

    if (lines) { group.remove(lines); lines.geometry.dispose(); }
    if (points) { group.remove(points); points.geometry.dispose(); }
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", posAttr);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    lines = new THREE.LineSegments(geo, lineMat);
    lineMat.opacity = Math.max(0.004, Math.min(0.95, (n > 10 ? 3.2 : 5.5) / Math.sqrt(E)));
    group.add(lines);

    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute("position", posAttr);
    pgeo.setAttribute("color", geo.getAttribute("color"));
    points = new THREE.Points(pgeo, pointMat);
    pointMat.size = n <= 5 ? 0.12 : n <= 8 ? 0.06 : 0.025;
    pointMat.opacity = n <= 8 ? 1 : n <= 11 ? 0.35 : 0.12;
    group.add(points);
    pop = 0.2;
    return { V, E };
  }

  function update(dt: number) {
    const sp = opts.reduced ? 0.2 : 1;
    for (let i = 0; i < angles.length; i++) angles[i] += speeds[i] * dt * sp;
    work.set(base);
    // apply each plane rotation
    for (let a = 0; a < axes.length; a++) {
      const [i, j] = axes[a];
      const c = Math.cos(angles[a]);
      const s = Math.sin(angles[a]);
      for (let v = 0, o = 0; v < V; v++, o += n) {
        const x = work[o + i];
        const y = work[o + j];
        work[o + i] = x * c - y * s;
        work[o + j] = x * s + y * c;
      }
    }
    if (n <= 4) {
      for (let v = 0, o = 0; v < V; v++, o += n) {
        let x = work[o], y = work[o + 1], z = work[o + 2];
        if (n === 4) {
          const w = 1 / (3 - work[o + 3]);
          x *= w * 2.2; y *= w * 2.2; z *= w * 2.2;
        } else {
          x *= 0.85; y *= 0.85; z *= 0.85;
        }
        positions[v * 3] = x; positions[v * 3 + 1] = y; positions[v * 3 + 2] = z;
      }
    } else {
      const scale = (2.4 * Math.PI) / (2 * n);
      for (let v = 0, o = 0; v < V; v++, o += n) {
        let x = 0, y = 0, z = 0;
        for (let k = 0; k < n; k++) {
          const q = work[o + k];
          const b = basis[k];
          x += q * b[0]; y += q * b[1]; z += q * b[2];
        }
        positions[v * 3] = x * scale; positions[v * 3 + 1] = y * scale; positions[v * 3 + 2] = z * scale;
      }
    }
    if (lines) (lines.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }

  // ── Drag to rotate (3D view) ───────────────────────────────────
  let dragging = false;
  let lx = 0, ly = 0;
  let vx = 0.004, vy = 0.002;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    vy = (e.clientX - lx) * 0.004; vx = (e.clientY - ly) * 0.004;
    lx = e.clientX; ly = e.clientY;
  });
  const end = () => { dragging = false; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" }).observe(canvas);

  const clock = { last: performance.now(), elapsedTime: 0, getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d; } };
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!inView || document.hidden) return;
    update(dt);
    group.rotation.y += vy;
    group.rotation.x += vx;
    if (!dragging) { vx += (0.0025 - vx) * 0.02; vy += (0.004 - vy) * 0.02; }
    pop += (1 - pop) * 0.08;
    group.scale.setScalar(pop);
    renderer.render(scene, camera);
  }
  resize();
  loop();

  return { setDim: build };
}
