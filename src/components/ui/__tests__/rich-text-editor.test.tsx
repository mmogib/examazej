import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "../rich-text-editor";

let root: Root | undefined;
let container: HTMLDivElement | undefined;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
  }
  root = undefined;
  container = undefined;
  document.body.replaceChildren();
});

function renderEditor(value: string, onChange = vi.fn()) {
  container ??= document.createElement("div");
  if (!container.isConnected) {
    document.body.append(container);
  }
  root ??= createRoot(container);

  act(() => {
    root?.render(<RichTextEditor value={value} onChange={onChange} />);
  });

  return onChange;
}

function getEditor(): HTMLElement {
  const editor = document.querySelector(".ProseMirror");
  if (!(editor instanceof HTMLElement)) {
    throw new Error("Could not find the rich-text editor");
  }
  return editor;
}

describe("RichTextEditor", () => {
  it("renders the supplied content and formatting controls", () => {
    renderEditor("<p>Initial text</p>");

    expect(getEditor().textContent).toBe("Initial text");
    for (const title of [
      "Bold",
      "Italic",
      "Underline",
      "Bullet List",
      "Numbered List",
      "Align Left",
      "Align Center",
      "Align Right",
    ]) {
      expect(document.querySelector(`button[title="${title}"]`)).not.toBeNull();
    }
  });

  it("synchronizes the document when the value prop changes", () => {
    const onChange = renderEditor("<p>Initial text</p>");

    renderEditor("<p>Updated text</p>", onChange);

    expect(getEditor().textContent).toBe("Updated text");
  });
});
