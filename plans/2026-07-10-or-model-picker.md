---
approved: 2026-07-10
---

# OpenRouter model dropdown: live list + pricing + arena.ai ranking (HOOKLAB side)

## Goal

Replace HOOKLAB's free-text OpenRouter "Model" box with a live, priced,
arena.ai-ranked dropdown. Note Gemini's free-tier behavior in the Gemini block.

## Steps (HOOKLAB)

1. Vendor `stackmodels.js` (byte-identical across recall/Hooklabs/blast;
   exposes `window.StackModels`; fetches OpenRouter's public models API, caches
   24h, ranks the top group from an arena.ai snapshot, formats FREE / $-per-1M
   labels). See recall's plan for the module's full shape.
2. `index.html`: in `#openrouterBlock`, add `<select id="openrouterModelSelect">`
   above `#openrouterModel` (drop its hardcoded `value` attr; the input is now
   the hidden value carrier); ranked/pricing hint; Gemini free-tier note in
   `#geminiBlock`; load `stackmodels.js` after stacknav.js. (Global `select`
   CSS already exists.)
3. `app.js`: in `openSettings()` after setting `#openrouterModel`, call
   `window.StackModels.populate(#openrouterModelSelect, #openrouterModel)`. Save
   handler (`#saveSettings`) unchanged (still reads `#openrouterModel`).

## Files touched

`stackmodels.js` (new), `index.html`, `app.js`. No `llm.js` change.

## Verification

Same-origin headless Chromium with the OpenRouter models endpoint intercepted:
dropdown visible on OpenRouter, optgroups present, top ranked = claude-fable,
FREE labels, image models excluded, selecting sets the hidden input, Custom
reveals it, plus a cross-app check that a model saved in RECALL shows up in
HOOKLAB's dropdown. 40/40 assertions pass.

## Rollback

Revert the branch; additive module, settings format unchanged.
