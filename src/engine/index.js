/* Vocal Gym · Raga–Tala Constraint Engine (v0.2)
   Every hard rule (raga membership and direction, tala length, anga lines, eduppu, landing)
   is enforced by a feasibility table. Temperature is the performer's creativity: it tilts the
   score from conventional to unconventional choices and widens sampling, but it only ever
   chooses among moves that can still finish legally. */

export const VERSION = '0.2.0';
export { rng, pick, soft, dial } from './random.js';
export { SEMI, CHAKRA, MELA_NAMES, melaLabels, defineRaga, melakarta, JANYA, allRagas } from './ragas.js';
export { FAM, DEFJ, JATI, CHAPU, tala, customTala, angaStarts } from './talas.js';
export { mod12, makeProjector } from './projection.js';
export { PDF_ALANKARA, PDF_JATI, PDF_FAM, parseSwaraLine, pdfEntry, pdfMotif, canonicalMotif } from './alankara/sheet.js';
export { FAMILIAR, moveKeys, motifKeys, motifFamiliarity, pdfFamScores, motifReport, moveNovelty, moveScore, sampleMotif, generateMotif, enumerateMotifs, motifScore, motifSlots, hamming, motifKey, motifSpan, newMotif, alankaraSeries } from './alankara/motif.js';
export { alankara } from './alankara/lines.js';
export { CELL_DEFS, CELLS, kalpana, kalpanaRound, eduppuNeighbours } from './kalpana/index.js';
export { getProfile, setProfiles, getSource } from './profiles.js';
export { SOLLU, ALIAS, norm, KNOWN, HEAVY, CADENCE, LIB, idiomatic, splitCompound } from './sollu.js';
export { TEER, yatiBlocks, jathi } from './jathi/generator.js';
export { TICKS, JATI_WORDS, FAM_WORDS, JATI_NAME, talaSpec, parseTalaSpec, tokenizeLine, parseJathiScript, jathiToScript } from './jathi/script.js';
export { fmtTicks, judgeJathi } from './jathi/judge.js';
export { JATHI_EXAMPLES } from './jathi/examples.js';
