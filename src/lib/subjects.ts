import fmRaw from "../content/fm.html?raw";
import somRaw from "../content/som.html?raw";
import thermoRaw from "../content/thermo.html?raw";
import materialsRaw from "../content/materials.html?raw";
import manufacturingRaw from "../content/manufacturing.html?raw";
import numericalRaw from "../content/numerical.html?raw";
import { splitSubject, type SubjectContent } from "./subject-split";

export interface SyllabusModule {
  num: number;
  name: string;
  topics: string[];
}

export interface Subject {
  slug: "fm" | "som" | "thermo" | "materials" | "manufacturing" | "numerical";
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

const MATERIALS_SYLLABUS: SyllabusModule[] = [
  {
    num: 1,
    name: "Introduction to materials & crystallography",
    topics: [
      "Classification of engineering solids and their properties; crystalline vs non-crystalline structure",
      "Crystallography — space lattice, unit cell, crystal systems; elemental and compound crystal structures",
      "Indexing of directions and planes (Miller indices); influence of crystal structure on properties",
      "Crystal defects (point, line, surface, volume); solid solutions; solidification of pure metals and alloys",
      "Metallography — sample preparation, optical microscopy, microstructure interpretation; characterization techniques",
    ],
  },
  {
    num: 2,
    name: "Phase diagrams & the Fe–C system",
    topics: [
      "Thermodynamics of solids — phase, component, Gibbs and Helmholtz free energy",
      "Gibbs phase rule and degrees of freedom; invariant and non-invariant transformations",
      "Binary phase diagrams — isomorphous, eutectic, peritectic, monotectic systems; lever rule",
      "Iron–carbon (iron–cementite) equilibrium diagram; steels and cast irons — microstructures and classification",
      "Effect of alloying elements on steel; alloy steels; important non-ferrous alloys; strengthening mechanisms",
    ],
  },
  {
    num: 3,
    name: "Transformation curves & heat treatment",
    topics: [
      "Kinetics of phase transformation — diffusion and shear mechanisms",
      "Isothermal (TTT) and continuous-cooling (CCT) transformation diagrams for steel",
      "Heat treatment of steel — annealing, normalizing, hardening, tempering; special treatments (TMT, austempering, martempering)",
      "Hardenability and the Jominy end-quench test; mechanism of hardening",
      "Cold and hot working; strain hardening; recovery, recrystallization and grain growth",
      "Surface and case hardening; quenching media and stages; heat-treatment defects and remedies",
    ],
  },
  {
    num: 4,
    name: "Types of alloys & applications",
    topics: [
      "Plain and alloyed cast irons — grey, spheroidal-graphite, white, malleable: composition, microstructure, applications",
      "Non-ferrous alloys — aluminium, copper, lead, zinc, titanium, magnesium and nickel based",
      "Stainless steels, maraging steels and superalloys — grades, heat treatment, applications",
      "Engineering ceramics — classification, fabrication and properties; refractory, glass, cutting-tool ceramics",
      "Engineering polymers — synthesis, structure, properties and applications",
    ],
  },
  {
    num: 5,
    name: "Material testing methods",
    topics: [
      "Mechanical properties under tension and compression; hardness and friction; wear — definition and types",
      "Fatigue, impact and creep — definitions, types and significance; combinations of properties and testing",
      "Functional properties — thermal/electrical conductivity, magnetism, surface energy, wetting",
      "Corrosion and oxidation — types, conditions, laws, thermodynamics, kinetics and prevention",
      "Case studies of engineering failures — stress, wear, erosion, fatigue, thermal cycles, corrosion, creep",
    ],
  },
];

const MANUFACTURING_SYLLABUS: SyllabusModule[] = [
  {
    num: 1,
    name: "Casting",
    topics: [
      "Introduction to foundry processes and their importance",
      "Sand casting — patterns, pattern allowances, gating system components and their significance",
      "Centrifugal casting; hot-chamber and cold-chamber die casting; investment casting",
    ],
  },
  {
    num: 2,
    name: "Theory of metal cutting",
    topics: [
      "Geometry of single-point cutting tools",
      "Introduction to orthogonal cutting; tool forces in orthogonal cutting",
      "Types of chips; tool failure and tool life; cutting tool materials",
    ],
  },
  {
    num: 3,
    name: "Machine tools",
    topics: [
      "Construction, operations and specifications of lathe and shaper",
      "Construction, operations and specifications of milling and drilling machines",
      "Introduction to grinding and types of grinding processes",
    ],
  },
  {
    num: 4,
    name: "Metal deformation processes",
    topics: [
      "Recovery, recrystallization and grain growth; hot working vs cold working",
      "Rolling — classification, rolling mills, products and main variables",
      "Forging — open-die and closed-die operations; extrusion — hot and cold processes",
      "Sheet-metal forming — blanking and piercing, deep drawing, bending",
    ],
  },
  {
    num: 5,
    name: "Welding",
    topics: [
      "Principle, working and applications of oxy-acetylene gas welding",
      "Electric arc welding — MMAW/SMAW, SAW, GTAW and GMAW",
      "Resistance welding; soldering and brazing",
    ],
  },
];

const NUMERICAL_SYLLABUS: SyllabusModule[] = [
  {
    num: 1,
    name: "Errors & nonlinear equations",
    topics: [
      "Types and sources of errors; propagation of errors",
      "Bisection method; regula-falsi method; secant method",
      "Newton–Raphson method and its variants; general iterative method",
    ],
  },
  {
    num: 2,
    name: "System of linear equations",
    topics: [
      "Gaussian elimination and Gauss–Jordan methods",
      "LU decomposition (Crout's method)",
      "Gauss–Jacobi and Gauss–Seidel iterative methods",
    ],
  },
  {
    num: 3,
    name: "Interpolation",
    topics: [
      "Lagrange interpolation",
      "Newton's divided-difference interpolation formula",
      "Interpolating polynomials using Newton's forward and backward differences",
    ],
  },
  {
    num: 4,
    name: "Differentiation & integration",
    topics: [
      "Differentiation using interpolation formulas",
      "Newton–Cotes integration formulas — trapezoidal rule",
      "Simpson's one-third and three-eighth rules",
    ],
  },
  {
    num: 5,
    name: "Ordinary differential equations",
    topics: [
      "Euler's method and modified Euler's method",
      "Runge–Kutta methods of second order",
      "Runge–Kutta fourth-order method for initial-value problems",
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
    progress: 100,
  },
  materials: {
    slug: "materials",
    name: "Materials Engineering",
    short: "MAT",
    code: "ME24202",
    navKey: "materials",
    description:
      "Materials Engineering · Complete study kit from the official BIT Mesra syllabus: crystallography, phase diagrams, heat treatment, alloys and material testing — with exam definitions and formula plates.",
    content: splitSubject(materialsRaw),
    syllabus: MATERIALS_SYLLABUS,
    paperCount: 8,
    progress: 100,
  },
  manufacturing: {
    slug: "manufacturing",
    name: "Manufacturing Processes",
    short: "MFG",
    code: "ME24204",
    navKey: "manufacturing",
    description:
      "Manufacturing Processes · Complete study kit from the official BIT Mesra syllabus: casting, metal cutting, machine tools, forming and welding — with exam definitions and formula plates.",
    content: splitSubject(manufacturingRaw),
    syllabus: MANUFACTURING_SYLLABUS,
    paperCount: 7,
    progress: 100,
  },
  numerical: {
    slug: "numerical",
    name: "Numerical Methods",
    short: "NUM",
    code: "MA24201",
    navKey: "numerical",
    description:
      "Numerical Methods · Complete study kit from the official BIT Mesra syllabus: root-finding, linear systems, interpolation, integration and ODEs — with worked algorithms and formula plates.",
    content: splitSubject(numericalRaw),
    syllabus: NUMERICAL_SYLLABUS,
    paperCount: 7,
    progress: 100,
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