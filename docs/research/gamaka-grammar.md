# The swara grammar of gamaka

**Status:** implemented in `src/engine/gamaka/grammar.js` (v0.5; v0.6 adds G3c and G4m and anchors G2 on S and P, from the papers in `docs/research/gamaka-papers.md` §4). It decides the gamaka of every swara that a raga's own data does not cover, or covers only with "takes gamaka", in every raga, from the phrase around the note. Read with `docs/research/gamaka-naturalness.md`, which covers how the voice moves. This document covers what each swara does, and when.

**Why.** The earlier default gave every non-S, non-P note of a data-less raga the same light swing from the swara below. Feedback was that gamakas should be swara-specific and phrase-specific, not "slight swings or oscillations for every note done in an indistinguishable manner". One rule was given explicitly: *R2 followed by G2: the gamaka falls on G2, with R2 straight; R2 followed by G3: R2 takes the gamaka and G3 is straight.*

## 1. Sources

| Id | Source | What it contributes |
|---|---|---|
| S202 | R. Vedavalli, "Gamakas", lecture-demonstration at the Music Academy's 76th Conference, 24 Dec 2002. *Journal of the Music Academy Madras* 74–76, pp. 26–31 | The adjacency rule; stress or flatness depending on the following note; a gamaka borrows the shade of the next svara; a swara's position shifts with the phrase |
| S203 | J. Schachter, "Structural Levels in South Indian Music", *Music Theory Online* 21.4 (2015), §IV, after H. Powers (1958) | Half-step svaras deflected into S and P; augmented seconds; Varali's G1; Kambhoji; condensed gamakas at speed |
| S201 | A. Krishnaswamy, "Melodic atoms for transcribing Carnatic music", ISMIR 2004 | One svara, several renderings; "R2+ appears as a particular form of G2" in Todi; G3 as M1− in Gaula; Madhyamavati's M1 via G3*P; inflexions merge at speed |
| S194 | Viraraghavan et al., ISMIR 2018 | Oscillation targets are raga notes in context: G3 in Sankarabharanam swings to R2, M1 or P, never to R1, G2 or M2. "Such rules are not fully documented and are known more by practice" |
| S37, S40, S76, S144, … | The per-raga gamaka texts in `data/raga-profiles.json` | Raga-specific rules, which take precedence |
| (context) | L. Pearson, "Coarticulation and Gesture", *Music Analysis* 2016; Nuttall, Serra & Pearson 2024–25 (svara-forms in Bhairavi) | A svara's form depends on its neighbours and its duration (coarticulation). Not read in full here (access blocked); cited as background only |

### Key statements, verbatim

Vedavalli (S202):

- *"One more point to be noted is that if one svara is oscillated, then as a rule the svara adjacent to it is usually held flat. For instance if the kalyani gandharam is oscillated, then the rishabham is held flat and vice versa with Sankarabharanam. … 'Enduku peddala' … has an oscillating rishabham followed by a flat gandharam right at the outset."*
- *"some notes have to be stressed and others held flat depending on the following note. Take for instance Harikambodi which takes the Chatusruti dhaivatam and Kaisiki nishadam. A raised dhaivatam will automatically push the nishadam higher … whereas one can raise the d in Sankarabharanam as it takes the kakali nishadam. … A flat dhaivatam will automatically lead to kaisiki nishadam."*
- *"A note often oscillates between its own svara sthana and the next, in fact it borrows shades of the next svara … The Kalyani gandharam is usually held with a gamakam … it has the sound of mg, mg, mg. Curiously it does not reach upto the pratimadhyamam."*
- *"In Sankarabharanam, the phrase srgmm, the oscillating madhyamam is close to the Gandharam … [when] ascending to higher notes … the gamakam would keep the madhyamam closer to the panchamam."*
- *"Usually the Madhyamavati rishabham is oscillated while the Sriragam rishabham is held flat. This is to allow for the flow of the gandharam in Sriragam."*
- *"Kharaharapriya takes flat notes [in rgmp] whereas in the raga Bhairavi, the madhyamam is sung with some emphasis."*
- *"Singing or playing the same kind of gamaka throughout, makes it dull and monotonous."*

Schachter (S203):

- *"In all Karnatak ragas, the sa-pa fifth remains inviolable, and these tones are furthermore usually rendered in performance as plain svaras."* (¶19)
- *"The svaras located a half step on either side of sa and pa … are rendered with gamakas in which the underlying svara pitch is deflected by oscillation into neighboring sa and pa."* (¶31)
- In Mayamalavagowla, *"R1 and N3 oscillate into sa, D1 oscillates into pa, and G3 oscillates upwards into the secondary stability of M1."* (¶31)
- Across augmented seconds, *"ri and dha oscillate downwards into sa and pa, respectively, while ga and ni oscillate upwards"* (¶32). *"The literal frequencies of the third and seventh are only marginally present."*
- In Varali, *"G1 oscillate[s] upwards by half step into the svarasthana of G2"* (¶33).
- In Kambhoji, ri is rendered *"with an ettra jaru from sa to ga and just a short nokku flick back down"*, and in ma *"the literal pitch of the fourth is never sounded, with the svara oscillating exclusively between ga and pa"* (¶36).
- *"At slower speeds, an oscillation will generally take the shape of a long kampita, while the same gamaka rendered at faster speeds will appear as a nokku, odukkal, or orikkai"* (¶29).

## 2. The grammar

It reads three things for each note:
- its swara's neighbours in the raga, which give the interval up (*up*) and down (*dn*);
- the phrase: the next note (where the phrase goes) and the previous one;
- its duration.

| Rule | When | Rendering | Basis |
|---|---|---|---|
| G1 | S, P | Plain | S203 ¶19 |
| G2 | R1 or D1 a half step above S or P | Kampita between S (or P) and the swara, ending on the swara. Since v0.6 it **rests on S (P)** and rises to the swara in spurts | S203 ¶31–33; S37 (Todi D "from around P"); S40 (Mayamalavagowla R from S); v0.6: S205 (Mayamalavagowla ri), S207 (Bhairavi dha forms) |
| G3 | *up* = 1 and *dn* ≤ 2 (R2 before G2, D2 before N2, G3 before M1, N3 before S, M2 before P) | **Straight** | S202 (Sri, Kharaharapriya, Harikambhoji, Sankarabharanam) |
| G3a | *up* = 1 and *dn* ≥ 3 (G3 over R1, N3 over D1, M2 over G1) | Kampita up into the upper neighbour, most time spent there | S203 ¶31–33 |
| G3c (v0.6) | N3 or M2 with S or P before or after it: a long note, or a middling one rising to S or P | Kampita very close to S (P): between the swara and S (P), dwelling at the top. Ranks with G4, so D2 N3 S keeps D2's gamaka and N3 straight | S209 (Krishna & Ishwar) |
| G3b | N3 or M2 reached from S or P above, middling | A touch from S or P, then straight | S203 ¶31; S144 ("(s)n", "(p)m") |
| G4w | *dn* = 1 and *up* ≥ 4 (Varali-type G1) | Kampita up by a half step | S203 ¶33 |
| G4 | *up* ≥ 2 | Kampita toward the neighbour **the phrase heads for**: up when the next note is higher, down toward the swara below when it falls or stays. Anchored on the swara; at most a minor third wide | S202 ("borrows shades of the next svara"; the Sankarabharanam madhyamam); S203 (G2 and N2 deflect downward) |
| G4m (v0.6) | M1 with G3 a half step below and P a tone above, passed through upward (G3 M1 P) | Kampita from G3 up to P, dwelling on G3 ("Ga3 Pa Ga3"); at speed a touch from G3 | S209; S205 (Sankarabharanam "ga maa paa"); S203 (Kambhoji ma) |
| G5 | Duration | ≥ 0.4 s: up to 3 cycles. 0.22–0.4 s: one swing. Shorter: a single touch (nokku or odukkal) from where the swing would go | S203 ¶29, ¶34; S201 |
| G6 | Two adjacent swaras that would both oscillate into each other | One is held flat: a sourced raga rule wins, then a defining deflection (G2, G3a) over a borrowed shade (G4). Otherwise, a whole tone apart the lower keeps the gamaka; a semitone apart the upper does. Gamakas that split outwards (R1 into S, G3 into M) both stay | S202 (adjacency); S203 ¶32 (outward splits) |
| (janta) | The second of a repeated swara | Struck from below (sphurita) | S198 |

What this gives for each of the ten moving swaras:

- **R1:** leans into S (G2), in every raga with S, whatever follows. *Example: Todi, Mayamalavagowla.*
- **R2:** before G2, straight (G3) and the gamaka moves to G2. Before G3, or with M1 above when G is absent (Madhyamavati), it oscillates toward the swara above as the phrase rises (G4), and G3 is held straight beside it (G3, G6).
- **G2:** with M1 a whole tone above, it oscillates up toward M when rising and down toward R when falling (G4). Kharaharapriya and Bhairavi's G2 belong here, as does Todi's oscillating G2 (its own data rules).
- **G3:**
  - Sankarabharanam-type (M1 above, R2 below): straight.
  - Mayamalavagowla-type (R1 below): rises into M1 (G3a).
  - Kalyani-type (M2 a whole tone above): oscillates (G4), and then R2 beside it is held flat (G6), exactly Vedavalli's example.
- **M1:** with P a whole tone above, it oscillates toward P in rising phrases and toward G when the phrase stays or falls: Vedavalli's *srgmm* against a rising phrase. Rising from G3 to P it is sung between them, G3 P G3 (G4m, v0.6). Held flat beside an oscillating G2 (Kharaharapriya *rgmp*), and beside a G3 that rises into it across an augmented second.
- **M2:** a half step below P: next to P, a kampita close to P (G3c, v0.6); touched from P on the way down when middling (G3b); into P across a wide gap below (G3a); otherwise straight.
- **D1:** leans into P (G2).
- **D2:** before N2, straight (Harikambhoji). Before N3, oscillates toward N (Sankarabharanam), and N3 is held straight.
- **N2:** with S a whole tone above, oscillates toward S when rising and toward D when falling. Kharaharapriya's, Bhairavi's and Todi's N belong here.
- **N3:** a half step below S: next to S, a kampita close to S (G3c, v0.6), unless D2 below it oscillates (then straight, as R2 G3); straight in Sankarabharanam (its own data); touched from S in descent; rising into S across D1 (Mayamalavagowla, G3a).

## 3. How it combines with the raga data

1. **A raga's specific rules come first.** These include Todi's wide G, Kalyani's descending nokkus and Mayamalavagowla's G against a held M. A sourced rule also wins the adjacency contest (G6), which is how Kalyani's R2 ends up flat beside its oscillating G.
2. **Vague rules defer to the grammar.** A rule that only says a swara "takes gamaka" (`basis: text-vague`, e.g. Kharaharapriya's R, G, D and N, or Sankarabharanam's R, M and D) does not say how or where. The grammar decides the shape and the context, and the adjacency rule may still hold the note flat. So Kharaharapriya's R2 is straight before G2, as Vedavalli says.
3. **New raga rules from the same sources:**
   - Kambhoji's R: in ascent from S, a slide toward G and a touch down onto R.
   - Kambhoji's M: oscillates between G and P, never sounding its own pitch, settling toward P rising and toward G falling.

   Both cite S203, with interpretation notes.
4. **The intensity dial and the natural motion apply unchanged.** Grammar gamakas have salience 0.82, so they come in from about 16% of the dial and fade in from 60% reach. Speed degrades them through the ladder as before.

Every grammar decision is visible: the pitch view's tooltip names the rule, its reason and its source (for example *"R2 held flat beside the oscillating G3 (one of two adjacent svaras is held flat)"*).

## 4. Tests (`test/gamaka.test.js`, "swara grammar")

The test uses every data-less raga that has the relevant swaras:

- **R2 then G2:** R2 straight, G2 oscillating (3 ragas). **R2 then G3:** R2 oscillating, G3 straight (4 ragas). The same holds in Kharaharapriya and Sankarabharanam, whose data is vague.
- **D2 then N2:** D2 straight (9 ragas). **D2 then N3:** D2 oscillating, N3 straight (10 ragas).
- **Kalyani:** G oscillates, and R beside it is flat by the adjacency rule.
- **Sankarabharanam:** M swings toward P in *s r g m p* and toward G in *s r g m m*.
- **Deflections into S and P:** R1 into S (4 ragas), D1 into P (9). **Across an augmented second:** G3 rises into M, N3 into S.
- **Speed:** a short note gets a single touch, not a kampita.
- **Sources:** every grammar decision has a source and a reason.

Plan test 15 now checks the grammar's guarantees for all 63 data-less ragas: S and P plain, a swara a semitone below a close neighbour never oscillating, and no two neighbouring swaras oscillating into each other.

## 5. Limits

- **A grammar is not a bani.** It reproduces documented tendencies. Real singers vary them by phrase, lineage and mood (Schachter's fn 13; Pearson). A musician's review of §2 is the next step.
- **Phrase knowledge is local:** the previous and next note and the duration. Longer motifs (prayogas) and their specific gamakas need raga data. The `inPhrase` condition of `gamakaRender` can carry them.
- **Microtonal positions** are not modelled: Gaula's almost-*ekasruti* R1, or Todi's G as R2+. Targets are raga notes (S194 found STA positions flexible).
- The svara-form studies on Bhairavi (Nuttall et al.) and Pearson (2016) could not be read in full (access blocked). They would let the forms be calibrated against data.
