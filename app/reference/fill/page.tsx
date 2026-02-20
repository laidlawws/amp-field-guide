"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Row = { conduit: string; trade: string; note: string };

const sample = [
  { conduit: "EMT", trade: "1/2″", note: "Add real fill table data here" },
  { conduit: "EMT", trade: "3/4″", note: "Add real fill table data here" },
  { conduit: "PVC Sch 40", trade: "1″", note: "Add real fill table data here" },
  { conduit: "IMC", trade: "1″", note: "Add real fill table data here" },
];

export default function ConduitFill() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return sample;
    return sample.filter(
      (r) =>
        r.conduit.toLowerCase().includes(t) ||
        r.trade.toLowerCase().includes(t) ||
        r.note.toLowerCase().includes(t)
    );
  }, [q]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Conduit & Tubing Fill">
        <div className="space-y-2 text-sm leading-6">
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <div className="font-extrabold">Quick rule</div>
            <div className="text-[#4a2412]/80 mt-1">
              For 3+ conductors, typical max fill is <b>40%</b>. (Verify per
              NEC Chapter 9 / Annex tables for your conduit type.)
            </div>
          </div>

          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <div className="font-extrabold">Search (starter)</div>
            <input
              className="input mt-2"
              placeholder="Search EMT, PVC, IMC…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card title="Fill Table (placeholder)">
        <div className="text-sm text-[#4a2412]/70 mb-3">
          This is a placeholder so the page works. Next step: we’ll paste real
          fill tables (EMT/IMC/RMC/PVC) and make them filterable by wire size.
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4 font-extrabold">Conduit</th>
                <th className="py-2 pr-4 font-extrabold">Trade Size</th>
                <th className="py-2 pr-4 font-extrabold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t border-[#e6d2a8]">
                  <td className="py-2 pr-4 font-semibold">{r.conduit}</td>
                  <td className="py-2 pr-4 font-semibold">{r.trade}</td>
                  <td className="py-2 pr-4 text-[#4a2412]/80">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}