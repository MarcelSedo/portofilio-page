"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DISMISS_AT, HOUSE, PANCKS_DAYS } from "../content/days";
import type { Case, Choice, Doc, DocLine, Sig } from "../content/types";
import facade from "../assets/facade.png";
import "../styles/circumlocution.css";
import { Corkboard } from "./Board";
import { Portrait } from "./Portrait";
import { Sheet } from "./Sheet";
import { setSound, sfx } from "./sound";
import {
  LAST_DAY,
  allMet,
  auditor,
  backToDesk,
  auditMoves,
  billsFor,
  ending,
  extrasFor,
  resolveAudit,
  board,
  lookAtBoard,
  goToBed,
  homeLine,
  retryDay,
  wage,
  type Bills,
  byId,
  canPancks,
  choiceViews,
  clearGame,
  clock,
  closeDay,
  dayInfo,
  decide,
  epilogue,
  goTo,
  loadGame,
  loadSound,
  newGame,
  nextDay,
  noteSignatures,
  openCase,
  openCost,
  saveGame,
  saveSound,
  searchRecords,
  sendToPancks,
  type Game,
  type Judge,
} from "../engine/state";

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

const RED = ["REFUSED", "NO FORM", "REPORTED", "CLOSED", "LEFT IN THE PILE", "DISMISSED"];
const GREY = ["REFERRED", "FILED", "PENDING", "MISFILED", "DIVIDED", "—"];
const stampTone = (s: string) => (RED.includes(s) ? "is-red" : GREY.includes(s) ? "is-grey" : "is-blue");

function Stamp({ word, big = false }: { word: string; big?: boolean }) {
  if (word === "—") return null;
  return <span className={`co-stamp ${stampTone(word)}${big ? " is-big" : ""}`}>{word}</span>;
}

function Signature({ sig, signer }: { sig: Sig; signer?: string }) {
  return (
    <span className="co-sig-wrap">
      <span
        className={`co-sig${sig.flourish ? " has-flourish" : ""}`}
        style={{ transform: `skewX(${-sig.slant}deg)` }}
        aria-label={`Signed: ${sig.text}`}
      >
        {sig.text}
      </span>
      {signer && <span className="co-signer">{signer}</span>}
    </span>
  );
}

function Line({ l }: { l: DocLine }) {
  if (typeof l === "string") return <p className="co-doc-p">{l}</p>;
  return (
    <div className="co-field">
      <dt>{l[0]}</dt>
      <dd>{l[1]}</dd>
    </div>
  );
}

function Paper({ doc, stamp, tilt = 0 }: { doc: Doc; stamp?: string; tilt?: number }) {
  const fields = doc.lines.filter((l) => typeof l !== "string");
  const notes = doc.lines.filter((l) => typeof l === "string");
  return (
    <article className={`co-doc is-${doc.kind}`} style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}>
      <header>
        <h4 className="co-doc-title">{doc.title}</h4>
        {doc.ref && <p className="co-doc-ref">{doc.ref}</p>}
      </header>
      {fields.length > 0 && (
        <dl className="co-fields">
          {fields.map((l, i) => (
            <Line key={i} l={l} />
          ))}
        </dl>
      )}
      {notes.map((l, i) => (
        <Line key={`n${i}`} l={l} />
      ))}
      {doc.sig && <Signature sig={doc.sig} signer={doc.signer} />}
      {stamp && (
        <span className="co-doc-stamp" aria-hidden="true">
          <Stamp word={stamp} big />
        </span>
      )}
    </article>
  );
}

function Meters({ g }: { g: Game }) {
  return (
    <ul className="co-meters" aria-label="Your standing">
      <li title="How the Barnacles upstairs feel about you. At −10 you are dismissed." className={g.meters.favour <= DISMISS_AT + 4 ? "is-danger" : ""}>
        <span className="co-meter-ico" aria-hidden="true">🎩</span>
        <span className="co-meter-label">Favour</span> <b>{signed(g.meters.favour)}</b>
      </li>
      <li title="Good done for the people who came in">
        <span className="co-meter-ico" aria-hidden="true">♥</span>
        <span className="co-meter-label">Good</span> <b>{signed(g.meters.good)}</b>
      </li>
      <li title="What is left in the Relief Fund">
        <span className="co-meter-ico" aria-hidden="true">⚖</span>
        <span className="co-meter-label">Fund</span> <b>£{g.meters.money}</b>
      </li>
      <li title="Your own purse, in shillings" className="is-purse">
        <span className="co-meter-ico" aria-hidden="true">👛</span>
        <span className="co-meter-label">Purse</span> <b>{g.purse}s</b>
      </li>
    </ul>
  );
}
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function Clock({ g }: { g: Game }) {
  const c = clock(g);
  return (
    <div className="co-clock">
      <span className="co-clock-time">{c.label}</span>
      <span className="co-hours" role="img" aria-label={`${c.left} of ${c.total} hours left today`}>
        {Array.from({ length: c.total }, (_, i) => (
          <i key={i} className={i < c.total - c.left ? "is-used" : ""} />
        ))}
      </span>
    </div>
  );
}

function Say({ face, who, children }: { face: string; who: string; children: React.ReactNode }) {
  return (
    <div className="co-say">
      <span className="co-cameo">
        <Portrait id={face} size={56} />
      </span>
      <div className="co-bubble">
        <p className="co-bubble-who">{who}</p>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the game                                                             */
/* ------------------------------------------------------------------ */

type SheetName = null | "help" | "compare" | "close" | "menu" | "restart" | "board";

export type OfficeProps = {
  /** where "Leave the Office" goes (the host site) */
  exitHref?: string;
  exitLabel?: string;
};

export function Office({ exitHref = "/", exitLabel = "Back to the site" }: OfficeProps) {
  const [g, setG] = useState<Game | null>(null);
  const [saved, setSaved] = useState<Game | null>(null);
  const [sound, setSoundState] = useState(true);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [announce, setAnnounce] = useState("");
  const root = useRef<HTMLDivElement>(null);

  // read the save after mount only (no hydration mismatch)
  useEffect(() => {
    setSaved(loadGame());
    const s = loadSound();
    setSoundState(s);
    setSound(s);
  }, []);

  useEffect(() => {
    if (g && g.screen !== "menu") saveGame(g);
  }, [g]);

  // move focus to the new screen's heading
  const screenKey = g ? `${g.screen}-${g.day}-${g.current ?? ""}-${g.result ? 1 : 0}` : "menu";
  useEffect(() => {
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>("[data-focus]")?.focus());
  }, [screenKey]);

  const act = useCallback((next: Game) => setG(next), []);

  const toggleSound = () => {
    const v = !sound;
    setSoundState(v);
    setSound(v);
    saveSound(v);
    if (v) sfx("bell");
  };

  /* --------------------------- menu --------------------------- */
  if (!g || g.screen === "menu") {
    return (
      <div className="co" ref={root}>
        <div className="co-menu">
          <div className="co-facade">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={facade.src} alt="" width={320} height={180} />
          </div>
          <p className="co-kicker">A desk game after Charles Dickens</p>
          <h1 className="co-h1" tabIndex={-1} data-focus>
            The Circumlocution Office
            <span>Five days at the desk of How Not To Do It</span>
          </h1>
          <p>
            London, November 1855. You are the new clerk. Micawber, Scrooge, Uriah Heep and a queue of Dickens&apos;s people bring their papers
            to your desk, and not all of them are who you remember. Read, check, stamp. The Relief Fund is small, the Barnacles upstairs are
            watching, and at home there is rent to pay and three mouths to feed.
          </p>
          <div className="co-row">
            {saved && saved.screen !== "file" && (
              <button type="button" className="co-btn" onClick={() => setG(saved)}>
                Continue: {dayInfo(saved.day).name}
              </button>
            )}
            <button
              type="button"
              className={`co-btn${saved && saved.screen !== "file" ? " is-ghost" : ""}`}
              onClick={() => (saved && saved.screen !== "file" ? setSheet("restart") : (sfx("bell"), setG(newGame())))}
            >
              {saved && saved.screen !== "file" ? "Start a new week" : "Start the week"}
            </button>
            <button type="button" className="co-btn is-ghost" onClick={() => setSheet("help")}>
              How to play
            </button>
          </div>
          <p className="co-muted co-small">About 25 minutes. You can lose. Saved in this browser after every stamp; no timers, the clock only moves when you act.</p>
        </div>
        <HelpSheet open={sheet === "help"} onClose={() => setSheet(null)} />
        <Sheet open={sheet === "restart"} onClose={() => setSheet(null)} labelledBy="co-restart-h">
          <h2 id="co-restart-h" className="co-h2">Start again from Monday?</h2>
          <p>Your saved week will be thrown away.</p>
          <div className="co-row">
            <button
              type="button"
              className="co-btn"
              data-autofocus
              onClick={() => {
                clearGame();
                setSheet(null);
                sfx("bell");
                setG(newGame());
              }}
            >
              Yes, a new week
            </button>
            <button type="button" className="co-btn is-ghost" onClick={() => setSheet(null)}>
              Keep my week
            </button>
          </div>
        </Sheet>
      </div>
    );
  }

  const info = dayInfo(g.day);
  const current = g.current ? byId[g.current] : null;
  const freshCount = board(g).fresh;
  const closeBoard = () => {
    setSheet(null);
    act(lookAtBoard(g));
  };

  const hud = (
    <div className="co-hud">
      <div className="co-hud-top">
        <p className="co-day">
          Day {g.day} of {LAST_DAY} · <b>{info.name}</b>
          <span className="co-wage"> · wage {wage(g)}s</span>
        </p>
        <div className="co-hud-btns">
          <button type="button" className="co-icon-btn" onClick={toggleSound} aria-pressed={sound} aria-label="Sound">
            {sound ? "🔊" : "🔇"}
          </button>
          <button
            type="button"
            className="co-icon-btn is-word"
            onClick={() => setSheet("board")}
          >
            Board{freshCount > 0 && <span className="co-badge"> {freshCount}<span className="co-sr"> new</span></span>}
          </button>
          <button type="button" className="co-icon-btn" onClick={() => setSheet("help")} aria-label="How to play">
            ?
          </button>
          <button type="button" className="co-icon-btn is-word" onClick={() => setSheet("menu")}>
            Menu
          </button>
        </div>
      </div>
      <div className="co-hud-bottom">
        <Clock g={g} />
        <Meters g={g} />
      </div>
    </div>
  );

  const sheets = (
    <>
      <HelpSheet open={sheet === "help"} onClose={() => setSheet(null)} />
      <Sheet open={sheet === "board"} onClose={closeBoard} labelledBy="co-board-h" wide>
        <h2 id="co-board-h" className="co-h2">The board</h2>
        <p className="co-muted co-small">Everyone you&apos;ve met, and the strings between them. Tap a card to follow its strings.</p>
        <Corkboard g={g} />
        <div className="co-row">
          <button type="button" className="co-btn" data-autofocus onClick={closeBoard}>
            Back to the desk
          </button>
        </div>
      </Sheet>
      <Sheet open={sheet === "menu"} onClose={() => setSheet(null)} labelledBy="co-menu-h">
        <h2 id="co-menu-h" className="co-h2">Menu</h2>
        <p>Your week is saved after every stamp.</p>
        <div className="co-row">
          <button type="button" className="co-btn" data-autofocus onClick={() => setSheet(null)}>
            Back to the desk
          </button>
          <button
            type="button"
            className="co-btn is-ghost"
            onClick={() => {
              setSheet(null);
              setSaved(g);
              setG(null);
            }}
          >
            Title screen
          </button>
          <a className="co-btn is-ghost" href={exitHref}>
            Leave the Office
          </a>
        </div>
      </Sheet>
      <Sheet open={sheet === "close"} onClose={() => setSheet(null)} labelledBy="co-close-h">
        <h2 id="co-close-h" className="co-h2">Close for the day?</h2>
        <p>
          {g.pile.length} {g.pile.length === 1 ? "case is" : "cases are"} still in the pile. Whatever is left at five o&apos;clock stays in the pile,
          and the people go home without an answer.
        </p>
        <div className="co-row">
          <button
            type="button"
            className="co-btn"
            data-autofocus
            onClick={() => {
              setSheet(null);
              sfx("chime");
              act(closeDay(g));
            }}
          >
            Close the doors
          </button>
          <button type="button" className="co-btn is-ghost" onClick={() => setSheet(null)}>
            Keep working
          </button>
        </div>
      </Sheet>
      {current && (
        <CompareSheet
          open={sheet === "compare"}
          onClose={() => setSheet(null)}
          g={g}
          c={current}
          onJudge={(j) => {
            sfx("paper");
            act(noteSignatures(g, j));
            setAnnounce(j === "match" ? "Noted: the hands match." : "Noted: the hands differ.");
          }}
        />
      )}
    </>
  );

  /* --------------------------- gazette --------------------------- */
  if (g.screen === "gazette") {
    return (
      <div className="co" ref={root}>
        {hud}
        <section className="co-gazette" aria-labelledby="co-gz-h">
          <p className="co-gz-mast">The Gazette</p>
          <p className="co-gz-date">
            {info.name} morning · Price one penny
          </p>
          <h2 id="co-gz-h" className="co-gz-h" tabIndex={-1} data-focus>
            {g.gazette[0] ?? "A quiet day in the capital."}
          </h2>
          <ul className="co-gz-list">
            {g.gazette.slice(1).map((h) => (
              <li key={h} className={h.startsWith("Our Man at Whitehall") ? "is-column" : ""}>
                {h}
              </li>
            ))}
            {g.gazette.length <= 1 && <li>Nothing else of note. The Circumlocution Office reports that nothing has been done, as usual.</li>}
          </ul>
        </section>
        <div className="co-row">
          <button type="button" className="co-btn" onClick={() => (sfx("paper"), act(goTo(g, "morning")))}>
            Go in to the Office
          </button>
        </div>
        {sheets}
      </div>
    );
  }

  /* --------------------------- morning --------------------------- */
  if (g.screen === "morning") {
    return (
      <div className="co" ref={root}>
        {hud}
        <h2 className="co-h2" tabIndex={-1} data-focus>
          {info.name} morning
        </h2>
        <Say face="junior" who="Barnacle Junior">
          {info.morning.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </Say>
        {info.memo && <Paper doc={info.memo} tilt={-1} />}
        {g.audit && (
          <Say face={auditor.face} who={auditor.name}>
            <p className={g.audit.ok ? "" : "co-bad"}>{g.audit.text}</p>
            {g.audit.pending && (
              <div className="co-audit">
                <p className="co-small">What do you say to him?</p>
                {auditMoves(g).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="co-choice"
                    disabled={!m.enabled}
                    onClick={() => (sfx(m.id === "accept" ? "stamp" : "paper"), act(resolveAudit(g, m.id)))}
                  >
                    <span className="co-choice-text">
                      <span className="co-choice-label">{m.label}</span>
                      <span className="co-costs">{m.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Say>
        )}
        {g.home.ill && (
          <p className="co-note is-home">
            <span aria-hidden="true">🕯 </span>At home: {g.home.ill} is ill. Medicine costs {HOUSE.medicine}s tonight.
          </p>
        )}
        {g.arrived.length > 0 && (
          <Say face="pancks" who="Mr Pancks">
            <p>
              Back. Snort. Reports on your desk: {g.arrived.map((id) => byId[id].who).join(", ")}. Look at them before anything else.
            </p>
          </Say>
        )}
        <div className="co-row">
          <button type="button" className="co-btn" disabled={!!g.audit?.pending} onClick={() => (sfx("bell"), act(goTo(g, "desk")))}>
            {g.audit?.pending ? "Answer Mr Rugg first" : `Open the doors (${g.pile.length} waiting)`}
          </button>
        </div>
        {sheets}
      </div>
    );
  }

  /* --------------------------- desk --------------------------- */
  if (g.screen === "desk") {
    const today = g.decisions.filter((d) => d.day === g.day);
    const pancksAway = Object.keys(g.deferred).filter((id) => g.deferred[id] === g.day + 1);
    return (
      <div className="co" ref={root}>
        {hud}
        <h2 className="co-h2" tabIndex={-1} data-focus>
          The pile
          <span className="co-muted co-small"> · {g.pile.length} waiting</span>
        </h2>
        {g.pile.length === 0 && <p className="co-empty">The pile is empty. Barnacle Junior looks at it as if it were a death in the family.</p>}
        <ul className="co-pile">
          {g.pile.map((id) => {
            const c = byId[id];
            const cost = openCost(g, id);
            const tooLate = cost > g.hours;
            const w = g.work[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  className="co-card"
                  disabled={tooLate}
                  onClick={() => {
                    sfx("paper");
                    act(openCase(g, id));
                  }}
                >
                  <span className="co-cameo">
                    <Portrait id={c.face} size={44} />
                  </span>
                  <span className="co-card-text">
                    <span className="co-card-who">{c.who}</span>
                    <span className="co-card-from">{c.from}</span>
                    <span className="co-card-tags">
                      {w?.pancks && <span className="co-tag is-pancks">Pancks&apos;s report</span>}
                      {c.thread && <span className="co-tag">Returns</span>}
                      <span className="co-tag is-time">{cost === 0 ? (w?.opened ? "Already open" : "Quick") : "1 hour"}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {pancksAway.length > 0 && (
          <p className="co-note">
            <span aria-hidden="true">🏃 </span>Mr Pancks is out checking on {pancksAway.map((id) => byId[id].who).join(", ")}. Back tomorrow.
          </p>
        )}
        {PANCKS_DAYS.includes(g.day) && g.pancksDay !== g.day && <p className="co-muted co-small">Mr Pancks is free today: he can check one case for you.</p>}
        <div className="co-row">
          <button
            type="button"
            className={`co-btn${g.pile.length ? " is-ghost" : ""}`}
            onClick={() => (g.pile.length ? setSheet("close") : (sfx("chime"), act(closeDay(g))))}
          >
            {g.hours === 0 ? "Five o'clock: close the doors" : "Close for the day"}
          </button>
        </div>
        {today.length > 0 && (
          <section className="co-out" aria-labelledby="co-out-h">
            <h3 id="co-out-h" className="co-h3">Out-tray today</h3>
            <ul>
              {today.map((d) => (
                <li key={d.caseId}>
                  <Stamp word={d.stamp} /> {byId[d.caseId].who}
                </li>
              ))}
            </ul>
          </section>
        )}
        {sheets}
      </div>
    );
  }

  /* --------------------------- case --------------------------- */
  if (g.screen === "case" && current) {
    return (
      <div className="co" ref={root}>
        {hud}
        <CaseView
          g={g}
          c={current}
          onRecords={() => (sfx("paper"), act(searchRecords(g)))}
          onCompare={() => setSheet("compare")}
          onPancks={() => (sfx("pancks"), setAnnounce(`${current.who} sent to Mr Pancks. Back tomorrow.`), act(sendToPancks(g)))}
          onDecide={(id) => (sfx("stamp"), act(decide(g, id)))}
          onBack={() => act(backToDesk(g))}
          onDone={() => act(backToDesk(g))}
        />
        <p className="co-sr" aria-live="polite">
          {announce}
        </p>
        {sheets}
      </div>
    );
  }

  /* --------------------------- evening --------------------------- */
  if (g.screen === "evening") {
    const today = g.decisions.filter((d) => d.day === g.day);
    return (
      <div className="co" ref={root}>
        {hud}
        <h2 className="co-h2" tabIndex={-1} data-focus>
          Five o&apos;clock, {info.name}
        </h2>
        <Say face="junior" who="Barnacle Junior">
          <p>{eveningLine(g)}</p>
        </Say>
        {freshCount > 0 && (
          <p className="co-note">
            <span aria-hidden="true">📌 </span>
            {freshCount} new {freshCount === 1 ? "string" : "strings"} on the Board.
          </p>
        )}
        <ul className="co-log">
          {today.map((d) => (
            <li key={d.caseId} className={d.ignored ? "is-ignored" : ""}>
              <Stamp word={d.stamp} />
              <span>{d.log}</span>
            </li>
          ))}
        </ul>
        <HomeBills g={g} onBed={(b) => (sfx("paper"), act(goToBed(g, b)))} />
        {sheets}
      </div>
    );
  }

  /* --------------------------- night at home --------------------------- */
  if (g.screen === "night" && g.night) {
    return (
      <div className="co" ref={root}>
        {hud}
        <h2 className="co-h2" tabIndex={-1} data-focus>
          {info.name} night, at home
        </h2>
        <Say face="ellen" who={HOUSE.wife}>
          {g.night.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </Say>
        <p className="co-muted co-small">
          Wages {g.night.wage}s · spent {g.night.spent}s · left in your purse {g.purse}s
        </p>
        <div className="co-row">
          <button type="button" className="co-btn" onClick={() => (sfx("bell"), act(nextDay(g)))}>
            {g.day >= LAST_DAY ? "Open your personal file" : "Morning"}
          </button>
        </div>
        {sheets}
      </div>
    );
  }

  /* --------------------------- lost --------------------------- */
  if (g.screen === "over" && g.over) {
    const end = ENDS[g.over];
    return (
      <div className="co" ref={root}>
        <section className="co-file is-over" aria-labelledby="co-over-h">
          <p className="co-kicker">{info.name} · The week is over</p>
          <h2 id="co-over-h" className="co-h1 is-file" tabIndex={-1} data-focus>
            {end.title}
          </h2>
          <Say face={end.face} who={end.who}>
            <p>{end.text}</p>
          </Say>
          {g.night && g.over !== "dismissed" && (
            <ul className="co-log">
              {g.night.notes.map((n) => (
                <li key={n}>
                  <span aria-hidden="true">🕯</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
          <p>{end.lesson}</p>
          <div className="co-row">
            {g.snapshot && (
              <button
                type="button"
                className="co-btn"
                onClick={() => {
                  const r = retryDay(g);
                  if (r) {
                    sfx("bell");
                    setG(r);
                  }
                }}
              >
                Try {info.name} again
              </button>
            )}
            <button
              type="button"
              className="co-btn is-ghost"
              onClick={() => {
                clearGame();
                sfx("bell");
                setG(newGame());
              }}
            >
              A new week
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* --------------------------- personal file --------------------------- */
  const t = ending(g);
  return (
    <div className="co" ref={root}>
      <section className="co-file" aria-labelledby="co-file-h">
        <p className="co-kicker">Personal file · Confidential</p>
        <h2 id="co-file-h" className="co-h1 is-file" tabIndex={-1} data-focus>
          {t.title}
        </h2>
        <Say face="tite" who="Mr Tite Barnacle">
          <p>{t.note}</p>
        </Say>
        <Meters g={g} />
        <p className="co-note is-home">
          <span aria-hidden="true">🕯 </span>
          {homeLine(g)} You end the week with {g.purse}s in your purse.
        </p>
        <h3 className="co-h3">What became of them</h3>
        <ul className="co-epilogue">
          {epilogue(g).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <details className="co-details">
          <summary>Every stamp you made this week</summary>
          {Array.from({ length: LAST_DAY }, (_, i) => i + 1).map((d) => (
            <div key={d}>
              <h4 className="co-h4">{dayInfo(d).name}</h4>
              <ul className="co-log">
                {g.decisions
                  .filter((x) => x.day === d)
                  .map((x) => (
                    <li key={x.caseId} className={x.ignored ? "is-ignored" : ""}>
                      <Stamp word={x.stamp} />
                      <span>{x.log}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </details>
        <p className="co-muted co-small">
          There are other weeks to have: different stamps open different endings. Try the Records, Mr Pancks and the signature lens.
        </p>
        <div className="co-row">
          <button
            type="button"
            className="co-btn"
            onClick={() => {
              clearGame();
              sfx("bell");
              setG(newGame());
            }}
          >
            Another week
          </button>
          <a className="co-btn is-ghost" href={exitHref}>
            {exitLabel}
          </a>
        </div>
      </section>
    </div>
  );
}

const ENDS = {
  dismissed: {
    title: "Dismissed",
    face: "tite",
    who: "Mr Tite Barnacle",
    text: "The Department has no further need of you. Papers moved. People were helped. It cannot go on. Collect your hat.",
    lesson: "Every kindness against the rules costs favour upstairs. Pick your fights: the Records, Mr Pancks and the signature lens make an exception defensible.",
  },
  evicted: {
    title: "Put out on the street",
    face: "ellen",
    who: HOUSE.wife,
    text: "Two nights without rent. The landlord's men carried our bed into the street while the children watched. We'll go to my sister's, if she'll have us.",
    lesson: "Your wages shrink when the Barnacles are displeased, and every shilling you give away is one your family doesn't have.",
  },
  alone: {
    title: "An empty house",
    face: "ellen",
    who: HOUSE.wife,
    text: "I've taken the children to my mother's in Kent. There's a doctor there, and a fire. You can come when you can pay for one. I'm sorry.",
    lesson: "Illness at home needs medicine the next night. Hunger and cold two nights running bring it on.",
  },
} as const;

function HomeBills({ g, onBed }: { g: Game; onBed: (b: Bills) => void }) {
  const bills = billsFor(g);
  const extras = extrasFor(g);
  const earned = wage(g);
  const [pay, setPay] = useState<Bills>({ rent: true, food: true, coal: true, medicine: true, copying: false, pawn: false, lend: false });
  const total = bills.reduce((s, b) => s + (pay[b.key] ? b.cost : 0), 0);
  const have = g.purse + earned + extras.reduce((s, x) => s + (pay[x.key] ? x.amount : 0), 0);
  const over = total > have;
  return (
    <section className="co-home" aria-labelledby="co-home-h">
      <h3 id="co-home-h" className="co-h3">
        <span aria-hidden="true">🏠 </span>Home, Clerkenwell
      </h3>
      <p>
        Today&apos;s wage: <b>{earned}s</b>
        {earned < 6 && <span className="co-bad"> (docked: the Barnacles are displeased)</span>}. In your purse tonight: <b>{have}s</b>.
      </p>
      <fieldset className="co-bills">
        <legend>What will you pay for tonight?</legend>
        {bills.map((b) => (
          <label key={b.key} className="co-bill">
            <input type="checkbox" checked={pay[b.key]} onChange={(e) => setPay({ ...pay, [b.key]: e.target.checked })} />
            <span className="co-bill-name">{b.label}</span>
            <span className="co-bill-cost">{b.cost}s</span>
            <span className="co-bill-note">{b.note}</span>
          </label>
        ))}
      </fieldset>
      {extras.length > 0 && (
        <fieldset className="co-bills">
          <legend>Anything else tonight?</legend>
          {extras.map((x) => (
            <label key={x.key} className="co-bill is-extra">
              <input type="checkbox" checked={!!pay[x.key]} onChange={(e) => setPay({ ...pay, [x.key]: e.target.checked })} />
              <span className="co-bill-name">{x.label}</span>
              <span className="co-bill-cost">{x.amount > 0 ? `+${x.amount}s` : `${x.amount}s`}</span>
              <span className="co-bill-note">{x.note}</span>
            </label>
          ))}
        </fieldset>
      )}
      <p aria-live="polite" className={over ? "co-bad" : ""}>
        Total {total}s of {have}s{over ? ": you can't pay for all of that. Untick something." : `. ${have - total}s left over.`}
      </p>
      <div className="co-row">
        <button type="button" className="co-btn" disabled={over} onClick={() => onBed(pay)}>
          Pay and go to bed
        </button>
      </div>
    </section>
  );
}

function eveningLine(g: Game) {
  const today = g.decisions.filter((d) => d.day === g.day);
  const left = today.filter((d) => d.ignored).length;
  const refs = today.filter((d) => d.stamp === "REFERRED" || d.stamp === "FILED").length;
  if (left >= 2) return "Lovely pile left over. Lovely. Nothing done is nothing wrong, my father says.";
  if (refs >= 2) return "Referred, filed, referred. You're getting the hang of it, you know. Father will be pleased.";
  if (g.meters.favour < -3) return "Look here, I don't want to worry you, but my father asked your name today. He never asks anyone's name.";
  return "Not bad, you know. Bit quick. Bit… helpful. People will notice.";
}

/* ------------------------------------------------------------------ */
/* the case on the desk                                                 */
/* ------------------------------------------------------------------ */

function CaseView({
  g,
  c,
  onRecords,
  onCompare,
  onPancks,
  onDecide,
  onBack,
  onDone,
}: {
  g: Game;
  c: Case;
  onRecords: () => void;
  onCompare: () => void;
  onPancks: () => void;
  onDecide: (choiceId: string) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const w = g.work[c.id] ?? {};
  const views = choiceViews(g, c);
  const res = g.result?.caseId === c.id ? c.choices.find((x) => x.id === g.result!.choiceId) : undefined;
  const sigCount = c.docs.filter((d) => d.sig).length + (w.searched && c.records?.doc?.sig ? 1 : 0);
  const canCompare = !!c.compare && (!c.compare.needsRecords || w.searched) && sigCount >= 2;

  if (res) {
    return (
      <section className="co-case" aria-labelledby="co-res-h">
        <h2 id="co-res-h" className="co-h2" tabIndex={-1} data-focus>
          <Stamp word={res.stamp} /> {c.who}
        </h2>
        <div className="co-docs is-stamped">
          <Paper doc={c.docs[0]} stamp={res.stamp} />
        </div>
        <Say face={c.face} who={c.who}>
          <p>{res.reply}</p>
        </Say>
        {res.junior && (
          <Say face="junior" who="Barnacle Junior">
            <p>{res.junior}</p>
          </Say>
        )}
        <EffectLine e={res.effect} purse={res.purse} />
        {g.over === "dismissed" && <p className="co-bad">Barnacle Junior is hovering by the door with a letter. It has your name on it.</p>}
        {!g.over && g.meters.favour <= DISMISS_AT + 4 && (
          <p className="co-bad">
            Barnacle Junior, quietly: &quot;Look here. My father said your name at lunch. Twice. At {DISMISS_AT} you&apos;re out, you know.&quot;
          </p>
        )}
        <div className="co-row">
          <button type="button" className="co-btn" onClick={onDone}>
            Next, please
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="co-case" aria-labelledby="co-case-h">
      <div className="co-case-head">
        <span className="co-cameo is-big">
          <Portrait id={c.face} size={72} />
        </span>
        <div>
          <h2 id="co-case-h" className="co-h2" tabIndex={-1} data-focus>
            {c.who}
          </h2>
          <p className="co-muted co-small">From {c.from}</p>
        </div>
      </div>
      <blockquote className="co-bubble is-open">
        <p>{c.opening}</p>
      </blockquote>

      <h3 className="co-h3">On the desk</h3>
      <div className="co-docs">
        {c.docs
          .filter((d) => allMet(g, d.requires))
          .map((d, i) => (
            <Paper key={d.id} doc={d} tilt={i % 2 ? 0.8 : -0.6} />
          ))}
      </div>

      {w.searched && (
        <section className="co-found" aria-label="From the Records">
          <h3 className="co-h3">
            <span aria-hidden="true">🗄 </span>From the Records
          </h3>
          {c.records ? (
            <>
              <ul>
                {c.records.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {c.records.doc && <Paper doc={c.records.doc} tilt={0.5} />}
            </>
          ) : (
            <p>No previous file. The archivist looked rather pleased about it.</p>
          )}
        </section>
      )}
      {w.pancks && c.pancks && (
        <section className="co-found is-pancks" aria-label="Mr Pancks's report">
          <Say face="pancks" who="Mr Pancks's report">
            {c.pancks.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </Say>
        </section>
      )}
      {w.compared && (
        <p className="co-note">
          <span aria-hidden="true">🔍 </span>Your note: {w.compared === "match" ? "the hands match." : "the hands differ."}
        </p>
      )}

      <h3 className="co-h3">Look into it</h3>
      <div className="co-tools">
        <button type="button" className="co-tool" disabled={!!w.searched || g.hours < 1} onClick={onRecords}>
          <span aria-hidden="true">🗄</span> Search the Records <small>{w.searched ? "done" : "1 hour"}</small>
        </button>
        {canCompare && (
          <button type="button" className="co-tool" onClick={onCompare}>
            <span aria-hidden="true">🔍</span> Compare signatures <small>{w.compared ? "noted" : "free"}</small>
          </button>
        )}
        {c.pancks && !w.pancks && (
          <button type="button" className="co-tool" disabled={!canPancks(g, c)} onClick={onPancks}>
            <span aria-hidden="true">🏃</span> Send to Mr Pancks{" "}
            <small>
              {!PANCKS_DAYS.includes(g.day) ? "away today" : g.pancksDay === g.day ? "busy today" : g.purse < HOUSE.pancks ? "no shilling" : `${HOUSE.pancks}s · report tomorrow`}
            </small>
          </button>
        )}
      </div>

      <h3 className="co-h3">Stamp it</h3>
      <ul className="co-choices">
        {views.map(({ choice, enabled, why }) => (
          <li key={choice.id}>
            <button type="button" className="co-choice" disabled={!enabled} onClick={() => onDecide(choice.id)} aria-describedby={why ? `why-${choice.id}` : undefined}>
              <Stamp word={choice.stamp} />
              <span className="co-choice-text">
                <span className="co-choice-label">{choice.label}</span>
                <Costs ch={choice} />
              </span>
            </button>
            {why && (
              <span id={`why-${choice.id}`} className="co-why">
                {why}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="co-row">
        <button type="button" className="co-btn is-ghost" onClick={onBack}>
          ← Back to the pile
        </button>
      </div>
    </section>
  );
}

function EffectLine({ e, purse }: { e: { favour?: number; good?: number; money?: number }; purse?: number }) {
  const bits: string[] = [];
  if (purse) bits.push(`Purse ${purse > 0 ? "+" : "−"}${Math.abs(purse)}s`);
  if (e.favour) bits.push(`Favour ${signed(e.favour)}`);
  if (e.good) bits.push(`Good ${signed(e.good)}`);
  if (e.money) bits.push(`Fund ${e.money > 0 ? "+" : "−"}£${Math.abs(e.money)}`);
  if (!bits.length) return null;
  return <p className="co-effect">{bits.join(" · ")}</p>;
}

/** what a stamp visibly costs: money, time, your purse, and whether it's irregular */
function Costs({ ch }: { ch: Choice }) {
  const bits: string[] = [];
  if (ch.effect.money) bits.push(ch.effect.money < 0 ? `−£${-ch.effect.money} Fund` : `+£${ch.effect.money} Fund`);
  if (ch.purse) bits.push(ch.purse < 0 ? `−${-ch.purse}s your purse` : `+${ch.purse}s your purse`);
  if (ch.risky) bits.push("irregular");
  if (!bits.length) return null;
  return <span className="co-costs">{bits.join(" · ")}</span>;
}

function CompareSheet({ open, onClose, g, c, onJudge }: { open: boolean; onClose: () => void; g: Game; c: Case; onJudge: (j: Judge) => void }) {
  const w = g.work[c.id] ?? {};
  const docs: Doc[] = [...c.docs.filter((d) => d.sig), ...(w.searched && c.records?.doc?.sig ? [c.records.doc] : [])];
  return (
    <Sheet open={open} onClose={onClose} labelledBy="co-cmp-h" wide>
      <h2 id="co-cmp-h" className="co-h2">The signature lens</h2>
      <p>{c.compare?.question}</p>
      <ul className="co-sigs">
        {docs.map((d) => (
          <li key={d.id}>
            <p className="co-small co-muted">{d.title}</p>
            <Signature sig={d.sig!} signer={d.signer} />
          </li>
        ))}
      </ul>
      {w.compared ? (
        <p className="co-note">You noted: {w.compared === "match" ? "the hands match." : "the hands differ."} A clerk does not change his notes.</p>
      ) : (
        <p className="co-muted co-small">Look at the spelling, the slope and the flourish. You can only note it once.</p>
      )}
      <div className="co-row">
        {!w.compared && (
          <>
            <button type="button" className="co-btn" data-autofocus onClick={() => (onJudge("match"), onClose())}>
              Yes, the hands match
            </button>
            <button type="button" className="co-btn" onClick={() => (onJudge("differ"), onClose())}>
              No, the hands differ
            </button>
          </>
        )}
        <button type="button" className="co-btn is-ghost" data-autofocus={w.compared ? true : undefined} onClick={onClose}>
          Close the lens
        </button>
      </div>
    </Sheet>
  );
}

function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="co-help-h">
      <h2 id="co-help-h" className="co-h2">How to play</h2>
      <ul className="co-help">
        <li>
          <b>Five days, eight hours each.</b> Calling someone in takes an hour. Miss Flite is quick. At five o&apos;clock everything left in the pile
          stays there, and those people go home unanswered.
        </li>
        <li>
          <b>Read the papers.</b> Some catches are in plain sight: a ledger, a scratched-out line, an empty box.
        </li>
        <li>
          <b>Search the Records</b> (1 hour) for earlier files. <b>Compare signatures</b> when there&apos;s something to compare them with.{" "}
          <b>Mr Pancks</b> checks one case a day for a shilling and brings it back tomorrow.
        </li>
        <li>
          <b>Stamp it.</b> Some stamps need evidence first; the button tells you what&apos;s missing.
        </li>
        <li>
          <b>Four things are watched:</b> 🎩 Favour (the Barnacles upstairs), ♥ Good (the people at your desk), £ the Relief Fund (small, and it
          doesn&apos;t refill) and 👛 your own purse. They rarely agree.
        </li>
        <li>
          <b>You can lose.</b> At −10 favour you are dismissed. Your wage drops when favour is low, and every evening you pay rent, food and
          coal at home. Skip rent twice and you&apos;re evicted; leave a fever without medicine and your family leaves.
        </li>
        <li>
          <b>The Board</b> pins up everyone you meet. What you learn ties red string between them: help one, and see who else it pulls.
        </li>
        <li>
          <b>Irregular stamps</b> may be checked by Mr Rugg the auditor on Wednesday and Friday. Evidence on file saves you; none costs favour.
        </li>
        <li>
          <b>The Gazette</b> each morning reports what your stamps did. Some people come back. Four stories run all week: Jarndyce and Jarndyce,
          Mr Doyce&apos;s patent, Mr Merdle&apos;s bank and the Dorrits.
        </li>
      </ul>
      <div className="co-row">
        <button type="button" className="co-btn" data-autofocus onClick={onClose}>
          To the desk
        </button>
      </div>
    </Sheet>
  );
}
