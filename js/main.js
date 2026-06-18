// main.js — wires the Find Your Star UI to the star-matching logic (Phase 1).

import {
  loadStars,
  ageFromBirthday,
  findStarForAge,
  colorForCi,
  starName,
} from './stars.js';

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
};

let starsPromise = null;

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
    } else {
      renderStar(result);
    }

    els.hero.hidden = true;
    els.result.hidden = false;
    els.result.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

function handleAgain() {
  els.result.hidden = true;
  els.hero.hidden = false;
  els.hero.scrollIntoView({ behavior: 'smooth', block: 'center' });
  els.birthday.focus();
}

function init() {
  setMaxDateToday();
  els.finder.addEventListener('submit', handleSubmit);
  els.again.addEventListener('click', handleAgain);

  // Warm the data load as soon as the page is idle.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      if (!starsPromise) starsPromise = loadStars().catch(() => null);
    });
  }
}

init();
