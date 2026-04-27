import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  simpleHash,
  pickDailyCard,
  pullRandom,
  getDeckStyle,
  setDeckStyle,
} from '../assets/js/site.js';

// --- simpleHash ---

test('simpleHash is deterministic for identical input', () => {
  assert.equal(simpleHash('2026-04-27'), simpleHash('2026-04-27'));
});

test('simpleHash returns different values for different inputs', () => {
  assert.notEqual(simpleHash('2026-04-27'), simpleHash('2026-04-28'));
});

test('simpleHash returns a non-negative integer', () => {
  const h = simpleHash('any string');
  assert.ok(Number.isInteger(h));
  assert.ok(h >= 0);
});

// --- pickDailyCard ---

test('pickDailyCard returns the same card for the same date', () => {
  const deck = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  assert.equal(
    pickDailyCard(deck, '2026-04-27').slug,
    pickDailyCard(deck, '2026-04-27').slug
  );
});

test('pickDailyCard returns a card from the deck', () => {
  const deck = [{ slug: 'a' }, { slug: 'b' }];
  const card = pickDailyCard(deck, '2026-04-27');
  assert.ok(deck.includes(card));
});

test('pickDailyCard distributes across days (sanity check)', () => {
  const deck = Array.from({ length: 78 }, (_, i) => ({ slug: `card-${i}` }));
  const seen = new Set();
  for (let d = 1; d <= 60; d++) {
    seen.add(
      pickDailyCard(deck, `2026-04-${String(d).padStart(2, '0')}`).slug
    );
  }
  assert.ok(
    seen.size >= 30,
    `Expected good distribution, got ${seen.size} unique cards`
  );
});

// --- pullRandom ---

test('pullRandom returns a card from the deck', () => {
  const deck = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  for (let i = 0; i < 20; i++) {
    assert.ok(deck.includes(pullRandom(deck)));
  }
});

test('pullRandom respects the exclude set', () => {
  const deck = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  for (let i = 0; i < 20; i++) {
    const card = pullRandom(deck, new Set(['a', 'b']));
    assert.equal(card.slug, 'c');
  }
});

// --- deck style toggle ---

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
}

test('getDeckStyle defaults to celtic when storage is empty', () => {
  assert.equal(getDeckStyle(fakeStorage()), 'celtic');
});

test('setDeckStyle persists, getDeckStyle reads it back', () => {
  const s = fakeStorage();
  setDeckStyle('classic', s);
  assert.equal(getDeckStyle(s), 'classic');
});

test('setDeckStyle rejects invalid input', () => {
  assert.throws(() => setDeckStyle('bogus', fakeStorage()));
});
