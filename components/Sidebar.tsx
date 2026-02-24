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
  { href: "/calculators/power", label: "Power" },
  { href: "/calculators/voltage-drop", label: "Voltage Drop" },
  { href: "/calculators/reactance", label: "C / L / Reactance" },
  { href: "/reference/ampacity", label: "Ampacity" },
  { href: "/calculators/pf-correction", label: "PF Correction" },
  { href: "/calculators/flc", label: "Motor FLC" },
  { href: "/reference/conduit", label: "Conduit Bending" },
  { href: "/reference/fill", label: "Conduit Fill" },
  { href: "/reference/box-fill", label: "Box Fill" },
  { href: "/reference/tables", label: "NEC Tables" },
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
        className={`fixed z-50 md:z-auto md:static top-0 left-0 h-dvh w-72 bg-white 
        border-r border-[#e6d2a8] p-5 transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header SVG */}
        <div className="flex justify-center pb-5 mb-6 border-b border-[#e6d2a8]">
          <Link href="/" onClick={() => setOpen(false)} className="w-[180px]">
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

        {/* Navigation */}
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150
                  ${
                    active
                      ? "bg-[#f26422] text-white shadow-sm"
                      : "text-[#4a2412] hover:bg-[#f7f5f2] hover:translate-x-[2px]"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Tip Section */}
        <div className="mt-8 text-xs text-[#4a2412]/70 border-t border-[#e6d2a8] pt-4">
          <div className="font-semibold mb-1">Tip:</div>
          <div>Use the search on Home to quickly find formulas.</div>
        </div>
      </aside>
    </>
  );
}