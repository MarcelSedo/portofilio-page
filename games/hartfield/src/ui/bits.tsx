"use client";
import { ART } from "../engine/art";
import { CAST_ORDER, ICON_ORDER } from "../data/maps.gen";

/** a 16 px item icon, scaled up crisply */
export function Icon({ name, scale = 3 }: { name: string; scale?: number }) {
  const i = Math.max(0, (ICON_ORDER as readonly string[]).indexOf(name));
  return (
    <span aria-hidden="true" className="hf-pix" style={{
      display: "inline-block", width: 16 * scale, height: 16 * scale,
      backgroundImage: `url(${ART.icons})`, backgroundSize: `${16 * ICON_ORDER.length * scale}px ${16 * scale}px`,
      backgroundPosition: `${-i * 16 * scale}px 0`,
    }} />
  );
}

/** an oval-framed bust (40x44 px) */
export function Portrait({ id, scale = 2, unknown }: { id: string; scale?: number; unknown?: boolean }) {
  const i = (CAST_ORDER as readonly string[]).indexOf(id);
  if (i < 0 || unknown) return <span aria-hidden="true" className="hf-portrait-unknown" style={{ width: 40 * scale, height: 44 * scale }}>?</span>;
  return (
    <span aria-hidden="true" className="hf-pix" style={{
      display: "inline-block", width: 40 * scale, height: 44 * scale, flex: "none",
      backgroundImage: `url(${ART.portraits})`, backgroundSize: `${40 * CAST_ORDER.length * scale}px ${44 * scale}px`,
      backgroundPosition: `${-i * 40 * scale}px 0`,
    }} />
  );
}
