"use client";

import React, { useMemo, useState } from "react";

type ConductorTypeKey = "THHN_THWN2" | "XHHW2" | "RHH_RHW2";
type ConduitTypeKey = "EMT" | "RMC_IMC" | "PVC40";

const FILL_RULES = [
  { key: "one", label: "1 conductor (53% fill)", pct: 0.53 },
  { key: "two", label: "2 conductors (31% fill)", pct: 0.31 },
  { key: "over2", label: "Over 2 conductors (40% fill)", pct: 0.40 },
] as const;

/**
 * Starter datasets (verify & adjust to your preferred source).
 * - Conductor areas are insulated conductor cross-sectional areas (in²).
 * - Conduit areas are internal cross-sectional areas (in²).
 *
 * This page is designed so you can swap/expand these tables easily later.
 */

// Common AWG list including 1/0–4/0
const WIRE_SIZES = [
  "14",
  "12",
  "10",
  "8",
  "6",
  "4",
  "3",
  "2",
  "1",
  "1/0",
  "2/0",
  "3/0",
  "4/0",
] as const;

type WireSize = (typeof WIRE_SIZES)[number];

const CONDUCTOR_TYPES: Record<ConductorTypeKey, { name: string; notes: string }> = {
  THHN_THWN2: {
    name: "THHN / THWN-2 (nylon jacket)",
    notes:
      "Common building wire in conduit. Typically smaller OD than XHHW/RHH. Verify areas by manufacturer/spec.",
  },
  XHHW2: {
    name: "XHHW-2",
    notes:
      "Thicker insulation than THHN in many cases. Often used for feeders/services. Verify by manufacturer/spec.",
  },
  RHH_RHW2: {
    name: "RHH / RHW / RHW-2",
    notes:
      "Service/feeder insulation family. Can be larger OD. Verify areas by manufacturer/spec.",
  },
};

const CONDUIT_TYPES: Record<ConduitTypeKey, { name: string; notes: string }> = {
  EMT: { name: "EMT", notes: "Electrical Metallic Tubing" },
  RMC_IMC: { name: "RMC / IMC", notes: "Rigid Metal / Intermediate Metal Conduit (areas vary slightly by type)" },
  PVC40: { name: "PVC Sch 40", notes: "Rigid Nonmetallic Conduit (RNC) Schedule 40" },
};

const CONDUIT_SIZES = [
  "1/2",
  "3/4",
  "1",
  "1-1/4",
  "1-1/2",
  "2",
  "2-1/2",
  "3",
  "3-1/2",
  "4",
] as const;

type ConduitSize = (typeof CONDUIT_SIZES)[number];

// Internal conduit areas (in²) — starter values
const CONDUIT_AREA_IN2: Record<ConduitTypeKey, Record<ConduitSize, number>> = {
  EMT: {
    "1/2": 0.304,
    "3/4": 0.533,
    "1": 0.864,
    "1-1/4": 1.496,
    "1-1/2": 2.036,
    "2": 3.356,
    "2-1/2": 5.858,
    "3": 8.846,
    "3-1/2": 11.545,
    "4": 14.753,
  },
  RMC_IMC: {
    // Conservative-ish starter areas; verify for RMC vs IMC
    "1/2": 0.285,
    "3/4": 0.506,
    "1": 0.832,
    "1-1/4": 1.453,
    "1-1/2": 1.986,
    "2": 3.291,
    "2-1/2": 5.760,
    "3": 8.637,
    "3-1/2": 11.290,
    "4": 14.268,
  },
  PVC40: {
    // Starter areas; verify per Sch 40 internal diameter tables
    "1/2": 0.285,
    "3/4": 0.508,
    "1": 0.832,
    "1-1/4": 1.453,
    "1-1/2": 1.986,
    "2": 3.291,
    "2-1/2": 5.760,
    "3": 8.637,
    "3-1/2": 11.290,
    "4": 14.268,
  },
};

// Insulated conductor areas (in²) — starter values
const CONDUCTOR_AREA_IN2: Record<ConductorTypeKey, Record<WireSize, number>> = {
  THHN_THWN2: {
    "14": 0.0097,
    "12": 0.0133,
    "10": 0.0211,
    "8": 0.0366,
    "6": 0.0507,
    "4": 0.0824,
    "3": 0.0973,
    "2": 0.1158,
    "1": 0.1368,
    "1/0": 0.1620,
    "2/0": 0.1880,
    "3/0": 0.2170,
    "4/0": 0.2510,
  },
  XHHW2: {
    "14": 0.0130,
    "12": 0.0170,
    "10": 0.0280,
    "8": 0.0460,
    "6": 0.0620,
    "4": 0.0960,
    "3": 0.1140,
    "2": 0.1350,
    "1": 0.1600,
    "1/0": 0.1900,
    "2/0": 0.2200,
    "3/0": 0.2540,
    "4/0": 0.2920,
  },
  RHH_RHW2: {
    "14": 0.0135,
    "12": 0.0178,
    "10": 0.0290,
    "8": 0.0475,
    "6": 0.0640,
    "4": 0.0990,
    "3": 0.1170,
    "2": 0.1390,
    "1": 0.1650,
    "1/0": 0.1960,
    "2/0": 0.2280,
    "3/0": 0.2630,
    "4/0": 0.3030,
  },
};

function fmt(n: number, digits = 3) {
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

export default function MaxConductorsInConduitPage() {
  const [conductorType, setConductorType] = useState<ConductorTypeKey>("THHN_THWN2");
  const [wireSize, setWireSize] = useState<WireSize>("12");

  const [conduitType, setConduitType] = useState<ConduitTypeKey>("EMT");
  const [conduitSize, setConduitSize] = useState<ConduitSize>("3/4");

  // Advanced override
  const [useOverrideArea, setUseOverrideArea] = useState(false);
  const [overrideArea, setOverrideArea] = useState<string>("");

  const baseConductorArea = useMemo(() => {
    return CONDUCTOR_AREA_IN2[conductorType][wireSize];
  }, [conductorType, wireSize]);

  const conductorArea = useMemo(() => {
    if (!useOverrideArea) return baseConductorArea;
    const v = Number(overrideArea);
    return Number.isFinite(v) && v > 0 ? v : NaN;
  }, [useOverrideArea, overrideArea, baseConductorArea]);

  const conduitArea = useMemo(() => {
    return CONDUIT_AREA_IN2[conduitType][conduitSize];
  }, [conduitType, conduitSize]);

  const results = useMemo(() => {
    if (!Number.isFinite(conductorArea) || conductorArea <= 0) return null;

    return FILL_RULES.map((r) => {
      const allowable = conduitArea * r.pct;
      const max = Math.floor(allowable / conductorArea);
      return {
        ...r,
        allowable,
        max: Math.max(0, max),
      };
    });
  }, [conduitArea, conductorArea]);

  return (
    <div className="container-app safe-area" style={{ padding: 16 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4, marginBottom: 6 }}>
          Maximum Conductors in Conduit
        </h1>
        <p className="sub" style={{ margin: 0 }}>
          Calculates max conductors based on conduit internal area and standard fill rules (53% / 31% / 40%).
        </p>
      </div>

      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Conductor</div>

          <label className="sub" style={{ display: "block", marginBottom: 6 }}>
            Insulation / Type
          </label>
          <select className="input" value={conductorType} onChange={(e) => setConductorType(e.target.value as any)}>
            {Object.entries(CONDUCTOR_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="sub" style={{ marginTop: 8 }}>
            {CONDUCTOR_TYPES[conductorType].notes}
          </div>

          <div style={{ height: 12 }} />

          <label className="sub" style={{ display: "block", marginBottom: 6 }}>
            Wire size (AWG)
          </label>
          <select className="input" value={wireSize} onChange={(e) => setWireSize(e.target.value as any)}>
            {WIRE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div style={{ height: 12 }} />

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={useOverrideArea}
              onChange={(e) => setUseOverrideArea(e.target.checked)}
            />
            <span style={{ fontWeight: 800 }}>Advanced: override conductor area</span>
          </label>

          <div className="sub" style={{ marginTop: 6 }}>
            Useful if you want to match a specific manufacturer spec or a licensed NEC table basis.
          </div>

          {useOverrideArea && (
            <div style={{ marginTop: 10 }}>
              <label className="sub" style={{ display: "block", marginBottom: 6 }}>
                Conductor area (in²)
              </label>
              <input
                className="input"
                inputMode="decimal"
                placeholder={`Default: ${fmt(baseConductorArea, 4)} in²`}
                value={overrideArea}
                onChange={(e) => setOverrideArea(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Conduit</div>

          <label className="sub" style={{ display: "block", marginBottom: 6 }}>
            Conduit type
          </label>
          <select className="input" value={conduitType} onChange={(e) => setConduitType(e.target.value as any)}>
            {Object.entries(CONDUIT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="sub" style={{ marginTop: 8 }}>
            {CONDUIT_TYPES[conduitType].notes}
          </div>

          <div style={{ height: 12 }} />

          <label className="sub" style={{ display: "block", marginBottom: 6 }}>
            Conduit size (trade size, inches)
          </label>
          <select className="input" value={conduitSize} onChange={(e) => setConduitSize(e.target.value as any)}>
            {CONDUIT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}"
              </option>
            ))}
          </select>

          <div style={{ height: 12 }} />

          <div className="card" style={{ padding: 14, background: "rgba(0,0,0,0.02)" as any }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Values used</div>
            <div className="sub" style={{ display: "grid", gap: 6 }}>
              <div>
                <span style={{ fontWeight: 800 }}>Conduit internal area:</span> {fmt(conduitArea, 3)} in²
              </div>
              <div>
                <span style={{ fontWeight: 800 }}>Conductor area:</span>{" "}
                {Number.isFinite(conductorArea) ? fmt(conductorArea, 4) : "—"} in²
              </div>
            </div>
          </div>

          <div className="sub" style={{ marginTop: 10 }}>
            Tip: If your counts differ from what you expect in the field, toggle the override and paste in your exact
            conductor area.
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3, marginBottom: 10 }}>Results</h2>

        {!results ? (
          <div className="sub">
            Enter a valid conductor area (or disable override) to calculate maximum conductors.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {results.map((r) => (
              <div
                key={r.key}
                className="tile pressable"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{r.label}</div>
                  <div className="sub" style={{ marginTop: 2 }}>
                    Allowable fill area: <span style={{ fontWeight: 800 }}>{fmt(r.allowable, 4)} in²</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="kbd" style={{ display: "inline-flex", marginBottom: 6 }}>
                    Max
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 950, lineHeight: 1 }}>{r.max}</div>
                </div>
              </div>
            ))}

            <div className="sub" style={{ marginTop: 8 }}>
              Notes: These results assume identical conductors of the selected type/size, and do not include derating,
              bundling heat effects, or mixed conductor sizes. Always verify against your governing code basis and
              manufacturer data.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}