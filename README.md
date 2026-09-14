# JEDKX WTTG3 Operator Console

## Why this exists

Welcome to the Game III overloads the player with timing, site routing, subpages, clickpoint guides, and mining choices. Existing helpers are useful, but during a run the workflow needs to be tighter: pick the site, know whether it is open, open the matching clickpoint guide, and keep VirtMesh rates visible.

This project is built around that gap. It is a compact **second-screen operator console** for WTTG3: run tools and uptime on the left, Otrex clickpoint pages on the right, and fast source notes for keys/fetch files during a run.

## What it does

- Shows all known websites grouped as **Always** and **Timed**.
- Opens the matching Otrex Assistant clickpoint page when a website is selected.
- Exposes Otrex subpage mappings such as `main`, `submit`, `catalog`, `order`, and `page2`.
- Provides an external-open icon for the current clickpoint guide.
- Hides the viewer when the guide is opened externally, leaving the full screen for uptime and run tools.
- Lets the user resize the tool/uptime split and the left/right viewer split with bounded splitters.
- Stacks into a touch-friendly single-column layout on mobile screens.
- Saves three wiki-run filters for copied wiki site lists.
- Shows VirtMesh hosts by tier, sorted by reported DOS/min.
- Scans pasted page source for `1 - value` keys and `file://...fetch` references.
- Provides editable run notes with `Wiki`, `Key`, and `Fetch` sections; double-click a scanner result to add it to the matching section.
- Supports `Ctrl` + mouse wheel inside Notes to adjust note text size.
- Includes an in-app `?` help panel and a fuller `docs/helper.md`.

## Why the project is modular

The app is intentionally static, but the code is split by responsibility so game updates are easy to apply.

- `index.html` contains the document shell and stable UI regions.
- `styles.css` contains the visual system and responsive layout.
- `src/data/sites.js` contains website windows, Otrex guide ids, subpages, force-hack notes, and risk flags.
- `src/data/miners.js` contains VirtMesh host tiers and payout rates.
- `src/data/README.md` documents data ownership and update rules.
- `src/integrations/otrex.js` contains the fast Otrex Assistant guide URL resolver.
- `src/integrations/README.md` documents integration ownership and update rules.
- `src/app.js` contains rendering and interaction behavior.
- `scripts/serve.mjs` runs a dependency-free local static server for iframe-safe local use.
- `.nojekyll` keeps GitHub Pages in plain static-file mode.
- `docs/deploy-github-pages.md` explains GitHub Pages publishing from the repository root.
- `docs/helper.md` explains how the console should be used and maintained.
- `AGENTS.md` gives repository guidance for future coding agents.

No build step is required. The project can run directly from disk or be published as static files.

## Data maintenance

Game facts belong in `src/data/*`, not in the UI or integration layer. If Otrex Assistant changes clickpoint ids or subpages, update `src/data/sites.js`. If VirtMesh values or uptime windows change, update the matching data file.

Otrex URL construction belongs in `src/integrations/otrex.js`. It is intentionally synchronous and local: the console renders immediately, then the iframe loads the selected Otrex guide page. If Otrex changes its guide URL format, update that integration file and keep the README source list aligned with any new reference used.

## Engineering decisions

- The Otrex adapter caches generated guide URLs only. It does not fetch, scrape, or store third-party page content.
- The splitters store only local layout preferences in `localStorage`; selected or visited websites are not persisted.
- Panel resizing is bounded so the uptime table and Otrex viewer cannot be collapsed past useful working sizes.
- The splitter is desktop-first; mobile uses a stacked layout instead of cramped side-by-side panes.
- Source Scan is local-only: pasted source is parsed in the browser, and scanner contents are not persisted.
- Notes are editable working text. The default headings are only a starting template and can be deleted or changed.
- The project stays static by design: no build pipeline, no runtime backend, and no dependency install required for normal use.
- Local development should use the included static server instead of `file://` so iframe navigation uses a normal origin.
- GitHub Pages should publish this repository from branch `main` and folder `/root`; keep `.nojekyll` in place.

## Run

Run the dependency-free local server:

```bash
node scripts/serve.mjs
```

Then open:

```text
http://127.0.0.1:4173
```

Opening `index.html` directly from disk can work for the local data, but browsers treat `file://` pages as unique origins. Use the local server when using the embedded Otrex viewer.

The uptime and VirtMesh data are local. The clickpoint viewer embeds Otrex Assistant pages, so that side of the app needs network access:

```text
https://otrexdev.github.io/wttg3-assistant/Clickpoint%20Guides/
```

## Publish

This repository is ready for GitHub Pages as a root static site. After pushing to GitHub, enable **Settings > Pages > Deploy from a branch**, choose `main`, and set the folder to `/root`.

Detailed steps are in `docs/deploy-github-pages.md`.

## Verify

With Node installed:

```bash
npm run check
```

Or run the files directly:

```bash
node --check src/app.js
node --check src/data/sites.js
node --check src/data/miners.js
node --check src/integrations/otrex.js
node --check scripts/serve.mjs
```

Then open `index.html` and confirm:

- Website Uptime renders Always and Timed columns.
- Dragging the top splitter resizes run tools and Website Uptime within bounds.
- Dragging the main splitter resizes the left and right panels within bounds.
- On narrow screens, panels stack vertically and lists remain scrollable by the page.
- Selecting a site changes the active row and embedded guide.
- Subpage buttons change the guide page.
- The external-open icon points to the current guide page.
- Tier buttons update the VirtMesh list.
- Source Scan reports keys and fetch files, and double-clicking a result adds it under `Key` or `Fetch` in Notes.
- The `?` button opens the help panel.

## Sources

- Otrex Assistant: https://otrexdev.github.io/wttg3-assistant/
- Otrex Assistant repository: https://github.com/otrexdev/wttg3-assistant
- MazKnight Key Practice: https://mazknight.github.io/key-practice/
- lucadbupa key-spots: https://github.com/lucadbupa/wttg3-key-spots
- Steam clickable locations guide: https://steamcommunity.com/sharedfiles/filedetails/?id=3767406609
- Steam VirtMesh mining values discussion: https://steamcommunity.com/app/3869850/discussions/0/580550959449651403/

## Notes

This is an unofficial fan-made helper. It is not affiliated with Reflect Studios, Valve, OtrexDev, MazKnight, or lucadbupa.

No extracted game screenshots, audio, or copied third-party source are bundled. Otrex clickpoint pages are embedded from their public site instead of redistributed.

## License

Source code in this repository is under the MIT License. Third-party guides, game assets, and external pages remain under their respective owners' terms.
