/*
  Wetzicht matching rules
  -----------------------
  This file is the editorial layer on top of the official list: for every law change it says
  which kind of business it touches. The official texts are not changed.

  One line per law change, keyed by its id (the last part of the Ondernemersplein URL).

    w  "raakt je bedrijf": the change applies if ANY of these conditions is true
    m  "mogelijk relevant": weaker signals, shown separately
    g  true = of general interest, not tied to a profile
    k  kind: 'p' new duty or ban | 'k' costs more or a benefit ends | 'v' relief or new option | 'r' rules change, check your position

  A condition is one token, or several joined with + (all must be true).
  Tokens: the profile flags from engine.js (zzp_inhuur, b2c, ...), plus
    staff, staff10, staff50, staff250, staff100_249, ib (pays income tax as entrepreneur),
    vorm:ez | vorm:vof | vorm:bv | vorm:sv, and s:<sector> (s:bouw, s:horeca, ...).

  A law change without a line here is still shown: as "nieuw, nog niet ingedeeld".
  pipeline/update.mjs prints the ids that are missing after each run.
*/
window.WZ_RULES = {
  /* ---------- al ingegaan ---------- */
  'cryptoaanbieders-moeten-gegevens-delen-met-belastingdienst': { w: ['crypto_fin'], k: 'p' },
  'toegang-tot-werk-voor-asielzoekers-verandert': { w: ['asiel'], k: 'r' },
  'webshops-moeten-een-herroepingsknop-hebben': { w: ['b2c+online'], k: 'p' },
  'bedrijfsvoertuigen-betalen-tijdelijk-minder-wegenbelasting': { w: ['bestel', 'vracht'], k: 'v' },
  'gastouderopvang-krijgt-nieuwe-regels': { w: ['gastouder'], k: 'p' },
  'helft-personeel-kinderopvang-mag-in-opleiding-zijn': { w: ['kdv'], k: 'v' },
  'invoerrechten-gaan-gelden-voor-e-commercezendingen-tot-eur-150': { w: ['import+online'], m: ['import'], k: 'k' },
  'minimumloon-gaat-omhoog-op-1-juli-2026': { w: ['minloon', 'jong'], m: ['staff'], k: 'k' },
  'nieuwe-en-aangepaste-milieuprestatie-eisen-voor-gebouwen': { w: ['s:bouw'], m: ['bouwen'], k: 'p' },
  'registratieplicht-voor-verkooppunten-tabak': { w: ['tabak'], k: 'p' },
  'tachograaf-smt2-verplicht-boven-2500-kg': { w: ['bestel_int'], k: 'p' },
  'telemarketing-uw-klant-niet-meer-ongevraagd-bellen': { w: ['telemarketing'], k: 'p' },
  'verbeterde-begeleiding-en-opleidingseisen-voor-gastouders': { w: ['gastouder'], k: 'p' },
  'heffing-voor-vrachtwagens-vanaf-3500-kg': { w: ['vracht'], k: 'k' },
  'verkoop-consumentenvuurwerk-stopt-door-vuurwerkverbod': { w: ['vuurwerk'], k: 'p' },
  'ppwr-stelt-strenger-eisen-aan-verpakkingen': { w: ['verpakking'], m: ['fabrikant', 'import', 'b2c+producten'], k: 'p' },
  'cer-richtlijn-beschermt-kritieke-infrastructuur-tegen-fysieke-risicos': { m: ['kritiek'], k: 'p' },
  'nis2-richtlijn-beschermt-netwerk-en-informatiesystemen-tegen-cyberbeveiligingsrisicos': { w: ['kritiek+staff50'], m: ['kritiek', 'digitaal+staff50'], k: 'p' },
  'eevidence-verplicht-bedrijven-digitaal-bewijs-te-verstrekken': { w: ['digitaal'], k: 'p' },
  'tijdelijk-lagere-vrachtwagenheffing': { w: ['vracht'], k: 'v' },
  'duurzaamheidsclaims-moeten-duidelijk-en-controleerbaar-zijn': { w: ['claims'], m: ['b2c'], k: 'p' },
  'verkopers-moeten-consumenten-informeren-over-garantie': { w: ['b2c+producten'], k: 'p' },

  /* ---------- eind 2026 en 1 januari 2027 ---------- */
  'meer-partijen-aansprakelijk-voor-gebrekkige-producten': { w: ['fabrikant', 'import', 'software'], m: ['producten', 'digitaal'], k: 'r' },
  'door-eudr-alleen-nog-import-van-ontbossingsvrije-producten': { w: ['eudr'], m: ['import'], k: 'p' },
  'laag-uurtarief-van-zzper-kan-leiden-tot-arbeidsovereenkomst': { w: ['zzp_inhuur', 'opdracht'], k: 'r' },
  'accijnskorting-op-benzine-en-diesel-verlengd-tot-2028': { w: ['leaseauto', 'bestel', 'vracht'], m: ['youngtimer'], k: 'v' },
  'alcoholaccijns-stijgt-jaarlijks-mee-met-inflatie': { w: ['alcohol'], k: 'k' },
  'lagere-belasting-aandelenopties-startups-en-scale-ups': { w: ['innovatie+staff'], k: 'v' },
  'belasting-op-leidingwater-omhoog': { w: ['water_groot'], m: ['s:horeca', 's:industrie', 's:agro'], k: 'k' },
  'afval-verwerken-wordt-duurder': { w: ['afval'], k: 'k' },
  'gezoete-alcoholvrije-dranken-met-vleugje-zuivel-worden-belast': { w: ['dranken'], k: 'k' },
  'extra-belasting-op-uitstotende-leaseautos': { w: ['leaseauto'], k: 'k' },
  'geen-overdrachtsbelasting-als-woningcorporaties-daeb-woningen-overnemen': { w: ['corporatie'], k: 'v' },
  'grootverbruikers-betalen-belasting-over-al-het-drinkwater': { w: ['water_groot'], k: 'k' },
  'hoge-tarief-vliegbelasting-stijgt-minder-hard': { w: ['luchtvaart'], k: 'v' },
  'hogere-bijtelling-voor-oude-zakelijke-auto-youngtimer': { w: ['youngtimer'], k: 'k' },
  'maximum-forfait-innovatiebox-gaat-omhoog-naar-eur-100000': { w: ['innovatie'], k: 'v' },
  'meewerkaftrek-wordt-minder-en-verdwijnt-daarna': { w: ['ib+partner'], k: 'k' },
  'minimumjeugdloon-vanaf-2027-omhoog': { w: ['jong'], k: 'k' },
  'uitzendbureaus-moeten-gecertificeerd-zijn': { w: ['uitlenen', 'inlenen'], k: 'p' },
  'nieuwe-veiligehavenregels-voor-wereldwijde-minimumbelasting': { w: ['groep750'], k: 'r' },
  'overgebleven-recht-op-loonkostenvoordeel-gaat-over-op-nieuwe-werkgever': { w: ['overname+staff'], m: ['staff'], k: 'v' },
  'personeelskorting-niet-meer-standaard-belastingvrij': { w: ['staff+b2c+producten'], m: ['staff+s:handel', 'staff+s:horeca'], k: 'k' },
  'rechtspersonen-mogen-digitaal-vergaderen': { w: ['vorm:bv', 'vorm:sv'], k: 'v' },
  'afschaffen-salderingsregeling-vanaf-2027': { w: ['zon'], k: 'k' },
  'stakingsaftrek-wordt-minder-en-verdwijnt-daarna': { w: ['ib+stoppen'], k: 'k' },
  'startersaftrek-gaat-omlaag-en-verdwijnt': { w: ['ib+starter'], k: 'k' },
  'uitzendbureaus-moeten-arbeidsmigranten-helpen-bij-brp-registratie': { w: ['migrant'], k: 'p' },
  'vapes-en-sigaren-krijgen-neutrale-verpakking': { w: ['tabak'], k: 'p' },
  'vergoeding-30-procent-regeling-expats-wordt-27-procent': { w: ['buitenlands'], k: 'k' },
  'verlaging-algemeen-woningtarief-overdrachtsbelasting': { w: ['vastgoed'], k: 'v' },
  'werkgevers-moeten-loonverschillen-tussen-mannen-en-vrouwen-tegengaan': { w: ['staff'], k: 'p' },
  'zelfstandigenaftrek-verder-omlaag-0': { w: ['ib'], k: 'k' },

  /* ---------- later in 2027 ---------- */
  'digitaal-productpaspoort-dpp-voor-batterijen-en-accus-verplicht': { m: ['elektronica+import', 'elektronica+fabrikant'], k: 'p' },
  'apparaten-moeten-voldoen-aan-strengere-eisen-standby-verbruik': { w: ['elektronica+fabrikant', 'elektronica+import'], k: 'p' },
  'horeca-mag-kreeften-en-krabben-niet-meer-levend-koken': { w: ['kreeft'], k: 'p' },
  'wijziging-regels-voor-ondernemende-overheden': { g: true, k: 'v' },
  'uitzendbureaus-moeten-ongevallen-melden-aan-arbeidsinspectie': { w: ['uitlenen', 'inlenen'], k: 'p' },
  'veilige-digitale-producten-verplicht-cra': { w: ['elektronica+fabrikant', 'elektronica+import', 'software'], m: ['elektronica'], k: 'p' },
  'bedrijven-moeten-dwangarbeid-in-keten-tegengaan': { w: ['import', 'export', 'fabrikant'], m: ['producten+online'], k: 'p' },

  /* ---------- 2028 en later ---------- */
  'btw-op-bloemen-en-planten-gaat-omhoog-van-9-naar-21': { w: ['bloemen'], k: 'k' },
  'btw-op-ballonvaarten-gaat-omhoog-naar-21-procent': { w: ['ballon'], k: 'k' },
  'compensatie-voor-transitievergoeding-verdwijnt': { w: ['staff+stoppen'], m: ['staff'], k: 'k' },
  'grote-bedrijven-moeten-rapporteren-over-duurzaamheid': { m: ['staff50'], k: 'r' },
  'doorgeven-loongegevens-via-ikv-wordt-makkelijker': { w: ['staff'], k: 'v' },
  'kleine-brouwerijen-gaan-meer-accijns-betalen': { w: ['brouwerij'], k: 'k' },
  'meer-bedrijven-moeten-milieugegevens-rapporteren': { w: ['prtr'], k: 'p' },
  'motorrijtuigenbelasting-voor-oldtimers-van-na-1988': { w: ['youngtimer'], k: 'k' },
  'nieuwe-aanvraag-ioaz-uitkering-niet-meer-mogelijk': { m: ['ib+stoppen'], k: 'k' },
  'nulurencontracten-niet-meer-toegestaan': { w: ['nuluren'], k: 'p' },
  'taxis-krijgen-nieuw-verplicht-registratiesysteem': { w: ['taxi'], k: 'p' },
  'werkgever-mag-tijdelijk-contract-niet-blijven-verlengen': { w: ['tijdelijk'], k: 'p' },
  'willekeurige-afschrijving-starters-stopt': { w: ['ib+starter'], k: 'k' },
  'vleesbedrijven-mogen-geen-uitzendkrachten-meer-inzetten': { w: ['vlees'], m: ['uitlenen'], k: 'p' },
  'werkgevers-mogen-geen-huur-meer-inhouden-op-minimumloon': { w: ['huisvesting'], k: 'p' },
  'bosbouwvrijstelling-voor-bosbouwbedrijven-afgeschaft': { w: ['bosbouw'], k: 'k' },
  'startersaftrek-bij-arbeidsongeschiktheid-verdwijnt': { m: ['ib+starter'], k: 'k' },
  'e-factuur-verplicht-bij-transactie-tussen-ondernemers': { w: ['b2b'], k: 'p' },

  /* ---------- datum nog niet bekend of in fasen ---------- */
  'bezorgdiensten-moeten-leeftijd-controleren-bij-afleveren-alcohol': { w: ['bezorg', 'alcohol+online'], k: 'p' },
  'bingo-mag-weer-op-plekken-met-alcoholvergunning': { m: ['alcohol+s:horeca', 'alcohol+vorm:sv'], k: 'v' },
  'colportage-krijgt-verplichte-afkoelperiode-van-3-dagen': { w: ['telemarketing'], k: 'p' },
  'eerder-duidelijkheid-over-vervanging-van-zieke-werknemer': { w: ['staff'], k: 'v' },
  'ernstige-misstanden-op-de-werkvloer-worden-strafbaar': { w: ['migrant'], m: ['staff'], k: 'r' },
  'faillissement-voorbereiden-wordt-makkelijker': { m: ['s:zorg'], k: 'r' },
  'gedragscode-wordt-verplicht-op-de-werkvloer': { w: ['staff10'], k: 'p' },
  'gegevens-van-mensen-met-schulden-makkelijker-uitgewisseld': { m: ['staff'], k: 'r' },
  'inkomstenbelasting-omhoog-in-2027-en-2028': { w: ['ib'], k: 'k' },
  'kilometerregistratie-voor-middelgrote-bedrijven-afgeschaft': { w: ['staff100_249'], k: 'v' },
  'kinderopvang-moet-ernstige-incidenten-melden': { w: ['kdv', 'gastouder'], k: 'p' },
  'kinderopvang-moet-overzichten-beroepskrachten-en-presentielijsten-bewaren': { w: ['kdv'], k: 'p' },
  'langer-korting-motorrijtuigenbelasting-autos-zonder-uitstoot': { w: ['ev'], k: 'v' },
  'maatregelen-om-kwaliteit-in-de-bouw-te-verbeteren-voor-bestaande-gebouwen-wkb': { w: ['s:bouw'], m: ['bouwen'], k: 'p' },
  'meerprijs-wegwerpbekers-en-bakjes-verdwijnt': { w: ['togo'], k: 'v' },
  'minder-verkooppunten-tabaksproducten': { w: ['tabak'], k: 'p' },
  'recht-op-reparatie-product-repareren-aantrekkelijker-voor-consumenten': { w: ['fabrikant+elektronica'], m: ['fabrikant'], k: 'p' },
  'nieuwe-regels-beperken-winst-en-salarissen-kinderopvang': { w: ['kdv'], m: ['s:kinderopvang'], k: 'p' },
  'nieuwe-regels-voor-rijinstructeurs-en-rijexamens': { w: ['rijschool'], k: 'p' },
  'wet-zorgplicht-kinderarbeid': { w: ['b2c'], m: ['producten'], k: 'p' },
  'ondernemers-moeten-stagevergoeding-betalen': { w: ['stage'], k: 'k' },
  'opkoper-moet-digitaal-registreren': { w: ['tweedehands'], k: 'p' },
  'ouders-moeten-ontheffing-aanvragen-voor-kindvlogs': { w: ['kindvlog'], k: 'p' },
  'platforms-worden-btw-plichtig-voor-verhuur-en-vervoer': { w: ['kortverhuur'], k: 'r' },
  'invoering-rdw-controleert-waarde-bij-import-autos': { w: ['auto_import'], k: 'r' },
  'regels-concurrentiebeding-aangescherpt': { w: ['staff'], k: 'r' },
  'regels-voor-kennismigranten-veranderen': { w: ['buitenlands'], k: 'r' },
  'rouwverlof-wettelijk-vastgelegd': { w: ['staff'], k: 'p' },
  'sociale-onderneming-krijgt-betere-herkenning-en-erkenning': { w: ['sociaal'], k: 'v' },
  'tarieven-voor-belastingen-op-personenautos-en-motorrijwielen-bpm-omhoog': { w: ['auto_import'], m: ['leaseauto', 'bestel'], k: 'k' },
  'verplicht-bijmengen-biobrandstof-binnenvaart': { w: ['binnenvaart'], k: 'p' },
  'vereenvoudiging-verschil-maatschap-en-vof-gaat-verdwijnen': { w: ['vorm:vof'], k: 'r' },
  'vertrouwenspersoon-verplicht': { w: ['staff10'], k: 'p' },
  'werkgever-kan-asielzoeker-na-3-maanden-inzetten': { w: ['asiel'], m: ['uitlenen'], k: 'v' },
  'werkgevers-moeten-betaling-van-minimumloon-bewijzen': { w: ['staff'], k: 'p' },
  'werknemers-beter-beschermd-bij-faillissement-en-doorstart': { w: ['overname'], k: 'r' },
  'zelfstandigen-verplicht-verzekerd-tegen-arbeidsongeschiktheid': { w: ['ib'], k: 'p' },
};
