import type { Clue, House, Line, Scenario, Speaker } from "@/content/games/emma/types";

/**
 * A season tells four of the seven love stories (its "cast"), plus one more couple who are only there
 * to confuse you (the "decoy"). This file cuts the full scenario down to what this season contains:
 * clues, lines, rooms and guests from stories that aren't being told simply aren't there.
 */

/** which stories a clue belongs to: explicit, or from what it proves, or from its id's letter */
export function chainsOf(c: Clue): string[] {
  if (c.chain) return c.chain;
  if (c.supports) return [c.supports];
  const m = /^([a-g])-/.exec(c.id);
  return m ? [m[1].toUpperCase()] : [];
}

export function pickCast(sc: Scenario, rnd: () => number = Math.random): { cast: string[]; decoy: string | null } {
  const all = Object.keys(sc.chains ?? sc.pairs);
  const n = sc.castSize ?? all.length;
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const cast = pool.slice(0, n).sort();
  const decoy = pool[n] ?? null;
  return { cast, decoy };
}

const cache = new Map<string, Scenario>();

export function castView(sc: Scenario, cast: string[] | undefined, decoy: string | null | undefined): Scenario {
  if (!sc.chains || !cast) return sc;
  const key = `${sc.id}|${cast.join("")}|${decoy ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const on = (ch: string) => cast.includes(ch);
  const clueById = new Map(sc.clues.map((c) => [c.id, c]));
  const clueOn = (id: string) => {
    const c = clueById.get(id);
    return !c || chainsOf(c).every(on);
  };
  const flagChain = new Map<string, string>();
  const allLines = [...sc.green, ...sc.houses.flatMap((h) => h.people), ...(sc.ball?.guests ?? [])].flatMap((sp) => sp.lines);
  for (const l of allLines) if (l.chain && l.quest) flagChain.set(l.quest.flag, l.chain);
  /** can this need ever be met in this season? */
  const possible = (n: string) => (clueById.has(n) ? clueOn(n) : flagChain.has(n) ? on(flagChain.get(n)!) : true);
  const lineOn = (l: Line) =>
    (!l.clue || clueOn(l.clue)) && (!l.chain || on(l.chain)) && (!l.needs || l.needs.some(possible));

  const personChain = new Map(sc.people.map((p) => [p.id, p.chain]));
  const decoyPeople = new Set(sc.people.filter((p) => p.chain && p.chain === decoy).map((p) => p.id));

  const speaker = (sp: Speaker): Speaker | null => {
    const ch = sp.chain ?? personChain.get(sp.who);
    if (ch && !on(ch)) {
      if (decoyPeople.has(sp.who)) {
        const idle = sc.people.find((p) => p.id === sp.who)?.idle ?? "";
        return { who: sp.who, lines: [], wait: idle };
      }
      return null;
    }
    return { ...sp, lines: sp.lines.filter(lineOn) };
  };
  const speakers = (list: Speaker[]) => list.map(speaker).filter((x): x is Speaker => !!x);

  const houses: House[] = sc.houses.map((h) => {
    const away = !!h.chain && !on(h.chain) && h.chain !== decoy;
    if (away) return { ...h, people: [], items: [], locked: { needs: ["__never__"], text: h.away ?? "Nobody is at home." } };
    const decoyHouse = !!h.chain && h.chain === decoy;
    return {
      ...h,
      // a decoy couple is at home, but their story isn't being told: no locked doors, nothing to find
      locked: decoyHouse ? undefined : h.locked,
      people: speakers(h.people),
      items: decoyHouse ? [] : h.items.filter((it) => clueOn(it.clue) && (!it.needs || it.needs.some(possible))),
    };
  });

  const people = sc.people.filter((p) => !p.chain || on(p.chain) || p.chain === decoy);
  const view: Scenario = {
    ...sc,
    people,
    pairs: Object.fromEntries(Object.entries(sc.pairs).filter(([k]) => on(k))),
    clues: sc.clues.filter((c) => chainsOf(c).every(on)),
    instincts: sc.instincts.filter(clueOn),
    green: speakers(sc.green),
    houses,
    ball: sc.ball && {
      ...sc.ball,
      guests: speakers(sc.ball.guests),
      watch: sc.ball.watch.filter((w) => clueOn(w.clue)),
      items: sc.ball.items.filter((it) => clueOn(it.clue)),
    },
    spots: (sc.spots ?? []).filter((sp) => (sp.clue ? clueOn(sp.clue) : sp.needs.some(possible))),
    letters: Object.fromEntries(Object.entries(sc.letters).filter(([w]) => people.some((p) => p.id === w))),
    questions: Object.fromEntries(Object.entries(sc.questions ?? {}).filter(([w]) => Object.values(sc.pairs).some((p, i) => p.woman === w && on(Object.keys(sc.pairs)[i])))),
  };
  cache.set(key, view);
  return view;
}
