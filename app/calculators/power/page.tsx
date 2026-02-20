"use client";

import { useState } from "react";

export default function Power() {
  const [v, setV] = useState("");
  const [i, setI] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const V = Number(v);
    const I = Number(i);
    if (!V || !I) return setResult("Enter voltage and current.");
    setResult(`Power = ${(V * I).toFixed(2)} W`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Power Calculator</h1>

      <div className="space-y-3">
        <input className="input" placeholder="Voltage (V)" value={v} onChange={(e)=>setV(e.target.value)} />
        <input className="input" placeholder="Current (A)" value={i} onChange={(e)=>setI(e.target.value)} />
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