import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AcademicIntegrityPledgeControl } from "@/components/ui/academic-integrity-pledge-control";
import { DEFAULT_ACADEMIC_INTEGRITY_PLEDGE } from "@/lib/core/academic-integrity-pledge";

interface RenderOptions {
  coverPageEnabled?: boolean;
  included?: boolean;
  text?: string;
  onIncludedChange?: (included: boolean) => void;
  onTextChange?: (text: string) => void;
}

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

function renderControl({
  coverPageEnabled = true,
  included = true,
  text = "Current pledge text.",
  onIncludedChange = vi.fn(),
  onTextChange = vi.fn(),
}: RenderOptions = {}) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <AcademicIntegrityPledgeControl
        coverPageEnabled={coverPageEnabled}
        included={included}
        text={text}
        onIncludedChange={onIncludedChange}
        onTextChange={onTextChange}
      />,
    );
  });
}

function getButton(name: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Could not find button: ${name}`);
  }
  return button;
}

function getSwitch(): HTMLButtonElement {
  const pledgeSwitch = document.querySelector(
    '[role="switch"][aria-label="Include Academic Integrity Pledge"]',
  );
  if (!(pledgeSwitch instanceof HTMLButtonElement)) {
    throw new Error("Could not find the academic integrity pledge switch");
  }
  return pledgeSwitch;
}

function getTextarea(): HTMLTextAreaElement {
  const textarea = document.querySelector("#academic-integrity-pledge-text");
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error("Could not find the pledge text textarea");
  }
  return textarea;
}

function click(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function changeTextarea(value: string) {
  const textarea = getTextarea();
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  act(() => {
    valueSetter?.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("AcademicIntegrityPledgeControl", () => {
  it("disables the pledge control when cover pages are disabled", () => {
    const onIncludedChange = vi.fn();
    const onTextChange = vi.fn();

    renderControl({
      coverPageEnabled: false,
      included: true,
      onIncludedChange,
      onTextChange,
    });

    expect(document.body.textContent).toContain("Include Academic Integrity Pledge");
    expect(document.body.textContent).toContain(
      "Add the pledge and signature line to student cover pages",
    );
    expect(getSwitch().disabled).toBe(true);
    expect(document.body.textContent).not.toContain("Edit pledge");

    click(getSwitch());

    expect(onIncludedChange).not.toHaveBeenCalled();
    expect(onTextChange).not.toHaveBeenCalled();
  });

  it("opens the pledge editor with the current prop text", () => {
    renderControl({ text: "My current pledge." });

    click(getButton("Edit pledge"));

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "Academic Integrity Pledge",
    );
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "The heading and signature line are fixed. Edit only the pledge paragraph.",
    );
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "Pledge text",
    );
    expect(getTextarea().value).toBe("My current pledge.");
  });

  it("discards edits on Cancel and restores the current prop on reopen", () => {
    const onTextChange = vi.fn();
    renderControl({ text: "Original pledge.", onTextChange });

    click(getButton("Edit pledge"));
    changeTextarea("Unsaved replacement.");
    click(getButton("Cancel"));

    expect(onTextChange).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    click(getButton("Edit pledge"));
    expect(getTextarea().value).toBe("Original pledge.");
  });

  it("normalizes pledge text before saving it", () => {
    const onTextChange = vi.fn();
    renderControl({ onTextChange });

    click(getButton("Edit pledge"));
    changeTextarea("  I pledge\n\n  to follow   the rules.  ");
    click(getButton("Save"));

    expect(onTextChange).toHaveBeenCalledOnce();
    expect(onTextChange).toHaveBeenCalledWith("I pledge to follow the rules.");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("resets only the draft until the default pledge is saved", () => {
    const onTextChange = vi.fn();
    renderControl({ text: "Custom pledge.", onTextChange });

    click(getButton("Edit pledge"));
    click(getButton("Reset to default"));

    expect(getTextarea().value).toBe(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE);
    expect(onTextChange).not.toHaveBeenCalled();

    click(getButton("Save"));
    expect(onTextChange).toHaveBeenCalledOnce();
    expect(onTextChange).toHaveBeenCalledWith(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE);
  });

  it("rejects an empty normalized draft", () => {
    const onTextChange = vi.fn();
    renderControl({ onTextChange });

    click(getButton("Edit pledge"));
    changeTextarea(" \n\t  ");

    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "Enter pledge text or disable the pledge.",
    );
    expect(getButton("Save").disabled).toBe(true);
    expect(onTextChange).not.toHaveBeenCalled();
  });

  it.each([
    { included: false, expected: true },
    { included: true, expected: false },
  ])("requests the next included value when included=$included", ({ included, expected }) => {
    const onIncludedChange = vi.fn();
    renderControl({ included, onIncludedChange });

    click(getSwitch());

    expect(onIncludedChange).toHaveBeenCalledOnce();
    expect(onIncludedChange).toHaveBeenCalledWith(expected);
  });
});
