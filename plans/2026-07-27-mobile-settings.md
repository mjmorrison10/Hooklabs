---
approved: 2026-07-27
---

# HOOKLAB: settings that are readable on a phone

## Goal
Wave B (stack-wide). Same treatment BLAST got: at 390px the two-option rows
half-wrapped, the explanatory tags were 10px monospace below WCAG AA, pills
were ~36px tall, and 14px inputs triggered iOS zoom-on-focus.

## Changes
- **index.html**: provider and thinking groups become stacked radio CARDS,
  each with a title plus a plain-language description. Same input
  names/values — no JS changes.
- **style.css**: .radiocards (column, full-width); .radiopill min-height 44px
  with an 18px accent radio and an accent border + inset ring when checked;
  .rtitle/.rdesc typography (and the reset that opts card text out of the
  modal's uppercase-monospace label styling); 16px inputs; 88dvh under
  @supports; footer safe-area padding; a 480px breakpoint stacking every
  option group. Uses this app's own accent variable.

## Rollback
Revert the squash commit. Presentation only.

## Verification (headless Playwright at 390x844, iPhone UA)
Cards >=44px, equal full width, title + description, AA contrast with alpha
compositing, inputs >=16px, distinct checked state, tap selects, footer on
screen, no horizontal scroll, sans/sentence-case card text.

## Audit
- PLAN approved (this file). EXECUTE/VERIFY/SHIP below.
- EXECUTE markup + CSS as described — PASS.
- VERIFY: 47/47 across BLAST/RECALL/HOOKLAB plus desktop regression.
- SHIP: committed, PR squash-merged, live poll confirmed.
