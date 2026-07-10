// === HOOKLAB app.js ===
// Evidence-based hook underwriting. AI fills slots; proof ranks candidates.

import { generateText } from "./llm.js";
import {
    PATTERNS, ANGLES, CTA_PATTERNS, NICHES, PLATFORMS, OUTCOMES,
    HISTORICAL_INSTANCES, EVIDENCE_LABELS, TIER_LABELS, MECHANISMS, countByTier,
    MEDIUMS, mediumForPlatform
  } from "./patterns.js";

(function () {
  "use strict";

  var LS_SETTINGS = "hooklab_settings_v1";
  var LS_STATE = "hooklab_state_v1";
  var LS_THEME = "hooklab_theme";

  var state = {
    ledger: [],      // personal proof entries
    comps: [],       // market comps
    lastResults: null,
    selectedAngles: [],
    bank: {
      showMore: false,
      query: "",
      tier: "all",       // all | core | extended | historical | instances
      mechanism: "all"
    }
  };

  var settings = {
    provider: "gemini",
    geminiKey: "",
    openrouterKey: "",
    openrouterModel: "openai/gpt-4o-mini",
    brandVoice: ""
  };

  // ---------- storage ----------
  function loadSettings() {
    try {
      var raw = localStorage.getItem(LS_SETTINGS);
      if (raw) Object.assign(settings, JSON.parse(raw));
    } catch (e) {}
    // Keys are shared across the stack: shared store wins; a legacy local key is
    // promoted into the shared store on first read.
    if (window.StackData) {
      var merged = window.StackData.resolveKeys(settings, ["geminiKey", "openrouterKey", "openrouterModel"]);
      settings.geminiKey = merged.geminiKey || "";
      settings.openrouterKey = merged.openrouterKey || "";
      if (merged.openrouterModel) settings.openrouterModel = merged.openrouterModel;
    }
  }
  function saveSettings() {
    // Guard the write: a full/blocked store (Safari private mode, quota) would
    // otherwise throw uncaught and silently drop the just-entered API key.
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
      if (window.StackData) window.StackData.writeSharedKeys({
        geminiKey: settings.geminiKey, openrouterKey: settings.openrouterKey, openrouterModel: settings.openrouterModel,
      });
      return true;
    } catch (e) {
      toast("Couldn't save settings — storage full or blocked");
      return false;
    }
  }
  // Sanitize ledger entries coming from an imported JSON file: every entry must
  // have a `hook` string and an `id` (so Delete targets it individually rather
  // than matching the empty-id bucket). Objects without a hook are discarded.
  function normalizeLedgerImport(arr) {
    return (arr || []).filter(function (e) {
      return e && typeof e.hook === "string" && e.hook.trim();
    }).map(function (e) {
      if (!e.id) e.id = uid();
      return e;
    });
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(LS_STATE);
      if (raw) {
        var parsed = JSON.parse(raw);
        state.ledger = parsed.ledger || [];
        state.comps = parsed.comps || [];
      }
    } catch (e) {}
  }
  function saveState() {
    // Guard the write (see saveSettings): an uncaught throw here used to leave
    // the save modal stuck open with the ledger entry only in memory, lost on
    // reload — and tempted the user into pushing duplicates by retrying.
    try {
      localStorage.setItem(LS_STATE, JSON.stringify({
        ledger: state.ledger,
        comps: state.comps
      }));
      return true;
    } catch (e) {
      toast("Couldn't save — storage full or blocked");
      return false;
    }
  }

  // ---------- theme ----------
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  function cycleTheme() {
    var cur = document.documentElement.getAttribute("data-theme");
    var next = cur === "dark" ? "light" : cur === "light" ? "" : "dark";
    if (next) localStorage.setItem(LS_THEME, next);
    else localStorage.removeItem(LS_THEME);
    applyTheme(next);
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }

  // ---------- helpers ----------
  function uid() {
    return "id_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function fillSelect(el, items, valueKey, labelKey) {
    el.innerHTML = items.map(function (it) {
      return '<option value="' + esc(it[valueKey]) + '">' + esc(it[labelKey]) + "</option>";
    }).join("");
  }
  function patternById(id) {
    for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i].id === id) return PATTERNS[i];
    return null;
  }
  function entryMedium(e) {
    return e.medium || mediumForPlatform(e.platform);
  }
  function familyStats(medium) {
    // { family: { wins, total, recentHooks: [] } } — optionally split by medium
    var map = {};
    state.ledger.forEach(function (e) {
      if (medium && entryMedium(e) !== medium) return;
      var fam = e.family || "unknown";
      if (!map[fam]) map[fam] = { wins: 0, total: 0, recentHooks: [], scoreSum: 0 };
      map[fam].total++;
      var oc = OUTCOMES.find(function (o) { return o.id === e.outcome; });
      var sc = oc ? oc.score : 0.45;
      map[fam].scoreSum += sc;
      if (e.outcome === "winner") map[fam].wins++;
      if (map[fam].recentHooks.length < 8) map[fam].recentHooks.push(e.hook);
    });
    return map;
  }
  function recentHookTexts(limit) {
    return state.ledger.slice(0, limit || 12).map(function (e) { return e.hook; });
  }
  function jaccard(a, b) {
    var ta = new Set(String(a).toLowerCase().split(/\W+/).filter(Boolean));
    var tb = new Set(String(b).toLowerCase().split(/\W+/).filter(Boolean));
    if (!ta.size || !tb.size) return 0;
    var inter = 0;
    ta.forEach(function (t) { if (tb.has(t)) inter++; });
    return inter / (ta.size + tb.size - inter);
  }
  function fatigueScore(patternId, family) {
    var recent = state.ledger.slice(0, 10);
    var hits = recent.filter(function (e) {
      return e.patternId === patternId || e.family === family;
    }).length;
    if (hits >= 3) return 1;      // fatigued
    if (hits === 2) return 0.55;
    if (hits === 1) return 0.25;
    return 0;
  }
  function specificityScore(text) {
    var s = 0;
    if (/\d/.test(text)) s += 0.35;
    if (/\b(I|my|we)\b/i.test(text)) s += 0.15;
    if (text.split(/\s+/).length <= 16) s += 0.15;
    if (/[?]/.test(text)) s += 0.1;
    if (!/\b(amazing|incredible|game[- ]?changer|unlock|revolutionary)\b/i.test(text)) s += 0.15;
    return Math.min(1, s);
  }

  // ---------- ranking / underwriting core ----------
  function tierBoost(tier) {
    if (tier === "core") return 0.12;
    if (tier === "historical") return 0.06;
    if (tier === "extended") return 0.0;
    return 0;
  }

  function selectPatterns(niche, platform, angleIds, opts) {
    opts = opts || {};
    var preferCore = opts.preferCore !== false;
    var poolLimit = opts.poolLimit || 20;
    var allowedFamilies = null;
    if (angleIds && angleIds.length) {
      allowedFamilies = {};
      ANGLES.forEach(function (a) {
        if (angleIds.indexOf(a.id) >= 0) {
          a.patternFamilies.forEach(function (f) { allowedFamilies[f] = true; });
        }
      });
    }
    var medium = mediumForPlatform(platform);
    var stats = familyStats(medium);
    var pool = PATTERNS.filter(function (p) {
      return (p.mediums || ["video", "text"]).indexOf(medium) >= 0; // hard medium filter
    });
    var scored = pool.map(function (p) {
      var nicheFit = (!p.niches || p.niches.indexOf(niche) >= 0 || p.niches.indexOf("general") >= 0) ? 1 : 0.35;
      var platformFit = (!p.platforms || p.platforms.indexOf(platform) >= 0) ? 1 : 0.5;
      var angleFit = !allowedFamilies || allowedFamilies[p.family] || allowedFamilies[p.mechanism] ? 1 : 0.15;
      var fam = stats[p.family] || stats[p.mechanism];
      var personal = 0.5;
      var winRate = null;
      if (fam && fam.total > 0) {
        winRate = fam.wins / fam.total;
        personal = fam.scoreSum / fam.total;
      }
      var fatigue = fatigueScore(p.id, p.family);
      var histBonus = p.evidence === "historically-documented" ? 0.04 : 0;
      var score =
        p.strength * 0.26 +
        personal * 0.32 +
        nicheFit * 0.12 +
        platformFit * 0.09 +
        angleFit * 0.12 +
        (preferCore ? tierBoost(p.tier) : 0) +
        histBonus -
        fatigue * 0.35;
      // Soft-penalize extended so core dominates unless angle/niche demands depth
      if (preferCore && p.tier === "extended") score -= 0.04;
      return { pattern: p, score: score, winRate: winRate, fatigue: fatigue, personal: personal };
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    // Prefer core first: take strong core, then fill with extended/historical for coverage
    var picked = [];
    var familyCount = {};
    var tierCount = { core: 0, extended: 0, historical: 0 };

    function tryPick(item, maxPerFamily, maxTier) {
      var famName = item.pattern.family;
      var tier = item.pattern.tier || "core";
      familyCount[famName] = familyCount[famName] || 0;
      if (familyCount[famName] >= maxPerFamily) return false;
      if (maxTier != null && tierCount[tier] >= maxTier) return false;
      familyCount[famName]++;
      tierCount[tier] = (tierCount[tier] || 0) + 1;
      picked.push(item);
      return true;
    }

    // Pass 1: core (up to ~12, max 2 per family)
    for (var i = 0; i < scored.length && tierCount.core < 12; i++) {
      if (scored[i].pattern.tier === "core") tryPick(scored[i], 2, 12);
    }
    // Pass 2: historical mechanisms (up to 4) — high-signal depth
    for (var h = 0; h < scored.length && tierCount.historical < 4 && picked.length < poolLimit; h++) {
      if (scored[h].pattern.tier === "historical") tryPick(scored[h], 2, 4);
    }
    // Pass 3: extended fill
    for (var e = 0; e < scored.length && picked.length < poolLimit; e++) {
      if (scored[e].pattern.tier === "extended") tryPick(scored[e], 2, 8);
    }
    // Pass 4: anything remaining for coverage
    if (picked.length < Math.min(12, poolLimit)) {
      for (var j = 0; j < scored.length && picked.length < poolLimit; j++) {
        if (picked.indexOf(scored[j]) < 0) tryPick(scored[j], 3, 99);
      }
    }
    picked.sort(function (a, b) { return b.score - a.score; });
    return picked;
  }

  function offlineFill(pattern, topic) {
    // Cheap deterministic fill when no AI — still uses the structure.
    var t = (topic || "this").trim();
    var short = t.length > 80 ? t.slice(0, 77) + "…" : t;
    var text = pattern.scaffold
      .replace(/\{topic\}/g, short)
      .replace(/\{thing\}/g, short)
      .replace(/\{bad_habit\}/g, "guessing your hooks")
      .replace(/\{better\}/g, "underwriting them from proof")
      .replace(/\{mistake\}/g, "posting without logging outcomes")
      .replace(/\{n\}/g, "3")
      .replace(/\{pain\}/g, "editing time")
      .replace(/\{industry\}/g, "creator")
      .replace(/\{goal\}/g, "want real growth")
      .replace(/\{before\}/g, "random AI hooks")
      .replace(/\{after\}/g, "a ledger that ranks by proof")
      .replace(/\{claim\}/g, short)
      .replace(/\{audience\}/g, "creators")
      .replace(/\{old_way\}/g, "wing every open")
      .replace(/\{turning_point\}/g, "started tracking winners")
      .replace(/\{cost\}/g, "weeks of dead posts")
      .replace(/\{things\}/g, "hook structures")
      .replace(/\{action\}/g, "write an open")
      .replace(/\{timeframe\}/g, "30 days")
      .replace(/\{start\}/g, "guesswork")
      .replace(/\{end\}/g, "a personal hook system")
      .replace(/\{product_type\}/g, "another AI writer")
      .replace(/\{problem\}/g, "weak retention")
      .replace(/\{identity\}/g, "creator")
      .replace(/\{win\}/g, "stops the scroll on purpose")
      .replace(/\{line\}/g, short)
      .replace(/\{event\}/g, "posting session")
      .replace(/\{myth\}/g, "AI hooks are enough")
      .replace(/\{reality\}/g, "proof is the product")
      .replace(/\{process\}/g, "a clip actually goes viral")
      .replace(/\{domain\}/g, "short-form")
      .replace(/\{a\}/g, "proof")
      .replace(/\{b\}/g, "vibes")
      .replace(/\{duration\}/g, "30 days")
      .replace(/\{insult\}/g, "lazy")
      .replace(/\{system_problem\}/g, "hook system problem")
      .replace(/\{vague\}/g, "a discipline issue")
      .replace(/\{named_diagnosis\}/g, "hook rot")
      .replace(/\{named_problem\}/g, "silent content disease")
      .replace(/\{odd_n\}/g, "7")
      .replace(/\{fantasy\}/g, "go viral overnight")
      .replace(/\{real_outcome\}/g, "stop guessing your opens")
      .replace(/\{expert_type\}/g, "guru")
      .replace(/\{advice\}/g, "post more")
      .replace(/\{time_a\}/g, "year one")
      .replace(/\{time_b\}/g, "year three")
      .replace(/\{low\}/g, "was guessing")
      .replace(/\{high\}/g, "had a ledger")
      .replace(/\{gatekeepers\}/g, "course sellers")
      .replace(/\{minutes\}/g, "5")
      .replace(/\{enemy_system\}/g, "the template industrial complex")
      .replace(/\{receipt_type\}/g, "retention graph")
      .replace(/\{narrow_identity\}/g, "podcast clippers")
      .replace(/\{asset\}/g, "hook checklist")
      .replace(/\{use_case\}/g, "your next short")
      .replace(/\{role\}/g, "creator")
      .replace(/\{counterintuitive_step\}/g, "log dead posts on purpose")
      .replace(/\{metric\}/g, "3s retention")
      .replace(/\{trap\}/g, "start with context")
      .replace(/\{trend\}/g, "AI captions")
      .replace(/\{visual_shock\}/g, "show the dead retention graph")
      .replace(/\{option_a\}/g, "proof")
      .replace(/\{option_b\}/g, "vibes")
      .replace(/\{stack_type\}/g, "hook underwriting")
      .replace(/\{tool\}/g, "caption")
      .replace(/\{spoken\}/g, short)
      .replace(/\{text\}/g, "STOP scrolling")
      .replace(/\{deadline\}/g, "Friday")
      .replace(/\{consequence\}/g, "another week of dead opens")
      .replace(/\{subject\}/g, "one creator")
      .replace(/\{result\}/g, "2x retention")
      .replace(/\{agitation\}/g, "the algorithm learning to bury you")
      .replace(/\{mechanism_name\}/g, "proof-ranked opens")
      .replace(/\{specific_reason\}/g, "your ledger shows winners share one structure")
      .replace(/\{objection\}/g, "AI hooks are fine")
      .replace(/\{bridge\}/g, "logging outcomes")
      .replace(/\{ultra_specific_person\}/g, "short-form creator tired of guessing")
      .replace(/\{odd_fact\}/g, "logging losers")
      .replace(/\{sacrifice\}/g, "posting 5x a day")
      .replace(/\{quote\}/g, "I finally stopped guessing")
      .replace(/\{person\}/g, "a client")
      .replace(/\{reframe\}/g, "your weak open is a systems problem")
      .replace(/\{desirable_outcome\}/g, "write hooks that hold")
      .replace(/\{common_pain\}/g, "sounding like ChatGPT")
      .replace(/\{small_mistake\}/g, "skip the ledger")
      .replace(/\{worse\}/g, "repeat dead patterns")
      .replace(/\{catastrophe\}/g, "burn the niche")
      .replace(/\{jargon\}/g, "3-second retention")
      .replace(/\{challenge\}/g, "logging every open")
      .replace(/\{blunt_truth\}/g, "your hook is forgettable")
      .replace(/\{setting\}/g, "2am after another dead post")
      .replace(/\{insight\}/g, "structures beat vibes")
      .replace(/\{development\}/g, "proof-based underwriting")
      .replace(/\{enemy\}/g, "the course industry")
      .replace(/\{payoff\}/g, "the structure behind winners")
      .replace(/\{tiny_change\}/g, "one logged outcome")
      .replace(/\{big_effort\}/g, "another 20 AI rewrites")
      .replace(/\{small_niche\}/g, "tight niche")
      .replace(/\{high_intent\}/g, "high intent")
      .replace(/\{big_audience\}/g, "empty reach")
      .replace(/\{done_thing\}/g, "building this for 3 years")
      .replace(/\{common_advice\}/g, "post more")
      .replace(/\{starting_point\}/g, "day one")
      .replace(/\{shock_stat\}/g, "90% of hooks die in the first second")
      .replace(/\{setback\}/g, "a dead launch")
      .replace(/\{confession\}/g, "most of my winners were logged, not guessed")
      .replace(/\{category\}/g, "creator habit")
      .replace(/\{stack_type\}/g, "creator ops");
    // leftover {slots}
    text = text.replace(/\{[^}]+\}/g, function (m) {
      return short;
    });
    return text;
  }

  function statusFor(item) {
    if (item.fatigue >= 1) return "fatigued";
    if (item.winRate != null && item.winRate >= 0.5 && item.personal >= 0.6) return "proven";
    if (item.winRate != null && item.personal >= 0.45) return "market"; // personal signal but mixed
    // market structure default
    if (item.pattern && item.pattern.strength >= 0.8) return "market";
    return "hypo";
  }

  function badgeHtml(status) {
    var map = {
      proven: ['proven', 'Proven for you'],
      market: ['market', 'Market-proven structure'],
      hypo: ['hypo', 'Hypothesis'],
      fatigued: ['fatigued', 'Fatigued']
    };
    var m = map[status] || map.hypo;
    return '<span class="badge ' + m[0] + '">' + m[1] + "</span>";
  }

  function evidenceLine(item, topic) {
    var parts = [];
    if (item.winRate != null) {
      parts.push("Personal win rate on this family: " + Math.round(item.winRate * 100) + "% across ledger entries.");
    } else {
      parts.push("No personal history yet for this family — ranked as market structure.");
    }
    if (item.compMatch) {
      parts.push("Similar to market comp: “" + item.compMatch + "”.");
    }
    if (item.grounding) {
      parts.push("Grounded in your brief/source: " + item.grounding);
    } else if (topic) {
      parts.push("Tied to topic brief.");
    }
    if (item.fatigue >= 1) parts.push("You've used this family heavily in recent posts — fatigue risk.");
    parts.push("Pattern why: " + item.pattern.why);
    return parts.join(" ");
  }

  function buildCandidatesOffline(topic, niche, platform, angleIds) {
    var selected = selectPatterns(niche, platform, angleIds);
    var comps = state.comps.filter(function (c) {
      return !c.niche || c.niche === niche || c.niche === "general";
    });
    var medium = mediumForPlatform(platform);
    var candidates = selected.map(function (item, idx) {
      var text = offlineFill(item.pattern, topic);
      var bestComp = null;
      var bestSim = 0;
      comps.forEach(function (c) {
        var sim = jaccard(text, c.hook);
        if (sim > bestSim) { bestSim = sim; bestComp = c.hook; }
      });
      var spec = specificityScore(text);
      var finalScore = item.score * 0.75 + spec * 0.2 + Math.min(bestSim, 0.4) * 0.2;
      return {
        id: uid(),
        text: text,
        pattern: item.pattern,
        medium: medium,
        score: finalScore,
        winRate: item.winRate,
        personal: item.personal,
        fatigue: item.fatigue,
        compMatch: bestSim > 0.15 ? bestComp : null,
        grounding: topic ? "topic brief" : null,
        status: statusFor(item),
        mode: "offline"
      };
    });
    candidates.sort(function (a, b) { return b.score - a.score; });
    // re-status after sort using same item fields
    candidates.forEach(function (c) {
      c.status = c.fatigue >= 1 ? "fatigued"
        : (c.winRate != null && c.winRate >= 0.5 && c.personal >= 0.6) ? "proven"
        : (c.pattern.strength >= 0.8 || c.compMatch) ? "market"
        : "hypo";
    });
    return candidates.slice(0, 20);
  }

  function buildAngles(candidates) {
    return ANGLES.map(function (a) {
      var related = candidates.filter(function (c) {
        return a.patternFamilies.indexOf(c.pattern.family) >= 0;
      });
      var top = related[0];
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        sample: top ? top.text : null,
        count: related.length,
        score: related.reduce(function (s, c) { return s + c.score; }, 0) / (related.length || 1)
      };
    }).sort(function (x, y) { return y.score - x.score; }).slice(0, 5);
  }

  function buildCtas(topic, goal, medium) {
    var stats = familyStats(medium);
    var list = CTA_PATTERNS.filter(function (c) {
      return !medium || (c.mediums || ["video", "text"]).indexOf(medium) >= 0;
    }).map(function (c) {
      var text = offlineFill({ scaffold: c.scaffold, why: c.why }, topic);
      // light personal boost if engagement-ish ledger exists
      var boost = (stats.engagement && stats.engagement.total) ? stats.engagement.scoreSum / stats.engagement.total : 0.5;
      return {
        id: c.id,
        name: c.name,
        text: text,
        why: c.why,
        score: 0.5 + boost * 0.3 + (goal === "comments" && (c.id === "question" || c.id === "disagree" || c.id === "reply-take") ? 0.15 : 0)
          + (goal === "saves" && (c.id === "save" || c.id === "bookmark") ? 0.2 : 0)
          + (goal === "series" && c.id === "follow-series" ? 0.2 : 0)
          // medium-native CTAs edge out generic ones within their medium
          + (medium && c.mediums && c.mediums.length === 1 && c.mediums[0] === medium ? 0.05 : 0)
      };
    });
    list.sort(function (a, b) { return b.score - a.score; });
    return list.slice(0, 3);
  }

  async function underwriteWithAI(topic, sourceMaterial, niche, platform, goal, angleIds) {
    var medium = mediumForPlatform(platform);
    var selected = selectPatterns(niche, platform, angleIds).slice(0, 14);
    var ctaList = CTA_PATTERNS.filter(function (c) {
      return (c.mediums || ["video", "text"]).indexOf(medium) >= 0;
    });
    var ledgerSummary = state.ledger.filter(function (e) {
      return entryMedium(e) === medium;
    }).slice(0, 15).map(function (e) {
      return {
        hook: e.hook,
        outcome: e.outcome,
        family: e.family,
        platform: e.platform,
        medium: entryMedium(e)
      };
    });
    var comps = state.comps.slice(0, 12).map(function (c) {
      return { hook: c.hook, niche: c.niche, notes: c.notes };
    });

    var patternPayload = selected.map(function (s) {
      return {
        id: s.pattern.id,
        name: s.pattern.name,
        family: s.pattern.family,
        scaffold: s.pattern.scaffold,
        why: s.pattern.why,
        personalWinRate: s.winRate,
        fatigue: s.fatigue
      };
    });

    var rule6 = medium === "text"
      ? "6. Written to stop the scroll, not to be spoken: strong first line, line breaks allowed, no filler. When platform is x, the hook must fit a single X post (≤280 characters).\n"
      : "6. Keep hooks speakable in under ~3 seconds when possible.\n";

    var prompt =
      "You are HOOKLAB, an evidence-based hook underwriting engine for short-form creators.\n" +
      "You do NOT invent freeform viral hooks. You fill proven scaffolds with grounded specifics.\n" +
      "Rules:\n" +
      "1. Use ONLY the patterns provided. One candidate per pattern id.\n" +
      "2. Ground wording in the topic and source material. Prefer concrete nouns, numbers, stakes.\n" +
      "3. Respect brand voice notes if present.\n" +
      "4. Never invent fake statistics or claim a hook is proven unless ledger data supports it.\n" +
      "5. Avoid clichés: game-changer, unlock, revolutionary, incredible, amazing.\n" +
      rule6 +
      "7. Return strict JSON only.\n\n" +
      "Context:\n" +
      JSON.stringify({
        topic: topic,
        sourceMaterial: (sourceMaterial || "").slice(0, 2500),
        niche: niche,
        platform: platform,
        medium: medium,
        goal: goal,
        brandVoice: settings.brandVoice || "",
        patterns: patternPayload,
        personalLedgerSample: ledgerSummary,
        marketComps: comps,
        note: "Prefer core-tier patterns for daily drivers. Historical patterns are durable mechanisms (e.g. diagnosis/halitosis lineage) — use when they fit. Extended is depth."
      }, null, 2) +
      "\n\nReturn JSON shape:\n" +
      "{\n  \"hooks\": [\n    {\n      \"patternId\": \"...\",\n      \"text\": \"final hook line\",\n      \"grounding\": \"short note on what evidence/source it used\",\n      \"angle\": \"myth-bust|teardown|proof|story|tactical\"\n    }\n  ],\n  \"ctas\": [\n    { \"id\": \"" + ctaList.map(function (c) { return c.id; }).join("|") + "\", \"text\": \"...\" }\n  ]\n}\n" +
      "Generate one hook per provided pattern. Generate exactly 3 CTAs.";

    var raw = await generateText({
      provider: settings.provider,
      geminiKey: settings.geminiKey,
      openrouterKey: settings.openrouterKey,
      openrouterModel: settings.openrouterModel
    }, {
      prompt: prompt,
      temperature: 0.55,
      jsonMode: true,
      maxTokens: 4096
    });

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // try extract JSON blob
      var m = String(raw).match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned non-JSON. Try again.");
      parsed = JSON.parse(m[0]);
    }

    var byId = {};
    selected.forEach(function (s) { byId[s.pattern.id] = s; });

    var candidates = (parsed.hooks || []).map(function (h) {
      var item = byId[h.patternId];
      if (!item) {
        // Try matching by name, but DON'T fall back to selected[0]: attaching a
        // hook to an arbitrary pattern would show it with provenance (win-rate,
        // "proven" badge, evidence) it never earned — violating the core rule
        // that every candidate's provenance is real. Drop it instead; the
        // offline fill pass below supplies a correctly-labeled hook for any
        // pattern slot this leaves empty.
        item = selected.find(function (s) { return s.pattern.name === h.patternId; });
      }
      if (!item) return null;
      var text = (h.text || "").trim() || offlineFill(item.pattern, topic);
      var bestComp = null;
      var bestSim = 0;
      state.comps.forEach(function (c) {
        var sim = jaccard(text, c.hook);
        if (sim > bestSim) { bestSim = sim; bestComp = c.hook; }
      });
      var spec = specificityScore(text);
      var finalScore = item.score * 0.7 + spec * 0.25 + Math.min(bestSim, 0.4) * 0.15;
      return {
        id: uid(),
        text: text,
        pattern: item.pattern,
        medium: medium,
        score: finalScore,
        winRate: item.winRate,
        personal: item.personal,
        fatigue: item.fatigue,
        compMatch: bestSim > 0.15 ? bestComp : null,
        grounding: h.grounding || (sourceMaterial ? "source material" : "topic brief"),
        status: item.fatigue >= 1 ? "fatigued"
          : (item.winRate != null && item.winRate >= 0.5 && item.personal >= 0.6) ? "proven"
          : (item.pattern.strength >= 0.8 || bestSim > 0.15) ? "market"
          : "hypo",
        mode: "ai",
        angle: h.angle || null
      };
    }).filter(Boolean);

    // ensure diversity / fill missing patterns offline
    var have = {};
    candidates.forEach(function (c) { have[c.pattern.id] = true; });
    selected.forEach(function (item) {
      if (!have[item.pattern.id]) {
        var text = offlineFill(item.pattern, topic);
        candidates.push({
          id: uid(),
          text: text,
          pattern: item.pattern,
          medium: medium,
          score: item.score * 0.7,
          winRate: item.winRate,
          personal: item.personal,
          fatigue: item.fatigue,
          compMatch: null,
          grounding: "scaffold fill (AI missed this pattern)",
          status: statusFor(item),
          mode: "offline-fallback"
        });
      }
    });

    candidates.sort(function (a, b) { return b.score - a.score; });
    candidates = candidates.slice(0, 20);

    var ctas;
    if (parsed.ctas && parsed.ctas.length) {
      ctas = parsed.ctas.slice(0, 3).map(function (c) {
        var base = ctaList.find(function (x) { return x.id === c.id; }) || ctaList[0];
        return {
          id: base.id,
          name: base.name,
          text: c.text || offlineFill({ scaffold: base.scaffold }, topic),
          why: base.why,
          score: 0.7
        };
      });
    } else {
      ctas = buildCtas(topic, goal, medium);
    }

    return {
      hooks: candidates,
      angles: buildAngles(candidates),
      ctas: ctas
    };
  }

  // ---------- render ----------
  function setView(name) {
    document.getElementById("viewGenerate").classList.toggle("hidden", name !== "generate");
    document.getElementById("viewLedger").classList.toggle("hidden", name !== "ledger");
    document.getElementById("viewBank").classList.toggle("hidden", name !== "bank");
    ["navGenerate", "navLedger", "navBank"].forEach(function (id) {
      var btn = document.getElementById(id);
      btn.classList.toggle("active", btn.getAttribute("data-view") === name);
    });
    if (name === "ledger") renderLedger();
    if (name === "bank") renderBank();
  }

  function renderHookCards(list) {
    var root = document.getElementById("hookResults");
    if (!list.length) {
      root.innerHTML = '<p class="hint">No candidates.</p>';
      return;
    }
    root.innerHTML = list.map(function (c, i) {
      var pct = Math.max(8, Math.min(100, Math.round(c.score * 100)));
      return (
        '<article class="card' + (i === 0 ? " top" : "") + '">' +
          '<div class="cardhead">' +
            '<span class="rank">#' + (i + 1) + " · " + esc(c.pattern.name) + "</span>" +
            badgeHtml(c.status) +
          "</div>" +
          '<p class="hooktext">' + esc(c.text) + "</p>" +
          '<div class="meta">' +
            '<span class="tag">' + esc(c.pattern.family) + "</span>" +
            (c.medium ? '<span class="tag">' + (c.medium === "text" ? "✍️ text" : "🎬 video") + "</span>" : "") +
            '<span class="tag">' + esc(c.pattern.tier || "core") + "</span>" +
            '<span class="tag">' + esc(c.mode) + "</span>" +
            (c.winRate != null ? '<span class="tag">win ' + Math.round(c.winRate * 100) + "%</span>" : "") +
          "</div>" +
          '<p class="why">' + esc(c.pattern.why) + "</p>" +
          '<p class="evidence">' + esc(evidenceLine(c)) + "</p>" +
          '<div class="scorebar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="actions">' +
            '<button class="btn sm primary" data-copy="' + esc(c.text) + '" type="button">Copy</button>' +
            '<button class="btn sm" data-log-hook="' + esc(c.text) + '" data-log-pattern="' + esc(c.pattern.id) + '" data-log-family="' + esc(c.pattern.family) + '" type="button">Log outcome</button>' +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function renderAngleCards(list) {
    var root = document.getElementById("angleResults");
    root.innerHTML = list.map(function (a, i) {
      return (
        '<article class="card">' +
          '<div class="cardhead"><span class="rank">#' + (i + 1) + "</span></div>" +
          '<p class="hooktext">' + esc(a.name) + "</p>" +
          '<p class="why">' + esc(a.description) + " · " + a.count + " matching hooks</p>" +
          (a.sample ? '<p class="evidence">Sample: “' + esc(a.sample) + "”</p>" : "") +
        "</article>"
      );
    }).join("");
  }

  function renderCtaCards(list) {
    var root = document.getElementById("ctaResults");
    root.innerHTML = list.map(function (c, i) {
      return (
        '<article class="card">' +
          '<div class="cardhead"><span class="rank">#' + (i + 1) + " · " + esc(c.name) + "</span></div>" +
          '<p class="hooktext">' + esc(c.text) + "</p>" +
          '<p class="why">' + esc(c.why) + "</p>" +
          '<div class="actions"><button class="btn sm primary" data-copy="' + esc(c.text) + '" type="button">Copy</button></div>' +
        "</article>"
      );
    }).join("");
  }

  function showResults(bundle) {
    state.lastResults = bundle;
    document.getElementById("resultsPanel").classList.remove("hidden");
    document.getElementById("hookCount").textContent = bundle.hooks.length;
    document.getElementById("angleCount").textContent = bundle.angles.length;
    document.getElementById("ctaCount").textContent = bundle.ctas.length;
    renderHookCards(bundle.hooks);
    renderAngleCards(bundle.angles);
    renderCtaCards(bundle.ctas);
    // default tab
    document.querySelectorAll("#resultTabs .tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === "hooks");
    });
    document.getElementById("hookResults").classList.remove("hidden");
    document.getElementById("angleResults").classList.add("hidden");
    document.getElementById("ctaResults").classList.add("hidden");
    document.getElementById("resultsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function mechName(id) {
    for (var i = 0; i < MECHANISMS.length; i++) if (MECHANISMS[i].id === id) return MECHANISMS[i].name;
    return id;
  }
  // Group ledger entries by a key and count wins/total for win-rate insights.
  function groupStats(keyFn) {
    var m = {};
    state.ledger.forEach(function (e) {
      var k = keyFn(e); if (k == null || k === "") return;
      if (!m[k]) m[k] = { total: 0, wins: 0 };
      m[k].total++; if (e.outcome === "winner") m[k].wins++;
    });
    return m;
  }
  // Win-rate tables by mechanism / family / platform. ONLY groups with >= 3
  // entries, and the n= count is always shown — HOOKLAB never shows a fake %.
  function insightsHTML() {
    if (state.ledger.length < 3) return "";
    var groups = [
      { title: "By why-it-worked", stats: groupStats(function (e) { return e.hypothesis; }), label: mechName },
      { title: "By pattern family", stats: groupStats(function (e) { return e.family; }), label: function (x) { return x; } },
      { title: "By platform", stats: groupStats(function (e) { return e.platform; }), label: function (x) { return x; } }
    ];
    var blocks = groups.map(function (g) {
      var keys = Object.keys(g.stats).filter(function (k) { return g.stats[k].total >= 3; })
        .sort(function (a, b) { return (g.stats[b].wins / g.stats[b].total) - (g.stats[a].wins / g.stats[a].total); });
      if (!keys.length) return "";
      return '<div class="insightgroup"><h4>' + esc(g.title) + "</h4>" +
        keys.map(function (k) {
          var s = g.stats[k], pct = Math.round(s.wins / s.total * 100);
          return '<div class="insightrow"><span class="ik">' + esc(g.label(k)) + "</span>" +
            '<span class="ibar"><span style="width:' + pct + '%"></span></span>' +
            '<span class="iv">' + pct + '% win <span class="in">n=' + s.total + "</span></span></div>";
        }).join("") + "</div>";
    }).filter(Boolean);
    if (!blocks.length) return '<p class="hint" style="margin:10px 0 0">Once any mechanism, family, or platform has 3+ logged posts, its win rate shows here (always with the sample size, never a fake percentage).</p>';
    return '<div class="insightshead">Insights</div>' + blocks.join("");
  }
  function renderLedger() {
    var wins = state.ledger.filter(function (e) { return e.outcome === "winner"; }).length;
    var meh = state.ledger.filter(function (e) { return e.outcome === "meh"; }).length;
    var dead = state.ledger.filter(function (e) { return e.outcome === "dead"; }).length;
    var stats = familyStats();
    var topFam = Object.keys(stats).sort(function (a, b) {
      return (stats[b].scoreSum / (stats[b].total || 1)) - (stats[a].scoreSum / (stats[a].total || 1));
    })[0];

    document.getElementById("ledgerStats").innerHTML =
      '<div class="stat"><div class="n">' + state.ledger.length + '</div><div class="l">Logged</div></div>' +
      '<div class="stat"><div class="n">' + wins + '</div><div class="l">Winners</div></div>' +
      '<div class="stat"><div class="n">' + meh + '</div><div class="l">Meh</div></div>' +
      '<div class="stat"><div class="n">' + dead + '</div><div class="l">Dead</div></div>' +
      '<div class="stat"><div class="n">' + esc(topFam || "—") + '</div><div class="l">Top family</div></div>';

    document.getElementById("ledgerInsights").innerHTML = insightsHTML();

    var list = document.getElementById("ledgerList");
    var empty = document.getElementById("ledgerEmpty");
    if (!state.ledger.length) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    list.innerHTML = state.ledger.map(function (e) {
      var p = patternById(e.patternId);
      return (
        '<article class="card entry">' +
          '<div class="cardhead">' +
            '<span class="outcome ' + esc(e.outcome) + '">' + esc(e.outcome) + "</span>" +
            '<button class="btn sm danger" data-del-entry="' + esc(e.id) + '" type="button">Delete</button>' +
          "</div>" +
          '<p class="hooktext">' + esc(e.hook) + "</p>" +
          '<div class="meta">' +
            '<span class="tag">' + esc(e.family || (p && p.family) || "—") + "</span>" +
            '<span class="tag">' + esc(e.platform || "—") + "</span>" +
            '<span class="tag">' + esc(e.niche || "—") + "</span>" +
            (e.hypothesis ? '<span class="tag mech">' + esc(mechName(e.hypothesis)) + "</span>" : "") +
            (e.retention != null && e.retention !== "" ? '<span class="tag">3s ' + esc(e.retention) + "%</span>" : "") +
            (e.views != null && e.views !== "" ? '<span class="tag">' + esc(e.views) + " views</span>" : "") +
          "</div>" +
          (e.notes ? '<p class="why">' + esc(e.notes) + "</p>" : "") +
          (e.hypothesisNote ? '<p class="why">Hypothesis: ' + esc(e.hypothesisNote) + "</p>" : "") +
        "</article>"
      );
    }).join("");
  }

  function evidenceBadge(ev) {
    var label = (EVIDENCE_LABELS && EVIDENCE_LABELS[ev]) || ev || "market-observed";
    var cls = ev === "historically-documented" ? "hist" :
              ev === "hypothesis" ? "hypo" :
              ev === "creator-ledger" ? "proven" : "market";
    return '<span class="badge ' + cls + '">' + esc(label) + "</span>";
  }

  function tierBadge(tier) {
    var label = (TIER_LABELS && TIER_LABELS[tier]) || tier || "core";
    return '<span class="badge tier-' + esc(tier || "core") + '">' + esc(label) + "</span>";
  }

  function patternCardHtml(p) {
    var stats = familyStats()[p.family];
    var wr = stats && stats.total ? Math.round((stats.wins / stats.total) * 100) + "% personal" : "no personal data";
    var inst = HISTORICAL_INSTANCES.filter(function (h) {
      return h.patternIds && h.patternIds.indexOf(p.id) >= 0;
    });
    var instLine = inst.length
      ? '<p class="evidence">Historical instance: ' + esc(inst[0].title) + (inst[0].year ? " (" + esc(inst[0].year) + ")" : "") + " — " + esc(inst[0].mechanismNote) + "</p>"
      : "";
    return (
      '<article class="card" data-pattern-id="' + esc(p.id) + '">' +
        '<div class="cardhead">' +
          '<span class="rank">' + esc(p.name) + " · " + esc(p.mechanism || p.family) + "</span>" +
          '<span class="scorelabel">' + wr + "</span>" +
        "</div>" +
        '<div class="meta" style="margin-bottom:8px">' +
          tierBadge(p.tier) +
          evidenceBadge(p.evidence) +
          (p.era ? '<span class="tag">' + esc(p.era) + "</span>" : "") +
        "</div>" +
        '<p class="hooktext" style="font-size:14px;font-weight:500">' + esc(p.scaffold) + "</p>" +
        '<p class="why">' + esc(p.why) + "</p>" +
        instLine +
      "</article>"
    );
  }

  function instanceCardHtml(h) {
    var linked = (h.patternIds || []).map(function (id) {
      var p = patternById(id);
      return p ? p.name : id;
    }).join(", ");
    return (
      '<article class="card instance">' +
        '<div class="cardhead">' +
          '<span class="rank">' + esc(h.title) + (h.year ? " · " + esc(h.year) : "") + "</span>" +
          evidenceBadge("historically-documented") +
        "</div>" +
        '<p class="hooktext" style="font-size:14.5px">' + esc(h.surface) + "</p>" +
        '<p class="why"><b>Mechanism:</b> ' + esc(h.mechanismNote) + "</p>" +
        '<p class="why"><b>WTF job:</b> ' + esc(h.wtfJob) + "</p>" +
        '<p class="why"><b>Modern parallel:</b> ' + esc(h.modernParallel) + "</p>" +
        '<p class="evidence">Source: ' + esc(h.source) +
          (linked ? " · Linked patterns: " + esc(linked) : "") +
          (h.risk ? " · Risk: " + esc(h.risk) : "") +
        "</p>" +
        '<p class="why"><b>Viability today:</b> ' + esc(h.viability) + "</p>" +
      "</article>"
    );
  }

  function filteredPatternsForBank() {
    var q = (state.bank.query || "").trim().toLowerCase();
    var tier = state.bank.tier;
    var mech = state.bank.mechanism;
    return PATTERNS.filter(function (p) {
      if (tier === "instances") return false;
      if (tier !== "all" && p.tier !== tier) return false;
      if (mech !== "all" && (p.mechanism || p.family) !== mech) return false;
      if (!q) return true;
      var blob = [p.name, p.scaffold, p.why, p.family, p.mechanism, p.tier, p.era, p.evidence].join(" ").toLowerCase();
      return blob.indexOf(q) >= 0;
    });
  }

  function filteredInstancesForBank() {
    var q = (state.bank.query || "").trim().toLowerCase();
    var mech = state.bank.mechanism;
    return HISTORICAL_INSTANCES.filter(function (h) {
      if (mech !== "all" && h.mechanism !== mech) return false;
      if (!q) return true;
      var blob = [h.title, h.surface, h.mechanismNote, h.modernParallel, h.source, h.wtfJob, (h.patternIds || []).join(" ")].join(" ").toLowerCase();
      return blob.indexOf(q) >= 0;
    });
  }

  function renderBank() {
    var counts = countByTier();
    document.getElementById("patternCount").textContent =
      "(" + counts.core + " core · " + counts.extended + " extended · " + counts.historical + " historical · " + counts.instances + " instances)";

    var statsEl = document.getElementById("bankStats");
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="stat"><div class="n">' + counts.core + '</div><div class="l">Core</div></div>' +
        '<div class="stat"><div class="n">' + counts.extended + '</div><div class="l">Extended</div></div>' +
        '<div class="stat"><div class="n">' + counts.historical + '</div><div class="l">Historical</div></div>' +
        '<div class="stat"><div class="n">' + counts.instances + '</div><div class="l">Instances</div></div>' +
        '<div class="stat"><div class="n">' + counts.total + '</div><div class="l">Formulas</div></div>';
    }

    // sync controls
    var qEl = document.getElementById("bankSearch");
    if (qEl && qEl.value !== state.bank.query) qEl.value = state.bank.query;
    document.querySelectorAll("[data-bank-tier]").forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-bank-tier") === state.bank.tier);
    });
    var mechSel = document.getElementById("bankMechanism");
    if (mechSel) mechSel.value = state.bank.mechanism;

    var showInstances = state.bank.tier === "instances" || state.bank.tier === "historical";
    var list = document.getElementById("patternList");
    var moreWrap = document.getElementById("seeMoreWrap");
    var instSection = document.getElementById("instanceSection");

    if (state.bank.tier === "instances") {
      var instancesOnly = filteredInstancesForBank();
      list.innerHTML = instancesOnly.length
        ? instancesOnly.map(instanceCardHtml).join("")
        : '<p class="hint">No historical instances match.</p>';
      if (moreWrap) moreWrap.classList.add("hidden");
      if (instSection) instSection.classList.add("hidden");
    } else {
      var patterns = filteredPatternsForBank();
      // Core-first default view: if tier=all and no search and not showMore, only core
      var collapsed = state.bank.tier === "all" && !state.bank.query && state.bank.mechanism === "all" && !state.bank.showMore;
      var core = patterns.filter(function (p) { return p.tier === "core"; });
      var rest = patterns.filter(function (p) { return p.tier !== "core"; });
      var visible = collapsed ? core : patterns;

      // Keep core first when showing all
      if (!collapsed && state.bank.tier === "all") {
        visible = core.concat(rest);
      }

      list.innerHTML = visible.length
        ? visible.map(patternCardHtml).join("")
        : '<p class="hint">No patterns match your filters.</p>';

      if (moreWrap) {
        if (collapsed && rest.length) {
          moreWrap.classList.remove("hidden");
          document.getElementById("seeMoreBtn").textContent =
            "See more patterns (" + rest.length + " extended + historical) →";
          document.getElementById("seeMoreHint").textContent =
            "Core stays first in underwriting. Extended & historical add depth without burying the daily drivers.";
        } else if (state.bank.tier === "all" && state.bank.showMore && !state.bank.query) {
          moreWrap.classList.remove("hidden");
          document.getElementById("seeMoreBtn").textContent = "Show core only ↑";
          document.getElementById("seeMoreHint").textContent =
            "Showing full bank. Underwriting still prefers core unless niche/goal needs depth.";
        } else {
          moreWrap.classList.add("hidden");
        }
      }

      if (instSection) {
        if (showInstances || (state.bank.showMore && state.bank.tier === "all") || state.bank.query) {
          var inst = filteredInstancesForBank();
          instSection.classList.remove("hidden");
          document.getElementById("instanceList").innerHTML = inst.length
            ? inst.map(instanceCardHtml).join("")
            : '<p class="hint">No instances match.</p>';
        } else {
          instSection.classList.add("hidden");
        }
      }
    }

    // comps
    var comps = state.comps;
    var empty = document.getElementById("compEmpty");
    var clist = document.getElementById("compList");
    if (!comps.length) {
      clist.innerHTML = "";
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      clist.innerHTML = comps.map(function (c) {
        return (
          '<article class="card">' +
            '<div class="cardhead">' +
              '<span class="rank">' + esc(c.creator || "comp") + " · " + esc(c.niche || "general") + "</span>" +
              '<button class="btn sm danger" data-del-comp="' + esc(c.id) + '" type="button">Delete</button>' +
            "</div>" +
            '<p class="hooktext" style="font-size:14.5px">' + esc(c.hook) + "</p>" +
            (c.notes ? '<p class="why">' + esc(c.notes) + "</p>" : "") +
          "</article>"
        );
      }).join("");
    }
  }

  function openEntryModal(prefill) {
    prefill = prefill || {};
    document.getElementById("entryHook").value = prefill.hook || "";
    if (prefill.patternId) document.getElementById("entryPattern").value = prefill.patternId;
    document.getElementById("entryOutcome").value = prefill.outcome || "winner";
    document.getElementById("entryRetention").value = "";
    document.getElementById("entryViews").value = "";
    document.getElementById("entryNotes").value = "";
    document.getElementById("entryHypothesis").value = prefill.hypothesis || "";
    document.getElementById("entryHypothesisNote").value = "";
    document.getElementById("entryScrim").classList.add("open");
  }

  // ---------- settings UI ----------
  function refreshKeyStatus() {
    var g = document.getElementById("geminiStatus");
    var o = document.getElementById("openrouterStatus");
    if (settings.geminiKey) { g.textContent = "Key saved in this browser"; g.className = "keystatus set"; }
    else { g.textContent = "Not set — free tier works for text underwriting"; g.className = "keystatus empty"; }
    if (settings.openrouterKey) { o.textContent = "Key saved in this browser"; o.className = "keystatus set"; }
    else { o.textContent = "Not set"; o.className = "keystatus empty"; }
  }
  function openSettings() {
    document.querySelector('input[name="provider"][value="' + settings.provider + '"]').checked = true;
    document.getElementById("geminiKey").value = settings.geminiKey || "";
    document.getElementById("openrouterKey").value = settings.openrouterKey || "";
    document.getElementById("openrouterModel").value = settings.openrouterModel || "openai/gpt-4o-mini";
    if (window.StackModels) window.StackModels.populate(
      document.getElementById("openrouterModelSelect"), document.getElementById("openrouterModel"),
      document.getElementById("openrouterModelRefresh"),
      function (ok) { toast(ok ? "Model list updated" : "Couldn't reach OpenRouter"); });
    document.getElementById("brandVoice").value = settings.brandVoice || "";
    document.getElementById("geminiBlock").classList.toggle("hidden", settings.provider !== "gemini");
    document.getElementById("openrouterBlock").classList.toggle("hidden", settings.provider !== "openrouter");
    refreshKeyStatus();
    document.getElementById("settingsScrim").classList.add("open");
  }

  // ---------- wire up ----------
  function initFormOptions() {
    fillSelect(document.getElementById("niche"), NICHES, "id", "label");
    fillSelect(document.getElementById("platform"), PLATFORMS, "id", "label");
    fillSelect(document.getElementById("entryPlatform"), PLATFORMS, "id", "label");
    fillSelect(document.getElementById("entryNiche"), NICHES, "id", "label");
    fillSelect(document.getElementById("compNiche"), NICHES, "id", "label");
    fillSelect(document.getElementById("entryPattern"), PATTERNS.map(function (p) {
      return { id: p.id, label: p.name + " (" + p.family + ")" };
    }), "id", "label");
    // Mechanism hypothesis: "why do I think this worked?" — reuses the pattern
    // bank's own MECHANISMS taxonomy so insights group cleanly later.
    fillSelect(document.getElementById("entryHypothesis"),
      [{ id: "", name: "(not sure)" }].concat(MECHANISMS), "id", "name");

    var chips = document.getElementById("angleChips");
    chips.innerHTML = ANGLES.map(function (a) {
      return '<button type="button" class="chip" data-angle="' + esc(a.id) + '">' + esc(a.name) + "</button>";
    }).join("");
    updateMediumHint();
  }

  function updateMediumHint() {
    var hint = document.getElementById("mediumHint");
    if (!hint) return;
    var m = mediumForPlatform(document.getElementById("platform").value);
    hint.textContent = m === "text"
      ? MEDIUMS.text.icon + " Text-post mode — patterns & CTAs filtered for written hooks"
      : MEDIUMS.video.icon + " Video mode — patterns & CTAs filtered for spoken opens";
  }

  async function runGenerate(useAI) {
    var topic = document.getElementById("topic").value.trim();
    if (!topic) { toast("Add a topic / idea first"); return; }
    var sourceMaterial = document.getElementById("sourceMaterial").value.trim();
    var niche = document.getElementById("niche").value;
    var platform = document.getElementById("platform").value;
    var goal = document.getElementById("goal").value;
    var angleIds = state.selectedAngles.slice();
    var label = document.getElementById("genLabel");
    var btn = document.getElementById("underwriteBtn");
    var offlineBtn = document.getElementById("offlineBtn");

    btn.disabled = true;
    offlineBtn.disabled = true;

    try {
      if (useAI) {
        var hasKey = settings.provider === "openrouter" ? settings.openrouterKey : settings.geminiKey;
        if (!hasKey) {
          toast("Add an API key in Settings, or use Offline mode");
          openSettings();
          return;
        }
        label.textContent = "Underwriting with evidence…";
        var bundle = await underwriteWithAI(topic, sourceMaterial, niche, platform, goal, angleIds);
        showResults(bundle);
        toast("Ranked " + bundle.hooks.length + " candidates");
      } else {
        label.textContent = "Filling scaffolds from bank + ledger…";
        await new Promise(function (r) { setTimeout(r, 120); });
        var hooks = buildCandidatesOffline(topic, niche, platform, angleIds);
        var bundle2 = {
          hooks: hooks,
          angles: buildAngles(hooks),
          ctas: buildCtas(topic, goal, mediumForPlatform(platform))
        };
        showResults(bundle2);
        toast("Offline underwrite ready");
      }
    } catch (err) {
      console.error(err);
      toast(err.message || "Underwrite failed");
      label.textContent = "";
    } finally {
      btn.disabled = false;
      offlineBtn.disabled = false;
      label.textContent = "";
    }
  }

  function onReady() {
    loadSettings();
    loadState();
    // Persist the ledger key on first open so companion apps (RECALL Top Clips
    // reads localStorage["hooklab_state_v1"]) can detect that HOOKLAB has been
    // opened on this device — previously the key only appeared after the user
    // saved a ledger/comp entry, so "open HOOKLAB once" did nothing.
    if (localStorage.getItem(LS_STATE) == null) saveState();
    applyTheme(localStorage.getItem(LS_THEME) || "");
    initFormOptions();
    document.getElementById("platform").addEventListener("change", updateMediumHint);

    // Bank filters
    var bankSearch = document.getElementById("bankSearch");
    if (bankSearch) {
      bankSearch.addEventListener("input", function () {
        state.bank.query = bankSearch.value;
        // searching auto-expands
        if (state.bank.query) state.bank.showMore = true;
        renderBank();
      });
    }
    document.querySelectorAll("[data-bank-tier]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.bank.tier = btn.getAttribute("data-bank-tier");
        if (state.bank.tier !== "all") state.bank.showMore = true;
        renderBank();
      });
    });
    var bankMech = document.getElementById("bankMechanism");
    if (bankMech) {
      // populate mechanisms
      bankMech.innerHTML = '<option value="all">All mechanisms</option>' +
        MECHANISMS.map(function (m) {
          return '<option value="' + esc(m.id) + '">' + esc(m.name) + "</option>";
        }).join("");
      bankMech.addEventListener("change", function () {
        state.bank.mechanism = bankMech.value;
        if (bankMech.value !== "all") state.bank.showMore = true;
        renderBank();
      });
    }
    var seeMoreBtn = document.getElementById("seeMoreBtn");
    if (seeMoreBtn) {
      seeMoreBtn.addEventListener("click", function () {
        state.bank.showMore = !state.bank.showMore;
        if (!state.bank.showMore) {
          state.bank.tier = "all";
          state.bank.query = "";
          state.bank.mechanism = "all";
        }
        renderBank();
      });
    }

    setView("generate");

    document.getElementById("theme").addEventListener("click", cycleTheme);
    document.getElementById("settings").addEventListener("click", openSettings);
    document.getElementById("openSettingsFromHint").addEventListener("click", openSettings);
    document.getElementById("closeSettings").addEventListener("click", function () {
      document.getElementById("settingsScrim").classList.remove("open");
    });
    document.getElementById("saveSettings").addEventListener("click", function () {
      settings.provider = document.querySelector('input[name="provider"]:checked').value;
      settings.geminiKey = document.getElementById("geminiKey").value.trim();
      settings.openrouterKey = document.getElementById("openrouterKey").value.trim();
      settings.openrouterModel = document.getElementById("openrouterModel").value.trim() || "openai/gpt-4o-mini";
      settings.brandVoice = document.getElementById("brandVoice").value.trim();
      saveSettings();
      // Blanking a key field and saving clears it across the whole stack
      // (saveSettings' write-through only writes non-empty values).
      if (window.StackData) {
        if (!settings.geminiKey) window.StackData.clearSharedKey("geminiKey");
        if (!settings.openrouterKey) window.StackData.clearSharedKey("openrouterKey");
      }
      refreshKeyStatus();
      document.getElementById("settingsScrim").classList.remove("open");
      toast("Settings saved");
    });
    document.querySelectorAll('input[name="provider"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var v = document.querySelector('input[name="provider"]:checked').value;
        document.getElementById("geminiBlock").classList.toggle("hidden", v !== "gemini");
        document.getElementById("openrouterBlock").classList.toggle("hidden", v !== "openrouter");
      });
    });
    document.getElementById("toggleGemini").addEventListener("click", function () {
      var i = document.getElementById("geminiKey");
      i.type = i.type === "password" ? "text" : "password";
      this.textContent = i.type === "password" ? "Show" : "Hide";
    });
    document.getElementById("toggleOpenrouter").addEventListener("click", function () {
      var i = document.getElementById("openrouterKey");
      i.type = i.type === "password" ? "text" : "password";
      this.textContent = i.type === "password" ? "Show" : "Hide";
    });

    document.getElementById("navGenerate").addEventListener("click", function () { setView("generate"); });
    document.getElementById("navLedger").addEventListener("click", function () { setView("ledger"); });
    document.getElementById("navBank").addEventListener("click", function () { setView("bank"); });

    document.getElementById("angleChips").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-angle]");
      if (!btn) return;
      var id = btn.getAttribute("data-angle");
      var idx = state.selectedAngles.indexOf(id);
      if (idx >= 0) state.selectedAngles.splice(idx, 1);
      else state.selectedAngles.push(id);
      btn.classList.toggle("on", state.selectedAngles.indexOf(id) >= 0);
    });

    document.getElementById("underwriteBtn").addEventListener("click", function () { runGenerate(true); });
    document.getElementById("offlineBtn").addEventListener("click", function () { runGenerate(false); });

    document.getElementById("resultTabs").addEventListener("click", function (e) {
      var tab = e.target.closest(".tab");
      if (!tab) return;
      var name = tab.getAttribute("data-tab");
      document.querySelectorAll("#resultTabs .tab").forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });
      document.getElementById("hookResults").classList.toggle("hidden", name !== "hooks");
      document.getElementById("angleResults").classList.toggle("hidden", name !== "angles");
      document.getElementById("ctaResults").classList.toggle("hidden", name !== "ctas");
    });

    // delegated copy / log / delete
    document.body.addEventListener("click", function (e) {
      var copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        var text = copyBtn.getAttribute("data-copy");
        // navigator.clipboard is undefined on insecure contexts / old WebViews —
        // reading .writeText off it would throw past the .catch below.
        if (!navigator.clipboard) { toast("Copy not supported here — select the text manually"); return; }
        navigator.clipboard.writeText(text).then(function () { toast("Copied"); }).catch(function () {
          toast("Copy failed");
        });
        return;
      }
      var logBtn = e.target.closest("[data-log-hook]");
      if (logBtn) {
        openEntryModal({
          hook: logBtn.getAttribute("data-log-hook"),
          patternId: logBtn.getAttribute("data-log-pattern")
        });
        // also set family via pattern
        var pid = logBtn.getAttribute("data-log-pattern");
        if (pid) document.getElementById("entryPattern").value = pid;
        return;
      }
      var delE = e.target.closest("[data-del-entry]");
      if (delE) {
        var id = delE.getAttribute("data-del-entry");
        state.ledger = state.ledger.filter(function (x) { return x.id !== id; });
        saveState();
        renderLedger();
        toast("Entry removed");
        return;
      }
      var delC = e.target.closest("[data-del-comp]");
      if (delC) {
        var cid = delC.getAttribute("data-del-comp");
        state.comps = state.comps.filter(function (x) { return x.id !== cid; });
        saveState();
        renderBank();
        toast("Comp removed");
      }
    });

    document.getElementById("addEntryBtn").addEventListener("click", function () { openEntryModal(); });
    document.getElementById("closeEntry").addEventListener("click", function () {
      document.getElementById("entryScrim").classList.remove("open");
    });
    document.getElementById("saveEntry").addEventListener("click", function () {
      var hook = document.getElementById("entryHook").value.trim();
      if (!hook) { toast("Hook text required"); return; }
      var patternId = document.getElementById("entryPattern").value;
      var p = patternById(patternId);
      var entry = {
        id: uid(),
        hook: hook,
        patternId: patternId,
        family: p ? p.family : "unknown",
        outcome: document.getElementById("entryOutcome").value,
        platform: document.getElementById("entryPlatform").value,
        medium: mediumForPlatform(document.getElementById("entryPlatform").value),
        niche: document.getElementById("entryNiche").value,
        retention: document.getElementById("entryRetention").value,
        views: document.getElementById("entryViews").value,
        notes: document.getElementById("entryNotes").value.trim(),
        hypothesis: document.getElementById("entryHypothesis").value,
        hypothesisNote: document.getElementById("entryHypothesisNote").value.trim(),
        createdAt: new Date().toISOString()
      };
      state.ledger.unshift(entry);
      saveState();
      document.getElementById("entryScrim").classList.remove("open");
      renderLedger();
      toast("Logged — ledger updated");
    });

    document.getElementById("exportLedgerBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify({ ledger: state.ledger, comps: state.comps, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "hooklab-ledger.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Exported");
    });
    document.getElementById("importLedgerBtn").addEventListener("click", function () {
      document.getElementById("importFile").click();
    });
    // Whole-stack backup (all 4 apps)
    if (window.StackData) {
      document.getElementById("stackexport").addEventListener("click", function () {
        window.StackData.exportToFile().then(function () { toast("Stack backup downloaded"); });
      });
      document.getElementById("stackimport").addEventListener("click", function () {
        document.getElementById("stackfile").click();
      });
      document.getElementById("stackfile").addEventListener("change", function (ev) {
        var f = ev.target.files && ev.target.files[0];
        if (f) window.StackData.importFromFile(f, toast);
        ev.target.value = "";
      });
    }
    document.getElementById("importFile").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          // If someone picks a whole-stack backup here, route it to the stack
          // importer instead of trying to read it as a ledger.
          if (window.StackData && window.StackData.isStackBackup(data)) {
            if (confirm("This is a whole-stack backup. Restore it? It REPLACES data in all four apps on this device.\n\nContains: " + window.StackData.summary(data))) {
              window.StackData.importAll(data).then(function () { location.reload(); });
            }
            ev.target.value = "";
            return;
          }
          // Normalize imported entries: an entry missing `id` would render an
          // empty data-del attribute, and Delete (filter x.id !== "") would then
          // wipe every *real* entry. Assign ids and drop shapeless objects.
          var importLedger = normalizeLedgerImport(
            Array.isArray(data) ? data : (Array.isArray(data.ledger) ? data.ledger : [])
          );
          if (importLedger.length) state.ledger = importLedger.concat(state.ledger);
          if (Array.isArray(data.comps)) {
            var importComps = data.comps.filter(function (c) { return c && c.hook; })
              .map(function (c) { if (!c.id) c.id = uid(); return c; });
            state.comps = importComps.concat(state.comps);
          }
          saveState();
          renderLedger();
          toast(importLedger.length + " ledger entr" + (importLedger.length === 1 ? "y" : "ies") + " imported");
        } catch (err) {
          toast("Invalid JSON");
        }
        ev.target.value = "";
      };
      reader.readAsText(file);
    });

    document.getElementById("addCompBtn").addEventListener("click", function () {
      document.getElementById("compHook").value = "";
      document.getElementById("compCreator").value = "";
      document.getElementById("compNotes").value = "";
      document.getElementById("compScrim").classList.add("open");
    });
    document.getElementById("closeComp").addEventListener("click", function () {
      document.getElementById("compScrim").classList.remove("open");
    });
    document.getElementById("saveComp").addEventListener("click", function () {
      var hook = document.getElementById("compHook").value.trim();
      if (!hook) { toast("Comp hook required"); return; }
      state.comps.unshift({
        id: uid(),
        hook: hook,
        creator: document.getElementById("compCreator").value.trim(),
        niche: document.getElementById("compNiche").value,
        notes: document.getElementById("compNotes").value.trim(),
        createdAt: new Date().toISOString()
      });
      saveState();
      document.getElementById("compScrim").classList.remove("open");
      renderBank();
      toast("Comp added");
    });

    // close scrims on backdrop
    ["settingsScrim", "entryScrim", "compScrim"].forEach(function (id) {
      document.getElementById(id).addEventListener("click", function (e) {
        if (e.target.id === id) e.currentTarget.classList.remove("open");
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();
})();
