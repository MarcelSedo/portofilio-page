/**
 * Ornaments for the menus, in the manner of the old Irish gospel books (and The Secret of Kells):
 * triple spirals in the corners, a plaited band along the edges, a medallion with antlers on top,
 * and a vine with leaves between the title and the rest. All decoration: hidden from screen readers.
 */

const r2 = (n: number) => Math.round(n * 100) / 100;

/** an open spiral from the middle outwards, as an SVG path */
function spiral(cx: number, cy: number, turns: number, r0: number, r1: number, rot: number) {
  const pts: string[] = [];
  const steps = Math.round(turns * 28);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = rot + t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    pts.push(`${r2(cx + Math.cos(a) * r)} ${r2(cy + Math.sin(a) * r)}`);
  }
  return `M${pts.join(" L")}`;
}

/** three spirals turning round one middle: the triskele */
function triskele(cx: number, cy: number, size: number) {
  return [0, 1, 2]
    .map((k) => {
      const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
      return spiral(cx + Math.cos(a) * size * 0.42, cy + Math.sin(a) * size * 0.42, 1.6, size * 0.06, size * 0.46, a + Math.PI);
    })
    .join(" ");
}

/** two strands plaited along a straight edge */
function plait(x0: number, x1: number, y: number, amp: number, wave: number) {
  const strand = (ph: number) => {
    const pts: string[] = [];
    for (let x = x0; x <= x1; x += 1.5) pts.push(`${r2(x)} ${r2(y + Math.sin(((x - x0) / wave) * Math.PI * 2 + ph) * amp)}`);
    return `M${pts.join(" L")}`;
  };
  return [strand(0), strand(Math.PI)];
}

/** the same plait running down an edge */
function plaitDown(y0: number, y1: number, x: number, amp: number, wave: number) {
  const strand = (ph: number) => {
    const pts: string[] = [];
    for (let y = y0; y <= y1; y += 1.5) pts.push(`${r2(x + Math.sin(((y - y0) / wave) * Math.PI * 2 + ph) * amp)} ${r2(y)}`);
    return `M${pts.join(" L")}`;
  };
  return [strand(0), strand(Math.PI)];
}

const CORNER_SPIRAL = triskele(17, 17, 22);
const [PLAIT_A, PLAIT_B] = plait(31, 76, 6, 3, 15);
const [PLAIT_C, PLAIT_D] = plaitDown(31, 76, 6, 3, 15);
const MEDAL_SPIRAL = triskele(32, 34, 20);

function Corner({ at }: { at: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg className={`ls-orn is-${at}`} viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* the plaited band running off along both edges */}
        <path d={PLAIT_A} stroke="#0c1410" strokeWidth="4.4" />
        <path d={PLAIT_A} stroke="var(--ls-gold-d)" strokeWidth="2.2" />
        <path d={PLAIT_B} stroke="#0c1410" strokeWidth="4.4" />
        <path d={PLAIT_B} stroke="var(--ls-orn-2)" strokeWidth="2.2" />
        <path d={PLAIT_C} stroke="#0c1410" strokeWidth="4.4" />
        <path d={PLAIT_C} stroke="var(--ls-gold-d)" strokeWidth="2.2" />
        <path d={PLAIT_D} stroke="#0c1410" strokeWidth="4.4" />
        <path d={PLAIT_D} stroke="var(--ls-orn-2)" strokeWidth="2.2" />
        {/* the roundel with its triple spiral */}
        <circle cx="17" cy="17" r="15" fill="#10201a" stroke="#0c1410" strokeWidth="4" />
        <circle cx="17" cy="17" r="15" stroke="var(--ls-gold)" strokeWidth="2" />
        <circle cx="17" cy="17" r="11.4" stroke="var(--ls-orn-3)" strokeWidth="1" />
        <path d={CORNER_SPIRAL} stroke="var(--ls-gold)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/** the medallion on top: a stag's antlers round a triple spiral */
function Medal() {
  return (
    <svg className="ls-medal" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[-1, 1].map((s) => (
          <path
            key={s}
            d={`M${32 + s * 9} 26 Q${32 + s * 16} 16 ${32 + s * 15} 5 M${32 + s * 14} 18 Q${32 + s * 21} 15 ${32 + s * 24} 9 M${32 + s * 15} 11 Q${32 + s * 20} 6 ${32 + s * 21} 2 M${32 + s * 12} 22 Q${32 + s * 25} 22 ${32 + s * 29} 16`}
            stroke="#0c1410"
            strokeWidth="5"
          />
        ))}
        {[-1, 1].map((s) => (
          <path
            key={`g${s}`}
            d={`M${32 + s * 9} 26 Q${32 + s * 16} 16 ${32 + s * 15} 5 M${32 + s * 14} 18 Q${32 + s * 21} 15 ${32 + s * 24} 9 M${32 + s * 15} 11 Q${32 + s * 20} 6 ${32 + s * 21} 2 M${32 + s * 12} 22 Q${32 + s * 25} 22 ${32 + s * 29} 16`}
            stroke="var(--ls-orn-bone)"
            strokeWidth="2.6"
          />
        ))}
        <circle cx="32" cy="34" r="18" fill="#10201a" stroke="#0c1410" strokeWidth="4.5" />
        <circle cx="32" cy="34" r="18" stroke="var(--ls-gold)" strokeWidth="2.2" />
        <circle cx="32" cy="34" r="14" stroke="var(--ls-orn-3)" strokeWidth="1" strokeDasharray="2 2.4" />
        <path d={MEDAL_SPIRAL} stroke="var(--ls-orn-2)" strokeWidth="1.7" />
      </g>
    </svg>
  );
}

/** the frame of a panel: put it first inside a .ls-panel */
export function Ornament({ medal = false }: { medal?: boolean }) {
  return (
    <>
      <Corner at="tl" />
      <Corner at="tr" />
      <Corner at="bl" />
      <Corner at="br" />
      {medal && <Medal />}
    </>
  );
}

/** a vine with leaves and a little spiral in the middle */
export function Divider() {
  const leaf = (x: number, y: number, a: number, k: string) => (
    <path key={k} d="M0 0 Q5 -4 10 0 Q5 4 0 0 Z" transform={`translate(${x} ${y}) rotate(${a})`} fill="var(--ls-orn-leaf)" stroke="#0c1410" strokeWidth="0.8" />
  );
  return (
    <svg className="ls-divider" viewBox="0 0 240 22" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round">
        <path d="M8 11 C40 2 70 20 102 11 M138 11 C170 2 200 20 232 11" stroke="#0c1410" strokeWidth="3.6" />
        <path d="M8 11 C40 2 70 20 102 11 M138 11 C170 2 200 20 232 11" stroke="var(--ls-gold-d)" strokeWidth="1.6" />
        {[
          [30, 6.5, -150],
          [52, 12, 30],
          [76, 13.5, -30],
          [92, 10, 160],
          [148, 10, 20],
          [164, 13.5, -150],
          [188, 12, 150],
          [210, 6.5, -30],
        ].map(([x, y, a], i) => leaf(x, y, a, `l${i}`))}
        <circle cx="120" cy="11" r="8" fill="#10201a" stroke="var(--ls-gold)" strokeWidth="1.6" />
        <path d={spiral(120, 11, 1.8, 0.4, 5.6, 0)} stroke="var(--ls-orn-2)" strokeWidth="1.3" />
        {[-1, 1].map((s) => (
          <path key={s} d={spiral(120 + s * 108, 11, 1.2, 0.3, 3.4, s > 0 ? Math.PI : 0)} stroke="var(--ls-gold)" strokeWidth="1.3" />
        ))}
      </g>
    </svg>
  );
}
