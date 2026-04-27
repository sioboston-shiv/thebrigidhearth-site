import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCardPage } from '../scripts/generate-deck-pages.mjs';

const sampleCard = {
  slug: 'the-wheel',
  classicSlug: 'wheel-of-fortune',
  suit: 'major',
  suitDisplay: 'Major Arcana',
  number: 10,
  nameIrish: 'An Roth',
  nameEnglish: 'The Wheel',
  nameClassic: 'Wheel of Fortune',
  uprightMeaning: 'A turn of the year.',
  reversedMeaning: 'Stuck in old patterns.',
  irishLore: 'The wheel turns.',
  keywords: ['cycles', 'time', 'fate'],
  oghamLetter: '᚛',
  figure: 'Time itself',
};

test('renderCardPage produces a complete HTML doc', () => {
  const html = renderCardPage(sampleCard);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('</html>'));
});

test('renderCardPage includes both Irish and Classic names', () => {
  const html = renderCardPage(sampleCard);
  assert.ok(html.includes('An Roth'));
  assert.ok(html.includes('Wheel of Fortune'));
});

test('renderCardPage sets title and meta description', () => {
  const html = renderCardPage(sampleCard);
  assert.match(html, /<title>An Roth.*Wheel of Fortune.*<\/title>/);
  assert.match(html, /<meta name="description"/);
});

test('renderCardPage includes canonical URL', () => {
  const html = renderCardPage(sampleCard);
  assert.ok(html.includes('https://thebrigidhearth.com/deck/the-wheel.html'));
});

test('renderCardPage embeds JSON-LD BreadcrumbList', () => {
  const html = renderCardPage(sampleCard);
  assert.ok(html.includes('"@type": "BreadcrumbList"'));
});

test('renderCardPage shows keywords when present', () => {
  const html = renderCardPage(sampleCard);
  assert.ok(html.includes('cycles · time · fate'));
});

test('renderCardPage includes Roman numeral for major arcana', () => {
  const html = renderCardPage(sampleCard);
  assert.ok(html.includes('Major Arcana · X'));
});

test('renderCardPage escapes HTML in card content', () => {
  const card = { ...sampleCard, uprightMeaning: 'A "test" with <tags> & ampersands' };
  const html = renderCardPage(card);
  assert.ok(html.includes('&quot;test&quot;'));
  assert.ok(html.includes('&lt;tags&gt;'));
  assert.ok(html.includes('&amp; ampersands'));
});
