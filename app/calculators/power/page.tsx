"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type System = "dc" | "ac_1ph" | "ac_3ph";
type SolveFor = "current" | "voltage" | "kw" | "kva" | "hp";

const SQRT3 = Math.sqrt(3);

function n(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}
function nz(v: string) {
  const x = n(v);
  return Number.isFinite(x) ? x : NaN;
}
function clamp01(x: number) {
  if (!Number.isFinite(x)) return NaN;
  if (x <= 0 || x > 1) return NaN;
  return x;
}
function fmt(x: number, unit: string, dp = 3) {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  const d = a >= 1000 ? 1 : a >= 100 ? 2 : dp;
  return `${x.toFixed(d)} ${unit}`;
}

function fieldClass(isDisabled: boolean) {
  // Uses your existing .input base styles, then adds disabled styling
  return `input transition ${
    isDisabled
      ? "bg-[#f7f5f2] text-[#4a2412]/60 border-[#e6d2a8] cursor-not-allowed"
      : "bg-white text-[#4a2412]"
  }`;
}

// Real power (kW) from V, I, PF
function kwFromVI(system: System, V: number, I: number, pf: number) {
  if (system === "dc") return (V * I) / 1000;
  if (system === "ac_1ph") return (V * I * pf) / 1000;
  return (SQRT3 * V * I * pf) / 1000;
}

// Apparent power (kVA) from V, I
function kvaFromVI(system: System, V: number, I: number) {
  if (system === "dc" || system === "ac_1ph") return (V * I) / 1000;
  return (SQRT3 * V * I) / 1000;
}

function currentFromKVA(system: System, kVA: number, V: number) {
  if (system === "dc" || system === "ac_1ph") return (kVA * 1000) / V;
  return (kVA * 1000) / (SQRT3 * V);
}

function voltageFromKVA(system: System, kVA: number, I: number) {
  if (system === "dc" || system === "ac_1ph") return (kVA * 1000) / I;
  return (kVA * 1000) / (SQRT3 * I);
}

function denom(system: System, V: number, pf: number) {
  if (system === "dc" || system === "ac_1ph") return V * pf;
  return SQRT3 * V * pf;
}

// HP conversions (approx)
function hpFromKW(kW: number, eff: number) {
  return (kW * 1000 * eff) / 746;
}
function kwFromHP(hp: number, eff: number) {
  return (hp * 746) / (1000 * eff);
}

export default function PowerCalculator() {
  const [system, setSystem] = useState<System>("ac_3ph");
  const [solveFor, setSolveFor] = useState<SolveFor>("current");

  const [voltage, setVoltage] = useState("480");
  const [current, setCurrent] = useState("50");
  const [pf, setPf] = useState("0.85");
  const [eff, setEff] = useState("0.90");
  const [kw, setKw] = useState("0");
  const [kva, setKva] = useState("0");
  const [hp, setHp] = useState("0");

  const computed = useMemo(() => {
    const V = nz(voltage);
    const I = nz(current);
    const PF = system === "dc" ? 1 : clamp01(nz(pf));
    const Eff = clamp01(nz(eff));
    const kW = nz(kw);
    const kVA = nz(kva);
    const HP = nz(hp);

    if (solveFor === "current") {
      if (!Number.isFinite(V) || V <= 0) return { ok: false as const, msg: "Enter Voltage > 0." };

      if (Number.isFinite(kVA) && kVA > 0) {
        return { ok: true as const, value: currentFromKVA(system, kVA, V), label: "Current" };
      }

      if (Number.isFinite(kW) && kW > 0) {
        if (system !== "dc" && !Number.isFinite(PF)) return { ok: false as const, msg: "Enter Power Factor (0–1)." };
        const d = denom(system, V, system === "dc" ? 1 : PF);
        if (d <= 0) return { ok: false as const, msg: "Check inputs." };
        return { ok: true as const, value: (kW * 1000) / d, label: "Current" };
      }

      return { ok: false as const, msg: "Provide kVA or kW to solve for Current." };
    }

    if (solveFor === "voltage") {
      if (!Number.isFinite(I) || I <= 0) return { ok: false as const, msg: "Enter Current > 0." };

      if (Number.isFinite(kVA) && kVA > 0) {
        return { ok: true as const, value: voltageFromKVA(system, kVA, I), label: "Voltage" };
      }

      if (Number.isFinite(kW) && kW > 0) {
        if (system !== "dc" && !Number.isFinite(PF)) return { ok: false as const, msg: "Enter Power Factor (0–1)." };
        const d = (system === "dc" || system === "ac_1ph") ? I * (system === "dc" ? 1 : PF) : SQRT3 * I * PF;
        if (d <= 0) return { ok: false as const, msg: "Check inputs." };
        return { ok: true as const, value: (kW * 1000) / d, label: "Voltage" };
      }

      return { ok: false as const, msg: "Provide kVA or kW to solve for Voltage." };
    }

    if (solveFor === "kva") {
      if (!Number.isFinite(V) || V <= 0) return { ok: false as const, msg: "Enter Voltage > 0." };
      if (!Number.isFinite(I) || I <= 0) return { ok: false as const, msg: "Enter Current > 0." };
      return { ok: true as const, value: kvaFromVI(system, V, I), label: "kVA" };
    }

    if (solveFor === "kw") {
      if (Number.isFinite(HP) && HP > 0) {
        if (!Number.isFinite(Eff)) return { ok: false as const, msg: "Enter Efficiency (0–1) to convert HP → kW." };
        return { ok: true as const, value: kwFromHP(HP, Eff), label: "kW" };
      }

      if (!Number.isFinite(V) || V <= 0) return { ok: false as const, msg: "Enter Voltage > 0." };
      if (!Number.isFinite(I) || I <= 0) return { ok: false as const, msg: "Enter Current > 0." };
      if (system !== "dc" && !Number.isFinite(PF)) return { ok: false as const, msg: "Enter Power Factor (0–1)." };
      return { ok: true as const, value: kwFromVI(system, V, I, system === "dc" ? 1 : PF), label: "kW" };
    }

    // solveFor === "hp"
    if (Number.isFinite(kW) && kW > 0) {
      if (!Number.isFinite(Eff)) return { ok: false as const, msg: "Enter Efficiency (0–1) to convert kW → HP." };
      return { ok: true as const, value: hpFromKW(kW, Eff), label: "HP" };
    }

    return { ok: false as const, msg: "Provide kW to solve for HP." };
  }, [system, solveFor, voltage, current, pf, eff, kw, kva, hp]);

  const showPF = system !== "dc";
  const showEff = solveFor === "hp" || solveFor === "kw";

  // Disable the field being solved for (and grey it)
  const disabled = {
    voltage: solveFor === "voltage",
    current: solveFor === "current",
    kw: solveFor === "kw",
    kva: solveFor === "kva",
    hp: solveFor === "hp",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Power Calculator">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">System</div>
            <select className="input" value={system} onChange={(e) => setSystem(e.target.value as System)}>
              <option value="dc">DC</option>
              <option value="ac_1ph">AC Single-Phase</option>
              <option value="ac_3ph">AC Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Solve for</div>
            <select className="input" value={solveFor} onChange={(e) => setSolveFor(e.target.value as SolveFor)}>
              <option value="current">Current</option>
              <option value="voltage">Voltage</option>
              <option value="kw">kW (Real Power)</option>
              <option value="kva">kVA (Apparent Power)</option>
              <option value="hp">Horsepower</option>
            </select>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm text-[#4a2412]/70">Tip</div>
            <div className="mt-1 text-xs text-[#4a2412]/70 leading-5">
              The field you’re solving for is disabled and greyed out. Enter the known values and the solver will compute the missing one.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Voltage (V)</div>
            <input
              className={fieldClass(disabled.voltage)}
              inputMode="decimal"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              disabled={disabled.voltage}
              placeholder="e.g. 480"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Current (A)</div>
            <input
              className={fieldClass(disabled.current)}
              inputMode="decimal"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              disabled={disabled.current}
              placeholder="e.g. 50"
            />
          </div>

          {showPF ? (
            <div className="space-y-2">
              <div className="text-sm font-extrabold text-[#4a2412]">Power Factor (0–1)</div>
              <input
                className={fieldClass(false)}
                inputMode="decimal"
                value={pf}
                onChange={(e) => setPf(e.target.value)}
                placeholder="e.g. 0.85"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
              <div className="text-sm font-extrabold text-[#4a2412]">Power Factor</div>
              <div className="mt-1 text-xs text-[#4a2412]/70">Not used for DC (assumed PF = 1).</div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">kVA</div>
            <input
              className={fieldClass(disabled.kva)}
              inputMode="decimal"
              value={kva}
              onChange={(e) => setKva(e.target.value)}
              disabled={disabled.kva}
              placeholder="e.g. 25"
            />
            <div className="text-xs text-[#4a2412]/70">Best for finding Current or Voltage.</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">kW</div>
            <input
              className={fieldClass(disabled.kw)}
              inputMode="decimal"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              disabled={disabled.kw}
              placeholder="e.g. 20"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Horsepower (HP)</div>
            <input
              className={fieldClass(disabled.hp)}
              inputMode="decimal"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              disabled={disabled.hp}
              placeholder="e.g. 10"
            />
          </div>

          {showEff ? (
            <div className="space-y-2 md:col-span-3">
              <div className="text-sm font-extrabold text-[#4a2412]">Efficiency (0–1)</div>
              <input
                className={fieldClass(false)}
                inputMode="decimal"
                value={eff}
                onChange={(e) => setEff(e.target.value)}
                placeholder="e.g. 0.90"
              />
              <div className="text-xs text-[#4a2412]/70">Only required for HP ⇄ kW conversions.</div>
            </div>
          ) : null}

          <div className="md:col-span-3 rounded-2xl border border-[#e6d2a8] bg-white p-5">
            {!computed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{computed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4 items-start">
                <div>
                  <div className="text-sm text-[#4a2412]/70">Result</div>
                  <div className="mt-1 text-3xl font-extrabold text-[#f26422]">
                    {computed.label === "Current"
                      ? fmt(computed.value, "A", 3)
                      : computed.label === "Voltage"
                      ? fmt(computed.value, "V", 2)
                      : computed.label === "kVA"
                      ? fmt(computed.value, "kVA", 3)
                      : computed.label === "kW"
                      ? fmt(computed.value, "kW", 3)
                      : fmt(computed.value, "HP", 3)}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-[#4a2412]/70">How it solved</div>
                  <div className="mt-1 text-sm text-[#4a2412]/80 leading-6">
                    For Current/Voltage: prefers <b>kVA</b> if provided, otherwise uses <b>kW (+PF)</b>.
                    For kW: uses <b>Voltage + Current (+PF)</b> or <b>HP (+eff)</b>.
                  </div>
                  <div className="mt-2 text-xs text-[#4a2412]/70">
                    If you’re solving for Voltage, the Voltage field is disabled/greyed to prevent confusion (same for any solved field).
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}