# How `stars.json` was generated

`data/stars.json` is a trimmed, web-friendly slice of the HYG star catalog.
It is produced by [`build-stars.js`](build-stars.js) and is fully reproducible.

## Source

- **Catalog:** HYG Database v4.1 by astronexus
- **File:** `hygdata_v41.csv` (~32 MB, ~119,000 stars)
- **URL:** `https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv`
- **License:** CC BY-SA 4.0 (credit "HYG Database / astronexus")

> Note: the v4.1 CSV is published as `hygdata_v41.csv` (not `hyg_v41.csv`).

## Filter

A row is kept only if **all** of the following hold:

- `id != 0` (skip the Sun)
- `dist < 100000` (drop missing/dubious distances)
- `mag <= 6.5` **OR** `proper` is non-empty (naked-eye-visible or named stars)

This yields **~8,817 stars** (~460 with proper names), ~1.4 MB of JSON — small
enough to ship and fetch in the browser.

## Columns kept

`proper, bf, ra, dec, dist, mag, ci, spect, con, x, y, z`

- `dist` is in **parsecs**. Light-years = `dist × 3.262`.
- `x, y, z` are cartesian coordinates in parsecs (ready for Three.js in Phase 2).
- `ra, dec, dist, mag, ci, x, y, z` are stored as numbers (or `null` if blank);
  `proper, bf, spect, con` are strings.

## Rebuild

```bash
node data/build-stars.js
```

Requires Node 18+ (uses the built-in `fetch`). No npm dependencies.
