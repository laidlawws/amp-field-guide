import Card from "@/components/Card";

const multipliers = [
  { angle: "10°", mult: "6.0", shrink: "1/16″ per inch offset (approx)" },
  { angle: "22.5°", mult: "2.6", shrink: "3/16″ per inch offset (approx)" },
  { angle: "30°", mult: "2.0", shrink: "1/4″ per inch offset (approx)" },
  { angle: "45°", mult: "1.4", shrink: "3/8″ per inch offset (approx)" },
  { angle: "60°", mult: "1.2", shrink: "1/2″ per inch offset (approx)" },
];

export default function ConduitBending() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Conduit Bending (Field Notes)">
        <div className="space-y-3 text-sm leading-6">
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <div className="font-extrabold">Stub-up</div>
            <div className="text-[#4a2412]/80 mt-1">
              Measure to the back of the 90°, then subtract your bender’s
              take-up. (Take-up varies by bender size—check the shoe.)
            </div>
          </div>

          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4">
            <div className="font-extrabold">Offset Basics</div>
            <div className="text-[#4a2412]/80 mt-1">
              Spacing between bends = Offset height × Multiplier.
              Use shrink to adjust your overall run if needed.
            </div>
          </div>
        </div>
      </Card>

      <Card title="Offset Multipliers (Common)">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4 font-extrabold">Angle</th>
                <th className="py-2 pr-4 font-extrabold">Multiplier</th>
                <th className="py-2 pr-4 font-extrabold">Shrink (rule of thumb)</th>
              </tr>
            </thead>
            <tbody>
              {multipliers.map((m) => (
                <tr key={m.angle} className="border-t border-[#e6d2a8]">
                  <td className="py-2 pr-4 font-semibold">{m.angle}</td>
                  <td className="py-2 pr-4 font-semibold">{m.mult}</td>
                  <td className="py-2 pr-4 text-[#4a2412]/80">{m.shrink}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-[#4a2412]/70">
          Note: multipliers/shrink vary slightly by reference. Treat as field
          quick-refs and verify per your bender/company standard.
        </div>
      </Card>
    </div>
  );
}