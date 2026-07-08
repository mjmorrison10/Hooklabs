// === patterns.js — curated hook pattern bank ===
// HOOKLAB underwrites hooks from structures, not freeform AI vibes.
// These scaffolds are the durable unit. AI only fills slots.

export var PATTERNS = [
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    family: "curiosity",
    scaffold: "Nobody talks about the real reason {topic}.",
    slots: ["topic"],
    why: "Opens a loop the viewer has to close",
    platforms: ["tiktok", "reels", "shorts"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "fitness", "finance", "general"],
    strength: 0.86
  },
  {
    id: "contrarian-stop",
    name: "Contrarian Stop",
    family: "contrarian",
    scaffold: "Stop {bad_habit}. Do {better} instead.",
    slots: ["bad_habit", "better"],
    why: "Pattern interrupt + clear alternative",
    platforms: ["tiktok", "reels", "shorts", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "fitness", "finance", "general"],
    strength: 0.88
  },
  {
    id: "specific-proof",
    name: "Specific Proof",
    family: "proof",
    scaffold: "I tested {thing} for {duration}. Here's what broke.",
    slots: ["thing", "duration"],
    why: "Specificity + stakes beats generic claims",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "fitness", "finance", "tech", "general"],
    strength: 0.9
  },
  {
    id: "mistake-callout",
    name: "Mistake Callout",
    family: "mistake",
    scaffold: "If you're still {mistake}, this is why it fails.",
    slots: ["mistake"],
    why: "Identity threat + promised fix",
    platforms: ["tiktok", "reels", "shorts", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "fitness", "finance", "general"],
    strength: 0.87
  },
  {
    id: "numbered-value",
    name: "Numbered Value",
    family: "value",
    scaffold: "{n} rules that cut my {pain} in half.",
    slots: ["n", "pain"],
    why: "Clear promise, scannable payoff",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin", "x"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "fitness", "finance", "tech", "general"],
    strength: 0.84
  },
  {
    id: "mid-action",
    name: "Mid-Action Open",
    family: "interrupt",
    scaffold: "—and that's the moment everything flipped.",
    slots: [],
    why: "Starts on the payoff, not the setup",
    platforms: ["tiktok", "reels", "shorts"],
    spoken: true,
    textOnScreen: false,
    niches: ["story", "creators", "business", "general"],
    strength: 0.82
  },
  {
    id: "industry-secret",
    name: "Industry Secret",
    family: "curiosity",
    scaffold: "The {industry} industry doesn't want you to know this.",
    slots: ["industry"],
    why: "Us-vs-them + forbidden knowledge",
    platforms: ["tiktok", "reels", "shorts", "youtube"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "fitness", "finance", "tech", "general"],
    strength: 0.85
  },
  {
    id: "warning-psa",
    name: "Warning / PSA",
    family: "warning",
    scaffold: "Stop using {thing} immediately if you {goal}.",
    slots: ["thing", "goal"],
    why: "Urgency + protective framing",
    platforms: ["tiktok", "reels", "shorts"],
    spoken: true,
    textOnScreen: true,
    niches: ["fitness", "finance", "tech", "creators", "general"],
    strength: 0.83
  },
  {
    id: "before-after",
    name: "Before / After",
    family: "proof",
    scaffold: "Before: {before}. After: {after}. Here's the only change.",
    slots: ["before", "after"],
    why: "Transformation is a native short-form language",
    platforms: ["tiktok", "reels", "shorts", "youtube"],
    spoken: true,
    textOnScreen: true,
    niches: ["fitness", "business", "creators", "finance", "general"],
    strength: 0.86
  },
  {
    id: "hot-take",
    name: "Hot Take",
    family: "contrarian",
    scaffold: "Unpopular opinion: {claim}.",
    slots: ["claim"],
    why: "Polarization drives comments",
    platforms: ["tiktok", "reels", "shorts", "x", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "finance", "general"],
    strength: 0.8
  },
  {
    id: "question-bait",
    name: "Question Bait",
    family: "engagement",
    scaffold: "Why do most {audience} still {pain}?",
    slots: ["audience", "pain"],
    why: "Pulls the viewer into answering",
    platforms: ["tiktok", "reels", "shorts", "linkedin", "x"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "fitness", "finance", "general"],
    strength: 0.79
  },
  {
    id: "i-used-to",
    name: "I Used To",
    family: "story",
    scaffold: "I used to {old_way}. Then I {turning_point}.",
    slots: ["old_way", "turning_point"],
    why: "Personal arc creates trust fast",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: false,
    niches: ["story", "creators", "business", "fitness", "general"],
    strength: 0.84
  },
  {
    id: "cost-of-wrong",
    name: "Cost of Wrong",
    family: "mistake",
    scaffold: "This one mistake cost me {cost}.",
    slots: ["cost"],
    why: "Loss aversion is sticky",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "finance", "creators", "general"],
    strength: 0.85
  },
  {
    id: "list-tease",
    name: "List Tease",
    family: "value",
    scaffold: "Steal these {n} {things} I use every week.",
    slots: ["n", "things"],
    why: "Permission to copy + utility",
    platforms: ["tiktok", "reels", "shorts", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["creators", "business", "tech", "general"],
    strength: 0.81
  },
  {
    id: "most-creators-miss",
    name: "Most Creators Miss",
    family: "mistake",
    scaffold: "Most creators miss this when they {action}.",
    slots: ["action"],
    why: "In-group callout for creator niches",
    platforms: ["tiktok", "reels", "shorts", "youtube"],
    spoken: true,
    textOnScreen: true,
    niches: ["creators", "business", "general"],
    strength: 0.86
  },
  {
    id: "time-boxed-result",
    name: "Time-Boxed Result",
    family: "proof",
    scaffold: "In {timeframe} I went from {start} to {end}.",
    slots: ["timeframe", "start", "end"],
    why: "Bounded proof feels more believable",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "fitness", "finance", "creators", "general"],
    strength: 0.87
  },
  {
    id: "dont-buy",
    name: "Don't Buy Until",
    family: "warning",
    scaffold: "Don't buy {product_type} until you check this.",
    slots: ["product_type"],
    why: "Protective framing + product-adjacent utility",
    platforms: ["tiktok", "reels", "shorts", "youtube"],
    spoken: true,
    textOnScreen: true,
    niches: ["finance", "tech", "fitness", "general"],
    strength: 0.8
  },
  {
    id: "one-change",
    name: "One Change",
    family: "value",
    scaffold: "One change fixed my {problem}.",
    slots: ["problem"],
    why: "Low cognitive load promise",
    platforms: ["tiktok", "reels", "shorts", "youtube"],
    spoken: true,
    textOnScreen: true,
    niches: ["fitness", "creators", "business", "general"],
    strength: 0.83
  },
  {
    id: "pov-identity",
    name: "POV / Identity",
    family: "identity",
    scaffold: "POV: you're a {identity} who finally {win}.",
    slots: ["identity", "win"],
    why: "Self-selection keeps the right people watching",
    platforms: ["tiktok", "reels", "shorts"],
    spoken: false,
    textOnScreen: true,
    niches: ["creators", "fitness", "business", "general"],
    strength: 0.78
  },
  {
    id: "comment-trap",
    name: "Comment Trap",
    family: "engagement",
    scaffold: "Tell me I'm wrong: {claim}.",
    slots: ["claim"],
    why: "Manufactures replies on purpose",
    platforms: ["tiktok", "reels", "shorts", "x", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "finance", "general"],
    strength: 0.77
  },
  {
    id: "silent-open",
    name: "Silent Pattern Interrupt",
    family: "interrupt",
    scaffold: "[Silence / visual first] Then: {line}",
    slots: ["line"],
    why: "Unexpected quiet on noisy feeds holds attention",
    platforms: ["tiktok", "reels", "shorts"],
    spoken: true,
    textOnScreen: true,
    niches: ["creators", "story", "general"],
    strength: 0.76
  },
  {
    id: "checklist-promise",
    name: "Checklist Promise",
    family: "value",
    scaffold: "Save this checklist before your next {event}.",
    slots: ["event"],
    why: "Save-bait + utility",
    platforms: ["tiktok", "reels", "shorts", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["creators", "business", "tech", "general"],
    strength: 0.8
  },
  {
    id: "myth-bust",
    name: "Myth Bust",
    family: "contrarian",
    scaffold: "Myth: {myth}. Reality: {reality}.",
    slots: ["myth", "reality"],
    why: "Correction framing is highly rewatchable",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "fitness", "finance", "creators", "general"],
    strength: 0.85
  },
  {
    id: "behind-curtain",
    name: "Behind the Curtain",
    family: "curiosity",
    scaffold: "Here's what actually happens when {process}.",
    slots: ["process"],
    why: "Process transparency builds authority",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: false,
    niches: ["creators", "business", "tech", "general"],
    strength: 0.82
  },
  {
    id: "started-over",
    name: "If I Started Over",
    family: "story",
    scaffold: "If I started over in {domain} today, I'd only do this.",
    slots: ["domain"],
    why: "Hindsight compression is highly valuable",
    platforms: ["tiktok", "reels", "shorts", "youtube", "linkedin"],
    spoken: true,
    textOnScreen: true,
    niches: ["business", "creators", "finance", "tech", "general"],
    strength: 0.88
  }
];


export var ANGLES = [
  { id: "myth-bust", name: "Myth-bust", description: "Kill a common belief in your niche", patternFamilies: ["contrarian", "curiosity"] },
  { id: "teardown", name: "Teardown / mistake", description: "Show what people get wrong", patternFamilies: ["mistake", "warning"] },
  { id: "proof", name: "Proof / experiment", description: "Lead with results, tests, numbers", patternFamilies: ["proof", "value"] },
  { id: "story", name: "Story / origin", description: "Personal arc and turning points", patternFamilies: ["story", "identity", "interrupt"] },
  { id: "tactical", name: "Tactical checklist", description: "Steal-this utility and lists", patternFamilies: ["value", "engagement"] }
];

export var CTA_PATTERNS = [
  { id: "question", name: "Question bait", scaffold: "What would you try first — {a} or {b}?", why: "Forces a binary reply" },
  { id: "disagree", name: "Disagree bait", scaffold: "Agree or roast me in the comments.", why: "Polarization = comments" },
  { id: "save", name: "Save for later", scaffold: "Save this before you need it at 11pm.", why: "Saves are a strong ranking signal" },
  { id: "duet", name: "Stitch / reply invite", scaffold: "Stitch this with your version.", why: "Platform-native distribution" },
  { id: "follow-series", name: "Series follow", scaffold: "Part 1. Follow for the rest.", why: "Converts viewers into subscribers" },
  { id: "tag", name: "Tag someone", scaffold: "Tag the person who needs this today.", why: "Network spread via social proof" }
];

export var NICHES = [
  { id: "creators", label: "Creators / short-form" },
  { id: "business", label: "Business / SMMA" },
  { id: "fitness", label: "Fitness" },
  { id: "finance", label: "Finance" },
  { id: "tech", label: "Tech / SaaS" },
  { id: "story", label: "Story / personal brand" },
  { id: "general", label: "General" }
];

export var PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Instagram Reels" },
  { id: "shorts", label: "YouTube Shorts" },
  { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" }
];

export var OUTCOMES = [
  { id: "winner", label: "Winner", score: 1.0, color: "pos" },
  { id: "meh", label: "Meh", score: 0.45, color: "muted" },
  { id: "dead", label: "Dead", score: 0.05, color: "neg" }
];
