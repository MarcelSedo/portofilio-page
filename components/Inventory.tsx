import { profile } from "@/content/profile";
import { Panel } from "./ui";

export function Inventory() {
  return (
    <Panel id="inventory" title="INVENTORY">
      <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0">
        {profile.inventory.map((item) => (
          <li
            key={item}
            className="flex min-h-16 items-center justify-center border-[3px] border-line bg-slot p-1.5 text-center text-sm font-semibold"
          >
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
