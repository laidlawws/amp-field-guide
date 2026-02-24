"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type System = "dc" | "1ph" | "3ph";
type FLCType = "standard" | "custom" | "nameplate_kw";

// Typical “field” defaults (not NEC table values)
function defaultsForHP(hp: number) {
  // crude but useful: bigger motors tend to have better efficiency and PF
  if (!Number.isFinite(hp) || hp <= 0) return { eff: 0.9, pf: 0.85 };

  if (hp <= 1) return { eff: 0.75, pf: 0.75 };
  if (hp <= 5) return { eff: 0.82, pf: 0.80 };
  if (hp <= 20) return { eff: 0.88, pf: 0.85 };
  if (hp <= 75) return { eff: 0.92, pf: 0.88 };
  return { eff: 0.94, pf: 0.90 };
}

const SQRT3 = Math.sqrt(3);

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function clamp01(v: number) {
  if (!Number.isFinite(v)) return NaN;
  if (v <= 0 || v > 1) return NaN;
  return v;
}

function fmt(n: number, unit: string, dp = 2) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 1000 ? 1 : abs >= 100 ? 2 : dp;
  return `${n.toFixed(d)} ${unit}`;
}

// FLC from mechanical HP:
// P_out(W) = HP * 746
// P_in(W)  = P_out / eff
// AC: P_in = V * I * PF (1φ) or √3 * V * I * PF (3φ)
// DC: P_in = V * I
function flcFromHP({
  system,
  hp,
  V,
  eff,
  pf,
}: {
  system: System;
  hp: number;
  V: number;
  eff: number;
  pf: number;
}) {
  const Pout = hp * 746; // W
  const Pin = Pout / eff;

  if (system === "dc") {
    if (V === 0) return NaN;
    return Pin / V;
  }

  const denom = (system === "3ph" ? SQRT3 * V : V) * pf;
  if (denom === 0) return NaN;
  return Pin / denom;
}

// FLC from nameplate kW (electrical real power):
// AC: P = V*I*PF (1φ) or √3*V*I*PF (3φ)
// DC: P = V*I
function flcFromkW({
  system,
  kW,
  V,
  pf,
}: {
  system: System;
  kW: number;
  V: number;
  pf: number;
}) {
  const P = kW * 1000; // W
  if (system === "dc") {
    if (V === 0) return NaN;
    return P / V;
  }
  const denom = (system === "3ph" ? SQRT3 * V : V) * pf;
  if (denom === 0) return NaN;
  return P / denom;
}

export default function MotorFLC() {
  const [system, setSystem] = useState<System>("3ph");
  const [flcType, setFlcType] = useState<FLCType>("standard");

  const [hp, setHp] = useState("10");
  const [volts, setVolts] = useState("480"); // “Armature Voltage Rating” for DC; line voltage for AC
  const [eff, setEff] = useState("0.90");
  const [pf, setPf] = useState("0.85");
  const [nameplateKW, setNameplateKW] = useState("0");

  // Update standard defaults when HP changes (only in standard mode)
  const hpNum = num(hp);
  const std = defaultsForHP(hpNum);

  const computed = useMemo(() => {
    const V = num(volts);
    if (!Number.isFinite(V) || V <= 0) return { ok: false as const, msg: "Enter a valid voltage > 0." };

    if (flcType === "nameplate_kw") {
      const kW = num(nameplateKW);
      if (!Number.isFinite(kW) || kW <= 0) return { ok: false as const, msg: "Enter nameplate kW > 0." };

      const pfUse = system === "dc" ? 1 : clamp01(num(pf));
      if (system !== "dc" && !Number.isFinite(pfUse)) return { ok: false as const, msg: "PF must be between 0 and 1." };

      const I = flcFromkW({ system, kW, V, pf: pfUse });
      return {
        ok: true as const,
        amps: I,
        note: "Using electrical real power (kW). This is typically the most accurate if you have it.",
      };
    }

    // HP-based
    const HP = num(hp);
    if (!Number.isFinite(HP) || HP <= 0) return { ok: false as const, msg: "Enter motor HP > 0." };

    let effUse: number;
    let pfUse: number;

    if (flcType === "standard") {
      effUse = std.eff;
      pfUse = system === "dc" ? 1 : std.pf;
    } else {
      effUse = clamp01(num(eff));
      pfUse = system === "dc" ? 1 : clamp01(num(pf));
      if (!Number.isFinite(effUse)) return { ok: false as const, msg: "Efficiency must be between 0 and 1." };
      if (system !== "dc" && !Number.isFinite(pfUse)) return { ok: false as const, msg: "PF must be between 0 and 1." };
    }

    const I = flcFromHP({ system, hp: HP, V, eff: effUse, pf: pfUse });

    return {
      ok: true as const,
      amps: I,
      used: { eff: effUse, pf: pfUse },
      note:
        flcType === "standard"
          ? "Standard estimate uses typical PF/eff defaults by motor size."
          : "Custom estimate uses your PF/eff inputs.",
    };
  }, [system, flcType, volts, hp, eff, pf, nameplateKW, std.eff, std.pf]);

  const reset = () => {
    setSystem("3ph");
    setFlcType("standard");
    setHp("10");
    setVolts("480");
    setEff("0.90");
    setPf("0.85");
    setNameplateKW("0");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card
        title="Motor FLC (Full Load Current) Calculator"
        right={
          <button
            onClick={reset}
            className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-sm font-extrabold hover:opacity-90"
          >
            Reset
          </button>
        }
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold">System</div>
            <select className="input" value={system} onChange={(e) => setSystem(e.target.value as System)}>
              <option value="dc">DC</option>
              <option value="1ph">AC Single-Phase</option>
              <option value="3ph">AC Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">FLC Type</div>
            <select className="input" value={flcType} onChange={(e) => setFlcType(e.target.value as FLCType)}>
              <option value="standard">Standard estimate (typical PF/eff)</option>
              <option value="custom">Custom PF & Efficiency</option>
              <option value="nameplate_kw">From nameplate kW</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold">
              {system === "dc" ? "Armature Voltage Rating (V)" : "Line Voltage (V)"}
            </div>
            <input className="input" inputMode="decimal" value={volts} onChange={(e) => setVolts(e.target.value)} placeholder="e.g. 480" />
          </div>

          {flcType !== "nameplate_kw" ? (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Motor HP</div>
              <input className="input" inputMode="decimal" value={hp} onChange={(e) => setHp(e.target.value)} placeholder="e.g. 10" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-extrabold">Nameplate kW</div>
              <input className="input" inputMode="decimal" value={nameplateKW} onChange={(e) => setNameplateKW(e.target.value)} placeholder="e.g. 7.5" />
            </div>
          )}

          {flcType === "custom" && (
            <>
              <div className="space-y-2">
                <div className="text-sm font-extrabold">Efficiency (0–1)</div>
                <input className="input" inputMode="decimal" value={eff} onChange={(e) => setEff(e.target.value)} placeholder="e.g. 0.90" />
              </div>

              {system !== "dc" ? (
                <div className="space-y-2">
                  <div className="text-sm font-extrabold">Power Factor (0–1)</div>
                  <input className="input" inputMode="decimal" value={pf} onChange={(e) => setPf(e.target.value)} placeholder="e.g. 0.85" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-extrabold">Power Factor</div>
                  <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-3 text-sm text-[#4a2412]/70">
                    Not used for DC (assumed PF = 1).
                  </div>
                </div>
              )}
            </>
          )}

          {flcType === "standard" && (
            <div className="md:col-span-2 rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
              <div className="text-sm text-[#4a2412]/70">Standard defaults used</div>
              <div className="mt-1 text-sm font-semibold text-[#4a2412]/80 leading-6">
                Efficiency ≈ <b>{std.eff.toFixed(2)}</b>
                {system !== "dc" ? (
                  <>
                    {" "}
                    • PF ≈ <b>{std.pf.toFixed(2)}</b>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <div className="md:col-span-3 rounded-2xl border border-[#e6d2a8] bg-white p-4">
            {!computed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{computed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4 items-start">
                <div>
                  <div className="text-sm text-[#4a2412]/70">Estimated FLC</div>
                  <div className="mt-1 text-3xl font-extrabold text-[#f26422]">{fmt(computed.amps, "A", 2)}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-[#4a2412]/70">Notes</div>
                  <div className="mt-1 text-sm font-semibold text-[#4a2412]/80 leading-6">{computed.note}</div>
                  <div className="mt-2 text-xs text-[#4a2412]/70 leading-5">
                    This is an estimate based on HP→watts and PF/eff assumptions. If you have motor nameplate current, use that for the
                    most accurate results. For code compliance sizing, use your applicable code method.
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