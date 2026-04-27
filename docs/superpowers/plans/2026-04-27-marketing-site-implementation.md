# thebrigidhearth.com Marketing Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder thebrigidhearth.com landing page with a full marketing site that drives App Store installs of the Draiocht (The Hearth) iOS app, including a 78-card browsable deck (celtic + classic art), daily card pull, four product pillars, founder note, and FAQ.

**Architecture:** Vanilla HTML/CSS/JS only. No build system. One Node script generates the 78 individual card pages from `data/deck.json`; another generates `sitemap.xml`. All output is committed to git. GitHub Pages serves the static repo as-is. Card data and artwork are exported one-time from the companion Draiocht iOS app repo.

**Tech Stack:** HTML5, CSS3 (custom properties, flexbox/grid, no preprocessor), vanilla ES2020 JavaScript, Node.js (scripts only, not in production), `cwebp` (one-time image conversion). Self-hosted Cinzel + Crimson Text via woff2. Deployed to GitHub Pages with custom domain via Namecheap.

**Spec:** [`docs/superpowers/specs/2026-04-27-marketing-site-design.md`](../specs/2026-04-27-marketing-site-design.md)

---

## Working assumptions

- Site repo lives at `~/Desktop/MISC/thebrigidhearth-site/`. Existing files: `index.html` (placeholder), `privacy.html`, `support.html`, `terms.html`, `README.md`. No git repo yet locally.
- Companion app repo: `~/Desktop/testing claude code/draiocht/`.
- Confirmed app suit names: `major`, `branches`, `wells`, `winds`, `stones` (display: Major Arcana, Wands, Cups, Swords, Pentacles when in classic mode).
- 78 celtic PNG card images exist at `draiocht/assets/images/cards/<slug>.png`. 78 classic JPG card images exist at `draiocht/assets/images/cards-classic/<traditional-slug>.jpg`.
- The user will provide the founder photo at a later step. Pillar illustrations and the hero atmospheric image will be sourced or commissioned during implementation; placeholder treatments are defined inline.

## File structure

```
thebrigidhearth-site/
├── index.html                       # Landing page
├── privacy.html                     # Existing — restyled
├── support.html                     # Existing — restyled
├── terms.html                       # Existing — restyled
├── deck/
│   ├── index.html                   # Browse landing
│   └── <slug>.html                  # 78 generated card pages
├── assets/
│   ├── css/site.css                 # Shared stylesheet
│   ├── js/site.js                   # Daily card, pull, deck toggle
│   ├── img/
│   │   ├── hero/                    # hero.webp/png + hero-og.jpg
│   │   ├── celtic/                  # 78 .webp + 78 .png fallbacks
│   │   ├── classic/                 # 78 .webp + 78 .jpg fallbacks
│   │   ├── pillars/                 # 4 pillar illustrations
│   │   └── founder.jpg
│   └── fonts/
│       ├── cinzel-regular.woff2
│       ├── cinzel-bold.woff2
│       ├── crimson-regular.woff2
│       └── crimson-italic.woff2
├── data/
│   └── deck.json                    # 78-card array, exported from app
├── scripts/
│   ├── generate-deck-pages.mjs      # data + template → deck/*.html
│   ├── generate-sitemap.mjs         # walks tree → sitemap.xml
│   ├── convert-images.sh            # PNG/JPG → WebP
│   └── test-site.mjs                # Node test runner for site.js
├── tests/
│   └── site.test.mjs                # Tests for daily card / pull / toggle
├── sitemap.xml                      # Generated, committed
├── robots.txt
├── CNAME                            # Existing — must remain
├── README.md                        # Existing — append maintenance steps
└── docs/superpowers/                # This plan and spec
```

---

## Task 1: Initialize git and worktree baseline

**Files:**
- Modify: `~/Desktop/MISC/thebrigidhearth-site/`

- [ ] **Step 1: Verify current state**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
ls -la
```

Expected: existing `index.html`, `privacy.html`, `support.html`, `terms.html`, `README.md`, no `.git/`.

- [ ] **Step 2: Initialize git repo and stage existing files**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
git init
git add index.html privacy.html support.html terms.html README.md
git commit -m "chore: initialize git repo with existing placeholder site"
```

- [ ] **Step 3: Add `.gitignore`**

```bash
cat > .gitignore << 'EOF'
.DS_Store
node_modules/
.vscode/
*.log
EOF
git add .gitignore
git commit -m "chore: add .gitignore"
```

- [ ] **Step 4: Create the directory scaffold**

```bash
mkdir -p deck assets/css assets/js assets/img/hero assets/img/celtic assets/img/classic assets/img/pillars assets/fonts data scripts tests
touch assets/css/site.css assets/js/site.js
git add -A
git commit -m "chore: scaffold project directories"
```

---

## Task 2: Export deck data from companion app

**Files:**
- Create: `~/Desktop/testing claude code/draiocht/scripts/export-deck-for-site.mjs` (in app repo)
- Create: `~/Desktop/MISC/thebrigidhearth-site/data/deck.json`

- [ ] **Step 1: Write the export script in the app repo**

Create `~/Desktop/testing claude code/draiocht/scripts/export-deck-for-site.mjs`:

```javascript
// Run from app root: node scripts/export-deck-for-site.mjs
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Use ts-node-style approach via tsx if available, else direct read + parse.
// Simplest: read the TS file, find the deck arrays, parse via dynamic import.
// Easier still — re-export as JSON via a small TS shim.

// Approach: temporarily compile tarotDeck.ts to JS via tsx, import, dump JSON.
// Requires `npx tsx` in app repo (already a dev dep via expo).

import('tsx/esm').then(async () => {
  const mod = await import('../src/data/tarotDeck.ts');
  const deck = mod.TAROT_DECK ?? mod.default ?? mod.deck;
  if (!Array.isArray(deck) || deck.length !== 78) {
    throw new Error(`Expected 78 cards, got ${deck?.length ?? 'undefined'}`);
  }

  const traditionalSlug = (name) => name.toLowerCase().replace(/\s+/g, '-');

  const out = deck.map((card) => ({
    slug: card.slug,
    classicSlug: traditionalSlug(card.traditionalName),
    suit: card.suit,
    suitDisplay: ({ major: 'Major Arcana', branches: 'Wands', wells: 'Cups', winds: 'Swords', stones: 'Pentacles' })[card.suit],
    number: card.number,
    nameIrish: card.nameIrish,
    nameEnglish: card.name,
    nameClassic: card.traditionalName,
    keywords: card.keywords,
    uprightMeaning: card.uprightMeaning,
    reversedMeaning: card.reversedMeaning,
    irishLore: card.irishLore,
    oghamLetter: card.oghamLetter,
    figure: card.figure,
  }));

  writeFileSync(
    '/Users/shivymac/Desktop/MISC/thebrigidhearth-site/data/deck.json',
    JSON.stringify(out, null, 2)
  );
  console.log(`Exported ${out.length} cards to thebrigidhearth-site/data/deck.json`);
});
```

- [ ] **Step 2: Run the export**

```bash
cd ~/Desktop/testing\ claude\ code/draiocht
npx tsx scripts/export-deck-for-site.mjs
```

Expected output: `Exported 78 cards to thebrigidhearth-site/data/deck.json`. If the import path / export name is wrong, inspect `src/data/tarotDeck.ts` to find the actual exported variable name and adjust.

- [ ] **Step 3: Spot-check the JSON**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
head -50 data/deck.json
jq 'length' data/deck.json    # expect 78
jq '.[0].slug, .[0].nameIrish, .[0].nameClassic' data/deck.json
```

- [ ] **Step 4: Commit deck data**

```bash
git add data/deck.json
git commit -m "data: export 78-card deck from app"
```

---

## Task 3: Import card artwork (celtic + classic) and convert to WebP

**Files:**
- Create: 78 PNG + 78 WebP under `assets/img/celtic/`
- Create: 78 JPG + 78 WebP under `assets/img/classic/`
- Create: `scripts/convert-images.sh`

- [ ] **Step 1: Verify cwebp is installed**

```bash
which cwebp || brew install webp
cwebp -version
```

- [ ] **Step 2: Copy celtic artwork**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
# Use the 78 celtic card slugs derived from data/deck.json
jq -r '.[].slug' data/deck.json | while read slug; do
  cp "/Users/shivymac/Desktop/testing claude code/draiocht/assets/images/cards/${slug}.png" "assets/img/celtic/${slug}.png"
done
ls assets/img/celtic/ | wc -l   # expect 78
```

- [ ] **Step 3: Copy classic artwork**

```bash
jq -r '.[].classicSlug' data/deck.json | while read slug; do
  cp "/Users/shivymac/Desktop/testing claude code/draiocht/assets/images/cards-classic/${slug}.jpg" "assets/img/classic/${slug}.jpg"
done
ls assets/img/classic/ | wc -l  # expect 78
```

- [ ] **Step 4: Write the WebP conversion script**

Create `scripts/convert-images.sh`:

```bash
#!/usr/bin/env bash
# Convert all PNG/JPG card images to WebP. Run once after asset copy.
set -euo pipefail
cd "$(dirname "$0")/.."

for f in assets/img/celtic/*.png; do
  out="${f%.png}.webp"
  cwebp -q 82 "$f" -o "$out" -quiet
done

for f in assets/img/classic/*.jpg; do
  out="${f%.jpg}.webp"
  cwebp -q 82 "$f" -o "$out" -quiet
done

echo "Converted $(ls assets/img/celtic/*.webp assets/img/classic/*.webp | wc -l) files."
```

```bash
chmod +x scripts/convert-images.sh
./scripts/convert-images.sh
ls assets/img/celtic/*.webp | wc -l   # expect 78
ls assets/img/classic/*.webp | wc -l  # expect 78
```

- [ ] **Step 5: Commit assets and script**

```bash
git add scripts/convert-images.sh assets/img/celtic/ assets/img/classic/
git commit -m "assets: import 78 celtic + 78 classic card images, with WebP variants"
```

---

## Task 4: Self-host Cinzel and Crimson Text fonts

**Files:**
- Create: `assets/fonts/cinzel-regular.woff2`, `cinzel-bold.woff2`, `crimson-regular.woff2`, `crimson-italic.woff2`

- [ ] **Step 1: Download woff2 subsets from Google Fonts**

Use the [google-webfonts-helper](https://gwfh.mranftl.com/fonts) approach: visit `https://gwfh.mranftl.com/fonts/cinzel?subsets=latin,latin-ext` and `https://gwfh.mranftl.com/fonts/crimson-text?subsets=latin,latin-ext`. Download woff2 files for Regular and Bold (Cinzel) and Regular and Italic (Crimson Text).

Place into `assets/fonts/`. Latin-ext covers Irish accented characters (á é í ó ú).

- [ ] **Step 2: Verify file sizes**

```bash
ls -lh assets/fonts/
```

Expected: each woff2 file in the 30-80 KB range. If any file > 100 KB, re-download with smaller subset.

- [ ] **Step 3: Commit fonts**

```bash
git add assets/fonts/
git commit -m "assets: self-host Cinzel + Crimson Text woff2"
```

---

## Task 5: Write shared stylesheet `assets/css/site.css`

**Files:**
- Create: `assets/css/site.css`

- [ ] **Step 1: Define palette, type, and reset**

Write this content to `assets/css/site.css`:

```css
/* thebrigidhearth.com — shared stylesheet */

@font-face {
  font-family: 'Cinzel';
  font-weight: 400;
  font-style: normal;
  src: url('/assets/fonts/cinzel-regular.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'Cinzel';
  font-weight: 700;
  font-style: normal;
  src: url('/assets/fonts/cinzel-bold.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'Crimson Text';
  font-weight: 400;
  font-style: normal;
  src: url('/assets/fonts/crimson-regular.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'Crimson Text';
  font-weight: 400;
  font-style: italic;
  src: url('/assets/fonts/crimson-italic.woff2') format('woff2');
  font-display: swap;
}

:root {
  --green: #1C3A2A;
  --green-deep: #0d1c14;
  --cream: #F7F4EE;
  --gold: #D4B86A;
  --gold-soft: #E5CD92;
  --faint: rgba(247, 244, 238, 0.66);
  --max-width: 1100px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--green);
  color: var(--cream);
  font-family: 'Crimson Text', Georgia, serif;
  font-size: 18px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: 'Cinzel', Georgia, serif;
  color: var(--gold);
  letter-spacing: 0.04em;
  line-height: 1.2;
}
h1 { font-size: clamp(2.5rem, 6vw, 4rem); }
h2 { font-size: clamp(1.6rem, 3.5vw, 2.4rem); }
h3 { font-size: clamp(1.15rem, 2vw, 1.4rem); }

p { margin-bottom: 1rem; }
a { color: var(--gold); text-decoration: none; border-bottom: 1px dotted var(--gold); }
a:hover { color: var(--cream); }

button {
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}
button:hover { background: var(--gold); color: var(--green); }
button:focus-visible { outline: 2px solid var(--cream); outline-offset: 2px; }

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
}

/* Sections */
section { padding: clamp(48px, 8vw, 96px) 0; }

/* Hero */
.hero {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(212,184,106,0.18) 0%, transparent 55%),
    linear-gradient(180deg, var(--green) 0%, var(--green-deep) 100%);
  position: relative;
  overflow: hidden;
}
.hero h1 { margin-bottom: 1rem; }
.hero .tagline {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  font-style: italic;
  color: var(--faint);
  margin-bottom: 2.5rem;
}
.hero .cta-row { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
@media (min-width: 768px) {
  .hero .cta-row { flex-direction: row; justify-content: center; }
}

/* App Store badge */
.app-store-badge {
  display: inline-block;
  height: 56px;
  border: none;
}

.btn-primary {
  display: inline-block;
  background: var(--gold);
  color: var(--green);
  padding: 0.8rem 1.8rem;
  border-radius: 4px;
  font-weight: 700;
  border: none;
}
.btn-primary:hover { background: var(--gold-soft); color: var(--green); }

/* Pillars */
.pillar { display: grid; gap: 2rem; align-items: center; }
@media (min-width: 768px) {
  .pillar { grid-template-columns: 1fr 1fr; gap: 4rem; }
  .pillar.reverse > :first-child { order: 2; }
}
.pillar img { width: 100%; height: auto; border-radius: 8px; }

/* FAQ */
details {
  border-bottom: 1px solid rgba(247,244,238,0.1);
  padding: 1.25rem 0;
}
details summary {
  cursor: pointer;
  font-family: 'Cinzel', Georgia, serif;
  color: var(--gold);
  font-size: 1.1rem;
  list-style: none;
}
details summary::-webkit-details-marker { display: none; }
details[open] summary { margin-bottom: 0.75rem; }
details p { color: var(--cream); }

/* Footer */
footer {
  border-top: 1px solid rgba(247,244,238,0.1);
  padding: 2rem 0;
  text-align: center;
  color: var(--faint);
  font-size: 0.85rem;
}
footer .links { display: flex; gap: 32px; justify-content: center; margin-bottom: 1rem; flex-wrap: wrap; }

/* Card components — populated in later tasks */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 2: Verify the file parses cleanly**

```bash
# No formal validator, but quickly inspect for syntax issues:
head -50 assets/css/site.css
```

- [ ] **Step 3: Commit**

```bash
git add assets/css/site.css
git commit -m "feat: add shared site stylesheet with palette, type, layout primitives"
```

---

## Task 6: Build the daily-card algorithm with TDD

**Files:**
- Create: `tests/site.test.mjs`
- Modify: `assets/js/site.js`

- [ ] **Step 1: Write the failing test for `simpleHash`**

Create `tests/site.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simpleHash } from '../assets/js/site.js';

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
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
node --test tests/site.test.mjs
```

Expected: FAIL — `simpleHash` not exported / not defined.

- [ ] **Step 3: Implement `simpleHash` and minimal export shape**

In `assets/js/site.js`, add:

```javascript
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
```

- [ ] **Step 4: Run the test, verify it passes**

```bash
node --test tests/site.test.mjs
```

Expected: 3 passing.

- [ ] **Step 5: Add tests for `pickDailyCard`**

Append to `tests/site.test.mjs`:

```javascript
import { pickDailyCard } from '../assets/js/site.js';

test('pickDailyCard returns the same card for the same date', () => {
  const deck = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  assert.equal(pickDailyCard(deck, '2026-04-27').slug, pickDailyCard(deck, '2026-04-27').slug);
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
    seen.add(pickDailyCard(deck, `2026-04-${String(d).padStart(2, '0')}`).slug);
  }
  assert.ok(seen.size >= 30, `Expected good distribution, got ${seen.size} unique cards`);
});
```

- [ ] **Step 6: Run all tests, verify pass**

```bash
node --test tests/site.test.mjs
```

Expected: 6 passing.

- [ ] **Step 7: Commit**

```bash
git add assets/js/site.js tests/site.test.mjs
git commit -m "feat: add deterministic daily-card algorithm with tests"
```

---

## Task 7: Build pull-your-own and deck-toggle helpers with TDD

**Files:**
- Modify: `assets/js/site.js`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add tests for `pullRandom`**

Append to `tests/site.test.mjs`:

```javascript
import { pullRandom } from '../assets/js/site.js';

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
```

- [ ] **Step 2: Run, verify fails**

```bash
node --test tests/site.test.mjs
```

Expected: 2 failing (`pullRandom` undefined).

- [ ] **Step 3: Implement `pullRandom`**

In `assets/js/site.js`:

```javascript
export function pullRandom(deck, excludeSlugs = new Set()) {
  const candidates = deck.filter(c => !excludeSlugs.has(c.slug));
  if (candidates.length === 0) return deck[Math.floor(Math.random() * deck.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}
```

- [ ] **Step 4: Run, verify pass**

```bash
node --test tests/site.test.mjs
```

Expected: 8 passing.

- [ ] **Step 5: Add deck-style toggle helpers and tests**

Add to `assets/js/site.js`:

```javascript
const STYLE_KEY = 'deckStyle';

export function getDeckStyle(storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!storage) return 'celtic';
  const v = storage.getItem(STYLE_KEY);
  return v === 'classic' ? 'classic' : 'celtic';
}

export function setDeckStyle(style, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!storage) return;
  if (style !== 'celtic' && style !== 'classic') {
    throw new Error(`Invalid deck style: ${style}`);
  }
  storage.setItem(STYLE_KEY, style);
}
```

Append to `tests/site.test.mjs`:

```javascript
import { getDeckStyle, setDeckStyle } from '../assets/js/site.js';

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
```

- [ ] **Step 6: Run, verify pass**

```bash
node --test tests/site.test.mjs
```

Expected: 11 passing.

- [ ] **Step 7: Commit**

```bash
git add assets/js/site.js tests/site.test.mjs
git commit -m "feat: add pullRandom + deck style toggle helpers with tests"
```

---

## Task 8: Implement the landing page hero section

**Files:**
- Modify: `index.html` (full rewrite)

- [ ] **Step 1: Replace `index.html` with the new structure (hero only for now)**

Overwrite `index.html` with:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Hearth — Irish magical companion · Draíocht</title>
<meta name="description" content="Tend the fire. The Hearth is an Irish magical companion: AI guide Brigid, a 78-card Celtic tarot deck, native plant lore, and the wheel of the year. iOS app — start your 7-day free trial.">
<link rel="canonical" href="https://thebrigidhearth.com/">

<!-- Open Graph / Twitter Card -->
<meta property="og:type" content="website">
<meta property="og:title" content="The Hearth — Tend the fire.">
<meta property="og:description" content="An Irish magical companion: Brigid at the hearth, the Celtic deck, plant lore, the wheel.">
<meta property="og:url" content="https://thebrigidhearth.com/">
<meta property="og:image" content="https://thebrigidhearth.com/assets/img/hero/hero-og.jpg">
<meta name="twitter:card" content="summary_large_image">

<link rel="preload" href="/assets/fonts/cinzel-bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>

<!-- HERO -->
<section class="hero">
  <div class="container">
    <h1>The Hearth</h1>
    <p class="tagline">Tend the fire.</p>
    <div class="cta-row">
      <a href="https://apps.apple.com/app/id6761735989" aria-label="Download on the App Store">
        <img class="app-store-badge" src="/assets/img/hero/app-store-badge.svg" alt="Download on the App Store" width="168" height="56">
      </a>
      <a class="btn-primary" href="https://apps.apple.com/app/id6761735989">Begin 7-day free trial</a>
    </div>
  </div>
</section>

<!-- DAILY CARD section — populated in Task 9 -->

<!-- PILLARS — populated in Task 10 -->

<!-- FOUNDER — populated in Task 11 -->

<!-- FAQ — populated in Task 12 -->

<!-- FINAL CTA — populated in Task 13 -->

<footer>
  <div class="container">
    <nav class="links">
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/support.html">Support</a>
      <a href="/terms.html">Terms of Use</a>
    </nav>
    <p>© 2026 Siobhan McAuley · thebrigidhearth.com</p>
  </div>
</footer>

<script type="module" src="/assets/js/site.js"></script>
</body>
</html>
```

- [ ] **Step 2: Place a temporary App Store badge image**

Until a real SVG is available, save a placeholder. Apple's official badges are at https://developer.apple.com/app-store/marketing/guidelines/ — download the standard black badge as SVG, save to `assets/img/hero/app-store-badge.svg`. If unavailable in this session, use a simple 168×56 transparent PNG placeholder so the page renders.

- [ ] **Step 3: Visually verify the hero**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
python3 -m http.server 8000
```

Open http://localhost:8000/ in a browser. Verify:
- Hero fills 90vh, dark green with gold glow center
- "The Hearth" displays in Cinzel gold
- Tagline "Tend the fire." in italic cream
- Both CTAs visible and clickable
- Footer links work

Stop server (Ctrl-C) after verification.

- [ ] **Step 4: Commit**

```bash
git add index.html assets/img/hero/
git commit -m "feat: rebuild landing page hero with new copy and CTA structure"
```

---

## Task 9: Implement the daily-card section

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`
- Modify: `assets/js/site.js`

- [ ] **Step 1: Add the section markup**

In `index.html`, replace the `<!-- DAILY CARD section ... -->` comment with:

```html
<section class="daily-card-section" id="daily">
  <div class="container">
    <p class="label">Today's card</p>
    <h2 id="daily-card-date"></h2>
    <div id="daily-card" class="card-display" aria-live="polite">
      <!-- Populated by site.js -->
    </div>
    <button id="pull-button" class="pull-button" aria-controls="pull-result">Pull a different card</button>
    <div id="pull-result" class="card-display" hidden></div>
  </div>
</section>
```

- [ ] **Step 2: Add CSS for the daily card section**

Append to `assets/css/site.css`:

```css
.daily-card-section { text-align: center; }
.daily-card-section .label {
  font-family: 'Cinzel', Georgia, serif;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.85rem;
  color: var(--gold);
  margin-bottom: 0.5rem;
}
.daily-card-section h2 { color: var(--cream); font-size: 1.2rem; font-weight: normal; letter-spacing: normal; margin-bottom: 2rem; }

.card-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.card-display img {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}
.card-display .name-irish {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.6rem;
  color: var(--gold);
}
.card-display .name-classic { color: var(--faint); font-size: 0.95rem; }
.card-display .meaning { max-width: 480px; font-style: italic; }

.pull-button {
  margin: 1rem auto 0;
  display: inline-block;
}

/* Card flip — only used by pull-your-own */
.card-flip {
  perspective: 1000px;
  width: 200px;
  height: 320px;
  margin: 0 auto;
}
.card-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.4, 0.2, 0.2, 1);
}
.card-flip.flipped .card-flip-inner { transform: rotateY(180deg); }
.card-flip-front, .card-flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-flip-front {
  background: linear-gradient(145deg, var(--green) 0%, var(--green-deep) 100%);
  border: 2px solid var(--gold);
  color: var(--gold);
  font-family: 'Cinzel', Georgia, serif;
  font-size: 2rem;
}
.card-flip-back {
  transform: rotateY(180deg);
  background: var(--green);
}
.card-flip-back img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
```

- [ ] **Step 3: Wire up JS to render the daily card**

Append to `assets/js/site.js`:

```javascript
// --- Browser-only init (skipped in node tests) ---
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initLanding());
}

async function initLanding() {
  const dailyEl = document.getElementById('daily-card');
  if (!dailyEl) return;

  const deck = await fetch('/data/deck.json').then(r => r.json());
  const today = new Date().toISOString().slice(0, 10);
  const card = pickDailyCard(deck, today);
  const style = getDeckStyle();

  document.getElementById('daily-card-date').textContent =
    new Date(today).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  dailyEl.innerHTML = renderCardHTML(card, style);

  // Pull-your-own — animated flip per spec §7.2
  document.getElementById('pull-button').addEventListener('click', () => {
    const exclude = new Set([card.slug]);
    const pulled = pullRandom(deck, exclude);
    const resultEl = document.getElementById('pull-result');
    resultEl.hidden = false;
    resultEl.innerHTML = renderFlipHTML(pulled, getDeckStyle());
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flipEl = resultEl.querySelector('.card-flip');
    if (reduced) {
      flipEl.classList.add('flipped');
      revealMeaningPanel(resultEl, pulled, getDeckStyle());
    } else {
      requestAnimationFrame(() => {
        flipEl.classList.add('flipped');
        flipEl.addEventListener('transitionend', () => revealMeaningPanel(resultEl, pulled, getDeckStyle()), { once: true });
      });
    }
  });
}

function renderFlipHTML(card, style) {
  const slug = style === 'celtic' ? card.slug : card.classicSlug;
  const ext = style === 'celtic' ? 'png' : 'jpg';
  return `
    <div class="card-flip" aria-hidden="false">
      <div class="card-flip-inner">
        <div class="card-flip-front">✦</div>
        <div class="card-flip-back">
          <picture>
            <source srcset="/assets/img/${style}/${slug}.webp" type="image/webp">
            <img src="/assets/img/${style}/${slug}.${ext}" alt="${card.nameEnglish}">
          </picture>
        </div>
      </div>
    </div>
    <div class="card-meaning-panel" hidden></div>
  `;
}

function revealMeaningPanel(resultEl, card, style) {
  const headline = style === 'celtic' ? card.nameIrish : card.nameClassic;
  const sub = style === 'celtic' ? card.nameClassic : card.nameIrish;
  const panel = resultEl.querySelector('.card-meaning-panel');
  panel.hidden = false;
  panel.innerHTML = `
    <div class="name-irish">${headline}</div>
    <div class="name-classic">${sub}</div>
    <p class="meaning">${(card.uprightMeaning || '').split('.')[0]}.</p>
    <a href="/deck/${card.slug}.html">Read this card with Brigid →</a>
  `;
}

function renderCardHTML(card, style) {
  const imgWebp = `/assets/img/${style}/${style === 'celtic' ? card.slug : card.classicSlug}.webp`;
  const imgFallback = `/assets/img/${style}/${style === 'celtic' ? card.slug : card.classicSlug}.${style === 'celtic' ? 'png' : 'jpg'}`;
  const headline = style === 'celtic' ? card.nameIrish : card.nameClassic;
  const sub = style === 'celtic' ? card.nameClassic : card.nameIrish;
  return `
    <a href="/deck/${card.slug}.html" aria-label="${headline}">
      <picture>
        <source srcset="${imgWebp}" type="image/webp">
        <img src="${imgFallback}" alt="${card.nameEnglish}" loading="lazy">
      </picture>
    </a>
    <div>
      <div class="name-irish">${headline}</div>
      <div class="name-classic">${sub}</div>
    </div>
    <p class="meaning">${(card.uprightMeaning || '').split('.')[0]}.</p>
    <a href="/deck/${card.slug}.html">Read more →</a>
  `;
}
```

- [ ] **Step 4: Verify in browser**

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/. Verify:
- Daily card appears below hero (no flip — already revealed)
- Date shows today's date
- Card image, Irish name, classic name, 1-line meaning all render
- Click "Pull a different card" → card-back face shows briefly → flips 600ms → reveals meaning panel
- Toggle macOS System Settings → Accessibility → Display → Reduce motion ON → reload → click pull → flip skips, content reveals immediately

Stop server.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/site.css assets/js/site.js
git commit -m "feat: add daily card section with animated pull-your-own widget"
```

---

## Task 10: Implement the four pillar sections

**Files:**
- Modify: `index.html`
- Create: `assets/img/pillars/brigid.png` (placeholder), `cards.png`, `plants.png`, `wheel.png`

- [ ] **Step 1: Add placeholder pillar illustrations**

Until final illustrations exist, use solid-color SVG placeholders. Create them inline as data URIs or save 4 simple 800×600 PNG fills. Acceptable for V1 launch with a note in `README.md` that final art replaces these later.

```bash
# Quick placeholder generation — green tile with gold ornament glyph
for name in brigid cards plants wheel; do
  cat > "assets/img/pillars/${name}.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#1C3A2A"/>
  <text x="50%" y="50%" font-family="Cinzel,Georgia,serif" font-size="180" fill="#D4B86A" text-anchor="middle" dominant-baseline="middle">✦</text>
</svg>
EOF
done
```

- [ ] **Step 2: Add pillar markup to `index.html`**

Replace the `<!-- PILLARS -->` comment with:

```html
<section id="pillars">
  <div class="container">
    <article class="pillar">
      <img src="/assets/img/pillars/brigid.svg" alt="Brigid by the hearth, illustration" loading="lazy">
      <div>
        <h2>Brigid at the Hearth</h2>
        <p>Sit by the fire with Brigid — an AI companion grounded in Irish folk tradition. She knows your readings, the season you're in, and the rituals you've kept. Bring her your questions; she answers as a goddess does — slant.</p>
      </div>
    </article>

    <article class="pillar reverse">
      <img src="/assets/img/pillars/cards.svg" alt="Celtic deck, fan of cards" loading="lazy">
      <div>
        <h2>The Celtic Deck</h2>
        <p>Seventy-eight cards in Irish and English — Branches, Wells, Winds, Stones — drawn from native lore and mythology. Choose Celtic naming or traditional Smith-Waite. <a href="/deck/">Browse the deck →</a></p>
      </div>
    </article>

    <article class="pillar">
      <img src="/assets/img/pillars/plants.svg" alt="Native Irish plants illustration" loading="lazy">
      <div>
        <h2>The Green Path</h2>
        <p>Sixty-three native plants and the conditions our ancestors used them for. Traditional preparations, folk uses, and the ailments they were trusted with — together in a herbal you can carry. (Not medical advice.)</p>
      </div>
    </article>

    <article class="pillar reverse">
      <img src="/assets/img/pillars/wheel.svg" alt="Wheel of the Year illustration" loading="lazy">
      <div>
        <h2>The Wheel of the Year</h2>
        <p>The eight fire festivals of the Celtic year — Imbolc, Bealtaine, Lughnasadh, Samhain, and the four solar holidays between. Lunar phases, seasonal threshold rituals, and what to do when.</p>
      </div>
    </article>
  </div>
</section>
```

- [ ] **Step 3: Add CSS spacing between pillars**

Append to `assets/css/site.css`:

```css
#pillars .pillar { margin-bottom: clamp(48px, 8vw, 96px); }
#pillars .pillar:last-child { margin-bottom: 0; }
```

- [ ] **Step 4: Verify in browser**

```bash
python3 -m http.server 8000
```

Verify each pillar shows on mobile (stacked) and desktop (alternating). Stop server.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/site.css assets/img/pillars/
git commit -m "feat: add four pillar sections (Brigid, Cards, Green Path, Wheel)"
```

---

## Task 11: Implement the founder section

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`
- Create: `assets/img/founder.jpg` (placeholder until user provides final)

- [ ] **Step 1: Save founder photo placeholder**

If the user has not provided the final photo at this step, save a 600×600 placeholder (solid gold tile with monogram). Note in README.md that final photo replaces this.

- [ ] **Step 2: Add markup**

Replace `<!-- FOUNDER -->` with:

```html
<section id="founder">
  <div class="container">
    <div class="founder-row">
      <img src="/assets/img/founder.jpg" alt="Siobhan McAuley" class="founder-photo" width="240" height="240" loading="lazy">
      <div>
        <h2>Why I built this</h2>
        <p>I grew up between two worlds — Boston and the west of Ireland. The old ways were never far: my grandmother's prayers, the bonfires at Bealtaine, the herbs my aunt grew along the wall. I built The Hearth because I wanted a place to keep them — not as nostalgia, but as a daily practice. Brigid keeps the fire here. You're welcome to it.</p>
        <p style="color: var(--faint); font-size: 0.9rem;">— Siobhan McAuley, builder of The Hearth</p>
      </div>
    </div>
  </div>
</section>
```

(Final founder note copy will be reviewed with Siobhan during implementation.)

- [ ] **Step 3: Add CSS**

Append to `assets/css/site.css`:

```css
.founder-row { display: grid; gap: 2rem; align-items: center; }
.founder-photo {
  width: 240px;
  height: 240px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--gold);
  justify-self: center;
}
@media (min-width: 768px) {
  .founder-row { grid-template-columns: 240px 1fr; gap: 3rem; }
}
```

- [ ] **Step 4: Verify and commit**

```bash
python3 -m http.server 8000
```

Verify section. Stop. Commit:

```bash
git add index.html assets/css/site.css assets/img/founder.jpg
git commit -m "feat: add founder section with placeholder photo"
```

---

## Task 12: Implement the FAQ section

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add FAQ markup**

Replace `<!-- FAQ -->` with:

```html
<section id="faq">
  <div class="container" style="max-width: 760px;">
    <h2 style="text-align: center; margin-bottom: 2.5rem;">Questions</h2>

    <details>
      <summary>Is this religious?</summary>
      <p>No. The Hearth draws on Irish folk tradition — practice it as cultural heritage, as faith, or simply out of curiosity. The app makes no demand of belief.</p>
    </details>

    <details>
      <summary>Do I need to be Irish?</summary>
      <p>No. You'll learn the names and the seasons as you go. Brigid speaks plainly.</p>
    </details>

    <details>
      <summary>I'm new to tarot — will I get it?</summary>
      <p>Yes. The Hearth teaches as you read. Start with a single card; Brigid will walk you through it.</p>
    </details>

    <details>
      <summary>Is the plant medicine medical advice?</summary>
      <p>No. The Green Path is a record of traditional folk uses and is intended as cultural and educational material only. Always consult a doctor for medical issues.</p>
    </details>

    <details>
      <summary>What's the difference between free and Practitioner?</summary>
      <p>The free tier gives you the full deck, daily card, plant browser, and limited conversations with Brigid. Practitioner ($69.99/year, 7-day free trial) unlocks unlimited Brigid, the Celtic Cross spread, full Grimoire, and the ritual log. Cancel anytime.</p>
    </details>

    <details>
      <summary>Can I cancel?</summary>
      <p>Yes — anytime in your iPhone Settings → Subscriptions. Practitioner access remains until the end of the current period.</p>
    </details>

    <details>
      <summary>Is there an Android version?</summary>
      <p>Not yet. iOS first; Android is on the roadmap.</p>
    </details>

    <details>
      <summary>Where is my data stored?</summary>
      <p>Encrypted on Supabase (EU region). We do not sell your data, run ads, or share with third parties beyond what's needed to provide Brigid's responses (Anthropic, who do not train on user data). See <a href="/privacy.html">our privacy policy</a>.</p>
    </details>
  </div>
</section>
```

- [ ] **Step 2: Verify and commit**

```bash
python3 -m http.server 8000
```

Verify FAQ expands/collapses. Stop. Commit:

```bash
git add index.html
git commit -m "feat: add FAQ section with 8 expandable items"
```

---

## Task 13: Implement the final CTA strip

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Add markup**

Replace `<!-- FINAL CTA -->` with:

```html
<section id="final-cta">
  <div class="container">
    <h2>Tend the fire.</h2>
    <a href="https://apps.apple.com/app/id6761735989" aria-label="Download on the App Store">
      <img class="app-store-badge" src="/assets/img/hero/app-store-badge.svg" alt="Download on the App Store" width="168" height="56">
    </a>
  </div>
</section>
```

- [ ] **Step 2: Add CSS**

Append to `assets/css/site.css`:

```css
#final-cta {
  background: var(--green-deep);
  text-align: center;
  border-top: 1px solid rgba(212,184,106,0.18);
}
#final-cta h2 { margin-bottom: 1.5rem; }
```

- [ ] **Step 3: Verify and commit**

```bash
python3 -m http.server 8000
```

Verify the strip. Commit:

```bash
git add index.html assets/css/site.css
git commit -m "feat: add final CTA strip"
```

---

## Task 14: Build the deck index page

**Files:**
- Create: `deck/index.html`
- Modify: `assets/css/site.css`
- Modify: `assets/js/site.js`

- [ ] **Step 1: Write `deck/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Celtic Deck — 78 cards · The Hearth</title>
<meta name="description" content="Browse all 78 cards of the Celtic deck — 22 majors and 56 minors of Branches, Wells, Winds, and Stones. Toggle between Celtic and Smith-Waite naming.">
<link rel="canonical" href="https://thebrigidhearth.com/deck/">
<meta property="og:title" content="The Celtic Deck — 78 cards">
<meta property="og:image" content="https://thebrigidhearth.com/assets/img/hero/hero-og.jpg">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>

<header class="page-header">
  <div class="container">
    <a href="/" class="back-home">← The Hearth</a>
    <h1>The Celtic Deck</h1>
    <p class="subtitle">78 cards. Twenty-two majors and four suits — Branches, Wells, Winds, Stones.</p>

    <div class="deck-controls">
      <div class="toggle" role="group" aria-label="Deck style">
        <button id="style-celtic" aria-pressed="true">Celtic</button>
        <button id="style-classic" aria-pressed="false">Classic</button>
      </div>
      <div class="filters" role="group" aria-label="Filter by suit">
        <button data-suit="all" aria-pressed="true">All</button>
        <button data-suit="major">Major</button>
        <button data-suit="branches">Branches</button>
        <button data-suit="wells">Wells</button>
        <button data-suit="winds">Winds</button>
        <button data-suit="stones">Stones</button>
      </div>
    </div>
  </div>
</header>

<main>
  <div class="container">
    <div id="deck-grid" class="deck-grid"></div>
  </div>
</main>

<footer>
  <div class="container">
    <nav class="links">
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/support.html">Support</a>
      <a href="/terms.html">Terms of Use</a>
    </nav>
    <p>© 2026 Siobhan McAuley · thebrigidhearth.com</p>
  </div>
</footer>

<script type="module" src="/assets/js/site.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add CSS**

Append to `assets/css/site.css`:

```css
.page-header { padding: 64px 0 32px; text-align: center; }
.back-home { font-size: 0.9rem; color: var(--faint); border: none; }
.subtitle { color: var(--faint); margin: 0.5rem 0 2rem; }

.deck-controls { display: flex; flex-direction: column; gap: 1.25rem; align-items: center; margin-bottom: 1rem; }
.toggle, .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
.toggle button, .filters button {
  padding: 0.4rem 0.9rem;
  font-size: 0.9rem;
  border-radius: 999px;
}
.toggle button[aria-pressed="true"], .filters button[aria-pressed="true"] {
  background: var(--gold);
  color: var(--green);
}

.deck-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 32px 0 96px;
}
@media (min-width: 768px) { .deck-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; } }
@media (min-width: 1024px) { .deck-grid { grid-template-columns: repeat(6, 1fr); } }

.deck-grid a { border: none; display: flex; flex-direction: column; gap: 0.4rem; text-align: center; }
.deck-grid img { width: 100%; height: auto; border-radius: 6px; transition: transform 0.2s ease; }
.deck-grid a:hover img { transform: translateY(-4px); }
.deck-grid .name { font-family: 'Cinzel', Georgia, serif; color: var(--gold); font-size: 0.95rem; }
```

- [ ] **Step 3: Wire up JS for the grid**

Append to `assets/js/site.js`:

```javascript
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initDeckIndex());
}

async function initDeckIndex() {
  const grid = document.getElementById('deck-grid');
  if (!grid) return;

  const deck = await fetch('/data/deck.json').then(r => r.json());
  let activeSuit = 'all';
  let activeStyle = getDeckStyle();

  // Reflect active style in toggle buttons
  refreshStyleButtons();

  document.getElementById('style-celtic').addEventListener('click', () => {
    setDeckStyle('celtic'); activeStyle = 'celtic'; refreshStyleButtons(); render();
  });
  document.getElementById('style-classic').addEventListener('click', () => {
    setDeckStyle('classic'); activeStyle = 'classic'; refreshStyleButtons(); render();
  });
  document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSuit = btn.dataset.suit;
      document.querySelectorAll('.filters button').forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      render();
    });
  });

  function refreshStyleButtons() {
    document.getElementById('style-celtic').setAttribute('aria-pressed', activeStyle === 'celtic' ? 'true' : 'false');
    document.getElementById('style-classic').setAttribute('aria-pressed', activeStyle === 'classic' ? 'true' : 'false');
  }

  function render() {
    const filtered = activeSuit === 'all' ? deck : deck.filter(c => c.suit === activeSuit);
    grid.innerHTML = filtered.map(card => {
      const slug = activeStyle === 'celtic' ? card.slug : card.classicSlug;
      const ext = activeStyle === 'celtic' ? 'png' : 'jpg';
      const name = activeStyle === 'celtic' ? card.nameIrish : card.nameClassic;
      return `
        <a href="/deck/${card.slug}.html">
          <picture>
            <source srcset="/assets/img/${activeStyle}/${slug}.webp" type="image/webp">
            <img src="/assets/img/${activeStyle}/${slug}.${ext}" alt="${card.nameEnglish}" loading="lazy">
          </picture>
          <div class="name">${name}</div>
        </a>`;
    }).join('');
  }

  render();
}
```

- [ ] **Step 4: Verify in browser**

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/deck/. Verify:
- 78 cards render in a grid
- Filters narrow to each suit
- Style toggle switches all images and names
- Cards are clickable (will 404 until Task 15 generates them)

Stop server.

- [ ] **Step 5: Commit**

```bash
git add deck/index.html assets/css/site.css assets/js/site.js
git commit -m "feat: add deck browse page with style toggle and suit filters"
```

---

## Task 15: Build the card-detail page generator (TDD)

**Files:**
- Create: `scripts/generate-deck-pages.mjs`
- Create: `tests/generate-deck-pages.test.mjs`

- [ ] **Step 1: Write a test for the page rendering function**

Create `tests/generate-deck-pages.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run, verify fails**

```bash
node --test tests/generate-deck-pages.test.mjs
```

Expected: import fails / function undefined.

- [ ] **Step 3: Implement the generator**

Create `scripts/generate-deck-pages.mjs`:

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function escape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

export function renderCardPage(card) {
  const url = `https://thebrigidhearth.com/deck/${card.slug}.html`;
  const titleHead = `${card.nameIrish} · ${card.nameEnglish} (${card.nameClassic}) — Celtic Tarot`;
  const meta = `${card.nameIrish} (${card.nameEnglish} / ${card.nameClassic}) — ${(card.uprightMeaning || '').slice(0, 140)}`;
  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type':'ListItem', position:1, name:'The Hearth', item:'https://thebrigidhearth.com/' },
      { '@type':'ListItem', position:2, name:'The Celtic Deck', item:'https://thebrigidhearth.com/deck/' },
      { '@type':'ListItem', position:3, name: card.nameEnglish, item: url }
    ]
  }, null, 2);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(titleHead)}</title>
<meta name="description" content="${escape(meta)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escape(card.nameIrish + ' — ' + card.nameClassic)}">
<meta property="og:description" content="${escape((card.uprightMeaning || '').slice(0, 200))}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://thebrigidhearth.com/assets/img/celtic/${card.slug}.png">
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">${breadcrumb}</script>
</head>
<body>

<header class="page-header">
  <div class="container">
    <a href="/deck/" class="back-home">← The Celtic Deck</a>
    <p class="label">${escape(card.suitDisplay)}${card.number !== undefined ? ' · ' + romanize(card.number) : ''}</p>
    <h1>${escape(card.nameIrish)}</h1>
    <p class="subtitle">${escape(card.nameEnglish)}${card.nameClassic !== card.nameEnglish ? ' · ' + escape(card.nameClassic) : ''}</p>
    <div class="toggle" role="group" aria-label="Deck style" style="margin-top:1.5rem;justify-content:center;display:flex;gap:0.5rem;">
      <button id="style-celtic" aria-pressed="true">Celtic</button>
      <button id="style-classic" aria-pressed="false">Classic</button>
    </div>
  </div>
</header>

<main>
  <div class="container card-detail-container">
    <picture id="card-art">
      <source srcset="/assets/img/celtic/${card.slug}.webp" type="image/webp">
      <img src="/assets/img/celtic/${card.slug}.png" alt="${escape(card.nameEnglish)}" width="600" height="900">
    </picture>

    ${card.keywords?.length ? `<p class="keywords">${card.keywords.map(escape).join(' · ')}</p>` : ''}

    <section class="card-meaning">
      <h2>Upright</h2>
      <p>${escape(card.uprightMeaning || '')}</p>
    </section>

    <section class="card-meaning">
      <h2>Reversed</h2>
      <p>${escape(card.reversedMeaning || '')}</p>
    </section>

    ${card.irishLore ? `<section class="card-meaning"><h2>Irish lore</h2><p>${escape(card.irishLore)}</p></section>` : ''}

    <section class="card-cta" style="text-align:center;margin-top:3rem;">
      <p>Read this card with Brigid →</p>
      <a href="https://apps.apple.com/app/id6761735989" aria-label="Download on the App Store">
        <img class="app-store-badge" src="/assets/img/hero/app-store-badge.svg" alt="Download on the App Store" width="168" height="56">
      </a>
    </section>
  </div>
</main>

<footer>
  <div class="container">
    <nav class="links">
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/support.html">Support</a>
      <a href="/terms.html">Terms of Use</a>
    </nav>
    <p>© 2026 Siobhan McAuley · thebrigidhearth.com</p>
  </div>
</footer>

<script type="module">
  import { getDeckStyle, setDeckStyle } from '/assets/js/site.js';
  const card = ${JSON.stringify({ slug: card.slug, classicSlug: card.classicSlug, nameIrish: card.nameIrish, nameClassic: card.nameClassic })};

  function applyStyle(style) {
    const slug = style === 'celtic' ? card.slug : card.classicSlug;
    const ext = style === 'celtic' ? 'png' : 'jpg';
    const pic = document.getElementById('card-art');
    pic.querySelector('source').srcset = '/assets/img/' + style + '/' + slug + '.webp';
    pic.querySelector('img').src = '/assets/img/' + style + '/' + slug + '.' + ext;
    document.querySelector('h1').textContent = style === 'celtic' ? card.nameIrish : card.nameClassic;
    document.getElementById('style-celtic').setAttribute('aria-pressed', style === 'celtic');
    document.getElementById('style-classic').setAttribute('aria-pressed', style === 'classic');
  }

  applyStyle(getDeckStyle());
  document.getElementById('style-celtic').addEventListener('click', () => { setDeckStyle('celtic'); applyStyle('celtic'); });
  document.getElementById('style-classic').addEventListener('click', () => { setDeckStyle('classic'); applyStyle('classic'); });
</script>

</body>
</html>`;
}

function romanize(n) {
  const map = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
  let result = ''; let num = n;
  for (const [r, v] of map) { while (num >= v) { result += r; num -= v; } }
  return result || '0';
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const deck = JSON.parse(readFileSync(resolve(ROOT, 'data/deck.json'), 'utf8'));
  mkdirSync(resolve(ROOT, 'deck'), { recursive: true });
  let count = 0;
  for (const card of deck) {
    const html = renderCardPage(card);
    writeFileSync(resolve(ROOT, 'deck', `${card.slug}.html`), html);
    count++;
  }
  console.log(`Generated ${count} card pages.`);
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
node --test tests/generate-deck-pages.test.mjs
```

Expected: 5 passing.

- [ ] **Step 5: Add CSS for card detail layout**

Append to `assets/css/site.css`:

```css
.card-detail-container { max-width: 720px; }
.card-detail-container picture img { width: 100%; max-width: 480px; display: block; margin: 0 auto 2rem; border-radius: 12px; box-shadow: 0 16px 60px rgba(0,0,0,0.5); }
.card-detail-container .keywords {
  text-align: center;
  font-style: italic;
  color: var(--gold);
  margin-bottom: 2rem;
  letter-spacing: 0.04em;
}
.card-meaning { margin-bottom: 2rem; }
.card-meaning h2 { font-size: 1.2rem; margin-bottom: 0.5rem; }
```

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-deck-pages.mjs tests/generate-deck-pages.test.mjs assets/css/site.css
git commit -m "feat: add card-detail page generator with tests"
```

---

## Task 16: Generate the 78 card pages

**Files:**
- Create: `deck/<slug>.html` × 78

- [ ] **Step 1: Run the generator**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
node scripts/generate-deck-pages.mjs
```

Expected: `Generated 78 card pages.`

- [ ] **Step 2: Verify file count**

```bash
ls deck/*.html | grep -v 'index.html' | wc -l    # expect 78
```

- [ ] **Step 3: Spot-check a few pages in browser**

```bash
python3 -m http.server 8000
```

Visit http://localhost:8000/deck/the-wheel.html and a few minor-arcana pages. Verify:
- Card art displays
- Names and meanings render
- Style toggle swaps art and headline name
- Back link to /deck/ works
- App Store CTA visible

Stop server.

- [ ] **Step 4: Commit generated pages**

```bash
git add deck/*.html
git commit -m "feat: generate 78 individual card pages"
```

---

## Task 17: Restyle existing legal pages

**Files:**
- Modify: `privacy.html`, `support.html`, `terms.html`

- [ ] **Step 1: Standardise privacy.html**

Open `privacy.html`. Replace any inline `<style>` with `<link rel="stylesheet" href="/assets/css/site.css">`. Wrap content in `.container`. Keep all text content identical. Use the same `<header class="page-header">` (with back link to `/`) and standard `<footer>` markup as the deck pages.

- [ ] **Step 2: Standardise support.html and terms.html the same way**

Repeat. Do not change copy. The goal is shared CSS only.

- [ ] **Step 3: Verify in browser**

```bash
python3 -m http.server 8000
```

Visit /privacy.html, /support.html, /terms.html. Verify they share the new typography and palette and that all content text is preserved.

- [ ] **Step 4: Commit**

```bash
git add privacy.html support.html terms.html
git commit -m "style: align legal pages with shared stylesheet"
```

---

## Task 18: Generate sitemap.xml

**Files:**
- Create: `scripts/generate-sitemap.mjs`
- Create: `sitemap.xml`
- Create: `robots.txt`

- [ ] **Step 1: Write the sitemap generator**

Create `scripts/generate-sitemap.mjs`:

```javascript
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://thebrigidhearth.com';

const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: '/', priority: '1.0' },
  { loc: '/privacy.html', priority: '0.4' },
  { loc: '/support.html', priority: '0.4' },
  { loc: '/terms.html', priority: '0.4' },
  { loc: '/deck/', priority: '0.9' },
];

for (const file of readdirSync(resolve(ROOT, 'deck'))) {
  if (file.endsWith('.html') && file !== 'index.html') {
    urls.push({ loc: `/deck/${file}`, priority: '0.7' });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(resolve(ROOT, 'sitemap.xml'), xml);
console.log(`Wrote sitemap with ${urls.length} URLs.`);
```

- [ ] **Step 2: Run the generator**

```bash
node scripts/generate-sitemap.mjs
```

Expected: `Wrote sitemap with 83 URLs.`

- [ ] **Step 3: Write robots.txt**

```bash
cat > robots.txt << 'EOF'
User-agent: *
Allow: /
Sitemap: https://thebrigidhearth.com/sitemap.xml
EOF
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-sitemap.mjs sitemap.xml robots.txt
git commit -m "seo: add sitemap.xml generator and robots.txt"
```

---

## Task 19: Add MobileApplication JSON-LD on landing

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add JSON-LD before `</head>`**

In `index.html`, add inside `<head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "The Hearth — Draíocht",
  "operatingSystem": "iOS",
  "applicationCategory": "LifestyleApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "url": "https://thebrigidhearth.com/",
  "downloadUrl": "https://apps.apple.com/app/id6761735989",
  "author": { "@type": "Person", "name": "Siobhan McAuley" }
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "seo: add MobileApplication JSON-LD"
```

---

## Task 20: Performance pass — verify lazy-loading, preloads, sizes

**Files:**
- Modify: any with missing optimizations

- [ ] **Step 1: Audit lazy-load and decoding attributes**

```bash
grep -L 'loading="lazy"' deck/*.html | head    # files missing lazy load
grep -c 'loading="lazy"' index.html
```

Add `loading="lazy"` to any `<img>` not in the hero. Add `decoding="async"` to all images for parallel decoding.

- [ ] **Step 2: Add `<link rel="preload">` for hero font in deck and card pages**

In `deck/index.html` and the generator's HTML, add inside `<head>`:

```html
<link rel="preload" href="/assets/fonts/cinzel-bold.woff2" as="font" type="font/woff2" crossorigin>
```

If added to the generator template, regenerate the 78 pages:

```bash
node scripts/generate-deck-pages.mjs
git add deck/*.html scripts/generate-deck-pages.mjs
```

- [ ] **Step 3: Run a Lighthouse audit**

```bash
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 2
npx lighthouse http://localhost:8000/ --quiet --chrome-flags="--headless" --output=json --output-path=lighthouse-landing.json
npx lighthouse http://localhost:8000/deck/ --quiet --chrome-flags="--headless" --output=json --output-path=lighthouse-deck.json
npx lighthouse http://localhost:8000/deck/the-wheel.html --quiet --chrome-flags="--headless" --output=json --output-path=lighthouse-card.json
kill $SERVER_PID
```

- [ ] **Step 4: Read the scores**

```bash
node -e "
const files = ['lighthouse-landing.json','lighthouse-deck.json','lighthouse-card.json'];
for (const f of files) {
  const data = JSON.parse(require('fs').readFileSync(f));
  const c = data.categories;
  console.log(f, c.performance.score, c.seo.score, c.accessibility.score, c['best-practices'].score);
}
"
```

Expected: each ≥ 0.95 across performance, seo, accessibility, best-practices. If any falls below, investigate that audit's "opportunities" and address (most common: missing image dimensions, render-blocking CSS, unoptimized images).

- [ ] **Step 5: Clean up Lighthouse JSON and commit**

```bash
rm lighthouse-*.json
git add -A
git commit -m "perf: add preloads, decoding hints, verify Lighthouse ≥95 across pages"
```

---

## Task 21: Update README with maintenance instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append maintenance section**

```bash
cat >> README.md << 'EOF'

## Maintenance

### Regenerate the 78 card pages

```bash
node scripts/generate-deck-pages.mjs
```

Run after `data/deck.json` changes.

### Regenerate the sitemap

```bash
node scripts/generate-sitemap.mjs
```

Run after adding new pages.

### Re-export the deck from the app

Run from the app repo:

```bash
cd ~/Desktop/testing\ claude\ code/draiocht
npx tsx scripts/export-deck-for-site.mjs
```

### Convert images to WebP

```bash
./scripts/convert-images.sh
```

Run after adding new card art.

### Run tests

```bash
node --test tests/
```

### Replace placeholder assets

These are placeholders pending final art:
- `assets/img/founder.jpg` — replace with real photo from Siobhan
- `assets/img/pillars/*.svg` — replace with commissioned illustrations
- `assets/img/hero/hero.webp` and `hero-og.jpg` — replace with hero atmospheric image
EOF

git add README.md
git commit -m "docs: add maintenance instructions to README"
```

---

## Task 22: Push to GitHub and verify deploy

**Files:**
- GitHub: new repo
- DNS: existing Namecheap config
- Pages: existing GitHub Pages config

- [ ] **Step 1: Create the GitHub repo via gh**

```bash
cd ~/Desktop/MISC/thebrigidhearth-site
gh repo create thebrigidhearth-site --public --description "Marketing site for The Hearth (Draíocht) iOS app" --source=. --remote=origin --push
```

If repo already exists from earlier setup, instead:

```bash
git remote add origin https://github.com/<your-handle>/thebrigidhearth-site.git
git push -u origin main
```

- [ ] **Step 2: Confirm GitHub Pages settings**

```bash
gh repo view --json url
# In browser: Repo → Settings → Pages →
# Source: Deploy from a branch
# Branch: main / root
# Custom domain: thebrigidhearth.com
# Enforce HTTPS: ✓
```

- [ ] **Step 3: Verify CNAME and DNS are intact**

```bash
cat CNAME    # should contain "thebrigidhearth.com"
dig +short thebrigidhearth.com    # should resolve to 185.199.108-111.153 (GH Pages)
```

- [ ] **Step 4: Wait for build, smoke-test live site**

Watch the deploy:

```bash
gh run list --limit 5
```

Once green, visit `https://thebrigidhearth.com/` in a browser. Verify:
- New landing renders correctly (not the placeholder)
- Daily card loads and displays today's card
- Pull-your-own works
- /deck/ shows the grid
- /deck/the-wheel.html (and any card) renders correctly
- Style toggle persists across pages
- Existing /privacy.html, /support.html, /terms.html still work
- robots.txt and sitemap.xml resolve

- [ ] **Step 5: Verify all placeholder assets are replaced**

Final pre-launch checklist — confirm none of these are still placeholders:
- `assets/img/hero/app-store-badge.svg` — must be official Apple-provided SVG, not a transparent PNG placeholder
- `assets/img/founder.jpg` — real photo from Siobhan, not the gold tile
- `assets/img/pillars/*.svg` — final illustrations or commissioned art (acceptable to ship with placeholders if explicitly approved)
- `assets/img/hero/hero-og.jpg` — final OG share image (1200×630)

Update README's placeholder list (Task 21) to reflect what shipped vs. what is still pending.

- [ ] **Step 6: Tag V1 release**

```bash
git tag -a v1.0.0 -m "thebrigidhearth.com V1 launch"
git push origin v1.0.0
```

---

## Acceptance criteria (from spec §14)

- [ ] All 83 pages live at correct URLs (1 landing + 3 legal + 1 deck index + 78 card pages)
- [ ] Lighthouse scores ≥ 95 across desktop and mobile
- [ ] Daily card behavior verified (consistent across visitors on the same date)
- [ ] Pull-your-own widget works on mobile and desktop, respects reduced-motion
- [ ] Deck toggle swaps art and persists across pages
- [ ] All existing legal pages still resolve and look correct
- [ ] Sitemap regenerated, includes every page
- [ ] App Store badge visible above fold and at final CTA, links to live App Store URL
- [ ] No broken links, no console errors, no 404s

---

## Notes for the implementer

- **Frequent commits** — every task has a commit step. Don't bundle.
- **Don't skip the test runs.** They are short and catch regressions.
- **YAGNI** — V2 items (newsletter, blog, analytics, web app) are out of scope. Don't add even tempting ones.
- **Placeholder assets are explicitly marked.** Replace them when final art arrives — don't ship final without checking the README list.
- **Visual testing** — every UI task ends with a `python3 -m http.server` check. Do it; static-site bugs are visual.
- **App Store URL** — `https://apps.apple.com/app/id6761735989` is the live app. Confirm the exact URL is correct (App ID 6761735989 per project memory) before deploying.
