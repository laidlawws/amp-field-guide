"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const mainRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Always jump to the top of the scroll container on navigation / refresh
  useEffect(() => {
    // two frames helps with mobile Safari + layout shift after navigation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    });
  }, [pathname]);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* MOBILE HEADER (fixed so it never disappears on mobile) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-[rgb(var(--border))] bg-white shadow-sm">
        <div className="flex items-center px-4 py-3">
          {/* Left: Menu button */}
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-[rgb(var(--brand))] text-white px-4 py-2 font-extrabold"
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

          {/* Right spacer to keep logo centered */}
          <div className="w-[52px]" />
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={open} setOpen={setOpen} />

        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:ml-72 pt-20 md:pt-6"
          style={{
            paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
          }}
        >
          {children}

          {/* Mobile-only bottom spacer to prevent last content being clipped */}
          <div className="h-24 md:hidden" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
}