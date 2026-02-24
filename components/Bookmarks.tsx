"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Bookmark = {
  id: string;
  label: string;
  href: string;
};

const STORAGE_KEY = "amp_bookmarks_v1";

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
    // minimal validation
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

export default function Bookmarks() {
  const [items, setItems] = useState<Bookmark[]>(DEFAULT_BOOKMARKS);
  const [editing, setEditing] = useState(false);

  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");

  // Load from localStorage on first client render
  useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.length) setItems(saved);
  }, []);

  // Persist any changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const normalizedHref = useMemo(() => {
    const h = href.trim();
    if (!h) return "";
    // Allow internal routes like /calculators/power
    if (h.startsWith("/")) return h;
    // Allow https://… links too
    if (h.startsWith("http://") || h.startsWith("https://")) return h;
    // Default to internal if user types "reference/tables"
    return `/${h}`;
  }, [href]);

  function addBookmark() {
    const l = label.trim();
    const h = normalizedHref;
    if (!l || !h) return;

    setItems((prev) => [{ id: uid(), label: l, href: h }, ...prev]);
    setLabel("");
    setHref("");
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

  // Drag & drop (desktop)
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    setItems((prev) => {
      const from = prev.findIndex((b) => b.id === draggedId);
      const to = prev.findIndex((b) => b.id === targetId);
      if (from < 0 || to < 0) return prev;

      const copy = [...prev];
      const [it] = copy.splice(from, 1);
      copy.splice(to, 0, it);
      return copy;
    });
  }

  function resetDefaults() {
    setItems(DEFAULT_BOOKMARKS);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
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

      {/* Bookmark grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((b) => (
          <div
            key={b.id}
            draggable={editing}
            onDragStart={(e) => onDragStart(e, b.id)}
            onDragOver={(e) => editing && e.preventDefault()}
            onDrop={(e) => editing && onDrop(e, b.id)}
            className={`rounded-2xl border border-[#e6d2a8] bg-white p-3 transition ${
              editing ? "ring-1 ring-[#f26422]/30" : ""
            }`}
          >
            <Link
              href={b.href}
              className="block font-extrabold text-[#4a2412] hover:underline"
              onClick={(e) => {
                if (editing) e.preventDefault();
              }}
            >
              {b.label}
            </Link>
            <div className="mt-1 text-xs text-[#4a2412]/60 break-all">
              {b.href}
            </div>

            {editing && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-2">
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
                </div>

                <button
                  onClick={() => remove(b.id)}
                  className="rounded-lg border border-[#e6d2a8] bg-white px-2 py-1 text-xs font-extrabold text-[#f26422]"
                  aria-label="Delete"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4 space-y-3">
          <div className="text-sm font-extrabold">Add bookmark</div>

          <div className="grid sm:grid-cols-3 gap-3">
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Motor FLA)"
            />
            <input
              className="input"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="Route or URL (e.g. /reference/tables)"
            />
            <button
              onClick={addBookmark}
              className="rounded-xl bg-[#f26422] text-white px-4 py-2 font-extrabold hover:opacity-90"
            >
              Add
            </button>
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