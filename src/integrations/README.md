# Integrations

This directory contains adapters for external helpers used by the console.

## Otrex

`otrex.js` owns Otrex Assistant URL construction. It is intentionally small and synchronous:

- no fetch on startup;
- no runtime scraping;
- no DOM dependency on Otrex pages;
- deterministic URL generation from the selected site id and page index.
- cached guide URLs after first construction.

The cache is only for generated URL strings. It is not a network cache and does not copy or store Otrex page content.

If Otrex changes its clickpoint URL format, update `otrex.js`. If Otrex changes website ids or available subpages, update `src/data/sites.js`.
