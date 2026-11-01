# Recording solkattu syllables for jathi playback

Vocal Gym plays jathis with **recorded spoken syllables** when they are available, and with synthesized drum-like hits when they are not. No freely licensed recordings of individual solkattu syllables could be found online, so this guide explains how to make them. It takes about 15 minutes and needs only a phone.

The syllables are played one by one, at whatever tempo and nadai the jathi uses. Each recording is cut short where the next syllable starts. So what matters is a **clean, crisp, natural** rendering of each syllable on its own, the way you would say it in konnakol or nattuvangam.

## Who should record

A dancer, nattuvanar, mridangist or konnakol artist whose pronunciation you want students to hear. Before you record, agree on the terms in writing (a message is enough). The person's name and the licence are stored with the recordings and shown in the app. **CC BY 4.0** is the simplest choice: anyone may use the recordings, crediting the speaker.

## The syllables, in recording order

```
tha ka ki ta dhi mi gi na thom jho nu tat tai tam ya hat hi dhit dhim jham nam ri ku lan gu ga num ha
```

| Group | Syllables | Used in |
| --- | --- | --- |
| Konnakol (essential) | tha ka ki ta dhi mi gi na thom jho nu | tha-ka, ta-ki-ta, ki-ta, tha-ka-dhi-mi, tha-dhi-gi-na-thom, tha-ka-jho-nu |
| Dance | tat tai tam ya hat hi dhit dhim jham nam | tat-tai-tam, tai-ya, tai-hat-tai-hi, jham, nam, dhit, dhim |
| Others | ri ku lan gu ga num ha | rarer compositions |

`ta` is the soft syllable of *ki-ta*, distinct from `tha`. Record it the way it sounds after *ki*. If one sound has two spellings, such as dhom or thom and tei or tai, record the spelling listed here; the app maps the other spellings to it.

You may stop after the first group, or skip any syllable. Anything not recorded is played with the synthesized sound.

## How to record

1. **Room:** a quiet room with soft furnishings, with fans and air-conditioning off. No tanpura, shruti box, music or talam claps while recording, because they would be cut up with the syllables.
2. **Phone:** about 30 cm (one forearm) from the mouth, slightly below it, on a table rather than in the hand. Use a voice-recorder app at its best quality.
3. **Voice:** a steady, medium loudness. Say every syllable at the same distance and effort, as if reciting at a comfortable middle tempo. Not whispered or shouted, and with no pitch glides.
4. **Each syllable four times,** about one per second: *tha … tha … tha … tha*.
5. **Then stay silent for about 3 seconds** before the next syllable. The pause is how the script tells syllables apart.
6. If you make a mistake, finish that syllable, pause, and **say the whole syllable again** after the pause. Then delete the extra group afterwards in an editor. Alternatively, record that syllable as a separate file (see below).

You can make **one long recording** in the order above, or **one file per syllable** named after it (`tha.wav`, `ka.wav`, …). Separate files make retakes easy.

## Files

The script reads **WAV** (16- or 24-bit PCM, or 32-bit float, mono or stereo, 16 kHz or more). Many phones save `.m4a`. Convert it to WAV in Audacity (free): *File → Open*, then *File → Export Audio → WAV*. Do not apply effects; the script trims, level-matches and resamples the takes itself.

## Building the sample bank

From the repository folder:

```
node scripts/solkattu-bank.js --in session.wav --speaker "Name" --license "CC BY 4.0" --source "Recorded in Chennai, November 2026" --preview check.wav
```

For a folder of per-syllable files, use `--in recordings/`. If one long recording leaves out syllables, list what it contains with `--order "tha ka ki ta dhi mi"`.

The script prints each syllable with its number of takes, the length of the two takes it kept, and where they are in `check.wav`. **Listen to `check.wav` with that list.** If a slice holds the wrong syllable, or two syllables run together, the groups were split in the wrong place. Re-record with longer pauses, or adjust `--group-gap` (default 1.5 s). Add `--dry` to check without writing anything. When it sounds right, run it without `--dry`, then:

```
npm run build
```

The bank (`web/shared/solkattu-bank.js`, about 10 KB per syllable) is used by the playground page and by the app. Both have a "Sollu voice" / "Recorded sollus" control that turns it off. `node scripts/solkattu-bank.js --clear` goes back to synthesized sollus.

## What the script does

1. It finds every utterance by its loudness above the room's background, and stops if speech is less than 20 dB above the background.
2. It starts each take a few milliseconds before the consonant, so the syllable lands on its beat. It ends each take where the syllable has decayed 30 dB below its peak, at most 0.4 s.
3. It keeps the 2 most typical takes of each syllable by length and loudness. Playback alternates between them so repeated syllables are not identical.
4. It level-matches the takes (the loudest 10 ms at −14 dBFS), fades them in and out, and resamples them to 16 kHz.
5. It stores them as 8-bit µ-law, base64-encoded.
