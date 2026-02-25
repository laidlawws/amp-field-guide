"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type Unit = "Ω" | "kΩ" | "MΩ";
type NodeType = "resistor" | "series" | "parallel";

type ResistorNode = {
  id: string;
  type: "resistor";
  label: string;
  value: string; // numeric input as string
  unit: Unit;
};

type GroupNode = {
  id: string;
  type: "series" | "parallel";
  label: string;
  children: Node[];
};

type Node = ResistorNode | GroupNode;

const UNIT_MULT: Record<Unit, number> = { "Ω": 1, "kΩ": 1_000, "MΩ": 1_000_000 };

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function n(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}

function fmtOhms(ohms: number) {
  if (!Number.isFinite(ohms)) return "—";
  const a = Math.abs(ohms);
  if (a >= 1_000_000) return `${(ohms / 1_000_000).toFixed(4)} MΩ`;
  if (a >= 1_000) return `${(ohms / 1_000).toFixed(4)} kΩ`;
  return `${ohms.toFixed(4)} Ω`;
}

function safeSum(arr: number[]) {
  let s = 0;
  for (const x of arr) if (Number.isFinite(x)) s += x;
  return s;
}

function eqResistance(node: Node): { ok: boolean; R: number; msg?: string } {
  if (node.type === "resistor") {
    const v = n(node.value);
    if (!Number.isFinite(v) || v <= 0) return { ok: false, R: NaN, msg: `Resistor "${node.label}" must be > 0.` };
    return { ok: true, R: v * UNIT_MULT[node.unit] };
  }

  // group
  if (node.children.length === 0) return { ok: false, R: NaN, msg: `"${node.label}" has no elements.` };

  const childRes: number[] = [];
  for (const c of node.children) {
    const r = eqResistance(c);
    if (!r.ok) return r;
    childRes.push(r.R);
  }

  if (node.type === "series") {
    return { ok: true, R: safeSum(childRes) };
  }

  // parallel
  let inv = 0;
  for (const R of childRes) {
    if (R <= 0) return { ok: false, R: NaN, msg: "Parallel branch has invalid resistance." };
    inv += 1 / R;
  }
  if (inv === 0) return { ok: false, R: NaN, msg: "Parallel equivalent is undefined." };
  return { ok: true, R: 1 / inv };
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function findNode(root: Node, id: string): Node | null {
  if (root.id === id) return root;
  if (root.type === "resistor") return null;
  for (const c of root.children) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return null;
}

function updateNode(root: Node, id: string, updater: (n: Node) => void): Node {
  const r = clone(root);
  const target = findNode(r, id);
  if (target) updater(target);
  return r;
}

function deleteNode(root: Node, id: string): Node {
  if (root.id === id) return root; // don’t delete root
  if (root.type === "resistor") return root;

  const r = clone(root);
  const walk = (g: GroupNode) => {
    g.children = g.children.filter((c) => c.id !== id);
    for (const c of g.children) {
      if (c.type !== "resistor") walk(c);
    }
  };
  walk(r as GroupNode);
  return r;
}

function addChild(root: Node, parentId: string, child: Node): Node {
  const r = clone(root);
  const parent = findNode(r, parentId);
  if (parent && parent.type !== "resistor") parent.children.push(child);
  return r;
}

function diagram(node: Node, depth = 0): string[] {
  const pad = "  ".repeat(depth);
  if (node.type === "resistor") return [`${pad}└─ R(${node.label})`];
  const header = `${pad}└─ ${node.type === "series" ? "SERIES" : "PARALLEL"}: ${node.label}`;
  const lines = [header];
  for (const c of node.children) lines.push(...diagram(c, depth + 1));
  return lines;
}

function nodeBadge(type: NodeType) {
  if (type === "resistor") return "R";
  if (type === "series") return "Σ";
  return "∥";
}

export default function ResistanceNetwork() {
  const [root, setRoot] = useState<Node>({
    id: "root",
    type: "series",
    label: "Total",
    children: [
      { id: uid(), type: "resistor", label: "R1", value: "10", unit: "Ω" },
      {
        id: uid(),
        type: "parallel",
        label: "Branch A",
        children: [
          { id: uid(), type: "resistor", label: "R2", value: "20", unit: "Ω" },
          { id: uid(), type: "resistor", label: "R3", value: "30", unit: "Ω" },
        ],
      },
    ],
  });

  const [selectedId, setSelectedId] = useState<string>("root");

  const selected = useMemo(() => findNode(root, selectedId) ?? root, [root, selectedId]);

  const eq = useMemo(() => eqResistance(root), [root]);

  const diag = useMemo(() => diagram(root).join("\n"), [root]);

  function addRes(parentId: string) {
    setRoot((prev) =>
      addChild(prev, parentId, { id: uid(), type: "resistor", label: `R${Math.floor(Math.random() * 90 + 10)}`, value: "", unit: "Ω" })
    );
  }

  function addGroup(parentId: string, type: "series" | "parallel") {
    setRoot((prev) =>
      addChild(prev, parentId, { id: uid(), type, label: type === "series" ? "Series group" : "Parallel group", children: [] })
    );
  }

  function remove(id: string) {
    setRoot((prev) => deleteNode(prev, id));
    if (selectedId === id) setSelectedId("root");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Resistance Network (Series + Parallel)">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Builder */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-[#4a2412]">Build your circuit</div>
                  <div className="text-xs text-[#4a2412]/70">
                    Add resistors and series/parallel groups. Nest groups to represent branches.
                  </div>
                </div>

                <div className="rounded-xl border border-[#e6d2a8] bg-[#f7f5f2] px-3 py-2">
                  <div className="text-xs text-[#4a2412]/70">Total R</div>
                  <div className="font-extrabold text-[#f26422]">{eq.ok ? fmtOhms(eq.R) : "—"}</div>
                </div>
              </div>
            </div>

            {/* Tree editor */}
            <NodeEditor
              node={root}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={(id, patch) => setRoot((prev) => updateNode(prev, id, patch))}
              onAddRes={addRes}
              onAddSeries={(id) => addGroup(id, "series")}
              onAddParallel={(id) => addGroup(id, "parallel")}
              onDelete={remove}
              isRoot
            />

            {!eq.ok && (
              <div className="rounded-2xl border border-[#e6d2a8] bg-[#fff7f2] p-4 text-sm text-[#4a2412]/80">
                <b>Fix:</b> {eq.msg}
              </div>
            )}
          </div>

          {/* RIGHT: Diagram + Selected details */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-[#4a2412]">Diagram (live)</div>
                  <div className="text-xs text-[#4a2412]/70">Not a full schematic — but shows your series/parallel structure.</div>
                </div>
                <div className="text-xs font-extrabold text-[#4a2412]/70 rounded-xl border border-[#e6d2a8] bg-[#f7f5f2] px-3 py-2">
                  Selected: {nodeBadge(selected.type)} {selected.label}
                </div>
              </div>

              <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-4 text-xs text-[#4a2412]/80 leading-5">
                {diag}
              </pre>
            </div>

            <div className="rounded-2xl border border-[#e6d2a8] bg-white p-5">
              <div className="text-sm font-extrabold text-[#4a2412]">How to model mixed circuits</div>
              <div className="mt-2 text-sm text-[#4a2412]/75 leading-6">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    A <b>Series</b> group means “these are end-to-end” (R adds).
                  </li>
                  <li>
                    A <b>Parallel</b> group means “branches split and rejoin” (1/R adds).
                  </li>
                  <li>
                    To model “resistor in series with a parallel branch”, put a resistor and a parallel group inside the same series group.
                  </li>
                  <li>
                    Nest groups to represent deeper branch structures.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Tree editor component */
function NodeEditor(props: {
  node: Node;
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: (n: Node) => void) => void;
  onAddRes: (parentId: string) => void;
  onAddSeries: (parentId: string) => void;
  onAddParallel: (parentId: string) => void;
  onDelete: (id: string) => void;
  isRoot?: boolean;
}) {
  const { node, selectedId, onSelect, onChange, onAddRes, onAddSeries, onAddParallel, onDelete, isRoot } = props;

  const active = node.id === selectedId;

  return (
    <div className={`rounded-2xl border ${active ? "border-[#f26422]" : "border-[#e6d2a8]"} bg-white p-4`}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="text-left flex-1"
        >
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-xl grid place-items-center border ${active ? "border-[#f26422] bg-[#fff7f2]" : "border-[#e6d2a8] bg-[#f7f5f2]"}`}>
              <span className="font-extrabold text-[#4a2412]">{nodeBadge(node.type)}</span>
            </div>
            <div>
              <div className="font-extrabold text-[#4a2412]">{node.label}</div>
              <div className="text-xs text-[#4a2412]/70">
                {node.type === "resistor" ? "Resistor" : node.type === "series" ? "Series group" : "Parallel group"}
              </div>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {node.type !== "resistor" && (
            <>
              <button
                type="button"
                onClick={() => onAddRes(node.id)}
                className="rounded-xl border border-[#e6d2a8] bg-[#f7f5f2] px-3 py-2 text-xs font-extrabold hover:opacity-90"
              >
                + Resistor
              </button>
              <button
                type="button"
                onClick={() => onAddSeries(node.id)}
                className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-xs font-extrabold hover:bg-[#f7f5f2]"
              >
                + Series
              </button>
              <button
                type="button"
                onClick={() => onAddParallel(node.id)}
                className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-xs font-extrabold hover:bg-[#f7f5f2]"
              >
                + Parallel
              </button>
            </>
          )}

          {!isRoot && (
            <button
              type="button"
              onClick={() => onDelete(node.id)}
              className="rounded-xl border border-[#e6d2a8] bg-white px-3 py-2 text-xs font-extrabold text-[#f26422] hover:bg-[#fff7f2]"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-[#4a2412]">Label</div>
          <input
            className="input"
            value={node.label}
            onChange={(e) => onChange(node.id, (n) => (n.label = e.target.value))}
            placeholder={node.type === "resistor" ? "R1" : "Group"}
          />
        </div>

        {node.type === "resistor" ? (
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-[#4a2412]">Resistance</div>
            <div className="flex gap-2">
              <input
                className="input"
                inputMode="decimal"
                value={node.value}
                onChange={(e) => onChange(node.id, (n) => ((n as ResistorNode).value = e.target.value))}
                placeholder="e.g. 10"
              />
              <select
                className="input w-28"
                value={node.unit}
                onChange={(e) => onChange(node.id, (n) => ((n as ResistorNode).unit = e.target.value as Unit))}
              >
                <option value="Ω">Ω</option>
                <option value="kΩ">kΩ</option>
                <option value="MΩ">MΩ</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e6d2a8] bg-[#f7f5f2] p-3">
            <div className="text-xs font-extrabold text-[#4a2412]">Rule</div>
            <div className="mt-1 text-xs text-[#4a2412]/70 leading-5">
              {node.type === "series"
                ? "Series: R_total = R1 + R2 + …"
                : "Parallel: 1/R_total = 1/R1 + 1/R2 + …"}
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {node.type !== "resistor" && node.children.length > 0 && (
        <div className="mt-4 space-y-3 border-l border-[#e6d2a8] pl-3">
          {node.children.map((c) => (
            <NodeEditor
              key={c.id}
              node={c}
              selectedId={selectedId}
              onSelect={onSelect}
              onChange={onChange}
              onAddRes={onAddRes}
              onAddSeries={onAddSeries}
              onAddParallel={onAddParallel}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {node.type !== "resistor" && node.children.length === 0 && (
        <div className="mt-4 text-xs text-[#4a2412]/70">
          No items yet. Add a resistor or a nested group.
        </div>
      )}
    </div>
  );
}