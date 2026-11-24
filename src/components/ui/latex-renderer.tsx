import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Renders one math expression with KaTeX; invalid LaTeX falls back to the raw source, highlighted.
function MathFormula({ math, source, displayMode }: { math: string; source: string; displayMode: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, { displayMode, throwOnError: true });
    } catch {
      return null;
    }
  }, [math, displayMode]);

  if (html === null) {
    return <span className="text-red-500 bg-red-50 px-1 rounded">{source}</span>;
  }
  const Tag = displayMode ? "div" : "span";
  return <Tag dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * An approximate rendering of question or option text: `$...$` and `$$...$$` through KaTeX,
 * everything else as plain text (TikZ, `\includegraphics`, tables and preamble macros show as
 * written). Used by the exam preview and the Questions page.
 */
export function LaTeXRenderer({ content }: { content: string }) {
  if (!content) return <span></span>;

  const parts = content.split(/(\$\$[^$]+\$\$|\$[^$]+\$|\\begin\{[^}]+\}.*?\\end\{[^}]+\})/);

  return (
    <span>
      {parts.map((part, index) => {
        // Display math ($$...$$)
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <MathFormula key={index} math={part.slice(2, -2)} source={part} displayMode />;
        }
        // Inline math ($...$)
        else if (part.startsWith("$") && part.endsWith("$")) {
          return <MathFormula key={index} math={part.slice(1, -1)} source={part} displayMode={false} />;
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
