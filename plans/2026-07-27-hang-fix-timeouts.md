---
approved: 2026-07-27
---

# HOOKLAB: full-request deadlines (the same latent hang BLAST hit)

## Goal
Wave A leg 3 of 3. HOOKLAB's llm.js was byte-identical to BLAST's (bar the
X-Title header), so it carried the identical latent bug: the deadline covered
only time-to-headers, and a provider that answers with headers then holds the
connection open during generation never trips the abort — the underwrite
button hangs with no error.

## Changes
- **llm.js**: adopt BLAST's fixed file verbatim (verified byte-identical
  beforehand apart from the X-Title line, which is restored to "HOOKLAB"):
  `fetchBodyWithTimeout` reading the body inside the abort window,
  `{res, bodyText}` threaded through `fetchWithRetry`, `OP_BUDGET_MS` ceiling,
  extractors taking `partialOnTruncate`.
- **stackmodels.js**: shared-file parity with BLAST's `pickFastDefault`.

## Rollback
Revert the squash commit. No storage changes.

## Verification (headless Playwright — log below)
Stalled-body stub + fake clock → #genError shows "timed out after 180s",
underwrite button re-enabled. Static: no unbounded reads left, OP_BUDGET_MS
present, X-Title still HOOKLAB, stackmodels byte-identical across apps.
Existing hooklab suite green.

## Audit
- PLAN approved (this file). EXECUTE/VERIFY/SHIP below.
- EXECUTE llm.js port (X-Title restored, parity with BLAST confirmed by diff)
  + stackmodels.js — PASS.
- VERIFY new cross-app suite 18/18 PASS (HOOKLAB legs: timeout surfaced,
  button recovered, zero page errors; static checks clean). Regression:
  hooklab-aiux green after updating 1 stale helper-name assertion.
- SHIP: committed on claude/handoff-doctrine-fable-opus-5bs5cv, PR
  squash-merged, live poll confirmed on Pages.
