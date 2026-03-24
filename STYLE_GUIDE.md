# AA-Front Style Guide

Design language for all pages in this app. Reference this before writing any new UI.

---

## Core Aesthetic

**Dark tactical / field ops.** Monospaced, data-dense, readable at arm's length on a phone in a loud gym. Every element earns its place. No decorative fluff.

- Font: `DM Mono` (monospace) — already set globally in `app.css`
- Base background: `#242424`
- Max content width: `480–560px`, centered with `margin: 0 auto`
- All touch targets: minimum `48px` height on interactive elements

---

## Color Tokens

```
/* Backgrounds */
--bg-base:    #242424   /* page background (set by app.css) */
--bg-card:    #191919   /* card / panel surface */
--bg-card-2:  #1c1c1c   /* slight variant for cards */
--bg-inset:   #111111   /* inputs, counters, deep insets */
--bg-item:    #1a1a1a   /* list items, buttons */

/* Green — primary accent, success, confirm */
--green:      #3cb371
--green-lt:   #5dde8a   /* text on green backgrounds */
--green-tint: rgba(60, 179, 113, 0.15)
--green-border: rgba(60, 179, 113, 0.35)

/* Red stations / alliance */
--red:        #e05555
--red-tint:   rgba(220, 60, 60, 0.08)
--red-border: rgba(220, 60, 60, 0.18)

/* Blue stations / alliance */
--blue:       #5588ee
--blue-tint:  rgba(60, 110, 220, 0.08)
--blue-border: rgba(60, 110, 220, 0.18)

/* Amber — redo / warning */
--amber:      #ffa000
--amber-tint: rgba(255, 160, 0, 0.15)
--amber-border: rgba(255, 160, 0, 0.30)

/* Gold — done / complete */
--gold:       #ffd700
--gold-tint:  rgba(255, 215, 0, 0.15)

/* Borders & dividers */
--border:     rgba(255, 255, 255, 0.07)   /* card edges */
--border-md:  rgba(255, 255, 255, 0.10)   /* slightly more visible */
--border-sub: rgba(255, 255, 255, 0.06)   /* internal dividers */

/* Text */
--text:       #ffffff
--text-dim:   rgba(255, 255, 255, 0.55)
--text-muted: rgba(255, 255, 255, 0.30)
--text-ghost: rgba(255, 255, 255, 0.15)
```

---

## Typography Scale

All text uses `DM Mono`. No other fonts.

```
/* Page title */
font-size: 1.75rem; font-weight: 700; letter-spacing: 0.18em; color: #fff;

/* Section heading (large) */
font-size: 1.4rem; font-weight: 800; letter-spacing: 0.06em; color: #fff;

/* Card/item title */
font-size: 0.9–1rem; font-weight: 700; color: #fff;

/* Section label (all-caps micro) */
font-size: 0.60–0.65rem; font-weight: 700; letter-spacing: 0.14–0.18em;
text-transform: uppercase; color: rgba(255,255,255,0.30–0.35);

/* Body / meta text */
font-size: 0.80–0.88rem; color: rgba(255,255,255,0.55–0.75);

/* Subtitle / hint under a title */
font-size: 0.70–0.72rem; letter-spacing: 0.10–0.12em;
color: rgba(255,255,255,0.30); text-transform: lowercase;
```

---

## Cards

Standard card used for match/game entries:

```css
.card {
  background: #191919;             /* or #1c1c1c */
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  overflow: hidden;
}

/* Card header strip */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5–0.6rem 0.9–1rem;
  background: rgba(255,255,255,0.03);   /* or rgba(60,179,113,0.08) for green tint */
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

/* Card body */
.card-body {
  padding: 0.6–0.75rem 0.8–1rem;
}
```

**Done/locked card:** add `opacity: 0.4; pointer-events: none;`

**Slide-in animation** (apply to lists of cards):
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card { animation: slideIn 0.3s ease both; }
/* Stagger with: style="animation-delay: {i * 40}ms" */
```

---

## Pill / Badge Tags

Small inline labels. Never use full words in sentence case — use short ALL-CAPS or lowercase.

```css
/* Base pill */
.tag {
  font-size: 0.58–0.62rem;
  font-weight: 700;
  letter-spacing: 0.10–0.14em;
  padding: 2px 6–8px;
  border-radius: 3–4px;
}

/* Green (level / status) */
background: rgba(60,179,113,0.15); color: #3cb371;

/* Gold (done) */
background: rgba(255,215,0,0.15); color: #ffd700;

/* Amber (redo / warning) */
background: rgba(255,160,0,0.20); color: #ffa000;
border: 1px solid rgba(255,160,0,0.35);

/* Red alliance */
background: rgba(220,60,60,0.20); color: #e06060;

/* Blue alliance */
background: rgba(60,110,220,0.20); color: #6699ee;
```

---

## Alliance / Station Color Coding

Always tint red and blue differently. Use consistently:

```css
/* Red alliance panels / columns */
background: rgba(220, 60, 60, 0.06);
border: 1px solid rgba(220, 60, 60, 0.15);

/* Blue alliance panels / columns */
background: rgba(60, 110, 220, 0.06);
border: 1px solid rgba(60, 110, 220, 0.15);

/* Station pip (R1, B2, etc.) */
.red-pip  { background: rgba(220,60,60,0.20); color: #e06060; }
.blue-pip { background: rgba(60,110,220,0.20); color: #6699ee; }
```

---

## Buttons

### Primary action (green)
```css
background: rgba(60,179,113,0.15);
border: 1px solid rgba(60,179,113,0.35);
border-radius: 6–8px;
color: #5dde8a;
font-size: 0.75–0.9rem; font-weight: 600–700; font-family: inherit;
padding: 0.4–0.9rem 0.9–1rem;
transition: background 0.15s;
&:hover { background: rgba(60,179,113,0.25); }
```

### Destructive (red)
```css
background: rgba(200,50,50,0.10);
border: 1px solid rgba(200,50,50,0.25);
color: rgba(220,100,100,0.9);
&:hover { background: rgba(200,50,50,0.20); }
```

### Ghost / secondary
```css
background: #1a1a1a;
border: 1px solid rgba(255,255,255,0.10);
color: rgba(255,255,255,0.70);
```

### Dashed "add" button
```css
background: transparent;
border: 1px dashed rgba(255,255,255,0.12);
color: rgba(255,255,255,0.35);
&:hover { color: #fff; border-color: rgba(255,255,255,0.35); }
```

### Small icon button (remove ✕)
```css
background: transparent;
border: 1px solid rgba(255,255,255,0.12);
border-radius: 4px;
color: rgba(255,255,255,0.40);
font-size: 0.65rem; padding: 2px 5px;
&:hover { color: #e05555; border-color: #e05555; }
```

### Touch-optimized (mobile, in-match)
```css
min-height: 48–64px;
border-radius: 10px;
touch-action: manipulation;
&:active:not(:disabled) { transform: scale(0.94–0.97); }
&:disabled { opacity: 0.22–0.25; cursor: not-allowed; }
```

### Option grid (select-one from N choices, e.g. climb stage)
```css
.option-grid {
  display: grid;
  grid-template-columns: repeat(N, 1fr);
  gap: 8px;
}
.option-btn {
  padding: 0.75rem 0;
  border-radius: 8px;
  border: 1.5px solid rgba(255,255,255,0.10);
  background: #1a1a1a;
  color: rgba(255,255,255,0.55);
}
.option-btn.selected {
  background: rgba(60,179,113,0.18);
  border-color: #3cb371;
  color: #5dde8a;
}
```

### Toggle button (boolean on/off)
```css
.toggle-btn {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; border-radius: 8px;
  border: 1.5px solid rgba(255,255,255,0.08);
  background: #1a1a1a; color: rgba(255,255,255,0.60);
}
.toggle-btn.on {
  border-color: rgba(60,179,113,0.40); color: #fff;
}
/* The indicator box inside */
.toggle-indicator {
  width: 20px; height: 20px; border-radius: 4px;
  border: 2px solid rgba(255,255,255,0.20);
}
.toggle-btn.on .toggle-indicator {
  background: #3cb371; border-color: #3cb371;
}
```

---

## Inputs & Selects

```css
/* Text input / textarea */
background: #111;
border: 1.5px solid rgba(255,255,255,0.10);
border-radius: 10px;
color: #fff; font-family: inherit; font-size: 0.9rem;
padding: 0.75rem;
outline: none;
&:focus { border-color: rgba(60,179,113,0.50); }
&::placeholder { color: rgba(255,255,255,0.20); }
```

---

## Page Layout Patterns

### Standard scrollable page
```css
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}
```

### Page title with left accent bar
```svelte
<header class="page-header">
  <div class="header-accent"></div>  <!-- 3px wide green bar -->
  <h1>TITLE</h1>
  <p class="subtitle">subtitle text</p>
</header>
```
```css
.page-header { position: relative; padding-left: 1rem; margin-bottom: 2.5rem; }
.header-accent { position: absolute; left: 0; top: 0.15em; bottom: 0.15em; width: 3px; background: #3cb371; }
h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: 0.18em; margin: 0; }
.subtitle { margin: 0.2rem 0 0; font-size: 0.72rem; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); }
```

### Sticky header (step forms, detail pages)
```css
.sticky-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: sticky; top: 0;
  background: #242424;
  z-index: 10;
}
```

### Sticky nav bar (bottom)
```css
.nav-bar {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  padding: 1rem 1rem 0;
  position: sticky; bottom: 0;
  background: #242424;
  border-top: 1px solid rgba(255,255,255,0.07);
}
```

### Collapsible panel (`<details>`)
```svelte
<details class="panel" open>
  <summary class="panel-header">
    <span class="panel-title">TITLE</span>
    <span class="panel-sub">subtitle</span>
  </summary>
  <div class="panel-body"> ... </div>
</details>
```
```css
.panel { background: #181818; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
.panel-header { display: flex; align-items: baseline; gap: 0.75rem; padding: 0.75rem 1.1rem; cursor: pointer; user-select: none; list-style: none; border-bottom: 1px solid transparent; }
.panel[open] .panel-header { border-bottom-color: rgba(255,255,255,0.07); }
.panel-header::-webkit-details-marker { display: none; }
.panel-title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #fff; }
.panel-sub { font-size: 0.65rem; letter-spacing: 0.08em; color: rgba(255,255,255,0.30); }
.panel-body { padding: 1rem 1.1rem 1.2rem; }
```

### Section label
```css
.section-label {
  font-size: 0.60–0.65rem; font-weight: 700;
  letter-spacing: 0.14–0.18em; text-transform: uppercase;
  color: rgba(255,255,255,0.30–0.35);
}
```

### Empty/loading state
```css
.state-message {
  text-align: center; padding: 3rem;
  color: rgba(255,255,255,0.30);
  letter-spacing: 0.10em; font-size: 0.85rem;
}
```

---

## Match Card Anatomy

Standard layout for a game/match entry:

```
┌─────────────────────────────────────────┐
│ [QUAL] #42  set 2        2025cahaw  DONE│  ← card header (meta strip)
├─────────────────────────────────────────┤
│ [R1] 1234   [selector]  [+]             │  ← red alliance
│ [R2] 5678   [selector]  [+]             │
│ [R3] 9012   [selector]  [+]             │
│──────────────│──────────────────────────│
│ [B1] 3456   [selector]  [+]             │  ← blue alliance
│ [B2] 7890   [selector]  [+]             │
│ [B3] 2345   [selector]  [+]             │
├─────────────────────────────────────────┤
│ Red MVP: [selector]  Blue MVP:[selector]│  ← MVP bar
└─────────────────────────────────────────┘
```

---

## Responsive Breakpoints

```css
/* Two-column → one-column (alliances, MVP bar) */
@media (max-width: 520px) { .alliances { grid-template-columns: 1fr; } }

/* 6-col quick-assign → 3-col */
@media (max-width: 700px) { .station-grid { grid-template-columns: repeat(3, 1fr); } }

/* Full collapse */
@media (max-width: 480px) { .station-grid, .mvp-row { grid-template-columns: 1fr; } }
```

---

## Do / Don't

| DO | DON'T |
|---|---|
| All-caps micro labels with wide letter-spacing | Sentence-case section headers |
| Tinted background + matching border for colored elements | Solid opaque colors |
| `rgba(255,255,255,0.07)` for card borders | `#333` or similar flat grey borders |
| `touch-action: manipulation` + `scale()` on active for tappable things | Small hit targets on buttons |
| `pointer-events: none; opacity: 0.4` for locked/done items | Hiding done items entirely |
| Dashed border for "add" actions | "+" in a regular button |
| Short ALL-CAPS tags (`QUAL`, `DONE`, `REDO`, `MVP`) | Long label text in badges |
| `#111` for inputs and deep inset surfaces | White or light input backgrounds |
| Green accent only for primary/confirm actions | Using green for decoration |
