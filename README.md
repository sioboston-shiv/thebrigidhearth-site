# thebrigidhearth.com

Marketing site for The Hearth (Draíocht) iOS app. Vanilla HTML/CSS/JS, no build step. Hosted on GitHub Pages with custom domain via Namecheap.

## Pages

- `/` — landing page (hero, daily card, four pillars, founder, FAQ, CTA)
- `/deck/` — browse the 78-card Celtic deck (with celtic/classic toggle)
- `/deck/<slug>.html` — 78 individual card pages, generated from `data/deck.json`
- `/privacy.html`, `/support.html`, `/terms.html` — legal

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

From the app repo:

```bash
cd ~/Desktop/testing\ claude\ code/draiocht
npx tsx scripts/export-deck-for-site.ts
```

### Convert images to WebP

```bash
./scripts/convert-images.sh
```

Run after adding new card art.

### Run tests

```bash
npm test
```

Or: `node --test tests/site.test.mjs tests/generate-deck-pages.test.mjs`.

### Run Lighthouse audit

```bash
npx lighthouse http://localhost:8080/ --view
```

Targets: ≥ 95 across performance, SEO, accessibility, best-practices.

### Replace placeholder assets

These are placeholders pending final art:
- `assets/img/founder.svg` — replace with real photo from Siobhan as `founder.jpg`, then update markup in `index.html`
- `assets/img/pillars/*.svg` — replace with commissioned illustrations
- `assets/img/hero/hero-og.jpg` — placeholder OG share image (1200×630) to add

## Deploy steps

1. Create new GitHub repo named `thebrigidhearth-site` (or similar) under your account.
2. Push these files to the repo:
   - `index.html`
   - `privacy.html`
   - `support.html`
   - `terms.html`
3. Repo → Settings → Pages → Build from branch `main`, root.
4. (Optional) Custom domain: enter `thebrigidhearth.com`. GitHub will create CNAME file.
5. In Namecheap → `thebrigidhearth.com` → Advanced DNS:
   - Add A records pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Add CNAME record: `www` → `<your-github-username>.github.io`
6. Wait 5-15 min for DNS propagation. Site live at `https://thebrigidhearth.com`.

## Pages

- `/` — landing
- `/privacy.html` (also `/privacy`) — privacy policy
- `/support.html` (also `/support`) — support / FAQ
- `/terms.html` (also `/terms`) — Terms of Use / EULA

## Update URLs after deploy

Once live, update these references to point to the new domain:

1. **App Store Connect:**
   - App Information → Privacy Policy URL → `https://thebrigidhearth.com/privacy.html`
   - App Information → Support URL → `https://thebrigidhearth.com/support.html`
   - App Information → License Agreement → custom EULA URL → `https://thebrigidhearth.com/terms.html` (or paste full text)

2. **In-app code (next build):**
   - `app/upgrade.tsx` Privacy + Terms links → new domain URLs
   - `app/(tabs)/(hearth)/settings.tsx` Privacy link → new domain URL
