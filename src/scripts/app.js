import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from 'ogl';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
const toCss = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
const mix3 = (a, b, t) => a.map((v, k) => lerp(v, b[k], t));
const LIGHT = hex('#e6e3dc');

const vert = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uBend;
uniform float uWave;
uniform vec2 uSize;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float sx = sin(uv.x * 3.14159265);
  float sy = sin(uv.y * 3.14159265);
  p.z += (sx * 0.65 + sy * 0.35) * uBend;
  p.y += sx * uWave / uSize.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const frag = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uImg;
uniform vec2 uSize;
uniform vec3 uTint;
uniform float uTintAmt;
uniform float uAlpha;
uniform float uReady;
uniform float uZoom;
varying vec2 vUv;
void main() {
  vec2 r = vec2(
    min((uSize.x / uSize.y) / (uImg.x / uImg.y), 1.0),
    min((uSize.y / uSize.x) / (uImg.y / uImg.x), 1.0)
  );
  vec2 uv = vec2(vUv.x * r.x + (1.0 - r.x) * 0.5, vUv.y * r.y + (1.0 - r.y) * 0.5);
  uv = (uv - 0.5) / uZoom + 0.5;
  vec3 c = texture2D(tMap, uv).rgb;
  vec3 col = mix(uTint * 1.2 + 0.04, c, uReady);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 duo = mix(uTint * 0.72, mix(uTint, vec3(1.0), 0.7), l);
  col = mix(col, duo, uTintAmt);
  gl_FragColor = vec4(col, uAlpha);
}`;

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

export function start() {
  const data = JSON.parse($('#gl-data').textContent);
  const n = data.length;
  const body = document.body;
  const slides = $$('.slide');
  const cases = $$('.case');
  const ticks = $$('.ticks button');
  const about = $('.about');
  const countEl = $('[data-count]');
  const hit = $('[data-hit]');
  const colors = data.map((d) => hex(d.bg));
  const inks = data.map((d) => hex(d.ink));

  const mqMobile = matchMedia('(max-width: 820px)');
  const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = mqMobile.matches;
  const useGL = !mobile && !mqReduced.matches && webglOk();
  const mode = useGL ? 'gl' : mobile ? 'mobile' : 'dom';
  document.documentElement.classList.add(`is-${mode}`);
  if (useGL) document.documentElement.classList.add('is-gl');
  [mqMobile, mqReduced].forEach((mq) => mq.addEventListener('change', () => location.reload()));

  let active = -1;
  let target = 0;
  let cur = useGL ? -0.85 : 0;
  let vel = 0;
  let openIdx = -1; // proyecto abierto
  let openP = 0;
  let openFrom = 0, openTo = 0, openT0 = 0, openDur = 1;
  let aboutOpen = false;
  let pushed = false;
  let hoverP = 0, hoverT = 0;
  let L = {};

  // ── maquetación compartida (WebGL y DOM) ──
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    let pw = clamp(vw * 0.37, 360, 680);
    let ph = pw / 1.6;
    if (ph > vh * 0.47) { ph = vh * 0.47; pw = ph * 1.6; }
    const cx = vw * 0.665, cy = vh * 0.5;
    L = { vw, vh, pw, ph, cx, cy, spacing: ph * 1.2 };
    const s = body.style;
    s.setProperty('--px', `${cx - pw / 2}px`);
    s.setProperty('--py', `${cy}px`);
    s.setProperty('--pw', `${pw}px`);
    s.setProperty('--ph', `${ph}px`);
    Object.assign(hit.style, { left: `${cx - pw / 2}px`, top: `${cy - ph / 2}px`, width: `${pw}px`, height: `${ph}px` });
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    ticks.forEach((t, k) => (k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
    countEl.textContent = String(i + 1).padStart(2, '0');
    if (!useGL) paint(i);
  }

  function paint(f) {
    const a = Math.floor(clamp(f, 0, n - 1)), b = Math.min(n - 1, a + 1), t = clamp(f, 0, n - 1) - a;
    let bg = mix3(colors[a], colors[b], t);
    if (!useGL && openIdx >= 0) bg = LIGHT;
    body.style.setProperty('--bg', toCss(bg));
    body.style.setProperty('--ink', toCss(mix3(inks[a], inks[b], t)));
    return bg;
  }

  function go(i) {
    i = clamp(i, 0, n - 1);
    if (mode === 'mobile') {
      $('.slides').scrollTo({ left: i * innerWidth, behavior: mqReduced.matches ? 'auto' : 'smooth' });
    } else {
      target = i;
      if (!useGL) setActive(i);
    }
  }

  // ── detalle y "sobre mí" ──
  function openCase(i, { instant = false, fromHistory = false } = {}) {
    if (aboutOpen) closeAbout(true);
    if (openIdx === i) return;
    openIdx = i;
    if (mode !== 'mobile') { target = cur = i; setActive(i); }
    const el = cases[i];
    cases.forEach((c) => c.classList.remove('is-open', 'is-shown'));
    el.classList.add('is-open');
    el.scrollTop = 0;
    body.classList.add('in-case');
    if (!fromHistory) { history.pushState({ c: i }, '', `#${el.id}`); pushed = true; }
    if (!useGL) paint(i);
    animateOpen(1, instant ? 0 : 1.15);
    setTimeout(() => el.classList.add('is-shown'), instant || !useGL ? 20 : 480);
    el.querySelector('h2').setAttribute('tabindex', '-1');
    el.querySelector('h2').focus({ preventScroll: true });
  }

  function closeCase() {
    if (openIdx < 0) return;
    const el = cases[openIdx];
    el.classList.remove('is-shown');
    body.classList.remove('in-case');
    const i = openIdx;
    openIdx = -1;
    if (!useGL) paint(i);
    animateOpen(0, useGL ? 1.05 : 0);
    setTimeout(() => { if (openIdx !== i) el.classList.remove('is-open'); }, useGL ? 700 : 0);
    slides[i]?.querySelector('.slide-open')?.focus({ preventScroll: true });
  }

  function animateOpen(to, dur) {
    openFrom = openP; openTo = to; openT0 = performance.now(); openDur = Math.max(dur, 0.0001) * 1000;
    if (!dur) openP = to;
  }

  function openAbout({ fromHistory = false } = {}) {
    if (openIdx >= 0) { const el = cases[openIdx]; el.classList.remove('is-open', 'is-shown'); openIdx = -1; openP = 0; openTo = 0; body.classList.remove('in-case'); paint(active); }
    aboutOpen = true;
    about.classList.add('is-open');
    body.classList.add('in-about');
    requestAnimationFrame(() => requestAnimationFrame(() => about.classList.add('is-shown')));
    if (!fromHistory) { history.pushState({ a: 1 }, '', '#sobre-mi'); pushed = true; }
    $('#about-t').setAttribute('tabindex', '-1');
    $('#about-t').focus({ preventScroll: true });
  }

  function closeAbout(instant = false) {
    if (!aboutOpen) return;
    aboutOpen = false;
    about.classList.remove('is-shown');
    body.classList.remove('in-about');
    setTimeout(() => { if (!aboutOpen) about.classList.remove('is-open'); }, instant || mqReduced.matches ? 0 : 900);
  }

  function back() {
    if (pushed) history.back();
    else { closeCase(); closeAbout(); history.replaceState(null, '', location.pathname); }
  }

  function fromHash(instant) {
    const id = decodeURIComponent(location.hash.slice(1));
    const ci = cases.findIndex((c) => c.id === id);
    if (ci >= 0) {
      if (mode === 'mobile') $('.slides').scrollLeft = ci * innerWidth;
      openCase(ci, { instant, fromHistory: true });
    } else if (id === 'sobre-mi') { closeCase(); openAbout({ fromHistory: true }); }
    else { closeCase(); closeAbout(); }
  }

  addEventListener('popstate', () => { pushed = false; fromHash(false); });

  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) {
      e.preventDefault();
      if (dragMoved) return;
      openCase(cases.findIndex((c) => c.id === o.dataset.open));
      return;
    }
    if (e.target.closest('[data-about]')) { e.preventDefault(); openAbout(); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); back(); return; }
    if (e.target.closest('[data-home]') && openIdx < 0 && !aboutOpen) { e.preventDefault(); go(0); return; }
    const g = e.target.closest('[data-go]');
    if (g) go(+g.dataset.go);
  });

  hit.addEventListener('click', () => { if (!dragMoved && active >= 0) openCase(active); });
  hit.addEventListener('pointerenter', () => (hoverT = 1));
  hit.addEventListener('pointerleave', () => (hoverT = 0));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (openIdx >= 0 || aboutOpen) back(); return; }
    if (openIdx >= 0 || aboutOpen) return;
    if (e.target.closest && e.target.closest('input,textarea')) return;
    const next = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const prev = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if (next || prev) { e.preventDefault(); go(Math.round(mode === 'mobile' ? active : target) + (next ? 1 : -1)); }
    if (e.key === 'Enter' && e.target === body) openCase(active);
  });

  // ── entrada: rueda y arrastre (escritorio) ──
  let snapTimer = 0;
  let wheelLock = 0;
  let dragMoved = false;
  if (mode !== 'mobile') {
    addEventListener('wheel', (e) => {
      if (openIdx >= 0 || aboutOpen) return;
      e.preventDefault();
      let d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 16;
      if (!useGL) {
        const now = performance.now();
        if (Math.abs(d) < 4 || now < wheelLock) return;
        wheelLock = now + 650;
        go(active + Math.sign(d));
        return;
      }
      target = clamp(target + d * 0.0019, -0.35, n - 1 + 0.35);
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => (target = clamp(Math.round(target), 0, n - 1)), 140);
    }, { passive: false });

    let down = null;
    addEventListener('pointerdown', (e) => {
      if (openIdx >= 0 || aboutOpen || e.button !== 0) return;
      if (e.target.closest('a,button:not([data-hit])')) return;
      down = { x: e.clientX, y: e.clientY, t: target, last: e.clientY, lastX: e.clientX, v: 0, time: performance.now() };
      dragMoved = false;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!dragMoved && Math.hypot(dx, dy) > 6) { dragMoved = true; document.documentElement.classList.add('is-dragging'); }
      if (!dragMoved) return;
      const now = performance.now();
      const step = Math.abs(dy) >= Math.abs(dx) ? e.clientY - down.last : (e.clientX - down.lastX) * 0.8;
      down.v = lerp(down.v, step / Math.max(1, now - down.time) * 16, 0.4);
      down.last = e.clientY; down.lastX = e.clientX; down.time = now;
      const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx * 0.8;
      if (useGL) target = clamp(down.t - d / L.spacing, -0.35, n - 1 + 0.35);
    });
    const up = (e) => {
      if (!down) return;
      const d = Math.abs(e.clientY - down.y) >= Math.abs(e.clientX - down.x) ? e.clientY - down.y : (e.clientX - down.x) * 0.8;
      if (dragMoved) {
        if (useGL) target = clamp(Math.round(target - down.v * 10 / L.spacing), 0, n - 1);
        else if (Math.abs(d) > 40) go(active - Math.sign(d));
      }
      down = null;
      document.documentElement.classList.remove('is-dragging');
      setTimeout(() => (dragMoved = false), 0);
    };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    if (useGL) body.style.touchAction = 'none';
  } else {
    // móvil: carrusel horizontal nativo con scroll-snap
    const sc = $('.slides');
    const onScroll = () => {
      const f = sc.scrollLeft / sc.clientWidth;
      paint(f);
      setActive(clamp(Math.round(f), 0, n - 1));
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  layout();
  addEventListener('resize', () => { layout(); if (gl) resizeGL(); });

  // ── WebGL ──
  let gl = null, renderer, camera, scene, meshes = [];
  function resizeGL() {
    renderer.setSize(L.vw, L.vh);
    camera.perspective({ aspect: L.vw / L.vh });
    camera.position.z = L.vh / 2 / Math.tan((camera.fov * Math.PI) / 360);
  }

  if (useGL) {
    renderer = new Renderer({ canvas: $('.gl'), dpr: Math.min(devicePixelRatio, 2), alpha: true, antialias: true, premultipliedAlpha: false });
    gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    camera = new Camera(gl, { fov: 40, near: 10, far: 6000 });
    scene = new Transform();
    resizeGL();
    const geo = new Plane(gl, { width: 1, height: 1, widthSegments: 40, heightSegments: 24 });
    meshes = data.map((d, i) => {
      const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
      const program = new Program(gl, {
        vertex: vert, fragment: frag, transparent: true, depthTest: false, cullFace: null,
        uniforms: {
          tMap: { value: texture }, uImg: { value: [d.w, d.h] }, uSize: { value: [1, 1] }, uTint: { value: colors[i] },
          uTintAmt: { value: 0 }, uAlpha: { value: 0 }, uReady: { value: 0 }, uZoom: { value: 1 }, uBend: { value: 0 }, uWave: { value: 0 },
        },
      });
      const mesh = new Mesh(gl, { geometry: geo, program });
      mesh.setParent(scene);
      return { mesh, program, texture, ready: 0, loaded: false, src: d.tex };
    });
    const load = (i) => new Promise((res) => {
      const m = meshes[i];
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { m.texture.image = img; m.loaded = true; res(); };
      img.onerror = res;
      img.src = m.src;
    });
    load(0).then(() => Promise.all(meshes.slice(1).map((_, k) => load(k + 1))));
  }

  // ── bucle ──
  let last = performance.now();
  let intro = useGL ? 0 : 1;
  function frame(now) {
    const dt = Math.min(64, now - last) / 16.667;
    last = now;
    if (openTo !== openP) {
      const t = clamp((now - openT0) / openDur, 0, 1);
      openP = lerp(openFrom, openTo, easeInOut(t));
      if (t >= 1) openP = openTo;
    }
    if (!useGL) { requestAnimationFrame(frame); return; }

    intro = Math.min(1, intro + 0.016 * dt);
    const prev = cur;
    cur = lerp(cur, target, 1 - Math.pow(1 - 0.075, dt));
    if (Math.abs(target - cur) < 0.0005) cur = target;
    vel = lerp(vel, (cur - prev) / dt, 0.25);
    hoverP = lerp(hoverP, hoverT, 1 - Math.pow(1 - 0.1, dt));
    setActive(clamp(Math.round(cur), 0, n - 1));

    const carouselBg = paint(cur);
    const bg = mix3(carouselBg, LIGHT, openP);
    body.style.setProperty('--bg', toCss(bg));

    const velPx = vel * L.spacing;
    const motion = clamp(Math.abs(velPx) / 36, 0, 1);
    const e = openP;
    const shownIdx = openIdx >= 0 ? openIdx : active;
    let R = null;
    if (e > 0 && shownIdx >= 0) {
      const r = cases[shownIdx].querySelector('[data-media]').getBoundingClientRect();
      if (r.width) R = { x: r.left + r.width / 2 - L.vw / 2, y: L.vh / 2 - (r.top + r.height / 2), w: r.width, h: r.height };
    }

    meshes.forEach((m, i) => {
      const off = i - cur;
      const ao = Math.abs(off);
      const near = Math.min(ao, 1);
      const isActive = i === active;
      const s = (1 - near * 0.07) * (isActive ? 1 + hoverP * 0.025 : 1);
      let x = L.cx - L.vw / 2 + near * L.pw * 0.03;
      let y = -off * L.spacing;
      let z = -near * 140 - motion * 60;
      let w = L.pw * s, h = L.ph * s;
      let rx = clamp(off, -1.6, 1.6) * 0.24;
      let ry = -0.2;
      let rz = 0.02 + off * 0.015;
      let bend = 24 + Math.min(ao, 1.6) * 46 + motion * 50 - (isActive ? hoverP * 18 : 0);
      let wave = clamp(-velPx * 2.4, -150, 150);
      let tint = Math.max(clamp(ao * 1.15, 0, 0.88), motion * 0.7);
      let zoom = 1 + (isActive ? hoverP * 0.05 : 0);
      let alpha = clamp(2.4 - ao, 0, 1) * intro;

      if (i === shownIdx && R) {
        x = lerp(x, R.x, e); y = lerp(y, R.y, e); z = lerp(z, 0, e);
        w = lerp(w, R.w, e); h = lerp(h, R.h, e);
        rx = lerp(rx, 0, e); ry = lerp(ry, 0, e); rz = lerp(rz, 0, e);
        bend = lerp(bend, 0, e) + Math.sin(e * Math.PI) * 70;
        wave = lerp(wave, 0, e);
        tint = lerp(tint, 0, e);
        zoom = lerp(zoom, 1, e);
      } else {
        alpha *= 1 - e;
        y += (off >= 0 ? -1 : 1) * e * 120;
      }

      m.ready = Math.min(1, m.ready + (m.loaded ? 0.05 * dt : 0));
      const u = m.program.uniforms;
      u.uSize.value = [w, h];
      u.uTint.value = carouselBg;
      u.uTintAmt.value = tint;
      u.uAlpha.value = alpha;
      u.uReady.value = m.ready;
      u.uZoom.value = zoom;
      u.uBend.value = bend;
      u.uWave.value = wave;
      m.mesh.visible = alpha > 0.002;
      m.mesh.position.set(x, y, z);
      m.mesh.rotation.set(rx, ry, rz);
      m.mesh.scale.set(w, h, 1);
    });

    // los planos se dibujan del más lejano al más cercano
    scene.children.sort((a, b) => a.position.z - b.position.z);
    if (!aboutOpen || about.classList.contains('is-shown') === false) renderer.render({ scene, camera, sort: false });
    requestAnimationFrame(frame);
  }

  if (location.hash) fromHash(true);
  setActive(clamp(Math.round(Math.max(0, cur)), 0, n - 1));
  if (useGL && openIdx < 0) target = 0;
  requestAnimationFrame(frame);
}
