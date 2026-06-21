// starpost.js — Phase 4: pin a message to your star + generate a share PNG.
//
// Notes live in localStorage, keyed by star name, so revisiting the same
// birthday brings your message back. The share card is a styled DOM node we
// rasterise to a PNG with html-to-image (loaded lazily from the CDN).
//
// createStarpost({ els }) returns:
//   open(star, lightYears)  show the composer for this star (prefill saved note)
//   close()                 hide the whole panel + reset to composer
//   destroy()               remove listeners

const STORE_PREFIX = 'lightyears:note:';
const MAX_LEN = 180;

function storeKey(starName) {
  return STORE_PREFIX + String(starName).trim().toLowerCase();
}

/** Read a saved note for a star (empty string if none / storage blocked). */
export function loadNote(starName) {
  try {
    return localStorage.getItem(storeKey(starName)) || '';
  } catch (e) {
    return '';
  }
}

/** Persist (or clear) a note for a star. Silently no-ops if storage is blocked. */
export function saveNote(starName, message) {
  try {
    const key = storeKey(starName);
    if (message && message.trim()) {
      localStorage.setItem(key, message.trim());
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    /* private mode / storage full — sharing still works this session */
  }
}

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'star'
  );
}

export function createStarpost({ els }) {
  let current = null; // { star, lightYears, name, color }
  let htmlToImage = null; // lazily imported module
  let busy = false;

  function setCount() {
    const n = els.message.value.length;
    els.count.textContent = `${n} / ${MAX_LEN}`;
  }

  function showComposer() {
    els.composer.hidden = false;
    els.output.hidden = true;
    els.message.focus();
  }

  function open(ctx) {
    current = ctx;
    els.panel.hidden = false;
    els.composer.hidden = false;
    els.output.hidden = true;
    if (els.starLabel) els.starLabel.textContent = ctx.name;
    els.message.value = loadNote(ctx.name);
    setCount();
    els.message.focus();
  }

  function close() {
    els.panel.hidden = true;
    els.output.hidden = true;
    els.composer.hidden = false;
    current = null;
  }

  /** Fill the share-card node with the current star + message. */
  function renderCard() {
    if (!current) return;
    els.scName.textContent = current.name;
    const con = current.con ? ` · in ${current.con}` : '';
    els.scMeta.textContent = `${current.lightYears.toFixed(1)} light-years away${con}`;
    els.card.style.setProperty('--star-color', current.color);

    const msg = els.message.value.trim();
    if (msg) {
      els.scMessage.textContent = `“${msg}”`;
      els.scMessage.hidden = false;
    } else {
      els.scMessage.textContent = '';
      els.scMessage.hidden = true;
    }
  }

  async function makeCard() {
    if (!current) return;
    saveNote(current.name, els.message.value);
    renderCard();
    els.composer.hidden = true;
    els.output.hidden = false;
    if (els.hint) els.hint.hidden = false;
  }

  async function download() {
    if (busy || !current) return;
    busy = true;
    const label = els.downloadBtn.textContent;
    els.downloadBtn.disabled = true;
    els.downloadBtn.textContent = 'Painting the stars…';
    try {
      if (!htmlToImage) htmlToImage = await import('html-to-image');
      // Render at 2x for crisp social images.
      const dataUrl = await htmlToImage.toPng(els.card, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#05060f',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `lightyears-${slugify(current.name)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (els.hint) {
        els.hint.textContent =
          'Saved! Post it anywhere — that’s how others find their star too.';
      }
    } catch (err) {
      console.error('Share card render failed', err);
      if (els.hint) {
        els.hint.textContent =
          'Could not build the image here. Try again, or screenshot the card above.';
      }
    } finally {
      els.downloadBtn.disabled = false;
      els.downloadBtn.textContent = label;
      busy = false;
    }
  }

  // ----- listeners ----------------------------------------------------------
  function onInput() {
    if (els.message.value.length > MAX_LEN) {
      els.message.value = els.message.value.slice(0, MAX_LEN);
    }
    setCount();
  }
  els.message.addEventListener('input', onInput);
  els.makeBtn.addEventListener('click', makeCard);
  els.downloadBtn.addEventListener('click', download);
  if (els.editBtn) els.editBtn.addEventListener('click', showComposer);

  function destroy() {
    els.message.removeEventListener('input', onInput);
    els.makeBtn.removeEventListener('click', makeCard);
    els.downloadBtn.removeEventListener('click', download);
    if (els.editBtn) els.editBtn.removeEventListener('click', showComposer);
  }

  return { open, close, destroy };
}
