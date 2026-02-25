"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Phase = "1ph" | "3ph";
type LoadInput = "amps" | "kw" | "kva" | "hp";

const SQRT3 = Math.sqrt(3);

function n(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}
function clampPos(x: number) {
  return Number.isFinite(x) && x > 0 ? x : NaN;
}
function clamp01(x: number) {
  return Number.isFinite(x) && x > 0 && x <= 1 ? x : NaN;
}
function fmt(x: number, unit: string, dp = 2) {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  const d = a >= 1000 ? 1 : a >= 100 ? 2 : dp;
  return `${x.toFixed(d)} ${unit}`;
}

function flcFromKVA(phase: Phase, kVA: number, V: number) {
  // V = transformer voltage for 1φ, line-to-line for 3φ
  const denom = phase === "3ph" ? SQRT3 * V : V;
  return (kVA * 1000) / denom;
}

function availableFaultFromZ(phase: Phase, kVA: number, V: number, zPct: number) {
  // I_sc ≈ I_fl / Zpu
  const Ifl = flcFromKVA(phase, kVA, V);
  const zpu = zPct / 100;
  return Ifl / zpu;
}

const COMMON_KVA = [
  3, 5, 7.5, 10, 15, 25, 30, 37.5, 45, 50, 75, 100, 112.5, 150, 167, 225, 300, 400, 500, 600, 750, 1000, 1500, 2000, 2500,
];

function pickNextKVA(required: number) {
  for (const k of COMMON_KVA) if (k >= required) return k;
  return Math.ceil(required / 100) * 100;
}

function kvaFromVI(phase: Phase, V: number, I: number) {
  return (phase === "3ph" ? SQRT3 * V * I : V * I) / 1000;
}

function kwToKva(kW: number, pf: number) {
  return kW / pf;
}

function hpToKW(hp: number, eff: number) {
  // electrical input kW ≈ hp*746 / (1000*eff)
  return (hp * 746) / (1000 * eff);
}

export default function TransformersPage() {
  // =========================
  // 1) IMPEDANCE / FAULT (Primary + Secondary)
  // =========================
  const [impPhase, setImpPhase] = useState<Phase>("3ph");
  const [impKVA, setImpKVA] = useState("500");
  const [impZ, setImpZ] = useState("5.75"); // %Z

  const [impVPrimary, setImpVPrimary] = useState("12470"); // L-L if 3φ, or transformer voltage if 1φ
  const [impVSecondary, setImpVSecondary] = useState("480");

  const impComputed = useMemo(() => {
    const kVA = clampPos(n(impKVA));
    const zPct = clampPos(n(impZ));
    const Vp = clampPos(n(impVPrimary));
    const Vs = clampPos(n(impVSecondary));

    if (!Number.isFinite(kVA)) return { ok: false as const, msg: "Enter kVA > 0." };
    if (!Number.isFinite(Vp)) return { ok: false as const, msg: "Enter primary voltage > 0." };
    if (!Number.isFinite(Vs)) return { ok: false as const, msg: "Enter secondary voltage > 0." };
    if (!Number.isFinite(zPct) || zPct <= 0 || zPct >= 100) return { ok: false as const, msg: "Enter %Z between 0 and 100." };

    const Ifl_p = flcFromKVA(impPhase, kVA, Vp);
    const Ifl_s = flcFromKVA(impPhase, kVA, Vs);

    const Isc_p = availableFaultFromZ(impPhase, kVA, Vp, zPct);
    const Isc_s = availableFaultFromZ(impPhase, kVA, Vs, zPct);

    const turnsRatio = Vp / Vs; // magnitude ratio

    return {
      ok: true as const,
      zpu: zPct / 100,
      Ifl_p,
      Ifl_s,
      Isc_p,
      Isc_s,
      turnsRatio,
    };
  }, [impPhase, impKVA, impZ, impVPrimary, impVSecondary]);

  // =========================
  // 2) FLC (simple)
  // =========================
  const [flcPhase, setFlcPhase] = useState<Phase>("3ph");
  const [flcKVA, setFlcKVA] = useState("75");
  const [flcV, setFlcV] = useState("480");

  const flcComputed = useMemo(() => {
    const kVA = clampPos(n(flcKVA));
    const V = clampPos(n(flcV));
    if (!Number.isFinite(kVA)) return { ok: false as const, msg: "Enter kVA > 0." };
    if (!Number.isFinite(V)) return { ok: false as const, msg: "Enter voltage > 0." };
    return { ok: true as const, I: flcFromKVA(flcPhase, kVA, V) };
  }, [flcPhase, flcKVA, flcV]);

  // =========================
  // 3) SIZING (amps/kW/kVA/HP)
  // =========================
  const [sizePhase, setSizePhase] = useState<Phase>("3ph");
  const [sizeV, setSizeV] = useState("480");
  const [sizeInput, setSizeInput] = useState<LoadInput>("amps");

  const [sizeAmps, setSizeAmps] = useState("200");
  const [sizeKW, setSizeKW] = useState("100");
  const [sizeKVA, setSizeKVA] = useState("125");
  const [sizeHP, setSizeHP] = useState("50");

  const [sizePF, setSizePF] = useState("0.9");
  const [sizeEff, setSizeEff] = useState("0.92");

  const [contLoad, setContLoad] = useState(true);
  const [designMarginPct, setDesignMarginPct] = useState("10");

  const sizeComputed = useMemo(() => {
    const V = clampPos(n(sizeV));
    if (!Number.isFinite(V)) return { ok: false as const, msg: "Enter voltage > 0." };

    const marginPct = n(designMarginPct);
    const marginMult = Number.isFinite(marginPct) && marginPct >= 0 ? 1 + marginPct / 100 : 1;

    const pf = clamp01(n(sizePF));
    const eff = clamp01(n(sizeEff));

    let baseKVA: number;

    if (sizeInput === "amps") {
      const I = clampPos(n(sizeAmps));
      if (!Number.isFinite(I)) return { ok: false as const, msg: "Enter load current > 0." };
      baseKVA = kvaFromVI(sizePhase, V, I);
    } else if (sizeInput === "kva") {
      const kVA = clampPos(n(sizeKVA));
      if (!Number.isFinite(kVA)) return { ok: false as const, msg: "Enter load kVA > 0." };
      baseKVA = kVA;
    } else if (sizeInput === "kw") {
      const kW = clampPos(n(sizeKW));
      if (!Number.isFinite(kW)) return { ok: false as const, msg: "Enter load kW > 0." };
      if (!Number.isFinite(pf)) return { ok: false as const, msg: "Enter PF between 0 and 1." };
      baseKVA = kwToKva(kW, pf);
    } else {
      // HP
      const hp = clampPos(n(sizeHP));
      if (!Number.isFinite(hp)) return { ok: false as const, msg: "Enter HP > 0." };
      if (!Number.isFinite(eff)) return { ok: false as const, msg: "Enter efficiency between 0 and 1." };
      if (!Number.isFinite(pf)) return { ok: false as const, msg: "Enter PF between 0 and 1." };
      const kW_in = hpToKW(hp, eff);
      baseKVA = kwToKva(kW_in, pf);
    }

    const contMult = contLoad ? 1.25 : 1.0;
    const designKVA = baseKVA * contMult * marginMult;
    const recommended = pickNextKVA(designKVA);

    const estFLC = flcFromKVA(sizePhase, recommended, V);

    return {
      ok: true as const,
      baseKVA,
      designKVA,
      recommended,
      estFLC,
      contMult,
      marginMult,
    };
  }, [sizePhase, sizeV, sizeInput, sizeAmps, sizeKVA, sizeKW, sizeHP, sizePF, sizeEff, contLoad, designMarginPct]);

  // =========================
  // 4) BUCK / BOOST
  // =========================
  const [bbMode, setBbMode] = useState<"boost" | "buck">("boost");
  const [bbSourceV, setBbSourceV] = useState("240");
  const [bbSecondaryV, setBbSecondaryV] = useState("24"); // the “boost/buck” winding voltage
  const [bbWiring, setBbWiring] = useState<"series_aiding" | "series_opposing">("series_aiding");

  const bbComputed = useMemo(() => {
    const Vs = clampPos(n(bbSourceV));
    const Vx = clampPos(n(bbSecondaryV));
    if (!Number.isFinite(Vs)) return { ok: false as const, msg: "Enter source voltage > 0." };
    if (!Number.isFinite(Vx)) return { ok: false as const, msg: "Enter boost/buck winding voltage > 0." };

    // series aiding = add; series opposing = subtract (but wiring label clarifies)
    const add = bbWiring === "series_aiding";

    // interpret requested mode
    // boost: want increase; buck: want decrease
    // final result depends on mode + wiring, but we compute both "add/sub" outcome and user-selected expectation
    const V_add = Vs + Vx;
    const V_sub = Math.max(0, Vs - Vx);

    const Vout =
      bbMode === "boost"
        ? (add ? V_add : V_sub)
        : (add ? V_sub : V_add);

    const pct = Vs > 0 ? ((Vout - Vs) / Vs) * 100 : NaN;

    return { ok: true as const, V_add, V_sub, Vout, pct };
  }, [bbMode, bbSourceV, bbSecondaryV, bbWiring]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Transformers">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm font-extrabold text-[#4a2412]">Tools</div>
            <ul className="mt-2 text-sm text-[#4a2412]/80 list-disc pl-5 space-y-1">
              <li>Impedance & available fault (primary + secondary)</li>
              <li>Full load current (FLC)</li>
              <li>Sizing (amps / kW / kVA / HP)</li>
              <li>Buck/Boost voltage calculator</li>
            </ul>
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-[#e6d2a8] bg-white p-4 text-sm text-[#4a2412]/75 leading-6">
            <b>Reminder:</b> Fault current at the load is often lower than “at transformer secondary terminals” due to feeder impedance.
            For sizing, consider motor starting/inrush, harmonics, and duty cycle.
          </div>
        </div>
      </Card>

      {/* 1) Impedance */}
      <Card title="Impedance / Available Fault Current (Primary + Secondary)">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">System</div>
            <select className="input" value={impPhase} onChange={(e) => setImpPhase(e.target.value as Phase)}>
              <option value="1ph">Single-Phase</option>
              <option value="3ph">Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">kVA rating</div>
            <input className="input" inputMode="decimal" value={impKVA} onChange={(e) => setImpKVA(e.target.value)} placeholder="e.g. 500" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Impedance (%Z)</div>
            <input className="input" inputMode="decimal" value={impZ} onChange={(e) => setImpZ(e.target.value)} placeholder="e.g. 5.75" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">{impPhase === "3ph" ? "Primary (L-L)" : "Primary (V)"}</div>
            <input className="input" inputMode="decimal" value={impVPrimary} onChange={(e) => setImpVPrimary(e.target.value)} placeholder="e.g. 12470" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">{impPhase === "3ph" ? "Secondary (L-L)" : "Secondary (V)"}</div>
            <input className="input" inputMode="decimal" value={impVSecondary} onChange={(e) => setImpVSecondary(e.target.value)} placeholder="e.g. 480" />
          </div>

          <div className="md:col-span-5 rounded-2xl border border-[#e6d2a8] bg-white p-5">
            {!impComputed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{impComputed.msg}</div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
                  <div className="text-sm font-extrabold text-[#4a2412]">Turns ratio</div>
                  <div className="mt-1 text-xl font-extrabold text-[#4a2412]">
                    {impComputed.turnsRatio.toFixed(3)} : 1
                  </div>
                  <div className="mt-1 text-xs text-[#4a2412]/70">
                    (Primary voltage ÷ Secondary voltage)
                  </div>
                  <div className="mt-3 text-xs text-[#4a2412]/70">
                    Z (per-unit): <b>{impComputed.zpu.toFixed(4)}</b>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
                  <div className="text-sm font-extrabold text-[#4a2412]">Primary side</div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-[#4a2412]/70">FLC</div>
                      <div className="font-extrabold text-[#4a2412]">{fmt(impComputed.Ifl_p, "A", 2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a2412]/70">Available fault</div>
                      <div className="font-extrabold text-[#f26422]">{fmt(impComputed.Isc_p, "A", 0)}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
                  <div className="text-sm font-extrabold text-[#4a2412]">Secondary side</div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-[#4a2412]/70">FLC</div>
                      <div className="font-extrabold text-[#4a2412]">{fmt(impComputed.Ifl_s, "A", 2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a2412]/70">Available fault</div>
                      <div className="font-extrabold text-[#f26422]">{fmt(impComputed.Isc_s, "A", 0)}</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 mt-2 text-xs text-[#4a2412]/70 leading-5">
                  Approx method: <b>I<sub>sc</sub> ≈ I<sub>fl</sub> / (Z%/100)</b> (at transformer terminals).
                  Upstream source impedance + conductor impedance will reduce fault current away from the transformer.
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2) FLC */}
      <Card title="Transformer Full Load Current (FLC)">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">System</div>
            <select className="input" value={flcPhase} onChange={(e) => setFlcPhase(e.target.value as Phase)}>
              <option value="1ph">Single-Phase</option>
              <option value="3ph">Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">kVA rating</div>
            <input className="input" inputMode="decimal" value={flcKVA} onChange={(e) => setFlcKVA(e.target.value)} placeholder="e.g. 75" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">{flcPhase === "3ph" ? "Voltage (L-L)" : "Voltage"}</div>
            <input className="input" inputMode="decimal" value={flcV} onChange={(e) => setFlcV(e.target.value)} placeholder="e.g. 480" />
          </div>

          <div className="md:col-span-3 rounded-2xl border border-[#e6d2a8] bg-white p-5">
            {!flcComputed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{flcComputed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 items-start">
                <div>
                  <div className="text-sm text-[#4a2412]/70">Full-load current</div>
                  <div className="mt-1 text-3xl font-extrabold text-[#f26422]">{fmt(flcComputed.I, "A", 2)}</div>
                </div>

                <div className="text-sm text-[#4a2412]/75 leading-6">
                  Formula:
                  <div className="mt-2 text-xs text-[#4a2412]/70">
                    1φ: I = (kVA×1000) / V<br />
                    3φ: I = (kVA×1000) / (√3 × V<sub>L-L</sub>)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 3) Sizing */}
      <Card title="Transformer Sizing (Amps / kW / kVA / HP)">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">System</div>
            <select className="input" value={sizePhase} onChange={(e) => setSizePhase(e.target.value as Phase)}>
              <option value="1ph">Single-Phase</option>
              <option value="3ph">Three-Phase</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">{sizePhase === "3ph" ? "Voltage (L-L)" : "Voltage"}</div>
            <input className="input" inputMode="decimal" value={sizeV} onChange={(e) => setSizeV(e.target.value)} placeholder="e.g. 480" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Load input</div>
            <select className="input" value={sizeInput} onChange={(e) => setSizeInput(e.target.value as LoadInput)}>
              <option value="amps">Load current (A)</option>
              <option value="kw">Real power (kW)</option>
              <option value="kva">Apparent power (kVA)</option>
              <option value="hp">Motor horsepower (HP)</option>
            </select>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="text-sm font-extrabold text-[#4a2412]">Options</div>
            <label className="mt-2 flex items-center gap-2 text-sm text-[#4a2412]/80">
              <input type="checkbox" checked={contLoad} onChange={(e) => setContLoad(e.target.checked)} />
              Treat as continuous load (×1.25)
            </label>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-[#4a2412]">Design margin (%)</div>
              <input className="input mt-1" inputMode="decimal" value={designMarginPct} onChange={(e) => setDesignMarginPct(e.target.value)} placeholder="e.g. 10" />
            </div>
          </div>

          {sizeInput === "amps" && (
            <div className="md:col-span-2 space-y-2">
              <div className="text-sm font-extrabold text-[#4a2412]">Load current (A)</div>
              <input className="input" inputMode="decimal" value={sizeAmps} onChange={(e) => setSizeAmps(e.target.value)} placeholder="e.g. 200" />
            </div>
          )}

          {sizeInput === "kva" && (
            <div className="md:col-span-2 space-y-2">
              <div className="text-sm font-extrabold text-[#4a2412]">Load (kVA)</div>
              <input className="input" inputMode="decimal" value={sizeKVA} onChange={(e) => setSizeKVA(e.target.value)} placeholder="e.g. 125" />
            </div>
          )}

          {sizeInput === "kw" && (
            <>
              <div className="md:col-span-2 space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Load (kW)</div>
                <input className="input" inputMode="decimal" value={sizeKW} onChange={(e) => setSizeKW(e.target.value)} placeholder="e.g. 100" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Power factor (0–1)</div>
                <input className="input" inputMode="decimal" value={sizePF} onChange={(e) => setSizePF(e.target.value)} placeholder="e.g. 0.9" />
              </div>
            </>
          )}

          {sizeInput === "hp" && (
            <>
              <div className="md:col-span-2 space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Motor HP</div>
                <input className="input" inputMode="decimal" value={sizeHP} onChange={(e) => setSizeHP(e.target.value)} placeholder="e.g. 50" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Efficiency (0–1)</div>
                <input className="input" inputMode="decimal" value={sizeEff} onChange={(e) => setSizeEff(e.target.value)} placeholder="e.g. 0.92" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Power factor (0–1)</div>
                <input className="input" inputMode="decimal" value={sizePF} onChange={(e) => setSizePF(e.target.value)} placeholder="e.g. 0.9" />
              </div>
            </>
          )}

          <div className="md:col-span-4 rounded-2xl border border-[#e6d2a8] bg-white p-5">
            {!sizeComputed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{sizeComputed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-[#4a2412]/70">Base required kVA</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#4a2412]">{fmt(sizeComputed.baseKVA, "kVA", 2)}</div>
                </div>

                <div>
                  <div className="text-sm text-[#4a2412]/70">Design kVA (after factors)</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#4a2412]">{fmt(sizeComputed.designKVA, "kVA", 2)}</div>
                  <div className="text-xs text-[#4a2412]/70 mt-1">
                    Factors: {contLoad ? "×1.25" : "×1.00"} and margin ×{sizeComputed.marginMult.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e6d2a8] bg-[#fff7f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Recommended standard size</div>
                  <div className="mt-1 text-3xl font-extrabold text-[#f26422]">{fmt(sizeComputed.recommended, "kVA", 1)}</div>
                  <div className="mt-2 text-xs text-[#4a2412]/70">
                    Est. FLC at {sizeV} V: <b>{fmt(sizeComputed.estFLC, "A", 2)}</b>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-[#4a2412]/70 leading-5">
              **Sizing note:** Motors can draw high inrush (often ~5–7× FLA for across-the-line starts). Nonlinear loads (VFDs, rectifiers)
              can add harmonics and heating. For critical applications, consider K-factor transformers, derating, and thermal rise.
            </div>
          </div>
        </div>
      </Card>

      {/* 4) Buck/Boost */}
      <Card title="Buck / Boost Voltage Calculator">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Mode</div>
            <select className="input" value={bbMode} onChange={(e) => setBbMode(e.target.value as any)}>
              <option value="boost">Boost (increase)</option>
              <option value="buck">Buck (decrease)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Source voltage</div>
            <input className="input" inputMode="decimal" value={bbSourceV} onChange={(e) => setBbSourceV(e.target.value)} placeholder="e.g. 240" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Buck/boost winding voltage</div>
            <input className="input" inputMode="decimal" value={bbSecondaryV} onChange={(e) => setBbSecondaryV(e.target.value)} placeholder="e.g. 24" />
            <div className="text-xs text-[#4a2412]/70">This is the “add/subtract” winding.</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-extrabold text-[#4a2412]">Wiring</div>
            <select className="input" value={bbWiring} onChange={(e) => setBbWiring(e.target.value as any)}>
              <option value="series_aiding">Series aiding</option>
              <option value="series_opposing">Series opposing</option>
            </select>
            <div className="text-xs text-[#4a2412]/70">Wiring determines whether the winding adds or subtracts.</div>
          </div>

          <div className="md:col-span-4 rounded-2xl border border-[#e6d2a8] bg-white p-5">
            {!bbComputed.ok ? (
              <div className="text-sm text-[#4a2412]/70">{bbComputed.msg}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Add outcome</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#4a2412]">{fmt(bbComputed.V_add, "V", 2)}</div>
                </div>

                <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Subtract outcome</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#4a2412]">{fmt(bbComputed.V_sub, "V", 2)}</div>
                </div>

                <div className="rounded-2xl border border-[#e6d2a8] bg-[#fff7f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Result (selected)</div>
                  <div className="mt-1 text-3xl font-extrabold text-[#f26422]">{fmt(bbComputed.Vout, "V", 2)}</div>
                  <div className="mt-1 text-xs text-[#4a2412]/70">
                    Change: <b>{fmt(bbComputed.pct, "%", 2)}</b>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-[#4a2412]/70 leading-5">
              Field note: Always verify phasing/polarity before energizing. Wrong series connection can buck when you intended to boost
              (or vice versa).
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}