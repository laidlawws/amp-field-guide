"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/reference/ohms-chart", label: "Ohm’s Law Chart" },
  { href: "/calculators/resistance-network", label: "Resistance Network" },
  { href: "/calculators/power", label: "Power" },
  { href: "/calculators/voltage-drop", label: "Voltage Drop" },
  { href: "/calculators/reactance", label: "C / L / Reactance" },
  { href: "/reference/ampacity", label: "Ampacity" },
  { href: "/calculators/pf-correction", label: "PF Correction" },
  { href: "/calculators/flc", label: "Motor FLC" },
  { href: "/calculators/transformers", label: "Transformers" },
  { href: "/reference/conduit", label: "Conduit Bending" },
  { href: "/reference/fill", label: "Conduit Fill" },
  { href: "/reference/box-fill", label: "Box Fill" },
  { href: "/calculators/max-conductors", label: "Conductors in Conduit" },
  { href: "/reference/material-properties", label: "Material Properties" },
  { href: "/reference/weights-measures", label: "Weights & Measures" },
];

export default function Sidebar({ open, setOpen }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <button
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/30 z-40 md:hidden ${
          open ? "block" : "hidden"
        }`}
      />

      <aside
        className={`
          fixed z-50 md:z-auto md:static top-0 left-0
          w-72 bg-white border-r border-[rgb(var(--border))]
          transition-transform md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          height: "100dvh", // correct mobile viewport height (better than 100vh on iOS)
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {/* Sticky header inside sidebar (mobile + desktop safe) */}
        <div className="sticky top-0 z-10 bg-white p-5 pb-4 border-b border-[rgb(var(--border))]">
          <div className="flex justify-center">
            <Link href="/" onClick={() => setOpen(false)} className="w-[180px]" aria-label="Go home">
              <Image
                src="/amp-header.svg"
                alt="AMP Field Reference Guide"
                width={180}
                height={40}
                className="w-full h-auto"
                priority
              />
            </Link>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-5 pt-4">
          {/* Navigation */}
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150
                    ${
                      active
                        ? "bg-[rgb(var(--brand))] text-white shadow-sm"
                        : "text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted-bg))] hover:translate-x-[2px]"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Tip Section */}
          <div className="mt-8 text-xs text-[rgb(var(--fg-muted))] border-t border-[rgb(var(--border))] pt-4">
            <div className="font-semibold mb-1 text-[rgb(var(--fg))]">Tip:</div>
            <div>Use the search on Home to quickly find formulas.</div>
          </div>
        </div>
      </aside>
    </>
  );
}