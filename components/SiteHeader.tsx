"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home" },
  { href: "/experience", label: "Experience" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/notes", label: "Notes" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      {/* Skip link: visible only on keyboard focus */}
      <a
        href="#main"
        className="sr-only z-50 bg-teal px-4 py-3 font-semibold !text-[#0b1226] focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <header className="pixel-bar relative z-10 bg-[#0b1226]/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-5 sm:px-8">
          <Link href="/" className="logo-link font-pixel text-sm tracking-widest md:text-base">
            MARCEL.EXE
        </Link>

          <nav aria-label="Main">
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-2 p-0">
              {nav.map((item) => {
                const current = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={
                        "inline-flex min-h-11 items-center font-pixel text-[11px] tracking-wide uppercase no-underline " +
                        (current ? "!text-amber" : "!text-slate-200 hover:!text-amber")
                      }
                    >
                      {current && <span aria-hidden="true" className="mr-2">▶</span>}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/contact"
                  aria-current={pathname === "/contact" ? "page" : undefined}
                  className="pixel-badge inline-flex min-h-11 items-center bg-amber px-4 font-pixel text-[11px] !text-[#0b1226] no-underline hover:bg-amber-hover"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}