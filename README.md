# Lightyears

> Tonight, a star is showing you the day you were born. Go find it.

Enter your birthday and Lightyears finds a **real star** whose light has been
travelling toward Earth for about as long as you've been alive — then shows it
to you on a glowing card. A star ~16 light-years away is, right now, shining
light at your eyes that left it ~16 years ago.

Built as a [Hack Club Stardance](https://stardance.hackclub.com/) project, in
shippable phases.

**Status:** Phase 1 — *Find Your Star* (live and shippable). 3D galaxy,
timeline, starposts, and a social layer are coming next.

## Run it locally

This is a plain static site (HTML + CSS + JS, no build step), but it loads star
data and uses ES modules, so it must be served over HTTP — not opened as a
`file://` page.

```bash
npx serve .
```

Then open the printed URL (e.g. http://localhost:3000) and enter a birthday.

## How it works

- `data/stars.json` is a trimmed copy of the HYG star catalog (~8.8k stars).
- Your age in years is matched to the star whose distance in **light-years**
  (`distance_in_parsecs × 3.262`) is closest to your age, preferring named or
  bright stars so the result feels special.
- Color comes from each star's B-V color index (`ci`).

Rebuild the star data anytime:

```bash
node data/build-stars.js
```

See [data/build-data.md](data/build-data.md) for details.

## Tech

- Plain HTML / CSS / JavaScript (ES modules)
- Three.js (CDN) for the 3D galaxy — added in Phase 2
- Hosted on GitHub Pages

## Credits & license

- Star data: **HYG Database** by astronexus — licensed
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- This project's code: **MIT** (see [LICENSE](LICENSE)).
