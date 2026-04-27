# thebrigidhearth.com

Static site for The Hearth (Draíocht) iOS app. Hosted on GitHub Pages.

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
