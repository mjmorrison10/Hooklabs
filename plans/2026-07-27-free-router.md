---
approved: 2026-07-27
---

# Free/auto router parity

## Goal
Parity with the BLAST fix. OpenRouter's "Auto: best free model"
(`openrouter/free`) routes each request to whatever free model has capacity,
behind everyone else's free usage — runs queue for minutes and time out. It is
not discontinued; it is just slow, and our dropdown promoted it with a
lightning bolt.

## Changes
- **stackmodels.js** (byte-identical across the three AI apps): relabel to
  "Auto: best free model (slow — can queue for minutes)", no lightning bolt.
- **llm.js**: OR_REASONING_RE also matches `openrouter/(free|auto)` — a router
  can hand the request to a reasoning model, so it gets the same 3x token
  headroom and the same reasoning handling.

Automatic Gemini fallback lives in BLAST only for now (that is where the
multi-platform caption job is).

## Rollback
Revert the squash commit. No storage changes.

## Verification
Covered by the cross-app suite: routers match the headroom regex while
gpt-4o-mini does not, and the dropdown label is honest in all three copies.

## Audit
- PLAN approved (this file). EXECUTE/VERIFY/SHIP below.
- EXECUTE stackmodels relabel + llm.js router regex — PASS.
- VERIFY 29/29 in the fallback suite (includes this app's static parity);
  existing suites green.
- SHIP: committed, PR squash-merged, live poll confirmed.
