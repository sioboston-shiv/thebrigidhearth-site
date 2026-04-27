// Generate 78 individual card-detail pages from data/deck.json.
// Run from repo root: node scripts/generate-deck-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function romanize(n) {
  const map = [
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ];
  let result = '';
  let num = n;
  for (const [r, v] of map) {
    while (num >= v) {
      result += r;
      num -= v;
    }
  }
  return result || '0';
}

export function renderCardPage(card) {
  const url = `https://thebrigidhearth.com/deck/${card.slug}.html`;
  const titleHead = `${card.nameIrish} · ${card.nameEnglish} (${card.nameClassic}) — Celtic Tarot · The Hearth`;
  const meta = `${card.nameIrish} (${card.nameEnglish} / ${card.nameClassic}) — ${(card.uprightMeaning || '').slice(0, 140)}`;
  const breadcrumb = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'The Hearth', item: 'https://thebrigidhearth.com/' },
        { '@type': 'ListItem', position: 2, name: 'The Celtic Deck', item: 'https://thebrigidhearth.com/deck/' },
        { '@type': 'ListItem', position: 3, name: card.nameEnglish, item: url },
      ],
    },
    null,
    2
  );

  const cardJson = JSON.stringify({
    slug: card.slug,
    classicSlug: card.classicSlug,
    nameIrish: card.nameIrish,
    nameClassic: card.nameClassic,
  });

  const numberLine =
    card.suit === 'major' && card.number !== undefined
      ? `${escape(card.suitDisplay)} · ${romanize(card.number)}`
      : escape(card.suitDisplay);

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
<link rel="preload" href="/assets/fonts/cinzel-bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">${breadcrumb}</script>
</head>
<body>

<header class="page-header">
  <div class="container">
    <a href="/deck/" class="back-home">← The Celtic Deck</a>
    <p class="label" style="font-family:'Cinzel',Georgia,serif;text-transform:uppercase;letter-spacing:0.18em;font-size:0.85rem;color:var(--gold);margin:1rem 0 0.5rem;">${numberLine}</p>
    <h1 id="card-name">${escape(card.nameIrish)}</h1>
    <p class="subtitle" id="card-subname">${escape(card.nameEnglish)}${card.nameClassic !== card.nameEnglish ? ' · ' + escape(card.nameClassic) : ''}</p>
    <div class="toggle" role="group" aria-label="Deck style" style="margin-top:1.5rem;">
      <button id="style-celtic" aria-pressed="true">Celtic</button>
      <button id="style-classic" aria-pressed="false">Classic</button>
    </div>
  </div>
</header>

<main>
  <div class="container card-detail-container">
    <picture id="card-art">
      <source srcset="/assets/img/celtic/${card.slug}.webp" type="image/webp">
      <img src="/assets/img/celtic/${card.slug}.png" alt="${escape(card.nameEnglish)}" width="600" height="900" decoding="async">
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
      <p style="margin-bottom:1rem;">Read this card with Brigid →</p>
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
  const card = ${cardJson};

  function applyStyle(style) {
    const slug = style === 'celtic' ? card.slug : card.classicSlug;
    const ext = style === 'celtic' ? 'png' : 'jpg';
    const pic = document.getElementById('card-art');
    pic.querySelector('source').srcset = '/assets/img/' + style + '/' + slug + '.webp';
    pic.querySelector('img').src = '/assets/img/' + style + '/' + slug + '.' + ext;
    document.getElementById('card-name').textContent = style === 'celtic' ? card.nameIrish : card.nameClassic;
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
