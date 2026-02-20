"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import NecTableViewer from "@/components/NecTableViewer";
import { NEC_DATASETS } from "@/data/nec/datasets";

export default function Tables() {
  const [id, setId] = useState(NEC_DATASETS[0]?.id ?? "");

  const dataset = useMemo(
    () => NEC_DATASETS.find((d) => d.id === id) ?? NEC_DATASETS[0],
    [id]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="NEC Tables (Import-Ready)">
        <div className="text-sm text-[#4a2412]/80 leading-6">
          This module is ready for you to paste/import NEC table data you have rights to
          (CSV/JSON). The UI supports search, per-column filters, sorting, and a
          mobile-friendly card view.
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
            {NEC_DATASETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-[#e6d2a8] bg-[#f7f5f2] p-3 text-sm">
            <div className="font-extrabold">Next step</div>
            <div className="text-[#4a2412]/75">
              Replace placeholder rows in <b>/data/nec/datasets.ts</b> with your licensed data.
            </div>
          </div>
        </div>
      </Card>

      {dataset ? <NecTableViewer dataset={dataset} /> : null}
    </div>
  );
}