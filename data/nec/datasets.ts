export type NecRow = Record<string, string | number | null>;

export type NecDataset = {
  id: string;
  title: string;
  sourceHint: string; // where you'll paste from later (ex: "NEC Chapter 9")
  columns: { key: string; label: string; type?: "text" | "number" }[];
  rows: NecRow[];
};

export const NEC_DATASETS: NecDataset[] = [
  {
    id: "conduit-fill",
    title: "Conduit Fill (Placeholder)",
    sourceHint:
      "Paste your conduit fill tables here (trade size, conduit type, area, % fill, max conductors).",
    columns: [
      { key: "conduitType", label: "Conduit Type", type: "text" },
      { key: "tradeSize", label: "Trade Size", type: "text" },
      { key: "fillPct", label: "Fill %", type: "number" },
      { key: "areaIn2", label: "Area (in²)", type: "number" },
      { key: "notes", label: "Notes", type: "text" },
    ],
    rows: [
      {
        conduitType: "EMT",
        tradeSize: '1/2"',
        fillPct: 40,
        areaIn2: null,
        notes: "Placeholder row — replace with real values you’re licensed to use.",
      },
      {
        conduitType: "PVC Sch 40",
        tradeSize: '1"',
        fillPct: 40,
        areaIn2: null,
        notes: "Placeholder row — replace with real values you’re licensed to use.",
      },
    ],
  },
  {
    id: "ampacity",
    title: "Ampacity (Placeholder)",
    sourceHint:
      "Paste ampacity rows here (material, insulation temp rating, AWG/kcmil, amps).",
    columns: [
      { key: "material", label: "Material", type: "text" },
      { key: "tempC", label: "Temp (°C)", type: "number" },
      { key: "size", label: "Size", type: "text" },
      { key: "amps", label: "Amps", type: "number" },
      { key: "notes", label: "Notes", type: "text" },
    ],
    rows: [
      {
        material: "Copper",
        tempC: 75,
        size: "12 AWG",
        amps: null,
        notes: "Placeholder — paste real ampacity values later.",
      },
      {
        material: "Aluminum",
        tempC: 75,
        size: "1/0 AWG",
        amps: null,
        notes: "Placeholder — paste real ampacity values later.",
      },
    ],
  },
  {
    id: "ambient-correction",
    title: "Ambient Temp Correction (Placeholder)",
    sourceHint:
      "Paste ambient correction factors here (temp range, factor per insulation rating).",
    columns: [
      { key: "ambientC", label: "Ambient (°C)", type: "number" },
      { key: "ratingC", label: "Insulation (°C)", type: "number" },
      { key: "factor", label: "Factor", type: "number" },
      { key: "notes", label: "Notes", type: "text" },
    ],
    rows: [
      {
        ambientC: 40,
        ratingC: 75,
        factor: null,
        notes: "Placeholder — paste real correction factors later.",
      },
      {
        ambientC: 50,
        ratingC: 90,
        factor: null,
        notes: "Placeholder — paste real correction factors later.",
      },
    ],
  },
  {
    id: "conductor-adjustment",
    title: "Conductor Count Adjustment (Placeholder)",
    sourceHint:
      "Paste adjustment factors here (current-carrying conductors, factor).",
    columns: [
      { key: "cccRange", label: "CCC Range", type: "text" },
      { key: "factor", label: "Factor", type: "number" },
      { key: "notes", label: "Notes", type: "text" },
    ],
    rows: [
      { cccRange: "4–6", factor: null, notes: "Placeholder — paste later." },
      { cccRange: "7–9", factor: null, notes: "Placeholder — paste later." },
    ],
  },
];