"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Mode = "capacitive" | "inductive";
type SolveFor = "xc" | "xl" | "c" | "l" | "f" | "q" | "vq";

const TWO_PI = Math.PI * 2;

type UnitOpt = { label: string; mult: number };

const FREQ_UNITS: UnitOpt[] = [
  { label: "Hz", mult: 1 },
  { label: "kHz", mult: 1_000 },
  { label: "MHz", mult: 1_000_000 },
];

const C_UNITS: UnitOpt[] = [
  { label: "pF", mult: 1e-12 },
  { label: "nF", mult: 1e-9 },
  { label: "µF", mult: 1e-6 },
  { label: "mF", mult: 1e-3 },
  { label: "F", mult: 1 },
];

const L_UNITS: UnitOpt[] = [
  { label: "nH", mult: 1e-9 },
  { label: "µH", mult: 1e-6 },
  { label: "mH", mult: 1e-3 },
  { label: "H", mult: 1 },
];

const Q_UNITS: UnitOpt[] = [
  { label: "nC", mult: 1e-9 },
  { label: "µC", mult: 1e-6 },
  { label: "mC", mult: 1e-3 },
  { label: "C", mult: 1 },
];

function n(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}

function fmt(x: number, unit: string, dp = 4) {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  const d = a >= 1000 ? 2 : a >= 100 ? 3 : dp;
  return `${x.toFixed(d)} ${unit}`;
}

function fmtSci(x: number, unit: string) {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a !== 0 && (a < 0.001 || a > 1_000_000)) return `${x.toExponential(3)} ${unit}`;
  return `${x.toFixed(6)} ${unit}`;
}

function getMult(units: UnitOpt[], label: string) {
  return units.find((u) => u.label === label)?.mult ?? 1;
}

function toBase(value: string, unitLabel: string, units: UnitOpt[]) {
  const v = n(value);
  if (!Number.isFinite(v)) return NaN;
  return v * getMult(units, unitLabel);
}

function fromBase(base: number, unitLabel: string, units: UnitOpt[]) {
  const m = getMult(units, unitLabel);
  return base / m;
}

export default function ReactancePage() {
  const [mode, setMode] = useState<Mode>("capacitive");
  const [solveFor, setSolveFor] = useState<SolveFor>("xc");

  // Inputs as strings so fields can be blank
  const [freq, setFreq] = useState("");
  const [freqUnit, setFreqUnit] = useState("Hz");

  const [cap, setCap] = useState("");
  const [capUnit, setCapUnit] = useState("µF");

  const [ind, setInd] = useState("");
  const [indUnit, setIndUnit] = useState("mH");

  // “Reactance” field represents Xc or Xl depending on mode
  const [react, setReact] = useState("");
  const reactUnit = "Ω";

  // Q = C·V inputs
  const [charge, setCharge] = useState("");
  const [chargeUnit, setChargeUnit] = useState("µC");
  const [qVoltage, setQVoltage] = useState("");

  // Disable (grey-out) the field being solved for
  const disabled = {
    f: solveFor === "f",
    c: solveFor === "c",
    l: solveFor === "l",
    xc: solveFor === "xc",
    xl: solveFor === "xl",
    q: solveFor === "q",
    vq: solveFor === "vq",
  };

  function inputClass(isDisabled: boolean) {
    return `input transition ${
      isDisabled
        ? "bg-[#f7f5f2] text-[#4a2412]/60 border-[#e6d2a8] cursor-not-allowed"
        : "bg-white text-[#4a2412]"
    }`;
  }

  const computed = useMemo(() => {
    const f = toBase(freq, freqUnit, FREQ_UNITS); // Hz
    const C = toBase(cap, capUnit, C_UNITS); // F
    const L = toBase(ind, indUnit, L_UNITS); // H
    const X = n(react); // Ω

    const Q = toBase(charge, chargeUnit, Q_UNITS); // Coulombs
    const Vq = n(qVoltage); // Volts

    const pos = (x: number) => Number.isFinite(x) && x > 0;

    // Capacitive (AC): Xc = 1/(2π f C)
    // Inductive (AC):  Xl = 2π f L
    // Capacitor (DC):  Q = C·V

    if (mode === "capacitive") {
      // --- Solve Xc ---
      if (solveFor === "xc") {
        if (!pos(f)) return { ok: false as const, msg: "Enter Frequency > 0." };
        if (!pos(C)) return { ok: false as const, msg: "Enter Capacitance > 0." };
        const Xc = 1 / (TWO_PI * f * C);
        return { ok: true as const, label: "Capacitive Reactance (Xc)", value: Xc, unit: "Ω" };
      }

      // --- Solve C ---
      if (solveFor === "c") {
        // Prefer Q/V method if both provided
        if (pos(Q) && pos(Vq)) {
          const Ccalc = Q / Vq;
          return { ok: true as const, label: "Capacitance (C) from Q = C·V", value: Ccalc, unit: "F" };
        }

        // Otherwise use reactance method
        if (!pos(f)) return { ok: false as const, msg: "Enter Frequency > 0 (or enter Q and V to use Q=C·V)." };
        if (!pos(X)) return { ok: false as const, msg: "Enter Reactance (Ω) > 0 (or enter Q and V to use Q=C·V)." };
        const Ccalc = 1 / (TWO_PI * f * X);
        return { ok: true as const, label: "Capacitance (C) from Xc", value: Ccalc, unit: "F" };
      }

      // --- Solve f ---
      if (solveFor === "f") {
        if (pos(C) && pos(X)) {
          const fcalc = 1 / (TWO_PI * C * X);
          return { ok: true as const, label: "Frequency (f) from Xc", value: fcalc, unit: "Hz" };
        }
        return { ok: false as const, msg: "Enter Capacitance and Reactance (Ω) to solve for f." };
      }

      // --- Solve Q ---
      if (solveFor === "q") {
        if (!pos(C)) return { ok: false as const, msg: "Enter Capacitance > 0." };
        if (!pos(Vq)) return { ok: false as const, msg: "Enter Voltage (V) > 0." };
        const Qcalc = C * Vq;
        return { ok: true as const, label: "Charge (Q) from Q = C·V", value: Qcalc, unit: "C" };
      }

      // --- Solve V from Q/C ---
      if (solveFor === "vq") {
        if (!pos(C)) return { ok: false as const, msg: "Enter Capacitance > 0." };
        if (!pos(Q)) return { ok: false as const, msg: "Enter Charge (Q) > 0." };
        const Vcalc = Q / C;
        return { ok: true as const, label: "Voltage (V) from V = Q/C", value: Vcalc, unit: "V" };
      }

      return { ok: false as const, msg: "Choose a valid capacitive solve option." };
    }

    // Inductive mode
    if (solveFor === "xl") {
      if (!pos(f)) return { ok: false as const, msg: "Enter Frequency > 0." };
      if (!pos(L)) return { ok: false as const, msg: "Enter Inductance > 0." };
      const Xl = TWO_PI * f * L;
      return { ok: true as const, label: "Inductive Reactance (Xl)", value: Xl, unit: "Ω" };
    }

    if (solveFor === "l") {
      if (!pos(f)) return { ok: false as const, msg: "Enter Frequency > 0." };
      if (!pos(X)) return { ok: false as const, msg: "Enter Reactance (Ω) > 0." };
      const Lcalc = X / (TWO_PI * f);
      return { ok: true as const, label: "Inductance (L)", value: Lcalc, unit: "H" };
    }

    if (solveFor === "f") {
      if (!pos(L)) return { ok: false as const, msg: "Enter Inductance > 0." };
      if (!pos(X)) return { ok: false as const, msg: "Enter Reactance (Ω) > 0." };
      const fcalc = X / (TWO_PI * L);
      return { ok: true as const, label: "Frequency (f) from Xl", value: fcalc, unit: "Hz" };
    }

    return { ok: false as const, msg: "Switch to Capacitive mode to solve C, Q, or V." };
  }, [mode, solveFor, freq, freqUnit, cap, capUnit, ind, indUnit, react, charge, chargeUnit, qVoltage]);

  const pretty = useMemo(() => {
    if (!computed.ok) return null;

    if (computed.unit === "Ω") return fmt(computed.value, "Ω", 4);

    if (computed.unit === "Hz") {
      const out = fromBase(computed.value, freqUnit, FREQ_UNITS);
      return fmt(out, freqUnit, 4);
    }

    if (computed.unit === "F") {
      const out = fromBase(computed.value, capUnit, C_UNITS);
      return fmtSci(out, capUnit);
    }

    if (computed.unit === "H") {
      const out = fromBase(computed.value, indUnit, L_UNITS);
      return fmtSci(out, indUnit);
    }

    if (computed.unit === "C") {
      const out = fromBase(computed.value, chargeUnit, Q_UNITS);
      return fmtSci(out, chargeUnit);
    }

    if (computed.unit === "V") {
      return fmt(computed.value, "V", 4);
    }

    return fmt(computed.value, computed.unit);
  }, [computed, freqUnit, capUnit, indUnit, chargeUnit]);

  // Label reactance input based on mode
  const reactLabel = mode === "capacitive" ? "Reactance (Xc)" : "Reactance (Xl)";
  const reactDisabled = mode === "capacitive" ? disabled.xc : disabled.xl;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Capacitance / Inductance / Reactance (Solver)">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Circuit type</div>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="capacitive">Capacitive (Xc, C, Q=C·V)</option>
              <option value="inductive">Inductive (Xl, L)</option>
            </select>
            <div className="text-xs text-[#4a2412]/70">
              Capacitive: Xc = 1/(2πfC). Inductive: Xl = 2πfL. DC capacitor: Q = C·V.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Solve for</div>
            <select className="input" value={solveFor} onChange={(e) => setSolveFor(e.target.value as SolveFor)}>
              <option value="f">Frequency (f)</option>

              <option value="xc">Capacitive Reactance (Xc)</option>
              <option value="c">Capacitance (C)</option>
              <option value="q">Charge (Q) from Q=C·V</option>
              <option value="vq">Voltage (V) from V=Q/C</option>

              <option value="xl">Inductive Reactance (Xl)</option>
              <option value="l">Inductance (L)</option>
            </select>
            <div className="text-xs text-[#4a2412]/70">The solved value is greyed out.</div>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4 text-sm text-[#4a2412]/80 leading-6">
            <div className="font-extrabold text-[#4a2412]">Quick notes</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Use Frequency in Hz (or kHz/MHz).</li>
              <li>Capacitance in F/µF/nF/pF.</li>
              <li>Inductance in H/mH/µH.</li>
              <li>Q=C·V is for capacitor charge (DC relationship).</li>
            </ul>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Frequency (f)</div>
            <div className="flex gap-2">
              <input
                className={inputClass(disabled.f)}
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                inputMode="decimal"
                disabled={disabled.f}
                placeholder="e.g. 60"
              />
              <select className="input w-28" value={freqUnit} onChange={(e) => setFreqUnit(e.target.value)}>
                {FREQ_UNITS.map((u) => (
                  <option key={u.label} value={u.label}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reactance */}
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">
              {reactLabel} ({reactUnit})
            </div>
            <input
              className={inputClass(reactDisabled)}
              value={react}
              onChange={(e) => setReact(e.target.value)}
              inputMode="decimal"
              disabled={reactDisabled}
              placeholder="e.g. 50"
            />
            <div className="text-xs text-[#4a2412]/70">
              Enter Xc or Xl here when solving for C, L, or f (AC).
            </div>
          </div>

          {/* Capacitance */}
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Capacitance (C)</div>
            <div className="flex gap-2">
              <input
                className={inputClass(disabled.c)}
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                inputMode="decimal"
                disabled={disabled.c}
                placeholder="e.g. 10"
              />
              <select className="input w-28" value={capUnit} onChange={(e) => setCapUnit(e.target.value)}>
                {C_UNITS.map((u) => (
                  <option key={u.label} value={u.label}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inductance */}
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Inductance (L)</div>
            <div className="flex gap-2">
              <input
                className={inputClass(disabled.l)}
                value={ind}
                onChange={(e) => setInd(e.target.value)}
                inputMode="decimal"
                disabled={disabled.l}
                placeholder="e.g. 10"
              />
              <select className="input w-28" value={indUnit} onChange={(e) => setIndUnit(e.target.value)}>
                {L_UNITS.map((u) => (
                  <option key={u.label} value={u.label}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Q = C·V section */}
          <div className="md:col-span-3 rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm font-extrabold text-[#4a2412]">Capacitor Charge (Q = C · V)</div>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Charge (Q)</div>
                <div className="flex gap-2">
                  <input
                    className={inputClass(disabled.q)}
                    value={charge}
                    onChange={(e) => setCharge(e.target.value)}
                    inputMode="decimal"
                    disabled={disabled.q}
                    placeholder="e.g. 100"
                  />
                  <select className="input w-28" value={chargeUnit} onChange={(e) => setChargeUnit(e.target.value)}>
                    {Q_UNITS.map((u) => (
                      <option key={u.label} value={u.label}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Voltage (V)</div>
                <input
                  className={inputClass(disabled.vq)}
                  value={qVoltage}
                  onChange={(e) => setQVoltage(e.target.value)}
                  inputMode="decimal"
                  disabled={disabled.vq}
                  placeholder="e.g. 12"
                />
              </div>

              <div className="text-xs text-[#4a2412]/70 leading-5 flex items-end">
                Tip: When solving for Capacitance (C), if Q and V are filled in, the calculator uses <b>C = Q/V</b>.
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="md:col-span-3 rounded-2xl border border-[#e6d2a8] bg-white p-5">
            {!computed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{computed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4 items-start">
                <div>
                  <div className="text-sm text-[#4a2412]/70">Result</div>
                  <div className="mt-1 text-3xl font-extrabold text-[#f26422]">{pretty}</div>
                  <div className="mt-2 text-xs text-[#4a2412]/70">{computed.label}</div>
                </div>

                <div className="md:col-span-2 text-sm text-[#4a2412]/80 leading-6">
                  {mode === "capacitive" ? (
                    <>
                      <b>Capacitive (AC):</b> Xc = 1 / (2π f C)
                      <div className="text-xs text-[#4a2412]/70 mt-2">
                        Also supports DC capacitor charge: <b>Q = C · V</b>
                      </div>
                    </>
                  ) : (
                    <>
                      <b>Inductive (AC):</b> Xl = 2π f L
                      <div className="text-xs text-[#4a2412]/70 mt-2">
                        Solve: L = Xl/(2π f), f = Xl/(2π L)
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}