#!/usr/bin/env node
/*
  Wetzicht data pipeline
  ----------------------
  Fetches the official list of law changes for entrepreneurs from Ondernemersplein
  (KVK / Rijksoverheid, licence CC-BY 4.0) and writes the data files the site uses.

  Run:   node pipeline/update.mjs
  Needs: Node 18 or newer. No dependencies, no API key.

  Writes:
    site/data/changes.js     the current list, as window.WZ_DATA
    site/data/changelog.js   what changed between runs, as window.WZ_LOG
    pipeline/snapshot.json   the previous state, used to detect changes

  Exit code 0 on success. Prints the ids that have no matching rule yet
  (site/data/rules.js), so you know what to review.
*/
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.ondernemersplein.overheid.nl/content/v1';
const SITE = 'https://ondernemersplein.overheid.nl';
const UA = 'wetzicht-pipeline/1.0 (law change list reuse, CC-BY)';
const PAUSE_MS = 150;          // be polite: one request at a time, with a pause
const LOG_KEEP = 300;          // changelog entries to keep

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(API + path, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (json.status && json.status !== '200') throw new Error('content status ' + json.status);
      return json;
    } catch (err) {
      if (i === tries) throw new Error(`${path}: ${err.message}`);
      await sleep(600 * i);
    }
  }
}

/* ---------- helpers for the content tree ---------- */
const BLOCK = new Set(['p', 'li', 'h2', 'h3', 'h4', 'div', 'tr', 'ul', 'ol', 'table', 'aside', 'section']);

function plain(node) {
  if (node == null) return '';
  if (Array.isArray(node)) return node.map(plain).join('');
  if (typeof node !== 'object') return '';
  let out = typeof node.text === 'string' ? node.text : '';
  if (node.children) out += plain(node.children);
  if (node.html) out += plain(node.html);
  if (node.tag === 'br') out += '\n';
  return out;
}
const clean = (s) => s.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

function collect(node, tag, acc = []) {
  if (Array.isArray(node)) { node.forEach((n) => collect(n, tag, acc)); return acc; }
  if (!node || typeof node !== 'object') return acc;
  if (node.tag === tag) acc.push(node);
  if (node.children) collect(node.children, tag, acc);
  return acc;
}

/* Split the top-level content into: the status block and the sections under each h2. */
function parseContent(content) {
  const top = (content && content.html) || [];
  let statusHead = '', statusText = '';
  const sections = [];
  let cur = null;
  const flat = [];
  // Some pages wrap everything in one div: unwrap wrappers that contain an h2.
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n && n.tag && ['div', 'section', 'article'].includes(n.tag) && collect(n, 'h2').length && n.attributes?.['data-dop-block'] !== 'important') walk(n.children || []);
      else flat.push(n);
    }
  };
  walk(top);
  for (const n of flat) {
    if (!n || typeof n !== 'object') continue;
    if (n.attributes && n.attributes['data-dop-block'] === 'important' && !statusHead) {
      const h = collect(n, 'h3')[0] || collect(n, 'h2')[0];
      statusHead = clean(plain(h));
      statusText = clean(plain((n.children || []).filter((c) => c !== h)));
      continue;
    }
    if (n.tag === 'h2') { cur = { title: clean(plain(n)), nodes: [] }; sections.push(cur); continue; }
    if (cur) cur.nodes.push(n);
  }
  return { statusHead, statusText, sections };
}

function sectionParagraphs(sec) {
  const out = [];
  for (const n of sec.nodes) {
    if (!n || typeof n !== 'object') continue;
    if (n.tag === 'ul' || n.tag === 'ol') {
      const items = collect(n, 'li').map((li) => clean(plain(li))).filter(Boolean);
      if (items.length) out.push({ list: items });
    } else if (n.tag === 'table') {
      continue;
    } else {
      const t = clean(plain(n));
      if (t) out.push({ text: t });
    }
  }
  return out;
}

function phaseOf(head, dateIso) {
  const h = head.toLowerCase();
  if (/is (nu )?ingegaan|geldt nu|gelden nu|is al ingegaan/.test(h)) return 'ingegaan';
  if (/er is een plan/.test(h)) return 'plan';
  if (/gaat door|goedgekeurd|aangenomen/.test(h)) return 'vast';
  if (dateIso && dateIso <= new Date().toISOString().slice(0, 10)) return 'ingegaan';
  return 'onbekend';
}

const keyOf = (name, list) => (list.find((x) => x.name === name) || {}).key || name;

/* ---------- main ---------- */
async function main() {
  const list = await getJson('/wetswijzigingen');
  const sectors = list.filters?.sectors || [];
  const subjects = list.filters?.subjects || [];
  const results = list.results || [];
  if (results.length < 20) throw new Error('Unexpectedly short list (' + results.length + '). Nothing written.');
  console.log(`List: ${results.length} law changes. Fetching details...`);

  const items = [];
  let failed = 0;
  for (const r of results) {
    const slug = r.href.replace(/^\/wetswijzigingen\//, '').replace(/\/$/, '');
    const eff = r.effectiveDateInformation || {};
    const date = eff.date ? eff.date.slice(0, 10) : null;
    const item = {
      id: slug,
      t: r.title,
      d: date,
      dn: clean(eff.description || ''),
      sec: (r.sectors || []).map((n) => keyOf(n, sectors)),
      sub: (r.subjects || []).map((n) => keyOf(n, subjects)),
      url: SITE + r.href,
      sh: '', se: '', ph: 'onbekend', vw: [], vwt: '', wat: [], doen: [], law: [], en: '', mod: '',
    };
    try {
      await sleep(PAUSE_MS);
      const d = await getJson(r.href);
      const eff2 = d.effectiveDateInformation || {};
      if (eff2.date) item.d = eff2.date.slice(0, 10);
      if (eff2.description) item.dn = clean(eff2.description);
      const { statusHead, statusText, sections } = parseContent(d.content);
      item.sh = statusHead; item.se = statusText;
      for (const s of sections) {
        const paras = sectionParagraphs(s);
        const title = s.title.toLowerCase();
        if (/^voor wie/.test(title)) {
          item.vw = paras.flatMap((p) => p.list || []);
          item.vwt = paras.filter((p) => p.text).map((p) => p.text).join(' ');
        } else if (/^wat (verandert|is er veranderd|gaat er veranderen)/.test(title)) {
          item.wat = paras.map((p) => (p.list ? p.list.map((x) => '• ' + x).join('\n') : p.text));
        } else if (/wat moet u doen|wat kunt u doen|hoe bereidt u|voorbereiden/.test(title)) {
          item.doen = paras.map((p) => (p.list ? p.list.map((x) => '• ' + x).join('\n') : p.text));
        }
      }
      const lawList = (d.aside?.linkLists || []).find((l) => /wet- en regelgeving/i.test(l.text || ''));
      item.law = (lawList?.linkList || []).slice(0, 4).map((l) => ({ href: l.href, text: clean(l.text || '') }));
      item.en = d.alternativeLanguagePageLink?.href || '';
      item.mod = (d.metadata?.['dcterms:modified'] || '').slice(0, 10);
    } catch (err) {
      failed++;
      console.warn('  detail failed, using list data only:', err.message);
      // Fall back to the short text from the list.
      const txt = clean(r.text || '');
      item.sh = txt.split(/ Voor wie\?| Wat verandert er\?/)[0].slice(0, 80);
      item.wat = [txt];
    }
    item.ph = phaseOf(item.sh, item.d);
    items.push(item);
  }
  if (failed > results.length / 4) throw new Error(`Too many detail pages failed (${failed}). Nothing written.`);

  items.sort((a, b) => (a.d || '9999').localeCompare(b.d || '9999') || a.t.localeCompare(b.t, 'nl'));

  /* ---------- diff against the previous run ---------- */
  const snapPath = join(ROOT, 'pipeline', 'snapshot.json');
  const logPath = join(ROOT, 'site', 'data', 'changelog.js');
  const today = new Date().toISOString().slice(0, 10);
  let prev = null;
  if (existsSync(snapPath)) { try { prev = JSON.parse(await readFile(snapPath, 'utf8')); } catch { prev = null; } }
  let log = [];
  if (existsSync(logPath)) {
    try { log = JSON.parse((await readFile(logPath, 'utf8')).replace(/^[^=]*=\s*/, '').replace(/;\s*$/, '')); } catch { log = []; }
  }
  const fresh = [];
  if (prev) {
    const before = new Map(prev.items.map((x) => [x.id, x]));
    const now = new Map(items.map((x) => [x.id, x]));
    for (const it of items) {
      const old = before.get(it.id);
      if (!old) { fresh.push({ at: today, type: 'nieuw', id: it.id, t: it.t }); continue; }
      if ((old.d || '') !== (it.d || '') || (!it.d && old.dn !== it.dn))
        fresh.push({ at: today, type: 'datum', id: it.id, t: it.t, from: old.d || old.dn || '', to: it.d || it.dn || '' });
      if (old.ph !== it.ph) fresh.push({ at: today, type: 'status', id: it.id, t: it.t, from: old.ph, to: it.ph });
      else if (old.mod !== it.mod && old.hash !== hash(it)) fresh.push({ at: today, type: 'tekst', id: it.id, t: it.t });
    }
    for (const old of prev.items) if (!now.has(old.id)) fresh.push({ at: today, type: 'vervallen', id: old.id, t: old.t });
  }
  log = [...fresh, ...log].slice(0, LOG_KEEP);

  /* ---------- write ---------- */
  const data = {
    generated: new Date().toISOString(),
    source: { name: 'Ondernemersplein (KVK, Rijksoverheid)', url: SITE + '/wetswijzigingen/', licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/deed.nl' },
    sectors, subjects, items,
  };
  await mkdir(join(ROOT, 'site', 'data'), { recursive: true });
  await writeFile(join(ROOT, 'site', 'data', 'changes.js'), '/* Generated by pipeline/update.mjs. Do not edit by hand. */\nwindow.WZ_DATA = ' + JSON.stringify(data) + ';\n');
  await writeFile(logPath, '/* Generated by pipeline/update.mjs. Do not edit by hand. */\nwindow.WZ_LOG = ' + JSON.stringify(log, null, 1) + ';\n');
  await writeFile(snapPath, JSON.stringify({ at: today, items: items.map((x) => ({ id: x.id, t: x.t, d: x.d, dn: x.dn, ph: x.ph, mod: x.mod, hash: hash(x) })) }, null, 1));

  // When run by GitHub Actions: tell the workflow whether the official list really changed.
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${fresh.length > 0}\nitems=${items.length}\n`);

  /* ---------- report ---------- */
  const count = (ph) => items.filter((x) => x.ph === ph).length;
  console.log(`Written ${items.length} items: ${count('ingegaan')} in force, ${count('vast')} adopted, ${count('plan')} planned, ${count('onbekend')} unknown.`);
  console.log(prev ? `Changes since last run: ${fresh.length}` : 'First run: no previous snapshot to compare with.');
  for (const f of fresh) console.log(`  ${f.type.padEnd(9)} ${f.t}${f.from !== undefined ? `  (${f.from} -> ${f.to})` : ''}`);

  const rulesPath = join(ROOT, 'site', 'data', 'rules.js');
  if (existsSync(rulesPath)) {
    const src = await readFile(rulesPath, 'utf8');
    const missing = items.filter((x) => !src.includes(`'${x.id}'`) && !src.includes(`"${x.id}"`));
    const stale = [...src.matchAll(/^\s*['"]([a-z0-9-]{8,})['"]\s*:/gm)].map((m) => m[1]).filter((id) => !items.some((x) => x.id === id));
    if (missing.length) { console.log(`\nNo rule yet for ${missing.length} item(s). They show as "mogelijk relevant" until you add one:`); missing.forEach((x) => console.log('  ' + x.id)); }
    if (stale.length) { console.log(`\nRules for ${stale.length} item(s) that left the official list (safe to remove):`); stale.forEach((id) => console.log('  ' + id)); }
    if (!missing.length && !stale.length) console.log('Rules cover every item.');
  }
}

function hash(it) {
  const s = JSON.stringify([it.t, it.d, it.dn, it.sh, it.vw, it.vwt, it.wat, it.doen]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

main().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
