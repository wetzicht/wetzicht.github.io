/*
  Wetzicht engine: the profile questions, the matching logic and the shared rendering.
  Used by index.html (the free check) and kantoor.html (the firm app). No dependencies.
*/
(function () {
  'use strict';

  const DATA = window.WZ_DATA || { items: [], sectors: [], subjects: [], generated: '', source: {} };
  const RULES = window.WZ_RULES || {};
  const LOG = window.WZ_LOG || [];

  /* ---------- the profile: what we ask ---------- */
  const SECTORS = [
    { k: 'agro', key: 'agrosector', n: 'Agrosector', low: 'de agrosector' },
    { k: 'bouw', key: 'bouwnijverheid', n: 'Bouw', low: 'de bouw' },
    { k: 'cultuur', key: 'cultuur-amusement-sport-en-media', n: 'Cultuur, sport en media', low: 'cultuur, sport of media' },
    { k: 'handel', key: 'detailhandel-groothandel-en-ambachten', n: 'Winkel, groothandel of ambacht', low: 'detailhandel, groothandel of ambacht' },
    { k: 'horeca', key: 'horeca-recreatie-en-catering', n: 'Horeca, recreatie en catering', low: 'horeca, recreatie of catering' },
    { k: 'industrie', key: 'industrie', n: 'Industrie', low: 'de industrie' },
    { k: 'kinderopvang', key: 'kinderopvang', n: 'Kinderopvang', low: 'de kinderopvang' },
    { k: 'persoonlijk', key: 'persoonlijke-dienstverlening', n: 'Persoonlijke dienstverlening', low: 'de persoonlijke dienstverlening' },
    { k: 'vervoer', key: 'vervoer', n: 'Vervoer en logistiek', low: 'vervoer of logistiek' },
    { k: 'zakelijk', key: 'zakelijke-dienstverlening', n: 'Zakelijke dienstverlening', low: 'de zakelijke dienstverlening' },
    { k: 'zorg', key: 'zorg', n: 'Zorg', low: 'de zorg' },
  ];
  const VORMEN = [
    { k: 'ez', n: 'Eenmanszaak', why: '{je} een eenmanszaak hebt' },
    { k: 'vof', n: 'Vof, maatschap of cv', why: '{je} een vof, maatschap of cv hebt' },
    { k: 'bv', n: 'Bv of nv', why: '{je} een bv of nv hebt' },
    { k: 'sv', n: 'Stichting, vereniging of coöperatie', why: '{je} een stichting, vereniging of coöperatie bent' },
  ];
  const PERS = [
    { k: '0', n: 'Geen personeel', min: 0 },
    { k: '1', n: '1 tot 9', min: 1 },
    { k: '10', n: '10 tot 49', min: 10 },
    { k: '50', n: '50 tot 99', min: 50 },
    { k: '100', n: '100 tot 249', min: 100 },
    { k: '250', n: '250 of meer', min: 250 },
  ];
  const GROUPS = [
    { k: 'mensen', n: 'Mensen en personeel' },
    { k: 'verkoop', n: 'Klanten en verkoop' },
    { k: 'producten', n: 'Producten en diensten' },
    { k: 'vervoer', n: 'Auto\'s en vervoer' },
    { k: 'geld', n: 'Geld, pand en energie' },
    { k: 'branche', n: 'Specifiek voor je branche' },
  ];
  /* when: 'staff' = only asked when there is staff, 'nostaff', 'ib' = eenmanszaak or vof, 'big' = 250+ staff.
     sec: only asked when one of these sectors is ticked. why: the reason shown with a match. */
  const FLAGS = [
    { k: 'zzp_inhuur', g: 'mensen', n: 'Ik huur zzp\'ers in', why: '{je} zzp\'ers inhuurt' },
    { k: 'opdracht', g: 'mensen', n: 'Ik werk zelf als zzp\'er voor opdrachtgevers', why: '{je} als zzp\'er voor opdrachtgevers werkt', when: 'nostaff' },
    { k: 'inlenen', g: 'mensen', n: 'Ik werk met uitzendkrachten of gedetacheerden', why: '{je} uitzendkrachten of gedetacheerden inleent' },
    { k: 'uitlenen', g: 'mensen', n: 'Ik leen zelf personeel uit (uitzenden, detacheren, payroll)', why: '{je} personeel uitleent' },
    { k: 'tijdelijk', g: 'mensen', n: 'Werknemers met een tijdelijk contract', why: '{je} werknemers met een tijdelijk contract hebt', when: 'staff' },
    { k: 'nuluren', g: 'mensen', n: 'Werknemers met een nuluren- of oproepcontract', why: '{je} werknemers met een nulurencontract hebt', when: 'staff' },
    { k: 'minloon', g: 'mensen', n: 'Werknemers die rond het minimumloon verdienen', why: '{je} werknemers rond het minimumloon betaalt', when: 'staff' },
    { k: 'jong', g: 'mensen', n: 'Werknemers jonger dan 21 jaar', why: '{je} werknemers jonger dan 21 jaar hebt', when: 'staff' },
    { k: 'stage', g: 'mensen', n: 'Stagiairs (mbo, hbo of wo)', why: '{je} stagiairs hebt' },
    { k: 'buitenlands', g: 'mensen', n: 'Kennismigranten of expats (30%-regeling)', why: '{je} kennismigranten of expats in dienst hebt', when: 'staff' },
    { k: 'migrant', g: 'mensen', n: 'Arbeidsmigranten, in dienst of ingeleend', why: '{je} met arbeidsmigranten werkt' },
    { k: 'asiel', g: 'mensen', n: 'Asielzoekers in dienst, of plannen daarvoor', why: '{je} asielzoekers in dienst hebt of wilt nemen' },
    { k: 'huisvesting', g: 'mensen', n: 'Ik regel huisvesting voor werknemers', why: '{je} huisvesting voor werknemers regelt', when: 'staff' },

    { k: 'b2c', g: 'verkoop', n: 'Ik verkoop aan consumenten', why: '{je} aan consumenten verkoopt' },
    { k: 'b2b', g: 'verkoop', n: 'Ik stuur facturen aan andere bedrijven', why: '{je} facturen aan andere bedrijven stuurt' },
    { k: 'online', g: 'verkoop', n: 'Ik verkoop online (webshop, social media, online diensten)', why: '{je} online verkoopt' },
    { k: 'claims', g: 'verkoop', n: 'Ik noem mijn product of bedrijf duurzaam, groen of klimaatneutraal', why: '{je} duurzaamheidsclaims gebruikt' },
    { k: 'telemarketing', g: 'verkoop', n: 'Ik verkoop per telefoon, aan de deur of op straat', why: '{je} per telefoon, aan de deur of op straat verkoopt' },
    { k: 'alcohol', g: 'verkoop', n: 'Ik verkoop, schenk, maak of importeer alcohol', why: '{je} alcohol verkoopt, schenkt, maakt of importeert' },
    { k: 'tabak', g: 'verkoop', n: 'Ik verkoop tabak, sigaren of vapes', why: '{je} tabak, sigaren of vapes verkoopt' },
    { k: 'togo', g: 'verkoop', n: 'Eten of drinken voor onderweg (wegwerpbekers of -bakjes)', why: '{je} eten of drinken voor onderweg verkoopt' },

    { k: 'producten', g: 'producten', n: 'Ik verkoop fysieke producten', why: '{je} fysieke producten verkoopt' },
    { k: 'fabrikant', g: 'producten', n: 'Ik maak producten, of laat ze onder mijn eigen merk maken', why: '{je} producten maakt of onder eigen merk verkoopt' },
    { k: 'import', g: 'producten', n: 'Ik importeer producten van buiten de EU', why: '{je} producten van buiten de EU importeert' },
    { k: 'export', g: 'producten', n: 'Ik exporteer producten', why: '{je} producten exporteert' },
    { k: 'elektronica', g: 'producten', n: 'Mijn producten bevatten elektronica, software of accu\'s', why: '{jouw} producten elektronica, software of accu\'s bevatten' },
    { k: 'verpakking', g: 'producten', n: 'Ik verpak producten of verstuur ze in verzendverpakking', why: '{je} verpakkingen op de markt brengt of gebruikt' },
    { k: 'eudr', g: 'producten', n: 'Ik handel in hout, papier, koffie, cacao, soja, palmolie, rubber of rundleer', why: '{je} handelt in producten die onder de ontbossingsregels vallen' },
    { k: 'tweedehands', g: 'producten', n: 'Ik koop of verhandel tweedehands goederen', why: '{je} tweedehands goederen opkoopt of verhandelt' },
    { k: 'software', g: 'producten', n: 'Ik ontwikkel of verkoop software of AI', why: '{je} software of AI ontwikkelt of verkoopt' },
    { k: 'digitaal', g: 'producten', n: 'Ik lever internet-, cloud-, hosting- of platformdiensten', why: '{je} internet-, cloud-, hosting- of platformdiensten levert' },
    { k: 'innovatie', g: 'producten', n: 'Ik ontwikkel zelf innovaties (start-up, WBSO, innovatiebox)', why: '{je} zelf innovaties ontwikkelt' },

    { k: 'leaseauto', g: 'vervoer', n: 'Auto van de zaak op benzine, diesel of hybride, die ook privé wordt gereden', why: '{je} een auto van de zaak met uitstoot hebt die ook privé wordt gebruikt' },
    { k: 'ev', g: 'vervoer', n: 'Elektrische of waterstofauto op de zaak', why: '{je} een elektrische of waterstofauto op de zaak hebt' },
    { k: 'bestel', g: 'vervoer', n: 'Bestelauto', why: '{je} een bestelauto hebt' },
    { k: 'vracht', g: 'vervoer', n: 'Vrachtwagen zwaarder dan 3.500 kg', why: '{je} een vrachtwagen zwaarder dan 3.500 kg hebt' },
    { k: 'bestel_int', g: 'vervoer', n: 'Internationaal vervoer met een voertuig boven 2.500 kg', why: '{je} internationaal rijdt met een voertuig boven 2.500 kg' },
    { k: 'youngtimer', g: 'vervoer', n: 'Youngtimer of oldtimer op de zaak', why: '{je} een youngtimer of oldtimer op de zaak hebt' },
    { k: 'auto_import', g: 'vervoer', n: 'Ik importeer of verhandel auto\'s of motoren', why: '{je} auto\'s of motoren importeert of verhandelt' },

    { k: 'starter', g: 'geld', n: 'Gestart in de afgelopen vijf jaar', why: '{je} startende ondernemer bent', when: 'ib' },
    { k: 'partner', g: 'geld', n: 'Mijn partner werkt mee in het bedrijf', why: '{jouw} partner meewerkt in het bedrijf', when: 'ib' },
    { k: 'stoppen', g: 'geld', n: 'Ik wil binnen een paar jaar stoppen of overdragen', why: '{je} binnen een paar jaar wilt stoppen of overdragen' },
    { k: 'overname', g: 'geld', n: 'Ik wil een bedrijf overnemen (ook uit faillissement)', why: '{je} een bedrijf wilt overnemen' },
    { k: 'zon', g: 'geld', n: 'Zonnepanelen op een kleinverbruikaansluiting (tot 3x80 A)', why: '{je} zonnepanelen op een kleinverbruikaansluiting hebt' },
    { k: 'vastgoed', g: 'geld', n: 'Ik beleg in woningen of verhuur ze', why: '{je} in woningen belegt of ze verhuurt' },
    { k: 'bouwen', g: 'geld', n: 'Ik laat een bedrijfspand bouwen of verbouwen', why: '{je} een bedrijfspand laat bouwen of verbouwen' },
    { k: 'kritiek', g: 'geld', n: 'Actief in een kritieke sector: energie, zorg, transport, drinkwater, voedsel, afval, chemie of digitale infrastructuur', why: '{je} in een kritieke sector actief bent' },
    { k: 'sociaal', g: 'geld', n: 'Sociale onderneming: het maatschappelijke doel gaat voor', why: '{je} een sociale onderneming hebt' },
    { k: 'groep750', g: 'geld', n: 'Onderdeel van een groep met € 750 miljoen omzet of meer', why: '{je} onderdeel bent van een groep met € 750 miljoen omzet of meer', when: 'big' },

    { k: 'gastouder', g: 'branche', n: 'Gastouder of gastouderbureau', why: '{je} gastouder bent of een gastouderbureau hebt', sec: ['kinderopvang'] },
    { k: 'kdv', g: 'branche', n: 'Kinderdagverblijf of bso', why: '{je} een kinderdagverblijf of bso hebt', sec: ['kinderopvang'] },
    { k: 'taxi', g: 'branche', n: 'Taxibedrijf of taxichauffeur', why: '{je} taxiondernemer bent', sec: ['vervoer'] },
    { k: 'bezorg', g: 'branche', n: 'Bezorgdienst of pakketbezorging', why: '{je} een bezorgdienst hebt', sec: ['vervoer', 'handel', 'horeca'] },
    { k: 'luchtvaart', g: 'branche', n: 'Luchtvaartmaatschappij of luchthaven', why: '{je} in de luchtvaart actief bent', sec: ['vervoer'] },
    { k: 'binnenvaart', g: 'branche', n: 'Brandstofleverancier voor de binnenvaart', why: '{je} brandstof levert aan de binnenvaart', sec: ['vervoer'] },
    { k: 'kortverhuur', g: 'branche', n: 'Korte verhuur van accommodatie of personenvervoer via een platform', why: '{je} via een platform accommodatie verhuurt of personen vervoert', sec: ['horeca', 'vervoer', 'zakelijk'] },
    { k: 'kreeft', g: 'branche', n: 'Ik bereid kreeft of krab', why: '{je} kreeft of krab bereidt', sec: ['horeca'] },
    { k: 'ballon', g: 'branche', n: 'Ik bied ballonvaarten aan', why: '{je} ballonvaarten aanbiedt', sec: ['horeca', 'cultuur'] },
    { k: 'brouwerij', g: 'branche', n: 'Kleine brouwerij', why: '{je} een kleine brouwerij hebt', sec: ['horeca', 'industrie'] },
    { k: 'vuurwerk', g: 'branche', n: 'Vuurwerk: verkoop, import of evenementen', why: '{je} met vuurwerk werkt', sec: ['handel', 'cultuur'] },
    { k: 'bloemen', g: 'branche', n: 'Ik kweek of verkoop bloemen en planten', why: '{je} bloemen en planten kweekt of verkoopt', sec: ['agro', 'handel'] },
    { k: 'bosbouw', g: 'branche', n: 'Bosbouw', why: '{je} een bosbouwbedrijf hebt', sec: ['agro'] },
    { k: 'vlees', g: 'branche', n: 'Vleesketen: slachterij of vleesverwerking', why: '{je} in de vleesketen actief bent', sec: ['agro', 'industrie'] },
    { k: 'dranken', g: 'branche', n: 'Ik maak of importeer gezoete dranken, zuivel- of sojadranken', why: '{je} gezoete dranken maakt of importeert', sec: ['industrie', 'handel'] },
    { k: 'water_groot', g: 'branche', n: 'Meer dan 50.000 m³ drinkwater per jaar op één aansluiting', why: '{je} meer dan 50.000 m³ drinkwater per jaar gebruikt', sec: ['industrie', 'agro'] },
    { k: 'prtr', g: 'branche', n: 'Grote installatie met milieuverslag (PRTR), mijnbouw of winning', why: '{je} een milieuverslag (PRTR) moet indienen', sec: ['industrie'] },
    { k: 'afval', g: 'branche', n: 'Afval verbranden, storten of exporteren', why: '{je} afval verbrandt, stort of exporteert', sec: ['industrie', 'zakelijk'] },
    { k: 'rijschool', g: 'branche', n: 'Rijschool of rijinstructeur', why: '{je} een rijschool hebt of rijinstructeur bent', sec: ['persoonlijk'] },
    { k: 'kindvlog', g: 'branche', n: 'Vlogs met kinderen, of samenwerking met kindvloggers', why: '{je} vlogs met kinderen maakt of met kindvloggers samenwerkt', sec: ['cultuur'] },
    { k: 'crypto_fin', g: 'branche', n: 'Cryptodiensten, financiële instelling of fiscaal intermediair', why: '{je} cryptodiensten aanbiedt of financieel intermediair bent', sec: ['zakelijk'] },
    { k: 'corporatie', g: 'branche', n: 'Woningcorporatie', why: '{je} een woningcorporatie bent', sec: ['zakelijk', 'bouw'] },
  ];
  const FLAG = Object.fromEntries(FLAGS.map((f) => [f.k, f]));
  const SEC = Object.fromEntries(SECTORS.map((s) => [s.k, s]));
  const SEC_BY_KEY = Object.fromEntries(SECTORS.map((s) => [s.key, s]));

  const PHASE = {
    ingegaan: { n: 'Geldt al', long: 'Geldt al: controleer of je eraan voldoet' },
    vast: { n: 'Staat vast', long: 'Staat vast: bereid je voor' },
    plan: { n: 'Plan', long: 'Plannen: nog niet zeker' },
    onbekend: { n: 'Status onbekend', long: 'Status onbekend' },
  };
  const KIND = { p: 'Nieuwe plicht', k: 'Kost geld', v: 'Voordeel', r: 'Regels veranderen' };

  /* ---------- profile helpers ---------- */
  function emptyProfile() { return { vorm: '', pers: '', sec: [], f: [] }; }
  function cleanProfile(p) {
    p = p || {};
    const out = emptyProfile();
    if (VORMEN.some((v) => v.k === p.vorm)) out.vorm = p.vorm;
    if (PERS.some((x) => x.k === String(p.pers))) out.pers = String(p.pers);
    out.sec = [...new Set((p.sec || []).filter((s) => SEC[s]))];
    out.f = [...new Set((p.f || []).filter((k) => FLAG[k]))];
    return out;
  }
  const staffMin = (p) => (PERS.find((x) => x.k === p.pers) || { min: 0 }).min;
  function flagVisible(f, p) {
    if (f.when === 'staff' && staffMin(p) < 1) return false;
    if (f.when === 'nostaff' && staffMin(p) >= 1) return false;
    if (f.when === 'ib' && !(p.vorm === 'ez' || p.vorm === 'vof')) return false;
    if (f.when === 'big' && staffMin(p) < 250) return false;
    if (f.sec && !f.sec.some((s) => p.sec.includes(s))) return false;
    return true;
  }
  const visibleFlags = (p) => FLAGS.filter((f) => flagVisible(f, p));
  const isComplete = (p) => !!(p.vorm && p.pers !== '');

  function tokensOf(p) {
    const T = new Set();
    const n = staffMin(p);
    if (n >= 1) T.add('staff');
    if (n >= 10) T.add('staff10');
    if (n >= 50) T.add('staff50');
    if (n >= 250) T.add('staff250');
    if (p.pers === '100') T.add('staff100_249');
    if (p.vorm) T.add('vorm:' + p.vorm);
    if (p.vorm === 'ez' || p.vorm === 'vof') T.add('ib');
    p.sec.forEach((s) => T.add('s:' + s));
    p.f.forEach((k) => { if (FLAG[k] && flagVisible(FLAG[k], p)) T.add(k); });
    return T;
  }
  const holds = (cond, T) => cond.split('+').every((t) => T.has(t));

  function whyOfToken(t) {
    if (FLAG[t]) return FLAG[t].why;
    if (t.startsWith('s:')) return '{je} actief bent in ' + (SEC[t.slice(2)] || { low: 'deze sector' }).low;
    if (t.startsWith('vorm:')) return (VORMEN.find((v) => v.k === t.slice(5)) || {}).why || '';
    return {
      staff: '{je} personeel hebt', staff10: '{je} 10 of meer werknemers hebt', staff50: '{je} 50 of meer werknemers hebt',
      staff250: '{je} 250 of meer werknemers hebt', staff100_249: '{je} tussen de 100 en 250 werknemers hebt',
      ib: '{je} als ondernemer inkomstenbelasting betaalt',
    }[t] || '';
  }
  /* form: 'je' or 'u' */
  function reason(m, form) {
    const u = form === 'u';
    let s;
    if (m.fresh) s = 'Nieuw op de officiële lijst en nog niet ingedeeld. Lees zelf of dit voor {jou} geldt.';
    else if (m.cls === 'algemeen') s = 'Niet aan één soort bedrijf gebonden. Lees of het voor {jou} speelt.';
    else if (!m.conds || !m.conds.length) s = '';
    else {
      // The most specific matched condition explains it best.
      const best = [...m.conds].sort((a, b) => b.split('+').length - a.split('+').length)[0];
      const parts = best.split('+').map(whyOfToken).filter(Boolean);
      s = (m.cls === 'mogelijk' ? 'Mogelijk, omdat ' : 'Omdat ') + parts.join(' en ') + '.';
    }
    if (form === 'k') {
      // Third person, for the accountant reading about a client.
      return s.replace(/\{je\}/g, 'de klant').replace(/\{jouw\}/g, 'de').replace(/\{jou\}/g, 'deze klant')
        .replace(/\bhebt\b/g, 'heeft').replace(/\bbent\b/g, 'is').replace(/\bwilt\b/g, 'wil');
    }
    return s.replace(/\{je\}/g, u ? 'u' : 'je').replace(/\{jouw\}/g, u ? 'uw' : 'je').replace(/\{jou\}/g, u ? 'u' : 'jou');
  }

  /* ---------- matching ---------- */
  function matchItem(item, T) {
    const r = RULES[item.id];
    if (!r) {
      const hit = !item.sec.length || item.sec.some((key) => SEC_BY_KEY[key] && T.has('s:' + SEC_BY_KEY[key].k));
      return { cls: hit ? 'mogelijk' : 'nee', conds: [], kind: 'r', fresh: true };
    }
    const w = (r.w || []).filter((c) => holds(c, T));
    if (w.length) return { cls: 'raakt', conds: w, kind: r.k || 'r' };
    const m = (r.m || []).filter((c) => holds(c, T));
    if (m.length) return { cls: 'mogelijk', conds: m, kind: r.k || 'r' };
    if (r.g) return { cls: 'algemeen', conds: [], kind: r.k || 'r' };
    return { cls: 'nee', conds: [], kind: r.k || 'r' };
  }
  const PH_ORDER = { vast: 0, ingegaan: 1, plan: 2, onbekend: 3 };
  function sortItems(a, b) {
    return (a.item.d || '9999').localeCompare(b.item.d || '9999') || a.item.t.localeCompare(b.item.t, 'nl');
  }
  /* Returns one row per law change: { item, cls, conds, kind, fresh } */
  function evaluate(p) {
    const T = tokensOf(cleanProfile(p));
    return DATA.items.map((item) => Object.assign({ item }, matchItem(item, T)));
  }
  function summarize(rows) {
    const c = { raakt: 0, mogelijk: 0, algemeen: 0, nee: 0, total: rows.length };
    rows.forEach((r) => { c[r.cls]++; });
    return c;
  }

  /* ---------- dates and text ---------- */
  const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const MSHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  function parts(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
  function fmtDate(iso) { if (!iso) return ''; const { y, m, d } = parts(iso); return `${d} ${MONTHS[m - 1]} ${y}`; }
  function dateLabel(item) { return item.d ? fmtDate(item.d) : (item.dn || 'nog niet bekend'); }
  function todayIso() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; }
  function daysUntil(iso) { return Math.round((new Date(iso + 'T00:00:00') - new Date(todayIso() + 'T00:00:00')) / 86400000); }
  /* The list should be refreshed daily. Returns a warning text when it is more than STALE_DAYS old, else ''. */
  const STALE_DAYS = 10;
  function staleNote() {
    const gen = (DATA.generated || '').slice(0, 10);
    if (!gen) return '';
    const age = -daysUntil(gen);
    return age > STALE_DAYS ? `Let op: deze lijst is ${age} dagen geleden voor het laatst opgehaald. Kijk voor recente wijzigingen op de officiële lijst van Ondernemersplein.` : '';
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^https:\/\//.test(u || '') ? u : '#');

  /* ---------- profile code: compact, readable, no personal data ---------- */
  function encode(p) {
    p = cleanProfile(p);
    return ['WZ1', p.vorm || '-', p.pers === '' ? '-' : p.pers, p.sec.join('-') || '-', p.f.join('-') || '-'].join('.');
  }
  function decode(code) {
    const m = String(code || '').trim().match(/WZ1\.([a-z-]+)\.([0-9-]+)\.([a-z-]+)\.([a-z0-9_-]+)/);
    if (!m) return null;
    const p = cleanProfile({
      vorm: m[1] === '-' ? '' : m[1],
      pers: m[2] === '-' ? '' : m[2],
      sec: m[3] === '-' ? [] : m[3].split('-'),
      f: m[4] === '-' ? [] : m[4].split('-'),
    });
    return isComplete(p) ? p : null;
  }
  function profileLabel(p) {
    const v = (VORMEN.find((x) => x.k === p.vorm) || {}).n || '';
    const n = (PERS.find((x) => x.k === p.pers) || {}).n || '';
    const s = p.sec.map((k) => SEC[k].n).join(', ');
    return [v, n ? (p.pers === '0' ? 'geen personeel' : n + ' werknemers') : '', s].filter(Boolean).join(' · ');
  }

  /* ---------- calendar file ---------- */
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsFold(line) {
    const out = [];
    let cur = '';
    for (const ch of line) {
      if (new TextEncoder().encode(cur + ch).length > 73) { out.push(cur); cur = ' ' + ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n');
  }
  function ics(rows, form) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wetzicht//Wetswijzigingen//NL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Wetswijzigingen (Wetzicht)'];
    rows.filter((r) => r.item.d && r.item.d >= todayIso()).forEach((r) => {
      const d = r.item.d.replace(/-/g, '');
      const next = new Date(r.item.d + 'T12:00:00'); next.setDate(next.getDate() + 1);
      const end = next.toISOString().slice(0, 10).replace(/-/g, '');
      const sure = r.item.ph === 'plan' ? ' (plan, nog niet zeker)' : '';
      lines.push('BEGIN:VEVENT', 'UID:' + r.item.id + '@wetzicht', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + end,
        'SUMMARY:' + icsEscape('Wetswijziging: ' + r.item.t + sure),
        'DESCRIPTION:' + icsEscape(reason(r, form) + '\n\nBron: ' + r.item.url),
        'URL:' + r.item.url, 'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-P30D', 'DESCRIPTION:' + icsEscape('Over 30 dagen: ' + r.item.t), 'END:VALARM',
        'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove(); return ok;
    }
  }

  /* ---------- shared rendering ---------- */
  function dateBlock(item) {
    if (item.d) { const { y, m, d } = parts(item.d); return `<span class="wzc-day">${d} ${MSHORT[m - 1]}</span><span class="wzc-year">${y}</span>`; }
    return `<span class="wzc-open">${esc(item.dn || 'datum nog niet bekend')}</span>`;
  }
  function sourceBlock(item) {
    const vw = item.vw.length ? `<ul>${item.vw.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : (item.vwt ? `<p>${esc(item.vwt)}</p>` : '');
    const wat = item.wat.slice(0, 3).map((x) => `<p>${esc(x)}</p>`).join('');
    const more = item.wat.length > 3 ? '<p>…</p>' : '';
    const doen = item.doen.length ? `<h4>Wat moet u doen?</h4>${item.doen.slice(0, 3).map((x) => `<p>${esc(x)}</p>`).join('')}` : '';
    const law = item.law.length ? `<h4>Wet- en regelgeving</h4><ul>${item.law.map((l) => `<li><a href="${esc(safeUrl(l.href))}" target="_blank" rel="noopener">${esc(l.text)}</a></li>`).join('')}</ul>` : '';
    return `<div class="src">
      ${item.sh ? `<h4>Status volgens de overheid</h4><p><strong>${esc(item.sh)}</strong>${item.se ? '<br>' + esc(item.se) : ''}</p>` : ''}
      ${vw ? `<h4>Voor wie?</h4>${vw}` : ''}
      ${wat ? `<h4>Wat verandert er?</h4>${wat}${more}` : ''}
      ${doen}${law}
      <p style="margin-bottom:0"><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener">Lees de volledige tekst op Ondernemersplein</a></p>
      <p class="attrib">Tekst: Ondernemersplein (KVK en Rijksoverheid), CC BY 4.0, ongewijzigd overgenomen${item.mod ? ', laatst gewijzigd op ' + fmtDate(item.mod) : ''}.</p>
    </div>`;
  }
  /* opts: { form: 'je'|'u', open: bool, extra: html } */
  function card(row, opts) {
    opts = opts || {};
    const it = row.item;
    const why = reason(row, opts.form);
    return `<article class="wzc" data-id="${esc(it.id)}">
      <div class="wzc-date">${dateBlock(it)}</div>
      <div class="wzc-body">
        <div class="flex flex-wrap gap-1.5">
          <span class="badge ph-${esc(it.ph)}">${esc(PHASE[it.ph].n)}</span>
          <span class="badge kind-${esc(row.kind)}">${esc(KIND[row.kind] || '')}</span>
          ${row.cls === 'mogelijk' ? '<span class="badge" style="background:#fff;box-shadow:inset 0 0 0 1px var(--line);color:var(--mute)">Mogelijk</span>' : ''}
        </div>
        <h3 class="wzc-title">${esc(it.t)}</h3>
        ${why ? `<p class="wzc-why">${esc(why)}</p>` : ''}
        ${opts.extra || ''}
        <p class="wzc-url print-only">${esc(String(it.url || '').replace(/^https:\/\//, ''))}</p>
        <details${opts.open ? ' open' : ''}><summary>Wat verandert er</summary>${sourceBlock(it)}</details>
      </div>
    </article>`;
  }

  /* The profile form. Calls onChange(profile) after every change. */
  function form(el, profile, onChange, opts) {
    opts = opts || {};
    let p = cleanProfile(profile);
    const id = opts.id || 'wz';
    const radio = (name, list, val) => list.map((x) => `<label class="opt radio"><input type="radio" name="${id}-${name}" value="${x.k}"${val === x.k ? ' checked' : ''}><span class="box"></span><span>${esc(x.n)}</span></label>`).join('');
    const check = (name, list, vals, key) => list.map((x) => `<label class="opt"><input type="checkbox" data-${name}="${x[key || 'k']}"${vals.includes(x.k) ? ' checked' : ''}><span class="box"></span><span>${esc(x.n)}</span></label>`).join('');
    function draw() {
      const vis = visibleFlags(p);
      const groups = GROUPS.map((g) => ({ g, list: vis.filter((f) => f.g === g.k) })).filter((x) => x.list.length);
      el.innerHTML = `
        <fieldset class="mb-6"><legend class="font-semibold mb-2">Rechtsvorm</legend>
          <div class="grid gap-2 sm:grid-cols-2">${radio('vorm', VORMEN, p.vorm)}</div></fieldset>
        <fieldset class="mb-6"><legend class="font-semibold mb-2">Aantal werknemers</legend>
          <div class="grid gap-2 grid-cols-2 sm:grid-cols-3">${radio('pers', PERS, p.pers)}</div></fieldset>
        <fieldset class="mb-6"><legend class="font-semibold mb-1">Branche</legend>
          <p class="text-sm text-mute mb-2">Kies er één of meer. Staat de jouwe er niet bij? Laat het leeg.</p>
          <div class="grid gap-2 sm:grid-cols-2">${check('sec', SECTORS, p.sec)}</div></fieldset>
        <div class="${isComplete(p) ? '' : 'opacity-50 pointer-events-none'}" ${isComplete(p) ? '' : 'aria-disabled="true"'}>
          <p class="font-semibold mb-1">Wat klopt voor ${opts.subject || 'jouw bedrijf'}?</p>
          <p class="text-sm text-mute mb-3">Vink aan wat van toepassing is. Twijfel je, laat het dan leeg.</p>
          ${groups.map(({ g, list }) => `<fieldset class="mb-5"><legend class="text-xs font-bold uppercase tracking-wider text-mute mb-2">${esc(g.n)}</legend>
            <div class="grid gap-2 sm:grid-cols-2">${check('flag', list, p.f)}</div></fieldset>`).join('')}
        </div>`;
    }
    el.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === id + '-vorm') p.vorm = t.value;
      else if (t.name === id + '-pers') p.pers = t.value;
      else if (t.dataset.sec) p.sec = t.checked ? [...p.sec, t.dataset.sec] : p.sec.filter((s) => s !== t.dataset.sec);
      else if (t.dataset.flag) p.f = t.checked ? [...p.f, t.dataset.flag] : p.f.filter((k) => k !== t.dataset.flag);
      else return;
      // Sector, staff and legal form change which questions are shown: redraw, keep the scroll position.
      if (!t.dataset.flag) { const y = window.scrollY; draw(); window.scrollTo(0, y); }
      onChange(cleanProfile(p));
    });
    draw();
    return { get: () => cleanProfile(p), set: (np) => { p = cleanProfile(np); draw(); } };
  }

  window.WZ = {
    DATA, RULES, LOG, SECTORS, VORMEN, PERS, GROUPS, FLAGS, FLAG, SEC, PHASE, KIND, PH_ORDER,
    emptyProfile, cleanProfile, isComplete, visibleFlags, tokensOf, evaluate, summarize, sortItems, reason,
    fmtDate, dateLabel, todayIso, daysUntil, staleNote, esc, safeUrl, encode, decode, profileLabel, ics, download, copy, card, form,
  };
})();
