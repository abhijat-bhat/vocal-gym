# Korvai, mora and tihai: the arithmetic, for a learner's lab (v0.8)

This report backs the Korvai & Tihai lab (`src/engine/korvai/`, `web/shared/korvai-lab.js`). The lab replaces the Jathi creator and judge as the main rhythm tool; the judge is still there, under "Check your own". The aim is educational. It shows how a mora, tihai or korvai is built and why it lands, for any of the 35 suladi talas. Every number the lab shows is computed and then checked cell by cell. Sources are cited inline; §8 lists them.

## 1. Sources read

| Source | Access | What it gives |
|---|---|---|
| J. Balaji, "Korvais in Karnatak Music – Improvisation through Training", *Shanlax Int. J. of Arts, Science and Humanities* 12(2), 2024, pp. 55–67, doi:10.34293/sijash.v12i2.8123 (CC BY-SA 4.0) | Open access; read in full | The method this lab follows: the jati for each number; trikaala placement; the series a(k)a(k)a, aa(k)aa(k)aa and aaa(k)aaa(k)aaa with totals and offsets for Adi and Khanda Triputa; purvanga and uttaranga, their ratio, yatis and the 1-2-4 rule; worked korvais for Adi and Misra Chapu; the gati change. |
| B. Raberg, "Carnatic rhythmic elements", *Berklee Today*, Spring 2017 (The Woodshed) | Read | The mora as statement–gap–statement–gap–statement; gaps identical; statements identical or symmetric; it can start anywhere and resolves to samam or the eduppu; the 3-5-3 mridanga yati. |
| digitabla.com, "Common tihai forms: Tintal" and "Simple chakradar" | Read | Hindustani tihai counting: damdar (with gaps) and bedam (no gaps); the length includes the stroke on sam (16 + 1 = 17); the chakradar as three repetitions of mukhra + tihai, with worked lengths 33, 81 and 113. |
| R. Field, kalpana and mora analyses (2018), after D. Nelson, *Solkattu Manual* (2008) and his 1991 dissertation | Read earlier (docs/research/kalpana-structure.md) | Nelson's mora rules: three statements of at least one pulse, in an orderly relation, and two equal gaps of zero or more; moras of (5)(6)(7) and (7)(6)(5); a korvai is a shape (e.g. gopuccha) followed by a mora, often three times. |
| MA375TGR *Mathematics of Music*, Unit 3 exam guide (RV College of Engineering), `research/UNIT 3 Notes.pdf` | Provided by the user; read in full | Purvanga patterns, the six yatis, the notes' korvai model, progressive korvais, the Samam and Edapu algorithms, the constant-total methods, tihai solution sets, the chakkardar, graha-bheda (§8 below) |
| eambalam.com glossary, "eduppu"; CBSE percussion syllabi; rasikas.org "Easy methods for korvai" | Glossary read; forum unavailable (HTTP 503) | Eduppu: sama, atita (before sam) and anagata (after sam). The forum thread was not used. |

The other papers the earlier research listed (Nelson 1991, Sankar 2018 on Harishankar's korvais, Iyer's *Sangeetha Akshara Hridaya*, Hariharan's *Korvais Made Easy*) are behind paywalls or in print only. Balaji cites them, and the lab relies on what he reports.

## 2. Counting in pulses

* A tala's avartanam has a fixed number of aksharas: Adi (Chatusra jati Triputa) is 4 + 2 + 2 = 8. The 35 suladi talas are the seven families (Dhruva I O I I, Matya I O I, Rupaka O I, Jhampa I U O, Triputa I O O, Ata I I O O, Eka I), each in five jatis: the laghu is 3, 4, 5, 7 or 9 (Balaji Annexure 1).
* Kalai sets the beats in an akshara. In 2 kalai, Adi has 16 beats (Annexure 2).
* Gati (nadai) sets the pulses (maatras) in a beat: normally 4, or 2 for the chapu talas; 3, 5, 7 or 9 when the gati changes (Annexure 2).
* **One avartanam = aksharas × kalai × gati pulses.** Adi in chatusra gati is 32. Khanda Triputa is 36. Misra Chapu counted two a beat is 14.
* The space a passage fills is `cycles × C + landing − start`, where start and landing are pulse offsets from sam (§5).

## 3. The mora (tihai)

**Shape.** statement (gap) statement (gap) statement, or s g s g s (Raberg). The two gaps are equal. The statements are identical, or they follow a symmetric shape (Raberg; Nelson's "orderly relation").

**Length.** With statements of P pulses and gaps of G: **3P + 2G**. There is no gap after the third statement (Balaji p. 58).

**The closing syllable.** Two conventions, and the lab offers both:
* *Count to the landing.* Balaji counts every pulse up to the landing point. A closing "tha", "thom" or "thaam" sounds on the landing and "is not counted" (p. 58–59). All of his charts work this way: 3P + 2G = the space.
* *The last stroke on sam.* Tabla players count the final stroke itself: a one-cycle Tintal tihai is "1 avartan plus sam", 16 + 1 = 17. The damdar example is 5 × 3 + 2 × 1 = 17; the bedam is 5.5 × 3 = 16.5, which "finishes on 17" (digitabla). Here 3P + 2G = the space + 1.

**Solving.** For a given space N there are usually several (P, G). P ≥ 1 and G ≥ 0, and G = (N − 3P)/2 must be a whole number. Every N from 5 up has at least one solution; so does 3, but 1, 2 and 4 have none. The lab lists all of them. It ranks them by taste and never removes one: statements of one to four beats; gaps no longer than a statement; a step P + G that is a whole number of beats, so every statement starts at the same place in the beat. Fractional Hindustani phrases such as 5.5 matras are whole numbers at a finer gati (11 pulses at two a matra).

**Where it starts.** Count back from the landing. Balaji's "offset" is the number of pulses to leave from sam before the pattern begins (p. 58): off = (−total) mod C. In Adi, 7 (5) 7 (5) 7 = 31 starts 1 pulse after sam, and 9 9 9 (8) 9 9 9 (8) 9 9 9 = 97 starts 31 pulses in (7¾ beats). `offsetFor` reproduces all four of his charts exactly; `test/korvai.test.js` checks all 264 entries.

**Series of six and nine.** aa (k) aa (k) aa = 6a + 2k, and aaa (k) aaa (k) aaa = 9a + 2k (Balaji pp. 59–60). The gaps come only between the three groups. These are the Carnatic counterpart of the nine-fold Hindustani forms, the nauhakka (digitabla).

**Shaping.** The total does not change if the statements grow or shrink around an average: 7 7 7 (2) 8 8 8 (2) 9 9 9 = 8 8 8 (2) 8 8 8 (2) 8 8 8 = 76 (Balaji p. 61); (5)(6)(7) and (7)(6)(5) (Nelson, in Field). The lab names these after the yatis: srotovaha (growing) and gopuccha (shrinking).

## 4. The korvai

* A korvai is a passage that "culminate[s] in a structural format of definable Purvanga and Uttaranga". The purvanga is the opening part and the uttaranga the ending part (Balaji, abstract). The uttaranga is a mora. Field and Nelson describe it the same way: a shape followed by a mora.
* **Ratio.** "The general ratio of purvanga and uttaranga could be 60:40 or 70:30"; 90:10 and 20:80 "are generally not preferred". In the body of the article: between 70:30 and 30:70. The lab enforces 30–70 % for the korvais it suggests. This is the one taste rule it treats as a filter, because the source states it as a rule.
* **The purvanga** (pp. 60–62):
  * If its length divides by 3, it is "phrase (gap) phrase (gap) phrase (gap)". Unlike the mora, the third phrase also has its karvai. Example: 33 = 3 × (8 + 3), "T . d . t k d m (t n g)".
  * If not, use a **yati**: gopuccha, descending (20 = 6, 5, 4, 3, 2); srotovaha, ascending; mridanga, ascending then descending; damaru, descending then ascending (47 = 7, 6, 5, 4, 3, 4, 5, 6, 7).
  * Or use **Balaji's own rule**: subtract 7, 14 or 28 until the rest divides by 3. Put the remaining phrase three times, with prefixes 1, 2, 4 (or 2, 4, 8, or 4, 8, 16). Example: 31 − 7 = 24 = 3 × 8, so 1(8) 2(8) 4(8).
* **Worked korvais the lab reproduces** (all in `test/korvai.test.js`):
  * Adi, 2 cycles (64): 33 + 31 (5 (8) 5 (8) 5). The lab's own first suggestion for this frame is this 33.
  * Adi, 2 cycles: 41 + 23 (5 (4) 5 (4) 5).
  * Misra Chapu at 14 a cycle, 6 cycles: the same 41 + 43 (9 (8) 9 (8) 9).
  * Adi, 3 cycles (96): gopuccha 20 + 8 8 8 (2) 8 8 8 (2) 8 8 8 (76); then 1(8) 2(8) 4(8) (31) + 7 nine times with k = 1 (65).
* **Three times.** "A korvai is normally played 3 times" (p. 56). Played back to back from sam to sam, each rendition lands. If it starts on sam and lands on an eduppu off sam, each rendition shifts by that offset. The lab says so, and suggests starting it where it lands. Balaji also warns that a korvai of an odd number of 1-kalai Adi cycles, used in a 2-kalai composition, lands mid-cycle (p. 64).
* **Changing the gati.** The same syllables fit another gati g whenever the total is a multiple of beats × g. A 3-cycle Adi korvai (96) goes into tisra, and a 5-cycle one (160) into khanda (p. 64). See `gatiFits`.

## 5. Eduppu: starting and landing off sam

A composition's eduppu is where it begins relative to sam: sama (on sam), atita (before sam) or anagata (after sam). A korvai or mora at the end of a passage lands on the eduppu, so the composition can resume there (Raberg: "it can also resolve to the starting note of the melody, which is called Eduppu"). The lab has two offsets:
* the start, in pulses from sam (negative is before sam);
* the landing (the eduppu).

The space to fill is `cycles × C + landing − start`. The grid draws the cycle before sam when the start is atita.

## 6. Trikaala (pp. 57–58)

Recite a jati of n once at one syllable a beat, twice at two, and four times at four. Each speed takes n beats, so 3n in all. Count back from sam to place it. Five in Khanda Triputa (9 beats) is 15 beats: count from 18, leave 3 and start on beat 4. Seven in Misra Jhampa (10) is 21: leave 9 and start on beat 10. In a concert the third speed is said three times. The fourth is either left as a gap at the start or moved before the first speed. The lab offers all three forms.

## 7. The chakradar (a tihai of tihais)

Three repetitions of a mukhra M and a tihai 3t + 2g, with an optional gap G between repetitions: **3 × (M + 3t + 2g) + 2G**. Only the last tihai lands. digitabla works through these forms in Tintal: simple, 33 = 3 × (2 + 3 × 3); farmaishi, 81 = 3 × (12 + 3 × 5); kamali, 113 = 3 × (10 + 3 × 9) + 2 × 1. The lab finds all three. It is the Hindustani form; the lab includes it because learners meet it, and the arithmetic is the same idea one level up.

## 8. The Unit 3 course notes (v0.8.1)

`research/UNIT 3 Notes.pdf` is the MA375TGR *Mathematics of Music* exam guide for Unit 3, "Rhythm, Tala and Combinatorial Structures" (RV College of Engineering; lecture slides by Ananth M. Athreya, course notes by Venugopal K.). v0.8.1 closes the gaps between it and the lab. Every worked example and practice answer the lab can compute is a test in `test/korvai-unit3.test.js`.

| Topic in the notes | Before | Now | Where |
|---|---|---|---|
| Purvanga patterns (§9.3): AP, GP, Fibonacci-like, squares, polite numbers | Arithmetic yati shapes only | All five, with their sum formulas. Any purvanga length is searched for every pattern that sums to it. | `patterns.js`: `patternInfo`, `patternsFor`, `politeRuns`; lesson 8 |
| Polite numbers: the odd-divisor recipe, the count (odd divisors − 1), powers of 2 impolite | — | All runs, with the recipe's two conditions | `politeRuns`; lesson 8 |
| Kuraippu (§10.2): L, L/2, L/4 …, S = L(2ⁿ − 1)/2ⁿ⁻¹ | — | A purvanga pattern, with the "never reaches 2L" bound | `patternInfo`; lesson 8 |
| The six yatis (§10.1): sama, srotovaha, gopuccha, mridanga, damaru (pippilika), vishama | Shapes found only as purvangas (steps of 1 or 2, odd sizes from 5), with no vishama | Each yati with any step d, any n (or m), and its closed form: (2m + 1)a + dm², (2m + 1)b − dm². Solve for the first phrase to fill a span; classify any list of lengths. | `yatiTerms`, `yatiSum`, `fitYati`, `classifyYati`; lesson 7 |
| Gopuccha syllables | Each line its own phrase ending on "thom" | One phrase trimmed from the front, keeping the ending (tha dhi gi na thom, dhi gi na thom, gi na thom …); srotovaha grows it back | `nestedPhrases` |
| The uttaranga variants (§7.2): Thadhin,ginathom (6), Tha,dhin,ginathom (7), Tha,Thadhin,ginathom (8), Tha,Dhi,Thadhin,ginathom (10) | Other syllables | The slides' forms, each growing at the front | `statementOf` |
| The slides' build-up uttaranga: 1, 2, 3 Thadiginathoms with two kaarvai blocks, 6t + 2g | — | A series form, `n: 'buildup'` | `moraSolutions`, `moraPlan`; lesson 6 |
| Sounded kaarvais: Dhin, (2), Dhinku (3), Dhin,; (4), Dhin, Tha, Dhin, (6) … | Rests only | Optional in layouts | `kaarvaiOf`, `layoutParts(…, { sounded })` |
| The notes' korvai model (§7.3, §7.4): (P U)(P U)(P U), 3(P + U) = kN | Purvanga + mora only (the slides' model) | Three statements. The length condition is S ≡ 0 (mod N/gcd(N, 3)). When the span does not divide by 3, the statements are unequal (21, 21, 22) or an eduppu absorbs the remainder. The ratio is shown as P/(P + U) and P/U. | `compose.js`: `statementKorvai`, `statementOptions`, `lengthCondition`; lesson 10 |
| Korvai types (§7.5): simple, progressive, yati, porutham | — | Named in the result | `statementKorvai().type`; lesson 10 |
| Progressive korvais (Def. 7.4): r(mP + d·m(m − 1)/2 + mU) = kN | — | Solves for P; lists every fit | `progressiveKorvai`, `progressiveOptions`; lesson 10 |
| Algorithms 1 and 3 (§9.4): target ratio, backward construction | Implicit | `targetSplit`; the statement options are Algorithm 3 run over every pattern | `targetSplit`, `statementOptions` |
| The Samam algorithm (§9.1): T(U) = (n − T(P) mod n) + kn | Implicit in the split search | Run step by step for a chosen phrase, kaarvai and k, with a tihai or build-up uttaranga | `samamAlgorithm`, `samamKorvai`; lesson 11 |
| The Edapu algorithm (§9.2): the smallest m with 3 | mn + k; n must not be a multiple of 3 | — | The table of m, the reason it fails when 3 | n, and atita (mn − k) | `edapuAlgorithm`; lesson 11 |
| The constant-total principle (§7.6): Method A (6t + 2g fixed) and Method B (p + u fixed) | — | Both methods, on the slides' 96 and 64 korvais or on the learner's tala | `constantTotal`, `constantTotalPlan`; lesson 12 |
| Tihai solution sets (§8.2), half-pulse gaps (5 (8½) 5 (8½) 5) | Whole gaps only | Every P up to T/3: whole gaps, and half gaps drawn at twice the resolution | `halfTihais`, `doubledFrame`; lesson 4 |
| Chakkardar (§8.1): 9P₁ + 6G₁ + 2G₂ = T | Only the Hindustani chakradar with a mukhra | The pure tihai of tihais, with half outer gaps | `chakkardarSolutions`, `chakkardarPlan`; lesson 15 |
| Graha-bheda and nadai-bheda (§6.3, §6.4) | A gati change only | A repeating phrase meets sam after lcm(L, N): N/gcd repetitions, L/gcd cycles, visiting only multiples of the gcd. Groups meet a beat every lcm(L, gati). | `drift`; lesson 5 |

**Not taken from the notes.** These belong to tala theory rather than to cadences, and are left for a later module:

* the counting of rhythm patterns (§10.3: kⁿ, compositions 2ᴺ⁻¹, Fibonacci tilings, multinomials);
* the tala graph (§10.4);
* the 175/700/5600 tala counts (§4.3).

The notes' recursive korvai (§9.5) is covered by the chakkardar.

**Where the notes and the earlier sources differ.**

* *The two korvai models.* The slides add the parts: T(P) + T(U) ≡ 0 (mod N). The notes repeat the whole statement: 3(P + U) = kN. These are the same arithmetic (§7.3 of the notes), and the lab offers both.
* *The 30–70 balance.* The notes call it a guideline. The lab keeps it as the filter for suggested korvais, after Balaji, but shows purvanga-heavy designs (e.g. 25 : 7, 78%) when asked for them, flagged.
* *Damaru and pippilika.* The notes call the big–small–big yati pippilika (the ant) and note that it is also called damaru. The lab uses both names.

## 9. Exploring the variations (v0.8.2)

A learner's settings usually admit many korvais: for two Adi cycles there are about 7,000 combinations of split, uttaranga, purvanga, mora shape and sollu texture. The explorer makes all of them reachable without listing them all at once.

* **Familiarity and novelty.** Familiarity is the builders' own score: Balaji's balance near 60 : 40, three equal phrases, the slides' statements. Novelty rewards rarer purvanga patterns (GP, kuraippu, squares, Fibonacci-like, damaru and mridanga yatis), shaped moras, cross-rhythms, extreme balances and the second texture.
* **The order.** The two scores are blended by the same creativity rule as every generator in Vocal Gym (CLAUDE.md: score = (1 − c)·F + c·N, c = T/2). A diversity pass then makes each next variation differ from the last four, weighting the purvanga double. Stepping through the list therefore moves across the kinds of korvai rather than through near-duplicates.
* **Hard rules hold.** Every variation is drawn by the same builders and checked cell by cell. Exploring never relaxes a hard rule, so a variation that does not fill the span exactly is never offered.

## 10. What the lab guarantees, and what is taste

* **Hard** (checked cell by cell by `layoutParts`; `test/korvai.test.js` lays out 113,064 moras, 14,884 korvais and 1,640 chakradars across 12,600 frames of the 35 talas, and `test/korvai-unit3.test.js` another 4,831 statement, progressive, chakkardar and Edapu korvais):
  * the parts fill the space exactly;
  * a syllable sounds on the landing, and the landing is the requested offset from sam;
  * a mora's two gaps are equal;
  * a korvai's purvanga and uttaranga add up.
* **Soft** (ranking only): the order of solutions; which purvanga shape is offered first; the syllables chosen.
  * Syllables come from Balaji's table for 1–10 (p. 57), and the 8-pulse purvanga phrase is his "tha , dhi , tha ka dhi mi".
  * A mora statement closes on "thom". Its 6, 7, 8 and 10 are the Unit 3 slides' forms ending "gi na thom".
  * The phrases of a yati or pattern are one phrase trimmed from the front (v0.8.1).
* **Not modelled:**
  * Balaji's "t n g" taangu fillers. Gaps are rests, or the Unit 3 slides' sounded kaarvais (Dhin, Dhinku …) on request;
  * gati changes inside one passage;
  * the 4-cycle mohara of a tani avartanam. Balaji distinguishes the mohara from the korvai (p. 66) and notes that some musicians say "mora" for it; the lab uses "mora" in Nelson's sense, the three-statement cadence.
