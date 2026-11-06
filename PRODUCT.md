# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

An installable web app (`app/`, served by `server/`), used on phones and desktops. It also has static pages built from `web/` into `site/`.

## Users

**Primary: Carnatic vocal students who learn with a teacher,** practising alone between classes. They know the basic terms (swara, raga, tala) and want material to practise each day and notation they can trust. When needs conflict, this person comes first.

Secondary: their teachers, and other Carnatic singers. The README names "Carnatic vocalists and their teachers".

## Product Purpose

Vocal Gym is a daily practice system for Carnatic singing. It gives a student something to practise today in any raga and tala, lets them hear it sung, and keeps a record of the practice.

Success has two stages. First it must succeed as a semester project (MoM EL). After that it continues as a real product for singers, where success means singers keep practising with it.

## Positioning

**The daily practice room:** one place for the whole routine, from warm-up through exercises and repertoire to the log and streak.

What backs the claim, and what a neighbouring app could not truthfully copy:

- Generated exercises and kalpana swaras cannot break the rules of raga or tala. This is a hard guarantee of the engine, not a score.
- The repertoire is a large, checked notation library that a singer can read, hear and correct, and it shows what was changed and why.

## Operating Context

- A student alone, between lessons, often singing while reading the screen, often on a phone.
- A session has this shape: pick a routine or a tool, set raga, tala and speed, listen, sing along, and log it. The timer runs in a bar across the tools.
- The teacher remains the authority. Notes such as "my teacher sings R here" are a normal reason to change a line, so a singer's corrections stay in their own copy, with a log they can undo.
- During the semester project, the app is also shown and judged in demonstrations and reports.

## Capabilities and Constraints

**Works today:**

- Alankaras in all 35 talas and 86 ragas, kalpana swara rounds, the korvai lab, the melakarta explorer, and the jathi judge
- Practice routines, sessions, a log and a streak, with accounts
- A repertoire of 1,549 compositions on the tala grid, each with sahitya and sung playback with gamaka
- Notation corrections with a log, octave checks, and geetham meanings

**Planned and not built, so never present these as working:** Voice Check, pitch tracking, raga conformance feedback, and the personal voice model. They are specified in `web/research-plan/index.html`.

**Technical constraints:**

- Plain ES modules in `app/`, with no framework
- `src/engine` is dependency-free and browser-safe
- Accounts need Node 22.13 or later (`node:sqlite`)
- `site/` is generated: edit `web/` and `src/` instead

**Terminology:** use the singer's words: raga, tala, swara, kalpana swara, sahitya, karvai, anga, sangati, gamaka. The app explains them in place and in Learn.

**Undecided:** pricing, licensing (`package.json` says UNLICENSED), and public deployment.

## Brand Commitments

- The name is Vocal Gym, and the app has its own logo and install icons (`scripts/make-icons.js`).
- The voice is plain, direct English that says what something does and is honest about its limits.
- The site is written for singers. Dancers are not addressed there, though the jathi tools remain.

## Evidence on Hand

- The engine's test suite, and the properties it checks (`npm test`)
- `docs/repertoire-status.md`: 88% of compositions with notation carry no error mark, and 98.4% of lines. This measures tala fit, not musical correctness, so never present it as an accuracy figure.
- `docs/octave-review.md`: 933 octave questions, with their accuracy not yet measured
- `docs/research/` and `data/raga-profiles.json`: sourced raga knowledge
- `web/research-plan/index.html` and `web/pitch/`: the plan and pitch
- Notation sources: Carnatic Music Notations (Balaji J., "free for anyone to download and use") and the Gurukulam geetham notes (used with their permission)

**Absent, and not to be fabricated:** testimonials, user counts, retention figures, teacher endorsements, and blind ratings by teachers. The research plan proposes those ratings, but they have not been done.

## Product Principles

1. **The student's next practice comes first.** Getting from opening the app to singing should be short. Everything else supports that.
2. **Rules are guarantees, and doubts are stated.** What the engine guarantees is exact. What it only suspects, such as a possible octave slip, is asked as a question, and nothing changes the notation unasked.
3. **The teacher stays the authority.** The app supports what a student learns in class. It never overrules it, and it leaves room for how their teacher sings.
4. **Say what is true today.** Show what works now. Keep planned features and unmeasured numbers out of any claim, in the app and in a demo.
5. **Worth returning to tomorrow.** The routine, log and streak are the product, not extras, so each session should make the next one easier to begin.

## Accessibility & Inclusion

Keep the reduced-motion fallbacks (`CLAUDE.md`, `DESIGN.md`). Tags that explain something must open a note rather than rely on a tooltip, because a phone never shows one. No formal standard has been set.
