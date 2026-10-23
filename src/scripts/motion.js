// Apila las fichas y suaviza la rueda.
// Medido en cydstumpel.nl (oct 2026, rueda de 900px):
// el scroll no salta; se asienta en 1s con 1 - 2^(-10t)
// (117px a 16ms, 549 a 122ms, 820 a 341ms, 900 a 1s).
// No hay scroll-snap. El nombre queda fijo y el bloque siguiente lo tapa.
// El giro de ficha es transform 1s cubic-bezier(.25, 1, .5, 1).
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function syncFlip(flip, on) {
  const front = flip.querySelector('.face-front');
  const back = flip.querySelector('.face-back');
  if (front) front.inert = on;
  if (back) back.inert = !on;
  flip.querySelectorAll('[data-turn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function openHash() {
  const id = decodeURIComponent(location.hash.replace('#', ''));
  if (!id) return;
  const sheet = document.getElementById(id);
  if (!sheet?.hasAttribute('data-sheet')) return;
  const flip = sheet.querySelector('[data-flip]');
  if (!flip || flip.classList.contains('is-turned')) return;
  flip.classList.add('is-turned');
  syncFlip(flip, true);
  const live = document.getElementById('live');
  if (live) live.textContent = `Reverso de ${flip.dataset.name || 'la ficha'}`;
}

export function start() {
  const root = document.documentElement;
  const sheets = [...document.querySelectorAll('[data-sheet]')];
  const flips = [...document.querySelectorAll('[data-flip]')];
  flips.forEach((flip) => syncFlip(flip, flip.classList.contains('is-turned')));

  document.addEventListener('click', (event) => {
    const turn = event.target.closest('[data-turn]');
    if (!turn) return;
    const flip = turn.closest('[data-flip]');
    if (!flip) return;
    const on = flip.classList.toggle('is-turned');
    syncFlip(flip, on);
    const live = document.getElementById('live');
    if (live) {
      const name = flip.dataset.name || 'la ficha';
      live.textContent = on ? `Reverso de ${name}` : `Portada de ${name}`;
    }
  });

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-copy]');
    if (!btn) return;
    const label = btn.querySelector('.btn-label');
    const email = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    if (!label) return;
    if (btn._t) clearTimeout(btn._t);
    if (!btn.dataset.label) btn.dataset.label = label.textContent;
    label.textContent = 'Copiado';
    btn._t = setTimeout(() => {
      label.textContent = btn.dataset.label;
    }, 1600);
  });

  const menu = document.getElementById('menu');
  const opener = document.querySelector('[data-menu]');
  if (menu && opener) {
    opener.addEventListener('click', () => {
      menu.showModal();
      opener.setAttribute('aria-expanded', 'true');
    });
    menu.addEventListener('close', () => opener.setAttribute('aria-expanded', 'false'));
    menu.querySelectorAll('a, [data-close]').forEach((el) => {
      el.addEventListener('click', () => {
        if (menu.open) menu.close();
      });
    });
  }

  const pause = document.querySelector('[data-pause-mq]');
  if (pause) {
    pause.addEventListener('click', () => {
      const on = document.body.classList.toggle('mq-paused');
      pause.setAttribute('aria-pressed', String(on));
      const label = pause.querySelector('.btn-label');
      if (label) label.textContent = on ? 'Reanudar rótulos' : 'Pausar rótulos';
    });
  }

  const driftFallback = !reduce() && !CSS.supports('animation-timeline', 'scroll()');
  const track = document.querySelector('.hero-track');
  const rail = [...document.querySelectorAll('.rail a')];
  const mast = document.querySelector('.mast');
  const stage = document.querySelector('.stage');

  const layout = () => {
    const vh = window.innerHeight || 1;
    const calm = reduce();
    if (mast && stage) {
      const bar = document.querySelector('.bar');
      const limit = (bar ? bar.getBoundingClientRect().height : 54) + 1;
      mast.classList.toggle('is-covered', stage.getBoundingClientRect().top <= limit);
    }
    sheets.forEach((sheet, index) => {
      const plate = sheet.querySelector('.plate');
      const next = sheets[index + 1];
      if (!plate) return;
      if (calm || !next) {
        plate.style.transform = '';
        plate.style.setProperty('--stack', '0');
        return;
      }
      const raw = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / vh));
      plate.style.transform = `scale(${(1 - raw * 0.08).toFixed(4)})`;
      plate.style.setProperty('--stack', raw.toFixed(4));
    });

    if (driftFallback && track) {
      const p = Math.min(1, Math.max(0, window.scrollY / (vh * 0.7)));
      const eased = 1 - (1 - p) ** 3;
      track.style.transform = `translateX(${(-22 * eased).toFixed(2)}vw)`;
    }

    const stack = document.querySelector('.stack');
    if (stack) {
      const rect = stack.getBoundingClientRect();
      root.classList.toggle('is-in-work', rect.top < vh * 0.72 && rect.bottom > vh * 0.28);
    }

    const mark = vh * 0.42;
    let current = 0;
    sheets.forEach((sheet, index) => {
      if (sheet.getBoundingClientRect().top <= mark) current = index;
    });
    rail.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      layout();
      ticking = false;
    });
  };

  smoothWheel();

  layout();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', openHash);
  openHash();
}

// Cada evento de rueda reinicia un segundo desde la posición actual
// hacia el nuevo destino. La curva es la misma que usa Cyd en Lenis.
function smoothWheel() {
  const duration = 1000;
  const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  let current = window.scrollY;
  let target = current;
  let from = current;
  let to = current;
  let started = 0;
  let running = false;
  let fromUs = false;
  let frame = 0;

  const limit = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const pixels = (dy, mode) => {
    if (mode === 1) return dy * 16;
    if (mode === 2) return dy * window.innerHeight;
    return dy;
  };

  const tick = (now) => {
    const t = Math.min(1, (now - started) / duration);
    current = from + (to - from) * ease(t);
    fromUs = true;
    window.scrollTo(0, current);
    fromUs = false;
    if (t < 1) frame = requestAnimationFrame(tick);
    else {
      running = false;
      current = to;
    }
  };

  const go = (next) => {
    target = Math.max(0, Math.min(limit(), next));
    from = current;
    to = target;
    started = performance.now();
    if (!running) {
      running = true;
      frame = requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
    current = target = window.scrollY;
  };

  if (!reduce()) {
    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey) return;
      if (document.querySelector('dialog[open]')) return;
      const scroller = event.target.closest?.('.face');
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
        const top = scroller.scrollTop <= 0;
        const bottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
        if (!(top && event.deltaY < 0) && !(bottom && event.deltaY > 0)) return;
      }
      event.preventDefault();
      go(target + pixels(event.deltaY, event.deltaMode));
    }, { passive: false });
  }

  window.addEventListener('scroll', () => {
    if (fromUs || running) return;
    current = target = window.scrollY;
  }, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stop();
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || reduce()) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    event.preventDefault();
    let y = 0;
    let node = el;
    while (node) {
      y += node.offsetTop;
      node = node.offsetParent;
    }
    go(y);
    history.pushState(null, '', `#${id}`);
    openHash();
  });

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', stop);
}
