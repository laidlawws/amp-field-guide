"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

function round(n: number) {
  if (!isFinite(n)) return "";
  return Math.round(n * 100) / 100;
}

export default function OhmsChart() {
  const [v, setV] = useState("");
  const [i, setI] = useState("");
  const [r, setR] = useState("");

  const solved = useMemo(() => {
    const V = Number(v);
    const I = Number(i);
    const R = Number(r);

    let outV = V || 0, outI = I || 0, outR = R || 0;

    // solve the missing one if two are present
    const haveV = !!V, haveI = !!I, haveR = !!R;

    if (!haveV && haveI && haveR) outV = I * R;
    if (!haveI && haveV && haveR) outI = V / R;
    if (!haveR && haveV && haveI) outR = V / I;

    const P = outV && outI ? outV * outI : 0;

    return {
      V: haveV ? V : outV,
      I: haveI ? I : outI,
      R: haveR ? R : outR,
      P,
    };
  }, [v, i, r]);

  // quick chart grid (common R values, show I and P at chosen V)
  const [chartV, setChartV] = useState("120");
  const chartRows = useMemo(() => {
    const V = Number(chartV) || 120;
    const Rs = [1, 2, 3, 5, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 500, 1000];
    return Rs.map((R) => {
      const I = V / R;
      const P = V * I;
      return { R, I: round(I), P: round(P) };
    });
  }, [chartV]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Ohm’s Law Chart">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4">
            <div className="font-extrabold">Formulas</div>
            <div className="mt-2 text-sm space-y-1 text-[#4a2412]/80">
              <div><b>V</b> = I × R</div>
              <div><b>I</b> = V ÷ R</div>
              <div><b>R</b> = V ÷ I</div>
              <div className="pt-2"><b>P</b> = V × I</div>
              <div><b>P</b> = I² × R</div>
              <div><b>P</b> = V² ÷ R</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold">Quick Solve</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <input className="input" inputMode="decimal" placeholder="Voltage (V)" value={v} onChange={(e)=>setV(e.target.value)} />
              <input className="input" inputMode="decimal" placeholder="Current (A)" value={i} onChange={(e)=>setI(e.target.value)} />
              <input className="input" inputMode="decimal" placeholder="Resistance (Ω)" value={r} onChange={(e)=>setR(e.target.value)} />
            </div>

            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              <div className="text-sm text-[#4a2412]/70">Solved values</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-3">
                  <div className="font-extrabold">V</div>
                  <div>{round(solved.V)} V</div>
                </div>
                <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-3">
                  <div className="font-extrabold">I</div>
                  <div>{round(solved.I)} A</div>
                </div>
                <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-3">
                  <div className="font-extrabold">R</div>
                  <div>{round(solved.R)} Ω</div>
                </div>
                <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-3">
                  <div className="font-extrabold">P</div>
                  <div>{round(solved.P)} W</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Quick Chart (at a chosen voltage)"
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold">V =</span>
            <input
              className="input !w-28"
              inputMode="decimal"
              value={chartV}
              onChange={(e) => setChartV(e.target.value)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4 font-extrabold">R (Ω)</th>
                <th className="py-2 pr-4 font-extrabold">I (A)</th>
                <th className="py-2 pr-4 font-extrabold">P (W)</th>
              </tr>
            </thead>
            <tbody>
              {chartRows.map((row) => (
                <tr key={row.R} className="border-t border-[#e6d2a8]">
                  <td className="py-2 pr-4 font-semibold">{row.R}</td>
                  <td className="py-2 pr-4">{row.I}</td>
                  <td className="py-2 pr-4">{row.P}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}