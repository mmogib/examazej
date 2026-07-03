# Examazej — Icon Design Brief (for Claude Design app / Fable)

> **STATUS: ✅ DELIVERED.** Final art lives in `assets/branding/icon/` (`examazej-*`), and
> `build/icon.ico` + `public/` favicons are generated via `scripts/gen-icons.ps1`. The
> save-map lower in this file (which mentions `assets/branding/icon.svg`) is the ORIGINAL
> brief, kept for history — the single source of truth is **`assets/branding/icon/`**.

Purpose: produce ONE refined master icon; we generate all derived formats locally so the
**web app** (`public/`) and **desktop app** (`build/`) share identical branding.

---

## Files to ATTACH in the Design app (reference)
- `assets/branding/icon.svg`        — current v2 draft (vector)
- `assets/branding/icon-master.png` — current v2 draft (1024² render)

Tell Fable to keep the general direction (fanned exam papers + highlighted answer) but
elevate/refine it.

---

## PROMPT (copy-paste)

> Design a modern app icon for **"Examazej"** — a desktop + web tool for university
> professors that shuffles/permutes multiple-choice exam questions and answer options into
> multiple deterministic versions (Version A, B, C…) from one template. The name blends
> English **"Exam"** + Arabic **"مزيج / mazeej"** ("blend / mix").
>
> **Concept:** a small fan/stack of exam papers being shuffled — clearly conveying "multiple
> versions of one exam." On the top paper, a few multiple-choice rows (option bubble + text
> line), with ONE bubble highlighted as the selected/correct answer (a checkmark). Iconic
> and instantly readable — not detailed or realistic.
>
> **Brand palette (these are the app's real theme colors — the icon MUST match them so web
> and desktop feel cohesive):**
> - Background gradient: deep university green **#027E2F** → cyan **#008A99**, diagonal ~135°
>   (the app's signature gradient).
> - Cards / paper: white / near-white (**#FFFFFF**, **#F7F8F5**).
> - Accent (highlighted answer): warm gold **#DCCB6A** (a slightly richer gold is fine if it
>   reads better).
> - Optional brighter green for depth: **#03C94C**.
>
> **Style:** flat, minimal, geometric, modern; rounded-square app-icon silhouette with soft
> depth; strong contrast; **legible at 16×16 px** (taskbar / favicon); centered; **no text or
> letters** (must work for Arabic + English audiences); balanced / RTL-neutral; looks good on
> both light and dark surfaces.
>
> **Reference:** I'm attaching our current draft (icon.svg + a 1024px render). Keep this
> general direction (fanned exam papers + highlighted answer) but make it more polished and
> professional.
>
> **Deliverables:**
> 1. **Master: 1024×1024 PNG** — the full app icon (rounded-square, green→cyan gradient
>    background). ← most important
> 2. **SVG source** of the same, if exportable.
> 3. A **transparent-background "glyph" version** (just the papers mark, no square) as SVG
>    and/or 1024 PNG — for flexible placement.
> 4. (Optional) a **1200×630 social/OG banner** using the same mark + gradient, for web link
>    previews.
>
> Sizes like 512 / 256 / 180 / 32 / 16 and the Windows `.ico` are NOT needed from you — we
> generate those locally from the 1024 master.

---

## Where to SAVE what comes back (source of truth = `assets/branding/`)
Drop the returned files here (overwrite the drafts):
- `assets/branding/icon.svg`          — new vector source
- `assets/branding/icon-master.png`   — new 1024² app-icon master (green→cyan bg)
- `assets/branding/icon-glyph.svg`    — transparent glyph (optional but nice)
- `assets/branding/icon-glyph.png`    — transparent glyph 1024² (optional)
- `assets/branding/og-image.png`      — 1200×630 social banner (optional)

## Then generate locally (one step — shared by web + desktop)
From `assets/branding/icon-master.png` we produce:
- **Desktop:** `build/icon.ico` (256/128/64/48/32/24/16)
- **Web (`public/`):** `favicon.ico`, `favicon.png` (512), `apple-touch-icon.png` (180),
  `icon-192.png`, `icon-512.png`, and (optional) `og-image.png` — then update `index.html`
  `<link>`/meta tags.

Generation commands (ImageMagick, reproducible; outputs committed so CI needs no IM):
```
magick -background none assets/branding/icon.svg -resize 1024x1024 assets/branding/icon-master.png
magick assets/branding/icon-master.png -define icon:auto-resize=256,128,64,48,32,24,16 build/icon.ico
magick assets/branding/icon-master.png -resize 512x512  public/favicon.png
magick assets/branding/icon-master.png -resize 180x180  public/apple-touch-icon.png
magick assets/branding/icon-master.png -resize 192x192  public/icon-192.png
magick assets/branding/icon-master.png -resize 512x512  public/icon-512.png
magick public/favicon.png -define icon:auto-resize=48,32,16 public/favicon.ico
```
(Claude can wrap these in `scripts/gen-icons.ps1` and wire `index.html` once the master is in.)
