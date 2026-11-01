# Plan: kalpana rounds with structure (v0.4)

**Status:** implemented in v0.7.0 (engine kalpana v0.4), in five phases, each checked with `npm run check`.

- **Why:** the feedback was that rounds "fail to have a structure (with respect to tala or natural raga structure)", sound like "a soup of notes", and make "huge random jumps".
- **Research and diagnosis:** `docs/research/kalpana-structure.md`.
- **Approval:** the five steps of its §6 were approved as written ("implement all of this step-by-step").

**Read first:** `docs/plans/kalpana-v0.3.md` (devices, reachability, scoring, mora), `src/engine/kalpana/index.js`, `docs/research/kalpana-structure.md` §3 (the rules, with sources).

## Rules kept

Hard rules stay in the feasibility tables and taste in the scores (`CLAUDE.md`):

- **Hard:** exact length, the raga's direction rule, range, the landing next to the eduppu, the leap filter, and the new join rule and phrase plan.
- **Soft:** the focal note, the contour, repetition and designs. They are scores that keep half their weight at T 2, like the raga idiom, so creativity varies the structure but does not dissolve it.
- **Fallback:** a round tries the phrase plan first at each leap-filter level, then the round without a plan. Level 0, the last resort for very short spans, lifts the join rule as it lifts the leap filter, so a round that v0.3 could make is still made.
- **Determinism:** every random draw comes from `rng(seed)`.

## Phase 1: joins

A join is the move from one device into the next.

- **Rule.** A join may step, skip a third, or make a move the raga's attested phrases make (the same swara, the same signed interval).
- **Where it applies:** a generic cell's first move; a phrase device's entry, both in the reachability tables and in the sampler; the entry into the mora; and the restart of each mora statement after its gap (up to a fifth, never an octave).
- **Side effects:**
  - The unresolved-leap penalty rises from 0.6 to 1.0, since the third is now the usual leap left.
  - The lone "skip" cell is a less familiar filler (F0 −0.3).

## Phase 2: the phrase layer (`kalpana/phrases.js`)

**The plan.** `planPhrases(slots, per, angas, c, rand)` divides the round into phrases of about half an avartanam of Adi (8 slots at 2 a beat, 12 at 4), with these properties:

- boundaries fall on anga starts (`opts.angas`, Adi `[4, 2, 2]`);
- at higher temperature a boundary may move an akshara (counter-beat);
- each phrase is `{ a, e, r, next }`: devices fill `[a, e)`, the swara sung at `e` is held for the karvai `r`, and the next phrase starts at `next`.

**The tables.** The reachability tables follow the plan:

- devices do not cross `e`;
- the held swara links `e` to `next` (and is never alpa, nor a swara the raga avoids resting on);
- a phrase's first device uses the looser join, which may restart up to a fifth;
- the new restart cells (`restart2`–`restart4`: leap away, then run back) are open only there.

**Focal notes and contours.** `focusPlan` gives each group of one or two phrases a focal note from the profile's nyasa, landing and jiva swaras, plus S and P:

- the focus moves on by one structural swara per group;
- the last group's focus is the landing (or the mora's first swara);
- each phrase gets a contour: descending by default, rising or arched when it must climb to its focus.

**The sampler scores** (on a structural term weighted `1 − c/2`):

- distance from the contour's expected position;
- ending on the focus (+2.4), or next to it (+0.7);
- karvais away from phrase ends (−0.6);
- the **focal lookahead**: a per-phrase backward table of the states that can still end the phrase on its focus (+0.9).

**The focal echo.** A phrase that ended on its focus may restart on the same swara an octave away. This is the only octave a join may make.

## Phase 3: repetition

Candidate devices are built at sampling time from the phrase just sung, and kept only when legal there and finishable (the backward table):

- **initial rhyme:** its first 3–5 swaras, at a phrase start (+2.0);
- **sequence:** the whole phrase one raga step lower, at a phrase start (+2.2);
- **end rhyme:** its last 3–4 swaras, moved to end on this phrase's focus (+2.0).

There is at most one echo per phrase.

## Phase 4: designs

- **Yatis.** Gopuccha (shrinking) and srotovaha (growing) runs onto the phrase's focus, lengths `L … 2` with gaps of 0–1 slots (1–2 at 4 a beat).
  - A yati must end its phrase.
  - At most one per round, on offer in two rounds of five (`opts.yati`, default 0.4).
- **Timed moras** (`expand`, `contract`, in `auto` too). The shift mora's swaras with statements of u, u + 1, u + 2 slots, or the reverse. Holds go on the first and second swaras, never on the last, so the gaps stay equal.
- **Korvai** (`ending: 'korvai'`, `korvaiOptions` in `mora.js`), after Field 2018 Ex. 3.
  - Each of the three units is a descending run held with rests that shrink (ρ + 1, …, 2 slots a swara), then a mora of the run, the run a step lower and two steps lower, with one-slot gaps.
  - Units descend a step each, the last ending on the landing.
  - It falls back to a mora, then a free ending, when it does not fit (rounds of 24 slots or more).

## Phase 5: sessions (`kalpana/session.js`)

`kalpanaSession(raga, opts)` returns the order a performer follows:

| Part | Rounds (avartanams) | Speed | Notes |
| --- | --- | --- | --- |
| First speed | ½, 1, 2 | 2 a beat | `pidi` 1: more attested phrases |
| Second speed | 1, 2 | 4 a beat | |
| Koraippu | 1, 1, ½, ½, ¼, ¼ | 4 a beat | one focal note |
| Korvai | 2 | 4 a beat | optional |

- The focus climbs across the first- and second-speed rounds.
- Every round lands next to the eduppu.

**Interfaces:**

- **CLI:** `--session`, `--ending korvai`, `--mora-style expand|contract`, `--phrases off`.
- **Playground:** Scope "Whole session", laid out on the tala grid with a cycle of the theme between rounds; the korvai ending; the new mora styles.
- **App server:** `/api/kalpana` passes the angas and accepts `korvai`.

## Tests

`test/kalpana-structure.test.js`:

- **Joins:** every join larger than a third is attested, a restart within a fifth after a held swara, or the focal echo.
- **Plan:**
  - devices stay inside phrases, and held swaras are ones the raga rests on;
  - at T 0, more than 55% of phrases end on their focus and 75% within a step.
- **Repetition and yatis:**
  - rhymes and sequences are what they claim to be;
  - yati statements shrink or grow by one onto the focus;
  - more than half of the rounds at T 0 repeat or design something.
- **Korvai:** three units, each a step lower, landing next to the eduppu.
- **Session:** the parts in order, every round exact and landing, the focus climbing, one koraippu focus, deterministic.

`test/kalpana.test.js` also checks the timed mora arithmetic, and `scripts/smoke.js` the playground's plan text, korvai and session.
