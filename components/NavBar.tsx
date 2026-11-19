"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PAPERS, SECTIONS, paperHex } from "@/lib/mondrian";

/** The lab's mark: the home page Mondrian in miniature, each paper in its daylight colour. */
function Mark() {
  return (
    <svg width="30" height="20" viewBox="0 0 12 8" aria-hidden="true" className="shrink-0">
      {PAPERS.map(p => {
        const [r0, c0, r1, c1] = p.wide;
        return <rect key={p.chip} x={c0 - 1 + 0.15} y={r0 - 1 + 0.15} width={c1 - c0 - 0.3} height={r1 - r0 - 0.3} fill={paperHex(p.chip)} />;
      })}
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  // On the home page the Mondrian's papers are the navigation.
  if (pathname === "/") return null;

  const links = SECTIONS.map(s => {
    const active = pathname?.startsWith(s.href.slice(0, -1));
    return (
      <li key={s.href}>
        <Link
          href={s.href}
          aria-current={active ? "page" : undefined}
          className="flex min-h-[44px] items-center gap-2 px-3 text-[15px] text-ink-2 no-underline hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]"
        >
          <span aria-hidden="true" className="h-3 w-3 shrink-0" style={{ background: paperHex(s.chip) }} />
          {s.name}
        </Link>
      </li>
    );
  });

  return (
    <header className="on-ground sticky top-0 z-40 border-b border-rule bg-ground font-archivo text-ink">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-[17px] font-semibold text-ink no-underline [font-stretch:112.5%]">
          <Mark />
          Computational Vision Lab
        </Link>
        <ul className="hidden items-center lg:flex">{links}</ul>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center border border-rule text-ink lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <ul id="mobile-nav" className="border-t border-rule px-1 py-2 lg:hidden">
          {links}
        </ul>
      )}
    </header>
  );
}
