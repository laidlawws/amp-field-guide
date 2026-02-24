"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Phase = "1ph" | "3ph";
type Material = "copper" | "aluminum";

type VDResult =
  | { ok: false; msg: string }
  | { ok: true; rPer1000: number; vd: number; pct: number; loadV: number };

const SQRT3 = Math.sqrt(3);

// Resistivity at 20°C (ohm-meter)
const RHO_20: Record<Material, number> = {
  copper: 1.724e-8,
  aluminum: 2.826e-8,
};

// Temperature coefficient (per °C), approximate
const ALPHA: Record<Material, number> = {
  copper: 0.00393,
  aluminum: 0.00403,
};

// 1 circular mil in m^2
const CM_TO_M2 = (Math.PI / 4) * Math.pow(0.001 * 0.0254, 2);

// Common sizes. You asked “use AWG”; I included kcmil too because it’s common for feeders.
// If you want strictly AWG only, tell me and I’ll remove kcmil options.
const SIZES: { key: string; label: string; type: "awg" | "kcmil"; value: number }[] = [
  // AWG
  { key: "14", label: "14 AWG", type: "awg", value: 14 },
  { key: "12", label: "12 AWG", type: "awg", value: 12 },
  { key: "10", label: "10 AWG", type: "awg", value: 10 },
  { key: "8", label: "8 AWG", type: "awg", value: 8 },
  { key: "6", label: "6 AWG", type: "awg", value: 6 },
  { key: "4", label: "4 AWG", type: "awg", value: 4 },
  { key: "3", label: "3 AWG", type: "awg", value: 3 },
  { key: "2", label: "2 AWG", type: "awg", value: 2 },
  { key: "1", label: "1 AWG", type: "awg", value: 1 },
  { key: "1/0", label: "1/0 AWG", type: "awg", value: 0 },
  { key: "2/0", label: "2/0 AWG", type: "awg", value: -1 },
  { key: "3/0", label: "3/0 AWG", type: "awg", value: -2 },
  { key: "4/0", label: "4/0 AWG", type: "awg", value: -3 },

  // kcmil (optional but useful)
  { key: "250", label: "250 kcmil", type: "kcmil", value: 250 },
  { key: "300", label: "300 kcmil", type: "kcmil", value: 300 },
  { key: "350", label: "350 kcmil", type: "kcmil", value: 350 },
  { key: "400", label: "400 kcmil", type: "kcmil", value: 400 },
  { key: "500", label: "500 kcmil", type: "kcmil", value: 500 },
];

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// AWG diameter in inches: d(in) = 0.005 * 92^((36-awg)/39)
// circular mil area = (d(mils))^2, where mils = 1000 * inches
function awgToCircularMils(awg: number) {
  const d_in = 0.005 * Math.pow(92, (36 - awg) / 39);
  const d_mils = d_in * 1000;
  return d_mils * d_mils; // circular mils
}

function sizeToAreaM2(sizeKey: string) {
  const item = SIZES.find((s) => s.key === sizeKey);
  if (!item) return NaN;

  if (item.type === "awg") {
    const cm = awgToCircularMils(item.value);
    return cm * CM_TO_M2;
  }

  // kcmil: 1 kcmil = 1000 circular mils
  const cm = item.value * 1000;
  return cm * CM_TO_M2;
}

function resistancePerFootOhms(material: Material, areaM2: number, tempC: number) {
  // R20 per meter = rho/A. Adjust to temp:
  const rho20 = RHO_20[material];
  const alpha = ALPHA[material];

  const r20_per_m = rho20 / areaM2;
  const rT_per_m = r20_per_m * (1 + alpha * (tempC - 20));

  // per foot
  return rT_per_m * 0.3048;
}

function fmt(n: number, unit: string, dp = 3) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const decimals = abs >= 1000 ? 1 : abs >= 100 ? 2 : dp;
  return `${n.toFixed(decimals)} ${unit}`;
}

export default function VoltageDrop() {
  const [phase, setPhase] = useState<Phase>("3ph");
  const [material, setMaterial] = useState<Material>("copper");
  const [size, setSize] = useState<string>("6");

  const [sourceV, setSourceV] = useState("480");
  const [amps, setAmps] = useState("40");
  const [lengthFt, setLengthFt] = useState("150");
  const [tempC, setTempC] = useState("75"); // default for typical termination rating usage

  const result = useMemo<VDResult>(() => {
    const V = num(sourceV);
    const I = num(amps);
    const L = num(lengthFt); // one-way length
    const T = num(tempC);

    if (![V, I, L, T].every(Number.isFinite)) {
      return { ok: false, msg: "Enter Source V, Current, Length, and Temp." };
    }
    if (V <= 0 || I < 0 || L < 0) {
      return { ok: false, msg: "Voltage must be >0. Current/Length must be ≥0." };
    }

    const areaM2 = sizeToAreaM2(size);
    if (!Number.isFinite(areaM2) || areaM2 <= 0) {
      return { ok: false, msg: "Invalid conductor size." };
    }

    const rPerFt = resistancePerFootOhms(material, areaM2, T);

    // total path factor:
    // 1φ: 2 conductors in series for the circuit path (hot+neutral/hot)
    // 3φ: use √3 factor
    const factor = phase === "1ph" ? 2 : SQRT3;

    const vd = factor * I * rPerFt * L; // volts
    const pct = (vd / V) * 100;
    const loadV = V - vd;

    return {
      ok: true,
      rPer1000: rPerFt * 1000,
      vd,
      pct,
      loadV,
    };
  }, [sourceV, amps, lengthFt, tempC, phase, material, size]);

  const clear = () => {
    setSourceV("480");
    setAmps("40");
    setLengthFt("150");
    setTempC("75");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card
        title="Voltage Drop Calculator"
        right={
          <button
            onClick={clear}
            className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-sm font-extrabold hover:opacity-90"
          >
            Reset
          </button>
        }
      >
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">System</div>
            <select className="input" value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
              <option value="1ph">AC Single-Phase</option>
              <option value="3ph">AC Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Conductor material</div>
            <select className="input" value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Conductor size</div>
            <select className="input" value={size} onChange={(e) => setSize(e.target.value)}>
              {SIZES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">Source voltage (V)</div>
            <input className="input" inputMode="decimal" value={sourceV} onChange={(e) => setSourceV(e.target.value)} placeholder="e.g. 480" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Load current (A)</div>
            <input className="input" inputMode="decimal" value={amps} onChange={(e) => setAmps(e.target.value)} placeholder="e.g. 40" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">One-way length (ft)</div>
            <input className="input" inputMode="decimal" value={lengthFt} onChange={(e) => setLengthFt(e.target.value)} placeholder="e.g. 150" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">Conductor temp (°C)</div>
            <input className="input" inputMode="decimal" value={tempC} onChange={(e) => setTempC(e.target.value)} placeholder="e.g. 75" />
          </div>
        </div>
      </Card>

      <Card title="Results">
        {!result.ok ? (
          <div className="text-sm text-[#4a2412]/70">{result.msg}</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              <div className="text-sm text-[#4a2412]/70">Resistance used</div>
              <div className="mt-1 text-xl font-extrabold text-[#f26422]">
                {fmt(result.rPer1000, "Ω / 1000 ft", 4)}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              <div className="text-sm text-[#4a2412]/70">Voltage drop</div>
              <div className="mt-1 text-xl font-extrabold text-[#f26422]">
                {fmt(result.vd, "V", 3)}
              </div>
              <div className="mt-1 text-sm font-semibold text-[#4a2412]/75">
                {fmt(result.pct, "%", 2)}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              <div className="text-sm text-[#4a2412]/70">Estimated load voltage</div>
              <div className="mt-1 text-xl font-extrabold text-[#f26422]">
                {fmt(result.loadV, "V", 3)}
              </div>
            </div>

            <div className="md:col-span-3 text-xs text-[#4a2412]/70 leading-5">
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}