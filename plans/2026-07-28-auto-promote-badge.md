---
approved: 2026-07-28
---

# HOOKLAB: provenance badge for hooks PULSE promoted on its own

## Goal
PULSE now writes ledger entries by itself when a hook is a statistical
breakout on its platform (see pulse/plans/2026-07-28-auto-promote-hooks.md).
House rule: every entry shows its provenance. An entry that arrived on its own
must not read as one the owner hand-logged, and it must say that PULSE keeps
it in sync — it is refreshed and can disappear when newer posts outperform it.

## Facts
- PULSE auto entries use id namespace `pulseauto_*` and `source: "pulse-auto"`;
  hand-logged PULSE entries are `pulse_*` / `source: "pulse"`.
- `renderLedger()` builds each entry card, leading with the outcome chip.
- Entries reach `state.ledger` through the same localStorage key both apps
  share, and pass through `loadState` unmodified.

## Changes
- `renderLedger()`: entries with `source === "pulse-auto"` get an `AUTO` badge
  next to the outcome chip, titled with what it means — promoted because it
  outperformed the owner's own posts on that platform, kept in sync by PULSE,
  so edits here are overwritten and it disappears once newer posts beat it.
- `style.css`: `.badge.auto` in the brand ghost color, matching the existing
  badge family.

Ledger counting, insights, and win rates are untouched: an auto entry is a
`winner` like any other, which is the point.

## Files
- `Hooklabs/app.js` (renderLedger)
- `Hooklabs/style.css` (.badge.auto)

## Rollback
Revert the commit; the entries stay, only the badge disappears.

## Verification
`pulse-autopromote-verify.mjs` R8 block (badge present on the auto entry,
absent on a hand-logged one, title explains the sync, winner count includes
it) plus a screenshot review, plus `hooklab-aiux-verify.mjs`.

## Audit — 2026-07-28

| Step | Result |
|---|---|
| Auto entry renders an AUTO badge | PASS |
| Hand-logged entry renders no badge | PASS |
| Badge title states that PULSE maintains it | PASS |
| Winner stats count the auto entry | PASS |
| Screenshot review (badge legible beside the WINNER chip, provenance note readable) | PASS |
| `hooklab-aiux-verify.mjs` regression | PASS |
