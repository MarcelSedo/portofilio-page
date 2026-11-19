import { profile } from "@/content/profile";
import { ButtonLink } from "./ui";

const facts: { label: string; value: string; highlight?: boolean }[] = [
  { label: "Class", value: profile.className },
  { label: "Level", value: profile.level },
  { label: "Background", value: profile.background },
  { label: "Base", value: profile.base },
  { label: "Status", value: profile.status, highlight: true },
  { label: "Main quest", value: profile.mainQuest },
];

export function CharacterSheet() {
  return (
    <section
      aria-labelledby="char-name"
      className="flex flex-wrap items-start gap-7 border-4 border-frame bg-panel p-7 shadow-[6px_6px_0_var(--color-shadow)]"
    >
      {/* Replace with: <Image src="/avatar.png" alt="" width={160} height={160} className="pixelated" /> */}
      <div
        role="img"
        aria-label="Pixel art avatar of Marcel"
        className="flex h-40 w-40 flex-none items-center justify-center border-4 border-dashed border-line-muted bg-slot text-center font-pixel text-[10px] leading-relaxed text-muted"
      >
        [PIXEL
        <br />
        AVATAR]
      </div>

      <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
        <p className="m-0 font-pixel text-[10px] tracking-wide text-teal">CHARACTER SHEET</p>
        <h1 id="char-name" className="m-0 text-4xl leading-tight font-bold">
          {profile.name}
        </h1>

        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-6 gap-y-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">{fact.label}</dt>
              <dd className={`m-0 mt-1 font-semibold ${fact.highlight ? "text-teal" : ""}`}>
                {fact.highlight && <span aria-hidden="true">● </span>}
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-1 flex flex-wrap gap-3">
          <ButtonLink href="#contact">Contact me</ButtonLink>
          <ButtonLink href={profile.links.cvPdf} variant="secondary" download>
            Download CV (PDF)
          </ButtonLink>
          <ButtonLink href={profile.links.github} variant="ghost">
            GitHub
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
