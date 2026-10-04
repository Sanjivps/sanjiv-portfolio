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

// Convert the profile photo to real text. A subtle scanning band changes the
// character density, while pointer movement adds a small local disturbance.
const portrait = document.querySelector('#ascii-portrait');
const photo = new Image();
let portraitVisible = true;
new IntersectionObserver(entries => { portraitVisible = entries[0].isIntersecting; }).observe(portrait);
photo.src = 'assets/portrait.png';
photo.onload = () => {
  const width = 100;
  const height = 70;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.drawImage(photo, 65, 35, 340, 395, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const brightness = Array.from({ length: width * height }, (_, i) => {
    const value = pixels[i * 4] * .2126 + pixels[i * 4 + 1] * .7152 + pixels[i * 4 + 2] * .0722;
    return Math.pow(value / 255, .78);
  });
  const symbols = ' .,:;+=xX#@';
  let pointer = null;
  portrait.parentElement.addEventListener('pointermove', event => {
    const rect = portrait.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) / rect.width * width, y: (event.clientY - rect.top) / rect.height * height };
  });
  portrait.parentElement.addEventListener('pointerleave', () => { pointer = null; });
  let lastFrame = -100;
  let elapsed = 0;
  function render(time) {
    if (time - lastFrame >= 100 && portraitVisible && !document.hidden) {
      const delta = Math.min(time - lastFrame, 100);
      lastFrame = time;
      if (!paused) elapsed += delta;
      const band = (elapsed / 180) % (height + 25) - 12;
      let result = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let value = brightness[y * width + x];
          if (!paused) {
            value += Math.max(0, 1 - Math.abs(y - band) / 4) * .11;
            if (pointer) value += Math.max(0, 1 - Math.hypot(x - pointer.x, (y - pointer.y) * 1.7) / 12) * .15;
          }
          result += symbols[Math.max(0, Math.min(symbols.length - 1, Math.floor(value * symbols.length)))];
        }
        result += '\n';
      }
      if (portrait.textContent !== result) portrait.textContent = result;
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};
photo.onerror = () => { portrait.textContent = '[ SANJIV SARAVANAN ]\n\nSOFTWARE ENGINEER\nAUSTIN, TX'; };
