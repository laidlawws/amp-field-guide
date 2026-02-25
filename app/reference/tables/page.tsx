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
      <Card title="Reference Tables">
        <div className="text-sm text-[#4a2412]/80 leading-6">
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
            {NEC_DATASETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {dataset ? <NecTableViewer dataset={dataset} /> : null}
    </div>
  );
}