# Lightyears

> Tonight, a real star is showing you the day you were born. Go find it.

**[▶ Live demo](https://mrcrackman00.github.io/Lightyears/)**

Enter your birthday and Lightyears finds a **real star** whose light has been
travelling toward Earth for about as long as you've been alive. A star ~16
light-years away is, *right now*, shining light into your eyes that left it
~16 years ago — so the light you see tonight left that star on the day you
were born.

Built as a [Hack Club Stardance](https://stardance.hackclub.com/) project.

---

## ✨ Features

- **Find your star** — your age in years becomes a distance in light-years, and
  the app picks the real star sitting closest to that distance (from a catalog
  of 8,800+ real stars), preferring named/bright ones so the result feels special.
- **3D galaxy** — the result isn't a flat card; it's a live [Three.js](https://threejs.org/)
  starfield of ~8,800 real stars, placed by their actual coordinates and coloured
  by temperature. The camera flies to *your* star, which glows with a pulsing ring.
  Drag to look around, scroll to zoom.
- **The universe is watching** — drag a timeline through Earth's history and the
  galaxy lights up the *shell of stars* at that exact distance. A star 57 light-years
  away is catching Earth's light from 1969 **right now** — so someone there, with a
  telescope, would be watching the Moon landing live. Real events (and your own
  birthday) are pinned on the timeline.
- **Starposts & share cards** — pin a message to your star (saved locally, per star),
  then download a beautiful share-card PNG or share directly to **WhatsApp** and **X**
  with one tap.

## 📷 Screenshots

| The universe is watching | Share card |
| --- | --- |
| ![Timeline open on the Moon-landing shell](assets/timeline-universe-watching.png) | ![A Lightyears share card](assets/starpost-share-card.png) |

## 🚀 Run it locally

This is a plain static site (HTML + CSS + JS, no build step), but it loads star
data and uses ES modules, so it must be served over HTTP — not opened as a
`file://` page.

```bash
npx serve .
```

Then open the printed URL (e.g. http://localhost:3000) and enter a birthday.

## 🔭 How it works

- `data/stars.json` is a trimmed copy of the HYG star catalog (~8.8k stars).
- Your age in years is matched to the star whose distance in **light-years**
  (`distance_in_parsecs × 3.262`) is closest to your age, preferring named or
  bright stars so the result feels special.
- Star colour comes from each star's B-V colour index (`ci`).
- The 3D galaxy uses a custom shader so brightening a "shell" of ~8,800 stars
  while you drag the timeline is just a uniform update — no geometry rebuilds,
  so it stays smooth.
- Everything is progressive enhancement: no WebGL? The flat "find your star"
  experience still works.

Rebuild the star data anytime:

```bash
node data/build-stars.js
```

See [data/build-data.md](data/build-data.md) for details.

## 🛠️ Tech

- Plain HTML / CSS / JavaScript (ES modules) — no framework, no build step
- [Three.js](https://threejs.org/) (via CDN) for the 3D galaxy
- [html-to-image](https://github.com/bubkoo/html-to-image) (via CDN) for share-card PNGs
- Hosted on GitHub Pages

## 📂 Project structure

```
index.html         — page markup + CDN import map
css/style.css      — all styling
js/main.js         — UI wiring & orchestration
js/stars.js        — star data + age→light-years logic
js/galaxy.js       — Three.js 3D galaxy
js/timeline.js     — "the universe is watching" timeline
js/starpost.js     — pin a message + share-card PNG
data/              — HYG catalog build script + stars.json
```

## 📜 Credits & license

- Star data: **HYG Database** by astronexus — licensed
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- This project's code: **MIT** (see [LICENSE](LICENSE)).
