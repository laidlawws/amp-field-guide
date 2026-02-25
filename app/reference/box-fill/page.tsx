"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type SizeKey =
  | "18"
  | "16"
  | "14"
  | "12"
  | "10"
  | "8"
  | "6"
  | "4"
  | "3"
  | "2"
  | "1"
  | "1/0"
  | "2/0"
  | "3/0"
  | "4/0";

// Common conductor volume allowances (in³) used in box fill.
// (These values are commonly published references. Verify against your code book / local amendments.)
const VOLUME_PER_CONDUCTOR_IN3: Record<SizeKey, number> = {
  "18": 1.5,
  "16": 1.75,
  "14": 2.0,
  "12": 2.25,
  "10": 2.5,
  "8": 3.0,
  "6": 5.0,
  "4": 8.25,
  "3": 10.25,
  "2": 12.25,
  "1": 14.25,
  "1/0": 16.5,
  "2/0": 18.0,
  "3/0": 19.5,
  "4/0": 21.0,
};

const SIZES: { key: SizeKey; label: string }[] = Object.entries(VOLUME_PER_CONDUCTOR_IN3).map(
  ([k, v]) => ({ key: k as SizeKey, label: `${k} AWG (${v.toFixed(2)} in³)` })
);

function n0(v: string) {
  // empty -> 0, otherwise parse
  if (v.trim() === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function fmt(n: number, unit: string, dp = 2) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(dp)} ${unit}`;
}

function pillClass(active: boolean) {
  return active
    ? "bg-[#f26422] text-white border-[#f26422]"
    : "bg-white text-[#4a2412] border-[#e6d2a8] hover:bg-[#f7f5f2]";
}

export default function BoxFillPage() {
  const [size, setSize] = useState<SizeKey>("12");

  // Inputs (store as strings so user can clear them)
  const [hotNeutral, setHotNeutral] = useState(""); // conductors entering & spliced/terminated
  const [grounds, setGrounds] = useState(""); // quantity of grounds; counts as 1 total allowance
  const [yokes, setYokes] = useState(""); // device yokes; each counts as 2 allowances
  const [internalClamps, setInternalClamps] = useState(false); // counts as 1 allowance
  const [extraConductors, setExtraConductors] = useState(""); // for “other” items user wants to count

  const computed = useMemo(() => {
    const volEach = VOLUME_PER_CONDUCTOR_IN3[size];

    const cConductors = n0(hotNeutral); // each counts 1
    const gQty = n0(grounds);
    const cGrounds = gQty > 0 ? 1 : 0; // all grounds together count as 1 (largest EGC)
    const cYokes = n0(yokes) * 2; // each yoke counts as 2
    const cClamps = internalClamps ? 1 : 0;
    const cExtra = n0(extraConductors);

    const totalEq = cConductors + cGrounds + cYokes + cClamps + cExtra;
    const requiredVol = totalEq * volEach;

    return {
      volEach,
      cConductors,
      cGrounds,
      cYokes,
      cClamps,
      cExtra,
      totalEq,
      requiredVol,
    };
  }, [size, hotNeutral, grounds, yokes, internalClamps, extraConductors]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Box Fill Calculator">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Inputs */}
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Conductor size</div>
                <select className="input" value={size} onChange={(e) => setSize(e.target.value as SizeKey)}>
                  {SIZES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-[#4a2412]/70">
                  Volume allowance per conductor: <b>{fmt(computed.volEach, "in³", 2)}</b>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Insulated conductors</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={hotNeutral}
                  onChange={(e) => setHotNeutral(e.target.value)}
                  placeholder="0"
                />
                <div className="text-xs text-[#4a2412]/70 leading-5">
                  Count each insulated conductor that enters the box and is spliced/terminated as <b>1</b>.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Equipment grounds (qty)</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={grounds}
                  onChange={(e) => setGrounds(e.target.value)}
                  placeholder="0"
                />
                <div className="text-xs text-[#4a2412]/70 leading-5">
                  All grounds together typically count as <b>1</b> allowance (largest EGC in the box).
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Device yokes</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={yokes}
                  onChange={(e) => setYokes(e.target.value)}
                  placeholder="0"
                />
                <div className="text-xs text-[#4a2412]/70 leading-5">
                  Each yoke counts as <b>2</b> allowances (largest connected conductor).
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Internal clamps</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInternalClamps(false)}
                    className={`px-3 py-2 rounded-xl border text-sm font-extrabold transition ${pillClass(!internalClamps)}`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setInternalClamps(true)}
                    className={`px-3 py-2 rounded-xl border text-sm font-extrabold transition ${pillClass(internalClamps)}`}
                  >
                    Present (+1)
                  </button>
                </div>
                <div className="text-xs text-[#4a2412]/70 leading-5">
                  If the box has internal cable clamps that occupy volume, add <b>1</b> allowance.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-extrabold text-[#4a2412]">Extra allowances (optional)</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={extraConductors}
                  onChange={(e) => setExtraConductors(e.target.value)}
                  placeholder="0"
                />
                <div className="text-xs text-[#4a2412]/70 leading-5">
                  Use this if you want to manually add allowances for “other” items per your local method.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-5">
              <div className="text-lg font-extrabold text-[#4a2412]">Results</div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Volume per conductor</div>
                  <div className="mt-1 text-xl font-extrabold text-[#4a2412]">
                    {fmt(computed.volEach, "in³", 2)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Equivalent conductor count</div>
                  <div className="mt-1 text-xl font-extrabold text-[#4a2412]">{computed.totalEq}</div>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-[#e6d2a8] bg-[#fff7f2] p-4">
                  <div className="text-sm text-[#4a2412]/70">Required box volume</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#f26422]">
                    {fmt(computed.requiredVol, "in³", 2)}
                  </div>
                  <div className="mt-2 text-xs text-[#4a2412]/70 leading-5">
                    Field estimator. Verify against your NEC reference and any local amendments.
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-extrabold text-[#4a2412]">Breakdown</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-[#e6d2a8] bg-white p-3">
                    <div className="text-xs text-[#4a2412]/70">Conductors</div>
                    <div className="font-extrabold text-[#4a2412]">{computed.cConductors}</div>
                  </div>
                  <div className="rounded-xl border border-[#e6d2a8] bg-white p-3">
                    <div className="text-xs text-[#4a2412]/70">Grounds (all together)</div>
                    <div className="font-extrabold text-[#4a2412]">{computed.cGrounds}</div>
                  </div>
                  <div className="rounded-xl border border-[#e6d2a8] bg-white p-3">
                    <div className="text-xs text-[#4a2412]/70">Yokes (×2)</div>
                    <div className="font-extrabold text-[#4a2412]">{computed.cYokes}</div>
                  </div>
                  <div className="rounded-xl border border-[#e6d2a8] bg-white p-3">
                    <div className="text-xs text-[#4a2412]/70">Internal clamps</div>
                    <div className="font-extrabold text-[#4a2412]">{computed.cClamps}</div>
                  </div>
                  <div className="col-span-2 rounded-xl border border-[#e6d2a8] bg-white p-3">
                    <div className="text-xs text-[#4a2412]/70">Extra allowances</div>
                    <div className="font-extrabold text-[#4a2412]">{computed.cExtra}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-[#4a2412]/70 leading-5">
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}