---
name: Vocal Gym
description: The daily practice room for Carnatic singers, built as a kolam threshold where a tala's beats are dots and the music draws one closed line around them.
colors:
  red-oxide-floor: "#6b2315"
  stone-well: "#150e0a"
  kadappa-stone: "#1d1410"
  kadappa-raised: "#2d2019"
  kadappa-high: "#3f2d23"
  rice-flour: "#f7f2e7"
  flour-soft: "#e6dccb"
  flour-muted: "#d3c5b0"
  turmeric: "#e8ae2d"
  turmeric-high: "#f3c04e"
  turmeric-ink: "#1a1108"
  verdigris: "#6cc6b8"
  sandstone: "#eeb9a0"
  laterite: "#f6a18e"
  fault: "#ffa391"
  line: "rgba(245,240,228,.15)"
  line-strong: "rgba(245,240,228,.32)"
  limewash-floor: "#f4f3e9"
  limewash-well: "#fbfaf2"
  limewash-slab: "#dedfd0"
  limewash-raised: "#d1d2c2"
  limewash-high: "#c3c4b3"
  lamp-ink: "#2c120b"
  lamp-ink-soft: "#4c2a1f"
  lamp-ink-muted: "#5b3a2e"
  kaavi: "#8c2f18"
  kaavi-high: "#a53a1f"
  kaavi-ink: "#fdf9ef"
  verdigris-day: "#0f655c"
  sandstone-day: "#6e3a22"
  laterite-day: "#9e3a24"
  ochre-day: "#7a5500"
  fault-day: "#a32814"
  line-day: "rgba(58,22,13,.15)"
  line-strong-day: "rgba(58,22,13,.36)"
typography:
  display:
    fontFamily: "Arima, Hind Madurai, Georgia, serif"
    fontSize: "clamp(2.6rem, 5vw, 4.7rem)"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "-.02em"
  headline:
    fontFamily: "Arima, Hind Madurai, Georgia, serif"
    fontSize: "clamp(2.3rem, 4.4vw, 3.6rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.01em"
  section:
    fontFamily: "Arima, Hind Madurai, Georgia, serif"
    fontSize: "clamp(1.6rem, 2.7vw, 2.2rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-.01em"
  title:
    fontFamily: "Arima, Hind Madurai, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-.01em"
  figure:
    fontFamily: "Arima, Hind Madurai, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "lnum"
  body:
    fontFamily: "Hind Madurai, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  lead:
    fontFamily: "Hind Madurai, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.55
  action:
    fontFamily: "Hind Madurai, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.55
  label:
    fontFamily: "Hind Madurai, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: ".78rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: ".04em"
  swara:
    fontFamily: "Hind Madurai, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tnum"
  code:
    fontFamily: "ui-monospace, Cascadia Mono, Menlo, Consolas, monospace"
    fontSize: ".84rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0"
  hairline: "1px"
  sm: "2px"
  stone: "3px"
  dot: "50%"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
  target: "44px"
  tile-band: "12px"
  gutter: "24px"
  page-max: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.turmeric-high}"
    textColor: "{colors.turmeric-ink}"
  button-primary-big:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "56px"
  button-play-playing:
    backgroundColor: "{colors.rice-flour}"
    textColor: "{colors.kadappa-stone}"
    rounded: "{rounded.sm}"
    height: "44px"
    width: "118px"
  button-default:
    backgroundColor: "transparent"
    textColor: "{colors.rice-flour}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-default-hover:
    backgroundColor: "{colors.kadappa-raised}"
    textColor: "{colors.rice-flour}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.rice-flour}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  input:
    backgroundColor: "{colors.stone-well}"
    textColor: "{colors.rice-flour}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  segment:
    backgroundColor: "{colors.stone-well}"
    textColor: "{colors.flour-soft}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
    height: "44px"
  segment-on:
    backgroundColor: "{colors.rice-flour}"
    textColor: "{colors.kadappa-stone}"
  chip:
    backgroundColor: "{colors.kadappa-stone}"
    textColor: "{colors.flour-soft}"
    rounded: "{rounded.sm}"
    padding: "7px 14px"
    height: "44px"
  chip-on:
    backgroundColor: "{colors.rice-flour}"
    textColor: "{colors.kadappa-stone}"
  nav-link:
    textColor: "{colors.flour-soft}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  nav-link-current:
    backgroundColor: "{colors.kadappa-raised}"
    textColor: "{colors.rice-flour}"
  stone-card:
    backgroundColor: "{colors.kadappa-stone}"
    textColor: "{colors.rice-flour}"
    rounded: "{rounded.stone}"
    padding: "24px"
  threshold-slab:
    backgroundColor: "{colors.kadappa-stone}"
    textColor: "{colors.rice-flour}"
    rounded: "{rounded.none}"
    padding: "28px 24px 24px"
  player:
    backgroundColor: "{colors.kadappa-stone}"
    textColor: "{colors.rice-flour}"
    rounded: "{rounded.none}"
    padding: "16px"
  notation-cell:
    backgroundColor: "{colors.kadappa-raised}"
    textColor: "{colors.rice-flour}"
    typography: "{typography.swara}"
    rounded: "{rounded.sm}"
    width: "34px"
    height: "38px"
  notation-cell-now:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.rice-flour}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  session-bar:
    backgroundColor: "{colors.kadappa-stone}"
    textColor: "{colors.rice-flour}"
    padding: "8px 24px"
---

# Design System: Vocal Gym

## Overview

**Creative North Star: "The Kolam Threshold"**

A tala's beats are the dots of a pulli kolam, and the music draws one closed line around them. A round that lands closes its line. The whole interface is the doorstep where that drawing is made: a polished red-oxide floor, rice-flour white for the line and the type, black kadappa stone for the slabs that hold the work, Athangudi tile bands where one region meets another, and turmeric for the live or primary thing. Daylight is the same house in limewash, with the line drawn in kaavi.

The kolam is an instrument, not decoration. Every kolam on screen states a number: this tala's beats, this score, these minutes. Most of the work sits directly on the floor, and stone appears only where something has to be held, such as the player, the settings, the session. Density is that of a practice sheet, with a 44px target on every control, so a singer can hit it while singing with a phone on a music stand.

The world refuses the dark-glass practice dashboard, stat tiles, cards of icon and heading, and a kolam used as wallpaper. It carries no glass, no decorative gradients, no glows and no rounded pills.

**Key Characteristics:**
- Red-oxide floor drenched edge to edge, with a fine painted grain; stone with its own grain above it
- One closed line per figure, driven by the audio clock, closing on sam
- Tile bands 12px deep as the only structural ornament
- Arima for names and figures, Hind Madurai for everything read or pressed, both self-hosted
- 2px corners on controls, flat stone, dots as the one recurring circle
- Practice first: name, player, notation and clock on the floor; prose after; settings on a threshold at the foot

## Colors

An earth palette taken from a Tamil house floor: fired oxide, ground rice, black stone, turmeric, with oxidised copper held back for one job. Tokens swap as a set between the two floors, so every rule below names a role and each theme fills it. The CSS names stay as shipped: the turmeric role is `--saffron`, the sandstone role is `--violet`, the laterite role is `--rose`, the verdigris role is `--teal`.

### Primary
- **Turmeric** (#e8ae2d, `--saffron`): the primary action of a region, the swara sounding now, the sam dot of every kolam, the focus ring. Its hover is **Bright Turmeric** (#f3c04e), and text on it is **Turmeric Ink** (#1a1108).
- **Kaavi** (#8c2f18, the same role on the limewash floor): primary action, sounding swara and focus in daylight, with **Bright Kaavi** (#a53a1f) on hover and **Kaavi Ink** (#fdf9ef) on it. Kaavi also fills `--flour`, so in daylight the kolam's line and its sam dot share one colour, and sam is told apart by size alone.

### Secondary
- **Verdigris** (#6cc6b8, daylight #0f655c, `--teal`): the double-speed underline beneath fast groups on a composition's grid. See the Double Speed Rule for what else still carries it.

### Tertiary
- **Sandstone** (#eeb9a0, daylight #6e3a22, `--violet`): sahitya syllables under the swaras, octave-question tags, unusual devices in the kalpana meter. Despite its CSS name it is a warm sand, never a violet.
- **Laterite** (#f6a18e, daylight #9e3a24, `--rose`): the off-cycle tag on a line.

### Neutral
- **Red-Oxide Floor** (#6b2315, `--bg`): the ground of every page, under a 600px painted grain.
- **Kadappa Stone** (#1d1410, `--surface`): cards, player, rail, lintel, footer, thresholds, session bar, under a 600px stone grain. This is also the install theme colour.
- **Stone Well** (#150e0a, `--bg-2`): the recess inside stone, for inputs, segments and the code editor.
- **Raised Kadappa** (#2d2019, `--raise`) and **High Kadappa** (#3f2d23, `--raise-2`): notation groups, hover fills, the current navigation link, raga key strips.
- **Rice Flour** (#f7f2e7, `--fg` and `--flour`): type, the kolam's line and every on-state. **Soft Flour** (#e6dccb, `--fg-2`) carries secondary text, **Worn Flour** (#d3c5b0, `--muted`) carries tertiary text.
- **Flour Hairlines** (rgba(245,240,228,.15) `--line`, rgba(245,240,228,.32) `--line-strong`): dividers between rows and borders on quiet controls.
- **Limewash** (#f4f3e9 floor, #fbfaf2 well, #dedfd0 slab, #d1d2c2 raised, #c3c4b3 high): the daylight floor and its pale slabs. Slabs here are grey-green limewashed stone, not black.
- **Lamp Ink** (#2c120b text and on-states, #4c2a1f secondary, #5b3a2e tertiary), with hairlines at rgba(58,22,13,.15) and rgba(58,22,13,.36).
- **Fault** (#ffa391, daylight #a32814, `--bad`): errors and the delete card's border. **Ochre** (#7a5500, daylight `--warn`) marks warnings in the judge's gutter; in the dark theme warnings use turmeric.

### Named Rules
**The One Turmeric Rule.** A view has one filled turmeric control or live mark at a time, plus the sam dot, which is part of the figure. When a player is on the page, Play is that control and the session bar's primary drops to an outline. While it plays, Play turns to flour Stop and the sounding swara takes the turmeric. Hairlines may carry turmeric too: focus and hover edges, sam outlines in the notation, the dotted glossary underline, link underlines, the top edge of menus, popovers and the session bar. A goal-met day kolam draws its line in turmeric, so a week can show several; that is the one sanctioned repeat, and a toast is a brief turmeric fill.

**The Flour On-State Rule.** Where you are is flour, and what you can do next is turmeric. Pressed segments, chips and swaras, checked toggles, range sliders, the current page and the current section all use `--fg` with stone text. In daylight that value is lamp ink, not kaavi.

**The Double Speed Rule.** Verdigris means double speed, and no new use may be added. The build still carries older uses that are recorded, not endorsed: familiar devices and yati in kalpana and jathi displays, the judge's craft bars, the wave mark in the tala picture, the corrected-line tag and inserted text in the change log, the question mark's hover, and the korvai lab's tips, steps, meters and try-it labels.

## Typography

**Display Font:** Arima (with Hind Madurai, Georgia, serif), self-hosted variable 400–700
**Body Font:** Hind Madurai (with system-ui, Segoe UI, Roboto, sans-serif), self-hosted at 400, 500, 600, 700
**Label/Mono Font:** ui-monospace (with Cascadia Mono, Menlo, Consolas), a system stack for code and fixed-column notation

**Character:** Both faces are Tamil-made. Arima's rounded, brushed strokes sit close to a hand-drawn line, and Hind Madurai stays plain and sturdy at small sizes on a dark floor.

### Hierarchy
- **Display** (600, clamp(2.6rem, 5vw, 4.7rem), 1.03): the home page's threshold headline only.
- **Headline** (600, clamp(2.3rem, 4.4vw, 3.6rem), 1.08): every page title. It shrinks to clamp(1.5rem, 2.4vw, 1.9rem) during a practice session.
- **Section** (600, clamp(1.6rem, 2.7vw, 2.2rem), 1.12): section headings, and at clamp(1.4rem, 2.2vw, 1.8rem) the name of what is being practised.
- **Title** (600, 1.3rem, 1.12): headings on stone, routine names and settings steps at 1.2rem.
- **Figure** (Arima 600, 2rem, lining numerals): streak and minutes in running text; the score at 2.2rem; the session clock at 1.5rem with tabular numerals.
- **Body** (400, 17px, 1.55): all reading text, capped at 60–64ch. The root stays 16px, so rem values resolve against 16.
- **Lead** (400, 1.12rem): the sentence under a page title, capped at 62ch.
- **Action** (600, 1rem): buttons, with 500 for navigation and segments.
- **Label** (700, .78rem, .04em, uppercase): badges, anga names and fact labels above a value.
- **Swara** (Hind Madurai 500, 1rem, tabular numerals): notation cells, scale strings, key strips and swara buttons. A composition's grid and the melakarta scale still use the system mono at about 1rem, and fast groups step down to .82rem and .72rem.
- **Code** (mono, .84rem, 1.6): the JathiScript editor and inline code.

### Named Rules
**The No Kicker Rule.** Nothing sits above a heading. Uppercase is for data labels attached to a value or a control, and a section is introduced by its heading alone.

**The Plain Numeral Rule.** Counts are read in a sentence, set large in Arima lining numerals inside the line, as in "4 days, today included". They never stand in a stat tile.

## Layout

Pages run inside a 1320px frame with 24px gutters (16px at 560px and below), on a spacing scale of 4, 8, 12, 16, 24, 32, 48, 64. The lintel is sticky at the top: 44px controls on stone, then a 12px tile band. Regions divide with a tile band or a flour hairline, never by spacing a box away from another box.

**Home.** The threshold fills the viewport. The headline sits upper left, a kolam of 8 dots occupies 56vw at the right and bleeds off the top and right edges with every dot kept on the floor, and a stone slab spans the foot with the sample or today's routine and one primary action. Below 980px the column stacks: copy, kolam, slab for a newcomer; copy, slab, kolam for a returning student, so Start stays in reach. A 64px tile field closes the threshold before the page continues.

**Alankaras and Kalpana.** No rail. On the floor, in order: name, the pattern navigator on Alankaras, the stone player, notation with the clock beside it, then prose and checks. Settings follow on one full-bleed stone threshold at the foot, with a tile band on top, in an auto-fit grid of columns at least 280px wide, reached by a Settings button at the head and left by a Back to the notation button. From 1100px the clock leaves the player and stands on the floor beside the notation at clamp(240px, 27vw, 380px), sticky at 96px. Below 1100px it sits in the player at clamp(96px, 10vw, 148px), or 76px at 560px and below.

**Composition, the Repertoire list, and the Jathi judge.** These keep a rail. The composition and list rail is 350px beside a fluid column with a 24px gap, sticky at 84px and scrolling on its own, because section navigation and filters must lead there. The judge's rail is 440px and not sticky. Below 980px the column becomes single: the judge keeps its editor first, while on Composition and the list the rail drops below the content and a Settings button jumps to it.

**In a session.** The page gets out of the way. The title shrinks, the lead and quick starts hide, explanatory prose hides, and the player moves to the top. A fixed stone bar at the foot holds the item, the time and its buttons.

**Singing on a phone.** At 560px and below, a playing player shrinks to its clock and Stop and stays sticky under the lintel at 72px. The korvai lab's clock appears only while playing, fixed at the upper right. Rows scroll to stay in view as the music advances.

**Breakpoints** are 480, 560, 760, 860, 900, 980 and 1100px. The navigation collapses to a Menu button at 900px.

### Named Rules
**The Practise First Rule.** On a practice tool the first screen holds the notation. Prose follows it, and settings wait at the foot unless a rail has to lead.

**The Rail Must Lead Rule.** A rail exists only where its contents must be chosen before the content means anything: sections of a composition, filters over 1,549 compositions, a jathi being written.

## Elevation & Depth

The floor is flat and the stone lies on top of it, so depth means material first and shadow second. Stone carries a low, heavy shadow as a slab would. Rows on the floor have none. There is no glass: the lintel and session bar are opaque.

### Shadow Vocabulary
- **Slab on floor** (`box-shadow: 0 2px 3px rgba(0,0,0,.28), 0 16px 28px -18px rgba(0,0,0,.75)`; daylight `0 1px 2px rgba(58,22,13,.12), 0 14px 24px -18px rgba(58,22,13,.4)`): cards, rail, player, notation groups, lab panels.
- **Lintel** (`box-shadow: 0 10px 24px -18px rgba(0,0,0,.8)`): the sticky top bar.
- **Threshold** (`box-shadow: 0 -14px 30px -24px rgba(0,0,0,.9)`): the home slab, cast upward onto the floor.
- **Opened over the page** (`box-shadow: 0 24px 40px -22px rgba(0,0,0,.9)`): the Tools menu and the help panel.

### Named Rules
**The Floor Is Not a Card Rule.** Work sits on the floor. A result section loses its card, background and shadow, and divides from the next with a flour hairline. Only the player is stone.

**The Single Slab Rule.** Stone is never laid on a stone card as a second card. Controls, wells and notation groups may sit on stone; another titled container may not.

## Shapes

Corners are nearly square, cut stone rather than moulded plastic: 2px on buttons, inputs, chips, segments, tags, notation and the labs. Stone cards and rails are 3px. Full-bleed and edge-bound stone (thresholds, the player, popovers, navigation links) is 0. The toggle is a 40 by 24px rectangle with a 16px square thumb at 1px.

The curves belong to the kolam: a round-capped, round-joined line that crosses itself on the diagonal and turns around each dot. The sam dot has radius .24 and other dots .17, in the figure's own units, and the stroke keeps a fixed screen width at any size, from 1.5px on small figures to 3.5px on the home floor.

The tile band is a 48 by 12px repeat of triangles and diamonds in stone, oxide, turmeric and flour; in daylight it is kaavi, ink, limewash and turmeric. A 64 by 64px tile field repeats a four-petal figure and appears once, after the home threshold.

**The Two-Pixel Rule.** No pills and no soft corners on anything pressed or typed into. Circles are for dots: the kolam, the tala's clap and wave marks, the rating dots. The question-mark button, the check mark and the lab's lesson numbers are also still circular.

## Components

### Buttons
Cut stone and flour, plain and confident.
- **Shape:** nearly square (2px), at least 44px tall, 16px side padding, weight 600.
- **Primary:** a turmeric fill with dark ink, one to a region. The big form on the home slab is 56px tall with 24px padding.
- **Hover / Focus:** a default button gains a raised fill and a turmeric edge; primary brightens. Focus is a 2px turmeric ring offset 2px. Press moves the button 1px. Disabled sits at 45% opacity.
- **Default:** transparent with a flour hairline, so it lies on floor and stone alike.
- **Ghost:** no border, an underline in the hairline colour, for quiet alternatives like Copy and edit or Time this.
- **Play:** a primary button of at least 118px. Playing, it turns to a flour fill with stone text and reads Stop.
- **Continue with Google:** a flour fill with stone text, sitting above a turmeric Send me a code.

### Chips
- **Style:** stone with a flour hairline, 44px tall, 2px corners, a bold name and quieter detail on one line. Quick starts wrap from 981px and scroll sideways below it.
- **State:** pressed is a flour fill with stone text.

### Cards / Containers
- **Corner Style:** barely softened (3px).
- **Background:** kadappa stone with grain.
- **Shadow Strategy:** slab on floor.
- **Border:** none, except the 1px turmeric edge on the live session card and the 1px fault edge on the delete card.
- **Internal Padding:** 24px, or 16px at 560px and below.

### Inputs / Fields
- **Style:** a recessed well, 1px flour hairline, 2px corners, 44px tall, labels in 600 above. Native selects keep a small two-triangle chevron.
- **Focus:** a 2px turmeric outline with a turmeric caret.
- **Error / Disabled:** a fault border with a fault message below.
- **Segments and toggles:** segments are wells that fill with flour when pressed; toggles fill with flour when checked; sliders take flour as their accent.

### Navigation
- **Style:** the lintel, Arima 600 at 1.5rem for the name beside the logo, Hind Madurai 500 at 1rem for Practice, Repertoire, Tools and Learn, then the account button and theme toggle, all 44px tall.
- **States:** hover draws a hairline underline. The current page takes a raised fill, flour text and a 2px flour underline.
- **Tools menu:** a 380px stone sheet with a 2px turmeric top edge, listing each tool with one line of description.
- **Mobile:** at 900px and below, a Menu button opens a stacked drawer listing every destination.

### The Kolam
The signature. One closed line around one dot per beat, from the engine's mirror-curve geometry, deterministic from its count and seed, for 1 to 64 dots.
- **Idle:** the whole figure rests at 92% opacity with its dots at 90%.
- **Playing:** the figure falls back to a 26% ghost, and the audio clock draws the line over it. Dots pass from 55% to full as the line reaches them. The sam dot is always turmeric and larger.
- **Sam:** after the first full cycle, the figure returns to 95% for the first three quarters of the sam beat, whole and held, while the next line begins over it.
- **Reduced motion:** the line advances by whole beats, jumping from dot to dot, and every transition is off.
- **Sizes:** the home floor at 56vw, the floor clock, the player clock, and on a phone 76px.

**The Threshold.** The home page is the one place with a scene: a low view over the polished floor, a brass lamp at the head of the figure, and the kolam laid in rice flour (`app/js/threshold3d.js`, WebGL2 with no library). The music lays the line with flour falling at its head, and sam goes through the floor as a ring. The pointer moves the eye and leans the flame, a drag walks round the figure, and touching a dot sounds its beat. Colours come from the theme's tokens. The words keep a quiet ground under them whatever is behind. It is a layer over the page, never a condition of it: the drawn figure stays beneath and returns if WebGL2 is missing or the context is lost, the picture coarsens on a slow device, and with reduced motion it stays still and the line advances by whole beats. Practice pages have no scene: nothing competes with the notation while someone sings.

**The Wheel.** The Melakartas page has the second object: the 72 ragas as one carved stone dial (`app/js/mela-wheel.js`, WebGL2 with no library). Twelve chakras of six, the two madhyama halves facing, so straight across from any raga is its twin. The tile at the brass index is the raga shown beside it, and there its name reads level. The hub draws the raga's seven swaras as one line of flour, which turns into the next raga's as the wheel turns. A drag has weight and always rests on a raga. Turning is silent: only a click sings. It takes the page's width, with the name of the raga at the index standing beside it and the description below. It draws only when something changes, and the table is one press away and takes over if the wheel cannot run.

**Voice Check.** A quiet room: one instruction at a time, a large count, and a flour bar showing the microphone's level, because a singer must see they are heard. The results are a plain table beside the singer's own usual. It never shows a verdict, a score or a colour for good and bad.

**The Line Rule.** Outside the Threshold and the Wheel, only the kolam's line moves, and only with the music. Nothing moves on load, on scroll or on hover, and no kolam is a background. New work adds no motion of its own. Small motions outside the line remain in the build and are recorded, not endorsed: the sounding swara scales to 1.08, the current beat mark in the ruler scales to 1.25, rows scroll to follow the music, toggle thumbs slide, a toast rises, and a pressed button drops 1px.

**The Figure Means Something Rule.** A kolam always counts something real: a tala's beats, a score, or a day's minutes. If it cannot state what its dots are, it does not go on the page.

### Score Kolam
The judge's score is a kolam of 16 dots, its line drawn as far as the score goes: all of it at 100. The rest stays as a 28% ghost. It stands 108px beside the number in Arima (64px in its small form), with "of 100" below.

### Day Kolam
A day of practice is a kolam whose dots come from minutes, one for each 2.5 minutes, from 1 to 25, seeded by the date. In the week and on the next-practice card it is drawn whole; on the home page it runs off the floor's edges with every dot still on it (`bleedKolam`). A day that met the goal draws its line in turmeric and heavier, because in daylight turmeric and flour are one colour. A day without practice is bare floor, with one small dim dot holding its place in the week. Today's figure on the home page, before any singing, is eight dots with no line. Sizes are 84px on the next-practice card, 72px tall in the week row, and 48px tall at 760px and below.

### Player
A stone step: the clock, Play, tempo, Sa, drone, beat clicks, loop, voice and gamaka, wrapping inside itself, with 16px padding. On a composition it also carries the current section's line beneath, and the clock stays in the player at every width.

### Notation
Each anga is a stone slab with a slab shadow, and within it beats sit in raised groups with cells 34 by 38px (24px wide at four to the beat, 34px tall on phones). Sam's group has a 2px turmeric inset on every row. The sounding swara fills turmeric and scales to 1.08. The ruler above carries anga names, beat numbers and SVG marks for clap, wave and count. A cycle too wide for its column wraps section by section, with each section labelled by its beats.

A composition's grid is lighter, without slabs: fine beat lines, a 2px turmeric bar at sam, sahitya in sandstone below, and a verdigris underline on fast groups. Its tags open a note under the line rather than a tooltip.

### Threshold Slab and Session Bar
The threshold is stone across the full viewport with a tile band along its top edge. The session bar is the fixed stone step at the foot: a 2px turmeric top edge when running, flour when over time with the time in turmeric, a hairline when paused.

### Shared Labs
The korvai lab reads downwards in the app, settings above and results below, with its lessons as a grid above the lesson. It and the melakarta explorer otherwise keep their own structure and take the world's tokens by override: 2px corners, stone grain and slab shadow on their panels, and flour on-states. The korvai clock floats at the upper right and is sticky at 84px.

## Do's and Don'ts

### Do:
- **Do** put the work on the red-oxide floor, and lay stone only under what must be held: the player, a rail, a threshold, a form.
- **Do** separate regions with the 12px tile band, and rows with a flour hairline.
- **Do** keep every control at least 44px tall, and use the spacing scale of 4, 8, 12, 16, 24, 32, 48, 64.
- **Do** give each region one filled primary action, and show every other on-state in flour.
- **Do** derive every kolam from a real count through the engine, with its dots as beats, score or minutes.
- **Do** keep the reduced-motion fallback: the line advances by whole beats, and all transitions and smooth scrolling stop.
- **Do** set new surfaces in both floors through the tokens, and check them in limewash, where turmeric's role becomes kaavi.
- **Do** self-host Arima and Hind Madurai, and use Arima only for names, headings and large figures.
- **Do** open notes in place for explanatory tags, because a phone never shows a tooltip.

### Don't:
- **Don't** put an eyebrow or kicker above a heading.
- **Don't** use glyphs as icons. Draw them as inline SVG, as the play, settings, tick and clap marks are.
- **Don't** nest one card inside another.
- **Don't** round a control beyond 2px or use a pill.
- **Don't** use glass, glows, decorative gradients or a dark-glass dashboard of stat tiles.
- **Don't** animate anything but the kolam's line, or move the line from anything but the audio clock.
- **Don't** use a kolam as wallpaper or as an empty decoration.
- **Don't** spend turmeric on selection, the current page or a second action; those are flour or outlines.
- **Don't** give verdigris any new job beyond double speed.
- **Don't** add a rail to a practice tool unless its contents must be chosen first.
