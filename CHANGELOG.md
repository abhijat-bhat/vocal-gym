# Changelog

## 0.8.6

- **Ragas whose arohana and avarohana differ now sing lab rhythms** (Saveri, Malahari, Arabhi, Kedaragowla, Abheri). Before, most rhythms in these ragas failed as "unsingable": Saveri on 22 of 32 tries and Malahari on 15 of 28; the committed 0.8.5 failed less often, but still failed. There were two causes.
  - **Joins.** Each phrase's line kept the direction rule inside itself, but the move into the next phrase often broke it (in Saveri, G and N may only be reached descending), and a korvai has many joins. When a join breaks the rule, the next phrase's first one or two swaras now move to the nearest swaras that join legally; its ending is kept. Bridging costs score, so passages that need none are preferred, and each phrase reports `bridged`.
  - **Traps.** Tara Ga, the top of a line's range, can only be reached from above in these ragas, so a line that touched it stuck there (Ġ Ġ Ġ Ṙ Ṡ). Swaras with no legal way in inside the range are now never stepped on and never rested on.
  - **Landing.** A varied last mora statement whose raga repair moved its final swara now falls back to the plain statement, so it always lands.
  - **Coverage.** All 86 ragas now sing lab rhythms for every eduppu: a new test covers 2,022 passages. An unsingable answer reports which rules failed (`failed`).
- **Contours: a line is not always a rise and a fall** (`src/engine/kalpana/rhythm.js`). Every line used to be built backwards from its ending, a step above the next, turning only at the edge of an octave window. A long phrase therefore became a triangle wave (down about seven steps, bounce, up seven), and sequences moved the same hump around.
  - **Segments.** A line is now a chain of short segments (three to six moves, longer at higher creativity). Each has its own shape, never the same shape twice running: a run down or up, an arch, a valley, janta (each swara doubled: S S R R G G), a zigzag of skips (dhatu: S G R M G P), or circling one swara.
  - **Creativity.** Low creativity leans on runs down (Field 2018); higher creativity brings janta, zigzags and rising lines.
  - **The cadence.** The mora statements and the uttaranga still close on a run down into the landing.
  - **Rules.** The line is still built from its ending, so it always arrives. A move the direction rule forbids becomes a smaller or larger move, the opposite move or a repeated swara.
  - **No swinging between two swaras.** The old fallback (the opposite move, at the top of the range or against the direction rule) made lines bounce between two swaras (Ṡ Ṙ Ṡ Ṙ Ṡ, Ḋ Ṡ Ḋ Ṡ), above all in pentatonic ragas. A line now refuses a move that makes A B A B or a third repeat of one swara, if any other legal move exists. Across the passage a pair swung five times (A B A B A) breaks a hard rule, and a single A B A B costs score. Over 60 khanda passages in the pentatonic ragas, A B A B fell from 1,595 to 18 and A B A B A from 1,046 to 0.
  - **Measured.** Over 12 khanda korvais × 3 creativities × 3 seeds, the mean run in one direction is 2.0 moves (the triangle ran about seven), and the cadence ends with a descent 96% of the time.
  - **Explanation.** The audit names each family's contours (`families[].shapes`), and the inspiration prompt asks for varied contours too.
- **Held swaras are rare, and at word ends** (`src/engine/kalpana/rhythm.js`). 0.8.5 held weak pulses at random: about 30% of syllables, scattered across the sollu words, so the korvai's groupings could no longer be heard. A first fix lengthened the end of every long word, which made the holds a predictable pattern of their own. Now a run of syllables is mostly sung continuously, and a held swara (a karvai) comes only now and then:
  - **How often.** About one for every 18 syllables in tisra, 14 in chatusra and 11 in faster gatis, by chance, so a phrase may have none, one or more. About 95% of syllables start a swara.
  - **Where.** Always at the end of a sollu word of three or more syllables (tha ka dhi mi → S R G ,), or now and then the second syllable of "tha dhi gi na thom" (the lab's own "tha , dhi gi na thom"). Places are drawn at random, leaning towards the phrase's end, at least six syllables apart. The words come from the sollu vocabulary: each run is split into the fewest words of up to five syllables, and `rhythmPhrases` now gives each phrase's `words`.
  - **Structure kept.** A family shares its held places, so repeated phrases and the mora statements keep one rhythm, and a yati's lines stay the ends of one line. Every word's first syllable and every phrase's last sound; the lab's own karvais and a trikaala's syllables are unchanged.
- **Honest labels.** A sequence or variation that could not move anywhere in the raga is reported as identical.
- **Tests.** The rhythm sweep checks that no pair of swaras swings five times (S R S R S) and that a four-note swing is rare. A contour test checks that all seven shapes are used, that lines turn (mean run under three moves, few runs of six or more) and that the cadence runs down into its landing. The rhythm sweep checks that every sollu word starts on a swara, that holds come only at word ends and at least six syllables apart, that repeated phrases share them, and that most syllables (86–97%) start a swara.
- **Prompt.** The inspiration prompt asks for the same: most syllables sung, a held swara now and then at a word end, never as a pattern.
- **Pages.** The Swaras menu reads "a few held swaras".

## 0.8.5

- **Breath: not every syllable needs its own swara** (`src/engine/kalpana/rhythm.js`). A continuous run of syllables (tha ka dhi mi tha) is the rhythm, not a demand for a new swara on every pulse.
  - **What always sounds.** A swara still starts on every phrase's first syllable, on the first pulse of the beat and its strong subdivisions (4 = 2 + 2, 5 = 2 + 3, 7 = 3 + 4, 9 = 3 + 3 + 3), and on a cadence's last syllable.
  - **Weak pulses.** These are often held from the swara before. The faster the gati, the more is held, and creativity adds a little density back.
  - **Sharing.** A family shares its breath, counted from the end, so repeats breathe alike and a yati's lines stay the ends of one line.
  - **Unchanged.** The lab's own karvais (the "D , ," at a phrase end) are kept. A trikaala keeps every syllable.
  - Over the test passages, about 70% of syllables now start a swara, and 83% of beats do. `density: 'full'` restores one swara a syllable.
  - The result reports `breath: { density, syllables, swaras }` and each phrase's `mask`.
- **Inspiration from a language model.**
  - **The prompt.** `rhythmPrompt(raga, template, { eduppuPitch | targetPitch, T })` (`src/engine/kalpana/inspire.js`) writes everything a model needs:
    - the arohana and avarohana and the direction rule;
    - the profile's resting, jiva, weak and avoided swaras, and up to eight attested phrases with their sources (from `data/raga-profiles.json` only);
    - the range;
    - the tala and gati, with every phrase of the rhythm beat by beat and its family (a yati, a repeat, the cadence);
    - the landing and the creativity;
    - the answer's JSON shape (`INSPIRATION_SCHEMA`): one token a syllable, a swara or a comma to hold.
  - **Reading the answer.** `parseInspiration` and `parseSwaras` (`src/engine/kalpana/sargam.js`) read the answer: JSON alone or inside other text, variant numbers (R2), and octave marks (S', P.).
  - **Singing it.** `kalpanaRhythm(..., { inspiration })` treats the answer as inspiration:
    - each suggested phrase is fitted to its rhythm (its own holds when it has one token a syllable, else spread over the engine's breath);
    - it is moved onto the raga, repaired to the direction rule, and keeps its fixed ending (the landing, a yati's shared ending);
    - it is sung only if the whole passage still keeps every hard rule;
    - phrases that do not fit are reported with the reason, and the engine's own phrase stays.
  - The engine stays pure: it never calls a model.
- **Server.**
  - `POST /api/kalpana/prompt` returns the prompt.
  - `POST /api/kalpana/inspire` asks Claude (`claude-opus-5-5`, structured JSON output, adaptive thinking, server-side refusal fallbacks `fallbacks: "default"`) through the official `@anthropic-ai/sdk`, loaded only on first use (`server/llm.js`). It then sings the rhythm with the answer.
  - Credentials: `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`). Without them the route answers 503 with an explanation.
  - `POST /api/kalpana` accepts `density` and `inspiration`.
  - API routes may now be asynchronous.
  - The SDK is the server's first runtime dependency; the engine has none.
- **Pages.**
  - **Playground** (no server, no key): the kalpana tab's lab banner has a Swaras density choice and an "Inspiration from an AI assistant" panel that copies the prompt and sings a pasted answer. Inspired phrases are underlined.
  - **App:** "Ask Claude for lines" and the same copy-and-paste fallback.
- **Tests.**
  - The rhythm sweep now checks that onsets are syllables, that phrase starts and cadence endings sound, that the breath is counted and that most beats sound.
  - New tests cover the breath, and the prompt, parsing and fitting of inspiration.
  - The server routes are tested with Claude mocked and without credentials.
  - Smoke and e2e cover the new controls.

## 0.8.4

- **A repeated rhythm is not a repeated melody** (`src/engine/kalpana/rhythm.js`). Before, phrases with the same rhythm were sung with the same swaras, so a korvai's statements came back note for note.
  - **Low creativity** keeps a phrase's melodic shape and starts it from another swara, as an alankara climbs the scale. Each occurrence follows a plan: a step lower each time (the Todi korvai's mora), a step higher, by thirds, an arch or a wave. Where a moved swara breaks the raga's direction rule, the projector's repair restores it, as for janya alankaras.
  - **Higher creativity** varies the repetitions: a new opening on the same ending, the contour turned upside down, or a fresh line to the same rhythm. Exact repetition is rare.
  - **A yati that comes back whole** (the purvanga of each of three statements) moves as one round. The round's line is shifted and repaired once, so every line keeps one ending. Above creativity 1 the lines' openings are re-sung too.
  - **Kept as they were:** a trikaala's three speeds (one phrase), and the cadence's last repetition landing next to the eduppu.
  - **Explanations:** each family's treatment is reported (`families[].how`) and shown in the playground's audit and the app's summary.
  - **Tests:** the rounds of a repeated yati differ (≥ 90%); sequences keep their scale shape in a sampurna raga (≥ 80%); at creativity 1.8 exact repetition is rare (≤ 15%); every earlier guarantee holds over 1,666 passages.

## 0.8.3

- **Kalpana swaras on a rhythm from the korvai lab** (`src/engine/kalpana/rhythm.js`).
  - **Handing over.** In the lab, "Sing it as kalpana swaras →" passes the chosen variation to the kalpana generator: in the playground it switches tabs, and in the app it opens #/kalpana. `rhythmTemplate(frame, layout)` holds every pulse, its role and where each phrase starts.
  - **Singing it.** `kalpanaRhythm(raga, template, { eduppuPitch | targetPitch, T, seed, karvai, melody })` sings that exact rhythm:
    - every swara starts where the lab put a syllable;
    - held syllables and the lab's gaps become karvais (or rests);
    - the span, the cadence and the landing are unchanged.
  - **Families from the syllables.**
    - Identical phrases repeat.
    - Phrases that are the ends of one longer phrase form a nested family: a yati, an AP, GP, Fibonacci-like, squares or kuraippu purvanga, a shaped mora.
    - A family is sung from one stepwise line that descends into a resting swara. Each member is the end of that line, so the shape is heard in the melody and every line keeps its ending (Field 2018: "the melodic contour in each unit usually descends").
    - Repeats are identical, or at higher creativity a sequence a step lower each time (Field's Todi korvai).
    - The three speeds of a trikaala share one line.
    - The cadence ends next to the eduppu.
  - **Hard rules:** the exact onsets, the raga's direction rule on every move, no hard-avoid phrase, no leap over a fifth inside a line or a sixth at a join.
  - **Where it runs.**
    - **Playground:** a banner on the kalpana tab, with Back to the lab and Stop following. The lab's tala, length, speed and ending are hidden while following; the audit explains each family.
    - **App:** `POST /api/kalpana` accepts `{ raga, rhythm, land, T, seed }`; `/api/render` allows up to 18 swaras a beat.
- **Explorer filters count what they would leave** (`exploreFacetCounts`). Each facet's values are counted among the variations matching every other active filter, as shop filters do, and values that would leave none are greyed out.
- **Tests.**
  - `test/kalpana-rhythm.test.js`: 1,679 passages from lab variations in five forms, four frames and seven ragas, checking exact onsets, the direction rule, the landing next to the eduppu, nested families as the ends of one line, and identical repeats; also the shapes in the melody, trikaala, determinism, and template errors.
  - The facet-count test.
  - The server route.
  - The smoke and e2e handoffs.

## 0.8.2

- **Explore every variation** in the korvai and tihai lab (`src/engine/korvai/explore.js`).
  - **What it covers.** `exploreSpace(frame, form, constraints)` enumerates the complete variations of each form under the learner's settings:
    - a mora's P, G, series (× 3, × 6, × 9, build-up) and shape, with half-pulse gaps;
    - a korvai's split, uttaranga, purvanga (the best of every kind first, so AP, GP, Fibonacci-like, squares, kuraippu and the yatis are never crowded out) and mora shape;
    - the three-statement korvais and how their remainder is handled;
    - the progressive korvais;
    - the tihais of tihais.

    Each variation comes in two sollu textures, the standard tadiginathom endings and takadhom endings with tha ri ki ta phrases. Each has facets to filter by.
  - **Creative, by the project's rule.** Every variation has a familiarity score F (the builders' own ranking) and a novelty score N (rare patterns, shaped moras, cross-rhythms, extreme balances, the second texture).
    - `exploreOrder` blends them, score = (1 − c)·F + c·N with c = T/2. It then spreads the leading 300 so each variation differs from the last few, the purvanga counting double.
    - `exploreSurprise` draws one at the dial's τ from a seed, avoiding what was seen.
    - Traditional starts on Balaji's 33 + 31; adventurous reaches for GP, kuraippu and squares purvangas with shaped moras.
  - **Hard rules intact.** `exploreRealize` builds every variation with the same plan builders, checked cell by cell; the second texture changes syllables only.
  - **The explorer in the lab.**
    - Previous and next, a variation number, and a jump slider.
    - 🎲 Surprise me.
    - A creativity dial and an order menu: by creativity, most familiar, most unusual, shortest, longest.
    - A filter per facet, with counts.
    - The current variation, with familiarity and novelty meters.
    - A list that suits the count: chips up to 12, a dropdown up to 80, and beyond that a searchable, paged list ("gopuccha 33 takadhom").
    - Shown in Build for every form but trikaala, and in the korvai and three-statement lessons. The mora and tihai-of-tihais forms gain "Any" constraints.
  - **Tests.**
    - `test/korvai-explore.test.js` checks:
      - that the spaces are complete, faceted and deterministic;
      - every variation of the smaller spaces and a spread of the large ones;
      - the dial's direction, neighbours that differ, the sorts, filters and surprise;
      - the second texture against the judge;
      - 2,062 explored variations over the 35 talas, all landing.
    - The smoke test steps, filters, sorts, searches and surprises in every form.

## 0.8.1

- **The korvai and tihai lab covers the Unit 3 notes** (MA375TGR *Mathematics of Music*, Unit 3 "Rhythm, Tala and Combinatorial Structures", `research/UNIT 3 Notes.pdf`; `docs/research/korvai-tihai.md` §8).
  - **Purvanga patterns** (`src/engine/korvai/patterns.js`):
    - AP, GP, Fibonacci-like (any two seeds; three terms only when truly Fibonacci), squares, polite numbers and kuraippu, each with its sum formula worked;
    - polite numbers by the odd-divisor recipe, (odd divisors − 1) runs and none for a power of 2;
    - `patternsFor(V)` finds every pattern that sums to V, and the korvai builder offers them all as purvangas.
  - **The six yatis:**
    - sama, srotovaha, gopuccha, mridanga, damaru (pippilika) and vishama, with any step and size;
    - the closed forms (2m + 1)a + dm² and (2m + 1)b − dm²;
    - `fitYati` solves for the first phrase to fill a span, and `classifyYati` names any list of lengths.
    - Gopuccha is now one phrase trimmed from the front (tha dhi gi na thom, dhi gi na thom, gi na thom …), and srotovaha grows it back, so the ending is never disturbed.
  - **Constructions** (`src/engine/korvai/compose.js`):
    - the notes' korvai of three statements, 3(P + U) = kN, with the length condition S ≡ 0 (mod N/gcd(N, 3)), unequal statements (21, 21, 22) or an eduppu absorbing the remainder, and the korvai type;
    - progressive korvais, r(mP + d·m(m − 1)/2 + mU) = kN;
    - the Samam algorithm (T(U) = (n − M) + kn) and the Edapu algorithm (the smallest m with 3 | mn + k, and why it fails when 3 | n);
    - Methods A and B for a new korvai with the same total;
    - tihai solution sets with half-pulse gaps, drawn at twice the resolution;
    - the chakkardar 9P₁ + 6G₁ + 2G₂;
    - drift (graha-bheda and nadai-bheda) by lcm and gcd.
  - **Syllables:**
    - mora statements of 6, 7, 8 and 10 use the slides' Thadhin,ginathom family;
    - the build-up uttaranga (1, 2, 3 statements, 6P + 2G) is a series form;
    - sounded kaarvais (Dhin, Dhinku …) are available on request.
  - **Lab.**
    - Fifteen lessons, up from nine. The new ones cover drift, the six yatis, purvanga patterns, three statements and progressive korvais, the Samam and Edapu algorithms, and the same total in a new korvai.
    - Existing lessons gain the build-up, half-pulse gaps, damdar and bedam, and the pure chakkardar.
    - Build adds korvai as three statements, progressive korvais and the chakkardar.
  - **Hearing the structure** (`web/shared/mridangam.js`: `arrange`, `playArranged`).
    - **Problem:** played one stroke a syllable at one level, a korvai was a stream of near-identical right-hand strokes, and its phrases could not be told apart.
    - **Phrases:** each one is realized on its own. Its first stroke is accented and doubled by a bass thom, and the strokes inside it are lighter.
    - **The cadence:** mora statements, uttarangas and mukhras open on tham, so the arrival of the cadence is heard. The closing syllable is a full tham.
    - **Phrase tones:** a soft pitched tone at each phrase start, an octave above Sa, rising 7·log₂(length / shortest) semitones on the Sankarabharanam scale. A gopuccha is heard falling and a srotovaha rising; a mridanga yati rises then falls; kuraippu halves in fifths; a GP climbs faster than an AP; equal statements repeat one note.
    - **Pitch:** the tones and the drum follow the playback Sa (C to B).
    - **Controls:** the lab's player has its own Sa, tempo and phrase-tone controls, in the playground and the app.
  - **CLI.** `korvai --form statements|progressive|chakkardar`, `--series buildup`, `--kind`, `--terms`, `--halves`.
  - **Performance.** Purvanga shapes are cached, and the korvai search scores every split quickly before searching patterns for the best of them.
  - **Tests.**
    - `test/korvai-unit3.test.js` reproduces every worked example and practice answer the lab computes, and checks 4,831 constructions over the 35 talas.
    - The CLI, smoke and e2e tests drive the new forms and all fifteen lessons.

## 0.8.0

- **The korvai and tihai lab** replaces the jathi creator in the playground and the app (`docs/research/korvai-tihai.md`). It is an educational tool for the arithmetic that makes a mora, a tihai or a korvai land, for any of the 35 suladi talas (and the chapu talas), any gati and kalai, from any start to any eduppu.
  - **Research.** J. Balaji, "Korvais in Karnatak Music – Improvisation through Training" (*Shanlax IJASH* 12(2), 2024; open access, read in full), for the jati table, trikaala, the series charts with their offsets, purvanga and uttaranga, yatis and the 1-2-4 rule. digitabla for Hindustani tihai counting (16 + 1 = 17), damdar and bedam, and chakradars. Raberg (*Berklee Today* 2017) and Nelson (via Field 2018) for the mora's rules.
  - **Engine** (`src/engine/korvai/`, `E.korvai`):
    - frames (`korvaiFrame`: pulses per avartanam, the space between start and eduppu, counting to the landing or on it);
    - every solution of 3P + 2G (and the series 6a + 2k, 9a + 2k);
    - learners' guesses with fixes (`checkMora`);
    - Balaji's offsets and charts;
    - shaped moras;
    - purvanga shapes (phrase (gap) × 3, gopuccha, srotovaha, mridanga, damaru, 1-2-4);
    - korvai plans with the 30–70 balance;
    - chakradars;
    - trikaala (full and both concert forms);
    - gati changes;
    - "played three times";
    - cell-by-cell layouts that check themselves;
    - export to JathiScript for the judge.
  - **Lab** (`web/shared/korvai-lab.js`, `.css`; shared by the playground, the research plan and the app):
    - one tala bar;
    - **Learn**, nine short lessons live for the chosen tala: the cycle in pulses, the mora, counting back from sam with Balaji's chart, every solution of a span, shapes and series, the korvai, the eduppu, trikaala, the tihai of tihais;
    - **Build**, every form with every solution listed, a playable tala grid with kriya and the cell lit, the worked steps and the checks;
    - **Check**, the jathi judge, with any built korvai written out in it.
  - **App.**
    - New page `#/korvai`; `#/jathi` redirects to it, and the jathi studio page is gone.
    - The nav reads Korvai lab and Judge; the glossary adds korvai, tihai, purvanga, uttaranga and trikaala.
    - The server serves `src/engine/` at `/engine/`, so the lab computes in the page.
  - **CLI.** `vocal-gym korvai --tala T [--form mora|korvai|chakradar|trikaala] …`, with `--script` to pipe into `judge`.
  - **Kept.** `jathi()`, its API route and the `jathi` command are unchanged (backward compatible); only the pages no longer show the generator.
  - **Tests.**
    - `test/korvai.test.js`:
      - all 264 entries of Balaji's four charts;
      - his worked korvais and trikaalas, and the digitabla chakradars;
      - 12,600 frames of the 35 talas × gati × kalai × spans × start and eduppu × counting, laying out 113,064 moras, 14,735 korvais and 1,640 chakradars cell by cell;
      - 4,653 exported scripts passing the jathi judge's gate.
    - The CLI and server tests cover the new command and route; the smoke and e2e tests drive every lesson and form.
- **Kalpana: fewer sustained notes.**
  - The phrase-end karvai is now one slot (two in a long phrase at four a beat), and about a third of inner phrase ends flow on.
  - Sustained swaras fall from 25–28% of a round to 14.5–19.7%, against 13.3% in the attested phrases.
  - In the playground, a whole session is drawn one round at a time, each at its own speed, with the composition's line as a divider between rounds.
- **Playground redesign.**
  - Tabs with subtitles.
  - A one-line sound bar that opens to change Sa, tempo, drone, voice, gamaka and sollus.
  - The essential controls first, the rest under More options.
  - Presets as chips.
  - Checks folded under Why this is correct.
  - Clearer buttons.
  - The pages now declare UTF-8.

## 0.7.0

- **Kalpana rounds with structure** (kalpana engine v0.4; `docs/research/kalpana-structure.md`, `docs/plans/kalpana-v0.4.md`).
  - **Problem:** rounds were note-to-note idiomatic but sounded like "a soup of notes" with "huge random jumps". 8.1% of the joins between devices leapt three or more raga steps, 1.7% an octave, and nothing grouped the devices into phrases.
  - **Research:** Sambamoorthy (*South Indian Music* Book IV), Field (*AAWM* 2018, with its transcriptions, and 2024), Vidya Subramanian's essay, and Morris (*AAWM* 2011).
- **Joins.** A move into the next device may step, skip a third, or make a move the raga's attested phrases make.
  - A phrase that starts after a held swara may restart up to a fifth away.
  - An octave join only echoes the phrase's focal note.
  - Mora statements restart within a fifth.
  - Unattested jumps inside a phrase: 0. Octave joins: 0, except the echo.
- **Phrase plan** (`src/engine/kalpana/phrases.js`).
  - Rounds are planned as tala-shaped phrases (`opts.angas`; about half an avartanam of Adi), each ending on a held swara the raga rests on.
  - Each phrase group has a focal note that moves across the round and ends on the landing.
  - Each phrase has a contour, descending by default.
  - A per-phrase lookahead keeps the focus reachable. At T 0 about 70% of phrases end on their focal note (84% within a step), and 84% of karvais end a unit, against 50% before.
  - New restart cells open phrases; the focal echo restarts on the focus an octave away.
- **Repetition.** Initial rhymes, sequences a raga step lower, and end rhymes moved to the new focus. 76% of rounds at T 0 repeat or design something.
- **Designs.**
  - Gopuccha and srotovaha yatis onto the phrase's focus.
  - Timed moras `expand` and `contract`: the same swaras, statements of u, u + 1, u + 2 slots or the reverse, after Field and Nelson.
  - `ending: 'korvai'`: three descending units, each a run with shrinking rests and a mora, after Field's Todi korvai. It falls back to a mora, then a free ending.
- **Sessions.** `kalpanaSession(raga, opts)`:
  - first speed ½, 1 and 2 avartanams, favouring the raga's phrases (`pidi`);
  - second speed 1 and 2;
  - a koraippu of 1, 1, ½, ½, ¼, ¼ around one focal note;
  - a final korvai.

  The focus climbs across the rounds, and every round lands next to the eduppu.
- **Interfaces.**
  - CLI: `--session`, `--ending korvai`, `--mora-style expand|contract`, `--phrases off`, and a "Phrases:" line.
  - Playground: a Scope select (one round or a whole session, laid out on the tala grid with a cycle of the theme between rounds), the korvai ending, the new mora styles, and the phrase plan in the audit.
  - App server: `/api/kalpana` passes the tala's angas and accepts `korvai`.
- **Compatibility.** Every v0.3 guarantee holds. `opts.phrases: false` gives a v0.3 round (with the join rule). Rounds too short for a plan, or infeasible with one, fall back to the v0.3 sampler; the leap filter's last level lifts the join rule, as before.
- **Other changes.**
  - The unresolved-leap penalty rises from 0.6 to 1.0, and the lone skip is a less familiar filler.
  - The gamaka overshoot cap is 0.22 semitone (was 0.25), so long held swaras stay inside the ±0.3 band with drift.
- **Tests: 65.**
  - New `test/kalpana-structure.test.js`: joins, plan, focal ends, repetition, yatis, korvai and session over the 86 ragas.
  - Timed-mora arithmetic in the mora test.
  - The karvai a planned phrase adds is allowed for in the phrase test.
  - The smoke test covers the plan text, the korvai and the session scope.

## 0.6.0

- **What the research folder adds to the gamaka renderer** (`docs/research/gamaka-papers.md`). Eight papers, now sources S204–S211:
  - M. Subramanian 2009 and 2012;
  - Pearson 2016;
  - Nuttall, Serra & Pearson 2024 and 2025;
  - Krishna & Ishwar 2012;
  - Srikumar K. Subramanian's 2013 thesis and the 2012 two-component paper.
- **Timing.**
  - A swing between two turns takes at least 50 ms a semitone, up to 160 ms (S210).
  - An oscillation cycle is never shorter than 250 ms (S205), so fast notes get fewer cycles, not faster ones.
  - The dwell side of a kampita is an anchor. A long note's spare time slows it, up to 500 ms a cycle, before the holds lengthen (S205's "remains at a lower note … and moves up in spurts").
  - Short peaks of deep oscillations overshoot by 25 c a semitone of depth beyond one, in the sung contour; the targets keep their raga pitch (S210).
  - New constants: `SEMITONE_SEC`, `LEAP_MAX`, `CYCLE_MIN`, `CYCLE_MAX`, `ANCHOR_SHARE`, `PEAK_CENTS`, `PEAK_SHORT`, `VOICE_GLIDE`.
- **Coarticulation** (`coarticulate` in `resolve.js`).
  - An oscillation starts on the turn where the previous swara left the voice, with no detour to its own pitch (S206, S208, S210 §6.3.4).
  - Rising to a swara its upper turn reaches, it touches that swara once more before it settles (S209).
  - Each note's `why` says so.
- **Grammar.**
  - G2 (R1, D1) rests on S and P and rises to the swara (S205, S207).
  - New G3c: N3 and M2 next to S and P are a kampita close to them (S209). It yields to the whole-tone rule, so D2 N3 S still gives D2 the gamaka and N3 none, as R2 G3.
  - New G4m: M1 rising from G3 to P is sung G3 P G3 (S209, S205, S203). Sankarabharanam *g m p* now prints `M~(G–P)`.
- **Data.**
  - Todi's ga and ni turn at the R2 and D2 positions (`-100c`, measured and off the scale), with Pearson's wide schema (to M, rising or held) and narrow schema (S206; S201 agrees).
  - Mayamalavagowla's ri rests on S (S205).
  - Off-scale turns print with a star (`G~(R₂*–M)`), and rendered notes carry `offScale`.
- **Expression layer** (`src/engine/gamaka/expression.js`, exported as `gamakaExpression`). `renderGamaka` returns `expression: { phrases, notes, gain }`:
  - phrases, with breaths between phrases sung without a rest;
  - stress on the samam, anga starts (new options `per`, `cycleBeats`, `angaStarts`), phrase starts and long swaras;
  - a lighter swara after a gamaka (S209);
  - a loudness curve with phrase arches, swells, softer phrase endings and a long final release;
  - each swara's syllable.
- **Legato straight voice.** `renderGamaka(notes, { intensity: 0, voice: true })` sings straight notes legato with natural motion and no gamaka. Without `voice`, intensity 0 is still the stepped contour.
- **The sung voice** (`web/shared/voice.js`, `docs/research/expressive-voice.md`), replacing the triangle and oscillator tones for kalpana and alankara.
  - **Synthesis:** a source–filter voice computed per harmonic, with vowel formants (F1 tuned above the pitch) and a brightness that follows loudness.
  - **Texture:** breath noise, jitter and shimmer.
  - **Onsets:** sung on "aa", or on the swara names with consonants placed before the beat.
  - It is deterministic, and in tune within 15 cents in the tests.
  - **Playground:** a "Voice" select (Sung on "aa", Sung swara names, Simple tone); the gamaka slider now applies to alankaras; Download WAV uses the voice.
  - **App:** Voice and Gamaka transport controls; the kalpana, alankara and home sample are sung with the raga's gamaka through the new `POST /api/render`. The app had plain tones before.
  - **Node:** `scripts/render-wav.js --timbre aa|swaram|tone`. `vocal-gym kalpana --contour json` adds `groups` and `expression`, and `--voice` gives the legato straight voice. The listening kit keeps the tone its protocol describes.
- **Fixes.**
  - The truncated-inflexion rung (`cycles = 0.5`) produced one and a half cycles and could never fit; it is now a single turn.
  - An oscillation flowing in on its resting turn could collapse into a hold that never sounded the swara; flowing in now always makes a whole cycle.
- **Tests: 60** (2.64 million checks), with new and updated suites:
  - `test/voice.test.js`: determinism, level, tuning by autocorrelation, consonant closure, fades, the JSON path;
  - `/api/render` in `test/server.test.js`;
  - two new gamaka tests, for the papers' rules and for the expression layer and legato voice;
  - golden case 10 and the grammar tests updated for Todi's R2-position turn, G3c and G4m;
  - the smoke test checks the sung buffer on both pages and keeps the simple-tone checks.

## 0.5.0

- **Natural gamaka.** v0.4 gamakas sounded mechanical. `docs/research/gamaka-naturalness.md` records why, from pitch-track and singing-synthesis research (S193–S195, and new S200 Saitou et al. and S201 Krishnaswamy). It also specifies the fix:
  - Stationary points are rounded turns, not 60 ms plateaus.
  - Moves take about 80–130 ms depending on the interval. A boundary costs only the distance the voice travels.
  - Each turn's reach and each move's timing vary slightly (seeded), and the variation yields whenever time is short.
  - The voice overshoots a little on arriving at a held note and prepares before leaving it, with a few cents of slow drift and fine flutter.
  - A truncated inflexion (one turn) is a new ladder rung before a gamaka is dropped. Swaras held plain stay inside the ±0.3-semitone constant-pitch band.
- **Gamaka intensity dial.** `renderGamaka(notes, { intensity })`, 0–1.
  - It decides which gamakas are sung (raga-identity rules first, the generic default only from about 0.5), how far they reach (from 60% up to the full raga notes) and how many cycles they offer.
  - 0 is straight notes. About 0.55 is performative, with the most natural variation. 1 is heavy and accurate: every rule at full reach on the raga's notes, the medium default on unmentioned swaras, longer gamaka chains and no jitter.
  - `depth` is deprecated: alone, it is read as the intensity. `natural: false` (or `buildContour` without `natural`) reproduces the v0.4 contour.
- **Demo.** A 0–100 Gamaka slider (default 55, remembered; the old off/light/full setting is carried over) replaces the select. Playback adds loudness that follows the pitch, a softer swara articulation (12% instead of 25%), 16 harmonics and a third formant. Download WAV uses the slider's level.
- **CLI.** `--gamaka` takes 0–100 or `off`, `light` (30), `performative` (55) and `full` (100). `--contour json` reports the intensity. `scripts/render-wav.js` matches the demo voice.
- **Swara-specific gamaka (the swara grammar),** replacing the light generic swing that every data-less note got (`src/engine/gamaka/grammar.js`, `docs/research/gamaka-grammar.md`).
  - Sources: R. Vedavalli's Music Academy lecture-demonstration on gamakas (S202) and Schachter's *Structural Levels in South Indian Music* (MTO 2015, after Powers; S203).
  - The rules, per swara, read the raga's scale around the note, where the phrase goes next, and the duration:
    - S and P plain;
    - R1 and D1 into S and P;
    - a swara a semitone below the next held straight (R2 before G2, D2 before N2, G3 before M1, N3 before S), unless an augmented second lies below it, in which case it rises into that neighbour;
    - a swara with a whole tone above oscillating toward where the phrase goes;
    - long notes a kampita, middling notes one swing, quick notes a single touch;
    - one of two adjacent oscillating svaras held flat, unless they split outwards.
  - **R2 then G2 gives R2 straight and G2 with gamaka; R2 then G3 gives R2 with gamaka and G3 straight.** The same pairing a fifth up holds for D2 and N.
  - Rules marked `text-vague` ("takes gamaka") now take their shape from the grammar. Specific raga rules still take precedence and win adjacency contests.
  - New sourced Kambhoji rules (S203): R slides toward G and flicks down; M oscillates between G and P.
  - Pitch-view tooltips name each decision's rule, reason and source, and `notes[i].grammar` exposes the rule id.
  - Tests: a new swara-grammar test over every data-less raga with the relevant swaras, and plan test 15 rewritten for the grammar.
- **Synthesized mridangam for jathi playback,** replacing the generic drum hits (`docs/research/mridangam-synthesis.md`).
  - `web/shared/mridangam.js`: ten strokes (thi, tha, ta, thom, num, dhin, dheem, tham, cha, bheem; plus Mi and gumki), each up to 20 decaying partials and 1/3-octave noise bands.
  - Calibration: fitted and iteratively calibrated against the CompMusic Mridangam Stroke Dataset (measured only; no audio shipped), by `research/calibration/mridangam/`.
  - Tuning: every frequency is a ratio to Sa, with chapu on Sa as on a tuned mridangam. The thoppi bass glides down as measured.
  - Sollus to strokes: realized group by group (Karya's standard realizations, then a default stroke per syllable).
  - Accuracy: the nearest real stroke type is the right one for 25 of 45 synthetic strokes across five tonics, against 6 of 45 for the old hits (the same test on single real strokes: 86%).
  - Rendering: strokes render in the background per Sa, about 0.1 s each.
  - Controls: "Sollu voice" (demo) and "Sollus" (app) offer mridangam (default), recorded syllables, or syllables with mridangam.
  - `scripts/mridangam-wav.js` renders strokes or a sollu line to WAV.
  - Tests: realization, determinism, Sa tracking, thoppi glide, decays, and background preparation.
- **Recorded sollus for jathi playback.** No freely licensed recordings of individual solkattu syllables exist online. The one CC0 konnakol clip (Freesound) is a single phrase, and the IIT Kharagpur sollukattu set is all rights reserved. So this release adds the means to record them.
  - `docs/solkattu-recording.md`: how to record the 28 syllables the jathi engine uses, in order, on a phone, and how the speaker's licence is stored.
  - `scripts/solkattu-bank.js` (Node, no dependencies): reads WAVs (one session file or one file per syllable). It finds each utterance, keeps the 2 most typical takes, trims them a few ms before the consonant and 30 dB into the decay, level-matches and resamples them to 16 kHz, and writes 8-bit µ-law to `web/shared/solkattu-bank.js`, with a preview WAV to check by ear.
  - `web/shared/solkattu.js`: the voice. It handles any spelling or case through the engine's aliases, alternates takes, cuts each take at the next syllable, and falls back to the synthesized hit per syllable. It is used by the playground, the research plan and the app; the server now serves `web/shared` at `/shared/`.
  - Controls: "Sollu voice" on the demo pages and "Recorded sollus" on the app's jathi and judge pages, disabled while the bank is empty, as it ships.
  - Tests: µ-law, resampling, slicing a synthetic session (onsets within 20 ms, grouping, take choice, refusals), the voice, coverage of the jathi vocabulary, the committed bank, `/shared/` serving, and the smoke test.
  - Fixed while building it: frame times now use the real hop length, so a long recording no longer drifts by about 1 ms every 2 seconds.
- **Fixed.** A gamaka rung that fitted its note only within rounding could collapse the swara onto its onset pitch. This affected v0.4 too.
- **Tests.** Two new gamaka tests: the natural contour's timing, slope, anchor and rate guarantees at three intensities; and the dial's guarantees (0 is plain, gamaka never decreases with the dial, full is exact, the middle varies by seed, plain swaras stay in band, legacy options). The smoke test drives the slider and the loudness curve. 46 tests.
- **Not done yet.** As before, nothing has been tuned by ear in a listening session. `gamaka-naturalness.md` §4 lists the questions for one.

## 0.4.0

- **Gamaka rendering for kalpana playback** (`docs/plans/gamaka-audio.md`).
  - Data: `gamakaRender` rules transcribed from the gamaka text of 23 ragas (5 heavy, 6 medium, 12 light), each with a source and, where it needed judgement, an interpretation note for review. Seven gamaka research sources (S193–S199). Validated by `scripts/check-raga-profiles.js` and compiled to semitone offsets per raga; the other 63 ragas get a conservative light default.
  - Engine: `src/engine/gamaka/` and `renderGamaka(notes, opts)`. Swaras become CPN and STA targets on raga notes, joined by half-cosine transitions that keep their length in seconds. A degradation ladder lightens fast kalams. Rule choice by context, with overrides for the landing swara, wide leaps, long gamaka chains and mora consistency. Deterministic. It never changes the notes, and depth 0 is plain playback.
  - Demo: a Gamaka select (off, light, full), one continuous voice per legato group, a pitch view with per-swara rules and sources, a raga badge and Download WAV.
  - CLI: `--gamaka` marks, `--contour json`, `--bpm`; `scripts/render-wav.js` renders a WAV in Node.
- **Evaluation kit.** `npm run listening-kit` writes blind, seeded WAV clips, a response form and an answer key for an A/B idiom rating and a raga-identification test. `docs/research/gamaka-eval.md` has the protocol, the rule-review step, the analysis plan and the reasoning behind every constant.
- **Tests.** `test/gamaka.test.js` covers plan tests 1–16 and the kit, and the smoke test covers 17: 36 tests, 1,199,784 checks, about 15 seconds.
- **Not done yet.** The listening sessions, the musician review of the rules and the calibration against pitch-track data need people and data; until then no constant has been tuned by ear and the demo defaults to light gamaka.

## 0.3.1

- **Kalpana swaras: no more erratic jumps.** Rounds could open S → N (11 semitones) straight into a phrase fragment, or drop a seventh, because a leap onto any resting swara counted as licensed and the jump into a phrase was never measured.
  - A resting swara now licenses a leap only up to a fifth.
  - Leaps outside attested phrases are capped by a three-level filter: a fifth below T = 1.5 (the octave excepted), a major sixth above, relaxed a level at a time only when a short span cannot be filled.
  - A first-order idiom model learned from each raga's attested phrases and scale: moves the raga never makes cost familiarity, and so does leap size beyond a major third and the distance of a jump into a phrase. These idiom terms keep at least half their weight at every temperature.
  - The same scoring applies to mora statements.
  - Measured in the 32 ragas with phrases: 97% of moves follow the raga's idiom at T = 0 (85% before), 90% at T = 1 (78%); no leap wider than a fifth outside attested phrases below T = 1.5 in any raga; at T = 0 the 32 ragas have 30 leaps wider than a fifth, all inside attested phrases, against 125 before.
- **Tests.** A regression test for erratic jumps, including the reported Kalyani openings. 29 tests, 594,406 checks, about 15 seconds.

## 0.3.0

- **Raga profiles.**
  - `data/raga-profiles.json`: sourced swara roles, phrases, avoid lists and allied ragas for all 86 ragas, with its documentation, research notes, checker and tests.
  - `npm run profiles` validates it and compiles what the generator needs into `src/engine/data/profiles.generated.js`; the build recompiles it and a test fails when the committed module is stale.
  - `getProfile`, `setProfiles` and `getSource` in the engine.
- **Kalpana swaras: phrase-driven generation.**
  - Attested phrases, their 3–5 swara fragments and octave shifts become devices, weighted by source reliability, phrase type and confidence.
  - Out-of-the-box variants (phrases shifted along the scale; inverted fragments at T ≥ 1) count as novelty.
  - A phrase-share controller (target 0.70 − 0.20 T) keeps rounds predominantly characteristic. Generic devices, janta and dattu are scaled by the profile, holds are scored from its landing, nyasa and alpa swaras, and hard avoid lists are enforced.
  - Ragas without phrases fall back to the generic devices; `stats.profileCoverage` says which applies.
  - `allowExceptions` offers the documented direction-rule exceptions, whole.
- **Kalpana swaras: reasoned jumps.**
  - Leaps, including junctions between devices, are licensed (attested phrase, structural swara, fourth, fifth or octave, arpeggio at T ≥ 1), resolved and budgeted.
  - Below T = 1.5 the tritone, leaps over an octave, leaps onto alpa swaras and same-direction double leaps are excluded by the feasibility tables; a short span that becomes infeasible is rebuilt with the filter relaxed (`stats.relaxed`).
  - `stats.leaps`.
- **Kalpana swaras: landing next to the eduppu.**
  - New option `eduppuPitch`, the swara the composition resumes on. The round ends on its lower neighbour (rising into it) or upper neighbour (falling into it), never on it; `ending.approach` records which.
  - `eduppuNeighbours()`, and `kalpanaRound()`, which returns `{ error, code }` where `kalpana()` returns `null`.
  - `targetPitch` keeps its meaning and is deprecated.
- **Kalpana swaras: graded mora.**
  - Three similar statements, not identical ones: `shift` (one contour, a step nearer the eduppu each time), `gopuccha` (shorter each time) and `srotovaha` (longer each time), from attested or generic contours. `moraStyle: 'identical'` keeps the v0.2 mora.
  - `ending` gains `style`, `statements`, `direction`, `template` and `adjusted`; `ending.phrase` stays for old callers.
- **Interfaces.**
  - The generator moved to `src/engine/kalpana/` (`devices`, `leaps`, `landing`, `mora`, `index`); `src/engine/kalpana.js` re-exports it.
  - CLI: `--eduppu-swara` (with `--land` as a deprecated alias), `--mora-style`, `--allow-exceptions`; phrase sources, phrase share, leaps and mora style in the output.
  - Demo: "Composition resumes on" and "Mora style" controls, phrase colours with sources, and the phrases, leaps and mora in the audit.
- **Tests.** 28 tests and 593,940 checks, including the plan's acceptance tables (printed as diagnostics), a golden mora and `test/kalpana-phrases.test.js`. The smoke test checks the new controls and times 100 rounds.

## 0.2.0

- **Alankaras.**
  - The first pattern for each of the 35 talas now comes from the *35 Tāla Alankāra-s* sheet, verified note for note (ascending and descending first lines, row counts, and every line of 1.1 Chaturashra Dhruva).
  - "New pattern" generates patterns that never repeat the sheet line or an earlier variation for the same raga and tala.
  - Patterns are drawn by exact sampling, with a familiarity model learned from the sheet. When sampling cannot find an unseen pattern in a tiny tala, every legal pattern is enumerated.
- **Temperature is creativity.** Every generator scores choices as `(1 − c) · familiarity + c · novelty`, with `c = T / 2` and a sampling width that never reaches zero.
- **Kalpana swaras.**
  - Rounds are built from named conventional and unconventional devices.
  - Optional mora endings: three identical statements with equal gaps.
  - Creativity statistics per round.
- **Jathis.**
  - JathiScript, a deterministic text format.
  - A judge with a correctness gate (span and landing, opening at the eduppu, nothing after the landing, bars, a teermanam with equal gaps), six craft aspects and computed fixes.
  - Chapu talas, atita eduppu, end-at-sam landing, and sama, mridanga and damaru yatis in the generator.
  - Generated jathis export to JathiScript.
- **Repository.**
  - The engine split into ES modules.
  - node:test suite (449,886 checks).
  - Command line tool.
  - Page build with esbuild into self-contained HTML.
  - jsdom smoke test.
  - Playground page.

## 0.1.0

- Single-file engine with the 72 melakartas, 14 janyas, 35 talas, alankaras from formulas in the laghu length, a single-swara kalpana sampler and a jathi generator.
- The formulas matched the later-supplied sheet in only 17 of 35 talas; see README section 20.
