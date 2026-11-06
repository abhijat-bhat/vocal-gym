/* Vocal Gym · Raga–Tala Constraint Engine (v0.4)
   Every hard rule (raga membership and direction, tala length, anga lines, eduppu, landing)
   is enforced by a feasibility table. Temperature is the performer's creativity: it tilts the
   score from conventional to unconventional choices and widens sampling, but it only ever
   chooses among moves that can still finish legally. */

export const VERSION = '0.10.0';
export { rng, pick, soft, dial } from './random.js';
export { SEMI, CHAKRA, MELA_NAMES, melaLabels, defineRaga, melakarta, JANYA, allRagas } from './ragas.js';
// v0.8.7: the melakarta and katapayadi explorer
export { KATAPAYADI, CHAKRA_MEANING, MELA_IAST, katapayadi, melaName, melakartaInfo, melaFromSwaras, katapayadiLetters } from './melakarta.js';
export { FAM, DEFJ, JATI, CHAPU, tala, customTala, angaStarts } from './talas.js';
export { mod12, makeProjector } from './projection.js';
export { PDF_ALANKARA, PDF_JATI, PDF_FAM, parseSwaraLine, pdfEntry, pdfMotif, canonicalMotif } from './alankara/sheet.js';
export { FAMILIAR, moveKeys, motifKeys, motifFamiliarity, pdfFamScores, motifReport, moveNovelty, moveScore, sampleMotif, generateMotif, enumerateMotifs, motifScore, motifSlots, hamming, motifKey, motifSpan, newMotif, alankaraSeries } from './alankara/motif.js';
export { alankara } from './alankara/lines.js';
export { CELL_DEFS, CELLS, kalpana, kalpanaRound, eduppuNeighbours } from './kalpana/index.js';
export { kalpanaSession } from './kalpana/session.js';
// v0.8.3: kalpana swaras on a rhythm from the korvai lab
export { rhythmTemplate, parseRhythmTemplate, kalpanaRhythm, rhythmPhrases } from './kalpana/rhythm.js';
export { rhythmPrompt, INSPIRATION_SCHEMA } from './kalpana/inspire.js';
export { parseInspiration, parseSwaras } from './kalpana/sargam.js';
export { getProfile, setProfiles, getSource } from './profiles.js';
export { kolam, dotRows, lineAt } from './kolam.js';
export { renderGamaka, buildContour, GAMAKA_CONSTANTS, gamakaExpression, syllableOf } from './gamaka/index.js';
export { SOLLU, ALIAS, norm, KNOWN, HEAVY, CADENCE, LIB, idiomatic, splitCompound } from './sollu.js';
export { TEER, yatiBlocks, jathi } from './jathi/generator.js';
export { TICKS, JATI_WORDS, FAM_WORDS, JATI_NAME, talaSpec, parseTalaSpec, tokenizeLine, parseJathiScript, jathiToScript } from './jathi/script.js';
export { fmtTicks, judgeJathi } from './jathi/judge.js';
export { JATHI_EXAMPLES } from './jathi/examples.js';
// v0.8: the korvai and tihai lab (docs/research/korvai-tihai.md); the whole module as E.korvai
export * as korvai from './korvai/index.js';
export { korvaiFrame, moraSolutions, korvaiPlans, chakradarSolutions, trikaala } from './korvai/index.js';
// v0.9: the repertoire (compositions imported from carnaticnotations.blogspot.com into data/repertoire/)
export { parseCell, withOctave, octaveChecks, notesOutside, allowedNotes, cellUnits, lineUnits, ragaOf, talaOf, lineTokens, linePitches, playPlan, rowFits, unitsPerBeat, bestUnits, UNITS_PER_BEAT, REPERTOIRE_NOTE, cleanCell, cleanLine, lineText, sameLine, applyEdits, cycleGap, offCycle, sustainText, sustainLayout } from './repertoire.js';
