/* Vocal Gym engine · gamaka rendering constants (docs/plans/gamaka-audio.md §2)
   Times are in seconds. Transients keep their length in seconds when the tempo changes; only
   constant-pitch notes (CPNs) and oscillation cycles give way (S195). Defaults to tune in Phase 5. */
export const CPN_MIN = 0.08;       // the 80 ms CPN definition (S193)
export const STA_DWELL = 0.06;     // a stationary point of about 100 ms, minus its transitions
export const TRANS_SEC = 0.05;     // a transition between targets (a mean transient of about 100 ms, in two halves)
export const JARU_SEC = 0.14;      // a deliberate slide, perceptibly longer than a transition
export const NOKKU_SEC = 0.05;     // a short flick from above or below
export const ORIKKAI_SEC = 0.07;   // the flick up at the end of a note
export const MAX_RATE_HZ = 5;      // one cycle takes at least 2 × (STA_DWELL + TRANS_SEC) ≈ 0.22 s
export const LAND_HOLD = 0.25;     // the final swara keeps a plain CPN at least this long
export const ANDOLITA_SLOW = 1.8;  // andolita dwells this much longer than kampita
export const SAMPLE_SEC = 0.005;   // contour sampling step
export const MAX_SLOPE = 1.4;      // semitones per sample a transition may move at most
