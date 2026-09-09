# Operator Help

## Purpose

JEDKX WTTG3 Operator Console is a compact second-screen helper for **Welcome to the Game III**. It keeps the high-frequency information visible: website uptime, Otrex clickpoint pages, and VirtMesh rates.

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

## Maintenance

Game updates can change website windows, force-hack percentages, subpages, and clickpoint mappings.

- Update website data in `src/data/sites.js`.
- Update mining rates in `src/data/miners.js`.
- Keep behavior changes in `src/app.js`.
- Keep visible copy in English.
- Keep the visual system square, dense, and functional. Avoid pill controls, rounded cards, and decorative UI.
