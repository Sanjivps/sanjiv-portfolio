'use strict';
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const invertButton = document.querySelector('#invert');
const motionButton = document.querySelector('#motion-toggle');
let paused = reducedMotion.matches;
try { if (localStorage.getItem('portfolio-theme') === 'light') root.classList.add('inverted'); } catch {}
invertButton.setAttribute('aria-pressed', String(root.classList.contains('inverted')));
invertButton.addEventListener('click', () => {
  const light = root.classList.toggle('inverted');
  invertButton.setAttribute('aria-pressed', String(light));
  try { localStorage.setItem('portfolio-theme', light ? 'light' : 'dark'); } catch {}
});
function syncMotion() {
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Resume motion ▶' : 'Pause motion ⏸';
}
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', event => { paused = event.matches; syncMotion(); });
syncMotion();
document.querySelector('#year').textContent = new Date().getFullYear();

// Single-letter shortcuts leave browser shortcuts and editable fields alone.
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat ||
      event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  const command = [...document.querySelectorAll('[data-key]')].find(item => item.dataset.key === key);
  if (command) { event.preventDefault(); command.click(); }
});
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

document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('sanjivpsaravanan@gmail.com');
    status.textContent = 'Email copied to clipboard.';
  } catch {
    status.textContent = 'Email: sanjivpsaravanan@gmail.com — select to copy.';
  }
});

// Render a layered photo as ASCII. The silhouette, head and torso move in
// image space before sampling, rather than changing brightness in a scan band.
const portrait = document.querySelector('#ascii-portrait');
const columns = 140;
const rows = 75;
const glyphs = ' .,:;i+tfLCG08@';
let portraitVisible = true;
let framePending = false;
let photoPixels;
let elapsed = 0;
let lastFrame = 0;
let pointerX = 0;
let pointerY = 0;
let targetX = 0;
let targetY = 0;

function fitPortrait() {
  const fontSize = portrait.clientWidth / (columns * .6001);
  portrait.style.fontSize = fontSize + 'px';
}
new ResizeObserver(fitPortrait).observe(portrait);
fitPortrait();

function schedulePortrait() {
  if (!framePending && photoPixels && portraitVisible && !document.hidden) {
    framePending = true;
    requestAnimationFrame(renderPortrait);
  }
}
new IntersectionObserver(entries => {
  portraitVisible = entries[0].isIntersecting;
  lastFrame = 0;
  schedulePortrait();
}).observe(portrait);
document.addEventListener('visibilitychange', () => { lastFrame = 0; schedulePortrait(); });
motionButton.addEventListener('click', () => { lastFrame = 0; schedulePortrait(); });
reducedMotion.addEventListener('change', () => { lastFrame = 0; schedulePortrait(); });
portrait.parentElement.addEventListener('pointermove', event => {
  const rect = portrait.getBoundingClientRect();
  targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
  targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  schedulePortrait();
});
portrait.parentElement.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });

const photo = new Image();
photo.onload = () => {
  const source = document.createElement('canvas');
  source.width = 460;
  source.height = 460;
  const context = source.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  // Mask the person to keep the moving portrait separate from the busy street.
  const outline = new Path2D();
  outline.moveTo(191, 163);
  outline.bezierCurveTo(186, 145, 193, 117, 215, 110);
  outline.bezierCurveTo(243, 99, 271, 120, 282, 141);
  outline.bezierCurveTo(299, 161, 291, 195, 282, 212);
  outline.lineTo(286, 224);
  outline.bezierCurveTo(304, 231, 333, 233, 339, 252);
  outline.bezierCurveTo(345, 278, 350, 316, 351, 347);
  outline.bezierCurveTo(354, 365, 343, 379, 345, 402);
  outline.lineTo(361, 460);
  outline.lineTo(137, 460);
  outline.bezierCurveTo(147, 423, 151, 394, 149, 374);
  outline.bezierCurveTo(137, 357, 148, 313, 153, 289);
  outline.bezierCurveTo(160, 260, 170, 244, 193, 234);
  outline.lineTo(210, 220);
  outline.lineTo(208, 207);
  outline.bezierCurveTo(202, 205, 201, 192, 194, 189);
  outline.lineTo(188, 181);
  outline.lineTo(196, 172);
  outline.closePath();
  context.clip(outline);
  context.drawImage(photo, 0, 0, 460, 460);
  const data = context.getImageData(0, 0, 460, 460).data;
  photoPixels = new Float32Array(460 * 460);
  for (let i = 0; i < photoPixels.length; i++) {
    const luminance = (data[i * 4] * .2126 + data[i * 4 + 1] * .7152 + data[i * 4 + 2] * .0722) / 255;
    photoPixels[i] = Math.min(1, Math.pow(luminance, .65) * 1.15) * data[i * 4 + 3] / 255;
  }
  schedulePortrait();
};
photo.onerror = () => { portrait.textContent = '[ SANJIV SARAVANAN ]\n\nSOFTWARE ENGINEER\nAUSTIN, TX'; };
photo.src = 'assets/portrait.png';

function samplePortrait(x, y) {
  if (x < 0 || y < 0 || x >= 459 || y >= 459) return 0;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const dx = x - ix;
  const dy = y - iy;
  const i = iy * 460 + ix;
  // Bilinear sampling avoids jumping between source pixels during slow motion.
  return (photoPixels[i] * (1 - dx) + photoPixels[i + 1] * dx) * (1 - dy) +
    (photoPixels[i + 460] * (1 - dx) + photoPixels[i + 461] * dx) * dy;
}
function renderPortrait(now) {
  framePending = false;
  if (!portraitVisible || document.hidden) return;
  const delta = lastFrame ? Math.min(now - lastFrame, 80) : 0;
  if (!paused && lastFrame && delta < 1000 / 24) { schedulePortrait(); return; }
  lastFrame = now;
  if (!paused) elapsed += delta / 1000;
  const t = elapsed;
  if (!paused) {
    pointerX += (targetX - pointerX) * .08;
    pointerY += (targetY - pointerY) * .08;
  }
  // Independent, low-frequency motion: breathing, weight shift, head tilt.
  const sway = Math.sin(t * .72) * 4.8 + Math.sin(t * .31) * 2.4 + pointerX * 3;
  const breath = Math.sin(t * 1.4) * 1.6;
  const headAngle = Math.sin(t * .9) * .045 + Math.sin(t * .36) * .021 + pointerX * .035;
  const headShift = Math.sin(t * .68 + .3) * 3 + pointerX * 3;
  const nod = Math.sin(t * 1.06) * 1.9 + pointerY * 2.4;
  const cos = Math.cos(headAngle);
  const sin = Math.sin(headAngle);
  let text = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      let x = 35 + col / (columns - 1) * 410;
      let y = 87 + row / (rows - 1) * 365;
      const bodyWeight = Math.max(0, Math.min(1, (455 - y) / 180));
      x -= sway * bodyWeight;
      y -= breath * bodyWeight;
      const headWeight = Math.max(0, Math.min(1, (275 - y) / 65));
      const blend = headWeight * headWeight * (3 - 2 * headWeight);
      const hx = x - 246 - headShift;
      const hy = y - 237 - nod;
      const headX = hx * cos + hy * sin + 246;
      const headY = -hx * sin + hy * cos + 237;
      x += (headX - x) * blend;
      y += (headY - y) * blend;
      const value = samplePortrait(x, y);
      text += glyphs[Math.min(glyphs.length - 1, Math.floor(value * glyphs.length))];
    }
    if (row < rows - 1) text += '\n';
  }
  portrait.textContent = text;
  if (!paused) schedulePortrait();
}
