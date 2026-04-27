// thebrigidhearth.com — vanilla site JS
// Daily card seeding, pull-your-own widget, deck-style toggle.

// Tiny deterministic string-to-int hash (djb2 variant)
export function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function pickDailyCard(deck, dateString) {
  const i = simpleHash(dateString) % deck.length;
  return deck[i];
}

export function pullRandom(deck, excludeSlugs = new Set()) {
  const candidates = deck.filter((c) => !excludeSlugs.has(c.slug));
  if (candidates.length === 0) {
    return deck[Math.floor(Math.random() * deck.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const STYLE_KEY = 'deckStyle';

export function getDeckStyle(
  storage = typeof localStorage !== 'undefined' ? localStorage : null
) {
  if (!storage) return 'celtic';
  const v = storage.getItem(STYLE_KEY);
  return v === 'classic' ? 'classic' : 'celtic';
}

export function setDeckStyle(
  style,
  storage = typeof localStorage !== 'undefined' ? localStorage : null
) {
  if (style !== 'celtic' && style !== 'classic') {
    throw new Error(`Invalid deck style: ${style}`);
  }
  if (!storage) return;
  storage.setItem(STYLE_KEY, style);
}
