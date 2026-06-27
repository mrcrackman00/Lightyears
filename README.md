# Lightyears

A tiny website that finds the real star whose light left it on the day you were
born — then flies you to it through a 3D galaxy of 8,800 real stars.

![Lightyears: the universe-is-watching timeline open on the Moon-landing shell](assets/timeline-universe-watching.png)

## Try it

**→ [lightyears live demo](https://mrcrackman00.github.io/Lightyears/)**

Type a birthday, press *Find my star*. That's the whole thing — no sign-up, no install.

## The idea

Light is slow. A star 25 light-years away is showing you light that left it 25
years ago. So if you're 25, there is a real, named star out there whose light is
reaching your eyes *tonight* having left on the day you were born. Lightyears
turns your age into a distance, reaches into a catalog of real stars, and hands
you yours.

It's a small piece of perspective dressed up as a toy.

## What it does

- **Finds your star.** Your age in years becomes a distance in light-years, and
  the app picks the real star closest to that distance from a catalog of 8,800+
  stars — leaning toward named and bright ones so your result feels like *yours*.
- **Flies you there.** The result isn't a flat card. The whole galaxy renders in
  3D (every star placed by its true coordinates, coloured by its real
  temperature) and the camera flies to your star, which pulses with a glowing
  ring. Drag to look around, scroll to zoom.
- **Shows who's watching.** Drag the *Universe Is Watching* timeline and the
  galaxy lights up the shell of stars at that exact distance. Stars 57 light-years
  out are receiving Earth's light from 1969 right now — so someone there, with a
  good enough telescope, is watching the Moon landing live. Real events and your
  own birthday are pinned along the slider.
- **Lets you leave a note.** Pin a message to your star (saved on your device,
  per star), then export a share-card PNG or post straight to WhatsApp or X.

## Run it locally

It's a plain static site — HTML, CSS, and vanilla JS modules, no build step. But
it fetches the star catalog and uses ES modules, so it has to be served over HTTP
(opening `index.html` as a `file://` page won't work).

Any static server works. With Node 18+ installed:

```bash
npx serve .
```

Open the URL it prints (e.g. `http://localhost:3000`) and enter a birthday.

To regenerate `data/stars.json` from the source HYG catalog:

```bash
node data/build-stars.js
```

Details on that step live in [data/build-data.md](data/build-data.md).

## How it works (the one interesting bit)

The trick that makes the timeline feel alive is that **nothing rebuilds when you
drag it.**

All 8,800 stars live in a single Three.js point cloud, and each star's distance
is baked into a vertex attribute. The "shell of stars catching Earth's light from
year X" is computed entirely on the GPU: a custom shader brightens any star whose
distance falls within a thin band around the slider value. Dragging the timeline
just updates one uniform — no geometry is touched, no points are re-uploaded — so
scrubbing through a century of history stays smooth even on a phone.

The whole experience is built as progressive enhancement, too. No WebGL? The flat
"find your star" card still works on its own, backed by a pure-CSS starfield.

## Built with

- Vanilla HTML / CSS / JavaScript (ES modules) — no framework
- [Three.js](https://threejs.org/) for the 3D galaxy
- [html-to-image](https://github.com/bubkoo/html-to-image) for the share-card PNGs
- Hosted on GitHub Pages

## Where things live

```
index.html        page markup + CDN import map
css/style.css     the observatory-chart theme
js/main.js        UI wiring & orchestration
js/stars.js       star data + age → light-years matching
js/galaxy.js      Three.js galaxy + fly-to camera
js/timeline.js    the "universe is watching" shell shader
js/starpost.js    pin a message + render the share card
data/             HYG catalog build script + stars.json
```

## Credits

- Star positions, colours, and distances come from the **HYG Database** by
  astronexus, used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Made for [Hack Club Stardance](https://stardance.hackclub.com/).
- This project's own code is **MIT** — see [LICENSE](LICENSE).
