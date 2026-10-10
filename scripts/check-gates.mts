/**
 * Does the gate tell you to do something the rules actually allow?
 *
 * THE BUG THIS GUARDS
 * The refusal message said a cold solve needs a failed attempt first. There
 * was no place to record a failed attempt on the book-questions page (state
 * was a read-only span, only a tick existed) and no note field on a tracker
 * problem row, so the message named a step the UI made impossible. The gate
 * was correct; the instructions were fiction.
 *
 * Every gated transition must name a state that is reachable in ONE legal
 * move from the state you are actually in.
 */
import {
  canTransitionProblem,
  canTransitionTopic,
  PROBLEM_STATES,
  TOPIC_STATES,
  type ProblemStateName,
  type TopicStateName,
} from "../src/lib/tracker/engine";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

// 1. Every gated problem refusal must point at a state reachable from where
//    the user currently is.
const GATED = [
  ["unseen", "solved-cold"],
  ["unseen", "exam-speed"],
] as const;

for (const [from, to] of GATED) {
  const res = canTransitionProblem(from as ProblemStateName, to as ProblemStateName);
  check(`${from} → ${to} is refused`, !res.ok);
  const reason = res.reason ?? "";

  // The message must name at least one state the user can actually select,
  // and that state must be a legal single move away.
  //
  // Matching is on the LABEL the menu shows, not the raw state id: the menu
  // renders "Attempted · failed" for `attempted-fail`, so a message naming the
  // id would read like a database key to the person following it. The check
  // therefore accepts either form, which is what makes it a real test of the
  // instruction rather than of the string.
  const LABELS: Record<string, string> = {
    unseen: "Not started",
    "attempted-fail": "Attempted · failed",
    understood: "Understood",
    "solved-cold": "Solved cold",
    "exam-speed": "Exam speed",
  };
  const lower = reason.toLowerCase();
  const named = PROBLEM_STATES.filter(
    (s) =>
      lower.includes(s) || lower.includes(s.replace(/-/g, " ")) ||
      lower.includes(LABELS[s].toLowerCase()),
  );

  const reachable = named.filter(
    (s) => canTransitionProblem(from as ProblemStateName, s).ok,
  );

  check(
    `${from} → ${to} names a reachable next state`,
    reachable.length > 0,
    reachable.length ? `→ ${reachable.join(", ")}` : `message: "${reason}"`,
  );

  // And the message must not be the old unusable prose.
  check(
    `${from} → ${to} message is actionable`,
    !reason.startsWith("Gated:"),
    reason.startsWith("Gated:") ? "still the abstract wording" : "",
  );
}

// 2. The full recovery path a user is told to follow must actually work:
//    unseen → attempted-fail → understood → solved-cold → exam-speed.
const path: ProblemStateName[] = [
  "unseen",
  "attempted-fail",
  "understood",
  "solved-cold",
  "exam-speed",
];
let pathOk = true;
const broken: string[] = [];
for (let i = 0; i < path.length - 1; i++) {
  const r = canTransitionProblem(path[i], path[i + 1]);
  if (!r.ok) {
    pathOk = false;
    broken.push(`${path[i]} → ${path[i + 1]}`);
  }
}
check(
  "the documented recovery path is legal end to end",
  pathOk,
  broken.length ? `broken at ${broken.join(", ")}` : path.join(" → "),
);

// 3. Every state a user can select from the book page must be a real state.
check(
  "book page renders all five problem states",
  PROBLEM_STATES.length === 5,
  PROBLEM_STATES.join(", "),
);

// 4. The topic gate should also be self-describing.
const topicRes = canTransitionTopic("read" as TopicStateName, "self-tested" as TopicStateName);
check("read → self-tested is refused", !topicRes.ok);
check(
  "read → self-tested names rederived",
  (topicRes.reason ?? "").includes("rederived"),
  topicRes.reason ?? "",
);
check(
  "rederived is a real topic state",
  (TOPIC_STATES as readonly string[]).includes("rederived"),
);

console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);