"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

type StartViewTransition = (update: () => Promise<void>) => unknown;

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const home = pathname === "/";
  // A page change in progress: finished once the new page has rendered.
  const arriving = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  // On the home page the papers are the navigation, so the bar only comes in once the whole display has
  // scrolled away, and leaves again as soon as any of it is back in view.
  const [shown, setShown] = useState(!home);

  useEffect(() => {
    if (!home) return setShown(true);
    const display = document.querySelector("[data-mondrian]");
    if (!display) return;
    // 2px allowance: after a jump to #about the display's bottom edge sits exactly at the top, which still
    // counts as touching the view.
    const watch = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), { rootMargin: "-2px 0px 0px 0px" });
    watch.observe(display);
    return () => watch.disconnect();
  }, [home]);
  useEffect(() => { if (!shown) setOpen(false); }, [shown]);

  // Clicks on the site's own links. On the home page a link to one of its sections (About) always glides there;
  // left to the router, a link to the hash already in the address jumps. A link to another page crossfades to
  // it where the browser can (View Transitions).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /\.[a-z0-9]+$/i.test(url.pathname)) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (url.pathname === location.pathname) {
        const target = home && url.hash ? document.getElementById(url.hash.slice(1)) : null;
        if (!target) return; // elsewhere, the browser glides to the section itself
        e.preventDefault();
        e.stopPropagation();
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        history.replaceState(history.state, "", url.hash);
        return;
      }

      const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
      if (!start || reduce) return; // the router changes page as before
      e.preventDefault();
      e.stopPropagation();
      start.call(document, () => new Promise<void>(done => {
        let ended = false;
        const end = () => { if (!ended) { ended = true; done(); } };
        arriving.current = end;
        setTimeout(end, 1500); // never hold the page
        router.push(url.pathname + url.search + url.hash);
      }));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [home, router]);

  useEffect(() => {
    const done = arriving.current;
    if (!done) return;
    arriving.current = null;
    done(); // directly, not in an animation frame: the browser runs no frames until this resolves
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);


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
    <header
      className={`on-ground top-0 z-40 border-b border-rule bg-ground font-archivo text-ink ${
        home
          ? `fixed inset-x-0 motion-reduce:transition-none ${
              shown
                ? "visible translate-y-0 [transition:transform_300ms_cubic-bezier(0.16,1,0.3,1)]"
                : "invisible -translate-y-full [transition:transform_250ms_ease-in,visibility_0s_250ms]"
            }`
          : "sticky"
      }${shown ? " [view-transition-name:site-header]" : ""}`}
    >
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
