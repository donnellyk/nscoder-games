import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stepParticle,
  particleLife,
  particleOpacity,
  isParticleDone,
  makeConfettiParticle,
  makeEmojiParticle,
} from '../../games/timeline/js/game/particles.js';

const base = {
  x: 0.5, y: 0.5, vx: 1, vy: 0, gravity: 1, drag: 0.9, rotation: 0, spin: 2, age: 0, lifespan: 2,
};

test('stepParticle: gravity accelerates y velocity downward over time', () => {
  const next = stepParticle(base, 1);
  assert.ok(next.vy > 0, 'a positive gravity should push vy positive after a step');
});

test('stepParticle: drag shrinks velocity magnitude', () => {
  const next = stepParticle({ ...base, gravity: 0 }, 1);
  assert.ok(Math.abs(next.vx) < Math.abs(base.vx));
});

test('stepParticle: position integrates velocity over dt', () => {
  const next = stepParticle({ ...base, gravity: 0, drag: 1 }, 0.5);
  assert.equal(next.x, 0.5 + 1 * 0.5);
});

test('stepParticle: rotation advances by spin * dt', () => {
  const next = stepParticle(base, 0.5);
  assert.equal(next.rotation, 1);
});

test('stepParticle: age advances by dt and does not mutate the input', () => {
  const next = stepParticle(base, 0.25);
  assert.equal(next.age, 0.25);
  assert.equal(base.age, 0);
});

test('particleLife: is a fraction of age over lifespan, clamped to [0, 1]', () => {
  assert.equal(particleLife({ age: 1, lifespan: 2 }), 0.5);
  assert.equal(particleLife({ age: 5, lifespan: 2 }), 1);
  assert.equal(particleLife({ age: -1, lifespan: 2 }), 0);
});

test('particleOpacity: stays fully opaque for the first 70% of life', () => {
  assert.equal(particleOpacity({ age: 1, lifespan: 2 }), 1);
});

test('particleOpacity: fades to zero by the end of life', () => {
  assert.equal(particleOpacity({ age: 2, lifespan: 2 }), 0);
  const mid = particleOpacity({ age: 1.7, lifespan: 2 });
  assert.ok(mid > 0 && mid < 1);
});

test('isParticleDone: true once age reaches lifespan', () => {
  assert.equal(isParticleDone({ age: 1.9, lifespan: 2 }), false);
  assert.equal(isParticleDone({ age: 2, lifespan: 2 }), true);
});

test('makeConfettiParticle: deterministic under a fixed random source, values mid-range', () => {
  const p = makeConfettiParticle(() => 0.5);
  assert.equal(p.x, 0.5);
  assert.equal(p.y, 0.92);
  assert.equal(p.vx, 0);
  assert.equal(p.vy, -1.2);
  assert.equal(p.age, 0);
  assert.equal(p.colorIndex, 2);
});

test('makeEmojiParticle: starts above the stage and falls downward', () => {
  const p = makeEmojiParticle(() => 0.5);
  assert.ok(p.y < 0, 'emoji should start above the visible stage');
  assert.ok(p.vy > 0, 'emoji should fall downward');
  assert.equal(p.glyphIndex, 2);
});

test('makeConfettiParticle/makeEmojiParticle: never mutate the shared rng closure state across calls', () => {
  let calls = 0;
  const rng = () => {
    calls += 1;
    return 0.5;
  };
  makeConfettiParticle(rng);
  const callsAfterConfetti = calls;
  makeEmojiParticle(rng);
  assert.ok(calls > callsAfterConfetti);
});
