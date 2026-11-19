"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modes = [
  { href: "/", label: "Recruiter", meta: "30 s" },
  { href: "/hiring-manager", label: "Hiring manager", meta: "3 min" },
  { href: "/explore", label: "Explore", meta: "quiz & trivia" },
];

export function ModeNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Choose your mode">
      <ul className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const current = pathname === mode.href;
          return (
            <li key={mode.href}>
              <Link
                href={mode.href}
                aria-current={current ? "page" : undefined}
                className={
                  "inline-flex min-h-11 items-center border-[3px] px-4 text-sm font-semibold no-underline " +
                  (current
                    ? "border-amber bg-amber !text-ground"
                    : "border-line !text-ink hover:border-frame")
                }
              >
                {current && <span aria-hidden="true">▶&nbsp;</span>}
                {mode.label} · {mode.meta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
