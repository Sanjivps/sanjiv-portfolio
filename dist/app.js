'use strict';
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const motionToggle = document.querySelector('#motion-toggle');
const motionButtons = [motionToggle, ...document.querySelectorAll('[data-motion]')];
const motionListeners = [];
let paused = reducedMotion.matches;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const hash = (a, b) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// ---------- Theme ----------
const invertButton = document.querySelector('#invert');
const currentTheme = () => root.dataset.theme || (darkScheme.matches ? 'dark' : 'light');
const syncTheme = () => invertButton.setAttribute('aria-pressed', String(currentTheme() === 'dark'));
invertButton.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('portfolio-theme', next); } catch {}
  syncTheme();
});
darkScheme.addEventListener('change', syncTheme);
syncTheme();

// ---------- Motion ----------
function syncMotion() {
  document.body.classList.toggle('motion-paused', paused);
  for (const button of motionButtons) button.setAttribute('aria-pressed', String(paused));
  motionToggle.textContent = paused ? '[ Resume motion ]' : '[ Pause motion ]';
  for (const listener of motionListeners) listener();
}
for (const button of motionButtons) button.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', event => { paused = event.matches; syncMotion(); });
syncMotion();

document.querySelector('#year').textContent = new Date().getFullYear();

// ---------- Text scramble ----------
// Each character decodes on its own schedule through dotted shade blocks and
// dashes. Spaces never change, so justified and monospace lines hold still.
const SCRAMBLE_GLYPHS = ['░', '-', '-'];
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const pickGlyph = () => SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
function scramble(element, duration = 1400) {
  if (paused || element.dataset.scrambling) return;
  element.dataset.scrambling = 'true';
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.data.trim()) nodes.push(walker.currentNode);
  const items = nodes.map(node => {
    const span = document.createElement('span');
    node.replaceWith(span);
    const chars = [...node.data].map(c => ({ c, end: duration * (.2 + Math.random() * .8), glyph: pickGlyph() }));
    return { node, span, chars };
  });
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    let done = true;
    for (const item of items) {
      let html = '';
      for (const char of item.chars) {
        if (char.c === ' ' || elapsed >= char.end) { html += ESCAPES[char.c] || char.c; continue; }
        done = false;
        if (Math.random() < .08) char.glyph = pickGlyph();
        html += char.glyph === '░' ? '<i class="shade"></i>' : char.glyph;
      }
      item.span.innerHTML = html;
    }
    if (!done) { requestAnimationFrame(frame); return; }
    for (const item of items) item.span.replaceWith(item.node);
    delete element.dataset.scrambling;
  }
  frame(start);
}
const headingObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    headingObserver.unobserve(entry.target);
    scramble(entry.target, 1300);
  }
});
for (const heading of document.querySelectorAll('[data-scramble]:not([data-scramble="intro"])')) headingObserver.observe(heading);
for (const row of document.querySelectorAll('.row')) {
  const title = row.querySelector('[data-hover-scramble]');
  row.addEventListener('mouseenter', () => scramble(title, 450));
}

// ---------- Expanders ----------
function bindExpander(button, panel, owner) {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    owner.classList.toggle('selected', open);
  });
}
for (const toggle of document.querySelectorAll('.toggle')) {
  bindExpander(toggle, document.getElementById(toggle.getAttribute('aria-controls')), toggle.closest('.row'));
}
for (const service of document.querySelectorAll('.service')) {
  bindExpander(service.querySelector('button'), service.querySelector('.service-description'), service);
}

// ---------- Navigation ----------
const navigationLinks = [...document.querySelectorAll('.command-bar a')];
const sections = [...document.querySelectorAll('main > section')];
function updateCurrentSection() {
  const threshold = window.innerHeight * .35;
  let current = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top <= threshold) current = section;
  for (const link of navigationLinks) {
    if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { updateCurrentSection(); scrollPending = false; });
}, { passive: true });
updateCurrentSection();

// Single-letter shortcuts leave browser shortcuts and editable fields alone.
document.addEventListener('keydown', event => {
  if (intro.active) { skipIntro(); return; }
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat ||
      event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  const command = [...document.querySelectorAll('[data-key]')].find(item => item.dataset.key === key);
  if (command) { event.preventDefault(); command.click(); }
});

document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('sanjivpsaravanan@gmail.com');
    status.textContent = 'Email copied to clipboard.';
  } catch {
    status.textContent = 'Email: sanjivpsaravanan@gmail.com — select to copy.';
  }
});

// ---------- ASCII scene ----------
// portrait-ascii.png packs three 460px grayscale layers, pre-toned for ASCII:
// R is the person with local contrast boosted, G the street with the person
// painted out (dimmed so the subject reads), B the person's mask.
// Rendering samples them separately, so the person can breathe, sway and turn
// their head in front of a background that shifts, twinkles and rains.
const SIZE = 460;
const scene = new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, SIZE, SIZE).data;
    const lum = new Float32Array(SIZE * SIZE);
    const plate = new Float32Array(SIZE * SIZE);
    const mask = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < lum.length; i++) {
      lum[i] = data[i * 4] / 255;
      plate[i] = data[i * 4 + 1] / 255;
      mask[i] = data[i * 4 + 2] / 255;
    }
    // A rim light along the silhouette keeps the dark suit readable.
    const rim = new Float32Array(SIZE * SIZE);
    for (let y = 1; y < SIZE - 1; y++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const i = y * SIZE + x;
        rim[i] = clamp(Math.hypot(mask[i + 1] - mask[i - 1], mask[i + SIZE] - mask[i - SIZE]) * 1.6);
      }
    }
    resolve({ lum: blur(lum), plate: blur(plate), mask, rim: blur(blur(rim)) });
  };
  image.onerror = reject;
  image.src = 'assets/portrait-ascii.png';
});
function blur(source) {
  const out = new Float32Array(source.length);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let sum = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= SIZE) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= SIZE) continue;
          sum += source[yy * SIZE + xx];
          count++;
        }
      }
      out[y * SIZE + x] = sum / count;
    }
  }
  return out;
}
function sample(layer, x, y) {
  x = clamp(x, 0, SIZE - 1.001);
  y = clamp(y, 0, SIZE - 1.001);
  const ix = x | 0, iy = y | 0, dx = x - ix, dy = y - iy, i = iy * SIZE + ix;
  return (layer[i] * (1 - dx) + layer[i + 1] * dx) * (1 - dy) +
    (layer[i + SIZE] * (1 - dx) + layer[i + SIZE + 1] * dx) * dy;
}
const measureCanvas = document.createElement('canvas').getContext('2d');
function characterRatio(element) {
  measureCanvas.font = '100px ' + getComputedStyle(element).fontFamily;
  return measureCanvas.measureText('MMMMMMMMMM').width / 1000 || .6;
}

class AsciiView {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.ramp = options.ramp;
    this.drops = [];
    this.glitch = { until: 0, next: 4, top: 0, bottom: 0, shift: 0 };
    new ResizeObserver(() => this.layout()).observe(element);
    this.layout();
  }
  layout() {
    const width = this.element.clientWidth;
    const height = this.element.clientHeight;
    if (!width || !height) return;
    this.ratio = characterRatio(this.element);
    this.columns = this.options.columns(width);
    const fontSize = width / (this.columns * this.ratio);
    this.element.style.fontSize = fontSize + 'px';
    this.rows = Math.max(1, this.options.fill ? Math.ceil(height / fontSize) : Math.floor(height / fontSize));
    this.codes = new Uint16Array(this.columns * this.rows);
    this.personMask = new Float32Array(this.columns * this.rows);
    const dropCount = Math.round(this.columns * this.rows * this.options.rain);
    this.drops = Array.from({ length: dropCount }, () => this.spawnDrop(true));
    this.dirty = true;
  }
  spawnDrop(anywhere) {
    return {
      x: Math.random() * (this.columns + this.rows * .45),
      y: anywhere ? Math.random() * this.rows : -Math.random() * this.rows * .3,
      speed: 26 + Math.random() * 26,
      length: 1 + Math.floor(Math.random() * 3),
      front: Math.random() < .12,
    };
  }
  // state: time, delta, zoom, focusX/Y (image px), lookX/Y (-1..1),
  // lens {x, y, amount} in cells, reveal (seconds since reveal, or Infinity)
  render(scene, state) {
    const { columns, rows, ratio, codes, personMask, ramp } = this;
    if (!columns) return;
    const { lum, plate, mask, rim } = scene;
    const t = state.time;
    const aspect = columns * ratio / rows;
    let viewWidth = (aspect >= 1 ? SIZE : SIZE * aspect) / state.zoom;
    let viewHeight = viewWidth / aspect;
    if (viewHeight > SIZE / state.zoom) { viewHeight = SIZE / state.zoom; viewWidth = viewHeight * aspect; }
    const left = clamp(state.focusX - viewWidth / 2, 0, SIZE - viewWidth);
    const top = clamp(state.focusY - viewHeight / 2, 0, SIZE - viewHeight);
    const stepX = viewWidth / columns;
    const stepY = viewHeight / rows;

    // Low-frequency, independent motion: weight shift, breathing, head tilt.
    const lookX = state.lookX, lookY = state.lookY;
    const sway = Math.sin(t * .72) * 3.2 + Math.sin(t * .31) * 1.6 + lookX * 4;
    const breath = Math.sin(t * 1.4) * 1.4;
    const headAngle = Math.sin(t * .9) * .035 + Math.sin(t * .36) * .018 + lookX * .07;
    const headShift = Math.sin(t * .68 + .3) * 2.4 + lookX * 6;
    const nod = Math.sin(t * 1.06) * 1.6 + lookY * 5;
    const cos = Math.cos(headAngle), sin = Math.sin(headAngle);
    const backgroundX = -lookX * 9 + Math.sin(t * .21) * 2;
    const backgroundY = -lookY * 4;
    const { black, white, gamma } = this.options.tone;
    const range = white - black;
    const top1 = ramp.length - 1;

    const glitch = this.glitch;
    if (this.options.glitch && state.delta && t > glitch.next) {
      glitch.top = Math.floor(Math.random() * rows);
      glitch.bottom = glitch.top + 1 + Math.floor(Math.random() * 4);
      glitch.shift = (Math.random() < .5 ? -1 : 1) * (2 + Math.floor(Math.random() * 7));
      glitch.until = t + .08 + Math.random() * .12;
      glitch.next = t + 3 + Math.random() * 5;
    }
    const glitching = t < glitch.until;
    const lens = state.lens;
    const lensRadius = rows * .2;

    for (let row = 0; row < rows; row++) {
      const shifted = glitching && row >= glitch.top && row < glitch.bottom;
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        let u = col + .5, v = row + .5, boost = 0;
        if (shifted) u += glitch.shift;
        if (lens && lens.amount > .001) {
          const dx = (u - lens.x) * ratio, dy = v - lens.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < lensRadius) {
            const k = 1 - distance / lensRadius;
            const pull = 1 - lens.amount * .45 * k * k;
            u = lens.x + (u - lens.x) * pull;
            v = lens.y + (v - lens.y) * pull;
            boost = lens.amount * .22 * k * k;
          }
        }
        const x = left + u * stepX;
        const y = top + v * stepY;

        // Person layer: body sways and breathes, the head rotates on the neck.
        const bodyWeight = clamp((455 - y) / 180);
        let px = x - sway * bodyWeight;
        let py = y - breath * bodyWeight;
        const headWeight = clamp((275 - py) / 65);
        const blend = headWeight * headWeight * (3 - 2 * headWeight);
        const hx = px - 246 - headShift, hy = py - 237 - nod;
        px += (hx * cos + hy * sin + 246 - px) * blend;
        py += (-hx * sin + hy * cos + 237 - py) * blend;
        const person = sample(mask, px, py);
        const subject = sample(lum, px, py);
        const edge = sample(rim, px, py);

        // Background layer: parallax shift plus flickering city lights.
        const bx = x + backgroundX, by = y + backgroundY;
        let back = sample(plate, bx, by);
        if (back > .5) back *= .78 + .22 * Math.sin(t * (1.5 + hash(bx >> 3, by >> 3) * 3) + hash(by >> 3, bx >> 3) * 6.28);

        let value = back + (subject - back) * person + edge * .45;
        value = Math.pow(clamp((value - black) / range), gamma) + boost;
        let glyph = Math.round(clamp(value) * top1);
        if (state.reveal < Infinity) {
          const threshold = .15 + col / columns * .9 + hash(col, row) * .45;
          if (state.reveal < threshold - .35) glyph = 0;
          else if (state.reveal < threshold) glyph = 2 + Math.floor(Math.random() * (top1 - 1));
        }
        if (shifted && Math.random() < .12) glyph = top1;
        codes[index] = ramp.charCodeAt(glyph);
        personMask[index] = person;
      }
    }

    // Rain falls behind the person, with the odd drop passing in front.
    const fall = state.delta;
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      drop.y += drop.speed * fall;
      drop.x -= drop.speed * fall * .45;
      if (drop.y - drop.length > rows || drop.x < -2) { this.drops[i] = this.spawnDrop(false); continue; }
      for (let k = 0; k < drop.length; k++) {
        const row = Math.floor(drop.y) - k;
        const col = Math.floor(drop.x + k * .45);
        if (row < 0 || row >= rows || col < 0 || col >= columns) continue;
        const index = row * columns + col;
        if (!drop.front && personMask[index] > .35) continue;
        if (state.reveal < Infinity && state.reveal < .15 + col / columns * .9) continue;
        codes[index] = k ? 47 : (drop.front ? 47 : 44); // '/' trail, ',' head
      }
    }

    const lines = new Array(rows);
    for (let row = 0; row < rows; row++) {
      lines[row] = String.fromCharCode.apply(null, codes.subarray(row * columns, (row + 1) * columns));
    }
    this.element.textContent = lines.join('\n');
  }
}

// One clock drives every view; each view renders at most ~30 frames a second
// and only while it is on screen.
const views = [];
let framePending = false;
function requestFrame() {
  if (!framePending) { framePending = true; requestAnimationFrame(tick); }
}
function tick(now) {
  framePending = false;
  let again = false;
  for (const view of views) if (view.update(now)) again = true;
  if (again) requestFrame();
}
motionListeners.push(() => { for (const view of views) view.last = 0; requestFrame(); });
document.addEventListener('visibilitychange', () => { for (const view of views) view.last = 0; requestFrame(); });

// ---------- Hero portrait ----------
const portraitElement = document.querySelector('#ascii-portrait');
const portraitFigure = document.querySelector('.profile-picture');
const portraitFrame = document.querySelector('.profile-frame');
const portrait = {
  view: new AsciiView(portraitElement, {
    columns: width => Math.round(clamp(width / 4.8, 56, 170)),
    ramp: ' .,:;/+=cxoae8%B@',
    tone: { black: 0, white: .95, gamma: 1 },
    rain: .006,
    glitch: true,
  }),
  visible: true, time: 0, last: 0, revealAt: Infinity,
  look: { x: 0, y: 0, tx: 0, ty: 0 },
  lens: { x: 0, y: 0, amount: 0, target: 0 },
  update(now) {
    if (!this.scene || !this.visible || document.hidden) return false;
    const moving = !paused;
    if (moving && this.last && now - this.last < 1000 / 30) return true;
    const delta = moving && this.last ? Math.min(now - this.last, 100) / 1000 : 0;
    this.last = now;
    this.time += delta;
    const look = this.look, lens = this.lens;
    if (!this.hovering) {
      // Idle: glance around slowly so the portrait never freezes.
      look.tx = Math.sin(this.time * .23) * .35;
      look.ty = Math.sin(this.time * .17 + 1) * .2;
    }
    const ease = 1 - Math.pow(.0015, delta);
    look.x += (look.tx - look.x) * ease;
    look.y += (look.ty - look.y) * ease;
    lens.amount += (lens.target - lens.amount) * ease;
    const reveal = paused || this.revealAt === Infinity ? Infinity : (now - this.revealAt) / 1000;
    this.view.render(this.scene, {
      time: this.time, delta, zoom: 1.05, focusX: 236, focusY: 266,
      lookX: look.x, lookY: look.y, lens, reveal: reveal > 2 ? Infinity : reveal,
    });
    return moving || reveal < 2;
  },
};
views.push(portrait);
new IntersectionObserver(entries => {
  portrait.visible = entries[0].isIntersecting;
  portrait.last = 0;
  requestFrame();
}).observe(portraitFrame);
portraitFrame.addEventListener('pointermove', event => {
  const rect = portraitElement.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  portrait.hovering = true;
  portrait.look.tx = clamp(x * 2 - 1, -1, 1);
  portrait.look.ty = clamp(y * 2 - 1, -1, 1);
  portrait.lens.x = x * portrait.view.columns;
  portrait.lens.y = y * portrait.view.rows;
  portrait.lens.target = 1;
  requestFrame();
});
portraitFrame.addEventListener('pointerleave', () => { portrait.hovering = false; portrait.lens.target = 0; requestFrame(); });
scene.then(data => { portrait.scene = data; requestFrame(); }).catch(() => {
  portraitElement.textContent = '\n\n  [ SANJIV SARAVANAN ]\n\n  SOFTWARE ENGINEER\n  AUSTIN, TX';
});

// ---------- Intro ----------
// The name stretches up from the bottom of the screen as tall bars of dots,
// settles into place, then the black curtain lifts to reveal the same name on
// the page while a rainy ASCII close-up plays behind it.
const introElement = document.querySelector('#intro');
const CIRC = 'cubic-bezier(.785,.135,.15,.86)';
const EXPO = 'cubic-bezier(.87,0,.13,1)';
const intro = {
  active: root.classList.contains('intro-pending'),
  time: 0, last: 0, letters: [], wiping: false,
  update(now) {
    if (!this.active || !this.scene || !this.view) return false;
    if (this.last && now - this.last < 1000 / 30) return true;
    const delta = this.last ? Math.min(now - this.last, 100) / 1000 : 0;
    this.last = now;
    this.time += delta;
    // A slow push-in that keeps the whole figure in frame.
    const push = clamp(this.time / 5.5);
    const eased = push * push * (3 - 2 * push);
    this.view.render(this.scene, {
      time: this.time + 2, delta, zoom: 1 + eased * .14,
      focusX: 236, focusY: 252 - eased * 14,
      lookX: Math.sin(this.time * .6) * .3, lookY: 0, lens: null, reveal: Infinity,
    });
    return true;
  },
};
views.push(intro);

function startHero(delay) {
  setTimeout(() => {
    root.classList.add('keywords-on');
    portraitFigure.classList.add('in-view');
    portrait.revealAt = paused ? Infinity : performance.now() + 250;
    requestFrame();
    document.querySelectorAll('[data-scramble="intro"]').forEach((element, i) => {
      setTimeout(() => scramble(element, 1700), i * 180);
    });
  }, delay);
}
function finishIntro() {
  intro.active = false;
  introElement.remove();
  root.classList.remove('intro-pending', 'intro-lock');
}
function wipeIntro(fast) {
  if (intro.wiping) return;
  intro.wiping = true;
  clearTimeout(intro.timer);
  const duration = fast ? 900 : 2100;
  if (fast) for (const animation of intro.letters) animation.finish();
  introElement.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
    { duration, easing: EXPO, fill: 'forwards' }).finished.then(finishIntro, finishIntro);
  startHero(duration * .4);
}
function skipIntro() { wipeIntro(true); }

if (intro.active) {
  root.classList.add('intro-lock');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const logo = introElement.querySelector('.intro-logo');
  const spans = [...'Sanjiv Saravanan'].map(letter => {
    const span = document.createElement('span');
    span.textContent = letter;
    logo.append(span);
    return span;
  });
  const asciiElement = introElement.querySelector('.intro-ascii');
  intro.view = new AsciiView(asciiElement, {
    columns: width => width <= 480 ? 70 : 180,
    ramp: ' .,:;/+=cxoa8',
    tone: { black: 0, white: .9, gamma: .9 },
    rain: .012,
    fill: true,
  });
  scene.then(data => {
    intro.scene = data;
    asciiElement.classList.add('started');
    requestFrame();
  }, () => {});
  // Letters rise as stretched bars, then collapse to their real height.
  document.fonts.ready.then(() => {
    if (intro.wiping) return;
    const height = spans[0].offsetHeight;
    const travel = window.innerHeight - height * .5;
    const stretch = travel / height;
    intro.letters = spans.map((span, i) => span.animate([
      { transform: `translateY(${travel}px) scaleY(0)`, easing: CIRC },
      { transform: `translateY(0) scaleY(${stretch})`, offset: 1 / 3, easing: CIRC },
      { transform: 'translateY(0) scaleY(1)' },
    ], { duration: 2100, delay: 200 + i * 50, fill: 'both' }));
    intro.timer = setTimeout(() => wipeIntro(false), 3200);
  });
  introElement.addEventListener('pointerdown', skipIntro);
  window.addEventListener('wheel', skipIntro, { once: true, passive: true });
  window.addEventListener('touchmove', skipIntro, { once: true, passive: true });
} else {
  introElement.remove();
  startHero(0);
}
