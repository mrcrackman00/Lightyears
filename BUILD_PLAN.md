# 🌌 LIGHTYEARS — Complete Build Plan (for Cursor)

> **Tagline:** "Tonight, a star is showing you the day you were born. Go find it."
> **Stack:** Plain HTML + CSS + JavaScript + Three.js (CDN). No build tools. Static site.
> **Host:** GitHub Pages (free). **Name:** Lightyears.
> **For:** Hack Club Stardance — ship in phases, earn stardust, win prizes.

---

## 📖 CONTEXT (why this project)

Avinash (16, founder) is joining **Stardance**, Hack Club's summer program: build open-source
projects → other teens rate them → earn "stardust" → spend on real prizes (T-shirt → plushie
→ ... → MacBook Air at 4,436 stardust). Hours are auto-tracked (Hackatime). The winning move
is ONE addictive, shareable, visually-stunning, emotionally-resonant project shipped in phases.

**The idea — Lightyears:** A star's light takes years to reach Earth (1 light-year = 1 year of
travel). So a star ~16 light-years away is showing us light that left it ~16 years ago. The site
takes your birthday, finds a REAL star whose light left around the day you were born, shows it in
a gorgeous 3D galaxy, and lets you pin a message on it. Real physics + emotion + shareable =
peer ratings = stardust.

**This plan is written so Cursor (or any AI/dev) can build each phase step-by-step.**

---

## ✅ VERIFIED TECHNICAL FACTS (researched — these are correct, use them)

### Star data: HYG Database
- **Download URL (current v4.1, raw CSV):**
  `https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hyg_v41.csv`
- **License:** CC BY-SA 4.0 (free to use + redistribute, just credit "HYG Database / astronexus").
- **~119,000 stars.** Full CSV is large (~30+ MB) → we will TRIM it (see Phase 0).
- **EXACT columns (confirmed from official README):**
  `id, hip, hd, hr, gl, bf, proper, ra, dec, dist, pmra, pmdec, rv, mag, absmag, spect, ci, x, y, z, vx, vy, vz, rarad, decrad, pmrarad, pmdecrad, bayer, flam, con, comp, comp_primary, base, lum, var, var_min, var_max`
- **Columns we use:**
  - `proper` = common name (e.g. "Sirius", "Altair"). Many stars have this BLANK → skip/handle.
  - `dist` = distance in **PARSECS**. ⚠️ To get light-years: **light_years = dist × 3.262**.
  - `con` = constellation abbreviation (e.g. "Aql").
  - `mag` = apparent magnitude (LOWER = brighter; naked-eye limit ≈ 6.5).
  - `ci` = B-V color index → star color (see color table below).
  - `spect` = spectral type (e.g. "G2V", "A7"). First letter (O B A F G K M) → color.
  - `x, y, z` = 3D cartesian coords in parsecs → directly usable as Three.js positions.
  - `bf` / `bayer` / `flam` = scientific designations (fallback name if `proper` is blank).
- **First row is the Sun:** `id=0, proper=Sol, dist=0`. Skip id 0 in results.
- **`dist >= 100000`** means missing/dubious distance → filter these OUT.

### The core math (age → star)
- A person of age **N years** → look for a star whose distance in light-years ≈ N.
- `target_parsecs = N / 3.262`  (because ly = parsecs × 3.262).
- Example: 16 yrs → target ≈ 16 ly ≈ 4.9 parsecs.
- Real nearby stars for teen ages (13–18 ly): Altair (16.7 ly), 70 Ophiuchi (16.7), Wolf 1061
  (14.0), Gliese 876 (15.2), AD Leonis (16.2).
- Nearest star (edge case, very young): Proxima Centauri ≈ 4.24 ly. Below that → no real star;
  show a friendly "your light is still on its way / you're younger than the nearest star" message.
- **Better than exact age:** compute the user's age in years from their birthDATE, then find the
  star whose `light_years` is CLOSEST to that age (not just <=). This always returns a real star.

### Star color from `ci` (B-V color index) — simple lookup
| ci range        | Color        | Hex      |
|-----------------|--------------|----------|
| ci < 0.0        | Blue-white   | #AABFFF  |
| 0.0 – 0.3       | White        | #C8DCFF  |
| 0.3 – 0.6       | Yellow-white | #FFFAC8  |
| 0.6 – 0.8       | Yellow (Sun) | #FFFFC8  |
| 0.8 – 1.4       | Orange       | #FFC864  |
| ci >= 1.4       | Red          | #FF9650  |
(If `ci` is blank, default to white #FFFFFF.)

### NASA APOD API (daily space photo) — CONFIRMED
- **URL:** `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`
- **Returns JSON:** `date, title, explanation, url, hdurl, media_type, copyright, service_version`
- `media_type` is `"image"` or `"video"` → only show `<img>` when it's `"image"`.
- DEMO_KEY is rate-limited (~30–50/hour). Fine for a personal site. Get a free key at
  api.nasa.gov to raise the limit later.

### Three.js (3D galaxy) — CONFIRMED
- Include via CDN import map (no build step). Pin version (e.g. `0.180.0`).
  ```html
  <script type="importmap">
  { "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
  }}
  </script>
  ```
- Stars = `THREE.Points` + `THREE.BufferGeometry` (correct, fast for thousands of points).
- Orbit/zoom: `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`.
- ⚠️ ES modules need HTTP, not `file://` → run a local server (`npx serve` or VS Code Live Server)
  while developing.

### Share cards
- `html-to-image` via CDN: `https://unpkg.com/html-to-image@1.11.13/dist/html-to-image.js`
- `htmlToImage.toPng(node).then(dataUrl => { /* download as PNG */ })`.

### Hosting: GitHub Pages
- Push repo to GitHub → Settings → Pages → Source: `main` branch, `/root` → Save.
- Live at `https://<username>.github.io/lightyears/` in ~1 min. HTTPS automatic, free.

---

## 📁 FINAL FOLDER STRUCTURE

```
lightyears/
├── index.html            # main page (one page, sections shown/hidden by JS)
├── css/
│   └── style.css         # all styling (space theme)
├── js/
│   ├── main.js           # app entry: wires UI + events
│   ├── stars.js          # load star data, age→star matching logic
│   ├── galaxy.js         # Three.js 3D scene (Phase 2+)
│   ├── timeline.js       # "universe is watching" feature (Phase 3)
│   ├── starpost.js       # message pinning + share card (Phase 4)
│   └── apod.js           # NASA daily photo (Phase 5)
├── data/
│   ├── build-data.md     # notes on how stars.json was generated
│   └── stars.json        # TRIMMED star data (made in Phase 0)
├── assets/               # fonts, icons, og-image
├── README.md             # project description + screenshot (Stardance reads this!)
└── LICENSE               # MIT (your code) — note HYG data is CC BY-SA 4.0
```

---

## 🔨 PHASE 0 — Setup & Data Prep (Day 1, ~1–2 hrs)

**Goal:** Repo ready, star data trimmed and usable. Nothing fancy yet.

**Steps:**
1. Create folder `lightyears/` with the structure above (empty files for now).
2. `git init`, create a GitHub repo named `lightyears`, push.
3. **Trim the star data** (the full CSV is too big to ship). Two options:
   - **Easy (recommended):** download `hyg_v41.csv`, then keep ONLY rows where
     `dist < 100000` AND (`mag <= 6.5` OR `proper` is non-empty). That gives the visible +
     named stars (~9,000 rows) — small enough to ship as JSON. Convert chosen columns
     (`proper, bf, ra, dec, dist, mag, ci, spect, con, x, y, z`) into `data/stars.json` as an
     array of objects.
   - Write a tiny Node or Python script (one-off, kept in `data/build-data.md`) to do this.
4. Document the conversion in `data/build-data.md` so it's reproducible.
5. Write initial `README.md` (title, one-liner, "work in progress", HYG credit).

**Ship check:** repo is public on GitHub. (Not "shipped" on Stardance yet — that's end of Phase 1.)

---

## 🌟 PHASE 1 — "Find Your Star" (Days 2–3, ~3–5 hrs) → FIRST SHIP 🎉

**Goal:** A beautiful single page where you enter your birthday and get YOUR star on a card.
This alone is shareable and gets stardust. Ship it.

**UI/UX (this is what people see — make it gorgeous):**
- Full-screen dark space background (deep navy → black gradient, subtle CSS-animated twinkling
  dots as a cheap starfield placeholder before Three.js exists).
- Centered hero: big title "Lightyears", the tagline, and a date input + a glowing "Find my star"
  button.
- On submit → animate to a **result card**:
  - Star's **name** (use `proper`; if blank, use `bf`/`bayer`; else "an unnamed star").
  - Big line: *"The light reaching your eyes tonight left **{name}** on the day you were born."*
  - Distance: `{light_years.toFixed(1)} light-years away` (= dist × 3.262).
  - Constellation (`con`), and a colored glowing dot using the `ci` color table.
  - A poetic sub-line. Microcopy matters — write it warm and awe-inspiring.

**Logic (js/stars.js):**
- `loadStars()` → fetch `data/stars.json`.
- `ageFromBirthday(dateString)` → years (decimal ok) from birthday to today.
- `findStarForAge(stars, age)`:
  - For each star compute `ly = dist * 3.262`.
  - Pick the star whose `ly` is CLOSEST to `age` AND has a `proper` name if possible
    (prefer named/bright stars so the result feels special; fall back to closest match).
  - Edge case age < 4.24 ly → return a special "younger than the nearest star" friendly result.
- `colorForCi(ci)` → hex from the color table.

**Ship at end of Phase 1:**
1. Push to GitHub, enable GitHub Pages, confirm live URL works on phone + desktop.
2. Add a screenshot to README.
3. On Stardance: link the repo, write a devlog ("Phase 1 of Lightyears — find the star whose
   light left when you were born"), click ship. → stardust starts.

---

## 🌌 PHASE 2 — 3D Galaxy (Week 2, ~5–8 hrs)

**Goal:** Replace the flat card with a real, draggable 3D star field; camera flies to YOUR star.

**js/galaxy.js (Three.js):**
- Scene + perspective camera + renderer (full window, resize handler).
- `OrbitControls` for mouse drag/zoom.
- Build `THREE.Points` from star `x, y, z` (already in parsecs). Color each point via `ci`.
  Size points by brightness (`mag`).
- Highlight the user's star: bigger, pulsing glow (a separate Points/Sprite, or a glowing ring).
- **Camera fly-to:** animate camera from origin to near the user's star (lerp position + lookAt
  over ~2–3 s). This is the "wow" moment.
- Keep the Phase-1 card as an overlay panel on top of the 3D scene.

**Performance notes:** Points + BufferGeometry handles ~9k stars trivially. Pin Three.js version.
Test on a phone.

**Ship:** push, devlog ("now it's a real 3D galaxy you can fly through"), update screenshot.

---

## 🛸 PHASE 3 — "The Universe Is Watching" (Week 3–4, ~6–10 hrs) ← breakthrough feature

**Goal:** A timeline slider answering *"What moment of Earth's history is each star seeing right
now?"* This is the share-bomb.

**Concept:** A star `D` light-years away is, right now, receiving light that left Earth `D` years
ago. So the moon landing (1969) is "currently visible" from stars ~57 ly away.

**js/timeline.js:**
- A small curated list of famous events: `{year, label, emoji}` (moon landing 1969, first iPhone
  2007, your birthday, a World Cup, etc.).
- A slider for "years ago" (0 → ~120). As you drag:
  - Show which event(s) are "being seen now" at that distance.
  - In the 3D galaxy, highlight the shell of stars at that distance (a glowing ring/sphere).
  - Headline text: *"Right now, the light from {event} is passing stars like {nearby star name},
    {ly} light-years away. Someone there would be watching it live."*
- Let the user add THEIR birthday as a custom event on the timeline.

**Ship:** push, devlog (this is the most shareable update — emphasize the mind-blow), screenshot/GIF.

---

## 📌 PHASE 4 — Starposts + Share Cards (Month 2, ~6–10 hrs)

**Goal:** Pin a message to your star + generate a beautiful shareable PNG. (Local-only first.)

**js/starpost.js:**
- After finding their star, user can type a short message ("note to future self", a wish, etc.).
- Store locally first (`localStorage`) so it works with zero backend.
- Render a gorgeous **share card**: star name, distance, the user's message, "Lightyears" branding,
  a mini starfield. Then `htmlToImage.toPng(cardNode)` → download button + "share" hint.
- This card is the viral engine → more visitors → more Stardance ratings → more stardust.

**Ship:** push, devlog, post your OWN share card to socials to demo it.

---

## 🌍 PHASE 5 — Social Layer + Daily Return (Month 3, ~8–12 hrs)

**Goal:** Make it a place people come BACK to, and where notes are public/global.

**Pieces:**
- **Daily NASA photo (js/apod.js):** fetch APOD, show today's image + title + explanation as a
  "Cosmic daily" panel. (Check `media_type === "image"`.) Reason to return daily.
- **Global Starposts (needs free backend):** Supabase free tier — a `posts` table
  (`star_name, message, color, created_at`). Show other people's notes as glowing stars in the
  galaxy; let users ❤️ them. (Add input validation + a basic profanity filter — public messages.)
- Optional: simple "near your star, others left these notes" feed.

**Ship:** push, devlog, final polish pass (loading states, errors, mobile, meta/OG tags for nice
link previews).

---

## 🎨 DESIGN / UX PRINCIPLES (apply in every phase)
- **Dark, cinematic, calm.** Deep space gradient, soft glows, slow twinkles. Never flashy/cheap.
- **One emotional payoff within 5 seconds** of landing (enter birthday → goosebumps line).
- **Microcopy is the product.** Warm, awe-filled, short. (Sample: *"Your star is Altair, 16.7
  light-years away. The light reaching your eyes tonight left it the day you were born. Wave back."*)
- **Mobile-first.** Most teens will open it on a phone from a shared link.
- **Accessible:** readable contrast, alt text, keyboard-usable inputs.
- **Every screen is screenshot-worthy** (it drives the share loop → ratings → stardust).

---

## ✅ VERIFICATION (how to test each phase)
- **Local dev:** run a static server (`npx serve .` or VS Code Live Server) — NOT `file://`
  (Three.js modules + fetch need HTTP).
- **Phase 1:** enter several birthdays (a 5-yr-old, 16-yr-old, 80-yr-old) → confirm sensible real
  stars with correct light-year math (`dist × 3.262`); test the < 4.24 ly edge case.
- **Phase 2:** drag/zoom works; camera flies to the right star; runs smoothly on a phone.
- **Phase 3:** slider matches events to distances correctly (1969 → ~57 ly).
- **Phase 4:** share card PNG downloads and looks good.
- **Phase 5:** APOD loads (handle video days + rate limit); posting/reading global notes works.
- **Deploy check (every phase):** the GitHub Pages URL works on a fresh phone, no console errors.

---

## 🏆 STARDANCE WORKFLOW (repeat every phase)
1. Code the phase. (Hackatime auto-logs your hours.)
2. Push to GitHub.
3. Update README + screenshot.
4. On Stardance: link repo → write a devlog → click **Ship**.
5. Others rate it → stardust grows.
6. Spend stardust: T-shirt (88) / plushie (70) early → build toward MacBook Air (4,436).

**Mindset:** No daily quota. Work whenever you can — 1 hour counts. Consistency > speed.
Ship small and often.
