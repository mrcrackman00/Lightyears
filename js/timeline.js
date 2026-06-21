// timeline.js — Phase 3: "The Universe Is Watching".
//
// A star D light-years away is, right now, receiving light that left Earth D
// years ago. Scrub "years ago" and we light up the shell of stars at that
// distance and name the Earth event whose light is washing over them now.
//
// createTimeline({ galaxy, stars, els, birthYear }) returns:
//   onScrub(yearsAgo)   update headline + galaxy shell
//   setYearsAgo(v)      move the slider programmatically + scrub
//   destroy()           remove listeners

const LY_PER_PARSEC = 3.262;
const MAX_YEARS = 120;

// Curated moments of Earth's history. `year` = calendar year it happened.
// Light from that year is now reaching stars (currentYear - year) ly away.
const BASE_EVENTS = [
  { year: 1903, label: 'the first powered flight', emoji: '🛩️' },
  { year: 1928, label: 'the discovery of penicillin', emoji: '🧫' },
  { year: 1945, label: 'the end of World War II', emoji: '🕊️' },
  { year: 1969, label: 'the first Moon landing', emoji: '🌕' },
  { year: 1977, label: 'Voyager leaving for the stars', emoji: '🛰️' },
  { year: 1989, label: 'the fall of the Berlin Wall', emoji: '🧱' },
  { year: 1991, label: 'the birth of the World Wide Web', emoji: '🌐' },
  { year: 2007, label: 'the first iPhone', emoji: '📱' },
  { year: 2012, label: 'the Higgs boson discovery', emoji: '⚛️' },
  { year: 2019, label: 'the first photo of a black hole', emoji: '🕳️' },
];

const CURRENT_YEAR = new Date().getFullYear();

/** years ago -> light-years (1 ly travels in 1 year) -> they're equal. */
export function yearsAgoToLightYears(yearsAgo) {
  return yearsAgo;
}

/** light-years -> parsecs (for star distances stored in parsecs). */
export function lightYearsToParsecs(ly) {
  return ly / LY_PER_PARSEC;
}

/** Closest star to a given light-year distance, preferring named ones. */
export function nearestStarAtLy(stars, ly, namedWindow = 4) {
  let closest = null;
  let closestDelta = Infinity;
  let closestNamed = null;
  let closestNamedDelta = Infinity;

  for (const s of stars) {
    if (!Number.isFinite(s.dist)) continue;
    const sly = s.dist * LY_PER_PARSEC;
    const delta = Math.abs(sly - ly);
    if (delta < closestDelta) {
      closestDelta = delta;
      closest = s;
    }
    if (s.proper && delta < closestNamedDelta) {
      closestNamedDelta = delta;
      closestNamed = s;
    }
  }

  if (closestNamed && closestNamedDelta - closestDelta <= namedWindow) {
    return closestNamed;
  }
  return closest;
}

function starLabel(star) {
  if (!star) return 'distant suns';
  if (star.proper && star.proper.trim()) return star.proper.trim();
  if (star.bf && star.bf.trim()) return star.bf.trim();
  return 'an unnamed star';
}

export function createTimeline({ galaxy, stars, els, birthYear }) {
  // Build the full event list (curated + the user's birthday), sorted.
  const events = BASE_EVENTS.map((e) => ({ ...e }));
  if (Number.isFinite(birthYear)) {
    const yearsAgo = CURRENT_YEAR - birthYear;
    if (yearsAgo > 0 && yearsAgo <= MAX_YEARS) {
      events.push({
        year: birthYear,
        label: 'the day you were born',
        emoji: '🎂',
        you: true,
      });
    }
  }
  events.sort((a, b) => b.year - a.year); // most recent first

  function yearsAgoOf(ev) {
    return CURRENT_YEAR - ev.year;
  }

  function eventNear(yearsAgo, tol = 2) {
    let best = null;
    let bestDelta = tol;
    for (const ev of events) {
      const delta = Math.abs(yearsAgoOf(ev) - yearsAgo);
      if (delta <= bestDelta) {
        bestDelta = delta;
        best = ev;
      }
    }
    return best;
  }

  function buildEventChips() {
    if (!els.events) return;
    els.events.innerHTML = '';
    for (const ev of events) {
      const ya = yearsAgoOf(ev);
      if (ya < 0 || ya > MAX_YEARS) continue;
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tl-chip' + (ev.you ? ' tl-chip--you' : '');
      btn.innerHTML = `<span class="tl-chip__emoji">${ev.emoji}</span> ${ev.year}`;
      btn.title = `${ev.label} — ${ya} light-years out`;
      btn.addEventListener('click', () => setYearsAgo(ya));
      li.appendChild(btn);
      els.events.appendChild(li);
    }
  }

  function renderHeadline(yearsAgo) {
    const ly = yearsAgoToLightYears(yearsAgo);
    const star = nearestStarAtLy(stars, ly);
    const name = starLabel(star);
    const ev = eventNear(yearsAgo);

    if (ev) {
      els.headline.innerHTML =
        `Right now, the light from <strong>${ev.label}</strong> ${ev.emoji} ` +
        `is washing over <strong>${name}</strong>, about ${ly.toFixed(0)} ` +
        `light-years away. Someone there would be watching it live.`;
    } else {
      els.headline.innerHTML =
        `Light that left Earth <strong>${yearsAgo.toFixed(0)} years ago</strong> ` +
        `is reaching <strong>${name}</strong>, ${ly.toFixed(0)} light-years out, ` +
        `at this very moment.`;
    }
  }

  function onScrub(yearsAgo) {
    const ya = Math.max(0, Math.min(MAX_YEARS, yearsAgo));
    renderHeadline(ya);
    if (galaxy && galaxy.showShell) {
      galaxy.showShell(yearsAgoToLightYears(ya));
    }
  }

  function setYearsAgo(v) {
    if (els.slider) els.slider.value = String(v);
    onScrub(Number(v));
  }

  // rAF-debounce the slider so dragging stays smooth.
  let scheduled = false;
  let pendingValue = 0;
  function onSliderInput() {
    pendingValue = Number(els.slider.value);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      onScrub(pendingValue);
    });
  }

  if (els.slider) els.slider.addEventListener('input', onSliderInput);
  buildEventChips();

  function destroy() {
    if (els.slider) els.slider.removeEventListener('input', onSliderInput);
  }

  return { onScrub, setYearsAgo, destroy, events, MAX_YEARS };
}
