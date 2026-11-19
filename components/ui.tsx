import Link from "next/link";

type PanelProps = {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

/** Pixel-framed section with a pixel-font heading. */
export function Panel({ id, title, children, className = "" }: PanelProps) {
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-col gap-4 border-4 border-frame bg-panel p-6 shadow-[6px_6px_0_var(--color-shadow)] ${className}`}
    >
      <h2 id={id} className="m-0 font-pixel text-[13px] leading-relaxed text-amber">
        {title}
      </h2>
      {children}
    </section>
  );
}

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "teal";
  download?: boolean;
};

const variants = {
  primary: "bg-amber !text-ground shadow-[4px_4px_0_var(--color-shadow)]",
  teal: "bg-teal !text-ground",
  secondary: "border-[3px] border-frame !text-ink",
  ghost: "border-[3px] border-line !text-ink",
};

export function ButtonLink({ href, children, variant = "primary", download }: ButtonLinkProps) {
  const className = `inline-flex min-h-11 items-center px-5 text-[15px] font-bold no-underline ${variants[variant]}`;
  if (href.startsWith("http") || download) {
    return (
      <a href={href} className={className} download={download || undefined}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "teal" }) {
  return (
    <p
      className={`m-0 text-xs font-bold tracking-wider uppercase ${tone === "teal" ? "text-teal" : "text-muted"}`}
    >
      {children}
    </p>
  );
}
