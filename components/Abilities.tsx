import { profile } from "@/content/profile";
import { Panel } from "./ui";

export function Abilities() {
  return (
    <Panel id="abilities" title="ABILITIES">
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {profile.abilities.map((ability) => {
          const level = ability.level;
          // The text value is what screen readers get; the bar is decoration.
          const label = level === null ? "[set level]" : `Lv ${level}/10`;
          return (
            <li key={ability.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-[15px] font-semibold">
                <span>{ability.name}</span>
                <span className="text-muted">{label}</span>
              </div>
              <div aria-hidden="true" className="h-3 border-2 border-line-muted bg-slot">
                <div className="h-full bg-teal" style={{ width: `${(level ?? 0) * 10}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
