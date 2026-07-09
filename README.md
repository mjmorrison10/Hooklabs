# HOOKLAB

**Evidence-based hook underwriting for short-form creators.**

Not another AI hook generator. HOOKLAB retrieves proven structures, grounds them in evidence (your winners, market comps, source material), ranks candidates by proof, and learns from outcomes. AI only does the glue.

Creator operations systems — RECALL finds it, **HOOKLAB underwrites the open,** BLAST gets it out the door.

Part of the stack:

- **RECALL** — finds the moment: https://mjmorrisonusa.com/#/recall
- **BLAST** — gets it out the door: https://mjmorrisonusa.com/#/blast
- **Portfolio** — https://mjmorrisonusa.com

## The problem it solves

Creators who want hooks that *work* usually end up with an Excel sheet:

- past openings
- which pattern family
- platform
- 3-second retention
- winner / meh / dead

That sheet is painful to keep updated — and pure AI generators ignore it entirely. They produce snappy lines with no proof trail.

HOOKLAB is that spreadsheet, automated into a workflow:

> **Generate → pick → post → log outcome → re-rank next time**

## What it does today

1. **Pattern bank (tiered)** — curated hook *structures* (scaffolds), not freeform sentences.
   - **Core (~30)** — daily drivers, always preferred in underwriting
   - **Extended (~40+)** — depth / niche / rare weapons behind **See more**
   - **Historical (~25)** — durable mechanisms with documented lineage (e.g. Listerine/halitosis diagnosis marketing, PAS, reason-why, open loops)
   - **Historical instances** — evidence cards (campaigns/traditions), not extra generation noise
   - Search + mechanism filters in the Bank view. We grow by **mechanisms**, not by dumping 1000 lines.
2. **Personal ledger** — log posts with outcome (winner / meh / dead), optional retention & views. This is your proof database.
3. **Market comps** — paste competitor hooks that worked in your niche.
4. **Underwrite (AI or offline)**  
   - **Offline:** fills scaffolds from the bank + ledger weights — no API key.  
   - **AI:** constrained rewrite — one candidate per selected pattern, grounded in your brief/source material, ranked with provenance labels.
5. **Honest badges**
   - **Proven for you** — your ledger says this family wins
   - **Market-proven structure** — known pattern / comps, not yet your data
   - **Hypothesis** — exploratory
   - **Fatigued** — you've overused this family recently
6. **Angles + CTAs** — top angles from the candidate set; CTAs biased by goal (comments, saves, series).
7. **Export / import** — backup your ledger as JSON (the anti-Excel exit ramp).

## Bank philosophy

Hooks change outfits. **Attention mechanisms endure.**

Listerine’s “halitosis” ads would never run the same way today — but *naming an unnamed fear so people must investigate* still powers modern opens every day. HOOKLAB stores that physics (plus proven scaffolds), not a PDF of 1000 one-liners.

## What it deliberately does *not* do

- Invent a fake “92% viral score”
- Claim a hook is proven without ledger evidence
- Auto-post (that’s BLAST’s lane as it becomes a posting command center)
- Replace your judgment — it underwrites candidates; you still pick

## AI provider

**Gemini is the default** — free API key in Settings works for text underwriting. Power users can switch to **OpenRouter** and pick any text model.

Your key is stored only in this browser’s `localStorage` and sent only to the provider you pick — never to a HOOKLAB server, because there isn’t one.

Offline mode needs no key at all.

## Run it

Static site, no build step.

```bash
# from this folder
python3 -m http.server 8080
# open http://localhost:8080
```

Or host on GitHub Pages / Vercel / Netlify.

Opening via `file://` may block ES modules in some browsers — serve over HTTP.

## Stack position

| Product | Job |
|---|---|
| RECALL | Find the moment |
| **HOOKLAB** | Underwrite the open from proof |
| BLAST | Prepare, adapt, package, track, post |

## Roadmap

- Deeper RECALL import (shot list → hook seeds)
- BLAST handoff (“send chosen hook + caption pack”)
- Optional analytics CSV / screenshot import for outcome logging
- Niche pattern packs
- Fatigue / schedule awareness across a content calendar

---

Built by Michael Morrison. Client-side only — your ledger never leaves your device except when you export it or call an AI provider with your own key.
