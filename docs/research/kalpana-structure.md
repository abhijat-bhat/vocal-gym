# Why the kalpana rounds sound like a soup of notes, and what the literature says a round is

**Status:** research and diagnosis (November 2026). §6 was approved and is implemented in v0.7.0 (`docs/plans/kalpana-v0.4.md`); §9 gives the measurements after the change.

**Feedback being answered:** the generated kalpana swaras "fail to have a structure (with respect to tala or natural raga structure). It sounds like a soup of notes from the raga. It is not coherent; there are huge random jumps between notes which sound unnatural and are likely not used by the performer ever."

---

## 1. What the generator actually does wrong (measured)

The measurements come from `vocal-gym` 0.6: 192 rounds over the 32 ragas with phrase data, 16 aksharas at 2 per beat, T 0.

| Measure | Attested phrases (415, from `data/raga-profiles.json`) | Generated rounds | Verdict |
| --- | --- | --- | --- |
| Single steps (adjacent raga swaras) | 82% | 84% | the same |
| Leaps of 3+ raga steps | 2.3% | 3.6% | close |
| Mean run (notes moving one way) | 3.3 | 3.1 | close |
| Runs of 4+ notes | 38% | 27% | fewer, shorter runs |
| Octave jumps | 0 | 0.5% | **never in real phrases** |

Note to note, the rounds already look like the attested phrases. The problem is one level up, at the joins between the devices the generator chains together (`units`):

| | Inside a device | At a join between devices |
| --- | --- | --- |
| Leaps of 3+ raga steps | 1.9% | **8.1%** |
| Octave jumps | 0 | **1.7%** |

On top of that:

- **Unit lengths are arbitrary.** Lengths of 1, 3, 4, 5, 6 and 7 slots are all common, and only 43% of units start on a beat.
- **Karvais (held notes) fall anywhere.** Only 50% end a unit, 58% start on a beat, and 43% sit off the akshara.
- **There is no focal note, no repetition and no phrase shape.** Each device is sampled left to right from local scores (README §12.7). Nothing plans the round as a sequence of phrases, gives the phrases a pitch focus, or makes one phrase answer another.

So the "huge random jumps" are real but specific: they are the seams between independently chosen fragments, including octave-shifted attested phrases. The "soup" is the absence of everything above the note: phrases of tala-shaped length, a focal note, repetition and an overall shape. The literature below says this is exactly what makes a round coherent.

---

## 2. Sources read

| # | Source | Access | What it gives |
| --- | --- | --- | --- |
| A | G. Field, "Improvising Rhythmic-Melodic Designs in South Indian Karnatak Music: U. Shrinivas Live in 1995", *Analytical Approaches to World Music* 6.2 (2018) | Open: [PDF](https://www.oldaawmjournal.iftawm.org/articles/2018a/Field_AAWM_Vol_6_2.pdf) | The rules of a round; the five-part order of a svara kalpana; the three designs (yati, mora, korvai) with transcribed, counted examples |
| B | G. Field, "Musical Improvisation and Elegant Writing: Ālāpana in South Indian Karnatak Music Performed by U. Srinivas", *AAWM* 11.2 (2024) | Open: [PDF](https://journal.iftawm.org/wp-content/uploads/2024/05/Field_AAWM_Vol_11_2.pdf) | What makes improvisation coherent (a pitch focus that moves through the raga) and cohesive (end rhyme, initial rhyme, recycled subphrases), after Viswanathan |
| C | Vidya Subramanian (disciple of Lalgudi Jayaraman), "Kalpana Swaram singing – trick or treat?" (2008) | Open: [PDF](https://www.vidyasubramanian.com/_files/ugd/eea84f_d5ef18d80cc74b0c8bc2221d80cf3e20.pdf) | A performer's rules: simple to complex, focal notes, pidi at slow tempo, korvais, sarvalaghu, kuraippu |
| D | P. Sambamoorthy, *South Indian Music*, Book IV (1941), "Kalpana Svaras", pp. 24–31 | archive.org (`south-indian-music-book-iii`, file `South_Indian_Music_Book_IV_djvu.txt`) | The standard textbook rules: round lengths, the four ending rules, makutams |
| E | R. Morris, "Tana Varnam-s: An Entry into Rāga Delineation in Carnatic Music", *AAWM* 1.1 (2011) | Open: [PDF](https://oldaawmjournal.iftawm.org/articles/2011a/Morris_AAWM_Vol_1_1.pdf) | How teachers group swara passages (half-avartana, avartana, two avartanas); a raga as its permitted two-note successions and their short cycles |
| F | Wikipedia, [Kalpanaswaram](https://en.wikipedia.org/wiki/Kalpanaswaram) | Open | A secondary summary, consistent with A and D |
| G | Tiruvottiyur Tyagayyar, *Pallavi Svara Kalpavalli* (Chennai, 1900) | archive.org, CC0 (`pallavisvarakalpavallitiruvotturutyagayya`) | **A notated corpus**: svara passages for five pallavis (Sankarabharanam, Kalyani, Todi, Kambhoji, Bhairavi). It is in Telugu script with OCR text and has **not yet been read** (§5). |
| H | Krishna & Ishwar 2012 (S209), Schachter 2015 (S203) | Already in the profiles | Phraseology defines a raga; articulated and less articulated svaras alternate |

Not available to me (paywalled or unpublished) are the three dedicated English studies Field names. They are listed with others in §7.

### 2.1 Field's transcriptions (the figures of A)

A copy of A in `research/` made its example figures readable (they are images in the PDF). They confirm the design with real material:

| Example | What it shows |
| --- | --- |
| **Ex. 3**, the Todi korvai | Each unit is a five-swara descending run with two rests after every swara, then the same run with one rest, then a mora of the run, the run a step lower, and two steps lower (`ḋṁġṙṠ, ṁġṙṠn , ġṙṠnd`). Each unit is the last one moved down one step. |
| **Ex. 11.1** | A cell `ṁ,,Ġ,,ṁ,,Ġ,,Ṙ,,Ṡ,,Ṙ,` stated three times, each a step lower. |
| **Ex. 8.2, 9, 10** | Ascending runs through Kambhoji's ascent (`P D Ṡ Ṙ Ġ Ṡ`), restated after a rest, one of them an octave lower on P, the graha swara. That is the focal echo. |
| **Ex. 13.2**, the koraippu | The statement stays fixed (`ṁ,,Ġ,,`) while descending runs fill the gaps. |
| **Ex. 18–19**, the final korvai | Three phrases of one descending statement shrinking 8 → 6 → 4 swaras, each followed by a three-pulse gap, then a mora of three 15-swara statements. |

Everything descends by step, restarts high after a rest, and repeats with shifts: no figure jumps between unrelated fragments.

---

## 3. What a kalpana round is

Each rule is followed by its source. **[hard]** marks a rule a performer may not break; **[shape]** marks a strong convention.

### 3.1 The round and the performance

1. **[hard] End at the eduppu, on the right note.** Every round ends where the chosen theme begins in the tala (the eduppu), approaching the theme's first note (graha or eduppu svara) "from the closest note below or above" (A p. 3; D p. 28–29, rules 1–2).
   - It may also end on another note when the closing phrase "forms a ranjaka prayoga for the raga" (D p. 30, rule 3), or when the resulting phrase "can be justified from the point of view of the arohana and avarohana" (D p. 31, rule 4).
   - The engine has rules 1–2.
2. **[hard] A round may start anywhere, but the end does not move** (F; A p. 3). An improvisation that starts 2 or 4 counts into the cycle still ends at the eduppu.
3. **[shape] Rounds grow.** "At first kalpana svaras of half, one, two, four and eight avarta duration are attempted", then multiples (D p. 24–25). The progression is "from simple to complex", from "short, simple swarams which may be a few notes long" to "longer and more complex patterns" (C §1).
4. **[shape] The order of a full svara kalpana** (A p. 3–4):
   1. first speed (2 notes a beat);
   2. second speed (4 a beat);
   3. koraippu: trading rounds that shrink from a cycle to ½, ¼ and ⅛ (C §9: from 4–6 avartanas down to ½ and ¼, "with each pattern ending in one or more focal notes");
   4. "semi-continuous streams";
   5. a final korvai.
5. **[shape] Slow rounds explore the raga; fast rounds the calculation.** "The sedate, slow tempo (chauka kaala) swarams provide ample scope for gamaka … and pidi (typical phrases in a given raga) based exploration of the raga, while the fast tempo … swarams … often include interesting calculations and swara patterns" (C §4). The ideal "is the delineation of the raga in all its melodic richness" (D p. 24).
6. **[shape] Makutams.** "Short kalpana svaras are concluded with short makutas" and long ones "with well-planned-out longer makutas". They "give timely hints to the mridangam player of the approaching conclusion", and are desirable but not obligatory (D p. 25).

### 3.2 Phrases: the unit of coherence

7. **[shape] A round is built from phrases of tala-shaped length.**
   - A teacher groups a varnam's swara passages "first equal to four beats each, half the length of the tala Adi", then "complete tala lengths", then "two tala lengths" (E p. 9).
   - Field's transcriptions count every phrase in pulses and show them placed so the whole design lands on the eduppu (A Ex. 2, 8, 11).
8. **[shape] Each phrase group has a focal note, and the focus moves.**
   - "Traversing up and down the scale without any patterns or focal points will result in monotony … One technique … is the use of 'focal notes' … patterns are built around that given note. Sometimes, different rounds of kalpana swarams focus on different focal notes" (C §8).
   - In alapana the same principle is the *topic phrase* that "introduces the new pitch-focus for each phrase group" and a focus that climbs through the raga (*ragavardhani*, B ¶26–32).
9. **[shape] Phrases answer each other (cohesion).** Viswanathan's "motif development" is "successive phrases that ended with the same 'tag phrase' to emphasize a pitch-focus" (B ¶33).
   - **End rhyme:** the end is kept and the beginning varied, moving from new to old information (B ¶34).
   - **Initial rhyme:** the start is kept and the end changed (B ¶35).
   - **Recycled subphrases:** "in each successive phrase he introduced a new subphrase that he then grabbed a hold of in the next phrases" (B ¶40).
10. **[shape] Sequences.** A motif repeats at successive pitch levels.
    - Field's micro-statements: "the third micro-statement … maintains the rhythm of the first and second … but it descends by step" (A p. 13).
    - Vidya Subramanian's 5×3 example in Kalyani: G R S N D · R S N D P · G M P D N (C §5a).
11. **[shape] Descent is the norm for figures.**
    - "The melodic contour in each unit usually descends" (korvai units, A p. 7).
    - The mora examples run downward to the eduppu (A Ex. 11).
    - Ascents obey the raga's ascent: Kambhoji's flat seventh "can be played only in descending phrases" (A p. 11).
12. **[shape] Raga phrases come first at slow tempo** (C §4; D p. 2: "raga ranjaka combinations and visesha prayogas"). A raga is defined by its permitted successions and its short characteristic cycles, not by its scale (E p. 22–23; H).

### 3.3 Rhythm: sarvalaghu and the designs

13. **Two ways to improvise** (A p. 4; C §5–6):
    - **sarvalaghu** "draw[s] attention to the flow of rhythmic time" (Nelson 1991 p. 29) and "is by no means inferior to calculation";
    - **calculated** rounds (kanakku) set swaras to solkattu designs.
14. **Yati shapes** (A p. 4–5, after Cormack pp. 113–15):
    - srotovaha (growing by one note: "the most common non-calculated pattern in svara kalpana", Cormack p. 243);
    - gopuccha (shrinking);
    - mridanga and damaru (combinations);
    - sama (equal);
    - vishama (unordered);
    - and the same with rests that grow or shrink (Ex. 1.2).
15. **Mora: (x)[y](x)[y](x)** (A p. 6, after Nelson 1991 pp. 46–52).
    - The statements must be at least one pulse long and stand in "an orderly relation": equal, or growing or shrinking by an ordered amount. The gap may be zero.
    - A mora is varied by redistributing the same total: (6)(6)(6) becomes (5)(6)(7), then (7)(6)(5) (A p. 6–7).
    - Gaps are often karvais ("the term … for 'gap' is karvai", A n. 20).
    - Examples: (RGM)[P,P,P,,](RGM)[P,P,P,,](RGM); (pdsrg)[s,](ndmpd)[p,](sndpm).
16. **Korvai:** a shape (often a gopuccha) followed by a mora, the whole stated three times, usually descending, landing on the eduppu (A p. 7, 18–19, after Nelson 1999 p. 67).
17. **Karvai and rests mark phrase ends and gaps, not arbitrary points.** In every transcription in A, a held note or rest closes a statement (the mora gap) or a line of a yati with rests.
18. **[shape] Counter-rhythm adds punch:** "patterns that counter the beat often give a certain punch" (C §2).
19. **Ottu svara.** When a calculated pattern does not fit, a musician "sticks in … one or more svaras to complete the round … at the appropriate eduppu" (Cormack p. 187, quoted in A p. 11). This is how real performers absorb arithmetic, rather than by jumping.

### 3.4 Leaps

None of the sources says "no leaps". All of them show that **leaps belong to raga phrases** (dhatu, e.g. Sahana, F), and real figures move stepwise or by the raga's characteristic skips.

**Consonant reinforcement**, echoing the focal note in the lower octave (Widdess, cited in A n. 3), is the only octave move the sources describe. It is a deliberate gesture on the focal note, never a junction between two unrelated fragments. The attested phrases contain no octave jumps at all (§1).

---

## 4. The gap

| Rule (§3) | Engine now | Gap |
| --- | --- | --- |
| 1, 2 End at the eduppu from the note below or above | Yes (`landing.js`); start fixed at the round's start | Ending rules 3–4 (a ranjaka-prayoga ending) are not used |
| 3, 4 Rounds grow; the five-part order | One round at a time; the page picks a length | No session plan: half, 1, 2, 4 avartanas; first then second speed; koraippu; korvai |
| 5, 12 Slow rounds are pidi-based | Phrases are scored the same at every speed | Speed does not change the mix |
| 7 Phrases of tala-shaped length | Devices of 1–19 slots, 43% on a beat | **No phrase layer** |
| 8 A focal note per phrase group | None | **Missing** |
| 9, 10 Rhyme, sequences, recycled subphrases | Only the mora repeats material | **Missing** |
| 11 Figures descend; ascents obey the arohana | Direction rule is a hard rule; no shape preference | No phrase contour |
| 14–16 Yati, mora, korvai | Mora (shift, gopuccha, srotovaha); yati in jathis but not in kalpana | No yati shapes or korvai in kalpana; no (5)(6)(7) variation |
| 17 Karvai at phrase ends and gaps | Karvai anywhere (50% at unit ends) | Placement rule missing |
| §3.4 Leaps live in phrases; octave echo only on the focal note | Leap licensing per device; joins mostly unchecked; octave-shifted phrases | **Joins carry 8.1% leaps and 1.7% octave jumps** |

---

## 5. A corpus we could use: *Pallavi Svara Kalpavalli* (1900)

Tiruvottiyur Tyagayyar's book is on archive.org with a CC0 statement and OCR text. Its pallavi section ("Pallavi & cittasvara", about pp. 89–189) gives svara passages for five pallavis:

- Sankarabharanam, Rupaka;
- Kalyani, Triputa;
- Todi, Adi;
- Kambhoji, Jhampa;
- Bhairavi, Ata.

These would be the first **notated kalpana-style svaras** in the project: real phrase lengths, focal notes, rhymes and joins against which to fit and test the generator.

There are two problems:

- The body is in **Telugu script**, OCR'd with errors. The swara syllables (స రి గ మ ప ద ని, with long vowels for karvais) can be converted mechanically, but someone who reads Telugu notation should check the result.
- They are composed svaras printed as models, not transcribed improvisation. That makes them a fair model of what is idiomatic, but not of a live improviser.

The Music Academy's 2025 English re-edition (eds. Meenakshi Krishnan and Sumithra Vasudev, tr. Archana Bharadwaj) would remove the Telugu problem.

---

## 6. Proposed design (for review)

These keep the hard rules (exact length, the direction rule, range, the landing) in the feasibility tables and put everything else in scores, as `CLAUDE.md` requires.

### 6.1 Fix the joins (smallest change, biggest audible effect)

- **Hard:** no octave jump at a join between devices. An octave move is allowed only as consonant reinforcement: the same pitch class as the current focal note, held, after a phrase end.
- **Hard:** a leap of 3+ raga steps at a join only when the next device is an attested phrase that starts with that leap, or the leap is licensed as now (`leaps.js`) **and** follows a phrase end (after a karvai or rest).
- **Score:** attested phrases are no longer octave-shifted to fit except when the octave was uncertain in the source (`octaveCertain: false`).

### 6.2 A phrase layer between the round and the devices

- **Plan the round as phrases** before sampling devices. Phrase lengths come from the tala's natural groupings:
  - half-avartana, an anga, one or two beats at second speed;
  - weighted by T: conventional lengths at T 0, uneven and counter-beat lengths more often at high T, after rule 18.
- **Each phrase ends with a karvai or a rest of 1–2 slots** (rule 17). Karvais inside a phrase become rare.
- **A focal note per phrase group.** It is chosen from the raga's nyasa and jiva swaras in the profiles (`nyasa`, `jiva`, already sourced). Phrases end on it or its neighbour, and the focus moves by raga steps across the round (rule 8).
- **Contour per phrase:** a descent toward the focus by default, an ascent obeying the arohana, or a turn (rule 11).

### 6.3 Cohesion

- **Rhyme and sequence.** When a phrase is planned, it may reuse the previous phrase's tail (end rhyme), its head (initial rhyme), or its whole shape moved by one raga step (sequence, rules 9–10).
- **Scoring:** familiar at T 0, more variation at T 2. A rhyme is checked against the direction rule like any device.

### 6.4 Rhythmic designs

- **Kalpana yatis:** srotovaha and gopuccha shapes, with and without rests, built from raga steps (rule 14). The jathi code already has the arithmetic.
- **Mora variation** (5)(6)(7) and (7)(6)(5) of an equal total (rule 15).
- **A korvai option** for the last round of a session (rule 16).
- **Ottu svara** to absorb an arithmetic remainder instead of a jump (rule 19).

### 6.5 Sessions

- A `kalpanaSession` API produces the order of §3.1:
  - rounds of ½, 1, 2 and 4 avartanas at first speed, then second speed;
  - a koraippu with focal notes;
  - an optional korvai.
- Slow rounds weight attested phrases (pidi) more; fast rounds weight patterns and designs (rule 5).

### 6.6 Measures for the tests

Each target is taken from the attested phrases or the sources:

- octave jumps at joins: 0;
- leaps of 3+ steps at joins: no more than inside phrases (about 2%);
- phrases starting on a beat or anga: most, by T;
- karvais at phrase ends: at least 90%;
- a focal note ending most phrases of a group;
- some rhyme or sequence in every round of two avartanas or more.

Then the listening test (`docs/research/gamaka-eval.md` style), with rounds before and after.

---

## 7. Papers to download (not accessible to me)

In order of value:

1. **Cormack, Josepha (Jody) A. 1992.** *Svara Kalpana: Melodic/Rhythmic Improvisation in Karnatak Music.* PhD diss., Wesleyan University.
   - **Why:** the only book-length study, and the source Field relies on throughout. It has transcriptions of three svara kalpana performances each by T. Viswanathan (flute) and K. V. Narayanaswamy (voice) on the same theme (pp. 257–371), with ottu svara (p. 187), yati (pp. 113–15, 133–35) and mora (pp. 127–32).
   - **Where:** ProQuest Dissertations & Theses, or Wesleyan University Library (Olin).
2. **Reck, David. 1983.** *A Musician's Tool-Kit: A Study of Five Performances by Thirugokarnam Ramachandra Iyer.* PhD diss., Wesleyan University.
   - **Why:** "ten more specific ways that Karnatak musicians 'spin out' svara kalpana" (pp. 531–32) and eduppu placement (pp. 495–502). These are the generative procedures we are missing.
   - **Where:** ProQuest.
3. **Viswanathan, T., and Jody Cormack. 1998.** "Melodic Improvisation in Karnatak Music: The Manifestations of Raga." In *In the Course of Performance: Studies in the World of Improvisation*, ed. Bruno Nettl and Melinda Russell, 219–33. University of Chicago Press.
   - **Why:** a performer-scholar's own account of how raga shapes kalpana swaras.
   - **Where:** a library or the publisher.
4. **Viswanathan, T. 1977.** "The Analysis of Rāga Ālāpana in South Indian Music." *Asian Music* 9(1): 13–71.
   - **Why:** motif development and tag phrases (the end rhyme of §3.2), the source for Field 2024's cohesion model.
   - **Where:** JSTOR.
5. **Nelson, David P. 2008.** *Solkattu Manual: An Introduction to the Rhythmic Language of South Indian Music.* Wesleyan University Press. Optionally also Nelson 1991, *Mṛdaṅgam Mind* (PhD diss., Wesleyan; ProQuest).
   - **Why:** the mora and korvai rules Field cites (Nelson 1991 pp. 29, 46–52, 67–68).
   - **Where:** a library or ProQuest.
6. **Vijayakrishnan, K. G. 2007.** *The Grammar of Carnatic Music.* Mouton de Gruyter.
   - **Why:** a constraint-based (optimality-theory) grammar of svara sequences, the closest published model to our rules-plus-scores design. The 2013 thesis (S210) builds on it.
   - **Where:** De Gruyter, or a library.
7. Optional:
   - The Music Academy's 2025 English edition of *Pallavi Svara Kalpavalli* (§5), sold by the Music Academy.
   - Srilatha R., "Kalpana Svaram – A Stylistic Analysis" (PhD, Music Academy Research Centre), if the Academy library can supply it.
   - Jyotsna Vivek's essay on *Pallavi Svara Kalpavalli* in *J. Music Academy* 86 (2015). It is an [open PDF](https://musicacademymadras.in/catalogue/files/journals/Vol.86_2015.pdf), but scanned images only, so it needs OCR.

Put the PDFs in `research/` as before (they stay out of git) and I will read them.

---

## 8. Reproducing the measurements

The figures in §1 come from two short scripts that run the engine and count. They are not committed; they used `E.kalpana` with `aksharas 16, perAkshara 2, startPitch 0`, eduppu P (or S'), T 0–2, and seeds 1–40 for the general statistics and 1–6 for the join and phrase comparison.

- **Steps:** counted in raga steps (adjacent swaras of the union scale).
- **Runs:** notes moving in one direction.
- **Joins:** the interval between the last note of one `unit` and the first of the next.

---

## 9. After v0.7.0 (measured)

The same 344 rounds as §1 (86 ragas, 4 seeds, 16 aksharas at 2 a beat, T 0), plus the new structure measures:

| Measure | v0.6 | v0.7 |
| --- | --- | --- |
| Joins leaping 3+ raga steps | 8.1% | 10.7%, every one a phrase restart within a fifth after a held swara, or a move the raga attests |
| Joins inside a phrase leaping 3+ raga steps without attestation | most of the 8.1% | **0** |
| Octave jumps at joins | 1.7% | **0**, except the focal echo (1 in 344 rounds) |
| Karvais that end a unit | 50% | 84% |
| Rounds planned in phrases | none | 100% (rounds too short for a plan fall back to v0.3) |
| Phrase ends on their focal note (within a step) | none | 68–71% (84%) |
| Rounds with repetition or a yati | only moras | 76% |
| Single steps / leaps of 3+ steps / octaves, all moves | 84% / 3.6% / 0.5% | 84% / 2.8% / 0 (attested phrases: 82% / 2.3% / 0) |

The joins that still leap do so where a phrase restarts after its held swara. `test/kalpana-structure.test.js` checks every join of 1,032 rounds for this.

What the numbers do not show is that the round now has a shape:

- phrases on the tala grid;
- each phrase rising or falling to a held focal note;
- the focus moving across the round;
- the next phrase echoing the last;
- and over a session, rounds that grow and then shrink.

Runs are still shorter than in the attested phrases (18% of runs reach four swaras, against 38%). A reward for runs along the contour cost too many focal endings to keep (§6.6 measure), so it is noted as a refinement.


## 10. Swaras on a rhythm from the korvai lab (v0.8.3)

The lab works out the rhythm of a mora, a tihai or a korvai: a purvanga whose phrases follow an AP, a GP, a Fibonacci-like run, kuraippu or a yati, then a cadence. `kalpanaRhythm` (`src/engine/kalpana/rhythm.js`) sings that rhythm as kalpana swaras. It follows the rules above, applied to a rhythm that is given rather than planned.

| Rule | How it is applied |
|---|---|
| A design is counted to fit the tala (Field 2018) | The lab's pulses are kept exactly. A swara starts on every syllable; held syllables and the lab's gaps become karvais (rule 17: karvais mark phrase ends and gaps). |
| Figures descend; ascents obey the arohana (rule 11). Since v0.8.6 only the cadence must: other lines vary their contour (§11) | Each line moves by step, now and then a skip of two, mostly descending into its last swara. It stays within about an octave and below tara Ga. The direction rule is hard. |
| Yati shapes in swaras (rule 14) | A nested family is sung from one line, and each phrase is the end of it. A gopuccha trims the line from the front and keeps its ending; a srotovaha grows it back. The kuraippu and GP purvangas keep their halving and doubling. |
| Moras repeat with shifts (Field Ex. 3: the run, a step lower, two steps lower) | v0.8.4: a repeated rhythm is not a repeated melody. At low creativity a repeated phrase keeps its shape and starts from another swara, as an alankara climbs the scale: a step lower or higher each time, by thirds, an arch or a wave, repaired where the raga's direction rule needs it. At higher creativity repetitions are re-sung: new openings on the same ending, inverted contours, fresh lines. A yati that comes back whole moves as one round. Exact repetition stays for a trikaala's speeds and, now and then, a mora at low creativity. |
| Phrase ends rest on structural swaras (rules 6–8) | A family's line ends on a nyasa, landing or jiva swara of the profile, or on S or P, never on an alpa swara or one the raga avoids resting on. |
| End at the eduppu from the note below or above (rule 1) | The cadence's line ends on the eduppu's neighbour. |

The rasikas.org threads on constructing kalpana swaras were unavailable (HTTP 503) when this was written, so the rules rest on the sources above.


## 11. Breath and inspiration (v0.8.5, v0.8.6)

**Breath.** A singer does not put a new swara on every pulse of a run of sollus, but neither do held swaras come on a schedule: a kalpana line is mostly continuous, with a karvai (rule 17) now and then. v0.8.3 sang a swara on every syllable of the lab's rhythm, which was exact but relentless. Two corrections followed, each instructive:

- v0.8.5 held weak pulses at random (about 30% of syllables). The holds fell inside sollu words, each "tha ka dhi mi" came out differently, and the korvai's groupings (the 4s, 3s and 5s that make it a korvai) could no longer be heard.
- A first v0.8.6 draft lengthened the end of every long word. The words were clear, but the holds became a predictable pattern of their own (a sustain every fourth swara).

Since v0.8.6 held swaras are rare, and placed where they cannot obscure the words:

| Rule | Value |
|---|---|
| How many | about one per 18 syllables (tisra), 14 (chatusra), 11 (faster), by chance: none, one or more in a phrase |
| Where | the last syllable of a sollu word of three or more (tha ka dhi mi → S R G ,), or the second of "tha dhi gi na thom" ("tha , dhi gi na thom", the lab's own statement shape) |
| Placement | drawn at random, weighted towards the phrase's end (a breath before its closing figure), at least six syllables apart |
| Always sounding | every word's first syllable, every phrase's last (and the landing) |
| Shared | by a family: repeated phrases and mora statements keep one rhythm; a yati's lines are the ends of one line (a held place is kept in a shorter line only where it is a word end there too) |

Words come from the sollu vocabulary (`src/engine/sollu.js`): each run between the lab's holds is split into the fewest words of up to five syllables, longest first. A trikaala keeps every syllable, because its speeds are the point, and the lab's own karvais are unchanged. Over the test passages about 95% of syllables start a swara.

**Contours (v0.8.6).** Building every line backwards from its ending, a step above the next, made each long phrase a triangle wave: down about seven steps, a bounce at the edge of the octave, up seven. "The melodic contour in each unit usually descends" (Field 2018) describes the units of a design, not every phrase of a passage. A line is now a chain of short segments, each with its own shape, never the same shape twice running:

| Shape | Moves | Example |
|---|---|---|
| A run down / up | steps (sometimes skips) one way | P M G R S |
| An arch / a valley | up then down / down then up | S R G R S |
| Janta | each swara doubled | S S R R G G |
| A zigzag of skips (dhatu) | a skip forward, a step back | S G R M G P |
| Circling one swara | above, back, below, back | P D P M P |

Low creativity leans on runs down; higher creativity brings janta, zigzags and rising lines. A cadence (the mora statements, the uttaranga) always closes on a run down into its landing. The line is still built from its ending, so it always arrives, and every move keeps the direction rule (a forbidden move becomes a smaller or larger move, the opposite move or a repeated swara). Taking the opposite move whenever a move was blocked made lines swing between two swaras (Ṡ Ṙ Ṡ Ṙ Ṡ) at the top of the range and in pentatonic ragas, so a line refuses a move that makes A B A B or a third repeat of one swara while any other legal move exists, and across the passage a pair swung five times (A B A B A) breaks a hard rule. Over 60 khanda passages in the pentatonic ragas, A B A B fell from 1,595 to 18 and A B A B A from 1,046 to 0. Over 12 khanda korvais × 3 creativities × 3 seeds, the mean run in one direction is 2.0 moves, and 96% of cadences end on a descent.

**Asymmetric ragas (v0.8.6).** In a raga whose arohana and avarohana differ (Saveri, Malahari, Arabhi: G and N only descending), the direction rule binds the joins between phrases as well as the moves inside them. Each line obeyed it, but a phrase ending low followed by one opening on a descending-only swara did not, and a korvai has many joins, so most rhythms failed. Such an opening is now bridged: its first one or two swaras move to the nearest legal swaras, and its ending is kept. Bridging costs score, so it is a last resort. Tara Ga, the top of a line's range, is a trap in these ragas: it can only be reached from above, which is out of range. Lines never step onto such a swara, and phrases never rest on one. All 86 ragas now sing lab rhythms for every eduppu.

**Inspiration.** A language model can suggest lines, but its answer is inspiration, not a ruling. `rhythmPrompt` gives it the facts the engine itself uses:
- the arohana, the avarohana and the direction rule;
- the profile's resting, jiva, weak and avoided swaras, and attested phrases with their sources;
- the range;
- the rhythm beat by beat, with its families and the landing.

The engine then fits each suggested phrase:
- **Breath.** The phrase's own holds are kept when it has one token a syllable; otherwise its swaras are spread over the engine's breath.
- **Raga.** Its swaras are moved onto the raga, and the projector's repair restores the direction rule.
- **Ending.** The phrase keeps its fixed ending.
- **Hard rules.** It is sung only if every hard rule still holds. Otherwise the engine's phrase stays, and the reason is reported.

Hard rules stay in the feasibility checks, and taste can come from outside them (CLAUDE.md: "Never relax a hard guarantee ... to reach a soft goal").
