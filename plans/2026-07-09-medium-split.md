---
approved: 2026-07-09
---

# Medium split — text hooks vs video hooks

## Goal

Separate text-post hooks (X / Threads / LinkedIn) from video hooks
(TikTok / Reels / Shorts / YouTube). Medium is derived from platform — no
toggle, just a ✍️/🎬 indicator. Text-first creators get text-native patterns,
text CTAs, a text-shaped AI prompt, and ledger evidence split by medium.

Decisions (user-approved): medium derived from platform · LinkedIn counts as
text · add a text-native pattern pack (15) rather than only filtering.

## Steps

1. **patterns.js (commit 1)**
   - `P()` factory: `mediums: ["video","text"]` default (most scaffolds read
     fine as written posts). `spoken`/`textOnScreen` are dead fields — left
     untouched, not repurposed (they encode video delivery channels).
   - `PLATFORMS`: `medium` tag per entry; add Threads (text).
   - New exports `MEDIUMS`, `mediumForPlatform()` (unknown/legacy → video;
     old ledger x/linkedin entries derive text at read time — no migration).
   - New `thread` mechanism; ANGLES `tactical` gains family `thread`.
   - 15 text-native patterns (all `mediums: ["text"]`, `market-observed`,
     strengths 0.76–0.87): thread-lessons, how-i-thread, thread-mistakes,
     one-line-contrarian, everyone-is-wrong, list-colon-promise, cheat-sheet,
     nobody-tells-you, read-that-again, open-books, arc-playbook,
     setback-lesson, fill-in-blank, quote-repost-setup, delete-this-later.
   - CTA_PATTERNS: `mediums` on all (save + duet → video-only); 4 new text
     CTAs: reply-take, repost-if, bookmark, quote-take.
   - `mediums: ["video"]` overrides on 8 delivery-dependent patterns:
     mid-action, pov-identity, silent-open, loop-callback, visual-first-claim,
     first-second-script, voiceover-vs-text, demonstration-first.
2. **app.js + index.html (commit 2)**
   - `entryMedium(e)` helper; `familyStats(medium)` optional filter (ledger
     view + bank cards stay unfiltered — intentional cross-medium overviews).
   - `selectPatterns`: hard medium filter before scoring; platformFit stays
     the soft weight within medium.
   - Candidates gain `medium`; hook cards show ✍️/🎬 chip.
   - `buildCtas(topic, goal, medium)`: filter + goal boosts
     (comments→reply-take, saves→bookmark).
   - `underwriteWithAI`: medium-filtered ledger summary + CTA list, `medium`
     in context JSON, dynamic CTA id list, conditional rule 6 (text: written
     to stop the scroll, ≤280 chars on X; video: speakable in ~3s unchanged).
   - `#mediumHint` under platform select, updated on change.
   - `saveEntry` stores `medium`; Threads appears in both platform selects
     automatically via fillSelect(PLATFORMS).
   - New offlineFill slots: done_thing, common_advice, starting_point,
     shock_stat, setback, confession, category.
   - Out of scope: comps stay cross-medium; bank cards don't show mediums.

## Files touched

patterns.js, app.js, index.html, plans/2026-07-09-medium-split.md (new).
Also regenerates recall/topclips-patterns.js (separate repo/PR).

## Rollback

`git revert` the squash commit on main; GitHub Pages redeploys prior build.
Data changes are additive (`mediums`, `medium`) — no ledger migration either way.

## Verification

Headless Playwright: medium hint flips per platform; offline underwrite on x
= all-text chips, no video-only patterns, ≥1 thread card, text CTAs only;
tiktok inverse; medium-split proof (seeded x winner → "Proven for you" only
in text mode); AI prompt via Gemini route stub carries medium + correct
rule 6 + correct CTA ids; ledger save on Threads stores medium:"text";
zero console errors.

## Execution log

- 2026-07-09: patterns.js edits complete; node parse check: 112 patterns,
  15 text-only, 8 video-only, 10 CTAs, thread mechanism present, no dup ids.
- 2026-07-09: app.js/index.html wiring complete. Added one item beyond the
  written plan during verification: a +0.05 medium-native CTA boost in
  buildCtas (without it, both-medium CTAs tied with and outranked text-native
  ones, so text mode never surfaced its own CTAs — cosmetic ranking fix,
  same feature).
- 2026-07-09: Playwright suite 41/41 PASS (medium hint, offline text/video
  filtering, medium-split proof via seeded x winner, AI prompt medium +
  rule 6 + CTA ids both directions, ledger medium save, RECALL snapshot
  compat, zero console errors).
