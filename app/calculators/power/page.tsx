"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Phase = "dc" | "1ph" | "3ph";
type Mode =
  | "amps_from_hp"
  | "hp_from_vi"
  | "watts_from_vi"
  | "kw_from_vi"
  | "kva_from_vi";

const SQRT3 = Math.sqrt(3);

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function fmt(n: number, unit: string, decimals = 3) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 1000 ? 1 : abs >= 100 ? 2 : decimals;
  return `${n.toFixed(d)} ${unit}`;
}

function phaseFactor(phase: Phase) {
  return phase === "3ph" ? SQRT3 : 1;
}

function isAC(phase: Phase) {
  return phase === "1ph" || phase === "3ph";
}

/**
 * Electrical real power input (W):
 *  - DC: P = V*I
 *  - AC 1φ: P = V*I*PF
 *  - AC 3φ: P = √3*V*I*PF
 */
function wattsFromVI(V: number, I: number, phase: Phase, pf: number) {
  if (phase === "dc") return V * I;
  return phaseFactor(phase) * V * I * pf;
}

/**
 * Apparent power (VA):
 *  - 1φ: S = V*I
 *  - 3φ: S = √3*V*I
 *  - DC: treat as V*I (PF not applicable)
 */
function vaFromVI(V: number, I: number, phase: Phase) {
  return phaseFactor(phase) * V * I;
}

/**
 * Mechanical horsepower out:
 * HP = (P_in * eff) / 746
 */
function hpFromVI(V: number, I: number, phase: Phase, pf: number, eff: number) {
  const Pin = wattsFromVI(V, I, phase, phase === "dc" ? 1 : pf);
  return (Pin * eff) / 746;
}

/**
 * Current from horsepower out:
 * I = (HP*746) / (eff * PF * V * phaseFactor)
 * DC assumes PF=1.
 */
function ampsFromHP(HP: number, V: number, phase: Phase, pf: number, eff: number) {
  const pfUse = phase === "dc" ? 1 : pf;
  const denom = eff * pfUse * V * phaseFactor(phase);
  if (denom === 0) return NaN;
  return (HP * 746) / denom;
}

export default function Power() {
  const [mode, setMode] = useState<Mode>("amps_from_hp");
  const [phase, setPhase] = useState<Phase>("3ph");

  // Common inputs
  const [V, setV] = useState("");
  const [I, setI] = useState("");
  const [hp, setHp] = useState("");
  const [pf, setPf] = useState("0.9");
  const [eff, setEff] = useState("0.9");

  const showPF = isAC(phase) && (mode === "amps_from_hp" || mode === "hp_from_vi" || mode === "watts_from_vi" || mode === "kw_from_vi");
  const showEff = mode === "amps_from_hp" || mode === "hp_from_vi";

  const calc = useMemo(() => {
    const v = num(V);
    const i = num(I);
    const HP = num(hp);

    const PF = showPF ? num(pf) : 1;
    const Eff = showEff ? num(eff) : 1;

    // validate PF/Eff ranges if provided
    const pfOk = !showPF || (Number.isFinite(PF) && PF > 0 && PF <= 1);
    const effOk = !showEff || (Number.isFinite(Eff) && Eff > 0 && Eff <= 1);

    if (!pfOk || !effOk) {
      return { ok: false, out: "PF/Eff must be between 0 and 1." };
    }

    try {
      if (mode === "amps_from_hp") {
        if (!Number.isFinite(HP) || !Number.isFinite(v)) return { ok: false, out: "Enter HP and Voltage." };
        const amps = ampsFromHP(HP, v, phase, PF, Eff);
        return { ok: true, out: fmt(amps, "A") };
      }

      if (mode === "hp_from_vi") {
        if (!Number.isFinite(v) || !Number.isFinite(i)) return { ok: false, out: "Enter Voltage and Current." };
        const outHP = hpFromVI(v, i, phase, PF, Eff);
        return { ok: true, out: fmt(outHP, "HP") };
      }

      if (mode === "watts_from_vi") {
        if (!Number.isFinite(v) || !Number.isFinite(i)) return { ok: false, out: "Enter Voltage and Current." };
        const W = wattsFromVI(v, i, phase, phase === "dc" ? 1 : PF);
        return { ok: true, out: fmt(W, "W", 2) };
      }

      if (mode === "kw_from_vi") {
        if (!Number.isFinite(v) || !Number.isFinite(i)) return { ok: false, out: "Enter Voltage and Current." };
        const W = wattsFromVI(v, i, phase, phase === "dc" ? 1 : PF);
        return { ok: true, out: fmt(W / 1000, "kW") };
      }

      if (mode === "kva_from_vi") {
        if (!Number.isFinite(v) || !Number.isFinite(i)) return { ok: false, out: "Enter Voltage and Current." };
        const VA = vaFromVI(v, i, phase);
        return { ok: true, out: fmt(VA / 1000, "kVA") };
      }

      return { ok: false, out: "Select a mode." };
    } catch {
      return { ok: false, out: "Calculation error." };
    }
  }, [mode, phase, V, I, hp, pf, eff, showPF, showEff]);

  const title = useMemo(() => {
    switch (mode) {
      case "amps_from_hp":
        return "Amps from Horsepower";
      case "hp_from_vi":
        return "Horsepower from Volts & Amps";
      case "watts_from_vi":
        return "Watts from Volts & Amps";
      case "kw_from_vi":
        return "Kilowatts from Volts & Amps";
      case "kva_from_vi":
        return "kVA from Volts & Amps";
    }
  }, [mode]);

  const clear = () => {
    setV("");
    setI("");
    setHp("");
    setPf("0.9");
    setEff("0.9");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card
        title="Power & Horsepower Calculator"
        right={
          <button
            className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-sm font-extrabold hover:opacity-90"
            onClick={clear}
          >
            Clear
          </button>
        }
      >
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">What do you want to find?</div>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="amps_from_hp">Amps from Horsepower</option>
              <option value="hp_from_vi">Horsepower from Volts & Amps</option>
              <option value="watts_from_vi">Watts from Volts & Amps</option>
              <option value="kw_from_vi">Kilowatts from Volts & Amps</option>
              <option value="kva_from_vi">kVA from Volts & Amps</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">System type</div>
            <select className="input" value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
              <option value="dc">DC</option>
              <option value="1ph">AC Single-Phase</option>
              <option value="3ph">AC Three-Phase</option>
            </select>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm text-[#4a2412]/70">Mode</div>
            <div className="mt-1 text-lg font-extrabold">{title}</div>
            <div className="mt-2 text-xs text-[#4a2412]/70 leading-5">
              Notes: AC uses PF for real power. HP assumes mechanical output = electrical input × efficiency.
            </div>
          </div>
        </div>
      </Card>

      <Card title={`Inputs: ${title}`}>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Voltage */}
          {(mode !== "amps_from_hp" || true) && (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Voltage (V)</div>
              <input className="input" inputMode="decimal" placeholder="e.g. 480" value={V} onChange={(e) => setV(e.target.value)} />
            </div>
          )}

          {/* Current */}
          {(mode === "hp_from_vi" || mode === "watts_from_vi" || mode === "kw_from_vi" || mode === "kva_from_vi") && (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Current (A)</div>
              <input className="input" inputMode="decimal" placeholder="e.g. 35" value={I} onChange={(e) => setI(e.target.value)} />
            </div>
          )}

          {/* Horsepower */}
          {mode === "amps_from_hp" && (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Horsepower (HP)</div>
              <input className="input" inputMode="decimal" placeholder="e.g. 10" value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>
          )}

          {/* Power Factor */}
          {showPF && (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Power Factor (PF)</div>
              <input className="input" inputMode="decimal" placeholder="0–1 (e.g. 0.9)" value={pf} onChange={(e) => setPf(e.target.value)} />
            </div>
          )}

          {/* Efficiency */}
          {showEff && (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Efficiency</div>
              <input className="input" inputMode="decimal" placeholder="0–1 (e.g. 0.9)" value={eff} onChange={(e) => setEff(e.target.value)} />
            </div>
          )}

          {/* Results */}
          <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4 md:col-span-3">
            <div className="text-sm text-[#4a2412]/70">Result</div>
            <div className="mt-1 text-2xl font-extrabold text-[#f26422]">{calc.out}</div>
            {!calc.ok && <div className="mt-2 text-sm text-[#4a2412]/70">Fill the required fields above.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}