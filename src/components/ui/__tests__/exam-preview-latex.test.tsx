import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { LaTeXRenderer } from "@/components/ui/exam-preview-dialog";

let root: Root | undefined;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = undefined;
  }
  document.body.replaceChildren();
});

function renderLatex(content: string): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(<LaTeXRenderer content={content} />);
  });
  return container;
}

describe("LaTeXRenderer (exam preview)", () => {
  it("renders inline math with KaTeX and keeps surrounding text", () => {
    const container = renderLatex("Solve $x^2 = 4$ for x.");

    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector(".katex-display")).toBeNull();
    expect(container.querySelector("annotation")?.textContent).toBe("x^2 = 4");
    expect(container.textContent).toContain("Solve ");
    expect(container.textContent).toContain(" for x.");
  });

  it("renders $$...$$ as display math in a block element", () => {
    const container = renderLatex("$$\\int_0^1 x\\,dx$$");

    const display = container.querySelector(".katex-display");
    expect(display).not.toBeNull();
    expect(display?.parentElement?.tagName).toBe("DIV");
  });

  it("falls back to the highlighted raw source when the LaTeX is invalid", () => {
    const container = renderLatex("Bad: $\\frac{1}{$ end");

    expect(container.querySelector(".katex")).toBeNull();
    const fallback = container.querySelector("span.text-red-500");
    expect(fallback?.textContent).toBe("$\\frac{1}{$");
    expect(container.textContent).toContain(" end");
  });

  it("renders plain text without invoking KaTeX", () => {
    const container = renderLatex("No math here.");

    expect(container.querySelector(".katex")).toBeNull();
    expect(container.textContent).toBe("No math here.");
  });
});
