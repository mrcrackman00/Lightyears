// stars.js — star data loading + age→star matching logic for Lightyears (Phase 1).
// Exposes: loadStars, ageFromBirthday, findStarForAge, colorForCi

// 1 parsec = 3.262 light-years (per BUILD_PLAN verified facts).
export const LY_PER_PARSEC = 3.262;

// The nearest star to the Sun, Proxima Centauri, is ~4.24 ly away.
// Anyone "younger" than that in light-years has no real star yet.
export const NEAREST_STAR_LY = 4.24;

/**
 * Fetch the trimmed star catalog (built in Phase 0 by data/build-stars.js).
 * @returns {Promise<Array<object>>}
 */
export async function loadStars() {
  const res = await fetch('data/stars.json');
  if (!res.ok) {
    throw new Error(`Could not load star data (HTTP ${res.status}).`);
  }
  return res.json();
}

/**
 * Decimal years from a birthday (YYYY-MM-DD) to today.
 * @param {string} dateString
 * @returns {number} age in years (can be fractional)
 */
export function ageFromBirthday(dateString) {
  const birth = new Date(dateString);
  const now = new Date();
  const ms = now.getTime() - birth.getTime();
  const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
  return ms / MS_PER_YEAR;
}

/** Light-years for a star whose `dist` is in parsecs. */
export function lightYears(star) {
  return star.dist * LY_PER_PARSEC;
}

/**
 * Find the real star whose light left it closest to `age` years ago.
 *
 * Prefers named/bright stars so the result feels special, but always falls
 * back to the closest match. If the age is smaller than the distance to the
 * nearest star, returns a friendly "too young" result instead.
 *
 * @param {Array<object>} stars
 * @param {number} age years
 * @returns {{ tooYoung: boolean, star?: object, lightYears?: number, age: number }}
 */
export function findStarForAge(stars, age) {
  if (age < NEAREST_STAR_LY) {
    return { tooYoung: true, age };
  }

  // Among stars within a small window of the exact age, prefer a named one.
  // Otherwise just take the globally closest star.
  let closest = null;
  let closestDelta = Infinity;
  let closestNamed = null;
  let closestNamedDelta = Infinity;

  const NAMED_WINDOW = 2.5; // ly — how far we'll reach for a "nicer" named star

  for (const star of stars) {
    if (!Number.isFinite(star.dist)) continue;
    const ly = star.dist * LY_PER_PARSEC;
    const delta = Math.abs(ly - age);

    if (delta < closestDelta) {
      closestDelta = delta;
      closest = star;
    }
    if (star.proper && delta < closestNamedDelta) {
      closestNamedDelta = delta;
      closestNamed = star;
    }
  }

  let chosen = closest;
  if (closestNamed && closestNamedDelta - closestDelta <= NAMED_WINDOW) {
    chosen = closestNamed;
  }

  return {
    tooYoung: false,
    star: chosen,
    lightYears: chosen.dist * LY_PER_PARSEC,
    age,
  };
}

/**
 * Best display name for a star: proper name, then Bayer/Flamsteed, else generic.
 * @param {object} star
 * @returns {string}
 */
export function starName(star) {
  if (star.proper && star.proper.trim()) return star.proper.trim();
  if (star.bf && star.bf.trim()) return star.bf.trim();
  return 'an unnamed star';
}

/**
 * Map a B-V color index to a star color hex (per BUILD_PLAN table).
 * Blank/invalid ci defaults to white.
 * @param {number|string|null} ci
 * @returns {string} hex color
 */
export function colorForCi(ci) {
  if (ci === '' || ci == null || Number.isNaN(Number(ci))) return '#FFFFFF';
  const c = Number(ci);
  if (c < 0.0) return '#AABFFF'; // Blue-white
  if (c < 0.3) return '#C8DCFF'; // White
  if (c < 0.6) return '#FFFAC8'; // Yellow-white
  if (c < 0.8) return '#FFFFC8'; // Yellow (Sun-like)
  if (c < 1.4) return '#FFC864'; // Orange
  return '#FF9650'; // Red
}
