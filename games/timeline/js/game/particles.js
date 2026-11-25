// Pure particle physics for the reveal effects (confetti burst, emoji
// shower). No DOM, no canvas, no timers — effects.js owns the animation
// loop and rendering; this module only ever transforms plain data.
//
// Positions and sizes are fractions of the stage box (0..1 for x/y, size as
// a fraction of stage width/height), so the same particle looks the same
// proportion of the stage whether it's rendered full-window or embedded at
// admin size.

const randomBetween = (rng, min, max) => min + rng() * (max - min);

export const stepParticle = (particle, dt) => {
  const drag = particle.drag ** (dt * 60);
  const vx = particle.vx * drag;
  const vy = (particle.vy + particle.gravity * dt) * drag;

  return {
    ...particle,
    x: particle.x + vx * dt,
    y: particle.y + vy * dt,
    vx,
    vy,
    rotation: particle.rotation + particle.spin * dt,
    age: particle.age + dt,
  };
};

export const particleLife = (particle) => Math.min(1, Math.max(0, particle.age / particle.lifespan));

// Fully visible until 70% through its life, then fades to nothing.
export const particleOpacity = (particle) => {
  const life = particleLife(particle);
  return life < 0.7 ? 1 : Math.min(1, Math.max(0, 1 - (life - 0.7) / 0.3));
};

export const isParticleDone = (particle) => particle.age >= particle.lifespan;

export const makeConfettiParticle = (rng = Math.random) => ({
  x: 0.5 + randomBetween(rng, -0.12, 0.12),
  y: 0.92,
  vx: randomBetween(rng, -0.55, 0.55),
  vy: randomBetween(rng, -1.5, -0.9),
  gravity: randomBetween(rng, 1.6, 2.1),
  drag: randomBetween(rng, 0.985, 0.995),
  rotation: randomBetween(rng, 0, Math.PI * 2),
  spin: randomBetween(rng, -6, 6),
  size: randomBetween(rng, 0.008, 0.016),
  aspect: randomBetween(rng, 0.4, 1),
  age: 0,
  lifespan: randomBetween(rng, 2.2, 3.2),
  colorIndex: Math.floor(rng() * 5),
});

export const makeEmojiParticle = (rng = Math.random) => ({
  x: randomBetween(rng, 0.06, 0.94),
  y: randomBetween(rng, -0.25, -0.02),
  vx: randomBetween(rng, -0.06, 0.06),
  vy: randomBetween(rng, 0.14, 0.26),
  gravity: randomBetween(rng, 0.05, 0.12),
  drag: randomBetween(rng, 0.994, 0.999),
  rotation: randomBetween(rng, -0.3, 0.3),
  spin: randomBetween(rng, -0.6, 0.6),
  size: randomBetween(rng, 0.028, 0.052),
  age: 0,
  lifespan: randomBetween(rng, 2.6, 3.4),
  glyphIndex: Math.floor(rng() * 4),
});
