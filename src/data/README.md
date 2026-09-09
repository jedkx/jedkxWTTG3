# Data Layer

This directory is the only place where game facts should live.

## Files

- `sites.js`: website records, uptime windows, Otrex guide ids, subpage labels, force-hack notes, and risk flags.
- `miners.js`: VirtMesh host names, tiers, and reported DOS/min values.

## Update Rule

When an upstream helper changes game facts, update this layer in the same pass:

- If Otrex adds, removes, renames, or renumbers clickpoint pages, update `sites.js`.
- If a website uptime window or force-hack chance changes, update `sites.js`.
- If VirtMesh values change, update `miners.js`.

Otrex URL construction does not belong here. If Otrex changes its URL structure, update `src/integrations/otrex.js`. If a new trusted source is used, mirror it in the README sources section.

Keep rendering logic out of these files. Behavior belongs in `src/app.js`; facts belong here.
