"use client";

import React, { useMemo, useState } from "react";

type CategoryKey =
  | "length"
  | "area"
  | "volume"
  | "mass"
  | "force"
  | "pressure"
  | "energy"
  | "power"
  | "temperature";

type UnitDef = {
  key: string;
  label: string;
  // Convert to/from a base unit for the category (except temperature which uses functions)
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
};

function isFiniteNumber(x: any) {
  return typeof x === "number" && Number.isFinite(x);
}

function parseNum(s: string) {
  const v = Number(String(s).replace(/,/g, "").trim());
  return Number.isFinite(v) ? v : NaN;
}

function fmt(v: number, digits = 6) {
  if (!Number.isFinite(v)) return "—";
  // Trim trailing zeros
  const s = v.toFixed(digits);
  return s.replace(/\.?0+$/, "");
}

/* =========================
   Reference Tables
========================= */

const weightsMeasures = [
  { left: "1 in", right: "25.4 mm" },
  { left: "1 ft", right: "0.3048 m" },
  { left: "1 yd", right: "0.9144 m" },
  { left: "1 mile", right: "1.609344 km" },
  { left: "1 oz (avoirdupois)", right: "28.3495 g" },
  { left: "1 lb", right: "0.45359237 kg" },
  { left: "1 US gallon", right: "3.78541 L" },
  { left: "1 US quart", right: "0.946353 L" },
  { left: "1 US pint", right: "0.473176 L" },
  { left: "1 US fluid oz", right: "29.5735 mL" },
  { left: "1 psi", right: "6.89476 kPa" },
  { left: "1 bar", right: "100 kPa" },
  { left: "1 atm", right: "101.325 kPa" },
  { left: "1 hp (mechanical)", right: "745.699872 W" },
  { left: "1 kW", right: "1.34102 hp" },
  { left: "1 N", right: "0.224809 lbf" },
  { left: "1 lbf", right: "4.44822 N" },
];

const metricPrefixes = [
  { prefix: "T", name: "tera", power: "10¹²" },
  { prefix: "G", name: "giga", power: "10⁹" },
  { prefix: "M", name: "mega", power: "10⁶" },
  { prefix: "k", name: "kilo", power: "10³" },
  { prefix: "", name: "(base)", power: "10⁰" },
  { prefix: "m", name: "milli", power: "10⁻³" },
  { prefix: "µ", name: "micro", power: "10⁻⁶" },
  { prefix: "n", name: "nano", power: "10⁻⁹" },
  { prefix: "p", name: "pico", power: "10⁻¹²" },
];

type ThreadRow = {
  thread: string; // e.g. 1/4-20 UNC
  majorIn: number; // inches
  tpi?: number;
  pitchMm?: number;
  tapDrillIn: string; // fraction/number drill
  tapDrillInDecimal: number;
};

const uncTapTable: ThreadRow[] = [
  { thread: "#4-40 UNC", majorIn: 0.1120, tpi: 40, tapDrillIn: "#43", tapDrillInDecimal: 0.0890 },
  { thread: "#6-32 UNC", majorIn: 0.1380, tpi: 32, tapDrillIn: "#36", tapDrillInDecimal: 0.1065 },
  { thread: "#8-32 UNC", majorIn: 0.1640, tpi: 32, tapDrillIn: "#29", tapDrillInDecimal: 0.1360 },
  { thread: "#10-24 UNC", majorIn: 0.1900, tpi: 24, tapDrillIn: "#25", tapDrillInDecimal: 0.1495 },
  { thread: "1/4-20 UNC", majorIn: 0.2500, tpi: 20, tapDrillIn: "#7", tapDrillInDecimal: 0.2010 },
  { thread: "5/16-18 UNC", majorIn: 0.3125, tpi: 18, tapDrillIn: "F", tapDrillInDecimal: 0.2570 },
  { thread: "3/8-16 UNC", majorIn: 0.3750, tpi: 16, tapDrillIn: "5/16", tapDrillInDecimal: 0.3125 },
  { thread: "7/16-14 UNC", majorIn: 0.4375, tpi: 14, tapDrillIn: "U", tapDrillInDecimal: 0.3680 },
  { thread: "1/2-13 UNC", majorIn: 0.5000, tpi: 13, tapDrillIn: "27/64", tapDrillInDecimal: 0.4219 },
  { thread: "5/8-11 UNC", majorIn: 0.6250, tpi: 11, tapDrillIn: "17/32", tapDrillInDecimal: 0.5313 },
  { thread: "3/4-10 UNC", majorIn: 0.7500, tpi: 10, tapDrillIn: "21/32", tapDrillInDecimal: 0.6563 },
];

const unfTapTable: ThreadRow[] = [
  { thread: "#4-48 UNF", majorIn: 0.1120, tpi: 48, tapDrillIn: "#42", tapDrillInDecimal: 0.0935 },
  { thread: "#6-40 UNF", majorIn: 0.1380, tpi: 40, tapDrillIn: "#33", tapDrillInDecimal: 0.1130 },
  { thread: "#8-36 UNF", majorIn: 0.1640, tpi: 36, tapDrillIn: "#29", tapDrillInDecimal: 0.1360 },
  { thread: "#10-32 UNF", majorIn: 0.1900, tpi: 32, tapDrillIn: "#21", tapDrillInDecimal: 0.1590 },
  { thread: "1/4-28 UNF", majorIn: 0.2500, tpi: 28, tapDrillIn: "#3", tapDrillInDecimal: 0.2130 },
  { thread: "5/16-24 UNF", majorIn: 0.3125, tpi: 24, tapDrillIn: "I", tapDrillInDecimal: 0.2720 },
  { thread: "3/8-24 UNF", majorIn: 0.3750, tpi: 24, tapDrillIn: "Q", tapDrillInDecimal: 0.3320 },
  { thread: "7/16-20 UNF", majorIn: 0.4375, tpi: 20, tapDrillIn: "25/64", tapDrillInDecimal: 0.3906 },
  { thread: "1/2-20 UNF", majorIn: 0.5000, tpi: 20, tapDrillIn: "29/64", tapDrillInDecimal: 0.4531 },
];

type MetricThreadRow = {
  thread: string; // e.g. M6 x 1.0
  majorMm: number;
  pitchMm: number;
  tapDrillMm: number; // close to major - pitch (75% typical)
};

const metricCoarseTapTable: MetricThreadRow[] = [
  { thread: "M3 × 0.5", majorMm: 3, pitchMm: 0.5, tapDrillMm: 2.5 },
  { thread: "M4 × 0.7", majorMm: 4, pitchMm: 0.7, tapDrillMm: 3.3 },
  { thread: "M5 × 0.8", majorMm: 5, pitchMm: 0.8, tapDrillMm: 4.2 },
  { thread: "M6 × 1.0", majorMm: 6, pitchMm: 1.0, tapDrillMm: 5.0 },
  { thread: "M8 × 1.25", majorMm: 8, pitchMm: 1.25, tapDrillMm: 6.8 },
  { thread: "M10 × 1.5", majorMm: 10, pitchMm: 1.5, tapDrillMm: 8.5 },
  { thread: "M12 × 1.75", majorMm: 12, pitchMm: 1.75, tapDrillMm: 10.2 },
  { thread: "M16 × 2.0", majorMm: 16, pitchMm: 2.0, tapDrillMm: 14.0 },
];

/* =========================
   Conversion Calculator
========================= */

function makeLinearUnits(baseLabel: string, units: Array<{ key: string; label: string; toBaseMul: number }>): UnitDef[] {
  return units.map((u) => ({
    key: u.key,
    label: u.label,
    toBase: (v: number) => v * u.toBaseMul,
    fromBase: (v: number) => v / u.toBaseMul,
  }));
}

// Base units:
// length: meter
// area: m^2
// volume: m^3
// mass: kg
// force: newton
// pressure: pascal
// energy: joule
// power: watt
const UNITS: Record<CategoryKey, UnitDef[]> = {
  length: makeLinearUnits("m", [
    { key: "m", label: "meter (m)", toBaseMul: 1 },
    { key: "mm", label: "millimeter (mm)", toBaseMul: 0.001 },
    { key: "cm", label: "centimeter (cm)", toBaseMul: 0.01 },
    { key: "km", label: "kilometer (km)", toBaseMul: 1000 },
    { key: "in", label: "inch (in)", toBaseMul: 0.0254 },
    { key: "ft", label: "foot (ft)", toBaseMul: 0.3048 },
    { key: "yd", label: "yard (yd)", toBaseMul: 0.9144 },
    { key: "mi", label: "mile (mi)", toBaseMul: 1609.344 },
  ]),
  area: makeLinearUnits("m²", [
    { key: "m2", label: "square meter (m²)", toBaseMul: 1 },
    { key: "mm2", label: "square millimeter (mm²)", toBaseMul: 1e-6 },
    { key: "cm2", label: "square centimeter (cm²)", toBaseMul: 1e-4 },
    { key: "ft2", label: "square foot (ft²)", toBaseMul: 0.09290304 },
    { key: "in2", label: "square inch (in²)", toBaseMul: 0.00064516 },
    { key: "yd2", label: "square yard (yd²)", toBaseMul: 0.83612736 },
    { key: "acre", label: "acre", toBaseMul: 4046.8564224 },
  ]),
  volume: makeLinearUnits("m³", [
    { key: "m3", label: "cubic meter (m³)", toBaseMul: 1 },
    { key: "L", label: "liter (L)", toBaseMul: 0.001 },
    { key: "mL", label: "milliliter (mL)", toBaseMul: 1e-6 },
    { key: "ft3", label: "cubic foot (ft³)", toBaseMul: 0.028316846592 },
    { key: "in3", label: "cubic inch (in³)", toBaseMul: 1.6387064e-5 },
    { key: "gal", label: "US gallon (gal)", toBaseMul: 0.003785411784 },
    { key: "qt", label: "US quart (qt)", toBaseMul: 0.000946352946 },
    { key: "pt", label: "US pint (pt)", toBaseMul: 0.000473176473 },
    { key: "floz", label: "US fluid ounce (fl oz)", toBaseMul: 2.95735295625e-5 },
  ]),
  mass: makeLinearUnits("kg", [
    { key: "kg", label: "kilogram (kg)", toBaseMul: 1 },
    { key: "g", label: "gram (g)", toBaseMul: 0.001 },
    { key: "mg", label: "milligram (mg)", toBaseMul: 1e-6 },
    { key: "lb", label: "pound (lb)", toBaseMul: 0.45359237 },
    { key: "oz", label: "ounce (oz)", toBaseMul: 0.028349523125 },
    { key: "ton", label: "US short ton", toBaseMul: 907.18474 },
  ]),
  force: makeLinearUnits("N", [
    { key: "N", label: "newton (N)", toBaseMul: 1 },
    { key: "kN", label: "kilonewton (kN)", toBaseMul: 1000 },
    { key: "lbf", label: "pound-force (lbf)", toBaseMul: 4.4482216152605 },
  ]),
  pressure: makeLinearUnits("Pa", [
    { key: "Pa", label: "pascal (Pa)", toBaseMul: 1 },
    { key: "kPa", label: "kilopascal (kPa)", toBaseMul: 1000 },
    { key: "MPa", label: "megapascal (MPa)", toBaseMul: 1e6 },
    { key: "bar", label: "bar", toBaseMul: 100000 },
    { key: "psi", label: "psi", toBaseMul: 6894.757293168 },
    { key: "atm", label: "standard atmosphere (atm)", toBaseMul: 101325 },
  ]),
  energy: makeLinearUnits("J", [
    { key: "J", label: "joule (J)", toBaseMul: 1 },
    { key: "kJ", label: "kilojoule (kJ)", toBaseMul: 1000 },
    { key: "Wh", label: "watt-hour (Wh)", toBaseMul: 3600 },
    { key: "kWh", label: "kilowatt-hour (kWh)", toBaseMul: 3.6e6 },
    { key: "cal", label: "calorie (cal)", toBaseMul: 4.184 },
    { key: "btu", label: "BTU (IT)", toBaseMul: 1055.05585262 },
  ]),
  power: makeLinearUnits("W", [
    { key: "W", label: "watt (W)", toBaseMul: 1 },
    { key: "kW", label: "kilowatt (kW)", toBaseMul: 1000 },
    { key: "MW", label: "megawatt (MW)", toBaseMul: 1e6 },
    { key: "hp", label: "horsepower (hp)", toBaseMul: 745.699872 },
  ]),
  temperature: [
    {
      key: "C",
      label: "Celsius (°C)",
      toBase: (v) => v, // base = °C
      fromBase: (v) => v,
    },
    {
      key: "F",
      label: "Fahrenheit (°F)",
      toBase: (v) => (v - 32) * (5 / 9),
      fromBase: (v) => v * (9 / 5) + 32,
    },
    {
      key: "K",
      label: "Kelvin (K)",
      toBase: (v) => v - 273.15,
      fromBase: (v) => v + 273.15,
    },
  ],
};

export default function WeightsMeasuresThreadsPage() {
  // Converter state
  const [category, setCategory] = useState<CategoryKey>("length");
  const unitOptions = UNITS[category];

  const [fromUnit, setFromUnit] = useState<string>(unitOptions[0].key);
  const [toUnit, setToUnit] = useState<string>(unitOptions[1]?.key ?? unitOptions[0].key);
  const [inputVal, setInputVal] = useState<string>("");

  // Keep units valid when category changes
  React.useEffect(() => {
    const opts = UNITS[category];
    setFromUnit(opts[0].key);
    setToUnit((opts[1] ?? opts[0]).key);
    setInputVal("");
  }, [category]);

  const conversion = useMemo(() => {
    const v = parseNum(inputVal);
    if (!Number.isFinite(v)) return { ok: false, out: NaN };

    const from = UNITS[category].find((u) => u.key === fromUnit);
    const to = UNITS[category].find((u) => u.key === toUnit);
    if (!from || !to || !from.toBase || !to.fromBase) return { ok: false, out: NaN };

    const base = from.toBase(v);
    const out = to.fromBase(base);
    return { ok: true, out };
  }, [category, fromUnit, toUnit, inputVal]);

  return (
    <div className="container-app safe-area" style={{ padding: 16 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4, marginBottom: 6 }}>
          Weights & Measures / Threads / Unit Converter
        </h1>
        <p className="sub" style={{ margin: 0 }}>
          Quick reference tables + a fast conversion calculator for field use.
        </p>
      </div>

      {/* Converter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Unit Conversion Calculator</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>Category</div>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)}>
              <option value="length">Length</option>
              <option value="area">Area</option>
              <option value="volume">Volume</option>
              <option value="mass">Mass</option>
              <option value="force">Force</option>
              <option value="pressure">Pressure</option>
              <option value="energy">Energy</option>
              <option value="power">Power</option>
              <option value="temperature">Temperature</option>
            </select>
          </div>

          <div>
            <div className="sub" style={{ marginBottom: 6 }}>From</div>
            <select className="input" value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
              {unitOptions.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="sub" style={{ marginBottom: 6 }}>To</div>
            <select className="input" value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
              {unitOptions.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="sub" style={{ marginBottom: 6 }}>Value</div>
            <input
              className="input"
              inputMode="decimal"
              placeholder="Enter a number…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="tile" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Result</div>
            <div className="sub" style={{ marginTop: 4 }}>
              {conversion.ok ? (
                <>
                  {inputVal || "0"} <span className="kbd">{fromUnit}</span> =
                </>
              ) : (
                <>Enter a valid number to convert.</>
              )}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="kbd" style={{ display: "inline-flex", marginBottom: 6 }}>{toUnit}</div>
            <div style={{ fontSize: 26, fontWeight: 950, lineHeight: 1 }}>
              {conversion.ok ? fmt(conversion.out, 8) : "—"}
            </div>
          </div>
        </div>

        <div className="sub" style={{ marginTop: 10 }}>
          Tip: On iPhone, inputs use 16px font to avoid the Safari “auto zoom” behavior.
        </div>
      </div>

      {/* Tables grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Weights & Measures */}
        <div className="card">
          <div className="section-title">Weights & Measures (Quick Conversions)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    US / Imperial
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Metric
                  </th>
                </tr>
              </thead>
              <tbody>
                {weightsMeasures.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.left}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sub" style={{ marginTop: 10 }}>
            Note: “US gallon” differs from “Imperial gallon” (UK).
          </div>
        </div>

        {/* Metric System */}
        <div className="card">
          <div className="section-title">Metric System Prefixes</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Prefix
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Name
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Factor
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricPrefixes.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <span className="kbd">{r.prefix || "—"}</span>
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.name}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.power}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sub" style={{ marginTop: 10 }}>
            Example: 3.3 kV = 3300 V, 250 mA = 0.25 A.
          </div>
        </div>

        {/* Threads UNC */}
        <div className="card">
          <div className="section-title">UNC Thread + Tap Drill (Typical)</div>
          <div className="sub" style={{ marginBottom: 10 }}>
            Typical tap drills for ~75% thread engagement. Verify for material/application.
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Thread
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Major (in)
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    TPI
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Tap Drill
                  </th>
                </tr>
              </thead>
              <tbody>
                {uncTapTable.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.thread}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {fmt(r.majorIn, 4)}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {r.tpi}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <span className="kbd">{r.tapDrillIn}</span>{" "}
                      <span className="sub">({fmt(r.tapDrillInDecimal, 4)}")</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threads UNF */}
        <div className="card">
          <div className="section-title">UNF Thread + Tap Drill (Typical)</div>
          <div className="sub" style={{ marginBottom: 10 }}>
            Typical tap drills for ~75% thread engagement. Verify for material/application.
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Thread
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Major (in)
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    TPI
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Tap Drill
                  </th>
                </tr>
              </thead>
              <tbody>
                {unfTapTable.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.thread}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {fmt(r.majorIn, 4)}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {r.tpi}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <span className="kbd">{r.tapDrillIn}</span>{" "}
                      <span className="sub">({fmt(r.tapDrillInDecimal, 4)}")</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metric Threads */}
        <div className="card">
          <div className="section-title">Metric (Coarse) Thread + Tap Drill (Typical)</div>
          <div className="sub" style={{ marginBottom: 10 }}>
            Rule of thumb: tap drill ≈ major − pitch (gives a common engagement for general work).
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Thread
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Major (mm)
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Pitch (mm)
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", borderBottom: "1px solid rgb(var(--border))" }}>
                    Tap Drill (mm)
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricCoarseTapTable.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.thread}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {fmt(r.majorMm, 2)}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {fmt(r.pitchMm, 2)}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <span className="kbd">{fmt(r.tapDrillMm, 2)} mm</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sub" style={{ marginTop: 10 }}>
            If you want this to be exact by % thread / class, I can add a “% thread” slider and compute tap drill from
            geometry.
          </div>
        </div>
      </div>
    </div>
  );
}