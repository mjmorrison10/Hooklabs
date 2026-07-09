---
task: 429 resilience + audit fixes (part of RECALL workflow sweep)
date: 2026-07-09
approved: 2026-07-09
---

# HOOKLAB — provider resilience + audit fixes

## Goal

Part of a cross-app sweep triggered by RECALL's Top Clips failing with Gemini
429s and a stale "no HOOKLAB ledger" message. HOOKLAB shares RECALL's provider
layer and is the source of the ledger RECALL reads, so it gets the same
hardening plus fixes for real bugs found in an audit.

## Changes

### llm.js — rate-limit resilience + current model
- Added `fetchWithRetry()` (retry on HTTP 429, up to 3 attempts, 4s/12s backoff,
  honoring Google's `RetryInfo` delay, capped at 20s), wrapped around every
  `generateContent` call, the Files upload-start, and both OpenRouter calls.
- Upgraded Gemini endpoint `gemini-2.0-flash` → `gemini-2.5-flash`.
- Map OpenRouter 404 / "no endpoints found" to an actionable message.

### app.js — ledger detection + audit fixes
- `onReady()` now persists `hooklab_state_v1` on first open (guarded), so RECALL
  can truthfully detect that HOOKLAB has been opened on this device. Previously
  the key only appeared after saving a ledger/comp entry.
- **Guarded `saveState()` / `saveSettings()`** in try/catch with a toast — an
  uncaught `QuotaExceededError` (Safari private mode, full store) used to leave
  the save modal stuck and silently lose the entry/key. (audit finding #1)
- **AI misattribution fix:** when the AI returns a `patternId` not in the
  selected set and not matchable by name, the hook is now dropped instead of
  being attached to `selected[0]` — which had shown it with provenance
  (win-rate, "proven" badge) it never earned. The offline fill pass supplies a
  correctly-labeled hook for the empty slot. (audit finding #2)
- **Import normalization:** imported ledger entries are sanitized through
  `normalizeLedgerImport()` — entries without a `hook` are dropped, missing
  `id`s are assigned. An id-less entry previously rendered an empty delete
  target, so clicking Delete on it wiped every entry that *did* have an id.
  Comps without a hook are dropped and get ids too. (audit finding #3)
- **Clipboard guard:** copy handler checks `navigator.clipboard` exists before
  use (insecure context / old WebView would throw past the `.catch`).

## Not changed (flagged)
- Cross-origin ledger sharing with RECALL only works when both apps are served
  from the same origin (localStorage is origin-scoped). RECALL's Top Clips copy
  now tells the user to open the full HOOKLAB app and notes the embedded demo
  uses separate storage.
- AI `MAX_TOKENS` truncation still fails the whole batch rather than salvaging a
  partial array — left as-is (behavior tradeoff, not a clear bug).

## Verification (headless Chromium, stubbed network) — PASS
- App loads with no page errors; llm.js on gemini-2.5-flash with `fetchWithRetry`.
- `hooklab_state_v1` written on first open.
- Import of a mixed file: junk (no hook) dropped, id-less entry gets an id,
  deleting that entry leaves the others intact (no mass wipe).

## Rollback
Revert this branch; changes confined to `llm.js`, `app.js`, `index.html`.
