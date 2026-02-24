"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Mode = "reactance_from_known" | "estimate_from_geometry";
type Circuit = "1ph_2wire" | "3ph_3wire";
type Medium = "air"; // you can expand later (PVC, XLPE, etc.)
type Computed =
  | { ok: false; msg: string }
  | {
      ok: true;
      // known-mode fields may be NaN, but never undefined
      Xl: number;
      Xc: number;
      // geometry-mode fields (set to NaN in known mode)
      L_total: number;
      C_total: number;
      Lp: number;
      Cp: number;
      note: string;
    };
const MU0 = 4e-7 * Math.PI;          // H/m
const EPS0 = 8.854187817e-12;        // F/m
const SQRT3 = Math.sqrt(3);

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function fmt(n: number, unit: string, dp = 4) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 1000 ? 2 : abs >= 100 ? 3 : dp;
  return `${n.toFixed(d)} ${unit}`;
}

// AWG diameter in inches: d(in) = 0.005 * 92^((36-awg)/39)
function awgToDiameterIn(awg: number) {
  return 0.005 * Math.pow(92, (36 - awg) / 39);
}

function inchesToMeters(inches: number) {
  return inches * 0.0254;
}

function feetToMeters(ft: number) {
  return ft * 0.3048;
}

// --- Rough overhead/two-wire line approximations in AIR ---
// Inductance per conductor (2-wire): L' ≈ (μ0 / (2π)) * ln(D / r')
// where r' = 0.7788 r (GMR approximation for solid round conductor)
function Lprime_2wire(Dm: number, r_m: number) {
  const rprime = 0.7788 * r_m;
  if (Dm <= rprime) return NaN;
  return (MU0 / (2 * Math.PI)) * Math.log(Dm / rprime); // H/m (per conductor)
}

// Capacitance between two conductors in air (per conductor to the other):
// C' ≈ (2π ε0) / ln(D / r)
function Cprime_2wire(Dm: number, r_m: number) {
  if (Dm <= r_m) return NaN;
  return (2 * Math.PI * EPS0) / Math.log(Dm / r_m); // F/m
}

// For simple 3-phase spacing, we’ll use a single “average spacing” D (assume equilateral).
// Then per-phase inductance similar form using GMD ≈ D, and capacitance similar.
// This is a simplification but useful as a field estimate.
function Lprime_3ph_equilateral(Dm: number, r_m: number) {
  const rprime = 0.7788 * r_m;
  if (Dm <= rprime) return NaN;
  return (MU0 / (2 * Math.PI)) * Math.log(Dm / rprime); // H/m (per phase conductor)
}

function Cprime_3ph_equilateral(Dm: number, r_m: number) {
  if (Dm <= r_m) return NaN;
  return (2 * Math.PI * EPS0) / Math.log(Dm / r_m); // F/m (approx per phase to neutral-ish)
}

export default function ReactancePage() {
  const [mode, setMode] = useState<Mode>("reactance_from_known");
  const [circuit, setCircuit] = useState<Circuit>("3ph_3wire");
  const [medium, setMedium] = useState<Medium>("air");

  // Common
  const [freq, setFreq] = useState("60");
  const [lengthFt, setLengthFt] = useState("100");

  // Known-value mode
  const [knownType, setKnownType] = useState<"C" | "L">("C");
  const [knownValue, setKnownValue] = useState("0.2"); // default

  // Geometry estimate mode inputs
  const [awg, setAwg] = useState("4");          // wire size
  const [spacingIn, setSpacingIn] = useState("3"); // center-to-center spacing between conductors

  const computed = useMemo<Computed>(() => {
    const f = num(freq);
    const len_m = feetToMeters(num(lengthFt));

    if (!Number.isFinite(f) || f <= 0) return { ok: false as const, msg: "Enter a valid frequency (Hz)." };
    if (!Number.isFinite(len_m) || len_m <= 0) return { ok: false as const, msg: "Enter a valid length (ft)." };

    if (mode === "reactance_from_known") {
      const x = num(knownValue);
      if (!Number.isFinite(x) || x <= 0) {
        return { ok: false as const, msg: "Enter a valid C or L value." };
      }

      if (knownType === "C") {
        // Interpret as total capacitance over the run unless user chooses per-length later.
        // C in microfarads by default UI hint.
        const C = x * 1e-6; // µF -> F
        const Xc = 1 / (2 * Math.PI * f * C);
        return {
            ok: true,
            Xl: NaN,
            Xc,
            L_total: NaN,
            C_total: C,
            Lp: NaN,
            Cp: NaN,
            note: "Xc is computed from total capacitance.",
          };
      } else {
        // L in millihenries by default UI hint.
        const L = x * 1e-3; // mH -> H
        const Xl = 2 * Math.PI * f * L;
        return {
            ok: true,
            Xl,
            Xc: NaN,
            L_total: L,
            C_total: NaN,
            Lp: NaN,
            Cp: NaN,
            note: "Xl is computed from total inductance.",
          };
      }
    }

    // Estimate from geometry
    const awgN = Number(awg);
    const spacing_m = inchesToMeters(num(spacingIn));
    if (!Number.isFinite(awgN)) return { ok: false as const, msg: "Enter a valid AWG size." };
    if (!Number.isFinite(spacing_m) || spacing_m <= 0) return { ok: false as const, msg: "Enter a valid spacing (in)." };

    const d_in = awgToDiameterIn(awgN);
    const r_m = inchesToMeters(d_in / 2);

    // per-meter L and C
    let Lp: number;
    let Cp: number;

    if (circuit === "1ph_2wire") {
      Lp = Lprime_2wire(spacing_m, r_m);
      Cp = Cprime_2wire(spacing_m, r_m);
    } else {
      // 3-phase equilateral approx
      Lp = Lprime_3ph_equilateral(spacing_m, r_m);
      Cp = Cprime_3ph_equilateral(spacing_m, r_m);
    }

    if (!Number.isFinite(Lp) || !Number.isFinite(Cp)) {
      return { ok: false as const, msg: "Geometry invalid (spacing must be > conductor radius)." };
    }

    // Total inductance/capacitance for the run
    // Note: For 2-wire, Cp here is between conductors; for 3-phase we treat per phase approx.
    const L_total = Lp * len_m; // H
    const C_total = Cp * len_m; // F

    const Xl = 2 * Math.PI * f * L_total;
    const Xc = 1 / (2 * Math.PI * f * C_total);

    return {
        ok: true,
        Xl,
        Xc,
        L_total,
        C_total,
        Lp,
        Cp,
        note:
          "Estimate assumes conductors in free air / non-magnetic environment and simple spacing model. For cables or steel conduit, real values can differ.",
      };
  }, [mode, circuit, medium, freq, lengthFt, knownType, knownValue, awg, spacingIn]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Capacitance / Inductance / Reactance">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">What do you want to do?</div>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="reactance_from_known">Find reactance from known C or L</option>
              <option value="estimate_from_geometry">Estimate C & L from conductor geometry</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Circuit type</div>
            <select className="input" value={circuit} onChange={(e) => setCircuit(e.target.value as Circuit)}>
              <option value="1ph_2wire">AC 1φ (2-wire)</option>
              <option value="3ph_3wire">AC 3φ (3-wire)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Environment</div>
            <select className="input" value={medium} onChange={(e) => setMedium(e.target.value as Medium)}>
              <option value="air">Free air / non-magnetic (estimate)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">Frequency (Hz)</div>
            <input className="input" inputMode="decimal" value={freq} onChange={(e) => setFreq(e.target.value)} placeholder="e.g. 60" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-extrabold">Length (ft)</div>
            <input className="input" inputMode="decimal" value={lengthFt} onChange={(e) => setLengthFt(e.target.value)} placeholder="e.g. 100" />
          </div>
          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm text-[#4a2412]/70">Tip</div>
            <div className="mt-1 text-xs text-[#4a2412]/70 leading-5">
              Best accuracy is from manufacturer datasheets (known C or L). Geometry mode is a field estimate.
            </div>
          </div>
        </div>
      </Card>

      {mode === "reactance_from_known" ? (
        <Card title="Known Value Input">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Known value type</div>
              <select className="input" value={knownType} onChange={(e) => setKnownType(e.target.value as "C" | "L")}>
                <option value="C">Capacitance (C)</option>
                <option value="L">Inductance (L)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-extrabold">
                {knownType === "C" ? "Total Capacitance (µF)" : "Total Inductance (mH)"}
              </div>
              <input
                className="input"
                inputMode="decimal"
                value={knownValue}
                onChange={(e) => setKnownValue(e.target.value)}
                placeholder={knownType === "C" ? "e.g. 0.25" : "e.g. 1.2"}
              />
            </div>

            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              {!computed.ok ? (
                <div className="text-sm text-[#4a2412]/70">{computed.msg}</div>
              ) : (
                <>
                  <div className="text-sm text-[#4a2412]/70">Result</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#f26422]">
                    {knownType === "C" ? fmt(computed.Xc, "Ω", 2) : fmt(computed.Xl, "Ω", 2)}
                  </div>
                  <div className="mt-1 text-xs text-[#4a2412]/70">
                    {knownType === "C" ? "Capacitive reactance (Xc)" : "Inductive reactance (Xl)"}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Geometry Estimate Inputs">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Conductor size (AWG)</div>
              <input
                className="input"
                inputMode="numeric"
                value={awg}
                onChange={(e) => setAwg(e.target.value)}
                placeholder="e.g. 4"
              />
              <div className="text-xs text-[#4a2412]/70">Enter a number like 14, 12, 10, 8, 6, 4, 2, 1, etc.</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-extrabold">Conductor spacing (in)</div>
              <input
                className="input"
                inputMode="decimal"
                value={spacingIn}
                onChange={(e) => setSpacingIn(e.target.value)}
                placeholder="center-to-center, e.g. 3"
              />
              <div className="text-xs text-[#4a2412]/70">Center-to-center spacing between adjacent conductors.</div>
            </div>

            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              {!computed.ok ? (
                <div className="text-sm text-[#4a2412]/70">{computed.msg}</div>
              ) : (
                <>
                  <div className="text-sm text-[#4a2412]/70">Estimated totals for the run</div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-[#4a2412]/70">Inductance (L)</div>
                      <div className="font-extrabold text-[#f26422]">{fmt(computed.L_total, "H", 6)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a2412]/70">Capacitance (C)</div>
                      <div className="font-extrabold text-[#f26422]">{fmt(computed.C_total, "F", 9)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a2412]/70">Xl</div>
                      <div className="font-extrabold">{fmt(computed.Xl, "Ω", 3)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a2412]/70">Xc</div>
                      <div className="font-extrabold">{fmt(computed.Xc, "Ω", 3)}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-[#4a2412]/70 leading-5">{computed.note}</div>
                </>
              )}
            </div>

            <div className="md:col-span-3 text-xs text-[#4a2412]/70 leading-5">
              Geometry mode is intended for rough estimates (especially in free air). For cables, use manufacturer data (often given as
              C in µF/1000ft and X in Ω/1000ft).
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}