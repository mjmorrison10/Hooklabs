---
task: Mechanism hypothesis + ledger insights
date: 2026-07-10
approved: 2026-07-10
---

# HOOKLAB: mechanism hypothesis + insights

- Ledger entry modal: "Why do you think this worked?" select populated from the
  existing MECHANISMS taxonomy, plus an optional free-text note. Stored as
  `hypothesis` / `hypothesisNote` (import normalization passes them through).
- Ledger cards show the mechanism as a tag; the note shows under the entry.
- Insights panel above the ledger: win-rate tables grouped by mechanism, family,
  and platform. Shown ONLY for groups with >=3 entries, always with n=, honoring
  the "never show a fake percentage" product principle.

Verified in the shared same-origin harness (hypothesis saved/rendered; insights
only at n>=3; PULSE-written entries appear here).
