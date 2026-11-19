import { aboutIntro } from "@/content/about";

const MAX = 20;

/**
 * The About intro as an RPG character sheet:
 * portrait + name plate, class, attributes, backstory, traits and inventory.
 *
 * Accessibility:
 * - One real <h1>, then <h2> per part of the sheet, so it reads as a normal document.
 * - Attribute bars are decoration (aria-hidden); the number and its explanation are text.
 * - Class, traits: description lists (<dl>), read as "term, value".
 * - Works in forced-colors mode and prints as a plain page.
 */
export function AboutSheet() {
  const a = aboutIntro;
  return (
    <section aria-labelledby="about-title" className="pixel-box sheet">
      <p className="about-kicker">Character lore</p>
      <h1 id="about-title" className="about-h1">
        About Marcel
      </h1>

      <div className="sheet-top">
        <figure className="sheet-portrait">
          <div className="sheet-portrait-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.portrait.src} alt={a.portrait.alt} width={480} height={480} />
          </div>
          <figcaption className="sheet-nameplate">
            <span className="sheet-name">Marcel Šedo</span>
            <span className="sheet-level">Level: {a.level}</span>
          </figcaption>
        </figure>

        <div className="sheet-id">
          <dl className="sheet-class">
            <div>
              <dt>Class</dt>
              <dd>{a.classLine.main}</dd>
            </div>
            <div>
              <dt>Multiclass</dt>
              <dd>{a.classLine.multiclass.join(" · ")}</dd>
            </div>
          </dl>

          <p className="sheet-lead">{a.lead}</p>

          <h2 className="sheet-h2">Attributes</h2>
          <ul className="sheet-attrs">
            {a.attributes.map((at) => (
              <li key={at.name}>
                <span className="sheet-attr-name">{at.name}</span>
                <span className="sheet-attr-bar" aria-hidden="true">
                  <span style={{ width: `${(at.value / MAX) * 100}%` }} />
                </span>
                <span className="sheet-attr-value">
                  {at.value}
                  <span className="sr-only"> out of {MAX}</span>
                </span>
                <span className="sheet-attr-note">{at.note}</span>
              </li>
            ))}
          </ul>
          <p className="sheet-small">Self-rolled. No dice were harmed.</p>
        </div>
      </div>

      <h2 className="sheet-h2">Backstory</h2>
      <div className="sheet-scroll">
        <p>{a.origin}</p>
      </div>

      <h2 className="sheet-h2">Traits</h2>
      <dl className="lore-grid">
        {a.facts.map((f) => (
          <div key={f.label} className="lore-stat">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="sheet-h2">Inventory</h2>
      <p className="sheet-small sheet-inventory-intro">Things I carry everywhere, sorted into bags.</p>
      <div className="sheet-bags">
        {a.likeGroups.map((g) => (
          <div key={g.title} className="sheet-bag">
            <h3 className="sheet-bag-title">{g.title}</h3>
            <ul className="sheet-slots">
              {g.items.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
