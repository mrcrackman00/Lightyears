#!/usr/bin/env node
/**
 * build-stars.js — downloads the HYG v4.1 star catalog, trims it, and writes data/stars.json.
 *
 * Filter: keep rows where dist < 100000 AND (mag <= 6.5 OR proper is non-empty).
 * Skip id 0 (the Sun). Emit only the columns the site uses.
 *
 * Run: node data/build-stars.js
 * Requires Node 18+ (uses built-in fetch). No npm dependencies.
 */

const fs = require('fs');
const path = require('path');

// NOTE: the HYG v4.1 file is published as "hygdata_v41.csv" (not "hyg_v41.csv").
const CSV_URL =
  'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';

const KEEP_COLUMNS = [
  'proper',
  'bf',
  'ra',
  'dec',
  'dist',
  'mag',
  'ci',
  'spect',
  'con',
  'x',
  'y',
  'z',
];

// Columns that should be parsed as numbers (others stay as trimmed strings).
const NUMERIC_COLUMNS = new Set(['ra', 'dec', 'dist', 'mag', 'ci', 'x', 'y', 'z']);

const DIST_LIMIT = 100000;
const MAG_LIMIT = 6.5;

/**
 * Parse a single CSV line into fields. The HYG catalog uses plain commas with
 * occasional quoted fields, so we handle simple double-quote escaping.
 */
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

async function main() {
  console.log('Downloading HYG v4.1 CSV...');
  console.log('  ' + CSV_URL);

  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();
  console.log(`Downloaded ${(csv.length / 1024 / 1024).toFixed(1)} MB.`);

  // Split on newlines, tolerate CRLF.
  const lines = csv.split(/\r?\n/);
  const header = parseCsvLine(lines[0]).map((h) => h.trim());

  const idx = {};
  header.forEach((name, i) => {
    idx[name] = i;
  });

  // Sanity check that the columns we depend on exist.
  const required = ['id', 'dist', 'mag', 'proper', ...KEEP_COLUMNS];
  for (const col of required) {
    if (!(col in idx)) {
      throw new Error(`Expected column "${col}" not found in CSV header.`);
    }
  }

  const stars = [];
  let scanned = 0;

  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    if (!line) continue;
    const f = parseCsvLine(line);
    if (f.length < header.length) continue;
    scanned++;

    const id = f[idx.id].trim();
    if (id === '0') continue; // Skip the Sun.

    const distRaw = f[idx.dist].trim();
    const dist = parseFloat(distRaw);
    if (!Number.isFinite(dist) || dist >= DIST_LIMIT) continue;

    const proper = f[idx.proper].trim();
    const magRaw = f[idx.mag].trim();
    const mag = parseFloat(magRaw);
    const magOk = Number.isFinite(mag) && mag <= MAG_LIMIT;

    if (!magOk && proper === '') continue;

    const star = {};
    for (const col of KEEP_COLUMNS) {
      const raw = (f[idx[col]] ?? '').trim();
      if (NUMERIC_COLUMNS.has(col)) {
        const n = parseFloat(raw);
        star[col] = Number.isFinite(n) ? n : null;
      } else {
        star[col] = raw;
      }
    }
    stars.push(star);
  }

  const outPath = path.join(__dirname, 'stars.json');
  fs.writeFileSync(outPath, JSON.stringify(stars));

  const named = stars.filter((s) => s.proper).length;
  console.log(`Scanned ${scanned} data rows.`);
  console.log(`Wrote ${stars.length} stars to ${outPath}`);
  console.log(`  of which ${named} have a proper name.`);
  console.log(`  file size: ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error('build-stars failed:', err.message);
  process.exit(1);
});
