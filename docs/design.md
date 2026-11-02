# The app's design (v0.8.8)

This note covers how the web app in `app/` looks and moves, why, and where each part lives. The playground and the static pages in `web/` keep their own, earlier styles.

## Principles, and where they come from

The 0.8.8 layout follows published usability guidance. The sources were read on 2026-11-02:

- **[H]** Nielsen Norman Group, "10 Usability Heuristics for User Interface Design": https://www.nngroup.com/articles/ten-usability-heuristics/
- **[V]** Nielsen Norman Group, "Visual Hierarchy in UX: Definition": https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- **[L]** Laws of UX: https://lawsofux.com/

| Principle | Source | How the app applies it |
|---|---|---|
| "Every extra unit of information in an interface competes with the relevant units of information" | [H] #8 | The top bar has four destinations (Practice, Repertoire, Tools, Learn; v0.9 added Repertoire), plus the account and theme buttons. A tool's page head is a title, a short lead and one line of quick starts. |
| About 7 items in working memory; more choices take longer | [L] Miller's and Hick's laws | The five tools sit under Tools, each with a one-line description. On a phone, the menu drawer lists them all. |
| "You are here" | [H] #1 | The current page's link is lit, and so is Tools while you are on one of its tools. |
| Grouping by proximity and common region; use containers sparingly | [V], [L] | Settings sit in one glass panel beside the result, with their steps separated by a faint rule. Results are cards. |
| Controls next to what they change (natural mapping) | [H] #2 | On a desktop the settings panel stays in view (it is sticky and scrolls on its own) beside the result it changes. On a phone the result comes first, and a Settings button jumps to the controls. |
| Help that does not take the room of the task | [H] #10, [L] Pareto | "How to use this page" is a small button that opens a popover. It closes on Escape or a click elsewhere. |
| The most important element is the biggest; few large elements | [V] | One gold primary action per region (Play, New round, Start, Save); everything else is a glass or outline button. |
| No more than three sizes of heading | [V] | Page title, section heading and card heading. |
| Consistency and standards | [H] #4 | One spacing scale (4, 8, 12, 16, 24, 32, 48, 64 px), one radius family, and the same card, button and focus styles on every page. |
| Aesthetic–usability effect | [L] | The glass, gold and depth below, kept quiet enough not to compete with the music. |

## The pieces

| Piece | Where | What it does |
|---|---|---|
| Tokens | `app/css/app.css` (top) | Colours for the dark and light themes: midnight indigo, saffron for the voice, teal, violet and rose. |
| Design layer | `app/css/app.css`, "v0.8.8 design layer" | Glass surfaces with a lit top edge; deep, soft shadows; a slowly drifting aurora and a film grain behind the page; gold-gradient primary buttons with a passing sheen; gold type for accents and figures. |
| Layout layer | `app/css/app.css`, "v0.8.8 layout" | The spacing scale, the Tools menu, the compact page head and its help popover, the glass settings panel, and results first on narrow screens. |
| Motion | `app/js/fx.js` | `soundField(canvas)`: the home page's live 3D sound field. `initFx()`: card tilt with a following glare, scroll reveals and page entrances. |
| Navigation | `app/index.html`, `app/js/main.js` | Practice · Repertoire · Tools (menu) · Learn, the account button and the theme. The menu opens on click or hover; Escape or a click outside closes it. |
| Page head | `pageHead()` in `app/js/ui.js` | Eyebrow, title, lead, the quick-start strip and the help popover. |
| Repertoire | `app/js/pages/repertoire.js`, the "v0.9 the repertoire" block of `app/css/app.css` | The list keeps the tool layout: filters in the panel, results in a card. A composition's panel holds its sections, practice speed, practice actions and raga; the result holds the player (one primary action, Play) and the sections. Lines wrap at the table's own cells, so a long cycle stays readable on a phone. |

## Motion, with restraint

- **The sound field.** A perspective mesh of travelling waves, drawn on a canvas in the theme's colours, swells under the pointer. It pauses when it is off screen or the tab is hidden, and it redraws when the theme changes.
- **Tilt.** Cards lean up to 7° toward the pointer, and their contents stand off the surface. Tilt is used only with a mouse.
- **Reveals.** Content rises 22 px out of a slight blur, items in a group 70 ms apart, and each page enters with a short rise.
- **Reduce motion.** With the system setting "reduce motion", everything stops: animations, transitions, tilt and reveals. The field draws one still frame.

## Checking a change

- **Tests.** `npm run check`, then `npm run e2e`. The end-to-end test reaches every tool through the Tools menu.
- **Viewports.** Look at a page at 1440 px and at 390 px (a phone), in both themes, with "reduce motion" on and off. The squint test from [V] applies: blur your eyes, and the primary action and the main groups should still stand out.
