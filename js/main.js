// main.js — wires the Find Your Star UI to the star-matching logic (Phase 1).

import {
  loadStars,
  ageFromBirthday,
  findStarForAge,
  colorForCi,
  starName,
} from './stars.js';
import { createGalaxy, webglAvailable } from './galaxy.js';
import { createTimeline } from './timeline.js';
import { createStarpost } from './starpost.js';

const els = {
  finder: document.getElementById('finder'),
  birthday: document.getElementById('birthday'),
  findBtn: document.getElementById('findBtn'),
  error: document.getElementById('finderError'),
  hero: document.getElementById('hero'),
  result: document.getElementById('result'),
  card: document.getElementById('card'),
  halo: document.getElementById('cardHalo'),
  name: document.getElementById('starName'),
  dot: document.getElementById('starDot'),
  meta: document.getElementById('starMeta'),
  line: document.getElementById('starLine'),
  poem: document.getElementById('starPoem'),
  again: document.getElementById('againBtn'),
  canvas: document.getElementById('galaxy-canvas'),
  galaxyHint: document.getElementById('galaxyHint'),
  watchBtn: document.getElementById('watchBtn'),
  timeline: document.getElementById('timeline'),
  tlHeadline: document.getElementById('tlHeadline'),
  tlSlider: document.getElementById('tlSlider'),
  tlEvents: document.getElementById('tlEvents'),
  pinBtn: document.getElementById('pinBtn'),
  starpost: document.getElementById('starpost'),
};

let starsPromise = null;
let galaxy = null; // lazily created Three.js scene (null if WebGL unavailable)
let galaxyReady = false;
let timeline = null; // Phase 3 timeline controller (per result)
let starpost = null; // Phase 4 share-card controller
let lastResult = null; // remember the matched star for the timeline + starpost

/** Create the galaxy once, on first need, if WebGL is supported. */
function ensureGalaxy() {
  if (galaxyReady) return galaxy;
  galaxyReady = true;
  if (els.canvas && webglAvailable()) {
    try {
      galaxy = createGalaxy(els.canvas);
    } catch (err) {
      console.warn('Galaxy init failed; falling back to flat view.', err);
      galaxy = null;
    }
  }
  return galaxy;
}

// A few hand-picked closing lines; rotated so repeat visits feel fresh.
const POEMS = [
  'The light left it long before you knew your own name. Wave back.',
  'Across all that emptiness, it has been on its way to you this whole time.',
  'Somewhere out there, that glow is older than every memory you have.',
  'You and your star have been travelling toward this exact moment together.',
];

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
}

function clearError() {
  els.error.hidden = true;
  els.error.textContent = '';
}

function setMaxDateToday() {
  const today = new Date().toISOString().slice(0, 10);
  els.birthday.max = today;
}

function renderTooYoung(age) {
  els.card.style.setProperty('--star-color', '#C8DCFF');
  els.name.textContent = 'still on its way';
  els.dot.style.background = '#C8DCFF';
  els.meta.textContent = `You are about ${age.toFixed(1)} light-years young`;
  els.line.innerHTML =
    'You are <strong>younger than the nearest star</strong>. Even Proxima Centauri, the closest one of all, is 4.2 light-years away.';
  els.poem.textContent =
    'Your light is still crossing the dark. Give it a little time, and a star will be waiting.';
}

function renderStar(result) {
  const { star, lightYears } = result;
  const color = colorForCi(star.ci);
  const name = starName(star);

  els.card.style.setProperty('--star-color', color);
  els.dot.style.background = color;
  els.dot.style.boxShadow = `0 0 16px 3px ${color}`;

  els.name.textContent = name;

  const con = star.con ? star.con : 'the deep sky';
  els.meta.textContent = `${lightYears.toFixed(1)} light-years away · in ${con}`;

  const displayName = name === 'an unnamed star' ? 'a quiet, unnamed star' : name;
  els.line.innerHTML = `The light reaching your eyes tonight left <strong>${displayName}</strong> on the day you were born.`;

  els.poem.textContent = POEMS[Math.floor(Math.random() * POEMS.length)];
}

async function handleSubmit(event) {
  event.preventDefault();
  clearError();

  const value = els.birthday.value;
  if (!value) {
    showError('Pick the day you were born first.');
    return;
  }

  const age = ageFromBirthday(value);
  if (Number.isNaN(age)) {
    showError('That date does not look right. Try again.');
    return;
  }
  if (age < 0) {
    showError('That date is in the future. Pick your real birthday.');
    return;
  }

  els.findBtn.disabled = true;
  els.findBtn.querySelector('.btn-find__label').textContent = 'Searching the sky…';

  try {
    if (!starsPromise) starsPromise = loadStars();
    const stars = await starsPromise;
    const result = findStarForAge(stars, age);

    if (result.tooYoung) {
      renderTooYoung(age);
      if (els.watchBtn) els.watchBtn.hidden = true;
      if (els.pinBtn) els.pinBtn.hidden = true;
      revealCard();
    } else {
      renderStar(result);
      if (els.watchBtn) els.watchBtn.hidden = false;
      if (els.pinBtn) els.pinBtn.hidden = false;
      lastResult = {
        stars,
        star: result.star,
        age,
        birthday: value,
        lightYears: result.lightYears,
        color: colorForCi(result.star.ci),
        name: starName(result.star),
        con: result.star.con || '',
      };
      await flyToStar(stars, result.star);
      revealCard();
    }
  } catch (err) {
    showError(
      'Could not load the stars. If you opened this as a file, run it through a local server (npx serve .) instead.'
    );
    console.error(err);
  } finally {
    els.findBtn.disabled = false;
    els.findBtn.querySelector('.btn-find__label').textContent = 'Find my star';
  }
}

/**
 * Build the galaxy (once), reveal it, highlight the user's star, and fly the
 * camera there. Resolves when the flight is done so the card can fade in after.
 */
async function flyToStar(stars, star) {
  const g = ensureGalaxy();
  if (!g) {
    // No WebGL: keep the flat experience; the timeline needs the 3D shell.
    if (els.watchBtn) els.watchBtn.hidden = true;
    return;
  }

  g.buildField(stars);
  g.reveal();
  if (els.galaxyHint) els.galaxyHint.hidden = false;
  g.highlight(star);
  document.body.classList.add('galaxy-active');
  await g.flyTo(star);
}

function revealCard() {
  els.hero.hidden = true;
  els.result.hidden = false;
}

/**
 * Open the Phase 3 timeline: build the controller once per result, frame the
 * shell, and start on the user's own age (their birthday shell).
 */
async function handleWatch() {
  if (!lastResult) return;
  const g = galaxy;

  // Build/refresh the timeline controller for this result.
  if (timeline) timeline.destroy();
  const birthYear = new Date(lastResult.birthday).getFullYear();
  timeline = createTimeline({
    galaxy: g,
    stars: lastResult.stars,
    els: {
      headline: els.tlHeadline,
      slider: els.tlSlider,
      events: els.tlEvents,
    },
    birthYear,
  });

  els.timeline.hidden = false;
  els.watchBtn.hidden = true;
  document.body.classList.add('timeline-active');

  // Start the slider at the user's age so it opens on "their" shell.
  const startYearsAgo = Math.min(120, Math.max(0, Math.round(lastResult.age)));
  if (g && g.frameShell) {
    g.frameShell(startYearsAgo || 16);
  }
  timeline.setYearsAgo(startYearsAgo);
}

function closeTimeline() {
  if (timeline) {
    timeline.destroy();
    timeline = null;
  }
  if (els.timeline) els.timeline.hidden = true;
  document.body.classList.remove('timeline-active');
  if (galaxy && galaxy.hideShell) galaxy.hideShell();
}

/** Open the Phase 4 starpost composer for the matched star. */
function handlePin() {
  if (!lastResult) return;
  if (!starpost) {
    starpost = createStarpost({
      els: {
        panel: els.starpost,
        composer: document.getElementById('spComposer'),
        output: document.getElementById('spOutput'),
        starLabel: document.getElementById('spStarLabel'),
        message: document.getElementById('spMessage'),
        count: document.getElementById('spCount'),
        makeBtn: document.getElementById('spMakeBtn'),
        card: document.getElementById('shareCard'),
        scName: document.getElementById('scName'),
        scMeta: document.getElementById('scMeta'),
        scMessage: document.getElementById('scMessage'),
        downloadBtn: document.getElementById('spDownloadBtn'),
        editBtn: document.getElementById('spEditBtn'),
        hint: document.getElementById('spHint'),
      },
    });
  }
  document.body.classList.add('starpost-active');
  starpost.open({
    name: lastResult.name,
    lightYears: lastResult.lightYears,
    color: lastResult.color,
    con: lastResult.con,
  });
}

function closeStarpost() {
  if (starpost) starpost.close();
  if (els.starpost) els.starpost.hidden = true;
  document.body.classList.remove('starpost-active');
}

function handleAgain() {
  els.result.hidden = true;
  els.hero.hidden = false;
  closeTimeline();
  closeStarpost();
  document.body.classList.remove('galaxy-active');
  if (els.galaxyHint) els.galaxyHint.hidden = true;
  lastResult = null;
  if (galaxy) {
    galaxy.reset();
    galaxy.hide();
  } else {
    els.hero.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  els.birthday.focus();
}

function init() {
  setMaxDateToday();
  els.finder.addEventListener('submit', handleSubmit);
  els.again.addEventListener('click', handleAgain);
  if (els.watchBtn) els.watchBtn.addEventListener('click', handleWatch);
  if (els.pinBtn) els.pinBtn.addEventListener('click', handlePin);

  // Warm the data load as soon as the page is idle.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      if (!starsPromise) starsPromise = loadStars().catch(() => null);
    });
  }
}

init();
