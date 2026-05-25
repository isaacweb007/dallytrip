# DallyTrip — Deploy to dallytrip.com (Cloudflare Pages)

Step-by-step guide for connecting the **dallytrip.com** domain (already purchased on Cloudflare) to this GitHub repo using **Cloudflare Pages**.

---

## 1. Create Cloudflare Pages project (one-time)

1. Go to **Cloudflare Dashboard** → **Workers & Pages** (left sidebar, under "Compute / 컴퓨트").
2. Click **Create application** → **Pages** tab → **Connect to Git**.
3. Authorize **GitHub** and select the repo: `isaacweb007/dallytrip`.
4. Click **Begin setup**.

## 2. Build settings

| Field | Value |
|---|---|
| **Project name** | `dallytrip` |
| **Production branch** | `main` |
| **Framework preset** | **None** (it's static HTML) |
| **Build command** | *(leave empty)* |
| **Build output directory** | `/` *(repository root)* |
| **Root directory** | *(leave empty)* |
| **Environment variables** | *(leave empty)* |

→ Click **Save and Deploy**.

The first deploy takes ~30 seconds. You'll get a preview URL like `dallytrip.pages.dev` — open it to verify everything loads.

## 3. Connect dallytrip.com

1. In the Pages project → **Custom domains** tab → **Set up a custom domain**.
2. Type `dallytrip.com` → **Continue** → **Activate domain**.
3. Repeat for `www.dallytrip.com`.

Cloudflare auto-creates the required DNS records (CNAME) and issues an SSL certificate within a few minutes. Because the domain is on the same Cloudflare account, no manual DNS edits are needed.

> ✅ Once both records turn green ("Active"), open https://dallytrip.com — it should show DallyTrip.

## 4. (Optional) Redirect www → apex

In **Cloudflare Dashboard** → **dallytrip.com** → **Rules** → **Redirect Rules** → **Create rule**:

- **When:** `Hostname equals www.dallytrip.com`
- **Then:** Static redirect → `https://dallytrip.com${http.request.uri.path}` → Status `301`

## 5. Auto-deploy on push

Every `git push` to `main` triggers a fresh production deploy automatically. Preview deploys are created for any other branch.

---

## Alternative: GitHub Pages (only if you prefer)

If you switch to GitHub Pages instead:

1. GitHub repo → **Settings** → **Pages** → Source: `main` / `/ (root)` → **Save**.
2. In **Custom domain** field, enter `dallytrip.com` → Save (this writes the same `CNAME` file already in the repo).
3. Enable **Enforce HTTPS** (waits 1–24h for cert).
4. In **Cloudflare DNS** for `dallytrip.com`, add:
   - `A   @   185.199.108.153`
   - `A   @   185.199.109.153`
   - `A   @   185.199.110.153`
   - `A   @   185.199.111.153`
   - `CNAME   www   isaacweb007.github.io`
5. In **Cloudflare SSL/TLS** → set encryption mode to **Full** (Flexible breaks GitHub Pages with a redirect loop).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ERR_TOO_MANY_REDIRECTS` | Cloudflare SSL/TLS mode must be **Full** or **Full (strict)**, not Flexible. |
| `dallytrip.pages.dev` works but `dallytrip.com` shows 522 | DNS record still propagating — wait 5–10 min. |
| `404` on a subpath | Cloudflare Pages serves `/index.html` for `/`. `/app.html`, `/admin.html` are accessed directly — no SPA fallback needed since each app uses hash routing. |
| Character image not showing | Save `character.png` to `assets/character.png`, commit & push. The fallback SVG is shown automatically until then. |
