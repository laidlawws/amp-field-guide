"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Bookmark = {
  id: string;
  label: string;
  href: string;
};

type PageOption = {
  label: string;
  href: string;
  group?: string;
};

const STORAGE_KEY = "amp_bookmarks_v1";

const PAGE_OPTIONS: PageOption[] = [
  { group: "Reference", label: "Ohm’s Law Chart", href: "/reference/ohms-chart" },
  { group: "Reference", label: "Ampacity", href: "/reference/ampacity" },
  { group: "Reference", label: "Conduit Bending", href: "/reference/conduit" },
  { group: "Reference", label: "Conduit Fill", href: "/reference/fill" },
  { group: "Reference", label: "Box Fill", href: "/reference/box-fill" },
  { group: "Reference", label: "Material Properties", href: "/reference/material-properties" },
  { group: "Reference", label: "Weights & Measures", href: "/reference/weights-measures" },
  { group: "Reference", label: "NEC Tables", href: "/reference/tables" },

  { group: "Calculators", label: "Power", href: "/calculators/power" },
  { group: "Calculators", label: "Voltage Drop", href: "/calculators/voltage-drop" },
  { group: "Calculators", label: "C / L / Reactance", href: "/calculators/reactance" },
  { group: "Calculators", label: "Resistance Network", href: "/calculators/resistance-network" },
  { group: "Calculators", label: "PF Correction", href: "/calculators/pf-correction" },
  { group: "Calculators", label: "Motor FLC", href: "/calculators/flc" },
  { group: "Calculators", label: "Transformers", href: "/calculators/transformers" },
  { group: "Calculators", label: "Conductors in Conduit", href: "/calculators/max-conductors" },
];

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: "ohms", label: "Ohm’s Law Chart", href: "/reference/ohms-chart" },
  { id: "power", label: "Power", href: "/calculators/power" },
  { id: "vd", label: "Voltage Drop", href: "/calculators/voltage-drop" },
  { id: "ampacity", label: "Ampacity", href: "/reference/ampacity" },
  { id: "conduit", label: "Conduit Bending", href: "/reference/conduit" },
  { id: "fill", label: "Conduit Fill", href: "/reference/fill" },
  { id: "boxfill", label: "Box Fill", href: "/reference/box-fill" },
  { id: "tables", label: "NEC Tables", href: "/reference/tables" },
  { id: "react", label: "C / L / Reactance", href: "/calculators/reactance" },
];

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(json: string | null): Bookmark[] | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const ok = parsed.every(
      (x) =>
        x &&
        typeof x.id === "string" &&
        typeof x.label === "string" &&
        typeof x.href === "string"
    );
    return ok ? (parsed as Bookmark[]) : null;
  } catch {
    return null;
  }
}

function optionLabelForHref(href: string) {
  return PAGE_OPTIONS.find((p) => p.href === href)?.label ?? href;
}

function categoryForHref(href: string) {
  if (href.startsWith("/calculators/")) return "Calculator";
  if (href.startsWith("/reference/")) return "Reference";
  return "Page";
}

export default function Bookmarks() {
  const [items, setItems] = useState<Bookmark[]>(DEFAULT_BOOKMARKS);
  const [editing, setEditing] = useState(false);

  const [selectedHref, setSelectedHref] = useState<string>(PAGE_OPTIONS[0]?.href ?? "/");
  const [customLabel, setCustomLabel] = useState<string>("");

  // For clean “appear” animation after hydration
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.length) setItems(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, PageOption[]>();
    for (const opt of PAGE_OPTIONS) {
      const g = opt.group ?? "Pages";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(opt);
    }
    return Array.from(groups.entries());
  }, []);

  const alreadyAdded = useMemo(() => new Set(items.map((b) => b.href)), [items]);

  function addBookmark() {
    const href = selectedHref;
    if (!href) return;
    if (alreadyAdded.has(href)) return;

    const defaultLabel = optionLabelForHref(href);
    const label = customLabel.trim() || defaultLabel;

    setItems((prev) => [{ id: uid(), label, href }, ...prev]);
    setCustomLabel("");
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((b) => b.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const [it] = copy.splice(idx, 1);
      copy.splice(j, 0, it);
      return copy;
    });
  }

  function resetDefaults() {
    setItems(DEFAULT_BOOKMARKS);
  }

  return (
    <section className="space-y-3">
      {/* local styles for animations (self-contained) */}
      <style>{`
        @keyframes ampFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ampJiggle {
          0% { transform: rotate(-0.8deg); }
          50% { transform: rotate(0.8deg); }
          100% { transform: rotate(-0.8deg); }
        }
        .amp-pill {
          animation: ampFadeUp 260ms ease-out both;
          will-change: transform, opacity;
        }
        .amp-press {
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .amp-press:active {
          transform: scale(0.98);
        }
        .amp-edit-jiggle {
          animation: ampJiggle 140ms ease-in-out infinite;
          transform-origin: 50% 50%;
        }
      `}</style>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-extrabold">Bookmarks</div>
          <div className="text-sm text-[#4a2412]/70">
            Tap to open. Edit to add/remove/reorder.
          </div>
        </div>

        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded-xl bg-[#f26422] text-white px-4 py-2 text-sm font-extrabold hover:opacity-90"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Pill list */}
      <div className="flex flex-wrap gap-2">
        {items.map((b, idx) => {
          const cat = categoryForHref(b.href);
          return (
            <div
              key={b.id}
              className={[
                "amp-pill",
                mounted ? "" : "opacity-0",
                editing ? "amp-edit-jiggle" : "",
              ].join(" ")}
              style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
            >
              <Link
                href={b.href}
                onClick={(e) => {
                  if (editing) e.preventDefault();
                }}
                className={[
                  "amp-press inline-flex items-center gap-2 rounded-full border border-[#e6d2a8] bg-white px-3 py-2",
                  "shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:bg-[#fff7f2]",
                ].join(" ")}
              >
                <span className="inline-flex items-center rounded-full bg-[#f7f5f2] px-2 py-0.5 text-[11px] font-extrabold text-[#4a2412]/80 border border-[#e6d2a8]">
                  {cat}
                </span>

                <span className="font-extrabold text-sm text-[#4a2412] whitespace-nowrap">
                  {b.label}
                </span>

                {!editing && (
                  <span className="text-[#f26422] font-extrabold">→</span>
                )}
              </Link>

              {editing && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => move(b.id, -1)}
                    className="rounded-lg border border-[#e6d2a8] bg-[#f7f5f2] px-2 py-1 text-xs font-extrabold"
                    aria-label="Move up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(b.id, 1)}
                    className="rounded-lg border border-[#e6d2a8] bg-[#f7f5f2] px-2 py-1 text-xs font-extrabold"
                    aria-label="Move down"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    className="rounded-lg border border-[#e6d2a8] bg-white px-2 py-1 text-xs font-extrabold text-[#f26422] hover:bg-[#fff7f2]"
                    aria-label="Delete"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4 space-y-3">
          <div className="text-sm font-extrabold">Add bookmark</div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <div className="text-xs font-extrabold text-[#4a2412]">Pick a page</div>
              <select
                className="input"
                value={selectedHref}
                onChange={(e) => setSelectedHref(e.target.value)}
              >
                {groupedOptions.map(([group, opts]) => (
                  <optgroup key={group} label={group}>
                    {opts.map((o) => (
                      <option key={o.href} value={o.href} disabled={alreadyAdded.has(o.href)}>
                        {alreadyAdded.has(o.href) ? `✓ ${o.label}` : o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="text-xs text-[#4a2412]/70">
                Pages already bookmarked are marked with ✓.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-[#4a2412]">Custom label (optional)</div>
              <input
                className="input"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={`Default: ${optionLabelForHref(selectedHref)}`}
              />
              <button
                onClick={addBookmark}
                disabled={!selectedHref || alreadyAdded.has(selectedHref)}
                className={`rounded-xl px-4 py-2 font-extrabold text-white transition
                  ${!selectedHref || alreadyAdded.has(selectedHref) ? "bg-[#f26422]/50 cursor-not-allowed" : "bg-[#f26422] hover:opacity-90"}`}
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetDefaults}
              className="rounded-xl border border-[#e6d2a8] bg-[#f7f5f2] px-3 py-2 text-sm font-extrabold"
            >
              Reset to defaults
            </button>

            <div className="text-xs text-[#4a2412]/70">
              Tip: On desktop you can drag cards to reorder.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}