import fmRaw from "../content/fm.html?raw";
import somRaw from "../content/som.html?raw";
import thermoRaw from "../content/thermo.html?raw";
import { splitSubject, type SubjectContent } from "./subject-split";

export interface SyllabusModule {
  num: number;
  name: string;
  topics: string[];
}

export interface Subject {
  slug: "fm" | "som" | "thermo";
  name: string;
  short: string;
  code: string;
  navKey: string;
  description: string;
  content: SubjectContent;
  syllabus: SyllabusModule[];
  paperCount: number;
  progress: number;
  /** R2 key of the accompanying textbook PDF, served via /api/file. */
  bookFile?: string;
}

/* Module names + topics transcribed from the official syllabus PDFs
   (syllabus/*.pdf) — NOT from PYQ CO tags. */

const FM_SYLLABUS: SyllabusModule[] = [
  {
    num: 1,
    name: "Fluid statics",
    topics: [
      "Concept of continuum and physical properties of fluids, specific gravity, viscosity, surface tension, vapor pressure",
      "Total pressure and centre of pressure, buoyancy and meta-centre",
      "Measurement of pressure — piezometer, U-tube and differential tube manometers",
    ],
  },
  {
    num: 2,
    name: "Fluid kinematics & fluid dynamics",
    topics: [
      "Eulerian and Lagrangian description of fluid flow; streamline, path line and streak lines and stream tube",
      "Classification of fluid flows — steady & unsteady, uniform & non-uniform, laminar & turbulent, rotational & irrotational flows; equation of continuity",
      "Navier–Stokes equation; surface and body forces — Euler's and Bernoulli's equations for flow along a streamline, and its applications",
    ],
  },
  {
    num: 3,
    name: "Closed conduit flow",
    topics: [
      "Reynolds' experiment — Darcy–Weisbach equation; minor and major losses in pipes; pipes in series and in parallel; total energy line — hydraulic gradient line",
      "Measurement of flow — pitot-static tube, venturimeter, orifice meter",
      "Concept of boundary layer, separation of boundary layer and its control",
    ],
  },
  {
    num: 4,
    name: "Hydraulic turbines",
    topics: [
      "Hydrodynamic force of jets on stationary and moving vanes; velocity diagrams, work done and efficiency",
      "Classification of turbines, impulse and reaction turbines, working proportions, work done, efficiencies, draft tube theory, functions and efficiency",
      "Performance of hydraulic turbines, geometric similarity, unit and specific quantities, governing of turbines, selection of type of turbine",
    ],
  },
  {
    num: 5,
    name: "Centrifugal pumps",
    topics: [
      "Classification, working, work done, manometric head, losses and efficiencies, specific speed, pumps in series and parallel, Stodola slip, performance characteristic curves, NPSH, model studies",
      "Reciprocating pumps — working, discharge, slip, indicator diagrams",
    ],
  },
];

const SOM_SYLLABUS: SyllabusModule[] = [
  {
    num: 1,
    name: "Stress at a point",
    topics: [
      "Stress at a point on a plane, stress transformation equation, principal stresses, Mohr's circle of stresses",
      "Strain transformation equation, principal strain, strain rosette",
    ],
  },
  {
    num: 2,
    name: "Types of beams, bending & shear",
    topics: [
      "Types of beams, types of loading and support",
      "Relationship between shear force, bending moment and intensity of loading; SFD, BMD, point of contraflexure",
      "Second moment of area, parallel axes theorem",
      "Bending stress and shear stress in beams",
    ],
  },
  {
    num: 3,
    name: "Deflection of beams & torsion",
    topics: [
      "Deflection of beams — double integration method, Macaulay's method, moment area method",
      "Torsion of circular shafts",
    ],
  },
  {
    num: 4,
    name: "Buckling of columns & strain energy",
    topics: [
      "Buckling of columns",
      "Strain energy method, Castigliano's theorem, application of energy method on different types of beams and thin circular ring",
    ],
  },
  {
    num: 5,
    name: "Thin and thick cylinders",
    topics: [
      "Thin and thick cylinders — radial and circumferential stresses, stresses produced due to shrink fit",
      "Rotating disc — stresses in disc of uniform thickness and uniform strength",
    ],
  },
];

const THERMO_SYLLABUS: SyllabusModule[] = [
  {
    num: 1,
    name: "Introduction — fundamental concepts",
    topics: [
      "Macroscopic versus microscopic point of view; definitions of system and surrounding; concept of control volume; thermodynamic state, processes and cycles; point function and path function; quasi-static process; simple compressible substances; dimensions and units; thermodynamic equilibrium",
      "Zeroth law; ideal gas equation; pure substance and phase; thermodynamic properties and use of steam tables",
      "Thermodynamic definition of work; work done at the moving boundary of a system and other systems; definition of heat; comparison of heat and work",
    ],
  },
  {
    num: 2,
    name: "First law of thermodynamics",
    topics: [
      "First law referred to cyclic and non-cyclic processes; concept of internal energy of a system; conservation of energy for simple compressible closed systems",
      "Definitions of enthalpy and specific heats",
      "First law applied to a control volume; general energy equation; steady flow energy equation on unit mass and time basis; application of SFEE for devices such as boiler, turbine, heat exchangers, pumps, nozzles, etc.",
    ],
  },
  {
    num: 3,
    name: "Second law of thermodynamics",
    topics: [
      "Limitations of the first law; concept of a heat engine, heat pump, refrigerator; statements of the second law and their equivalence; Carnot cycle, reversible heat engine, Carnot theorems and corollaries",
      "Concept of reversibility; internal and external irreversibility; absolute thermodynamic temperature scale",
    ],
  },
  {
    num: 4,
    name: "Entropy & exergy",
    topics: [
      "Clausius inequality, entropy, change in entropy in various thermodynamic processes, entropy balance for closed and open systems, principle of increase in entropy, entropy generation",
      "Concept of reversible work and irreversibility, second law efficiency; exergy change of a system — closed and open systems; exergy balance equation",
    ],
  },
  {
    num: 5,
    name: "Thermodynamic property relations",
    topics: [
      "Maxwell relations, Clausius–Clapeyron equation, difference in heat capacities, ratio of heat capacities, Joule–Thomson coefficient",
    ],
  },
];

export const SUBJECTS: Record<string, Subject> = {
  fm: {
    slug: "fm",
    name: "Fluid Mechanics",
    short: "FM",
    code: "ME24203",
    navKey: "fm",
    description:
      "ME24203 (earlier ME203) · Complete study kit: syllabus from the official PDF, derivation-first notes with Bansal book questions, and every previous year paper from MO 2022 to MO 2025.",
    content: splitSubject(fmRaw),
    syllabus: FM_SYLLABUS,
    paperCount: 8,
    progress: 100,
    bookFile:
      "books/A Textbook of Fluid Mechanics and Hydraulic Machines -- R_ K_ Bansal -- 2015 -- 60f04ab2c51ecf7b3ece341cdc19c622 -- Anna\u2019s Archive.pdf",
  },
  som: {
    slug: "som",
    name: "Strength of Materials",
    short: "SOM",
    code: "ME24205",
    navKey: "som",
    description:
      "ME24205 (earlier ME205) · Complete study kit written from the actual BIT Mesra papers: every module, the derivations that keep appearing, worked numericals, and all previous year papers from MO 2022 to MO 2025.",
    content: splitSubject(somRaw),
    syllabus: SOM_SYLLABUS,
    paperCount: 8,
    progress: 100,
    bookFile:
      "books/Strength of Materials -- Andrew Pytel, Ferdinand Leon Singer -- 4th ed_, New York, New York State, 1987 -- HarperCollins Publishers  - Copy.pdf",
  },
  thermo: {
    slug: "thermo",
    name: "Thermodynamics",
    short: "TH",
    code: "ME24201",
    navKey: "thermo",
    description:
      "ME24201 (earlier ME201) · Complete study kit: official syllabus, derivation-first notes, and every previous year paper from MO 2022 to MO 2025.",
    content: splitSubject(thermoRaw),
    syllabus: THERMO_SYLLABUS,
    paperCount: 7,
    progress: 72,
  },
};

export function getSubject(slug: string | undefined): Subject | null {
  if (!slug) return null;
  return SUBJECTS[slug] ?? null;
}

export function getSubjects(): Subject[] {
 
  return Object.values(SUBJECTS);
}

export function getModule(subject: Subject, id: number): SubjectContent["modules"][number] | null {
  return subject.content.modules.find((m) => m.id === id) ?? null;
}