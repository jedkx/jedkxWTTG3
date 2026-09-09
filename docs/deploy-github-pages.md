# GitHub Pages Deploy

JEDKX WTTG3 is a static root-site project. It does not need a build step, package install, backend, or generated `dist` folder for GitHub Pages.

## Recommended setup

1. Create an empty GitHub repository, for example `jedkxWTTG3`.
2. Commit this project from the repository root.
3. In GitHub, open **Settings > Pages**.
4. Set **Build and deployment** to **Deploy from a branch**.
5. Select branch `main` and folder `/root`.
6. Save. GitHub Pages will publish the site at:

```text
https://<owner>.github.io/<repo>/
```

## First push

Use these commands from the project root after the GitHub repository exists:

```bash
git init
git add .
git commit -m "Initial JEDKX WTTG3 console"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

Then enable Pages from `/root` as described above.

## Local preview

Use the included server while editing:

```bash
node scripts/serve.mjs
```

Then open:

```text
http://127.0.0.1:4173
```

The Otrex clickpoint viewer embeds public pages from Otrex Assistant. Local uptime and VirtMesh data render without Otrex, but the iframe needs network access.

## Notes

- Keep `.nojekyll` in the repository root. It makes GitHub Pages serve static files directly.
- Keep all paths relative. The site must work from `https://<owner>.github.io/<repo>/`, not only from a domain root.
- Do not add a `CNAME` file until a custom domain is chosen.
- Browser console warnings from third-party iframe headers can appear when Otrex pages are embedded. They are not project build errors.
