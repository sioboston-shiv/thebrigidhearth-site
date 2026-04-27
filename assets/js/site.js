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

// --- Browser-only init (no-ops in Node tests) ---

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLanding();
    initDeckIndex();
  });
}

async function initLanding() {
  const dailyEl = document.getElementById('daily-card');
  if (!dailyEl) return;

  const deck = await fetch('/data/deck.json').then((r) => r.json());
  const today = new Date().toISOString().slice(0, 10);
  const card = pickDailyCard(deck, today);
  const style = getDeckStyle();

  document.getElementById('daily-card-date').textContent = new Date(
    today
  ).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  dailyEl.innerHTML = renderCardHTML(card, style);

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
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          flipEl.classList.add('flipped');
          flipEl.addEventListener(
            'transitionend',
            () => revealMeaningPanel(resultEl, pulled, getDeckStyle()),
            { once: true }
          );
        })
      );
    }
  });
}

function renderCardHTML(card, style) {
  const slug = style === 'celtic' ? card.slug : card.classicSlug;
  const ext = style === 'celtic' ? 'png' : 'jpg';
  const headline = style === 'celtic' ? card.nameIrish : card.nameClassic;
  const sub = style === 'celtic' ? card.nameClassic : card.nameIrish;
  const meaning = (card.uprightMeaning || '').split('.')[0];
  return `
    <a href="/deck/${card.slug}.html" aria-label="${escapeHtml(headline)}">
      <picture>
        <source srcset="/assets/img/${style}/${slug}.webp" type="image/webp">
        <img src="/assets/img/${style}/${slug}.${ext}" alt="${escapeHtml(card.nameEnglish)}" loading="lazy" decoding="async">
      </picture>
    </a>
    <div>
      <div class="name-irish">${escapeHtml(headline)}</div>
      <div class="name-classic">${escapeHtml(sub)}</div>
    </div>
    <p class="meaning">${escapeHtml(meaning)}.</p>
    <a href="/deck/${card.slug}.html">Read more →</a>
  `;
}

function renderFlipHTML(card, style) {
  const slug = style === 'celtic' ? card.slug : card.classicSlug;
  const ext = style === 'celtic' ? 'png' : 'jpg';
  return `
    <div class="card-flip" aria-label="Card pull animation">
      <div class="card-flip-inner">
        <div class="card-flip-front" aria-hidden="true">✦</div>
        <div class="card-flip-back">
          <picture>
            <source srcset="/assets/img/${style}/${slug}.webp" type="image/webp">
            <img src="/assets/img/${style}/${slug}.${ext}" alt="${escapeHtml(card.nameEnglish)}" decoding="async">
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
  const meaning = (card.uprightMeaning || '').split('.')[0];
  const panel = resultEl.querySelector('.card-meaning-panel');
  panel.hidden = false;
  panel.innerHTML = `
    <div class="name-irish">${escapeHtml(headline)}</div>
    <div class="name-classic">${escapeHtml(sub)}</div>
    <p class="meaning">${escapeHtml(meaning)}.</p>
    <a href="/deck/${card.slug}.html">Read this card with Brigid →</a>
  `;
}

async function initDeckIndex() {
  const grid = document.getElementById('deck-grid');
  if (!grid) return;

  const deck = await fetch('/data/deck.json').then((r) => r.json());
  let activeSuit = 'all';
  let activeStyle = getDeckStyle();

  refreshStyleButtons();

  document.getElementById('style-celtic').addEventListener('click', () => {
    setDeckStyle('celtic');
    activeStyle = 'celtic';
    refreshStyleButtons();
    render();
  });
  document.getElementById('style-classic').addEventListener('click', () => {
    setDeckStyle('classic');
    activeStyle = 'classic';
    refreshStyleButtons();
    render();
  });
  document.querySelectorAll('.filters button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeSuit = btn.dataset.suit;
      document.querySelectorAll('.filters button').forEach((b) =>
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false')
      );
      render();
    });
  });

  function refreshStyleButtons() {
    document
      .getElementById('style-celtic')
      .setAttribute('aria-pressed', activeStyle === 'celtic' ? 'true' : 'false');
    document
      .getElementById('style-classic')
      .setAttribute(
        'aria-pressed',
        activeStyle === 'classic' ? 'true' : 'false'
      );
  }

  function render() {
    const filtered =
      activeSuit === 'all' ? deck : deck.filter((c) => c.suit === activeSuit);
    grid.innerHTML = filtered
      .map((card) => {
        const slug = activeStyle === 'celtic' ? card.slug : card.classicSlug;
        const ext = activeStyle === 'celtic' ? 'png' : 'jpg';
        const name =
          activeStyle === 'celtic' ? card.nameIrish : card.nameClassic;
        return `
          <a href="/deck/${card.slug}.html">
            <picture>
              <source srcset="/assets/img/${activeStyle}/${slug}.webp" type="image/webp">
              <img src="/assets/img/${activeStyle}/${slug}.${ext}" alt="${escapeHtml(card.nameEnglish)}" loading="lazy" decoding="async">
            </picture>
            <div class="name">${escapeHtml(name)}</div>
          </a>`;
      })
      .join('');
  }

  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}
