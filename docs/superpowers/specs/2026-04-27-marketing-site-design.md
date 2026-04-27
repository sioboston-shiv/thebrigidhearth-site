# thebrigidhearth.com — Marketing Site Design

**Date:** 2026-04-27
**Status:** Approved (brainstorm), pending implementation plan
**Project location:** `~/Desktop/MISC/thebrigidhearth-site/`
**Hosting:** GitHub Pages, custom domain via Namecheap
**Related app:** Draiocht (The Hearth) — `~/Desktop/testing claude code/draiocht/`

---

## 1. Goal

Replace the placeholder landing page at thebrigidhearth.com with a marketing site that drives App Store installs of the Draiocht (The Hearth) iOS app. The site must:

- Communicate what the app is in under 5 seconds
- Showcase the four product pillars (Brigid AI, Celtic Tarot, Plant Medicine, Wheel of the Year)
- Provide an interactive card-pull moment that hooks visitors
- Let visitors browse all 78 cards across both deck styles (celtic + classic) — for SEO and product discovery
- Tell the founder story to justify premium positioning
- Handle common objections via FAQ
- Preserve existing legal pages (privacy, terms, support)

## 2. Constraints & assumptions

- **Tech stack:** Vanilla HTML/CSS/JS only. No framework, no build step. A single Node script generates the per-card pages from a JSON file. Output committed to git.
- **Hosting:** Existing GitHub Pages setup. DNS already pointed at GH Pages IPs via Namecheap.
- **Design system:** Reuses the app's palette (`#1C3A2A` deep green, `#F7F4EE` cream, `#D4B86A` gold). Display type Cinzel; body Crimson Text. Both self-hosted via `woff2` subsets.
- **No backend.** No newsletter (V1), no analytics, no forms.
- **All card art exists** in the draiocht repo. One-time export to site repo.
- **The site does not replace App Store Connect metadata.** It complements it.

## 3. Non-goals (V1)

- No web version of the app (no Brigid chat in browser, no full reading flow, no subscription billing on web).
- No blog. No newsletter. No analytics. (All deferred to V2.)
- No Android landing — iOS only for now.
- No multi-language. English only.
- No animations beyond a single card flip + hero glow.

## 4. Architecture

### 4.1 File structure

```
thebrigidhearth-site/
├── index.html                    # Landing — full scroll
├── privacy.html                  # (existing — restyle to match)
├── support.html                  # (existing — restyle to match)
├── terms.html                    # (existing — restyle to match)
├── deck/
│   ├── index.html                # 78-card grid + celtic/classic toggle
│   ├── the-wheel.html            # individual card pages, generated
│   ├── the-star.html
│   └── ...                       # 78 total
├── assets/
│   ├── css/
│   │   └── site.css              # shared stylesheet
│   ├── js/
│   │   └── site.js               # ~150 lines — daily card, pull, toggle
│   ├── img/
│   │   ├── hero/                 # atmospheric hero, og-image
│   │   ├── celtic/               # 78 celtic card PNG/WebP
│   │   ├── classic/              # 78 classic card PNG/WebP
│   │   ├── pillars/              # pillar section illustrations
│   │   └── founder.jpg           # Siobhan portrait
│   └── fonts/                    # Cinzel + Crimson Text woff2
├── data/
│   └── deck.json                 # 78 cards, exported from app
├── scripts/
│   ├── generate-deck-pages.js    # reads deck.json → emits deck/*.html
│   └── generate-sitemap.js       # emits sitemap.xml
├── sitemap.xml                   # generated, committed
├── robots.txt
├── CNAME                         # thebrigidhearth.com (existing)
└── README.md                     # deploy + maintenance instructions
```

### 4.2 Build flow

There is no traditional build. Two Node scripts run on demand:

1. `generate-deck-pages.js` — reads `data/deck.json` + a per-card HTML template → writes 78 files into `deck/`. Run when deck content changes.
2. `generate-sitemap.js` — reads file tree → writes `sitemap.xml`. Run before each deploy.

All generated files are committed to git. GitHub Pages serves the static repo as-is. No CI required for V1.

### 4.3 One-time data export from app

A small script in the `draiocht` repo (`scripts/export-deck.ts` or similar) reads `src/data/tarotDeck.ts`, transforms each card into the schema below, and writes `data/deck.json` into the site repo. Re-run only when the deck data changes (rare).

### 4.4 Asset import from app

One-time copy of card artwork:
- `draiocht/assets/cards/celtic/*.png` → `site/assets/img/celtic/`
- `draiocht/assets/cards/classic/*.png` → `site/assets/img/classic/`

Each PNG is then converted to WebP (smaller for web). Both kept and served via `<picture>` with WebP first and PNG fallback.

## 5. Data schema

### 5.1 `data/deck.json` — per card

```json
{
  "slug": "the-wheel",
  "id": "wheel-of-the-year",
  "arcana": "major",
  "suit": null,
  "romanNumeral": "X",
  "nameIrish": "An Roth",
  "nameEnglish": "The Wheel",
  "nameClassic": "Wheel of Fortune",
  "image": {
    "celtic": "/assets/img/celtic/the-wheel.webp",
    "classic": "/assets/img/classic/the-wheel.webp"
  },
  "imageFallback": {
    "celtic": "/assets/img/celtic/the-wheel.png",
    "classic": "/assets/img/classic/the-wheel.png"
  },
  "meaningUpright": "...",
  "meaningReversed": "...",
  "symbolism": "...",
  "guidance": "..."
}
```

The full file is an array of 78 such objects. Suits for minor arcana use the celtic deck's suit names (Stones, Vessels, Blades, Wands or whatever the app defines); the suit names are mirrored to the classic Pentacles/Cups/Swords/Wands in copy.

## 6. Pages

### 6.1 Landing (`/index.html`) — single-page scroll

Sections in order:

1. **Hero** — atmospheric flame-glow background. Headline *"The Hearth"* (Cinzel, gold). Tagline *"Tend the fire."* (Crimson Text italic, cream). Two CTAs: App Store badge + secondary `Begin 7-day free trial`. Both link to App Store. **No phone mockup.**
2. **Daily card** — auto-shown card seeded by today's date (deterministic across visitors). Label: *"Today's card · 27 April 2026"*. Card image + Irish name + 1-line meaning. CTA: *"Pull a different card"*.
3. **Pillar 1 — Brigid at the Hearth** (AI companion, claude-sonnet backed via app)
4. **Pillar 2 — The Celtic Deck** (with link to `/deck/`)
5. **Pillar 3 — The Green Path** (63 plants)
6. **Pillar 4 — The Wheel** (lunar + festival calendar)
7. **Founder** — Siobhan's photo + 80-150 word "why I built this" note
8. **FAQ** — 8 expandable items (see §6.5)
9. **Final CTA** — full-width gold strip with App Store badge
10. **Footer** — Privacy / Support / Terms / © (existing)

Pillar layout: stacked on mobile, alternating image/text on desktop. Each pillar has its own illustration in `assets/img/pillars/`.

### 6.2 Deck index (`/deck/index.html`)

- Page title: *"The Celtic Deck — 78 cards"*
- Subtitle: *"22 majors and 56 minors, in Irish and Classic naming."*
- Toggle pill at top: `[ Celtic | Classic ]` (default Celtic, persists in `localStorage`)
- Filter chips: `All · Major · Vessels · Stones · Blades · Wands` (suits per app's data)
- Grid: 2 cols mobile, 4 tablet, 6 desktop
- Each tile: card art + Irish name (or classic name when classic style active). Click → `/deck/<slug>.html`
- All images lazy-loaded

### 6.3 Card detail (`/deck/<slug>.html`)

Generated by `scripts/generate-deck-pages.js`. Per-card content:

- Back link to `/deck/`
- Large card art (current deck style — toggle visible top-right)
- Header block: roman numeral / suit · Irish name (large) · English name + Classic name (smaller)
- Sections: Upright, Reversed, Symbolism, Guidance
- *"Read this card with Brigid →"* CTA + App Store badge
- Per-page `<title>` and `<meta description>` for SEO
- Schema.org BreadcrumbList JSON-LD
- Canonical URL

### 6.4 Existing legal pages

`privacy.html`, `support.html`, `terms.html` already exist and use the same palette. Restyle pass to make sure typography, spacing, and footer match the new shared stylesheet. No content changes.

### 6.5 FAQ content (8 items)

1. **Is this religious?** No — Irish folk tradition. Practice as cultural heritage, faith, or curiosity.
2. **Do I need to be Irish?** No. You'll learn the names and seasons as you go.
3. **I'm new to tarot — will I get it?** Yes. Brigid teaches as you go.
4. **Is the plant medicine medical advice?** No — traditional folk knowledge. Consult a doctor for medical issues.
5. **What's the difference between free and Practitioner?** (Brief table.)
6. **Can I cancel?** Yes — anytime in App Store settings.
7. **Android?** Not yet. iOS first.
8. **Where is my data stored?** Encrypted Supabase, EU. We don't sell data, no ads.

## 7. Card-pull behavior

### 7.1 Daily card (auto, on landing)

Algorithm:

```
const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
const seed = simpleHash(today)
const card = deck[seed % deck.length]
```

`simpleHash` is a tiny deterministic string-to-int function (e.g. djb2 in <10 lines). All visitors on the same calendar day see the same card. No backend.

Display: card image (current deck style), Irish + English names, 1-line meaning excerpt, link to `/deck/<slug>.html`.

### 7.2 Pull-your-own widget (interactive)

Below daily card. *"Pull a different card"* button. On click:

1. Button replaced by an animated card flip — CSS `transform: rotateY(180deg)` with 600ms ease
2. Random index from 78. Different from daily card to feel fresh
3. Reveal: card art + names + 1-line meaning + *"Read this card with Brigid →"* CTA
4. *"Pull again"* button below

`prefers-reduced-motion` shortens or skips the flip.

### 7.3 Deck style toggle

- On `/deck/` and individual card pages
- Pill: `[ Celtic | Classic ]`
- Default Celtic. Persists in `localStorage.deckStyle`
- Switches the **artwork** only — names always show both Irish and Classic (Irish prominent in Celtic mode, Classic prominent in Classic mode)
- No page reload — JS swaps `<img src>` and re-orders headings

## 8. Visual design

### 8.1 Palette

| Token   | Hex       | Use                              |
|---------|-----------|----------------------------------|
| green   | `#1C3A2A` | primary background               |
| cream   | `#F7F4EE` | body text on green               |
| gold    | `#D4B86A` | headings, accents, CTAs          |
| faint   | `#F7F4EEAA` | secondary text                 |
| inkDark | `#0d1c14` | gradient bottom, footer          |

### 8.2 Type

- **Cinzel** — display: H1, H2 (self-hosted woff2, Latin + Irish accents subset)
- **Crimson Text** — body and tagline italic
- Font sizing scales with viewport using `clamp()`

### 8.3 Hero atmosphere

- Background: radial gradient from gold (centered ~70% horizontally, 50% vertically) into deep green into ink
- Optional: low-opacity flame illustration as PNG/SVG. WebP fallback. ≤ 60 KB
- No animation V1. Static glow only

### 8.4 Card flip animation

```
.card { perspective: 1000px; }
.card-inner { transform-style: preserve-3d; transition: transform 600ms ease; }
.card.flipped .card-inner { transform: rotateY(180deg); }
```

Skipped under `prefers-reduced-motion`.

## 9. Performance

- Total landing weight target: **< 200 KB** (excluding card images, lazy-loaded)
- Hero atmospheric: ≤ 60 KB WebP
- Self-host fonts, woff2 only, Latin + Irish accent subset
- `<link rel="preload">` for hero font + hero image
- All card images: `loading="lazy"`, `<picture>` WebP+PNG, `decoding="async"`
- No JS framework, no bundler, no analytics SDK
- Lighthouse targets: ≥ 95 perf, ≥ 95 SEO, ≥ 95 a11y, ≥ 95 best practices

## 10. SEO

- Per-page `<title>`, `<meta description>`, Open Graph, Twitter Card
- `og:image` landing → atmospheric hero crop
- `og:image` per card page → that card's celtic art (1200×630 letterboxed). Celtic is always canonical for social sharing, regardless of the visitor's toggle state.
- `sitemap.xml` generated to include all 83 pages (1 landing + 3 legal + 1 deck index + 78 card pages). Each card has a single canonical URL — celtic is canonical, classic art is swapped via JS toggle, no separate `/deck/classic/` URLs in V1.
- `robots.txt` allowing all
- Schema.org `MobileApplication` JSON-LD on landing — links to App Store
- Schema.org `BreadcrumbList` on each card page
- Canonical URLs on every page
- Each card page targets long-tail searches for both Celtic and Classic naming

## 11. Accessibility

- Semantic HTML: `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`
- All images have meaningful `alt`
- Focus rings preserved
- Card flip respects `prefers-reduced-motion`
- WCAG AA color contrast — verify gold on green; if borderline, adjust gold tone for body text contexts
- Deck toggle uses `<button aria-pressed="true|false">`
- FAQ uses `<details>/<summary>` for native a11y

## 12. Existing site — compatibility

Three legal pages already exist. The rebuild must not break:

- Existing URLs: `/privacy.html`, `/support.html`, `/terms.html` (linked from App Store Connect)
- Existing palette and typography (matches new design — minor restyle pass only)
- `CNAME` file at repo root pointing at `thebrigidhearth.com`
- Namecheap DNS pointing at GH Pages IPs

## 13. Open items (defer to plan or implementation)

- Final App Store URL — placeholder during build, swap in real URL before deploy
- Founder photo — file from Siobhan
- Pillar illustrations — source TBD (commission, generate, or use stylized photos)
- Hero atmospheric image — final source TBD (illustration vs subtle photo)
- Specific FAQ free-vs-Practitioner table content
- Founder note copy — 80-150 words, drafted with Siobhan
- Confirm exact suit names from app's tarotDeck.ts before generating filter chips

## 14. V2 / future work (out of V1 scope)

- Newsletter signup (Buttondown — deferred per V1 brainstorm)
- Blog / festival guides (SEO content layer)
- Press kit page (`/press`)
- Sample 3-card reading flow (interactive teaser)
- Web app version with RevenueCat Web Billing
- Plausible analytics if data needed

---

## Acceptance criteria

V1 ships when:

- [ ] All 83 pages live at correct URLs (1 landing + 3 legal + 1 deck index + 78 card pages)
- [ ] Lighthouse scores ≥ 95 across the board on desktop and mobile
- [ ] Daily card behavior verified (consistent across visitors on same date)
- [ ] Pull-your-own widget works on mobile and desktop, respects reduced-motion
- [ ] Deck toggle swaps art and persists across pages
- [ ] All existing legal pages still resolve and look correct
- [ ] Sitemap regenerated, includes every page
- [ ] App Store badge visible above fold and at final CTA, links to live App Store URL
- [ ] No broken links, no console errors, no 404s
