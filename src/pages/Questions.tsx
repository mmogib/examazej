import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  ListOrdered,
  Lock,
  Pin,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LaTeXRenderer } from "@/components/ui/latex-renderer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { describeGroups, type GroupLayout, type GroupMode } from "@/lib/core/group-config";
import { getQuestionNotes, type QuestionNote } from "@/lib/core/import-notes";
import { areOptionsLocked, getLockTags, isPositionLocked } from "@/lib/core/question-flags";
import { activePins as pinsOf, describeEffect, isTagged, letter, letterRanges } from "@/lib/core/question-effect";
import {
  areLocksChanged,
  fixLegacyFixed,
  fixLegacyPin,
  isQuestionChanged,
  matchOldReading,
  pinsLeaveNothingToShuffle,
  replaceQuestion,
  resetQuestion,
  setCorrectAnswer,
  setOptionsLock,
  setPositionLock,
  setSeparatePage,
  togglePin,
} from "@/lib/core/question-edits";
import { validateSeparatePageGrouping } from "@/lib/utils/tag-validator";
import type { ExamJSON, Question } from "@/lib/types";

type Filter = "all" | "tagged" | "changed" | "notes";

const GROUP_LABELS: Record<GroupMode, string> = {
  standard: "stays in place · questions shuffle",
  ordered: "group moves · order kept",
  topic: "group moves · questions shuffle",
};

/** Arrow keys change the question only when focus is not on a control that uses them. */
function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      'input, textarea, select, button, a, [role="radio"], [role="radiogroup"], [role="switch"], [role="checkbox"], [role="tab"], [contenteditable="true"]'
    ) !== null
  );
}

interface QuestionsPageProps {
  examData: ExamJSON;
  /** The questions as uploaded: "Changed" and Reset compare with them. */
  baseline: Question[];
  onDataUpdated: (data: ExamJSON) => void;
  onBack: () => void;
  onGenerate: () => void;
  /** False while another page (Documentation) is shown over this one. */
  active?: boolean;
}

export function QuestionsPage({
  examData,
  baseline,
  onDataUpdated,
  onBack,
  onGenerate,
  active = true,
}: QuestionsPageProps) {
  const questions = examData.exam.questions;
  const groups = useMemo(
    () => describeGroups(examData.setting.groups, questions.length),
    [examData.setting.groups, questions.length]
  );
  const groupOf = useCallback(
    (index: number): GroupLayout =>
      groups.find((g) => index >= g.start && index < g.start + g.size) ?? {
        number: 1,
        start: 0,
        size: questions.length,
        mode: "standard",
        label: String(questions.length),
      },
    [groups, questions.length]
  );

  const [current, setCurrent] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");

  const notesOf = useMemo(
    () => getQuestionNotes(questions, examData.setting.groups),
    [questions, examData.setting.groups]
  );
  const changedOf = useMemo(
    () => questions.map((q, i) => isQuestionChanged(q, baseline[i])),
    [questions, baseline]
  );
  const locksChanged = questions.some((q, i) => areLocksChanged(q, baseline[i]));
  const separatePageErrors = useMemo(
    () => validateSeparatePageGrouping(questions, examData.setting.groups),
    [questions, examData.setting.groups]
  );

  const update = useCallback(
    (index: number, next: Question) => {
      const nextQuestions = replaceQuestion(questions, index, next);
      if (nextQuestions === questions) return;
      onDataUpdated({ ...examData, exam: { ...examData.exam, questions: nextQuestions } });
    },
    [examData, questions, onDataUpdated]
  );

  const go = useCallback(
    (step: number) => setCurrent((c) => Math.min(questions.length - 1, Math.max(0, c + step))),
    [questions.length]
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isFormControl(event.target)) return;
      event.preventDefault();
      go(event.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  const matches = (index: number) => {
    switch (filter) {
      case "tagged":
        return isTagged(questions[index]);
      case "changed":
        return changedOf[index];
      case "notes":
        return notesOf[index].length > 0;
      default:
        return true;
    }
  };

  const question = questions[current];
  const base = baseline[current];
  const group = groupOf(current);
  const notes = notesOf[current];
  const options = question.choices[0];
  const hasOptions = options.length > 0;
  const optionsLocked = areOptionsLocked(question);
  const pins = pinsOf(question);
  const othersCanMove = Array.from({ length: group.size }, (_, k) => group.start + k).some(
    (i) => i !== current && !isPositionLocked(questions[i])
  );
  // Pins leave at most one option free; two must be free for any to move.
  const toUnpin = 2 - (options.length - pins.length);

  const generateButton = (
    <Button onClick={onGenerate} disabled={separatePageErrors.length > 0} variant="hero" size="lg">
      Generate
      <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Review questions</h1>
            <p className="text-muted-foreground">
              Change locks, pins, answers and own pages. Every change is kept as you make it.
            </p>
          </div>
        </div>
        {generateButton}
      </div>

      {separatePageErrors.length > 0 && (
        <Alert variant="destructive" className="mb-6" data-testid="separate-page-errors">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generate is off until this is fixed</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {separatePageErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Turn off "Put on its own page", or change the groups on{" "}
              <button type="button" className="underline font-medium" onClick={onBack}>
                the Details page
              </button>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      {locksChanged && (
        <Alert className="mb-6" data-testid="locks-changed">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Some locks or pins differ from the uploaded file, so the versions differ from the ones the same
            seed made before these changes. Answer and own-page changes do not change the versions.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Navigator */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Questions</CardTitle>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => value && setFilter(value as Filter)}
              size="sm"
              className="flex-wrap justify-start"
              aria-label="Show in the list"
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="tagged">Tagged</ToggleGroupItem>
              <ToggleGroupItem value="changed">Changed</ToggleGroupItem>
              <ToggleGroupItem value="notes">With notes</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.map((g) => {
              const indices = Array.from({ length: g.size }, (_, k) => g.start + k).filter(matches);
              return (
                <div key={g.number} data-testid={`group-${g.number}`}>
                  <div className="text-xs font-medium text-foreground">
                    Group {g.number} · <span className="font-mono">{g.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{GROUP_LABELS[g.mode]}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {indices.map((i) => (
                      <QuestionChip
                        key={i}
                        index={i}
                        question={questions[i]}
                        selected={i === current}
                        changed={changedOf[i]}
                        hasNotes={notesOf[i].length > 0}
                        onSelect={() => setCurrent(i)}
                      />
                    ))}
                    {indices.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-3 text-xs text-muted-foreground space-y-1" aria-hidden="true">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> place kept</span>
                <span className="inline-flex items-center gap-1"><ListOrdered className="h-3 w-3" /> options in order</span>
                <span className="inline-flex items-center gap-1"><Pin className="h-3 w-3" /> pinned</span>
                <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> own page</span>
                <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> note</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> changed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* One question */}
        <Card className="lg:col-span-2" data-testid="question-view">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle data-testid="question-title">
                Question {current + 1} <span className="font-normal text-muted-foreground">of {questions.length}</span>
              </CardTitle>
              <CardDescription>
                Group {group.number} · <span className="font-mono">{group.label}</span> — {GROUP_LABELS[group.mode]}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={current === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => go(1)} disabled={current === questions.length - 1}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-base leading-relaxed whitespace-pre-wrap">
              <LaTeXRenderer content={question.text} />
            </div>

            {hasOptions ? (
              <RadioGroup
                value={String(question.choices[1])}
                onValueChange={(value) => update(current, setCorrectAnswer(question, Number(value)))}
                aria-label="Correct answer"
                className="gap-2"
              >
                {options.map((option, i) => {
                  const pinned = pins.includes(i);
                  const correct = i === question.choices[1];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        correct ? "border-primary/60 bg-primary/5" : "border-border"
                      )}
                    >
                      <RadioGroupItem
                        value={String(i)}
                        id={`answer-${i}`}
                        aria-label={`Option ${letter(i)} is the correct answer`}
                        className="mt-1"
                      />
                      <Label htmlFor={`answer-${i}`} className="flex-1 cursor-pointer font-normal leading-relaxed">
                        <span className="mr-2 font-semibold">{letter(i)}.</span>
                        <LaTeXRenderer content={option.text} />
                      </Label>
                      {correct && <Badge variant="secondary">Correct</Badge>}
                      <Button
                        type="button"
                        size="sm"
                        variant={pinned ? "default" : "ghost"}
                        aria-pressed={pinned}
                        aria-label={pinned ? `Unpin option ${letter(i)}` : `Pin option ${letter(i)}`}
                        title={
                          optionsLocked
                            ? "All options are kept in order"
                            : pinned
                              ? `Option ${letter(i)} stays ${letter(i)} in every version`
                              : `Keep option ${letter(i)} at ${letter(i)} in every version`
                        }
                        disabled={optionsLocked}
                        onClick={() => update(current, togglePin(question, i, base))}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </RadioGroup>
            ) : (
              <p className="text-sm text-muted-foreground">Open-ended question (no options).</p>
            )}

            <div className="space-y-3 rounded-lg border p-4">
              {group.mode === "ordered" ? (
                <div className="flex items-center justify-between gap-4" data-testid="position-in-ordered-group">
                  <span className="text-sm font-medium">Keep its place in the group</span>
                  <span className="text-sm text-muted-foreground">
                    In place (the group keeps order anyway)
                    {isPositionLocked(question) ? " · locked in the file" : ""}
                  </span>
                </div>
              ) : (
                <SwitchRow
                  id="lock-position"
                  label="Keep its place in the group"
                  checked={isPositionLocked(question)}
                  onChange={(on) => update(current, setPositionLock(question, on, base))}
                />
              )}
              {hasOptions && (
                <SwitchRow
                  id="lock-options"
                  label="Keep all options in order"
                  hint={pins.length > 0 ? "Turning this on clears the pins." : undefined}
                  checked={optionsLocked}
                  onChange={(on) => update(current, setOptionsLock(question, on, base))}
                />
              )}
              <SwitchRow
                id="own-page"
                label="Put on its own page"
                checked={question.keepOnSeparatePage}
                onChange={(on) => update(current, setSeparatePage(question, on))}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm" data-testid="effect">
                {describeEffect(question, group.mode, othersCanMove)}
              </p>
              {pinsLeaveNothingToShuffle(question) && options.length >= 2 && (
                <p className="text-sm text-muted-foreground" data-testid="nothing-to-shuffle">
                  No option can move: unpin {toUnpin > 1 ? "two" : "one"}, or turn on "Keep all options in
                  order".
                </p>
              )}
            </div>

            {notes.length > 0 && (
              <div className="space-y-3" data-testid="question-notes">
                {notes.map((note) => (
                  <NoteBox
                    key={note.kind}
                    note={note}
                    question={question}
                    uploaded={base}
                    onFixPin={() => update(current, fixLegacyPin(question, base))}
                    onFixFixed={() => update(current, fixLegacyFixed(question, base))}
                    onMatchReading={() => update(current, matchOldReading(question, group.mode, base))}
                    onConfirmAnswer={() => update(current, setCorrectAnswer(question, question.choices[1]))}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Approximate preview: TikZ pictures, \includegraphics, tables and preamble macros show as written.
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={!changedOf[current] || !base}
                onClick={() => base && update(current, resetQuestion(base))}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset this question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">{generateButton}</div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function QuestionChip({
  index,
  question,
  selected,
  changed,
  hasNotes,
  onSelect,
}: {
  index: number;
  question: Question;
  selected: boolean;
  changed: boolean;
  hasNotes: boolean;
  onSelect: () => void;
}) {
  const hasOptions = question.choices[0].length > 0;
  const marks = [
    isPositionLocked(question) && "place kept",
    hasOptions && areOptionsLocked(question) && "options in order",
    pinsOf(question).length > 0 && "pinned",
    question.keepOnSeparatePage && "own page",
    hasNotes && "note",
    changed && "changed",
  ].filter(Boolean);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      aria-label={`Question ${index + 1}${marks.length ? ` (${marks.join(", ")})` : ""}`}
      data-testid={`chip-${index + 1}`}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
      )}
    >
      {index + 1}
      {isPositionLocked(question) && <Lock className="h-3 w-3" aria-hidden="true" />}
      {hasOptions && areOptionsLocked(question) && <ListOrdered className="h-3 w-3" aria-hidden="true" />}
      {pinsOf(question).length > 0 && <Pin className="h-3 w-3" aria-hidden="true" />}
      {question.keepOnSeparatePage && <FileText className="h-3 w-3" aria-hidden="true" />}
      {hasNotes && (
        <AlertTriangle className={cn("h-3 w-3", selected ? "" : "text-amber-600")} aria-hidden="true" />
      )}
      {changed && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />}
    </button>
  );
}

/** Tags as written, e.g. "%{#fixed} %{#separate-page}", or "no tags". */
function tagList(tags: string[]): string {
  return tags.length > 0 ? tags.map((tag) => `%{#${tag}}`).join(" ") : "no tags";
}

function NoteBox({
  note,
  question,
  uploaded,
  onFixPin,
  onFixFixed,
  onMatchReading,
  onConfirmAnswer,
}: {
  note: QuestionNote;
  question: Question;
  uploaded: Question | undefined;
  onFixPin: () => void;
  onFixFixed: () => void;
  onMatchReading: () => void;
  onConfirmAnswer: () => void;
}) {
  const amber =
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400";
  const pins = pinsOf(question);
  const pinWords = pins.length > 0 ? ` and clears the pin${pins.length > 1 ? "s" : ""} on ${letterRanges(pins)}` : "";
  const answer = letter(question.choices[1]);

  switch (note.kind) {
    case "legacyPin":
      return (
        <Alert className={amber} data-testid="note-legacy-pin">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>From an older Examazej: %{"{"}#fixed-options:X{"}"} changed meaning</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>
              The older Examazej (before November 2026) read this tag as "keep all options in order"; now it keeps
              only the pinned option in place. With its current tags this question is not shuffled as it was then,
              so it comes out differently from your old exams with the same seed, and other questions may differ
              too.
            </p>
            <Button size="sm" variant="outline" onClick={onFixPin}>
              Match my old exams
            </Button>
            <p className="text-xs">Turns on "Keep all options in order"{pinWords}. The answer stays {answer}.</p>
          </AlertDescription>
        </Alert>
      );
    case "legacyFixed":
      return (
        <Alert className={amber} data-testid="note-legacy-fixed">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>From an older Examazej: a fixed question in a (n) group</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>
              The older Examazej (before November 2026) shuffled this question's options by mistake. With its
              current tags they do not shuffle as they did then, so its answers differ from your old answer keys
              with the same seed
              {note.reach === "wider"
                ? ", and because it no longer draws the shuffle the older Examazej drew, later questions in each version may differ too."
                : " (the other questions are not affected)."}
            </p>
            <Button size="sm" variant="outline" onClick={onFixFixed}>
              Match my old exams
            </Button>
            <p className="text-xs">
              Lets the options shuffle{pinWords}. Its place in the group is kept.
            </p>
          </AlertDescription>
        </Alert>
      );
    case "legacyRead": {
      const reading = question.legacyRead;
      const written = uploaded ? [...getLockTags(uploaded), ...(uploaded.keepOnSeparatePage ? ["separate-page"] : [])] : [];
      return (
        <Alert className={amber} data-testid="note-legacy-read">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>From an older Examazej: its tags were read differently</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>
              The older Examazej (before November 2026) read this question with {tagList(reading?.tags ?? [])}; this
              version reads it as written in the file, with {tagList(written)}. So it comes out differently from
              your old exams with the same seed
              {note.reach === "wider" ? ", and other questions may differ too." : " (only its own page or its line of the mapping file)."}
            </p>
            <Button size="sm" variant="outline" onClick={onMatchReading}>
              Match my old exams
            </Button>
            <p className="text-xs">
              Gives it the tags the older Examazej read{pinWords}.
              {question.choices[0].length > 0 ? ` The answer stays ${answer}.` : ""}
            </p>
          </AlertDescription>
        </Alert>
      );
    }
    case "legacyReadAnswer":
      return (
        <Alert data-testid="note-legacy-read-answer">
          <Info className="h-4 w-4" />
          <AlertTitle>The older Examazej took another answer</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>
              It took {note.then} as the answer, because it did not read the tag that gives {answer}. Your old answer
              keys were wrong for this question; the new ones show {answer}.
            </p>
            <Button size="sm" variant="outline" onClick={onConfirmAnswer}>
              Answer {answer} is correct
            </Button>
          </AlertDescription>
        </Alert>
      );
    case "answerAssumed":
      return (
        <Alert data-testid="note-answer-assumed">
          <Info className="h-4 w-4" />
          <AlertTitle>Answer assumed</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>The file pins an option but gives no answer (%{"{"}#correct:X{"}"}), so A was taken as the answer.</p>
            <Button size="sm" variant="outline" onClick={onConfirmAnswer}>
              Answer {answer} is correct
            </Button>
          </AlertDescription>
        </Alert>
      );
    case "answerFromLetter":
      return (
        <Alert data-testid="note-answer-from-letter">
          <Info className="h-4 w-4" />
          <AlertTitle>Answer taken from the pinned letter</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>
              The file (made with an older Examazej) gives no answer, so, as the older Examazej did, the answer was taken from the
              letter in %{"{"}#fixed-options:{note.letter}{"}"}.
            </p>
            <Button size="sm" variant="outline" onClick={onConfirmAnswer}>
              Answer {answer} is correct
            </Button>
          </AlertDescription>
        </Alert>
      );
    case "pinnedAnswer":
      return (
        <Alert data-testid="note-pinned-answer">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            The answer is a pinned option, so it is {note.letter} in every version.
          </AlertDescription>
        </Alert>
      );
  }
}
