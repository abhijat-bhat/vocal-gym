/* Vocal Gym engine 0.2.0: bundled from src/engine by scripts/build.js. Exposes the global VGEngine. */
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/engine/index.js
  var engine_exports = {};
  __export(engine_exports, {
    ALIAS: () => ALIAS,
    CADENCE: () => CADENCE,
    CELLS: () => CELLS,
    CELL_DEFS: () => CELL_DEFS,
    CHAKRA: () => CHAKRA,
    CHAPU: () => CHAPU,
    DEFJ: () => DEFJ,
    FAM: () => FAM,
    FAMILIAR: () => FAMILIAR,
    FAM_WORDS: () => FAM_WORDS,
    HEAVY: () => HEAVY,
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
    canonicalMotif: () => canonicalMotif,
    customTala: () => customTala,
    defineRaga: () => defineRaga,
    dial: () => dial,
    enumerateMotifs: () => enumerateMotifs,
    fmtTicks: () => fmtTicks,
    generateMotif: () => generateMotif,
    getProfile: () => getProfile,
    hamming: () => hamming,
    idiomatic: () => idiomatic,
    jathi: () => jathi,
    jathiToScript: () => jathiToScript,
    judgeJathi: () => judgeJathi,
    kalpana: () => kalpana,
    makeProjector: () => makeProjector,
    melaLabels: () => melaLabels,
    melakarta: () => melakarta,
    mod12: () => mod12,
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
    parseJathiScript: () => parseJathiScript,
    parseSwaraLine: () => parseSwaraLine,
    parseTalaSpec: () => parseTalaSpec,
    pdfEntry: () => pdfEntry,
    pdfFamScores: () => pdfFamScores,
    pdfMotif: () => pdfMotif,
    pick: () => pick,
    rng: () => rng,
    sampleMotif: () => sampleMotif,
    setProfiles: () => setProfiles,
    soft: () => soft,
    splitCompound: () => splitCompound,
    tala: () => tala,
    talaSpec: () => talaSpec,
    tokenizeLine: () => tokenizeLine,
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
    const reach = Array.from({ length: total + 1 }, () => new Uint8Array(span));
    reach[total][top] = 1;
    for (let t = total - 1; t >= 1; t--) for (let d = 0; d <= top; d++) reach[t][d] = moves(t, d).some((m) => reach[t + m.dur][m.nd]) ? 1 : 0;
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
      for (const m of moves(t, d)) if ((t > 0 || m.nd === 0) && reach[t + m.dur][m.nd]) {
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

  // src/engine/kalpana.js
  var CELL_DEFS = [
    // id, name, kind, F0 (familiarity prior), N0 (novelty prior), steps [[degree step, duration], ...]
    ["step", "step", "step", 0.2, -0.2, [[1, 1]]],
    ["skip", "skip", "step", 0, 0.2, [[2, 1]]],
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
    ["skipjanta", "displaced janta", "nov", -0.2, 0.8, [[2, 1], [0, 1], [-1, 1], [0, 1]]]
  ];
  var CELLS = function() {
    const out = [];
    CELL_DEFS.forEach((b) => [1, -1].forEach((dir) => {
      const shape = b[5].map(([d, u]) => [d * dir, u]);
      out.push({ id: b[0] + (dir > 0 ? "+" : "-"), base: b[0], name: b[1], kind: b[2], F0: b[3], N0: b[4], shape, dir, len: shape.reduce((s, x) => s + x[1], 0) });
    }));
    return out;
  }();
  function kalpana(raga, opts) {
    const o = opts || {};
    const aksharas = o.aksharas, per = o.perAkshara, D = dial(o.T == null ? 1 : o.T), rand = rng(o.seed || 1);
    const slots = aksharas * per, startPitch = o.startPitch, targetPitch = o.targetPitch, ending = o.ending || "auto";
    const Pj = makeProjector(raga);
    const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
    const notes = [];
    for (let oct = -1; oct <= 1; oct++) pcs.forEach((pc) => {
      const p = pc + 12 * oct;
      if (p >= -5 && p <= 19) notes.push(p);
    });
    notes.sort((a, b) => a - b);
    const NN = notes.length, ix = (p) => notes.indexOf(p);
    const s0 = ix(startPitch), tg = ix(targetPitch);
    if (s0 < 0 || tg < 0 || !(slots >= 1)) return null;
    const app = CELLS.map((c) => {
      const row = new Array(NN);
      for (let i2 = 0; i2 < NN; i2++) {
        let cur = i2, ok = true;
        const seq = [];
        for (const [dl, du] of c.shape) {
          const j = cur + dl;
          if (j < 0 || j >= NN || !Pj.valid(notes[cur], notes[j])) {
            ok = false;
            break;
          }
          seq.push({ j, dur: du });
          cur = j;
        }
        row[i2] = ok ? { end: cur, seq } : null;
      }
      return row;
    });
    const fwd = Array.from({ length: slots + 1 }, () => new Uint8Array(NN));
    [1, 2].forEach((d02) => {
      if (d02 <= slots) fwd[d02][s0] = 1;
    });
    for (let t2 = 1; t2 < slots; t2++) for (let i2 = 0; i2 < NN; i2++) if (fwd[t2][i2])
      for (let ci = 0; ci < CELLS.length; ci++) {
        const a = app[ci][i2];
        if (a && t2 + CELLS[ci].len <= slots) fwd[t2 + CELLS[ci].len][a.end] = 1;
      }
    const freeOK = !!fwd[slots][tg];
    const moraOpts = [];
    if (ending !== "free" && (ending === "mora" || aksharas >= 7) && slots >= 8) {
      const phrases = [];
      (function grow(seq) {
        if (seq.length >= 3) phrases.push(seq.slice());
        if (seq.length === 4) return;
        for (let dl = -2; dl <= 2; dl++) {
          if (!dl) continue;
          const j = seq[0] - dl;
          if (j < 0 || j >= NN || !Pj.valid(notes[j], notes[seq[0]])) continue;
          seq.unshift(j);
          grow(seq);
          seq.shift();
        }
      })([tg]);
      phrases.forEach((ph) => {
        const f = ph[0], u = ph.length;
        if (f === tg || !Pj.valid(notes[tg], notes[f])) return;
        for (let q = 0; q <= 2 * per; q++) {
          const total = 3 * u + 2 * q, B2 = slots - total;
          if (B2 < Math.max(2, per) || total > 0.6 * slots) continue;
          let feas = false;
          for (let i2 = 0; i2 < NN && !feas; i2++) if (fwd[B2][i2] && i2 !== f && Pj.valid(notes[i2], notes[f])) feas = true;
          if (!feas) continue;
          const steps = [];
          for (let k = 1; k < u; k++) steps.push(ph[k] - ph[k - 1]);
          const allStep = steps.every((s) => Math.abs(s) === 1), onBeat = B2 % per === 0 && (u + q) % per === 0;
          const F = (allStep ? 0.8 : 0) + (onBeat ? 0.9 : 0) + (q <= per ? 0.3 : 0) + (u === 3 ? 0.3 : 0) + (notes[ph[u - 2]] < notes[tg] ? 0.2 : 0);
          const N = (allStep ? 0 : 0.7) + (onBeat ? 0 : 0.7) + (notes[ph[u - 2]] > notes[tg] ? 0.3 : 0);
          moraOpts.push({ ph, q, B: B2, F, N });
        }
      });
    }
    let endType;
    if (ending === "mora" && moraOpts.length) endType = "mora";
    else if (ending === "free" && freeOK) endType = "free";
    else if (moraOpts.length && freeOK) endType = soft([(1 - D.c) * 0 + D.c * 0.6, (1 - D.c) * 1], D.tau, rand) === 1 ? "mora" : "free";
    else if (moraOpts.length) endType = "mora";
    else if (freeOK) endType = "free";
    else return null;
    let mora = null, B = slots, inSet;
    if (endType === "mora") {
      mora = moraOpts[soft(moraOpts.map((m) => (1 - D.c) * m.F + D.c * m.N), D.tau, rand)];
      B = mora.B;
      const f = mora.ph[0];
      inSet = (i2) => i2 !== f && Pj.valid(notes[i2], notes[f]);
    } else inSet = (i2) => i2 === tg;
    const bwd = Array.from({ length: B + 1 }, () => new Uint8Array(NN));
    for (let i2 = 0; i2 < NN; i2++) bwd[B][i2] = inSet(i2) ? 1 : 0;
    for (let t2 = B - 1; t2 >= 1; t2--) for (let i2 = 0; i2 < NN; i2++) {
      for (let ci = 0; ci < CELLS.length; ci++) {
        const a = app[ci][i2];
        if (a && t2 + CELLS[ci].len <= B && bwd[t2 + CELLS[ci].len][a.end]) {
          bwd[t2][i2] = 1;
          break;
        }
      }
    }
    const d0s = [1, 2].filter((d) => d <= B && bwd[d][s0]);
    if (!d0s.length) return null;
    const d0 = d0s[soft(d0s.map((d) => d === 1 ? (1 - D.c) * 0.5 : (1 - D.c) * 0.1 + D.c * 0.3), D.tau, rand)];
    const units = [{ kind: "start", base: "start", name: "opening swara", dir: 0, t: 0, notes: [{ p: startPitch, dur: d0 }] }];
    const centre = Math.max(2, Math.min(10, (startPitch + targetPitch) / 2 + 2));
    let t = d0, i = s0, prev = null;
    while (t < B) {
      const cand = [];
      for (let ci = 0; ci < CELLS.length; ci++) {
        const c = CELLS[ci], a = app[ci][i];
        if (a && t + c.len <= B && bwd[t + c.len][a.end]) cand.push({ c, a });
      }
      const scores = cand.map(({ c, a }) => {
        const ps = a.seq.map((x) => notes[x.j]);
        let F = c.F0, N = c.N0;
        if (t % per === 0) F += 0.6;
        else {
          F -= 0.4;
          N += 0.5;
        }
        if (c.len % per === 0) F += 0.4;
        else if (per > 1) N += 0.4;
        if (prev && prev.base === c.base && prev.dir === c.dir) {
          F += 0.5;
          N -= 0.4;
        }
        if (prev && prev.id === c.id && prev.startP === ps[0]) {
          F += 0.2;
          N -= 1;
        }
        const last = a.seq[a.seq.length - 1];
        if (last.dur === 2) {
          if ((mod12(notes[last.j]) === 0 || mod12(notes[last.j]) === 7) && (t + c.len) % per === 0) F += 0.6;
          else N += 0.3;
        }
        const avg = ps.reduce((s, p) => s + p, 0) / ps.length;
        F -= 0.06 * Math.abs(avg - centre);
        if (ps.some((p) => p > 12 || p < 0)) {
          N += 0.5;
          F -= 0.3;
        }
        if (prev && prev.dir && c.dir !== prev.dir) N += 0.3;
        return (1 - D.c) * F + D.c * N;
      });
      const ch = cand[soft(scores, D.tau, rand)];
      units.push({ kind: ch.c.kind, base: ch.c.base, id: ch.c.id, name: ch.c.name, dir: ch.c.dir, t, notes: ch.a.seq.map((x) => ({ p: notes[x.j], dur: x.dur })) });
      prev = { base: ch.c.base, id: ch.c.id, dir: ch.c.dir, startP: notes[ch.a.seq[0].j] };
      t += ch.c.len;
      i = ch.a.end;
    }
    if (mora) {
      for (let r = 0; r < 3; r++) {
        const ns = mora.ph.map((j, k) => ({ p: notes[j], dur: k === mora.ph.length - 1 && r < 2 ? 1 + mora.q : 1 }));
        units.push({ kind: "mora", base: "mora", name: "mora " + (r + 1) + " of 3", dir: 0, t, notes: ns });
        t += ns.reduce((s, n) => s + n.dur, 0);
      }
    }
    const notesOut = [];
    units.forEach((u) => u.notes.forEach((n) => notesOut.push(n)));
    const slotsOf = (u) => u.notes.reduce((s, n) => s + n.dur, 0);
    let nov = 0, conv = 0;
    const devices = {};
    units.forEach((u) => {
      const L = slotsOf(u);
      if (u.kind === "nov") nov += L;
      else if (u.kind === "conv" || u.kind === "mora") conv += L;
      if (u.kind === "conv" || u.kind === "nov") {
        const k = u.name + (u.dir > 0 ? " \u2191" : u.dir < 0 ? " \u2193" : "");
        devices[k] = (devices[k] || 0) + 1;
      }
    });
    return {
      notes: notesOut,
      slots,
      units,
      ending: mora ? { type: "mora", phrase: mora.ph.map((j) => notes[j]), q: mora.q, start: mora.B } : ending === "mora" ? { type: "free", fallbackFrom: "mora" } : { type: "free" },
      stats: { novelShare: nov / slots, convShare: conv / slots, devices },
      dial: D
    };
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

  // src/engine/profiles.js
  var TABLE = profiles_generated_default;
  function getProfile(raga) {
    const id = raga && typeof raga === "object" ? raga.id : raga;
    return id != null && Object.prototype.hasOwnProperty.call(TABLE, id) && TABLE[id] || null;
  }
  function setProfiles(table) {
    TABLE = table == null ? profiles_generated_default : table;
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
  var CADENCE = new Set("thom nam jham tam tai dhit dhim dhi tat".split(" "));
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
    const mod = (a, b) => (a % b + b) % b;
    const fm = (t) => fmtTicks(t, matra);
    const angaB = /* @__PURE__ */ new Set([0]);
    let acc = 0;
    tl.angas.forEach((a) => {
      acc += a.len * kalai * TICKS;
      angaB.add(acc % cycleTicks);
    });
    const abs = (t) => E0 + t;
    const where = (a) => {
      const c = Math.floor(a / cycleTicks) + 1, r = mod(a, cycleTicks), ak = Math.floor(r / TICKS) + 1, sub = r % TICKS;
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
      spanMsg = spanOK ? landWord + (land.type === "end" ? " exactly at sam after " : " on " + (land.type === "after" ? fm(kOff) + " after " : "") + "sam after ") + N + " avartanam" + (N > 1 ? "s" : "") + "." : landWord + " at " + where(actual) + ". It should " + (land.type === "end" ? "end at sam" : "fall on " + (land.type === "after" ? fm(kOff) + " after " : "") + "sam") + " after " + N + " avartanams: the jathi is " + fm(Math.abs(diff)) + (diff > 0 ? " short." : " too long.");
    } else {
      const r = mod(actual - kOff, cycleTicks);
      if (r === 0 && actual - kOff > 0) {
        N = (actual - kOff) / cycleTicks;
        spanMsg = landWord + " on " + (kOff ? fm(kOff) + " after " : "") + "sam after " + N + " avartanam" + (N > 1 ? "s" : "") + ' (inferred; add "avartanams: ' + N + '" to make it a requirement).';
      } else {
        spanOK = false;
        const lo = Math.floor((actual - kOff) / cycleTicks);
        diff = (lo + 1) * cycleTicks + kOff - actual;
        N = lo + 1;
        spanMsg = landWord + " at " + where(actual) + ", not on sam. Add " + fm(diff) + " to reach the next sam" + (r > 0 && lo >= 1 ? ", or remove " + fm(r) + " to land on the previous one." : ".");
      }
    }
    gate.push({ id: "span", label: "Span and landing", ok: spanOK, detail: spanMsg });
    if (!spanOK && diff) {
      const d = Math.abs(diff), dm = d / matra, isInt = Number.isInteger(dm);
      if (diff > 0) {
        fixes.push("Add " + fm(d) + " of karvai (" + (isInt && dm <= 8 ? new Array(dm).fill(",").join(" ") : ";") + ") " + (teer ? "just before the teermanam." : "before the final phrase."));
        if (teer && isInt && dm % 2 === 0) fixes.push("Or widen the teermanam gap by " + dm / 2 + " (each of its two gaps grows by " + dm / 2 + ", which adds " + dm + ").");
        if (teer && isInt && dm % 3 === 0) fixes.push("Or lengthen the teermanam phrase by " + dm / 3 + " syllable" + (dm / 3 > 1 ? "s" : "") + " (three repetitions add " + dm + ").");
        if (isInt) fixes.push("Or start " + fm(d) + " earlier: eduppu " + (P.eduppu - dm === 0 ? "sam" : (P.eduppu - dm > 0 ? "+" : "") + (P.eduppu - dm)) + ".");
      } else {
        fixes.push("Remove " + fm(d) + " from the body (syllables or karvai).");
        if (teer && isInt && dm % 2 === 0 && teer.gap >= dm / 2 * matra) fixes.push("Or narrow the teermanam gap by " + dm / 2 + " (both gaps shrink, which removes " + dm + ").");
        if (teer && isInt && dm % 3 === 0) fixes.push("Or shorten the teermanam phrase by " + dm / 3 + " syllable" + (dm / 3 > 1 ? "s" : "") + ".");
        if (isInt) fixes.push("Or start " + fm(d) + " later: eduppu " + (P.eduppu + dm === 0 ? "sam" : (P.eduppu + dm > 0 ? "+" : "") + (P.eduppu + dm)) + ".");
      }
    }
    if (land.type !== "end" && lastSyl) {
      const trail = P.total - (lastSyl.start + lastSyl.dur);
      gate.push({ id: "trail", label: "Nothing after the landing syllable", ok: trail === 0, detail: trail === 0 ? "The jathi stops on its landing syllable." : "There is " + fm(trail) + ' of karvai after the last syllable. Remove it, or set "land: end" if the jathi should end exactly at sam.' });
      if (trail) fixes.push('Delete the karvai after the final "' + lastSyl.v + '".');
    }
    const badBars = [];
    bars.forEach((b) => {
      const a = abs(b.at), r = mod(a, cycleTicks);
      const ok = b.dbl ? r === 0 : angaB.has(r);
      if (!ok) {
        let best = null;
        const cands = b.dbl ? [0, cycleTicks] : Array.from(angaB).concat([cycleTicks]);
        cands.forEach((x) => {
          const dd = x - r;
          if (best === null || Math.abs(dd) < Math.abs(best)) best = dd;
        });
        badBars.push("Line " + b.line + ", column " + b.col + ': "' + (b.dbl ? "||" : "|") + '" falls at ' + where(a) + ". " + (best > 0 ? "It is " + fm(best) + " early: the phrases before it are " + fm(best) + " short." : "It is " + fm(-best) + " late: the phrases before it are " + fm(-best) + " too long."));
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
    const onBeat = (a) => mod(a, TICKS) === 0;
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
        if (CADENCE.has(lastV)) s += 3;
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
        const peak = [L.indexOf(mx), L.lastIndexOf(mx)], val = [L.indexOf(mn), L.lastIndexOf(mn)];
        if (peak[1] - peak[0] <= 1 && peak[0] >= 2 && peak[1] <= L.length - 3 && strictUp(L.slice(0, peak[0] + 1)) && strictDown(L.slice(peak[1]))) return "mridanga";
        if (val[1] - val[0] <= 1 && val[0] >= 2 && val[1] <= L.length - 3 && strictDown(L.slice(0, val[0] + 1)) && strictUp(L.slice(val[1]))) return "damaru";
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

  // src/engine/index.js
  var VERSION = "0.2.0";
  return __toCommonJS(engine_exports);
})();
