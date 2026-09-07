import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { DEFAULT_ACADEMIC_INTEGRITY_PLEDGE } from "@/lib/core/academic-integrity-pledge";
import { Button } from "../button";
import { TemplateDialog } from "../template-dialog";

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

function renderTemplateDialog(onTemplateGenerate = vi.fn()) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <TemplateDialog
        format="tex"
        onTemplateGenerate={onTemplateGenerate}
        triggerButton={<Button>Open template dialog</Button>}
      />,
    );
  });

  return onTemplateGenerate;
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

function getInput(id: string): HTMLInputElement {
  const input = document.querySelector(`#${id}`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Could not find input: ${id}`);
  }
  return input;
}

function getTextarea(): HTMLTextAreaElement {
  const textarea = document.querySelector("#academic-integrity-pledge-text");
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error("Could not find the pledge text textarea");
  }
  return textarea;
}

function getPledgeSwitch(): HTMLButtonElement {
  const pledgeSwitch = document.querySelector(
    '[role="switch"][aria-label="Include Academic Integrity Pledge"]',
  );
  if (!(pledgeSwitch instanceof HTMLButtonElement)) {
    throw new Error("Could not find the academic integrity pledge switch");
  }
  return pledgeSwitch;
}

function click(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function changeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  act(() => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function completeRequiredFields() {
  changeValue(getInput("coursecode"), "MATH 101");
  changeValue(getInput("examname"), "Major Exam I");
}

describe("TemplateDialog academic integrity pledge", () => {
  it("submits the default-enabled approved pledge", () => {
    const onTemplateGenerate = renderTemplateDialog();

    click(getButton("Open template dialog"));
    completeRequiredFields();
    click(getButton("Generate Template"));

    expect(onTemplateGenerate).toHaveBeenCalledOnce();
    expect(onTemplateGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "tex",
        includeCoverPage: true,
        includeAcademicIntegrityPledge: true,
        academicIntegrityPledgeText: DEFAULT_ACADEMIC_INTEGRITY_PLEDGE,
      }),
    );
  });

  it("submits pledge text edited in the shared control", () => {
    const onTemplateGenerate = renderTemplateDialog();

    click(getButton("Open template dialog"));
    completeRequiredFields();
    click(getButton("Edit pledge"));
    changeValue(getTextarea(), "Custom template pledge.");
    click(getButton("Save"));
    click(getButton("Generate Template"));

    expect(onTemplateGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        includeAcademicIntegrityPledge: true,
        academicIntegrityPledgeText: "Custom template pledge.",
      }),
    );
  });

  it("restores pledge defaults after the template dialog is cancelled", () => {
    renderTemplateDialog();

    click(getButton("Open template dialog"));
    click(getButton("Edit pledge"));
    changeValue(getTextarea(), "Discarded custom pledge.");
    click(getButton("Save"));
    click(getPledgeSwitch());
    click(getButton("Cancel"));

    click(getButton("Open template dialog"));
    expect(getPledgeSwitch().getAttribute("aria-checked")).toBe("true");
    click(getButton("Edit pledge"));
    expect(getTextarea().value).toBe(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE);
  });

  it("restores pledge defaults after successful template generation", () => {
    renderTemplateDialog();

    click(getButton("Open template dialog"));
    completeRequiredFields();
    click(getButton("Edit pledge"));
    changeValue(getTextarea(), "Previously submitted pledge.");
    click(getButton("Save"));
    click(getPledgeSwitch());
    click(getButton("Generate Template"));

    click(getButton("Open template dialog"));
    expect(getPledgeSwitch().getAttribute("aria-checked")).toBe("true");
    click(getButton("Edit pledge"));
    expect(getTextarea().value).toBe(DEFAULT_ACADEMIC_INTEGRITY_PLEDGE);
  });
});
