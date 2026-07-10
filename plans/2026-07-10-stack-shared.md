---
approved: 2026-07-10
---

# One suite: shared API keys + full-stack export/import (HOOKLAB side)

## Goal

Same-suite behavior for the four same-origin apps: an API key saved in any app
works everywhere, and one export/import backs up and restores every app's data.
HOOKLAB stays a focused app; it gains shared-key plumbing and whole-stack
backup, and its ledger-import handler auto-detects the stack format.

## Steps (HOOKLAB)

1. Vendor `stackdata.js` (byte-identical to the other apps). Loads as a classic
   script before the module `app.js` so `window.StackData` is ready first.
2. `index.html`: load `stackdata.js` before the module app; shared-keys hint in
   Settings; stack backup/restore buttons next to the ledger's Export/Import.
3. `app.js`: `loadSettings`/`saveSettings` resolve and write-through shared keys
   (`geminiKey`/`openrouterKey`/`openrouterModel`); save handler clears blank
   keys via `clearSharedKey`; the ledger `importFile` handler detects
   `isStackBackup` and routes to `StackData.importAll` (picking the wrong button
   still works); wire `#stackexport`/`#stackimport`/`#stackfile`.

## Files touched

- `stackdata.js` (new, vendored)
- `index.html`
- `app.js`

## Rollback

Revert the branch. Only the three files change; the shared store is additive and
HOOKLAB keeps its own `hooklab_settings_v1`/`hooklab_state_v1`.

## Verification

Same-origin headless Chromium harness: HOOKLAB resolves a key saved elsewhere;
legacy local key promotes into the shared store; clear propagates; stack
export/import round-trip; format auto-detection routes stack files to the stack
importer and app-only files to the ledger importer. 33 substantive assertions
pass.
