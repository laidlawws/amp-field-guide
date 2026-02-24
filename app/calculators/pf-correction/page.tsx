"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Phase = "1ph" | "3ph";

const SQRT3 = Math.sqrt(3);

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function clampPF(pct: number) {
  // input in percent (0-100)
  if (!Number.isFinite(pct)) return NaN;
  const p = pct / 100;
  if (p <= 0 || p >= 1) return NaN;
  return p;
}

function fmt(n: number, unit: string, dp = 2) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 1000 ? 1 : abs >= 100 ? 2 : dp;
  return `${n.toFixed(d)} ${unit}`;
}

// kVAR required: Qc = P * (tan(phi1) - tan(phi2))
// where phi = arccos(PF)
function kvarRequired(P_kW: number, pf1: number, pf2: number) {
  const phi1 = Math.acos(pf1);
  const phi2 = Math.acos(pf2);
  return P_kW * (Math.tan(phi1) - Math.tan(phi2)); // kVAR
}

// capacitor current estimate:
// 1φ: I = (kVAR*1000) / V
// 3φ: I = (kVAR*1000) / (√3 * V)
function capCurrentA(kvar: number, V: number, phase: Phase) {
  const denom = phase === "3ph" ? SQRT3 * V : V;
  if (denom === 0) return NaN;
  return (kvar * 1000) / denom;
}

export default function PFCorrection() {
  const [pfExistingPct, setPfExistingPct] = useState("80");
  const [pfTargetPct, setPfTargetPct] = useState("95");
  const [kW, setKW] = useState("50");

  const [phase, setPhase] = useState<Phase>("3ph");
  const [voltage, setVoltage] = useState("480");

  const computed = useMemo(() => {
    const P = num(kW);
    const pf1 = clampPF(num(pfExistingPct));
    const pf2 = clampPF(num(pfTargetPct));
    const V = num(voltage);

    if (!Number.isFinite(P) || P <= 0) return { ok: false as const, msg: "Enter real power (kW) > 0." };
    if (!Number.isFinite(pf1)) return { ok: false as const, msg: "Existing PF must be between 1% and 99%." };
    if (!Number.isFinite(pf2)) return { ok: false as const, msg: "Target PF must be between 1% and 99%." };
    if (pf2 <= pf1) return { ok: false as const, msg: "Target PF must be greater than existing PF." };

    const kvar = kvarRequired(P, pf1, pf2);
    if (!Number.isFinite(kvar) || kvar <= 0) return { ok: false as const, msg: "No correction needed / invalid inputs." };

    const amps = Number.isFinite(V) && V > 0 ? capCurrentA(kvar, V, phase) : NaN;

    return {
      ok: true as const,
      kvar,
      amps,
      pf1,
      pf2,
      P,
    };
  }, [pfExistingPct, pfTargetPct, kW, voltage, phase]);

  const clear = () => {
    setPfExistingPct("80");
    setPfTargetPct("95");
    setKW("50");
    setPhase("3ph");
    setVoltage("480");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card
        title="Power Factor Correction Calculator"
        right={
          <button
            onClick={clear}
            className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-sm font-extrabold hover:opacity-90"
          >
            Reset
          </button>
        }
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">Existing PF (%)</div>
            <input className="input" inputMode="decimal" value={pfExistingPct} onChange={(e) => setPfExistingPct(e.target.value)} placeholder="e.g. 80" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Target PF (%)</div>
            <input className="input" inputMode="decimal" value={pfTargetPct} onChange={(e) => setPfTargetPct(e.target.value)} placeholder="e.g. 95" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Real Power (kW)</div>
            <input className="input" inputMode="decimal" value={kW} onChange={(e) => setKW(e.target.value)} placeholder="e.g. 50" />
            <div className="text-xs text-[#4a2412]/70">Use actual load kW (not kVA).</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">System</div>
            <select className="input" value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
              <option value="1ph">AC Single-Phase</option>
              <option value="3ph">AC Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Voltage (V) (optional)</div>
            <input className="input" inputMode="decimal" value={voltage} onChange={(e) => setVoltage(e.target.value)} placeholder="e.g. 480" />
            <div className="text-xs text-[#4a2412]/70">Used only to estimate capacitor current.</div>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4 md:col-span-3">
            {!computed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{computed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-[#4a2412]/70">Capacitor size needed</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#f26422]">{fmt(computed.kvar, "kVAR", 1)}</div>
                </div>

                <div>
                  <div className="text-sm text-[#4a2412]/70">Estimated capacitor current</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#f26422]">
                    {Number.isFinite(computed.amps) ? fmt(computed.amps, "A", 1) : "—"}
                  </div>
                  <div className="text-xs text-[#4a2412]/70">Based on entered voltage + phase.</div>
                </div>

                <div>
                  <div className="text-sm text-[#4a2412]/70">Summary</div>
                  <div className="mt-1 text-sm font-semibold text-[#4a2412]/80 leading-6">
                    {computed.P} kW from {Math.round(computed.pf1 * 100)}% → {Math.round(computed.pf2 * 100)}%
                  </div>
                  <div className="text-xs text-[#4a2412]/70 mt-1">
                    Formula: Qc = P × (tan φ₁ − tan φ₂), φ = arccos(PF)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-3 text-xs text-[#4a2412]/70 leading-5">
            Note: This gives required kVAR at the operating kW. Real installations also consider harmonics, switching steps, and utility requirements.
          </div>
        </div>
      </Card>
    </div>
  );
}