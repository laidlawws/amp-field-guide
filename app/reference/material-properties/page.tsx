"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Row = {
  name: string;
  symbol: string; // "--" for alloys in this table
  sg: number;
  meltC: string; // may be a range like "1330-1380"
  meltF: string; // may be a range like "2436-2516"
  iacs: string;  // may be small scientific notation like "10^-5"
  densityLbIn3: number;
};

type SortKey =
  | "name"
  | "symbol"
  | "sg"
  | "meltC"
  | "iacs"
  | "lbft3";

function toNumberMaybe(s: string): number {
  // Handles "1330-1380" -> 1330, "10^-5" -> 0.00001, "10^-17" -> 1e-17
  const t = s.trim();
  if (!t) return Number.NaN;

  // Range: "a-b"
  const rangeMatch = t.match(/^(-?\d+(\.\d+)?)\s*-\s*(-?\d+(\.\d+)?)$/);
  if (rangeMatch) return Number(rangeMatch[1]);

  // Scientific-ish "10^-5"
  const sciMatch = t.match(/^10\^(-?\d+)$/);
  if (sciMatch) return Math.pow(10, Number(sciMatch[1]));

  // Regular number
  const x = Number(t.replace(/,/g, ""));
  return Number.isFinite(x) ? x : Number.NaN;
}

function isAlloy(symbol: string) {
  return symbol.trim() === "--";
}

function fmtNum(x: number, dp = 2) {
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(dp);
}

function fmtIACS(s: string) {
  const v = toNumberMaybe(s);
  // If it parses as a tiny number, show compact scientific
  if (Number.isFinite(v) && v > 0 && v < 0.001) return `${v.toExponential(2)} %`;
  if (Number.isFinite(v)) return `${v.toFixed(v >= 10 ? 1 : 2)} %`;
  return `${s} %`;
}

export default function MaterialPropertiesPage() {
  // Data: SG, melt points, IACS, density (lb/in^3). lb/ft^3 computed as *1728.
  // Source table includes alloys too; symbols use "--" for alloys there.
  const DATA: Row[] = useMemo(
    () => [
      { name: "Aluminum", symbol: "Al", sg: 2.71, meltC: "660", meltF: "1220", iacs: "64.90", densityLbIn3: 0.0978 },
      { name: "Antimony", symbol: "Sb", sg: 6.62, meltC: "630", meltF: "1167", iacs: "4.42", densityLbIn3: 0.2390 },
      { name: "Arsenic", symbol: "As", sg: 5.73, meltC: "817", meltF: "1502", iacs: "4.90", densityLbIn3: 0.2070 },
      { name: "Beryllium", symbol: "Be", sg: 1.83, meltC: "1280", meltF: "2336", iacs: "9.32", densityLbIn3: 0.0660 },
      { name: "Bismuth", symbol: "Bi", sg: 9.80, meltC: "271", meltF: "520", iacs: "1.50", densityLbIn3: 0.3540 },
      { name: "Brass (70-30)", symbol: "--", sg: 8.51, meltC: "900", meltF: "1652", iacs: "28", densityLbIn3: 0.3070 },
      { name: "Bronze (5% Sn)", symbol: "--", sg: 8.87, meltC: "1000", meltF: "1382", iacs: "18", densityLbIn3: 0.3200 },
      { name: "Cadmium", symbol: "Cd", sg: 8.65, meltC: "321", meltF: "610", iacs: "22.70", densityLbIn3: 0.3120 },
      { name: "Calcium", symbol: "Ca", sg: 1.55, meltC: "850", meltF: "1562", iacs: "50.10", densityLbIn3: 0.0560 },
      { name: "Cobalt", symbol: "Co", sg: 8.90, meltC: "1495", meltF: "2723", iacs: "17.80", densityLbIn3: 0.3210 },
      { name: "Copper", symbol: "Cu", sg: 8.95, meltC: "1085", meltF: "1984", iacs: "100", densityLbIn3: 0.3240 },
      { name: "Copper-Rolled", symbol: "--", sg: 8.89, meltC: "1083", meltF: "1981", iacs: "100", densityLbIn3: 0.3210 },
      { name: "Copper-Tubing", symbol: "--", sg: 8.89, meltC: "1083", meltF: "1981", iacs: "100", densityLbIn3: 0.3210 },
      { name: "Gold", symbol: "Au", sg: 19.30, meltC: "1063", meltF: "1945", iacs: "71.20", densityLbIn3: 0.6970 },
      { name: "Graphite", symbol: "--", sg: 2.25, meltC: "3500", meltF: "6332", iacs: "0.22", densityLbIn3: 0.0812 },
      { name: "Indium", symbol: "In", sg: 7.30, meltC: "156", meltF: "311", iacs: "20.60", densityLbIn3: 0.2640 },
      { name: "Iridium", symbol: "Ir", sg: 22.40, meltC: "2450", meltF: "4442", iacs: "32.50", densityLbIn3: 0.8090 },
      { name: "Iron", symbol: "Fe", sg: 7.20, meltC: "1200-1400", meltF: "2192-2552", iacs: "17.60", densityLbIn3: 0.2600 },
      { name: "Iron-Malleable", symbol: "--", sg: 7.20, meltC: "1500-1600", meltF: "2732-2912", iacs: "10", densityLbIn3: 0.2600 },
      { name: "Iron-Wrought", symbol: "--", sg: 7.70, meltC: "1500-1600", meltF: "2732-2912", iacs: "10", densityLbIn3: 0.2780 },
      { name: "Lead", symbol: "Pb", sg: 11.40, meltC: "327", meltF: "621", iacs: "8.35", densityLbIn3: 0.4120 },
      { name: "Magnesium", symbol: "Mg", sg: 1.74, meltC: "651", meltF: "1204", iacs: "38.70", densityLbIn3: 0.0628 },
      { name: "Manganese", symbol: "Mn", sg: 7.20, meltC: "1245", meltF: "2273", iacs: "0.90", densityLbIn3: 0.2600 },
      { name: "Mercury", symbol: "Hg", sg: 13.65, meltC: "-38.90", meltF: "-37.70", iacs: "1.80", densityLbIn3: 0.4930 },
      { name: "Molybdenum", symbol: "Mo", sg: 10.20, meltC: "2620", meltF: "4748", iacs: "36.10", densityLbIn3: 0.3680 },
      { name: "Monel (63-37)", symbol: "--", sg: 8.87, meltC: "1300", meltF: "2372", iacs: "3", densityLbIn3: 0.3200 },
      { name: "Nickel", symbol: "Ni", sg: 8.90, meltC: "1452", meltF: "2646", iacs: "25", densityLbIn3: 0.3210 },
      { name: "Phosphorus", symbol: "P", sg: 1.82, meltC: "44.10", meltF: "111.40", iacs: "10^-17", densityLbIn3: 0.0657 },
      { name: "Platinum", symbol: "Pt", sg: 21.46, meltC: "1773", meltF: "3221", iacs: "17.50", densityLbIn3: 0.7750 },
      { name: "Potassium", symbol: "K", sg: 0.86, meltC: "62.30", meltF: "144.10", iacs: "28", densityLbIn3: 0.0310 },
      { name: "Selenium", symbol: "Se", sg: 4.81, meltC: "220", meltF: "428", iacs: "14.40", densityLbIn3: 0.1740 },
      { name: "Silicon", symbol: "Si", sg: 2.40, meltC: "1420", meltF: "2588", iacs: "10^-5", densityLbIn3: 0.0866 },
      { name: "Silver", symbol: "Ag", sg: 10.50, meltC: "960", meltF: "1760", iacs: "106", densityLbIn3: 0.3790 },
      { name: "Steel (Carbon)", symbol: "--", sg: 7.84, meltC: "1330-1380", meltF: "2436-2516", iacs: "10", densityLbIn3: 0.2830 },
      { name: "Stainless (18-8)", symbol: "--", sg: 7.92, meltC: "1500", meltF: "2732", iacs: "2.50", densityLbIn3: 0.2860 },
      { name: "Stainless (13-Cr)", symbol: "--", sg: 7.78, meltC: "1520", meltF: "2768", iacs: "3.50", densityLbIn3: 0.2810 },
      { name: "Stainless (18-Cr)", symbol: "--", sg: 7.73, meltC: "1500", meltF: "2732", iacs: "3", densityLbIn3: 0.2790 },
      { name: "Tantalum", symbol: "Ta", sg: 16.60, meltC: "2900", meltF: "5414", iacs: "13.90", densityLbIn3: 0.5990 },
      { name: "Tellurium", symbol: "Te", sg: 6.20, meltC: "450", meltF: "846", iacs: "10^-5", densityLbIn3: 0.2240 },
      { name: "Thorium", symbol: "Th", sg: 11.70, meltC: "1845", meltF: "3353", iacs: "9.10", densityLbIn3: 0.4420 },
      { name: "Tin", symbol: "Sn", sg: 7.30, meltC: "232", meltF: "449", iacs: "15", densityLbIn3: 0.2640 },
      { name: "Titanium", symbol: "Ti", sg: 4.50, meltC: "1800", meltF: "3272", iacs: "2.10", densityLbIn3: 0.1620 },
      { name: "Tungsten", symbol: "W", sg: 19.30, meltC: "3422", meltF: "6192", iacs: "31.50", densityLbIn3: 0.6970 },
      { name: "Uranium", symbol: "U", sg: 18.70, meltC: "1130", meltF: "2066", iacs: "2.80", densityLbIn3: 0.6750 },
      { name: "Vanadium", symbol: "V", sg: 5.96, meltC: "1710", meltF: "3110", iacs: "6.63", densityLbIn3: 0.2150 },
      { name: "Zinc", symbol: "Zn", sg: 7.14, meltC: "419", meltF: "786", iacs: "29.10", densityLbIn3: 0.2580 },
      { name: "Zirconium", symbol: "Zr", sg: 6.40, meltC: "1700", meltF: "3092", iacs: "4.20", densityLbIn3: 0.2310 },
    ],
    []
  );

  const [query, setQuery] = useState("");
  const [showAlloys, setShowAlloys] = useState(true);
  const [showElements, setShowElements] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let filtered = DATA.filter((r) => {
      const alloy = isAlloy(r.symbol);
      if (alloy && !showAlloys) return false;
      if (!alloy && !showElements) return false;

      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.symbol.toLowerCase().includes(q) ||
        r.meltC.toLowerCase().includes(q) ||
        r.meltF.toLowerCase().includes(q) ||
        r.iacs.toLowerCase().includes(q)
      );
    });

    const dir = sortDir === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      const aLbFt3 = a.densityLbIn3 * 1728;
      const bLbFt3 = b.densityLbIn3 * 1728;

      const av = (() => {
        switch (sortKey) {
          case "name":
            return a.name.toLowerCase();
          case "symbol":
            return a.symbol.toLowerCase();
          case "sg":
            return a.sg;
          case "meltC":
            return toNumberMaybe(a.meltC);
          case "iacs":
            return toNumberMaybe(a.iacs);
          case "lbft3":
            return aLbFt3;
        }
      })();

      const bv = (() => {
        switch (sortKey) {
          case "name":
            return b.name.toLowerCase();
          case "symbol":
            return b.symbol.toLowerCase();
          case "sg":
            return b.sg;
          case "meltC":
            return toNumberMaybe(b.meltC);
          case "iacs":
            return toNumberMaybe(b.iacs);
          case "lbft3":
            return bLbFt3;
        }
      })();

      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      const an = typeof av === "number" ? av : Number.NaN;
      const bn = typeof bv === "number" ? bv : Number.NaN;

      if (!Number.isFinite(an) && !Number.isFinite(bn)) return 0;
      if (!Number.isFinite(an)) return 1 * dir;
      if (!Number.isFinite(bn)) return -1 * dir;

      return (an - bn) * dir;
    });

    return filtered;
  }, [DATA, query, showAlloys, showElements, sortKey, sortDir]);

  function setSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Material Properties (Metals & Common Alloys)">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl border border-[#e6d2a8] bg-white p-4">
            <div className="text-sm font-extrabold text-[#4a2412]">Search</div>
            <input
              className="input mt-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, symbol, melting point, IACS…"
            />
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#4a2412]/80">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showElements} onChange={(e) => setShowElements(e.target.checked)} />
                Elements
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showAlloys} onChange={(e) => setShowAlloys(e.target.checked)} />
                Alloys / variants
              </label>
              <div className="ml-auto text-xs text-[#4a2412]/70">{rows.length} shown</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4 text-sm text-[#4a2412]/80 leading-6">
            <div className="font-extrabold text-[#4a2412]">Field tips</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>% IACS is relative to annealed copper (Cu ≈ 100%).</li>
              <li>Alloy values vary by exact composition.</li>
              <li>Use melting point ranges for steels as “typical.”</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e6d2a8] bg-white">
          <table className="min-w-[950px] w-full text-sm">
            <thead className="bg-[#f7f5f2] text-[#4a2412]">
              <tr>
                <Th onClick={() => setSort("name")} active={sortKey === "name"} dir={sortDir}>Material</Th>
                <Th onClick={() => setSort("symbol")} active={sortKey === "symbol"} dir={sortDir}>Symbol</Th>
                <Th onClick={() => setSort("sg")} active={sortKey === "sg"} dir={sortDir}>Spec. Gravity</Th>
                <Th onClick={() => setSort("meltC")} active={sortKey === "meltC"} dir={sortDir}>Melt (°C)</Th>
                <Th>Melt (°F)</Th>
                <Th onClick={() => setSort("iacs")} active={sortKey === "iacs"} dir={sortDir}>Conductance (% IACS)</Th>
                <Th onClick={() => setSort("lbft3")} active={sortKey === "lbft3"} dir={sortDir}>Density (lb/ft³)</Th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const lbft3 = r.densityLbIn3 * 1728;
                return (
                  <tr key={r.name} className="border-t border-[#e6d2a8]/60">
                    <td className="px-4 py-3 font-semibold text-[#4a2412]">
                      {r.name}
                      {isAlloy(r.symbol) && (
                        <span className="ml-2 text-[11px] font-extrabold text-[#f26422] bg-[#fff7f2] border border-[#e6d2a8] px-2 py-0.5 rounded-full">
                          Alloy/Variant
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4a2412]/80">{r.symbol}</td>
                    <td className="px-4 py-3 text-[#4a2412]/80">{fmtNum(r.sg, 2)}</td>
                    <td className="px-4 py-3 text-[#4a2412]/80">{r.meltC}</td>
                    <td className="px-4 py-3 text-[#4a2412]/80">{r.meltF}</td>
                    <td className="px-4 py-3 text-[#4a2412]/80">{fmtIACS(r.iacs)}</td>
                    <td className="px-4 py-3 text-[#4a2412]/80">{lbft3.toFixed(1)}</td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#4a2412]/70">
                    No matches. Try a different search term (e.g., “Cu”, “steel”, “106”, “1500”).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Th(props: { children: React.ReactNode; onClick?: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  const { children, onClick, active, dir } = props;
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 text-left font-extrabold select-none ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
      title={onClick ? "Sort" : undefined}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {active && <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );
}