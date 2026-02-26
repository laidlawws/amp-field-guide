"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-white shadow-sm">
        <div className="flex items-center px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-[rgb(var(--brand))] text-white px-4 py-2 font-extrabold"
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Logo */}
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

          <div className="w-[52px]" />
        </div>
      </header>

      {/* DESKTOP + MOBILE BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar open={open} setOpen={setOpen} />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:ml-72">
          {children}
        </main>
      </div>
    </div>
  );
}