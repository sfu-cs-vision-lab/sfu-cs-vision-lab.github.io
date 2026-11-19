import type { ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import CiteButton from "@/components/CiteButton";
import styles from "./Readme.module.css";

type HastNode = { type: string; value?: string; properties?: { className?: unknown }; children?: HastNode[] };
const textOf = (n: HastNode): string => n.value ?? (n.children ?? []).map(textOf).join("");

/** A repo's README on the ground. Raw HTML is never rendered; relative links and images resolve to GitHub. */
export default function Readme({ markdown, fullName }: { markdown: string; fullName: string }) {
  const resolve = (url: string, key: string) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(url)) return defaultUrlTransform(url);
    const path = url.replace(/^\.?\//, "");
    return key === "src"
      ? `https://raw.githubusercontent.com/${fullName}/HEAD/${path}`
      : `https://github.com/${fullName}/blob/HEAD/${path}`;
  };

  const levels = [...markdown.replace(/```[\s\S]*?```/g, "").matchAll(/^(#{1,6})\s/gm)].map(m => m[1].length);
  const shift = 3 - Math.min(6, ...levels);
  const heading = (level: number) =>
    function Heading({ children }: { children?: ReactNode }) {
      const Tag = `h${Math.min(6, Math.max(3, level + shift))}` as "h3" | "h4" | "h5" | "h6";
      return <Tag>{children}</Tag>;
    };

  return (
    <div className={styles.readme}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={resolve}
        components={{
          // The page owns h1 and h2: the README's own top heading level becomes h3, and the rest follow.
          h1: heading(1),
          h2: heading(2),
          h3: heading(3),
          h4: heading(4),
          h5: heading(5),
          h6: heading(6),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" />,
          table: ({ children }) => (
            <div className={styles.table}>
              <table>{children}</table>
            </div>
          ),
          pre: ({ node, children }) => {
            const code = (node as HastNode | undefined)?.children?.[0];
            // Tagged bibtex, or an untagged block that starts like an entry ("@article{").
            const bibtex = code && (String(code.properties?.className ?? "").includes("language-bibtex") || /^\s*@\w+\s*\{/.test(textOf(code)));
            return (
              <div className={styles.code}>
                {bibtex && <CiteButton text={textOf(code)} label="Copy BibTeX" className={styles.copy} />}
                <pre>{children}</pre>
              </div>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
