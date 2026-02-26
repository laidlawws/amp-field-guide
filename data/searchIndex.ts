export type SearchItem = {
  title: string;
  summary: string;
  href: string;
  tags?: string[];
};

export const SEARCH_INDEX: SearchItem[] = [

  // ===== Calculators =====

  {
    title: "Ohm’s Law Chart",
    summary: "Visual wheel + interactive solver paths.",
    href: "/reference/ohms-chart",
    tags: ["ohms", "voltage", "current", "resistance", "wheel", "v=i*r"]
  },

  {
    title: "Power Calculator",
    summary: "Solve for Voltage, Current, kW, kVA, HP, PF, efficiency.",
    href: "/calculators/power",
    tags: ["power", "watts", "kilowatts", "kva", "horsepower", "pf"]
  },

  {
    title: "Voltage Drop",
    summary: "Single & three-phase voltage drop calculator.",
    href: "/calculators/voltage-drop",
    tags: ["voltage drop", "vd", "wire length", "conductor", "copper", "aluminum"]
  },

  {
    title: "Capacitance / Inductance / Reactance",
    summary: "Solve for C, L, Xc, Xl, or frequency using 2πf formulas.",
    href: "/calculators/reactance",
    tags: [
      "capacitance",
      "inductance",
      "reactance",
      "capacitor",
      "inductor",
      "xc",
      "xl",
      "frequency",
      "2pi",
      "impedance"
    ]
  },

  {
    title: "Transformer Tools",
    summary: "Impedance, fault current, FLC, sizing, and buck/boost.",
    href: "/calculators/transformers",
    tags: ["transformer", "kva", "impedance", "fault current", "flc", "buck boost"]
  },


  // ===== Reference Pages =====

  {
    title: "Conduit Bending",
    summary: "Multipliers, offsets, saddles, stub-ups.",
    href: "/reference/conduit",
    tags: ["conduit", "bending", "offset", "multiplier"]
  },

  {
    title: "Conduit Fill",
    summary: "NEC-based fill workflow + quick estimator.",
    href: "/reference/fill",
    tags: ["conduit fill", "chapter 9", "nec"]
  },

  {
    title: "Ampacity",
    summary: "Ambient correction + conductor sizing workflow.",
    href: "/reference/ampacity",
    tags: ["ampacity", "310", "correction", "adjustment"]
  },

  {
    title: "Box Fill",
    summary: "NEC 314.16 box fill calculator.",
    href: "/reference/box-fill",
    tags: ["box fill", "314.16"]
  },

  {
    title: "NEC Tables",
    summary: "Searchable NEC reference tables.",
    href: "/reference/tables",
    tags: ["nec", "tables", "chapter 9", "310"]
  },

  {
    title: "Material Properties",
    summary: "Metal properties: SG, melting point, IACS, density.",
    href: "/reference/material-properties",
    tags: ["materials", "metals", "density", "iacs", "conductivity"]
  }

];