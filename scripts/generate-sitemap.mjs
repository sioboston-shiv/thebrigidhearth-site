// Walk the repo and emit sitemap.xml.
// Run from repo root: node scripts/generate-sitemap.mjs
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

for (const file of readdirSync(resolve(ROOT, 'deck')).sort()) {
  if (file.endsWith('.html') && file !== 'index.html') {
    urls.push({ loc: `/deck/${file}`, priority: '0.7' });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(resolve(ROOT, 'sitemap.xml'), xml);
console.log(`Wrote sitemap with ${urls.length} URLs.`);
