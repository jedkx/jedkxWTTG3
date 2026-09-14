# Operator Help

## Purpose

JEDKX WTTG3 Operator Console is a compact second-screen helper for **Welcome to the Game III**. It keeps the high-frequency information visible: website uptime, Otrex clickpoint pages, wiki-run filters, VirtMesh rates, source scan results, and run notes.

## Run Tools

The top-left panel has four tabs:

- **Wiki Runs**: save copied site lists for three routes and filter Website Uptime to the current run.
- **VirtMesh**: compare miner hosts by tier.
- **Source Scan**: paste page source and look for key or fetch hints.
- **Notes**: keep editable run notes with `Wiki`, `Key`, and `Fetch` headings.

The panel can be collapsed with the chevron. On desktop, drag the thin area between Run Tools and Website Uptime to adjust how much vertical space the tools get.

## Website Uptime

The left panel is split into two working columns:

- **Always**: sites that can be checked without waiting for a minute window.
- **Timed**: sites grouped by the minute range when they open.

Click a site name to load its clickpoint guide in the right-side viewer. Only the current site is highlighted; the app does not track visited sites.

## Clickpoint Viewer

The viewer embeds Otrex Assistant clickpoint pages.

- **main** means the first page for the selected website.
- Buttons such as **submit**, **order**, **catalog**, **page2**, or **testimonials** are mapped subpages where clickpoints may exist.
- The open icon beside the selected site opens the current guide page in a new browser tab.
- Use the marked words, boxes, images, or regions inside the embedded Otrex page as the key click targets.
- If a page-specific marker and label disagree, trust the text label or page note first.

If a page does not load, check network access or open the guide externally with the icon.

## VirtMesh

VirtMesh is grouped by tier. Use the tier buttons to compare only the hosts available at that tier. The list is sorted by reported DOS/min rate from highest to lowest.

## Source Scan And Notes

Source Scan is for pasted HTML/source snippets. It reports only direct run-useful values:

- `1 - value` style keys, using the hyphen form.
- `file://...fetch` references, even when the middle value is not exactly 32 characters.

It intentionally ignores common false positives such as email-like values, CSS colors, plain dimensions, normal image/script paths, and dangling markers like `1 -` followed by unrelated HTML.

Double-click a found result to add it to Notes. Key results go under `Key`; fetch results go under `Fetch`. A short status message appears in the Source Scan header, and the clicked result flashes so the transfer is visible. If the value is already in Notes, it is not duplicated.

Notes starts with:

```text
Wiki

Key

Fetch
```

The headings are only a template. They can be edited or deleted; if a heading is missing, double-clicking a result recreates the matching section.

Use `Ctrl` + mouse wheel while the Notes editor is focused to adjust note text size.

## Maintenance

Game updates can change website windows, force-hack percentages, subpages, and clickpoint mappings.

- Update website data in `src/data/sites.js`.
- Update mining rates in `src/data/miners.js`.
- Keep behavior changes in `src/app.js`.
- Keep source parsing rules conservative enough to avoid obvious false positives, but broad enough for WTTG3 `file://...fetch` variants.
- Keep visible copy in English.
- Keep the visual system square, dense, and functional. Avoid pill controls, rounded cards, and decorative UI.
