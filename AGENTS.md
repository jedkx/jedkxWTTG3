# AGENTS.md

## Scope

These instructions apply to this repository.

## Product

This project is **JEDKX WTTG3 Operator Console**, a static helper for Welcome to the Game III. Keep the first screen focused on uptime, clickpoint viewing, and VirtMesh data.

## Architecture

- `index.html`: document shell and static UI regions.
- `styles.css`: global theme and layout.
- `src/data/sites.js`: website names, Otrex guide ids, uptime windows, subpage labels, force-hack notes, and risk flags.
- `src/data/miners.js`: VirtMesh host names, tiers, and rates.
- `src/data/README.md`: data ownership and update rules.
- `src/integrations/otrex.js`: fast Otrex Assistant guide URL resolver.
- `src/integrations/README.md`: integration ownership and update rules.
- `src/app.js`: rendering and interaction behavior.
- `scripts/serve.mjs`: dependency-free local static server for iframe-safe development.
- `.nojekyll`: keeps GitHub Pages in plain static-file mode.
- `docs/deploy-github-pages.md`: GitHub Pages publishing notes.
- `docs/helper.md`: user-facing help and maintenance notes.

The app intentionally avoids build tooling so `index.html` can run directly from disk and from static hosting.

## Data Ownership

Treat `src/data/*` as the data layer. It owns game facts only: website records, Otrex guide ids, subpage labels, uptime windows, force-hack notes, and VirtMesh values. Do not put URL builders, fetches, scraping, source registries, or rendering behavior in `src/data/*`.

When Otrex updates its assistant or repository, check whether this project needs a matching data update in the same pass:

- New, removed, renamed, or renumbered Otrex clickpoint guide pages require `src/data/sites.js` updates.
- A changed Otrex guide URL pattern requires `src/integrations/otrex.js` updates.
- New subpages such as `submit`, `catalog`, `order`, or `page2` require `src/data/sites.js` updates.
- New or revised upstream sources require the README `Sources` section to be updated.
- VirtMesh tier/rate corrections require `src/data/miners.js` updates.

If data changes and behavior does not, keep the patch limited to `src/data/*` and documentation. Touch `src/app.js` only when rendering or interaction rules change.

## Integration Ownership

Keep Otrex integration fast and deterministic. `src/integrations/otrex.js` should build guide URLs from local site ids and page indexes without startup network calls, scraping, or async work. It may cache generated URL strings, but it must not copy, persist, or transform Otrex page content. The embedded iframe may load remote Otrex pages, but the console itself should not block on Otrex before rendering uptime or VirtMesh data.

## Layout State

The only browser-persisted app state should be low-risk UI preference state, currently the bounded left/right panel split. Do not persist selected sites, visited sites, search history, or gameplay progress.

Desktop uses a bounded draggable splitter. Mobile should remain stacked, touch-friendly, and page-scrollable; do not force the desktop split layout onto narrow screens.

The desktop splitter should stay visually invisible in its idle, hover, focus, and drag states. Keep the hit area functional, but do not add visible rails, glowing bars, or large active blocks between panels.

## Local Serving

Use `node scripts/serve.mjs` for local preview. Do not rely on `file://` for iframe work; browsers treat local files as unique origins and can log frame-navigation errors that do not happen from `http://127.0.0.1:4173`.

## Publishing

Publish GitHub Pages from the repository root, not a generated folder. Keep `.nojekyll` in the root so GitHub serves the files as-is. Do not add a build step, generated deploy directory, or copied third-party Otrex content unless the project direction changes explicitly.

Keep paths relative so the console works under `https://<owner>.github.io/<repo>/`. Add a `CNAME` file only when the user provides a custom domain. If publishing instructions change, update both `README.md` and `docs/deploy-github-pages.md` in the same pass.

## Coding Rules

- Keep visible UI text in English.
- Keep data updates isolated to `src/data/*` unless behavior changes are required.
- Do not bundle copied game screenshots, extracted assets, or third-party site source.
- Do not persist visited-site state. Only the currently selected site should be highlighted.
- Prefer small pure functions in `src/app.js` for new behavior.
- Keep the UI dense and task-oriented; avoid marketing sections.
- Keep controls and panels squared off. Do not introduce pill-shaped badges, rounded cards, or decorative bubble elements.

## Verification

Run:

```bash
node --check src/app.js
node --check src/data/miners.js
node --check src/data/sites.js
node --check src/integrations/otrex.js
node --check scripts/serve.mjs
```

Then open `index.html` and confirm:

- Website Uptime renders Always and Timed columns.
- Dragging the splitter resizes the left/right panels and remains bounded.
- On mobile width, the splitter is hidden and panels stack without clipping uptime or VirtMesh rows.
- Site clicks update the viewer and active row.
- Subpage buttons change the embedded Otrex guide.
- The external-open icon points to the same guide page currently shown.
- Tier buttons update the VirtMesh list.
