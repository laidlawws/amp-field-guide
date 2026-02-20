import Card from "@/components/Card";

export default function Ampacity() {
  const bullets = [
    "Use the lowest termination temperature rating (often 60°C/75°C) unless equipment is marked otherwise.",
    "Apply ambient temperature correction when above the base table temp.",
    "Apply adjustment factors when more than 3 current-carrying conductors are in a raceway/cable.",
    "For continuous loads, size conductors and OCP at 125%.",
    "Verify conductor insulation type (THHN/THWN-2/XHHW-2, etc.).",
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card title="Ampacity & Conductor Data (Quick Guidance)">
        <div className="space-y-2">
          {bullets.map((b) => (
            <div
              key={b}
              className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-4 text-sm font-semibold"
            >
              {b}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Next Upgrade">
        <div className="text-sm text-[#4a2412]/80 leading-6">
          We can add:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Cu/Al ampacity tables (60/75/90°C)</li>
            <li>Ambient correction table</li>
            <li>Conductor count adjustment table</li>
            <li>Insulation reference (THHN, XHHW-2, etc.)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}