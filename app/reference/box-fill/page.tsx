"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

const volumeAllowance: Record<string, number> = {
  "14": 2.0,
  "12": 2.25,
  "10": 2.5,
  "8": 3.0,
  "6": 5.0,
};

export default function BoxFill() {
  const [awg, setAwg] = useState<keyof typeof volumeAllowance>("12");
  const [count, setCount] = useState("0"); // insulated conductors
  const [devices, setDevices] = useState("0"); // yokes
  const [clamps, setClamps] = useState("0"); // internal clamps
  const [grounds, setGrounds] = useState("0"); // grounds (all together count as 1, but allow override)

  const calc = useMemo(() => {
    const per = volumeAllowance[awg] ?? 0;
    const c = Number(count) || 0;
    const d = Number(devices) || 0;
    const cl = Number(clamps) || 0;
    const g = Number(grounds) || 0;

    // Typical quick calc:
    // - each conductor = 1
    // - each device yoke = 2
    // - internal clamp = 1
    // - grounds together typically = 1 (largest), but we let user input 0/1
    const equivalents = c + (d * 2) + cl + g;
    const required = equivalents * per;

    return { per, equivalents, required };
  }, [awg, count, devices, clamps, grounds]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Box Fill (Quick Calculator)">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-extrabold">Conductor size (AWG)</label>
            <select className="input" value={awg} onChange={(e) => setAwg(e.target.value as any)}>
              {Object.keys(volumeAllowance).map((k) => (
                <option key={k} value={k}>
                  {k} AWG ({volumeAllowance[k]} in³)
                </option>
              ))}
            </select>

            <input className="input" inputMode="numeric" placeholder="Insulated conductors (count)"
              value={count} onChange={(e)=>setCount(e.target.value)} />

            <input className="input" inputMode="numeric" placeholder="Devices/yokes (count)"
              value={devices} onChange={(e)=>setDevices(e.target.value)} />

            <input className="input" inputMode="numeric" placeholder="Internal clamps (0 or 1)"
              value={clamps} onChange={(e)=>setClamps(e.target.value)} />

            <input className="input" inputMode="numeric" placeholder="Grounds (usually 1 total)"
              value={grounds} onChange={(e)=>setGrounds(e.target.value)} />
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-5">
            <div className="text-sm font-extrabold">Results</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Volume per conductor</span>
                <span className="font-extrabold">{calc.per.toFixed(2)} in³</span>
              </div>
              <div className="flex justify-between">
                <span>Equivalent conductor count</span>
                <span className="font-extrabold">{calc.equivalents}</span>
              </div>
              <div className="flex justify-between">
                <span>Required box volume</span>
                <span className="font-extrabold text-[#f26422]">
                  {calc.required.toFixed(2)} in³
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-[#4a2412]/70 leading-5">
              Note: This is a fast field estimator. Verify per NEC 314.16 and
              your local requirements.
            </div>
          </div>
        </div>
      </Card>

      <Card title="Box Fill Checklist">
        <div className="space-y-2 text-sm leading-6">
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <b>Conductors:</b> each insulated conductor that enters and is spliced/terminated counts as 1.
          </div>
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <b>Grounds:</b> all grounds together typically count as 1 (largest size).
          </div>
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <b>Devices/yokes:</b> each yoke counts as 2 conductors (largest connected conductor).
          </div>
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <b>Internal clamps:</b> if present, add 1.
          </div>
        </div>
      </Card>
    </div>
  );
}