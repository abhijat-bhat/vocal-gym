/* Vocal Gym engine · the 35 Tāla Alankāra sheet
   The first ascending and descending line of each of the 35 alankaras, as written on the sheet.
   Source: "35 Tāla Alankāra-s", Mayamalavagowla (15th mela), 15-page sheet dated Aug 2012.
   Each entry: [section, first ascending line, first descending line]. ',' extends the previous
   swara by one akshara; '|' marks anga lines. Subsequent lines shift through the scale up to tara Sa
   and back, as the sheet instructs. */
const PDF_ALANKARA = {
  dhruva: {
    4: ['1.1', 'S R G M | G R | S R G R | S R G M', "S' N D P | D N | S' N D N | S' N D P"],
    3: ['1.2', 'S R G | R S | S R G | R G M', "S' N D | N S' | S' N D | N D P"],
    7: ['1.3', 'S R G M P D N | D P | S R G M P D P | S R G M P D N', "S' N D P M G R | G M | S' N D P M G M | S' N D P M G R"],
    5: ['1.4', 'S R G M P | M G | S R G M G | S R G M P', "S' N D P M | P D | S' N D P D | S' N D P M"],
    9: ['1.5', 'S , R , G M P D N | D P | S , R , G M P D P | S , R , G M P D N', "S' , N , D P M G R | G M | S' , N , D P M G M | S' , N , D P M G R"]
  },
  matya: {
    4: ['2.1', 'S R G R | S R | S R G M', "S' N D N | S' N | S' N D P"],
    3: ['2.2', 'S R G | S R | S R G', "S' N D | S' N | S' N D"],
    7: ['2.3', 'S R G M P D P | M G | S R G M P D N', "S' N D P M G M | P D | S' N D P M G R"],
    5: ['2.4', 'S R G M G | S R | S R G M P', "S' N D P D | S' N | S' N D P M"],
    9: ['2.5', 'S , R , G , M P M | G R | S , R , G , M P D', "S' , N , D , P M P | D N | S' , N , D , P M G"]
  },
  rupaka: {
    4: ['3.1', 'S R | S R G M', "S' N | S' N D P"],
    3: ['3.2', 'S R | S R G', "S' N | S' N D"],
    7: ['3.3', 'S R | S R G | S R G M', "S' N | S' N D | S' N D P"],
    5: ['3.4', 'S R | S R G M P', "S' N | S' N D P M"],
    9: ['3.5', 'S R | S R G M P R G M P', "S' N | S' N D P M N D P M"]
  },
  jhampa: {
    4: ['4.1', 'S R G R | G | M ,', "S' N D N | D | P ,"],
    3: ['4.2', 'S R G | R | G ,', "S' N D | N | D ,"],
    7: ['4.3', 'S R G S R S R | G | M ,', "S' N D S' N S' N | D | P ,"],
    5: ['4.4', 'S R G S R | G | M ,', "S' N D S' N | D | P ,"],
    9: ['4.5', 'S , R , G M S R G | M | P ,', "S' , N , D P S' N D | P | M ,"]
  },
  triputa: {
    4: ['5.1', 'S R G R | S R | G M', "S' N D N | S' N | D P"],
    3: ['5.2', 'S R G | S R | G M', "S' N D | S' N | D P"],
    7: ['5.3', 'S R G M P M G | R G | M P', "S' N D P M P D | N D | P M"],
    5: ['5.4', 'S R G M P | R G | M P', "S' N D P M | N D | P M"],
    9: ['5.5', 'S R G M P M G R S | R G | M P', "S' N D P M P D N S' | N D | P M"]
  },
  ata: {
    4: ['6.1', 'S R G M | S R G M | P , | P ,', "S' N D P | S' N D P | M , | M ,"],
    3: ['6.2', 'S R G | S R G | M , | M ,', "S' N D | S' N D | P , | P ,"],
    7: ['6.3', 'S R , G , M P | S , R G , M P | D , | D ,', "S' N , D , P M | S' , N D , P M | G , | G ,"],
    5: ['6.4', 'S R , G , | S , R G , | M , | M ,', "S' N , D , | S' , N D , | P , | P ,"],
    9: ['6.5', 'S R , G , M , P D | S , R G , M , P D | N , | N ,', "S' N , D , P , M G | S' , N D , P , M G | R , | R ,"]
  },
  eka: {
    4: ['7.1', 'S R G M', "S' N D P"],
    3: ['7.2', 'S R G', "S' N D"],
    7: ['7.3', 'S R G M P D N', "S' N D P M G R"],
    5: ['7.4', 'S R G M P', "S' N D P M"],
    9: ['7.5', 'S R , G M , P D N', "S' N , D P , M G R"]
  }
};
const PDF_JATI = { 3: 'Tishra', 4: 'Chaturashra', 5: 'Khaṇḍa', 7: 'Mishra', 9: 'Sankeerṇa' };
const PDF_FAM = { dhruva: 'Dhruva', matya: 'Maṭhya', rupaka: 'Roopaka', jhampa: 'Jhampa', triputa: 'Tripuṭa', ata: 'Aṭa', eka: 'Ēka' };
const DEG = { S: 0, R: 1, G: 2, M: 3, P: 4, D: 5, N: 6 };
function parseSwaraLine(txt) {
  const notes = [], bars = []; let t = 0;
  txt.trim().split(/\s+/).forEach(tok => {
    if (tok === '|' || tok === '||') { bars.push(t); return; }
    if (tok === ',') { notes[notes.length - 1].dur++; t++; return; }
    const d = DEG[tok[0]];
    if (d === undefined) throw new Error('Unknown swara ' + tok);
    notes.push({ d: d + (tok[1] === "'" ? 7 : 0), dur: 1 }); t++;
  });
  return { notes, bars, total: t };
}
function pdfEntry(fam, L) {
  const e = PDF_ALANKARA[fam] && PDF_ALANKARA[fam][L];
  if (!e) return null;
  const title = e[0] + ' ' + PDF_JATI[L] + ' Jāti ' + PDF_FAM[fam] + (fam === 'triputa' && L === 4 ? ' (Ādi)' : '') + ' Tāḷa';
  return { ref: e[0], asc: e[1], desc: e[2], title };
}
function pdfMotif(fam, L) { const e = PDF_ALANKARA[fam] && PDF_ALANKARA[fam][L]; return e ? parseSwaraLine(e[1]).notes : null; }
const canonicalMotif = pdfMotif;

export { PDF_ALANKARA, PDF_JATI, PDF_FAM, parseSwaraLine, pdfEntry, pdfMotif, canonicalMotif };
