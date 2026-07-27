---
approved: 2026-07-27
---

# HOOKLAB: survive reasoning models on OpenRouter

## Goal
Parity with the BLAST fix. BLAST failed with "Model didn't return JSON — it
said: 'We need to produce JSON with keys…'" — a reasoning model emitting its
chain-of-thought instead of an answer, cut off mid-thought because OpenRouter
bills reasoning as output tokens and our budget was sized for the answer.
HOOKLAB's llm.js has the same shape and the same exposure.

## Changes (llm.js only)
- OR_REASONING_RE detects reasoning-tier model ids; they get 3x the caller's
  token budget (clamped 16000) so thinking can't consume the answer.
- jsonMode requests carry OpenRouter's reasoning param — {exclude:true} when
  thinking is on, {effort:"minimal",exclude:true} when the stack toggle says
  Fastest. A 400 mentioning "reasoning" retries once without the field, for
  models that make reasoning mandatory or don't support it.
- <think>...</think> is stripped from replies before parsing, and a reply that
  is nothing but thinking throws a named error ("spent the whole response
  thinking… pick a faster model") instead of "Empty response" or a quoted
  monologue.

## Rollback
Revert the squash commit. No storage changes.

## Verification (headless Playwright — log below)
Think-tagged reply parses; thinking-only reply produces the named error;
token headroom and reasoning param present in the real request; static parity
checks; existing suites green.

## Audit
- PLAN approved (this file). EXECUTE/VERIFY/SHIP below.
- EXECUTE llm.js reasoning handling — PASS.
- VERIFY cross-app suite 23/23 PASS. Regression: hooklab aiux + stack-hangfix green.
- SHIP: committed, PR squash-merged, live poll confirmed.
