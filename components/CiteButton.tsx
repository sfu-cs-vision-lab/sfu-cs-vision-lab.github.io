"use client";
import { useState } from "react";

/** Copies text to the clipboard and says whether it worked, for two seconds. */
export default function CiteButton({
  text,
  label = "Cite",
  className = "rounded-full border px-3 py-1 text-sm hover:bg-gray-50",
}: {
  text?: string;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  if (!text) return null;
  return (
    <button
      type="button"
      className={className}
      title="Copy BibTeX"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus("copied");
        } catch {
          // Clipboard access denied, or the page is not on a secure origin.
          setStatus("failed");
        }
        setTimeout(() => setStatus("idle"), 2000);
      }}
    >
      <span aria-live="polite">{status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : label}</span>
    </button>
  );
}
