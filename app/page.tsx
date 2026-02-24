"use client";

import Bookmarks from "@/components/Bookmarks";
import { useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import { SEARCH_INDEX } from "@/data/searchIndex";

export default function Home() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return SEARCH_INDEX
      .filter((x) => {
        const hay = `${x.title} ${x.summary} ${(x.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(t);
      })
      .slice(0, 20);
  }, [q]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Bookmarks />
      <Card title="Search">
        <input
          className="input"
          placeholder="Search calculators, tables, notes… (ex: 310, box fill, conduit, VD)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {q.trim() && (
          <div className="mt-3 space-y-2">
            {results.length === 0 ? (
              <div className="text-sm text-[#4a2412]/70">No matches.</div>
            ) : (
              results.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="block rounded-xl border border-[#e6d2a8] bg-[#f7f5f2] px-3 py-3 hover:opacity-90"
                >
                  <div className="font-extrabold">{r.title}</div>
                  <div className="text-sm text-[#4a2412]/75">{r.summary}</div>
                </Link>
              ))
            )}
          </div>
        )}
      </Card>

      {/* quick tiles (optional) – keep your existing tiles if you already like them */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SEARCH_INDEX.slice(0, 6).map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group bg-white rounded-2xl shadow-sm border border-[#e6d2a8] p-5 hover:-translate-y-0.5 transition"
          >
            <div className="text-lg font-extrabold">{t.title}</div>
            <div className="text-sm text-[#4a2412]/75 mt-1">{t.summary}</div>
            <div className="text-sm font-bold text-[#f26422] mt-3">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}