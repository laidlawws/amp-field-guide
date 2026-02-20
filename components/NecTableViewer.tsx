"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import type { NecDataset, NecRow } from "@/data/nec/datasets";

type Props = {
  dataset: NecDataset;
};

function toText(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function NecTableViewer({ dataset }: Props) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string>(dataset.columns[0]?.key ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // column filters (simple contains)
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let rows = dataset.rows;

    // global search
    if (query) {
      rows = rows.filter((r) =>
        dataset.columns.some((c) =>
          toText(r[c.key]).toLowerCase().includes(query)
        )
      );
    }

    // per-column filters
    for (const c of dataset.columns) {
      const f = (filters[c.key] ?? "").trim().toLowerCase();
      if (!f) continue;
      rows = rows.filter((r) => toText(r[c.key]).toLowerCase().includes(f));
    }

    // sorting
    const key = sortKey;
    if (key) {
      rows = [...rows].sort((a: NecRow, b: NecRow) => {
        const av = a[key];
        const bv = b[key];

        const aNum = typeof av === "number" ? av : Number(av);
        const bNum = typeof bv === "number" ? bv : Number(bv);

        const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum);

        let cmp = 0;
        if (bothNumeric) {
          cmp = aNum - bNum;
        } else {
          cmp = toText(av).localeCompare(toText(bv));
        }

        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [dataset, q, filters, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <Card
        title={dataset.title}
        right={
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-sm font-extrabold hover:opacity-90"
              onClick={() => {
                setQ("");
                setFilters({});
                setSortKey(dataset.columns[0]?.key ?? "");
                setSortDir("asc");
              }}
            >
              Reset
            </button>
          </div>
        }
      >
        <div className="text-sm text-[#4a2412]/75 mb-3">
          {dataset.sourceHint}
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input
            className="input md:col-span-2"
            placeholder="Search within this table…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="flex gap-2">
            <select
              className="input"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              {dataset.columns.map((c) => (
                <option key={c.key} value={c.key}>
                  Sort: {c.label}
                </option>
              ))}
            </select>

            <button
              className="rounded-xl bg-[#f26422] text-white px-3 font-extrabold"
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              title="Toggle sort direction"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Column filters */}
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataset.columns.map((c) => (
            <input
              key={c.key}
              className="input"
              placeholder={`Filter ${c.label}…`}
              value={filters[c.key] ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, [c.key]: e.target.value }))
              }
            />
          ))}
        </div>
      </Card>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card title={`Rows (${filtered.length})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  {dataset.columns.map((c) => (
                    <th key={c.key} className="py-2 pr-4 font-extrabold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={idx} className="border-t border-[#e6d2a8]">
                    {dataset.columns.map((c) => (
                      <td key={c.key} className="py-2 pr-4">
                        {toText(row[c.key]) || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        <div className="text-sm font-extrabold px-1">
          Rows ({filtered.length})
        </div>
        {filtered.map((row, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[#e6d2a8] bg-white p-4 shadow-sm"
          >
            {dataset.columns.map((c) => (
              <div key={c.key} className="flex justify-between gap-4 py-1">
                <div className="text-xs font-extrabold text-[#4a2412]/70">
                  {c.label}
                </div>
                <div className="text-sm font-semibold text-right">
                  {toText(row[c.key]) || "—"}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}