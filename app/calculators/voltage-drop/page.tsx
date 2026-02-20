"use client";

import { useState } from "react";

export default function VoltageDrop() {
  const [i, setI] = useState("");
  const [l, setL] = useState("");
  const [r, setR] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const I = Number(i);
    const L = Number(l);
    const R = Number(r);

    if (!I || !L || !R)
      return setResult("Enter current, length, and Ω/1000ft.");

    const vd = 2 * I * L * (R / 1000);
    setResult(`Voltage Drop = ${vd.toFixed(2)} V`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Voltage Drop Calculator (Single Phase)
      </h1>

      <div className="space-y-3">
        <input className="input" placeholder="Current (A)" value={i} onChange={(e)=>setI(e.target.value)} />
        <input className="input" placeholder="Length (ft)" value={l} onChange={(e)=>setL(e.target.value)} />
        <input className="input" placeholder="Ohms per 1000ft" value={r} onChange={(e)=>setR(e.target.value)} />
        <button className="btn" onClick={calc}>Calculate</button>

        {result && (
          <div className="rounded-xl bg-[#f7f5f2] border border-[#e6d2a8] p-3 font-extrabold">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}