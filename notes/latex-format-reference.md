# LaTeX Format Reference

Detailed syntax for the LaTeX template markers used by the exam shuffler.

---

## Settings Block

```latex
%{#setting}
%university=King Fahd University of Petroleum and Minerals
%department=Department of Mathematics
%term=Term 251
%coursecode=MATH 101
%examname=Midterm Exam
%examdate=January 07, 2026
%timeallowed=120 Minutes
%numberofvestions=4
%groups=5,10,15
%examtype=MAJOR
%code_name=CODE
%code_numbering=ALPHA
%paper_size=A4
%includeCoverPage=yes
%seed=MATH101-Midterm-251-Jan07
%{/setting}
```

**Fields** (all required except `seed`):
- `university` / `department` -- appears on cover page
- `term` -- e.g., "Term 251" (Fall 2025), "252" (Spring), "253" (Summer)
- `coursecode` / `examname` / `examdate` / `timeallowed`
- `numberofvestions` -- number of exam versions to generate
- `groups` -- question grouping: `5,10,15` or `(5),10,[15]` (see Grouping Modes)
- `examtype` -- label: "MAJOR", "QUIZ", "FINAL"
- `code_name` -- version prefix (e.g., "CODE" -> "CODE A")
- `code_numbering` -- `ALPHA` (A,B,C) or `NUMERIC` (1,2,3)
- `paper_size` -- `A4` or `LETTER`
- `includeCoverPage` -- `yes` or `no`
- `seed` -- RNG seed (auto-generated if missing)

## Instructions Block

```latex
%{#instructions}
%\begin{enumerate}
%    \begin{normalsize}
%        \item All types of calculators are NOT allowed.
%        \item Use HB 2.5 pencils only.
%    \end{normalsize}
%\end{enumerate}
%{/instructions}
```

Each line must start with `%`. Supports LaTeX commands.

## Preamble Block (Optional)

```latex
%{#preamble}
\usepackage{amsmath}
\usepackage{tikz}
\newcommand{\R}{\mathbb{R}}
%{/preamble}
```

No `%` prefix needed. Added before `\begin{document}`.

## Question Blocks

**MCQ:**
```latex
\begin{enumerate}
\item %{#q}What is $2 + 2$?%{/q}
\begin{enumerate}
\item %{#o}Three%{/o}
\item %{#o}Four%{/o}
\item %{#o}Five%{/o}
\end{enumerate}
\end{enumerate}
```

**Open-Ended:**
```latex
%{#q}
Explain the process of photosynthesis in detail.
%{/q}
```

**Multi-line questions and options** are supported with `%{#q}...\n...\n...%{/q}` and `%{#o}...\n...%{/o}`.

## Question Tags

Tags go on separate lines after `\item`:

```latex
\item %{#fixed}
%{#q}Student ID?%{/q}

\item %{#fixed-options:B}
%{#q}Which is the capital of France?%{/q}

\item %{#separate-page}
%{#q}Essay question...%{/q}
```

- `%{#fixed}` -- locks position AND option order
- `%{#fixed-options:X}` -- locks option order only (X = correct answer A-E)
- `%{#separate-page}` -- forces new page
- Can combine `fixed` or `fixed-options` with `separate-page`
- **Cannot** combine `fixed` + `fixed-options`

## CSV Format

4 sections marked with `#` headers. Only `# questions` is required.

```csv
# settings
university,King Fahd University
coursecode,MATH 101

# instructions
Read all questions carefully

# preamble
\usepackage{amsmath}

# questions
Question Text,Option A,Option B,Option C,Option D,Option E,Correct,Tags
"What is $2+2$?","Three","Four","Five","","",B,
"Student ID?","Enter ID","","","","",A,fixed
```

8 columns. Types inferred (has options = MCQ, no options = open-ended).

## Excel Format

4 sheets: Settings, Instructions, Preamble, Questions (case-insensitive). Only Questions is required. Same 8-column structure as CSV.
