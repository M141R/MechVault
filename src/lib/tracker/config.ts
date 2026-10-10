/**
 * TRACKER CONFIG — the content of the tracker.
 *
 * THIS IS THE ONLY FILE YOU EDIT TO ADD OR REMOVE TRACKED ITEMS.
 * Nothing here is state. State lives in the database (`topic_state` /
 * `problem_state`) and is keyed by the `key` strings below.
 *
 * Adding a topic:
 *   1. Append to that subject's `topics` array.
 *   2. Give it a unique `key` (`<slug>.m<module>.t<n>` or any stable string).
 *   3. Done — no migration, no rebuild of any other file.
 *
 * Adding a problem: same, in the `problems` array. Use `pyqs` to credit the
 * previous-year papers that justify its tier.
 *
 * ## Fields
 *
 * ### topics
 *   key      stable id; also the DB primary key. Never reuse one.
 *   module   official module number 1–5 (drives the "1 Q per module" endgame).
 *   title    what you must be able to DO, not what the chapter is called.
 *   tier     A = recurring, B = secondary, C = blank-sheet insurance.
 *   kind     derive | recall | connect | procedural
 *            → sets the study action. A derivation subject must not be able to
 *              advance a `recall` item by re-reading it.
 *   evidence why this is in this tier. `inferred` = no paper backs it yet, it is
 *              a judgement call from the syllabus. Be honest here; this field
 *              is what stops the tracker from looking more certain than it is.
 *
 * ### problems
 *   key, module, title, kind (same kinds), pyqs, evidence, marks
 *
 * ### decks
 *   Recall/contrast decks for the non-derivation subjects. A deck is a set of
 *   pairwise contrasts — NOT a keyword list. `pairs` is what a 5-mark
 *   "differentiate" answer is actually made of.
  *
  * ## Exam format
  * `exam.marksPerModule` etc. are ASSUMED from past papers and are labelled
  * `confirmed: false`. Set to true once you have seen the official notification.
  */

 // Textbook questions share the same `problem_state` rows and the same state
 // machine, so this file has to know their keys to validate them.
 import { allBookProblemKeys } from "./book-bank";

 export type StudyKind = "derive" | "recall" | "connect" | "procedural";
export type Tier = "A" | "B" | "C";

export interface TrackerTopic {
  key: string;
  module: number;
  title: string;
  tier: Tier;
  kind: StudyKind;
  evidence: string;
  /** Set when the item must be reproduced from a blank page, not re-read. */
  cue?: string;
}

export interface TrackerProblem {
  key: string;
  module: number;
  title: string;
  kind: StudyKind;
  pyqs: string[];
  evidence: string;
  marks?: number;
}

export interface RecallPair {
  a: string;
  b: string;
  contrast: string;
}

export interface RecallDeck {
  key: string;
  module: number;
  title: string;
  kind: StudyKind;
  evidence: string;
  pairs: RecallPair[];
  /** Minimum distinct answer points the examiner must see for full marks. */
  answerPoints?: string[];
}

export interface ExamMeta {
  code: string;
  /** Minutes available for the whole paper. */
  minutes: number;
  questionsPerModule: number;
  marksTotal: number;
  marksPerQuestion: number;
  /** Per-module share of the paper, in marks. */
  marksPerModule: number;
  /** Which past-paper convention this was inferred from. */
  basis: string;
  confirmed: boolean;
}

export interface SubjectTrackerConfig {
  slug: string;
  name: string;
  short: string;
  /**
   * Default study action for this subject. Shown on the dashboard so the
   * question "what do I do in the next hour" has one honest answer per subject.
   */
  mode: StudyKind;
  /** Human label for the mode, shown in the UI. */
  modeLabel: string;
  /** What the failure mode actually was, in one sentence. */
  diagnosis: string;
  exam: ExamMeta;
  topics: TrackerTopic[];
  problems: TrackerProblem[];
  decks: RecallDeck[];
}

/* -------------------------------------------------------------------------- */
/* SHARED EXAM FORMAT                                                          */
/* -------------------------------------------------------------------------- */

/**
 * BIT Mesra 3rd-sem end-sem papers observed in the MO2022–MO2025 archive are
 * 5 questions × 10 marks = 50, with roughly 10 marks drawn from each of the
 * 5 modules. Numerical is the exception: 3 hours, and every question is built
 * as a 2-mark theory block + an 8-mark algorithm block.
 *
 * NOT yet confirmed against the official exam notification for Nov 2026.
 */
const ENDSEM_2H: Omit<ExamMeta, "code"> = {
  minutes: 120,
  questionsPerModule: 1,
  marksTotal: 50,
  marksPerQuestion: 10,
  marksPerModule: 10,
  basis: "MO2022–MO2025 end-sem papers",
  confirmed: false,
};

const ENDSEM_3H: Omit<ExamMeta, "code"> = {
  minutes: 180,
  questionsPerModule: 1,
  marksTotal: 50,
  marksPerQuestion: 10,
  marksPerModule: 10,
  basis: "Numerical archive, MO2022/23/25 + SP2023/24/25",
  confirmed: false,
};

/* -------------------------------------------------------------------------- */
/* FLUID MECHANICS — ME24203                                                   */
/* -------------------------------------------------------------------------- */

const FM: SubjectTrackerConfig = {
  slug: "fm",
  name: "Fluid Mechanics",
  short: "FM",
  mode: "derive",
  modeLabel: "Derive on blank paper",
  diagnosis:
    "MO2023 midsem lost 6.5/25 with every part attempted: the relations were known, the reproductions were not. Two derivations scored zero while the applied part of the same question scored full marks.",
  exam: { code: "ME24203", ...ENDSEM_2H },
  topics: [
    // ---- Module 1: fluid statics -------------------------------------------
    {
      key: "fm.m1.t1",
      module: 1,
      title: "Continuum assumption, viscosity, surface tension, vapour pressure",
      tier: "B",
      kind: "recall",
      evidence: "Module 1 opener in every paper; definition-only, cheap marks.",
    },
    {
      key: "fm.m1.t2",
      module: 1,
      title: "Total pressure and centre of pressure on a plane surface",
      tier: "A",
      kind: "derive",
      evidence:
        "Repeated across MO2022–MO2025. Derives centre-of-pressure depth h* = h̄ + I_G/(h̄ A) directly from integration.",
      cue: "Derive h* from first principles, do not quote it.",
    },
    {
      key: "fm.m1.t3",
      module: 1,
      title: "Buoyancy and floatation with metacentric height GM = KB + BM − KG",
      tier: "A",
      kind: "derive",
      evidence:
        "Metacentre stability is the standard module-1 derivation and appears in most papers.",
      cue: "Reveal BM as the slope of the metacentric diagram, not as a given formula.",
    },
    {
      key: "fm.m1.t4",
      module: 1,
      title: "Pressure measurement: piezometer, U-tube, differential U-tube manometer",
      tier: "B",
      kind: "procedural",
      evidence: "Consistently asked as a numerical in module 1.",
    },
    // ---- Module 2: kinematics & dynamics ----------------------------------
    {
      key: "fm.m2.t1",
      module: 2,
      title: "Eulerian vs Lagrangian; streamline, pathline, streakline, stream tube",
      tier: "C",
      kind: "recall",
      evidence: "Definition cluster. One slide of recall covers the whole thing.",
    },
    {
      key: "fm.m2.t2",
      module: 2,
      title: "Classification of flows and equation of continuity from mass conservation",
      tier: "A",
      kind: "derive",
      evidence:
        "Continuity derivation is the single most reproduced module-2 derivation in the archive.",
      cue: "Start from a control volume and a mass balance, not from the final equation.",
    },
    {
      key: "fm.m2.t3",
      module: 2,
      title: "Navier–Stokes, Euler's equation, and Bernoulli along a streamline",
      tier: "A",
      kind: "derive",
      evidence:
        "Top-2 repeated 5-marker across the archive. Your derivation proficiency here is rated 2/5 — this is the highest-value single item in the subject.",
      cue: "Bernoulli = Euler's equation integrated with p/ρ + V²/2 + gz = const. Show the integration and the irrotational assumption separately.",
    },
    {
      key: "fm.m2.t4",
      module: 2,
      title: "Applications of Bernoulli: Pitot, Venturi, orifice, Torricelli",
      tier: "A",
      kind: "procedural",
      evidence:
        "Bernoulli's applications. MO2023 Q4(a) — the 2D continuity derivation scored 0/2 while you knew the answer, so this is a targeted repair item.",
    },
    // ---- Module 3: closed conduit flow ------------------------------------
    {
      key: "fm.m3.t1",
      module: 3,
      title: "Reynolds experiment and Darcy–Weisbach equation",
      tier: "A",
      kind: "derive",
      evidence: "Darcy–Weisbach appears in nearly every module-3 question.",
      cue: "Derive it from a differential momentum balance on a pipe element.",
    },
    {
      key: "fm.m3.t2",
      module: 3,
      title: "Minor losses, pipes in series and parallel, EGL–HGL",
      tier: "A",
      kind: "procedural",
      evidence: "Highest-frequency numerical in module 3.",
    },
    {
      key: "fm.m3.t3",
      module: 3,
      title: "Flow measurement: Pitot-static tube, Venturimeter, orifice meter",
      tier: "A",
      kind: "procedural",
      evidence: "Separate 5-marker in most papers; pure procedure, cheap once drilled.",
    },
    {
      key: "fm.m3.t4",
      module: 3,
      title: "Boundary layer, separation and its control",
      tier: "B",
      kind: "recall",
      evidence: "Theory-only module-3 closer; definition + diagram earns the marks.",
    },
    // ---- Module 4: hydraulic turbines -------------------------------------
    {
      key: "fm.m4.t1",
      module: 4,
      title: "Force of a jet on stationary and moving vanes, with velocity triangles",
      tier: "A",
      kind: "derive",
      evidence:
        "Recurring module-4 derivation. Runs on momentum-flux theory: force from rate of change of momentum.",
      cue: "Draw the triangle first, then write force = ṁ (V₂ − V₁).",
    },
    {
      key: "fm.m4.t2",
      module: 4,
      title: "Impulse vs reaction turbines; draft tube theory and its efficiency",
      tier: "A",
      kind: "derive",
      evidence: "Standard module-4 5-marker; draft-tube efficiency derivation.",
    },
    {
      key: "fm.m4.t3",
      module: 4,
      title: "Unit and specific quantities, similarity, governing and turbine selection",
      tier: "B",
      kind: "recall",
      evidence: "Definitions; low derivation load, safe blank-sheet insurance.",
    },
    // ---- Module 5: pumps ---------------------------------------------------
    {
      key: "fm.m5.t1",
      module: 5,
      title: "Centrifugal pump: manometric head and Euler's pump equation",
      tier: "A",
      kind: "derive",
      evidence: "Recurring; Euler equation plus manometric-head decomposition.",
      cue: "Derive Euler's equation from angular-momentum balance on the vane.",
    },
    {
      key: "fm.m5.t2",
      module: 5,
      title: "Specific speed, Stodola slip, pumps in series and parallel, NPSH",
      tier: "A",
      kind: "procedural",
      evidence: "Consistently the module-5 numerical in the archive.",
    },
    {
      key: "fm.m5.t3",
      module: 5,
      title: "Reciprocating pumps: slip and indicator diagrams",
      tier: "B",
      kind: "derive",
      evidence: "Slip derivation + indicator diagram; reliable fallback module-5 item.",
    },
  ],
  problems: [
    {
      key: "fm.p.cop",
      module: 2,
      title: "Two-dimensional continuity: ∂u/∂x + ∂v/∂y = 0",
      kind: "derive",
      pyqs: ["MO2023 MID"],
      evidence:
        "Scored 0/2 in your MO2023 midsem. Known the result, not the generator. This is the general form specialised by w = 0.",
      marks: 2,
    },
    {
      key: "fm.p.bcdp",
      module: 1,
      title: "Centre of pressure of a submerged plane lamina",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2024 P2"],
      evidence: "Repeated numerical.",
      marks: 10,
    },
    {
      key: "fm.p.dwc",
      module: 3,
      title: "Darcy–Weisbach head loss with minor losses in a pipe network",
      kind: "procedural",
      pyqs: ["MO2023 END", "MO2025 END"],
      evidence: "Highest-frequency fluid numerical.",
      marks: 10,
    },
    {
      key: "fm.p.venturi",
      module: 3,
      title: "Venturimeter / orifice discharge and head loss coefficient",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2024 P1"],
      evidence: "Repeated; Cd-based, heavily procedural.",
      marks: 10,
    },
    {
      key: "fm.p.rotordisc",
      module: 4,
      title: "Jet on moving curved vane: force, power, efficiency",
      kind: "procedural",
      pyqs: ["MO2023 END", "MO2024 P2"],
      evidence: "Repeated turbine numerical.",
      marks: 10,
    },
    {
      key: "fm.p.pendulum",
      module: 4,
      title: "Rotating-disc or pendulum-turbine performance with unit quantities",
      kind: "procedural",
      pyqs: ["MO2025 END"],
      evidence: "Module-4 variant.",
      marks: 10,
    },
    {
      key: "fm.p.pump",
      module: 5,
      title: "Centrifugal pump manometric head, power and efficiency; series/parallel",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2025 MID"],
      evidence: "Repeated pump numerical.",
      marks: 10,
    },
        {
          key: "fm.p.recip",
                    module: 5,
                    title: "Reciprocating pump with slip and indicator diagram",
                    kind: "procedural",
                    pyqs: ["MO2023 MID"],
                    evidence: "Fallback module-5 numerical.",
                    marks: 10,
                  },
                ],
                decks: [],
              };

/* -------------------------------------------------------------------------- */
/* STRENGTH OF MATERIALS — ME24205                                             */
/* -------------------------------------------------------------------------- */

const SOM: SubjectTrackerConfig = {
  slug: "som",
  name: "Strength of Materials",
  short: "SOM",
  mode: "derive",
  modeLabel: "Derive + construct diagrams",
  diagnosis:
    "Two-thirds of the paper is transformation equations and beam/diagram construction. These are procedurally fixed: the same integration, the same starting assumption, every year. Fluency beats insight here.",
  exam: { code: "ME24205", ...ENDSEM_2H },
  topics: [
    {
      key: "som.m1.t1",
      module: 1,
      title: "Stress transformation, principal stresses, Mohr's circle",
      tier: "A",
      kind: "derive",
      evidence: "Top-2 repeated 5-marker in the archive.",
      cue: "Build Mohr's circle from the stress element; do not start from the transformed equations.",
    },
    {
      key: "som.m1.t2",
      module: 1,
      title: "Strain transformation, principal strain, strain rosette",
      tier: "A",
      kind: "derive",
      evidence: "Pairs with the stress item as a recurring module-1 block.",
      cue: "Rosette: derive the relation used to extract ε₁, ε₂ from three measured directions.",
    },
    {
      key: "som.m2.t1",
      module: 2,
      title: "Shear force, bending moment and loading: dM/dx = V, dV/dx = −w",
      tier: "A",
      kind: "derive",
      evidence: "Required for every SFD/BMD question in the paper.",
      cue: "State the two differential relations and show they come from equilibrium.",
    },
    {
      key: "som.m2.t2",
      module: 2,
      title: "Second moment of area; parallel and perpendicular axes theorems",
      tier: "A",
      kind: "procedural",
      evidence:
        "Prerequisite for every bending-stress item and asked directly. The exam action is computing I for a given section, not reciting the theorem.",
      cue: "Compute I for the actual composite section from blank paper before touching the table.",
    },
    {
      key: "som.m2.t3",
      module: 2,
      title: "Bending stress σ = My/I and shear stress in beams",
      tier: "A",
      kind: "derive",
      evidence: "Recurring derivation; standard 5-marker.",
      cue: "Reveal σ = My/I from pure bending, not from flexure formula.",
    },
    {
      key: "som.m3.t1",
      module: 3,
      title: "Beam deflection: double integration and Macaulay's method",
      tier: "A",
      kind: "derive",
      evidence: "Recurring numerical with a fixed algorithm.",
      cue: "Macaulay brackets and the continuity/BC conditions — write the full bracket algebra.",
    },
    {
      key: "som.m3.t2",
      module: 3,
      title: "Moment-area method for deflection and slope",
      tier: "B",
      kind: "procedural",
      evidence: "Module-3 variant of the same skill.",
    },
    {
      key: "som.m3.t3",
      module: 3,
      title: "Torsion of circular shafts: torsion equation and polar modulus",
      tier: "A",
      kind: "derive",
      evidence: "Standard module-3 derivation, asked repeatedly.",
      cue: "Derive T/J = τ/r from the shear-strain compatibility, not from the formula.",
    },
    {
      key: "som.m4.t1",
      module: 4,
      title: "Euler's buckling load and rank of various columns",
      tier: "A",
      kind: "derive",
      evidence: "Recurring; the derivation is short and gets asked verbatim.",
      cue: "Euler load from the beam-column differential equation.",
    },
    {
      key: "som.m4.t2",
      module: 4,
      title: "Strain energy, Castigliano's theorem, energy methods",
      tier: "A",
      kind: "derive",
      evidence: "Castigliano appears as its own recurring 5-marker.",
      cue: "Castigliano = ∂U/∂P. Derive it from virtual work.",
    },
    {
      key: "som.m4.t3",
      module: 4,
      title: "Energy method applied to beams and thin circular ring",
      tier: "B",
      kind: "procedural",
      evidence: "Application form of the same theorem.",
    },
    {
      key: "som.m5.t1",
      module: 5,
      title: "Thin cylinders: hoop and radial stress, shrink fit",
      tier: "A",
      kind: "derive",
      evidence: "Recurring module-5 derivation.",
      cue: "Lamé's equation with thin-wall limit; include the shrink-fit contact pressure.",
    },
    {
      key: "som.m5.t2",
      module: 5,
      title: "Thick cylinders by Lamé's equations",
      tier: "B",
      kind: "derive",
      evidence: "Generalisation; asked less often than the thin case.",
    },
    {
      key: "som.m5.t3",
      module: 5,
      title: "Rotating disc of uniform thickness and uniform strength",
      tier: "B",
      kind: "derive",
      evidence: "Module-5 variant.",
    },
  ],
  problems: [
    {
      key: "som.p.stress",
      module: 1,
      title: "Stress at a point: principal stresses, max shear, Mohr's circle",
      kind: "derive",
      pyqs: ["MO2022 END", "MO2023 END", "MO2025 END"],
      evidence: "Appears in most papers.",
      marks: 10,
    },
    {
      key: "som.p.rosette",
      module: 1,
      title: "Strain rosette → principal strains and principal directions",
      kind: "procedural",
      pyqs: ["MO2023 MID", "MO2024 P1"],
      evidence: "Repeated module-1 numerical.",
      marks: 10,
    },
    {
      key: "som.p.sfd",
      module: 2,
      title: "SFD, BMD and point of contraflexure for a given loading",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2024 P2"],
      evidence: "The paper's most common opening numerical.",
      marks: 10,
    },
    {
      key: "som.p.deflect",
      module: 3,
      title: "Beam deflection by double integration / Macaulay",
      kind: "procedural",
      pyqs: ["MO2023 END", "MO2025 END"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "som.p.torsion",
      module: 3,
      title: "Shaft torsion: stress, angle of twist, power transmitted",
      kind: "procedural",
      pyqs: ["MO2022 MID", "MO2024 P1"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "som.p.buckle",
      module: 4,
      title: "Column buckling: Euler load with eccentric loading",
      kind: "procedural",
      pyqs: ["MO2023 MID", "MO2025 MID"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "som.p.castigliano",
      module: 4,
      title: "Deflection by Castigliano / strain energy",
      kind: "procedural",
      pyqs: ["MO2024 P2"],
      evidence: "Energy-method numerical.",
      marks: 10,
    },
    {
      key: "som.p.cylinder",
      module: 5,
      title: "Thick/thin cylinder stresses with shrink fit",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2023 END"],
      evidence: "Repeated.",
      marks: 10,
    },
  ],
  decks: [],
};

/* -------------------------------------------------------------------------- */
/* THERMODYNAMICS — ME24201                                                    */
/* -------------------------------------------------------------------------- */

const THERMO: SubjectTrackerConfig = {
  slug: "thermo",
  name: "Thermodynamics",
  short: "TH",
  mode: "connect",
  modeLabel: "Build the concept chain",
  diagnosis:
    "Failure mode is single-step recall, not knowledge. The marks sit in questions that need three concepts joined by a bridge equation. You cannot self-test that by rereading — you must produce the chain from a blank page.",
  exam: { code: "ME24201", ...ENDSEM_2H },
  topics: [
    {
      key: "thermo.m1.t1",
      module: 1,
      title: "System, control volume, state, process, cycle; point vs path function",
      tier: "C",
      kind: "recall",
      evidence: "Definitions. Cheap insurance; never lets a module-1 blank cost you 10 marks.",
    },
    {
      key: "thermo.m1.t2",
      module: 1,
      title: "Zeroth law, ideal gas equation, pure substance and phase; steam tables",
      tier: "B",
      kind: "recall",
      evidence: "Foundational; steam-table skill is separately exam-relevant.",
    },
    {
      key: "thermo.m1.t3",
      module: 1,
      title: "Heat vs work: thermodynamic definitions and comparison",
      tier: "B",
      kind: "recall",
      evidence: "Classic module-1 5-marker.",
    },
    {
      key: "thermo.m2.t1",
      module: 2,
      title: "First law for cyclic and non-cyclic processes; internal energy",
      tier: "A",
      kind: "derive",
      evidence: "Recurring; also the base of the SFEE chain.",
      cue: "ΔU = Q − W for a closed system. Derive, then state where each term comes from.",
    },
    {
      key: "thermo.m2.t2",
      module: 2,
      title: "Enthalpy and specific heats; relation cp − cv = R",
      tier: "A",
      kind: "derive",
      evidence: "Recurring; the bridge equation between modules 2 and 5.",
    },
    {
      key: "thermo.m2.t3",
      module: 2,
      title: "Steady flow energy equation and its device applications",
      tier: "A",
      kind: "derive",
      evidence:
        "Highest-value item in the subject. Boiler, turbine, pump, nozzle, heat exchanger.",
      cue: "SFEE per unit mass: h₁ + V₁²/2 + gz₁ + q = h₂ + V₂²/2 + gz₂ + w. Reproduce it, then state the device-specific reduction.",
    },
    {
      key: "thermo.m3.t1",
      module: 3,
      title: "Second law statements, Carnot cycle, Carnot theorems",
      tier: "A",
      kind: "derive",
      evidence: "Recurring module-3 block.",
      cue: "η_C = 1 − T₂/T₁ from the entropy balance on a reversible cycle.",
    },
    {
      key: "thermo.m3.t2",
      module: 3,
      title: "Reversibility, internal/external irreversibility, absolute temperature scale",
      tier: "B",
      kind: "recall",
      evidence: "Theory module-3 item.",
    },
    {
      key: "thermo.m4.t1",
      module: 4,
      title: "Clausius inequality → entropy → entropy balance and increase of entropy",
      tier: "A",
      kind: "derive",
      evidence: "The central module-4 derivation; appears repeatedly.",
      cue: "Clausius inequality ∮δQ/T ≤ 0, then entropy as a state function.",
    },
    {
      key: "thermo.m4.t2",
      module: 4,
      title: "Exergy change, exergy balance, second-law efficiency",
      tier: "A",
      kind: "procedural",
      evidence: "Recurring; needs entropy change from module 4 as its input.",
    },
    {
      key: "thermo.m5.t1",
      module: 5,
      title: "Maxwell relations from exact differentials of Gibbs/ Helmholtz free energy",
      tier: "A",
      kind: "derive",
      evidence: "Recurring 5-marker; pure derivation.",
      cue: "Write dG = −S dT + V dP and apply Schwarz to get every Maxwell relation from it.",
    },
    {
      key: "thermo.m5.t2",
      module: 5,
      title: "Clausius–Clapeyron, heat-capacity differences, Joule–Thomson coefficient",
      tier: "A",
      kind: "derive",
      evidence: "Recurring module-5 derivation chain.",
      cue: "Clausius–Clapeyron from dP/dT = h_fg/(T Δv); J–T from the general relation.",
    },
  ],
  problems: [
    {
      key: "thermo.p.firstlaw",
      module: 2,
      title: "Closed-system energy balance with ideal-gas property changes",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2023 MID"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "thermo.p.sfee",
      module: 2,
      title: "Nozzle / turbine / compressor / pump with SFEE and isentropic efficiency",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2023 END", "MO2024 P1", "MO2025 END"],
      evidence: "The most repeated numerical in the subject.",
      marks: 10,
    },
    {
      key: "thermo.p.carnot",
      module: 3,
      title: "Carnot cycle efficiency with reversible-heat-source framing",
      kind: "derive",
      pyqs: ["MO2023 MID", "MO2024 P2"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "thermo.p.entropy",
      module: 4,
      title: "Entropy change and entropy generation for a system and control volume",
      kind: "procedural",
      pyqs: ["MO2023 END", "MO2025 MID"],
      evidence: "Repeated; wants T ds integration and S_gen.",
      marks: 10,
    },
    {
      key: "thermo.p.exergy",
      module: 4,
      title: "Exergy of a closed system / exergy balance and second-law efficiency",
      kind: "procedural",
      pyqs: ["MO2024 P1", "MO2025 END"],
      evidence: "Repeated module-4 numerical.",
      marks: 10,
    },
    {
      key: "thermo.p.maxwell",
      module: 5,
      title: "Maxwell relations and Clausius–Clapeyron application",
      kind: "derive",
      pyqs: ["MO2022 MID", "MO2024 P2"],
      evidence: "Repeated.",
      marks: 10,
    },
  ],
  decks: [],
};

/* -------------------------------------------------------------------------- */
/* MATERIALS ENGINEERING — ME24202                                             */
/* -------------------------------------------------------------------------- */

const MATERIALS: SubjectTrackerConfig = {
  slug: "materials",
  name: "Materials Engineering",
  short: "MAT",
  mode: "recall",
  modeLabel: "Contrast drills, not derivations",
  diagnosis:
    "Marks are lost on `differentiate` and `explain with diagram` items. A keyword list does not earn the third mark — the examiner wants the contrasted pair stated on both sides. Drill pairs, not bullet points.",
  exam: { code: "ME24202", ...ENDSEM_2H },
  topics: [
    {
      key: "mat.m1.t1",
      module: 1,
      title: "Crystalline vs amorphous; seven crystal systems and their restrictions",
      tier: "B",
      kind: "recall",
      evidence: "Standard module-1 opener.",
    },
    {
      key: "mat.m1.t2",
      module: 1,
      title: "Miller indices for planes and directions, and families {hkl}/{uvw}",
      tier: "A",
      kind: "procedural",
      evidence: "Recurring; index computation is mechanical and worth drilling.",
    },
    {
      key: "mat.m1.t3",
      module: 1,
      title: "APF, coordination number and crystal structures (SC, BCC, FCC, HCP)",
      tier: "A",
      kind: "procedural",
      evidence: "Repeated numerical; pure computation.",
    },
    {
      key: "mat.m1.t4",
      module: 1,
      title: "Crystal defects: point, line, surface, volume",
      tier: "A",
      kind: "recall",
      evidence: "Recurring contrast item — see deck.",
    },
    {
      key: "mat.m2.t1",
      module: 2,
      title: "Gibbs phase rule and degrees of freedom",
      tier: "A",
      kind: "derive",
      evidence: "Recurring; derive F = C − P + 2.",
      cue: "Derive it from the variable count, do not quote it.",
    },
    {
      key: "mat.m2.t2",
      module: 2,
      title: "Lever rule; isomorphous, eutectic, peritectic, monotectic diagrams",
      tier: "A",
      kind: "procedural",
      evidence: "Repeated; lever-rule computations plus diagram interpretation.",
    },
    {
      key: "mat.m2.t3",
      module: 2,
      title: "Fe–Fe₃C diagram: microstructures of steels and cast irons",
      tier: "A",
      kind: "recall",
      evidence: "The single largest item in the subject; appears in every paper.",
    },
    {
      key: "mat.m3.t1",
      module: 3,
      title: "TTT and CCT transformation diagrams",
      tier: "A",
      kind: "recall",
      evidence: "Repeated; see deck — TTT vs CCT is the classic contrast.",
    },
    {
      key: "mat.m3.t2",
      module: 3,
      title: "Annealing, normalising, hardening, tempering, TMT, austempering, martempering",
      tier: "A",
      kind: "recall",
      evidence: "Highly repeated. Six processes, each needing purpose + temperature + microstructure.",
    },
    {
      key: "mat.m3.t3",
      module: 3,
      title: "Hardenability and the Jominy end-quench test",
      tier: "B",
      kind: "recall",
      evidence: "Module-3 closer.",
    },
    {
      key: "mat.m3.t4",
      module: 3,
      title: "Cold/hot working, strain hardening, recovery, recrystallisation, grain growth",
      tier: "A",
      kind: "recall",
      evidence: "Repeated; also appears as a module-4 question on forming.",
    },
    {
      key: "mat.m4.t1",
      module: 4,
      title: "Plain and alloy cast irons: grey, SGI, white, malleable",
      tier: "A",
      kind: "recall",
      evidence: "Repeated contrast set.",
    },
    {
      key: "mat.m4.t2",
      module: 4,
      title: "Stainless grades, maraging steels, superalloys; non-ferrous alloys",
      tier: "B",
      kind: "recall",
      evidence: "Grade–property–application recall.",
    },
    {
      key: "mat.m4.t3",
      module: 4,
      title: "Engineering ceramics and polymers: classification and properties",
      tier: "C",
      kind: "recall",
      evidence: "Least-repeated module in the archive; blank-sheet insurance.",
    },
    {
      key: "mat.m5.t1",
      module: 5,
      title: "Tension/compression test properties, hardness, friction and wear",
      tier: "B",
      kind: "recall",
      evidence: "Standard module-5 opener.",
    },
    {
      key: "mat.m5.t2",
      module: 5,
      title: "Fatigue, impact and creep — definitions, types, significance",
      tier: "A",
      kind: "recall",
      evidence: "Repeated contrast set.",
    },
    {
      key: "mat.m5.t3",
      module: 5,
      title: "Corrosion: types, conditions, laws, prevention",
      tier: "A",
      kind: "recall",
      evidence: "Repeated.",
    },
    {
      key: "mat.m5.t4",
      module: 5,
      title: "Case studies of engineering failures",
      tier: "C",
      kind: "connect",
      evidence: "Needs a chain from failure mode → mechanism → prevention, so a recall list is not enough.",
    },
  ],
  problems: [
    {
      key: "mat.p.unitcell",
      module: 1,
      title: "Number of atoms per unit cell / APF / theoretical density",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2023 END", "MO2025 MID"],
      evidence: "Most repeated numerical in the subject.",
      marks: 10,
    },
    {
      key: "mat.p.miller",
      module: 1,
      title: "Miller indices from a unit-cell figure, and interplanar spacing",
      kind: "procedural",
      pyqs: ["MO2023 MID", "MO2024 P1"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "mat.p.lever",
      module: 2,
      title: "Lever-rule phase fractions and hardness at a given composition",
      kind: "procedural",
      pyqs: ["MO2022 MID", "MO2024 P2"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "mat.p.phase",
      module: 2,
      title: "Degrees of freedom at a phase-diagram point using the phase rule",
      kind: "derive",
      pyqs: ["MO2023 MID"],
      evidence: "Phase-rule application.",
      marks: 10,
    },
    {
      key: "mat.p.ttt",
      module: 3,
      title: "Read TTT/CCT and identify critical cooling rate and resulting microstructure",
      kind: "procedural",
      pyqs: ["MO2023 END", "MO2025 END"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "mat.p.corr",
      module: 5,
      title: "Corrosion rate / environmental impact / prevention selection",
      kind: "connect",
      pyqs: ["MO2024 P1"],
      evidence: "Module-5 numerical or case question.",
      marks: 10,
    },
  ],
  decks: [
    {
      key: "mat.d.defects",
      module: 1,
      title: "Defect deck — point vs line vs surface vs volume",
      kind: "recall",
      evidence: "Standard `differentiate` question in module 1.",
      answerPoints: ["definition of each", "example of each", "effect on properties", "effect on each other"],
      pairs: [
        { a: "Vacancy / self-interstitial / substitutional", b: "—", contrast: "All point defects; substitutional changes the atom type, the other two do not." },
        { a: "Edge dislocation", b: "Screw dislocation", contrast: "Edge: extra half-plane; its Burgers vector is ⊥ to the line. Screw: helical; Burgers vector ∥ to the line." },
        { a: "Edge dislocation", b: "Screw dislocation", contrast: "An edge dislocation can glide by climb; a screw can cross-slip within a slip plane." },
        { a: "Grain boundary", b: "Twin boundary / stacking fault", contrast: "Grain boundary misorientation is large and general; special boundaries have specific misorientations." },
        { a: "Voids / inclusions / cracks", b: "—", contrast: "Volume defects; nucleate under solidification or fatigue." },
      ],
    },
    {
      key: "mat.d.ttc",
      module: 3,
      title: "TTT vs CCT deck",
      kind: "recall",
      evidence: "The most-asked `differentiate` in the subject.",
      answerPoints: ["what each shows", "how cooling is represented", "critical cooling rate", "resulting products"],
      pairs: [
        { a: "TTT diagram", b: "CCT diagram", contrast: "TTT holds temperature constant; CCT plots the full continuous cooling path, so it lies below and to the right of TTT." },
        { a: "TTT", b: "CCT", contrast: "CCT products are coarser/less favourable — pearlite and bainite start further right." },
        { a: "Martensite start Ms", b: "Martensite finish Mf", contrast: "Ms = temperature at which martensite begins; Mf = temperature at which the transformation is complete. Mf is usually below room temperature, so retained austenite remains." },
        { a: "Fine pearlite", b: "Coarse pearlite", contrast: "Faster cooling → finer interlamellar spacing → higher hardness." },
      ],
    },
    {
      key: "mat.d.ht",
      module: 3,
      title: "Heat-treatment deck",
      kind: "recall",
      evidence: "Six processes compared; repeated as a full 10-marker.",
      answerPoints: ["purpose", "heating temperature / austenitising range", "cooling medium", "resulting microstructure and properties"],
      pairs: [
        { a: "Annealing", b: "Normalising", contrast: "Anneal = slow furnace cooling → coarse pearlite, soft, stress relief, machinability. Normalise = air cooling → finer pearlite, harder, better toughness balance." },
        { a: "Annealing", b: "Normalising", contrast: "Normalising sits above the upper critical temperature with a deliberate higher cooling rate; annealing is below/near it." },
        { a: "Hardening (quench)", b: "Tempering", contrast: "Hardening = austenitise then quench → martensite, high hardness, high residual stress, brittle. Tempering reheats quenched steel below A₁ → toughness and stress relief at some loss of hardness." },
        { a: "Martempering", b: "Austempering", contrast: "Martempering quenches to just above Ms, holds to equalise, then cools to room → untempered martensite. Austempering holds between Ms and Mf to full bainite." },
        { a: "Spheroidising", b: "Annealing", contrast: "Spheroidising is a slow anneal near eutectoid prolonged to produce spheroidal cementite — the softest condition for cold forming." },
      ],
    },
    {
      key: "mat.d.castiron",
      module: 4,
      title: "Cast-iron deck",
      kind: "recall",
      evidence: "Repeated module-4 contrast question.",
      answerPoints: ["composition", "microstructure / graphite form", "mechanical property", "application"],
      pairs: [
        { a: "Grey cast iron", b: "White cast iron", contrast: "Grey: graphite flakes, good damping, brittle in tension, engine blocks. White: Fe₃C, very hard and wear-resistant, brittle, rolls." },
        { a: "Grey cast iron", b: "Spheroidal-graphite (ductile) iron", contrast: "SGI has spheroidal graphite — gives ductility and toughness while grey has no tensile ductility." },
        { a: "Malleable iron", b: "Ductile iron", contrast: "Malleable: graphite as temper-carbon rosettes from white iron; ductile: spheroidal graphite inoculated in the ladle." },
        { a: "Compacted graphite iron", b: "Grey cast iron", contrast: "CGI has short, thick, interconnected graphite — stiffness and thermal conductivity like grey, some ductility like ductile." },
      ],
    },
    {
      key: "mat.d.failure",
      module: 5,
      title: "Fatigue vs creep vs impact deck",
      kind: "recall",
      evidence: "Repeated module-5 contrast question.",
      answerPoints: ["loading regime", "temperature dependence", "failure appearance / test", "control measure"],
      pairs: [
        { a: "Fatigue", b: "Creep", contrast: "Fatigue is failure under repeated stress at any temperature, typically below yield; creep is time-dependent under sustained stress, significant only at high temperature." },
        { a: "Fatigue", b: "Impact", contrast: "Impact is a single rapid overload — ductile-to-brittle transition, tested by Charpy/Izod. Fatigue needs ≥10³ cycles." },
        { a: "Creep", b: "Stress rupture", contrast: "Creep is the three-stage time-dependent strain curve; stress rupture is the failure point on that curve, so rupture life < creep life." },
        { a: "Fatigue limit", b: "Endurance limit", contrast: "Fatigue limit is where S–N becomes horizontal; for steels it coincides with the endurance limit, for non-ferrous it does not." },
      ],
    },
    {
      key: "mat.d.phase",
      module: 2,
      title: "Phase rule vs lever rule deck",
      kind: "recall",
      evidence: "Classic `differentiate`; also prevents a straight-up confusion in module-2 problems.",
      answerPoints: ["what each states", "inputs required", "output", "when each applies"],
      pairs: [
        { a: "Gibbs phase rule", b: "Lever rule", contrast: "Phase rule gives the number of degrees of freedom — a topological statement. Lever rule gives the fraction of each phase — a quantitative one, needing a diagram and composition." },
        { a: "Eutectic reaction", b: "Eutectoid reaction", contrast: "Eutectic: liquid → two solids, on cooling. Eutectoid: one solid → two solids. The Fe–C system has both: 4.3% C and 0.76% C respectively." },
        { a: "Peritectic", b: "Monotectic", contrast: "Peritectic: liquid + one solid → another solid, on cooling. Monotectic: liquid → liquid + solid — a liquid-phase separation." },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* MANUFACTURING PROCESSES — ME24204                                            */
/* -------------------------------------------------------------------------- */

const MANUFACTURING: SubjectTrackerConfig = {
  slug: "manufacturing",
  name: "Manufacturing Processes",
  short: "MFG",
  mode: "recall",
  modeLabel: "Comparison drills + diagram recall",
  diagnosis:
    "Two-thirds of the Manufacturing PYQs are `differentiate` or `compare` items. That is the highest-ROI thing in the whole semester and it is pure recall — no derivation, no numericals. Do not let it be crowded out by Fluid and SOM.",
  exam: { code: "ME24204", ...ENDSEM_2H },
  topics: [
    { key: "mfg.m1.t1", module: 1, title: "Foundry processes and pattern types", tier: "B", kind: "recall", evidence: "Module-1 opener." },
    {
      key: "mfg.m1.t2",
      module: 1,
      title: "Pattern allowances — classification and which is additive",
      tier: "A",
      kind: "recall",
      evidence: "Repeated. The examiner wants the allowance and the reason, per allowance.",
    },
    {
      key: "mfg.m1.t3",
      module: 1,
      title: "Gating system components and their significance",
      tier: "A",
      kind: "recall",
      evidence: "Repeated; pure component-and-purpose recall.",
    },
    {
      key: "mfg.m1.t4",
      module: 1,
      title: "Centrifugal, hot-chamber and cold-chamber die casting, investment casting",
      tier: "B",
      kind: "recall",
      evidence: "Module-1 process comparison.",
    },
    {
      key: "mfg.m2.t1",
      module: 2,
      title: "Geometry of single-point cutting tools: rake, clearance, principal angles",
      tier: "A",
      kind: "recall",
      evidence: "Repeated; diagram-based recall.",
    },
    {
      key: "mfg.m2.t2",
      module: 2,
      title: "Orthogonal cutting: shear angle, shear strain, Merchant relation, forces",
      tier: "A",
      kind: "procedural",
      evidence: "Highest-value module-2 item; carries a numerical as well.",
    },
    {
      key: "mfg.m2.t3",
      module: 2,
      title: "Types of chips: continuous, discontinuous, built-up edge",
      tier: "A",
      kind: "recall",
      evidence: "Recurring contrast set.",
    },
    {
      key: "mfg.m2.t4",
      module: 2,
      title: "Tool failure, tool wear and tool life; Taylor's tool-life equation",
      tier: "A",
      kind: "procedural",
      evidence: "Recurring; includes the Taylor equation numerical.",
    },
    {
      key: "mfg.m2.t5",
      module: 2,
      title: "Cutting-tool materials — WC, CBN, ceramic, diamond",
      tier: "B",
      kind: "recall",
      evidence: "Grade–property–use recall.",
    },
    {
      key: "mfg.m3.t1",
      module: 3,
      title: "Lathe: parts, operations, workholding, cutting speed/feed/rpm",
      tier: "A",
      kind: "recall",
      evidence: "Repeated; the canonical machine-tools comparison.",
    },
    {
      key: "mfg.m3.t2",
      module: 3,
      title: "Shaper, milling and drilling machines — construction and operations",
      tier: "A",
      kind: "recall",
      evidence: "Repeated comparison item.",
    },
    {
      key: "mfg.m3.t3",
      module: 3,
      title: "Grinding: processes and types",
      tier: "B",
      kind: "recall",
      evidence: "Module-3 closer.",
    },
    {
      key: "mfg.m4.t1",
      module: 4,
      title: "Recovery, recrystallisation, grain growth; hot vs cold working",
      tier: "A",
      kind: "recall",
      evidence: "Repeated; also asked as a Materials question.",
    },
    {
      key: "mfg.m4.t2",
      module: 4,
      title: "Rolling: classification, mills, products, variables",
      tier: "B",
      kind: "recall",
      evidence: "Module-4 recall block.",
    },
    {
      key: "mfg.m4.t3",
      module: 4,
      title: "Forging: open-die vs closed-die; extrusion hot vs cold",
      tier: "A",
      kind: "recall",
      evidence: "Recurring contrast item.",
    },
    {
      key: "mfg.m4.t4",
      module: 4,
      title: "Sheet metal: blanking, piercing, deep drawing, bending",
      tier: "A",
      kind: "procedural",
      evidence: "Repeated; includes bending-force and drawing-ratio computations.",
    },
    {
      key: "mfg.m5.t1",
      module: 5,
      title: "Oxy-acetylene gas welding: principle and applications",
      tier: "B",
      kind: "recall",
      evidence: "Module-5 opener.",
    },
    {
      key: "mfg.m5.t2",
      module: 5,
      title: "Arc welding: MMAW/SMAW, SAW, GTAW, GMAW",
      tier: "A",
      kind: "recall",
      evidence: "Recurring 4-way comparison.",
    },
    {
      key: "mfg.m5.t3",
      module: 5,
      title: "Resistance welding: spot, seam, butt, projection; heat balance",
      tier: "A",
      kind: "recall",
      evidence: "Recurring.",
    },
    {
      key: "mfg.m5.t4",
      module: 5,
      title: "Soldering and brazing",
      tier: "C",
      kind: "recall",
      evidence: "Least-repeated; cheap closing insurance.",
    },
  ],
  problems: [
    {
      key: "mfg.p.orthogonal",
      module: 2,
      title: "Orthogonal cutting: shear angle, forces, specific energy, MRR",
      kind: "procedural",
      pyqs: ["MO2022 END", "MO2023 END", "MO2024 P1"],
      evidence: "The one Manufacturing numerical worth real practice time.",
      marks: 10,
    },
    {
      key: "mfg.p.toollife",
      module: 2,
      title: "Taylor's tool-life equation: life at a second cutting speed",
      kind: "procedural",
      pyqs: ["MO2025 END"],
      evidence: "Tool-life numerical.",
      marks: 10,
    },
    {
      key: "mfg.p.machinetools",
      module: 3,
      title: "Lathe / milling — cutting speed, rpm, feed, machining time",
      kind: "procedural",
      pyqs: ["MO2023 MID", "MO2024 P2"],
      evidence: "Machine-tools numerical.",
      marks: 10,
    },
    {
      key: "mfg.p.sheet",
      module: 4,
      title: "Bending force / sheet-metal blanking force / drawing ratio",
      kind: "procedural",
      pyqs: ["MO2022 MID"],
      evidence: "Forming numerical.",
      marks: 10,
    },
  ],
  decks: [
    {
      key: "mfg.d.machinetools",
      module: 3,
      title: "Machine-tools comparison deck — the highest-ROI deck in the subject",
      kind: "recall",
      evidence: "Machine tools are the most repeated comparison target in the PYQ set; comparison items dominate this paper overall.",
      answerPoints: ["working principle", "type (rotary / reciprocating / intermittent)", "cutting motion", "operations possible", "workholding", "typical accuracy and use"],
      pairs: [
        { a: "Lathe", b: "Shaper", contrast: "Lathe: work rotates, tool feeds (rotary motion). Shaper: tool reciprocates, work is fed (reciprocating cutting). This is the master distinction of the module." },
        { a: "Lathe", b: "Milling machine", contrast: "Lathe cuts with a single-point tool, constant cutting velocity because the work rotates. Milling uses a multi-tooth rotating cutter whose teeth see varying velocity." },
        { a: "Milling", b: "Drilling", contrast: "Milling removes material with a multi-tooth rotating cutter on a horizontal or vertical spindle; drilling uses a single-point twist drill, mainly for making holes." },
        { a: "Shaper", b: "Planer", contrast: "Both reciprocate the tool, but the planer is the larger machine with the work on a table between two columns; the shaper has the tool between columns." },
        { a: "Grinding", b: "Milling", contrast: "Grinding uses an abrasive wheel with very high peripheral speed and removes very small chips; it finishes hardened surfaces that milling cannot cut economically." },
      ],
    },
    {
      key: "mfg.d.casting",
      module: 1,
      title: "Casting processes + allowance deck",
      kind: "recall",
      evidence: "Repeated module-1 comparison questions.",
      answerPoints: ["pattern material and cost", "dimensional accuracy", "surface finish", "production quantity", "alloy/size limits"],
      pairs: [
        { a: "Sand casting", b: "Die casting", contrast: "Sand: pattern is destroyed and remade, low tooling cost, coarse finish, any size/alloy. Die: reusable steel die, high tooling cost, fine finish, high volume, light alloys only." },
        { a: "Hot-chamber die casting", b: "Cold-chamber die casting", contrast: "Hot chamber: molten metal in the gooseneck, low melting-point alloys (Zn, Sn, Pb), faster but gas entrapment risk. Cold chamber: pressure pushes molten metal in, used for high-melting-point alloys (Al, Mg, Cu)." },
        { a: "Investment casting", b: "Lost-wax (same process)", contrast: "Same process — wax model in a ceramic shell, wax melted out. Used for complex shapes, thin walls, turbine blades." },
        { a: "Centrifugal casting", b: "Sand casting", contrast: "Centrifugal uses rotational inertia against a mould wall — hollow castings with fine dense outer surface, less waste." },
        { a: "Shrinkage allowance", b: "Draft / taper allowance", contrast: "Shrinkage allowance compensates volumetric contraction on cooling (additive). Draft permits withdrawal of the pattern from the mould." },
        { a: "Machining allowance", b: "Shrinkage allowance", contrast: "Machining allowance is material left for finishing; shrinkage allowance compensates for solidification contraction." },
      ],
    },
    {
      key: "mfg.d.chips",
      module: 2,
      title: "Chip types + tool failure deck",
      kind: "recall",
      evidence: "Recurring module-2 contrasts.",
      answerPoints: ["chip/cause", "surface appearance", "effect on tool life", "control measure"],
      pairs: [
        { a: "Continuous chip", b: "Discontinuous chip", contrast: "Continuous from ductile material at low rake/high cutting speed. Discontinuous from brittle material at low speed/high rake — pieces break off." },
        { a: "Built-up edge (BUE)", b: "Built-up layer on the rake face", contrast: "BUE is a large built-up edge that periodically flakes, causing a poor surface finish; it results from high friction at low cutting speed/high rake." },
        { a: "Flank wear (abrasive)", b: "Crater wear (adhesive/diffusional)", contrast: "Flank wear is a flat vertical wear land from rubbing against the flank. Crater wear is a depression on the rake face from hot chips and diffusion/adhesion." },
        { a: "Tool wear", b: "Tool failure", contrast: "Wear is gradual; failure is sudden catastrophic breakage (chipping, fracturing). Taylor's equation models gradual wear." },
      ],
    },
    {
      key: "mfg.d.forging",
      module: 4,
      title: "Forming processes deck",
      kind: "recall",
      evidence: "Recurring module-4 comparisons.",
      answerPoints: ["tool constraint on the workpiece", "shape capability", "temperature regime", "tolerances", "typical products"],
      pairs: [
        { a: "Open-die forging", b: "Closed-die forging", contrast: "Open die: metal deforms freely between dies, no confinement, shape and accuracy depend on the operator's skill. Closed die: metal is confined, shape from the die, high accuracy, high tooling cost." },
        { a: "Hot working", b: "Cold working", contrast: "Hot: above recrystallisation, low flow stress, high ductility, no work hardening, low precision. Cold: below recrystallisation, flow stress and strength rise (work hardening), high precision." },
        { a: "Extrusion", b: "Rolling", contrast: "Extrusion pushes a billet through a die by compressive force — constant cross-section profiles. Rolling passes a slab between rolls to reduce thickness." },
        { a: "Blanking", b: "Piercing", contrast: "Blanking: the required part becomes the blank and the remainder is scrap. Piercing: the hole is the product and the original blank is the scrap." },
        { a: "Deep drawing", b: "Bending", contrast: "Deep drawing forms an open-ended cup by radial drawing of a blank in a die. Bending forms an angle between two straight flanges." },
      ],
    },
    {
      key: "mfg.d.welding",
      module: 5,
      title: "Welding processes deck",
      kind: "recall",
      evidence: "Recurring module-5 comparisons.",
      answerPoints: ["heat source / source of filler", "shielding", "position", "typical thickness", "advantages and limitations"],
      pairs: [
        { a: "MMAW/SMAW", b: "GMAW (MIG)", contrast: "MMAW: flux-coated consumable, smoke, spatter, positional, any thickness — structural/site work. GMAW: bare wire in shielding gas, faster, cleaner, thinner, automated." },
        { a: "MMAW/SMAW", b: "GTAW (TIG)", contrast: "GTAW: non-consumable tungsten electrode in inert gas, filler added separately, highest quality, thin sections, expensive, no site use." },
        { a: "SAW (submerged arc)", b: "MMAW/SMAW", contrast: "SAW: flux granules blanket the arc, very high deposition rate and penetration, automated flat/horizontal only, not suitable out of position." },
        { a: "Spot / seam / projection resistance welding", b: "Butt resistance welding", contrast: "Spot/seam/projection join overlapping sheets by electrodes pressed together. Butt flash-welding joins abutting edges and can weld much thicker sections." },
        { a: "Fusion welding", b: "Solid-state welding", contrast: "Fusion: base metal melts. Solid state (friction, diffusion, ultrasonic): no melting, used for dissimilar and non-ferrous combinations." },
        { a: "Brazing", b: "Soldering", contrast: "Brazing: filler melts above 450 °C, base metal does not. Soldering: filler melts below 450 °C. Different brazing filler = different joint strength." },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* NUMERICAL METHODS — MA24201                                                  */
/* -------------------------------------------------------------------------- */

const NUMERICAL: SubjectTrackerConfig = {
  slug: "numerical",
  name: "Numerical Methods",
  short: "NUM",
  mode: "procedural",
  modeLabel: "Algorithm drill, then timed paper",
  diagnosis:
    "Full syllabus empirically confirmed: 14 papers, 79 questions, and every Tier-A topic is supported by real papers with no unknowns. Each question is a 2-mark theory block plus an 8-mark algorithm block, so the marks are in procedure and iteration tables — not in insight.",
  exam: { code: "MA24201", ...ENDSEM_3H },
  topics: [
    {
      key: "num.m1.t1",
      module: 1,
      title: "Error types, sources and propagation",
      tier: "A",
      kind: "derive",
      evidence: "3 appearances across the 14-paper set.",
      cue: "Propagate through a function by differentiation, then combine by root-sum-of-squares or direct addition.",
    },
    {
      key: "num.m1.t2",
      module: 1,
      title: "Bisection and regula-falsi",
      tier: "A",
      kind: "procedural",
      evidence: "Bisection 3 appearances; regula-falsi pairs with it in the same question slot.",
    },
    {
      key: "num.m1.t3",
      module: 1,
      title: "Secant method and the general iterative scheme",
      tier: "B",
      kind: "procedural",
      evidence: "Appears alongside Newton-Raphson.",
    },
    {
      key: "num.m1.t4",
      module: 1,
      title: "Newton-Raphson method",
      tier: "A",
      kind: "procedural",
      evidence: "4 appearances. Derive the iteration from the linearisation, then tabulate.",
      cue: "f(xᵢ₊₁) = f(xᵢ) − f(xᵢ)f′(xᵢ)/f″(xᵢ). Show the derivation, then the iteration table.",
    },
    {
      key: "num.m2.t1",
      module: 2,
      title: "Gaussian elimination and Gauss-Jordan",
      tier: "A",
      kind: "procedural",
      evidence: "Gauss 4 appearances. Highest-value module-2 item.",
    },
    {
      key: "num.m2.t2",
      module: 2,
      title: "LU decomposition (Crout's method)",
      tier: "A",
      kind: "procedural",
      evidence: "4 appearances.",
    },
    {
      key: "num.m2.t3",
      module: 2,
      title: "Gauss-Jacobi and Gauss-Seidel iterative methods",
      tier: "A",
      kind: "procedural",
      evidence: "Gauss-Seidel 5 appearances — the single most repeated topic in the subject.",
      cue: "Drill Jacobi and Seidel as ONE family. They share the reordering step and differ only in the update rule; interleaving them is what makes the difference legible.",
    },
    {
      key: "num.m3.t1",
      module: 3,
      title: "Lagrange interpolation",
      tier: "A",
      kind: "procedural",
      evidence: "4 appearances.",
    },
    {
      key: "num.m3.t2",
      module: 3,
      title: "Newton's divided-difference interpolation",
      tier: "A",
      kind: "procedural",
      evidence: "Recurs with Lagrange in the same question slot.",
    },
    {
      key: "num.m3.t3",
      module: 3,
      title: "Newton forward and backward difference formulas (equally spaced)",
      tier: "B",
      kind: "procedural",
      evidence: "Appears when the data are equally spaced, usually with integration or differentiation.",
    },
    {
      key: "num.m4.t1",
      module: 4,
      title: "Differentiation using interpolation formulas",
      tier: "A",
      kind: "procedural",
      evidence: "Recurs with the forward/backward difference block.",
    },
    {
      key: "num.m4.t2",
      module: 4,
      title: "Trapezoidal rule",
      tier: "A",
      kind: "procedural",
      evidence: "Almost always paired with Simpson's rule in the same question.",
    },
    {
      key: "num.m4.t3",
      module: 4,
      title: "Simpson's one-third and three-eighth rules",
      tier: "A",
      kind: "procedural",
      evidence: "Simpson 1/3 has 4 appearances — the most repeated integration topic.",
      cue: "Know the panel-count condition: 1/3 needs an even number of intervals, 3/8 needs a multiple of three. Forgetting this is the usual source of lost marks.",
    },
    {
      key: "num.m5.t1",
      module: 5,
      title: "Euler's and modified Euler's methods",
      tier: "A",
      kind: "procedural",
      evidence: "Modified Euler 3 appearances.",
      cue: "Modified Euler = average of Euler's first and second estimates, so it carries the higher-order term.",
    },
    {
      key: "num.m5.t2",
      module: 5,
      title: "Runge-Kutta second order",
      tier: "B",
      kind: "procedural",
      evidence: "Appears as the stepping stone to RK4.",
    },
    {
      key: "num.m5.t3",
      module: 5,
      title: "Runge-Kutta fourth order",
      tier: "A",
      kind: "procedural",
      evidence: "5 appearances — tied with Gauss-Seidel for the most repeated topic in the subject. Highest single-item ROI.",
      cue: "Write k1–k4 and the update rule from memory in under two minutes; the paper is 3 hours for 5 questions, so procedure errors cost the most here.",
    },
  ],
  problems: [
    {
      key: "num.p.err",
      module: 1,
      title: "Error propagation and number of correct significant digits",
      kind: "procedural",
      pyqs: ["MO2023", "SP2024"],
      evidence: "Recurring.",
      marks: 10,
    },
    {
      key: "num.p.bisect",
      module: 1,
      title: "Root by bisection / regula-falsi / Newton-Raphson with iteration table",
      kind: "procedural",
      pyqs: ["MO2022", "MO2023", "MO2025"],
      evidence: "Highest-frequency module-1 numerical.",
      marks: 10,
    },
    {
      key: "num.p.gauss",
      module: 2,
      title: "Linear system by Gaussian elimination / Gauss-Jordan",
      kind: "procedural",
      pyqs: ["MO2022", "MO2023", "MO2025", "SP2023"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "num.p.lu",
      module: 2,
      title: "Linear system by LU decomposition (Crout)",
      kind: "procedural",
      pyqs: ["MO2023", "MO2025", "SP2024"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "num.p.jacobi",
      module: 2,
      title: "Gauss-Jacobi and Gauss-Seidel with convergence check",
      kind: "procedural",
      pyqs: ["MO2022", "MO2023", "MO2025", "SP2023", "SP2025"],
      evidence: "5 appearances — most repeated numerical in the subject.",
      marks: 10,
    },
    {
      key: "num.p.lagrange",
      module: 3,
      title: "Interpolation by Lagrange / divided differences, then evaluate",
      kind: "procedural",
      pyqs: ["MO2022", "MO2023", "MO2025", "SP2023"],
      evidence: "Repeated.",
      marks: 10,
    },
    {
      key: "num.p.diff",
      module: 4,
      title: "Numerical differentiation from an interpolation formula",
      kind: "procedural",
      pyqs: ["MO2023", "SP2024"],
      evidence: "Recurs with the difference block.",
      marks: 10,
    },
    {
      key: "num.p.simpson",
      module: 4,
      title: "Integration by trapezoidal / Simpson 1/3 / 3/8 with error estimate",
      kind: "procedural",
      pyqs: ["MO2022", "MO2023", "MO2025", "SP2023"],
      evidence: "4 appearances.",
      marks: 10,
    },
    {
      key: "num.p.ode",
      module: 5,
      title: "IVP by Euler / modified Euler / RK2 / RK4",
      kind: "procedural",
      pyqs: ["MO2022", "MO2023", "MO2025", "SP2023", "SP2025"],
      evidence: "5 appearances — most repeated numerical in module 5.",
      marks: 10,
    },
  ],
  decks: [],
};

/* -------------------------------------------------------------------------- */

export const TRACKER: Record<string, SubjectTrackerConfig> = {
  fm: FM,
  som: SOM,
  thermo: THERMO,
  materials: MATERIALS,
  manufacturing: MANUFACTURING,
  numerical: NUMERICAL,
};

export const TRACKER_ORDER = ["fm", "som", "thermo", "materials", "manufacturing", "numerical"] as const;

export function getTrackerConfig(slug: string | undefined): SubjectTrackerConfig | null {
  if (!slug) return null;
  return TRACKER[slug] ?? null;
}

/** All topic keys across all subjects — used to validate imported state. */
export function allTopicKeys(): Set<string> {
  const s = new Set<string>();
  for (const c of Object.values(TRACKER)) for (const t of c.topics) s.add(t.key);
  return s;
}

/**
 * Every problem key the store will accept: the hand-written `problems` in each
 * subject config, plus the textbook questions generated into the book bank.
 *
 * The book keys are part of the same state machine, so they must be validated
 * by the same gate. Before this, ticking a textbook row was rejected with
 * `Unknown problem key` because only the config array was enumerated.
 */
export function allProblemKeys(): Set<string> {
  const s = new Set<string>();
  for (const c of Object.values(TRACKER)) for (const p of c.problems) s.add(p.key);
  for (const k of allBookProblemKeys()) s.add(k);
  return s;
}

/** Study action for one topic — the thing to actually DO in the next hour. */
export function studyAction(
  kind: StudyKind,
  state: string,
): { verb: string; detail: string } {
  if (state === "flaky") {
    return {
      verb: "Repair",
      detail: "Marked flaky — re-derive it from a blank page and log where it broke.",
    };
  }
  switch (kind) {
    case "derive":
      return {
        verb: "Derive",
        detail:
          state === "unseen" || state === "read"
            ? "Reproduce the derivation on blank paper, from the governing equation, without notes. Log every gap."
            : "Re-derive cold, timed, then self-mark against the book.",
      };
    case "procedural":
      return {
        verb: "Execute",
        detail:
          state === "unseen" || state === "read"
            ? "Write the full procedure as a numbered algorithm, then run it once end to end without notes."
            : "Run it cold under the exam time budget. Procedure errors are what cost marks here.",
      };
    case "connect":
      return {
        verb: "Chain",
        detail:
          "Build the concept chain on blank paper — start condition → bridge equation → target — then apply it to the problem.",
      };
    case "recall":
      return {
        verb: "Contrast",
        detail:
          "State both sides of the pair out loud with the contrast sentence, then list the answer points an examiner would award.",
      };
    default:
      return { verb: "Study", detail: "" };
  }
}
