/* Vocal Gym engine · gamaka rendering constants (docs/plans/gamaka-audio.md §2)
   Times are in seconds. Transients keep their length in seconds when the tempo changes; only
   constant-pitch notes (CPNs) and oscillation cycles give way (S195). Defaults to tune in Phase 5. */
export const CPN_MIN = 0.08;       // the 80 ms CPN definition (S193)
export const STA_DWELL = 0.06;     // a stationary point of about 100 ms, minus its transitions
export const TRANS_SEC = 0.05;     // a transition between targets (a mean transient of about 100 ms, in two halves)
export const JARU_SEC = 0.14;      // a deliberate slide, perceptibly longer than a transition
export const NOKKU_SEC = 0.05;     // a short flick from above or below
export const ORIKKAI_SEC = 0.07;   // the flick up at the end of a note
export const MAX_RATE_HZ = 5;      // one cycle takes at least 2 × (STA_DWELL + TRANS_SEC) ≈ 0.22 s (the natural contour: CYCLE_MIN)
export const LAND_HOLD = 0.25;     // the final swara keeps a plain CPN at least this long
export const ANDOLITA_SLOW = 1.8;  // andolita dwells this much longer than kampita
export const SAMPLE_SEC = 0.005;   // contour sampling step
export const MAX_SLOPE = 1.4;      // semitones per sample a transition may move at most

/* natural motion (docs/research/gamaka-naturalness.md §3.1). The v0.4 values above still drive
   buildContour without `natural`, so the old renderer is reproducible. */
export const MOVE_SEC = 0.08;      // a move between targets a semitone or less apart (mean transient ≈ 100 ms with its turn, S193)
export const MOVE_PER_ST = 0.008;  // longer by this per semitone above 1
export const MOVE_MAX = 0.13;
export const TURN_SEC = 0.02;      // a stationary point is a rounded turn, not a plateau (S201, S193)
export const TURN_FULL = 0.035;    // firmer turns on the target swaras at full intensity
export const REACH_JITTER = 0.12;  // SD of a turn's reach, as a share of its swing (STA tolerance ≈ 60 c, S194)
export const TIME_JITTER = 0.18;   // a move is longer by up to this share, never shorter (keeps the rate cap)
export const OVERSHOOT = 0.08;     // past a CPN on arrival, as a share of the step (S200; kept inside the ±0.3 st CPN band)
export const OVERSHOOT_MAX = 0.22; // semitones: with the slow drift (3 c RMS) the held swara stays inside the ±0.3 band
export const OVERSHOOT_PEAK = 0.035; // seconds after arrival (S200: ω = 0.0348 rad/ms)
export const PREP = 0.04;          // the opposite dip before leaving a CPN, as a share of the coming step (S200)
export const PREP_MAX = 0.12;
export const PREP_PEAK = 0.04;
export const DRIFT_CENTS = 3;      // slow drift, RMS (long-CPN precision ≈ 10 c, S194)
export const FLUTTER_CENTS = 1.2;  // fast fine fluctuation, RMS (S200)

/* timing and shape from the research folder (docs/research/gamaka-papers.md) */
export const SEMITONE_SEC = 0.05;  // the speed limit: a move takes at least 50 ms per semitone, 100 ms per tone (S210 Table 6.4)
export const LEAP_MAX = 0.16;      // no move is slowed past this: a leap between swaras, or a swing of more than three semitones
export const CYCLE_MIN = 0.25;     // one oscillation takes 250–500 ms (S205): when time is short there are fewer, not faster
export const CYCLE_MAX = 0.5;
export const ANCHOR_SHARE = 0.7;   // of a long note's spare time, the share its oscillation's anchors may take first
export const PEAK_CENTS = 25;      // a peak in a deep oscillation overshoots by 25 c per semitone of depth beyond one (S210 §6.3.5)
export const PEAK_SHORT = 0.07;    // only a short peak (a sub-pulse sustain) overshoots; longer ones do not (S210)
export const VOICE_GLIDE = 0.6;    // the plain voice joins straight notes with moves this share of a gamaka move
