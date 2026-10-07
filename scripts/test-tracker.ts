/**
 * Tracker logic tests — run with:  npx tsx scripts/test-tracker.ts
 *
 * These cover the rules that decide whether an item is allowed to advance.
 * They are the part most likely to be quietly wrong, and a wrong rule here
 * would inflate the user's own progress numbers.
 */

import {
  canTransitionTopic,
  canTransitionProblem,
  hintBudgetAllows,
  pct,
  countDaysUntil,
  TOPIC_STATES,
  PROBLEM_STATES,
  type TopicStateName,
  type ProblemStateName,
} from "../src/lib/tracker/engine";
import {
  TRACKER,
  TRACKER_ORDER,
  allTopicKeys,
  allProblemKeys,
  studyAction,
} from "../src/lib/tracker/config";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq<T>(name: string, actual: T, expected: T) {
  check(name, actual === expected, `got ${String(actual)}, want ${String(expected)}`);
}

/* ---------------------------------------------------------------- state gates */

check(
  "GATE: read → self-tested is blocked",
  canTransitionTopic("read", "self-tested").ok === false,
);
check(
  "GATE: read → self-tested explains why",
  /rederived/.test(canTransitionTopic("read", "self-tested").reason ?? ""),
);
check("read → rederived allowed", canTransitionTopic("read", "rederived").ok === true);
check(
  "unseen → self-tested blocked (never even read it)",
  canTransitionTopic("unseen", "self-tested").ok === false,
);
check(
  "rederived → self-tested allowed",
  canTransitionTopic("rederived", "self-tested").ok === true,
);
check(
  "self-tested → exam-ready allowed",
  canTransitionTopic("self-tested", "exam-ready").ok === true,
);
check(
  "exam-ready → flaky allowed (decay is reversible)",
  canTransitionTopic("exam-ready", "flaky").ok === true,
);
check(
  "read → read is a no-op, allowed",
  canTransitionTopic("read", "read").ok === true,
);
check(
  "backwards self-tested → read allowed (undo a bad call)",
  canTransitionTopic("self-tested", "read").ok === false,
  "reading cannot un-test an item; use rederived instead",
);

/* ------------------------------------------------------------- problem gates */

check(
  "PROBLEM GATE: unseen → solved-cold blocked",
  canTransitionProblem("unseen", "solved-cold").ok === false,
);
check(
  "PROBLEM GATE: unseen → attempted-fail allowed",
  canTransitionProblem("unseen", "attempted-fail").ok === true,
);
check(
  "PROBLEM: attempted-fail → understood allowed",
  canTransitionProblem("attempted-fail", "understood").ok === true,
);
check(
  "PROBLEM: understood → solved-cold allowed",
  canTransitionProblem("understood", "solved-cold").ok === true,
);
check(
  "PROBLEM: solved-cold → exam-speed allowed",
  canTransitionProblem("solved-cold", "exam-speed").ok === true,
);
check(
  "PROBLEM: direct unseen → exam-speed blocked",
  canTransitionProblem("unseen", "exam-speed").ok === false,
);

/* --------------------------------------------------------------- hint budget */

check("hints: exam-speed with 0 hints allowed", hintBudgetAllows("exam-speed", 0).ok === true);
check(
  "hints: exam-speed with 1 hint blocked",
  hintBudgetAllows("exam-speed", 1).ok === false,
);
check(
  "hints: exam-speed with 3 hints blocked and says re-solve cold",
  /cold/.test(hintBudgetAllows("exam-speed", 3).reason ?? ""),
);
check("hints: solved-cold with hints still allowed", hintBudgetAllows("solved-cold", 2).ok === true);

/* -------------------------------------------------------------- percentages */

eq("pct 0/0 is 0 not NaN", pct(0, 0), 0);
eq("pct 3/4", pct(3, 4), 75);
eq("pct 0/10 on a blank subject", pct(0, 10), 0);
eq("pct 10/10", pct(10, 10), 100);

/* ----------------------------------------------------------------- countdown */

eq(
  "countdown is in whole days",
  countDaysUntil("2026-11-17", new Date("2026-10-05T13:00:00")),
  43,
);
eq("countdown same day is 0", countDaysUntil("2026-10-05", new Date("2026-10-05T23:00:00")), 0);
eq("countdown ignores time of day", countDaysUntil("2026-11-17", new Date("2026-11-16T23:59:00")), 1);

/* --------------------------------------------------------- config integrity */

const topicKeys = allTopicKeys();
const problemKeys = allProblemKeys();

eq("all six subjects configured", TRACKER_ORDER.length, 6);
check("six subjects present in config", Object.keys(TRACKER).length === 6);

for (const slug of TRACKER_ORDER) {
  const c = TRACKER[slug];
  check(`${slug}: has a mode`, !!c.mode);
  check(`${slug}: has a diagnosis`, (c.diagnosis ?? "").length > 20);
  check(`${slug}: topics present`, c.topics.length > 0, `${c.topics.length} topics`);
  check(`${slug}: has Tier A topics`, c.topics.some((t) => t.tier === "A"));
  check(`${slug}: covers all 5 modules`, [1, 2, 3, 4, 5].every((m) => c.topics.some((t) => t.module === m)));
  check(`${slug}: every topic has evidence`, c.topics.every((t) => (t.evidence ?? "").length > 0));
  check(`${slug}: Tier A topics are derive/procedural/connect (not bare recall)`, c.topics.filter((t) => t.tier === "A").every((t) => t.kind !== "recall" || slug === "materials" || slug === "manufacturing"));
  check(`${slug}: exam format present`, c.exam.marksTotal === 50);
  check(`${slug}: exam format marked unconfirmed`, c.exam.confirmed === false);
  for (const p of c.problems) {
    check(`${slug}: problem ${p.key} cites a paper`, (p.pyqs ?? []).length > 0, "no PYQ cited");
  }
}

/* key uniqueness — the DB primary key depends on it */
const allK = [...topicKeys];
eq("topic keys are unique", new Set(allK).size, allK.length);
const allP = [...problemKeys];
eq("problem keys are unique", new Set(allP).size, allP.length);
check(
  "topic and problem key spaces do not collide",
  allK.every((k) => !problemKeys.has(k)),
);

/* every declared state name is one the engine knows */
for (const c of Object.values(TRACKER)) {
  for (const t of c.topics) {
    // kind must map to a real study action
    const a = studyAction(t.kind, "unseen");
    check(`${t.key}: has a study action`, a.verb.length > 0);
  }
}

/* the material fact: the Numerical paper is 3h, everything else 2h */
eq("Numerical gets 3 hours", TRACKER.numerical.exam.minutes, 180);
eq("Fluid gets 2 hours", TRACKER.fm.exam.minutes, 120);

/* decks: recall subjects must actually ship contrast pairs */
check(
  "Materials ships contrast decks",
  TRACKER.materials.decks.length >= 4,
  `${TRACKER.materials.decks.length} decks`,
);
check(
  "Manufacturing ships contrast decks",
  TRACKER.manufacturing.decks.length >= 4,
  `${TRACKER.manufacturing.decks.length} decks`,
);
for (const d of [...TRACKER.materials.decks, ...TRACKER.manufacturing.decks]) {
  check(`deck ${d.key}: has ≥3 pairs`, d.pairs.length >= 3, `${d.pairs.length}`);
  check(
    `deck ${d.key}: every pair states a contrast`,
    d.pairs.every((p) => (p.contrast ?? "").length > 10),
  );
  check(`deck ${d.key}: states answer points`, (d.answerPoints ?? []).length >= 3);
}
eq("derivation subjects ship no decks", TRACKER.fm.decks.length + TRACKER.som.decks.length, 0);

/* every state constant is reachable in the transition table */
for (const s of TOPIC_STATES) {
  check(`topic state ${s} has a transition entry`, canTransitionTopic(s, s).ok === true);
}
for (const s of PROBLEM_STATES) {
  check(`problem state ${s} has a transition entry`, canTransitionProblem(s, s).ok === true);
}

/* study action wording is subject-appropriate */
check(
  "derive subjects say Derive",
  studyAction("derive", "unseen").verb === "Derive",
);
check(
  "recall subjects say Contrast",
  studyAction("recall", "unseen").verb === "Contrast",
);
check(
  "connect says Chain",
  studyAction("connect", "unseen").verb === "Chain",
);
check(
  "flaky always says Repair",
  studyAction("derive", "flaky").verb === "Repair",
);

/* ---------------------------------------------------------------- reporting */

console.log(`\ntracker logic: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log("all gates behave as specified\n");

// Inventory, so the numbers are on the record rather than in my head.
console.log("inventory:");
let tAll = 0;
let pAll = 0;
for (const slug of TRACKER_ORDER) {
  const c = TRACKER[slug];
  const tierA = c.topics.filter((t) => t.tier === "A").length;
  const pairs = c.decks.reduce((n, d) => n + d.pairs.length, 0);
  tAll += c.topics.length;
  pAll += c.problems.length;
  console.log(
    `  ${c.short.padEnd(5)} mode=${c.mode.padEnd(11)} topics=${String(c.topics.length).padStart(2)} (A=${tierA})  problems=${String(c.problems.length).padStart(2)}  decks=${c.decks.length} pairs=${pairs}  ${c.exam.minutes}min`,
  );
}
console.log(`  TOTAL topics=${tAll} problems=${pAll}`);
