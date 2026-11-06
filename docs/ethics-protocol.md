# Voice Check and the teacher panel: draft ethics protocol

**Status: draft. It has not been reviewed or approved by any ethics committee.** No one's data may be collected for research under it until a committee has approved it. Until then, Voice Check is only a personal tool whose numbers stay in the singer's own account. Items marked **[to fill in]** need a decision from the investigator or the institution. The legal points below should be checked by the institution before submission; they are not legal advice.

## 1. Summary

Vocal Gym is a practice app for Carnatic singers. Phase 1 of its research plan collects daily voice measurements so that a later phase can study whether a personal baseline can track vocal fatigue. This protocol covers two activities:

- **Voice Check:** a daily sung probe of about 90 seconds, measured on the singer's device, with a short self-report.
- **Teacher panel:** 5 to 8 Carnatic teachers who review the app's raga phrases and try its routines with students.

| | |
| --- | --- |
| Principal investigator | **[to fill in]** |
| Institution and committee | **[to fill in]** |
| Funding | **[to fill in]** |
| Planned start and length | **[to fill in]** |

## 2. Questions

Phase 1 collects data and answers no clinical question. It asks:

1. Will singers complete a daily probe at home, and for how long?
2. How much do the measurements vary from day to day within one singer on one device?
3. Do the three short-form items and the effort rating move together? They are drawn from the Voice Fatigue Index and shortened; the short form **has not been validated**, and validating it is a goal of later work.

## 3. Participants

- **Singers:** Carnatic vocal students and teachers. Number **[to fill in]**.
- **Teachers:** 5 to 8 practising Carnatic teachers, recruited through **[to fill in]**.
- **Excluded from the research dataset:** anyone who has not given consent, and anyone under 18 without verifiable consent from a parent or guardian.
- **Minors:** many students are children. India's Digital Personal Data Protection Act, 2023 requires verifiable parental consent to process a child's personal data. The app only asks people under 18 to speak to a parent; **it does not verify age or parental consent.** Until that is built, recruit adults only, or collect parental consent on paper. **[Decision needed.]**

## 4. What a participant does

Each day, in about two minutes:

1. Sits in a quiet place, ideally with earphones.
2. Sings along with a drone: a sustained "aa" on Sa, twice; three soft "oo" onsets on upper Pa; an "ng" siren; a messa di voce on Sa; and Sarali Varisai 1 in akaram.
3. Answers three questions (0 to 4), an effort rating (0 to 10), hours awake, hours slept, and whether they are unwell, in pain, have lost their voice, or have been hoarse for about four weeks.

Teachers hear the raga phrases in the app, mark each one, suggest others, and may assign routines to students by link.

## 5. Data

| Data | Where it is | Who can see it |
| --- | --- | --- |
| Raw audio | Only on the singer's device, and only if they opt in to keeping it. **It is never uploaded by the app.** | The singer |
| Measurements (pitch steadiness, harmonics to noise, cepstral peak, spectral tilt, range, and similar) | The singer's account, on the server | The singer; the research team only after consent, once this protocol is approved |
| Short form, effort, context, health flags | The singer's account | As above |
| Account details (a name, and an email or Google identity) | The server | The operator |
| Teacher verdicts and suggestions | The server, with the teacher's display name | The research team. A phrase accepted into the raga profiles credits the teacher only if they agree **[consent item to add]** |
| Routine links | The server. Anyone with the link sees the routine and the teacher's display name. | Link holders; the teacher sees only how many added it, never a student's practice |

The health flags and voice measurements should be treated as sensitive even though the 2023 Act has no separate sensitive category.

**Storage and security [to fill in]:** the current server is one SQLite file on the operator's machine, which is not suitable for a real study. Before recruiting, decide on hosting, backups, encryption at rest and access control. Traffic must use HTTPS, because browsers allow the microphone only over HTTPS or on localhost.

**Retention [to fill in]:** a stated period, then deletion or anonymisation.

**De-identification:** a research export should replace accounts with random study IDs and leave out names, emails and dates of birth. **The export does not exist yet; it needs building before any data is used for research.**

## 6. Consent and withdrawal

- The in-app consent says what is measured, what is kept and where, and that this is not a medical test. The version a singer agreed to is stored with each check.
- **That screen is consent to use the feature. It is not research consent.** A separate participant information sheet and consent form are needed. **[to write once this protocol is agreed]**
- A singer can delete a day, delete all their Voice Check data, or delete their account, which removes everything of theirs on the server. Recordings on the device are deleted from the same page.
- Withdrawing has no effect on using the app. Data already de-identified and analysed may not be removable; the information sheet must say so.

## 7. Risks and how they are handled

| Risk | Handling |
| --- | --- |
| Vocal strain from a daily probe | Comfortable range and soft singing; a singer can stop at any step; the probe is short |
| Taking a number as a diagnosis, or a delayed medical visit | The app states this is not a medical test, gives no verdict, and compares a singer only with themselves |
| A health problem surfacing | Pain, lost voice or about four weeks of hoarseness brings a referral message to an ENT doctor or speech-language pathologist, following the AAO-HNS hoarseness guideline (Stachler et al., 2018). **No one monitors these flags: the message appears only to the singer.** The information sheet must say so. |
| Discouragement from comparing with others | No scores, ranks or comparisons with other singers |
| Bystander voices in a recording | Recordings stay on the device; the singer is asked to find a quiet place |
| Exposure of health-related data | See section 5; storage must be settled before recruiting |

## 8. Teacher panel

- **Role:** review phrases raga by raga on the Phrase review page, suggest phrases for ragas with none, and try assigning routines. Roughly **[to fill in]** hours.
- **Payment:** the research plan foresees paid annotators. **[Rate and funding to fill in.]**
- **Disagreement:** schools differ, and a teacher's verdict is one view. Verdicts are recorded per teacher and do not change the app by themselves. A phrase enters the profiles only with a named source and the teacher's agreement.
- **Recruiting:** **[to fill in]**.

## 9. Limits of Phase 1

The app's measurements have been checked on synthetic signals with known answers. They have **not** been validated against clinical instruments or a clinician's rating, and they have not been compared across microphones. Nothing derived from them should be presented as a measure of vocal health.

## 10. Before the first participant

- [ ] Fill in every **[to fill in]** above.
- [ ] Write the participant information sheet and research consent form.
- [ ] Decide how minors are handled.
- [ ] Settle hosting, security, retention and the de-identified export.
- [ ] Get ethics committee approval.
- [ ] Recruit the teacher panel.

## References

- Digital Personal Data Protection Act, 2023 (India).
- Stachler RJ et al. Clinical Practice Guideline: Hoarseness (Dysphonia) (Update). *Otolaryngology–Head and Neck Surgery*, 2018.
- Nanjundeswaran C et al. Vocal Fatigue Index (VFI): Development and Validation. *Journal of Voice*, 2015.
