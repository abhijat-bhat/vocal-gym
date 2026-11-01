/* Vocal Gym · synthesized mridangam for jathi playback (docs/research/mridangam-synthesis.md)
   A classic script shared by the playground pages (inlined by scripts/build.js), the app (served at
   /shared/) and Node (tests and scripts/mridangam-wav.js load it in a vm). It sets globalThis.VGMridangam:
     STROKES                 the ten strokes, fitted to the CompMusic Mridangam Stroke Dataset (tonic C)
     realize(sylls)          sollus → strokes: whole groups first (Karya's standard realizations), then
                             one default stroke per syllable; ',' and '' stay rests
     render(stroke, sa, sr)  one stroke as a Float32Array at sample rate sr, for a drum tuned to sa (Hz)
     prepare(sa, strokes?, done?) renders strokes ahead of playback, one per tick (all of them by default)
     voice(ac, out, sa, gain) a player: play(t, stroke, maxDur) schedules a stroke (cached per Sa)
   Deterministic-plus-stochastic synthesis: each stroke is the sum of its measured partials, each an
   exponentially decaying sinusoid (amplitude and T60 measured), plus noise in 1/3-octave bands, each at
   the level and decay the real strokes have beyond those partials (the membrane's weak modes and the
   hand's contact).
   Every frequency is a ratio to Sa, so the drum follows the playback sruti the way a mridangam is tuned
   to the singer (chapu on Sa, S200 review); left-head (thoppi) partials glide down from `from` × their
   pitch in the first 40 ms, as measured. Deterministic: the noise comes from a fixed seed. */
(function (g) {
  // partials: [ratio to Sa, amplitude, T60 s, glide start ratio]; bands: [centre ratio to Sa, RMS, T60 s];
  // amplitudes relative to a stroke peaking at 1. gain: measured peak level relative to thom.
  // Fitted by docs/research/mridangam-synthesis.md §3 from 25 recorded strokes each (tonic C).
  const STROKES = {
    thi: { gain: 0.315, partials: [[0.3165,0.0132,0.193,1],[0.3627,0.0303,0.121,1],[0.6276,0.0135,0.35,1],[0.7228,0.0097,0.163,1],[0.9748,0.0333,0.396,1],[1.1111,0.0248,0.329,1],[1.1934,0.1843,0.124,1],[1.3297,0.4908,0.101,1],[1.4223,0.3408,0.106,1],[1.4995,0.035,0.121,1],[1.5689,0.0169,0.178,1],[2.3069,0.0934,0.177,1],[2.5617,0.0438,0.162,1],[2.8729,0.0061,0.282,1],[3.2279,0.0346,0.221,1],[3.5005,0.0114,0.186,1],[4.2232,0.006,0.326,1],[6.2217,0.009,0.11,1],[7.3148,0.0072,0.309,1]],
      bands: [[0.2408,0.6,0.015],[0.3034,0.08001,0.203],[0.3822,0.6,0.015],[0.4816,0.6,0.015],[0.6068,0.06072,0.203],[0.7645,0.00104,0.203],[0.9632,0.30928,0.131],[1.2135,0.29038,0.203],[1.529,0.00519,0.203],[2.4271,0.20897,0.153],[3.0579,0.15943,0.121],[3.8528,0.18788,0.107],[4.8542,0.0847,0.158],[6.1159,0.03738,0.187],[7.7055,0.06051,0.14],[9.7084,0.00986,0.203],[12.2318,0.02097,0.152],[15.4111,0.00782,0.185],[19.4167,0.01674,0.126],[24.4636,0.0098,0.151],[30.8222,0.00958,0.137],[38.8335,0.00677,0.156],[48.9271,0.00849,0.139]] },
    tha: { gain: 0.844, partials: [[0.2828,0.1031,0.207,1],[0.3551,0.0253,0.251,1],[0.5504,0.0357,0.39,1],[0.8976,0.0133,0.36,1],[0.9722,0.0138,0.39,1],[1.1162,0.0656,0.36,1],[1.1908,0.0862,0.304,1],[1.34,0.1414,0.184,1],[1.394,0.1013,0.222,1],[1.4815,0.0171,0.358,1],[1.7258,0.0216,0.188,1],[1.831,0.0222,0.39,1],[1.9676,0.0083,0.24,1],[2.3111,0.0162,0.258,1],[2.5103,0.0172,0.349,1],[3.2253,0.0082,0.277,1]],
      bands: [[0.2408,0.6,0.015],[0.3034,0.6,0.015],[0.3822,0.6,0.019],[0.4816,0.28019,0.076],[0.6068,0.01118,0.195],[0.7645,0.6,0.015],[0.9632,0.16295,0.11],[1.2135,0.12248,0.193],[1.529,0.27486,0.136],[1.9264,0.28027,0.1],[3.0579,0.0081,0.168],[3.8528,0.00104,0.195],[4.8542,0.01308,0.122],[6.1159,0.01087,0.159],[7.7055,0.0228,0.11],[9.7084,0.00183,0.195],[12.2318,0.01493,0.054],[15.4111,0.00284,0.071],[19.4167,0.01126,0.03],[24.4636,0.00289,0.058],[30.8222,0.00176,0.103],[38.8335,0.00355,0.03],[48.9271,0.00373,0.045]] },
    ta: { gain: 0.386, partials: [[0.3291,0.0916,0.271,1],[0.3627,0.0268,0.147,1],[0.4732,0.0482,0.18,1],[0.6406,0.0075,0.329,1],[0.9774,0.0305,0.321,1],[1.1085,0.0138,0.278,1],[1.2088,0.2172,0.097,1],[1.3374,0.479,0.088,1],[1.412,0.4,0.088,1],[1.5406,0.0224,0.109,1],[2.2942,0.0315,0.209,1],[2.5656,0.0568,0.271,1],[2.6852,0.0185,0.33,1],[2.8446,0.0055,0.295,1],[2.9655,0.0081,0.251,1],[3.2279,0.0526,0.192,1],[3.5031,0.0107,0.173,1],[4.0149,0.0052,0.336,1],[4.1872,0.005,0.398,1]],
      bands: [[0.2408,0.18888,0.161],[0.3034,0.00035,0.214],[0.3822,0.09686,0.177],[0.4816,0.6,0.015],[0.6068,0.10554,0.184],[0.9632,0.11515,0.18],[1.2135,0.6,0.015],[1.529,0.05171,0.214],[2.4271,0.17727,0.136],[3.0579,0.20626,0.09],[3.8528,0.23393,0.1],[4.8542,0.06196,0.152],[6.1159,0.00375,0.214],[7.7055,0.02355,0.138],[9.7084,0.00351,0.189],[12.2318,0.00015,0.214],[15.4111,0.0031,0.127],[19.4167,0.00356,0.094],[24.4636,0.00419,0.104],[30.8222,0.00421,0.091],[38.8335,0.0033,0.124],[48.9271,0.00415,0.108]] },
    thom: { gain: 1, partials: [[0.3601,0.2235,0.885,1.22],[0.5481,0.1165,0.594,1.22],[1.1394,0.0442,0.885,1],[1.3801,1.5174,0.127,1],[1.5252,0.1338,0.145,1],[2.3045,0.0749,0.134,1],[2.4665,0.0155,0.113,1],[2.5591,0.0125,0.101,1]],
      bands: [[0.2408,0.04783,0.015],[0.3822,0.04783,0.019],[0.4816,0.6,0.147],[0.6068,0.30244,0.015],[0.7645,0.6,0.015],[0.9632,0.0137,0.132],[1.2135,0.04021,0.443],[1.529,0.49845,0.085],[1.9264,0.02739,0.16],[2.4271,0.07051,0.138],[3.0579,0.36535,0.015],[3.8528,0.1127,0.015],[4.8542,0.0003,0.015],[6.1159,0.00079,0.015],[7.7055,0.00214,0.015],[9.7084,0.00068,0.015],[12.2318,0.0024,0.015],[15.4111,0.00243,0.015],[19.4167,0.00255,0.015],[24.4636,0.00182,0.015],[30.8222,0.00109,0.015],[38.8335,0.00148,0.015],[48.9271,0.00138,0.015]] },
    num: { gain: 0.334, partials: [[0.5531,0.0184,0.48,1],[0.9979,0.0218,0.555,1],[1.3272,0.1012,0.149,1],[1.4995,0.0095,0.555,1],[2.0113,0.0075,0.555,1],[2.2999,0.0575,0.213,1],[2.5514,0.2878,0.401,1],[3.055,0.019,0.125,1],[3.2227,0.2696,0.092,1],[3.5185,0.008,0.273,1],[4.1744,0.0024,0.42,1],[5.1774,0.0086,0.243,1],[6.2242,0.0348,0.265,1],[7.3148,0.0084,0.367,1],[11.556,0.0046,0.279,1]],
      bands: [[0.2408,0.30382,0.015],[0.3034,0.15908,0.106],[0.3822,0.6,0.055],[0.4816,0.6,0.138],[0.6068,0.00025,0.277],[1.2135,0.19254,0.262],[1.529,0.00012,0.277],[2.4271,0.2339,0.249],[3.0579,0.6,0.015],[3.8528,0.22429,0.096],[4.8542,0.00548,0.277],[6.1159,0.07167,0.144],[7.7055,0.1027,0.141],[9.7084,0.0011,0.277],[12.2318,0.0454,0.146],[15.4111,0.00446,0.277],[19.4167,0.01496,0.143],[24.4636,0.02192,0.141],[30.8222,0.0216,0.131],[38.8335,0.01527,0.139],[48.9271,0.0228,0.118]] },
    dhin: { gain: 0.139, partials: [[0.2056,0.0138,1.065,1],[0.4629,0.2365,0.251,1],[0.4862,0.1998,0.295,1],[0.6303,0.0348,0.352,1],[1.0031,0.2376,1.065,1],[1.3374,0.1692,0.193,1],[1.5046,0.0314,0.963,1],[2.0062,0.0053,1.065,1],[2.518,0.339,0.204,1],[3.0272,0.0055,1.065,1],[3.5159,0.2104,0.616,1],[4.0123,0.0122,0.819,1],[4.519,0.0884,0.643,1],[5.0257,0.0131,0.79,1],[5.5118,0.0089,0.537,1],[6.5226,0.027,0.633,1],[7.0216,0.016,1.065,1],[7.5282,0.0091,0.865,1],[8.0195,0.0039,1.036,1],[8.5159,0.0084,0.886,1]],
      bands: [[0.2408,0.6,0.015],[0.3034,0.02338,0.035],[0.3822,0.0006,0.27],[0.4816,0.6,0.094],[0.6068,0.03535,0.316],[0.9632,0.03602,0.532],[1.2135,0.6,0.015],[1.529,0.07562,0.532],[2.4271,0.13824,0.451],[3.0579,0.03085,0.015],[3.8528,0.13539,0.362],[4.8542,0.08277,0.38],[6.1159,0.02957,0.41],[7.7055,0.04487,0.353],[9.7084,0.00842,0.532],[12.2318,0.01215,0.283],[15.4111,0.00593,0.279],[19.4167,0.01003,0.267],[24.4636,0.00641,0.414],[30.8222,0.00909,0.322],[38.8335,0.00694,0.309],[48.9271,0.00754,0.29]] },
    dheem: { gain: 0.762, partials: [[0.3601,0.2395,1.044,1.22],[0.7021,0.016,1.044,1],[1.1497,0.09,0.586,1],[1.3889,1.022,0.136,1],[1.4969,0.2024,0.22,1],[1.9676,0.0124,0.585,1],[2.3134,0.2914,0.116,1],[2.5206,0.0696,0.488,1],[3.5185,0.0494,0.608,1]],
      bands: [[0.2408,0.6,0.015],[0.3822,0.4783,0.015],[0.4816,0.6,0.05],[0.6068,0.03265,0.015],[0.7645,0.01552,0.015],[0.9632,0.01079,0.522],[1.2135,0.11035,0.522],[1.529,0.6,0.112],[1.9264,0.00013,0.522],[2.4271,0.10163,0.147],[3.0579,0.00049,0.015],[3.8528,0.04077,0.161],[4.8542,0.05917,0.032],[6.1159,0.00496,0.101],[7.7055,0.00831,0.153],[12.2318,0.00083,0.015],[15.4111,0.00039,0.026],[19.4167,0.0022,0.015],[24.4636,0.00182,0.015],[30.8222,0.00054,0.28],[38.8335,0.00019,0.038],[48.9271,0.0006,0.309]] },
    tham: { gain: 0.798, partials: [[0.3551,0.1296,0.901,1.22],[0.4117,0.3682,0.268,1.22],[1.0597,0.0232,0.936,1],[1.3876,2.0702,0.076,1],[2.3149,0.0585,0.124,1],[2.5643,0.0467,0.488,1]],
      bands: [[0.2408,0.6,0.015],[0.3034,0.6,0.015],[0.3822,0.01652,0.468],[0.4816,0.6,0.015],[0.6068,0.54,0.015],[0.7645,0.0307,0.015],[0.9632,0.00695,0.468],[1.2135,0.07601,0.468],[1.529,0.6,0.055],[1.9264,0.00042,0.468],[2.4271,0.15766,0.238],[3.0579,0.01919,0.015],[3.8528,0.20657,0.015],[4.8542,0.01901,0.015],[6.1159,0.08545,0.015],[7.7055,0.14099,0.015],[9.7084,0.00544,0.015],[12.2318,0.03247,0.015],[15.4111,0.00651,0.039],[19.4167,0.00808,0.032],[24.4636,0.00657,0.034],[30.8222,0.00427,0.039],[38.8335,0.00424,0.042],[48.9271,0.00426,0.037]] },
    cha: { gain: 0.164, partials: [[0.3241,0.1064,0.237,1],[0.3601,0.0274,0.354,1],[0.5542,0.0781,0.624,1],[1.0031,0.2748,0.322,1],[1.3246,0.1976,0.164,1],[1.5226,0.0423,0.289,1],[2.0242,0.0183,0.624,1],[2.5386,0.3084,0.175,1],[3.0247,0.0576,0.297,1],[3.5236,0.2568,0.362,1],[4.0175,0.0227,0.266,1],[4.5319,0.1506,0.179,1],[5.036,0.0577,0.225,1],[5.5298,0.0134,0.216,1],[6.0442,0.0758,0.17,1],[6.5329,0.039,0.238,1],[7.0499,0.0862,0.178,1],[8.0529,0.0489,0.194,1]],
      bands: [[0.3034,0.27008,0.304],[0.3822,0.29107,0.14],[0.4816,0.6,0.015],[0.6068,0.07711,0.261],[0.7645,0.00017,0.015],[0.9632,0.06574,0.312],[1.2135,0.6,0.015],[1.529,0.08375,0.312],[1.9264,0.00047,0.312],[2.4271,0.16363,0.312],[3.0579,0.23838,0.025],[3.8528,0.15355,0.312],[4.8542,0.11879,0.312],[6.1159,0.05522,0.286],[7.7055,0.0756,0.312],[9.7084,0.02361,0.312],[12.2318,0.02704,0.215],[15.4111,0.00941,0.302],[19.4167,0.01392,0.274],[24.4636,0.01028,0.312],[30.8222,0.00943,0.312],[38.8335,0.00769,0.312],[48.9271,0.00993,0.312]] },
    bheem: { gain: 0.146, partials: [[0.558,1.1974,1.942,1],[1.5149,0.0205,1.032,1],[2.0458,0.0868,0.387,1],[2.5502,0.2138,0.795,1],[3.1944,0.0176,1.194,1],[3.5544,0.1308,0.892,1],[3.678,0.0165,1.317,1],[4.2592,0.0319,0.853,1],[4.6785,0.0764,0.288,1]],
      bands: [[0.2408,0.00023,0.05],[0.4816,0.6,0.222],[0.6068,0.04521,0.971],[0.9632,0.00039,0.971],[1.2135,0.6,0.015],[1.529,0.06035,0.473],[2.4271,0.064,0.677],[3.0579,0.0175,0.365],[3.8528,0.07135,0.398],[4.8542,0.04803,0.541],[6.1159,0.01939,0.815],[7.7055,0.03496,0.397],[9.7084,0.00994,0.84],[12.2318,0.00668,0.687],[15.4111,0.00513,0.827],[19.4167,0.00564,0.643],[24.4636,0.00451,0.971],[30.8222,0.00493,0.88],[38.8335,0.00418,0.931],[48.9271,0.0041,0.877]] }
  };
  // strokes the dataset does not record, derived from those it does: Mi is a light Ki (Karya: "light Ki,
  // played with middle finger"), gumki is the open thoppi (bheem) bent upward by the pressing palm
  const DERIVED = { mi: { base: 'thi', level: 0.5 }, gumki: { base: 'bheem', bend: 1 / 1.22 } };
  // Karya's names for the dataset's strokes (k Ki = thi, t Ta = ta, n Nam = num, d Din = dhin, u chapu = cha,
  // i Dheem = dheem, p Tha = tha, o Thom = thom, Thom + Nam = tham)
  const KARYA = { k: 'thi', t: 'ta', l: 'mi', n: 'num', d: 'dhin', u: 'cha', i: 'dheem', p: 'tha', o: 'thom', O: 'tham' };
  // whole groups (Karya's default realizations, docs/research/mridangam-synthesis.md §4), longest first
  const GROUPS = [
    ['tha ka dhi mi tha ki ta', 'k p n p k t k'],
    ['tha ri ki ta tha ka', 'o k n p k p'],
    ['tha ka dhi mi tha ka', 'k p n p k p'],
    ['tha dhi gi na thom', 'k t k n o'],
    ['tha ka jho nu', 'k p o n'],
    ['tha ka dhi mi', 'k p n p'],
    ['tha ri ki ta', 'o k n p'],
    ['ki ta tha ka', 'k t k p'],
    ['tha ka dhi na', 'k o o k'],
    ['tha ki ta', 'k t k'],
    ['tat tai tam', 'p o O'],
    ['tai ya', 'o p'],
    ['ki ta', 'k t'],
    ['tha ka', 'k p'],
    ['dhi mi', 'n p'],
    ['jho nu', 'o n']
  ].map(([s, k]) => [s.split(' '), k.split(' ').map(c => KARYA[c])]);
  // one stroke per syllable when no group matches (the strokes Karya gives each syllable inside groups)
  const SINGLE = { tha: 'thi', ka: 'tha', ki: 'thi', ta: 'ta', dhi: 'num', mi: 'tha', gi: 'thi', na: 'num', thom: 'thom', nam: 'num', jham: 'tham', tam: 'tham',
    tat: 'tha', tai: 'thom', ya: 'tha', hat: 'thi', hi: 'ta', dhit: 'dhin', dhim: 'dheem', jho: 'thom', nu: 'num', ri: 'thi', ku: 'tha', lan: 'cha', gu: 'thom', ga: 'tha', num: 'num', ha: 'tha',
    lang: 'cha', tang: 'cha', cham: 'cha', dheem: 'dheem', din: 'dhin', gin: 'thi', dhom: 'thom' };
  // the spelling aliases of src/engine/sollu.js
  const ALIAS = { ta: 'tha', di: 'dhi', tom: 'thom', dhom: 'thom', thai: 'tai', tei: 'tai', jo: 'jho', dheem: 'dhim', dhin: 'dhim', din: 'dhim', ding: 'dhim', gin: 'gi', tham: 'tam', tak: 'tha' };
  const clean = s => String(s == null ? '' : s).trim().toLowerCase().replace(/[^a-z]/g, '');
  const canon = s => { const c = clean(s); return SINGLE[c] ? c : ALIAS[c] && SINGLE[ALIAS[c]] ? ALIAS[c] : c; };
  // group matching compares spellings loosely (ta = tha, din = dhi), as konnakol spellings vary
  const loose = s => { const c = clean(s); return ({ ta: 'tha', din: 'dhi', di: 'dhi', gin: 'gi', jo: 'jho', tom: 'thom', dhom: 'thom', tei: 'tai', thai: 'tai' })[c] || c; };

  /* sollus → strokes, one per entry; rests (',' or '') are null */
  function realize(sylls) {
    const out = new Array(sylls.length).fill(null), idx = [];
    sylls.forEach((s, i) => { if (clean(s)) idx.push(i); });
    let k = 0;
    while (k < idx.length) {
      let done = false;
      for (const [pat, strokes] of GROUPS) {
        if (k + pat.length > idx.length) continue;
        let ok = true;
        for (let j = 0; j < pat.length && ok; j++) ok = loose(sylls[idx[k + j]]) === loose(pat[j]);
        if (ok) { pat.forEach((_, j) => { out[idx[k + j]] = strokes[j]; }); k += pat.length; done = true; break; }
      }
      if (!done) { out[idx[k]] = SINGLE[canon(sylls[idx[k]])] || 'ta'; k++; }
    }
    return out;
  }

  /* the stochastic part: seeded white noise through a 1/3-octave band-pass (two cascaded two-pole
     sections) per band, at the band's measured RMS, decaying with its measured T60 */
  const Q3 = 1 / (Math.pow(2, 1 / 6) - Math.pow(2, -1 / 6));
  function noiseBands(y, sr, sa, bands) {
    const v = new Float32Array(y.length);
    bands.forEach(([ratio, rms, t60], b) => {
      const fc = ratio * sa, n = Math.min(y.length, Math.round(t60 * 1.1 * sr));   // until it is 66 dB down
      if (fc >= sr / 2 * 0.9 || !(rms > 0) || n < 2) return;
      const w = 2 * Math.PI * fc / sr, al = Math.sin(w) / (2 * Q3), a0 = 1 + al;
      const b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0;
      let seed = (22695477 + b * 7919) >>> 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0, u1 = 0, u2 = 0, z1 = 0, z2 = 0, e = 0;
      for (let i = 0; i < n; i++) {
        seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
        const x0 = (seed / 4294967296) * 2 - 1, o = b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = x0; y2 = y1; y1 = o;
        const p = b0 * o + b2 * u2 - a1 * z1 - a2 * z2;
        u2 = u1; u1 = o; z2 = z1; z1 = p;
        v[i] = p; e += p * p;
      }
      // unit RMS for the band's noise, then the measured level and decay
      const k = rms / Math.sqrt(e / n + 1e-20), d = Math.exp(-6.9078 / t60 / sr);
      let env = k;
      for (let i = 0; i < n; i++) { y[i] += env * v[i]; env *= d; }
    });
  }

  /* one stroke at sample rate sr for a drum whose chapu is on sa (Hz); peak at the stroke's level */
  function render(stroke, sa, sr) {
    const d = DERIVED[stroke], st = STROKES[d ? d.base : stroke];
    if (!st) throw new Error('unknown mridangam stroke: ' + stroke);
    const tail = Math.min(2.2, Math.max.apply(null, st.partials.map(p => p[2]).concat(st.bands.map(b => b[2]))) * 1.05), n = Math.max(1, Math.round(tail * sr)), y = new Float32Array(n);
    st.partials.forEach(([ratio, amp, t60, from]) => {
      const f = ratio * sa, bend = d && d.bend && ratio < 0.7 ? d.bend : 1, m = Math.min(n, Math.round(t60 * 1.1 * sr));
      if (f >= sr / 2) return;
      // decays and glides as recursions: env × e^(−6.9/T60) per sample; a glide offset × e^(−1/40 ms);
      // a gumki bend rising from `bend` × the pitch with a 120 ms time constant
      const dec = Math.exp(-6.9078 / t60 / sr), gd = Math.exp(-1 / (0.04 * sr)), bd = Math.exp(-1 / (0.12 * sr)), w = 2 * Math.PI * f / sr;
      let ph = 0, env = amp, g1 = from - 1, b1 = bend - 1;
      for (let i = 0; i < m; i++) {
        ph += w * (1 + g1) * (1 + b1);
        y[i] += env * Math.sin(ph);
        env *= dec; g1 *= gd; b1 *= bd;
      }
    });
    noiseBands(y, sr, sa, st.bands);
    let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(y[i]));
    // measured level relative to thom, compressed (square root) so right-hand strokes stay audible on
    // small speakers that cannot reproduce the thoppi's 90 Hz
    const level = Math.sqrt(st.gain) * (d && d.level || 1) * 0.9 / Math.max(1e-9, pk), fin = Math.round(0.0008 * sr);
    for (let i = 0; i < n; i++) y[i] *= level * Math.min(1, i / fin);
    return y;
  }

  /* rendered strokes, kept per Sa at a fixed rate (Web Audio resamples buffers to the context's rate), so
     they can be rendered before any audio context exists. A stroke takes about 0.1 s to render. */
  const RATE = 44100, SAMPLES = {}, BUFFERS = typeof WeakMap === 'function' ? new WeakMap() : null;
  const known = s => !!(s && (STROKES[s] || DERIVED[s]));
  const keyOf = (s, sa) => s + '@' + (+sa).toFixed(2);
  function samples(stroke, sa) {
    const k = keyOf(stroke, sa);
    return SAMPLES[k] || (SAMPLES[k] = render(stroke, sa, RATE));
  }
  /* render strokes ahead of playback, one per tick, so the page stays responsive; done() when all are ready */
  function prepare(sa, strokes, done) {
    const todo = (strokes || Object.keys(STROKES).concat(Object.keys(DERIVED))).filter(s => known(s) && !SAMPLES[keyOf(s, sa)]);
    const step = () => { if (!todo.length) { if (done) done(); return; } samples(todo.shift(), sa); setTimeout(step, 0); };
    step();
  }
  function voice(ac, out, sa, gain) {
    let per = BUFFERS && BUFFERS.get(ac);
    if (!per) { per = {}; if (BUFFERS) BUFFERS.set(ac, per); }
    const level0 = gain == null ? 1 : gain;
    // accent: an optional level for this one stroke (1 is the stroke's own level)
    return function play(t, stroke, maxDur, accent) {
      if (!known(stroke)) return false;
      const key = keyOf(stroke, sa), level = level0 * (accent == null ? 1 : accent);
      if (!per[key]) { const y = samples(stroke, sa), buf = ac.createBuffer(1, y.length, RATE); buf.getChannelData(0).set(y); per[key] = buf; }
      const buf = per[key], src = ac.createBufferSource(), env = ac.createGain();
      src.buffer = buf;
      // a stroke rings under the next one, as on the drum, but a long ring is damped after 1.5 s
      const d = maxDur > 0 ? Math.min(buf.duration, Math.max(0.05, maxDur + 0.35)) : buf.duration;
      env.gain.setValueAtTime(level, t);
      if (d < buf.duration - 1e-3) { env.gain.setValueAtTime(level, t + Math.max(0.01, d - 0.06)); env.gain.linearRampToValueAtTime(0.0001, t + d); }
      src.connect(env).connect(out);
      src.start(t); src.stop(t + d + 0.01);
      return true;
    };
  }
  /* is a stroke for this Sa already rendered (so playing it now costs nothing)? */
  const ready = (stroke, sa) => !!SAMPLES[keyOf(stroke, sa)];

  /* ---- playing a structure so it can be heard (the korvai lab) ----
     Played one stroke a syllable at one level, a korvai is a stream of near-identical right-hand strokes
     and its shape is lost. arrange() voices the structure instead, from the lab's cells
     ({ syl, role, first }; a phrase is a run that starts at a `first` cell outside a gap):
       - each phrase is realized on its own, so groups never straddle two phrases;
       - its first stroke is accented and doubled by the thoppi (a bass thom under it), as a drummer
         marks the start of a phrase; a mora statement, an uttaranga or a mukhra opens on tham instead,
         so the change from purvanga to cadence is heard;
       - the strokes inside a phrase are lighter, and a closing thom keeps its weight;
       - the closing syllable is a full tham;
       - each phrase start also carries a tone (guide): its pitch rises with the phrase's length,
         7·log2(length / shortest) semitones snapped to Sankarabharanam above Sa (up to two octaves and a third), so a gopuccha is heard
         falling, a srotovaha rising, a mridanga yati rising and falling, kuraippu halving in steps of a
         fifth, and three equal statements on one note. The tones follow the playback Sa. */
  const SCALE = [0, 2, 4, 5, 7, 9, 11];
  function snap(semi) {
    let best = 0, bd = Infinity;
    for (let o = 0; o <= 2; o++) SCALE.forEach(d => { const s = d + 12 * o, x = Math.abs(s - semi); if (x < bd) { bd = x; best = s; } });
    return Math.min(28, best);
  }
  const CADENCE = { statement: 1, uttaranga: 1, mukhra: 1 };
  function arrange(cells) {
    const out = cells.map(() => null), phrases = [];
    let cur = null;
    cells.forEach((c, i) => {
      const gap = !c || c.role === 'gap' || c.role === 'pgap' || c.role === 'pre';
      if (c && c.first) { cur = gap || c.role === 'close' ? null : { role: c.role, cells: [] }; if (cur) phrases.push(cur); }
      if (cur && !gap) cur.cells.push(i);
    });
    const lens = phrases.map(p => p.cells.length), mn = Math.min.apply(null, lens.length ? lens : [1]);
    const varied = lens.some(l => l !== lens[0]);
    phrases.forEach((p, k) => {
      const sylls = p.cells.map(i => cells[i].syl), strokes = realize(sylls), sounding = p.cells.filter((i, j) => strokes[j]);
      p.cells.forEach((i, j) => {
        if (!strokes[j]) return;
        const last = i === sounding[sounding.length - 1];
        out[i] = { stroke: strokes[j], gain: strokes[j] === 'thom' && last ? 0.95 : 0.62, layer: null, guide: null };
      });
      const f = sounding[0];
      if (f == null) return;
      const cad = CADENCE[p.role];
      out[f] = { stroke: cad ? 'tham' : out[f].stroke, gain: cad ? 1.05 : 1.15, layer: cad ? null : 'thom', phrase: k,
        guide: p.role === 'count' && !varied ? (k === 0 ? 12 : null) : snap(7 * Math.log2(lens[k] / mn)) };
    });
    cells.forEach((c, i) => { if (c && c.role === 'close' && c.syl && c.syl !== ',') out[i] = { stroke: 'tham', gain: 1.2, layer: 'dheem', guide: 12, close: true }; });
    return out;
  }
  /* the guide tone's frequency: an octave above Sa, plus semi semitones */
  const guideHz = (sa, semi) => sa * 2 * Math.pow(2, semi / 12);
  function tone(ac, out, t, hz, level, dur) {
    [[1, 1], [2.003, 0.28], [3.01, 0.1]].forEach(([r, a]) => {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = 'sine'; o.frequency.value = hz * r;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(level * a, t + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur / r);
      o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  /* schedule an arranged passage: cell i sounds at t0 + i·slot. o: { sa, tones (default true), drum
     (default true), gain } Returns the time the last sound ends. */
  function playArranged(ac, out, t0, slot, cells, o) {
    o = o || {};
    const sa = o.sa || 261.63, A = arrange(cells), drum = o.drum === false ? null : voice(ac, out, sa, o.gain == null ? 1 : o.gain);
    const times = [];
    A.forEach((a, i) => { if (a) times.push(i); });
    let end = t0;
    times.forEach((i, k) => {
      const a = A[i], t = t0 + i * slot, next = k + 1 < times.length ? (times[k + 1] - i) * slot : 0.6;
      if (drum) { drum(t, a.stroke, next, a.gain); if (a.layer) drum(t, a.layer, next, 0.55); }
      if (o.tones !== false && a.guide != null) tone(ac, out, t, guideHz(sa, a.guide), a.close ? 0.16 : 0.11, a.close ? 0.9 : 0.45);
      end = Math.max(end, t + (a.close ? 0.9 : 0.3));
    });
    return end;
  }
  g.VGMridangam = { STROKES, DERIVED, GROUPS, SINGLE, KARYA, RATE, realize, render, prepare, ready, voice, arrange, playArranged, guideHz, snap };
})(typeof globalThis !== 'undefined' ? globalThis : this);
