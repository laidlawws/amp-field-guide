"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Card from "@/components/Card";

type Key = "V" | "I" | "R" | "P";
type FormulaId =
  | "V=sqrtPR"
  | "V=P/I"
  | "V=IR"
  | "R=V/I"
  | "R=V2/P"
  | "R=P/I2"
  | "P=V2/R"
  | "P=I2R"
  | "P=VI"
  | "I=V/R"
  | "I=P/V"
  | "I=sqrtP/R";

type Formula = {
  id: FormulaId;
  labelOnWheel: string; // shows E in the diagram sometimes; we keep the exact diagram text vibe
  equation: string;     // our app display uses V
  inputs: Key[];
  output: Key;
  compute: (vals: Record<Key, number>) => number;
};

const UNITS: Record<Key, string> = { V: "V", I: "A", R: "Ω", P: "W" };

const FORMULAS: Formula[] = [
  { id: "V=sqrtPR", labelOnWheel: "E = √(P×R)", equation: "V = √(P × R)", inputs: ["P", "R"], output: "V", compute: ({ P, R }) => (P < 0 || R < 0 ? NaN : Math.sqrt(P * R)) },
  { id: "V=P/I",    labelOnWheel: "E = P/I",   equation: "V = P ÷ I",     inputs: ["P", "I"], output: "V", compute: ({ P, I }) => (I === 0 ? NaN : P / I) },
  { id: "V=IR",     labelOnWheel: "E = I×R",   equation: "V = I × R",     inputs: ["I", "R"], output: "V", compute: ({ I, R }) => I * R },

  { id: "R=V/I",    labelOnWheel: "R = E/I",   equation: "R = V ÷ I",     inputs: ["V", "I"], output: "R", compute: ({ V, I }) => (I === 0 ? NaN : V / I) },
  { id: "R=V2/P",   labelOnWheel: "R = E²/P",  equation: "R = V² ÷ P",    inputs: ["V", "P"], output: "R", compute: ({ V, P }) => (P === 0 ? NaN : (V * V) / P) },
  { id: "R=P/I2",   labelOnWheel: "R = P/I²",  equation: "R = P ÷ I²",    inputs: ["P", "I"], output: "R", compute: ({ P, I }) => (I === 0 ? NaN : P / (I * I)) },

  { id: "P=V2/R",   labelOnWheel: "P = E²/R",  equation: "P = V² ÷ R",    inputs: ["V", "R"], output: "P", compute: ({ V, R }) => (R === 0 ? NaN : (V * V) / R) },
  { id: "P=I2R",    labelOnWheel: "P = I²×R",  equation: "P = I² × R",    inputs: ["I", "R"], output: "P", compute: ({ I, R }) => I * I * R },
  { id: "P=VI",     labelOnWheel: "P = E×I",   equation: "P = V × I",     inputs: ["V", "I"], output: "P", compute: ({ V, I }) => V * I },

  { id: "I=V/R",    labelOnWheel: "I = E/R",   equation: "I = V ÷ R",     inputs: ["V", "R"], output: "I", compute: ({ V, R }) => (R === 0 ? NaN : V / R) },
  { id: "I=P/V",    labelOnWheel: "I = P/E",   equation: "I = P ÷ V",     inputs: ["P", "V"], output: "I", compute: ({ P, V }) => (V === 0 ? NaN : P / V) },
  { id: "I=sqrtP/R",labelOnWheel: "I = √(P/R)",equation: "I = √(P ÷ R)",  inputs: ["P", "R"], output: "I", compute: ({ P, R }) => (R <= 0 || P < 0 ? NaN : Math.sqrt(P / R)) },
];

// Order around the wheel starting at 12 o’clock going clockwise (matches the CC SVG wheel you provided)
const WEDGE_ORDER: FormulaId[] = [
  "V=sqrtPR", // top
  "V=P/I",
  "V=IR",     // right
  "R=V/I",
  "R=V2/P",
  "R=P/I2",   // bottom
  "P=V2/R",
  "P=I2R",
  "P=VI",     // left
  "I=V/R",
  "I=P/V",
  "I=sqrtP/R",
];

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function wedgePath(cx: number, cy: number, rInner: number, rOuter: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, rOuter, a0);
  const p1 = polar(cx, cy, rOuter, a1);
  const p2 = polar(cx, cy, rInner, a1);
  const p3 = polar(cx, cy, rInner, a0);

  const large = a1 - a0 > Math.PI ? 1 : 0;

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function nice(n: number) {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  const dp = abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 10 ? 2 : 3;
  return n.toFixed(dp);
}

export default function OhmsChartInteractive() {
  const [selectedId, setSelectedId] = useState<FormulaId>("P=VI");
  const [hoverId, setHoverId] = useState<FormulaId | null>(null);
  const [vals, setVals] = useState<Record<Key, string>>({ V: "", I: "", R: "", P: "" });

  const selected = useMemo(() => FORMULAS.find((f) => f.id === selectedId)!, [selectedId]);

  const result = useMemo(() => {
    const parsed: Record<Key, number> = {
      V: Number(vals.V),
      I: Number(vals.I),
      R: Number(vals.R),
      P: Number(vals.P),
    };

    for (const k of selected.inputs) {
      if (!Number.isFinite(parsed[k])) return "";
    }
    const out = selected.compute(parsed);
    if (!Number.isFinite(out)) return "—";
    return `${nice(out)} ${UNITS[selected.output]}`;
  }, [vals, selected]);

  const clear = () => setVals({ V: "", I: "", R: "", P: "" });

  // SVG wheel viewBox is 0 0 1000 1000
  const VB = 1000;
  const CX = 500;
  const CY = 500;
  const R_INNER = 205;
  const R_OUTER = 480;
  const SLICE = (2 * Math.PI) / 12;
  const ROT = -Math.PI / 2; // -90° minus 15°

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Ohm’s Law Wheel (click a wedge)">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Wheel + overlay */}
          <div className="relative w-full max-w-[520px] mx-auto">
            <Image
              src="/ohms-wheel.svg"
              alt="Ohm’s Law Pie Chart"
              width={900}
              height={900}
              className="w-full h-auto"
              priority
            />

            <svg
              viewBox={`0 0 ${VB} ${VB}`}
              className="absolute inset-0 w-full h-full"
              aria-label="Ohm’s Law interactive overlay"
            >
              {WEDGE_ORDER.map((id, idx) => {
                const a0 = ROT + idx * SLICE;
                const a1 = ROT + (idx + 1) * SLICE;
                const d = wedgePath(CX, CY, R_INNER, R_OUTER, a0, a1);

                const active = selectedId === id;
                const hover = hoverId === id;

                return (
                  <path
                    key={id}
                    d={d}
                    onClick={() => setSelectedId(id)}
                    onMouseEnter={() => setHoverId(id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{ cursor: "pointer" }}
                    fill={active ? "rgba(242,100,34,0.22)" : hover ? "rgba(242,100,34,0.12)" : "rgba(0,0,0,0)"}
                    stroke={active ? "rgba(242,100,34,0.65)" : "rgba(0,0,0,0)"}
                    strokeWidth={3}
                  >
                    <title>{FORMULAS.find((f) => f.id === id)?.equation}</title>
                  </path>
                );
              })}
            </svg>
          </div>

          {/* Selected formula readout + quick buttons */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              <div className="text-sm text-[#4a2412]/70">Selected</div>
              <div className="mt-1 text-xl font-extrabold">{selected.equation}</div>
              <div className="mt-1 text-sm font-semibold text-[#4a2412]/70">
                (matches wheel: <span className="font-extrabold">{selected.labelOnWheel}</span>)
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {FORMULAS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedId(f.id)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      selectedId === f.id
                        ? "bg-[#f26422] text-white border-[#f26422]"
                        : "bg-[#f7f5f2] text-[#4a2412] border-[#e6d2a8] hover:opacity-90"
                    }`}
                  >
                    {f.equation}
                  </button>
                ))}
              </div>

              <div className="mt-3 text-xs text-[#4a2412]/70">
                Tip: click the wheel wedge OR the buttons to load the calculator below.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calculator */}
      <Card
        title={`Calculator: ${selected.equation}`}
        right={
          <button
            onClick={clear}
            className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-sm font-extrabold hover:opacity-90"
          >
            Clear
          </button>
        }
      >
        <div className="grid md:grid-cols-3 gap-4">
          {selected.inputs.map((k) => (
            <div key={k} className="space-y-2">
              <div className="text-sm font-extrabold">
                {k} ({UNITS[k]})
              </div>
              <input
                className="input"
                inputMode="decimal"
                placeholder={`Enter ${k}`}
                value={vals[k]}
                onChange={(e) => setVals((p) => ({ ...p, [k]: e.target.value }))}
              />
            </div>
          ))}

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm text-[#4a2412]/70">Result</div>
            <div className="mt-1 text-2xl font-extrabold text-[#f26422]">
              {result || "—"}
            </div>
            <div className="mt-2 text-xs text-[#4a2412]/70 leading-5">
              Enter the required inputs above. This calculator updates automatically.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}