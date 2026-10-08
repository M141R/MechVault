---
name: MechVault
description: One folded j-card per subject. Ballpoint on ruled stock, one spot colour, running times in the margin.
colors:
  stock: "#fbfaf7"
  inlay-rule: "#dfe4ec"
  ballpoint: "#1c3f7a"
  ballpoint-deep: "#122b54"
  pencil: "#8b9099"
  spot: "#c8102e"
  spot-soft: "rgba(200, 16, 46, 0.10)"
  ink: "#1a1d21"
  ink-2: "#5b6169"
  hatch: "#b9c2d4"
typography:
  display:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  running:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  ruled:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.16em"
rounded:
  none: "0px"
  chip: "2px"
  spine: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  base: "14px"
  md: "20px"
  lg: "30px"
  xl: "44px"
  sheet: "56px"
components:
  track-row:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  track-row-uncovered:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.pencil}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  running-time:
    textColor: "{colors.ballpoint-deep}"
    typography: "{typography.running}"
    rounded: "{rounded.none}"
    padding: "0 2px"
  side-head:
    textColor: "{colors.spot}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  spine-tab:
    backgroundColor: "{colors.ballpoint-deep}"
    textColor: "{colors.stock}"
    rounded: "{rounded.none}"
    padding: "7px 11px"
  spine-tab-active:
    backgroundColor: "{colors.spot}"
    textColor: "{colors.stock}"
    rounded: "{rounded.none}"
    padding: "7px 11px"
  tally-box:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "10px 12px"
  ink-btn:
    backgroundColor: "{colors.ballpoint}"
    textColor: "{colors.stock}"
    rounded: "{rounded.none}"
    padding: "9px 18px"
  ink-btn-ghost:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ballpoint}"
    rounded: "{rounded.none}"
    padding: "9px 18px"
  covered-stamp:
    textColor: "{colors.spot}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 6px"
---

# Design System: MechVault

## Overview

**Creative North Star: "The J-Card"**

MechVault presents itself as a hand-inked audio cassette's folded insert card. Not a dashboard, not a CMS, not a CAD tool. The user opens what looks like a physical card pulled from a shelf of subject spines, reads it the way you read a tracklist, and closes it. Everything is ballpoint on ruled stock with a single printed spot colour, and the arithmetic of the thing — how many tracks, how long each one, what's still to record — is set in the margin where a real J-card sets its running times.

The mechanism this world carries is **coverage arithmetic**. A cassette's whole reason for existing is to know what is on the tape and how long the tape is. So does this product: 357 extracted questions, each with a real marks value and a real page reference, on a tape of finite length. The `side a` / `side b` flip is the honest home for covered versus remaining, because those are two hard halves of one physical object, not two tabs of a dashboard.

**Why this replaced the blueprint world.** The blueprint direction was a professional drafting instrument and MechVault is not a drafting tool; it made a study app look like engineering software. The J-card is what an engineering student's actual desk holds: annotated, handwritten, hand-timed, one accent colour because the insert only had one.

**Key Characteristics:**
- Ruled ground with printed lines the content sits on, never a blank white sheet.
- One spot colour, used for the sides, the active spine, and covered marks. Never decorative.
- Mono right-aligned running times tight against the right margin, the way a tracklist runs.
- Square corners everywhere. A J-card has no radius.
- Coverage encoded by **fill**, not by colour alone: solid, hatched, or open.

## Colors

Stock, ballpoint, one spot. Neutral paper is the world.

### Primary
- **Ballpoint Blue** (`#1c3f7a`): every ink stroke on the card. Spine tabs, headings, running times, the active border. It is the voice of the handwriting.

### Secondary
- **Spot Red** (`#c8102e`): the single printed accent, and it does exactly three jobs. The `side a` / `side b` heads, the active spine tab, and the covered stamp. If something is red, it is one of those three things. Never a hover, never a gradient, never a second accent.

### Tertiary
- **Pencil Grey** (`#8b9099`): tentative content. Uncovered questions are pencil because they are not inked yet. This is load-bearing, not a disabled state.

### Neutral
- **Stock** (`#fbfaf7`): the card's paper. Slightly warm, never `#ffffff`, because a J-card is not paper white.
- **Inlay Rule** (`#dfe4ec`): the printed ruled lines. One hairline colour, used for every rule on the card including table rows.
- **Ink** (`#1a1d21`) and **Ink 2** (`#5b6169`): body and secondary text.
- **Hatch** (`#b9c2d4`): the hatch fill that encodes partial coverage.

### Named Rules

**The One Spot Rule.** Spot red appears only on a side head, the active spine tab, or a covered stamp. Three jobs, no fourth. Its scarcity is the point.

**The Fill-Not-Color Rule.** Coverage state is carried by fill (solid / hatched / open) before it is carried by red. A tracker must survive greyscale printing and colour-blindness, so no state is ever distinguished by hue alone.

## Typography

**Display Font:** Familjen Grotesk (system-ui fallback)
**Body Font:** Familjen Grotesk (system-ui fallback)
**Ruled/Note Font:** Source Serif 4 (Georgia fallback) — the textbook's own voice, for note prose only
**Running-Time/Mono Font:** JetBrains Mono

**Character:** A sans doing the writing and the signposting, a serif doing the reading, and a mono doing the arithmetic. The mono is load-bearing: every number that represents a count, a mark value, or a page reference is tabular mono, right-aligned. Numerals never use the sans, because a J-card's running times are the one thing you must be able to compare vertically down the margin.

### Hierarchy
- **Display** (700, clamp 1.75-2.5rem, 1.05): the subject name, inked once per card. Not repeated.
- **Headline** (600, 1.25rem, 1.2): module headings within a card.
- **Title** (600, 1rem, 1.3): the `side a` / `side b` heads and section rules.
- **Body** (400, 1rem, 1.6, max 68ch): note prose. Study content is read, not scanned, so line length is generous.
- **Ruled** (400, 1.0625rem, 1.9): note body inside modules, sitting on the ruled lines. The 1.9 leading matches the rule pitch so lines land on rules instead of straddling them.
- **Label** (600, 0.6875rem, 0.16em, uppercase): `side a`, module numbers, tape totals. Tracklist spine labels, always uppercase mono.

### Named Rules

**The Margin Rule.** Every count, marks value, and page reference is tabular mono, right-aligned tight to the right margin, and never wraps. Nothing else may occupy that column.

**The Ink-vs-Pencil Rule.** Content the user has covered is inked ballpoint. Content they have not is pencil grey. There is no third state in the text itself.

## Layout

One sheet, `--maxw 1120px`, gutter 20px, and the same gutter on every page-level section so content lines up across routes.

The spine is the navigation: a horizontal row of subject tabs at the top, 44px tall, each showing the subject in label type with a mono count. The active tab is spot red. On narrow widths the spine becomes a horizontally scrollable strip rather than wrapping, because a wrapped spine reads as broken.

**Sidebar, not column pairs.** At ≥1024px the subject card sits at 1fr beside a 320px column holding the tape tally and search. Below 1024px the tally moves above the card and the two stack. No `calc()` width arithmetic anywhere; the split is CSS Grid with `1fr 320px`.

**Ruled ground.** The card sits on `--stock` with the `--inlay-rule` hairline grid visible at 3% the way a J-card's printed inlay shows through. Rules are 1px hairlines, never 2px, never dashed except for one use: an uncovered module's heading is dotted, because pencil lines are faint.

**Responsive behaviour.** Breakpoints are 860px and 560px, retained from the incumbent so existing markup keeps working.
- Above 860: full two-column layout, running times in the right margin.
- 860 and below: single column, tally above card, running times still right-aligned against the card's own margin.
- 560 and below: the ruled grid fades out (it is texture, not content), the spine scrolls horizontally, and label type drops to 0.625rem. Track rows keep their mono time on the same line as the question; nothing reflows to a second line, because a tracklist that wraps reads as a different object.
- Reduced motion: `prefers-reduced-motion: reduce` collapses the side flip to an instant swap.

**The side flip.** `side a` (covered) and `side b` (remaining) are hard halves with a real transition between them. Wide screens flip on the Y axis as a single card rotating 180°; narrow screens swap instantly rather than animating a rotation that would mislead about what happened.

## Elevation & Depth

**No shadows.** A J-card is flat card stock; it casts a shadow because it sits on a desk, not because the UI wants depth. This system uses no `box-shadow` at all.

Depth comes from three things instead:
1. **The ruled ground**, which establishes a physical plane.
2. **The spine tab**, which reads as a tab standing proud of the shelf because it is the only element with a filled background.
3. **Hatching**, which reads as a physical mark-making difference (pencil hatching, not a fill swatch).

The one concession: the sticky spine may use a single hairline bottom rule with a paper-coloured backdrop so content does not read through it while scrolling. That is a backdrop, not an elevation.

### Named Rules

**The Flat Rule.** No `box-shadow` anywhere. If something needs to separate from the card, it gets a hairline, a filled tab, or a hatch. Not a shadow.

## Shapes

**Square corners, universally.** `--rounded: 0` is the only radius in the system except `--rounded-chip: 2px` on the tally boxes, where a 2px chip reads as a printed tab stop rather than a UI pill.

This is not a stylistic preference; it is load-bearing against the incumbent. The old design used `--radius-pill` on every button, chip, and tag, which is exactly the language of a web app. A J-card has no rounded corners because it was die-cut from flat stock.

Borders are 1px `--inlay-rule` hairlines. Where a rule separates list rows it is solid; where it separates a group from the next it is doubled, the way a tracklist separates sides.

## Components

### The spine
- **Style:** a 44px sticky row of square tabs, each label-uppercase mono with a mono count.
- **Default:** ballpoint on stock, 1px bottom rule.
- **Active:** spot red fill, stock-coloured text. The only filled tab.
- **Mobile:** horizontal scroll strip, no wrap, with the active tab scrolled into view.

### Track rows (the question list)
- **Corner Style:** 0.
- **Background:** stock, sitting directly on the ruled ground.
- **Border:** 1px inlay-rule bottom, solid. Doubled between the `side a` and `side b` groups.
- **Padding:** 9px 14px, and the mono running time is right-aligned in the margin column.
- **Covered:** inked ballpoint with a spot-red `COVERED` stamp at the right margin.
- **Uncovered:** pencil grey, no stamp. Pencil is not a disabled state; it is a work-in-progress state.
- **Partial:** hatched background using `repeating-linear-gradient` in `--hatch`, plus no stamp. Fill carries this state so it survives greyscale.

### The tally box (coverage counter)
- **Corner Style:** 2px chip.
- **Background:** stock with a 1px inlay-rule border.
- **Content:** the covered count in large mono, the total beside it, and a proportion stated as words as well as a number so it never depends on reading a bar.

### Buttons
- **Shape:** 0 radius.
- **Primary (ink):** ballpoint background, stock text, 9px 18px padding, label type uppercase.
- **Ghost:** stock background, ballpoint text, 1px inlay-rule border.
- **Hover:** background darkens to `--ballpoint-deep`; no translate, no scale, because ink does not move on paper.
- **Active:** `--ballpoint-deep` at reduced opacity.
- **Focus:** 2px spot-red outline with 2px offset, so focus is visible without relying on a colour that also means "covered".
- **Rule:** a button label never wraps. If it would, the label is shortened rather than the button widened artificially.

### Inputs
- **Style:** stock background, 1px inlay-rule border, 0 radius, mono placeholder.
- **Focus:** border becomes ballpoint, plus the 2px spot-red focus ring.
- **Placeholder:** never shorter than the field can show. The incumbent shipped a 184px placeholder into 142px of space; the rule is that a placeholder must fit its field at the narrowest supported width, with the full hint kept in `aria-label` and `title`.

### Side heads
`SIDE A` / `SIDE B` in spot red label type, underlined by a doubled 1px rule. They are the two hard halves of one tape.

## Do's and Don'ts

### Do:
- **Do** set every count, mark value, and page reference in tabular mono, right-aligned against the right margin.
- **Do** encode coverage by fill (solid / hatched / open) before encoding it with colour.
- **Do** keep the ruled ground visible on wide viewports and fade it only below 560px.
- **Do** use spot red for exactly three things: side heads, the active spine tab, and a covered stamp.
- **Do** render uncovered content in pencil grey, so ink means what it says.
- **Do** let the spine scroll horizontally rather than wrap on narrow screens.
- **Do** match the ruled line-height (1.9) to the inlay rule pitch so body text lands on the rules.

### Don't:
- **Don't** use rounded corners anywhere. No pills, no 999px radius, no soft cards.
- **Don't** add a drop shadow. Depth comes from hairlines, filled tabs, and hatching.
- **Don't** introduce a second accent colour. One spot only.
- **Don't** let a placeholder or button label overflow the element that contains it.
- **Don't** encode a state by hue alone. Hatching exists so greyscale keeps the meaning.
- **Don't** use the sans for numerals that represent counts, marks, or pages.
- **Don't** wrap the spine into two lines at desktop width.
- **Don't** invent questions, counts, or percentages for subjects whose content is genuinely absent. An empty `side b` is the honest state.