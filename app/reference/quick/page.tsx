import Card from "@/components/Card";

export default function QuickReference() {
  const items = [
    { k: "Ohm’s Law", v: "V = I × R" },
    { k: "Power", v: "P = V × I" },
    { k: "3φ Power", v: "P = 1.732 × V × I × PF" },
    { k: "Single-phase VD", v: "VD = 2 × I × L × (Ω/1000)" },
    { k: "3-phase VD", v: "VD ≈ 1.732 × I × L × (Ω/1000)" },
    { k: "Conduit Fill", v: "Max 40% for 3+ conductors (general rule)" },
    { k: "Continuous Load", v: "Size conductors/OCP at 125%" },
    { k: "Motors", v: "Use code FLA tables for sizing (not nameplate) when applicable" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <Card title="Quick Reference">
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((x) => (
            <div
              key={x.k}
              className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4"
            >
              <div className="font-extrabold">{x.k}</div>
              <div className="text-sm font-semibold text-[#4a2412]/80 mt-1">
                {x.v}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}