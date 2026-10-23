// Apila las fichas y mueve el nombre.
// El nombre queda fijo: en los primeros 50vh se corre hasta -40vw.
// La franja superior lo deja ver; el papel tapa el resto.
// La rueda persigue el destino con una constante de ~90ms, sin reiniciar
// un ease de un segundo en cada tick. El giro de ficha sigue en 1s.
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

  const tracks = [...document.querySelectorAll('.hero-track')];
  const rail = [...document.querySelectorAll('.rail a')];
  const cards = sheets.map((sheet, index) => ({
    sheet,
    plate: sheet.querySelector('.plate'),
    next: sheets[index + 1] || null,
  }));

  const stack = document.querySelector('.stack');
  let vw = 1;
  let vh = 1;
  let stackStart = Infinity;
  let lastX = null;
  let lastRail = -1;
  const lastScale = new Map();

  const clearScales = () => {
    cards.forEach(({ plate }) => {
      if (!plate || lastScale.get(plate) === 1) return;
      plate.style.transform = '';
      lastScale.set(plate, 1);
    });
  };

  const measure = () => {
    vw = window.innerWidth || 1;
    vh = window.innerHeight || 1;
    lastX = null;
    if (stack) stackStart = stack.getBoundingClientRect().top + window.scrollY;
  };

  // Solo transform. El recorte del nombre lo hace la franja fija,
  // así el scroll no repinta la página con clip-path ni lee layout.
  const paint = () => {
    const calm = reduce();
    const y = window.scrollY;
    if (calm) {
      if (lastX !== 0) {
        tracks.forEach((track) => { track.style.transform = ''; });
        lastX = 0;
      }
    } else {
      const p = Math.min(1, Math.max(0, y / (vh * 0.5)));
      const eased = 1 - (1 - p) ** 4;
      const x = Math.round(-0.4 * vw * eased * 10) / 10;
      if (x !== lastX) {
        const value = `translate3d(${x}px,0,0)`;
        tracks.forEach((track) => { track.style.transform = value; });
        lastX = x;
      }
    }

    // En la portada no hay nada que medir: el nombre ya se movió con un transform.
    if (y + vh * 0.9 < stackStart) {
      clearScales();
      if (lastRail !== 0) {
        rail.forEach((link, index) => {
          if (index === 0) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
        lastRail = 0;
      }
      return;
    }

    const mark = vh * 0.42;
    let current = 0;
    const tops = cards.map((card) => {
      const top = card.sheet.getBoundingClientRect().top;
      if (top <= mark) current += 1;
      return top;
    });
    current = Math.max(0, current - 1);

    if (current !== lastRail) {
      rail.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      lastRail = current;
    }

    cards.forEach((card, index) => {
      const { plate, next } = card;
      if (!plate) return;
      const nextTop = next ? tops[index + 1] : null;
      if (calm || nextTop == null) {
        if (lastScale.get(plate) !== 1) {
          plate.style.transform = '';
          lastScale.set(plate, 1);
        }
        return;
      }
      const raw = Math.min(1, Math.max(0, 1 - nextTop / vh));
      const scale = Math.round((1 - raw * 0.08) * 1000) / 1000;
      if (lastScale.get(plate) === scale) return;
      lastScale.set(plate, scale);
      plate.style.transform = scale === 1 ? '' : `scale(${scale})`;
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      paint();
      ticking = false;
    });
  };

  smoothWheel();

  measure();
  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  window.addEventListener('hashchange', openHash);
  openHash();
}

// La rueda sigue al dedo con una constante corta (~90ms).
// No reinicia un ease de 1s en cada tick: eso iba siempre por la parte
// lenta de la curva y se sentía atrasado. El tacto no se intercepta.
function smoothWheel() {
  const tau = 90;
  let current = window.scrollY;
  let target = current;
  let running = false;
  let fromUs = false;
  let last = 0;
  let frame = 0;
  let max = 0;

  const limits = () => {
    max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  };
  const pixels = (dy, mode) => {
    if (mode === 1) return dy * 16;
    if (mode === 2) return dy * window.innerHeight;
    return dy;
  };
  const clamp = (y) => Math.max(0, Math.min(max, y));

  const tick = (now) => {
    const dt = Math.min(34, last ? now - last : 16);
    last = now;
    const k = 1 - Math.exp(-dt / tau);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      running = false;
    }
    fromUs = true;
    window.scrollTo(0, current);
    fromUs = false;
    if (running) frame = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (running) return;
    running = true;
    last = 0;
    frame = requestAnimationFrame(tick);
  };

  const go = (next) => {
    limits();
    target = clamp(next);
    kick();
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
    current = target = window.scrollY;
  };

  if (!reduce()) {
    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey) return;
      const menu = document.getElementById('menu');
      if (menu?.open) return;
      const flip = event.target.closest?.('[data-flip]');
      const scroller = event.target.closest?.('.face')
        || flip?.querySelector('.face:not([inert])');
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
        if (event.target.closest?.('.flip-hit') && !(event.target.closest?.('.face'))) {
          const top = scroller.scrollTop <= 0;
          const bottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
          if (!(top && event.deltaY < 0) && !(bottom && event.deltaY > 0)) {
            scroller.scrollTop += pixels(event.deltaY, event.deltaMode);
            event.preventDefault();
            return;
          }
        }
        const top = scroller.scrollTop <= 0;
        const bottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
        if (!(top && event.deltaY < 0) && !(bottom && event.deltaY > 0)) return;
      }
      event.preventDefault();
      if (!running) limits();
      target = clamp(target + pixels(event.deltaY, event.deltaMode));
      kick();
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
    const y = el.getBoundingClientRect().top + window.scrollY;
    go(y);
    history.pushState(null, '', `#${id}`);
    openHash();
  });

  window.addEventListener('resize', limits);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', stop);
}
