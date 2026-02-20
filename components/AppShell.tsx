"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-96px)]">
      {/* Mobile top bar (menu button only) */}
      <div className="md:hidden fixed top-[96px] left-0 right-0 z-40 bg-[#f7f5f2]/90 backdrop-blur border-b border-[#e6d2a8]">
        <div className="px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-[#f26422] text-white px-3 py-2 font-extrabold"
          >
            ☰ Menu
          </button>
        </div>
      </div>

      {/* Sidebar (desktop + mobile slide-out handled inside Sidebar component) */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Content */}
      <main className="flex-1 md:ml-72 p-4 sm:p-6 pt-20 md:pt-6">
        {children}
      </main>
    </div>
  );
}