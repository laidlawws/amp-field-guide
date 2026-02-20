"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MOBILE HEADER (only on mobile) */}
      <header className="md:hidden sticky top-0 z-50 border-b border-[#e6d2a8] bg-white shadow-sm">
        <div className="flex items-center px-4 py-3">
          {/* Left: Menu button */}
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-[#f26422] text-white px-4 py-2 font-extrabold"
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="block w-[220px]" aria-label="Go home">
              <Image
                src="/amp-header.svg"
                alt="AMP Field Reference Guide"
                width={220}
                height={50}
                priority
                className="w-full h-auto"
              />
            </Link>
          </div>

          {/* Right spacer to keep logo perfectly centered */}
          <div className="w-[52px]" />
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex min-h-screen">
        {/* Sidebar handles mobile slide-out + desktop static */}
        <Sidebar open={open} setOpen={setOpen} />

        {/* Content */}
        <main className="flex-1 md:ml-72 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </>
  );
}