// Carrusel WebGL con scroll virtual por muelle, transiciones de página y versión táctil.
// Implementación propia; los tiempos y curvas se han medido sobre la referencia.
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture, Triangle, Vec3 } from 'ogl';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
const mix3 = (a, b, t) => a.map((v, k) => lerp(v, b[k], t));
const css3 = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;

/* ── curvas ─────────────────────────────────────────────── */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = (t) => ((ax * t + bx) * t + cx) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (fx(t) - x) / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 20 && Math.abs(fx(t) - x) > 1e-5; i++) {
      if (fx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const E = {
  pos: bezier(0.4, 0, 0.3, 1), // 820 ms: cambios de pose de los planos
  fast: bezier(0.4, 0, 0.2, 1), // 400 ms: navegación rápida
  page: bezier(0.6, 0, 0.18, 1), // 1000 ms: home ⇄ proyecto, intro
  back: bezier(0.75, 0, 0.25, 1), // 1400 ms: proyecto → home
  limbo: bezier(0.4, 0, 0.4, 1), // 350 ms: fondo gris de la navegación rápida
  sine: (t) => Math.sin((t * Math.PI) / 2), // 650 ms: cambio de color de fondo
  cubic: (t) => 1 - Math.pow(1 - t, 3),
  intro: bezier(0.35, 0.02, 0.15, 1),
  linear: (t) => t,
};

/* ── tweens ─────────────────────────────────────────────── */
const tweens = new Set();
function tween({ dur, ease = E.linear, delay = 0, update, done }) {
  const tw = { t0: performance.now() + delay, dur, ease, update, done, dead: false };
  tw.cancel = () => { tw.dead = true; tweens.delete(tw); };
  tweens.add(tw);
  return tw;
}
function runTweens(now) {
  for (const tw of [...tweens]) {
    if (tw.dead || now < tw.t0) continue;
    const k = clamp((now - tw.t0) / tw.dur, 0, 1);
    tw.update(tw.ease(k));
    if (k >= 1) { tweens.delete(tw); tw.done && tw.done(); }
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── muelle (masa 2.5, rigidez 80, rozamiento 24 → ζ ≈ 0.85) ── */
class Spring {
  constructor(m = 2.5, k = 80, c = 24) { Object.assign(this, { m, k, c, x: 0, v: 0, target: 0 }); }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt / 0.002));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = (-this.k * (this.x - this.target) - this.c * this.v) / this.m;
      this.v += a * h;
      this.x += this.v * h;
    }
  }
  get resting() { return Math.abs(this.v) < 1e-4 && Math.abs(this.x - this.target) < 1e-4; }
}

/* ── shaders ───────────────────────────────────────────── */
const planeVert = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uBend;
uniform float uFloat;
uniform float uTime;
varying vec2 vUv;
varying float vWave;
void main() {
  vec3 p = position;
  // curvatura: los bordes izquierdo y derecho caen, el centro se queda
  float edge = 1.0 - sin(uv.x * 3.14159265);
  p.y -= uBend * edge;
  p.x += uBend * (uv.y - 0.5) * (uv.x - 0.5) * 2.0;
  // flotación lenta
  float w = sin(uTime * 1.0995574) * uFloat;
  p.x -= w * 0.007;
  p.y += w * 0.028;
  vWave = w;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const planeFrag = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uCover;
uniform float uZoom;
uniform float uSat;
uniform float uAlpha;
uniform float uLight;
uniform float uMask;
uniform float uLoading;
uniform float uReveal;
uniform vec3 uPlaceholder;
uniform vec2 uRes;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vWave;
void main() {
  vec2 st = gl_FragCoord.xy / uRes;
  vec2 uv = vUv + vec2(-0.007, 0.028) * vWave;
  uv = (uv - 0.5) / uZoom * uCover + 0.5;
  vec3 c = texture2D(tMap, uv).rgb;
  // carga: la foto aparece de abajo arriba sobre un color plano
  float hold = smoothstep(uReveal - 0.32, uReveal + 0.05, st.y) * uLoading;
  c = mix(c, uPlaceholder, hold);
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(g), c, uSat);
  float a = uAlpha * step(uMask, st.x);
  // luz que sigue al puntero
  vec2 d = (uPointer - st) * vec2(uRes.x / uRes.y, 1.0);
  float l = (1.0 - sin(min(length(d) / 0.7, 1.0) * 1.5707963)) * 0.08 * uLight * a;
  gl_FragColor = vec4(c + l / max(a, 0.001), a);
}`;

const bgVert = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const bgFrag = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform vec3 uP0;
uniform vec3 uP1;
uniform vec3 uS0;
uniform vec3 uS1;
uniform vec3 uLimbo;
uniform vec3 uLoader;
uniform float uMix;
uniform float uFast;
uniform float uHome;
uniform float uReveal;
uniform float uBar;
void main() {
  vec2 st = gl_FragCoord.xy / uRes;
  vec3 pri = mix(uP0, uP1, uMix);
  vec3 sec = mix(uS0, uS1, uMix);
  vec3 c = st.x > 1.0 - uHome ? pri : sec;
  if (gl_FragCoord.x < uBar) c = sec;
  c = mix(c, uLimbo, uFast);
  if (st.x > uReveal) c = uLoader;
  gl_FragColor = vec4(c, 1.0);
}`;

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

/* ── poses (valores medidos) ───────────────────────────── */
const BASE = { px: 0, pz: 0, rx: 0, ry: 0, rz: 0, bend: 0, float: 0, frame: 1, caseFrame: 1, caseRot: 0, hpFrame: 1, hpPhoto: 1, hpSat: 1, hpAlpha: 1, photo: 1, sat: 1, alpha: 1, light: 0, loadPhoto: 1 };
const KEYS = Object.keys(BASE);
const pose = {
  rest: (vw) => ({ ...BASE, px: 0.16 * vw, pz: 0.3, rx: -0.41, ry: -0.87, rz: 0.06, bend: 0.021, float: 1, hpFrame: 0.9, hpPhoto: 1.11, hpSat: 0, hpAlpha: 0.55, light: 1 }),
  loading: () => ({ ...BASE, px: 0.6, pz: -0.5, rx: -0.9, loadPhoto: 1.15, hpSat: 1, light: 0 }),
  open: () => ({ ...BASE, caseFrame: 0.75, caseRot: -0.2, light: 1 }),
  fast: () => ({ ...BASE, rx: -0.9, frame: 0.98, photo: 1.1, hpSat: 0, hpAlpha: 0.6 }),
};

export function start() {
  const { items, thumbs } = JSON.parse($('#gl-data').textContent);
  const n = items.length;
  const html = document.documentElement;
  const body = document.body;
  const home = $('.home');
  const titles = $$('.t');
  const dots = $$('.dots button');
  const stills = $$('.still');
  const cases = $$('.case');
  const about = $('.about');
  const cover = $('.cover');
  const cardIn = $('.card-in');
  const faces = $$('.card-face');
  const pri = items.map((d) => hex(d.bg));
  const sec = items.map((d) => hex(d.ink));

  const mobile = matchMedia('(max-width: 820px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const useGL = !mobile && !reduced && webglOk();
  if (useGL) html.classList.add('is-gl');

  let idx = 0; // proyecto confirmado
  let shown = 0; // proyecto cuyo texto/fondo se ve
  let phase = 'intro';
  let openIdx = -1;

  /* ── UI común: textos, puntos, tarjeta, colores ─────── */
  let cardAngle = 0, cardFace = 0, cardAnim;
  function flipCard(i, dir) {
    if (reduced) { faces[cardFace].querySelector('img').src = thumbs[i]; return; }
    const next = 1 - cardFace;
    faces[next].querySelector('img').src = thumbs[i];
    cardAngle += dir >= 0 ? 180 : -180;
    cardFace = next;
    cardAnim && cardAnim.cancel();
    const from = cardIn._a || 0;
    cardIn._a = cardAngle;
    cardAnim = cardIn.animate(
      [
        { transform: `rotateX(${from}deg) scale(1)` },
        { transform: `rotateX(${lerp(from, cardAngle, 0.3)}deg) scale(.78)`, offset: 0.3 },
        { transform: `rotateX(${lerp(from, cardAngle, 0.7)}deg) scale(.78)`, offset: 0.7 },
        { transform: `rotateX(${cardAngle}deg) scale(1)` },
      ],
      { duration: 1100, easing: 'cubic-bezier(.6,0,.18,1)', fill: 'forwards' },
    );
  }

  let showTimer;
  function setCurrent(i) {
    dots.forEach((d, k) => d.toggleAttribute('aria-current', k === i));
    if (mobile || !useGL) stills.forEach((s, k) => s.classList.toggle('is-active', k === i));
    clearTimeout(showTimer);
    // el cambio de color y de texto espera 150 ms a que el scroll se asiente
    showTimer = setTimeout(() => show(i), useGL ? 150 : 0);
  }
  function show(i) {
    if (i === shown) return;
    const dir = i > shown ? 1 : -1;
    titles.forEach((t, k) => t.classList.toggle('is-active', k === i));
    body.style.setProperty('--bg', items[i].bg);
    body.style.setProperty('--ink', items[i].ink);
    flipCard(i, dir);
    if (useGL) fadeColors(i);
    shown = i;
  }
  titles[0].classList.add('is-active');

  /* ── navegación común ──────────────────────────────── */
  function hashIndex() {
    const id = location.hash.slice(1);
    return items.findIndex((d) => d.id === id);
  }

  /* ══════════════════ WebGL (escritorio) ══════════════════ */
  let gl, renderer, camera, scene, bgMesh, bgProg, planes = [], scroll = new Spring();
  let vw = 1, vh = 1, W = 1, H = 1, step = 1;
  let loaderY = 0, homeT = 0, reveal = 0, fast = 0, barT = 0, loadingFlag = 1, revealPh = -0.4;
  let pointer = [0.5, 0.5], caseScroll = 0, bendV = 0;
  const colorState = { p0: pri[0], p1: pri[0], s0: sec[0], s1: sec[0], mix: 1 };
  let colorTw;
  function fadeColors(i) {
    const cp = mix3(colorState.p0, colorState.p1, colorState.mix);
    const cs = mix3(colorState.s0, colorState.s1, colorState.mix);
    Object.assign(colorState, { p0: cp, s0: cs, p1: pri[i], s1: sec[i], mix: 0 });
    colorTw && colorTw.cancel();
    colorTw = tween({ dur: 650, ease: E.sine, update: (k) => (colorState.mix = k) });
  }

  function setPose(pl, target, dur, ease, delay = 0) {
    pl.tw && pl.tw.cancel();
    const from = { ...pl.p };
    pl.tw = tween({ dur, ease, delay, update: (k) => { for (const key of KEYS) pl.p[key] = lerp(from[key], target[key], k); } });
  }
  const restPose = () => pose.rest(vw);

  function measure() {
    vh = 2 * Math.tan((7.5 * Math.PI) / 180) * 5.8;
    vw = vh * (innerWidth / innerHeight);
    W = 0.46 * vw;
    H = (W * 844) / 1366;
    step = H + 0.15 * H;
  }

  function initGL() {
    const canvas = $('.gl');
    renderer = new Renderer({ canvas, dpr: Math.min(devicePixelRatio, 2), antialias: true, alpha: false });
    gl = renderer.gl;
    camera = new Camera(gl, { fov: 15, near: 0.1, far: 50 });
    camera.position.z = 5.8;
    scene = new Transform();
    measure();

    bgProg = new Program(gl, {
      vertex: bgVert, fragment: bgFrag, depthTest: false, depthWrite: false,
      uniforms: {
        uRes: { value: [1, 1] }, uP0: { value: pri[0] }, uP1: { value: pri[0] }, uS0: { value: sec[0] }, uS1: { value: sec[0] },
        uLimbo: { value: hex('#0b0b0b') }, uLoader: { value: hex('#0b0b0b') },
        uMix: { value: 1 }, uFast: { value: 0 }, uHome: { value: 1 }, uReveal: { value: 0 }, uBar: { value: 0 },
      },
    });
    bgMesh = new Mesh(gl, { geometry: new Triangle(gl), program: bgProg });

    const placeholder = hex('#262626');
    items.forEach((d, i) => {
      const tex = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
      const img = new Image();
      img.decoding = 'async';
      img.src = d.tex;
      const ready = img.decode().then(() => { tex.image = img; }).catch(() => {});
      const program = new Program(gl, {
        vertex: planeVert, fragment: planeFrag, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          tMap: { value: tex }, uCover: { value: [1, 1] }, uZoom: { value: 1 }, uSat: { value: 1 }, uAlpha: { value: 1 },
          uLight: { value: 0 }, uMask: { value: 0 }, uLoading: { value: 1 }, uReveal: { value: -0.4 },
          uPlaceholder: { value: placeholder }, uRes: { value: [1, 1] }, uPointer: { value: [0.5, 0.5] },
          uBend: { value: 0 }, uFloat: { value: 0 }, uTime: { value: 0 },
        },
      });
      // pose → giro Z → giro Y → giro X → entrada → scroll → destacado → plano
      const root = new Transform(), rz = new Transform(), ry = new Transform(), rx = new Transform();
      const load = new Transform(), scr = new Transform(), hi = new Transform();
      root.setParent(scene); rz.setParent(root); ry.setParent(rz); rx.setParent(ry);
      load.setParent(rx); scr.setParent(load); hi.setParent(scr);
      const mesh = new Mesh(gl, { geometry: new Plane(gl, { width: 1, height: 1 }), program });
      mesh.setParent(hi);
      planes.push({ i, d, mesh, program, root, rz, ry, rx, load, scr, hi, p: pose.loading(), l: 0, ready, aspect: d.w / d.h });
    });
    buildGeometry();
    resizeGL();
    addEventListener('resize', () => { resizeGL(); });
  }

  function buildGeometry() {
    planes.forEach((pl) => {
      pl.mesh.geometry.remove && pl.mesh.geometry.remove();
      pl.mesh.geometry = new Plane(gl, { width: W, height: H, widthSegments: 50, heightSegments: 2 });
      const A = W / H;
      pl.program.uniforms.uCover.value = pl.aspect > A ? [A / pl.aspect, 1] : [1, pl.aspect / A];
    });
  }

  function resizeGL() {
    renderer.setSize(innerWidth, innerHeight);
    camera.perspective({ aspect: innerWidth / innerHeight });
    const oldStep = step;
    measure();
    buildGeometry();
    scroll.x *= step / oldStep;
    scroll.target = idx * step;
    const res = [gl.canvas.width, gl.canvas.height];
    bgProg.uniforms.uRes.value = res;
    planes.forEach((pl) => { pl.program.uniforms.uRes.value = res; });
    if (phase === 'home') planes.forEach((pl) => { if (!pl.tw || pl.tw.dead) Object.assign(pl.p, fast > 0.5 ? pose.fast() : restPose()); });
    if (phase === 'case' && openIdx >= 0) Object.assign(planes[openIdx].p, pose.open());
  }

  const corner = new Vec3();
  function screenQuad(pl) {
    const pts = [];
    for (const [x, y] of [[-W / 2, H / 2], [W / 2, H / 2], [W / 2, -H / 2], [-W / 2, -H / 2]]) {
      corner.set(x, y, 0).applyMatrix4(pl.mesh.worldMatrix).applyMatrix4(camera.viewMatrix).applyMatrix4(camera.projectionMatrix);
      pts.push([(corner.x * 0.5 + 0.5) * innerWidth, (0.5 - corner.y * 0.5) * innerHeight]);
    }
    return pts;
  }
  function inQuad(q, x, y) {
    let sign = 0;
    for (let k = 0; k < 4; k++) {
      const [ax, ay] = q[k], [bx, by] = q[(k + 1) % 4];
      const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (c !== 0) { if (sign && Math.sign(c) !== sign) return false; sign = Math.sign(c); }
    }
    return true;
  }
  let hovered = -1, mouse = [-1, -1];
  function pickPlane() {
    if (phase !== 'home' || mouse[0] < 0) return -1;
    for (const pl of planes) {
      const q = screenQuad(pl);
      if (inQuad(q, mouse[0], mouse[1])) return pl.i;
    }
    return -1;
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    runTweens(now);
    scroll.step(dt);
    bendV = lerp(bendV, clamp(scroll.v * 0.02, -0.05, 0.05), 1 - Math.exp(-dt * 10));
    const t = now / 1000;
    planes.forEach((pl) => {
      const p = pl.p;
      pl.root.position.set(p.px, 0, p.pz);
      pl.rz.rotation.z = p.rz;
      pl.ry.rotation.y = p.ry;
      pl.rx.rotation.x = p.rx;
      pl.load.position.y = loaderY;
      pl.scr.position.y = scroll.x;
      // en el proyecto abierto el plano sube despacio con el scroll (parallax)
      pl.hi.position.y = pl.i === openIdx ? caseScroll * 0.0004 : 0;
    });
    scene.updateMatrixWorld();
    // distancia al centro de la pantalla (×2, en unidades de mundo) → escala, giro y desplazamiento del marco
    planes.forEach((pl) => {
      const p = pl.p;
      corner.set(0, -step * pl.i, 0).applyMatrix4(pl.hi.worldMatrix);
      const l = (pl.l = 2 * corner.y), al = Math.abs(l);
      pl.mesh.position.y = -step * pl.i + 0.6 * (p.hpFrame - 1) * l;
      const fs = p.frame * (1 + (p.hpFrame - 1) * al) * (1 + (p.caseFrame - 1) * l);
      pl.mesh.scale.set(fs, fs, fs);
      pl.mesh.rotation.z = p.caseRot * l;
      pl.mesh.updateMatrixWorld(true);
    });
    const ptr = [mouse[0] / innerWidth, 1 - mouse[1] / innerHeight];
    planes.forEach((pl) => {
      const p = pl.p, u = pl.program.uniforms;
      const al = Math.abs(pl.l);
      const near = 1 - clamp(al, 0, 1);
      const photoZoom = p.photo + 0.05 + (p.hpPhoto - 1) * al + (p.loadPhoto - 1) * (1 - clamp(revealPh, 0, 1));
      u.uZoom.value = photoZoom;
      u.uSat.value = p.sat * (p.hpSat + (1 - p.hpSat) * near);
      u.uAlpha.value = p.alpha * (p.hpAlpha + (1 - p.hpAlpha) * near);
      u.uLight.value = p.light;
      u.uBend.value = p.bend + bendV * (p.float > 0 ? 1 : 0);
      u.uFloat.value = p.float;
      u.uTime.value = t;
      u.uMask.value = pl.i === openIdx ? 0 : 1 - homeT;
      u.uLoading.value = loadingFlag;
      u.uReveal.value = revealPh;
      u.uPointer.value = ptr;
    });
    const b = bgProg.uniforms;
    b.uP0.value = colorState.p0; b.uP1.value = colorState.p1; b.uS0.value = colorState.s0; b.uS1.value = colorState.s1;
    b.uMix.value = colorState.mix; b.uFast.value = fast; b.uHome.value = homeT; b.uReveal.value = reveal;
    b.uBar.value = 10 * barT * homeT * renderer.dpr;
    renderer.render({ scene: bgMesh, camera });
    renderer.autoClear = false;
    renderer.render({ scene, camera });
    renderer.autoClear = true;
    const h = pickPlane();
    if (h !== hovered) { hovered = h; body.style.cursor = h >= 0 ? 'pointer' : ''; }
    if (homeT > 0 && phase !== 'intro') { const q = screenQuad(planes[idx]); void q; }
  }

  /* ── entrada: rueda, teclado, puntos, clic ─────────── */
  const maxIdx = n - 1;
  function goTo(i) {
    i = clamp(i, 0, maxIdx);
    idx = i;
    scroll.target = i * step;
    setCurrent(i);
  }

  let u = 0, wheelTimer, lock = false, lastWheel = 0, hist = [];
  function commitWheel() {
    clearTimeout(wheelTimer);
    const a = Math.abs(u);
    // ≥ 0.2 u (≈ 87 px) avanza al menos uno; después redondea como la referencia
    const force = a < 0.2 ? 0 : Math.max(1, Math.round(a));
    const target = clamp(idx + Math.sign(u) * force, 0, maxIdx);
    u = 0;
    if (target !== idx) goTo(target); else scroll.target = idx * step;
  }
  function onWheel(e) {
    if (phase !== 'home' || !useGL) {
      if (phase === 'home') { e.preventDefault(); simpleWheel(e); }
      return;
    }
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1);
    const now = performance.now();
    if (now - lastWheel > 180) { hist = []; lock = false; }
    lastWheel = now;
    const a = Math.abs(dy);
    hist.push(a);
    if (hist.length > 12) hist.shift();
    if (lock) {
      const prev = hist.slice(-4, -1);
      if (prev.length === 3 && a > Math.max(...prev) * 1.4 && a > 8) lock = false;
      else return;
    }
    u = clamp(u + dy * 0.0023, -3.2, 3.2);
    scroll.target = clamp(idx * step + u, -0.3, step * maxIdx + 0.3);
    if (hist.length >= 8) {
      const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
      if (avg(hist.slice(-4)) < avg(hist.slice(-8, -4)) * 0.75) { commitWheel(); lock = true; return; }
    }
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(commitWheel, 100);
  }
  let simpleLock = 0;
  function simpleWheel(e) {
    const now = performance.now();
    if (now < simpleLock || Math.abs(e.deltaY) < 20) return;
    simpleLock = now + 600;
    goTo(idx + Math.sign(e.deltaY));
  }
  addEventListener('wheel', onWheel, { passive: false });

  let kd = 0, keyTimer;
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (phase === 'case') closeCase(); else if (phase === 'about') closeAbout(); return; }
    if (phase !== 'home' || e.target.closest('input,textarea')) return;
    const d = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (e.key === 'Enter' && !e.target.closest('a,button')) { openCase(idx); return; }
    if (!d) return;
    e.preventDefault();
    if (!useGL) { goTo(idx + d); return; }
    kd = clamp(kd + d, -idx, maxIdx - idx);
    scroll.target = (idx + kd) * step;
    clearTimeout(keyTimer);
  });
  addEventListener('keyup', (e) => {
    if (!useGL || !kd) return;
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => { const k = kd; kd = 0; goTo(idx + k); }, 200);
  });

  dots.forEach((b, i) => {
    b.addEventListener('click', () => phase === 'home' && goTo(i));
    b.addEventListener('mouseenter', () => { if (phase === 'home' && fast > 0) goTo(i); });
  });
  const nav = $('.dots');
  let fastTw;
  let navIntent;
  nav.addEventListener('mouseenter', () => {
    if (!useGL || phase !== 'home') return;
    clearTimeout(navIntent);
    navIntent = setTimeout(enterFast, 350); // la referencia reacciona ~0,4 s después de entrar
  });
  function enterFast() {
    if (phase !== 'home') return;
    html.classList.add('is-fast');
    planes.forEach((pl) => setPose(pl, pose.fast(), 400, E.fast));
    const f0 = fast; fastTw && fastTw.cancel();
    fastTw = tween({ dur: 350, ease: E.limbo, update: (k) => (fast = lerp(f0, 1, k)) });
  }
  nav.addEventListener('mouseleave', () => {
    clearTimeout(navIntent);
    if (!useGL || !html.classList.contains('is-fast')) return;
    html.classList.remove('is-fast');
    if (phase === 'home') planes.forEach((pl) => setPose(pl, restPose(), 400, E.fast));
    const f0 = fast; fastTw && fastTw.cancel();
    fastTw = tween({ dur: 350, ease: E.limbo, update: (k) => (fast = lerp(f0, 0, k)) });
  });

  addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') mouse = [e.clientX, e.clientY]; }, { passive: true });
  document.addEventListener('pointerleave', () => (mouse = [-1, -1]));
  addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      if (phase !== 'home') return;
      const i = +opener.dataset.open;
      if (i === idx) openCase(i); else goTo(i);
      return;
    }
    if (useGL && phase === 'home' && !e.target.closest('a,button') && hovered >= 0) {
      if (hovered === idx) openCase(idx); else goTo(hovered);
    }
  });

  /* ── abrir / cerrar proyecto ───────────────────────── */
  const homeClip = (l, r) => { home.style.setProperty('--cl', `${l}%`); home.style.setProperty('--cr', `${r}%`); };
  const caseEl = (i) => cases[i];

  async function openCase(i) {
    if (phase !== 'home') return;
    phase = 'trans';
    if (i !== idx) goTo(i);
    const el = caseEl(i);
    body.style.setProperty('--hdr-ink', items[i].bg);
    if (!useGL) {
      if (!mobile || reduced) {
        el.classList.add('is-open', 'is-shown');
        el.scrollTop = 0;
        body.classList.add('in-case');
        history.pushState(null, '', `#${items[i].id}`);
        openIdx = i; phase = 'case';
        $('[data-close]').focus({ preventScroll: true });
        return;
      }
      // móvil: barrido del color del proyecto de izquierda a derecha
      el.style.clipPath = 'inset(0 100% 0 0)';
      el.classList.add('is-open');
      el.scrollTop = 0;
      await wait(300);
      history.pushState(null, '', `#${items[i].id}`);
      body.classList.add('in-case');
      await new Promise((res) => tween({ dur: 1000, ease: E.page, update: (k) => (el.style.clipPath = `inset(0 ${(1 - k) * 100}% 0 0)`), done: res }));
      el.style.clipPath = '';
      el.classList.add('is-shown');
      openIdx = i; phase = 'case';
      return;
    }
    openIdx = i;
    caseScroll = 0;
    await wait(300);
    history.pushState(null, '', `#${items[i].id}`);
    el.classList.add('is-open');
    el.scrollTop = 0;
    body.classList.add('in-case');
    setPose(planes[i], pose.open(), 820, E.pos);
    tween({ dur: 1000, ease: E.page, update: (k) => { homeT = 1 - k; homeClip(k * 100, 0); } });
    setTimeout(() => el.classList.add('is-shown'), 450);
    await wait(1000);
    phase = 'case';
    $('[data-close]').focus({ preventScroll: true });
  }

  async function closeCase(next) {
    if (phase !== 'case') return;
    phase = 'trans';
    const i = openIdx;
    const el = caseEl(i);
    if (location.hash) history.pushState(null, '', location.pathname);
    if (!useGL) {
      if (mobile && !reduced) {
        cover.style.setProperty('--cover', items[i].ink);
        cover.style.visibility = 'visible';
        await new Promise((res) => tween({ dur: 550, ease: E.back, update: (k) => (cover.style.transform = `translateX(${(1 - k) * 100}%)`), done: res }));
        el.classList.remove('is-open', 'is-shown');
        body.classList.remove('in-case');
        cover.style.transform = 'none';
        await new Promise((res) => tween({ dur: 850, ease: E.back, update: (k) => (cover.style.clipPath = `inset(0 ${k * 100}% 0 0)`), done: res }));
        cover.style.visibility = 'hidden'; cover.style.clipPath = ''; cover.style.transform = '';
      } else {
        el.classList.remove('is-open', 'is-shown');
        body.classList.remove('in-case');
      }
      openIdx = -1; phase = 'home';
      if (next != null) { goTo(next); setTimeout(() => openCase(next), mobile ? 700 : 50); }
      return;
    }
    // 1) el color del proyecto entra desde la derecha y tapa el contenido
    cover.style.setProperty('--cover', items[i].ink);
    await wait(300); // waitBeforeChangePage, como en la referencia
    cover.style.visibility = 'visible';
    tween({ dur: 1400, ease: E.back, update: (k) => { homeT = k; homeClip(100 * (1 - clamp((k - 0.65) / 0.35, 0, 1)), 0); } });
    await new Promise((res) => tween({ dur: 560, ease: E.pos, update: (k) => (cover.style.transform = `translateX(${(1 - k) * 100}%)`), done: res }));
    // 2) bajo la tapa: se cierra el artículo y el plano vuelve arriba
    el.classList.remove('is-open', 'is-shown');
    el.scrollTop = 0;
    caseScroll = 0;
    body.classList.remove('in-case');
    cover.style.visibility = 'hidden';
    cover.style.transform = '';
    // 3) el fondo de la home barre de derecha a izquierda; el plano se vuelve a inclinar
    setPose(planes[i], restPose(), 820, E.pos, 900 - 560);
    await wait(1400 - 560);
    openIdx = -1;
    phase = 'home';
    if (next != null) { goTo(next); setTimeout(() => openCase(next), 1150); }
  }

  cases.forEach((el) => {
    el.addEventListener('scroll', () => { if (+el.dataset.case === openIdx) caseScroll = el.scrollTop; }, { passive: true });
  });
  $$('[data-next]').forEach((b) => b.addEventListener('click', () => closeCase(+b.dataset.next)));
  $('[data-close]').addEventListener('click', () => (phase === 'about' ? closeAbout() : closeCase()));
  $('[data-home]').addEventListener('click', (e) => {
    e.preventDefault();
    if (phase === 'case') closeCase(); else if (phase === 'about') closeAbout();
  });

  /* ── sobre mí ──────────────────────────────────────── */
  const aboutProg = (k) => {
    about.style.setProperty('--ar', `${(1 - k) * 100}%`);
    about.style.setProperty('--ax', `${-5 * (1 - k)}%`);
    about.style.setProperty('--ao', k);
  };
  async function openAbout() {
    if (phase !== 'home') return;
    phase = 'trans';
    about.classList.add('is-open');
    about.scrollTop = 0;
    body.classList.add('in-about');
    if (location.hash !== '#sobre-mi') history.pushState(null, '', '#sobre-mi');
    if (reduced) aboutProg(1);
    else await new Promise((res) => tween({ dur: 1000, ease: E.page, update: aboutProg, done: res }));
    phase = 'about';
    $('[data-close]').focus({ preventScroll: true });
  }
  async function closeAbout() {
    if (phase !== 'about') return;
    phase = 'trans';
    if (location.hash) history.pushState(null, '', location.pathname);
    if (!reduced) await new Promise((res) => tween({ dur: 1000, ease: E.page, update: (k) => aboutProg(1 - k), done: res }));
    about.classList.remove('is-open');
    body.classList.remove('in-about');
    phase = 'home';
  }
  $('[data-about]').addEventListener('click', (e) => { e.preventDefault(); openAbout(); });
  addEventListener('popstate', () => {
    const h = location.hash;
    if (phase === 'case' && !h) closeCase();
    else if (phase === 'about' && h !== '#sobre-mi') closeAbout();
    else if (phase === 'home' && h === '#sobre-mi') openAbout();
    else if (phase === 'home' && hashIndex() >= 0) openCase(hashIndex());
  });

  /* ══════════════════ móvil: carrusel táctil ══════════════════ */
  function initTouch() {
    const track = $('.track');
    const zone = $('.home'); // toda la home es arrastrable, como en la referencia
    let swallow = 0;
    const inner = $('.track-in');
    const sp = new Spring();
    let Wm = 1, drag = null, raf = 0;
    const measureM = () => { Wm = stills[0].getBoundingClientRect().width + 12; sp.x = sp.target = idx * Wm; paint(); };
    const paint = () => { inner.style.transform = `translate3d(${-sp.x}px,0,0)`; };
    let lastT = 0;
    const loop = (now) => {
      const dt = Math.min((now - lastT) / 1000, 1 / 20); lastT = now;
      runTweens(now);
      if (!drag) sp.step(dt);
      paint();
      if (drag || !sp.resting || tweens.size) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const kick = () => { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); } };
    window.__kick = kick;
    goToM = (i) => { goTo(i); sp.target = idx * Wm; kick(); };
    zone.addEventListener('pointerdown', (e) => {
      if (phase !== 'home') return;
      drag = { x0: e.clientX, y0: e.clientY, s0: sp.x, samples: [[performance.now(), sp.x]], axis: null, id: e.pointerId };
      sp.v = 0;
      kick();
    });
    zone.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.axis && Math.hypot(dx, dy) > 6) {
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'x') zone.setPointerCapture(e.pointerId);
      }
      if (drag.axis !== 'x') return;
      let x = drag.s0 - dx;
      const max = maxIdx * Wm;
      if (x < 0) x *= 0.35; else if (x > max) x = max + (x - max) * 0.35;
      sp.x = x;
      const now = performance.now();
      drag.samples.push([now, x]);
      while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (d.axis !== 'x') {
        if (!d.axis && e.type === 'pointerup') {
          const s = e.target.closest('.still');
          if (s) { const i = +s.dataset.i; if (i === idx) openCase(i); else goToM(i); }
        }
        sp.target = idx * Wm; kick();
        return;
      }
      swallow = performance.now();
      const [t0, x0] = d.samples[0], [t1, x1] = d.samples[d.samples.length - 1];
      const v = t1 > t0 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0; // px/s
      const proj = sp.x + v * 0.35; // un swipe rápido de ~270 px avanza dos, como en la referencia
      let i = Math.round(proj / Wm);
      i = clamp(i, idx - 2, idx + 2);
      sp.v = v;
      goToM(i);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    track.addEventListener('click', (e) => e.preventDefault());
    zone.addEventListener('click', (e) => { if (performance.now() - swallow < 350) { e.preventDefault(); e.stopPropagation(); } }, true);
    addEventListener('resize', measureM);
    measureM();
  }
  let goToM = goTo;

  /* ══════════════════ intro ══════════════════ */
  async function intro() {
    const quick = sessionStorage.getItem('ig-intro') === '1';
    sessionStorage.setItem('ig-intro', '1');
    const loader = $('.loader');
    const t0 = performance.now();
    homeClip(0, 100);
    $('.titles').style.opacity = 0;
    loader.style.setProperty('--lc', css3(mix3(pri[0], [1, 1, 1], 0.3)));
    requestAnimationFrame(() => html.classList.add('is-loading'));
    planes.forEach((pl) => Object.assign(pl.p, pose.loading()));
    const totalH = step * n;
    loaderY = totalH + vh;
    let loaded = 0;
    const line = $('.loader-line');
    planes.forEach((pl) => pl.ready.then(() => { loaded++; line.style.setProperty('--lp', loaded / n); }));
    await Promise.race([Promise.all(planes.map((pl) => pl.ready)), wait(5000)]);
    await wait(Math.max(quick ? 50 : 150, (quick ? 150 : 400) - (performance.now() - t0)));
    // los planos bajan en columna y las fotos se revelan de abajo arriba
    const travel = quick ? 900 : 1800;
    tween({ dur: travel, ease: E.intro, update: (k) => { loaderY = (totalH + vh) * (1 - k); } });
    tween({ dur: travel * 0.7, ease: E.linear, update: (k) => { revealPh = lerp(-0.4, 1.4, k); } });
    await wait(travel + (quick ? 100 : 250));
    loadingFlag = 0;
    // barrido del fondo de izquierda a derecha + la home entra desplazándose
    html.classList.add('is-ready');
    planes.forEach((pl) => setPose(pl, restPose(), 820, E.pos));
    tween({
      dur: 1000, ease: E.page,
      update: (k) => {
        reveal = k;
        homeClip(0, (1 - k) * 100);
        home.style.setProperty('--hx', `${-5 * (1 - k)}%`);
        $('.titles').style.opacity = k;
        loader.style.setProperty('--lclip', `${k * 100}%`);
      },
    });
    tween({ delay: 1000, dur: 250, ease: E.cubic, update: (k) => (barT = k) });
    await wait(1000);
    loader.remove();
    reveal = 1.01;
    phase = 'home';
    const h = hashIndex();
    if (h >= 0) { goTo(h); setTimeout(() => openCase(h), 900); }
    else if (location.hash === '#sobre-mi') openAbout();
  }

  /* ── arranque ──────────────────────────────────────── */
  if (useGL) {
    homeT = 1;
    initGL();
    requestAnimationFrame(frame);
    intro();
  } else {
    stills[0].classList.add('is-active');
    html.classList.add('is-ready');
    if (mobile && !reduced) initTouch();
    phase = 'home';
    // el muelle de escritorio sin WebGL no anima nada; los tweens van con su propio bucle
    if (!mobile || reduced) {
      const loop = (now) => { runTweens(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    const h = hashIndex();
    if (h >= 0) { goTo(h); openCase(h); } else if (location.hash === '#sobre-mi') openAbout();
  }
  // en móvil, los tweens (apertura, sobre mí) necesitan que el bucle esté vivo
  if (mobile && !reduced) {
    const origTween = tween;
    void origTween;
    setInterval(() => { if (tweens.size && window.__kick) window.__kick(); }, 50);
  }
}
