import { stepParticle, particleOpacity, isParticleDone, makeConfettiParticle, makeEmojiParticle } from './particles.js';

const DURATION = 3;
const CONFETTI_COUNT = 150;
const EMOJI_COUNT = 40;
const DEFAULT_GLYPHS = ['☹️', '\u{1F641}', '\u{1F61E}', '\u{1F62D}'];
const DEFAULT_COLORS = ['#0071e3', '#1d8a3a', '#ff9f0a', '#d70015', '#8a3fc0'];

const noop = () => {};

const deviceScale = () => Math.min(window.devicePixelRatio || 1, 2);

const createCanvas = (stageEl) => {
  const canvas = document.createElement('canvas');
  canvas.className = 'stage-effects-canvas';
  stageEl.append(canvas);
  return canvas;
};

const sizeCanvas = (canvas, stageEl) => {
  const rect = stageEl.getBoundingClientRect();
  const dpr = deviceScale();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  return { width, height, dpr };
};

const readPalette = (stageEl, colors) => {
  if (colors?.length) return colors;
  const style = getComputedStyle(stageEl);
  const fromTokens = [1, 2, 3, 4, 5]
    .map((i) => style.getPropertyValue(`--confetti-${i}`).trim())
    .filter(Boolean);
  return fromTokens.length ? fromTokens : DEFAULT_COLORS;
};

const drawConfettiPiece = (ctx, p, width, height, palette) => {
  const w = p.size * width;
  const h = w * p.aspect;
  ctx.save();
  ctx.translate(p.x * width, p.y * height);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = particleOpacity(p);
  ctx.fillStyle = palette[p.colorIndex % palette.length];
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
};

const drawEmoji = (ctx, p, width, height, glyphs) => {
  const fontSize = p.size * height;
  ctx.save();
  ctx.translate(p.x * width, p.y * height);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = particleOpacity(p);
  ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyphs[p.glyphIndex % glyphs.length], 0, 0);
  ctx.restore();
};

const runLoop = (stageEl, count, makeParticle, draw) => {
  const canvas = createCanvas(stageEl);
  const ctx = canvas.getContext('2d');
  let { width, height, dpr } = sizeCanvas(canvas, stageEl);
  let particles = Array.from({ length: count }, () => makeParticle(Math.random));
  let raf = null;
  let last = performance.now();
  let elapsed = 0;
  let stopped = false;

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    if (raf !== null) cancelAnimationFrame(raf);
    canvas.remove();
  };

  const frame = (now) => {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;

    particles = particles.map((p) => stepParticle(p, dt)).filter((p) => !isParticleDone(p));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => draw(ctx, p, width, height));

    if (elapsed < DURATION && particles.length > 0) {
      raf = requestAnimationFrame(frame);
    } else {
      cleanup();
    }
  };

  raf = requestAnimationFrame(frame);
  return cleanup;
};

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const playConfetti = (stageEl, { colors } = {}) => {
  if (reducedMotion()) return noop;
  const palette = readPalette(stageEl, colors);
  return runLoop(stageEl, CONFETTI_COUNT, makeConfettiParticle, (ctx, p, w, h) => drawConfettiPiece(ctx, p, w, h, palette));
};

export const playEmojiShower = (stageEl, { glyphs } = {}) => {
  if (reducedMotion()) return noop;
  const chosen = glyphs?.length ? glyphs : DEFAULT_GLYPHS;
  return runLoop(stageEl, EMOJI_COUNT, makeEmojiParticle, (ctx, p, w, h) => drawEmoji(ctx, p, w, h, chosen));
};
