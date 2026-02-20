// /app/layout.tsx
"use client";

import "./globals.css";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);

  return (
    <html lang="en">
      <body className="bg-[#f7f5f2] text-[#4a2412]">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-[#f7f5f2]/90 backdrop-blur border-b border-[#e6d2a8]">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl bg-[#f26422] text-white px-3 py-2 font-bold"
            >
              ☰
            </button>
            <div className="font-extrabold">
              AMP <span className="text-[#f26422]">Field Guide</span>
            </div>
            <div className="w-[44px]" />
          </div>
        </header>

        <div className="flex min-h-dvh">
          <Sidebar open={open} setOpen={setOpen} />

          <main className="flex-1 md:ml-72 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}