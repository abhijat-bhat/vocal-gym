# The repertoire: status and working notes

Everything needed to change the repertoire section safely, and where it stands. The numbers below are generated; the notes are written by hand, so update them when a decision changes. `README.md` ("The repertoire") describes the format and the import in full; this file holds what that does not.

Refresh the numbers with `node scripts/repertoire-stats.js` (the importer also does it). A test fails if they fall behind the data.

## How to read the score

The score is the share of compositions with notation that carry no off-cycle tag. It says the notation **fits the tala**, not that it is **musically right**:

- A wrong swara that still fills the count gets no mark.
- "link" lines are not checked against the cycle.
- The "fixed" tags are not counted against the score: those are slips already corrected.

Treat it as a ceiling until a singer has reviewed the pieces. A real measure of musical accuracy would need a sample checked by ear against a trusted source.

## What is where

| Thing | Where |
|---|---|
| Generated compositions (never edit by hand) | `data/repertoire/c/<id>.json`, `data/repertoire/index.json` |
| The site's posts → compositions | `scripts/import-repertoire.js`, `scripts/repertoire-html.js` |
| The book → compositions, and the choice between versions | `scripts/lessons.js` |
| Reading the book's PDF | `scripts/lessons-extract.py` → `data/lessons/gurukulam.raw.json` (committed) |
| Geetham meanings (hand-typed; edit here) | `data/lessons/gurukulam-meanings.json` |
| Notation rules: cells, tala fit, off-cycle, sustains, edits | `src/engine/repertoire.js` |
| A singer's corrections and their log | `server/edits.js`, table `notation_edits`, laid over the files when read |
| The pages | `app/js/pages/repertoire.js`, `.rp-*` in `app/css/app.css` |
| Tests | `test/repertoire.test.js`, `test/lessons.test.js`, the "repertoire" steps of `scripts/e2e.js` |

## Common changes

- **Re-import:** `node scripts/import-repertoire.js` fetches the site live, so new posts change the counts. Keep a copy with `--save-feed feed.json`, re-run offline with `--cache feed.json`, and use `--dry` to look without writing and `--report` for the lists. The last feed used was saved on 2026-11-04; it is not in the repo.
- **Remove compositions:** add to `isRemoved` in `scripts/lessons.js`, drop any `SAME` group that names them, and take the type off `TYPES` in `app/js/pages/repertoire.js` if none is left. Never delete the JSON by hand: the importer rewrites the folder each time.
- **Add a version of a lesson:** add a group to `SAME`. Do not pick the winner by hand; `choose` decides by the measures.
- **Change a meaning:** edit `data/lessons/gurukulam-meanings.json`, then re-import. `pages` must stay the book's pages. Lyric lines and bracketed glosses are as printed; only the English is corrected.
- **Keep ids stable:** routines, logs and singers' edits refer to a composition's id. A site composition keeps its id when the book's notation replaces it. A post that goes away with a successor needs an entry in `redirects` (see `GATHERED`).
- **After any data change:** run `npm run check` and `npm run e2e`.
- **Release:** the version lives in `package.json`, `package-lock.json`, `src/engine/index.js`, `app/sw.js` (`CACHE`), `CHANGELOG.md` and `CLAUDE.md`.

## Decisions to keep

- **Off-cycle lines are tagged, never corrected automatically.** The right fix is a musical judgement, so the swaras are shown and sung as written.
- **Typing slips are corrected at import**, each with what the site printed (`fixed[].was`) and why, behind a "fixed" tag.
- **Sustains display** as `,` for one unit and `;` for two, so `P , , ,` shows as `P, ;`. This is display only; the stored notation is unchanged.
- **Removed by request (v0.9.4):** Brahma Kadigina Padamu, Sarali Varisai, all alankarams and everything else of type Basics (the other varisais, and the pages on swara representation, swara positions and melakarta ragas). The app's Alankara page is separate and stays. An old link or routine item to one of these shows "No composition … in the repertoire".
- **Sources:** the repertoire uses only Carnatic Music Notations (Balaji J., "free for anyone to download and use") and the Gurukulam geetham notes (Gurukulam & SF, used with their permission, as the project's owner confirmed in November 2026). The PDFs in `lessons/` are kept out of git.

## The Gurukulam notes

- The PDF has **no text layer**: every letter is a vector shape. The extractor reads swara and sahitya rows by geometry and shape clusters labelled once by eye.
- The **meanings were read by eye** from page images and checked against the PDF's glyph shapes, then their English spelling and grammar were corrected. That glyph check only holds for the text as printed, so the corrected text can no longer be checked that way; compare with the book's page (`pages`) instead.
- **Readings worth a second look**, because the printed sentence was unclear: Vani Veena ("so fortunate that the lotus bears you"), Bhuvanatraya Mohana ("they create an illusion for the bees"), Kamsasura ("a propitiated raga, played even with zig-zag movement"; "a long stay"; "sits next to"), Ganavidya Durandhara ("I offer this geetam"). Vande Madhavam's first line, on "Goddess Parvati's husband", is as printed though odd.
- These were corrected for English by someone not reading the original languages. They are not checked translations.

## Working in this repo

- Files check out with CRLF on Windows. A script that patches a file should read it, normalise to `\n`, patch, and restore.
- Bash heredocs on this machine collapse double backslashes, so write patch scripts to a file rather than through a heredoc.
- Check repertoire layout changes at phone width (390 px): syllable grids and reading cells have overflowed before.
- Books once read for notation and since dropped may still be cited in `data/raga-profiles.json`, `docs/research/raga-profiles-report.md`, the research plan and the README's references. Those are citations for raga and alankara research, not repertoire notation, and they stay, because raga knowledge must keep its sources.

## Open questions

- Should the "link" label be renamed ("ending" or "short")? It marks a section's short closing phrase, and the word has confused readers.

<!-- stats:begin (scripts/repertoire-stats.js writes this part; do not edit it by hand) -->

## The numbers

### Quality

**Score: 88%**, the share of compositions with notation that have no error mark: 1363 of 1548. By lines it is 98.4%.

| Mark | Compositions | Lines |
| --- | --- | --- |
| Off the cycle (likely errors, left as written) | 184 (11.9%) | 347 of 21486 (1.6%) |
| "fixed" (typing slips corrected at import) | 148 (9.6%) | 262 |
| Either | 297 |  |
| Could not be checked (no tala) | 1 | 7 |

Off-cycle share within a marked composition: up to 5%: 28 · 5 to 20%: 128 · 20 to 50%: 28 · over 50%: 0.

The measures of `scripts/lessons.js`, weighted by lines: tala fit 0.983, swaras in the raga 0.999, no unexplained octave leap 0.999.

### Size

|  | Count |
| --- | --- |
| Compositions | 1549 |
| With swara lines | 1548 |
| Words only, no swara lines | 2018-01-navavaranasampoojye-guharanjani-adi (1) |
| Lines | 21486 |
| Ragamalikas | 35 |
| With a meaning | 31 |
| With versions compared | 19 |
| Newest post in the data | 2026-11-01 |

### What the lines are

| Kind | Lines |
| --- | --- |
| table rows read, swaras and sahitya together | 41033 |
| swara lines | 21486 |
| fill whole cycles | 19902 |
| lead-ins that end on sam | 8 |
| in split lines that fill cycles together | 127 |
| short "link" lines (a section's closing phrase; not checked as a cycle) | 1074 |
| with an overlap cell | 22 |
| off the cycle by the importer's count | 353 |
| with sahitya under the swaras | 17418 |
| octave-mark slips corrected | 375 |
| in compositions read with four-times groups (count of compositions) | 26 |
| lines with a character the importer could not read | 1 |

The importer's off-the-cycle count is a little higher than the tags, because the page shows no tag on lead-ins, overlaps and split lines.

### By type

| Type | Compositions | With off-cycle tags | Lines | Off-cycle lines | Fixed lines | With a meaning |
| --- | --- | --- | --- | --- | --- | --- |
| Krithi | 1007 | 133 | 14564 | 269 | 172 | 0 |
| Varnam | 207 | 20 | 3366 | 28 | 53 | 0 |
| Jathiswaram | 72 | 4 | 823 | 6 | 21 | 0 |
| Dasara pada | 70 | 7 | 864 | 11 | 9 | 0 |
| Geetham | 44 | 0 | 335 | 0 | 1 | 26 |
| Nottuswaram | 43 | 5 | 304 | 9 | 0 | 0 |
| Swarajathi | 25 | 2 | 325 | 2 | 0 | 0 |
| Lakshana geetham | 23 | 1 | 229 | 1 | 1 | 5 |
| Thillana | 21 | 6 | 266 | 7 | 0 | 0 |
| Vachana | 15 | 2 | 98 | 3 | 1 | 0 |
| Thiruppavai | 9 | 1 | 62 | 1 | 1 | 0 |
| Shlokam | 5 | 1 | 110 | 1 | 1 | 0 |
| Thiruppugazh | 5 | 0 | 43 | 0 | 0 | 0 |
| Ashtapadi | 1 | 1 | 41 | 1 | 0 | 0 |
| Daru | 1 | 0 | 22 | 0 | 0 | 0 |
| Mallari | 1 | 1 | 34 | 8 | 2 | 0 |

### By where the notation comes from

| Source | Compositions |
| --- | --- |
| Carnatic Music Notations | 1535 |
| Geetham notes (Gurukulam & SF) | 14 |

### By tala

| Tala | Compositions |
| --- | --- |
| Adi | 936 |
| Roopakam | 312 |
| Misra Chapu | 64 |
| Tisra Triputa | 41 |
| Khanda Chapu | 33 |
| Tisra Eka | 26 |
| Chatusra Eka | 18 |
| Misra Jhampa | 17 |
| Ata (Khanda Ata) | 14 |
| Khanda Triputa | 12 |
| Adi (tisra nadai) | 11 |
| Triputa (Tisra Triputa) | 9 |
| Dhruva (Chatusra Dhruva) | 7 |
| Eka (Chatusra Eka) | 6 |
| Chatusra Matya | 5 |
| Chatusra Rupaka | 4 |
| Khanda Ata | 4 |
| Khanda Eka | 4 |
| Khanda Jhampa | 3 |
| Matya (Chatusra Matya) | 3 |
| Tisra Dhruva | 3 |
| Chatusra Ata | 2 |
| Sankeerna Triputa | 2 |
| Tisra Rupaka | 2 |
| (none) | 1 |
| Chatusra Dhruva | 1 |
| Chatusra Jhampa | 1 |
| Chatusra Triputa (Adi) | 1 |
| Jhampa (Misra Jhampa) | 1 |
| Khanda Matya | 1 |
| Khanda Rupaka | 1 |
| Misra Eka | 1 |
| Misra Triputa | 1 |
| Roopakam (tisra nadai) | 1 |
| Sankeerna Chapu | 1 |

### Ragas

379 distinct names, as the sources spell them. The 30 most used: Shankarabharanam 46, Kalyani 35, Mohanam 30, Hamsadhwani 27, Bilahari 26, Bhairavi 25, Hindolam 22, Nattai 21, Aarabhi 20, Vasantha 20, Madhyamavathi 19, Thodi 18, AnandhaBhairavi 17, Kedaragowlam 17, Dhanyasi 16, Poornachandrika 16, Reethigowla 16, Abhogi 15, Gowlam 15, Kambhoji 15, Poorvikalyani 15, Begade 14, Hamsanandhi 14, Kaanada 14, Kedaram 14, Kharaharapriya 14, Natakurunji 14, Saveri 13, Sahana 12, shrI 12.

### Composers and languages

234 composer names. The 20 most used: MuthuswamiDikshithar 220, Thyagaraja 191, MuthaiahBhagavathar 83, (not named) 79, Mysore Vasudevacharya 66, Purandaradasa 56, SwathiThirunal 44, PapanasamSivan 43, PatnamSubramanyaIyer 33, GN Balasubramaniam 32, OothukaduVenkatasubbaiyer 27, ShyamaShastri 26, Shankarabharanam 23, SriJayachamarajaWodeyar 22, Annamacharya 16, Lalgudi G. Jayaraman 16, Oothukadu Venkatasubbaier 16, Prof.R.Visweswaran 16, VeenaSeshanna 15, Dr.M.Balamuralikrishna 14.

Languages: Sanskrit 658, Telugu 480, Tamil 188, Kannada 116, (not named) 102, Hindi 3, Malayalam 1, Manipravalam 1.

### Tala oddities

- No tala (1): `2021-08-mohanavamshee-revathi-gathipanchakam`.
- Tala inferred from the lines (10): `2021-01-santhatham-paahimaam-nottuswaram`, `2021-08-jathiswara-ragamalika-saptha-talamalika`, `2022-10-english-notes`, `2023-09-eppadi-padinaro-karnataka-dhevagandhari`, `2024-01-mallari-notes`, `2025-02-swarajathi-balakrishna-mohana-mohanam`, `2025-05-shri-thyagesha-ragamalika-talamalika`, `2026-08-nalinakanthi-nottuswaram`, `2026-08-ragamalika-nottuswaram`, `2026-10-sharadhamba-reethigowlam-meenakshi-sutha`.
- Named tala differs from the written cycles (15): `2021-02-guruguhapadhapankaja-nottuswaram` (Chatusra Eka → Roopakam), `2021-02-shankharabharanam-chalamela-varnam-ata` (Ata (Khanda Ata) → Adi), `2021-05-thiruppavai-02-vaiyathu-vazhveergal` (Khanda Chapu → Misra Chapu), `2021-05-thiruppavai-06-pullum-shankarabharanam` (Khanda Chapu → Misra Chapu), `2021-05-thiruppavai-07-keesukeesu-bhairavi` (Khanda Chapu → Misra Chapu), `2021-06-reethigowla-vanajaksha-varnam-ata-veena` (Ata (Khanda Ata) → Adi), `2022-04-viriboni-bhairavi-varnam-ata` (Ata (Khanda Ata) → Adi), `2022-11-mundu-venuka-dubar-adi-thyagaraja` (Adi → Chatusra Eka), `2023-04-chinnanchiru-kiliye-ragamalika-adi` (Adi (tisra nadai) → Roopakam), `2023-06-ninnu-nammi-nanu-janani-abhogi-kanda` (Khanda Chapu → Misra Chapu), `2025-05-arputha-chirpiyadi-ragamalika-adi-tisra` (Adi (tisra nadai) → Roopakam), `2025-05-notes-kadanakuthoohalam-s-panchaapakesa` (Tisra Triputa → Adi), `2025-10-swagatham-krishna-mohanam-thriputa` (Triputa (Tisra Triputa) → Adi), `2025-11-shri-ramya-chithalankara-jayamanohari` (Roopakam → Adi), `2026-09-gandhamu-puyyaruga-punnagavarali-adi` (Adi → Chatusra Eka).

### Corrections at import, by reason

| Reason | Cells |
| --- | --- |
| lower-mark | 179 |
| lower-run | 96 |
| upper-mark | 17 |
| letter | 7 |

### Versions compared

Used by the rules in `scripts/lessons.js`; each row is a composition with two versions. Columns are the winner's fit, raga and octave against the other version's.

| Composition | Used | Fit | Raga | Octave | Complete |
| --- | --- | --- | --- | --- | --- |
| ShuddhaSaveri `2020-12-geetham-aanalekara-shuddhasaveri-tisra` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 97% / 100% |
| Saveri `2020-12-geetham-janakasutha-saveri-roopakam` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 99% | 75% / 77% |
| kamala jadhala `2020-12-geetham-kamalajadhala-kalyani-tisra` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 90% / 85% |
| AnandhaBhairavi `2020-12-geetham-kamalasulochana-anandhabhairavi` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 84% / 84% |
| Kambhoji `2020-12-geetham-mandharoddhare-kambhoji-aadhi` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 87% / 81% |
| Shree `2020-12-geetham-meenakshi-shree-dhruva-paidala` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 78% / 80% |
| Mohanam `2020-12-geetham-varaveena-mohanam-roopakam` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 82% / 80% |
| Aarabhi `2021-01-aarabhi-rey-rey-shree-ramachandhra` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 92% / 93% |
| Sri Rama Chandra `2021-01-bhairavi-shreeramachandra-dhruva-geetham` | Geetham notes | 100% / 100% | 100% / 100% | 100% / 98% | 91% / 91% |
| Dhanyasi `2021-04-dhanyasi-jayakarunasindho-lakshana` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 88% / 88% |
| Kamsasura Khandana `2021-04-sahana-kamsasura-lakshana-geetham` | Geetham notes | 100% / 100% | 100% / 100% | 100% / 99% | 63% / 60% |
| malayamArutham `2021-10-malayamarutham-shri-lola-geetham` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |
| Shankarabharanam `2022-01-geetham-govindahare-shankarabharanam` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 99% / 98% | 86% / 92% |
| nAttai `2022-04-nattai-amari-kabari-geetham-eka` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |
| bEgadE `2023-08-begade-saraswathi-nanna-naligeyalli` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 63% / 65% |
| bhayasamaya dhEvuni `2023-08-bhayasamaya-dhevuni-dhesakshi-geetham` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 84% / 87% |
| Lakshana Geetham `2025-11-lakshana-geetham-arabhi-mishra-jhampe` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 94% / 93% |
| shrI rAmachandhra `2025-11-shri-ramachandhra-gowlam-geetham` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |
| vandhE mAdhavam `2025-11-vandhe-madhavam-varali-geetham` | Carnatic Music Notations | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |

### Geethams with no meaning (36)

The notes do not have these: Malahari, Mohanam, Begade, Hindolam, Shanmukhapriya, Madhyamavathi, Bilahari, Bowli, Gowlam, Hamsadhwani, Jaganmohini, Kalyani, MayamalavaGowlam, MayamalavaGowlam, Gowlam, Shankarabharanam, Shree, Paras, bahudAri, Abheri, Saraswathi, jaya prahlAdha, Vasantha Bhairavi, kEdAragowlam, kharaharapriya, Suraranjani, sAvEri, hamsadhwani, gambheera nAttai, rEvagupthi, madhiyum gangaiyum, shivanEriyE, keeravANi, pArvathi janani, chakravAkam, lakshaNa geetham.

### Every composition with an off-cycle tag (184)

Worst share first.

| Composition | Type | Off / lines | Id |
| --- | --- | --- | --- |
| shrI sathyanArAyaNam | Krithi | 4 / 9 | `2022-10-shri-sathyanarayanam-shubhapanthuvarali` |
| mOkshamu galadhA | Krithi | 9 / 21 | `2022-07-mokshamu-galadha-saramathi-adi` |
| ThungatharangE | Krithi | 4 / 10 | `2021-05-thungatharange-kunthalavarali-aadhi` |
| mahAlakshmI jaganmAthA | Krithi | 4 / 10 | `2023-09-mahalakshmi-jaganmatha-shankarabharanam` |
| marakathavalli | Krithi | 6 / 17 | `2022-09-marakathavalli-kambhoji-adi` |
| swararAga sudhArasa | Krithi | 9 / 26 | `2024-01-swararaga-sudharasa-shankarabharanam` |
| mithri bhAgyamE | Krithi | 5 / 15 | `2022-11-mithri-bhagyame-kharaharapriya-adi` |
| valachiyunna | Varnam | 4 / 12 | `2021-08-valachiyunna-amruthavahini-varnam` |
| Nannu kanna Thalli | Krithi | 3 / 9 | `2017-12-nannu-kanna-thalli-thyagaraja` |
| pibarE rAma rasam | Krithi | 2 / 6 | `2025-08-pibare-rama-rasam-ahir-bhairav-adhi` |
| Jagajjanani | Krithi | 4 / 13 | `2020-10-jagajjanani-rathipathipriya-adi-ghanam` |
| rAma rAma guNa seemA | Krithi | 4 / 14 | `2022-06-rama-rama-guna-seema-simhendramadhyamam` |
| paralOka sAdhanamE | Krithi | 4 / 14 | `2022-07-paraloka-sadhaname-poorvikalyani-adi` |
| neelAyathAkshi neevE | Krithi | 4 / 14 | `2024-07-neelayathakshi-neeve-pharas-thriputa` |
| KrishnamKalaya | Krithi | 2 / 7 | `2020-12-krishnamkalaya-mukhari-aadhi` |
| lAvaNya rAma | Krithi | 2 / 7 | `2022-07-lavanya-rama-poornashadja-roopakam` |
| thumbidhudhu | Vachana | 2 / 7 | `2026-06-thumbidhudhu-kalyana-vasantha` |
| apparAma bhakthi | Krithi | 3 / 11 | `2022-11-apparama-bhakthi-panthuvarali-roopakam` |
| mahAgaNapathi vA vA | Krithi | 3 / 11 | `2025-06-mahaganapathi-va-va-nattai-sankeerna` |
| ubhaya kAvEri ranga | Krithi | 3 / 12 | `2024-08-ubhaya-kaveri-ranga-gamanashrama` |
| hEmagirIsha manOnmaNi | Krithi | 2 / 8 | `2022-07-hemagirisha-manonmani-eeshamanohari-adi` |
| guruguha padha pankaja | Nottuswaram | 1 / 4 | `2021-02-guruguhapadhapankaja-nottuswaram` |
| mallAri notes | Mallari | 8 / 34 | `2024-01-mallari-notes` |
| shrI mahagaNapathi | Krithi | 3 / 13 | `2025-07-shri-mahaganapathi-gowlam-mishrachapu` |
| inkA dhaya | Krithi | 4 / 18 | `2022-11-inka-dhaya-chakravakam-adi` |
| Charukeshi | Thillana | 2 / 9 | `2021-01-charukeshi-dhimdhimdhim-thillana-adi` |
| shrI bhArgavi | Krithi | 2 / 9 | `2025-07-shri-bhargavi-mangala-kaishiki-mishra` |
| bhAvayAmi raghurAmam | Krithi | 11 / 54 | `2022-10-bhavayami-raghuramam-ragamalika-rupakam` |
| jAlandhara supeetasthE | Krithi | 2 / 10 | `2022-10-jalandhara-supeetasthe-valachi-rupakam` |
| shEshAdhri vAsa | Krithi | 2 / 10 | `2024-08-sheshadhri-vasa-lathangi-roopakam` |
| pAlinchu kAmAkshi | Krithi | 3 / 16 | `2022-04-palinchu-kamakshi-madhyamavathi-adi` |
| amba neelAmbari | Krithi | 3 / 16 | `2024-08-amba-neelambari-neelambari-adi-ponnaiah` |
| BhavayAmiGopAlabAlam | Krithi | 4 / 22 | `2021-04-bhavayamigopalabalam-yamankalyani` |
| marEya bEda manavE | Dasara pada | 2 / 11 | `2021-09-mareya-beda-manave-begade-roopakam` |
| mAmava meenAkshi | Krithi | 2 / 11 | `2024-09-mamava-meenakshi-manirangu-mishrachapu` |
| chinthayEham | Nottuswaram | 2 / 12 | `2021-04-chinthayeham-nottuswaram-muthuswami` |
| kaa vaa vaa | Krithi | 2 / 12 | `2022-02-kaa-vaa-vaa-varali-adhi-papanasamsivan` |
| singAra vElavan vandhAn | Krithi | 2 / 12 | `2022-02-singara-velavan-vandhan-anandhabhairavi` |
| navAkshara manusthuthE | Krithi | 2 / 12 | `2023-03-navakshara-manusthuthe-navarathnavilasa` |
| lalithE suramahithE | Krithi | 2 / 12 | `2025-06-lalithe-suramahithe-salaga-bhairavi` |
| Thiruppavai | Thiruppavai | 1 / 6 | `2021-05-thiruppavai-03-ongi-ulagalandha-arabhi` |
| parama pAvani | Krithi | 1 / 6 | `2026-02-parama-pavani-sindhugowri-rupakam` |
| kamalajAsya | Krithi | 10 / 61 | `2023-10-kamalajasya-ragamalika-adi` |
| kamalAmbikE ambA | Krithi | 4 / 25 | `2024-01-kamalambike-amba-thodi-thishra-eka` |
| shankarAbharaNam | Jathiswaram | 3 / 19 | `2026-02-jathiswara-shankarabharanam-adi-veena` |
| yEnu sukRthava | Dasara pada | 2 / 13 | `2026-07-yenu-sukrthava-yamunakalyani-roopakam` |
| Sharavanabhava | Krithi | 3 / 20 | `2018-01-sharavanabhava-pashupathipriya-adi` |
| vadavaraiyai | Krithi | 5 / 34 | `2022-10-vadavaraiyai-ragamalika-adi-ilango` |
| English Notes | Nottuswaram | 4 / 28 | `2022-10-english-notes` |
| siddhi vinAyakam | Krithi | 2 / 14 | `2023-01-siddhi-vinayakam-shanmukhapriya` |
| vEnkataramaNa | Krithi | 2 / 14 | `2026-07-venkataramana-lathangi-rupakam` |
| shrI kAmAkshi | Krithi | 1 / 7 | `2022-07-shri-kamakshi-hindolam-adi` |
| sadhAshrayE | Krithi | 4 / 30 | `2022-12-sadhashraye-chamaram-rupakam` |
| KamalAmbAm bhajarEy | Krithi | 2 / 15 | `2022-01-kamalambam-bhajarey-kalyani-adi` |
| Anandha natana | Krithi | 2 / 15 | `2022-11-anandha-natana-kedharam-mishrachapu` |
| ninnu joochi | Krithi | 2 / 15 | `2024-07-ninnu-joochi-hemavathi-roopakam-veena` |
| AnandhaNatamaduvar | Krithi | 2 / 16 | `2020-10-anandhanatamaduvar-poorvikalyani` |
| MaatheMalayadhwaja | Varnam | 2 / 16 | `2021-03-maathemalayadhwaja-khamas-daru-varnam` |
| SakalaGrahaBala | Dasara pada | 2 / 16 | `2021-05-sakalagrahabala-atana-khandachapu` |
| bhakthi biCHa | Krithi | 2 / 16 | `2022-11-bhakthi-bicha-shankarabharanam-roopakam` |
| shrI kamalAmbikE | Krithi | 1 / 8 | `2022-07-shri-kamalambike-shri-khanda-eka` |
| hoydhavarEnna | Vachana | 1 / 8 | `2022-12-hoydhavarenna-neelambari-roopakam` |
| santhatham gOvindharAjam | Nottuswaram | 1 / 8 | `2023-07-santhatham-govindharajam-nottuswaram` |
| shrI guruna pAlithOsmi | Krithi | 1 / 8 | `2024-02-shri-guruna-palithosmi-padi-roopakam` |
| piLLangOviya chEluva krshNana | Dasara pada | 1 / 8 | `2024-12-pillangoviya-cheluva-krshnana-mohanam` |
| shuddhasAveri | Jathiswaram | 1 / 8 | `2026-07-shuddhasaveri-jathiswara-roopakam` |
| EnthO prEmathonu | Varnam | 2 / 17 | `2021-11-entho-premathonu-bahudhari-varnam-adi` |
| giripai nElakOna | Krithi | 2 / 17 | `2022-08-giripai-nelakona-sahana-adi-thyagaraja` |
| thathvamariya tharama | Krithi | 3 / 26 | `2023-06-thathvamariya-tharama-reethigowlam-adi` |
| sooryamoorthE | Krithi | 2 / 18 | `2022-08-sooryamoorthe-saurashtram-dhruva` |
| shrI krishNam bhaja mAnasa | Krithi | 2 / 18 | `2023-01-shri-krishnam-bhaja-manasa-thodi-adi` |
| sukhi Evvaro | Krithi | 2 / 18 | `2023-12-sukhi-evvaro-kanada-adhi-thyagaraja` |
| shrI shukra bhagavantham | Krithi | 2 / 18 | `2024-02-shri-shukra-bhagavantham-pharaju-khanda` |
| Poornachandrika | Thillana | 1 / 9 | `2021-03-poornachandrika-thomthom-thillana-adi` |
| rAmanAmoralincharA | Swarajathi | 1 / 9 | `2021-04-ramanamoralinchara-harikambhoji` |
| rAmachandhra pAhi | Krithi | 1 / 9 | `2022-01-ramachandhra-pahi-poornachandrika` |
| thuLasi bilva | Krithi | 1 / 9 | `2022-03-thulasi-bilva-kedharagowla-adi` |
| veera hanumathE | Krithi | 1 / 9 | `2024-08-veera-hanumathe-karnataka-kapi-roopakam` |
| rAja rAjEshwari | Krithi | 1 / 9 | `2024-11-raja-rajeshwari-hamsanadham-rupakam` |
| bRndhAvani | Thillana | 1 / 9 | `2024-12-thillana-dheem-na-na-na-brndhavani-adi` |
| abhayAmbikAyai ashvAroodAyAi | Krithi | 1 / 9 | `2025-06-abhayambikayai-ashvaroodayai-yadhukula` |
| neelothpalAmbikAyA | Krithi | 1 / 9 | `2025-09-neelothpalambikaya-mayamalavagowlam` |
| Chalamela | Varnam | 2 / 19 | `2021-02-shankharabharanam-chalamela-varnam-ata` |
| chEthulAra | Krithi | 2 / 19 | `2024-01-chethulara-bhairavi-adi-thyagaraja` |
| niravathi sukhadha | Krithi | 2 / 20 | `2022-08-niravathi-sukhadha-ravichandrika-adi` |
| sogasugA mRdhanga | Krithi | 2 / 20 | `2022-11-sogasuga-mrdhanga-shri-ranjani-roopakam` |
| Agama rAjagopAla | Krithi | 2 / 20 | `2026-01-agama-rajagopala-kedharam-khandachapu` |
| Devamanohari | Jathiswaram | 1 / 10 | `2020-11-jathiswara-devamanohari-adi` |
| rAja rAja ArAdhithE | Krithi | 1 / 10 | `2021-01-rajarajaradhithe-niroshta-rupakam` |
| neevEpAlincharA | Krithi | 1 / 10 | `2021-02-neevepalinchara-chakravakam-rupakam` |
| sAmidhayameera | Swarajathi | 1 / 10 | `2021-04-samidhayameera-mohanam-swarajathi-aadhi` |
| karikalabhamukham | Krithi | 1 / 10 | `2021-06-karikalabhamukham-saveri-roopakam` |
| valachi vachchi | Varnam | 1 / 10 | `2023-01-varnam-valachi-vachchi-hindhola` |
| rAmam bhajatha manuja | Krithi | 1 / 10 | `2023-06-ramam-bhajatha-manuja-shri-adi` |
| gurumoorthE | Nottuswaram | 1 / 10 | `2023-07-gurumoorthe-nottuswaram-muthuswami` |
| vEnkatEshwara yETTappa | Krithi | 1 / 10 | `2023-12-venkateshwara-yettappa-megha-ranjani` |
| rAga sudhArasa | Krithi | 1 / 10 | `2024-02-raga-sudharasa-andholika-adi-thyagaraja` |
| bRhadheeshwarO | Krithi | 1 / 10 | `2025-12-brhadheeshwaro-ganasamavarali-roopakam` |
| CHAyAvathim | Krithi | 1 / 10 | `2026-06-chayavathim-chayavathi-adi` |
| shrI kamalAmbAyAh | Krithi | 2 / 21 | `2025-07-shri-kamalambayah-bhairavi-mishra` |
| HimadhriSuthe | Krithi | 2 / 22 | `2020-11-himadhrisuthe-kalyani-rupakam` |
| MurugaMuruga | Krithi | 2 / 22 | `2021-09-murugamuruga-saveri-mishrachapu` |
| karugadhA neeku rAma | Krithi | 2 / 22 | `2024-06-karugadha-neeku-rama-revathi-adi-g` |
| DeviBrovaSamayamidhe | Krithi | 1 / 11 | `2020-12-devibrovasamayamidhe-chinthamani-aadhi` |
| dhEva dhEva | Krithi | 1 / 11 | `2023-01-dheva-dheva-mayamalavagowlam-rupakam` |
| kRshNAmoorthi kaNNamundhE | Dasara pada | 1 / 11 | `2024-02-krshnamoorthi-kannamundhe` |
| shrI rAmam | Krithi | 1 / 11 | `2024-03-shri-ramam-narayanagowlam-adi` |
| shrI vAsudhEva | Krithi | 1 / 11 | `2026-01-shri-vasudheva-ramapriya-tisra-roopakam` |
| kanakana ruchirA | Krithi | 3 / 34 | `2021-08-kanakana-ruchira-varali-adi-thyagaraja` |
| thElisi rAma | Krithi | 2 / 23 | `2022-09-thelisi-rama-poornachandhrika-adi` |
| Mangalavaradayaki | Krithi | 1 / 12 | `2020-10-mangalavaradayaki-kadanakuthoohalam-adi` |
| Saraswatheem | Krithi | 1 / 12 | `2021-01-saraswatheem-antharakaishikee-rupakam` |
| Shanmukhapriya | Lakshana geetham | 1 / 12 | `2021-01-shanmukhapriya-lakshana-geetham-tisra` |
| hariyuvathIm haimavathIm | Krithi | 1 / 12 | `2021-07-hariyuvathim-haimavathim-haimavathi` |
| karuNisou thAyE | Krithi | 1 / 12 | `2022-07-karunisou-thaye-saraswathi-manohari-adi` |
| viribONi | Varnam | 3 / 37 | `2022-04-viriboni-bhairavi-varnam-ata` |
| ShriChakraRaja | Krithi | 2 / 25 | `2021-03-shrichakraraja-ragamalika-adi-agasthiyar` |
| bArO krishnayyA | Dasara pada | 2 / 25 | `2022-06-baro-krishnayya-ragamalika-adi` |
| pAhi mAm shrI | Krithi | 1 / 13 | `2022-05-pahi-mam-shri-janaranjani-adi-maha` |
| namOsthuthE saraswathI | Krithi | 1 / 13 | `2022-09-namosthuthe-saraswathi-vagadheeshwari` |
| shankari shankuru | Krithi | 1 / 13 | `2022-11-shankari-shankuru-saveri-adi-tisra` |
| soorya | Thillana | 1 / 13 | `2023-10-thillana-tham-tham-soorya-adi-rukmini` |
| kanakasabhApathi dharisanam | Krithi | 1 / 13 | `2023-11-kanakasabhapathi-dharisanam-dhanyasi` |
| vishwEshwara darashana kar | Krithi | 1 / 13 | `2024-02-vishweshwara-darashana-kar-sindhu` |
| yEntha ninnu vEdithinE | Krithi | 1 / 13 | `2024-10-yentha-ninnu-vedithine-chandhrahasitham` |
| shrInivAsa thiru | Krithi | 1 / 13 | `2025-03-shrinivasa-thiru-hamsanandhi-adi` |
| neelOthpalAmbikayA | Krithi | 1 / 13 | `2025-09-neelothpalambikaya-kannada-gowlam-adi` |
| PaahiSadhaaPadmanabha | Krithi | 1 / 14 | `2020-10-paahisadhaapadmanabha-mukhari-rupakam` |
| Hamsanandhi | Jathiswaram | 1 / 14 | `2021-01-hamsanandhi-jathiswara-rupakam` |
| Samayamidhe | Krithi | 1 / 14 | `2021-01-samayamidhe-kedaram-roopakam` |
| neekanna dhikkEvarurA | Krithi | 1 / 14 | `2023-02-neekanna-dhikkevarura-pushpalathika` |
| nAnoru viLaiyAtti bommaiyA | Krithi | 1 / 14 | `2023-10-nanoru-vilaiyatti-bommaiya-navarasa` |
| kakAra roopA pAthu mAm shrI | Krithi | 1 / 14 | `2024-03-kakara-roopa-pathu-mam-shri-kanakangi` |
| AndavanE unnai nambinEn | Krithi | 1 / 14 | `2024-07-andavane-unnai-nambinen-shanmukhapriya` |
| mahAlakshmi mAm pAhi | Krithi | 1 / 14 | `2026-10-mahalakshmi-mam-pahi-manirangu-rupakam` |
| Saami Ninne Kori | Varnam | 1 / 15 | `2021-01-shankharabharanam-saami-ninne-kori` |
| GathiNee | Varnam | 1 / 15 | `2021-03-gathinee-saraswathi-varnam-adi` |
| NeerajAnau | Varnam | 1 / 15 | `2021-05-neerajanau-saama-varnam-adi-kothavasal` |
| manasu vishaya | Krithi | 1 / 15 | `2022-10-manasu-vishaya-natakurunji-adi` |
| nAdhupai balikEru | Krithi | 1 / 15 | `2022-12-nadhupai-balikeru-madhyamavathi` |
| chandhrakauns | Thillana | 1 / 15 | `2024-08-thillana-tha-tha-dhim-chandhrakauns` |
| vENugAna lOluni | Krithi | 1 / 15 | `2024-11-venugana-loluni-kedharagowlam-rupakam` |
| Navaragamalika | Varnam | 1 / 16 | `2021-02-navaragamalika-saamininne-varnam` |
| thuLasiJagadjanani | Krithi | 1 / 16 | `2021-05-tulasijagadjanani-saveri-roopakam` |
| dhEvi paramEshwari | Krithi | 1 / 16 | `2026-02-dhevi-parameshwari-hemavathi-rupakam` |
| rAma bhakthi | Krithi | 1 / 17 | `2022-07-rama-bhakthi-shuddha-bangala-adi` |
| ANma gnyAna | Varnam | 1 / 17 | `2022-09-daru-varnam-anma-gnyana-shuddhadhanyasi` |
| kAmAkshi | Krithi | 1 / 17 | `2023-11-kamakshi-varali-mishrachapu-shyama` |
| Ghanaraga Navaragamalika | Varnam | 1 / 18 | `2021-01-ghanaraga-navaragamalika-varnam-intha` |
| Dhanashri | Thillana | 1 / 18 | `2021-05-geethadhuniki-dhanashri-adi` |
| gnyAnAmbikayA samrakshithOham | Krithi | 1 / 19 | `2022-12-gnyanambikaya-samrakshithoham` |
| namO namO lakshmI narasimha | Krithi | 1 / 19 | `2023-01-namo-namo-lakshmi-narasimha` |
| Om namO nArAyaNA | Krithi | 1 / 19 | `2023-09-om-namo-narayana-karnaranjani-khanda` |
| dhivAkara thanujam | Krithi | 1 / 19 | `2024-02-dhivakara-thanujam-yadhukula-kambhoji` |
| maguva ninnE | Varnam | 1 / 19 | `2024-03-maguva-ninne-narayanagowlam-varnam-ata` |
| sendhil vAzh murugaiyA | Varnam | 1 / 19 | `2025-12-sendhil-vazh-murugaiya-hameer-kalyani` |
| InthaChalamu | Varnam | 1 / 20 | `2021-03-varnam-inthachalamu-begade-adi-veena` |
| Sogasujoodatharama | Krithi | 1 / 20 | `2021-06-sogasujoodatharama-kannadagowla` |
| seethamma | Krithi | 1 / 20 | `2022-12-seethamma-vasantha-roopakam-thyagaraja` |
| sEvE shrIkAntham | Krithi | 1 / 20 | `2024-12-seve-shrikantham-mohanakalyani-adi` |
| OrajoopujuchEdhi | Krithi | 1 / 21 | `2021-06-orajoopujuchedhi-kannadagowla-adi` |
| Reethigowla | Varnam | 1 / 21 | `2021-06-reethigowla-vanajaksha-varnam-ata-veena` |
| shrI kAnthimathIm | Krithi | 1 / 21 | `2021-11-shri-kanthimathim-haimavathi-rupakam` |
| thAyE yashOdha | Krithi | 1 / 21 | `2023-01-thaye-yashodha-thodi-adi-oothukadu` |
| anaghAm akhilANda nAyakam | Krithi | 1 / 21 | `2023-03-anagham-akhilanda-nayakam-mandhari` |
| rAga rathna mAlikachE | Krithi | 1 / 21 | `2024-01-raga-rathna-malikache-reethigowlam` |
| shyAma sundharAnga | Krithi | 1 / 21 | `2026-06-shyama-sundharanga-dhanyasi-adi` |
| vAthApi gaNapathim | Krithi | 2 / 44 | `2022-10-vathapi-ganapathim-hamasdhwani-adi` |
| Shankari Sadananda Lahari | Krithi | 1 / 22 | `2017-12-shankari-sadananda-lahari-malavi-adi` |
| MayamalavaGowla | Varnam | 1 / 22 | `2021-02-mayamalavagowla-mayamyetho-varnam-adi` |
| nAma kusuma | Krithi | 1 / 22 | `2023-01-nama-kusuma-shri-adi-thyagaraja` |
| jagadhODHArana | Dasara pada | 1 / 22 | `2023-09-jagadhodharana-hindhusthani-kapi-adi` |
| Nalinakanthi | Varnam | 1 / 23 | `2021-01-nalinakanthi-neevegathiyani-varnam-adi` |
| padhmAvathi ramaNam | Krithi | 1 / 23 | `2025-11-padhmavathi-ramanam-poorvikalyani` |
| kamalAmbikAyai kanakAmshukAyai | Krithi | 1 / 24 | `2025-02-kamalambikayai-kankamshukayai-kambhoji` |
| jagadheeshwari | Krithi | 1 / 25 | `2024-03-jagadheeshwari-bindhumalini-adi` |
| angayarkaNNi | Varnam | 1 / 34 | `2026-07-angayarkanni-navaragamalika-padha` |
| RanjaniMridhuPankajalochani | Krithi | 1 / 35 | `2020-11-ranjanimridhupankajalochani` |
| kurai onRum illai | Krithi | 1 / 35 | `2023-10-kurai-onrum-illai-ragamalika-adi-c` |
| vanajAkshi | Varnam | 1 / 36 | `2026-10-vanajakshi-kalyani-varnam-ata-pallavi` |
| lalitha lavanga | Ashtapadi | 1 / 41 | `2025-07-lalitha-lavanga-ashtapadhi-ragamalika` |
| pannagEndhra shayanA | Krithi | 1 / 47 | `2024-05-pannagendhra-shayana-ragamalika` |
| Endaro mahAnubhAvulu | Krithi | 1 / 56 | `2021-07-endaro-mahanubhavulu-shree-adi` |
| bhaja govindham | Shlokam | 1 / 73 | `2024-02-bhaja-govindham-ragamalika-adi-adi` |

### Every composition with a "fixed" tag (148)

`2022-04-viriboni-bhairavi-varnam-ata` 13 · `2023-06-shri-vishwanatham-chathurdasha` 10 · `2022-10-manasu-vishaya-natakurunji-adi` 7 · `2024-04-mohanam-thava-mohanam-adi-swathi` 7 · `2022-07-paripahimam-nruhare-mohanam-mishrachapu` 5 · `2023-01-shri-rajeevaksha-yadhukulakambhoji` 5 · `2024-03-maguva-ninne-narayanagowlam-varnam-ata` 5 · `2021-01-hamsanandhi-jathiswara-rupakam` 4 · `2021-05-sarasijanabha-kambhoji-varnam-ata` 4 · `2022-06-vizhimizhalai-vazhiraiva` 4 · `2023-05-krupaya-palaya-shaurey-charukeshi` 4 · `2024-04-jathiswara-shri-ranjani-roopakam` 4 · `2024-09-kanakashaila-viharini-punnagavarali` 4 · `2020-10-mangalavaradayaki-kadanakuthoohalam-adi` 3 · `2020-12-gowrinaatham-vakulabharanam-adi` 3 · `2021-01-kaanada-neranammithi-ata-varnam` 3 · `2021-02-srijaalandhara-gambheeranattai-adi` 3 · `2022-11-emi-neramo-nannu-brova-shankarabharanam` 3 · `2022-12-gnyanambikaya-samrakshithoham` 3 · `2023-01-shri-krishnam-bhaja-manasa-thodi-adi` 3 · `2023-09-jagadhodharana-hindhusthani-kapi-adi` 3 · `2023-12-sukhi-evvaro-kanada-adhi-thyagaraja` 3 · `2024-02-nannu-palimpa-mohanam-adi-thyagaraja` 3 · `2020-12-devibrovasamayamidhe-chinthamani-aadhi` 2 · `2020-12-maaruthenamosthuthe-kaanada` 2 · `2020-12-marakathamanimaya-aarabhi-aadi` 2 · `2020-12-shivakaameshwaram-aarabhi-aadi` 2 · `2021-01-karunimchuta-sindhumandhari-adi` 2 · `2021-03-shrichakraraja-ragamalika-adi-agasthiyar` 2 · `2021-08-krishna-nee-begane-baro-yamankalyan` 2 · `2021-11-parayo-sumanesaranjani-varnam-adi` 2 · `2022-02-kaa-vaa-vaa-varali-adhi-papanasamsivan` 2 · `2022-04-palinchu-kamakshi-madhyamavathi-adi` 2 · `2022-04-sharanagatha-vathsaley` 2 · `2022-11-inka-dhaya-chakravakam-adi` 2 · `2022-11-shri-chamundeshwari-bilahari-adi` 2 · `2022-12-panthuvarali-chalamujesedhi-varnam-ata` 2 · `2022-12-shri-dhurge-harikambhoji-varnam-ata` 2 · `2023-11-na-jeevadhara-bilahari-adi-thyagaraja` 2 · `2024-01-chethulara-bhairavi-adi-thyagaraja` 2 · `2024-01-mallari-notes` 2 · `2024-02-krshnamoorthi-kannamundhe` 2 · `2024-02-parvathi-nayaka-bowli-adi-swathi` 2 · `2024-03-intha-sowkhyamani-hindhusthani-kapi-adi` 2 · `2024-09-neelothpalambam-bhajare-reethigowlam` 2 · `2024-10-karunimchi-kapadu-yadhukula-kambhoji` 2 · `2024-11-thalli-ninnu-nera-nammi-kalyani` 2 · `2024-12-jaya-dhevi-jaganmathe-gowdamalhar` 2 · `2025-01-guruguha-bhavantharanginim` 2 · `2025-03-nadhopasana-begade-adi-thyagaraja` 2 · `2025-07-kamalambikaya-sthava-bhakthoham` 2 · `2025-07-shri-kamalambikayam-sahana-thisra` 2 · `2025-11-saghara-shayana-vibho-bageshri-adi-md` 2 · `2026-10-indha-paramugam-poorvikalyani-adi` 2 · `2018-01-sharavanabhava-pashupathipriya-adi` 1 · `2020-10-paahisadhaapadmanabha-mukhari-rupakam` 1 · `2020-11-brindhaavanagopaala-yamunakalyani` 1 · `2020-11-jathiswara-bhairavi-adi` 1 · `2020-12-poorayamamakaamam-bilahari-aadhi` 1 · `2020-12-shreesaambashivam-bilahari-adi` 1 · `2020-12-swaaminannubrova-kaanada-aadi` 1 · `2021-01-abhogi-jathiswara-adi` 1 · `2021-01-durbar-chalamela-varnam-adi` 1 · `2021-01-hamsanadham-jathiswara-rupakam` 1 · `2021-01-kaliyuga-varadhan-brindhavana-saaranga` 1 · `2021-01-kedaram-jathiswara-adi` 1 · `2021-02-neevepalinchara-chakravakam-rupakam` 1 · `2021-02-shankharabharanam-chalamela-varnam-ata` 1 · `2021-03-kamakshi-madhyamavathi-geetham-thriputa` 1 · `2021-03-neelambari-jathiswara-adi-veena` 1 · `2021-03-veregathiledhani-vasantha-adi-veena` 1 · `2021-05-paramapurusha-vasantha-adi` 1 · `2021-05-thiruppavai-05-maayanai-shree-adi-andal` 1 · `2021-06-reethigowla-vanajaksha-varnam-ata-veena` 1 · `2021-07-hemavathi-jathiswara-rupakam-thanjavur` 1 · `2021-07-shree-raghuvaraprameya-kambhoji-adi` 1 · `2021-10-kala-beda-shuddha-dhanyasi-khandachapu` 1 · `2021-11-ranjaniniranjani-ranjani-adi-gn` 1 · `2021-12-vachaspathi-jathiswaram-adi` 1 · `2022-01-kamalamba-samrakshathu-mam-anandha` 1 · `2022-02-poornachandrabimba-shadragamalika` 1 · `2022-02-sheshachala-vasa-kedharagowla-roopakam` 1 · `2022-04-varnam-chalamela-hemavathi-adi-veena` 1 · `2022-05-pahi-mam-shri-janaranjani-adi-maha` 1 · `2022-07-dharmasamvardhini-madhyamavathi-rupakam` 1 · `2022-07-shri-kamakshi-hindolam-adi` 1 · `2022-08-giripai-nelakona-sahana-adi-thyagaraja` 1 · `2022-09-marakathavalli-kambhoji-adi` 1 · `2022-10-nijamuga-rama-keeravani-adi` 1 · `2022-10-ramachandhram-bhavayami-vasantha` 1 · `2022-10-saraswathi-nannu-brova-kharaharapriya` 1 · `2022-10-varnam-chalamela-bilahari-adi` 1 · `2022-10-vathapi-ganapathim-hamasdhwani-adi` 1 · `2022-11-ni-chithamu-dhanyasi-mishrachapu` 1 · `2022-11-shriman-narayana-bowli-adi-annamacharya` 1 · `2022-12-kalaharana-melarahare-shuddhasaveri` 1 · `2023-01-nama-kusuma-shri-adi-thyagaraja` 1 · `2023-01-nenaruleni-balahamsa-varnam-ata` 1 · `2023-03-shuddha-dhanyasi-jathiswara-mishrachapu` 1 · `2023-05-mamava-sadha-janani-kanada-rupakam` 1 · `2023-06-mahadheva-shiva-shambho-revathi-adi` 1 · `2023-06-mamayoora-meedhileri-va-bilahari-adi` 1 · `2023-07-akhilandeshwari-rakshamam-dwijavanthi` 1 · `2023-07-sami-ninne-narayani-varnam-ata` 1 · `2023-11-kamakshi-varali-mishrachapu-shyama` 1 · `2023-11-sendhil-andavan-kharaharapriya-rupakam` 1 · `2023-12-adikondar-mayamalavagowlam-adi` 1 · `2023-12-bhajare-rey-manasa-abheri-adi` 1 · `2024-01-kamalambike-amba-thodi-thishra-eka` 1 · `2024-02-dhinamani-vamsha-harikambhoji-adi` 1 · `2024-02-yethavunara-kalyani-adi-thyagaraja` 1 · `2024-03-jagadheeshwari-bindhumalini-adi` 1 · `2024-03-narmadha-kaveri-namadheshi-mishrachapu` 1 · `2024-03-roopamu-joochi-thodi-varnam-adi` 1 · `2024-04-rama-neeyeda-kharaharapriya-adi` 1 · `2024-04-yentha-mathramuna-ragamalika-mishra` 1 · `2024-05-pannagendhra-shayana-ragamalika` 1 · `2024-07-kambhoji-adi-jathiswara-veena-sheshanna` 1 · `2024-08-bhairavi-2-adi-jathiswara` 1 · `2024-08-harivarasanam-madhyamavathi-adi-tisra` 1 · `2024-08-shri-ramana-vibho-arabhi-adi-swathi` 1 · `2024-09-bhairavam-bhavayeham-bhairavam-adi` 1 · `2024-09-kalabhairavam-bhajeham-bhairavam-adi` 1 · `2024-09-mamava-meenakshi-manirangu-mishrachapu` 1 · `2024-09-pankajasane-pahimam-shri-adi` 1 · `2024-09-rasa-keli-vilasa-kharaharapriya-adi` 1 · `2024-09-shri-chamundeshwarim-madhyamavathi` 1 · `2024-09-shri-ramachandhra-kamalamanohari-varnam` 1 · `2024-09-shri-saraswathi-shuddha-saveri-adi` 1 · `2024-10-palaya-mam-vijayanagari-khanda-jhampe` 1 · `2024-12-ashtadhasha-supeetasthe-simhendhra` 1 · `2025-02-shri-kamalambikaya-shankarabharanam` 1 · `2025-05-gajananam-bhavaye-hamsadhwani-rupakam` 1 · `2025-05-kalyani-adi-jathiswara-dandayudhapani` 1 · `2025-06-aryam-abhayambam-bhajare-bhairavi` 1 · `2025-06-lalithe-shri-vani-lalitha-adi` 1 · `2025-08-shankarabharanam-jathiswara-roopakam` 1 · `2025-08-shri-mathrbhootham-kannada-mishra-chapu` 1 · `2025-09-adadhu-asangadhu-vaa-madhyamavathi-adi` 1 · `2025-09-neelothpalambikaya-kannada-gowlam-adi` 1 · `2025-11-ekadhantha-vinayakam-nattai-khanda` 1 · `2025-12-chidhambara-nataraja-thanukeerthi` 1 · `2025-12-idhi-nyayama-malavi-adi` 1 · `2026-02-jathiswara-shankarabharanam-adi-veena` 1 · `2026-04-chandhrachooda-shiva-darbari-kanada-adi` 1 · `2026-04-mandagamane-ivan-yare-khamas-adi` 1 · `2026-05-shwetha-ganapathim-ragachoodamani` 1 · `lesson-gurukulam-sri-himachala-suthe-nata` 1

<!-- stats:end -->
