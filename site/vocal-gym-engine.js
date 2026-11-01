/* Vocal Gym engine 0.8.5: bundled from src/engine by scripts/build.js. Exposes the global VGEngine. */
var VGEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

  // src/engine/index.js
  var engine_exports = {};
  __export(engine_exports, {
    ALIAS: () => ALIAS,
    CADENCE: () => CADENCE2,
    CELLS: () => CELLS,
    CELL_DEFS: () => CELL_DEFS,
    CHAKRA: () => CHAKRA,
    CHAPU: () => CHAPU,
    DEFJ: () => DEFJ,
    FAM: () => FAM,
    FAMILIAR: () => FAMILIAR,
    FAM_WORDS: () => FAM_WORDS,
    GAMAKA_CONSTANTS: () => constants_exports,
    HEAVY: () => HEAVY,
    INSPIRATION_SCHEMA: () => INSPIRATION_SCHEMA,
    JANYA: () => JANYA,
    JATHI_EXAMPLES: () => JATHI_EXAMPLES,
    JATI: () => JATI,
    JATI_NAME: () => JATI_NAME,
    JATI_WORDS: () => JATI_WORDS,
    KNOWN: () => KNOWN,
    LIB: () => LIB,
    MELA_NAMES: () => MELA_NAMES,
    PDF_ALANKARA: () => PDF_ALANKARA,
    PDF_FAM: () => PDF_FAM,
    PDF_JATI: () => PDF_JATI,
    SEMI: () => SEMI,
    SOLLU: () => SOLLU,
    TEER: () => TEER,
    TICKS: () => TICKS,
    VERSION: () => VERSION,
    alankara: () => alankara,
    alankaraSeries: () => alankaraSeries,
    allRagas: () => allRagas,
    angaStarts: () => angaStarts,
    buildContour: () => buildContour,
    canonicalMotif: () => canonicalMotif,
    chakradarSolutions: () => chakradarSolutions,
    customTala: () => customTala,
    defineRaga: () => defineRaga,
    dial: () => dial,
    eduppuNeighbours: () => eduppuNeighbours,
    enumerateMotifs: () => enumerateMotifs,
    fmtTicks: () => fmtTicks,
    gamakaExpression: () => expression,
    generateMotif: () => generateMotif,
    getProfile: () => getProfile,
    getSource: () => getSource,
    hamming: () => hamming,
    idiomatic: () => idiomatic,
    jathi: () => jathi,
    jathiToScript: () => jathiToScript,
    judgeJathi: () => judgeJathi,
    kalpana: () => kalpana,
    kalpanaRhythm: () => kalpanaRhythm,
    kalpanaRound: () => kalpanaRound,
    kalpanaSession: () => kalpanaSession,
    korvai: () => korvai_exports,
    korvaiFrame: () => korvaiFrame,
    korvaiPlans: () => korvaiPlans,
    makeProjector: () => makeProjector,
    melaLabels: () => melaLabels,
    melakarta: () => melakarta,
    mod12: () => mod12,
    moraSolutions: () => moraSolutions,
    motifFamiliarity: () => motifFamiliarity,
    motifKey: () => motifKey,
    motifKeys: () => motifKeys,
    motifReport: () => motifReport,
    motifScore: () => motifScore,
    motifSlots: () => motifSlots,
    motifSpan: () => motifSpan,
    moveKeys: () => moveKeys,
    moveNovelty: () => moveNovelty,
    moveScore: () => moveScore,
    newMotif: () => newMotif,
    norm: () => norm,
    parseInspiration: () => parseInspiration,
    parseJathiScript: () => parseJathiScript,
    parseRhythmTemplate: () => parseRhythmTemplate,
    parseSwaraLine: () => parseSwaraLine,
    parseSwaras: () => parseSwaras,
    parseTalaSpec: () => parseTalaSpec,
    pdfEntry: () => pdfEntry,
    pdfFamScores: () => pdfFamScores,
    pdfMotif: () => pdfMotif,
    pick: () => pick,
    renderGamaka: () => renderGamaka,
    rhythmPhrases: () => rhythmPhrases,
    rhythmPrompt: () => rhythmPrompt,
    rhythmTemplate: () => rhythmTemplate,
    rng: () => rng,
    sampleMotif: () => sampleMotif,
    setProfiles: () => setProfiles,
    soft: () => soft,
    splitCompound: () => splitCompound,
    syllableOf: () => syllableOf,
    tala: () => tala,
    talaSpec: () => talaSpec,
    tokenizeLine: () => tokenizeLine,
    trikaala: () => trikaala,
    yatiBlocks: () => yatiBlocks
  });

  // src/engine/random.js
  function rng(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pick(items, scoreFn, T, rand) {
    if (!items.length) return null;
    const s = items.map(scoreFn);
    if (T <= 0.05) {
      let b = 0;
      for (let i = 1; i < s.length; i++) if (s[i] > s[b]) b = i;
      return items[b];
    }
    const m = Math.max.apply(null, s);
    const w = s.map((x) => Math.exp((x - m) / T));
    let r = rand() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) {
      r -= w[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  function soft(scores, tau, rand) {
    if (!scores.length) return -1;
    let m = -Infinity;
    for (const x of scores) if (x > m) m = x;
    const w = scores.map((x) => Math.exp((x - m) / Math.max(tau, 1e-3)));
    let r = rand() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) {
      r -= w[i];
      if (r <= 0) return i;
    }
    return w.length - 1;
  }
  function dial(T) {
    const t = Math.max(0, Math.min(2, Number(T) || 0));
    return { T: t, c: t / 2, tau: 0.3 + 0.45 * t };
  }

  // src/engine/ragas.js
  var SEMI = { S: 0, R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, P: 7, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11 };
  var RG = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
  var DN = [[8, 9], [8, 10], [8, 11], [9, 10], [9, 11], [10, 11]];
  var RL = { 1: "R1", 2: "R2", 3: "R3" };
  var GL = { 2: "G1", 3: "G2", 4: "G3" };
  var DL = { 8: "D1", 9: "D2", 10: "D3" };
  var NL = { 9: "N1", 10: "N2", 11: "N3" };
  var CHAKRA = ["Indu", "Netra", "Agni", "Veda", "Bana", "Rutu", "Rishi", "Vasu", "Brahma", "Disi", "Rudra", "Aditya"];
  var MELA_NAMES = ["Kanakangi", "Ratnangi", "Ganamurti", "Vanaspati", "Manavati", "Tanarupi", "Senavati", "Hanumatodi", "Dhenuka", "Natakapriya", "Kokilapriya", "Rupavati", "Gayakapriya", "Vakulabharanam", "Mayamalavagowla", "Chakravakam", "Suryakantam", "Hatakambari", "Jhankaradhwani", "Natabhairavi", "Keeravani", "Kharaharapriya", "Gourimanohari", "Varunapriya", "Mararanjani", "Charukesi", "Sarasangi", "Harikambhoji", "Dheerasankarabharanam", "Naganandini", "Yagapriya", "Ragavardhini", "Gangeyabhushani", "Vagadheeswari", "Shulini", "Chalanata", "Salagam", "Jalarnavam", "Jhalavarali", "Navaneetam", "Pavani", "Raghupriya", "Gavambhodi", "Bhavapriya", "Shubhapantuvarali", "Shadvidamargini", "Suvarnangi", "Divyamani", "Dhavalambari", "Namanarayani", "Kamavardhini", "Ramapriya", "Gamanashrama", "Vishwambari", "Shamalangi", "Shanmukhapriya", "Simhendramadhyamam", "Hemavati", "Dharmavati", "Neetimati", "Kantamani", "Rishabhapriya", "Latangi", "Vachaspati", "Mechakalyani", "Chitrambari", "Sucharitra", "Jyotiswarupini", "Dhatuvardhani", "Nasikabhushani", "Kosalam", "Rasikapriya"];
  function melaLabels(n) {
    const i = (n - 1) % 36, ma = n <= 36 ? 5 : 6;
    const rg = RG[Math.floor(i / 6)], dn = DN[i % 6];
    return ["S", RL[rg[0]], GL[rg[1]], ma === 5 ? "M1" : "M2", "P", DL[dn[0]], NL[dn[1]]];
  }
  function defineRaga(id, name, aroLabels, avLabels, meta) {
    const toPitch = (lab) => lab === "S'" ? 12 : SEMI[lab];
    const aro = aroLabels.map(toPitch), avaro = avLabels.map(toPitch);
    const labels = {};
    aroLabels.concat(avLabels).forEach((l) => {
      if (l !== "S'") labels[SEMI[l]] = l;
    });
    labels[0] = "S";
    const nA = new Set(aro.map((p) => p % 12)).size, nD = new Set(avaro.map((p) => p % 12)).size;
    const cls = (n) => n === 5 ? "audava" : n === 6 ? "shadava" : n === 7 ? "sampurna" : n + "-note";
    return Object.assign({ id, name, aro, avaro, labels, cls: cls(nA) + "\u2013" + cls(nD) }, meta || {});
  }
  function melakarta(n) {
    const L = melaLabels(n);
    return defineRaga(
      "mela" + n,
      MELA_NAMES[n - 1],
      L.concat(["S'"]),
      ["S'"].concat(L.slice().reverse()),
      { mela: n, chakra: CHAKRA[Math.floor((n - 1) / 6)], kind: "melakarta" }
    );
  }
  var sp = (s) => s.trim().split(/\s+/);
  var JANYA = [
    ["mohanam", "Mohanam", 28, "S R2 G3 P D2 S'", "S' D2 P G3 R2 S"],
    ["hamsadhwani", "Hamsadhwani", 29, "S R2 G3 P N3 S'", "S' N3 P G3 R2 S"],
    ["hindolam", "Hindolam", 20, "S G2 M1 D1 N2 S'", "S' N2 D1 M1 G2 S"],
    ["madhyamavati", "Madhyamavati", 22, "S R2 M1 P N2 S'", "S' N2 P M1 R2 S"],
    ["abhogi", "Abhogi", 22, "S R2 G2 M1 D2 S'", "S' D2 M1 G2 R2 S"],
    ["shuddhasaveri", "Shuddha Saveri", 29, "S R2 M1 P D2 S'", "S' D2 P M1 R2 S"],
    ["malahari", "Malahari", 15, "S R1 M1 P D1 S'", "S' D1 P M1 G3 R1 S"],
    ["saveri", "Saveri", 15, "S R1 M1 P D1 S'", "S' N3 D1 P M1 G3 R1 S"],
    ["bilahari", "Bilahari", 29, "S R2 G3 P D2 S'", "S' N3 D2 P M1 G3 R2 S"],
    ["arabhi", "Arabhi", 29, "S R2 M1 P D2 S'", "S' N3 D2 P M1 G3 R2 S"],
    ["kedaragowla", "Kedaragowla", 28, "S R2 M1 P N2 S'", "S' N2 D2 P M1 G3 R2 S"],
    ["abheri", "Abheri", 22, "S G2 M1 P N2 S'", "S' N2 D2 P M1 G2 R2 S"],
    ["sriranjani", "Sriranjani", 22, "S R2 G2 M1 D2 N2 S'", "S' N2 D2 M1 G2 R2 S"],
    ["kambhoji", "Kambhoji", 28, "S R2 G3 M1 P D2 S'", "S' N2 D2 P M1 G3 R2 S"]
  ].map((j) => defineRaga(j[0], j[1], sp(j[3]), sp(j[4]), { parent: j[2], kind: "janya" }));
  function allRagas() {
    const m = [];
    for (let n = 1; n <= 72; n++) m.push(melakarta(n));
    return { melakartas: m, janyas: JANYA };
  }

  // src/engine/talas.js
  var FAM = { dhruva: "LOLL", matya: "LOL", rupaka: "OL", jhampa: "LUO", triputa: "LOO", ata: "LLOO", eka: "L" };
  var DEFJ = { dhruva: 4, matya: 4, rupaka: 4, jhampa: 7, triputa: 3, ata: 5, eka: 4 };
  var JATI = { 3: "Tisra", 4: "Chatusra", 5: "Khanda", 7: "Misra", 9: "Sankeerna" };
  var CHAPU = { 3: [1, 2], 5: [2, 3], 7: [3, 2, 2] };
  function tala(fam, L) {
    if (fam === "chapu") {
      if (!CHAPU[L]) throw new Error("Chapu talas are Tisra (3), Khanda (5) and Misra (7); got " + L + ".");
      const parts = CHAPU[L], total2 = parts.reduce((a, b) => a + b, 0);
      return { fam, L: total2, angas: parts.map((len) => ({ type: "C", len })), total: total2, name: JATI[total2] + " Chapu" };
    }
    if (!FAM[fam]) throw new Error('Unknown tala family "' + fam + '". Use one of ' + Object.keys(FAM).join(", ") + " or chapu.");
    if (!JATI[L]) throw new Error("The jati (laghu length) must be 3, 4, 5, 7 or 9; got " + L + ".");
    const angas = FAM[fam].split("").map((a) => ({ type: a, len: a === "L" ? L : a === "O" ? 2 : 1 }));
    const total = angas.reduce((s, a) => s + a.len, 0);
    let name = JATI[L] + " jati " + fam[0].toUpperCase() + fam.slice(1);
    if (fam === "triputa" && L === 4) name += " (Adi)";
    return { fam, L, angas, total, name };
  }
  function customTala(parts) {
    const total = parts.reduce((a, b) => a + b, 0);
    return { fam: "custom", L: total, angas: parts.map((len) => ({ type: "C", len })), total, name: "Custom " + parts.join("+") };
  }
  function angaStarts(tl) {
    const s = /* @__PURE__ */ new Set([0]);
    let c = 0;
    tl.angas.forEach((a) => {
      c += a.len;
      s.add(c);
    });
    return s;
  }

  // src/engine/projection.js
  var mod12 = (p) => (p % 12 + 12) % 12;
  function makeProjector(raga) {
    const aro = raga.aro, av = raga.avaro, nA = aro.length - 1, nD = av.length - 1;
    const aroPC = new Set(aro.map(mod12)), avPC = new Set(av.map(mod12));
    const unionPC = Array.from(new Set(aro.concat(av).map(mod12))).sort((a, b) => a - b);
    const aroExt = (i) => aro[(i % nA + nA) % nA] + 12 * Math.floor(i / nA);
    const avExt = (i) => av[(i % nD + nD) % nD] - 12 * Math.floor(i / nD);
    const valid = (a, b) => b > a ? aroPC.has(mod12(b)) : b < a ? avPC.has(mod12(b)) : true;
    function candidates(lo, hi) {
      const out = [];
      for (let o = Math.floor(lo / 12) - 1; o <= Math.floor(hi / 12) + 1; o++)
        unionPC.forEach((pc) => {
          const p = pc + 12 * o;
          if (p >= lo - 12 && p <= hi + 12) out.push(p);
        });
      return out.sort((a, b) => a - b);
    }
    function repair(naive) {
      let ok = true;
      for (let i = 1; i < naive.length; i++) if (!valid(naive[i - 1], naive[i])) {
        ok = false;
        break;
      }
      if (ok) return { pitches: naive.slice(), adjusted: naive.map(() => false), feasible: true };
      const C = candidates(Math.min.apply(null, naive), Math.max.apply(null, naive));
      const rank = (p) => C.indexOf(p);
      const sgn = (x) => x > 0 ? 1 : x < 0 ? -1 : 0;
      const n = naive.length, INF = 1e9;
      const cost = Array.from({ length: n }, () => new Array(C.length).fill(INF));
      const back = Array.from({ length: n }, () => new Array(C.length).fill(-1));
      cost[0][rank(naive[0])] = 0;
      const anchor = naive[0], up = naive.some((p) => p > anchor), down = naive.some((p) => p < anchor);
      for (let i = 1; i < n; i++) {
        const want = sgn(naive[i] - naive[i - 1]);
        for (let j2 = 0; j2 < C.length; j2++) {
          if (up && !down && C[j2] < anchor || down && !up && C[j2] > anchor) continue;
          const local = Math.abs(j2 - rank(naive[i]));
          for (let k = 0; k < C.length; k++) {
            if (cost[i - 1][k] >= INF) continue;
            if (!valid(C[k], C[j2])) continue;
            const v = cost[i - 1][k] + local + (sgn(C[j2] - C[k]) !== want ? 1.5 : 0);
            if (v < cost[i][j2]) {
              cost[i][j2] = v;
              back[i][j2] = k;
            }
          }
        }
      }
      let best = -1;
      cost[n - 1].forEach((v, j2) => {
        if (v < INF && (best < 0 || v < cost[n - 1][best])) best = j2;
      });
      if (best < 0) return { pitches: naive.slice(), adjusted: naive.map(() => false), feasible: false };
      const out = new Array(n);
      let j = best;
      for (let i = n - 1; i >= 0; i--) {
        out[i] = C[j];
        j = back[i][j];
      }
      return { pitches: out, adjusted: out.map((p, i) => p !== naive[i]), feasible: true };
    }
    return { aroExt, avExt, nA, nD, repair, valid };
  }

  // src/engine/alankara/sheet.js
  var PDF_ALANKARA = {
    dhruva: {
      4: ["1.1", "S R G M | G R | S R G R | S R G M", "S' N D P | D N | S' N D N | S' N D P"],
      3: ["1.2", "S R G | R S | S R G | R G M", "S' N D | N S' | S' N D | N D P"],
      7: ["1.3", "S R G M P D N | D P | S R G M P D P | S R G M P D N", "S' N D P M G R | G M | S' N D P M G M | S' N D P M G R"],
      5: ["1.4", "S R G M P | M G | S R G M G | S R G M P", "S' N D P M | P D | S' N D P D | S' N D P M"],
      9: ["1.5", "S , R , G M P D N | D P | S , R , G M P D P | S , R , G M P D N", "S' , N , D P M G R | G M | S' , N , D P M G M | S' , N , D P M G R"]
    },
    matya: {
      4: ["2.1", "S R G R | S R | S R G M", "S' N D N | S' N | S' N D P"],
      3: ["2.2", "S R G | S R | S R G", "S' N D | S' N | S' N D"],
      7: ["2.3", "S R G M P D P | M G | S R G M P D N", "S' N D P M G M | P D | S' N D P M G R"],
      5: ["2.4", "S R G M G | S R | S R G M P", "S' N D P D | S' N | S' N D P M"],
      9: ["2.5", "S , R , G , M P M | G R | S , R , G , M P D", "S' , N , D , P M P | D N | S' , N , D , P M G"]
    },
    rupaka: {
      4: ["3.1", "S R | S R G M", "S' N | S' N D P"],
      3: ["3.2", "S R | S R G", "S' N | S' N D"],
      7: ["3.3", "S R | S R G | S R G M", "S' N | S' N D | S' N D P"],
      5: ["3.4", "S R | S R G M P", "S' N | S' N D P M"],
      9: ["3.5", "S R | S R G M P R G M P", "S' N | S' N D P M N D P M"]
    },
    jhampa: {
      4: ["4.1", "S R G R | G | M ,", "S' N D N | D | P ,"],
      3: ["4.2", "S R G | R | G ,", "S' N D | N | D ,"],
      7: ["4.3", "S R G S R S R | G | M ,", "S' N D S' N S' N | D | P ,"],
      5: ["4.4", "S R G S R | G | M ,", "S' N D S' N | D | P ,"],
      9: ["4.5", "S , R , G M S R G | M | P ,", "S' , N , D P S' N D | P | M ,"]
    },
    triputa: {
      4: ["5.1", "S R G R | S R | G M", "S' N D N | S' N | D P"],
      3: ["5.2", "S R G | S R | G M", "S' N D | S' N | D P"],
      7: ["5.3", "S R G M P M G | R G | M P", "S' N D P M P D | N D | P M"],
      5: ["5.4", "S R G M P | R G | M P", "S' N D P M | N D | P M"],
      9: ["5.5", "S R G M P M G R S | R G | M P", "S' N D P M P D N S' | N D | P M"]
    },
    ata: {
      4: ["6.1", "S R G M | S R G M | P , | P ,", "S' N D P | S' N D P | M , | M ,"],
      3: ["6.2", "S R G | S R G | M , | M ,", "S' N D | S' N D | P , | P ,"],
      7: ["6.3", "S R , G , M P | S , R G , M P | D , | D ,", "S' N , D , P M | S' , N D , P M | G , | G ,"],
      5: ["6.4", "S R , G , | S , R G , | M , | M ,", "S' N , D , | S' , N D , | P , | P ,"],
      9: ["6.5", "S R , G , M , P D | S , R G , M , P D | N , | N ,", "S' N , D , P , M G | S' , N D , P , M G | R , | R ,"]
    },
    eka: {
      4: ["7.1", "S R G M", "S' N D P"],
      3: ["7.2", "S R G", "S' N D"],
      7: ["7.3", "S R G M P D N", "S' N D P M G R"],
      5: ["7.4", "S R G M P", "S' N D P M"],
      9: ["7.5", "S R , G M , P D N", "S' N , D P , M G R"]
    }
  };
  var PDF_JATI = { 3: "Tishra", 4: "Chaturashra", 5: "Kha\u1E47\u1E0Da", 7: "Mishra", 9: "Sankeer\u1E47a" };
  var PDF_FAM = { dhruva: "Dhruva", matya: "Ma\u1E6Dhya", rupaka: "Roopaka", jhampa: "Jhampa", triputa: "Tripu\u1E6Da", ata: "A\u1E6Da", eka: "\u0112ka" };
  var DEG = { S: 0, R: 1, G: 2, M: 3, P: 4, D: 5, N: 6 };
  function parseSwaraLine(txt) {
    const notes = [], bars = [];
    let t = 0;
    txt.trim().split(/\s+/).forEach((tok) => {
      if (tok === "|" || tok === "||") {
        bars.push(t);
        return;
      }
      if (tok === ",") {
        notes[notes.length - 1].dur++;
        t++;
        return;
      }
      const d = DEG[tok[0]];
      if (d === void 0) throw new Error("Unknown swara " + tok);
      notes.push({ d: d + (tok[1] === "'" ? 7 : 0), dur: 1 });
      t++;
    });
    return { notes, bars, total: t };
  }
  function pdfEntry(fam, L) {
    const e = PDF_ALANKARA[fam] && PDF_ALANKARA[fam][L];
    if (!e) return null;
    const title = e[0] + " " + PDF_JATI[L] + " J\u0101ti " + PDF_FAM[fam] + (fam === "triputa" && L === 4 ? " (\u0100di)" : "") + " T\u0101\u1E37a";
    return { ref: e[0], asc: e[1], desc: e[2], title };
  }
  function pdfMotif(fam, L) {
    const e = PDF_ALANKARA[fam] && PDF_ALANKARA[fam][L];
    return e ? parseSwaraLine(e[1]).notes : null;
  }
  var canonicalMotif = pdfMotif;

  // src/engine/alankara/motif.js
  function moveKeys(atAnga, delta, nd, dur, t, bounds, prevDelta) {
    const dk = atAnga && nd === 0 && delta < 0 ? "R" : String(Math.max(-3, Math.min(3, delta)));
    const keys = ["m" + (atAnga ? "A" : "I") + dk, dur === 2 ? bounds.has(t + 2) ? "kb" : "km" : "k1"];
    if (prevDelta !== null) keys.push("c" + Math.sign(prevDelta) + Math.sign(delta));
    return keys;
  }
  function motifKeys(motif, tl) {
    const starts = angaStarts(tl), out = [];
    out.push([motif[0].dur === 2 ? starts.has(2) ? "kb" : "km" : "k1"]);
    let t = motif[0].dur, prev = null;
    for (let i = 1; i < motif.length; i++) {
      const delta = motif[i].d - motif[i - 1].d;
      out.push(moveKeys(starts.has(t) && t > 0, delta, motif[i].d, motif[i].dur, t, starts, prev));
      prev = delta;
      t += motif[i].dur;
    }
    return out;
  }
  var FAMILIAR = function() {
    const cnt = {}, tot = {}, V = { mA: 8, mI: 8, k: 3, c: 9 };
    const grp = (k) => k[0] === "m" ? k.slice(0, 2) : k[0];
    Object.keys(PDF_ALANKARA).forEach((f) => Object.keys(PDF_ALANKARA[f]).forEach((L) => {
      motifKeys(pdfMotif(f, +L), tala(f, +L)).forEach((ks) => ks.forEach((k) => {
        cnt[k] = (cnt[k] || 0) + 1;
        tot[grp(k)] = (tot[grp(k)] || 0) + 1;
      }));
    }));
    const lp = (k) => Math.log(((cnt[k] || 0) + 0.5) / ((tot[grp(k)] || 0) + 0.5 * V[grp(k)]));
    return { cnt, tot, lp };
  }();
  function motifFamiliarity(motif, tl) {
    const ks = motifKeys(motif, tl);
    return ks.reduce((s, k) => s + k.reduce((a, x) => a + FAMILIAR.lp(x), 0), 0) / ks.length;
  }
  var PDF_FAM_SCORES = null;
  function pdfFamScores() {
    if (!PDF_FAM_SCORES) {
      PDF_FAM_SCORES = [];
      Object.keys(PDF_ALANKARA).forEach((f) => Object.keys(PDF_ALANKARA[f]).forEach((L) => PDF_FAM_SCORES.push(motifFamiliarity(pdfMotif(f, +L), tala(f, +L)))));
    }
    return PDF_FAM_SCORES;
  }
  function motifReport(motif, tl) {
    const starts = angaStarts(tl), dev = { restarts: 0, runs: 0, turns: 0, leaps: 0, karvais: 0, repeats: 0 };
    let t = motif[0].dur, prev = null, run = 1;
    if (motif[0].dur > 1) dev.karvais++;
    for (let i = 1; i < motif.length; i++) {
      const d = motif[i].d - motif[i - 1].d, atA = starts.has(t) && t > 0;
      if (atA && motif[i].d === 0 && d < 0) dev.restarts++;
      else if (Math.abs(d) >= 2) dev.leaps++;
      if (d === 0) dev.repeats++;
      if (prev !== null && d !== 0 && prev !== 0 && Math.sign(d) !== Math.sign(prev) && !(atA && motif[i].d === 0)) dev.turns++;
      if (Math.abs(d) === 1 && d === prev) run++;
      else {
        if (run >= 3) dev.runs++;
        run = Math.abs(d) === 1 ? 2 : 1;
      }
      if (motif[i].dur > 1) dev.karvais++;
      prev = d;
      t += motif[i].dur;
    }
    if (run >= 3) dev.runs++;
    const f = motifFamiliarity(motif, tl), ref = pdfFamScores();
    return { familiarity: f, conventionality: ref.filter((x) => x <= f).length / ref.length, devices: dev };
  }
  function moveNovelty(atA, delta, nd, dur, t, starts, prev) {
    let N = 0;
    const restart = atA && nd === 0 && delta < 0;
    if (!restart) {
      if (Math.abs(delta) === 2) N += 1;
      else if (Math.abs(delta) === 3) N += 1.4;
      else if (delta === -1) N += 0.4;
    }
    if (prev !== null && prev !== 0 && delta !== 0 && Math.sign(delta) !== Math.sign(prev) && !restart) N += 0.8;
    if (atA && !restart) N += 0.8;
    if (dur === 2 && !starts.has(t + 2)) N += 0.6;
    if (delta === 0) N -= 1;
    return N;
  }
  function moveScore(c, atA, delta, nd, dur, t, starts, prev) {
    const ks = moveKeys(atA, delta, nd, dur, t, starts, prev);
    const F = 0.6 * ks.reduce((a, k) => a + Math.max(-4, FAMILIAR.lp(k)), 0);
    const N = moveNovelty(atA, delta, nd, dur, t, starts, prev);
    let sc = (1 - c) * F + c * N;
    if (delta === 0 && prev === 0) sc -= 3;
    return sc;
  }
  function sampleMotif(tl, span, c, tau, seed) {
    const rand = rng(seed), total = tl.total, top = span - 1;
    if (span < 2 || total < 2) return null;
    const starts = angaStarts(tl);
    const crosses = (t2, dur) => dur === 2 && starts.has(t2 + 1) && t2 + 1 < total;
    const moves = (t2, d2) => {
      const out = [];
      for (let nd = 0; nd <= top; nd++) {
        const delta = nd - d2, restart = starts.has(t2) && t2 > 0 && nd === 0;
        if (Math.abs(delta) > 3 && !restart) continue;
        for (const dur of [1, 2]) {
          if (t2 + dur > total || crosses(t2, dur)) continue;
          out.push({ nd, dur, delta });
        }
      }
      return out;
    };
    const NEG = -Infinity, pi = (p) => p === null ? 0 : p + 2;
    const V = Array.from({ length: total + 1 }, () => Array.from({ length: span }, () => new Float64Array(4).fill(NEG)));
    for (let k = 0; k < 4; k++) V[total][top][k] = 0;
    const lse = (arr) => {
      let m = NEG;
      for (const x of arr) if (x > m) m = x;
      if (m === NEG) return NEG;
      let s = 0;
      for (const x of arr) s += Math.exp(x - m);
      return m + Math.log(s);
    };
    const opts = (t2, d2, prev2) => moves(t2, d2).map((m) => ({ m, w: moveScore(c, starts.has(t2) && t2 > 0, m.delta, m.nd, m.dur, t2, starts, prev2) / tau + V[t2 + m.dur][m.nd][pi(Math.sign(m.delta))] })).filter((o) => o.w > NEG);
    for (let t2 = total - 1; t2 >= 1; t2--) for (let d2 = 0; d2 <= top; d2++) for (let k = 0; k < 4; k++) {
      const prev2 = k === 0 ? null : k - 2;
      V[t2][d2][k] = lse(opts(t2, d2, prev2).map((o) => o.w));
    }
    const firsts = [1, 2].filter((dur) => dur <= total && !crosses(0, dur)).map((dur) => {
      const F = FAMILIAR.lp(dur === 2 ? starts.has(2) ? "kb" : "km" : "k1");
      return { dur, w: ((1 - c) * 0.6 * Math.max(-4, F) + c * (dur === 2 ? 0.3 : 0)) / tau + V[dur][0][0] };
    }).filter((o) => o.w > NEG);
    if (!firsts.length) return null;
    const draw = (list) => {
      const m = Math.max.apply(null, list.map((o) => o.w));
      return list[soft(list.map((o) => o.w - m), 1, rand)];
    };
    const first = draw(firsts).dur;
    const notes = [{ d: 0, dur: first }];
    let t = first, d = 0, prev = null;
    while (t < total) {
      const m = draw(opts(t, d, prev)).m;
      notes.push({ d: m.nd, dur: m.dur });
      prev = Math.sign(m.delta);
      t += m.dur;
      d = m.nd;
    }
    return notes;
  }
  function generateMotif(tl, span, T, seed) {
    const D = dial(T);
    return sampleMotif(tl, span, D.c, D.tau, seed);
  }
  var motifSlots = (m) => {
    const s = [];
    m.forEach((n) => {
      s.push(n.d);
      for (let i = 1; i < n.dur; i++) s.push("k");
    });
    return s;
  };
  var hamming = (a, b) => {
    const n = Math.max(a.length, b.length);
    let d = 0;
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) d++;
    return d;
  };
  var motifKey = (m) => m.map((n) => n.d + (n.dur > 1 ? ":" + n.dur : "")).join(" ");
  function motifSpan(m) {
    return Math.max.apply(null, m.map((n) => n.d)) + 1;
  }
  function enumerateMotifs(tl, span, limit) {
    const total = tl.total, top = span - 1, starts = angaStarts(tl), out = [];
    if (span < 2 || total < 2) return { motifs: out, complete: true };
    const crosses = (t, dur) => dur === 2 && starts.has(t + 1) && t + 1 < total;
    const moves = (t, d) => {
      const res = [];
      for (let nd = 0; nd <= top; nd++) {
        const delta = nd - d, restart = starts.has(t) && t > 0 && nd === 0;
        if (Math.abs(delta) > 3 && !restart) continue;
        for (const dur of [1, 2]) {
          if (t + dur > total || crosses(t, dur)) continue;
          res.push({ nd, dur });
        }
      }
      return res;
    };
    const reach2 = Array.from({ length: total + 1 }, () => new Uint8Array(span));
    reach2[total][top] = 1;
    for (let t = total - 1; t >= 1; t--) for (let d = 0; d <= top; d++) reach2[t][d] = moves(t, d).some((m) => reach2[t + m.dur][m.nd]) ? 1 : 0;
    let complete = true;
    const cur = [];
    (function dfs(t, d) {
      if (out.length >= limit) {
        complete = false;
        return;
      }
      if (t === total) {
        out.push(cur.map((n) => Object.assign({}, n)));
        return;
      }
      for (const m of moves(t, d)) if ((t > 0 || m.nd === 0) && reach2[t + m.dur][m.nd]) {
        cur.push({ d: m.nd, dur: m.dur });
        dfs(t + m.dur, m.nd);
        cur.pop();
        if (!complete) return;
      }
    })(0, 0);
    return { motifs: out, complete };
  }
  function motifScore(motif, tl, c) {
    const starts = angaStarts(tl);
    const F0 = FAMILIAR.lp(motif[0].dur === 2 ? starts.has(2) ? "kb" : "km" : "k1");
    let sc = (1 - c) * 0.6 * Math.max(-4, F0) + c * (motif[0].dur === 2 ? 0.3 : 0), t = motif[0].dur, prev = null;
    for (let i = 1; i < motif.length; i++) {
      const delta = motif[i].d - motif[i - 1].d;
      sc += moveScore(c, starts.has(t) && t > 0, delta, motif[i].d, motif[i].dur, t, starts, prev);
      prev = Math.sign(delta);
      t += motif[i].dur;
    }
    return sc;
  }
  function newMotif(tl, opts) {
    const o = opts || {}, D = dial(o.T), total = tl.total;
    const sheet = PDF_ALANKARA[tl.fam] && PDF_ALANKARA[tl.fam][tl.L] ? pdfMotif(tl.fam, tl.L) : null;
    const span = o.span || (sheet ? motifSpan(sheet) : 4);
    const avoid = (o.avoid || []).map(motifSlots);
    const minDiff = o.minDiff || (total <= 5 ? 1 : Math.max(2, Math.round(total * 0.25)));
    const distance = (m) => avoid.length ? Math.min.apply(null, avoid.map((v) => hamming(motifSlots(m), v))) : total;
    let best = null;
    for (let a = 0; a < 160; a++) {
      const widen = a < 40 ? 1 : 1 + (a - 39) * 0.05;
      const m = sampleMotif(tl, span, D.c, D.tau * widen, (o.seed || 1) * 7919 + a * 104729 >>> 0);
      if (!m) return null;
      const diff = distance(m);
      if (diff >= minDiff) return { motif: m, diff, minDiff, span, attempts: a + 1, widened: a >= 40, relaxed: false };
      if (diff > 0 && (!best || diff > best.diff)) best = { motif: m, diff, minDiff, span, attempts: a + 1, widened: true, relaxed: true };
    }
    const all = enumerateMotifs(tl, span, 2e4).motifs.map((m) => ({ m, diff: distance(m) })).filter((x) => x.diff > 0);
    const strict = all.filter((x) => x.diff >= minDiff), pool = strict.length ? strict : all;
    if (!pool.length) return best;
    const rand = rng((o.seed || 1) * 31337 >>> 0);
    const ch = pool[soft(pool.map((x) => motifScore(x.m, tl, D.c)), D.tau * 3, rand)];
    if (!strict.length && best && best.diff >= ch.diff) return best;
    return { motif: ch.m, diff: ch.diff, minDiff, span, attempts: 160, widened: true, relaxed: !strict.length, enumerated: true };
  }
  function alankaraSeries(fam, L, count, opts) {
    const o = opts || {}, tl = tala(fam, L), out = [{ motif: pdfMotif(fam, L), source: "pdf" }];
    for (let k = 1; k <= count; k++) {
      const r = newMotif(tl, { T: o.T, seed: (o.seed || 1) + k * 31, span: o.span || motifSpan(out[0].motif), avoid: out.map((x) => x.motif) });
      if (!r) break;
      out.push(Object.assign({ source: "generated" }, r));
    }
    return out;
  }

  // src/engine/alankara/lines.js
  function alankara(raga, tl, motif) {
    const P = makeProjector(raga);
    const span = motifSpan(motif);
    const lines = [];
    const kA = Math.max(0, P.nA - span + 1), kD = Math.max(0, P.nD - span + 1);
    for (let k = 0; k <= kA; k++) lines.push({ dir: "asc", k, naive: motif.map((m) => P.aroExt(k + m.d)) });
    for (let k = 0; k <= kD; k++) lines.push({ dir: "desc", k, naive: motif.map((m) => P.avExt(k + m.d)) });
    let adjustedCount = 0, infeasible = 0;
    lines.forEach((l) => {
      const r = P.repair(l.naive);
      l.notes = motif.map((m, i) => ({ p: r.pitches[i], dur: m.dur, adjusted: r.adjusted[i] }));
      adjustedCount += r.adjusted.filter(Boolean).length;
      if (!r.feasible) infeasible++;
    });
    return { lines, span, adjustedCount, infeasible, slotsPerLine: motif.reduce((s, m) => s + m.dur, 0) };
  }

  // src/engine/data/profiles.generated.js
  var profiles_generated_default = {
    "abheri": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "10": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S188", "basis": "text", "spec": 0 }] }, "sources": ["S188", "S193"] },
      phrases: [
        { "id": "abheri#0", "pitches": [5, 7, 12, 10, 10, 10, 9, 9, 7, 7, 5, 5, 3], "durs": [2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.4, "octaveCertain": false, "source": "S183" },
        { "id": "abheri#1", "pitches": [7, 5, 7, 5, 7, 12, 10, 10, 9, 9, 7, 7, 5, 7, 5, 3, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 3, 1, 2, 1, 1], "type": "ending", "weight": 0.4, "octaveCertain": false, "source": "S183" },
        { "id": "abheri#2", "pitches": [-2, 0, 3, 5, 7, 3, 5, 7, 10, 12, 10, 9, 7, 7], "durs": [1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.4, "octaveCertain": false, "source": "S183" },
        { "id": "abheri#4", "pitches": [10, 9, 12, 10, 10, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.4, "octaveCertain": false, "source": "S183" }
      ],
      exceptions: [
        { "id": "abheri#3", "pitches": [5, 3, 3, 2, 0, 2, 0], "durs": [1, 1, 1, 1, 1, 2, 1], "type": "ending", "weight": 0.4, "octaveCertain": false, "source": "S183", "anya": [] }
      ],
      avoid: [
        { "pitches": [7, 9, 10, 9, 7, 5], "strength": "soft" },
        { "pitches": [0, 2, 3], "strength": "soft" },
        { "pitches": [2, 3, 5, 3], "strength": "soft" },
        { "pitches": [3, 2, 3], "strength": "soft" },
        { "pitches": [0, 2, 3, 5], "strength": "soft" },
        { "pitches": [9, 10, 12], "strength": "soft" },
        { "pitches": [7, 10, 9, 10, 9, 7], "strength": "soft" },
        { "pitches": [10, 9, 10, 9, 7], "strength": "soft" }
      ]
    },
    "abhogi": {
      landing: [0, 2, 3],
      avoidLanding: [],
      nyasa: [],
      jiva: [3],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "3": [{ "when": { "dir": "up" }, "onset": "nokku", "body": "kampita", "exit": "none", "lo": 0, "hi": 2, "from": 2, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S152", "basis": "text", "spec": 1 }] }, "sources": ["S152", "S193"] },
      phrases: [
        { "id": "abhogi#0", "pitches": [3, 5, 2, 0], "durs": [1, 1, 1, 1], "type": "signature", "weight": 0.7, "octaveCertain": true, "source": "S152" },
        { "id": "abhogi#1", "pitches": [5, 9, 12, 9, 5, 9, 5, 3, 2, 3, 5, 3, 2, 0], "durs": [1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#2", "pitches": [9, 5, 9, 12, 12, 9, 12, 9, 5, 3, 5, 3, 2, 0], "durs": [1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#3", "pitches": [2, 3, 5, 9, 12, 14, 15, 14, 12, 9, 5, 3, 2, 0, 2, 3], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#4", "pitches": [9, 12, 9, 5, 3, 2, 3, 5, 9, 5, 3, 2, 3, 0, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#5", "pitches": [2, 3, 5, 3, 5, 9, 5, 9, 12, 14, 15, 12, 14, 15], "durs": [1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#6", "pitches": [17, 15, 14, 15, 14, 12, 9, 14, 12, 9, 5, 3, 2, 0], "durs": [1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#7", "pitches": [5, 9, 5, 9, 9, 12, 9, 5, 9, 9, 12], "durs": [2, 1, 1, 4, 1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#8", "pitches": [9, 5, 3, 2, 0, 2, 3], "durs": [2, 4, 2, 2, 3, 2, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S179" },
        { "id": "abhogi#9", "pitches": [9, 0, 2, 3, 5, 9, 12, 9, 5, 3, 2, 0, 2, 3], "durs": [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S179" },
        { "id": "abhogi#10", "pitches": [2, 3, 3, 2, 0, 0, 2, 0, 0, 9, 5, 9], "durs": [2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S179" }
      ],
      exceptions: [],
      avoid: []
    },
    "arabhi": {
      landing: [0, 2, 7],
      avoidLanding: [4, 11],
      nyasa: [2, 7],
      jiva: [],
      alpa: [4, 11],
      notNyasa: [],
      janta: "suits",
      dattu: "unknown",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "2": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S158", "basis": "text", "spec": 0 }], "4": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 1, "end": "hi", "cycles": [1, 1], "dwell": "hi", "depth": 1, "src": "S158", "basis": "text", "spec": 0 }], "11": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 1, "end": "hi", "cycles": [1, 1], "dwell": "hi", "depth": 1, "src": "S158", "basis": "text", "spec": 0 }] }, "sources": ["S158", "S193"] },
      phrases: [
        { "id": "arabhi#0", "pitches": [7, 5, 4, 2, 0, 2, 5, 4, 2], "durs": [2, 2, 1, 1, 1, 1, 2, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#1", "pitches": [2, 5, 7, 9], "durs": [1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#2", "pitches": [9, 14, 12, 11, 9], "durs": [1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#3", "pitches": [9, 7, 5, 7, 9, 12, 11, 9], "durs": [1, 1, 1, 1, 1, 2, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#4", "pitches": [9, 14, 12, 14], "durs": [1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#5", "pitches": [12, 14, 17, 16, 14], "durs": [1, 1, 2, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#6", "pitches": [17, 16, 14, 14, 12, 11, 9, 9, 7, 7, 5, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#7", "pitches": [2, 2, 5, 5, 9, 9, 14, 12, 11, 9, 7, 5, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#8", "pitches": [2, 2, 0, -1, -3], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S171" },
        { "id": "arabhi#9", "pitches": [2, -3, 0], "durs": [1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S171" }
      ],
      exceptions: [],
      avoid: [
        { "pitches": [7, 5, 9, 12], "strength": "hard" }
      ]
    },
    "bilahari": {
      landing: [0, 2, 7, 9],
      avoidLanding: [],
      nyasa: [2, 7, 9],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "low",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "bilahari#0", "pitches": [4, 7, 9, 12], "durs": [1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S169" },
        { "id": "bilahari#1", "pitches": [12, 11, 14, 12, 12, 11, 11, 9, 9], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S169" },
        { "id": "bilahari#3", "pitches": [0, 2, 4, 7, 5, 4, 2, 0, -1, -3], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S169" }
      ],
      exceptions: [
        { "id": "bilahari#2", "pitches": [7, 9, 10, 7, 9, 7, 5, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S169", "anya": ["N2"] }
      ],
      avoid: []
    },
    "hamsadhwani": {
      landing: [0, 2, 4, 7, 11],
      avoidLanding: [],
      nyasa: [0, 2, 4, 7, 11],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "hamsadhwani#0", "pitches": [4, 2, 4], "durs": [1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#1", "pitches": [4, 2, -1, -5], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#2", "pitches": [-1, 0, 2, 4, 7, 4, 2], "durs": [1, 1, 1, 1, 1, 2, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#3", "pitches": [0, -1, 4, 2, 2, 0, 0], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#4", "pitches": [-1, 2, 4, 7, 11, 14], "durs": [1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#5", "pitches": [7, 11, 14, 16, 14, 11, 7], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#6", "pitches": [4, 7, 16, 16, 14, 14], "durs": [1, 1, 1, 1, 1, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#7", "pitches": [11, 16, 14, 11, 14, 11, 7, 11, 7, 4], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#8", "pitches": [4, 7, 11, 12, 14, 16, 14, 12, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#9", "pitches": [12, 11, 14, 12, 12, 11, 11], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#10", "pitches": [7, 12, 11, 7, 11, 4], "durs": [1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#11", "pitches": [4, 2, 7, 4, 11, 7, 12, 11, 16, 14, 11, 7, 4], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#12", "pitches": [4, 11, 7, 4, 2], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S166" },
        { "id": "hamsadhwani#13", "pitches": [4, 2, 4, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#14", "pitches": [4, 7, 11, 7, 4, 2], "durs": [1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#15", "pitches": [4, 2, 0, -1, -5], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#16", "pitches": [-5, -1, 0, 2, 4, 2], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#17", "pitches": [4, 2, 4, 7, 11], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#18", "pitches": [11, 7, 4, 7, 11, 12], "durs": [1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#19", "pitches": [7, 11, 12, 14, 16, 14], "durs": [1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#20", "pitches": [4, 7, 4, 2], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#21", "pitches": [4, 2, 0], "durs": [1, 1, 2], "type": "ending", "weight": 0.48, "octaveCertain": false, "source": "S176" },
        { "id": "hamsadhwani#22", "pitches": [4, 2, 0, -1, 0, 2, 4, 2, 2, 0, -1, 0, 2, 0, 0, -1, -5, -1, 0, 2, 7, 11, 0, 2], "durs": [2, 2, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1], "type": "janta", "weight": 0.48, "octaveCertain": false, "source": "S176" }
      ],
      exceptions: [],
      avoid: []
    },
    "hindolam": {
      landing: [0, 3, 5, 8, 10],
      avoidLanding: [],
      nyasa: [0, 3, 5, 8, 10],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "hindolam#0", "pitches": [5, 3, 0], "durs": [1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#1", "pitches": [-2, 0, 3, 5, 3, 0, -4], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#2", "pitches": [-4, -2, 0, 5], "durs": [1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#3", "pitches": [3, 5, 8], "durs": [1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#4", "pitches": [8, 3, 5, 8, 10, 12], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#5", "pitches": [8, 10, 15, 12, 8], "durs": [1, 1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#6", "pitches": [8, 10, 12, 17, 15], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#8", "pitches": [10, 12, 15, 17, 15, 12, 10], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#9", "pitches": [8, 10, 15, 15, 12, 10, 8], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#10", "pitches": [5, 8, 12, 10], "durs": [1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#11", "pitches": [3, 5, 10, 8], "durs": [1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#12", "pitches": [0, 3, 8, 5, 3], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#13", "pitches": [3, 12, 8, 5, 3], "durs": [2, 2, 2, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S163" },
        { "id": "hindolam#14", "pitches": [3, 5, 3, 0, -4], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S163" },
        { "id": "hindolam#15", "pitches": [-2, 3, 0], "durs": [1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S163" }
      ],
      exceptions: [],
      avoid: []
    },
    "kambhoji": {
      landing: [0, 4, 5, 7, 9],
      avoidLanding: [],
      nyasa: [4, 5, 7, 9],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "medium", "basis": "text", "maxChain": 4, "rules": { "2": [{ "when": { "dir": "up", "prev": { "pc": 0, "rel": null } }, "onset": "nokku", "body": "plain", "exit": "none", "from": 2, "end": "self", "depth": 1, "src": "S203", "basis": "text", "spec": 2 }], "5": [{ "when": { "dir": "up" }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "hi", "cycles": [1, 2], "depth": 1, "src": "S203", "basis": "text", "spec": 1 }, { "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "lo", "cycles": [1, 2], "depth": 1, "src": "S203", "basis": "text", "spec": 0 }], "9": [{ "when": { "prev": { "pc": 7, "rel": null } }, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 3, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S75", "basis": "text", "spec": 1 }, { "when": { "next": { "pc": 0, "rel": "up" } }, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 3, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S75", "basis": "text", "spec": 1 }], "10": [{ "when": {}, "onset": "jaru", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S185", "basis": "text", "spec": 0 }] }, "sources": ["S75", "S185", "S193", "S203"] },
      phrases: [
        { "id": "kambhoji#0", "pitches": [9, 12, 10, 9], "durs": [1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S168" },
        { "id": "kambhoji#1", "pitches": [10, 9, 7], "durs": [1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S168" },
        { "id": "kambhoji#2", "pitches": [5, 4, 7, 9, 12], "durs": [1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S168" },
        { "id": "kambhoji#3", "pitches": [12, 10, 10, 9, 7, 9], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S168" },
        { "id": "kambhoji#4", "pitches": [9, 12, 14], "durs": [1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S168" },
        { "id": "kambhoji#5", "pitches": [9, 12, 14, 16, 14, 12, 10, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S168" },
        { "id": "kambhoji#7", "pitches": [4, 7, 9, 12], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S185" },
        { "id": "kambhoji#8", "pitches": [0, 2, 5, 4, 7, 9, 12], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S185" },
        { "id": "kambhoji#9", "pitches": [2, 5, 4, 5, 7], "durs": [1, 1, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S185" },
        { "id": "kambhoji#10", "pitches": [4, 2, 4, 0], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S185" },
        { "id": "kambhoji#11", "pitches": [2, 7, 5, 4, 0], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S185" }
      ],
      exceptions: [
        { "id": "kambhoji#6", "pitches": [0, -1, -5, -3, 0], "durs": [1, 1, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S168", "anya": ["N3"] },
        { "id": "kambhoji#12", "pitches": [12, 11, 7], "durs": [1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S185", "anya": ["N3"] }
      ],
      avoid: [
        { "pitches": [0, 2, 4, 5, 7], "strength": "soft" }
      ]
    },
    "kedaragowla": {
      landing: [0, 2, 7],
      avoidLanding: [4, 9],
      nyasa: [2, 7],
      jiva: [],
      alpa: [4, 9],
      notNyasa: [4, 9],
      janta: "neutral",
      dattu: "unknown",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "4": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 1, "end": "hi", "cycles": [1, 1], "dwell": "hi", "depth": 1, "src": "S186", "basis": "text", "spec": 0 }], "9": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 1, "end": "hi", "cycles": [1, 1], "dwell": "hi", "depth": 1, "src": "S186", "basis": "text", "spec": 0 }] }, "sources": ["S186", "S193"] },
      phrases: [
        { "id": "kedaragowla#0", "pitches": [2, 5, 7], "durs": [1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#1", "pitches": [7, 10, 9, 7, 5, 4, 2, 2], "durs": [1, 1, 1, 1, 1, 1, 2, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#2", "pitches": [2, 7, 5, 4, 2], "durs": [1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#3", "pitches": [2, 5, 4, 2, 0], "durs": [1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#4", "pitches": [5, 7, 12, 10, 12], "durs": [1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#5", "pitches": [12, 10, 9, 7, 10, 12, 14, 14], "durs": [1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#6", "pitches": [9, 7, 5, 4, 2, 2], "durs": [1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#7", "pitches": [2, 0, -2, -3, -5, -2], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S172" },
        { "id": "kedaragowla#8", "pitches": [0, -2, 0], "durs": [1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S172" }
      ],
      exceptions: [],
      avoid: [
        { "pitches": [7, 10, 9, 10, 12], "strength": "soft" },
        { "pitches": [5, 4, 2, 4, 2, 0], "strength": "hard" },
        { "pitches": [5, 4, 5, 7, 2], "strength": "soft" },
        { "pitches": [12, 10, 9, 10, 12], "strength": "soft" }
      ]
    },
    "madhyamavati": {
      landing: [0, 2, 5, 7],
      avoidLanding: [],
      nyasa: [0, 2, 5, 7],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "suits",
      dattu: "suits",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "madhyamavati#0", "pitches": [2, 2], "durs": [1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#1", "pitches": [2, 7, 5, 2, 0], "durs": [1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#2", "pitches": [-2, 0, 2, 5, 2, 0, -2, -5, -2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#3", "pitches": [-5, 2, 0, 2], "durs": [1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#4", "pitches": [2, 5, 7, 5, 2, 0], "durs": [1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#5", "pitches": [2, 10, 7], "durs": [1, 2, 2], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S164" },
        { "id": "madhyamavati#6", "pitches": [7, 12, 10], "durs": [1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#7", "pitches": [5, 7, 10, 12, 10, 7], "durs": [1, 1, 1, 2, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#8", "pitches": [7, 10, 12, 14, 17, 14], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#9", "pitches": [10, 14, 17, 14, 12, 10, 7], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#10", "pitches": [5, 7, 10, 12, 10], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#11", "pitches": [7, 10, 12, 10, 7], "durs": [1, 1, 2, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#12", "pitches": [5, 7, 10, 7, 10, 7, 5, 2], "durs": [2, 1, 1, 3, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#13", "pitches": [2, 2, 5, 5, 10], "durs": [1, 1, 1, 1, 1], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#14", "pitches": [5, 5, 10, 10, 14], "durs": [1, 1, 1, 1, 1], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#15", "pitches": [10, 10, 14, 14, 17], "durs": [1, 1, 1, 1, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#16", "pitches": [14, 17, 14, 10, 14, 10, 5, 10, 5, 2, 5, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#17", "pitches": [-2, 0, 2, 7, 5, 2, 0], "durs": [1, 1, 1, 1, 1, 3, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" },
        { "id": "madhyamavati#18", "pitches": [-2, -5, -2, 0], "durs": [1, 1, 2, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S164" }
      ],
      exceptions: [],
      avoid: []
    },
    "malahari": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "suits",
      dattu: "unknown",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "5": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S184", "basis": "text", "spec": 0 }], "8": [{ "when": { "janta": true }, "onset": "sphurita", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S184", "basis": "text", "spec": 1 }] }, "sources": ["S184", "S193"] },
      phrases: [
        { "id": "malahari#0", "pitches": [8, 7, 5, 4, 1, 0], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S181" },
        { "id": "malahari#1", "pitches": [1, 5, 7, 8, 5, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S181" },
        { "id": "malahari#2", "pitches": [8, 13, 13, 12, 8, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S181" },
        { "id": "malahari#3", "pitches": [0, 1, 1, 8, 7, 5, 4, 1, 0], "durs": [2, 2, 2, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S181" },
        { "id": "malahari#4", "pitches": [0, 1, 5, 4, 1], "durs": [1, 1, 2, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S181" },
        { "id": "malahari#6", "pitches": [5, 7, 8, 12, 12, 13, 13, 12, 8, 7, 5, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S182" },
        { "id": "malahari#7", "pitches": [0, 1, 5, 4, 1], "durs": [2, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S182" },
        { "id": "malahari#8", "pitches": [8, 8, 7, 5, 7, 8, 12, 8, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": false, "source": "S184" },
        { "id": "malahari#9", "pitches": [5, 7, 8, 8, 7, 5, 4, 1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": true, "source": "S184" },
        { "id": "malahari#10", "pitches": [8, 7, 5, 7, 8, 8, 7], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": true, "source": "S184" },
        { "id": "malahari#11", "pitches": [12, 8, 8, 12], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": false, "source": "S184" },
        { "id": "malahari#12", "pitches": [0, 1, 5, 4, 1], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.3, "octaveCertain": true, "source": "S184" },
        { "id": "malahari#13", "pitches": [5, 8, 7], "durs": [1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": true, "source": "S184" },
        { "id": "malahari#14", "pitches": [7, 8, 5, 7, 5, 4, 1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": true, "source": "S184" },
        { "id": "malahari#17", "pitches": [7, 5, 4, 1, 0], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S184" }
      ],
      exceptions: [
        { "id": "malahari#5", "pitches": [0, 1, 4, 1, 0], "durs": [1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S181", "anya": [] },
        { "id": "malahari#15", "pitches": [0, 1, 4, 5, 1], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.3, "octaveCertain": true, "source": "S184", "anya": [] },
        { "id": "malahari#16", "pitches": [0, 1, 5, 4, 1, 0, 1, 4, 1, 0], "durs": [1, 1, 2, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.3, "octaveCertain": true, "source": "S184", "anya": [] }
      ],
      avoid: [
        { "pitches": [7, 4, 1, 0], "strength": "soft" },
        { "pitches": [5, 4, 5], "strength": "soft" },
        { "pitches": [8, 5, 7], "strength": "soft" }
      ]
    },
    "mela1": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela10": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela11": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela12": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "medium", "basis": "text", "maxChain": 4, "rules": { "3": [{ "when": { "minSec": 0.35 }, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 1, "src": "S35", "basis": "text-vague", "spec": 1 }], "10": [{ "when": {}, "onset": "nokku", "body": "plain", "exit": "none", "from": 1, "end": "self", "depth": 1, "src": "S35", "basis": "text", "spec": 0 }] }, "sources": ["S35", "S193"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela13": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela14": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela15": {
      landing: [0, 5, 7],
      avoidLanding: [1, 8],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "heavy", "basis": "text", "maxChain": 4, "rules": { "0": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S40", "basis": "text", "spec": 0 }], "1": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 2], "dwell": "lo", "depth": 1, "src": "S40", "basis": "text", "spec": 0 }], "4": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 1, "end": "hi", "cycles": [1, 2], "dwell": "hi", "depth": 1, "src": "S40", "basis": "text", "spec": 0 }], "5": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S40", "basis": "text", "spec": 0 }], "7": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S40", "basis": "text", "spec": 0 }], "8": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S40", "basis": "text", "spec": 0 }], "11": [{ "when": { "dir": "up", "next": { "pc": 0, "rel": "up" } }, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S40", "basis": "text", "spec": 2 }] }, "sources": ["S40", "S193"] },
      phrases: [
        { "id": "mela15#0", "pitches": [5, 4, 5, 4, 5, 4], "durs": [2, 1, 2, 1, 2, 1], "type": "signature", "weight": 0.7, "octaveCertain": true, "source": "S40" },
        { "id": "mela15#1", "pitches": [0, 1, 1, 4, 5, 7], "durs": [2, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#2", "pitches": [7, 7, 5, 4, 5, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#3", "pitches": [7, 8, 7, 7, 5, 5, 4, 5, 4, 5, 7, 4, 5, 4, 1, 0, -1], "durs": [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#4", "pitches": [11, 8, 7, 7, 5, 5, 4, 5, 8, 7, 5, 4, 5, 4, 1, 0, -1], "durs": [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#5", "pitches": [0, 1, 8, 7, 5, 4, 5], "durs": [2, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#6", "pitches": [4, 5, 7, 8, 7, 5, 7, 5, 4, 5, 4, 1, 0, -1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#7", "pitches": [7, 8, 5, 7, 4, 5, 7, 8, 11, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#8", "pitches": [12, 11, 16, 13, 12, 11, 8, 7, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#9", "pitches": [4, 5, 7, 7, 5, 7, 8, 7, 8, 7, 8, 11, 8, 11, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#10", "pitches": [12, 12, 11, 16, 13, 12, 11, 12, 8, 11, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#11", "pitches": [12, 12, 11, 8, 7, 5, 5, 4, 5, 8, 7, 5, 4, 5, 4, 1, 0, -1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#12", "pitches": [7, 5, 5, 4, 1, 0, -1, 0, 1, 5, 4, 1, 4, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#13", "pitches": [4, 5, 7, 8, 7, 8, 5, 8, 7, 5, 5, 4, 7, 5, 4, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#14", "pitches": [0, 1, 4, 1, 4, 5, 4, 7, 5, 4, 1, 1, 0], "durs": [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S55" },
        { "id": "mela15#15", "pitches": [12, 13, 16, 17, 16, 13, 12, 11, 8, 7, 8, 11, 13, 12, 11, 8, 7, 5, 4, 5, 4, 1, 0, -1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S55" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela16": {
      landing: [0, 1, 5, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "medium", "basis": "text", "maxChain": 4, "rules": { "1": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S41", "basis": "text", "spec": 0 }], "4": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 1, "end": "hi", "cycles": [1, 1], "dwell": "hi", "depth": 0.5, "src": "S41", "basis": "text", "spec": 0 }], "5": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S41", "basis": "text", "spec": 0 }] }, "sources": ["S41", "S193"] },
      phrases: [
        { "id": "mela16#0", "pitches": [5, 5, 4, 1, 0, 4, 5, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#1", "pitches": [9, 9, 12, 10, 10, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#2", "pitches": [9, 7, 9, 10, 12, 10, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#3", "pitches": [10, 9, 9, 7, 5, 7, 9, 7, 5, 4, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#4", "pitches": [0, 4, 5, 7, 9, 9, 12, 10, 10, 9, 7], "durs": [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#5", "pitches": [7, 9, 10, 12, 12, 12, 10, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#6", "pitches": [7, 5, 9, 7, 7, 5, 5, 4, 1, 5, 4, 1, 0, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#7", "pitches": [7, 9, 10, 12, 13, 12, 12, 12, 10, 9, 10, 9, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#8", "pitches": [10, 9, 7, 7, 5, 5, 4, 1, 5, 4, 1, 0, 1], "durs": [1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#9", "pitches": [7, 9, 10, 12, 13, 12, 13], "durs": [2, 2, 1, 2, 1, 1, 1], "type": "connective", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#10", "pitches": [12, 12, 10, 9, 9, 10, 12], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#11", "pitches": [12, 13, 16, 17, 16, 16, 13, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#12", "pitches": [12, 12, 10, 9, 10, 10, 12, 13, 12, 13], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#13", "pitches": [13, 12, 12, 13, 12, 10, 9, 7, 5, 10, 9, 7, 5, 4, 5, 7, 5, 4, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.5, "octaveCertain": false, "source": "S56" },
        { "id": "mela16#14", "pitches": [5, 5, 4, 1, 0, 0, 1, 0, 0, 0, 1, 1, 4, 5, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": false, "source": "S56" }
      ],
      exceptions: [],
      avoid: [
        { "pitches": [0, 5, 4, 5], "strength": "soft" }
      ]
    },
    "mela17": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela18": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela19": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela2": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela20": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "3": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S61", "basis": "text-vague", "spec": 0 }], "10": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S61", "basis": "text-vague", "spec": 0 }] }, "sources": ["S61", "S193"] },
      phrases: [
        { "id": "mela20#0", "pitches": [7, 5, 3, 2, 0], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": true, "source": "S61" },
        { "id": "mela20#1", "pitches": [5, 7, 8, 10, 8, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": true, "source": "S61" },
        { "id": "mela20#2", "pitches": [-2, 0, 2, 3, 5], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": true, "source": "S61" },
        { "id": "mela20#3", "pitches": [3, 5, 7, 5, 3, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": true, "source": "S61" },
        { "id": "mela20#4", "pitches": [8, 10, 12], "durs": [1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": true, "source": "S61" },
        { "id": "mela20#5", "pitches": [12, 10, 8, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": true, "source": "S61" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela21": {
      landing: [0, 2, 5, 7, 11],
      avoidLanding: [],
      nyasa: [0, 2, 5, 7, 11],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela21#0", "pitches": [7, 8, 11, 12, 14, 15, 14, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#1", "pitches": [11, 14, 11, 8, 7, 5], "durs": [1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#2", "pitches": [3, 5, 7, 8, 7, 5, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#3", "pitches": [2, 3, 5, 3, 2, 0, -1], "durs": [2, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#4", "pitches": [-4, -1, 2, 3, 2, -1, -4, -5], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#5", "pitches": [-5, -4, -1, 0, 2, 3, 2, 3], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#6", "pitches": [2, 3, 5], "durs": [1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#7", "pitches": [7, 8, 11], "durs": [1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#8", "pitches": [12, 14, 15], "durs": [1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#9", "pitches": [15, 17, 19, 17, 15, 14, 12, 11, 8, 11, 12, 11, 8, 7, 5], "durs": [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#10", "pitches": [7, 14, 11, 8, 7, 5], "durs": [1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#11", "pitches": [5, 11, 8, 7, 5, 3], "durs": [1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#12", "pitches": [3, 5, 7, 8, 5, 7, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#13", "pitches": [3, 2, 0, -1, -4, -1, 0], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S60" },
        { "id": "mela21#14", "pitches": [8, 7, 5, 8, 7, 3, 2, 3, 5, 7, 8], "durs": [1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S59" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela22": {
      landing: [0, 2, 3, 7, 9, 10],
      avoidLanding: [],
      nyasa: [2, 3, 9, 10],
      jiva: [2, 3, 9, 10],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "medium", "basis": "text", "maxChain": 4, "rules": { "2": [{ "when": { "minSec": 0.35 }, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.6, "src": "S52", "basis": "text-vague", "spec": 1 }], "3": [{ "when": { "minSec": 0.35 }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.6, "src": "S52", "basis": "text-vague", "spec": 1 }], "9": [{ "when": { "minSec": 0.35 }, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.6, "src": "S52", "basis": "text-vague", "spec": 1 }], "10": [{ "when": { "minSec": 0.35 }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.6, "src": "S52", "basis": "text-vague", "spec": 1 }] }, "sources": ["S52", "S193"] },
      phrases: [
        { "id": "mela22#0", "pitches": [2, 3, 2, 0, -2, -3, -2, 0, 2, 2, 0, -2, 0], "durs": [2, 1, 2, 3, 2, 2, 2, 1, 2, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S58" },
        { "id": "mela22#1", "pitches": [9, 10, 9, 7, 5, 9, 10, 9, 7, 12, 10, 10, 9, 7, 5], "durs": [2, 1, 2, 3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S58" },
        { "id": "mela22#2", "pitches": [7, 9, 7, 12], "durs": [2, 2, 2, 2], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S58" },
        { "id": "mela22#3", "pitches": [10, 9, 7, 5, 10, 9, 10, 9, 7, 9, 10, 12, 14, 15, 14, 12, 10], "durs": [1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S58" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela23": {
      landing: [0, 2, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "heavy", "basis": "text", "maxChain": 4, "rules": { "2": [{ "when": { "janta": true }, "onset": "sphurita", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S53", "basis": "text", "spec": 1 }, { "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S53", "basis": "text", "spec": 0 }], "3": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S53", "basis": "text", "spec": 0 }], "5": [{ "when": { "inPhrase": [5, 7, 9, 11, 0] }, "onset": "nokku", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "from": 2, "end": "self", "cycles": [1, 1], "depth": 1, "src": "S53", "basis": "text", "spec": 1 }, { "when": { "next": { "pc": 3, "rel": null } }, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S53", "basis": "text", "spec": 1 }, { "when": { "prev": { "pc": 3, "rel": null } }, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S53", "basis": "text", "spec": 1 }], "9": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S53", "basis": "text-vague", "spec": 0 }] }, "sources": ["S53", "S193"] },
      phrases: [
        { "id": "mela23#0", "pitches": [3, 7, 5, 3, 2, 2, 0, 0, -3, -1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 3, 1, 2, 1], "type": "ending", "weight": 0.48, "octaveCertain": false, "source": "S53" },
        { "id": "mela23#1", "pitches": [5, 7, 9, 11, 12], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.6, "octaveCertain": true, "source": "S53" },
        { "id": "mela23#2", "pitches": [9, 9, 7, 7, 3, 3, 3, 2, 0, -1, 0], "durs": [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#3", "pitches": [3, 7, 5, 3, 3, 2], "durs": [1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#4", "pitches": [3, 2, 0, -1, 0, 2, 3, 5, 5, 7, 9], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#5", "pitches": [11, 9, 7, 7, 5, 7, 5, 7, 5, 3, 3, 2], "durs": [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#6", "pitches": [3, 2, 0, -1, 0, 2, 3, 5, 7, 9, 11, 12, 14, 12, 14], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#7", "pitches": [9, 11, 12, 14, 12, 11, 11, 9, 7, 3, 5, 7, 9, 7, 7, 5, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#8", "pitches": [9, 11, 12, 14, 12, 11, 12, 11, 9, 11, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#9", "pitches": [3, 5, 7, 9, 7, 5, 7, 5, 5, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#10", "pitches": [7, 5, 3, 2, 0, 2, 3, 5, 7, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#11", "pitches": [9, 11, 12, 12, 12, 11, 9, 11, 12, 14, 15, 14, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#12", "pitches": [11, 11, 11, 9, 11, 9, 7, 9, 11, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#13", "pitches": [2, 3, 5, 3, 7, 5, 3, 2, 2, 3, 5, 3, 3, 2, 0, -1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#14", "pitches": [2, 3, 5, 7, 7, 9, 11, 12, 11, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#15", "pitches": [3, 3, 2, 3, 7, 5, 3, 2, 2, 0, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#16", "pitches": [5, 7, 11, 9, 7, 7, 5, 3, 3, 2, 3, 2, 0, -1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#17", "pitches": [12, 9, 11, 9, 7, 9, 11, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#18", "pitches": [9, 14, 12, 11, 9, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" },
        { "id": "mela23#19", "pitches": [9, 11, 14, 12, 12, 11, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S57" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela24": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela25": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela26": {
      landing: [0, 4, 7, 8],
      avoidLanding: [],
      nyasa: [0, 4, 7, 8],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "4": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S84", "basis": "text-vague", "spec": 0 }], "10": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S84", "basis": "text-vague", "spec": 0 }] }, "sources": ["S84", "S193"] },
      phrases: [
        { "id": "mela26#0", "pitches": [7, 8, 5, 7, 5, 4], "durs": [1, 1, 1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#1", "pitches": [2, 4, 5, 4, 2, 0, -4], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#2", "pitches": [-5, -4, -2, -4, -2, 0, -2, 0, 2, 0], "durs": [1, 1, 2, 1, 1, 2, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#3", "pitches": [-2, 0, 2, 4, 2, 0, -4], "durs": [2, 2, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#4", "pitches": [-4, -2, 0, 2, 4, 5, 4], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#5", "pitches": [4, 5, 7, 8, 5, 7, 4, 5, 2, 4, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#6", "pitches": [7, 8, 10, 8, 10, 12, 10, 8, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#7", "pitches": [7, 8, 10, 12, 8], "durs": [1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#8", "pitches": [8, 10, 14, 12], "durs": [1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#9", "pitches": [10, 8, 7, 8, 10, 12, 14, 16, 17, 16], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#10", "pitches": [16, 14, 16, 17, 16, 14, 12], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#11", "pitches": [10, 12, 10, 12, 14, 12, 8, 7], "durs": [1, 1, 1, 1, 2, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#12", "pitches": [4, 5, 7, 8, 10, 8, 10, 12, 10, 8, 7, 5], "durs": [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#13", "pitches": [4, 5, 10, 8], "durs": [1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#14", "pitches": [4, 5, 8, 7], "durs": [1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#15", "pitches": [4, 5, 7, 7, 5, 4], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#16", "pitches": [5, 4, 2, 0, -4], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#17", "pitches": [-4, -2, 0, 2, 0], "durs": [1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S81" },
        { "id": "mela26#18", "pitches": [7, 8, 7, 5, 4, 2, 4, 4, 2, 0, 2, 4, 5, 7, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S82" },
        { "id": "mela26#19", "pitches": [7, 8, 10, 8, 8, 10, 12], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S82" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela27": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela28": {
      landing: [0, 4, 9, 10],
      avoidLanding: [],
      nyasa: [4, 9, 10],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "unknown",
      confidence: "high",
      gamaka: { "style": "medium", "basis": "text", "maxChain": 4, "rules": { "5": [{ "when": { "prev": { "pc": 4, "rel": null } }, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S75", "basis": "text", "spec": 1 }], "9": [{ "when": { "prev": { "pc": 7, "rel": null } }, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S75", "basis": "text", "spec": 1 }], "10": [{ "when": { "prev": { "pc": 0, "rel": "up" } }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S75", "basis": "text", "spec": 1 }, { "when": { "prev": { "pc": 9, "rel": null } }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.3, "src": "S75", "basis": "text", "spec": 1 }] }, "sources": ["S75", "S193"] },
      phrases: [
        { "id": "mela28#0", "pitches": [4, 5, 7, 9, 10, 9, 7], "durs": [1, 1, 1, 1, 2, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#1", "pitches": [7, 5, 4, 2], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#2", "pitches": [5, 4, 4, 2, 0, -2, -3, -2], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#3", "pitches": [-3, -2, 0, 2, 4, 5, 4], "durs": [1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#4", "pitches": [5, 4, 5, 7], "durs": [1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#5", "pitches": [10, 9, 9, 7, 5, 4, 5], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#6", "pitches": [5, 7, 9, 10, 12, 10, 9], "durs": [1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#7", "pitches": [9, 10, 12, 14, 16, 17, 16, 14, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#8", "pitches": [10, 12, 14, 16, 14], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#9", "pitches": [12, 14, 14, 12, 10, 9, 10], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#10", "pitches": [9, 10, 12, 10, 9, 7], "durs": [1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#11", "pitches": [5, 4, 2, 0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 16, 14, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#12", "pitches": [10, 12, 14, 16, 14, 12, 10, 9, 10], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#13", "pitches": [9, 10, 9, 7, 5, 4, 2], "durs": [1, 2, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#14", "pitches": [0, -2, -3, -2, 0], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S80" },
        { "id": "mela28#15", "pitches": [0, 2, 4], "durs": [1, 1, 1], "type": "signature", "weight": 0.7, "octaveCertain": true, "source": "S75" },
        { "id": "mela28#16", "pitches": [0, 2, 4, 5], "durs": [1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S75" },
        { "id": "mela28#17", "pitches": [0, 2, 0], "durs": [1, 1, 1], "type": "ending", "weight": 0.6, "octaveCertain": true, "source": "S75" },
        { "id": "mela28#18", "pitches": [0, 2, -2], "durs": [1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S75" },
        { "id": "mela28#19", "pitches": [9, 10, 12], "durs": [1, 1, 1], "type": "signature", "weight": 0.58, "octaveCertain": false, "source": "S75" }
      ],
      exceptions: [],
      avoid: [
        { "pitches": [0, 5, 4, 5], "strength": "soft" },
        { "pitches": [7, 9, 12], "strength": "soft" }
      ]
    },
    "mela29": {
      landing: [0, 4, 5, 7],
      avoidLanding: [2, 9, 11],
      nyasa: [0, 4, 5, 7],
      jiva: [4, 5, 7, 11],
      alpa: [],
      notNyasa: [2, 9, 11],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "heavy", "basis": "text", "maxChain": 4, "rules": { "2": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S76", "basis": "text-vague", "spec": 0 }], "4": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S76", "basis": "text", "spec": 0 }], "5": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S76", "basis": "text-vague", "spec": 0 }], "9": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S76", "basis": "text-vague", "spec": 0 }], "11": [{ "when": {}, "onset": "jaru", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S76", "basis": "text", "spec": 0 }] }, "sources": ["S76", "S193"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela3": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela30": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela31": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "3": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -3, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 1, "src": "S77", "basis": "text-vague", "spec": 0 }], "8": [{ "when": {}, "onset": "jaru", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S77", "basis": "text", "spec": 0 }], "9": [{ "when": {}, "onset": "jaru", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S77", "basis": "text", "spec": 0 }] }, "sources": ["S77", "S193"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela32": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela33": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela34": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela35": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela36": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela37": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela38": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela39": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela4": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela40": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela41": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela42": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela43": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela44": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela45": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela46": {
      landing: [0, 6, 7, 9, 10],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "unknown",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela46#0", "pitches": [10, 9, 7, 6, 3, 1, 1, 0, -2, -3, -2, 0, 1, 3, 6], "durs": [1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S102" },
        { "id": "mela46#1", "pitches": [7, 9, 10, 9, 7, 9, 10, 9, 7, 6, 3, 1, 1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S102" },
        { "id": "mela46#2", "pitches": [7, 10, 9, 7, 9, 6, 7, 6, 7, 9, 9, 9, 10, 9, 10, 10], "durs": [3, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S102" },
        { "id": "mela46#3", "pitches": [9, 12, 10, 9, 7, 9, 10, 9, 7, 6, 3, 1, 1, 0, -2, -3, -2, 0, 1, -2, -3], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S102" },
        { "id": "mela46#4", "pitches": [7, 10, 9, 7, 9, 9, 7, 6, 7, 6, 7, 9, 10, 10, 12, 12, 12], "durs": [3, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S102" },
        { "id": "mela46#5", "pitches": [10, 9, 7, 9, 6, 7, 6, 7, 9, 10, 12], "durs": [1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 4], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S102" },
        { "id": "mela46#6", "pitches": [10, 12, 10, 9, 7, 9, 10, 9, 7, 10, 9, 7, 6, 7, 6, 7, 9, 10, 12, 13, 15, 13, 13, 12, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S102" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela47": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela48": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela49": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela5": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela50": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela51": {
      landing: [0, 1, 7, 8],
      avoidLanding: [4],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [4],
      janta: "unknown",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "4": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S115", "basis": "text", "spec": 0 }], "8": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S115", "basis": "text", "spec": 0 }] }, "sources": ["S115", "S193"] },
      phrases: [
        { "id": "mela51#0", "pitches": [-1, 0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0], "durs": [1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1], "type": "signature", "weight": 0.58, "octaveCertain": false, "source": "S115" },
        { "id": "mela51#1", "pitches": [12, 13, 16, 18, 16, 13, 12], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.48, "octaveCertain": false, "source": "S115" },
        { "id": "mela51#2", "pitches": [7, 6, 4, 6, 4, 1, 0, -1, 0, 1, 4, 1, 4], "durs": [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#3", "pitches": [4, 6, 7, 7, 6, 4, 1], "durs": [1, 1, 3, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#4", "pitches": [4, 6, 7, 6, 4, 6, 7, 6, 4, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#5", "pitches": [4, 6, 7, 8, 8, 7, 7, 6, 8, 7, 6, 4, 1], "durs": [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#6", "pitches": [4, 6, 7, 7, 6, 7, 8, 7, 8, 8, 11, 12, 13, 11, 8, 7, 6, 4, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#7", "pitches": [4, 6, 7, 6, 7, 8, 7, 8, 11, 8, 11, 12, 13, 12, 11, 8, 11, 8, 7, 6, 4, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#8", "pitches": [6, 8, 12, 12, 12], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#9", "pitches": [12, 11, 8, 7, 6, 8, 11, 12, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#10", "pitches": [12, 11, 8, 8, 6, 8, 11, 12, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#11", "pitches": [12, 12, 12, 11, 16, 13, 12], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#12", "pitches": [12, 11, 8, 8, 11, 12, 13, 12, 13], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#13", "pitches": [12, 11, 12, 13, 12, 13, 12, 11, 8, 7, 7, 6, 11, 8, 7, 6, 4, 6, 4, 1, 0, 1, 4, 6], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#14", "pitches": [6, 7, 8, 11, 8, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#15", "pitches": [12, 11, 8, 12, 11, 8, 7, 6], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" },
        { "id": "mela51#16", "pitches": [12, 11, 8, 11, 12, 13, 12, 11, 8], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S126" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela52": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela53": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: [
        { "pitches": [7, 9, 7, 12], "strength": "soft" },
        { "pitches": [4, 6, 9, 12], "strength": "soft" },
        { "pitches": [9, 11, 7, 9, 12], "strength": "soft" }
      ]
    },
    "mela54": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela55": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela56": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela56#0", "pitches": [12, 14, 12, 8, 14, 12, 8, 12, 8, 7, 6, 3, 6, 7], "durs": [1, 1, 2, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": true, "source": "S127" },
        { "id": "mela56#1", "pitches": [7, 6, 7, 8, 10], "durs": [5, 2, 1, 1, 1], "type": "connective", "weight": 0.5, "octaveCertain": true, "source": "S127" },
        { "id": "mela56#2", "pitches": [7, 3, 0, 2, 3, 6, 7, 8, 10, 12, 14], "durs": [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.5, "octaveCertain": true, "source": "S127" },
        { "id": "mela56#3", "pitches": [2, 10, 8, 7, 0, 2, 3, 6, 7, 8, 10], "durs": [1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.5, "octaveCertain": false, "source": "S127" },
        { "id": "mela56#4", "pitches": [10, 8, 7, 6, 7, 8, 10, 0, 2, 3, 6, 7, 8], "durs": [2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.5, "octaveCertain": false, "source": "S127" },
        { "id": "mela56#5", "pitches": [10, 10, 8, 7, 6, 3, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": true, "source": "S127" },
        { "id": "mela56#6", "pitches": [3, 7, 6, 3, 2, 0], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.5, "octaveCertain": true, "source": "S127" },
        { "id": "mela56#7", "pitches": [12, 15, 14, 12, 10, 8, 7, 6, 3, 2], "durs": [2, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.5, "octaveCertain": false, "source": "S127" },
        { "id": "mela56#8", "pitches": [0, 2, 3, 2, 3, 6, 3, 6, 7, 8, 10], "durs": [1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.5, "octaveCertain": true, "source": "S127" },
        { "id": "mela56#9", "pitches": [0, 3, 2, 3, 6, 7], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#10", "pitches": [6, 7, 8, 10, 8, 12], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#11", "pitches": [8, 7, 8, 12], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#12", "pitches": [0, 6, 7, 10, 12], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#13", "pitches": [6, 7, 3, 3, 2, 0], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#14", "pitches": [7, 6, 3, 2, 0], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#15", "pitches": [7, 8, 10, 12, 14, 15, 14, 12, 8], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#16", "pitches": [10, 8, 10, 8, 7, 8], "durs": [1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": false, "source": "S119" },
        { "id": "mela56#17", "pitches": [0, -4, -2, 0], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#18", "pitches": [0, -2, 2, 0], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#19", "pitches": [2, 3, 6, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#20", "pitches": [3, 6, 8, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#21", "pitches": [8, 10, 8, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#22", "pitches": [6, 7, 8, 10, 12], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#23", "pitches": [12, 8, 10, 12], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#24", "pitches": [12, 10, 8, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" },
        { "id": "mela56#25", "pitches": [6, 3, 2, 0], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S125" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela57": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "low",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela57#0", "pitches": [7, 6, 8, 12, 11, 12], "durs": [1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S121" },
        { "id": "mela57#1", "pitches": [6, 7, 3, 2, 0], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": true, "source": "S121" },
        { "id": "mela57#2", "pitches": [6, 8, 12, 11, 12, 8, 7], "durs": [1, 1, 2, 1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S121" },
        { "id": "mela57#3", "pitches": [6, 7, 3, 2, 0, 2, 2, 0, -1, 0, 2, 3, 6, 7], "durs": [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.15, "octaveCertain": false, "source": "S121" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela58": {
      landing: [0, 2, 7, 9],
      avoidLanding: [],
      nyasa: [2, 9],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "suits",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela58#0", "pitches": [9, 10, 9, 7], "durs": [1, 2, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#1", "pitches": [6, 7, 9, 10, 9, 7, 6, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#2", "pitches": [3, 2, 0, -2, -3, -2, 0], "durs": [1, 1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#3", "pitches": [2, 0, 2, 3, 2, 3], "durs": [2, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#4", "pitches": [3, 2, 3, 6, 7], "durs": [1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#5", "pitches": [7, 6, 10, 9, 10, 7, 9, 6], "durs": [1, 1, 1, 2, 1, 2, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#6", "pitches": [6, 7, 9, 10, 12, 10, 9], "durs": [1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#7", "pitches": [10, 10, 9, 7, 6, 3, 2, 3, 6, 7, 9, 10, 12, 10, 9, 10], "durs": [2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#8", "pitches": [9, 10, 15, 14, 12], "durs": [1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#9", "pitches": [14, 15, 18, 19, 18, 15, 14, 12, 14, 10, 9], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#10", "pitches": [7, 9, 10, 15, 14, 15, 12, 14, 10, 14, 12, 12, 10, 10, 9], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#11", "pitches": [10, 9, 7, 6], "durs": [2, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#12", "pitches": [7, 15, 14, 14, 12, 12, 10, 9, 7, 6], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.4, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#13", "pitches": [7, 6, 10, 9, 7, 6, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 2, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S123" },
        { "id": "mela58#14", "pitches": [0, -2, -3, -2, 0], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S123" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela59": {
      landing: [0, 2, 6, 7, 11],
      avoidLanding: [3, 9],
      nyasa: [0, 2, 6, 7, 11],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela59#0", "pitches": [7, 6, 9, 7, 6, 3, 2], "durs": [1, 1, 2, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#1", "pitches": [2, 3, 6, 7, 9, 11, 12, 11, 9, 7, 6, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#2", "pitches": [3, 2, 0, -1, -3, -1], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#3", "pitches": [-1, 0, 2, 3, 6], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#4", "pitches": [7, 9, 11], "durs": [1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#5", "pitches": [11, 14, 15, 14, 11, 9, 7, 6], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#6", "pitches": [7, 9, 11, 12, 14, 15, 14], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#7", "pitches": [11, 12, 14, 15, 18, 19, 18, 15, 14, 12, 11], "durs": [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#8", "pitches": [9, 11, 14, 15, 14, 11, 9, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#9", "pitches": [6, 11, 9, 14, 11, 9, 7, 6, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#10", "pitches": [9, 7, 9, 7, 9, 7, 6, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S124" },
        { "id": "mela59#11", "pitches": [0, 2, 0], "durs": [1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S124" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela6": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela60": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela61": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela62": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela63": {
      landing: [0, 4, 7, 11],
      avoidLanding: [],
      nyasa: [4, 7, 11],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "suits",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela63#0", "pitches": [11, 8, 7], "durs": [1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#1", "pitches": [6, 8, 7, 6, 4, 2, 4], "durs": [1, 1, 1, 1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#2", "pitches": [4, 6, 7, 8, 11, 12, 11, 8, 7, 6, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#3", "pitches": [2, 4, 6, 7, 6, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#4", "pitches": [6, 4, 2, 0], "durs": [1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#5", "pitches": [0, -1, 4, 2, 4, 2, 0, -1, -4], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#6", "pitches": [-4, -1, 2, -1, -4, -5], "durs": [1, 1, 1, 1, 2, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#7", "pitches": [-5, -4, -1, 0, 2, 4], "durs": [1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#8", "pitches": [4, 8, 7, 6, 4, 2], "durs": [1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#9", "pitches": [4, 6, 7, 8], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#10", "pitches": [8, 7, 6, 7, 8, 11], "durs": [1, 1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#11", "pitches": [11, 14, 16, 14, 12, 11], "durs": [1, 1, 2, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#12", "pitches": [8, 8, 16, 14, 16, 14, 12, 11, 8, 7, 6], "durs": [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#13", "pitches": [7, 6, 11, 8], "durs": [1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#14", "pitches": [4, 2, 0, -1, -4], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S141" },
        { "id": "mela63#15", "pitches": [-4, -1, 4, 2, 0], "durs": [1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S141" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela64": {
      landing: [0, 2, 4, 7, 9],
      avoidLanding: [],
      nyasa: [0, 2, 4, 7, 9],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "neutral",
      confidence: "high",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "mela64#0", "pitches": [9, 10, 9, 7, 6, 4, 2, 4], "durs": [1, 1, 1, 2, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#1", "pitches": [2, 4, 6, 9, 7, 6, 4, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#2", "pitches": [-3, -2, 0, 2, 4, 2, 0, 2, 0], "durs": [1, 1, 1, 1, 2, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#4", "pitches": [-5, -3, -2, -3, -2], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#5", "pitches": [0, 2, 4, 2, 0], "durs": [1, 1, 2, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#6", "pitches": [0, 2, 4, 6, 7], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#7", "pitches": [6, 7, 9, 10, 12, 14, 12, 10, 9, 10], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#8", "pitches": [14, 12, 10, 12], "durs": [1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#9", "pitches": [9, 10, 12, 14, 16, 14], "durs": [1, 1, 1, 1, 2, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#10", "pitches": [14, 16, 18, 19, 18, 16, 14, 12], "durs": [1, 1, 1, 1, 1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#11", "pitches": [7, 12, 10, 9, 7, 6, 4, 2, 4], "durs": [1, 1, 2, 1, 1, 1, 1, 2, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#12", "pitches": [10, 9, 10], "durs": [1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#13", "pitches": [16, 14, 16], "durs": [1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#14", "pitches": [14, 12, 10, 9, 7, 6, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#15", "pitches": [4, 2, 4, 2, 0, -2, -3, -2], "durs": [1, 1, 2, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S142" },
        { "id": "mela64#16", "pitches": [2, 0, -2, 0], "durs": [1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S142" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela65": {
      landing: [0, 2, 4, 7, 11],
      avoidLanding: [],
      nyasa: [0, 2, 4, 7, 11],
      jiva: [2, 4],
      alpa: [],
      notNyasa: [],
      janta: "suits",
      dattu: "suits",
      confidence: "high",
      gamaka: { "style": "heavy", "basis": "text", "maxChain": 4, "rules": { "0": [{ "when": { "dir": "down" }, "onset": "nokku", "body": "plain", "exit": "none", "from": 2, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }], "2": [{ "when": { "dir": "down" }, "onset": "nokku", "body": "plain", "exit": "none", "from": 2, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }], "4": [{ "when": { "dir": "down" }, "onset": "nokku", "body": "kampita", "exit": "none", "lo": -2, "hi": 2, "from": 2, "end": "self", "cycles": [1, 1], "depth": 1, "src": "S144", "basis": "text", "spec": 1 }, { "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -2, "hi": 2, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S144", "basis": "text", "spec": 0 }], "6": [{ "when": { "dir": "down" }, "onset": "nokku", "body": "plain", "exit": "none", "from": 1, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }], "7": [{ "when": { "dir": "down" }, "onset": "nokku", "body": "plain", "exit": "none", "from": 2, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }], "9": [{ "when": { "dir": "down" }, "onset": "nokku", "body": "plain", "exit": "none", "from": 2, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }], "11": [{ "when": { "next": { "pc": 0, "rel": "up" } }, "onset": "nokku", "body": "plain", "exit": "none", "from": 1, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }, { "when": { "prev": { "pc": 9, "rel": null } }, "onset": "odukkal", "body": "plain", "exit": "none", "from": -2, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }, { "when": { "prev": { "pc": 7, "rel": null } }, "onset": "odukkal", "body": "plain", "exit": "none", "from": -2, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }, { "when": { "dir": "down" }, "onset": "nokku", "body": "plain", "exit": "none", "from": 1, "end": "self", "depth": 1, "src": "S144", "basis": "text", "spec": 1 }] }, "sources": ["S144", "S193"] },
      phrases: [
        { "id": "mela65#0", "pitches": [4, 9, 7, 6, 7, 4, 2, 0, -1, 2], "durs": [1, 1, 1, 1, 1, 2, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#1", "pitches": [4, 11, 9, 11, 9, 7, 6], "durs": [1, 1, 1, 2, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#2", "pitches": [6, 7, 9, 11, 9, 7, 6], "durs": [1, 1, 1, 1, 2, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#3", "pitches": [7, 9, 11, 12, 11], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#4", "pitches": [11, 12, 14, 16, 14, 12, 11, 9, 11, 9], "durs": [2, 1, 2, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#5", "pitches": [9, 11, 14, 16, 14, 12], "durs": [1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#6", "pitches": [11, 12, 14, 16, 18, 19, 16, 14, 12, 11], "durs": [1, 1, 1, 1, 1, 2, 2, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#7", "pitches": [11, 16, 14, 11, 14, 11, 9, 11, 9, 6, 9, 11, 14], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#8", "pitches": [12, 14, 12, 11, 9], "durs": [2, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#9", "pitches": [7, 9, 7, 6, 4, 2, 0, 2], "durs": [2, 1, 1, 1, 2, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#10", "pitches": [-3, -1, 2, 4, 6, 9, 11, 14, 11, 9, 7, 6, 4, 2], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#11", "pitches": [9, 7, 6, 4, 2, 0], "durs": [1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#12", "pitches": [7, 6, 4, 2, 0], "durs": [1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S143" },
        { "id": "mela65#13", "pitches": [2, 4, 2, -1, -3, -1, -3, 4, 2, 0, -1, -3], "durs": [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#14", "pitches": [7, 6, 4, 6, 7], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#15", "pitches": [7, 6, 11, 9, 7], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#16", "pitches": [7, 11, 9, 7], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#17", "pitches": [7, 12, 9, 7, 6, 4, 4, 11, 9, 7], "durs": [1, 1, 1, 1, 1, 2, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#18", "pitches": [7, 9, 11, 12], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#19", "pitches": [12, 11, 16, 14, 12], "durs": [1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#20", "pitches": [11, 16, 14, 11, 9, 11, 14, 11, 9, 6], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#21", "pitches": [4, 11, 9, 6, 4, 2], "durs": [1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#22", "pitches": [11, 9, 6, 4, 2], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S144" },
        { "id": "mela65#23", "pitches": [2, 2, 4, 4, 6, 6, 9, 9, 11, 11], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S144" }
      ],
      exceptions: [],
      avoid: [
        { "pitches": [0, 7, 0, 7], "strength": "hard" }
      ]
    },
    "mela66": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela67": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela68": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela69": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela7": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela70": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela71": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela72": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mela8": {
      landing: [0, 1, 5, 7, 8],
      avoidLanding: [3, 10],
      nyasa: [0, 1, 5, 7, 8],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "suits",
      confidence: "high",
      gamaka: { "style": "heavy", "basis": "text", "maxChain": 4, "rules": { "0": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S37", "basis": "text", "spec": 0 }], "1": [{ "when": {}, "onset": "odukkal", "body": "plain", "exit": "none", "from": -1, "end": "self", "depth": 1, "src": "S37", "basis": "text", "spec": 0 }], "3": [{ "when": { "dir": "up" }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "self", "cycles": [1, 3], "depth": 1, "src": "S206", "basis": "text", "spec": 1 }, { "when": { "minSec": 0.35 }, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "self", "cycles": [1, 3], "depth": 1, "src": "S206", "basis": "text", "spec": 1 }, { "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S206", "basis": "text", "spec": 0 }], "5": [{ "when": { "dir": "up" }, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 2, "end": "self", "cycles": [1, 1], "depth": 1, "src": "S37", "basis": "text", "spec": 1 }, { "when": { "dir": "down" }, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S37", "basis": "text", "spec": 1 }], "7": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S37", "basis": "text", "spec": 0 }], "8": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S37", "basis": "text", "spec": 0 }], "10": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 2, "end": "self", "cycles": [1, 3], "depth": 1, "src": "S206", "basis": "text", "spec": 0 }] }, "sources": ["S37", "S193", "S206"] },
      phrases: [
        { "id": "mela8#0", "pitches": [3, 3, 1, 1], "durs": [4, 1, 1, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#1", "pitches": [3, 5, 3, 1, 0], "durs": [1, 1, 2, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#2", "pitches": [-2, 0, 1, 3, 1, 0, -2, -4], "durs": [1, 1, 1, 1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#3", "pitches": [-4, 3, 1, 3, 5], "durs": [1, 2, 2, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#4", "pitches": [7, 8, 10, 8, 7], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#5", "pitches": [7, 8, 10, 8, 7, 5, 7], "durs": [2, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#6", "pitches": [3, 5, 5, 10, 8], "durs": [1, 2, 1, 2, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#7", "pitches": [8, 10, 12, 13, 12], "durs": [1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#8", "pitches": [13, 12, 10, 8, 8], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#9", "pitches": [8, 10, 12, 13, 15, 17, 15, 13], "durs": [1, 1, 1, 1, 1, 1, 2, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#10", "pitches": [15, 13, 10, 8, 5, 3, 1], "durs": [1, 1, 1, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#11", "pitches": [3, 1, -2, -4, -2, 0], "durs": [1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S36" },
        { "id": "mela8#12", "pitches": [0, 1, 3, 1, 3, 5, 3, 5, 7], "durs": [1, 1, 2, 1, 1, 2, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S37" },
        { "id": "mela8#13", "pitches": [0, 1, 3, 5, 7, 8, 10, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S37" },
        { "id": "mela8#14", "pitches": [7, 8, 10, 12], "durs": [1, 2, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S37" },
        { "id": "mela8#15", "pitches": [8, 8, 15, 13], "durs": [1, 1, 2, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S37" },
        { "id": "mela8#16", "pitches": [12, 12, 10, 8, 7, 8], "durs": [3, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#17", "pitches": [10, 10, 8, 7, 5, 3, 5, 10], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#18", "pitches": [10, 8, 7, 5, 3, 1, 0, 1], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#19", "pitches": [3, 5, 7, 3, 5, 7, 8, 10], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#20", "pitches": [12, 13, 8, 10, 8, 15, 13, 12], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#21", "pitches": [8, 12, 10, 8, 7, 5, 3, 5, 7, 8, 10], "durs": [6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#22", "pitches": [5, 3, 5, 7, 8, 10, 12, 10, 8, 7, 8, 10, 12, 8, 7], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1], "type": "ending", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#23", "pitches": [8, 10, 12, 13, 15, 13, 15, 17, 15, 13, 10, 15, 13, 12, 10, 8], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#24", "pitches": [10, 13, 10, 8, 7, 5, 3, 5, 7, 8, 10, 8, 10, 12, 10, 8], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#25", "pitches": [3, 5, 7, 8, 10, 12, 12, 10, 8, 7, 5], "durs": [3, 3, 1, 1, 1, 2, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#26", "pitches": [3, 5, 3, 1, -2, 1, 0, -4, -2], "durs": [3, 3, 3, 2, 2, 2, 3, 3, 2], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#27", "pitches": [8, 10, 8, 8, 5, 3, 5, 8, 5, 3, 1, 0, -2], "durs": [2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#28", "pitches": [0, 1, 3, 5, 8, 10, 12, 10, 8, 5, 3, 5], "durs": [2, 1, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#29", "pitches": [0, 3, 1, -2, -4, -2, 1, -2, -4, -2, 0, 1, 3, 5, 8, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#30", "pitches": [13, 10, 8, 5, 3, 1, 10, 8, 5, 3, 1, 8, 5, 3, 1, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.6, "octaveCertain": true, "source": "S31" },
        { "id": "mela8#31", "pitches": [5, 3, 1, -2, 0, 1, 3, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.6, "octaveCertain": true, "source": "S31" }
      ],
      exceptions: [],
      avoid: []
    },
    "mela9": {
      landing: [0, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "none",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "3": [{ "when": {}, "onset": "none", "body": "plain", "exit": "none", "end": "self", "depth": 1, "src": "S33", "basis": "text", "spec": 0 }] }, "sources": ["S33", "S193"] },
      phrases: [],
      exceptions: [],
      avoid: []
    },
    "mohanam": {
      landing: [0, 2, 4, 7, 9],
      avoidLanding: [],
      nyasa: [4, 7, 9],
      jiva: [2, 4, 9],
      alpa: [],
      notNyasa: [],
      janta: "suits",
      dattu: "suits",
      confidence: "high",
      gamaka: { "style": "medium", "basis": "text", "maxChain": 4, "rules": { "9": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": 0, "hi": 3, "end": "self", "cycles": [1, 2], "depth": 1, "src": "S174", "basis": "text", "spec": 0 }] }, "sources": ["S174", "S193"] },
      phrases: [
        { "id": "mohanam#0", "pitches": [4, 7, 9, 12], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#1", "pitches": [12, 9, 14, 12, 9, 7], "durs": [1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#2", "pitches": [7, 4, 9, 7, 4, 2], "durs": [1, 1, 1, 1, 2, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#3", "pitches": [4, 9, 7, 9, 7, 4, 2], "durs": [1, 1, 1, 2, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#4", "pitches": [2, 7, 4, 7, 4, 2, 0], "durs": [1, 1, 1, 2, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#5", "pitches": [-3, 0, 2, 4, 2, 2, 0, 0, 0, 2, 0, -3, -5], "durs": [1, 1, 1, 1, 1, 1, 1, 2, 1, 4, 1, 2, 2], "type": "janta", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#6", "pitches": [-3, 4, 2, 4], "durs": [1, 1, 1, 1], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#7", "pitches": [4, 9, 7, 9], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#8", "pitches": [7, 9, 4], "durs": [2, 1, 1], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#9", "pitches": [7, 9, 12], "durs": [1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#10", "pitches": [9, 12, 14, 16, 14, 12, 9, 7], "durs": [1, 1, 1, 2, 1, 1, 1, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#11", "pitches": [4, 7, 12, 9], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#12", "pitches": [2, 4, 9, 7], "durs": [1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#13", "pitches": [4, 4, 7, 9, 12, 9, 7, 4, 2], "durs": [1, 1, 2, 1, 1, 1, 1, 1, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#14", "pitches": [2, 4, 7, 4, 7, 4, 2, 0], "durs": [2, 1, 1, 1, 1, 1, 2, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" },
        { "id": "mohanam#15", "pitches": [0, 0, 2, -3, 0], "durs": [2, 1, 2, 2, 1], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S162" }
      ],
      exceptions: [],
      avoid: []
    },
    "saveri": {
      landing: [0, 1, 5, 7],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "neutral",
      dattu: "unknown",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "4": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -3, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.4, "src": "S170", "basis": "text-vague", "spec": 0 }], "11": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -3, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.4, "src": "S170", "basis": "text-vague", "spec": 0 }] }, "sources": ["S170", "S193"] },
      phrases: [
        { "id": "saveri#1", "pitches": [0, 1, 5, 5], "durs": [1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S170" },
        { "id": "saveri#2", "pitches": [1, 5, 7, 8, 7, 8, 5], "durs": [1, 1, 1, 1, 2, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S170" },
        { "id": "saveri#4", "pitches": [8, 12, 13, 17, 16, 13, 13], "durs": [1, 1, 1, 1, 2, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S170" },
        { "id": "saveri#6", "pitches": [1, 5, 8, 13, 12, 11, 8, 7], "durs": [1, 1, 1, 2, 1, 1, 2, 1], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S170" },
        { "id": "saveri#7", "pitches": [5, 5, 7, 8], "durs": [2, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S170" }
      ],
      exceptions: [
        { "id": "saveri#0", "pitches": [7, 8, 7, 5, 4, 1, 0, 1, 4, 1, 1], "durs": [2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2], "type": "signature", "weight": 0.9, "octaveCertain": true, "source": "S170", "anya": [] },
        { "id": "saveri#3", "pitches": [8, 8, 16, 13, 12, 11, 8], "durs": [1, 1, 2, 1, 1, 1, 2], "type": "dattu", "weight": 0.8, "octaveCertain": true, "source": "S170", "anya": [] },
        { "id": "saveri#5", "pitches": [7, 8, 11, 7, 8], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S170", "anya": [] }
      ],
      avoid: []
    },
    "shuddhasaveri": {
      landing: [0, 2, 7, 9],
      avoidLanding: [],
      nyasa: [2, 7, 9],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "suits",
      dattu: "neutral",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "default", "maxChain": 4, "rules": {}, "sources": ["S193", "S198"] },
      phrases: [
        { "id": "shuddhasaveri#0", "pitches": [9, 12, 9, 7], "durs": [1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S165" },
        { "id": "shuddhasaveri#1", "pitches": [7, 5, 9, 7, 5, 2, 0, 2], "durs": [1, 1, 1, 2, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S165" },
        { "id": "shuddhasaveri#2", "pitches": [2, 5, 7, 5, 7, 9], "durs": [1, 1, 2, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S165" },
        { "id": "shuddhasaveri#3", "pitches": [7, 9, 14, 12, 9, 7], "durs": [1, 1, 1, 1, 2, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S165" },
        { "id": "shuddhasaveri#4", "pitches": [9, 7, 5, 7, 9], "durs": [1, 1, 1, 1, 2], "type": "connective", "weight": 0.8, "octaveCertain": true, "source": "S165" },
        { "id": "shuddhasaveri#5", "pitches": [9, 14, 9, 12], "durs": [1, 2, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S165" },
        { "id": "shuddhasaveri#6", "pitches": [9, 12, 9, 9, 7, 9, 7, 7, 5, 7, 5, 5, 2, 5, 2, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], "type": "ending", "weight": 0.8, "octaveCertain": true, "source": "S165" }
      ],
      exceptions: [],
      avoid: []
    },
    "sriranjani": {
      landing: [0, 5],
      avoidLanding: [],
      nyasa: [],
      jiva: [],
      alpa: [],
      notNyasa: [],
      janta: "unknown",
      dattu: "unknown",
      confidence: "medium",
      gamaka: { "style": "light", "basis": "text", "maxChain": 4, "rules": { "3": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -1, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S190", "basis": "text-vague", "spec": 0 }], "9": [{ "when": {}, "onset": "none", "body": "kampita", "exit": "none", "lo": -4, "hi": 0, "end": "self", "cycles": [1, 1], "depth": 0.5, "src": "S190", "basis": "text-vague", "spec": 0 }] }, "sources": ["S190", "S193"] },
      phrases: [
        { "id": "sriranjani#0", "pitches": [9, 10, 9, 5, 5, 9, 5, 3, 2, 3, 5, 3, 3, 2, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S180" },
        { "id": "sriranjani#1", "pitches": [5, 2, 3, 2, 2, 0, -2, 0, 2, 3], "durs": [2, 2, 2, 1, 1, 3, 1, 1, 1, 2], "type": "connective", "weight": 0.64, "octaveCertain": false, "source": "S180" },
        { "id": "sriranjani#2", "pitches": [2, 3, 5, 3, 3, 2, 2, 0], "durs": [1, 1, 1, 1, 1, 1, 1, 1], "type": "ending", "weight": 0.64, "octaveCertain": false, "source": "S180" },
        { "id": "sriranjani#3", "pitches": [0, 9, 10, 12, 10, 9, 10, 14, 12, 10, 9], "durs": [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "dattu", "weight": 0.64, "octaveCertain": false, "source": "S180" },
        { "id": "sriranjani#4", "pitches": [14, 12, 12, 10, 10, 9, 5], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S180" },
        { "id": "sriranjani#5", "pitches": [5, 9, 10, 12, 14, 15, 14, 12, 12, 12, 10, 9], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "janta", "weight": 0.64, "octaveCertain": false, "source": "S180" },
        { "id": "sriranjani#6", "pitches": [5, 3, 2, 0], "durs": [1, 1, 1, 1], "type": "ending", "weight": 0.2, "octaveCertain": true, "source": "S190" },
        { "id": "sriranjani#7", "pitches": [-2, 0, 2, 3, 5], "durs": [1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": true, "source": "S190" },
        { "id": "sriranjani#8", "pitches": [3, 5, 9, 10, 9, 5], "durs": [1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": true, "source": "S190" },
        { "id": "sriranjani#9", "pitches": [0, 2, 3, 5, 9, 10, 12, 10, 9, 5], "durs": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": true, "source": "S190" },
        { "id": "sriranjani#10", "pitches": [5, 9, 10, 9, 5, 3, 2], "durs": [1, 1, 1, 1, 1, 1, 1], "type": "connective", "weight": 0.2, "octaveCertain": true, "source": "S190" }
      ],
      exceptions: [],
      avoid: []
    }
  };
  var SOURCES = {
    S31: { "title": "musicmaster.in: Era napai varnam (Todi) transcription", "url": "https://musicmaster.in/blog/era-napai-varnam-thodi-raagam/", "reliability": "medium" },
    S33: { "title": "rasikas.org: Dhenuka thread", "url": "https://rasikas.org/forums/viewtopic.php?p=353155", "reliability": "medium" },
    S35: { "title": "guruguha.org: Rupavati", "url": "https://guruguha.org/?p=2542", "reliability": "high" },
    S36: { "title": "Darbar Raga Explorer: Todi", "url": "https://darbar.org/raga/todi", "reliability": "high" },
    S37: { "title": 'M. Subramanian, "Carnatic Ragam Thodi: Pitch Analysis of Notes and Gamakams", Sangeet Natak XLI(1), 2007', "url": "https://icvtesting.nvli.in/system/files/indculturePDFs/JSNA-41%281%29%2003-20.pdf", "reliability": "high" },
    S40: { "title": "Wikipedia: Mayamalavagowla", "url": "https://en.wikipedia.org/wiki/Mayamalavagowla", "reliability": "medium" },
    S41: { "title": "Wikipedia: Chakravakam (raga)", "url": "https://en.wikipedia.org/wiki/Chakravakam_(raga)", "reliability": "medium" },
    S52: { "title": "Ragasurabhi: Priyamaana Kharaharapriya", "url": "https://ragasurabhi.com/carnatic-music/surabhi-post/post--post0013--myriad-hues-of-ragas-priyamaana-kharaharapriya.html", "reliability": "medium" },
    S53: { "title": "rasikas.org: Gourimanohari thread (SrinathK)", "url": "https://www.rasikas.org/forums/viewtopic.php?p=362597", "reliability": "medium" },
    S55: { "title": "shivkumar.org: Deva Deva Kalayami (Swati Tirunal) notation", "url": "https://www.shivkumar.org/music/devadeva.htm", "reliability": "high" },
    S56: { "title": "shivkumar.org: Gajananayutham (Dikshitar, Semmangudi version) notation", "url": "https://www.shivkumar.org/music/gajananayutham.htm", "reliability": "high" },
    S57: { "title": "shivkumar.org: Guruleka (Tyagaraja) notation", "url": "https://www.shivkumar.org/music/guruleka.htm", "reliability": "high" },
    S58: { "title": "shivkumar.org: Chakkani raja (Tyagaraja) notation", "url": "https://www.shivkumar.org/music/Chakkaniraja.htm", "reliability": "high" },
    S59: { "title": "shivkumar.org: Amba vani (Muthiah Bhagavatar) notation", "url": "https://www.shivkumar.org/music/ambavani-keeravani.htm", "reliability": "high" },
    S60: { "title": "Darbar Raga Explorer: Keeravani", "url": "https://darbar.org/raga/keeravani/", "reliability": "high" },
    S61: { "title": "Shankar Mahadevan Academy: Natabhairavi", "url": "https://shankarmahadevanacademy.com/raga/natabhairavi/", "reliability": "low" },
    S75: { "title": "rasikas.org: Harikambhoji vs Khamas / Kambhoji thread", "url": "https://www.rasikas.org/forums/viewtopic.php?p=298177", "reliability": "medium" },
    S76: { "title": "Ragasurabhi: Samrat Shankarabaranam", "url": "https://ragasurabhi.com/carnatic-music/surabhi-post/post--post0008--myriad-hues-of-ragas-samrat-shankarabaranam.html", "reliability": "medium" },
    S77: { "title": "guruguha.org: Kalavati (SSP)", "url": "https://guruguha.org/?p=1535", "reliability": "high" },
    S80: { "title": "Darbar Raga Explorer: Harikambhoji", "url": "https://darbar.org/raga/harikambhoji/", "reliability": "high" },
    S81: { "title": "Darbar Raga Explorer: Charukesi", "url": "https://darbar.org/raga/charukesi/", "reliability": "high" },
    S82: { "title": "shivkumar.org: Ada modi (Tyagaraja) notation", "url": "https://www.shivkumar.org/music/adamodi.htm", "reliability": "high" },
    S84: { "title": "Shankar Mahadevan Academy: Charukesi", "url": "https://shankarmahadevanacademy.com/raga/charukesi/", "reliability": "low" },
    S102: { "title": "shivkumar.org: Antaranga bhakti (Koteeswara Iyer) notation", "url": "https://www.shivkumar.org/music/antarangabhakti.htm", "reliability": "high" },
    S115: { "title": "rasikas.org: Raga Bhava - Pantuvarali (ratanabhinav)", "url": "https://rasikas.org/forums/viewtopic.php?p=313317", "reliability": "medium" },
    S119: { "title": "musicmaster.in: Shanmugapriya", "url": "https://musicmaster.in/blog/delve-into-shanmugapriya-carnatic-raagam/", "reliability": "low" },
    S121: { "title": "Ragajunglism: Simhendra Madhyamam", "url": "https://ragajunglism.org/ragas/simhendra-madhyamam", "reliability": "medium" },
    S123: { "title": "Darbar Raga Explorer: Hemavati", "url": "https://darbar.org/raga/hemavati/", "reliability": "high" },
    S124: { "title": "Darbar Raga Explorer: Dharmavati", "url": "https://darbar.org/raga/dharmavati/", "reliability": "high" },
    S125: { "title": "Ocean of Ragas: Shanmukhpriya (Raga of the Month, Dec 2018, citing B. Subba Rao, Raga Nidhi IV)", "url": "https://www.oceanofragas.com/RagaOfMonthPDF/201812_December_ROTM_Shanmukhpriya.pdf", "reliability": "medium" },
    S126: { "title": "shivkumar.org: Apparamabhakthi (Tyagaraja) notation", "url": "https://www.shivkumar.org/music/apparamabhakthi.htm", "reliability": "high" },
    S127: { "title": "shivkumar.org: Devar Munivar (Lalgudi Jayaraman) varnam notation", "url": "https://www.shivkumar.org/music/varnams/devarmunivar-lalgudi-varnam-shanmukhapriya.htm", "reliability": "high" },
    S141: { "title": "Darbar Raga Explorer: Latangi", "url": "https://darbar.org/raga/latangi/", "reliability": "high" },
    S142: { "title": "Darbar Raga Explorer: Vachaspati", "url": "https://darbar.org/raga/vachaspati/", "reliability": "high" },
    S143: { "title": "Darbar Raga Explorer: Kalyani", "url": "https://darbar.org/raga/kalyani/", "reliability": "high" },
    S144: { "title": "Rajan Parrikar: Kalyani (Carnatic)", "url": "https://www.parrikar.org/carnatic/kalyani/", "reliability": "high" },
    S152: { "title": "Wikipedia: Abhogi", "url": "https://en.wikipedia.org/wiki/Abhogi", "reliability": "medium" },
    S158: { "title": "Wikipedia: Arabhi", "url": "https://en.wikipedia.org/wiki/Arabhi", "reliability": "medium" },
    S162: { "title": "Darbar Raga Explorer: Mohana", "url": "https://darbar.org/raga/mohana/", "reliability": "high" },
    S163: { "title": "Darbar Raga Explorer: Hindola", "url": "https://darbar.org/raga/hindola/", "reliability": "high" },
    S164: { "title": "Darbar Raga Explorer: Madhyamavati", "url": "https://darbar.org/raga/madhyamavati/", "reliability": "high" },
    S165: { "title": "Darbar Raga Explorer: Shuddha Saveri", "url": "https://darbar.org/raga/shuddha-saveri/", "reliability": "high" },
    S166: { "title": "Darbar Raga Explorer: Hamsadhwani", "url": "https://darbar.org/raga/hamsadhwani", "reliability": "high" },
    S168: { "title": "Darbar Raga Explorer: Kambhoji", "url": "https://darbar.org/raga/kambhoji/", "reliability": "high" },
    S169: { "title": "Darbar Raga Explorer: Bilahari", "url": "https://darbar.org/raga/bilahari/", "reliability": "high" },
    S170: { "title": "Darbar Raga Explorer: Saveri", "url": "https://darbar.org/raga/saveri/", "reliability": "high" },
    S171: { "title": "Darbar Raga Explorer: Arabhi", "url": "https://darbar.org/raga/arabhi/", "reliability": "high" },
    S172: { "title": "Darbar Raga Explorer: Kedaragaula", "url": "https://darbar.org/raga/kedaragaula/", "reliability": "high" },
    S174: { "title": "rasikas.org: Continuity of gamakas (beginner post)", "url": "https://rasikas.org/forums/viewtopic.php?p=309353", "reliability": "low" },
    S176: { "title": "NIOS Carnatic Music textbook, KCM-6", "url": "https://www.nios.ac.in/media/documents/Carnatic_Music_243/carnaticmusicbook2/KCM-6.pdf", "reliability": "medium" },
    S179: { "title": "shivkumar.org: Evvari Bodhana (Patnam Subramania Iyer) varnam notation", "url": "https://www.shivkumar.org/music/varnams/evvaribodhana.htm", "reliability": "high" },
    S180: { "title": "shivkumar.org: Brochevarevare (Tyagaraja) notation", "url": "https://www.shivkumar.org/music/brochevarevare.htm", "reliability": "high" },
    S181: { "title": "shivkumar.org: Kunda Goura geetham (Malahari) notation", "url": "https://www.shivkumar.org/music/varnams/kundagoura-geetham.htm", "reliability": "high" },
    S182: { "title": "shivkumar.org: Lambodara / Sri Gananatha geetham (Malahari) notation", "url": "https://www.shivkumar.org/music/varnams/lambodara-geetham.htm", "reliability": "high" },
    S183: { "title": "shivkumar.org: Bhajare re manasa (Mysore Vasudevachar) notation", "url": "https://www.shivkumar.org/music/bhajare-re-manasa.htm", "reliability": "medium" },
    S184: { "title": "guruguha.org: Kannada Bangala & Malahari, the conjoined twins", "url": "https://guruguha.org/?p=1971", "reliability": "high" },
    S185: { "title": "guruguha.org: The mystery about Kambhoji, part 2", "url": "https://guruguha.org/the-mystery-about-kambhoji-part-2/", "reliability": "high" },
    S186: { "title": "guruguha.org: Narayanagaula and allied ragas", "url": "https://guruguha.org/?p=1518", "reliability": "high" },
    S188: { "title": "rasikas.org: AbhEri - Old and New", "url": "https://rasikas.org/forums/viewtopic.php?p=354088", "reliability": "medium" },
    S190: { "title": "Shankar Mahadevan Academy: Sriranjani", "url": "https://shankarmahadevanacademy.com/raga/sriranjani/", "reliability": "low" },
    S193: { "title": 'Viraraghavan, Aravind, Murthy, "A statistical analysis of gamakas in Carnatic music", ISMIR 2017', "url": "https://archives.ismir.net/ismir2017/paper/000082.pdf", "reliability": "high" },
    S194: { "title": 'Viraraghavan et al., "Data-driven measurement of precision of components of pitch curves in Carnatic music", ISMIR 2018', "url": "https://ismir2018.ismir.net/doc/pdfs/120_Paper.pdf", "reliability": "high" },
    S195: { "title": 'Viraraghavan et al., "Non-uniform time-scaling of Carnatic music transients" (arXiv 1711.02318)', "url": "https://arxiv.org/abs/1711.02318", "reliability": "medium" },
    S198: { "title": "Wikipedia: Gamaka (music)", "url": "https://en.wikipedia.org/wiki/Gamaka_(music)", "reliability": "medium" },
    S200: { "title": 'Saitou, Goto, Unoki & Akagi, "Speech-to-singing synthesis: converting speaking voices to singing voices by controlling acoustic features unique to singing voices", IEEE WASPAA 2007', "url": "https://staff.aist.go.jp/m.goto/PAPER/WASPAA2007saitou.pdf", "reliability": "high" },
    S201: { "title": 'Krishnaswamy, "Melodic atoms for transcribing Carnatic music", ISMIR 2004', "url": "https://archives.ismir.net/ismir2004/paper/000219.pdf", "reliability": "high" },
    S202: { "title": 'R. Vedavalli, "Gamakas", lecture-demonstration at the 76th Annual Conference (24 December 2002), Journal of the Music Academy Madras 74-76 (2003-2005), pp. 26-31', "url": "https://musicacademymadras.in/catalogue/files/jindex/74-76_2003-2005-15-17.pdf", "reliability": "high" },
    S203: { "title": 'J. Schachter, "Structural Levels in South Indian Music", Music Theory Online 21.4 (2015)', "url": "https://www.mtosmt.org/issues/mto.15.21.4/mto.15.21.4.schachter.html", "reliability": "high" },
    S204: { "title": 'M. Subramanian, "Carnatic Music - Automatic Computer Synthesis of Gamakams", Sangeet Natak XLIII (2009)', "url": "http://gamakam.tripod.com", "reliability": "high" },
    S205: { "title": 'M. Subramanian, "Generating Computer Music from Skeletal Notation for Carnatic Music Compositions", Proc. 2nd CompMusic Workshop (Istanbul, 2012)', "url": "https://compmusic.upf.edu/node/130", "reliability": "high" },
    S206: { "title": 'L. Pearson, "Coarticulation and Gesture: An Analysis of Melodic Movement in South Indian Raga Performance", Music Analysis 35.3 (2016)', "url": "https://doi.org/10.1111/musa.12071", "reliability": "high" },
    S207: { "title": 'T. Nuttall, X. Serra & L. Pearson, "Svara-forms and coarticulation in Carnatic music: an investigation using deep clustering", DLfM 2024', "url": "https://doi.org/10.1145/3660570.3660580", "reliability": "high" },
    S208: { "title": 'T. Nuttall, X. Serra & L. Pearson, "Svara-Forms in Carnatic Music: Contextual Influences on the Performance of Svara", ICASSP 2025 workshops (WIMAGA)', "url": "https://github.com/thomasgnuttall/svara-forms", "reliability": "high" },
    S209: { "title": 'T. M. Krishna & V. Ishwar, "Karnatik Music: Svara, Gamaka, Phraseology and Raga Identity", Proc. 2nd CompMusic Workshop (Istanbul, 2012), pp. 12-18', "url": "http://hdl.handle.net/10230/20494", "reliability": "high" },
    S210: { "title": 'S. K. Subramanian, "Modeling Gamakas of Carnatic Music as a Synthesizer for Sparse Prescriptive Notation", PhD thesis, National University of Singapore (2013)', "url": "https://compmusic.upf.edu/node/130", "reliability": "high" },
    S211: { "title": 'S. K. Subramanian, L. Wyse & K. McGee, "A two-component representation for modeling gamakas of Carnatic music", Proc. 2nd CompMusic Workshop (Istanbul, 2012)', "url": "https://compmusic.upf.edu/node/130", "reliability": "high" }
  };

  // src/engine/profiles.js
  var TABLE = profiles_generated_default;
  function getProfile(raga) {
    const id = raga && typeof raga === "object" ? raga.id : raga;
    return id != null && Object.prototype.hasOwnProperty.call(TABLE, id) && TABLE[id] || null;
  }
  function setProfiles(table) {
    TABLE = table == null ? profiles_generated_default : table;
  }
  function getSource(id) {
    return id != null && Object.prototype.hasOwnProperty.call(SOURCES, id) && SOURCES[id] || null;
  }

  // src/engine/kalpana/devices.js
  var CELL_DEFS = [
    // id, name, kind, F0 (familiarity prior), N0 (novelty prior), steps [[degree step, duration], ...]
    ["step", "step", "step", 0.2, -0.2, [[1, 1]]],
    ["skip", "skip", "step", -0.3, 0.2, [[2, 1]]],
    // a lone third: a filler, so less familiar than a figure that resolves it
    ["hold", "held step", "step", 0.1, -0.1, [[1, 2]]],
    ["run3", "run", "conv", 1, -0.4, [[1, 1], [1, 1], [1, 1]]],
    ["run4", "run", "conv", 1.1, -0.5, [[1, 1], [1, 1], [1, 1], [1, 1]]],
    ["run5", "run", "conv", 0.9, -0.5, [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]],
    ["janta", "janta", "conv", 0.9, -0.2, [[1, 1], [0, 1], [1, 1], [0, 1]]],
    ["janta3", "janta", "conv", 0.8, -0.3, [[1, 1], [0, 1], [1, 1], [0, 1], [1, 1], [0, 1]]],
    ["dattu", "dattu", "conv", 0.7, 0.1, [[2, 1], [-1, 1], [2, 1], [-1, 1]]],
    ["turn", "turn", "conv", 0.6, 0, [[1, 1], [1, 1], [-1, 1]]],
    ["seq3", "sequence of threes", "conv", 1.1, -0.3, [[1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1]]],
    ["seq3x3", "sequence of threes", "conv", 1, -0.4, [[1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1]]],
    ["seq4", "sequence of fours", "conv", 1, -0.4, [[1, 1], [1, 1], [1, 1], [1, 1], [-2, 1], [1, 1], [1, 1], [1, 1]]],
    ["cad", "run into a held swara", "conv", 0.9, -0.3, [[1, 1], [1, 1], [1, 2]]],
    ["leap3", "leap", "nov", -0.6, 0.8, [[3, 1]]],
    ["leap4", "wide leap", "nov", -1, 1, [[4, 1]]],
    ["arp", "arpeggio", "nov", -0.4, 1, [[2, 1], [2, 1], [2, 1]]],
    ["leapfill", "leap and fall back", "nov", -0.3, 0.9, [[3, 1], [-1, 1], [-1, 1]]],
    ["zigzag", "zig-zag", "nov", -0.8, 1.1, [[2, 1], [-3, 1], [2, 1]]],
    ["synco", "syncopated hold", "nov", -0.3, 0.7, [[1, 2], [1, 1]]],
    ["skipjanta", "displaced janta", "nov", -0.2, 0.8, [[2, 1], [0, 1], [-1, 1], [0, 1]]],
    // phrase openings (v0.4, docs/research/kalpana-structure.md §3.2): after the held swara that ends a
    // phrase, the next one restarts higher and runs down toward its focus (Field 2018, Ex. 2.1, 3, 8.2,
    // 18: (RGM)[P,P,P,,](RGM); every korvai unit descends). Only a phrase may begin with one: the leap is
    // the restart, and inside a phrase it would be a jump at a join. The mirror images rise from below.
    ["restart3", "restart and fall", "conv", 0.9, -0.3, [[3, 1], [-1, 1], [-1, 1]], "start"],
    ["restart4", "restart and fall", "conv", 0.9, -0.3, [[4, 1], [-1, 1], [-1, 1], [-1, 1]], "start"],
    ["restart2", "restart and fall", "conv", 0.7, -0.2, [[2, 1], [-1, 1], [-1, 1], [-1, 1]], "start"]
  ];
  var CELLS = function() {
    const out = [];
    CELL_DEFS.forEach((b) => [1, -1].forEach((dir) => {
      const shape = b[5].map(([d, u]) => [d * dir, u]);
      out.push({ id: b[0] + (dir > 0 ? "+" : "-"), base: b[0], name: b[1], kind: b[2], F0: b[3], N0: b[4], shape, dir, len: shape.reduce((s, x) => s + x[1], 0), start: b[6] === "start" });
    }));
    return out;
  }();
  var TYPE_FACTOR = { signature: 1, ending: 0.9, janta: 0.8, dattu: 0.8, connective: 0.6 };
  var CONF_FACTOR = { high: 1, medium: 0.8, low: 0.5, none: 0.5 };
  var KIND_WORD = { phrase: "phrase", "phrase-fragment": "fragment", "phrase-variant": "variant" };
  function phraseDevices(profile, notes, valid, opts) {
    const o = opts || {}, out = [], seen = /* @__PURE__ */ new Map(), ix = new Map(notes.map((p, k) => [p, k]));
    const attested = /* @__PURE__ */ new Set();
    const key = (ps, ds) => ps.join(",") + "/" + ds.join(",");
    const legal = (ps) => {
      for (let k = 1; k < ps.length; k++) if (!valid(ps[k - 1], ps[k])) return false;
      return true;
    };
    function add(d) {
      const k = key(d.pitches, d.durs), old = seen.get(k);
      if (old) {
        if (d.F0 > old.F0) Object.assign(old, d);
        return;
      }
      d.len = d.durs.reduce((s, x) => s + x, 0);
      seen.set(k, d);
      out.push(d);
    }
    const base = (ph, kind, variant, pitches, durs, F0, N0, extra) => Object.assign({
      id: ph.id + ":" + variant + ":" + pitches.join(","),
      base: "ph:" + ph.id,
      kind,
      variant,
      name: ph.type + " " + KIND_WORD[kind] + (variant === "octave+" ? ", octave up" : variant === "octave-" ? ", octave down" : variant === "sequence" ? " (sequence)" : variant === "inversion" ? " (inversion)" : ""),
      phraseId: ph.id,
      source: ph.source,
      type: ph.type,
      pitches,
      durs,
      F0,
      N0,
      dir: 0,
      attested: kind !== "phrase-variant"
    }, extra || {});
    const conf = CONF_FACTOR[profile.confidence] || 0.5;
    const shift = (ps, d) => {
      const out2 = [];
      for (const p of ps) {
        const k = ix.get(p);
        if (k == null || k + d < 0 || k + d >= notes.length) return null;
        out2.push(notes[k + d]);
      }
      return out2;
    };
    const mirror = (ps) => {
      const k0 = ix.get(ps[0]), out2 = [];
      for (const p of ps) {
        const k = 2 * k0 - ix.get(p);
        if (k < 0 || k >= notes.length) return null;
        out2.push(notes[k]);
      }
      return out2;
    };
    const pending = [];
    (profile.phrases || []).forEach((ph) => {
      if (!ph.pitches.every((p) => ix.has(p))) return;
      const whole = 2 * ph.weight * (TYPE_FACTOR[ph.type] || 0.6) * conf;
      const n = ph.pitches.length;
      add(base(ph, "phrase", "whole", ph.pitches, ph.durs, whole, -0.5));
      attested.add(ph.pitches.join(","));
      if (!ph.octaveCertain) [12, -12].forEach((d) => {
        const ps = ph.pitches.map((p) => p + d);
        if (ps.every((p) => ix.has(p))) {
          add(base(ph, "phrase", d > 0 ? "octave+" : "octave-", ps, ph.durs, 0.8 * whole, -0.5));
          attested.add(ps.join(","));
        }
      });
      const frags = [];
      if (n >= 5) for (let w = 3; w <= 5; w++) for (let s = 0; s + w <= n; s++) {
        if (w === n) continue;
        const ps = ph.pitches.slice(s, s + w), ds = ph.durs.slice(s, s + w);
        ds[ds.length - 1] = 1;
        add(base(ph, "phrase-fragment", "fragment@" + s, ps, ds, 0.6 * whole, -0.2));
        attested.add(ps.join(","));
        frags.push([ps, ds]);
      }
      pending.push({ ph, whole, frags });
    });
    pending.forEach(({ ph, whole, frags }) => {
      [[ph.pitches, ph.durs]].concat(frags).forEach(([ps, ds]) => [1, -1].forEach((d) => {
        const sp2 = shift(ps, d);
        if (sp2 && legal(sp2) && !attested.has(sp2.join(","))) add(base(ph, "phrase-variant", "sequence", sp2, ds, 0.3 * whole, 0.6));
      }));
      if (o.inversions) frags.forEach(([ps, ds]) => {
        const mp = mirror(ps);
        if (mp && legal(mp) && !attested.has(mp.join(",")) && mp.join(",") !== ps.join(",")) add(base(ph, "phrase-variant", "inversion", mp, ds, 0, 0.9));
      });
    });
    if (o.exceptions) (profile.exceptions || []).forEach((ph) => {
      const first = ph.pitches[0], last = ph.pitches[ph.pitches.length - 1];
      if (!ix.has(first) || !ix.has(last) || !ph.pitches.every((p) => p >= notes[0] && p <= notes[notes.length - 1])) return;
      const whole = 2 * ph.weight * (TYPE_FACTOR[ph.type] || 0.6) * conf;
      add(base(ph, "phrase", "whole", ph.pitches, ph.durs, whole, -0.5, { exception: true, anya: ph.anya }));
    });
    return out;
  }

  // src/engine/kalpana/landing.js
  var KALPANA_RANGE = [-5, 19];
  function eduppuNeighbours(raga, e) {
    const P = makeProjector(raga), pcs = new Set(raga.aro.concat(raga.avaro).map(mod12));
    if (typeof e !== "number" || !Number.isInteger(e)) return { error: "The eduppu swara must be a pitch in semitones above Sa.", code: "bad-eduppu" };
    if (!pcs.has(mod12(e))) return { error: "The eduppu swara is not a swara of " + raga.name + ".", code: "eduppu-not-in-raga" };
    const inRange = (p) => p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1];
    const span = 3 + Math.ceil(Math.abs(e) / 12);
    const find = (ext, n) => {
      for (let i = -span * n; i <= span * n; i++) if (ext(i) === e) return ext(i - 1);
      return null;
    };
    let lo = find(P.aroExt, P.nA), hi = find(P.avExt, P.nD);
    if (lo != null && !(lo < e && P.valid(lo, e))) lo = null;
    if (hi != null && !(hi > e && P.valid(hi, e))) hi = null;
    return { eduppu: e, lo: lo != null && inRange(lo) ? lo : null, hi: hi != null && inRange(hi) ? hi : null, inRange: inRange(e) };
  }
  function approachScore(e, cand, profile) {
    const pc = mod12(cand.p), ep = mod12(e);
    let F = 0;
    if (profile && (profile.landing.includes(pc) || profile.nyasa.includes(pc))) F += 0.4;
    if (cand.approach === "above" && (ep === 0 || ep === 7)) F += 0.3;
    if (cand.approach === "below" && profile && profile.jiva.includes(ep)) F += 0.3;
    return F;
  }

  // src/engine/kalpana/mora.js
  var STYLES = ["shift", "gopuccha", "srotovaha", "expand", "contract"];
  var TIMED = { expand: [0, 1, 2], contract: [2, 1, 0] };
  var timedDurs = (u, extra) => {
    const d = Array(u).fill(1);
    if (extra >= 1) d[1]++;
    if (extra >= 2) d[0]++;
    return d;
  };
  function genericTemplates(L) {
    const n = L - 1, down = Array(n).fill(-1), up = Array(n).fill(1);
    const out = [down, up, [1].concat(Array(n - 1).fill(-1)), [-1].concat(Array(n - 1).fill(1))];
    if (L === 4) out.push([-2, 1, -1], [2, -1, 1]);
    return out.filter((s) => s.length === n);
  }
  function templates(L, phrases, ix) {
    const out = [], seen = /* @__PURE__ */ new Set();
    const add = (steps, source, phraseId) => {
      const k = steps.join(",");
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ steps, source, phraseId });
    };
    phrases.forEach((ph) => {
      const js = ph.pitches.map((p) => ix(p));
      if (js.some((j) => j < 0)) return;
      const windows = [];
      if (ph.type === "ending" && js.length >= L) windows.push(js.length - L);
      for (let s = 0; s + L <= js.length; s++) windows.push(s);
      windows.forEach((s) => {
        const w = js.slice(s, s + L), steps = [];
        for (let k = 1; k < L; k++) steps.push(w[k] - w[k - 1]);
        if (Math.abs(steps[L - 2]) !== 1 || steps.some((d) => d === 0 || Math.abs(d) > 3)) return;
        add(steps, ph.type === "ending" && s === js.length - L ? "ending" : "phrase", ph.id);
      });
    });
    genericTemplates(L).forEach((s) => add(s, "generic", null));
    return out;
  }
  function moraShapes(ctx, tg, st) {
    const { notes, NN, valid, repair, LX, licence: licence2, isLeap: isLeap2, avoidsHard, phrases } = ctx;
    const ix = (p) => notes.indexOf(p), out = [];
    const legal = (js) => {
      for (let k = 1; k < js.length; k++) if (!valid(notes[js[k - 1]], notes[js[k]])) return false;
      return true;
    };
    const inRange = (js) => js.every((j) => j >= 0 && j < NN && Number.isInteger(j));
    const cache = ctx.cache.templates || (ctx.cache.templates = /* @__PURE__ */ new Map());
    {
      const lens = st === "gopuccha" ? [4, 5] : st === "srotovaha" ? [5, 6, 7] : [3, 4, 5];
      lens.forEach((L) => {
        if (!cache.has(L)) cache.set(L, templates(L, phrases, ix));
        cache.get(L).forEach((tp) => {
          const full3 = [tg];
          for (let k = tp.steps.length - 1; k >= 0; k--) full3.unshift(full3[0] - tp.steps[k]);
          if (!inRange(full3) || !legal(full3)) return;
          const deltas = st === "identical" ? [0] : [1, -1];
          deltas.forEach((delta) => {
            const trim = (k) => st === "gopuccha" ? k : st === "srotovaha" ? 2 - k : 0;
            let adjusted = false;
            const stmts = [];
            for (let k = 0; k < 3; k++) {
              const base = 2 - k, tries = delta ? [base * delta, base * delta + Math.sign(delta)] : [0];
              let got = null;
              for (const d of base ? tries : [0]) {
                const js = full3.map((j) => j + d).slice(trim(k));
                if (inRange(js) && legal(js)) {
                  got = { js, adj: 0 };
                  break;
                }
              }
              if (!got && base) {
                const naive = full3.map((j) => j + base * delta).slice(trim(k));
                if (inRange(naive)) {
                  const r = repair(naive.map((j) => notes[j]));
                  const js = r.pitches.map(ix), n = r.adjusted.filter(Boolean).length;
                  if (r.feasible && n <= 1 && inRange(js) && legal(js)) got = { js, adj: n };
                }
              }
              if (!got) return;
              if (got.adj) adjusted = true;
              stmts.push(got.js);
            }
            if (stmts[2][stmts[2].length - 1] !== tg) return;
            const keys = stmts.map((s) => s.join(","));
            if (st !== "identical" && (keys[0] === keys[1] || keys[1] === keys[2] || keys[0] === keys[2])) return;
            for (let k = 0; k < 2; k++) {
              const a = stmts[k][stmts[k].length - 1], b = stmts[k + 1][0];
              if (a === b || !valid(notes[a], notes[b]) || Math.abs(notes[b] - notes[a]) > 7) return;
            }
            const flat = stmts[0].concat(stmts[1], stmts[2]);
            if (avoidsHard(flat.map((j) => notes[j]))) return;
            let unl = 0;
            for (let k = 1; k < flat.length; k++) if (isLeap2(flat[k - 1], flat[k]) && !licence2(LX, notes[flat[k - 1]], notes[flat[k]])) unl++;
            let idiomF = 0;
            if (ctx.moveIdiom) for (let k = 1; k < flat.length; k++) idiomF += ctx.moveIdiom(notes[flat[k - 1]], notes[flat[k]]);
            out.push({ style: st, stmts, flat, delta, adjusted, unl, idiomF, template: tp.source, phraseId: tp.phraseId, steps: tp.steps, stepwise: tp.steps.every((d) => Math.abs(d) === 1) });
          });
        });
      });
    }
    return out;
  }
  function moraOptions(ctx, tg) {
    const { notes, hard, badLeap, sameDirLeaps, slots, per, D, e, style, feasibleInto } = ctx;
    const styles = style === "auto" || !style ? STYLES : [style], out = [];
    styles.forEach((st) => {
      const timed = TIMED[st], base = timed ? "shift" : st, key = tg + ":" + base;
      if (!ctx.cache.has(key)) ctx.cache.set(key, moraShapes(ctx, tg, base));
      ctx.cache.get(key).forEach((sh) => {
        const { stmts, flat, delta, adjusted, unl } = sh;
        if (timed && stmts[0].length < 3) return;
        const durs = timed ? stmts.map((s, k) => timedDurs(s.length, timed[k])) : null;
        if (hard) {
          for (let k = 1; k < flat.length; k++) if (badLeap(flat[k - 1], flat[k]) || k >= 2 && sameDirLeaps(flat[k - 2], flat[k - 1], flat[k])) return;
        }
        const ref = e != null ? e : notes[tg];
        const s1 = stmts[0].map((j) => notes[j]), lead = s1[0] !== ref ? s1[0] - ref : s1.reduce((a, b) => a + b, 0) / s1.length - ref;
        const toward = st === "identical" || lead === 0 || (lead > 0 ? delta > 0 : delta < 0);
        if (!toward && D.T < 1) return;
        const lens3 = durs ? durs.map((d) => d.reduce((a, b) => a + b, 0)) : stmts.map((s) => s.length), stepwise = sh.stepwise, tp = { source: sh.template };
        for (let q = 0; q <= per; q++) {
          const total = lens3[0] + lens3[1] + lens3[2] + 2 * q, B = slots - total;
          if (B < Math.max(2, per) || total > 0.6 * slots) continue;
          if (!feasibleInto(B, stmts[0][0], stmts[0][1])) continue;
          const onBeat = B % per === 0 && (lens3[0] + q) % per === 0 && (lens3[1] + q) % per === 0;
          let unres = 0;
          for (let k = 1; k + 2 < flat.length; k++) {
            const d = flat[k] - flat[k - 1];
            if (Math.abs(d) < 2) continue;
            const held = q > 0 && (k === stmts[0].length - 1 || k === stmts[0].length + stmts[1].length - 1);
            let ok = held;
            for (let m = k + 1; m <= k + 2 && !ok; m++) {
              const d2 = flat[m] - flat[m - 1];
              if (m === k + 1 && d2 === 0 || Math.abs(d2) === 1 && Math.sign(d2) === -Math.sign(d)) ok = true;
            }
            if (!ok) unres++;
          }
          const F = (tp.source !== "generic" ? 1 : 0) + (stepwise ? 0.6 : 0) + (onBeat ? 0.9 : 0) + (st === "shift" ? 0.3 : 0) + (q <= Math.max(1, per / 2) ? 0.3 : 0) - 0.5 * unl - 0.6 * unres - (adjusted ? 0.4 : 0) + sh.idiomF - (timed ? 0.3 : 0);
          const N = (tp.source === "generic" ? 0.5 : 0) + (toward ? 0 : 0.5) + (st === "gopuccha" || st === "srotovaha" || timed ? 0.6 : 0) + (onBeat ? 0 : 0.7);
          out.push(Object.assign({ style: st, stmts, q, B, F, N, delta, toward, adjusted, template: sh.template, phraseId: sh.phraseId, steps: sh.steps }, durs ? { durs } : {}));
        }
      });
    });
    return out;
  }
  function korvaiOptions(ctx, tg) {
    const { notes, NN, valid, slots, per, feasibleInto, hard, badLeap, sameDirLeaps, avoidsHard } = ctx;
    const out = [];
    const legal = (js) => {
      for (let k = 1; k < js.length; k++) {
        if (js[k] === js[k - 1]) return false;
        if (!valid(notes[js[k - 1]], notes[js[k]]) || Math.abs(notes[js[k]] - notes[js[k - 1]]) > 7) return false;
        if (hard && (badLeap(js[k - 1], js[k]) || k >= 2 && sameDirLeaps(js[k - 2], js[k - 1], js[k]))) return false;
      }
      return true;
    };
    for (const n of [3, 4, 5]) for (const rho of [1, 2]) for (const Q of [0, 1, 2]) {
      const run = (b) => {
        const r = [];
        for (let k = n - 1; k >= 0; k--) r.push(b + k);
        return r;
      };
      const parts = [];
      let ok = true;
      for (let u = 0; u < 3 && ok; u++) {
        const b = tg + 2 + (2 - u), js = [], durs = [];
        for (let h = rho; h >= 1; h--) run(b).forEach((j) => {
          js.push(j);
          durs.push(h + 1);
        });
        [0, 1, 2].forEach((d) => run(b - d).forEach((j, k) => {
          js.push(j);
          durs.push(k === n - 1 && d < 2 ? 2 : 1);
        }));
        if (u < 2) durs[durs.length - 1] += Q;
        if (js.some((j) => j < 0 || j >= NN)) ok = false;
        parts.push({ js, durs });
      }
      if (!ok) continue;
      const flat = parts[0].js.concat(parts[1].js, parts[2].js);
      if (!legal(flat) || flat[flat.length - 1] !== tg || avoidsHard(flat.map((j) => notes[j]))) continue;
      const total = parts.reduce((s, p) => s + p.durs.reduce((a, b) => a + b, 0), 0), B = slots - total;
      if (B < Math.max(2, per) || !feasibleInto(B, flat[0], flat[1], true)) continue;
      const U = parts[0].durs.reduce((a, b) => a + b, 0);
      const F = 1 + (B % per === 0 ? 0.5 : 0) + (U % per === 0 ? 0.5 : 0) - 0.1 * Q;
      out.push({ style: "korvai", parts, B, F, N: 0.4, n, rho, Q, stmts: [parts[0].js, parts[1].js, parts[2].js], q: Q, delta: 1 });
    }
    return out;
  }

  // src/engine/kalpana/leaps.js
  var CONSONANT = /* @__PURE__ */ new Set([5, 7, 12]);
  var BUDGET = [[0, 0], [0.5, 0.5], [1, 1], [1.5, 2], [2, 3]];
  function leapBudget(T) {
    for (let k = 1; k < BUDGET.length; k++) {
      const [t0, b0] = BUDGET[k - 1], [t1, b1] = BUDGET[k];
      if (T <= t1) return b0 + (b1 - b0) * (T - t0) / (t1 - t0);
    }
    return BUDGET[BUDGET.length - 1][1];
  }
  var maxLeapFor = (T) => 7;
  function leapContext(profile, T, level) {
    const structural = /* @__PURE__ */ new Set([0, 7]);
    if (profile) [profile.nyasa, profile.jiva, profile.landing].forEach((a) => (a || []).forEach((pc) => structural.add(pc)));
    return { T, level, hard: level >= 2, maxLeap: level >= 2 ? maxLeapFor(T) : 12, structural, alpa: new Set(profile ? profile.alpa || [] : []), budget: leapBudget(T), regCap: T < 1 ? 9 : 12 };
  }
  var isLeap = (ia, ib) => Math.abs(ib - ia) >= 2;
  function licence(LX, a, b, tag) {
    if (tag && tag.phrase) return "phrase";
    if (LX.structural.has(mod12(b)) && Math.abs(b - a) <= 7) return "structural";
    if (CONSONANT.has(Math.abs(b - a))) return "consonant";
    if (tag && tag.arp && LX.T >= 1) return "arpeggio";
    return null;
  }
  function forbiddenLeap(LX, a, b) {
    const s = Math.abs(b - a);
    if (s === 6) return "tritone";
    if (s > 12) return "wide";
    if (s > maxLeapFor(LX.T) && s !== 12) return "large";
    if (LX.alpa.has(mod12(b))) return "alpa";
    return null;
  }
  function blocked(LX, a, b) {
    if (LX.level <= 0) return false;
    const s = Math.abs(b - a);
    if (s > 12 || s > 9 && s !== 12) return true;
    if (LX.level < 2) return false;
    return s === 6 || s > LX.maxLeap && s !== 12 || LX.alpa.has(mod12(b));
  }
  var inside = (seq, k) => seq[k].g != null && seq[k].g === seq[k - 1].g;
  var tagOf = (seq, k) => inside(seq, k) ? { phrase: !!seq[k].phrase, arp: !!seq[k].arp } : null;
  function resolved(seq, k) {
    const d = seq[k].i - seq[k - 1].i;
    if (seq[k].dur >= 2) return true;
    for (let m = k + 1; m <= k + 2 && m < seq.length; m++) {
      const e = seq[m].i - seq[m - 1].i;
      if (m === k + 1 && e === 0) return true;
      if (Math.abs(e) === 1 && Math.sign(e) === -Math.sign(d)) return true;
    }
    return false;
  }
  function leapTerms(LX, seq, from, countTo) {
    let unl = 0, dbl = 0, unres = 0;
    for (let k = 1; k < seq.length; k++) {
      const d = seq[k].i - seq[k - 1].i;
      if (Math.abs(d) < 2) continue;
      const tag = tagOf(seq, k), ph = !!(tag && tag.phrase);
      if (k >= from && k < countTo) {
        if (!licence(LX, seq[k - 1].p, seq[k].p, tag)) unl++;
        if (!ph && k >= 2) {
          const d0 = seq[k - 1].i - seq[k - 2].i, t0 = tagOf(seq, k - 1);
          if (Math.abs(d0) >= 2 && Math.sign(d0) === Math.sign(d) && !(t0 && t0.phrase)) dbl++;
        }
      }
      if (ph) continue;
      const close = k + 2;
      if (close < seq.length && close >= from && !resolved(seq, k)) unres++;
    }
    return { unl, dbl, unres };
  }
  function internalTerms(LX, cn) {
    return leapTerms(LX, cn, 1, cn.length);
  }
  function boundaryTerms(LX, tail, cn, after, countAfter) {
    const T0 = tail.length, E = T0 + cn.length, len = E + after.length;
    const at = (k) => k < T0 ? tail[k] : k < E ? cn[k - T0] : after[k - E];
    const mv = (k) => at(k).i - at(k - 1).i;
    const inPhrase = (k) => {
      const a = at(k), b = at(k - 1);
      return a.g === b.g && a.g != null && !!a.phrase;
    };
    let unl = 0, dbl = 0, unres = 0;
    const counted = countAfter && after.length ? [T0, E] : [T0];
    for (const k of counted) {
      if (k < 1 || k >= len || Math.abs(mv(k)) < 2) continue;
      const a = at(k - 1), b = at(k), tag = a.g === b.g ? { phrase: !!b.phrase, arp: !!b.arp } : null;
      if (!licence(LX, a.p, b.p, tag)) unl++;
    }
    for (const k of countAfter && after.length ? [T0, T0 + 1, E] : [T0, T0 + 1]) {
      if (k < 2 || k >= len || k === T0 + 1 && k >= E) continue;
      const d = mv(k), d0 = mv(k - 1);
      if (Math.abs(d) >= 2 && Math.abs(d0) >= 2 && Math.sign(d) === Math.sign(d0) && !inPhrase(k) && !inPhrase(k - 1)) dbl++;
    }
    for (let k = Math.max(1, T0 - 2); k < len; k++) {
      const d = mv(k), close = k + 2;
      if (Math.abs(d) < 2 || close >= len || close < T0 || inPhrase(k)) continue;
      if (k >= T0 + 1 && close <= E - 1) continue;
      if (at(k).dur >= 2) continue;
      let ok = false;
      for (let m = k + 1; m <= close; m++) {
        const e = mv(m);
        if (m === k + 1 && e === 0 || Math.abs(e) === 1 && Math.sign(e) === -Math.sign(d)) {
          ok = true;
          break;
        }
      }
      if (!ok) unres++;
    }
    return { unl, dbl, unres };
  }
  function leapStats(LX, line, after, slots) {
    const seq = line.concat(after || []), list = [];
    let licensed = 0, unlicensed = 0, unresolved = 0, tritone = 0, wide = 0, large = 0, alpa = 0, double = 0, overFifth = 0;
    for (let k = 1; k < line.length; k++) {
      const d = seq[k].i - seq[k - 1].i;
      if (Math.abs(d) < 2) continue;
      const tag = tagOf(seq, k), ph = !!(tag && tag.phrase);
      const lic = licence(LX, seq[k - 1].p, seq[k].p, tag);
      const res = ph || k + 2 >= seq.length ? true : resolved(seq, k);
      if (lic) licensed++;
      else unlicensed++;
      if (!res) unresolved++;
      if (!ph) {
        const f = forbiddenLeap(LX, seq[k - 1].p, seq[k].p);
        if (f === "tritone") tritone++;
        else if (f === "wide") wide++;
        else if (f === "large") large++;
        else if (f === "alpa") alpa++;
        const sz = Math.abs(seq[k].p - seq[k - 1].p);
        if (sz > 7 && sz !== 12) overFifth++;
        if (k >= 2) {
          const d0 = seq[k - 1].i - seq[k - 2].i, t0 = tagOf(seq, k - 1);
          if (Math.abs(d0) >= 2 && Math.sign(d0) === Math.sign(d) && !(t0 && t0.phrase)) double++;
        }
      }
      list.push({ from: seq[k - 1].p, to: seq[k].p, at: k, licence: lic, resolved: res });
    }
    const total = list.length;
    return { total, licensed, unlicensed, unresolved, perEight: slots ? unlicensed * 8 / slots : 0, outsidePhrases: { tritone, wide, large, alpa, double, overFifth }, list };
  }

  // src/engine/kalpana/phrases.js
  function planPhrases(slots, per, angas, c, rand) {
    if (slots < 6) return null;
    const A = slots / per;
    const lens = angas && angas.length ? angas : A % 8 === 0 ? [4, 2, 2] : [2];
    const bounds = [0];
    for (let k = 0, x = 0; x < A - 1e-9; k++) {
      x += lens[k % lens.length];
      bounds.push(Math.min(slots, Math.round(x * per)));
    }
    if (bounds[bounds.length - 1] !== slots) bounds.push(slots);
    const target = per <= 1 ? 4 : per === 2 ? 8 : per === 3 ? 9 : 12;
    const ends = [];
    let at = 0;
    while (at < slots) {
      const want = target * (0.8 + 0.45 * rand()), opts = bounds.filter((b) => b > at);
      let best = opts[opts.length - 1], bd = Infinity;
      for (const b of opts) {
        const len = b - at, rest = slots - b;
        if (rest > 0 && rest < 0.5 * target) continue;
        const d = Math.abs(len - want);
        if (d < bd) {
          bd = d;
          best = b;
        }
      }
      if (best < slots && rand() < 0.35 * c) {
        const shifted = best + (rand() < 0.5 ? -per : per);
        if (shifted - at >= 0.6 * target && slots - shifted >= 0.5 * target) best = shifted;
      }
      ends.push(best);
      at = best;
    }
    const plan = [];
    let a = 0;
    ends.forEach((b, k) => {
      const len = b - a;
      let r = per >= 4 && len >= 14 ? 2 : 1;
      if (k < ends.length - 1 && k > 0 && rand() < 0.33) r = 0;
      r = Math.min(r, Math.floor(len / 3));
      plan.push({ a, e: b - r, r, next: b });
      a = b;
    });
    if (plan.length < 2 && plan[0].e - plan[0].a < 4) return null;
    return plan;
  }
  function focusPlan(plan, candidates, pos, startPitch, landing, focus, rand) {
    if (!plan || !candidates.length) return;
    const near = (p) => candidates.reduce((b, q) => Math.abs(q - p) < Math.abs(b - p) ? q : b, candidates[0]);
    const gsize = plan.length >= 4 ? 2 : 1, groups = Math.ceil(plan.length / gsize);
    const ci = (p) => candidates.indexOf(near(p));
    let k0 = focus != null ? ci(focus) : ci(startPitch + 3 + Math.floor(rand() * 5));
    let dir = 1;
    const foci = [];
    for (let g = 0; g < groups; g++) {
      if (g === groups - 1 && groups > 1) {
        foci.push(landing);
        break;
      }
      foci.push(candidates[k0]);
      if (k0 + dir < 0 || k0 + dir >= candidates.length || candidates[k0 + dir] > 16) dir = -dir;
      if (rand() < 0.75) k0 = Math.max(0, Math.min(candidates.length - 1, k0 + dir));
    }
    plan.forEach((sg, k) => {
      sg.group = Math.floor(k / gsize);
      sg.focal = foci[Math.min(sg.group, foci.length - 1)];
      const prevF = k === 0 ? startPitch : plan[k - 1].focal;
      sg.contour = sg.focal > prevF + 2 ? rand() < 0.5 ? "asc" : "arch" : "desc";
      sg.focalPos = pos(sg.focal);
      sg.startPos = k === 0 ? pos(startPitch) : null;
    });
  }
  function expectedPos(sg, u) {
    const f = sg.focalPos, h = 3;
    if (sg.startPos != null) return sg.startPos + (f - sg.startPos) * u;
    if (sg.contour === "asc") return f - h * (1 - u);
    if (sg.contour === "arch") return f + h * Math.sin(Math.PI * u) - (1 - u);
    return f + h * (1 - u);
  }
  function focalCandidates(notes, profile, pcs) {
    const want = new Set([0, 7].filter((pc) => pcs.includes(pc)));
    if (profile) ["nyasa", "landing", "jiva"].forEach((k) => (profile[k] || []).forEach((pc) => want.add(pc)));
    const bad = new Set(profile ? (profile.alpa || []).concat(profile.avoidLanding || [], profile.notNyasa || []) : []);
    return notes.filter((p) => want.has(mod12(p)) && !bad.has(mod12(p)) && p >= -3 && p <= 17);
  }

  // src/engine/kalpana/index.js
  var fail = (code, error) => ({ error, code });
  var swaraName = (raga, p) => (raga.labels[mod12(p)] || "?") + (p >= 12 ? "'" : p < 0 ? "." : "");
  var PHRASE_KINDS = /* @__PURE__ */ new Set(["phrase", "phrase-fragment"]);
  var GENERIC_FACTOR = { high: 0.5, medium: 0.7, low: 1, none: 1 };
  var JANTA = /* @__PURE__ */ new Set(["janta", "janta3"]);
  var DATTU = /* @__PURE__ */ new Set(["dattu"]);
  var JD_FACTOR = { avoid: 0.2, suits: 1.2 };
  var targetShare = (T) => 0.7 - 0.2 * T;
  var MORA_STYLES = ["auto", "shift", "gopuccha", "srotovaha", "expand", "contract", "identical"];
  function containsRun(seq, pat, from) {
    for (let s = Math.max(0, (from || 0) - pat.length + 1); s + pat.length <= seq.length; s++) {
      let k = 0;
      while (k < pat.length && seq[s + k] === pat[k]) k++;
      if (k === pat.length) return true;
    }
    return false;
  }
  function runAcross(look, ps, pat) {
    const L = look.length, n = L + ps.length, at = (k) => k < L ? look[k] : ps[k - L];
    for (let s = Math.max(0, L - pat.length + 1); s + pat.length <= n; s++) {
      let k = 0;
      while (k < pat.length && at(s + k) === pat[k]) k++;
      if (k === pat.length) return true;
    }
    return false;
  }
  var DEVICE_CACHE = /* @__PURE__ */ new WeakMap();
  function cachedTables(raga, profile, key, make) {
    let ent = DEVICE_CACHE.get(raga);
    if (!ent || ent.profile !== profile) {
      ent = { profile, map: /* @__PURE__ */ new Map(), mora: /* @__PURE__ */ new Map() };
      DEVICE_CACHE.set(raga, ent);
    }
    if (!ent.map.has(key)) ent.map.set(key, Object.assign(make(), { moraCache: ent.mora }));
    return ent.map.get(key);
  }
  function profileCoverage(profile, phraseCount) {
    if (!profile) return "none";
    if (phraseCount) return "phrases";
    const roles = ["nyasa", "jiva", "alpa", "notNyasa", "avoidLanding", "avoid"].some((k) => (profile[k] || []).length);
    const landing = (profile.landing || []).join(",") !== "0,7";
    return roles || landing ? "roles-only" : "none";
  }
  function kalpanaRound(raga, opts) {
    const o = opts || {}, D = dial(o.T == null ? 1 : o.T), top = D.T < 1.5 ? 2 : 1;
    let res;
    const planned = o.phrases !== false;
    outer: for (let level = top; level >= 0; level--) {
      for (const plan of planned ? [true, false] : [false]) {
        res = build(raga, o, level, plan);
        if (!res.error || res.code !== "unreachable") break outer;
      }
    }
    if (!res.error && res.level < top) res.stats.relaxed = "leaps";
    if (!res.error) delete res.level;
    return res;
  }
  function build(raga, o, level, planned) {
    const hard = level >= 2;
    const aksharas = o.aksharas, per = o.perAkshara, D = dial(o.T == null ? 1 : o.T), rand = rng(o.seed || 1);
    const slots = aksharas * per, startPitch = o.startPitch, ending = o.ending || "auto";
    const Pj = makeProjector(raga);
    const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
    const notes = [];
    for (let oct = -1; oct <= 1; oct++) pcs.forEach((pc) => {
      const p = pc + 12 * oct;
      if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p);
    });
    notes.sort((a, b) => a - b);
    const NN = notes.length, ix = (p) => notes.indexOf(p);
    const pos = (p) => {
      const k = ix(p);
      if (k >= 0) return k;
      let n = 0;
      while (n < NN && notes[n] < p) n++;
      return n - 0.5;
    };
    const s0 = ix(startPitch);
    if (!(slots >= 1)) return fail("bad-length", "The round needs at least one slot.");
    if (o.moraStyle != null && !MORA_STYLES.includes(o.moraStyle)) return fail("bad-mora-style", "Mora style must be one of " + MORA_STYLES.join(", ") + ".");
    if (s0 < 0) return fail("start-not-in-raga", "The opening swara is not a swara of " + raga.name + " inside the kalpana range (mandra Pa to tara Pa).");
    const useEduppu = o.eduppuPitch != null, e = o.eduppuPitch;
    let targets2;
    if (useEduppu) {
      const nb = eduppuNeighbours(raga, e);
      if (nb.error) return fail(nb.code, nb.error);
      if (!nb.inRange) return fail("eduppu-out-of-range", "The eduppu swara " + swaraName(raga, e) + " is outside the kalpana range (mandra Pa to tara Pa).");
      targets2 = [{ p: nb.lo, approach: "below" }, { p: nb.hi, approach: "above" }].filter((x) => x.p != null && ix(x.p) >= 0);
      if (!targets2.length) return fail("no-neighbour", "No swara of " + raga.name + " inside the kalpana range steps legally into the eduppu swara.");
    } else {
      if (o.targetPitch == null) return fail("no-landing", "Give eduppuPitch, the swara the composition resumes on.");
      if (ix(o.targetPitch) < 0) return fail("target-not-in-raga", "The landing swara is not a swara of " + raga.name + " inside the kalpana range.");
      targets2 = [{ p: o.targetPitch, approach: null }];
    }
    const profile = getProfile(raga), LX = leapContext(profile, D.T, level);
    const moveKey = (a, b) => mod12(a) * 64 + (b - a + 32);
    const attestedMoves = /* @__PURE__ */ new Set();
    (profile ? profile.phrases : []).forEach((ph) => {
      for (let k = 1; k < ph.pitches.length; k++) if (ph.pitches[k] !== ph.pitches[k - 1]) attestedMoves.add(moveKey(ph.pitches[k - 1], ph.pitches[k]));
    });
    const landing = new Set(profile ? profile.landing : [0, 7]);
    const restBad = new Set(profile ? profile.avoidLanding.concat(profile.notNyasa) : []);
    const alpa = new Set(profile ? profile.alpa : []), jiva = new Set(profile ? profile.jiva : []);
    const hardAvoid = profile ? profile.avoid.filter((a) => a.strength === "hard").map((a) => a.pitches) : [];
    const softAvoid = profile ? profile.avoid.filter((a) => a.strength !== "hard").map((a) => a.pitches) : [];
    const avoidsHard = (seq, from) => hardAvoid.some((p) => containsRun(seq, p, from));
    const badLeap = (ia, ib) => isLeap(ia, ib) && blocked(LX, notes[ia], notes[ib]);
    const sameDirLeaps = (ia, ib, ic) => isLeap(ia, ib) && isLeap(ib, ic) && Math.sign(ib - ia) === Math.sign(ic - ib);
    const cls = (ia, ib) => isLeap(ia, ib) ? ib > ia ? 1 : 2 : 0;
    const clash = (m2, m22) => hard && m2 !== 0 && m2 === m22;
    const NS = NN * 3;
    const joinRule = level >= 1;
    const joinOK = (ia, ib, loose, pa, pb) => {
      if (!joinRule) return true;
      const a = pa != null ? pa : notes[ia], b = pb != null ? pb : notes[ib], s = Math.abs(b - a), d = Math.abs(ib - ia);
      if (d < 2 || d < 3 && s <= 4) return true;
      if (attestedMoves.has(moveKey(a, b))) return true;
      return !!loose && s <= 7 && s !== 6;
    };
    const tables = cachedTables(raga, profile, level + (D.T >= 1 ? "i" : "") + (o.allowExceptions ? "x" : ""), makeTables);
    const { app, appS, phr, G, gen, genS, moraCache, idiom, idiomKey } = tables;
    const moveIdiom = (a, b) => {
      const s = Math.abs(b - a), size = s > 4 && s !== 12 && isLeap(pos(a), pos(b)) ? -0.15 * (s - 4) : 0;
      if (!idiom || a === b || idiom.has(idiomKey(a, b))) return size;
      return size + (s > 2 && isLeap(pos(a), pos(b)) ? -0.8 : -0.15);
    };
    const entryOK = (gp, i2, m2, S) => (S ? gp.allowS : gp.allow)[m2] >> i2 & 1;
    function makeTables() {
      const cellRows = (loose) => CELLS.map((c) => {
        const row = new Array(NN);
        if (c.start && !loose) return row;
        for (let i2 = 0; i2 < NN; i2++) {
          let cur = i2, back = -1, ok = true;
          const seq = [];
          for (const [dl, du] of c.shape) {
            const j = cur + dl;
            if (j < 0 || j >= NN || !Pj.valid(notes[cur], notes[j]) || badLeap(cur, j) || hard && back >= 0 && sameDirLeaps(back, cur, j)) {
              ok = false;
              break;
            }
            if (cur === i2 && back < 0 && !joinOK(i2, j, loose)) {
              ok = false;
              break;
            }
            seq.push({ j, dur: du });
            back = cur;
            cur = j;
          }
          if (ok && hardAvoid.length && avoidsHard([notes[i2]].concat(seq.map((x) => notes[x.j])), 0)) ok = false;
          if (!ok) {
            row[i2] = null;
            continue;
          }
          const tpl = seq.map((x) => ({ p: notes[x.j], i: x.j, dur: x.dur, g: -9, arp: c.base === "arp", phrase: false }));
          row[i2] = { end: cur, seq, tpl, ps: tpl.map((x) => x.p), int: internalTerms(LX, tpl), mf: cls(i2, seq[0].j), me: cls(back, cur) };
        }
        return row;
      });
      const app2 = cellRows(false), appS2 = cellRows(true);
      const phr2 = phraseDevices(profile || { phrases: [] }, notes, Pj.valid, { inversions: D.T >= 1, exceptions: !!o.allowExceptions });
      const anch = [];
      phr2.forEach((dv) => {
        const js = dv.pitches.map(pos), n = js.length;
        if (!dv.attested) {
          for (let k = 1; k < n; k++) if (badLeap(js[k - 1], js[k]) || hard && k >= 2 && sameDirLeaps(js[k - 2], js[k - 1], js[k])) return;
        }
        if (hardAvoid.length && avoidsHard(dv.pitches, 0)) return;
        const first = js[0], janta = n > 1 && dv.pitches[0] === dv.pitches[1];
        let mask = 0, maskS = 0;
        for (let i2 = 0; i2 < NN; i2++) {
          if (!Pj.valid(notes[i2], dv.pitches[0]) || i2 === first && !janta || badLeap(i2, first)) continue;
          if (hard && !dv.attested && n > 1 && sameDirLeaps(i2, first, js[1])) continue;
          if (hardAvoid.length && avoidsHard([notes[i2]].concat(dv.pitches), 1)) continue;
          if (joinOK(i2, first, true, notes[i2], dv.pitches[0])) maskS |= 1 << i2;
          if (joinOK(i2, first, false, notes[i2], dv.pitches[0])) mask |= 1 << i2;
        }
        if (!maskS) return;
        const tpl = js.map((j, k) => ({ p: dv.pitches[k], i: j, dur: dv.durs[k], g: -9, phrase: dv.kind !== "phrase-variant", arp: false }));
        anch.push({ dv, tpl, ps: dv.pitches, int: internalTerms(LX, tpl), first, end: js[n - 1], me: n > 1 ? cls(js[n - 2], js[n - 1]) : 0, len: dv.len, mask, maskS });
      });
      const groups = /* @__PURE__ */ new Map();
      anch.forEach((a) => {
        const k = a.mask + ":" + a.maskS + ":" + a.first;
        if (!groups.has(k)) {
          const allowOf = (M) => [0, 1, 2].map((m2) => {
            let b = 0;
            for (let i2 = 0; i2 < NN; i2++) if (M >> i2 & 1 && !clash(m2, cls(i2, a.first))) b |= 1 << i2;
            return b;
          });
          groups.set(k, { allow: allowOf(a.mask), allowS: allowOf(a.maskS), first: a.first, devs: [] });
        }
        groups.get(k).devs.push(a);
      });
      const G2 = Array.from(groups.values());
      G2.forEach((gp) => {
        const seen = /* @__PURE__ */ new Set();
        gp.moves = [];
        gp.devs.forEach((a) => {
          const k = a.len * 1e3 + a.end * 3 + a.me;
          if (!seen.has(k)) {
            seen.add(k);
            gp.moves.push([a.len, a.end * 3 + a.me]);
          }
        });
      });
      const genOf = (A) => {
        const out = [];
        for (let s = 0; s < NS; s++) {
          const i2 = s / 3 | 0, m2 = s % 3, seen = /* @__PURE__ */ new Set(), mv = [];
          CELLS.forEach((c, ci) => {
            const a = A[ci][i2];
            if (!a || clash(m2, a.mf)) return;
            const k = c.len * 1e3 + a.end * 3 + a.me;
            if (!seen.has(k)) {
              seen.add(k);
              mv.push(c.len, a.end * 3 + a.me);
            }
          });
          out.push(Int32Array.from(mv));
        }
        return out;
      };
      const gen2 = genOf(app2), genS2 = genOf(appS2);
      const idiom2 = /* @__PURE__ */ new Set(), idiomKey2 = (a, b) => mod12(a) * 26 + mod12(b) * 2 + (b > a ? 1 : 0);
      (profile ? profile.phrases : []).forEach((ph) => {
        for (let k = 1; k < ph.pitches.length; k++) if (ph.pitches[k] !== ph.pitches[k - 1]) idiom2.add(idiomKey2(ph.pitches[k - 1], ph.pitches[k]));
      });
      const hasIdiom = idiom2.size > 0;
      for (let k = 1; k < NN; k++) {
        if (Pj.valid(notes[k - 1], notes[k])) idiom2.add(idiomKey2(notes[k - 1], notes[k]));
        if (Pj.valid(notes[k], notes[k - 1])) idiom2.add(idiomKey2(notes[k], notes[k - 1]));
      }
      return { app: app2, appS: appS2, phr: phr2, G: G2, gen: gen2, genS: genS2, idiom: hasIdiom ? idiom2 : null, idiomKey: idiomKey2 };
    }
    const masks = (row) => {
      const b = [0, 0, 0];
      for (let s = 0; s < NS; s++) if (row[s]) b[s % 3] |= 1 << (s / 3 | 0);
      return b;
    };
    const plan = planned ? planPhrases(slots, per, o.angas, D.c, rng((o.seed || 1) * 7919 + 17 >>> 0)) : null;
    if (planned && !plan) return fail("unreachable", "too short for a phrase plan");
    const segAt = new Int16Array(slots + 1).fill(-1), holdAt = new Int16Array(slots + 1).fill(-1), isStart = new Uint8Array(slots + 1);
    if (plan) plan.forEach((sg, k) => {
      for (let u = sg.a; u < sg.e; u++) segAt[u] = k;
      for (let u = sg.e; u < sg.next; u++) holdAt[u] = k;
      if (k > 0 && plan[k - 1].r > 0) isStart[sg.a] = 1;
    });
    else for (let u = 0; u < slots; u++) segAt[u] = 0;
    const segEnd = (u) => plan ? plan[segAt[u]].e : slots;
    const holdable = (i2) => !restBad.has(mod12(notes[i2])) && !alpa.has(mod12(notes[i2]));
    const fwd = Array.from({ length: slots + 1 }, () => new Uint8Array(NS));
    [1, 2].forEach((d02) => {
      if (d02 <= slots && (!plan || d02 <= plan[0].e)) fwd[d02][s0 * 3] = 1;
    });
    for (let t2 = 1; t2 < slots; t2++) {
      const F = fwd[t2], hk = holdAt[t2];
      if (hk >= 0) {
        if (t2 === plan[hk].e) {
          for (let s = 0; s < NS; s++) if (F[s] && holdable(s / 3 | 0)) for (let u = t2 + 1; u <= plan[hk].next; u++) fwd[u][s] = 1;
        }
        continue;
      }
      const lim = segEnd(t2), St = isStart[t2], GN = St ? genS : gen;
      let anyState = false;
      for (let s = 0; s < NS; s++) if (F[s]) {
        anyState = true;
        const mv = GN[s];
        for (let k = 0; k < mv.length; k += 2) if (t2 + mv[k] <= lim) fwd[t2 + mv[k]][mv[k + 1]] = 1;
      }
      if (!anyState) continue;
      const R = masks(F);
      for (const gp of G) {
        const A = St ? gp.allowS : gp.allow;
        if (!(R[0] & A[0] | R[1] & A[1] | R[2] & A[2])) continue;
        for (const [L, es] of gp.moves) if (t2 + L <= lim) fwd[t2 + L][es] = 1;
      }
    }
    const reach2 = (t2, i2) => fwd[t2][i2 * 3] || fwd[t2][i2 * 3 + 1] || fwd[t2][i2 * 3 + 2];
    const moraAllowed = ending !== "free" && (ending === "mora" || ending === "korvai" || aksharas >= 7) && slots >= 8;
    const intoMora = (i2, m2, f, f1, loose) => i2 !== f && Pj.valid(notes[i2], notes[f]) && !badLeap(i2, f) && !(hard && sameDirLeaps(i2, f, f1)) && !clash(m2, cls(i2, f)) && joinOK(i2, f, !!loose);
    const afterHold = (B2) => B2 > 0 && holdAt[B2 - 1] >= 0;
    const enter = [], enterS = [], leapInto = [];
    for (let f = 0; f < NN; f++) {
      const em = (loose) => [0, 1, 2].map((m2) => {
        let b = 0;
        for (let i2 = 0; i2 < NN; i2++) if (i2 !== f && Pj.valid(notes[i2], notes[f]) && !badLeap(i2, f) && !clash(m2, cls(i2, f)) && joinOK(i2, f, loose)) b |= 1 << i2;
        return b;
      });
      enter.push(em(false));
      enterS.push(em(true));
      let up = 0, down = 0;
      for (let i2 = 0; i2 < NN; i2++) {
        if (f - i2 >= 2) up |= 1 << i2;
        if (i2 - f >= 2) down |= 1 << i2;
      }
      leapInto.push([up, down]);
    }
    const fwdMasks = /* @__PURE__ */ new Map();
    const feasibleInto = (B2, f, f1, loose) => {
      if (!fwdMasks.has(B2)) fwdMasks.set(B2, masks(fwd[B2]));
      const R = fwdMasks.get(B2), E3 = (loose || afterHold(B2) ? enterS : enter)[f];
      let excl = 0;
      if (hard && isLeap(f, f1)) excl = f1 > f ? leapInto[f][0] : leapInto[f][1];
      return !!((R[0] & E3[0] | R[1] & E3[1] | R[2] & E3[2]) & ~excl);
    };
    const moraCtx = {
      notes,
      NN,
      valid: Pj.valid,
      repair: Pj.repair,
      hard,
      LX,
      licence,
      isLeap,
      badLeap,
      sameDirLeaps,
      avoidsHard: (ps) => hardAvoid.length > 0 && avoidsHard(ps, 0),
      slots,
      per,
      D,
      e: useEduppu ? e : null,
      phrases: profile ? profile.phrases : [],
      style: o.moraStyle || "auto",
      feasibleInto,
      cache: moraCache,
      moveIdiom
    };
    function moraOptions2(tg2) {
      return moraAllowed ? moraOptions(moraCtx, tg2) : [];
    }
    const korvaiOpts = (tg2) => ending === "korvai" && slots >= 24 ? korvaiOptions(moraCtx, tg2) : [];
    let cands = targets2.map((x) => {
      const tg2 = ix(x.p);
      return Object.assign({ tg: tg2, freeOK: !!reach2(slots, tg2), moraOpts: moraOptions2(tg2), korvaiOpts: korvaiOpts(tg2) }, x);
    });
    if (ending === "korvai" && cands.some((x) => x.korvaiOpts.length)) cands = cands.filter((x) => x.korvaiOpts.length);
    cands = cands.filter((x) => ending === "free" ? x.freeOK : x.freeOK || x.moraOpts.length);
    if (ending === "mora" && cands.some((x) => x.moraOpts.length)) cands = cands.filter((x) => x.moraOpts.length);
    if (!cands.length) {
      const names = targets2.map((x) => swaraName(raga, x.p)).join(" or ");
      return fail("unreachable", useEduppu ? "No legal round of " + slots + " slots moves from " + swaraName(raga, startPitch) + " to " + names + ", the neighbours of the eduppu swara " + swaraName(raga, e) + ". Lengthen the round or pick closer swaras." : "No legal round of " + slots + " slots moves from " + swaraName(raga, startPitch) + " to " + names + ". Lengthen the round or pick closer swaras.");
    }
    const pick2 = cands.length === 1 ? cands[0] : cands[soft(cands.map((x) => (1 - D.c) * approachScore(e, x, profile)), D.tau, rand)];
    const { tg, freeOK, moraOpts, korvaiOpts: kOpts } = pick2, targetPitch = pick2.p;
    let endType;
    if (ending === "korvai" && kOpts.length) endType = "korvai";
    else if ((ending === "mora" || ending === "korvai") && moraOpts.length) endType = "mora";
    else if (ending === "free" && freeOK) endType = "free";
    else if (moraOpts.length && freeOK) endType = soft([(1 - D.c) * 0 + D.c * 0.6, (1 - D.c) * 1], D.tau, rand) === 1 ? "mora" : "free";
    else if (moraOpts.length) endType = "mora";
    else endType = "free";
    let mora = null, B = slots, inSet;
    if (endType === "mora" || endType === "korvai") {
      const opts2 = endType === "korvai" ? kOpts : moraOpts;
      mora = opts2[soft(opts2.map((m2) => (1 - D.c) * m2.F + D.c * m2.N), D.tau, rand)];
      B = mora.B;
      const f = mora.stmts[0][0], f1 = mora.stmts[0][1];
      const lz = endType === "korvai" || afterHold(B);
      inSet = (i2, m2) => intoMora(i2, m2, f, f1, lz);
    } else inSet = (i2) => i2 === tg;
    const bwd = Array.from({ length: B + 1 }, () => new Uint8Array(NS));
    for (let s = 0; s < NS; s++) bwd[B][s] = inSet(s / 3 | 0, s % 3) ? 1 : 0;
    for (let t2 = B - 1; t2 >= 1; t2--) {
      const W = bwd[t2], hk = holdAt[t2];
      if (hk >= 0) {
        const nx = Math.min(plan[hk].next, B);
        for (let s = 0; s < NS; s++) W[s] = holdable(s / 3 | 0) && bwd[nx][s] ? 1 : 0;
        continue;
      }
      const lim = Math.min(segEnd(t2), B), St = isStart[t2], GN = St ? genS : gen;
      for (let s = 0; s < NS; s++) {
        const mv = GN[s];
        for (let k = 0; k < mv.length; k += 2) if (t2 + mv[k] <= lim && bwd[t2 + mv[k]][mv[k + 1]]) {
          W[s] = 1;
          break;
        }
      }
      const add = [0, 0, 0];
      for (const gp of G) {
        if (!gp.moves.some(([L, es]) => t2 + L <= lim && bwd[t2 + L][es])) continue;
        const A = St ? gp.allowS : gp.allow;
        add[0] |= A[0];
        add[1] |= A[1];
        add[2] |= A[2];
      }
      for (let m2 = 0; m2 < 3; m2++) if (add[m2]) {
        for (let i2 = 0; i2 < NN; i2++) if (add[m2] >> i2 & 1) W[i2 * 3 + m2] = 1;
      }
    }
    const d0s = [1, 2].filter((d) => d <= B && bwd[d][s0 * 3]);
    if (!d0s.length) return fail("unreachable", "No legal round of " + slots + " slots moves from " + swaraName(raga, startPitch) + " to " + swaraName(raga, targetPitch) + ". Lengthen the round or pick closer swaras.");
    const d0 = d0s[soft(d0s.map((d) => d === 1 ? (1 - D.c) * 0.5 : (1 - D.c) * 0.1 + D.c * 0.3), D.tau, rand)];
    const units = [{ kind: "start", base: "start", name: "opening swara", dir: 0, t: 0, notes: [{ p: startPitch, dur: d0 }] }];
    const line = [{ p: startPitch, i: s0, dur: d0, pos: 0, g: 0 }];
    const after = mora ? mora.stmts[0].map((j) => ({ p: notes[j], i: j, dur: 1, g: -1 })) : useEduppu ? [{ p: e, i: ix(e), dur: 1, g: -2 }] : [];
    const centre = Math.max(2, Math.min(10, (startPitch + targetPitch) / 2 + 2));
    if (plan) focusPlan(plan, focalCandidates(notes, profile, pcs), pos, startPitch, mora ? notes[mora.stmts[0][0]] : targetPitch, o.focus, rng((o.seed || 1) * 104729 + 3 >>> 0));
    const ECHO = { kind: "conv", base: "echo", id: "echo", name: "focal echo", dir: 0, F0: 0.4, N0: 0.3, len: 1 };
    const toFocus = plan ? plan.map((sg) => {
      if (sg.focal == null || sg.e > B || ix(sg.focal) < 0) return null;
      const L = sg.e - sg.a, fj = ix(sg.focal), tab = Array.from({ length: L + 1 }, () => new Uint8Array(NS));
      for (let m2 = 0; m2 < 3; m2++) tab[L][fj * 3 + m2] = bwd[sg.e] && bwd[sg.e][fj * 3 + m2] ? 1 : 0;
      for (let u = L - 1; u >= 0; u--) {
        const tt = sg.a + u, W = tab[u], GN = isStart[tt] ? genS : gen;
        for (let s2 = 0; s2 < NS; s2++) {
          const mv = GN[s2];
          for (let q = 0; q < mv.length; q += 2) if (u + mv[q] <= L && tab[u + mv[q]][mv[q + 1]]) {
            W[s2] = 1;
            break;
          }
        }
        for (const gp of G) {
          if (!gp.moves.some(([Lm, es]) => u + Lm <= L && tab[u + Lm][es])) continue;
          const A = isStart[tt] ? gp.allowS : gp.allow;
          for (let m2 = 0; m2 < 3; m2++) for (let i2 = 0; i2 < NN; i2++) if (A[m2] >> i2 & 1) W[i2 * 3 + m2] = 1;
        }
      }
      return tab;
    }) : null;
    const NO_LEAPS = { unl: 0, dbl: 0, unres: 0 };
    function registerExcess(cn, t0) {
      let ak = Math.floor(t0 / per), lo = Infinity, hi = -Infinity, ex = 0, p0 = t0;
      for (let k = line.length - 1; k >= 0 && Math.floor(line[k].pos / per) === ak; k--) {
        lo = Math.min(lo, line[k].p);
        hi = Math.max(hi, line[k].p);
      }
      for (const n of cn) {
        const a = Math.floor(p0 / per);
        if (a !== ak) {
          if (hi - lo > LX.regCap) ex += hi - lo - LX.regCap;
          ak = a;
          lo = hi = n.p;
        } else {
          lo = Math.min(lo, n.p);
          hi = Math.max(hi, n.p);
        }
        p0 += n.dur;
      }
      if (hi - lo > LX.regCap) ex += hi - lo - LX.regCap;
      return ex;
    }
    const phraseCount = phr.filter((d) => d.kind === "phrase").length;
    const gFactor = phraseCount ? GENERIC_FACTOR[profile.confidence] || 1 : 1;
    const jdF = (k, base) => JANTA.has(base) ? JD_FACTOR[profile && profile.janta] || 1 : DATTU.has(base) ? JD_FACTOR[profile && profile.dattu] || 1 : 1;
    const maxAvoid = Math.max(1, ...hardAvoid.concat(softAvoid).map((p) => p.length));
    const used = /* @__PURE__ */ new Set();
    function staticTerms(c, cn, ps) {
      let F = 0, N = 0, end = 0;
      const held = [];
      cn.forEach((n) => {
        end += n.dur;
        if (n.dur >= 2) {
          const pc = mod12(n.p);
          held.push([end, pc]);
          if (restBad.has(pc)) F -= 0.4;
          if (alpa.has(pc)) F -= 0.3;
        }
      });
      F += Math.min(0.4, 0.2 * ps.filter((p) => jiva.has(mod12(p))).length);
      if (c.base === "leap3" || c.base === "leap4") N -= 0.3;
      return { F, N, held, avg: ps.reduce((s2, p) => s2 + p, 0) / ps.length, outer: ps.some((p) => p > 12 || p < 0) };
    }
    const stamp = {};
    function fixedTerms(c, cn, ps, isPh) {
      const src = staticTerms(c, cn, ps);
      let F = c.F0, N = c.N0 + src.N;
      if (c.kind === "conv") F *= gFactor;
      F *= jdF(c.kind, c.base);
      F += src.F;
      if (ph0Of(c) === 0) F += 0.6;
      else {
        F -= 0.4;
        N += 0.5;
      }
      if (c.len % per === 0) F += 0.4;
      else if (per > 1) N += 0.4;
      for (const [end, pc] of src.held) {
        if (landing.has(pc) && (curPh + end) % per === 0) F += 0.6;
        else N += 0.3;
      }
      F -= 0.06 * Math.abs(src.avg - centre);
      if (!isPh && src.outer) {
        N += 0.5;
        F -= 0.3;
      }
      let I = 0;
      if (c.kind !== "phrase" && c.kind !== "phrase-fragment") for (let k = 1; k < ps.length; k++) I += moveIdiom(ps[k - 1], ps[k]);
      return { F, N, I };
    }
    let curPh = 0;
    const ph0Of = () => curPh;
    let t = d0, i = s0, m = 0, prev = null, unlSoFar = 0, phraseSlots = 0;
    const phraseLog = plan ? plan.map((sg) => ({ start: sg.a, end: sg.e, karvai: 0, focal: sg.focal, contour: sg.contour, held: null })) : null;
    const phraseNotes = plan ? plan.map(() => []) : [], rhymed = plan ? plan.map(() => false) : [];
    let yatiUsed = !(rng((o.seed || 1) * 31337 + 7 >>> 0)() < (o.yati != null ? +o.yati : 0.4));
    if (plan) phraseNotes[0].push({ p: startPitch, i: s0, dur: d0 });
    while (t < B) {
      const hk = holdAt[t];
      if (hk >= 0) {
        const nx = Math.min(plan[hk].next, B), r = nx - t, lu = units[units.length - 1];
        lu.notes[lu.notes.length - 1].dur += r;
        lu.karvai = (lu.karvai || 0) + r;
        line[line.length - 1].dur += r;
        phraseLog[hk].karvai = r;
        phraseLog[hk].held = line[line.length - 1].p;
        t = nx;
        prev = null;
        continue;
      }
      const lim = Math.min(segEnd(t), B), St = isStart[t], A = St ? appS : app, sg = plan ? plan[segAt[t]] : null;
      let cand = [];
      for (let ci = 0; ci < CELLS.length; ci++) {
        const c2 = CELLS[ci], a = A[ci][i];
        if (a && t + c2.len <= lim && !clash(m, a.mf) && bwd[t + c2.len][a.end * 3 + a.me]) cand.push({ c: c2, src: a, cn: a.tpl, ps: a.ps, int: a.int, end: a.end, me: a.me });
      }
      for (const gp of G) if (entryOK(gp, i, m, St)) {
        for (const a of gp.devs)
          if (t + a.len <= lim && bwd[t + a.len][a.end * 3 + a.me]) cand.push({ c: a.dv, src: a, cn: a.tpl, ps: a.ps, int: a.int, end: a.end, me: a.me });
      }
      if (St && segAt[t] > 0) {
        const pk = plan[segAt[t] - 1], cur = notes[i];
        if (pk.focal != null && cur === pk.focal) [12, -12].forEach((d) => {
          const j = ix(cur + d);
          if (j < 0 || t + 1 > lim || !Pj.valid(cur, notes[j])) return;
          const me2 = cls(i, j);
          if (!clash(m, me2) && bwd[t + 1][j * 3 + me2]) cand.push({ c: ECHO, src: {}, cn: [{ p: notes[j], i: j, dur: 1, g: -9, phrase: false, arp: false }], ps: [notes[j]], int: NO_LEAPS, end: j, me: me2 });
        });
      }
      const offer = (js, durs, rh) => {
        if (js.some((j) => j < 0 || j >= NN) || js.length < 2) return;
        const len = durs.reduce((a, b) => a + b, 0);
        if (t + len > lim || rh.ends && t + len !== sg.e) return;
        if (!Pj.valid(notes[i], notes[js[0]]) || js[0] === i && js[1] !== i || badLeap(i, js[0]) || !joinOK(i, js[0], St) || clash(m, cls(i, js[0])) || hard && sameDirLeaps(i, js[0], js[1])) return;
        for (let q = 1; q < js.length; q++) if (!Pj.valid(notes[js[q - 1]], notes[js[q]]) || badLeap(js[q - 1], js[q]) || hard && q >= 2 && sameDirLeaps(js[q - 2], js[q - 1], js[q])) return;
        const ps = js.map((j) => notes[j]);
        if (hardAvoid.length && avoidsHard([notes[i]].concat(ps), 1)) return;
        const end = js[js.length - 1], me2 = cls(js[js.length - 2], end);
        if (!bwd[t + len][end * 3 + me2]) return;
        const cn = js.map((j, q) => ({ p: notes[j], i: j, dur: durs[q], g: -9, phrase: false, arp: false }));
        cand.push({ c: Object.assign({ kind: "conv", dir: 0, F0: 0.6, N0: -0.2, len }, rh), src: {}, cn, ps, int: internalTerms(LX, cn), end, me: me2, rhyme: rh.bonus });
      };
      if (sg && segAt[t] > 0 && !rhymed[segAt[t]]) {
        const k = segAt[t], pv = phraseNotes[k - 1] || [];
        if (pv.length >= 3) {
          const pj = pv.map((n) => n.i), pd = pv.map((n) => n.dur);
          if (St) {
            for (let h = Math.min(5, pv.length - 1); h >= 3; h--) offer(pj.slice(0, h), pd.slice(0, h), { base: "rhyme-start", id: "rhyme-start", name: "initial rhyme", bonus: 2 });
            offer(pj.map((j) => j - 1), pd, { base: "sequence", id: "sequence", name: "sequence a step lower", bonus: 2.2 });
          }
          if (sg.focal != null) {
            const shift = ix(sg.focal) - pj[pj.length - 1];
            for (let h = Math.min(4, pv.length); h >= 3; h--) offer(pj.slice(-h).map((j) => j + shift), pd.slice(-h).map((d, q) => q === h - 1 ? 1 : d), { base: "rhyme-end", id: "rhyme-end", name: shift ? "end rhyme, moved to the new focus" : "end rhyme", bonus: 2, ends: true });
          }
        }
      }
      if (sg && sg.focal != null && lim === sg.e && !yatiUsed && !rhymed[segAt[t]]) {
        const fp = ix(sg.focal), dn = sg.contour === "asc" ? -1 : 1, gaps = per >= 3 ? [1, 2] : [0, 1];
        for (const L of [3, 4, 5]) for (const shape of ["gopuccha", "srotovaha"]) for (const gp of gaps) {
          const ns = [];
          for (let n = L; n >= 2; n--) ns.push(n);
          if (shape === "srotovaha") ns.reverse();
          const total = ns.reduce((a, b) => a + b, 0) + gp * (ns.length - 1);
          if (t + total !== lim) continue;
          const js = [], durs = [];
          ns.forEach((n, q) => {
            for (let k = n - 1; k >= 0; k--) {
              js.push(fp + dn * k);
              durs.push(k === 0 && q < ns.length - 1 ? 1 + gp : 1);
            }
          });
          offer(js, durs, { base: "yati", id: "yati-" + shape, name: shape + " yati", design: shape, bonus: 0.6, ends: true });
        }
      }
      const g = units.length, tail = line.slice(-3);
      const hasAvoid = hardAvoid.length > 0 || softAvoid.length > 0, look = hasAvoid ? line.slice(-(maxAvoid - 1)).map((n) => n.p) : null;
      const pidi = Math.max(0, Math.min(1, +o.pidi || 0));
      const share = phraseSlots / t, target = targetShare(D.T) + 0.15 * pidi, push = 0.8 * (target - share) * 4 + (pidi ? 0.4 * pidi : 0);
      const ph0 = t % per;
      curPh = ph0;
      const ub = cand.map((x) => {
        const { c: c2, ps } = x, isPh = PHRASE_KINDS.has(c2.kind), isVar = c2.kind === "phrase-variant", anchored = !!c2.phraseId;
        let fx = x.src.fx;
        if (!fx || fx.stamp !== stamp) fx = x.src.fx = { stamp, by: [] };
        let b = fx.by[ph0];
        if (!b) b = fx.by[ph0] = fixedTerms(c2, x.cn, ps, isPh);
        let F = b.F, N = b.N;
        if (!anchored && prev && prev.base === c2.base && prev.dir === c2.dir) {
          F += 0.5;
          N -= 0.4;
        }
        if (prev && prev.id === c2.id && prev.startP === ps[0]) {
          F += 0.2;
          N -= 1;
        }
        if (anchored && used.has(c2.phraseId)) F -= 0.8;
        const p0 = line[line.length - 1].p;
        let I = b.I + moveIdiom(p0, ps[0]);
        if (anchored) {
          const d = Math.abs(x.cn[0].i - i);
          if (d >= 2) I -= (isPh ? 0.3 : 0.6) * (d - 1);
        }
        if (prev && prev.dir && c2.dir && c2.dir !== prev.dir) N += 0.3;
        let P = 0;
        if (sg && sg.focal != null) {
          const te = t + c2.len, Ef = expectedPos(sg, (te - sg.a) / Math.max(1, sg.e - sg.a));
          P -= Math.min(1.2, 0.25 * Math.abs(x.end - Ef));
          const tf = toFocus && toFocus[segAt[t]];
          if (tf && te < sg.e && tf[te - sg.a][x.end * 3 + x.me]) P += 0.9;
          if (te === sg.e) {
            const lp = ps[ps.length - 1];
            if (lp === sg.focal) P += 2.4;
            else if (Math.abs(x.end - sg.focalPos) <= 1) P += 0.7;
            else if (mod12(lp) === mod12(sg.focal)) P += 0.3;
          }
          if (!isPh && !x.rhyme) {
            if (x.cn.some((n, k) => k < x.cn.length - 1 && n.dur >= 2)) P -= 0.6;
            else if (te !== sg.e && x.cn[x.cn.length - 1].dur >= 2) P -= 0.3;
          }
        }
        if (x.rhyme) P += x.rhyme;
        let score = (1 - D.c) * F + D.c * N + (1 - 0.5 * D.c) * (I + P);
        if (isPh) score += push;
        else if (push < 0 && (isVar || c2.kind === "nov")) score -= push * D.c;
        return score;
      });
      let lo = Infinity, hi = -Infinity;
      for (const v of ub) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      const order = cand.map((x, k) => k);
      if (hi - lo > 15 * D.tau) order.sort((a, b) => ub[b] - ub[a] || a - b);
      const memo = /* @__PURE__ */ new Map();
      const pickIx = [], scores = [];
      let best = -Infinity, avoided = [];
      for (const k of order) {
        if (ub[k] < best - 15 * D.tau) break;
        const x = cand[k], cn = x.cn, ph = PHRASE_KINDS.has(x.c.kind), last = t + x.c.len === B;
        let bt;
        if (last) bt = boundaryTerms(LX, tail, cn, after, !!mora);
        else {
          const i1 = cn.length > 1 ? cn[1].i + 1 : 0, i2 = cn.length > 2 ? cn[2].i + 1 : 0;
          const key = (((cn[0].i + 1) * 64 + i1) * 64 + i2) * 64 + Math.min(cn[0].dur, 15) * 4 + (cn[0].phrase ? 2 : 0) + (cn[0].arp ? 1 : 0);
          bt = memo.get(key);
          if (!bt) {
            bt = boundaryTerms(LX, tail, cn, [], false);
            memo.set(key, bt);
          }
        }
        x.L = { unl: x.int.unl + bt.unl, dbl: x.int.dbl + bt.dbl, unres: x.int.unres + bt.unres };
        const reg = per > 1 && !ph ? registerExcess(cn, t) : 0;
        let sa = 0;
        if (hasAvoid) {
          if (hardAvoid.length && hardAvoid.some((pat) => runAcross(look, x.ps, pat))) {
            avoided.push(k);
            continue;
          }
          for (const pat of softAvoid) if (runAcross(look, x.ps, pat)) sa++;
        }
        const allowed = Math.floor(LX.budget * (t + x.c.len) / 8 + 1e-9);
        const over = Math.max(0, Math.min(x.L.unl, unlSoFar + x.L.unl - allowed));
        const pen = 1.5 * x.L.unl + 1 * x.L.unres + 2 * x.L.dbl + 1 * over + 0.8 * reg + 1 * sa;
        const sc = ub[k] - (1 - D.c) * pen;
        pickIx.push(k);
        scores.push(sc);
        if (sc > best) best = sc;
      }
      if (!pickIx.length) avoided.forEach((k) => {
        pickIx.push(k);
        scores.push(ub[k]);
      });
      const ch = cand[pickIx[soft(scores, D.tau, rand)]], c = ch.c;
      const unit = { kind: c.kind, base: c.base, id: c.id, name: c.name, dir: c.dir, t, notes: ch.cn.map((n) => ({ p: n.p, dur: n.dur })) };
      if (c.phraseId) Object.assign(unit, { phraseId: c.phraseId, source: c.source, type: c.type, variant: c.variant }, c.exception ? { exception: true } : {});
      if (plan) {
        unit.phrase = segAt[t];
        ch.cn.forEach((n) => phraseNotes[segAt[t]].push({ p: n.p, i: n.i, dur: n.dur }));
        if (ch.rhyme) rhymed[segAt[t]] = true;
        if (c.base === "yati") {
          yatiUsed = true;
          unit.design = c.design;
        }
      }
      units.push(unit);
      {
        let p0 = t;
        ch.cn.forEach((n) => {
          line.push(Object.assign({}, n, { g, pos: p0 }));
          p0 += n.dur;
        });
      }
      unlSoFar += ch.L.unl;
      if (PHRASE_KINDS.has(c.kind)) phraseSlots += c.len;
      if (c.phraseId) used.add(c.phraseId);
      prev = { base: c.base, id: c.id, dir: c.dir, startP: ch.cn[0].p };
      t += c.len;
      i = ch.end;
      m = ch.me;
    }
    if (mora && mora.parts) {
      mora.parts.forEach((pt, r) => {
        const ns = pt.js.map((j, k) => ({ p: notes[j], dur: pt.durs[k] })), g = units.length;
        units.push({ kind: "korvai", base: "korvai", name: "korvai unit " + (r + 1) + " of 3", dir: -1, t, notes: ns });
        ns.forEach((n, k) => {
          line.push({ p: n.p, i: pt.js[k], dur: n.dur, pos: t, g });
          t += n.dur;
        });
      });
    } else if (mora) {
      for (let r = 0; r < 3; r++) {
        const st = mora.stmts[r], dd = mora.durs ? mora.durs[r] : null;
        const ns = st.map((j, k) => ({ p: notes[j], dur: (dd ? dd[k] : 1) + (k === st.length - 1 && r < 2 ? mora.q : 0) }));
        const g = units.length;
        units.push({ kind: "mora", base: "mora", name: "mora " + (r + 1) + " of 3", dir: 0, t, notes: ns });
        ns.forEach((n, k) => {
          line.push({ p: n.p, i: st[k], dur: n.dur, pos: t, g });
          t += n.dur;
        });
      }
    }
    const notesOut = [];
    units.forEach((u) => u.notes.forEach((n) => notesOut.push(n)));
    const slotsOf = (u) => u.notes.reduce((s, n) => s + n.dur, 0);
    let nov = 0, conv = 0, phraseS = 0, variantS = 0;
    const devices = {}, phrasesUsed = [];
    units.forEach((u) => {
      const L = slotsOf(u);
      if (u.kind === "nov") nov += L;
      else if (u.kind === "phrase-variant") variantS += L;
      else if (PHRASE_KINDS.has(u.kind)) phraseS += L;
      else if (u.kind === "conv" || u.kind === "mora" || u.kind === "korvai") conv += L;
      if (u.kind !== "start" && u.kind !== "step" && u.kind !== "mora" && u.kind !== "korvai") {
        const k = u.name + (u.dir > 0 ? " \u2191" : u.dir < 0 ? " \u2193" : "");
        devices[k] = (devices[k] || 0) + 1;
      }
      if (u.phraseId) phrasesUsed.push({ phraseId: u.phraseId, source: u.source, kind: u.kind, variant: u.variant, type: u.type, notes: u.notes.map((n) => n.p) });
    });
    const endInfo = mora && mora.parts ? {
      type: "korvai",
      style: "korvai",
      units: mora.parts.map((pt) => pt.js.map((j) => notes[j])),
      run: mora.n,
      rests: mora.rho,
      gap: mora.Q,
      start: mora.B
    } : mora ? {
      type: "mora",
      style: mora.style,
      statements: mora.stmts.map((st) => st.map((j) => notes[j])),
      q: mora.q,
      start: mora.B,
      adjusted: mora.adjusted,
      template: mora.template,
      templatePhrase: mora.phraseId || null,
      direction: mora.delta > 0 ? "down" : mora.delta < 0 ? "up" : "none",
      timing: mora.durs ? mora.durs.map((d) => d.reduce((a, b) => a + b, 0)) : null,
      phrase: mora.stmts[2].map((j) => notes[j])
      // deprecated: the last statement (v0.2 had one phrase three times)
    } : ending === "mora" || ending === "korvai" ? { type: "free", fallbackFrom: ending } : { type: "free" };
    if (ending === "korvai" && endInfo.type === "mora") endInfo.fallbackFrom = "korvai";
    if (useEduppu) Object.assign(endInfo, { eduppu: e, final: targetPitch, approach: pick2.approach });
    const leaps = leapStats(LX, line, useEduppu ? [{ p: e, i: ix(e), dur: 1, g: -2 }] : [], slots);
    return {
      notes: notesOut,
      slots,
      units,
      ending: endInfo,
      stats: {
        novelShare: (nov + variantS) / slots,
        convShare: (conv + phraseS) / slots,
        phraseShare: phraseS / slots,
        variantShare: variantS / slots,
        profileCoverage: profileCoverage(profile, phraseCount),
        phrases: phrasesUsed,
        devices,
        leaps,
        plan: plan ? "phrases" : "none"
      },
      // v0.4: the phrase plan as sung (phrases the mora cut short have no karvai)
      phrases: phraseLog ? phraseLog.filter((p) => p.start < B) : [],
      dial: D,
      level
    };
  }
  function kalpana(raga, opts) {
    const res = kalpanaRound(raga, opts);
    return res.error ? null : res;
  }

  // src/engine/kalpana/session.js
  var PARTS = [
    { part: "first speed", speed: 1, avartanas: [0.5, 1, 2], pidi: 1 },
    { part: "second speed", speed: 2, avartanas: [1, 2], pidi: 0.3 },
    { part: "koraippu", speed: 2, avartanas: [1, 1, 0.5, 0.5, 0.25, 0.25], pidi: 0 }
  ];
  function kalpanaSession(raga, opts) {
    const o = opts || {}, angas = o.angas && o.angas.length ? o.angas : [4, 2, 2];
    const cycle = angas.reduce((a, b) => a + b, 0), per1 = o.perAkshara || 2, T = o.T == null ? 1 : o.T, seed = o.seed || 1;
    const startPitch = o.startPitch == null ? 0 : o.startPitch, e = o.eduppuPitch;
    const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
    const notes = [];
    for (let oct = -1; oct <= 1; oct++) pcs.forEach((pc) => {
      const p = pc + 12 * oct;
      if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p);
    });
    notes.sort((a, b) => a - b);
    const cands = focalCandidates(notes, getProfile(raga), pcs).filter((p) => p >= startPitch && p <= 14);
    const parts = PARTS.slice();
    if (o.korvai !== false) parts.push({ part: "korvai", speed: 2, avartanas: [2], pidi: 0, ending: "korvai" });
    const climb = parts.filter((p) => p.part === "first speed" || p.part === "second speed").reduce((n, p) => n + p.avartanas.length, 0);
    const rounds = [], failed = [];
    let index = 0, climbed = 0;
    const korFocus = cands.length ? cands.reduce((b, q) => Math.abs(q - ((e == null ? 7 : e) + 5)) < Math.abs(b - ((e == null ? 7 : e) + 5)) ? q : b, cands[0]) : null;
    parts.forEach((pt) => pt.avartanas.forEach((av) => {
      const aksharas = Math.max(1, Math.round(av * cycle)), per = per1 * pt.speed;
      let focus = null;
      if (pt.part === "first speed" || pt.part === "second speed") {
        focus = cands.length ? cands[Math.min(cands.length - 1, Math.round(climbed * (cands.length - 1) / Math.max(1, climb - 1)))] : null;
        climbed++;
      } else focus = korFocus;
      const starts = [focus, startPitch].filter((p, k, a) => p != null && a.indexOf(p) === k);
      let res = null;
      for (const sp2 of starts) {
        res = kalpanaRound(raga, {
          aksharas,
          perAkshara: per,
          startPitch: sp2,
          eduppuPitch: e,
          T,
          seed: seed + 101 * index,
          angas,
          focus,
          pidi: pt.pidi,
          ending: pt.ending || (av < 1 ? "free" : "auto"),
          moraStyle: o.moraStyle
        });
        if (!res.error) break;
      }
      if (res.error) failed.push({ part: pt.part, index, avartanas: av, error: res.error });
      else rounds.push({ part: pt.part, index, avartanas: av, aksharas, per, focus, round: res });
      index++;
    }));
    return { rounds, failed, cycle };
  }

  // src/engine/kalpana/sargam.js
  var BASE = { S: 0, R: 2, G: 4, M: 5, P: 7, D: 9, N: 11 };
  var VARIANT = { R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11 };
  var TOKEN = /([.'^]*)([SRGMPDN])([123])?([.'^]*)|[,\-]/gi;
  var MAX_PHRASES = 400;
  var MAX_TOKENS = 200;
  function pitchOf(letter, digit, raga) {
    const L = letter.toUpperCase();
    if (digit && VARIANT[L + digit] != null) return VARIANT[L + digit];
    if (L === "S" || L === "P") return BASE[L];
    const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
    const own = raga.labels ? pcs.filter((pc) => String(raga.labels[pc] || "").toUpperCase().startsWith(L)) : [];
    return own.length ? own[0] : BASE[L];
  }
  function parseSwaras(text, raga) {
    const out = [];
    let outside = 0;
    const pcs = new Set(raga.aro.concat(raga.avaro).map(mod12));
    String(text).replace(TOKEN, (m, pre, letter, digit, post) => {
      if (out.length >= MAX_TOKENS) return m;
      if (!letter) {
        out.push(null);
        return m;
      }
      const marks = (pre || "") + (post || ""), up = (marks.match(/['^]/g) || []).length, down = (marks.match(/\./g) || []).length;
      const p = pitchOf(letter, digit, raga) + 12 * (up - down);
      if (!pcs.has(mod12(p))) outside++;
      out.push(p);
      return m;
    });
    return { tokens: out, outside };
  }
  function parseInspiration(input, raga) {
    if (input && typeof input === "object" && input.parsed === true && Array.isArray(input.phrases)) return input;
    let obj = input;
    if (typeof input === "string") {
      const s = input.replace(/```(?:json)?/gi, ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
      if (a < 0 || b <= a) return { error: "no JSON object was found in the answer." };
      try {
        obj = JSON.parse(s.slice(a, b + 1));
      } catch (e) {
        return { error: "the answer is not valid JSON (" + e.message + ")." };
      }
    }
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.phrases)) return { error: 'the answer has no "phrases" list.' };
    const phrases = [];
    let outside = 0;
    for (const x of obj.phrases.slice(0, MAX_PHRASES)) {
      if (!x || typeof x !== "object") continue;
      const k = Number(x.phrase), line = Array.isArray(x.swaras) ? x.swaras.join(" ") : x.swaras;
      if (!Number.isInteger(k) || typeof line !== "string") continue;
      const t = parseSwaras(line, raga);
      outside += t.outside;
      phrases.push({ phrase: k - 1, tokens: t.tokens });
    }
    if (!phrases.length) return { error: "the answer suggests no phrases the engine can read." };
    return { parsed: true, phrases, note: typeof obj.idea === "string" ? obj.idea.slice(0, 400) : "", outside };
  }

  // src/engine/kalpana/rhythm.js
  var ROLES = /* @__PURE__ */ new Set(["pre", "purvanga", "pgap", "statement", "gap", "uttaranga", "mukhra", "close", "count", "speed1", "speed2", "speed3"]);
  var GAP = /* @__PURE__ */ new Set(["gap", "pgap"]);
  var CADENCE = /* @__PURE__ */ new Set(["statement", "uttaranga"]);
  var isSyl = (s) => !!s && s !== ",";
  function rhythmTemplate(F, layout, meta) {
    const cells = layout.cells.map((c) => ({ s: String(c.syl == null ? "" : c.syl), r: c.role, f: c.first ? 1 : 0 }));
    if (F.counting === "on" && cells[layout.landIndex]) cells[layout.landIndex] = { s: cells[layout.landIndex].s, r: "close", f: 1 };
    const tl = F.tala;
    return {
      v: 1,
      tala: tl.fam === "custom" ? { fam: "custom", angas: tl.angas.map((a) => a.len) } : { fam: tl.fam, L: tl.fam === "chapu" ? tl.total : tl.L },
      gati: F.gati,
      kalai: F.kalai,
      cycles: F.cycles,
      start: F.start,
      land: F.land,
      cells,
      label: meta && meta.label || "",
      form: meta && meta.form || ""
    };
  }
  function parseRhythmTemplate(t) {
    if (!t || typeof t !== "object" || t.v !== 1) return { error: "The rhythm is not one from the korvai lab (version 1)." };
    let tl;
    try {
      if (t.tala && t.tala.fam === "custom") {
        const a = t.tala.angas;
        if (!Array.isArray(a) || !a.length || a.length > 16 || a.some((x) => !(Number.isInteger(x) && x >= 1 && x <= 16))) return { error: "The rhythm\u2019s custom tala is not valid." };
        tl = customTala(a);
      } else tl = tala(String(t.tala && t.tala.fam), Number(t.tala && t.tala.L));
    } catch (e) {
      return { error: "The rhythm\u2019s tala is not valid: " + e.message };
    }
    const gati = Number(t.gati), kalai = Number(t.kalai || 1);
    if (!(Number.isInteger(gati) && gati >= 1 && gati <= 18)) return { error: "The rhythm\u2019s gati must be 1 to 18 pulses a beat." };
    if (![1, 2, 4].includes(kalai)) return { error: "The rhythm\u2019s kalai must be 1, 2 or 4." };
    if (!Array.isArray(t.cells) || !t.cells.length || t.cells.length > 6e3) return { error: "The rhythm must have 1 to 6000 pulses." };
    const cells = [];
    for (const c of t.cells) {
      if (!c || typeof c !== "object" || typeof c.s !== "string" || c.s.length > 12 || !/^[a-z,]*$/i.test(c.s) || !ROLES.has(c.r)) return { error: "The rhythm has a pulse that is not valid." };
      cells.push({ s: c.s, r: c.r, f: c.f ? 1 : 0 });
    }
    let lead = 0;
    while (lead < cells.length && cells[lead].r === "pre") lead++;
    const ci = cells.findIndex((c) => c.r === "close");
    if (ci >= 0 && ci !== cells.length - 1) return { error: "The rhythm\u2019s closing pulse must be its last." };
    const body = cells.slice(lead, ci >= 0 ? ci : cells.length);
    if (!body.some((c) => isSyl(c.s) && !GAP.has(c.r))) return { error: "The rhythm has no syllables to sing." };
    if (body.some((c) => c.r === "pre")) return { error: "The rhythm has silence inside it." };
    return { tala: tl, gati, kalai, lead, cells, body, closed: ci >= 0, label: String(t.label || "").slice(0, 200), form: String(t.form || "").slice(0, 40), start: Number(t.start) || 0, land: Number(t.land) || 0 };
  }
  function phrasesOf(body) {
    const out = [];
    let cur = null;
    body.forEach((c, i) => {
      if (GAP.has(c.r)) {
        if (c.f || cur) cur = null;
        return;
      }
      if (c.f || !cur) {
        cur = { i: out.length, role: c.r, cells: [], sylls: [], sc: [] };
        out.push(cur);
      }
      cur.cells.push(i);
      if (isSyl(c.s)) {
        cur.sylls.push(c.s.toLowerCase());
        cur.sc.push(i);
      }
    });
    return out.filter((p) => p.sylls.length);
  }
  var STRONG = { 3: [0], 4: [0, 2], 5: [0, 2], 6: [0, 3], 7: [0, 3], 8: [0, 4], 9: [0, 3, 6] };
  var strongAt = (pos, g) => pos === 0 || (STRONG[g] || [0, Math.floor(g / 2)]).includes(pos);
  var weakKeep = (g) => g <= 3 ? 0.45 : g <= 5 ? 0.3 : g === 6 ? 0.25 : 0.2;
  var suffix = (a, b) => a.length <= b.length && a.every((x, k) => x === b[b.length - a.length + k]);
  function familiesOf(ph) {
    const fams = [];
    ph.forEach((q, k) => {
      let f = null;
      for (let j = fams.length - 1; j >= 0 && !f; j--) {
        const g = fams[j];
        if (g.role.replace(/^speed\d$/, "speed") !== q.role.replace(/^speed\d$/, "speed")) continue;
        const rel = suffix(q.sylls, g.master) || suffix(g.master, q.sylls);
        const adjacent = g.members[g.members.length - 1] === k - 1;
        if (rel && (Math.min(q.sylls.length, g.master.length) >= 2 || adjacent)) f = g;
      }
      if (!f) {
        f = { id: fams.length, role: q.role, master: q.sylls, members: [] };
        fams.push(f);
      }
      if (q.sylls.length > f.master.length) f.master = q.sylls;
      f.members.push(k);
      q.fam = f.id;
    });
    fams.forEach((f) => {
      const lens = f.members.map((k) => ph[k].sylls.length);
      f.n = Math.max(...lens);
      f.lens = lens;
      f.kind = f.members.length === 1 ? "single" : lens.every((x) => x === lens[0]) ? "repeat" : "nested";
      const m = lens.length;
      let per = m;
      for (let p = 1; p < m; p++) if (m % p === 0 && lens.every((x, j) => x === lens[j % p])) {
        per = p;
        break;
      }
      if (f.kind !== "nested") per = m;
      f.first = [];
      f.members.forEach((k, j) => {
        const r = Math.floor(j / per);
        ph[k].round = r;
        if (f.first[r] == null) f.first[r] = j;
      });
      f.rounds = Math.ceil(m / per);
    });
    return fams;
  }
  function rhythmPhrases(template) {
    const R = parseRhythmTemplate(template);
    if (R.error) return R;
    const ph = phrasesOf(R.body);
    return { R, phrases: ph, families: familiesOf(ph) };
  }
  function kalpanaRhythm(raga, template, opts = {}) {
    const R = parseRhythmTemplate(template);
    if (R.error) return { error: R.error, code: "bad-rhythm" };
    const D = dial(opts.T == null ? 0.8 : opts.T), c = D.c, Pj = makeProjector(raga), profile = getProfile(raga);
    const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
    const notes = [];
    for (let o = -1; o <= 1; o++) pcs.forEach((pc) => {
      const p = pc + 12 * o;
      if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p);
    });
    notes.sort((a, b) => a - b);
    const ix = (p) => notes.indexOf(p);
    let targets2;
    if (opts.eduppuPitch != null) {
      const nb = eduppuNeighbours(raga, opts.eduppuPitch);
      if (nb.error) return { error: nb.error, code: nb.code };
      targets2 = [nb.lo, nb.hi].filter((p) => p != null && ix(p) >= 0);
      if (!targets2.length) return { error: "No swara of " + raga.name + " in range steps legally into that eduppu.", code: "no-neighbour" };
    } else if (opts.targetPitch != null) {
      if (ix(opts.targetPitch) < 0) return { error: "The landing swara is not a swara of " + raga.name + " inside the kalpana range.", code: "target-not-in-raga" };
      targets2 = [opts.targetPitch];
    } else return { error: "Give eduppuPitch, the swara the song resumes on (or targetPitch, the swara to end on).", code: "no-landing" };
    const ph = phrasesOf(R.body), fams = familiesOf(ph);
    const lastPhrase = ph[ph.length - 1], cadFam = fams[lastPhrase.fam];
    const rest = new Set(profile ? profile.nyasa.concat(profile.landing, profile.jiva) : [0, 7]);
    const bad = new Set(profile ? profile.alpa.concat(profile.avoidLanding, profile.notNyasa) : []);
    const anchors = notes.filter((p) => (rest.has(mod12(p)) || mod12(p) === 0 || mod12(p) === 7) && !bad.has(mod12(p)) && p >= -2 && p <= 16);
    const hardAvoid = profile ? profile.avoid.filter((a) => a.strength === "hard").map((a) => a.pitches) : [];
    const hasRun = (seq, pat) => {
      for (let i = 0; i + pat.length <= seq.length; i++) if (pat.every((x, k) => seq[i + k] === x)) return true;
      return false;
    };
    const melody = opts.melody || "auto";
    function line(end, n, rand) {
      const out = [end];
      let dir = 1, lo = ix(end), hi = ix(end);
      const W = 7, top = notes.filter((p) => p <= 16).length - 1;
      for (let k = 1; k < n; k++) {
        const cur = out[0], i = ix(cur);
        if (rand() < 0.06 + 0.16 * c) dir = -dir;
        let made = false;
        for (const d of [dir, -dir]) {
          const steps = rand() < 0.12 + 0.22 * c ? [2, 1] : [1, 2];
          for (const s of steps) {
            const j = i + d * s;
            if (j < 0 || j > top || Math.max(hi, j) - Math.min(lo, j) > W) continue;
            const prev = notes[j];
            if (!Pj.valid(prev, cur)) continue;
            out.unshift(prev);
            made = true;
            dir = d;
            lo = Math.min(lo, j);
            hi = Math.max(hi, j);
            break;
          }
          if (made) break;
        }
        if (!made) out.unshift(cur);
      }
      return out;
    }
    const inRange = (ps) => ps && ps.every((p) => p != null && ix(p) >= 0 && p <= 16);
    const fit = (naive) => {
      if (naive.some((p) => p == null)) return null;
      const r = Pj.repair(naive);
      return r.feasible && inRange(r.pitches) ? r.pitches : null;
    };
    const transpose = (b, s) => s === 0 ? b.slice() : fit(b.map((p) => notes[ix(p) + s]));
    const invert = (b) => {
      const L = ix(b[b.length - 1]);
      return fit(b.map((p) => notes[2 * L - ix(p)]));
    };
    const recompose = (b, keep, rand) => {
      if (keep >= b.length) return b.slice();
      const tail = b.slice(-keep), head = line(tail[0], b.length - keep + 1, rand);
      return head.slice(0, -1).concat(tail);
    };
    const PLANS = {
      down: (k, m) => m - 1 - k,
      up: (k, m) => -(m - 1 - k),
      thirds: (k, m) => 2 * (m - 1 - k),
      arch: (k, m) => k === m - 1 ? 0 : k % 2 ? 2 : 1,
      wave: (k, m) => k === m - 1 ? 0 : [2, -1, 1, -2][k % 4]
    };
    const HOW = { down: "the same shape, each a step lower", up: "the same shape, each a step higher", thirds: "the same shape from every other swara, as an alankara", arch: "the same shape, rising then settling", wave: "the same shape, moving up and down the scale" };
    const offsetOf = (plan, k, m) => {
      if (m > 4 && m % 3 === 0) {
        const g = Math.floor(k / 3), G = m / 3;
        return PLANS[plan](k % 3, 3) + (G - 1 - g);
      }
      return PLANS[plan](k, m);
    };
    const weighted = (items, rand) => {
      const tot = items.reduce((s, x) => s + x[1], 0);
      let r = rand() * tot;
      for (const [v, w] of items) {
        r -= w;
        if (r <= 0) return v;
      }
      return items[items.length - 1][0];
    };
    const full = opts.density === "full" || R.gati <= 2;
    const refPos = fams.map((f) => {
      const q = ph[f.members[f.lens.indexOf(Math.max(...f.lens))]];
      return q.sc.map((i) => (R.lead + i) % R.gati).reverse();
    });
    const breath = (f, rand) => {
      const all = full || /^speed\d$/.test(f.role), p = weakKeep(R.gati) + 0.15 * c;
      return refPos[f.id].map((pos, d) => all || strongAt(pos, R.gati) || d === 0 && (f === cadFam || CADENCE.has(f.role)) || rand() < p ? 1 : 0);
    };
    const maskOf = (q, fm) => q.sylls.map((_, j) => j === 0 || fm[q.sylls.length - 1 - j] ? 1 : 0);
    const count = (m) => m.reduce((a, b) => a + b, 0);
    const pOf = /* @__PURE__ */ new Map();
    ph.forEach((q, k) => q.cells.forEach((i) => pOf.set(i, k)));
    function assemble(pitches, masks) {
      const out = [], units2 = [], cur = ph.map(() => 0), syl = ph.map(() => 0);
      let unit = null;
      R.body.forEach((cl, i) => {
        const k = pOf.get(i);
        if (k != null && isSyl(cl.s) && masks[k][syl[k]++]) {
          const q = ph[k], n = { p: pitches[k][cur[k]++], dur: 1 };
          if (!unit || unit.phrase !== k) {
            unit = { phrase: k, fam: q.fam, role: q.role, notes: [] };
            units2.push(unit);
          }
          unit.notes.push(n);
          out.push(n);
        } else if (out.length && (k != null || opts.karvai !== "rest")) out[out.length - 1].dur++;
        else {
          const n = { p: null, dur: 1 };
          if (out.length && out[out.length - 1].p === null) out[out.length - 1].dur++;
          else {
            out.push(n);
            units2.push({ phrase: null, role: "gap", notes: [n] });
            unit = null;
          }
        }
      });
      return { out, units: units2 };
    }
    function legal(pitches, out) {
      const seq = out.filter((n) => n.p != null).map((n) => n.p);
      if (seq.some((p) => p == null || ix(p) < 0)) return "range";
      for (let i = 1; i < seq.length; i++) if (!Pj.valid(seq[i - 1], seq[i])) return "direction";
      const joins = [];
      for (let k = 1; k < ph.length; k++) {
        const a = pitches[k - 1][pitches[k - 1].length - 1], b = pitches[k][0];
        joins.push(Math.abs(b - a));
        if (Math.abs(b - a) > 9) return "join";
      }
      for (const q of pitches) for (let i = 1; i < q.length; i++) if (Math.abs(q[i] - q[i - 1]) > 7) return "leap";
      if (hardAvoid.some((pat) => hasRun(seq, pat))) return "avoid";
      return { seq, joins };
    }
    function attempt(seed) {
      const rand = rng(seed), target = targets2[Math.floor(rand() * targets2.length)];
      const lines = {}, styles = {}, plans = {}, hows = {};
      const fm = {};
      fams.forEach((f) => {
        fm[f.id] = breath(f, rand);
      });
      const masks = ph.map((q) => maskOf(q, fm[q.fam])), nOn = {};
      fams.forEach((f) => {
        nOn[f.id] = Math.max(...f.members.map((k) => count(masks[k])));
      });
      fams.forEach((f) => {
        let end;
        if (f === cadFam) end = target;
        else {
          const pool = anchors.length ? anchors : notes;
          end = pool[Math.floor(rand() * pool.length)];
        }
        lines[f.id] = line(end, nOn[f.id], rand);
        const speed = /^speed\d$/.test(f.role), cad = f === cadFam;
        if (f.kind === "repeat") {
          if (speed || melody === "repeat") styles[f.id] = "repeat";
          else if (melody === "sequence") styles[f.id] = "sequence";
          else styles[f.id] = weighted([["repeat", (cad ? 0.35 : 0.08) * (1 - c)], ["sequence", 1.1 - 0.6 * c], ["varied", 0.15 + 1.3 * c]], rand);
          plans[f.id] = weighted([["down", 0.32], ["thirds", 0.24], ["up", 0.16 + 0.1 * c], ["arch", 0.18 + 0.15 * c], ["wave", 0.1 + 0.2 * c]], rand);
        } else {
          styles[f.id] = f.kind;
          if (f.kind === "nested" && f.rounds > 1) plans[f.id] = weighted([["down", 0.32], ["thirds", 0.22], ["up", 0.2], ["arch", 0.16 + 0.15 * c], ["wave", 0.1 + 0.2 * c]], rand);
        }
        hows[f.id] = styles[f.id] === "repeat" ? speed ? "one phrase at three speeds" : "identical" : styles[f.id] === "sequence" ? HOW[plans[f.id]] : styles[f.id] === "varied" ? "varied: the rhythm kept, the swaras re-sung" : styles[f.id] === "nested" ? (c >= 0.5 ? "one line, each phrase its end, the openings re-sung" : "one line, each phrase its end") + (f.rounds > 1 ? "; each of its " + f.rounds + " rounds " + HOW[plans[f.id]].replace("the same shape, ", "").replace("the same shape ", "") : "") : "one phrase";
      });
      const shifts = {};
      const roundShift = (f, r) => {
        const key = f.id + ":" + r;
        if (shifts[key] != null) return shifts[key];
        const o = offsetOf(plans[f.id], r, f.rounds);
        for (const s of [o, -o, o + 1, o - 1, -o + 1, -o - 1, 0]) if (s === 0 || transpose(lines[f.id], s)) return shifts[key] = s;
        return shifts[key] = 0;
      };
      const rlines = {};
      const roundLine = (f, r) => {
        const key = f.id + ":" + r;
        return rlines[key] || (rlines[key] = transpose(lines[f.id], roundShift(f, r)) || lines[f.id]);
      };
      const seen = {}, pitches = ph.map((q, qk) => {
        const f = fams[q.fam], n = count(masks[qk]), base = lines[f.id].slice(-n), st = styles[f.id];
        const k = seen[f.id] = seen[f.id] == null ? 0 : seen[f.id] + 1, m = f.members.length, isLast = k === m - 1;
        if (st === "nested") {
          const r = q.round, rl = f.rounds > 1 ? roundLine(f, r) : lines[f.id], mv = rl.slice(-n);
          if (c < 0.5 || n <= 3 || f.first[r] === k) return mv;
          return recompose(mv, Math.max(2, Math.ceil(n * (1 - 0.55 * c))), rand);
        }
        if (st === "repeat" || st === "single") return base;
        const shifted = transpose(base, offsetOf(plans[f.id], k, m)) || transpose(base, -offsetOf(plans[f.id], k, m)) || base;
        if (st === "sequence") return shifted;
        const op = weighted([["transpose", 1], ["recompose", 0.5 + 1.2 * c], ["invert", 0.5 * c], ["fresh", Math.max(0, c - 0.35) * 1.6]], rand);
        if (op === "transpose") return isLast && f === cadFam ? base : shifted;
        if (op === "recompose") return recompose(isLast && f === cadFam ? base : shifted, Math.max(2, Math.ceil(n * (0.6 - 0.25 * c))), rand);
        if (op === "invert") return (isLast && f === cadFam ? invert(base) : invert(shifted)) || shifted;
        return line(isLast && f === cadFam ? target : shifted[n - 1], n, rand);
      });
      const { out, units: units2 } = assemble(pitches, masks), L = legal(pitches, out);
      if (typeof L === "string") return null;
      const { seq, joins } = L;
      let S = -0.12 * joins.reduce((a, b) => a + b, 0) / Math.max(1, joins.length) * joins.length / 3;
      let skips = 0;
      pitches.forEach((q) => {
        for (let i = 1; i < q.length; i++) if (Math.abs(ix(q[i]) - ix(q[i - 1])) > 1) skips++;
      });
      S -= (1 - c) * 0.25 * skips;
      const lo = Math.min(...seq), hi = Math.max(...seq);
      S -= Math.max(0, hi - 14) * 0.3 + Math.max(0, -3 - lo) * 0.3;
      S += 0.2 * new Set(fams.map((f) => lines[f.id][lines[f.id].length - 1])).size;
      fams.forEach((f) => {
        if (f.kind === "repeat" && styles[f.id] !== "repeat" && f.members.length > 1) S += (0.4 + 0.6 * c) * (new Set(f.members.map((k) => pitches[k].join())).size - 1) / (f.members.length - 1);
      });
      return { notes: out, units: units2, pitches, masks, lines, styles, hows, plans, target, score: S, inspired: ph.map(() => false) };
    }
    let best = null;
    const seed0 = (opts.seed || 1) * 7919 + 13;
    for (let k = 0; k < 60; k++) {
      const a = attempt(seed0 + k * 104729);
      if (a && (!best || a.score > best.score)) best = a;
    }
    if (!best) return { error: "No line in " + raga.name + " fits this rhythm within the raga\u2019s rules; try another eduppu swara or raga.", code: "unsingable" };
    let insp = null;
    if (opts.inspiration) {
      const I = parseInspiration(opts.inspiration, raga);
      insp = { suggested: 0, used: [], set: [], note: I.note || "", error: I.error || null };
      if (!I.error) {
        const P = best.pitches.map((x) => x.slice()), M = best.masks.map((x) => x.slice()), lastK = ph.length - 1;
        const snap = (p) => {
          if (ix(p) >= 0) return p;
          for (const o of [12, -12]) if (ix(p + o) >= 0) return p + o;
          return notes.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a, notes[0]);
        };
        const endOn = (arr, end) => {
          const m = arr.length;
          if (end == null || arr[m - 1] === end) return arr;
          arr[m - 1] = end;
          if (m < 2 || Pj.valid(arr[m - 2], end) && Math.abs(arr[m - 2] - end) <= 7) return arr;
          const opt = notes.filter((x) => Pj.valid(x, end) && Math.abs(x - end) <= 7 && (m < 3 || Pj.valid(arr[m - 3], x) && Math.abs(arr[m - 3] - x) <= 7));
          if (!opt.length) return null;
          arr[m - 2] = opt.reduce((a, b) => Math.abs(b - arr[m - 2]) < Math.abs(a - arr[m - 2]) ? b : a);
          return arr;
        };
        const WHY = { range: "it leaves the kalpana range", direction: "it breaks " + raga.name + "\u2019s direction rule where it meets its neighbours", join: "it leaps more than a sixth from the phrase before or after", leap: "it leaps more than a fifth", avoid: "it sings a phrase " + raga.name + " avoids" };
        const pending = [], taken = /* @__PURE__ */ new Set();
        I.phrases.forEach((s) => {
          const k = s.phrase;
          insp.suggested++;
          if (!(Number.isInteger(k) && k >= 0 && k < ph.length)) {
            insp.set.push({ phrase: k + 1, why: "there is no phrase " + (k + 1) });
            return;
          }
          if (taken.has(k)) {
            insp.set.push({ phrase: k + 1, why: "it was suggested twice; the first is used" });
            return;
          }
          taken.add(k);
          const q = ph[k], f = fams[q.fam], n = q.sylls.length, sw = s.tokens.filter((t) => t != null);
          if (!sw.length) {
            insp.set.push({ phrase: k + 1, why: "it has no swaras" });
            return;
          }
          const mask = s.tokens.length === n && s.tokens[0] != null && !/^speedd$/.test(q.role) ? s.tokens.map((t) => t != null ? 1 : 0) : M[k].slice();
          if ((k === lastK || CADENCE.has(q.role)) && !mask[n - 1]) mask[n - 1] = 1;
          const m = count(mask);
          const naive = Array.from({ length: m }, (_, j) => snap(sw[m === 1 || sw.length === 1 ? 0 : Math.round(j * (sw.length - 1) / (m - 1))]));
          const rep = Pj.repair(naive);
          const end = k === lastK ? best.target : f.kind === "nested" ? P[k][P[k].length - 1] : null;
          const fitted = rep.feasible ? endOn(rep.pitches.slice(), end) : null;
          if (!fitted || !inRange(fitted)) {
            insp.set.push({ phrase: k + 1, why: "it cannot be sung in " + raga.name + " with this ending" });
            return;
          }
          const tries = (end == null ? [fitted, fitted.map((p) => p + 12), fitted.map((p) => p - 12)] : [fitted]).filter(inRange);
          pending.push({ k, mask, tries, why: null, sung: false });
        });
        for (let pass = 0; pass < 3; pass++) {
          let moved = false;
          pending.forEach((x) => {
            if (x.sung) return;
            for (const cand of x.tries) {
              const P2 = P.slice(), M2 = M.slice();
              P2[x.k] = cand;
              M2[x.k] = x.mask;
              const L = legal(P2, assemble(P2, M2).out);
              if (typeof L === "string") {
                x.why = x.why || L;
                continue;
              }
              P[x.k] = cand;
              M[x.k] = x.mask;
              best.inspired[x.k] = true;
              x.sung = moved = true;
              break;
            }
          });
          if (!moved) break;
        }
        pending.forEach((x) => {
          if (x.sung) insp.used.push(x.k + 1);
          else insp.set.push({ phrase: x.k + 1, why: WHY[x.why || "range"] });
        });
        insp.used.sort((p, q) => p - q);
        insp.set.sort((p, q) => p.phrase - q.phrase);
        if (insp.used.length) {
          const a = assemble(P, M);
          best = Object.assign({}, best, { notes: a.out, units: a.units, pitches: P, masks: M });
        }
      }
    }
    const total = best.notes.reduce((s, n) => s + n.dur, 0);
    const swName = (p) => (raga.labels && raga.labels[mod12(p)] ? raga.labels[mod12(p)][0] : String(p)) + (p >= 12 ? "'" : p < 0 ? "." : "");
    const famInfo = fams.map((f) => ({ id: f.id, rounds: f.rounds, role: f.role, kind: f.kind, style: best.styles[f.id], how: best.hows[f.id] + (f.members.some((k) => best.inspired[k]) ? "; " + f.members.filter((k) => best.inspired[k]).length + " of its phrases from the inspiration" : ""), plan: best.plans[f.id] || null, lens: f.lens, line: best.lines[f.id], end: best.lines[f.id][best.lines[f.id].length - 1] }));
    const kindOf = (u) => u.role === "gap" ? "gap" : CADENCE.has(u.role) ? "mora" : best.styles[u.fam] === "sequence" || best.styles[u.fam] === "varied" || best.inspired[u.phrase] ? "nov" : "conv";
    const units = best.units.map((u) => ({ kind: kindOf(u), role: u.role, phrase: u.phrase, family: u.fam, inspired: u.phrase != null && best.inspired[u.phrase], name: u.role === "gap" ? "karvai" : (CADENCE.has(u.role) ? "cadence" : u.role) + " \xB7 family " + (u.fam + 1) + (fams[u.fam] && fams[u.fam].kind === "nested" ? " (" + fams[u.fam].lens.join(" \u2192 ") + ")" : "") + (best.inspired[u.phrase] ? " \xB7 inspired" : ""), notes: u.notes }));
    const last = best.pitches[best.pitches.length - 1], final = last[last.length - 1];
    const sylls = ph.reduce((s, q) => s + q.sylls.length, 0), swaras = best.notes.filter((n) => n.p != null).length;
    const checks = [
      { ok: total === R.body.length, text: "Exactly " + total + " pulses, the lab\u2019s span: every swara starts on one of its syllables (" + swaras + " swaras on " + sylls + " syllables), every phrase on its first." },
      { ok: true, text: "Every move obeys " + raga.name + "\u2019s direction rule: up to an arohana swara, down to an avarohana swara." },
      { ok: final === best.target, text: "The last swara is " + swName(final) + (opts.eduppuPitch != null ? ", next to the eduppu " + swName(opts.eduppuPitch) : "") + "." },
      { ok: fams.every((f) => f.kind !== "nested" || f.members.every((k) => {
        const r = ph[k].round, e0 = best.pitches[f.members[f.first[r]]];
        return best.pitches[k][best.pitches[k].length - 1] === e0[e0.length - 1];
      })), text: "Every nested family (a yati or pattern purvanga, a shaped mora) keeps one ending swara in each of its rounds." }
    ];
    if (insp) checks.push({ ok: true, text: insp.error ? "The inspiration could not be read: " + insp.error : insp.used.length + " of " + insp.suggested + " suggested phrases sung, fitted to the rhythm and the raga" + (insp.set.length ? "; set aside: " + insp.set.map((x) => "phrase " + x.phrase + " (" + x.why + ")").join(", ") : "") + "." });
    return {
      ok: checks.every((x) => x.ok),
      raga: raga.id,
      tala: R.tala,
      per: R.gati,
      kalai: R.kalai,
      lead: R.lead,
      slots: total,
      notes: best.notes,
      units,
      phrases: ph.map((q, k) => ({ role: q.role, family: q.fam, round: q.round || 0, mask: best.masks[k], inspired: best.inspired[k], pitches: best.pitches[k] })),
      families: famInfo,
      ending: { type: "rhythm", final, target: best.target, eduppu: opts.eduppuPitch == null ? null : opts.eduppuPitch },
      breath: { density: full ? "full" : "auto", syllables: sylls, swaras },
      inspiration: insp,
      label: R.label,
      form: R.form,
      dial: D,
      checks
    };
  }

  // src/engine/kalpana/inspire.js
  var INSPIRATION_SCHEMA = {
    type: "object",
    properties: {
      idea: { type: "string", description: "One or two sentences on the musical idea of the passage." },
      phrases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phrase: { type: "integer", description: "The phrase number, from 1." },
            swaras: { type: "string", description: "One token a syllable, separated by spaces: a swara, or a comma to hold the swara before." }
          },
          required: ["phrase", "swaras"],
          additionalProperties: false
        }
      }
    },
    required: ["idea", "phrases"],
    additionalProperties: false
  };
  var ROLE = { purvanga: "purvanga", statement: "cadence statement", uttaranga: "uttaranga (cadence)", mukhra: "mukhra", count: "count", speed1: "first speed", speed2: "second speed", speed3: "third speed" };
  function rhythmPrompt(raga, template, opts = {}) {
    const S = rhythmPhrases(template);
    if (S.error) return { error: S.error, code: "bad-rhythm" };
    const { R, phrases: ph, families: fams } = S, profile = getProfile(raga), D = dial(opts.T == null ? 0.8 : opts.T);
    const lab = (pc) => raga.labels && raga.labels[mod12(pc)] || String(mod12(pc));
    const sw = (p) => lab(p) + (p >= 24 ? "''" : p >= 12 ? "'" : p < 0 ? "." : "");
    const list = (pcs, none) => pcs && pcs.length ? pcs.map(lab).join(", ") : none;
    let landing;
    if (opts.eduppuPitch != null) {
      const nb = eduppuNeighbours(raga, opts.eduppuPitch);
      if (nb.error) return { error: nb.error, code: nb.code };
      const ok = [nb.lo, nb.hi].filter((p) => p != null);
      if (!ok.length) return { error: "No swara of " + raga.name + " steps legally into that eduppu.", code: "no-neighbour" };
      landing = "The song resumes on " + sw(opts.eduppuPitch) + " (the eduppu) right after the passage, so the last phrase must end on " + ok.map(sw).join(" or ") + ", the swara next to it, with a swara (not a comma) on its last syllable.";
    } else if (opts.targetPitch != null) landing = "The last phrase must end on " + sw(opts.targetPitch) + ", with a swara (not a comma) on its last syllable.";
    else return { error: "Give eduppuPitch or targetPitch.", code: "no-landing" };
    const L = [];
    L.push("Raga: " + raga.name + (raga.mela ? " (melakarta " + raga.mela + ")" : raga.parent ? " (a janya of " + raga.parent + ")" : "") + ".");
    L.push("Arohana: " + raga.aro.map(sw).join(" "));
    L.push("Avarohana: " + raga.avaro.map(sw).join(" "));
    L.push("Direction rule (hard): moving up, the next swara must be one of the arohana; moving down, one of the avarohana. Repeating a swara is always allowed.");
    if (profile) {
      L.push("Resting swaras (nyasa): " + list(profile.nyasa, "S and P") + ". Good landing swaras: " + list(profile.landing, "S and P") + ". Jiva (characteristic) swaras: " + list(profile.jiva, "none listed") + ".");
      L.push("Weak (alpa) swaras, touched but not dwelt on: " + list(profile.alpa, "none listed") + ". Do not end a phrase on: " + list(profile.alpa.concat(profile.avoidLanding, profile.notNyasa), "no restriction listed") + ".");
      const av = profile.avoid.filter((a) => a.pitches && a.pitches.length);
      if (av.length) L.push("Phrases to avoid: " + av.map((a) => a.pitches.map(sw).join(" ") + (a.strength === "hard" ? " (never)" : " (rarely)")).join("; ") + ".");
      const att = profile.phrases.slice().sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 8);
      if (att.length) {
        L.push("Phrases attested for " + raga.name + " (use them as models of its idiom, not to copy whole):");
        att.forEach((a) => {
          const s = getSource(a.source);
          L.push("  - " + a.pitches.map(sw).join(" ") + " (" + a.type + "; " + (s ? s.title : a.source) + ")");
        });
      }
    } else L.push("No detailed profile is available: rest on S and P and keep to the scale.");
    L.push("Range: from mandra P (P.) up to tara G (G'), mostly in the middle octave. Move mostly by step, sometimes a skip; no leap wider than a fifth inside a phrase or a sixth between phrases.");
    L.push("");
    const per = R.gati, total = R.body.length;
    L.push("Tala: " + R.tala.name + ", " + per + " pulses a beat" + (R.kalai > 1 ? ", kalai " + R.kalai : "") + ". The passage is " + total + " pulses long, from the korvai lab" + (R.form ? " (a " + R.form + (R.label ? ": " + R.label : "") + ")" : R.label ? " (" + R.label + ")" : "") + ".");
    L.push('Each phrase is written with its syllables (sollus); "|" marks a beat, and "~" is a pulse the lab already holds, which takes no token. Karvais between phrases are silent or held and need no swaras.');
    const famOf = fams.map((f) => {
      const nums = f.members.map((k) => k + 1).join(", ");
      if (f.kind === "nested") return "Phrases " + nums + " are one yati (" + f.lens.join(" \u2192 ") + " syllables): each is the end of a longer phrase, so sing them as the ends of one line, all ending on the same swara" + (f.rounds > 1 ? "; the whole yati comes " + f.rounds + " times, move it to other swaras each time" : "") + ".";
      if (f.kind === "repeat") return /^speed\d$/.test(f.role) ? "Phrases " + nums + " are one phrase at three speeds: sing the same swaras each time." : "Phrases " + nums + " repeat one rhythm: a repeated rhythm is not a repeated melody. Keep the shape but start it from another swara, as an alankara does, or vary it" + (f.members.includes(ph.length - 1) ? "; the last one lands" : "") + ".";
      return null;
    });
    ph.forEach((q, k) => {
      let s = "";
      q.cells.forEach((i) => {
        if ((R.lead + i) % per === 0) s += (s ? " " : "") + "|";
        const c = R.body[i];
        s += " " + (c.s && c.s !== "," ? c.s : "~");
      });
      const lastCell = q.cells[q.cells.length - 1], next = k + 1 < ph.length ? ph[k + 1].cells[0] : total;
      const gap = next - lastCell - 1;
      L.push("Phrase " + (k + 1) + " (" + (ROLE[q.role] || q.role) + ", " + q.sylls.length + " syllables, family " + (q.fam + 1) + "):" + s.replace(/\s+/g, " ") + (gap > 0 ? "   then a karvai of " + gap + " pulse" + (gap > 1 ? "s" : "") : ""));
    });
    famOf.filter(Boolean).forEach((x) => L.push(x));
    L.push("");
    L.push(landing);
    L.push("Creativity " + D.T.toFixed(1) + " of 2: " + (D.T < 0.6 ? "conventional; stepwise, familiar turns of the raga, clear sequences." : D.T < 1.3 ? "balanced; familiar idiom with some surprises, varied repetitions." : "adventurous; unexpected turns, skips and contrasts, still within the raga."));
    L.push("");
    L.push("How to write each phrase: exactly one token for each syllable, separated by spaces. A token is a swara, which starts on that syllable, or a comma, which holds the swara before it. Do not give every syllable its own swara: let lines breathe with held swaras, as singers do, keeping a swara on the first syllable of each phrase and usually on the beat. In a fast gati about half to two-thirds of the syllables carry a new swara.");
    L.push("Swaras: S R G M P D N (the variant number is optional, e.g. " + lab(raga.aro[1]) + "); an apostrophe after a swara for the upper octave (S'), a dot after it for the lower (P.).");
    L.push('Answer with JSON only: {"idea": "the musical idea in a sentence", "phrases": [{"phrase": 1, "swaras": "S , R G"}, ...]} with every phrase from 1 to ' + ph.length + ".");
    const system = "You are an experienced Carnatic musician who sings kalpana swaras. You suggest swara lines for a rhythm that is already fixed, keeping strictly to the raga's grammar. Your lines are taken as inspiration by a rule-based engine that checks every rule, so be idiomatic and musical rather than exhaustive.";
    return { system, prompt: L.join("\n"), schema: INSPIRATION_SCHEMA, phrases: ph.length };
  }

  // src/engine/gamaka/constants.js
  var constants_exports = {};
  __export(constants_exports, {
    ANCHOR_SHARE: () => ANCHOR_SHARE,
    ANDOLITA_SLOW: () => ANDOLITA_SLOW,
    CPN_MIN: () => CPN_MIN,
    CYCLE_MAX: () => CYCLE_MAX,
    CYCLE_MIN: () => CYCLE_MIN,
    DRIFT_CENTS: () => DRIFT_CENTS,
    FLUTTER_CENTS: () => FLUTTER_CENTS,
    JARU_SEC: () => JARU_SEC,
    LAND_HOLD: () => LAND_HOLD,
    LEAP_MAX: () => LEAP_MAX,
    MAX_RATE_HZ: () => MAX_RATE_HZ,
    MAX_SLOPE: () => MAX_SLOPE,
    MOVE_MAX: () => MOVE_MAX,
    MOVE_PER_ST: () => MOVE_PER_ST,
    MOVE_SEC: () => MOVE_SEC,
    NOKKU_SEC: () => NOKKU_SEC,
    ORIKKAI_SEC: () => ORIKKAI_SEC,
    OVERSHOOT: () => OVERSHOOT,
    OVERSHOOT_MAX: () => OVERSHOOT_MAX,
    OVERSHOOT_PEAK: () => OVERSHOOT_PEAK,
    PEAK_CENTS: () => PEAK_CENTS,
    PEAK_SHORT: () => PEAK_SHORT,
    PREP: () => PREP,
    PREP_MAX: () => PREP_MAX,
    PREP_PEAK: () => PREP_PEAK,
    REACH_JITTER: () => REACH_JITTER,
    SAMPLE_SEC: () => SAMPLE_SEC,
    SEMITONE_SEC: () => SEMITONE_SEC,
    STA_DWELL: () => STA_DWELL,
    TIME_JITTER: () => TIME_JITTER,
    TRANS_SEC: () => TRANS_SEC,
    TURN_FULL: () => TURN_FULL,
    TURN_SEC: () => TURN_SEC,
    VOICE_GLIDE: () => VOICE_GLIDE
  });
  var CPN_MIN = 0.08;
  var STA_DWELL = 0.06;
  var TRANS_SEC = 0.05;
  var JARU_SEC = 0.14;
  var NOKKU_SEC = 0.05;
  var ORIKKAI_SEC = 0.07;
  var MAX_RATE_HZ = 5;
  var LAND_HOLD = 0.25;
  var ANDOLITA_SLOW = 1.8;
  var SAMPLE_SEC = 5e-3;
  var MAX_SLOPE = 1.4;
  var MOVE_SEC = 0.08;
  var MOVE_PER_ST = 8e-3;
  var MOVE_MAX = 0.13;
  var TURN_SEC = 0.02;
  var TURN_FULL = 0.035;
  var REACH_JITTER = 0.12;
  var TIME_JITTER = 0.18;
  var OVERSHOOT = 0.08;
  var OVERSHOOT_MAX = 0.22;
  var OVERSHOOT_PEAK = 0.035;
  var PREP = 0.04;
  var PREP_MAX = 0.12;
  var PREP_PEAK = 0.04;
  var DRIFT_CENTS = 3;
  var FLUTTER_CENTS = 1.2;
  var SEMITONE_SEC = 0.05;
  var LEAP_MAX = 0.16;
  var CYCLE_MIN = 0.25;
  var CYCLE_MAX = 0.5;
  var ANCHOR_SHARE = 0.7;
  var PEAK_CENTS = 25;
  var PEAK_SHORT = 0.07;
  var VOICE_GLIDE = 0.6;

  // src/engine/gamaka/shapes.js
  var PLAIN = Object.freeze({ onset: "none", body: "plain", exit: "none" });
  var sta = (p, dur, role) => ({ p, dur, kind: "sta", flex: false, min: dur, role });
  var cpn = (p, min, role) => ({ p, dur: min, kind: "cpn", flex: true, min, role });
  function onsetTargets(s, n, scale, flick) {
    switch (s.onset) {
      case "nokku":
      case "odukkal":
      case "sphurita":
      case "pratyahata":
        return [sta(n + scale(s.from != null ? s.from : s.onset === "nokku" ? 1 : -1, "onset"), flick, "onset")];
      default:
        return [];
    }
  }
  function targets(s, n, depth, level, cycles, landing, geo) {
    const rc = (comp) => s && s.reach && s.reach[comp] != null ? s.reach[comp] : 1;
    const scale = (off, comp) => depth * rc(comp) * (off || 0);
    const g = geo || {}, staSec = g.sta != null ? g.sta : STA_DWELL, flick = g.flick != null ? g.flick : NOKKU_SEC, flickUp = g.orikkai != null ? g.orikkai : ORIKKAI_SEC;
    const out = [];
    if (level >= 3 || !s) return [cpn(n, Math.max(CPN_MIN, landing || 0), "body")];
    out.push(...onsetTargets(s, n, scale, flick));
    const body = level >= 2 ? "plain" : s.body;
    if (body === "plain") out.push(cpn(n, Math.max(CPN_MIN, landing || 0), "body"));
    else {
      const slow = body === "andolita" ? ANDOLITA_SLOW : 1;
      const dw = s.dwell === "hi" ? [1.5, 0.5] : s.dwell === "lo" ? [0.5, 1.5] : [1, 1];
      const lo = n + scale(s.lo, "body"), hi = n + scale(s.hi, "body");
      const nat = !!g.natural, at = { hi, lo }, dwOf = { hi: dw[0], lo: dw[1] };
      const turn = (role) => {
        const t = sta(at[role], staSec * dwOf[role] * slow, role);
        if (nat && (!s.dwell || s.dwell === "even" || s.dwell === role)) t.anchor = !s.dwell || s.dwell === "even" ? 0.5 : 1;
        return t;
      };
      const first = nat && s.flowIn === "lo" ? "lo" : "hi", second = first === "hi" ? "lo" : "hi";
      const flow = nat && !!s.flowIn;
      if (!flow) out.push(cpn(n, 0, "head"));
      const whole = flow ? Math.max(1, Math.ceil(cycles - 1e-9)) : Math.floor(cycles + 1e-9);
      for (let c = 0; c < whole; c++) {
        out.push(turn(first));
        out.push(turn(second));
      }
      if (!flow && cycles % 1) out.push(turn(first));
      if (nat && s.antic && cycles >= 1 && at[s.antic] !== out[out.length - 1].p) out.push(turn(s.antic));
      const endP = s.end === "hi" ? hi : s.end === "lo" ? lo : n;
      if (out[out.length - 1].p === endP) out.pop();
      out.push(cpn(endP, CPN_MIN, "end"));
    }
    if (level < 2 && s.exit === "orikkai") out.push(sta(n + scale(s.exitTo != null ? s.exitTo : 1, "exit"), flickUp, "exit"));
    const merged = [];
    for (const x of out) {
      const last = merged[merged.length - 1];
      if (last && Math.abs(last.p - x.p) < 1e-9) {
        last.dur += x.dur;
        last.min += x.min;
        last.flex = last.flex || x.flex;
        last.kind = last.flex ? "cpn" : last.kind;
        if (last.flex) delete last.anchor;
      } else merged.push(Object.assign({}, x));
    }
    return merged;
  }
  function cycleRange(s) {
    if (!s || s.body === "plain" || !s.body) return [0, 0];
    const c = s.cycles || [1, 1], max = s.body === "andolita" ? Math.min(2, c[1]) : c[1];
    return [Math.min(c[0], max), max];
  }
  function isGamaka(ts) {
    return ts.length > 1 || ts.some((t) => t.kind === "sta");
  }

  // src/engine/gamaka/intensity.js
  var HEAVY_AT = 0.85;
  var SALIENCE = {
    raga: { body: 0.92, onset: 0.75, exit: 0.7 },
    // the swara grammar (gamaka/grammar.js): sourced, phrase-aware rules for every raga
    grammar: { body: 0.82, onset: 0.66, exit: 0.6 },
    vague: { body: 0.6, onset: 0.6, exit: 0.6 },
    generic: { body: 0.45, onset: 0.38, exit: 0.38 }
  };
  var originOf = (rule) => !rule || rule.basis === "default" ? "generic" : rule.basis === "grammar" ? "grammar" : rule.basis === "text-vague" ? "vague" : "raga";
  var salience = (origin, comp) => SALIENCE[origin][comp];
  var need = (s) => 0.9 * (1 - s);
  function reach(a, s) {
    const n = need(s);
    if (a < n) return 0;
    return n >= 1 ? 1 : 0.6 + 0.4 * Math.min(1, (a - n) / (1 - n));
  }
  function cyclesAt(a, cycles) {
    const c0 = cycles[0], c1 = cycles[1], f = Math.min(1, Math.max(0, (a - 0.2) / 0.6));
    return Math.max(c0, Math.min(c1, c0 + Math.round((c1 - c0) * f)));
  }
  var human = (a) => a <= 0 ? 0 : a <= 0.55 ? a / 0.55 : Math.max(0, (1 - a) / 0.45);
  var motion = (a) => Math.min(1, Math.max(0, a / 0.2));
  var clamp01 = (a) => Math.min(1, Math.max(0, +a || 0));

  // src/engine/gamaka/contour.js
  var cosine = (a, b, u) => a + (b - a) * (1 - Math.cos(Math.PI * u)) / 2;
  var minWidth = (d) => Math.abs(d) * (Math.PI / 2) * SAMPLE_SEC / MAX_SLOPE;
  var stepSec = (d) => Math.min(MOVE_MAX, MOVE_SEC + MOVE_PER_ST * Math.max(0, Math.abs(d) - 1));
  var moveSec = (d) => Math.max(stepSec(d), Math.min(LEAP_MAX, SEMITONE_SEC * Math.abs(d)));
  var bump = (x) => x <= 0 ? 0 : x * x * Math.exp(2 * (1 - x));
  var LEGACY = { geo: null, move: () => TRANS_SEC, vary: () => {
  } };
  function naturalKit(nat, i, n) {
    const r = rng((nat.seed * 2654435761 ^ (i + 1) * 40503) >>> 0);
    const gauss = () => {
      let u2 = 0;
      while (u2 === 0) u2 = r();
      return Math.max(-2, Math.min(2, Math.sqrt(-2 * Math.log(u2)) * Math.cos(2 * Math.PI * r())));
    };
    const z = [], u = [];
    for (let k = 0; k < 24; k++) {
      z.push(gauss());
      u.push(r());
    }
    const turn = TURN_SEC + (TURN_FULL - TURN_SEC) * Math.min(1, Math.max(0, (nat.a - 0.6) / 0.4));
    return {
      geo: { sta: turn, flick: turn, orikkai: turn * 2, natural: true },
      tight: { sta: TURN_SEC, flick: TURN_SEC, orikkai: TURN_SEC * 2, natural: true },
      // when time is short: standard turns
      // a swing between two turns of an oscillation obeys the speed limit; a flick or a move to a hold keeps the step timing
      move: (a, b, k, even, swing) => (swing ? moveSec(b - a) : stepSec(b - a)) * (even ? 1 : 1 + TIME_JITTER * nat.hum * u[k % u.length]),
      // a turn reaches a little more or less of its swing; the swara's own pitch never moves
      vary: (ts) => ts.forEach((t, k) => {
        if (t.kind === "sta") t.p = n + (t.p - n) * (1 + REACH_JITTER * nat.hum * z[k % z.length]);
      }),
      // S210 §6.3.5: a short peak between two lower turns overshoots by 25 c per semitone of depth beyond
      // one (depth = min(3, rise, fall) − 1); an anchor is sustained and does not. The overshoot is sung,
      // not aimed at: the target keeps its raga pitch and only the contour goes past it
      peaks: (ts) => ts.forEach((t, k) => {
        if (t.kind !== "sta" || t.anchor === 1 || t.dur > PEAK_SHORT + 1e-9 || !(t.role === "hi" || t.role === "lo")) return;
        const a = ts[k - 1], b = ts[k + 1];
        if (!a || !b) return;
        const depth = Math.max(0, Math.min(3, Math.round(t.p - a.p), Math.round(t.p - b.p)) - 1);
        if (depth > 0) t.peak = depth * PEAK_CENTS / 100 * nat.mot;
      })
    };
  }
  function paceCycles(ts, moves) {
    for (let j = 0; j + 1 < ts.length; j++) {
      const a = ts[j], b = ts[j + 1];
      if (a.kind !== "sta" || b.kind !== "sta" || !(a.role === "hi" || a.role === "lo") || !(b.role === "hi" || b.role === "lo") || a.role === b.role || a.paced) continue;
      const wa = a.anchor || 0, wb = b.anchor || 0, ws = wa + wb || 2, sa = (wa || (ws === 2 ? 1 : 0)) / ws, sb = (wb || (ws === 2 ? 1 : 0)) / ws;
      const per = a.dur + b.dur + 2 * moves[j];
      if (per < CYCLE_MIN) {
        const d = CYCLE_MIN - per;
        a.dur += d * sa;
        a.min = a.dur;
        b.dur += d * sb;
        b.min = b.dur;
      }
      const room = Math.max(0, CYCLE_MAX - Math.max(per, CYCLE_MIN));
      a.room = room * (a.anchor ? sa : 0);
      b.room = room * (b.anchor ? sb : 0);
      a.paced = b.paced = true;
      j++;
    }
    ts.forEach((t) => {
      if (t.kind === "sta" && t.anchor && !t.paced) t.room = (CYCLE_MAX - CYCLE_MIN) * t.anchor;
    });
  }
  function fitNote(shape, n, depth, avail, landing, K) {
    const [cmin, cmax] = cycleRange(shape);
    const tries = [];
    tries.push([0, cmax]);
    for (let c = cmax - 1; c >= 1; c--) tries.push([1, c]);
    if (cmin > 1 && !tries.some((x) => x[1] === cmin)) tries.push([1, cmin]);
    if (K.geo && cmax >= 1) tries.push([1, 0.5]);
    tries.push([2, 0], [3, 0]);
    const attempts = [];
    tries.forEach(([level, cycles]) => {
      attempts.push([level, cycles, false]);
      if (K.geo && level < 3) attempts.push([level, cycles, true]);
    });
    for (const [level, cycles, even] of attempts) {
      const ts = targets(shape, n, depth, level, cycles, landing, even ? K.tight : K.geo);
      K.vary(ts);
      if (K.geo) K.peaks(ts);
      const turnOf = (x) => x.kind === "sta" && (x.role === "hi" || x.role === "lo");
      const moves = ts.slice(1).map((t, k) => K.move(ts[k].p, t.p, k, even, turnOf(ts[k]) && turnOf(t)));
      if (K.geo) paceCycles(ts, moves);
      const fixed = ts.reduce((s, t) => s + (t.flex ? t.min : t.dur), 0) + moves.reduce((s, m) => s + m, 0);
      if (fixed <= avail + 1e-9 || level === 3) {
        let spare = avail - fixed;
        if (spare < 0 && level === 3) {
          ts.forEach((t) => {
            t.dur = 0;
          });
          return { ts: [Object.assign(ts[0], { dur: Math.max(0, avail) })], level, squeezed: true, moves: [] };
        }
        spare = Math.max(0, spare);
        const anchors = ts.filter((t) => t.room > 0), room = anchors.reduce((s, t) => s + t.room, 0);
        if (room > 0 && spare > 0) {
          const give = Math.min(room, spare * (ts.some((t) => t.flex) ? ANCHOR_SHARE : 1));
          anchors.forEach((t) => {
            t.dur += give * t.room / room;
          });
          spare -= give;
        }
        const flex = ts.filter((t) => t.flex), w = (t) => t.role === "head" ? 0.4 : t.role === "end" ? 0.6 : 1;
        const wsum = flex.reduce((s, t) => s + w(t), 0);
        ts.forEach((t) => {
          if (t.flex) t.dur = t.min + (wsum ? spare * w(t) / wsum : 0);
        });
        if (!flex.length) ts[ts.length - 1].dur += spare;
        return { ts, level: level === 0 && cycles < cmax ? 1 : level, cycles, moves };
      }
    }
  }
  function fluctuation(seed, scale) {
    const r = rng((seed * 7919 ^ 1540483477) >>> 0), comps = [];
    const add = (lo, hi, rms) => {
      const amp = rms / 100 / Math.sqrt(1.5) * scale;
      for (let k = 0; k < 3; k++) comps.push([amp, 2 * Math.PI * (lo + (hi - lo) * r()), 2 * Math.PI * r()]);
    };
    add(0.4, 1.8, DRIFT_CENTS);
    add(6, 11, FLUTTER_CENTS);
    return (t) => comps.reduce((s, c) => s + c[0] * Math.sin(c[1] * t + c[2]), 0);
  }
  function buildContour(items, opts) {
    const o = opts || {}, slotSec = o.slotSec, depth = o.depth == null ? 1 : o.depth;
    if (!(slotSec > 0)) throw new Error("buildContour needs slotSec > 0");
    const nat = o.natural && depth > 0 ? ((a) => ({
      a,
      seed: (o.natural.seed || 1) >>> 0,
      hum: human(a),
      mot: o.natural.motion != null ? clamp01(o.natural.motion) : motion(a),
      glide: o.natural.glide > 0 ? o.natural.glide : 1
    }))(clamp01(o.natural.intensity == null ? 1 : o.natural.intensity)) : null;
    const wscale = depth <= 0 ? 0 : nat ? 1 : Math.min(1, depth * 4);
    const N = items.length, t0s = [], t1s = [];
    let acc = 0;
    items.forEach((it) => {
      t0s.push(acc * slotSec);
      acc += it.dur;
      t1s.push(acc * slotSec);
    });
    const sounding = (i) => i >= 0 && i < N && items[i].p != null;
    const kits = items.map((it, i) => nat && it.p != null ? naturalKit(nat, i, it.p) : LEGACY);
    const rc = (sh, k) => sh.reach && sh.reach[k] != null ? sh.reach[k] : 1;
    const firstP = (it) => {
      const sh = it.shape;
      if (sh && sh.from != null && sh.onset && sh.onset !== "none" && sh.onset !== "jaru") return it.p + depth * rc(sh, "onset") * sh.from;
      if (nat && sh && sh.flowIn && sh.body && sh.body !== "plain") return it.p + depth * rc(sh, "body") * (sh.flowIn === "hi" ? sh.hi : sh.lo);
      return it.p;
    };
    const lastP = (it) => {
      const sh = it.shape;
      if (!sh) return it.p;
      if (sh.exit === "orikkai") return it.p + depth * rc(sh, "exit") * (sh.exitTo != null ? sh.exitTo : 1);
      if (sh.body && sh.body !== "plain" && (sh.end === "hi" || sh.end === "lo")) return it.p + depth * rc(sh, "body") * (sh.end === "hi" ? sh.hi : sh.lo);
      return it.p;
    };
    const half = (i) => {
      if (!nat) return TRANS_SEC / 2;
      const d = firstP(items[i]) - lastP(items[i - 1]);
      return Math.abs(d) < 0.05 ? 0.01 : stepSec(d) / 2 * nat.glide;
    };
    const R = new Array(N).fill(0), L = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
      if (!sounding(i)) continue;
      const sh = items[i].shape || {};
      const slide = (h, j) => nat ? items[j].p !== items[j - 1].p ? Math.max(h, JARU_SEC - h) : h : JARU_SEC - h;
      if (sounding(i - 1)) {
        const h = half(i);
        R[i] = (sh.onset === "jaru" ? slide(h, i) : h) * wscale;
      }
      if (sounding(i + 1)) {
        const h = half(i + 1);
        L[i] = (sh.exit === "jaru" ? slide(h, i + 1) : h) * wscale;
      }
    }
    const fit = new Array(N);
    const fitAt = (i) => {
      const it = items[i], sec = t1s[i] - t0s[i];
      let r = R[i], l = L[i];
      if (r + l > sec) {
        const k = sec / (r + l);
        r *= k;
        l *= k;
        R[i] = r;
        L[i] = l;
      }
      fit[i] = fitNote(it.shape, it.p, depth, sec - r - l, it.landing ? LAND_HOLD : 0, kits[i]);
    };
    for (let i = 0; i < N; i++) if (sounding(i)) fitAt(i);
    if (wscale > 0) for (let i = 1; i < N; i++) {
      if (!sounding(i) || !sounding(i - 1)) continue;
      const a = fit[i - 1].ts[fit[i - 1].ts.length - 1].p, b = fit[i].ts[0].p, need2 = minWidth(b - a);
      if (L[i - 1] + R[i] < need2 - 1e-12) {
        const k = need2 / Math.max(1e-9, L[i - 1] + R[i]);
        L[i - 1] = Math.max(L[i - 1] * k, need2 / 2);
        R[i] = Math.max(R[i] * k, need2 / 2);
        fitAt(i - 1);
        fitAt(i);
      }
    }
    const groups = [], notes = [];
    let g = null;
    for (let i = 0; i < N; i++) {
      if (!sounding(i)) {
        if (g) {
          groups.push(g);
          g = null;
        }
        notes.push({ i, t0: t0s[i], t1: t1s[i], p: null, rest: true });
        continue;
      }
      if (!g) g = { t0: t0s[i], t1: t1s[i], segs: [], notes: [] };
      const ts = fit[i].ts, moves = fit[i].moves, abs = [];
      const sung = (tg) => tg.p + (tg.peak || 0);
      let cur = t0s[i] + R[i];
      ts.forEach((tg, k) => {
        const end = k === ts.length - 1 ? t1s[i] - L[i] : cur + tg.dur;
        g.segs.push({ a: cur, b: end, p0: sung(tg), p1: sung(tg), kind: tg.kind });
        abs.push({ t: cur, dur: end - cur, p: tg.p, kind: tg.kind, role: tg.role });
        cur = end;
        if (k < ts.length - 1) {
          g.segs.push({ a: cur, b: cur + moves[k], p0: sung(tg), p1: sung(ts[k + 1]) });
          cur += moves[k];
        }
      });
      if (sounding(i + 1)) g.segs.push({ a: t1s[i] - L[i], b: t1s[i] + R[i + 1], p0: ts[ts.length - 1].p, p1: null, next: i + 1 });
      g.t1 = t1s[i];
      const sh = items[i].shape, plainShape = !sh || (sh.body || "plain") === "plain" && (sh.onset || "none") === "none" && (sh.exit || "none") === "none";
      notes.push({ i, t0: t0s[i], t1: t1s[i], p: items[i].p, targets: abs, degraded: plainShape ? 0 : fit[i].level, gamaka: isGamaka(ts), shape: items[i].shape || null });
      g.notes.push(i);
    }
    if (g) groups.push(g);
    groups.forEach((gr) => gr.segs.forEach((s) => {
      if (s.p1 === null) s.p1 = fit[s.next].ts[0].p;
    }));
    if (nat && nat.mot > 0) groups.forEach((gr) => gr.segs.forEach((s, j) => {
      if (s.p0 !== s.p1 || s.kind !== "cpn" || !(s.b > s.a)) return;
      const prev = gr.segs[j - 1], next = gr.segs[j + 1];
      const into = prev && prev.p0 !== prev.p1 ? s.p0 - prev.p0 : 0, out = next && next.p0 !== next.p1 ? next.p1 - s.p0 : 0;
      s.over = Math.sign(into) * Math.min(OVERSHOOT_MAX, OVERSHOOT * Math.abs(into)) * nat.mot;
      s.prep = -Math.sign(out) * Math.min(PREP_MAX, PREP * Math.abs(out)) * nat.mot;
    }));
    const fluct = nat && nat.mot > 0 ? fluctuation(nat.seed, nat.mot) : null;
    const points = [];
    groups.forEach((gr) => {
      gr.points = [];
      let k = 0;
      const at = (t) => {
        while (k < gr.segs.length - 1 && (t >= gr.segs[k].b || gr.segs[k].b <= gr.segs[k].a)) k++;
        const s = gr.segs[k];
        if (s.b <= s.a) return s.p1;
        const u = Math.min(1, Math.max(0, (t - s.a) / (s.b - s.a)));
        if (s.p0 !== s.p1) return cosine(s.p0, s.p1, u);
        let p = s.p0;
        if (s.over || s.prep) {
          const D = s.b - s.a, tin = t - s.a, tout = s.b - t;
          if (s.over) p += s.over * bump(tin / OVERSHOOT_PEAK) * Math.min(1, D / (2 * OVERSHOOT_PEAK)) * Math.min(1, tout / (0.3 * D));
          if (s.prep) p += s.prep * bump(tout / PREP_PEAK) * Math.min(1, D / (2 * PREP_PEAK)) * Math.min(1, tin / (0.3 * D));
        }
        return p;
      };
      const first = Math.ceil(gr.t0 / SAMPLE_SEC - 1e-9);
      const ts = [gr.t0];
      for (let j = first; j * SAMPLE_SEC < gr.t1 - 1e-9; j++) if (j * SAMPLE_SEC > gr.t0 + 1e-9) ts.push(j * SAMPLE_SEC);
      ts.push(gr.t1);
      ts.forEach((t) => {
        const pt = { t, p: at(t) + (fluct ? fluct(t) : 0) };
        gr.points.push(pt);
        points.push(pt);
      });
      delete gr.segs;
    });
    const sound = notes.filter((n) => !n.rest);
    return {
      points,
      groups,
      notes,
      stats: {
        gamakaShare: sound.length ? sound.filter((n) => n.gamaka).length / sound.length : 0,
        degradedShare: sound.length ? sound.filter((n) => n.degraded > 0).length / sound.length : 0,
        staCount: sound.reduce((s, n) => s + n.targets.filter((x) => x.kind === "sta").length, 0)
      }
    };
  }

  // src/engine/gamaka/grammar.js
  var NAME = { 1: "R1", 2: "R2", 3: "G2", 4: "G3", 5: "M1", 6: "M2", 8: "D1", 9: "D2", 10: "N2", 11: "N3" };
  var swaraName2 = (raga, p) => {
    const lab = raga && raga.labels && raga.labels[mod12(p)];
    return lab || NAME[mod12(p)] || "?";
  };
  var LONG = 0.4;
  var MID = 0.22;
  var plain = (id, why) => ({ onset: "none", body: "plain", exit: "none", src: id === "G1" ? "S198" : "S202", basis: "grammar", grammar: id, why });
  function swaraRule(ctx, sc, raga) {
    const p = ctx.p, pc = mod12(p), name = swaraName2(raga, p);
    if (pc === 0 || pc === 7) return plain("G1", (pc ? "P" : "S") + " is achala: held plain");
    const upN = sc.step(p, 1), dnN = sc.step(p, -1), up = upN - p, dn = p - dnN;
    const nameOf = (q) => swaraName2(raga, q);
    const heading = ctx.next != null && ctx.next !== p ? Math.sign(ctx.next - p) : 0;
    const sec = ctx.sec;
    const shaped = (rule, target) => {
      if (sec >= LONG - 1e-9) return Object.assign(rule, { cycles: [1, 3] });
      if (sec >= MID - 1e-9) return Object.assign(rule, { cycles: [1, 1] });
      return { onset: target > 0 ? "nokku" : "odukkal", from: target, body: "plain", exit: "none", src: rule.src, basis: "grammar", grammar: rule.grammar, why: rule.why + "; at this speed a single touch" };
    };
    if ((pc === 1 || pc === 8) && dn === 1) {
      const anchor = pc === 1 ? "S" : "P";
      return shaped({
        onset: "none",
        body: "kampita",
        lo: -1,
        hi: 0,
        end: "self",
        dwell: "lo",
        src: "S203",
        basis: "grammar",
        grammar: "G2",
        why: name + ", a half step above " + anchor + ", is deflected into " + anchor + ": it rests on " + anchor + " and rises to itself in spurts"
      }, -1);
    }
    if (up === 1) {
      if (dn >= 3) return shaped({
        onset: "none",
        body: "kampita",
        lo: 0,
        hi: 1,
        end: "self",
        dwell: "hi",
        src: "S203",
        basis: "grammar",
        grammar: "G3a",
        why: name + ", with an augmented second below, oscillates up into " + nameOf(upN) + " and lives mostly there"
      }, 1);
      const nearSP = (pc === 11 || pc === 6) && (mod12(upN) === 0 || mod12(upN) === 7);
      if (nearSP && (ctx.prev === upN || ctx.next === upN) && (sec >= LONG - 1e-9 || ctx.next === upN && sec >= MID - 1e-9))
        return shaped({
          onset: "none",
          body: "kampita",
          lo: 0,
          hi: 1,
          end: "self",
          dwell: "hi",
          src: "S209",
          basis: "grammar",
          grammar: "G3c",
          why: name + ", sung next to " + nameOf(upN) + ", is a kampita very close to " + nameOf(upN)
        }, 1);
      if ((pc === 11 || pc === 6) && ctx.prev === upN && sec >= MID - 1e-9)
        return { onset: "nokku", from: 1, body: "plain", exit: "none", src: "S203", basis: "grammar", grammar: "G3b", why: name + ", just below " + nameOf(upN) + ", is touched from " + nameOf(upN) + " as the phrase comes down, then held straight" };
      const towardIt = ctx.next != null && ctx.next > p && mod12(upN) !== 0 && mod12(upN) !== 7;
      return plain("G3", name + " is a semitone below " + nameOf(upN) + ": held straight" + (towardIt ? " as the phrase rises to " + nameOf(upN) + ", which takes the gamaka" : ""));
    }
    if (up >= 4 && dn === 1) return shaped({
      onset: "none",
      body: "kampita",
      lo: 0,
      hi: 1,
      end: "self",
      dwell: "lo",
      src: "S203",
      basis: "grammar",
      grammar: "G4w",
      why: name + ", a half step above " + nameOf(dnN) + " with a wide gap above, oscillates up by a half step to stand apart from " + nameOf(dnN)
    }, 1);
    if (ctx.janta && sec < LONG) return { onset: "sphurita", from: -Math.min(dn, 2), body: "plain", exit: "none", src: "S198", basis: "grammar", grammar: "G4", why: "the second of a repeated " + name + ": struck from below (sphurita)" };
    if (pc === 5 && dn === 1 && up === 2 && ctx.prev === dnN && ctx.next === upN)
      return shaped({
        onset: "none",
        body: "kampita",
        lo: -1,
        hi: 2,
        end: "self",
        dwell: "lo",
        src: "S209",
        basis: "grammar",
        grammar: "G4m",
        why: name + " between " + nameOf(dnN) + " and " + nameOf(upN) + " on the way up is sung " + nameOf(dnN) + " " + nameOf(upN) + " " + nameOf(dnN) + ", from " + nameOf(dnN)
      }, -1);
    const wUp = Math.min(up, 3), wDn = Math.min(dn, 3);
    if (heading > 0) {
      return shaped({
        onset: "none",
        body: "kampita",
        lo: 0,
        hi: wUp,
        end: "self",
        dwell: "lo",
        src: "S202",
        basis: "grammar",
        grammar: "G4",
        why: name + " has a whole tone or more above it: it oscillates up toward " + nameOf(upN) + " as the phrase rises, borrowing its shade"
      }, wUp);
    }
    return shaped({
      onset: "none",
      body: "kampita",
      lo: -wDn,
      hi: 0,
      end: "self",
      dwell: "hi",
      src: "S202",
      basis: "grammar",
      grammar: "G4",
      why: name + " oscillates down toward " + nameOf(dnN) + " as the phrase " + (heading < 0 ? "falls" : "stays") + ", borrowing its shade"
    }, -wDn);
  }
  function adjacency(out, sc, raga) {
    const osc = (x) => x && x.rule && (x.rule.body === "kampita" || x.rule.body === "andolita");
    const sourced = (x) => x.rule.basis !== "grammar" && x.rule.basis !== "default" && x.rule.basis !== "text-vague";
    const steps = (a, b) => {
      let k = 0, q = a;
      const d = Math.sign(b - a);
      while (q !== b && Math.abs(k) < 3) {
        q += d;
        if (sc.pcs.includes(mod12(q))) k++;
      }
      return k;
    };
    const flat = [];
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1], b = out[i];
      if (!osc(a) || !osc(b) || steps(a.ctx.p, b.ctx.p) !== 1) continue;
      if (sourced(a) && sourced(b)) continue;
      const lo = a.ctx.p < b.ctx.p ? a : b, hi = lo === a ? b : a;
      if (!((lo.rule.hi || 0) > 0 || (hi.rule.lo || 0) < 0)) continue;
      const RANK = { G2: 2, G3a: 2 }, rank = (x) => RANK[x.rule.grammar] || 1;
      let lose;
      if (sourced(a)) lose = b;
      else if (sourced(b)) lose = a;
      else if (rank(a) !== rank(b)) lose = rank(a) < rank(b) ? a : b;
      else {
        const lower = a.ctx.p < b.ctx.p ? a : b, upper = lower === a ? b : a;
        lose = Math.abs(a.ctx.p - b.ctx.p) === 1 ? lower : upper;
      }
      const keep = lose === a ? b : a;
      lose.rule = {
        onset: "none",
        body: "plain",
        exit: "none",
        src: "S202",
        basis: "grammar",
        grammar: "G6",
        why: swaraName2(raga, lose.ctx.p) + " held flat beside the oscillating " + swaraName2(raga, keep.ctx.p) + " (one of two adjacent svaras is held flat)"
      };
      flat.push(out.indexOf(lose));
    }
    return flat;
  }

  // src/engine/gamaka/resolve.js
  function scaleOf(raga) {
    const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
    const step = (p, k) => {
      let q = p, n = Math.abs(k), dir = Math.sign(k);
      while (n > 0) {
        q += dir;
        if (pcs.includes(mod12(q))) n--;
      }
      return q;
    };
    return { pcs, step, isNote: (p) => Number.isInteger(p) && pcs.includes(mod12(p)) };
  }
  function contextOf(notes, i, slotSec, sc) {
    const n = notes[i], p = n.p;
    const prev = i > 0 && notes[i - 1].p != null ? notes[i - 1].p : null;
    const next = i < notes.length - 1 && notes[i + 1].p != null ? notes[i + 1].p : null;
    let dir;
    if (prev != null && next != null) {
      if (prev < p && p <= next) dir = "up";
      else if (prev > p && p >= next) dir = "down";
      else if (p > prev && p > next || p < prev && p < next) dir = "turn";
      else dir = "flat";
    } else if (prev != null) dir = p > prev ? "up" : p < prev ? "down" : "flat";
    else if (next != null) dir = next > p ? "up" : next < p ? "down" : "flat";
    else dir = "flat";
    const leap = prev != null && Math.abs(countSteps(sc, prev, p)) >= 2;
    return { i, p, prev, next, dir, sec: n.dur * slotSec, janta: prev === p, leap, octave: Math.floor(p / 12) };
  }
  function countSteps(sc, a, b) {
    let k = 0, q = a;
    const d = Math.sign(b - a);
    while (q !== b && Math.abs(k) < 40) {
      q += d;
      if (sc.pcs.includes(mod12(q))) k += d;
    }
    return k;
  }
  function matches(w, ctx, notes) {
    if (w.dir && w.dir !== ctx.dir) return false;
    if (w.minSec != null && ctx.sec < w.minSec - 1e-9) return false;
    if (w.maxSec != null && ctx.sec > w.maxSec + 1e-9) return false;
    if (w.janta && !ctx.janta) return false;
    if (w.octave != null && w.octave !== ctx.octave) return false;
    const nb = (spec, q) => q != null && mod12(q) === spec.pc && (!spec.rel || (spec.rel === "up" ? q > ctx.p : q < ctx.p));
    if (w.prev && !nb(w.prev, ctx.prev)) return false;
    if (w.next && !nb(w.next, ctx.next)) return false;
    if (w.inPhrase) {
      const pat = w.inPhrase, L = pat.length;
      let hit = false;
      for (let s = Math.max(0, ctx.i - L + 1); s <= ctx.i && !hit; s++) {
        if (s + L > notes.length) break;
        let k = 0;
        while (k < L && notes[s + k].p != null && mod12(notes[s + k].p) === pat[k]) k++;
        if (k === L) hit = true;
      }
      if (!hit) return false;
    }
    return true;
  }
  function styleDefault(style, ctx, sc) {
    const pc = mod12(ctx.p);
    if (style === "plain") return null;
    if (pc === 0 || pc === 7) return { onset: "none", body: "plain", exit: "none", src: "S198", basis: "default", why: "S and P are held steady" };
    const depth = style === "medium" ? 0.8 : 0.5, cyc = style === "medium" ? [1, 2] : [1, 1];
    const below = sc.step(ctx.p, -1) - ctx.p, above = sc.step(ctx.p, 1) - ctx.p;
    const out = { onset: "none", body: "plain", exit: "none", src: "S198", basis: "default", why: style + " default" };
    if (ctx.sec >= 0.4 - 1e-9) Object.assign(out, { body: "kampita", lo: below, hi: 0, cycles: cyc, end: "self", depth });
    if (ctx.dir === "down" && ctx.sec >= 0.2 - 1e-9) Object.assign(out, { onset: "nokku", from: above });
    else if (ctx.janta) Object.assign(out, { onset: "sphurita", from: below });
    return out;
  }
  function applyIntensity(sh, rule, a) {
    const origin = originOf(rule), r = {};
    const comp = (name, active, drop) => {
      if (!active) return;
      const x = reach(a, salience(origin, name));
      if (x > 0) r[name] = x;
      else {
        drop();
        sh.thinned = true;
      }
    };
    comp("onset", sh.onset !== "none", () => {
      sh.onset = "none";
      delete sh.from;
    });
    comp("body", sh.body !== "plain", () => {
      sh.body = "plain";
      ["lo", "hi", "end", "cycles", "dwell"].forEach((k) => delete sh[k]);
    });
    comp("exit", sh.exit !== "none", () => {
      sh.exit = "none";
      delete sh.exitTo;
    });
    if (sh.body !== "plain" && sh.cycles) {
      const n = cyclesAt(a, sh.cycles);
      sh.cycles = [Math.min(sh.cycles[0], n), n];
    }
    sh.reach = r;
  }
  function resolveNotes(notes, opts, gamaka, raga) {
    const o = opts || {}, sc = scaleOf(raga), slotSec = o.slotSec;
    const a = o.intensity == null ? null : Math.min(1, Math.max(0, +o.intensity || 0)), heavy = a != null && a >= HEAVY_AT;
    const style = o.style && o.style !== "auto" ? o.style : gamaka.style;
    const rules = gamaka.rules || {};
    const out = new Array(notes.length);
    const sounding = notes.map((n) => n.p != null);
    let lastSounding = -1;
    notes.forEach((n, k) => {
      if (n.p != null) lastSounding = k;
    });
    notes.forEach((n, i) => {
      if (n.p == null) {
        out[i] = null;
        return;
      }
      const ctx = contextOf(notes, i, slotSec, sc);
      let rule = null;
      if (style !== "plain") {
        const list = (rules[mod12(n.p)] || []).map((r, k) => ({ r, k })).filter((x) => matches(x.r.when || {}, ctx, notes));
        if (list.length) {
          const top = Math.max.apply(null, list.map((x) => x.r.spec || 0));
          const tied = list.filter((x) => (x.r.spec || 0) === top);
          let pick2 = tied[0];
          if (tied.length > 1 && o.variety > 0) {
            const rand = rng(((o.seed || 1) ^ i * 2654435761) >>> 0), ws = tied.map((x) => x.r.weight || 1);
            let u = rand() * ws.reduce((a2, b) => a2 + b, 0), k = 0;
            while (u > ws[k] && k < ws.length - 1) {
              u -= ws[k];
              k++;
            }
            pick2 = tied[k];
          }
          rule = Object.assign({}, pick2.r, { why: "raga rule" });
        }
      }
      if (a != null && style !== "plain") {
        if (!rule) rule = swaraRule(ctx, sc, raga);
        else if (rule.basis === "text-vague" && (rule.body || "plain") !== "plain") {
          const g = swaraRule(ctx, sc, raga);
          rule = Object.assign(g, { src: rule.src, also: g.src, why: g.why + " (the raga's text: gamaka on this swara)" });
        }
      } else if (!rule) {
        const fallback = style === "heavy" || style === "default" ? "light" : style;
        rule = styleDefault(heavy && fallback === "light" ? "medium" : fallback, ctx, sc);
      }
      out[i] = { ctx, rule: rule || { onset: "none", body: "plain", exit: "none", src: null, basis: "plain", why: "plain style" } };
    });
    if (a != null && style !== "plain") adjacency(out, sc, raga);
    out.forEach((x) => {
      if (x) x.plainByRule = (x.rule.body || "plain") === "plain" && !(x.rule.onset && x.rule.onset !== "none") && x.rule.grammar !== "G6";
    });
    const shapeOf = (rule, ctx) => {
      const d = rule.depth != null ? rule.depth : 1, sh = { onset: rule.onset || "none", body: rule.body || "plain", exit: rule.exit || "none" };
      if (sh.onset === "sphurita" && !ctx.janta) sh.onset = "none";
      if (sh.onset === "pratyahata" && !(ctx.next != null && ctx.next < ctx.p)) sh.onset = "none";
      if (sh.onset !== "none" && sh.onset !== "jaru") sh.from = d * (rule.from != null ? rule.from : sh.onset === "nokku" ? sc.step(ctx.p, 1) - ctx.p : sc.step(ctx.p, -1) - ctx.p);
      if (sh.body !== "plain") Object.assign(sh, { lo: d * (rule.lo || 0), hi: d * (rule.hi || 0), end: rule.end || "self", cycles: rule.cycles || [1, 1], dwell: rule.dwell });
      if (sh.exit === "orikkai") sh.exitTo = d * (sc.step(ctx.p, 1) - ctx.p);
      sh.ruleDepth = d;
      if (a != null) applyIntensity(sh, rule, a);
      return sh;
    };
    out.forEach((x, i) => {
      if (x) x.shape = shapeOf(x.rule, x.ctx);
    });
    const units = o.units, moraNotes = [];
    if (units) {
      let k = 0;
      units.forEach((u) => {
        const idx = [];
        u.notes.forEach(() => idx.push(k++));
        if (u.kind === "mora") moraNotes.push(idx);
      });
    }
    if (moraNotes.length === 3) {
      const [m1] = moraNotes;
      for (let r = 1; r < 3; r++) {
        const mr = moraNotes[r];
        for (let k = 1; k <= Math.min(m1.length, mr.length); k++) {
          const a2 = m1[m1.length - k], b = mr[mr.length - k];
          if (!out[a2] || !out[b]) continue;
          const src = out[a2], pa = notes[a2].p, pb = notes[b].p, d = src.shape.ruleDepth || 1, move = (off) => {
            if (off == null) return off;
            const target = pa + off / d;
            if (!sc.isNote(target)) return off;
            const steps = countSteps(sc, pa, target), q = sc.step(pb, steps) - pb;
            return Math.abs(q) <= 7 ? q * d : off;
          };
          const sh = Object.assign({}, src.shape);
          ["from", "lo", "hi", "exitTo"].forEach((f) => {
            if (sh[f] != null) sh[f] = move(sh[f]);
          });
          if (sh.body !== "plain" && !(sh.lo < sh.hi || sh.lo === 0 && sh.hi === 0)) continue;
          if (sh.onset === "sphurita" && !out[b].ctx.janta) sh.onset = "none";
          if (out[b].plainByRule && sh.body !== "plain") {
            sh.body = "plain";
            delete sh.lo;
            delete sh.hi;
          }
          out[b] = Object.assign({}, out[b], { shape: sh, rule: Object.assign({}, src.rule, { why: "mora: as statement 1" }) });
        }
      }
    }
    let chain = 0, chainBreaks = 0;
    const maxChain = (gamaka.maxChain || 4) + (heavy ? 2 : 0), inMora = new Set(moraNotes.flat());
    out.forEach((x, i) => {
      if (!x) {
        chain = 0;
        return;
      }
      const sh = x.shape;
      if (sh.onset === "jaru" && x.ctx.prev != null && Math.abs(x.ctx.p - x.ctx.prev) > 4 && x.rule.basis === "default") sh.onset = "none";
      const plain2 = sh.body === "plain";
      if (!plain2 && chain >= maxChain && x.ctx.sec >= 0.15 - 1e-9 && !inMora.has(i)) {
        x.shape = { onset: "none", body: "plain", exit: "none", ruleDepth: 1 };
        x.chainBreak = true;
        chainBreaks++;
        chain = 0;
      } else chain = plain2 ? 0 : chain + 1;
      if (o.landing !== false && i === lastSounding) {
        x.shape = Object.assign({}, x.shape, { body: "plain", exit: "none" });
        delete x.shape.lo;
        delete x.shape.hi;
        x.landing = true;
      }
    });
    if (a != null && style !== "plain") coarticulate(out);
    return { resolved: out, chainBreaks, style, sounding };
  }
  function coarticulate(out) {
    const osc = (sh) => sh && (sh.body === "kampita" || sh.body === "andolita") && (sh.onset || "none") === "none";
    const r = (sh, k) => sh.reach && sh.reach[k] != null ? sh.reach[k] : 1;
    const endOf = (x) => {
      const sh = x.shape, p = x.ctx.p;
      if (sh.exit === "orikkai") return p + r(sh, "exit") * (sh.exitTo != null ? sh.exitTo : 1);
      if (sh.body !== "plain" && (sh.end === "hi" || sh.end === "lo")) return p + r(sh, "body") * (sh.end === "hi" ? sh.hi : sh.lo);
      return p;
    };
    out.forEach((x, i) => {
      if (!x || !x.shape) return;
      const sh = x.shape;
      delete sh.flowIn;
      delete sh.antic;
      if (!osc(sh)) return;
      const p = x.ctx.p, lo = p + r(sh, "body") * (sh.lo || 0), hi = p + r(sh, "body") * (sh.hi || 0);
      const prev = i > 0 ? out[i - 1] : null, next = i + 1 < out.length ? out[i + 1] : null;
      if (prev && prev.shape) {
        const from = endOf(prev);
        if (from < p - 0.05 && lo < p - 1e-9 && from <= lo + 0.5) sh.flowIn = "lo";
        else if (from > p + 0.05 && hi > p + 1e-9 && from >= hi - 0.5) sh.flowIn = "hi";
      }
      if (next && next.ctx && (sh.end || "self") === "self" && next.ctx.p > p && hi > p + 1e-9 && Math.abs(hi - next.ctx.p) <= 0.5) sh.antic = "hi";
    });
  }

  // src/engine/gamaka/expression.js
  var STEP = 0.01;
  var SYLLABLE = { S: "sa", R: "ri", G: "ga", M: "ma", P: "pa", D: "dha", N: "ni" };
  var CONSONANT2 = { sa: "s", ri: "r", ga: "g", ma: "m", pa: "p", dha: "dh", ni: "n" };
  var PHRASE_MAX = 5;
  var LONG_NOTE = 0.6;
  var BREATH_SEC = 0.09;
  function syllableOf(raga, p) {
    const name = swaraName2(raga, p), s = SYLLABLE[name && name[0]] || "a";
    return { syllable: s, consonant: CONSONANT2[s] || "", vowel: s === "ri" || s === "ni" ? "i" : "a" };
  }
  function phraseStarts(notes, slotSec, units) {
    const N = notes.length, starts = /* @__PURE__ */ new Set(), sec = (i) => notes[i].dur * slotSec;
    const durs = notes.filter((n) => n.p != null).map((n) => n.dur * slotSec).sort((a, b) => a - b), median = durs.length ? durs[durs.length >> 1] : 0;
    const soft2 = /* @__PURE__ */ new Set();
    if (units) {
      let k = 0;
      units.forEach((u) => {
        if (k > 0 && /^(phrase|mora)/.test(u.kind)) soft2.add(k);
        k += u.notes.length;
      });
    }
    for (let i = 0; i < N; i++) {
      if (notes[i].p == null) continue;
      if (i === 0 || notes[i - 1].p == null) {
        starts.add(i);
        continue;
      }
      if (sec(i - 1) >= LONG_NOTE - 1e-9 && sec(i - 1) >= 2 * median - 1e-9) starts.add(i);
    }
    const sorted = () => Array.from(starts).sort((a, b) => a - b);
    let changed = true;
    while (changed) {
      changed = false;
      const ss = sorted();
      for (let k = 0; k < ss.length; k++) {
        const i0 = ss[k];
        let i1 = (k + 1 < ss.length ? ss[k + 1] : N) - 1;
        while (i1 > i0 && notes[i1].p == null) i1--;
        let t = 0;
        for (let i = i0; i <= i1; i++) t += sec(i);
        if (t <= PHRASE_MAX) continue;
        let best = -1, bestD = Infinity, acc = 0;
        for (let i = i0 + 1; i <= i1; i++) {
          acc += sec(i - 1);
          if (soft2.has(i) && notes[i].p != null) {
            const d = Math.abs(acc - t / 2);
            if (d < bestD) {
              bestD = d;
              best = i;
            }
          }
        }
        if (best > 0) {
          starts.add(best);
          changed = true;
          break;
        }
      }
    }
    return sorted();
  }
  function expression(notes, contour, opts) {
    const o = opts || {}, slotSec = o.slotSec, raga = o.raga, N = notes.length;
    const r = rng((o.seed || 1) * 1103515245 + 12345 >>> 0);
    const cn = contour.notes, starts = phraseStarts(notes, slotSec, o.units);
    const phrases = starts.map((i0, k) => {
      let i1 = (k + 1 < starts.length ? starts[k + 1] : N) - 1;
      while (i1 > i0 && notes[i1].p == null) i1--;
      return { i0, i1, t0: cn[i0].t0, t1: cn[i1].t1 };
    });
    const phraseOf2 = new Array(N).fill(-1);
    phrases.forEach((ph, k) => {
      for (let i = ph.i0; i <= ph.i1; i++) phraseOf2[i] = k;
    });
    const slot0 = [];
    let acc = 0;
    notes.forEach((n) => {
      slot0.push(acc);
      acc += n.dur;
    });
    const per = o.per > 0 ? o.per : 0, cyc = o.cycleBeats > 0 ? o.cycleBeats : 0, angas = new Set(o.angaStarts || []);
    const out = notes.map((n, i) => {
      if (n.p == null) return { i, phrase: -1, rest: true };
      const ph = phrases[phraseOf2[i]], first = i === ph.i0, last = i === ph.i1, c = cn[i], sec = c.t1 - c.t0;
      let accent = 0.3;
      if (per && slot0[i] % per === 0) {
        const beat = slot0[i] / per, inCyc = cyc ? beat % cyc : beat;
        accent = cyc && inCyc === 0 ? 1 : angas.has(inCyc) ? 0.75 : 0.5;
      }
      if (first) accent = Math.max(accent, 0.8);
      if (sec >= 0.45) accent = Math.min(1, accent + 0.25);
      const prevGamaka = i > 0 && cn[i - 1] && cn[i - 1].gamaka;
      if (prevGamaka && !c.gamaka && !first) accent *= 0.6;
      const glide = !first && c.shape && c.shape.onset === "jaru";
      const syl = raga ? syllableOf(raga, n.p) : { syllable: "a", consonant: "", vowel: "a" };
      return Object.assign({ i, phrase: phraseOf2[i], first, last, accent: Math.round(accent * 1e3) / 1e3, onset: first ? "phrase" : glide ? "glide" : "note", jitter: 1 + 0.03 * (2 * r() - 1) }, syl);
    });
    const lastSounding = (() => {
      for (let i = N - 1; i >= 0; i--) if (notes[i].p != null) return i;
      return -1;
    })();
    const gainAt = (t) => {
      let i = -1;
      for (let k = 0; k < N; k++) {
        if (cn[k].t0 <= t + 1e-9) i = k;
        else break;
      }
      if (i < 0 || notes[i].p == null) return 0;
      const x = out[i], c = cn[i], ph = phrases[x.phrase], sec = c.t1 - c.t0, u = (t - ph.t0) / Math.max(1e-6, ph.t1 - ph.t0), v = (t - c.t0) / Math.max(1e-6, sec);
      let g = 0.9 + 0.1 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
      const mid = ph.mid != null ? ph.mid : ph.mid = (() => {
        let s = 0, k = 0;
        for (let j = ph.i0; j <= ph.i1; j++) if (notes[j].p != null) {
          s += notes[j].p;
          k++;
        }
        return k ? s / k : 0;
      })();
      g *= 1 + Math.max(-0.08, Math.min(0.06, 0.012 * (notes[i].p - mid)));
      g *= 1 + 0.12 * x.accent * Math.exp(-(t - c.t0) / 0.12);
      if (sec >= 0.45 && !x.last) g *= 1 + 0.06 * Math.sin(Math.PI * Math.min(1, v / 0.7)) - 0.05 * Math.max(0, v - 0.7) / 0.3;
      if (x.last && i !== lastSounding) g *= 1 - 0.22 * Math.max(0, (v - 0.4) / 0.6);
      if (i === lastSounding) g *= 1 - 0.4 * Math.max(0, (v - 0.3) / 0.7);
      const nxt = i + 1 < N ? i + 1 : -1;
      if (x.last && nxt >= 0 && notes[nxt].p != null) {
        const b = Math.min(BREATH_SEC, 0.25 * sec), tb = c.t1 - b;
        if (t > tb) g *= 0.06 + 0.94 * (1 + Math.cos(Math.PI * Math.min(1, (t - tb) / b))) / 2;
      }
      return g * x.jitter;
    };
    const gain = contour.groups.map((gr) => {
      const pts = [];
      for (let t = gr.t0; t < gr.t1 - 1e-9; t += STEP) pts.push({ t: Math.round(t * 1e6) / 1e6, g: Math.round(gainAt(t + 1e-7) * 1e4) / 1e4 });
      pts.push({ t: gr.t1, g: Math.round(gainAt(gr.t1 - 1e-6) * 1e4) / 1e4 });
      return pts;
    });
    phrases.forEach((ph) => {
      delete ph.mid;
    });
    out.forEach((x) => {
      delete x.jitter;
    });
    return { phrases, notes: out, gain };
  }

  // src/engine/gamaka/index.js
  var RAGAS = null;
  var ragaById = (id) => {
    if (!RAGAS) {
      const R = allRagas();
      RAGAS = new Map(R.melakartas.concat(R.janyas).map((r) => [r.id, r]));
    }
    return RAGAS.get(id) || null;
  };
  var SVARASTHANA = { 0: "S", 1: "R1", 2: "R2", 3: "G2", 4: "G3", 5: "M1", 6: "M2", 7: "P", 8: "D1", 9: "D2", 10: "N2", 11: "N3" };
  var DEFAULT = { style: "light", basis: "default", maxChain: 4, rules: {}, sources: ["S193", "S198"] };
  function label(raga, p) {
    const r = Math.round(p);
    if (Math.abs(p - r) > 1e-6) return (p >= 0 ? "+" : "") + Math.round(p * 100) + "c";
    const lab = raga.labels[mod12(r)] || SVARASTHANA[mod12(r)] + "*";
    return lab + (r >= 12 ? "'" : r < 0 ? "." : "");
  }
  function describe(raga, p, sh) {
    if (!sh) return "plain";
    const d = sh.ruleDepth || 1, at = (off) => label(raga, p + off / d), parts = [];
    if (sh.onset && sh.onset !== "none") parts.push(sh.onset + (sh.from != null ? " from " + at(sh.from) : ""));
    if (sh.body && sh.body !== "plain") parts.push(sh.body + " " + at(sh.lo) + "\u2013" + at(sh.hi) + (sh.end && sh.end !== "self" ? ", resting on " + (sh.end === "hi" ? at(sh.hi) : at(sh.lo)) : "") + (d < 1 ? " at depth " + d : ""));
    else parts.push("plain");
    if (sh.exit && sh.exit !== "none") parts.push(sh.exit);
    return parts.join(", ");
  }
  var shapeName = (sh) => !sh ? "plain" : [sh.onset !== "none" ? sh.onset : null, sh.body, sh.exit !== "none" ? sh.exit : null].filter(Boolean).join("+");
  function humanizeOffsets(c, amount, seed) {
    if (!(amount > 0)) return;
    const rand = rng((seed || 1) * 7919 + 13), gauss = () => {
      let u = 0, v = 0;
      while (u === 0) u = rand();
      v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const z = c.notes.map(() => gauss());
    let k = 0;
    c.points.forEach((pt) => {
      while (k < c.notes.length - 1 && pt.t >= c.notes[k].t1) k++;
      const n = c.notes[k];
      if (n.p == null) return;
      const dt = pt.t - n.t0, sigma = Math.sqrt(8 * 8 + 40 * 40 * Math.exp(-dt / 0.15));
      pt.p += amount * z[k] * sigma / 100;
    });
  }
  function renderGamaka(notes, opts) {
    const o = opts || {};
    const raga = o.raga && typeof o.raga === "object" ? o.raga : ragaById(o.ragaId || o.raga);
    if (!raga) throw new Error("renderGamaka needs a raga (opts.raga or opts.ragaId)");
    if (!(o.slotSec > 0)) throw new Error("renderGamaka needs slotSec > 0");
    const prof = getProfile(raga), gamaka = prof && prof.gamaka || DEFAULT;
    const input = notes.map((n) => ({ p: n.p, dur: n.dur }));
    const natural = o.natural !== false;
    const level = o.intensity != null ? o.intensity : o.depth != null ? o.depth : 1;
    const intensity = Math.min(1, Math.max(0, +level || 0));
    const { resolved: resolved2, chainBreaks, style } = resolveNotes(input, natural && intensity > 0 ? Object.assign({}, o, { intensity }) : Object.assign({}, o, { intensity: null }), gamaka, raga);
    const items = input.map((n, i) => ({ p: n.p, dur: n.dur, shape: resolved2[i] ? resolved2[i].shape : null, landing: !!(resolved2[i] && resolved2[i].landing) }));
    const voice = natural && intensity === 0 && !!o.voice;
    if (voice) items.forEach((it) => {
      if (it.shape) it.shape = { onset: "none", body: "plain", exit: "none", ruleDepth: 1 };
    });
    const c = natural ? buildContour(items, voice ? { slotSec: o.slotSec, depth: 1, natural: { intensity: 0, seed: o.seed || 1, motion: 1, glide: VOICE_GLIDE } } : { slotSec: o.slotSec, depth: intensity > 0 ? 1 : 0, natural: { intensity, seed: o.seed || 1 } }) : buildContour(items, { slotSec: o.slotSec, depth: o.depth == null ? 1 : o.depth });
    humanizeOffsets(c, o.humanize, o.seed);
    const scalePcs = new Set(raga.aro.concat(raga.avaro).map(mod12));
    c.notes.forEach((n) => {
      const x = resolved2[n.i];
      if (!x) return;
      n.rule = describe(raga, n.p, x.shape);
      n.shape = shapeName(x.shape);
      n.src = x.chainBreak ? "S193" : x.rule.src || null;
      n.basis = x.chainBreak ? "chain limit" : x.rule.basis || null;
      const flow = x.shape.flowIn ? "; it starts where the previous swara left the voice" : "";
      const antic = x.shape.antic ? "; it touches the next swara before it settles" : "";
      n.why = x.chainBreak ? "plain after a long run of gamaka (chain limit)" : x.landing ? "landing swara: held plain" : x.rule.why + (x.shape.thinned ? ", lighter at this intensity" : "") + (n.gamaka ? flow + antic : "");
      n.source = n.src ? getSource(n.src) : null;
      n.ruleDepth = x.shape.ruleDepth;
      n.plainByRule = !!x.plainByRule;
      n.grammar = x.chainBreak || x.landing ? null : x.rule.grammar || null;
      const sh = x.shape, d = sh.ruleDepth || 1, abs = (off2) => off2 == null ? null : n.p + off2 / d;
      n.form = { onset: sh.onset, from: abs(sh.from), body: sh.body, lo: abs(sh.lo), hi: abs(sh.hi), exit: sh.exit };
      const off = (q) => q != null && !(Math.abs(q - Math.round(q)) < 1e-9 && scalePcs.has(mod12(Math.round(q))));
      n.offScale = sh.onset && sh.onset !== "none" && off(n.form.from) || sh.body !== "plain" && (off(n.form.lo) || off(n.form.hi));
    });
    const ex = expression(input, c, { slotSec: o.slotSec, raga, per: o.per, cycleBeats: o.cycleBeats, angaStarts: o.angaStarts, units: o.units, seed: o.seed });
    return { points: c.points, groups: c.groups, notes: c.notes, stats: Object.assign(c.stats, { chainBreaks }), style, basis: gamaka.basis, sources: gamaka.sources, intensity: natural ? intensity : null, voice, expression: ex };
  }

  // src/engine/sollu.js
  var SOLLU = {
    1: [["tha"], ["dhi"], ["thom"], ["nam"]],
    2: [["tha", "ka"], ["ki", "ta"], ["dhi", "mi"], ["jho", "nu"]],
    3: [["tha", "ki", "ta"], ["tha", "ka", "jham"], ["tat", "tai", "tam"]],
    4: [["tha", "ka", "dhi", "mi"], ["tha", "ka", "jho", "nu"], ["ki", "ta", "tha", "ka"], ["tha", "ri", "ki", "ta"], ["tai", "ya", "tai", "ya"], ["tai", "hat", "tai", "hi"]],
    5: [["tha", "dhi", "gi", "na", "thom"], ["tha", "ka", "tha", "ki", "ta"]],
    6: [["tha", "ka", "dhi", "mi", "tha", "ka"], ["tha", "ri", "ki", "ta", "tha", "ka"]],
    7: [["tha", "ka", "dhi", "mi", "tha", "ki", "ta"]],
    8: [["tha", "ka", "dhi", "mi", "tha", "ka", "jho", "nu"]],
    9: [["tha", "ka", "dhi", "mi", "tha", "dhi", "gi", "na", "thom"]]
  };
  var ALIAS = { ta: "tha", di: "dhi", tom: "thom", dhom: "thom", thai: "tai", tei: "tai", jo: "jho", dheem: "dhim", dhin: "dhim", din: "dhim", ding: "dhim", gin: "gi", tham: "tam", tak: "tha" };
  var norm = (s) => ALIAS[s] || s;
  var KNOWN = new Set("tha ka ki dhi mi jho nu gi na thom nam jham tam tai ya hi ha hat tat dhit dhim ri ku lan gu ga num".split(" "));
  var HEAVY = new Set("tha dhi thom nam jham tam tai tat dhit dhim".split(" "));
  var CADENCE2 = new Set("thom nam jham tam tai dhit dhim dhi tat".split(" "));
  var LIB = function() {
    const set = /* @__PURE__ */ new Set(), suf = /* @__PURE__ */ new Set();
    Object.keys(SOLLU).forEach((k) => SOLLU[k].forEach((p) => {
      const n = p.map(norm);
      set.add(n.join(" "));
      for (let i = 1; i < n.length - 1; i++) suf.add(n.slice(i).join(" "));
    }));
    return { set, suf };
  }();
  function idiomatic(syls) {
    const s = syls.filter((x) => x !== ",").map(norm);
    if (!s.length) return true;
    const key = s.join(" ");
    if (LIB.set.has(key) || LIB.suf.has(key)) return true;
    const memo = {};
    const seg = (i, k) => {
      if (i === s.length) return true;
      if (k === 0) return false;
      const id = i + ":" + k;
      if (id in memo) return memo[id];
      for (let L = 1; L <= 9 && i + L <= s.length; L++) if (LIB.set.has(s.slice(i, i + L).join(" ")) && seg(i + L, k - 1)) return memo[id] = true;
      return memo[id] = false;
    };
    return seg(0, 3);
  }
  function splitCompound(word) {
    const keys = Array.from(new Set(Array.from(KNOWN).concat(Object.keys(ALIAS)))).sort((a, b) => b.length - a.length);
    const dfs = (i) => {
      if (i === word.length) return [];
      for (const k of keys) if (word.startsWith(k, i)) {
        const r = dfs(i + k.length);
        if (r) return [k].concat(r);
      }
      return null;
    };
    const parts = dfs(0);
    return parts && parts.length > 1 ? parts : null;
  }

  // src/engine/jathi/script.js
  var TICKS = 2520;
  var JATI_WORDS = { tisra: 3, tishra: 3, thisra: 3, chatusra: 4, chaturasra: 4, chatushra: 4, chaturashra: 4, chathusra: 4, khanda: 5, kanda: 5, misra: 7, mishra: 7, sankeerna: 9, sankirna: 9 };
  var FAM_WORDS = { dhruva: "dhruva", druva: "dhruva", matya: "matya", mathya: "matya", madhya: "matya", rupaka: "rupaka", roopaka: "rupaka", rupakam: "rupaka", jhampa: "jhampa", jampa: "jhampa", triputa: "triputa", triputai: "triputa", ata: "ata", atta: "ata", eka: "eka", ekam: "eka", chapu: "chapu", capu: "chapu", adi: "adi" };
  var JATI_NAME = { 3: "tisra", 4: "chatusra", 5: "khanda", 7: "misra", 9: "sankeerna" };
  function talaSpec(tl) {
    if (tl.fam === "chapu") return JATI_NAME[tl.total] + " chapu";
    if (tl.fam === "custom") return "custom " + tl.angas.map((a) => a.len).join("+");
    if (tl.fam === "triputa" && tl.L === 4) return "adi";
    return JATI_NAME[tl.L] + " " + tl.fam;
  }
  function parseTalaSpec(s) {
    const raw = s.toLowerCase().trim();
    if (/^custom\b/.test(raw)) {
      const parts = raw.replace(/^custom/, "").split(/[^0-9]+/).filter(Boolean).map(Number);
      if (!parts.length || parts.some((p) => !(p >= 1 && p <= 16))) return { error: 'Write a custom tala as counts, for example "custom 3+2+2".' };
      return { tl: customTala(parts) };
    }
    const w = raw.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((x) => x && !["jati", "jathi", "tala", "talam", "thalam", "thala"].includes(x));
    let fam = null, L = null;
    const unknown = [];
    w.forEach((x) => {
      if (FAM_WORDS[x]) fam = FAM_WORDS[x];
      else if (JATI_WORDS[x]) L = JATI_WORDS[x];
      else if (/^\d+$/.test(x)) L = +x;
      else unknown.push(x);
    });
    if (unknown.length) return { error: 'Unknown word in the tala: "' + unknown.join(" ") + '". Use a family (dhruva, matya, rupaka, jhampa, triputa, ata, eka, chapu or adi) and a jati (tisra, chatusra, khanda, misra, sankeerna).' };
    if (fam === "adi") return { tl: tala("triputa", 4), note: L && L !== 4 ? "Adi is chatusra jati triputa; the jati was ignored." : null };
    if (fam === "chapu") {
      L = L || 7;
      if (!CHAPU[L]) return { error: "Chapu talas here are tisra (1+2), khanda (2+3) and misra (3+2+2)." };
      return { tl: tala("chapu", L) };
    }
    if (!fam) return { error: 'No tala family found in "' + s + '".' };
    L = L || DEFJ[fam];
    if (!JATI[L]) return { error: "The jati must be tisra (3), chatusra (4), khanda (5), misra (7) or sankeerna (9)." };
    return { tl: tala(fam, L) };
  }
  function tokenizeLine(str, line) {
    const out = [], re = /\s+|(\|\|)|(\|)|(\()|(\))|(\{)|(\})|(,)|(;)|@(\d+)|\$([A-Za-z_]\w*)|[x×*](\d+)|\/(\d+)|([A-Za-z]+(?:-(?:[A-Za-z]+|,|;))*)|(\S)/gy;
    let m;
    while (re.lastIndex < str.length && (m = re.exec(str))) {
      const col = m.index + 1;
      if (m[1]) out.push({ t: "dbar", line, col });
      else if (m[2]) out.push({ t: "bar", line, col });
      else if (m[3]) out.push({ t: "(", line, col });
      else if (m[4]) out.push({ t: ")", line, col });
      else if (m[5]) out.push({ t: "{", line, col });
      else if (m[6]) out.push({ t: "}", line, col });
      else if (m[7]) out.push({ t: "kv", n: 1, line, col });
      else if (m[8]) out.push({ t: "kv", n: 2, line, col });
      else if (m[9]) out.push({ t: "speed", n: +m[9], line, col });
      else if (m[10]) out.push({ t: "var", name: m[10], line, col });
      else if (m[11]) out.push({ t: "rep", n: +m[11], line, col });
      else if (m[12]) out.push({ t: "gap", n: +m[12], line, col });
      else if (m[13]) out.push({ t: "word", v: m[13], line, col });
      else if (m[14]) out.push({ t: "bad", v: m[14], line, col });
    }
    return out;
  }
  function parseJathiScript(text) {
    const errors = [], warnings = [], header = {}, defs = {}, bodyToks = [];
    const err = (line, col, msg) => errors.push({ line, col, msg });
    String(text).replace(/\r/g, "").split("\n").forEach((raw, k) => {
      const line = k + 1, s = raw.replace(/#.*$/, "");
      if (!s.trim()) return;
      let m = s.match(/^\s*(tala|talam|nadai|gati|kalai|avartanams?|avartas?|cycles|eduppu|land|title|name|by)\s*:\s*(.*?)\s*$/i);
      if (m) {
        header[m[1].toLowerCase()] = { v: m[2], line };
        return;
      }
      m = s.match(/^\s*let\s+([A-Za-z_]\w*)\s*=\s*(.*)$/i);
      if (m) {
        if (defs[m[1]]) err(line, 1, "The phrase $" + m[1] + " is defined twice.");
        defs[m[1]] = { toks: tokenizeLine(m[2], line), line };
        return;
      }
      tokenizeLine(s, line).forEach((t) => bodyToks.push(t));
    });
    const hv = (k) => {
      for (const key of [].concat(k)) if (header[key]) return header[key];
      return null;
    };
    let tl = tala("triputa", 4);
    const ht = hv(["tala", "talam"]);
    if (ht) {
      const r = parseTalaSpec(ht.v);
      if (r.error) err(ht.line, 1, r.error);
      else {
        tl = r.tl;
        if (r.note) warnings.push({ line: ht.line, msg: r.note });
      }
    } else warnings.push({ line: 0, msg: "No tala given; assuming Adi." });
    let nadai = 4;
    const hn = hv(["nadai", "gati"]);
    if (hn) {
      const named = JATI_WORDS[hn.v.toLowerCase().split(/\s+/)[0]];
      nadai = named || parseInt(hn.v, 10);
      if (!(nadai >= 1 && nadai <= 36 && TICKS % nadai === 0)) {
        err(hn.line, 1, "Nadai must be a whole number of matras per akshara that divides 2520 (3, 4, 5, 6, 7, 8, 9 \u2026).");
        nadai = 4;
      }
    }
    let kalai = 1;
    const hk = hv("kalai");
    if (hk) {
      kalai = parseInt(hk.v, 10);
      if (!(kalai >= 1 && kalai <= 4)) {
        err(hk.line, 1, "Kalai must be 1, 2, 3 or 4.");
        kalai = 1;
      }
    }
    let avartanams = null;
    const ha = hv(["avartanams", "avartanam", "avartas", "avarta", "cycles"]);
    if (ha) {
      avartanams = parseInt(ha.v, 10);
      if (!(avartanams >= 1 && avartanams <= 32)) {
        err(ha.line, 1, "Avartanams must be a whole number from 1 to 32.");
        avartanams = null;
      }
    }
    let eduppu = 0;
    const he = hv("eduppu");
    if (he) {
      const v = he.v.toLowerCase().trim();
      let m2;
      if (v === "sam" || v === "samam" || v === "0" || v === "sama") eduppu = 0;
      else if (m2 = v.match(/^([+-]?)\s*(\d+)$/)) eduppu = (m2[1] === "-" ? -1 : 1) * +m2[2];
      else if (m2 = v.match(/^(atita|atheetha|atitha|before)\s+(\d+)$/)) eduppu = -m2[2];
      else if (m2 = v.match(/^(anagata|anagatha|after)\s+(\d+)$/)) eduppu = +m2[2];
      else err(he.line, 1, "Write the eduppu as sam, +n (n matras after sam, anagata) or -n (n matras before sam, atita).");
    }
    let land = { type: "sam", k: 0 };
    const hl = hv("land");
    if (hl) {
      const v = hl.v.toLowerCase().trim();
      let m2;
      if (v === "sam") land = { type: "sam", k: 0 };
      else if (v === "end" || v === "before sam" || v === "before-sam") land = { type: "end", k: 0 };
      else if (m2 = v.match(/^\+\s*(\d+)$/)) land = { type: "after", k: +m2[1] };
      else err(hl.line, 1, "Land must be sam (the last syllable sounds on sam), end (the jathi ends exactly at sam) or +n (the last syllable falls n matras after sam).");
    }
    const cycleTicks = tl.total * kalai * TICKS, matra = TICKS / nadai;
    if (Math.abs(eduppu) * matra >= cycleTicks) err(he ? he.line : 0, 1, "The eduppu must be less than one avartanam from sam.");
    function parseSeq(toks, ctx) {
      let i = 0, depth = 0;
      const items = [];
      function seq(end) {
        const out = [];
        while (i < toks.length) {
          const tk = toks[i];
          if (end && tk.t === end) {
            i++;
            return out;
          }
          if (tk.t === ")" || tk.t === "}") {
            err(tk.line, tk.col, 'Unexpected "' + tk.t + '" with no matching opening bracket.');
            i++;
            continue;
          }
          let node = null;
          if (tk.t === "word") {
            i++;
            const parts = tk.v.split("-");
            if (parts.length > 1) node = { type: "group", kind: "hyphen", items: parts.map((p) => p === "," ? { type: "kv", n: 1 } : p === ";" ? { type: "kv", n: 2 } : { type: "syl", v: p.toLowerCase(), line: tk.line, col: tk.col }), line: tk.line, col: tk.col };
            else node = { type: "syl", v: tk.v.toLowerCase(), line: tk.line, col: tk.col };
          } else if (tk.t === "kv") {
            i++;
            node = { type: "kv", n: tk.n };
          } else if (tk.t === "(") {
            i++;
            depth++;
            const inner = seq(")");
            depth--;
            node = { type: "group", kind: "paren", items: inner, line: tk.line, col: tk.col };
          } else if (tk.t === "{") {
            i++;
            const inner = seq("}");
            if (ctx === "def") err(tk.line, tk.col, "A teermanam cannot go inside a phrase variable.");
            if (depth > 0) err(tk.line, tk.col, "A teermanam cannot go inside brackets.");
            let q = 0;
            if (toks[i] && toks[i].t === "rep") {
              if (toks[i].n !== 3) err(toks[i].line, toks[i].col, "A teermanam {\u2026} always repeats 3 times; write x3 or leave it out.");
              i++;
            }
            if (toks[i] && toks[i].t === "gap") {
              q = toks[i].n;
              i++;
            }
            node = { type: "teer", items: inner, q, line: tk.line, col: tk.col };
          } else if (tk.t === "var") {
            i++;
            const d = defs[tk.name];
            if (!d) {
              err(tk.line, tk.col, "The phrase $" + tk.name + " is not defined. Add a line: let " + tk.name + " = \u2026");
              continue;
            }
            if (d.parsing) {
              err(tk.line, tk.col, "The phrase $" + tk.name + " refers to itself.");
              continue;
            }
            if (!d.ast) {
              d.parsing = true;
              d.ast = parseSeq(d.toks, "def");
              d.parsing = false;
            }
            node = { type: "group", kind: "var", name: tk.name, items: d.ast, line: tk.line, col: tk.col };
          } else if (tk.t === "bar" || tk.t === "dbar") {
            i++;
            if (ctx === "def") err(tk.line, tk.col, "Bars cannot go inside a phrase variable.");
            node = { type: "bar", dbl: tk.t === "dbar", line: tk.line, col: tk.col };
          } else if (tk.t === "speed") {
            i++;
            if (!(tk.n >= 1 && tk.n <= 36 && TICKS % tk.n === 0)) err(tk.line, tk.col, "@" + tk.n + " is not a supported speed. Use a number of syllables per akshara that divides 2520, such as 2, 3, 4, 5, 6, 7, 8, 9, 10, 12 or 14.");
            node = { type: "speed", n: tk.n, line: tk.line, col: tk.col };
          } else if (tk.t === "rep") {
            i++;
            err(tk.line, tk.col, "x" + tk.n + " must follow a group, a phrase variable or a syllable.");
            continue;
          } else if (tk.t === "gap") {
            i++;
            err(tk.line, tk.col, "/" + tk.n + " (a teermanam gap) must follow a {\u2026} teermanam.");
            continue;
          } else {
            i++;
            err(tk.line, tk.col, 'Unexpected character "' + tk.v + '".');
            continue;
          }
          if (toks[i] && toks[i].t === "rep" && node.type !== "teer") {
            const n = toks[i].n;
            i++;
            if (!(n >= 1 && n <= 64)) err(tk.line, tk.col, "Repeat counts run from 1 to 64.");
            if (node.type === "bar" || node.type === "speed") err(tk.line, tk.col, "A bar or speed mark cannot be repeated.");
            node = { type: "rep", n, node, line: tk.line, col: tk.col };
          }
          out.push(node);
        }
        if (end) {
          const last = toks[toks.length - 1];
          err(last ? last.line : 0, last ? last.col : 0, 'Missing "' + end + '".');
        }
        return out;
      }
      items.push.apply(items, seq(null));
      return items;
    }
    const ast = parseSeq(bodyToks, "body");
    Object.keys(defs).forEach((k) => {
      if (!defs[k].ast) warnings.push({ line: defs[k].line, msg: "The phrase $" + k + " is defined but never used." });
    });
    if (!bodyToks.length) err(0, 0, "The jathi has no syllables yet.");
    const E0 = eduppu * matra;
    const events = [], units = [], bars = [], speeds = [], teers = [];
    let pos = 0, speed = nadai, unit = TICKS / speed, open = null, uid = 0;
    const isLeaf = (items) => items.every((n) => n.type === "syl" || n.type === "kv");
    const closeLoose = () => {
      if (open) {
        open.end = pos;
        units.push(open);
        open = null;
      }
    };
    const sylWarned = /* @__PURE__ */ new Set();
    function emitSyl(v, role, unitRef, line, col) {
      const n = norm(v);
      if (!KNOWN.has(n) && !sylWarned.has(v)) {
        sylWarned.add(v);
        const sp2 = splitCompound(v);
        warnings.push({ line, msg: sp2 ? '"' + v + '" is counted as one matra. If it means ' + sp2.length + " syllables, write " + sp2.join("-") + "." : '"' + v + '" is not in the sollu vocabulary. It still counts as one matra.' });
      }
      events.push({ k: "syl", v, n, start: pos, dur: unit, role, unit: unitRef });
      if (unitRef) {
        unitRef.syls.push(v);
        unitRef.nsyl++;
      }
      pos += unit;
    }
    function emitKv(n, role, unitRef) {
      for (let j = 0; j < n; j++) {
        events.push({ k: "kv", v: ",", start: pos, dur: unit, role, unit: unitRef });
        if (unitRef) unitRef.syls.push(",");
        pos += unit;
      }
    }
    function expand(items, role, unitRef, depth) {
      if (depth > 40) {
        err(0, 0, "Phrases are nested too deeply.");
        return;
      }
      items.forEach((nd) => {
        if (errors.length > 50) return;
        if (nd.type === "syl") {
          if (!unitRef && !open) open = { id: ++uid, kind: "loose", start: pos, syls: [], nsyl: 0, role };
          emitSyl(nd.v, role, unitRef || open, nd.line, nd.col);
        } else if (nd.type === "kv") {
          if (unitRef) emitKv(nd.n, role, unitRef);
          else {
            closeLoose();
            emitKv(nd.n, role === "teer" ? "teer" : role, null);
          }
        } else if (nd.type === "group") {
          if (unitRef) {
            expand(nd.items, role, unitRef, depth + 1);
            return;
          }
          closeLoose();
          if (isLeaf(nd.items)) {
            const u = { id: ++uid, kind: nd.kind, name: nd.name, start: pos, syls: [], nsyl: 0, role };
            expand(nd.items, role, u, depth + 1);
            u.end = pos;
            units.push(u);
          } else {
            expand(nd.items, role, null, depth + 1);
            closeLoose();
          }
        } else if (nd.type === "rep") {
          for (let r = 0; r < nd.n; r++) expand([nd.node], role, unitRef, depth + 1);
        } else if (nd.type === "teer") {
          if (unitRef) {
            err(nd.line, nd.col, "A teermanam cannot sit inside a group.");
            return;
          }
          closeLoose();
          const t0 = pos, reps = [];
          for (let r = 0; r < 3; r++) {
            reps.push(pos);
            if (isLeaf(nd.items)) {
              const u = { id: ++uid, kind: "teer", start: pos, syls: [], nsyl: 0, role: "teer" };
              expand(nd.items, "teer", u, depth + 1);
              u.end = pos;
              units.push(u);
            } else {
              expand(nd.items, "teer", null, depth + 1);
              closeLoose();
            }
            if (r < 2) emitKv(nd.q, "gap", null);
          }
          const phraseLen = reps[1] - reps[0] - nd.q * unit;
          teers.push({
            start: t0,
            end: pos,
            reps,
            phrase: phraseLen,
            gap: nd.q * unit,
            q: nd.q,
            explicit: true,
            line: nd.line,
            syls: events.filter((e) => e.start >= reps[2] && e.start < pos).map((e) => e.v)
          });
        } else if (nd.type === "bar") {
          closeLoose();
          bars.push({ at: pos, dbl: nd.dbl, line: nd.line, col: nd.col });
        } else if (nd.type === "speed") {
          closeLoose();
          speed = nd.n;
          unit = TICKS / speed;
          speeds.push({ at: pos, n: nd.n, line: nd.line, col: nd.col });
        }
      });
    }
    if (!errors.length) {
      expand(ast, "body", null, 0);
      closeLoose();
    }
    units.forEach((u) => {
      u.len = u.end - u.start;
    });
    return { ok: !errors.length, errors, warnings, header: { tala: tl, nadai, kalai, avartanams, eduppu, land }, tl, nadai, kalai, avartanams, eduppu, land, cycleTicks, matra, E0, events, units, bars, speeds, teers, total: pos };
  }
  function jathiToScript(res, tl, opts) {
    const o = opts || {}, g = res.g, cycle = res.cycle, starts = angaStarts(tl);
    const lines = [
      "# Generated jathi: " + tl.name + ", nadai " + g + ", seed " + (o.seed || 1) + ", temperature " + (o.T == null ? 1 : o.T),
      "tala: " + talaSpec(tl),
      "nadai: " + g,
      "avartanams: " + res.avartanams,
      "eduppu: " + (res.offset === 0 ? "sam" : (res.offset > 0 ? "+" : "") + res.offset),
      "land: " + (res.land === "end" ? "end" : "sam"),
      ""
    ];
    let pos = res.offset, line = [];
    const boundary = () => {
      if (pos <= 0 && res.offset >= 0) return;
      const r = (pos % cycle + cycle) % cycle;
      if (r === 0) {
        line.push("||");
        lines.push(line.join(" "));
        line = [];
      } else if (r % g === 0 && starts.has(r / g)) line.push("|");
    };
    let teerDone = false;
    res.segs.forEach((sg, k) => {
      if (sg.role === "body" || sg.role === "yati") {
        if (line.length || pos !== res.offset) boundary();
        line.push(sg.syl.length > 1 ? sg.syl.join("-") : sg.syl[0]);
        pos += sg.syl.length;
      } else if (!teerDone && sg.role === "teermanam") {
        if (pos !== res.offset) boundary();
        const u = sg.syl, inner = u.some((x) => x === ",") ? u.join(" ") : u.join("-");
        line.push("{" + inner + "}/" + res.plan.q);
        teerDone = true;
      }
    });
    if (line.length) lines.push(line.join(" "));
    return lines.join("\n") + "\n";
  }

  // src/engine/jathi/generator.js
  var TEER = [
    { id: "tdgnt", s: ["tha", "dhi", "gi", "na", "thom"], F: 0.8, N: 0 },
    { id: "tktdgnt", s: ["tha", "ka", "tha", "dhi", "gi", "na", "thom"], F: 0.4, N: 0.2 },
    { id: "gapped", s: ["tha", ",", "dhi", ",", "gi", "na", "thom"], F: 0, N: 0.6 },
    { id: "nine", s: ["tha", "ka", "dhi", "mi", "tha", "dhi", "gi", "na", "thom"], F: 0.1, N: 0.3 }
  ];
  function yatiBlocks(pref) {
    const out = [];
    if (pref === "none") return out;
    const want = (t) => pref === "auto" || pref === t;
    Object.keys(SOLLU).map(Number).filter((w) => w >= 5).forEach((w) => SOLLU[w].forEach((base) => {
      [1, 2].forEach((dd) => [3, 4].forEach((cnt) => {
        if (w - dd * (cnt - 1) < 2) return;
        const sufs = [];
        for (let i = 0; i < cnt; i++) sufs.push(base.slice(i * dd));
        if (want("gopuccha")) out.push({ type: "gopuccha", parts: sufs });
        if (want("srotovaha")) out.push({ type: "srotovaha", parts: sufs.slice().reverse() });
        if (cnt === 3 && want("mridanga")) out.push({ type: "mridanga", parts: sufs.slice().reverse().concat(sufs.slice(1)) });
        if (cnt === 3 && want("damaru")) out.push({ type: "damaru", parts: sufs.concat(sufs.slice(0, 2).reverse()) });
      }));
    }));
    if (want("sama")) [3, 4, 5].forEach((w) => SOLLU[w].forEach((base) => [3, 4].forEach((cnt) => out.push({ type: "sama", parts: Array.from({ length: cnt }, () => base) }))));
    out.forEach((y) => {
      y.len = y.parts.reduce((s, p) => s + p.length, 0);
    });
    return out;
  }
  function jathi(opts) {
    const { tl, nadai, avartanams } = opts;
    const offset = opts.offset || 0, yatiPref = opts.yatiPref || "auto", land = opts.land || "sam";
    const D = dial(opts.T == null ? 1 : opts.T), rand = rng(opts.seed || 1), g = nadai, cycle = tl.total * g;
    if (Math.abs(offset) >= cycle) return { error: "The eduppu must be less than one avartanam away from sam." };
    const M = avartanams * cycle - offset;
    const slots = land === "end" ? M : M + 1;
    if (M < 6) return { error: "The span is too short. Add an avartanam or move the eduppu closer to sam." };
    const yOpts = [{ type: "none", len: 0, parts: [] }].concat(yatiBlocks(yatiPref));
    const combos = [];
    TEER.forEach((u) => {
      for (let q = 0; q <= 4; q++) yOpts.forEach((y) => {
        const tlen = 3 * u.s.length + 2 * q, free = slots - tlen - y.len;
        if (free < 0) return;
        if (yatiPref !== "auto" && yatiPref !== "none" && y.type === "none") return;
        combos.push({ u, q, y, tlen, free });
      });
    });
    if (!combos.length) return { error: "No teermanam fits this span with the chosen yati. Add an avartanam or set yati to auto." };
    const cs = combos.map((x) => {
      let F = x.u.F, N = x.u.N;
      const teerStart = offset + x.free + x.y.len;
      if ((x.u.s.length + x.q) % g === 0 && (teerStart % g + g) % g === 0) F += 1;
      else N += 0.5;
      if (x.q <= 2) F += 0.4;
      if (x.free >= g) F += 0.6;
      if (x.free % g === 0) F += 0.5;
      else N += 0.3;
      if (x.y.type === "none") F += 0.3;
      else if (x.y.type === "sama") {
        F += 0.2;
        N += 0.2;
      } else N += x.y.type === "mridanga" || x.y.type === "damaru" ? 1 : 0.8;
      if (yatiPref !== "auto" && x.y.type !== "none") {
        F += 0.5;
        N += 0.5;
      }
      const share = x.tlen / slots;
      F -= Math.abs(share - 0.35) * 1.5;
      N -= Math.abs(share - 0.35);
      return (1 - D.c) * F + D.c * N;
    });
    const c = combos[soft(cs, D.tau, rand)];
    const body = [];
    let pos = offset, rem = c.free, prevKey = null;
    while (rem > 0) {
      const cands = [];
      Object.keys(SOLLU).map(Number).filter((l) => l <= rem).forEach((l) => SOLLU[l].forEach((ph2) => cands.push(ph2)));
      const sc = cands.map((p) => {
        const l = p.length, end = pos + l;
        let F = 0, N = 0;
        if (l === g) F += 1;
        else if (l === 2 * g) F += 0.5;
        else if (l % 2 === 1) N += 0.6;
        if ((end % g + g) % g === 0) F += 0.8;
        else N += 0.4;
        if ((pos % g + g) % g !== 0) N += 0.2;
        if (p.join() === prevKey) {
          F += 0.4;
          N -= 0.4;
        } else N += 0.3;
        if (l === 1) {
          F -= 0.9;
          N -= 0.5;
        }
        if (p[p.length - 1] === "thom") {
          F -= 0.5;
          N -= 0.5;
        }
        if (p[0] === "tai" || p[0] === "tat") F -= 0.3;
        return (1 - D.c) * F + D.c * N;
      });
      const ph = cands[soft(sc, D.tau, rand)];
      body.push(ph);
      prevKey = ph.join();
      pos += ph.length;
      rem -= ph.length;
    }
    const gap = new Array(c.q).fill(",");
    const teer = [c.u.s, gap, c.u.s, gap, c.u.s];
    const segs = [];
    body.forEach((p) => segs.push({ role: "body", syl: p }));
    c.y.parts.forEach((p) => segs.push({ role: "yati", syl: p }));
    teer.forEach((p, i) => {
      if (p.length) segs.push({ role: i % 2 ? "gap" : "teermanam", syl: p });
    });
    const used = segs.reduce((s, x) => s + x.syl.length, 0);
    const spanTxt = avartanams + " \xD7 " + tl.total + " aksharas \xD7 " + g + " matras " + (offset > 0 ? "\u2212 " + offset + " (eduppu after sam)" : offset < 0 ? "+ " + -offset + " (eduppu before sam)" : "(eduppu on sam)") + " = " + M + " matras to sam";
    const res = {
      segs,
      slots,
      M,
      cycle,
      g,
      offset,
      avartanams,
      used,
      land,
      plan: { body: body.length, yati: c.y.type, teer: c.u.s, q: c.q },
      audit: {
        span: spanTxt,
        body: c.free,
        yati: c.y.type === "none" ? "none" : c.y.type + " (" + c.y.parts.map((p) => p.length).join(" \u2192 ") + ")",
        yatiLen: c.y.len,
        teermanam: "3 \xD7 " + c.u.s.length + " + 2 \xD7 " + c.q + " = " + c.tlen,
        ok: used === slots
      }
    };
    res.script = jathiToScript(res, tl, opts);
    return res;
  }

  // src/engine/jathi/judge.js
  function fmtTicks(t, matra) {
    const sgn = t < 0 ? "\u2212" : "", a = Math.abs(t);
    if (a % matra === 0) {
      const m = a / matra;
      return sgn + m + (m === 1 ? " matra" : " matras");
    }
    const g = (x, y) => y ? g(y, x % y) : x, d = g(a, TICKS);
    return sgn + a / d + "/" + TICKS / d + " of an akshara";
  }
  function judgeJathi(text) {
    const P = typeof text === "string" ? parseJathiScript(text) : text;
    if (!P.ok) return { parsed: P, ok: false, errors: P.errors, warnings: P.warnings };
    const { tl, nadai, kalai, cycleTicks, matra, E0, events, units, bars, speeds, land } = P;
    const mod2 = (a, b) => (a % b + b) % b;
    const fm = (t) => fmtTicks(t, matra);
    const angaB = /* @__PURE__ */ new Set([0]);
    let acc = 0;
    tl.angas.forEach((a) => {
      acc += a.len * kalai * TICKS;
      angaB.add(acc % cycleTicks);
    });
    const abs = (t) => E0 + t;
    const where2 = (a) => {
      const c = Math.floor(a / cycleTicks) + 1, r = mod2(a, cycleTicks), ak = Math.floor(r / TICKS) + 1, sub = r % TICKS;
      return "cycle " + c + ", akshara " + ak + (sub ? " + " + fm(sub) : "");
    };
    const syls = events.filter((e) => e.k === "syl");
    const gate = [], fixes = [];
    let teer = P.teers.length ? P.teers[P.teers.length - 1] : null, teerIssue = null;
    if (P.teers.length > 1) teerIssue = "Only the last {\u2026} counts as the teermanam; earlier ones are judged as part of the body.";
    if (!teer) {
      const body = units.filter((u) => u.role === "body" && u.nsyl > 0);
      if (body.length >= 3) {
        const [a, b, c] = body.slice(-3), key = (u) => u.syls.map(norm).join(" ");
        const between = (x, y) => events.filter((e) => e.start >= x.end && e.start < y.start);
        const after = events.filter((e) => e.start >= c.end);
        if (key(a) === key(b) && key(b) === key(c) && a.len === b.len && b.len === c.len && between(a, b).every((e) => e.k === "kv") && between(b, c).every((e) => e.k === "kv") && after.every((e) => e.k === "kv")) {
          const g1 = b.start - a.end, g2 = c.start - b.end;
          if (g1 === g2) {
            teer = { start: a.start, end: c.end, reps: [a.start, b.start, c.start], phrase: a.len, gap: g1, explicit: false, syls: c.syls };
            [a, b, c].forEach((u) => {
              u.role = "teer";
            });
          } else teerIssue = "The last three phrases are equal but the gaps between them are not (" + fm(g1) + " and " + fm(g2) + "). A teermanam needs equal gaps.";
        }
      }
    }
    const lastSyl = syls[syls.length - 1];
    const endAbs = abs(P.total), landAbs = lastSyl ? abs(lastSyl.start) : abs(0);
    const kOff = land.type === "after" ? land.k * matra : 0;
    const actual = land.type === "end" ? endAbs : landAbs;
    let N = P.avartanams, diff = 0, spanOK = true, spanMsg;
    const landWord = land.type === "end" ? "The jathi ends" : 'The last syllable "' + (lastSyl ? lastSyl.v : "") + '" falls';
    if (N) {
      const target = N * cycleTicks + kOff;
      diff = target - actual;
      spanOK = diff === 0;
      spanMsg = spanOK ? landWord + (land.type === "end" ? " exactly at sam after " : " on " + (land.type === "after" ? fm(kOff) + " after " : "") + "sam after ") + N + " avartanam" + (N > 1 ? "s" : "") + "." : landWord + " at " + where2(actual) + ". It should " + (land.type === "end" ? "end at sam" : "fall on " + (land.type === "after" ? fm(kOff) + " after " : "") + "sam") + " after " + N + " avartanams: the jathi is " + fm(Math.abs(diff)) + (diff > 0 ? " short." : " too long.");
    } else {
      const r = mod2(actual - kOff, cycleTicks);
      if (r === 0 && actual - kOff > 0) {
        N = (actual - kOff) / cycleTicks;
        spanMsg = landWord + " on " + (kOff ? fm(kOff) + " after " : "") + "sam after " + N + " avartanam" + (N > 1 ? "s" : "") + ' (inferred; add "avartanams: ' + N + '" to make it a requirement).';
      } else {
        spanOK = false;
        const lo = Math.floor((actual - kOff) / cycleTicks);
        diff = (lo + 1) * cycleTicks + kOff - actual;
        N = lo + 1;
        spanMsg = landWord + " at " + where2(actual) + ", not on sam. Add " + fm(diff) + " to reach the next sam" + (r > 0 && lo >= 1 ? ", or remove " + fm(r) + " to land on the previous one." : ".");
      }
    }
    gate.push({ id: "span", label: "Span and landing", ok: spanOK, detail: spanMsg });
    if (!spanOK && diff) {
      const d = Math.abs(diff), dm = d / matra, isInt2 = Number.isInteger(dm);
      if (diff > 0) {
        fixes.push("Add " + fm(d) + " of karvai (" + (isInt2 && dm <= 8 ? new Array(dm).fill(",").join(" ") : ";") + ") " + (teer ? "just before the teermanam." : "before the final phrase."));
        if (teer && isInt2 && dm % 2 === 0) fixes.push("Or widen the teermanam gap by " + dm / 2 + " (each of its two gaps grows by " + dm / 2 + ", which adds " + dm + ").");
        if (teer && isInt2 && dm % 3 === 0) fixes.push("Or lengthen the teermanam phrase by " + dm / 3 + " syllable" + (dm / 3 > 1 ? "s" : "") + " (three repetitions add " + dm + ").");
        if (isInt2) fixes.push("Or start " + fm(d) + " earlier: eduppu " + (P.eduppu - dm === 0 ? "sam" : (P.eduppu - dm > 0 ? "+" : "") + (P.eduppu - dm)) + ".");
      } else {
        fixes.push("Remove " + fm(d) + " from the body (syllables or karvai).");
        if (teer && isInt2 && dm % 2 === 0 && teer.gap >= dm / 2 * matra) fixes.push("Or narrow the teermanam gap by " + dm / 2 + " (both gaps shrink, which removes " + dm + ").");
        if (teer && isInt2 && dm % 3 === 0) fixes.push("Or shorten the teermanam phrase by " + dm / 3 + " syllable" + (dm / 3 > 1 ? "s" : "") + ".");
        if (isInt2) fixes.push("Or start " + fm(d) + " later: eduppu " + (P.eduppu + dm === 0 ? "sam" : (P.eduppu + dm > 0 ? "+" : "") + (P.eduppu + dm)) + ".");
      }
    }
    if (land.type !== "end" && lastSyl) {
      const trail = P.total - (lastSyl.start + lastSyl.dur);
      gate.push({ id: "trail", label: "Nothing after the landing syllable", ok: trail === 0, detail: trail === 0 ? "The jathi stops on its landing syllable." : "There is " + fm(trail) + ' of karvai after the last syllable. Remove it, or set "land: end" if the jathi should end exactly at sam.' });
      if (trail) fixes.push('Delete the karvai after the final "' + lastSyl.v + '".');
    }
    const badBars = [];
    bars.forEach((b) => {
      const a = abs(b.at), r = mod2(a, cycleTicks);
      const ok = b.dbl ? r === 0 : angaB.has(r);
      if (!ok) {
        let best = null;
        const cands = b.dbl ? [0, cycleTicks] : Array.from(angaB).concat([cycleTicks]);
        cands.forEach((x) => {
          const dd = x - r;
          if (best === null || Math.abs(dd) < Math.abs(best)) best = dd;
        });
        badBars.push("Line " + b.line + ", column " + b.col + ': "' + (b.dbl ? "||" : "|") + '" falls at ' + where2(a) + ". " + (best > 0 ? "It is " + fm(best) + " early: the phrases before it are " + fm(best) + " short." : "It is " + fm(-best) + " late: the phrases before it are " + fm(-best) + " too long."));
        if (!badBars.first) badBars.first = { line: b.line, delta: best };
      }
    });
    if (badBars.first) {
      const f = badBars.first;
      fixes.unshift("Start with line " + f.line + ": the phrases before the bar there are " + fm(Math.abs(f.delta)) + (f.delta > 0 ? " short" : " too long") + "." + (diff === f.delta ? " Fixing that also fixes the span." : ""));
    }
    gate.push({ id: "bars", label: "Bars match the tala", ok: !badBars.length, detail: bars.length ? badBars.length ? badBars.join(" ") : "All " + bars.length + " bars fall on anga or avartanam lines." : "No bars written (optional; they let the judge check your counting)." });
    gate.push({ id: "teer", label: "Teermanam", ok: !!teer, detail: teer ? "The final phrase repeats three times with equal gaps of " + fm(teer.gap) + (teer.explicit ? "." : " (written out; detected).") : teerIssue || "No teermanam. A jathi ends with one phrase played three times with equal gaps." });
    if (!teer) fixes.push(teerIssue && /equal but/.test(teerIssue) ? "Make the gaps between the three final phrases equal, or write them as {phrase}/gap." : "End with a teermanam, for example {tha-dhi-gi-na-thom}/2: the phrase three times with gaps of 2.");
    {
      let lead = 0;
      for (const e of events) {
        if (e.k === "kv") lead += e.dur;
        else break;
      }
      const lm = lead / matra;
      gate.push({ id: "open", label: "Opens at the eduppu", ok: lead === 0, detail: lead === 0 ? "The first syllable sounds at the eduppu." : "The jathi opens with " + fm(lead) + " of karvai, so its first sound comes after the eduppu." });
      if (lead) fixes.push("Remove the opening karvai" + (Number.isInteger(lm) ? ' and set "eduppu: ' + (P.eduppu + lm === 0 ? "sam" : (P.eduppu + lm > 0 ? "+" : "") + (P.eduppu + lm)) + '"' : "") + ", so the jathi starts where it sounds.");
    }
    const ORDER = ["span", "open", "trail", "bars", "teer"];
    gate.sort((x, y) => ORDER.indexOf(x.id) - ORDER.indexOf(y.id));
    const gatePass = gate.every((g) => g.ok);
    const total = P.total, sounding = syls.length;
    const bodyUnits = units.filter((u) => u.role === "body" && u.nsyl > 0);
    const allUnits = units.filter((u) => u.nsyl > 0);
    const onBeat = (a) => mod2(a, TICKS) === 0;
    const asp = [];
    {
      const notes = [];
      let s = 0;
      const anchors = [abs(0)].concat(allUnits.filter((u) => onBeat(abs(u.start))).map((u) => abs(u.start))).concat([abs(total)]).sort((a, b) => a - b);
      let maxGap = 0;
      for (let k = 1; k < anchors.length; k++) maxGap = Math.max(maxGap, anchors[k] - anchors[k - 1]);
      const gapAk = maxGap / TICKS;
      const a1 = gapAk <= 3 ? 8 : gapAk <= 4 ? 6 : gapAk <= 6 ? 3 : 0;
      s += a1;
      notes.push(a1 === 8 ? "Phrases come back to a beat within three aksharas." : "One stretch runs " + gapAk.toFixed(1) + " aksharas before a phrase starts on a beat again. Cross-rhythm is welcome, but resolve it within three or four aksharas so the dancer can find the beat.");
      let a2 = 4;
      const firstEv = events[0];
      if (firstEv && firstEv.k === "kv") {
        a2 -= 2;
        notes.push("The jathi opens with a karvai; the eduppu should sound.");
      }
      let longKv = 0, runKv = 0;
      events.forEach((e) => {
        if (e.k === "kv" && e.role !== "gap") {
          runKv += e.dur;
          if (runKv > TICKS) longKv++;
        } else runKv = 0;
      });
      if (longKv) {
        a2 -= 1;
        notes.push("A karvai inside the body lasts longer than one akshara.");
      }
      s += Math.max(0, a2);
      let a3 = 4;
      speeds.forEach((sp2) => {
        if (!onBeat(abs(sp2.at))) {
          a3 -= 2;
          notes.push("The speed change at line " + sp2.line + " happens mid-akshara; change speed on a beat.");
        }
        if (sp2.n > 2 * nadai) {
          a3 -= 1;
          notes.push("@" + sp2.n + " is more than double the nadai; very fast for footwork.");
        }
      });
      s += Math.max(0, a3);
      let a4 = 0;
      if (teer) {
        const step = teer.reps[1] - teer.reps[0];
        a4 = step % TICKS === 0 ? 4 : 2;
        notes.push(a4 === 4 ? "Each teermanam repetition starts at the same point in the beat." : "The teermanam repetitions start at different points in the beat (a deliberate effect, but harder to dance).");
      } else a4 = 1;
      s += a4;
      asp.push({ id: "rhythm", name: "Rhythmic integrity", score: s, max: 20, notes });
    }
    {
      const notes = [];
      let s = 0;
      if (teer) {
        s += 8;
        notes.push("Ends with a teermanam.");
      } else notes.push("No teermanam. A jathi normally ends with one phrase played three times with equal gaps, for example {tha-dhi-gi-na-thom}/2.");
      if (teer) {
        const after = events.filter((e) => e.start >= teer.end && e.k === "syl");
        if (!after.length) s += 3;
        else notes.push("Syllables follow the teermanam.");
      }
      if (teer) {
        const share = (teer.end - teer.start) / total;
        if (share >= 0.15 && share <= 0.6) s += 5;
        else {
          s += 2;
          notes.push("The teermanam takes " + Math.round(share * 100) + "% of the jathi; 15\u201360% is typical.");
        }
      }
      const bodyLen = teer ? teer.start : total;
      if (bodyLen >= TICKS) s += 2;
      else notes.push("There is almost no body before the teermanam.");
      s += P.avartanams ? 2 : 1;
      if (!P.avartanams) notes.push('State "avartanams:" so the span is a requirement, not a guess.');
      asp.push({ id: "structure", name: "Structure and form", score: s, max: 20, notes });
    }
    {
      const notes = [];
      let s = 0;
      if (teer) {
        s += 8;
        const lastV = norm(teer.syls.filter((x) => x !== ",").slice(-1)[0] || "");
        if (CADENCE2.has(lastV)) s += 3;
        else notes.push('The teermanam ends on "' + lastV + '"; a closing syllable such as thom, dhit, tam or nam marks the arrival.');
        if (teer.gap <= teer.phrase) s += 2;
        else notes.push("The gap is longer than the phrase; the three statements may not sound connected.");
        const first = norm(teer.syls.find((x) => x !== ",") || "");
        if (teer.phrase >= 3 * (TICKS / nadai) && HEAVY.has(first)) s += 2;
        else notes.push("A teermanam phrase of three or more syllables that opens on a strong syllable (tha, dhi, tat, tai \u2026) is easier to hear.");
        if (!teer.explicit) notes.push("Detected from three equal phrases. Writing it as {\u2026}/gap makes your intention explicit.");
      } else notes.push("No teermanam to judge.");
      asp.push({ id: "teermanam", name: "Teermanam quality", score: s, max: 15, notes });
    }
    {
      const notes = [];
      let s = 0;
      const known = syls.filter((e) => KNOWN.has(e.n)).length / Math.max(1, sounding);
      s += 5 * known;
      if (known < 1) notes.push("Unrecognised syllables: " + Array.from(new Set(syls.filter((e) => !KNOWN.has(e.n)).map((e) => e.v))).join(", ") + ".");
      const check = allUnits.filter((u) => u.nsyl >= 2);
      const idi = check.length ? check.filter((u) => idiomatic(u.syls)).length / check.length : 1;
      s += 5 * idi;
      if (idi < 0.8) notes.push(Math.round((1 - idi) * 100) + "% of phrases are not standard sollu groups (for example tha-ki-ta, tha-ka-dhi-mi, tha-dhi-gi-na-thom) or suffixes of them.");
      const beatSyl = syls.filter((e) => onBeat(abs(e.start)));
      const unitStarts = new Set(allUnits.map((u) => u.start));
      const strong = beatSyl.length ? beatSyl.filter((e) => HEAVY.has(e.n) || unitStarts.has(e.start)).length / beatSyl.length : 1;
      s += 5 * strong;
      if (strong < 0.8) notes.push("Some beats fall on light syllables in the middle of a phrase (ka, ki, mi, nu \u2026).");
      asp.push({ id: "idiom", name: "Sollu idiom", score: Math.round(s * 10) / 10, max: 15, notes });
    }
    let yati = null;
    {
      const notes = [];
      let s = 0;
      const lens = bodyUnits.map((u) => u.len);
      const distinct = new Set(lens).size;
      s += distinct >= 3 ? 5 : distinct === 2 ? 3 : 1;
      const W = { mridanga: 3, damaru: 3, gopuccha: 2, srotovaha: 2, sama: 1 };
      const strictUp = (a) => a.every((v, k) => k === 0 || v > a[k - 1]), strictDown = (a) => a.every((v, k) => k === 0 || v < a[k - 1]);
      const shapeOf = (L) => {
        if (L.every((v) => v === L[0])) return "sama";
        if (strictDown(L)) return "gopuccha";
        if (strictUp(L)) return "srotovaha";
        if (L.length < 5) return null;
        const mx = Math.max.apply(null, L), mn = Math.min.apply(null, L);
        const peak = [L.indexOf(mx), L.lastIndexOf(mx)], val2 = [L.indexOf(mn), L.lastIndexOf(mn)];
        if (peak[1] - peak[0] <= 1 && peak[0] >= 2 && peak[1] <= L.length - 3 && strictUp(L.slice(0, peak[0] + 1)) && strictDown(L.slice(peak[1]))) return "mridanga";
        if (val2[1] - val2[0] <= 1 && val2[0] >= 2 && val2[1] <= L.length - 3 && strictDown(L.slice(0, val2[0] + 1)) && strictUp(L.slice(val2[1]))) return "damaru";
        return null;
      };
      const runs = [];
      let cur = [];
      bodyUnits.forEach((u) => {
        if (u.nsyl >= 2) cur.push(u);
        else {
          if (cur.length) runs.push(cur);
          cur = [];
        }
      });
      if (cur.length) runs.push(cur);
      const str = (u) => u.syls.map(norm).join(" ");
      const related = (x, y) => {
        const a = str(x), b = str(y);
        const [sh, lo] = a.length <= b.length ? [a, b] : [b, a];
        return sh === lo || lo.endsWith(" " + sh) || lo.startsWith(sh + " ");
      };
      runs.forEach((R2) => {
        for (let a = 0; a < R2.length; a++) for (let b = a + 3; b <= R2.length; b++) {
          const U = R2.slice(a, b), L = U.map((u) => u.len), type = shapeOf(L);
          if (!type) continue;
          const derived = U.every((u, k) => k === 0 || related(U[k - 1], u));
          const w = W[type] + (derived ? 4 : 0);
          if (!yati || w > yati.w || w === yati.w && L.length > yati.lens.length) yati = { type, lens: L, derived, w };
        }
      });
      if (yati && yati.type !== "sama") {
        s += yati.derived ? 4 : 3;
        notes.push(yati.type[0].toUpperCase() + yati.type.slice(1) + " yati: " + yati.lens.map((x) => +(x / (TICKS / nadai)).toFixed(2)).join(" \u2192 ") + " matras" + (yati.derived ? ", each phrase grown from or cut from its neighbour." : ". The lengths make the shape; deriving each phrase from the one before (adding or dropping syllables at the front) makes it audible."));
      } else if (yati) {
        s += 2;
        notes.push("Sama yati (equal groups). A shaped yati (gopuccha 7 \u2192 5 \u2192 3, srotovaha 3 \u2192 5 \u2192 7) adds interest.");
      } else if (distinct >= 3) {
        s += 2;
        yati = { type: "vishama", lens: [] };
        notes.push("Free (vishama) grouping.");
      } else notes.push("No yati shape.");
      const pats = bodyUnits.map((u) => u.syls.join(" "));
      const ratio = pats.length ? new Set(pats).size / pats.length : 1;
      s += ratio >= 0.4 ? 3 : ratio >= 0.25 ? 2 : 1;
      if (ratio < 0.4) notes.push("Many phrases repeat exactly.");
      const cross = bodyUnits.some((u) => !onBeat(abs(u.start))) || speeds.length > 0 || events.some((e) => e.k === "kv" && e.role === "body");
      s += cross ? 3 : 1;
      if (!cross) notes.push("Every phrase starts on a beat with no karvai or speed change: clear, but plain.");
      asp.push({ id: "variety", name: "Variety and creativity", score: s, max: 15, notes });
    }
    {
      const notes = [];
      let s = 0;
      const dens = syls.reduce((a, e) => a + e.dur, 0) / Math.max(1, total);
      s += dens >= 0.6 && dens <= 0.95 ? 5 : dens >= 0.45 && dens <= 1 ? 3 : 1;
      if (dens > 0.95) notes.push("Almost no karvai: the dancer has no place to settle.");
      else if (dens < 0.6) notes.push("Many karvais: the jathi may feel sparse.");
      let run = 0, maxRun = 0;
      events.forEach((e) => {
        if (e.k === "syl") {
          run += e.dur;
          maxRun = Math.max(maxRun, run);
        } else run = 0;
      });
      const runCyc = maxRun / cycleTicks;
      s += runCyc <= 2 ? 4 : runCyc <= 3 ? 2 : 0;
      if (runCyc > 2) notes.push("One unbroken run lasts " + runCyc.toFixed(1) + " avartanams without a karvai.");
      const big = allUnits.filter((u) => u.nsyl > 9).length;
      s += big ? 1 : 3;
      if (big) notes.push(big + " phrase" + (big > 1 ? "s are" : " is") + " longer than 9 syllables; split long phrases so each maps to an adavu.");
      const maxSpeed = Math.max.apply(null, [nadai].concat(speeds.map((x) => x.n)));
      s += maxSpeed <= 2 * nadai ? 3 : maxSpeed <= 3 * nadai ? 1 : 0;
      asp.push({ id: "dance", name: "Danceability", score: s, max: 15, notes });
    }
    let totalScore = Math.round(asp.reduce((a, x) => a + x.score, 0));
    const cap = gatePass ? 100 : 49;
    totalScore = Math.min(totalScore, cap);
    const grade = !gatePass ? "Not yet correct" : totalScore >= 85 ? "Excellent" : totalScore >= 70 ? "Good" : totalScore >= 55 ? "Fair" : "Needs work";
    return { parsed: P, ok: true, gate, gatePass, aspects: asp, total: totalScore, cap, grade, fixes, teer, yati, warnings: P.warnings, avartanams: N };
  }

  // src/engine/jathi/examples.js
  var JATHI_EXAMPLES = {
    adi: `# Adi tala, chatusra nadai, two avartanams from sam.
# The final "thom" of the teermanam lands on sam.
tala: adi
nadai: 4
avartanams: 2
eduppu: sam
land: sam
let A = tha-ka-dhi-mi
let B = tha-ka-jho-nu

$A $B $A $B |                       # laghu: 4 aksharas = 16 matras
tha , dhi , $A |                    # dhrutam: 8 matras
tha-ka-tha-ki-ta tha-ki-ta ||       # dhrutam: 5 + 3 = 8 matras
tha-ka-tha-ki-ta ka-tha-ki-ta tha-ki-ta     # gopuccha yati 5 \u2192 4 \u2192 3
{tha-dhi-gi-na-thom}/3              # teermanam 3 \xD7 5 + 2 \xD7 3 = 21
`,
    short: `# The same jathi with one karvai missing. Press Judge to see the fix.
tala: adi
nadai: 4
avartanams: 2
eduppu: sam
land: sam
let A = tha-ka-dhi-mi
let B = tha-ka-jho-nu

$A $B $A $B |
tha dhi , $A |
tha-ka-tha-ki-ta tha-ki-ta ||
tha-ka-tha-ki-ta ka-tha-ki-ta tha-ki-ta
{tha-dhi-gi-na-thom}/3
`,
    chapu: `# Misra chapu (3 + 2 + 2 counts), chatusra nadai: 28 matras per avartanam.
# Starts 2 matras before sam (atita eduppu) and lands on sam after 2 avartanams.
tala: misra chapu
nadai: 4
avartanams: 2
eduppu: -2
land: sam

dhi-mi ||                                                  # 2-matra pickup into sam
tha-ka-dhi-mi tha-ka-jho-nu tha-ka-dhi-mi | tha , dhi , tha-ka-dhi-mi | tha-ki-ta tha-ka-tha-ki-ta ||
gi-na-thom dhi-gi-na-thom tha-dhi-gi-na-thom                # srotovaha yati 3 \u2192 4 \u2192 5
{tha-dhi-gi-na-thom}/1
`,
    speed: `# Rupaka (chatusra jati: dhrutam + laghu = 6 aksharas), 2 avartanams.
# The second avartanam opens at double speed (@8), then returns to @4.
tala: rupaka
nadai: 4
avartanams: 2
land: sam

tha , ki-ta tha-ka-dhi-mi | tha-ka-dhi-mi tha-ka-jho-nu (tha-ka-dhi-mi)x2 ||
@8 (tha-ka-dhi-mi-tha-ka-jho-nu)x2 | @4 {tha-dhi-gi-na-thom}/1
`
  };

  // src/engine/korvai/index.js
  var korvai_exports = {};
  __export(korvai_exports, {
    CHAPU: () => CHAPU,
    DEFJ: () => DEFJ,
    FAM: () => FAM,
    GATIS: () => GATIS,
    GATI_NAME: () => GATI_NAME,
    JATI: () => JATI,
    JATI_SYLLABLES: () => JATI_SYLLABLES,
    KALAIS: () => KALAIS,
    MAX_CYCLES: () => MAX_CYCLES,
    PATTERN_KINDS: () => PATTERN_KINDS,
    SERIES_GROUPS: () => SERIES_GROUPS,
    TEXTURES: () => TEXTURES,
    YATIS: () => YATIS,
    YATI_INFO: () => YATI_INFO,
    YATI_NAME: () => YATI_NAME,
    altPhrase: () => altPhrase,
    altStatement: () => altStatement,
    apTerms: () => apTerms,
    beatsText: () => beatsText,
    chakkardarPlan: () => chakkardarPlan,
    chakkardarSolutions: () => chakkardarSolutions,
    chakradarPlan: () => chakradarPlan,
    chakradarSolutions: () => chakradarSolutions,
    checkMora: () => checkMora,
    classifyYati: () => classifyYati,
    constantTotal: () => constantTotal,
    constantTotalPlan: () => constantTotalPlan,
    doubledFrame: () => doubledFrame,
    drift: () => drift,
    edapuAlgorithm: () => edapuAlgorithm,
    exploreFacetCounts: () => exploreFacetCounts,
    exploreOrder: () => exploreOrder,
    exploreRealize: () => exploreRealize,
    exploreSpace: () => exploreSpace,
    exploreSurprise: () => exploreSurprise,
    fibTerms: () => fibTerms,
    fitYati: () => fitYati,
    gatiFits: () => gatiFits,
    gcd: () => gcd,
    gpTerms: () => gpTerms,
    halfTihais: () => halfTihais,
    jatiOf: () => jatiOf,
    kaarvaiOf: () => kaarvaiOf,
    korvaiFrame: () => korvaiFrame,
    korvaiPlan: () => korvaiPlan,
    korvaiPlans: () => korvaiPlans,
    korvaiThrice: () => thrice,
    kuraippuTerms: () => kuraippuTerms,
    layoutParts: () => layoutParts,
    lcm: () => lcm,
    lengthCondition: () => lengthCondition,
    moraPlan: () => moraPlan,
    moraShape: () => moraShape,
    moraSolutions: () => moraSolutions,
    nestedPhrases: () => nestedPhrases,
    offsetFor: () => offsetFor,
    offsetText: () => offsetText,
    patternInfo: () => patternInfo,
    patternsFor: () => patternsFor,
    phraseOf: () => phraseOf,
    politeRuns: () => politeRuns,
    progressiveKorvai: () => progressiveKorvai,
    progressiveOptions: () => progressiveOptions,
    purvangaShapes: () => purvangaShapes,
    samamAlgorithm: () => samamAlgorithm,
    samamKorvai: () => samamKorvai,
    seriesChart: () => seriesChart,
    squareTerms: () => squareTerms,
    statementKorvai: () => statementKorvai,
    statementOf: () => statementOf,
    statementOptions: () => statementOptions,
    tala: () => tala,
    talaCycle: () => talaCycle,
    targetSplit: () => targetSplit,
    thrice: () => thrice,
    toJathiScript: () => toJathiScript,
    trikaala: () => trikaala,
    where: () => where,
    yatiLineOf: () => yatiLineOf,
    yatiSum: () => yatiSum,
    yatiTerms: () => yatiTerms
  });

  // src/engine/korvai/patterns.js
  var sum = (xs) => xs.reduce((s, x) => s + x, 0);
  var isInt = (x) => Number.isInteger(x);
  function apTerms(a, d, n) {
    return Array.from({ length: n }, (_, i) => a + i * d);
  }
  function gpTerms(a, r, n) {
    return Array.from({ length: n }, (_, i) => a * Math.pow(r, i));
  }
  function fibTerms(x1, x2, n) {
    const t = [x1, x2];
    while (t.length < n) t.push(t[t.length - 1] + t[t.length - 2]);
    return t.slice(0, n);
  }
  function squareTerms(k, n) {
    return Array.from({ length: n }, (_, i) => (k + i) * (k + i));
  }
  function kuraippuTerms(L, n) {
    return Array.from({ length: n }, (_, i) => L / Math.pow(2, i));
  }
  function patternInfo(p) {
    const { kind } = p;
    let terms, formula, name;
    if (kind === "ap") {
      terms = apTerms(p.a, p.d, p.n);
      name = "arithmetic progression";
      formula = "n\xB7a + d\xB7n(n \u2212 1)/2 = " + p.n + "\xB7" + p.a + " + " + p.d + "\xB7" + p.n + "\xB7" + (p.n - 1) + "/2 = " + sum(terms);
    } else if (kind === "gp") {
      terms = gpTerms(p.a, p.r, p.n);
      name = "geometric progression";
      formula = "a(r\u207F \u2212 1)/(r \u2212 1) = " + p.a + "(" + p.r + "^" + p.n + " \u2212 1)/" + (p.r - 1) + " = " + sum(terms);
    } else if (kind === "fib") {
      terms = fibTerms(p.x1, p.x2, p.n);
      name = isFibonacci(terms) ? "Fibonacci" : "Fibonacci-like";
      formula = terms.slice(2).map((t, i) => t + " = " + terms[i] + " + " + terms[i + 1]).join(", ") + "; sum " + sum(terms);
    } else if (kind === "squares") {
      terms = squareTerms(p.k, p.n);
      name = "squares";
      const hi = p.k + p.n - 1, S = (x) => x * (x + 1) * (2 * x + 1) / 6;
      formula = p.k === 1 ? "n(n + 1)(2n + 1)/6 = " + p.n + "\xB7" + (p.n + 1) + "\xB7" + (2 * p.n + 1) + "/6 = " + sum(terms) : S(hi) + " \u2212 " + S(p.k - 1) + " = " + sum(terms) + " (squares to " + hi + "\xB2 less those to " + (p.k - 1) + "\xB2)";
    } else if (kind === "polite") {
      terms = apTerms(p.a, 1, p.n);
      name = "consecutive integers (a polite number)";
      formula = "n(2a + n \u2212 1)/2 = " + p.n + "(" + 2 * p.a + " + " + (p.n - 1) + ")/2 = " + sum(terms);
    } else if (kind === "kuraippu") {
      terms = kuraippuTerms(p.L, p.n);
      name = "kuraippu (halving)";
      formula = "L(2\u207F \u2212 1)/2\u207F\u207B\xB9 = " + p.L + "\xB7" + (Math.pow(2, p.n) - 1) + "/" + Math.pow(2, p.n - 1) + " = " + sum(terms) + " (never reaches 2L = " + 2 * p.L + ")";
    } else return null;
    return { kind, name, params: p, terms, sum: sum(terms), formula };
  }
  function isFibonacci(t) {
    const F = [1, 1];
    while (F[F.length - 1] < 1e6) F.push(F[F.length - 1] + F[F.length - 2]);
    for (let i = 0; i + t.length <= F.length; i++) if (t.every((x, j) => F[i + j] === x)) return true;
    return false;
  }
  var YATIS = ["sama", "srotovaha", "gopuccha", "mridanga", "damaru", "vishama"];
  var YATI_INFO = {
    sama: { name: "Sama", shape: "equal", picture: "a brick", sum: "S = n\xB7a" },
    srotovaha: { name: "Srotovaha", shape: "increasing", picture: "a river widening as it flows to the sea", sum: "S = n\xB7a + d\xB7n(n \u2212 1)/2" },
    gopuccha: { name: "Gopuccha", shape: "decreasing", picture: "a cow\u2019s tail (go = cow, puccha = tail), tapering", sum: "S = n\xB7a \u2212 d\xB7n(n \u2212 1)/2 (a the first, longest)" },
    mridanga: { name: "Mridanga", shape: "small\u2013big\u2013small", picture: "the mridangam: fat in the middle", sum: "S = (2m + 1)\xB7a + d\xB7m\xB2" },
    damaru: { name: "Damaru (pippilika)", shape: "big\u2013small\u2013big", picture: "an hourglass drum, or an ant (pippilika) with a thin waist", sum: "S = (2m + 1)\xB7b \u2212 d\xB7m\xB2" },
    vishama: { name: "Vishama", shape: "irregular", picture: "no regular pattern", sum: "S = the plain sum" }
  };
  function yatiTerms(kind, p) {
    if (kind === "sama") return new Array(p.n).fill(p.a);
    if (kind === "srotovaha") return apTerms(p.a, p.d, p.n);
    if (kind === "gopuccha") return apTerms(p.a, -p.d, p.n);
    if (kind === "mridanga") return Array.from({ length: 2 * p.m + 1 }, (_, i) => p.a + p.d * (p.m - Math.abs(i - p.m)));
    if (kind === "damaru") return Array.from({ length: 2 * p.m + 1 }, (_, i) => p.b - p.d * (p.m - Math.abs(i - p.m)));
    if (kind === "vishama") return (p.terms || []).slice();
    throw new Error('Unknown yati "' + kind + '".');
  }
  function yatiSum(kind, p) {
    const t = yatiTerms(kind, p), S = sum(t);
    const f = kind === "sama" ? p.n + " \xD7 " + p.a + " = " + S : kind === "srotovaha" ? p.n + "\xB7" + p.a + " + " + p.d + "\xB7" + p.n + "\xB7" + (p.n - 1) + "/2 = " + S : kind === "gopuccha" ? p.n + "\xB7" + p.a + " \u2212 " + p.d + "\xB7" + p.n + "\xB7" + (p.n - 1) + "/2 = " + S : kind === "mridanga" ? "(2\xB7" + p.m + " + 1)\xB7" + p.a + " + " + p.d + "\xB7" + p.m + "\xB2 = " + S : kind === "damaru" ? "(2\xB7" + p.m + " + 1)\xB7" + p.b + " \u2212 " + p.d + "\xB7" + p.m + "\xB2 = " + S : t.join(" + ") + " = " + S;
    return { kind, terms: t, sum: S, formula: f, ok: t.length > 0 && t.every((x) => isInt(x) && x >= 1) };
  }
  function fitYati(kind, S, p) {
    const d = p.d == null ? 1 : p.d;
    let q;
    if (kind === "sama") {
      if (S % p.n) return { error: S + " is not " + p.n + " equal phrases: " + S + " \xF7 " + p.n + " is not whole." };
      q = { a: S / p.n, n: p.n };
    } else if (kind === "srotovaha" || kind === "gopuccha") {
      const rest = kind === "srotovaha" ? S - d * p.n * (p.n - 1) / 2 : S + d * p.n * (p.n - 1) / 2;
      if (rest % p.n) return { error: "n\xB7a = " + rest + " is not divisible by n = " + p.n + ", so no whole first phrase works." };
      q = { a: rest / p.n, d, n: p.n };
    } else if (kind === "mridanga" || kind === "damaru") {
      const k = 2 * p.m + 1, rest = kind === "mridanga" ? S - d * p.m * p.m : S + d * p.m * p.m;
      if (rest % k) return { error: (kind === "mridanga" ? "S \u2212 dm\xB2" : "S + dm\xB2") + " = " + rest + " is not divisible by 2m + 1 = " + k + "." };
      q = kind === "mridanga" ? { a: rest / k, d, m: p.m } : { b: rest / k, d, m: p.m };
    } else return { error: "A vishama yati has no formula to solve; write its lengths out." };
    const r = yatiSum(kind, q);
    if (!r.ok) return { error: "The phrase lengths would be " + r.terms.join(", ") + ": every phrase must be at least 1." };
    return Object.assign(r, { params: q });
  }
  function classifyYati(t) {
    const L = t.length, D = t.slice(1).map((x, i) => x - t[i]);
    if (L < 2) return { kind: "vishama", why: "one phrase has no shape" };
    if (D.every((x) => x === 0)) return { kind: "sama", params: { a: t[0], n: L } };
    if (D.every((x) => x === D[0]) && D[0] > 0) return { kind: "srotovaha", params: { a: t[0], d: D[0], n: L } };
    if (D.every((x) => x === D[0]) && D[0] < 0) return { kind: "gopuccha", params: { a: t[0], d: -D[0], n: L } };
    if (L % 2 === 1 && L >= 3) {
      const m = (L - 1) / 2, up = D.slice(0, m), dn = D.slice(m), d = up[0];
      if (up.every((x) => x === d) && dn.every((x) => x === -d) && d > 0) return { kind: "mridanga", params: { a: t[0], d, m } };
      if (up.every((x) => x === d) && dn.every((x) => x === -d) && d < 0) return { kind: "damaru", params: { b: t[0], d: -d, m } };
    }
    return { kind: "vishama", why: "no regular step" };
  }
  var POLITE = /* @__PURE__ */ new Map();
  function politeRuns(S) {
    if (POLITE.has(S)) return POLITE.get(S);
    const res = politeRuns0(S);
    if (POLITE.size > 2e3) POLITE.clear();
    POLITE.set(S, res);
    return res;
  }
  function politeRuns0(S) {
    const out = [], odd = [];
    if (!isInt(S) || S < 1) return { S, runs: out, oddDivisors: odd, powerOf2: false };
    for (let d = 1; d <= S; d += 2) if (S % d === 0) odd.push(d);
    odd.filter((d) => d > 1).forEach((d) => {
      const c = S / d;
      if (c >= (d + 1) / 2) out.push({ d, c, a: c - (d - 1) / 2, n: d, rule: "the " + d + " terms centred at " + c });
      else out.push({ d, c, a: (d + 1) / 2 - c, n: 2 * c, rule: c + " is below (" + d + " + 1)/2, so the " + 2 * c + " terms from " + ((d + 1) / 2 - c) });
    });
    out.forEach((r) => {
      r.terms = apTerms(r.a, 1, r.n);
    });
    out.sort((x, y) => x.n - y.n);
    return { S, runs: out, oddDivisors: odd, powerOf2: (S & S - 1) === 0 };
  }
  var PATTERN_KINDS = ["ap", "gp", "fib", "squares", "polite", "kuraippu", "sama", "srotovaha", "gopuccha", "mridanga", "damaru"];
  function patternsFor(V, o = {}) {
    const kinds = o.kinds || PATTERN_KINDS, minN = o.minN || 3, maxN = o.maxN || 8, maxTerm = o.maxTerm || 24, maxD = o.maxD || 4, out = [];
    if (!isInt(V) || V < 3) return out;
    const want = (k) => kinds.includes(k), okTerms = (t) => t.length >= minN && t.every((x) => isInt(x) && x >= 1 && x <= maxTerm);
    const push = (kind, params, terms, formula, name) => {
      if (!okTerms(terms) || sum(terms) !== V) return;
      const key = kind + ":" + terms.join(",");
      if (out.some((x) => x.key === key)) return;
      let F = 1 - Math.abs(terms.length - 4) * 0.12 - (Math.min(...terms) < 2 ? 0.3 : 0) - (Math.max(...terms) > 12 ? 0.3 : 0);
      out.push({ key, kind, params, terms, sum: V, formula, name, score: +F.toFixed(2) });
    };
    for (let n = minN; n <= maxN; n++) {
      if (want("ap") || want("srotovaha")) for (let d = 1; d <= maxD; d++) {
        const r = V - d * n * (n - 1) / 2;
        if (r > 0 && r % n === 0) {
          const a = r / n, i = patternInfo({ kind: "ap", a, d, n });
          if (want("ap")) push("ap", { a, d, n }, i.terms, i.formula, i.name);
          if (want("srotovaha")) {
            const y = yatiSum("srotovaha", { a, d, n });
            push("srotovaha", { a, d, n }, y.terms, y.formula, "srotovaha yati");
          }
        }
      }
      if (want("gopuccha")) for (let d = 1; d <= maxD; d++) {
        const r = V + d * n * (n - 1) / 2;
        if (r % n === 0) {
          const a = r / n, y = yatiSum("gopuccha", { a, d, n });
          push("gopuccha", { a, d, n }, y.terms, y.formula, "gopuccha yati");
        }
      }
      if (want("sama") && V % n === 0) {
        const y = yatiSum("sama", { a: V / n, n });
        push("sama", { a: V / n, n }, y.terms, y.formula, "sama yati");
      }
      if (want("gp")) for (let r = 2; r <= 3; r++) {
        const den = (Math.pow(r, n) - 1) / (r - 1);
        if (V % den === 0) {
          const i = patternInfo({ kind: "gp", a: V / den, r, n });
          push("gp", { a: V / den, r, n }, i.terms, i.formula, i.name);
        }
      }
      if (want("kuraippu")) {
        const num = V * Math.pow(2, n - 1), den = Math.pow(2, n) - 1;
        if (num % den === 0) {
          const L = num / den, i = patternInfo({ kind: "kuraippu", L, n });
          push("kuraippu", { L, n }, i.terms, i.formula, i.name);
        }
      }
      if (want("squares")) for (let k = 1; k * k <= maxTerm; k++) {
        const i = patternInfo({ kind: "squares", k, n });
        if (i.sum === V) push("squares", { k, n }, i.terms, i.formula, i.name);
      }
      if (want("fib")) {
        const t1 = fibTerms(1, 0, n), t2 = fibTerms(0, 1, n), SA = sum(t1), SB = sum(t2);
        for (let x1 = 1; x1 <= 12; x1++) {
          const rem = V - SA * x1;
          if (rem < SB * x1 || rem % SB) continue;
          const x2 = rem / SB;
          if (x2 > 12) continue;
          const i = patternInfo({ kind: "fib", x1, x2, n });
          if (n >= 4 || i.name === "Fibonacci") push("fib", { x1, x2, n }, i.terms, i.formula, i.name);
        }
      }
    }
    if (want("polite")) politeRuns(V).runs.forEach((r) => {
      if (r.n >= minN && r.n <= maxN) {
        const i = patternInfo({ kind: "polite", a: r.a, n: r.n });
        push("polite", { a: r.a, n: r.n }, i.terms, i.formula, i.name);
      }
    });
    for (let m = 1; 2 * m + 1 <= maxN; m++) for (let d = 1; d <= maxD; d++) {
      const k = 2 * m + 1;
      if (2 * m + 1 < minN) continue;
      if (want("mridanga")) {
        const r = V - d * m * m;
        if (r > 0 && r % k === 0) {
          const y = yatiSum("mridanga", { a: r / k, d, m });
          push("mridanga", { a: r / k, d, m }, y.terms, y.formula, "mridanga yati");
        }
      }
      if (want("damaru")) {
        const r = V + d * m * m;
        if (r % k === 0) {
          const y = yatiSum("damaru", { b: r / k, d, m });
          push("damaru", { b: r / k, d, m }, y.terms, y.formula, "damaru (pippilika) yati");
        }
      }
    }
    return out.sort((a, b) => b.score - a.score || a.terms.length - b.terms.length);
  }

  // src/engine/korvai/compose.js
  var sum2 = (xs) => xs.reduce((s, x) => s + x, 0);
  var gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  var lcm = (a, b) => a / gcd(a, b) * b;
  var pct = (x) => Math.round(100 * x);
  var plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  function lengthCondition(C) {
    const g = gcd(C, 3), q = C / g;
    return { g, mod: q, text: g === 3 ? "C = " + C + " divides by 3, so any number of cycles splits into three equal statements of k \xD7 " + q + "." : "C = " + C + " does not divide by 3, so three identical statements from sam to sam need 3, 6, 9 \u2026 cycles; for other spans, use unequal statements or an eduppu." };
  }
  function uttarangaParts(U, group) {
    if (U < 12) return [{ role: "uttaranga", syl: statementOf(U), part: 0, group, teer: true, label: "uttaranga " + U }];
    const u = Math.floor(U / 3), r = U - 3 * u, lens = [u, u + (r > 1 ? 1 : 0), u + (r > 0 ? 1 : 0)];
    return lens.map((l, j) => ({ role: "uttaranga", syl: statementOf(l), part: j, group, teer: true, label: "uttaranga " + l }));
  }
  function statementKorvai(F, o = {}) {
    if (!F || !F.ok) return { error: F && F.error || "No frame." };
    const terms = (o.terms || []).map(Number);
    if (!terms.length || terms.some((t) => !Number.isInteger(t) || t < 1)) return { error: "The purvanga needs at least one phrase, each a whole number of pulses from 1." };
    const T = F.total, S = Math.floor(T / 3), extra = T - 3 * S, P = sum2(terms);
    const lens = [S, S + (extra > 1 ? 1 : 0), S + (extra > 0 ? 1 : 0)], Us = lens.map((x) => x - P);
    if (Us[0] < 1) return { error: "The purvanga (" + P + ") leaves no room for an uttaranga in a statement of " + S + "." };
    const fam = nestedPhrases(terms), parts = [];
    lens.forEach((len, i) => {
      terms.forEach((t, j) => parts.push({ role: "purvanga", syl: fam[j].slice(), part: j, group: i, teer: true, label: "statement " + (i + 1) + ", phrase " + (j + 1) }));
      uttarangaParts(Us[i], i).forEach((p) => parts.push(p));
    });
    const L = layoutParts(F, parts), ratio = P / S, lc = lengthCondition(F.C);
    const pat = o.pattern || null;
    const steps = F.steps.concat([
      {
        id: "statement",
        title: "Three statements",
        math: extra ? T + " = 3 \xD7 " + S + " + " + extra + " \u2192 " + lens.join(" + ") : "3 \xD7 (P + U) = " + T + " \u2192 P + U = " + S,
        text: extra ? T + " does not divide by 3, so the statements are " + lens.join(", ") + ": the last " + (extra > 1 ? "two get" : "one gets") + " a pulse more (Unit 3, Ex. 7.9)." : "Each statement is " + S + " pulses; the three together fill the span."
      },
      { id: "length", title: "The length condition", math: "S \u2261 0 (mod " + F.C + " / gcd(" + F.C + ", 3)) = 0 (mod " + lc.mod + ")", text: lc.text },
      { id: "purvanga", title: "The purvanga" + (pat ? ": " + pat.name : ""), math: pat ? pat.formula : terms.join(" + ") + " = " + P, text: "Phrases of " + terms.join(", ") + " in every statement: " + P + " pulses." },
      { id: "uttaranga", title: "The uttaranga", math: "U = S \u2212 P = " + lens.map((x, i) => x + " \u2212 " + P + " = " + Us[i]).join("; "), text: "U/P = " + (Us[0] / P).toFixed(2) + "; P : (P + U) = " + pct(ratio) + " : " + (100 - pct(ratio)) + (ratio >= 0.3 && ratio <= 0.7 ? ", inside 30 : 70 to 70 : 30 (P/U between 3/7 and 7/3)." : ratio > 0.7 ? ": purvanga-heavy (above 70%)." : ": uttaranga-heavy (below 30%).") },
      { id: "land", title: "The landing", math: L.checks[1].text, text: L.ok ? "It lands exactly." : "It does not land." }
    ]);
    let eduppu = null;
    if (extra) {
      const s2 = F.start + extra;
      if (Math.abs(s2) < F.C) eduppu = { start: s2, text: "Or start " + plural(extra, "pulse") + " later and play three identical statements of " + S + ": start + 3S \u2261 landing (mod " + F.C + ") (Unit 3, Ex. 7.15, solution 2)." };
    }
    return { ok: L.ok, kind: "statements", P, S, lens, Us, terms, ratio, equal: !extra, parts, layout: L, steps, eduppu, type: pat && pat.kind !== "sama" ? "yati korvai" : "simple korvai" };
  }
  function statementOptions(F, o = {}) {
    if (!F || !F.ok) return [];
    const S = Math.floor(F.total / 3), lo = Math.ceil((o.lo == null ? 0.3 : o.lo) * S), hi = Math.floor((o.hi == null ? 0.7 : o.hi) * S), out = [];
    for (let P = Math.max(3, lo); P <= Math.min(hi, S - 2); P++) patternsFor(P, { kinds: o.kinds, minN: o.minN || 3, maxN: o.maxN || 7, maxTerm: o.maxTerm || 16 }).forEach((p) => {
      const r = P / S;
      out.push(Object.assign({}, p, { P, U: S - P, ratio: +r.toFixed(3), score: +(p.score - Math.abs(r - 0.55) * 2).toFixed(2) }));
    });
    return out.sort((a, b) => b.score - a.score || a.P - b.P).slice(0, o.limit || 40);
  }
  function targetSplit(total, r) {
    const S = Math.floor(total / 3), P = Math.floor(r * S);
    return { S, P, U: S - P, exact: 3 * S === total, extra: total - 3 * S };
  }
  function progressiveKorvai(F, o = {}) {
    if (!F || !F.ok) return { error: F && F.error || "No frame." };
    const m = Number(o.m || 3), d = Number(o.d == null ? 2 : o.d), U = Number(o.U || 5), r = Number(o.r || 1), T = F.total;
    if (![m, d, U, r].every(Number.isInteger) || m < 2 || r < 1 || U < 1) return { error: "m (from 2), d, U (from 1) and r (from 1) must be whole numbers." };
    if (T % r) return { error: T + " does not divide by r = " + r + ", so the statements cannot each be played " + r + " times." };
    const rest = T / r - d * m * (m - 1) / 2 - m * U;
    if (rest % m) return { error: "m\xB7P = " + T / r + " \u2212 " + d * m * (m - 1) / 2 + " \u2212 " + m * U + " = " + rest + " is not divisible by m = " + m + ", so no whole P works." };
    const P = rest / m, Ps = Array.from({ length: m }, (_, i) => P + i * d);
    if (Ps.some((x) => x < 1)) return { error: "The purvangas would be " + Ps.join(", ") + ": each must be at least 1." };
    const fam = nestedPhrases(Ps), parts = [];
    Ps.forEach((p, i) => {
      for (let k = 0; k < r; k++) {
        parts.push({ role: "purvanga", syl: fam[i].slice(), part: i, label: "statement " + (i + 1) + (r > 1 ? " (" + (k + 1) + " of " + r + ")" : "") + ", purvanga " + p });
        parts.push({ role: "uttaranga", syl: statementOf(U), part: i, label: "uttaranga " + U });
      }
    });
    const L = layoutParts(F, parts);
    const steps = F.steps.concat([
      {
        id: "eq",
        title: "A progressive korvai",
        math: r + "(" + m + "P + " + d + "\xB7" + m + "\xB7" + (m - 1) + "/2 + " + m + "\xB7" + U + ") = " + T + " \u2192 P = " + P,
        text: "Statement i is (P + (i \u2212 1)d) + U, played " + (r > 1 ? r + " times" : "once") + "; only the total must fill the span, not each statement (Unit 3, Def. 7.4)."
      },
      { id: "statements", title: "The statements", math: Ps.map((p) => "(" + p + " + " + U + ")" + (r > 1 ? " \xD7 " + r : "")).join(" \xB7 "), text: "Purvangas " + Ps.join(", ") + (d > 0 ? ": growing" : ": shrinking") + " by " + Math.abs(d) + "." },
      { id: "land", title: "The landing", math: L.checks[1].text, text: L.ok ? "It lands exactly." : "It does not land." }
    ]);
    return { ok: L.ok, kind: "progressive", P, Ps, m, d, U, r, parts, layout: L, steps };
  }
  function progressiveOptions(F, o = {}) {
    if (!F || !F.ok) return [];
    const out = [], T = F.total;
    for (const r of [1, 3]) for (let m = 2; m <= 5; m++) for (const d of [1, 2, 3, -1, -2, -3]) for (let U = 3; U <= 12; U++) {
      if (T % r) continue;
      const rest = T / r - d * m * (m - 1) / 2 - m * U;
      if (rest % m) continue;
      const P = rest / m, Ps = Array.from({ length: m }, (_, i) => P + i * d);
      if (Math.min(...Ps) < 2 || Math.max(...Ps) > 24) continue;
      const mid = (P + Ps[m - 1]) / 2, ratio = mid / (mid + U);
      const S = 1 - Math.abs(ratio - 0.6) * 2 - Math.abs(m - 3) * 0.15 - (Math.abs(d) > 2 ? 0.2 : 0) + (r === 3 ? 0.1 : 0) + (d > 0 ? 0.1 : 0);
      out.push({ m, d, U, r, P, Ps, ratio: +ratio.toFixed(3), score: +S.toFixed(2), text: Ps.map((p) => "(" + p + " + " + U + ")" + (r > 1 ? "\xD7" + r : "")).join(" ") });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, o.limit || 24);
  }
  function samamAlgorithm(n, TP, kMax = 2) {
    const M = TP % n, rows = [];
    for (let k = 0; k <= kMax; k++) {
      const TU = n - M + k * n;
      rows.push({ k, TU, total: TP + TU, cycles: (TP + TU) / n });
    }
    return { n, TP, M, rows, steps: [
      { title: "The remainder", math: "M(P) = " + TP + " mod " + n + " = " + M, text: "The purvanga passes " + Math.floor(TP / n) + " whole cycles and " + M + " pulses more." },
      { title: "The uttaranga", math: "T(U) = (" + n + " \u2212 " + M + ") + " + n + "k = " + (n - M) + " + " + n + "k", text: n - M + " pulses fill the current cycle; each k adds a cycle." + (M === 0 ? " The purvanga already ends on sam, so k = 0 adds a whole cycle of uttaranga." : "") }
    ] };
  }
  function samamKorvai(o = {}) {
    const f = Number(o.phrase || 8), p = Number(o.kaarvai || 0), k = Number(o.k || 0), form = o.form || 3;
    const F0 = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai });
    if (F0.error) return { error: F0.error };
    if (![f, p, k].every(Number.isInteger) || f < 1 || p < 0 || k < 0) return { error: "The phrase (from 1), its kaarvai (from 0) and k (from 0) must be whole numbers." };
    const n = F0.C, TP = 3 * (f + p), A = samamAlgorithm(n, TP, Math.max(k, 2)), row = A.rows[k];
    if (row.cycles > 8) return { error: "This korvai would need " + row.cycles + " avartanams; the lab draws up to 8." };
    const F = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai, cycles: row.cycles });
    const sols = moraSolutions(row.TU, { n: form, gati: F.gati }).filter((x) => x.P >= 3 || row.TU < 9);
    if (!sols.length) return { error: "No " + (form === "buildup" ? "6t + 2g" : "3t + 2g") + " makes T(U) = " + row.TU + "; try another k.", samam: A };
    const u = sols[Math.min(o.pick || 0, sols.length - 1)];
    const R = korvaiPlan(F, { purvanga: { kind: "triple", name: "phrase (kaarvai) \xD7 3", formula: "3 \xD7 (" + f + " + " + p + ")", lines: [0, 1, 2].map(() => ({ pre: 0, len: f, gap: p })) }, uttaranga: u });
    if (R.error) return R;
    R.samam = A;
    R.k = k;
    R.uttarangaOptions = sols.slice(0, 8);
    R.steps = F.steps.slice(0, 1).concat(
      [{ id: "tp", title: "The purvanga", math: "T(P) = 3 \xD7 (" + f + " + " + p + ") = " + TP, text: "A phrase of " + f + " and a kaarvai of " + p + ", three times." }],
      A.steps,
      [{ id: "k", title: "k = " + k, math: "T(U) = " + row.TU + ", total " + row.total + " = " + row.cycles + " \xD7 " + n, text: "The uttaranga as " + (form === "buildup" ? "a build-up, 6t + 2g" : "a tihai, 3t + 2g") + ": " + u.eq + "." }],
      R.steps.filter((s) => s.id === "land")
    );
    return R;
  }
  function edapuAlgorithm(n, k, o = {}) {
    const minM = o.minM == null ? 1 : o.minM, table = [];
    for (let m = 0; m <= minM + 5; m++) table.push({ m, value: m * n + k, rem: ((m * n + k) % 3 + 3) % 3 });
    if (n % 3 === 0) {
      const ok = (k % 3 + 3) % 3 === 0;
      return {
        ok,
        n,
        k,
        m: ok ? minM : null,
        span: ok ? minM * n + k : null,
        third: ok ? (minM * n + k) / 3 : null,
        table,
        text: n + " is a multiple of 3, so " + n + "m + k \u2261 k (mod 3) for every m: adding cycles never helps. " + (ok ? "Here k = " + k + " is a multiple of 3, so every m works." : "k = " + k + " is not a multiple of 3, so no m works.")
      };
    }
    const hit = table.find((r) => r.m >= minM && r.rem === 0 && r.value > 0);
    return {
      ok: !!hit,
      n,
      k,
      m: hit.m,
      span: hit.value,
      third: hit.value / 3,
      table,
      text: n + " mod 3 = " + n % 3 + ", so each cycle shifts the remainder and one of three consecutive m works: m = " + hit.m + ", span " + hit.m + " \xD7 " + n + (k >= 0 ? " + " : " \u2212 ") + Math.abs(k) + " = " + hit.value + ", each third " + hit.value / 3 + "."
    };
  }
  function constantTotal(spec, o = {}) {
    const { f, p, u, g } = spec, form = spec.form || 3, c = form === "buildup" ? 6 : 3;
    const total = 3 * (f + p) + c * u + 2 * g, A = [], B = [];
    const du = form === "buildup" ? 1 : 2;
    for (let s = 1, uu = u + du, gg = g - 3; gg >= 0; s++, uu += du, gg -= 3) A.push({ step: s, f, p, u: uu, g: gg, TP: 3 * (f + p), TU: c * uu + 2 * gg, total });
    const x = o.x || 2, dp = form === "buildup" ? 2 * x : x;
    for (let s = 1, pp = p - dp, uu = u + x; pp >= 0; s++, pp -= dp, uu += x) B.push({ step: s, f, p: pp, u: uu, g, TP: 3 * (f + pp), TU: c * uu + 2 * g, total });
    return {
      total,
      form,
      base: { f, p, u, g, TP: 3 * (f + p), TU: c * u + 2 * g },
      A,
      B,
      eqA: c + "u + 2g = " + (c * u + 2 * g),
      eqB: form === "buildup" ? "3p + 6u = " + (3 * p + 6 * u) : "p + u = " + (p + u)
    };
  }
  function constantTotalPlan(o, v) {
    const F0 = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai });
    if (F0.error) return { error: F0.error };
    if (v.total % F0.C) return { error: "The total " + v.total + " is not a whole number of cycles of " + F0.C + "." };
    const F = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai, cycles: v.total / F0.C });
    if (F.error) return F;
    const form = o.form || 3, c = form === "buildup" ? 6 : 3;
    const R = korvaiPlan(F, { purvanga: { kind: "triple", name: "phrase (kaarvai) \xD7 3", formula: "3 \xD7 (" + v.f + " + " + v.p + ")", lines: [0, 1, 2].map(() => ({ pre: 0, len: v.f, gap: v.p })) }, uttaranga: { n: form, P: v.u, G: v.g, eq: c + " \xD7 " + v.u + " + 2 \xD7 " + v.g + " = " + (c * v.u + 2 * v.g) } });
    if (!R.error) {
      R.layout = layoutParts(F, R.parts, { sounded: o.sounded });
      R.frame = F;
    }
    return R;
  }
  function halfTihais(T) {
    const out = [];
    for (let P = 1; 3 * P <= T; P++) if ((T - 3 * P) % 2 === 1) out.push({ P, G: (T - 3 * P) / 2, half: true, eq: "3 \xD7 " + P + " + 2 \xD7 " + (T - 3 * P) / 2 + " = " + T });
    return out;
  }
  function doubledFrame(F) {
    if (!F || !F.ok) return { error: "No frame." };
    if (F.counting !== "end") return { error: "Half-pulse gaps are drawn only when counting to the landing." };
    return korvaiFrame({ tala: F.tala, gati: 2 * F.gati, kalai: F.kalai, cycles: F.cycles, start: 2 * F.start, land: 2 * F.land, counting: "end" });
  }
  function chakkardarSolutions(T, o = {}) {
    const out = [];
    if (!Number.isInteger(T) || T < 9) return out;
    for (let P1 = 1; 9 * P1 <= T; P1++) for (let G1 = 0; 9 * P1 + 6 * G1 <= T; G1++) {
      const r = T - 9 * P1 - 6 * G1, half = r % 2 === 1;
      if (half && !o.halves) continue;
      const G2 = r / 2, L1 = 3 * P1 + 2 * G1;
      const F = (P1 >= 3 ? 1 : 0) + (G1 >= 1 ? 0.6 : 0) + (G1 <= P1 ? 0.4 : 0) + (G2 >= G1 ? 0.3 : 0) + (G2 <= L1 ? 0.5 : -0.5) - (half ? 0.6 : 0);
      out.push({
        P1,
        G1,
        G2,
        L1,
        half,
        T,
        eq: "9 \xD7 " + P1 + " + 6 \xD7 " + G1 + " + 2 \xD7 " + G2 + " = " + T,
        inner: "3 \xD7 " + P1 + " + 2 \xD7 " + G1 + " = " + L1,
        score: +F.toFixed(2),
        // the same, in chakradarSolutions' shape (no mukhra)
        M: 0,
        t: P1,
        g: G1,
        G: G2,
        R: L1
      });
    }
    return out.sort((a, b) => b.score - a.score || a.G2 - b.G2).slice(0, o.limit || 40);
  }
  function chakkardarPlan(F, s) {
    if (!s.half) {
      const R2 = chakradarPlan(F, s);
      if (!R2.error) R2.steps = R2.steps.map((x) => x.id === "eq" ? { id: "eq", title: "A tihai of tihais", math: s.eq, text: "The inner tihai " + s.inner + ", three times with gaps of " + s.G2 + ": the phrase of " + s.P1 + " is heard 9 times." } : x);
      return R2;
    }
    const D = doubledFrame(F);
    if (D.error) return D;
    const R = chakradarPlan(D, { M: 0, t: 2 * s.P1, g: 2 * s.G1, G: 2 * s.G2 });
    if (!R.error) {
      R.frame = D;
      R.steps = D.steps.slice(0, 1).concat([{ id: "eq", title: "A tihai of tihais with a half-pulse gap", math: s.eq, text: "The outer gap is " + s.G2 + " pulses, so the grid is drawn at twice the resolution: two cells a pulse." }], R.steps.filter((x) => x.id === "land"));
    }
    return R;
  }
  function drift(L, C, g = 4) {
    if (!Number.isInteger(L) || L < 1 || !Number.isInteger(C) || C < 1) return { error: "The phrase and the cycle must be whole numbers of pulses." };
    const d = gcd(L, C), reps = C / d, cycles = L / d, visits = [];
    for (let r = 1; r <= Math.min(reps, 64); r++) {
      const end = L * r % C;
      visits.push({ r, end, beat: Math.floor(end / g) + 1, pulse: end % g + 1, onBeat: end % g === 0 });
    }
    return {
      L,
      C,
      g,
      gcd: d,
      lcm: lcm(L, C),
      reps,
      cycles,
      beatMeet: lcm(L, g),
      visits,
      visited: Array.from({ length: C / d }, (_, i) => i * d),
      text: "gcd(" + L + ", " + C + ") = " + d + ": the phrase is back on sam after " + plural(reps, "repetition") + " (" + plural(cycles, "cycle") + ", lcm = " + lcm(L, C) + " pulses), and it only ever ends at multiples of " + d + "."
    };
  }

  // src/engine/korvai/explore.js
  var RARE = { triple: 0, "124": 0.55, sama: 0.25, srotovaha: 0.4, gopuccha: 0.4, ap: 0.5, polite: 0.6, mridanga: 0.7, damaru: 0.8, fib: 0.9, squares: 0.95, gp: 1, kuraippu: 1 };
  var KIND_NAME = { triple: "phrase (gap) \xD7 3", "124": "the 1-2-4 rule", sama: "sama yati", srotovaha: "srotovaha yati (a rising AP)", gopuccha: "gopuccha yati (a falling AP)", ap: "arithmetic progression", polite: "consecutive integers", mridanga: "mridanga yati", damaru: "damaru yati", fib: "Fibonacci-like", squares: "squares", gp: "geometric progression", kuraippu: "kuraippu" };
  var SERIES_NAME = { 3: "\xD7 3", 6: "\xD7 6 (aa (k) aa (k) aa)", 9: "\xD7 9 (aaa (k) \u2026)", buildup: "1 \xB7 2 \xB7 3 (build-up)" };
  var SHAPE_NAME = { sama: "equal", srotovaha: "growing", gopuccha: "shrinking" };
  var TEXTURES = { standard: "tadiginathom endings", takadhom: "takadhom endings, tha ri ki ta phrases" };
  function diverseShapes(list, cap) {
    const first = [], seen = /* @__PURE__ */ new Set();
    list.forEach((p) => {
      if (!seen.has(p.kind)) {
        seen.add(p.kind);
        first.push(p);
      }
    });
    return first.concat(list.filter((p) => !first.includes(p))).slice(0, cap);
  }
  var band = (r) => r < 0.45 ? "purvanga 30\u201345%" : r <= 0.55 ? "purvanga 45\u201355%" : "purvanga 55\u201370%";
  function exploreSpace(F, form, o = {}) {
    const items = [], tex = o.textures === false ? ["standard"] : ["standard", "takadhom"];
    const add = (it) => {
      it.key = items.length;
      if (it.spec && it.spec.texture === "takadhom") it.label += " \xB7 takadhom";
      if (it.spec && it.spec.mode === "eduppu") it.label += " \xB7 eduppu";
      items.push(it);
    };
    if (form === "trikaala") {
      ["full", "gap", "lead"].forEach((v, k) => add({ form, label: { full: "Full: 1, 2, 4 times", gap: "Concert: a gap first", lead: "Concert: the fourth moved to the front" }[v], sub: "a jati of " + (o.trikaala ? o.trikaala.n : 5), facets: { form: v }, F: 1 - k * 0.3, N: k * 0.5, spec: { variant: v } }));
      return finish(form, items);
    }
    if (!F || !F.ok) return finish(form, items);
    const T = F.total, gati = F.gati;
    if (form === "mora") {
      const series = o.n === "any" || o.n == null ? [3, 6, 9, "buildup"] : [o.n];
      const shapes = o.shape === "any" ? ["sama", "srotovaha", "gopuccha"] : [o.shape || "sama"];
      series.forEach((n) => moraSolutions(T, { n, gati }).forEach((s) => shapes.forEach((shape) => {
        if (shape !== "sama" && (n === "buildup" || s.P < 2)) return;
        tex.forEach((t) => add({
          form,
          label: (n === "buildup" ? "1\xB72\xB73 " : n > 3 ? n + "\xD7 " : "") + s.P + " (" + s.G + ")" + (shape !== "sama" ? " " + SHAPE_NAME[shape] : ""),
          sub: s.eq,
          facets: { series: SERIES_NAME[n], shape: SHAPE_NAME[shape], gap: s.G ? "with karvai (damdar)" : "no karvai (bedam)", beat: s.beatAligned ? "each on the same beat" : "across the beat", texture: TEXTURES[t], half: "whole gaps" },
          F: s.score + (shape === "sama" ? 1.2 : 0) + (n === 3 ? 0.6 : 0) + (t === "standard" ? 1 : 0),
          N: (shape !== "sama" ? 0.9 : 0) + (n !== 3 ? 0.6 : 0) + (s.beatAligned ? 0 : 0.6) + (s.G ? 0 : 0.3) + (t !== "standard" ? 0.5 : 0) + Math.min(0.4, s.G / Math.max(1, s.P) * 0.2),
          spec: { kind: "mora", P: s.P, G: s.G, n, shape, texture: t }
        }));
      })));
      if (F.counting === "end" && series.includes(3) && shapes.includes("sama")) halfTihais(T).forEach((h) => tex.forEach((t) => add({
        form,
        label: h.P + " (" + h.G + ")",
        sub: h.eq + " \xB7 half-pulse gaps",
        facets: { series: SERIES_NAME[3], shape: SHAPE_NAME.sama, gap: "with karvai (damdar)", beat: "across the beat", texture: TEXTURES[t], half: "half-pulse gaps" },
        F: 0.5 + (h.P >= 3 ? 0.5 : 0) + (t === "standard" ? 1 : 0),
        N: 1.2 + (t !== "standard" ? 0.5 : 0),
        spec: { kind: "half", P: h.P, G: h.G, texture: t }
      })));
    } else if (form === "korvai") {
      const shapes = o.shape === "any" || o.shape == null ? ["sama", "srotovaha", "gopuccha"] : [o.shape];
      korvaiPlans(F, { limit: o.limit || 48 }).forEach((plan) => {
        const us = plan.uttarangaOptions.slice(0, 2), pvs = diverseShapes(purvangaShapes(plan.V, gati), 24);
        us.forEach((u, ui) => pvs.forEach((pv, pi) => shapes.forEach((shape) => {
          if (shape !== "sama" && u.P < 3) return;
          tex.forEach((t) => add({
            form,
            label: plan.V + " + " + plan.U + " \xB7 " + KIND_NAME[pv.kind] + (shape !== "sama" ? " \xB7 " + SHAPE_NAME[shape] + " mora" : ""),
            sub: pv.formula + " \xB7 " + u.eq + (pv.also && pv.also.length ? " \xB7 also " + pv.also.join(", ") : ""),
            facets: { purvanga: KIND_NAME[pv.kind] || pv.kind, balance: band(plan.ratio), mora: SHAPE_NAME[shape] + " mora", gap: u.G ? "mora with karvai" : "mora without karvai", texture: TEXTURES[t] },
            F: pv.score + u.score - Math.abs(plan.ratio - 0.62) * 4 - ui * 0.3 - pi * 0.05 + (shape === "sama" ? 1.2 : 0) + (t === "standard" ? 1 : 0),
            N: (RARE[pv.kind] || 0.5) + (pv.lines[0].gap ? 0 : 0.15) + (shape !== "sama" ? 0.7 : 0) + Math.abs(plan.ratio - 0.5) + (u.beatAligned ? 0 : 0.4) + (t !== "standard" ? 0.5 : 0),
            spec: { kind: "korvai", V: plan.V, U: plan.U, purvanga: pv, uttaranga: u, shape, texture: t }
          }));
        })));
      });
    } else if (form === "statements") {
      const opts = statementOptions(F, { kinds: o.kinds || null, limit: 600 }), modes = T % 3 ? ["unequal", "eduppu"] : ["equal"];
      opts.forEach((p) => modes.forEach((m) => {
        if (m === "eduppu" && !(Math.abs(F.start + T % 3) < F.C)) return;
        tex.forEach((t) => add({
          form,
          label: p.terms.join(" ") + " + " + p.U,
          sub: p.name + " \xB7 " + Math.round(p.ratio * 100) + "% \xB7 " + (m === "eduppu" ? "an eduppu absorbs " + T % 3 : m === "unequal" ? "unequal statements" : "three equal statements"),
          facets: { purvanga: p.name.replace(/ \(.*/, ""), balance: band(p.ratio), remainder: m === "equal" ? "divides by 3" : m === "eduppu" ? "an eduppu" : "unequal statements", texture: TEXTURES[t] },
          F: p.score + (m === "eduppu" ? -0.2 : 0) + (t === "standard" ? 1 : 0),
          N: (RARE[p.kind] || 0.5) + Math.abs(p.ratio - 0.55) + (m === "eduppu" ? 0.4 : 0) + (t !== "standard" ? 0.5 : 0) + (p.terms.length > 5 ? 0.2 : 0),
          spec: { kind: "statements", terms: p.terms, pattern: p, mode: m, texture: t }
        }));
      }));
    } else if (form === "progressive") {
      progressiveOptions(F, { limit: 600 }).forEach((p) => tex.forEach((t) => add({
        form,
        label: p.text,
        sub: "m " + p.m + ", d " + p.d + ", U " + p.U + ", each " + (p.r > 1 ? p.r + " times" : "once"),
        facets: { statements: p.m + " statements", direction: p.d > 0 ? "growing" : "shrinking", repeat: p.r > 1 ? "each \xD7 " + p.r : "each once", texture: TEXTURES[t] },
        F: p.score + (t === "standard" ? 1 : 0),
        N: (p.d < 0 ? 0.5 : 0) + (Math.abs(p.d) > 1 ? 0.3 : 0) + (p.m > 3 ? 0.3 : 0) + (p.r > 1 ? 0.2 : 0) + (t !== "standard" ? 0.5 : 0),
        spec: { kind: "progressive", m: p.m, d: p.d, U: p.U, r: p.r, texture: t }
      })));
    } else if (form === "chakradar") {
      const modes = o.cmode === "any" || o.cmode == null ? ["pure", "mukhra"] : [o.cmode];
      if (modes.includes("pure")) chakkardarSolutions(T, { halves: F.counting === "end", limit: 500 }).forEach((s) => tex.forEach((t) => add({
        form,
        label: s.P1 + " (" + s.G1 + ") \xB7 " + s.G2,
        sub: s.eq,
        facets: { kind: "chakkardar (no mukhra)", half: s.half ? "half-pulse outer gap" : "whole gaps", inner: s.G1 ? "inner gaps" : "no inner gaps", texture: TEXTURES[t] },
        F: s.score + (t === "standard" ? 1 : 0),
        N: (s.half ? 0.9 : 0) + (s.G1 ? 0 : 0.3) + (t !== "standard" ? 0.5 : 0) + 0.2,
        spec: { kind: "chakkardar", sol: s, texture: t }
      })));
      if (modes.includes("mukhra")) chakradarSolutions(T, { gati, limit: 300 }).forEach((s) => tex.forEach((t) => add({
        form,
        label: s.M + " + " + s.t + " (" + s.g + ")" + (s.G ? " (" + s.G + ")" : ""),
        sub: s.eq,
        facets: { kind: "chakradar (with a mukhra)", half: "whole gaps", inner: s.g ? "inner gaps" : "no inner gaps", texture: TEXTURES[t] },
        F: s.score + (t === "standard" ? 1 : 0),
        N: (s.G ? 0.4 : 0) + (s.g ? 0 : 0.3) + (t !== "standard" ? 0.5 : 0) + Math.min(0.6, s.M / Math.max(1, s.T) * 0.3),
        spec: { kind: "chakradar", sol: s, texture: t }
      })));
    }
    return finish(form, items);
  }
  function finish(form, items) {
    const nz = (k) => {
      const v = items.map((x) => x[k]), lo = Math.min(...v), hi = Math.max(...v);
      items.forEach((x) => {
        x[k + "n"] = hi > lo ? (x[k] - lo) / (hi - lo) : 0.5;
      });
    };
    if (items.length) {
      nz("F");
      nz("N");
    }
    const facets = {};
    items.forEach((x) => Object.keys(x.facets).forEach((f) => {
      const m = facets[f] || (facets[f] = /* @__PURE__ */ new Map());
      m.set(x.facets[f], (m.get(x.facets[f]) || 0) + 1);
    }));
    const out = {};
    Object.keys(facets).forEach((f) => {
      if (facets[f].size > 1) out[f] = Array.from(facets[f], ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    });
    return { form, items, count: items.length, facets: out };
  }
  function exploreOrder(space, o = {}) {
    const D = dial(o.T == null ? 0.6 : o.T), c = D.c, f = o.filters || {};
    let idx = space.items.filter((x) => Object.keys(f).every((k) => f[k] == null || f[k] === "" || x.facets[k] === f[k])).map((x) => x.key);
    const it = space.items, score = (i) => (1 - c) * it[i].Fn + c * it[i].Nn;
    const len = (i) => {
      const s = it[i].spec;
      return s.V != null ? s.V : s.P != null ? s.P : s.terms ? s.terms.reduce((a, b) => a + b, 0) : s.sol ? s.sol.P1 || s.sol.M : 0;
    };
    if (o.sort === "familiar") return idx.sort((a, b) => it[b].Fn - it[a].Fn || a - b);
    if (o.sort === "novel") return idx.sort((a, b) => it[b].Nn - it[a].Nn || a - b);
    if (o.sort === "short") return idx.sort((a, b) => len(a) - len(b) || score(b) - score(a) || a - b);
    if (o.sort === "long") return idx.sort((a, b) => len(b) - len(a) || score(b) - score(a) || a - b);
    idx.sort((a, b) => score(b) - score(a) || a - b);
    const head = idx.slice(0, 300), rest = idx.slice(300), out = [], lam = 0.35 + 0.4 * c;
    const keys = head.length ? Object.keys(it[head[0]].facets) : [];
    const wt = keys.map((k, j) => j === 0 ? 2 : 1), W = wt.reduce((a, b) => a + b, 0) || 1;
    const sim = (a, b) => keys.reduce((s, k, j) => s + (it[a].facets[k] === it[b].facets[k] ? wt[j] : 0), 0) / W;
    const left = head.slice();
    while (left.length) {
      let best = 0, bs = -Infinity;
      for (let j = 0; j < left.length; j++) {
        const recent = out.slice(-4), pen = recent.length ? Math.max(...recent.map((r) => sim(left[j], r))) : 0, v = score(left[j]) - lam * pen;
        if (v > bs + 1e-12) {
          bs = v;
          best = j;
        }
      }
      out.push(left.splice(best, 1)[0]);
    }
    return out.concat(rest);
  }
  function exploreSurprise(space, order, o = {}) {
    if (!order.length) return -1;
    const D = dial(o.T == null ? 1 : o.T), seen = new Set(o.avoid || []), cand = order.map((k, pos) => ({ k, pos })).filter((x) => !seen.has(x.k));
    const pool = cand.length ? cand : order.map((k, pos) => ({ k, pos }));
    const sc = pool.map((x) => ((1 - D.c) * space.items[x.k].Fn + D.c * space.items[x.k].Nn) * 3);
    return pool[soft(sc, D.tau, rng((o.seed || 1) * 2654435761 >>> 0))].pos;
  }
  var ALT = { 2: ["ki", "ta"], 3: ["tha", "ka", "jham"], 4: ["tha", "ri", "ki", "ta"], 5: ["tha", "ka", "tha", "ki", "ta"], 6: ["tha", "ri", "ki", "ta", "tha", "ka"], 7: ["tha", "ka", "dhi", "mi", "tha", "ki", "ta"], 8: ["tha", "ri", "ki", "ta", "tha", "ka", "jho", "nu"] };
  function altStatement(n) {
    return n <= 3 ? statementOf(n) : jatiOf(n - 3).concat(["tha", "ka", "thom"]);
  }
  function altPhrase(n) {
    return ALT[n] ? ALT[n].slice() : jatiOf(n);
  }
  function retexture(R, F, nestedPurvanga) {
    R.parts = R.parts.map((p) => {
      const L = p.syl.length;
      if (p.role === "statement" || p.role === "uttaranga") return Object.assign({}, p, { syl: altStatement(L) });
      if (!nestedPurvanga && p.role === "purvanga" && L > 1) return Object.assign({}, p, { syl: altPhrase(L) });
      if (p.role === "mukhra" && L > 0) return Object.assign({}, p, { syl: altPhrase(L) });
      return p;
    });
    R.layout = layoutParts(F, R.parts);
    R.ok = R.layout.ok;
    R.steps = R.steps.map((s) => s.id === "land" ? Object.assign({}, s, { math: R.layout.checks[1].text }) : s);
    return R;
  }
  function exploreRealize(F, item, o = {}) {
    const s = item.spec;
    let R, frame = F, nested = false;
    if (s.kind === "mora") R = moraPlan(F, { P: s.P, G: s.G, n: s.n, shape: s.shape });
    else if (s.kind === "half") {
      frame = doubledFrame(F);
      if (frame.error) return frame;
      R = moraPlan(frame, { P: 2 * s.P, G: 2 * s.G });
    } else if (s.kind === "korvai") {
      R = korvaiPlan(F, { purvanga: s.purvanga, uttaranga: s.uttaranga }, { shape: s.shape });
      nested = s.purvanga.kind !== "triple" && s.purvanga.kind !== "124";
    } else if (s.kind === "statements") {
      if (s.mode === "eduppu") {
        frame = korvaiFrame({ tala: F.tala, gati: F.gati, kalai: F.kalai, cycles: F.cycles, start: F.start + F.total % 3, land: F.land, counting: F.counting });
        if (frame.error) return frame;
      }
      R = statementKorvai(frame, { terms: s.terms, pattern: s.pattern });
      nested = true;
    } else if (s.kind === "progressive") {
      R = progressiveKorvai(F, s);
      nested = true;
    } else if (s.kind === "chakkardar") {
      R = chakkardarPlan(F, s.sol);
      if (R.frame) frame = R.frame;
    } else if (s.kind === "chakradar") R = chakradarPlan(F, s.sol);
    else if (o.trikaala) {
      R = trikaala(Object.assign({}, o.trikaala, { variant: s.variant }));
      if (!R.error) frame = R.frame;
      return R;
    }
    if (!R || R.error) return R || { error: "Nothing to realise." };
    if (s.texture === "takadhom") retexture(R, frame, nested);
    if (frame !== F) R.frame = frame;
    R.variation = item;
    return R;
  }
  function exploreFacetCounts(space, filters = {}) {
    const out = {}, active = Object.keys(filters).filter((k) => filters[k] != null && filters[k] !== "");
    Object.keys(space.facets).forEach((f) => {
      const m = new Map(space.facets[f].map((x) => [x.value, 0]));
      space.items.forEach((x) => {
        if (active.every((k) => k === f || x.facets[k] === filters[k])) m.set(x.facets[f], (m.get(x.facets[f]) || 0) + 1);
      });
      out[f] = space.facets[f].map((x) => ({ value: x.value, count: m.get(x.value) || 0 }));
    });
    return out;
  }

  // src/engine/korvai/index.js
  var GATIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18];
  var KALAIS = [1, 2, 4];
  var MAX_CYCLES = 8;
  var GATI_NAME = { 1: "One a beat", 2: "Two a beat", 3: "Tisra", 4: "Chatusra", 5: "Khanda", 6: "Tisra, doubled", 7: "Misra", 8: "Chatusra, doubled", 9: "Sankeerna", 10: "Khanda, doubled", 12: "Tisra, quadrupled", 14: "Misra, doubled", 16: "Chatusra, quadrupled", 18: "Sankeerna, doubled" };
  var YATI_NAME = {
    sama: "sama (equal)",
    gopuccha: "gopuccha (a cow\u2019s tail: shrinking)",
    srotovaha: "srotovaha (a river widening: growing)",
    mridanga: "mridanga (the drum: wide in the middle)",
    damaru: "damaru (the hourglass drum: narrow in the middle)"
  };
  var JATI_SYLLABLES = {
    1: ["tha"],
    2: ["tha", "ka"],
    3: ["tha", "ki", "ta"],
    4: ["tha", "ka", "dhi", "mi"],
    5: ["tha", "dhi", "gi", "na", "thom"],
    6: ["tha", "ka", "tha", "ka", "dhi", "mi"],
    7: ["tha", "ki", "ta", "tha", "ka", "dhi", "mi"],
    8: ["tha", "ka", "dhi", "mi", "tha", "ka", "jho", "nu"],
    9: ["tha", "ka", "dhi", "mi", "tha", "dhi", "gi", "na", "thom"],
    10: ["tha", "ki", "ta", "thom", ",", "tha", "dhi", "gi", "na", "thom"]
  };
  var TDGNT = JATI_SYLLABLES[5];
  var plural2 = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  var mod = (a, b) => (a % b + b) % b;
  var val = (v, d) => v === void 0 || v === null || v === "" ? d : Number(v);
  function jatiOf(n) {
    if (!(n >= 1)) return [];
    if (n <= 10) return JATI_SYLLABLES[n].slice();
    const out = [];
    let r = n;
    while (r > 10) {
      out.push(...JATI_SYLLABLES[4]);
      r -= 4;
    }
    return out.concat(JATI_SYLLABLES[r]);
  }
  var STATEMENT = {
    6: ["tha", "dhin", ",", "gi", "na", "thom"],
    7: ["tha", ",", "dhin", ",", "gi", "na", "thom"],
    8: ["tha", ",", "tha", "dhin", ",", "gi", "na", "thom"],
    10: ["tha", ",", "dhi", ",", "tha", "dhin", ",", "gi", "na", "thom"]
  };
  function statementOf(n) {
    if (n <= 4) return yatiLineOf(n);
    if (STATEMENT[n]) return STATEMENT[n].slice();
    return jatiOf(n - 5).concat(TDGNT);
  }
  function nestedPhrases(lens) {
    const mx = Math.max(0, ...lens), fill = [], chunks = [JATI_SYLLABLES[4], JATI_SYLLABLES[3], JATI_SYLLABLES[2], JATI_SYLLABLES[1]];
    for (let r = mx - 5; r > 0; ) {
      const c = chunks.find((x) => x.length <= r);
      fill.push(...c);
      r -= c.length;
    }
    const base = fill.concat(TDGNT);
    return lens.map((L) => L <= 0 ? [] : base.slice(base.length - L));
  }
  function kaarvaiOf(n) {
    const K = { 1: [","], 2: ["dhin", ","], 3: ["dhin", "ku", ","], 4: ["dhin", ",", ",", ","], 6: ["dhin", ",", "tha", ",", "dhin", ","], 8: ["dhin", ",", "tha", ",", "dhin", ",", ",", ","] };
    if (n <= 0) return [];
    if (K[n]) return K[n].slice();
    if (n % 3 === 0) return [].concat(...Array.from({ length: n / 3 }, () => K[3]));
    return ["dhin"].concat(rests(n - 1));
  }
  function phraseOf(n) {
    if (n === 8) return ["tha", ",", "dhi", ",", "tha", "ka", "dhi", "mi"];
    return jatiOf(n);
  }
  function yatiLineOf(n) {
    return n <= 0 ? [] : n === 1 ? ["thom"] : jatiOf(n - 1).concat("thom");
  }
  var PREFIX = { 1: ["tha"], 2: ["tha", "ka"], 4: ["tha", ",", "dhi", ","], 8: JATI_SYLLABLES[8], 16: JATI_SYLLABLES[8].concat(JATI_SYLLABLES[8]) };
  var rests = (n) => new Array(Math.max(0, n)).fill(",");
  function talaCycle(tl, gati = 4, kalai = 1) {
    const beats = tl.total * kalai, pulses = beats * gati, kriya = [], angaStarts2 = [];
    let b = 0;
    tl.angas.forEach((a) => {
      angaStarts2.push(b);
      for (let k = 0; k < a.len; k++) for (let q = 0; q < kalai; q++, b++) kriya.push(q > 0 ? "kalai" : k === 0 ? "clap" : a.type === "O" ? "wave" : "count");
    });
    return { tala: tl, name: tl.name, gati, kalai, beats, pulses, kriya, angaStarts: angaStarts2, angaText: tl.angas.map((a) => a.len).join(" + ") };
  }
  function beatsText(x, g) {
    const a = Math.abs(x), b = Math.floor(a / g), p = a % g;
    if (!a) return "0 pulses";
    return (b ? plural2(b, "beat") : "") + (b && p ? " and " : "") + (p ? plural2(p, "pulse") : "");
  }
  function offsetText(x, g) {
    return x === 0 ? "sam" : beatsText(x, g) + (x > 0 ? " after sam" : " before sam");
  }
  function where(cy, p) {
    const c = Math.floor(p / cy.pulses), r = p - c * cy.pulses, beat = Math.floor(r / cy.gati), pulse = r % cy.gati;
    return { cycle: c + 1, beat: beat + 1, pulse: pulse + 1, text: "cycle " + (c + 1) + ", beat " + (beat + 1) + (pulse ? ", pulse " + (pulse + 1) : "") };
  }
  function korvaiFrame(o = {}) {
    let tl;
    try {
      tl = o.tala && o.tala.angas ? o.tala : tala(o.fam == null ? "triputa" : String(o.fam), val(o.L, 4));
    } catch (e) {
      return { error: e.message };
    }
    const gati = val(o.gati, 4), kalai = val(o.kalai, 1), cycles = val(o.cycles, 1), start = val(o.start, 0), land = val(o.land, 0);
    const counting = o.counting == null ? "end" : o.counting;
    if (!GATIS.includes(gati)) return { error: "The gati (pulses in a beat) must be one of " + GATIS.join(", ") + "; got " + o.gati + "." };
    if (!KALAIS.includes(kalai)) return { error: "The kalai must be 1, 2 or 4; got " + o.kalai + "." };
    if (!Number.isInteger(cycles) || cycles < 1 || cycles > MAX_CYCLES) return { error: "The number of avartanams must be a whole number from 1 to " + MAX_CYCLES + "; got " + o.cycles + "." };
    if (counting !== "end" && counting !== "on") return { error: 'Counting is "end" (count up to the landing, then a closing syllable) or "on" (the last syllable is on the landing).' };
    const cy = talaCycle(tl, gati, kalai), C = cy.pulses;
    for (const [k, v] of [["start", start], ["landing", land]]) if (!Number.isInteger(v) || Math.abs(v) >= C) return { error: "The " + k + " must be a whole number of pulses less than one avartanam (" + C + ") from sam; got " + v + "." };
    const span = cycles * C + land - start;
    if (span < 1) return { error: "From the start to the landing there is nothing to fill. Add an avartanam or move the start earlier." };
    const total = counting === "on" ? span + 1 : span;
    const steps = [
      {
        id: "cycle",
        title: "One avartanam in pulses",
        math: cy.angaText + " = " + tl.total + " aksharas" + (kalai > 1 ? " \xD7 " + kalai + " kalai = " + cy.beats + " beats" : "") + " \xD7 " + gati + " pulses = " + C + " pulses",
        text: tl.name + (tl.angas.length > 1 ? " has angas of " + cy.angaText + " aksharas" : " has one anga of " + tl.total + " aksharas") + ". In " + GATI_NAME[gati].toLowerCase() + " gati each beat holds " + plural2(gati, "pulse") + ", so one cycle is " + C + " pulses."
      },
      {
        id: "span",
        title: "The space to fill",
        math: cycles + " \xD7 " + C + (land ? (land > 0 ? " + " : " \u2212 ") + Math.abs(land) : "") + (start ? (start > 0 ? " \u2212 " : " + ") + Math.abs(start) : "") + " = " + span + " pulses",
        text: "It starts " + (start === 0 ? "on sam" : offsetText(start, gati)) + " and lands " + (land === 0 ? "on sam" : offsetText(land, gati)) + " " + plural2(cycles, "avartanam") + " later: " + span + " pulses."
      },
      counting === "end" ? { id: "count", title: "Counting to the landing", math: "fill " + span + ", then \u201Ctha\u201D on the landing", text: "Count every pulse up to the landing point; a closing \u201Ctha\u201D (or \u201Cthom\u201D) sounds on it and is not counted (Balaji 2024)." } : { id: "count", title: "The last syllable on the landing", math: span + " + 1 = " + total, text: "The final syllable itself sounds on the landing, so it is counted: the passage is one pulse longer than the space (the way tabla players count a tihai, 16 + 1 = 17)." }
    ];
    return { ok: true, tala: tl, cycle: cy, gati, kalai, cycles, start, land, counting, C, span, total, steps };
  }
  function offsetFor(total, C, o = {}) {
    const land = o.land || 0, span = o.counting === "on" ? total - 1 : total;
    const start = mod(land - span, C), cycles = (start + span - land) / C;
    return { start, cycles: Math.max(cycles, 0), span };
  }
  var FORM = { 3: "a (k) a (k) a", 6: "aa (k) aa (k) aa", 9: "aaa (k) aaa (k) aaa", buildup: "a (k) aa (k) aaa" };
  var SERIES_GROUPS = { 3: [1, 1, 1], 6: [2, 2, 2], 9: [3, 3, 3], buildup: [1, 2, 3] };
  var coefOf = (n) => SERIES_GROUPS[n].reduce((a, b) => a + b, 0);
  function moraSolutions(total, o = {}) {
    const n = o.n || 3, gati = o.gati || 4, minP = o.minP || 1;
    if (!FORM[n]) throw new Error("A series repeats its phrase 3, 6 or 9 times, or builds up 1, 2, 3.");
    if (!Number.isInteger(total) || total < 1) return [];
    const c = coefOf(n), out = [];
    for (let G = 0; c * minP + 2 * G <= total && (o.maxG == null || G <= o.maxG); G++) {
      const r = total - 2 * G;
      if (r % c) continue;
      const P = r / c, group = SERIES_GROUPS[n][0] * P, step = n === "buildup" ? P % gati === 0 && G % gati === 0 ? gati : 1 : group + G;
      let F = 0;
      if (P >= 3) F += 1;
      if (P <= 4 * gati) F += 1;
      else F -= 0.5 * Math.floor(P / (4 * gati));
      if (G <= P) F += 1;
      if (G >= 1 && G <= 2 * gati) F += 0.6;
      if (step % gati === 0) F += 1;
      if (P % gati === 0) F += 0.4;
      if (P >= 5 && P <= 10) F += 0.4;
      out.push({
        n,
        P,
        G,
        total,
        group,
        step,
        gapless: G === 0,
        kind: G ? "with karvai" : "no karvai (bedam)",
        beatAligned: step % gati === 0,
        eq: c + " \xD7 " + P + " + 2 \xD7 " + G + " = " + total,
        form: FORM[n].replace(/a/g, "P").replace(/k/g, "G"),
        score: +F.toFixed(2)
      });
    }
    return out.sort((x, y) => y.score - x.score || Math.abs(x.P - 2 * gati) - Math.abs(y.P - 2 * gati) || x.G - y.G);
  }
  function checkMora(total, P, G, n = 3) {
    P = Number(P);
    G = Number(G);
    const c = SERIES_GROUPS[n] ? coefOf(n) : n;
    if (!Number.isInteger(P) || P < 1 || !Number.isInteger(G) || G < 0) return { ok: false, error: "P must be a whole number from 1, and G a whole number from 0." };
    const got = c * P + 2 * G, diff = total - got, fixes = [];
    if (diff) {
      if (diff % 2 === 0 && G + diff / 2 >= 0) fixes.push((diff > 0 ? "Widen" : "Narrow") + " each gap by " + Math.abs(diff / 2) + ": G = " + (G + diff / 2) + ".");
      if (diff % c === 0 && P + diff / c >= 1) fixes.push((diff > 0 ? "Lengthen" : "Shorten") + " each statement by " + Math.abs(diff / c) + ": P = " + (P + diff / c) + ".");
      if (diff > 0) fixes.push("Or start " + plural2(diff, "pulse") + " later.");
      else fixes.push("Or start " + plural2(-diff, "pulse") + " earlier.");
    }
    return {
      ok: diff === 0,
      got,
      diff,
      eq: c + " \xD7 " + P + " + 2 \xD7 " + G + " = " + got,
      fixes,
      text: diff === 0 ? c + " \xD7 " + P + " + 2 \xD7 " + G + " = " + got + ": it fills the space exactly." : c + " \xD7 " + P + " + 2 \xD7 " + G + " = " + got + ", but the space is " + total + ": " + plural2(Math.abs(diff), "pulse") + (diff > 0 ? " short." : " too long.")
    };
  }
  function moraShape(P, shape = "sama", d = 1) {
    if (shape === "sama" || !d) return [P, P, P];
    if (P - d < 1) return null;
    return shape === "srotovaha" ? [P - d, P, P + d] : shape === "gopuccha" ? [P + d, P, P - d] : null;
  }
  function seriesChart(C, n = 3, aRange = [5, 10], kRange = [0, 10]) {
    const rows = [];
    for (let a = aRange[0]; a <= aRange[1]; a++) {
      const cells = [];
      for (let k = kRange[0]; k <= kRange[1]; k++) {
        const total = coefOf(n) * a + 2 * k;
        cells.push({ k, total, off: mod(-total, C) });
      }
      rows.push({ a, cells });
    }
    return { n, C, form: FORM[n], rows };
  }
  var SHAPES = /* @__PURE__ */ new Map();
  function purvangaShapes(V, gati = 4) {
    const key = V + "/" + gati;
    if (!SHAPES.has(key)) {
      if (SHAPES.size > 4e3) SHAPES.clear();
      SHAPES.set(key, purvangaShapes0(V, gati));
    }
    return SHAPES.get(key).slice();
  }
  function purvangaShapes0(V, gati) {
    const out = [];
    if (!Number.isInteger(V) || V < 2) return out;
    const seen = /* @__PURE__ */ new Map();
    const add = (kind, lines, F, formula, pat) => {
      const key = lines.map((l) => l.pre + ":" + l.len + ":" + l.gap).join(","), name = kind === "triple" ? "phrase (gap) \xD7 3" : kind === "124" ? "the 1-2-4 rule" : YATI_NAME[kind] ? YATI_NAME[kind] + " yati" : pat.name;
      if (seen.has(key)) {
        const o = seen.get(key);
        if (YATI_NAME[kind] && !YATI_NAME[o.kind]) {
          o.also.push(o.name);
          o.kind = kind;
          o.name = name;
          o.pattern = pat || o.pattern;
        } else if (!o.also.includes(name) && o.name !== name) o.also.push(name);
        return;
      }
      const sh = { kind, name, also: [], lines, len: V, formula, score: +F.toFixed(2), pattern: pat || null };
      seen.set(key, sh);
      out.push(sh);
    };
    if (V % 3 === 0) {
      const x = V / 3;
      for (let g = 0; g <= Math.min(x - 2, 2 * gati); g++) {
        const p = x - g;
        let F = 2;
        if (p >= 4 && p <= 10) F += 1;
        if (g >= 1 && g <= 3) F += 1;
        else if (g === 0) F += 0.2;
        if (p === 8) F += 0.4;
        add("triple", [0, 1, 2].map(() => ({ pre: 0, len: p, gap: g })), F, "3 \xD7 (" + p + (g ? " + " + g : "") + ")");
      }
    }
    for (let e = 0; e <= 2; e++) for (let n = 3; n <= 8; n++) {
      const W = V - n * e;
      if (W < n) continue;
      patternsFor(W, { minN: n, maxN: n, maxTerm: 16 }).forEach((p) => {
        const F = 1 + p.score + (e === 1 ? 0.25 : 0) + (YATI_NAME[p.kind] ? 0.1 : 0) - (p.kind === "kuraippu" ? 0.3 : 0);
        add(p.kind, p.terms.map((len) => ({ pre: 0, len, gap: e })), F, p.terms.map((x) => x + (e ? "+" + e : "")).join(", "), p);
      });
    }
    [[7, [1, 2, 4]], [14, [2, 4, 8]], [28, [4, 8, 16]]].forEach(([sub, pres]) => {
      const r = V - sub;
      if (r >= 9 && r % 3 === 0 && V % 3 !== 0) {
        const x = r / 3;
        add("124", pres.map((p) => ({ pre: p, len: x, gap: 0 })), 1.2 + (x >= 4 && x <= 10 ? 0.4 : 0) - (sub === 28 ? 0.3 : 0), pres.map((p) => p + "(" + x + ")").join(" "));
      }
    });
    return out.sort((a, b) => b.score - a.score || a.lines.length - b.lines.length);
  }
  var linesLen = (ls) => ls.reduce((s, l) => s + l.pre + l.len + l.gap, 0);
  function korvaiPlans(F, o = {}) {
    if (!F || !F.ok) return [];
    const T = F.total, series = o.series || [3], limit = o.limit || 24, cands = [];
    series.forEach((n) => {
      for (let U = 3; U <= T - 3; U++) {
        const V = T - U, ratio = V / T, balanced = ratio >= 0.3 - 1e-9 && ratio <= 0.7 + 1e-9;
        if (!balanced && !o.all) continue;
        const sols = moraSolutions(U, { n, gati: F.gati, maxG: 3 * F.gati }).filter((s) => s.P >= 3);
        if (!sols.length) continue;
        let S = sols[0].score + (V % 3 === 0 ? 4.4 : 2.6) - Math.abs(ratio - 0.62) * 4;
        if (sols[0].P >= 5 && sols[0].P <= 10) S += 0.5;
        if (V % F.gati === 0) S += 0.4;
        cands.push({ V, U, ratio, balanced, sols, S });
      }
    });
    cands.sort((a, b) => b.S - a.S || a.U - b.U);
    const plans = [];
    for (const c of cands.slice(0, 3 * limit)) {
      const shapes = purvangaShapes(c.V, F.gati);
      if (!shapes.length) continue;
      const u = c.sols[0], pv = shapes[0];
      let S = u.score + pv.score - Math.abs(c.ratio - 0.62) * 4;
      if (u.P >= 5 && u.P <= 10) S += 0.5;
      if (c.V % F.gati === 0) S += 0.4;
      plans.push({
        V: c.V,
        U: c.U,
        ratio: +c.ratio.toFixed(3),
        balanced: c.balanced,
        uttaranga: u,
        purvanga: pv,
        uttarangaOptions: c.sols.slice(0, 6),
        purvangaOptions: shapes.slice(0, 10),
        score: +S.toFixed(2),
        text: "purvanga " + c.V + " + uttaranga " + c.U + " (" + u.eq + ") = " + T,
        ratioText: Math.round(c.ratio * 100) + " : " + (100 - Math.round(c.ratio * 100))
      });
    }
    plans.sort((a, b) => b.score - a.score || a.U - b.U);
    return plans.slice(0, limit);
  }
  function chakradarSolutions(total, o = {}) {
    const gati = o.gati || 4, out = [];
    if (!Number.isInteger(total) || total < 15) return out;
    for (let G = 0; G <= 2 * gati; G++) {
      const r = total - 2 * G;
      if (r % 3) continue;
      const R = r / 3;
      for (let t = 3; t <= 12; t++) for (let g = 0; g <= Math.min(t, 2 * gati); g++) {
        const T = 3 * t + 2 * g, M = R - T;
        if (M < 1) continue;
        let F = 0;
        if (G === 0) F += 0.8;
        if (g >= 1) F += 0.6;
        if (M >= 2 && M <= 2 * T) F += 0.8;
        if ((R + G) % gati === 0) F += 1;
        if ((M + t + g) % gati === 0) F += 0.4;
        if (t >= 5 && t <= 9) F += 0.4;
        out.push({ M, t, g, G, R, T, total, eq: "3 \xD7 (" + M + " + 3 \xD7 " + t + " + 2 \xD7 " + g + ")" + (G ? " + 2 \xD7 " + G : "") + " = " + total, score: +F.toFixed(2) });
      }
    }
    return out.sort((a, b) => b.score - a.score || a.G - b.G || a.M - b.M).slice(0, o.limit || 16);
  }
  function layoutParts(F, parts, o = {}) {
    const C = F.C, lead = F.start >= 0 ? F.start : C + F.start, cells = [];
    for (let i = 0; i < lead; i++) cells.push({ i, syl: "", role: "pre" });
    parts.forEach((p, k) => (o.sounded && (p.role === "gap" || p.role === "pgap") ? kaarvaiOf(p.syl.length) : p.syl).forEach((s, j) => cells.push({ i: cells.length, syl: s, role: p.role, part: p.part == null ? k : p.part, first: j === 0, label: j === 0 ? p.label : void 0 })));
    const filled = cells.length - lead, landIndex = lead + F.span;
    if (F.counting === "end") cells.push({ i: cells.length, syl: o.close || "tha", role: "close", first: true, label: "closing syllable" });
    const last = cells[cells.length - 1];
    const checks = [
      { id: "fill", ok: filled === F.total, text: filled === F.total ? "The parts add up to " + F.total + " pulses, exactly the space." : "The parts add up to " + filled + " pulses, but the space is " + F.total + "." },
      {
        id: "land",
        ok: cells.length - 1 === landIndex && mod(landIndex - F.land, C) === 0 && !!last.syl && last.syl !== ",",
        text: "The " + (F.counting === "end" ? "closing \u201C" + last.syl + "\u201D" : "last syllable \u201C" + last.syl + "\u201D") + " sounds at " + where(F.cycle, landIndex).text + ": " + (F.land === 0 ? "sam" : offsetText(F.land, F.gati)) + "."
      }
    ];
    return { cells, lead, landIndex, ok: checks.every((c) => c.ok), checks, sylls: cells.map((c) => c.syl) };
  }
  function moraPartsOf(n, lens, G, label2, role) {
    const per = SERIES_GROUPS[n], parts = [];
    let no = 0;
    lens.forEach((P, k) => {
      for (let r = 0; r < per[k]; r++) parts.push({ role: role || "statement", syl: statementOf(P), part: k, group: k, label: (label2 || "statement") + " " + ++no });
      if (k < 2 && G) parts.push({ role: "gap", syl: rests(G), part: k, label: "gap" });
    });
    return parts;
  }
  function moraPlan(F, o = {}) {
    if (!F || !F.ok) return { error: F && F.error || "No frame." };
    const n = o.n || 3, P = Number(o.P), G = Number(o.G), shape = o.shape || "sama", d = o.d == null ? 1 : Number(o.d);
    const ck = checkMora(F.total, P, G, n);
    if (ck.error) return { error: ck.error };
    if (!ck.ok) return { error: ck.text, fixes: ck.fixes };
    const lens = moraShape(P, shape, d);
    if (!lens) return { error: "A " + shape + " mora needs statements longer than " + d + "." };
    const parts = moraPartsOf(n, lens, G);
    const L = layoutParts(F, parts);
    const per = SERIES_GROUPS[n], starts = [];
    let at = L.lead;
    lens.forEach((len, k) => {
      for (let r = 0; r < per[k]; r++) {
        starts.push(at);
        at += len;
      }
      if (k < 2) at += G;
    });
    const steps = F.steps.concat([
      {
        id: "eq",
        title: n === "buildup" ? "One, two, three statements, two gaps" : "Three statements, two gaps",
        math: shape === "sama" ? ck.eq : lens.map((l, k) => per[k] > 1 ? per[k] + " \xD7 " + l : l).join(" + ") + " + 2 \xD7 " + G + " = " + F.total,
        text: n === "buildup" ? "The statement of " + P + " once, a gap of " + G + ", twice, the gap, and three times: 6P + 2G, the uttaranga of the slides\u2019 96-matra korvai (Unit 3 \xA77.2)." : shape === "sama" ? "A statement of " + P + ", a gap of " + G + ", the statement again, the gap, and the statement a third time." : "The statements " + (shape === "srotovaha" ? "grow" : "shrink") + " by " + d + " (" + lens.join(", ") + "): their average is still " + P + ", so the total does not change."
      },
      {
        id: "where",
        title: "Where each statement starts",
        math: starts.map((s) => where(F.cycle, s).text.replace("cycle ", "c")).join(" \xB7 "),
        text: starts.length === 3 && (lens[0] + G) % F.gati === 0 && shape === "sama" ? "Each statement starts at the same place in the beat, which makes it easy to feel." : "The statements fall at different places in the beat: a cross-rhythm against the tala."
      },
      { id: "land", title: "The landing", math: L.checks[1].text, text: L.ok ? "It lands exactly." : "It does not land." }
    ]);
    return { ok: L.ok, kind: "mora", n, P, G, shape, lens, parts, layout: L, steps, starts };
  }
  function purvangaParts(shape) {
    const parts = [];
    const isYati = shape.kind !== "triple" && shape.kind !== "124", fam = isYati ? nestedPhrases(shape.lines.map((l) => l.len)) : null;
    shape.lines.forEach((l, k) => {
      const syl = (l.pre ? PREFIX[l.pre].slice() : []).concat(isYati ? fam[k] : phraseOf(l.len));
      parts.push({ role: "purvanga", syl, part: k, label: (isYati ? "line " : "phrase ") + (k + 1) });
      if (l.gap) parts.push({ role: "pgap", syl: rests(l.gap), part: k, label: "karvai" });
    });
    return parts;
  }
  function korvaiPlan(F, plan, o = {}) {
    if (!F || !F.ok) return { error: F && F.error || "No frame." };
    if (!plan || !plan.purvanga || !plan.uttaranga) return { error: "No korvai plan." };
    const pv = plan.purvanga, u = plan.uttaranga, V = linesLen(pv.lines), U = coefOf(u.n) * u.P + 2 * u.G;
    if (V + U !== F.total) return { error: "The purvanga (" + V + ") and uttaranga (" + U + ") add up to " + (V + U) + ", not " + F.total + "." };
    const lens = moraShape(u.P, o.shape || "sama", o.d == null ? 1 : o.d) || [u.P, u.P, u.P];
    const parts = purvangaParts(pv).concat(moraPartsOf(u.n, lens, u.G, "statement"));
    const L = layoutParts(F, parts);
    const ratio = V / F.total, uStart = where(F.cycle, L.lead + V);
    const steps = F.steps.concat([
      {
        id: "split",
        title: "Purvanga and uttaranga",
        math: V + " + " + U + " = " + F.total + " (" + Math.round(ratio * 100) + " : " + (100 - Math.round(ratio * 100)) + ")",
        text: "The purvanga develops an idea; the uttaranga is the mora that ends it. Balaji (2024) keeps their ratio between 30 : 70 and 70 : 30" + (ratio >= 0.3 && ratio <= 0.7 ? "; this one is inside it." : "; this one is outside it, which is not normally done.")
      },
      {
        id: "purvanga",
        title: "The purvanga: " + pv.name,
        math: pv.formula + " = " + V,
        text: pv.kind === "triple" ? V + " divides by 3, so the purvanga is one phrase and its karvai, three times." : pv.kind === "124" ? V + " does not divide by 3. Take away " + pv.lines.reduce((s, l) => s + l.pre, 0) + " (" + pv.lines.map((l) => l.pre).join(" + ") + ") and " + (V - pv.lines.reduce((s, l) => s + l.pre, 0)) + " is left, 3 \xD7 " + pv.lines[0].len + ": the phrase of " + pv.lines[0].len + " three times, with prefixes of " + pv.lines.map((l) => l.pre).join(", ") + " (Balaji\u2019s own rule)." : (pv.pattern ? "Phrases of " + pv.lines.map((l) => l.len).join(", ") + " (" + pv.pattern.formula + ")" : "Lines of " + pv.lines.map((l) => l.len).join(", ")) + (pv.lines[0].gap ? ", each with a karvai of " + pv.lines[0].gap : "") + (pv.also && pv.also.length ? "; also " + pv.also.join(", ") : "") + ". " + (V % 3 ? V + " does not divide by 3, so a pattern shapes it instead of three equal phrases." : "")
      },
      { id: "uttaranga", title: "The uttaranga: a mora", math: u.eq, text: "It starts at " + uStart.text + " and lands as a mora does." },
      { id: "land", title: "The landing", math: L.checks[1].text, text: L.ok ? "It lands exactly." : "It does not land." }
    ]);
    return { ok: L.ok, kind: "korvai", V, U, ratio, purvanga: pv, uttaranga: u, parts, layout: L, steps, thrice: thrice(F) };
  }
  function thrice(F) {
    const end = F.start + 3 * F.span, ok = mod(end - F.land, F.C) === 0;
    return { ok, text: ok ? "Played three times in a row (as a korvai normally is), each rendition lands " + (F.land === 0 ? "on sam" : offsetText(F.land, F.gati)) + " and the third ends exactly." : "Played three times in a row, the renditions drift by " + beatsText(F.land - F.start, F.gati) + " each, so the third would not land on " + (F.land === 0 ? "sam" : "the eduppu") + ". Start it where it lands." };
  }
  function chakradarPlan(F, s) {
    if (!F || !F.ok) return { error: F && F.error || "No frame." };
    if (!s || 3 * (s.M + 3 * s.t + 2 * s.g) + 2 * s.G !== F.total) return { error: "This chakradar does not fill " + F.total + " pulses." };
    const parts = [];
    for (let r = 0; r < 3; r++) {
      parts.push({ role: "mukhra", syl: phraseOf(s.M), part: r, label: "mukhra " + (r + 1) });
      for (let k = 0; k < 3; k++) {
        parts.push({ role: "statement", syl: statementOf(s.t), part: r, group: r * 3 + k, label: "tihai " + (r + 1) + ", statement " + (k + 1) });
        if (k < 2 && s.g) parts.push({ role: "gap", syl: rests(s.g), part: r, label: "gap" });
      }
      if (r < 2 && s.G) parts.push({ role: "pgap", syl: rests(s.G), part: r, label: "karvai" });
    }
    const L = layoutParts(F, parts);
    const steps = F.steps.concat([
      { id: "eq", title: "A tihai of tihais", math: s.eq, text: "Each of the three repetitions is a mukhra of " + s.M + " and a tihai of 3 \xD7 " + s.t + " + 2 \xD7 " + s.g + " = " + s.T + (s.G ? ", with a karvai of " + s.G + " between repetitions" : "") + ". Only the last tihai lands." },
      { id: "land", title: "The landing", math: L.checks[1].text, text: L.ok ? "It lands exactly." : "It does not land." }
    ]);
    return { ok: L.ok, kind: "chakradar", sol: s, parts, layout: L, steps };
  }
  function trikaala(o = {}) {
    const n = val(o.n, 5), variant = o.variant || "full";
    if (!Number.isInteger(n) || n < 1 || n > 16) return { error: "The jati must be a whole number from 1 to 16; got " + o.n + "." };
    if (!["full", "gap", "lead"].includes(variant)) return { error: "The variant is full, gap or lead." };
    let tl;
    try {
      tl = o.tala && o.tala.angas ? o.tala : tala(o.fam == null ? "triputa" : String(o.fam), val(o.L, 4));
    } catch (e) {
      return { error: e.message };
    }
    const kalai = val(o.kalai, 1);
    if (!KALAIS.includes(kalai)) return { error: "The kalai must be 1, 2 or 4." };
    const B = tl.total * kalai, cycles = Math.ceil(3 * n / B), startBeat = cycles * B - 3 * n;
    if (cycles > MAX_CYCLES) return { error: "This trikaala needs more than " + MAX_CYCLES + " avartanams." };
    const F = korvaiFrame({ tala: tl, gati: 4, kalai, cycles, start: 4 * startBeat, land: 0, counting: "end" });
    const syl = jatiOf(n), sp2 = (k, cellsPer) => {
      const out = [];
      syl.forEach((s) => {
        out.push(s);
        for (let j = 1; j < cellsPer; j++) out.push(s === "," ? "," : "");
      });
      return out;
    };
    const A = { role: "speed1", syl: sp2(1, 4), label: "first speed" };
    const Bs = [1, 2].map((r) => ({ role: "speed2", syl: sp2(2, 2), part: r, label: "second speed " + r }));
    const Cs = [1, 2, 3, 4].map((r) => ({ role: "speed3", syl: syl.slice(), part: r, label: "third speed " + r }));
    const parts = variant === "full" ? [A].concat(Bs, Cs) : variant === "lead" ? [Cs[3], A].concat(Bs, Cs.slice(0, 3)) : [{ role: "pgap", syl: rests(n), label: "karvai" }, A].concat(Bs, Cs.slice(0, 3));
    const L = layoutParts(F, parts, { close: "tha" });
    const steps = F.steps.slice(0, 1).concat([
      {
        id: "beats",
        title: "Three speeds, the same length each",
        math: n + " \xD7 1 + " + n + " \xD7 2 \xF7 2 + " + n + " \xD7 4 \xF7 4 = 3 \xD7 " + n + " = " + 3 * n + " beats",
        text: "Once at one syllable a beat, twice at two, four times at four: each speed takes " + n + " beats." + (variant === "gap" ? " In a concert the third speed is said three times, and the fourth is left as a gap at the start." : variant === "lead" ? " Here the fourth third-speed rendition is moved to the very start." : "")
      },
      {
        id: "start",
        title: "Counting back from sam",
        math: cycles + " \xD7 " + B + " \u2212 " + 3 * n + " = " + startBeat + " beats to leave",
        text: 3 * n + " beats " + (3 * n <= B ? "fit in one cycle" : "need " + plural2(cycles, "cycle")) + ": leave " + plural2(startBeat, "beat") + " and start on beat " + (startBeat + 1) + " to end on sam."
      }
    ]);
    return { ok: L.ok, kind: "trikaala", n, variant, frame: F, startBeat, cycles, parts, layout: L, steps };
  }
  function gatiFits(total, beats, gatis = [3, 4, 5, 7, 9]) {
    return gatis.map((g) => ({ gati: g, ok: total % (beats * g) === 0, cycles: total / (beats * g) }));
  }
  function toJathiScript(F, R) {
    if (!F || !F.ok || !R || !R.ok) return { error: "There is nothing to check yet." };
    if (R.kind === "trikaala") return { error: "A trikaala changes speed and has no teermanam; the checker reads moras, korvais and chakradars." };
    if (R.kind === "mora" && R.shape !== "sama") return { error: "The checker recognises a mora by three identical statements; write a shaped mora out by hand to check it." };
    let N = F.cycles, at = F.land;
    const writeClose = !(F.counting === "end" && F.land === 0);
    if (writeClose && at < 0) {
      N -= 1;
      at += F.C;
    }
    if (N < 1) return { error: "The checker counts whole avartanams from the start; this one lands before the first sam." };
    const word = (syl) => syl.join("-");
    const parts = R.parts, lines = [];
    let tStart = parts.length;
    const isT = (p) => p.role === "statement" || p.teer;
    for (let seen = 0, i = parts.length - 1; i >= 0 && seen < 3; i--) {
      if (isT(parts[i])) {
        tStart = i;
        if (i === 0 || !isT(parts[i - 1]) || parts[i - 1].group !== parts[i].group) seen++;
      } else if (parts[i].role !== "gap") break;
    }
    const tParts = parts.slice(tStart), groups = [];
    tParts.forEach((p) => {
      if (isT(p)) {
        const g = groups[groups.length - 1];
        if (g && g.group === p.group) g.syl = g.syl.concat(p.syl);
        else groups.push({ group: p.group, syl: p.syl.slice() });
      }
    });
    const gap = (tParts.find((p) => p.role === "gap") || { syl: [] }).syl.length;
    if (groups.length !== 3 || groups.some((g) => g.syl.join() !== groups[0].syl.join())) return { error: "The ending is not three identical statements." };
    parts.slice(0, tStart).forEach((p) => lines.push(p.role === "gap" || p.role === "pgap" ? p.syl.join(" ") : word(p.syl)));
    const body = [];
    lines.forEach((l) => {
      if (/^,/.test(l) && body.length) body[body.length - 1] += " " + l;
      else body.push(l);
    });
    const spec = talaSpec(F.tala);
    const out = [
      "# Korvai lab: " + R.kind + " for " + F.tala.name + ", " + plural2(F.cycles, "avartanam") + ", gati " + F.gati,
      "tala: " + spec,
      "nadai: " + F.gati
    ].concat(F.kalai > 1 ? ["kalai: " + F.kalai] : [], [
      "avartanams: " + N,
      "eduppu: " + (F.start === 0 ? "sam" : (F.start > 0 ? "+" : "") + F.start),
      "land: " + (writeClose ? at === 0 ? "sam" : "+" + at : "end"),
      ""
    ]);
    body.forEach((l) => out.push(l));
    out.push("{" + word(groups[0].syl) + "}/" + gap + (writeClose && F.counting === "end" ? " " + (R.layout.cells[R.layout.cells.length - 1].syl || "tha") : ""));
    return { script: out.join("\n") + "\n" };
  }

  // src/engine/index.js
  var VERSION = "0.8.5";
  return __toCommonJS(engine_exports);
})();
