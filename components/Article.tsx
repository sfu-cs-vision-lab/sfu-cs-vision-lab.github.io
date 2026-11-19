import { Children, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ResearchFigure from "@/components/ResearchFigures";
import { mathml } from "@/lib/equations";
import prose from "./Readme.module.css";
import styles from "./Article.module.css";

type HastNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HastNode[] };
const textOf = (n: HastNode): string => n.value ?? (n.children ?? []).map(textOf).join("");

/** Heading text to an anchor id. */
export const anchorOf = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Equation = ({ id, display }: { id: string; display: "inline" | "block" }) => {
  const markup = mathml(id, display);
  return markup ? <span className={display === "block" ? styles.mathBlock : undefined} dangerouslySetInnerHTML={{ __html: markup }} /> : <code>{id}</code>;
};

/**
 * The lab's own research pages (content/research/*.md). The content is ours, so it may use a few markers
 * the README renderer does not: `eq:id` and `eqb:id` for MathML equations (lib/equations.ts), ```figure
 * fences for redrawn figures, <sup>/<sub> (turned into markers here, as raw HTML is never rendered), and an
 * image alone in a paragraph becomes a figure captioned by its title.
 */
export default function Article({ markdown }: { markdown: string }) {
  const source = markdown.replace(/<sup>(.*?)<\/sup>/g, "`sup:$1`").replace(/<sub>(.*?)<\/sub>/g, "`sub:$1`");

  return (
    <div className={`${prose.readme} ${styles.article}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, children }) => <h2 id={anchorOf(textOf(node as HastNode))}>{children}</h2>,
          code: ({ children }) => {
            const text = String(children);
            const [kind, value] = [text.slice(0, text.indexOf(":")), text.slice(text.indexOf(":") + 1)];
            if (kind === "eq") return <Equation id={value} display="inline" />;
            if (kind === "eqb") return <Equation id={value} display="block" />;
            if (kind === "sup") return <sup>{value}</sup>;
            if (kind === "sub") return <sub>{value}</sub>;
            return <code>{children}</code>;
          },
          pre: ({ node, children }) => {
            const code = (node as HastNode | undefined)?.children?.[0];
            if (code && String(code.properties?.className ?? "").includes("language-figure")) {
              return <ResearchFigure spec={textOf(code)} />;
            }
            return <pre>{children}</pre>;
          },
          p: ({ node, children }) => {
            const kids = (node as HastNode).children ?? [];
            const first = kids[0];
            // A display equation: `eqb:id` followed by its number, e.g. "(2)".
            if (first?.tagName === "code" && textOf(first).startsWith("eqb:")) {
              const [math] = Children.toArray(children);
              const after = kids.slice(1).map(textOf).join("").trim();
              const [, condition, number] = after.match(/^(.*?)\s*(\(\d+\))?$/) ?? [after, after, ""];
              return (
                <div className={styles.equation}>
                  {math}
                  {condition && <span>{condition}</span>}
                  {number && <span className={styles.equationNumber}>{number}</span>}
                </div>
              );
            }
            // An image alone in its paragraph is a figure; its title is the caption.
            if (kids.length === 1 && first?.tagName === "img") {
              const { src, alt, title } = (first.properties ?? {}) as { src?: string; alt?: string; title?: string };
              return (
                <figure className={styles.figure}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={alt ?? ""} loading="lazy" />
                  {title && <figcaption>{title}</figcaption>}
                </figure>
              );
            }
            return <p>{children}</p>;
          },
          table: ({ children }) => (
            <div className={prose.table}>
              <table>{children}</table>
            </div>
          ),
          // A plot kept as its original black-on-white raster (title "ink") is shown ink-on-ground by inversion.
          img: ({ src, alt, title }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ""} loading="lazy" className={title === "ink" ? styles.inkPlot : undefined} />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
