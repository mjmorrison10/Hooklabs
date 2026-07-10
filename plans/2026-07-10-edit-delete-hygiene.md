---
approved: 2026-07-10
---

# Data hygiene: HOOKLAB ledger edit + delete confirm

## Goal

Let users fix or remove a ledger entry after a mistake or a test. HOOKLAB had
per-entry Delete but no Edit, and Delete had no confirm.

## Steps (`Hooklabs/`)

1. `app.js` `renderLedger`: add an **Edit** button (`data-edit-entry`) next to
   the existing Delete on each entry card.
2. `app.js`: new `openEntryModalForEdit(entry)` prefills ALL fields (hook,
   pattern, outcome, platform, niche, retention, views, notes, hypothesis,
   hypothesisNote), sets a module-scope `editingEntryId`, and flips the modal
   title/save-button text to "Edit entry"/"Update". `openEntryModal` (add
   path) resets `editingEntryId` and restores the default chrome; closing the
   modal also resets it.
3. `saveEntry` handler: when `editingEntryId` is set, update the entry in place
   — preserve `id`, `createdAt`, and `source` (so a later PULSE re-log still
   matches), stamp `editedAt` — instead of unshifting a new one. Add path is
   unchanged.
4. `data-del-entry` handler: add a `confirm("Delete this ledger entry?
   Insights recalc without it.")`.

All ledger consumers (insights, stats, generation reads) re-read `state.ledger`
live, so edits/deletes need no extra invalidation.

## Files touched

`Hooklabs/app.js`. (Reuses existing modal markup `#entryTitle`/`#saveEntry`.)

## Verification

Headless: two entries seeded (one PULSE-sourced); Edit opens the modal
prefilled, saving updates in place with id/createdAt/source preserved,
`editedAt` stamped, no duplicate; Delete now asks confirm (dismiss keeps,
accept removes). 26/26 hygiene assertions pass; the 40-assertion picker suite
still green.

## Rollback

Revert the branch; `editedAt` is an additive optional field, no format change.
