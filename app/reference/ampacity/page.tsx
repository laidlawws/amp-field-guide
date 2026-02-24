"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type LocationType = "raceway" | "free_air";
type Material = "copper" | "aluminum";
type Insulation = 60 | 75 | 90;

// --- Ambient correction factors (based on 30°C) ---
// Ranges in °C: [min, max] inclusive
// Values align with commonly published NEC Table 310.15(B)(1) / former 310.15(B)(2)(a). :contentReference[oaicite:2]{index=2}
const AMBIENT_FACTORS: Record<Insulation, Array<{ min: number; max: number; factor: number }>> = {
  60: [
    { min: -50, max: 10, factor: 1.29 },
    { min: 11, max: 15, factor: 1.22 },
    { min: 16, max: 20, factor: 1.15 },
    { min: 21, max: 25, factor: 1.08 },
    { min: 26, max: 30, factor: 1.0 },
    { min: 31, max: 35, factor: 0.91 },
    { min: 36, max: 40, factor: 0.82 },
    { min: 41, max: 45, factor: 0.71 },
    { min: 46, max: 50, factor: 0.58 },
    { min: 51, max: 55, factor: 0.41 },
    // 60°C insulation has no factors shown above 55°C in the common table representation (---)
  ],
  75: [
    { min: -50, max: 10, factor: 1.2 },
    { min: 11, max: 15, factor: 1.15 },
    { min: 16, max: 20, factor: 1.11 },
    { min: 21, max: 25, factor: 1.05 },
    { min: 26, max: 30, factor: 1.0 },
    { min: 31, max: 35, factor: 0.94 },
    { min: 36, max: 40, factor: 0.88 },
    { min: 41, max: 45, factor: 0.82 },
    { min: 46, max: 50, factor: 0.75 },
    { min: 51, max: 55, factor: 0.67 },
    { min: 56, max: 60, factor: 0.58 },
    { min: 61, max: 65, factor: 0.47 },
    { min: 66, max: 70, factor: 0.33 },
    // 75°C insulation typically not shown above 70°C (---)
  ],
  90: [
    { min: -50, max: 10, factor: 1.15 },
    { min: 11, max: 15, factor: 1.12 },
    { min: 16, max: 20, factor: 1.08 },
    { min: 21, max: 25, factor: 1.04 },
    { min: 26, max: 30, factor: 1.0 },
    { min: 31, max: 35, factor: 0.96 },
    { min: 36, max: 40, factor: 0.91 },
    { min: 41, max: 45, factor: 0.87 },
    { min: 46, max: 50, factor: 0.82 },
    { min: 51, max: 55, factor: 0.76 },
    { min: 56, max: 60, factor: 0.71 },
    { min: 61, max: 65, factor: 0.65 },
    { min: 66, max: 70, factor: 0.58 },
    { min: 71, max: 75, factor: 0.50 },
    { min: 76, max: 80, factor: 0.41 },
    { min: 81, max: 85, factor: 0.29 },
    // Some references stop at 85°C for 90°C insulation.
  ],
};

function factorForAmbient(insul: Insulation, ambientC: number) {
  const rows = AMBIENT_FACTORS[insul];
  const row = rows.find((r) => ambientC >= r.min && ambientC <= r.max);
  return row?.factor ?? null;
}

// --- Base ampacity tables (30°C ambient, <=3 CCC) ---
// These values are widely published as NEC-derived tables (raceway/cable/earth ~ Table 310.16 / 310.15(B)(16); free air ~ 310.17). :contentReference[oaicite:3]{index=3}
//
// To keep this practical (and not massive), we include common sizes through 4/0 plus a few kcmil.
type SizeKey =
  | "14"
  | "12"
  | "10"
  | "8"
  | "6"
  | "4"
  | "3"
  | "2"
  | "1"
  | "1/0"
  | "2/0"
  | "3/0"
  | "4/0"
  | "250"
  | "300"
  | "350"
  | "400"
  | "500";

const SIZES: { key: SizeKey; label: string }[] = [
  { key: "14", label: "14 AWG" },
  { key: "12", label: "12 AWG" },
  { key: "10", label: "10 AWG" },
  { key: "8", label: "8 AWG" },
  { key: "6", label: "6 AWG" },
  { key: "4", label: "4 AWG" },
  { key: "3", label: "3 AWG" },
  { key: "2", label: "2 AWG" },
  { key: "1", label: "1 AWG" },
  { key: "1/0", label: "1/0 AWG" },
  { key: "2/0", label: "2/0 AWG" },
  { key: "3/0", label: "3/0 AWG" },
  { key: "4/0", label: "4/0 AWG" },
  { key: "250", label: "250 kcmil" },
  { key: "300", label: "300 kcmil" },
  { key: "350", label: "350 kcmil" },
  { key: "400", label: "400 kcmil" },
  { key: "500", label: "500 kcmil" },
];

type BaseAmpRow = Record<Insulation, number>; // {60: A, 75: A, 90: A}
type BaseAmpTable = Record<Material, Record<SizeKey, BaseAmpRow>>;

// Raceway/Cable/Earth (30°C)
const BASE_RACEWAY: BaseAmpTable = {
  copper: {
    "14": { 60: 20, 75: 20, 90: 25 },
    "12": { 60: 25, 75: 25, 90: 30 },
    "10": { 60: 30, 75: 35, 90: 40 },
    "8": { 60: 40, 75: 50, 90: 55 },
    "6": { 60: 55, 75: 65, 90: 75 },
    "4": { 60: 70, 75: 85, 90: 95 },
    "3": { 60: 80, 75: 100, 90: 110 },
    "2": { 60: 95, 75: 115, 90: 130 },
    "1": { 60: 110, 75: 130, 90: 150 },
    "1/0": { 60: 125, 75: 150, 90: 170 },
    "2/0": { 60: 145, 75: 175, 90: 195 },
    "3/0": { 60: 165, 75: 200, 90: 225 },
    "4/0": { 60: 195, 75: 230, 90: 260 },
    "250": { 60: 215, 75: 255, 90: 290 },
    "300": { 60: 240, 75: 285, 90: 320 },
    "350": { 60: 260, 75: 310, 90: 350 },
    "400": { 60: 280, 75: 335, 90: 380 },
    "500": { 60: 320, 75: 380, 90: 430 },
  },
  aluminum: {
    "14": { 60: 15, 75: 15, 90: 20 },
    "12": { 60: 20, 75: 20, 90: 25 },
    "10": { 60: 25, 75: 30, 90: 35 },
    "8": { 60: 35, 75: 40, 90: 45 },
    "6": { 60: 40, 75: 50, 90: 55 },
    "4": { 60: 55, 75: 65, 90: 75 },
    "3": { 60: 65, 75: 75, 90: 85 },
    "2": { 60: 75, 75: 90, 90: 100 },
    "1": { 60: 85, 75: 100, 90: 115 },
    "1/0": { 60: 100, 75: 120, 90: 135 },
    "2/0": { 60: 115, 75: 135, 90: 150 },
    "3/0": { 60: 130, 75: 155, 90: 175 },
    "4/0": { 60: 150, 75: 180, 90: 205 },
    "250": { 60: 170, 75: 205, 90: 230 },
    "300": { 60: 185, 75: 230, 90: 260 },
    "350": { 60: 205, 75: 250, 90: 280 },
    "400": { 60: 225, 75: 270, 90: 305 },
    "500": { 60: 260, 75: 310, 90: 350 },
  },
};

// Free air (30°C) – simplified/common set. (We can expand later.)
const BASE_FREE_AIR: BaseAmpTable = {
  copper: {
    "14": { 60: 25, 75: 30, 90: 35 },
    "12": { 60: 30, 75: 35, 90: 40 },
    "10": { 60: 40, 75: 45, 90: 55 },
    "8": { 60: 55, 75: 65, 90: 75 },
    "6": { 60: 75, 75: 85, 90: 100 },
    "4": { 60: 95, 75: 110, 90: 130 },
    "3": { 60: 110, 75: 130, 90: 150 },
    "2": { 60: 130, 75: 150, 90: 175 },
    "1": { 60: 150, 75: 175, 90: 200 },
    "1/0": { 60: 175, 75: 200, 90: 230 },
    "2/0": { 60: 200, 75: 230, 90: 265 },
    "3/0": { 60: 230, 75: 265, 90: 305 },
    "4/0": { 60: 260, 75: 300, 90: 345 },
    "250": { 60: 290, 75: 340, 90: 390 },
    "300": { 60: 320, 75: 375, 90: 430 },
    "350": { 60: 350, 75: 420, 90: 480 },
    "400": { 60: 380, 75: 455, 90: 520 },
    "500": { 60: 430, 75: 515, 90: 590 },
  },
  aluminum: {
    "14": { 60: 20, 75: 25, 90: 30 },
    "12": { 60: 25, 75: 30, 90: 35 },
    "10": { 60: 30, 75: 35, 90: 45 },
    "8": { 60: 45, 75: 50, 90: 60 },
    "6": { 60: 55, 75: 65, 90: 75 },
    "4": { 60: 75, 75: 85, 90: 100 },
    "3": { 60: 85, 75: 95, 90: 110 },
    "2": { 60: 100, 75: 115, 90: 135 },
    "1": { 60: 115, 75: 130, 90: 150 },
    "1/0": { 60: 135, 75: 150, 90: 175 },
    "2/0": { 60: 150, 75: 175, 90: 200 },
    "3/0": { 60: 175, 75: 200, 90: 230 },
    "4/0": { 60: 200, 75: 230, 90: 265 },
    "250": { 60: 225, 75: 260, 90: 300 },
    "300": { 60: 250, 75: 290, 90: 335 },
    "350": { 60: 270, 75: 315, 90: 365 },
    "400": { 60: 290, 75: 340, 90: 395 },
    "500": { 60: 335, 75: 390, 90: 450 },
  },
};

function getBaseTable(loc: LocationType) {
  return loc === "raceway" ? BASE_RACEWAY : BASE_FREE_AIR;
}

function fmt(n: number, unit: string, dp = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(dp)} ${unit}`;
}

export default function AmpacityCalculatorPage() {
  const [ambientC, setAmbientC] = useState("30");
  const [location, setLocation] = useState<LocationType>("raceway");
  const [material, setMaterial] = useState<Material>("copper");
  const [insulation, setInsulation] = useState<Insulation>(75);
  const [size, setSize] = useState<SizeKey>("12");

  const computed = useMemo(() => {
    const amb = Number(ambientC);
    if (!Number.isFinite(amb)) return { ok: false as const, msg: "Enter a valid ambient temperature (°C)." };

    const baseTable = getBaseTable(location);
    const base = baseTable[material][size]?.[insulation];

    if (!base) return { ok: false as const, msg: "No base ampacity found for that selection." };

    const factor = factorForAmbient(insulation, amb);
    if (factor == null) {
      return {
        ok: false as const,
        msg: `Ambient ${amb}°C is outside the supported correction ranges for ${insulation}°C insulation.`,
      };
    }

    const corrected = base * factor;

    return {
      ok: true as const,
      base,
      factor,
      corrected,
    };
  }, [ambientC, location, material, insulation, size]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Ampacity Calculator">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">Ambient air temperature (°C)</div>
            <input
              className="input"
              inputMode="decimal"
              value={ambientC}
              onChange={(e) => setAmbientC(e.target.value)}
              placeholder="e.g. 30"
            />
            <div className="text-xs text-[#4a2412]/70">
              Base tables assume 30°C; this applies the ambient correction factor.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Wire location</div>
            <select className="input" value={location} onChange={(e) => setLocation(e.target.value as LocationType)}>
              <option value="raceway">Raceway / Cable / Earth (direct buried)</option>
              <option value="free_air">Free air</option>
            </select>
            <div className="text-xs text-[#4a2412]/70">
              Raceway/Cable/Earth uses NEC-style “not more than 3 CCC” base values.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Conductor material</div>
            <select className="input" value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Insulation rating (°C)</div>
            <select
              className="input"
              value={insulation}
              onChange={(e) => setInsulation(Number(e.target.value) as Insulation)}
            >
              <option value={60}>60°C</option>
              <option value={75}>75°C</option>
              <option value={90}>90°C</option>
            </select>
            <div className="text-xs text-[#4a2412]/70">
              In real installs you must also respect termination ratings/equipment limits.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Wire size (AWG / kcmil)</div>
            <select className="input" value={size} onChange={(e) => setSize(e.target.value as SizeKey)}>
              {SIZES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm text-[#4a2412]/70">Output</div>
            {!computed.ok ? (
              <div className="mt-2 text-sm font-semibold text-[#4a2412]/80">{computed.msg}</div>
            ) : (
              <div className="space-y-2 mt-2">
                <div className="text-sm">
                  Base ampacity @30°C: <b>{fmt(computed.base, "A", 0)}</b>
                </div>
                <div className="text-sm">
                  Ambient factor: <b>{computed.factor.toFixed(2)}</b>
                </div>
                <div className="text-lg font-extrabold text-[#f26422]">
                  Corrected ampacity: {fmt(computed.corrected, "A", 0)}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-3 text-xs text-[#4a2412]/70 leading-5">
            Assumes not more than three current-carrying conductors, 30°C base tables, and applies only ambient correction.
            If you want: (1) “# of CCC” adjustment factors, (2) rooftop/sunlight adder, or (3) a warning for small conductor OCPD limits (14/12/10), tell me and I’ll add it.
          </div>
        </div>
      </Card>
    </div>
  );
}