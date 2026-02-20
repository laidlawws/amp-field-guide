"use client";

import { useState } from "react";

export default function Ohms() {
  const [v, setV] = useState("");
  const [i, setI] = useState("");
  const [r, setR] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const V = Number(v);
    const I = Number(i);
    const R = Number(r);

    let outV = V, outI = I, outR = R;

    if (!V && I && R) outV = I * R;
    if (!I && V && R) outI = V / R;
    if (!R && V && I) outR = V / I;

    setResult(`V=${outV.toFixed(2)}  I=${outI.toFixed(2)}  R=${outR.toFixed(2)}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ohm’s Law Calculator</h1>

      <div className="space-y-3">
        <input className="input" placeholder="Voltage (V)" value={v} onChange={(e)=>setV(e.target.value)} />
        <input className="input" placeholder="Current (A)" value={i} onChange={(e)=>setI(e.target.value)} />
        <input className="input" placeholder="Resistance (Ω)" value={r} onChange={(e)=>setR(e.target.value)} />
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