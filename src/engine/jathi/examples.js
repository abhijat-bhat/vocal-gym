/* Worked JathiScript examples used by the guide, the demos, the CLI and the tests. */
const JATHI_EXAMPLES = {
adi: `# Adi tala, chatusra nadai, two avartanams from sam.
# The final "thom" of the teermanam lands on sam.
tala: adi
nadai: 4
avartanams: 2
eduppu: sam
land: sam
let A = tha-ka-dhi-mi
let B = tha-ka-jho-nu

$A $B $A $B |                       # laghu: 4 aksharas = 16 matras
tha , dhi , $A |                    # dhrutam: 8 matras
tha-ka-tha-ki-ta tha-ki-ta ||       # dhrutam: 5 + 3 = 8 matras
tha-ka-tha-ki-ta ka-tha-ki-ta tha-ki-ta     # gopuccha yati 5 → 4 → 3
{tha-dhi-gi-na-thom}/3              # teermanam 3 × 5 + 2 × 3 = 21
`,
short: `# The same jathi with one karvai missing. Press Judge to see the fix.
tala: adi
nadai: 4
avartanams: 2
eduppu: sam
land: sam
let A = tha-ka-dhi-mi
let B = tha-ka-jho-nu

$A $B $A $B |
tha dhi , $A |
tha-ka-tha-ki-ta tha-ki-ta ||
tha-ka-tha-ki-ta ka-tha-ki-ta tha-ki-ta
{tha-dhi-gi-na-thom}/3
`,
chapu: `# Misra chapu (3 + 2 + 2 counts), chatusra nadai: 28 matras per avartanam.
# Starts 2 matras before sam (atita eduppu) and lands on sam after 2 avartanams.
tala: misra chapu
nadai: 4
avartanams: 2
eduppu: -2
land: sam

dhi-mi ||                                                  # 2-matra pickup into sam
tha-ka-dhi-mi tha-ka-jho-nu tha-ka-dhi-mi | tha , dhi , tha-ka-dhi-mi | tha-ki-ta tha-ka-tha-ki-ta ||
gi-na-thom dhi-gi-na-thom tha-dhi-gi-na-thom                # srotovaha yati 3 → 4 → 5
{tha-dhi-gi-na-thom}/1
`,
speed: `# Rupaka (chatusra jati: dhrutam + laghu = 6 aksharas), 2 avartanams.
# The second avartanam opens at double speed (@8), then returns to @4.
tala: rupaka
nadai: 4
avartanams: 2
land: sam

tha , ki-ta tha-ka-dhi-mi | tha-ka-dhi-mi tha-ka-jho-nu (tha-ka-dhi-mi)x2 ||
@8 (tha-ka-dhi-mi-tha-ka-jho-nu)x2 | @4 {tha-dhi-gi-na-thom}/1
`};

export { JATHI_EXAMPLES };
